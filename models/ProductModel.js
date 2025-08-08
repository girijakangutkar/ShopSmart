const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true },
  productCompany: { type: String, required: true },
  AvailableOptions: [{ type: String, required: true }],
  productOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  review: [
    {
      ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      rating: { type: Number },
      feedback: { type: String },
      feedbackDate: { type: Date, default: Date.now },
    },
  ],
});

const ProductModel = mongoose.model("products", ProductSchema);

module.exports = ProductModel;
