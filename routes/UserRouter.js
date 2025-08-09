const express = require("express");
const UserModel = require("../models/UserModel");
const AuthMiddleware = require("../middlewares/authMiddleware");
const UserRouter = express.Router();
const redis = require("../config/RedisConfig");
const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const ProductModel = require("../models/ProductModel");
const upload = multer({ storage });

//! user profile
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

//! Order History
//? Get orderHistory
UserRouter.get(
  "/orderHistory",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      if (req.role == "user" || req.role == "admin") {
        const cached = await redis.get(`orderHistory:${req.userId}`);

        if (cached) {
          return res.status(200).json({
            msg: "OrderHistory fetched from cached data",
            orderHistory: JSON.parse(cached),
          });
        }

        const user = await UserModel.findById(req.userId).populate({
          path: "orderHistory.product",
          populate: {
            path: "review.ratedBy",
            select: "_id",
          },
        });

        await redis.set(
          `orderHistory:${req.userId}`,
          JSON.stringify(user.orderHistory),
          "EX",
          60
        );
        const orders = user.orderHistory;
        res.status(200).json({
          msg: "Order history fetch success from DB",
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

      await redis.del(`orderHistory:${req.userId}`);
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

//! Cart
//? Add to cart
UserRouter.put(
  "/addToCart/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    console.log("Add to cart route hit with productId:", req.params.productId);
    try {
      const productId = req.params.productId;
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ msg: "Product does not exist" });
      }

      const user = await UserModel.findById(req.userId);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      const existingItemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex !== -1) {
        user.cart[existingItemIndex].quantity += 1;
      } else {
        user.cart.push({ product: productId, quantity: 1 });
      }

      await user.save();

      const updatedUser = await UserModel.findById(req.userId).populate(
        "cart.product"
      );

      await redis.del("cartItems");

      res.status(200).json({
        msg: "Product added to cart",
        cartData: updatedUser.cart,
      });
    } catch (error) {
      console.error("Add to cart error:", error);
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
      const cached = await redis.get("cartItems");

      if (cached) {
        res.status(200).json({
          msg: "OrderHistory fetched from cached data",
          cart: JSON.parse(cached),
        });
      }
      const user = await UserModel.findById(req.userId).populate(
        "cart.product"
      );

      const cartData = user.cart;

      await redis.set("cartInfo", JSON.stringify(cartData), "EX", 60);
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

//? Update the quantity
// UserRouter.patch("/")

//? Remove from cart
UserRouter.delete(
  "/removeFromCart/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;

      const updatedUser = await UserModel.findByIdAndUpdate(
        req.userId,
        {
          $pull: { cart: { product: productId } },
        },
        { new: true }
      ).populate("cart.product");

      await redis.del("cartInfo");
      res.status(200).json({
        msg: "Product removed from cart",
        cart: updatedUser.cart,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Something went wrong while removing product from cart",
        error: error.message,
      });
    }
  }
);

//! Rating and review
//? Rating and feedback for product
UserRouter.patch(
  "/addRatingAndReview/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ msg: "Product might have removed" });
      }

      const { rating, feedback } = req.body.review;

      if (!rating || !feedback) {
        return res
          .status(400)
          .json({ msg: "Rating and feedback are required" });
      }

      const alreadyReviewed = (product.review || []).find(
        (r) => r.ratedBy.toString() === req.userId
      );

      if (alreadyReviewed) {
        return res
          .status(400)
          .json({ msg: "You have already review this product" });
      }

      await ProductModel.findByIdAndUpdate(
        productId,
        {
          $push: {
            review: {
              ratedBy: req.userId,
              rating,
              feedback,
            },
          },
        },
        { new: true }
      );

      res.status(200).json({ msg: "Review added", product: product });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        msg: "Something went wrong while giving rating and review",
        error: error,
      });
    }
  }
);

//! Wish List
//? Get wishlist
UserRouter.get(
  "/wishList",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const cached = await redis.get("wishListItems");

      if (cached) {
        res.status(200).json({
          msg: "OrderHistory fetched from cached data",
          wishList: JSON.parse(cached),
        });
      }
      const wishList = await UserModel.findById(req.userId).populate(
        "wishList.product"
      );
      if (!wishList) {
        return res.status(404).json({ msg: "User does not exists" });
      }

      await redis.set(
        "wishListItems",
        JSON.stringify(wishList.wishList),
        "EX",
        60
      );

      res.status(200).json({
        msg: "WishList fetching completed",
        wishList: wishList.wishList,
      });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while fetching wishlist" });
    }
  }
);

//? Add to wish list
UserRouter.patch(
  "/addToWishList/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ msg: "Product might have removed" });
      }
      const user = await UserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({ msg: "User does not exists" });
      }

      // const existInWishList = user.wishList.findIndex(
      //   (item) => item.product.toString() == productId
      // );

      // if (existInWishList == -1) {
      await UserModel.findByIdAndUpdate(
        req.userId,
        {
          $push: {
            wishList: {
              product: productId,
            },
          },
        },
        { new: true }
      );
      // } else {
      //   res.status(403).json({ msg: "Already present in the wishlist" });
      // }

      await redis.del("wishListItems");

      res.status(200).json({ msg: "Added to the wishList" });
    } catch (error) {
      res
        .status(500)
        .json({ msg: "Something went wrong while adding wishList" });
    }
  }
);

//? Remove from wishList
UserRouter.delete(
  "/removeFromWishList/:productId",
  AuthMiddleware(["user", "admin"]),
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const updateList = await UserModel.findByIdAndUpdate(
        req.userId,
        {
          $pull: { wishList: { product: productId } },
        },
        { new: true }
      ).populate("wishList.product");

      await redis.del("wishListItems");
      res.status(200).json({
        msg: "Product removed from wishList",
        wishList: updateList.wishList,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Something went wrong while removing product from wishlist",
        error: error,
      });
    }
  }
);

module.exports = UserRouter;
