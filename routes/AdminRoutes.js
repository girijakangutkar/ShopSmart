const express = require("express");
const cron = require("node-cron");
const AdminRouter = express.Router();
const ProductModel = require("../models/ProductModel");
const transporter = require("../config/NodeMailerTransporter");

//? Stock checkup manual
AdminRouter.post("/stockCheckup/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;
    const goodStockLevel = await ProductModel.findById(productId);

    if (!goodStockLevel) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const stockLevel = goodStockLevel.stock <= 5;

    if (stockLevel) {
      await transporter.sendMail({
        from: `${process.env.MAIL_USER} ShopSmart`,
        to: process.env.MAIL_USER,
        subject: `Stock low alert`,
        html: `<p>Dear admin, product with ID ${productId} has low stock (${goodStockLevel.stock}). Please restock it.</p>`,
      });

      return res.status(200).json({ msg: "Low stock alert sent" });
    } else {
      return res.status(200).json({ msg: "Stock level is sufficient" });
    }
  } catch (error) {
    console.error("Stock checkup error:", error);
    res.status(500).json({ msg: "Something went wrong" });
  }
});

//? Stock checkup Automatic

cron.schedule("0 9 * * *", async () => {
  // Everyday at 9 AM
  try {
    const lowStockProducts = await ProductModel.find({ stock: { $lte: 5 } });

    if (lowStockProducts.length === 0) {
      console.log("✅ All products have sufficient stock.");
      return;
    }

    const productList = lowStockProducts
      .map(
        (product) =>
          `<li>${product.productName} (ID: ${product._id}) - Stock: ${product.stock}</li>`
      )
      .join("");

    await transporter.sendMail({
      from: `"ShopSmart" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      subject: "📦 Daily Low Stock Alert",
      html: `<p>Dear admin, the following products have low stock:</p><ul>${productList}</ul>`,
    });

    console.log("📧 Low stock alert email sent.");
  } catch (error) {
    console.error("❌ Error in stock alert scheduler:", error);
  }
});

module.exports = AdminRouter;
