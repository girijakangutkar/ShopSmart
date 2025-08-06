const express = require("express");
const UserModel = require("../models/UserModel");
const AuthMiddleware = require("../middlewares/authMiddleware");
const UserRouter = express.Router();

const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const ProductModel = require("../models/ProductModel");
const upload = multer({ storage });

//? Get orderHistory
UserRouter.get(
  "/orderHistory",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      if (req.role == "user" || req.role == "admin") {
        const user = await UserModel.findById(req.userId);
        const orders = user.orderHistory;
        res.status(200).json({
          msg: "Order history fetch success",
          orderHistory: orders,
        });
      } else {
        return res
          .status(403)
          .json({ msg: "Seller account is not for ordering" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while fetching orderHistory" });
    }
  }
);

//? order product
UserRouter.put(
  "/orderThis/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ msg: "Product does not exists" });
      }

      const { quantity } = req.body;

      const orderProduct = {
        product: product._id,
        quantity: quantity,
        purchasedAt: new Date(),
      };

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.userId,
        { $push: { orderHistory: orderProduct } },
        { new: true }
      );
      res
        .status(200)
        .json({ msg: "Order success", orderData: updatedUser.orderHistory });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while ordering a productS" });
    }
  }
);

//? Profile Edit
UserRouter.patch(
  "/updateProfile/:userId",
  AuthMiddleware(["user", "admin", "seller"]),
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const newData = req.body;
      const userId = req.params.userId;
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "User does not exists" });
      }
      const pic = req.file?.path || user.profilePhoto || "";

      await UserModel.findByIdAndUpdate(
        userId,
        { ...newData, pic },
        { new: true }
      );
      // Content-Type: multipart/form-data
      res.status(200).json({ msg: "User updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while editing user profile" });
    }
  }
);

//? Add to cart
UserRouter.put(
  "/addToCart/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ msg: "Product does not exists" });
      }

      const cartProduct = {
        product: product._id,
      };

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.userId,
        { $push: { cart: cartProduct } },
        { new: true }
      );
      res
        .status(200)
        .json({ msg: "Order success", cartData: updatedUser.cart });
    } catch (error) {
      res.status(500).json({
        msg: "Something went wrong while adding product to the cart",
        error: error.message,
      });
    }
  }
);

//? Show cart
UserRouter.get("/cart", AuthMiddleware(["user", "admin"]), async (req, res) => {
  try {
    if (req.role == "user" || req.role == "admin") {
      const user = await UserModel.findById(req.userId);
      const cartData = user.cart;
      res.status(200).json({
        msg: "fetched cart successfully",
        cart: cartData,
      });
    } else {
      return res
        .status(403)
        .json({ msg: "Seller account is not made for this" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Something went wrong while fetching orderHistory" });
  }
});

module.exports = UserRouter;
