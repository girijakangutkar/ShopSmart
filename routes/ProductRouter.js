const express = require("express");
const ProductModel = require("../models/ProductModel");
const AuthMiddleware = require("../middlewares/authMiddleware");
const ProductRouter = express.Router();

const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const redis = require("../config/RedisConfig");
const upload = multer({ storage });

//? Get products
ProductRouter.get(
  "/products",
  AuthMiddleware(["user", "admin", "seller"]),
  async (req, res) => {
    try {
      //check if redis has cached data
      const cached = await redis.get("products");
      if (cached) {
        return res.status(200).json({
          msg: "Products data fetched successfully from cached",
          productData: JSON.parse(cached),
        });
      }
      const productData = await ProductModel.find();

      // cache data
      await redis.set("products", JSON.stringify(productData), "EX", 60);
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
      const { productName, ProductPrice, productCompany, AvailableColors } =
        req.body;
      const product = new ProductModel({
        productName,
        productImage: req.file.path,
        ProductPrice,
        productCompany,
        AvailableColors,
        productOwner: req.userId,
      });
      //Content-Type: multipart/form-data
      await product.save();
      //Remove cached data
      await redis.del("products");
      res
        .status(201)
        .json({ msg: "Product added successfully", product: product });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while adding products" });
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
        await redis.del("products");
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
        await redis.del("products");
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

module.exports = ProductRouter;
