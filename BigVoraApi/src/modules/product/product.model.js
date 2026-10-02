const mongoose = require("mongoose");
const { randomUUID } = require("node:crypto");

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 40,
      default: () => "BV-" + randomUUID().toUpperCase(),
    },
    images: { type: [String], default: [] },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    category: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0.01, max: 1000000000 },
    mrp: { type: Number, required: true, min: 0.01, max: 1000000000 },
    costPrice: { type: Number, required: true, min: 0, max: 1000000000 },
    stock: { type: Number, required: true, min: 0, max: 1000000000 },
    reorderLevel: { type: Number, required: true, min: 0, max: 1000000000 },
    unit: {
      type: String,
      required: true,
      enum: ["Piece", "Kg", "Gram", "Litre", "Pack", "Bag", "Box"],
    },
    ruleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductRule" }],
    lastStockReason: { type: String, maxlength: 200 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
productSchema.index({ name: 1, categoryId: 1, price: 1, stock: 1 });
module.exports = mongoose.model("Product", productSchema);
