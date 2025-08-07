const express = require("express");
const UserModel = require("../models/UserModel");
const AuthRouter = express.Router();
const saltsRounds = 10;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const RateLimiter = require("../middlewares/RateLimiter");
require("dotenv").config();

const multer = require("multer");
const { storage } = require("../config/CloudinaryConfig");
const upload = multer({ storage });

//? Node Mailer
const transporter = require("../config/NodeMailerTransporter");

AuthRouter.get("/user/:userId", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.userId).select(
      "name profilePhoto role"
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

//* Signup user
AuthRouter.post(
  "/signup",
  RateLimiter,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const user = await UserModel.findOne({ email });

      if (user) {
        return res
          .status(409) //conflict
          .json({ msg: "User already exists, please login." });
      }

      const validRoles = ["user", "admin", "seller"];
      if (!validRoles.includes(role)) {
        return res.status(403).json({ msg: "Role does not exist" });
      }

      const profilePhoto = req.file?.path || "";

      bcrypt.hash(password, saltsRounds, async function (err, hash) {
        if (err) {
          res.status(403).json({ msg: "Password hashing failed" }); //Forbidden
        } else {
          await UserModel.create({
            name,
            email,
            profilePhoto,
            role,
            password: hash,
          });
          //Content-Type: multipart/form-data
          res.status(201).json({ msg: "User Signup success" });
        }
      });
    } catch (error) {
      res.status(500).json({ msg: "Something went wrong" });
    }
  }
);

//* Login user
AuthRouter.post("/login", RateLimiter, async (req, res) => {
  try {
    let { email, password } = req.body;
    let user = await UserModel.findOne({ email });

    if (!user) {
      return res
        .status(404) // Not found
        .json({ msg: "User does not exists, please signup" });
    }

    let hash = user.password;
    bcrypt.compare(password, hash, async function (err, result) {
      if (err) {
        res.status(406).json({ msg: "Error while comparing password" }); // Not acceptable
      }
      if (result) {
        const accessToken = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.JWT_SECRET
        );
        res
          .status(200)
          .json({ msg: "Login success", accessToken: accessToken });
      } else {
        res.status(406).json({ msg: "Wrong password" });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
});

//* Forget password
AuthRouter.post("/forgotPassword", RateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    let user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User does not exists" });
    }

    let resetToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    let resetLink = `http://localhost:5173/api/resetPassword?token=${resetToken}`;

    await transporter.sendMail({
      from: `"ShopSmart" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: "Reset password from ShopSmart",
      html: `<p>Dear ${user.name}, here is your reset password link</p><p>${resetLink}</p>`,
    });

    res
      .status(200)
      .json({ msg: "Password reset link has been sent to your email" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
});

//* Reset password
AuthRouter.put("/resetPassword", RateLimiter, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded) {
      let user = await UserModel.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ msg: "User is not authorized" }); // unauthorized
      }
      bcrypt.hash(newPassword, 10, async function (err, hash) {
        if (err) {
          return res.status(500).json({ msg: "cannot hash password" });
        } else {
          user.password = hash;
          await user.save();
          return res.status(201).json({ msg: "Password reset success" });
        }
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
});

module.exports = AuthRouter;
