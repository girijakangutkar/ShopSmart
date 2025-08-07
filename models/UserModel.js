const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, default: "User" },
  profilePhoto: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "seller"], default: "user" },
  orderHistory: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      quantity: { type: Number, default: 1 },
      purchasedAt: { type: Date, default: Date.now },
      paymentMode: { type: String },
      paymentStatus: { type: Boolean, default: false },
      rating: { type: Number },
      review: [
        {
          feedBack: { type: String },
          feedBackDate: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      quantity: { type: Number, default: 1 },
    },
  ],
});

const UserModel = mongoose.model("users", UserSchema);

module.exports = UserModel;
