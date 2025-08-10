const express = require("express");
const cors = require("cors");
const AuthRouter = require("./routes/AuthRouter");
const Logger = require("./middlewares/Logger");
const UserRouter = require("./routes/UserRouter");
const ProductRouter = require("./routes/ProductRouter");
const Razorpay = require("razorpay");
const router = express.Router();
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

// test routes
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Everything is working fine" });
});

app.use("/api", Logger, AuthRouter);

app.use("/myInfo", Logger, UserRouter);

app.use("/wareHouse", Logger, ProductRouter);

app.post("/OrderPayment", async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ msg: "Invalid amount" });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1,
    });
    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong", error });
  }
});

//? Get Payment Status
router.get("/paymentStatus/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      created_at: payment.created_at,
    });
  } catch (error) {
    console.error("Payment status fetch error:", error);
    res.status(500).json({
      msg: "Failed to fetch payment status",
      error: error.message,
    });
  }
});

if (process.env.NODE_ENV !== "test") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

module.exports = app;
