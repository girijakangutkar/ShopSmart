const express = require("express");
const ProductModel = require("../models/ProductModel");
const AuthMiddleware = require("../middlewares/authMiddleware");
const ProductRouter = express.Router();

const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const redis = require("../config/RedisConfig");
const upload = multer({ storage });

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
      if (
        req.role !== "admin" &&
        product.productOwner.toString() !== req.userId
      ) {
        return res.status(403).json({ msg: "Access denied" });
      }

      res.status(200).json({ product });
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
      //!check if redis has cached data
      // const cachedKey = `products:${JSON.stringify(req.query)}`;
      // const cached = await redis.get("cachedKey");
      // if (cached) {
      //   return res.status(200).json({
      //     msg: "Products data fetched successfully from cached",
      //     productData: JSON.parse(cached),
      //   });
      // }

      //! Sorting is here
      const { category, minPrice, maxPrice, name } = req.query;
      const filtered = {};

      //! Seller product CRUD feature
      if (req.role == "seller") {
        filtered.productOwner = req.userId;
      }

      if (category) {
        // await redis.del("cachedKey");
        filtered.category = category;
      }

      if (!isNaN(Number(minPrice)) || !isNaN(Number(maxPrice))) {
        filtered.productPrice = {};
        if (!isNaN(Number(minPrice))) {
          // await redis.del("cachedKey");
          filtered.productPrice.$gte = Number(minPrice);
        }
        if (!isNaN(Number(maxPrice))) {
          // await redis.del("cachedKey");
          filtered.productPrice.$lte = Number(maxPrice);
        }
      }

      if (name) {
        // await redis.del("cachedKey");
        filtered.productName = { $regex: name, $options: "i" };
      }

      const sortBy = "productPrice";
      const sortOrderRaw = req.query.sortOrder?.toLowerCase();
      const sortOrder = sortOrderRaw === "desc" ? -1 : 1;

      //! Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const productData = await ProductModel.find(filtered)
        .sort({
          [sortBy]: sortOrder,
        })
        .skip(skip)
        .limit(limit);

      //! cache data
      // await redis.set("cachedKey", JSON.stringify(productData), "EX", 60);
      res.status(200).json({
        msg: "Products data fetched successfully from DB",
        productData: productData,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Something went wrong while fetching products",
        error: error,
      });
    }
  }
);

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
        // await redis.del("cachedKey");
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
        // await redis.del("cachedKey");
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
