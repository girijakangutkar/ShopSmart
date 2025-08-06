const express = require("express");
const UserModel = require("../models/UserModel");
const AuthMiddleware = require("../middlewares/authMiddleware");
const UserRouter = express.Router();

const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const upload = multer({ storage });

//* Get orderHistory
UserRouter.get(
  "/orderHistory",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const query = {};
      if (req.role == "user") {
        query.userId = req.userId;
      }
      const orderHistory = await UserModel.find(query);
      res.status(200).json({
        msg: "Order history fetch success",
        orderHistory: orderHistory,
      });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while fetching orderHistory" });
    }
  }
);

//* Profile Edit
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

//* Place an order

module.exports = UserRouter;
