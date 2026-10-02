const mongoose = require('mongoose');
const { categoryInput, versionInput } = require('./category.validation');
const { invalid } = require('../product/product.validation');
const model = () => require('./category.model');
const products = () => require('../product/product.model');
function present(c, count = 0) {
  return { image: c.image || null, id: String(c._id), name: c.name, description: c.description,
    products: count, status: 'Active',
    updated: new Date(c.updatedAt).toISOString(), version: c.__v };
}
function idInput(req) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) invalid('Invalid category ID.');
  return req.params.id;
}
function handler(action) {
  return async (req, res, next) => {
    try { await action(req, res); }
    catch (error) {
      if (error.code === 11000) return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
      if (error.status === 400 || error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.status === 400 ? error.message : 'Invalid category fields.' });
      return next(error);
    }
  };
}
const notFound = res => res.status(404).json({ success: false, message: 'Category not found.' });
const conflict = res => res.status(409).json({ success: false, message: 'Category changed. Refresh and try again.' });
const list = handler(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Number(req.query.limit || 100);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) invalid('Invalid pagination.');
  const [categories, total] = await Promise.all([
    model().find().sort({ nameKey: 1 }).skip((page - 1) * limit).limit(limit), model().countDocuments(),
  ]);
  const counts = await products().aggregate([
    { $match: { category: { $in: categories.map(c => c.name) } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const byName = new Map(counts.map(c => [c._id, c.count]));
  res.json({ success: true, data: { categories: categories.map(c => present(c, byName.get(c.name) || 0)),
    page, total, hasMore: page * limit < total } });
});
const detail = handler(async (req, res) => {
  const category = await model().findById(idInput(req));
  if (!category) return notFound(res);
  const count = await products().countDocuments({ category: category.name });
  res.json({ success: true, data: { category: present(category, count) } });
});
const create = handler(async (req, res) => {
  const fields = categoryInput(req.body);
  const Category = model();
  await Category.init();
  const category = await Category.create({ ...fields, createdBy: req.adminId });
  res.status(201).json({ success: true, data: { category: present(category) } });
});
const update = handler(async (req, res) => {
  const id = idInput(req), fields = categoryInput(req.body, true), version = versionInput(req.body.version);
  const existing = await model().findById(id);
  if (!existing) return notFound(res);
  if (existing.__v !== version) return conflict(res);
  const count = await products().countDocuments({ category: existing.name });
  if (fields.name && fields.name !== existing.name && count > 0) {
    return res.status(409).json({ success: false, message: 'Move this category’s products to another category before renaming it.' });
  }
  const category = await model().findOneAndUpdate({ _id: id, __v: version },
    { $set: fields, $inc: { __v: 1 } }, { new: true, runValidators: true });
  if (!category) return conflict(res);
  res.json({ success: true, data: { category: present(category, count) } });
});
const remove = handler(async (req, res) => {
  const id = idInput(req), version = versionInput(req.body?.version);
  const existing = await model().findById(id);
  if (!existing) return notFound(res);
  if (existing.__v !== version) return conflict(res);
  if (await products().exists({ category: existing.name })) {
    return res.status(409).json({ success: false, message: 'Move or delete this category’s products before deleting the category.' });
  }
  const deleted = await model().findOneAndDelete({ _id: id, __v: version });
  if (!deleted) return conflict(res);
  res.json({ success: true, data: { id } });
});
module.exports = { list, detail, create, update, remove, present };
