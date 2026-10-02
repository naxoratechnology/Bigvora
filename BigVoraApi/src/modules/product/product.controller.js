const mongoose = require("mongoose");
const { productInput, versionInput, invalid } = require("./product.validation");
const model = () => require("./product.model");
async function validateCategory(fields) {
  if (!fields.category && !fields.categoryId) return;
  const Category = require("../category/category.model");
  const category = fields.categoryId
    ? await Category.findById(fields.categoryId)
    : await Category.findOne({ nameKey: fields.category.toLowerCase() });
  if (!category) invalid("Select a saved category. Create the category first.");
  fields.category = category.name;
  fields.categoryId = category._id;
}
async function validateRules(fields) {
  if (!fields.ruleIds) return;
  const ProductRule = require("../productRule/product-rule.model");
  const count = await ProductRule.countDocuments({
    _id: { $in: fields.ruleIds },
  });
  if (count !== fields.ruleIds.length)
    invalid("One or more selected product rules no longer exist.");
}

function present(product) {
  const p = product.toObject ? product.toObject() : product;
  return {
    images: p.images || [],
    id: String(p._id),
    sku: p.sku,
    name: p.name,
    category: p.category,
    categoryId: p.categoryId ? String(p.categoryId) : null,
    description: p.description,
    price: p.price,
    mrp: p.mrp || p.price,
    discountPercent:
      p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
    costPrice: p.costPrice,
    ruleIds: (p.ruleIds || []).map((rule) => String(rule._id || rule)),
    rules: (p.ruleIds || [])
      .filter((rule) => rule && rule.title)
      .map((rule) => ({
        id: String(rule._id),
        title: rule.title,
        description: rule.description,
        icon: rule.icon,
      })),
    stock: p.stock,
    reorderLevel: p.reorderLevel,
    unit: p.unit,
    status:
      p.stock <= 0
        ? "Out of stock"
        : p.stock <= p.reorderLevel
        ? "Low stock"
        : "In stock",
    updated: new Date(p.updatedAt).toISOString(),
    version: p.__v,
  };
}
function idInput(req) {
  if (!mongoose.isObjectIdOrHexString(req.params.id))
    invalid("Invalid product ID.");
  return req.params.id;
}
function handler(action) {
  return async (req, res, next) => {
    try {
      await action(req, res);
    } catch (error) {
      if (error.status === 400)
        return res.status(400).json({ success: false, message: error.message });
      if (error?.code === 11000 && error?.keyPattern?.sku) {
        return res.status(409).json({
          success: false,
          message: "This SKU is already assigned to another product.",
        });
      }
      if (error.name === "ValidationError")
        return res
          .status(400)
          .json({ success: false, message: "Invalid product fields." });
      return next(error);
    }
  };
}
async function missingOrConflict(res, id) {
  const exists = await model().exists({ _id: id });
  return res.status(exists ? 409 : 404).json({
    success: false,
    message: exists
      ? "Product changed. Refresh and try again."
      : "Product not found.",
  });
}
const list = handler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 100);
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  )
    invalid("Invalid pagination.");
  const Product = model();
  const [products, total] = await Promise.all([
    Product.find()
      .populate("ruleIds")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(),
  ]);
  res.json({
    success: true,
    data: {
      products: products.map(present),
      page,
      total,
      hasMore: page * limit < total,
    },
  });
});
const detail = handler(async (req, res) => {
  const product = await model().findById(idInput(req)).populate("ruleIds");
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  res.json({ success: true, data: { product: present(product) } });
});
const create = handler(async (req, res) => {
  const fields = productInput(req.body);
  await validateCategory(fields);
  await validateRules(fields);
  const Product = model();
  await Product.init();
  const product = await Product.create({ ...fields, createdBy: req.adminId });
  await product.populate("ruleIds");
  res.status(201).json({ success: true, data: { product: present(product) } });
});
const update = handler(async (req, res) => {
  const id = idInput(req);
  const fields = productInput(req.body, true);
  await validateCategory(fields);
  await validateRules(fields);
  const current = await model().findById(id).select("price mrp");
  if (!current)
    return res
      .status(404)
      .json({ success: false, message: "Product not found." });
  const nextPrice = fields.price === undefined ? current.price : fields.price;
  const nextMrp =
    fields.mrp === undefined ? current.mrp || current.price : fields.mrp;
  if (nextMrp < nextPrice)
    invalid("MRP cannot be lower than the selling price.");
  const version = versionInput(req.body.version);
  const product = await model().findOneAndUpdate(
    { _id: id, __v: version },
    { $set: fields, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  );
  if (!product) return missingOrConflict(res, id);
  await product.populate("ruleIds");
  res.json({ success: true, data: { product: present(product) } });
});
const remove = handler(async (req, res) => {
  const id = idInput(req);
  const version = versionInput(req.body?.version);
  const product = await model().findOneAndDelete({ _id: id, __v: version });
  if (!product) return missingOrConflict(res, id);
  res.json({ success: true, data: { id } });
});
const stock = handler(async (req, res) => {
  const id = idInput(req);
  const { quantity, reason } = req.body || {};
  if (
    !Number.isSafeInteger(quantity) ||
    quantity === 0 ||
    Math.abs(quantity) > 1000000000
  )
    invalid("Provide a non-zero whole-number stock adjustment.");
  if (
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.trim().length > 200
  )
    invalid("Provide a stock adjustment reason.");
  const filter = {
    _id: id,
    stock: quantity < 0 ? { $gte: -quantity } : { $lte: 1000000000 - quantity },
  };
  const product = await model().findOneAndUpdate(
    filter,
    {
      $inc: { stock: quantity, __v: 1 },
      $set: { lastStockReason: reason.trim() },
    },
    { new: true }
  );
  if (!product) {
    const exists = await model().exists({ _id: id });
    return res
      .status(exists ? 409 : 404)
      .json({
        success: false,
        message: exists
          ? "Adjustment exceeds available stock or inventory limit. Refresh and try again."
          : "Product not found.",
      });
  }
  res.json({ success: true, data: { product: present(product) } });
});
module.exports = { list, detail, create, update, remove, stock, present };
