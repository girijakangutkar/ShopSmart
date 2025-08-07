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
});

const ProductModel = mongoose.model("products", ProductSchema);

module.exports = ProductModel;
