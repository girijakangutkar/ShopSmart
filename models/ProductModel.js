const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  ProductPrice: { type: Number, required: true },
  productCompany: { type: String, required: true },
  AvailableColors: [{ type: String, required: true }],
  productOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
});

const ProductModel = mongoose.model("products", ProductSchema);

module.exports = ProductModel;
