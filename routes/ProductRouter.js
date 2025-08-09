const express = require("express");
const ProductModel = require("../models/ProductModel");
const AuthMiddleware = require("../middlewares/AuthMiddleware");
const ProductRouter = express.Router();

const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const redis = require("../config/RedisConfig");
const upload = multer({ storage });

//* Main API end point "wareHouse"
ProductRouter.get(
  "/getProduct/:productId",
  AuthMiddleware(["admin", "seller"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }
      const cached = await redis.get(`product:${productId}`);

      if (cached) {
        return res.status(200).json({
          msg: "products fetched from cached data",
          product: JSON.parse(cached),
        });
      }
      if (
        req.role !== "admin" &&
        product.productOwner.toString() !== req.userId
      ) {
        return res.status(403).json({ msg: "Access denied" });
      }

      await redis.set(
        `product:${productId}`,
        JSON.stringify(product),
        "EX",
        60
      );

      res
        .status(200)
        .json({ mag: "Products fetched from DB", product: product });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({
        msg: "Something went wrong while fetching product",
        error: error.message,
      });
    }
  }
);

//? Get products
ProductRouter.get(
  "/products",
  AuthMiddleware(["user", "admin", "seller"]),
  async (req, res) => {
    try {
      const { category, minPrice, maxPrice, name, sortOrder } = req.query;

      // Validate and normalize query parameters
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === "desc" ? -1 : 1;

      const isCustomSort = sortOrder && sortOrder !== "asc";
      const hasFilters =
        category || minPrice || maxPrice || name || isCustomSort;

      // Log user info for debugging
      console.log("Role:", req.role, "User ID:", req.userId);

      // Redis cache logic
      let cachedKey;
      if (!hasFilters) {
        cachedKey =
          req.role === "seller"
            ? `products:seller:${req.userId}`
            : `products:all`;

        try {
          const cached = await redis.get(cachedKey);
          if (cached) {
            return res.status(200).json({
              msg: "Product data fetched from cache",
              productData: JSON.parse(cached),
            });
          }
        } catch (redisError) {
          console.error("Redis GET error:", redisError.message);
        }
      }

      // Build MongoDB query
      const filtered = {};

      if (req.role === "seller") {
        filtered.productOwner = req.userId;
      }

      if (category) {
        filtered.category = category;
      }

      const min = Number(minPrice);
      const max = Number(maxPrice);
      if (!isNaN(min) || !isNaN(max)) {
        filtered.productPrice = {};
        if (!isNaN(min)) filtered.productPrice.$gte = min;
        if (!isNaN(max)) filtered.productPrice.$lte = max;
      }

      if (name) {
        filtered.productName = { $regex: name, $options: "i" };
      }

      // Fetch from MongoDB
      const productData = await ProductModel.find(filtered)
        .sort({ productPrice: sortDirection })
        .skip(skip)
        .limit(limit);

      // Cache result if no filters
      if (!hasFilters && cachedKey) {
        try {
          await redis.set(cachedKey, JSON.stringify(productData), "EX", 300);
        } catch (redisError) {
          console.error("Redis SET error:", redisError.message);
        }
      }

      res.status(200).json({
        msg: "Products data fetched successfully from DB",
        productData,
      });
    } catch (error) {
      console.error("Product fetch error:", error.message);
      res.status(500).json({
        msg: "Something went wrong while fetching products",
        error: error.message,
      });
    }
  }
);

const clearProductCache = async () => {
  try {
    await redis.del("products:all");
    const sellerKeys = await redis.keys("products:seller:*");
    if (sellerKeys.length > 0) {
      await redis.del(...sellerKeys);
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

//? Add product
ProductRouter.post(
  "/addProduct",
  AuthMiddleware(["admin", "seller"]),
  upload.single("productImage"),
  async (req, res) => {
    try {
      const {
        productName,
        productPrice,
        productCompany,
        AvailableOptions,
        category,
        stock,
      } = req.body;

      // Validation
      if (!productName || !productPrice) {
        return res.status(400).json({
          msg: "Product name and price are required",
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          msg: "Product image is required",
        });
      }

      const optionsArray = Array.isArray(AvailableOptions)
        ? AvailableOptions
        : AvailableOptions.split(",").map((opt) => opt.trim());

      const product = new ProductModel({
        productName,
        productImage: req.file.path,
        productPrice: Number(productPrice),
        category: category || "Uncategorized",
        stock: Number(stock) || 0,
        productCompany,
        AvailableOptions: optionsArray,
        productOwner: req.userId,
      });

      await product.save();

      // Remove cached data
      // await redis.del("cachedKey");

      console.log("Product added successfully by user:", req.userId);

      await redis.del("productList");
      await clearProductCache();

      res.status(201).json({
        msg: "Product added successfully",
        product: product,
      });
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({
        msg: "Something went wrong while adding product",
        error: error.message,
      });
    }
  }
);

//? Edit product
ProductRouter.put(
  "/editProduct/:productId",
  AuthMiddleware(["admin", "seller"]),
  upload.single("productImage"),
  async (req, res) => {
    try {
      const newData = req.body;
      const productId = req.params.productId;
      const productAvailability = await ProductModel.findById(productId);

      if (!productAvailability) {
        return res.status(404).json({ msg: "Product does not available" });
      }

      if (req.file) {
        newData.productImage = req.file.path;
      }

      if (
        req.role === "admin" ||
        req.userId == productAvailability.productOwner.toString()
      ) {
        const updatedInfo = await ProductModel.findByIdAndUpdate(
          productId,
          newData,
          { new: true }
        );
        //Remove cached data
        await redis.del("productList");
        await clearProductCache();

        res
          .status(200)
          .json({ msg: "Products edited successfully", data: updatedInfo });
      } else {
        res.status(403).json({ msg: "Access denied" });
      }
    } catch (error) {
      res.status(500).json({
        msg: "Something went wrong while editing product",
        error: error,
      });
    }
  }
);

//? Delete products
ProductRouter.delete(
  "/deleteProduct/:productId",
  AuthMiddleware(["admin", "seller"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const productAvailability = await ProductModel.findById(productId);

      if (!productAvailability) {
        return res.status(404).json({ msg: "Product does not available" });
      }

      if (
        req.role === "admin" ||
        req.userId == productAvailability.productOwner
      ) {
        await ProductModel.findByIdAndDelete(productId);
        //Remove cached data
        await redis.del("productList");
        await clearProductCache();

        res.status(200).json({ msg: "Products deleted successfully" });
      } else {
        res.status(403).json({ msg: "Access denied" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while deleting product" });
    }
  }
);

//? Open the product detail
ProductRouter.get("/productDetails/:productId", async (req, res) => {
  try {
    const cached = await redis.get("productDetails");

    if (cached) {
      return res.status(200).json({
        msg: "product details from cached",
        product: JSON.parse(cached),
      });
    }

    const productId = req.params.productId;
    const product = await ProductModel.findById(productId)
      .populate({
        path: "review.ratedBy",
        select: "name email profilePhoto",
      })
      .populate({
        path: "productOwner",
        select: "name email",
      });

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    await redis.set("productDetails", JSON.stringify(product), "EX", 60);
    res
      .status(200)
      .json({ msg: "Product data fetched success", product: product });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Something went wrong while fetching product data" });
  }
});

module.exports = ProductRouter;
