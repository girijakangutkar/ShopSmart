const express = require("express");
const cors = require("cors");
const AuthRouter = require("./routes/AuthRouter");
const Logger = require("./middlewares/Logger");
const UserRouter = require("./routes/UserRouter");
const ProductRouter = require("./routes/ProductRouter");
const Razorpay = require("razorpay");
const app = express();

console.log(process.env.NODE_ENV);
//! Env file
require("dotenv").config({
  path: process.env.NODE_ENV == "test" ? "./.env.test" : "./.env",
});

//!Mongo connection

if (process.env.NODE_ENV !== "test") {
  require("./config/MongoConfig");
}

//!Cron schedular
require("./routes/AdminRoutes");

//!cors
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(express.json());

app.use("/api", Logger, AuthRouter);

app.use("/myInfo", Logger, UserRouter);

app.use("/wareHouse", Logger, ProductRouter);

app.post("/OrderPayment", async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

module.exports = app;
