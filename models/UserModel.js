const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, default: "User" },
  profilePhoto: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "seller"], default: "user" },
  orderHistory: [
    {
      orderId: { type: String },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      quantity: { type: Number, default: 1, min: 1 },
      purchasedAt: { type: Date, default: Date.now },
      paymentMode: { type: String, enum: ["online", "cod"], required: true },
      paymentStatus: { type: Boolean, default: false },
      paymentId: { type: String, default: null },
      totalAmount: { type: Number, required: true, min: 0 },
      orderStatus: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
      },
      trackingId: { type: String, default: null },
      deliveredAt: { type: Date, default: null },
      shippingAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: "India" },
      },
    },
  ],
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      quantity: { type: Number, default: 1 },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  wishList: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      addedDate: { type: Date, default: Date.now },
    },
  ],
  addresses: [
    {
      name: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
      isDefault: { type: Boolean, default: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

UserSchema.index(
  { "orderHistory.orderId": 1 },
  {
    sparse: true,
    background: true,
  }
);

UserSchema.index(
  { "orderHistory.paymentId": 1 },
  {
    sparse: true,
    background: true,
  }
);

const UserModel = mongoose.model("users", UserSchema);

module.exports = UserModel;
