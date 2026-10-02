const mongoose = require('mongoose');
const Favourite = require('./favourite.model');
const Product = require('../product/product.model');

const present = product => ({
  id: String(product._id),
  name: product.name,
  category: product.category,
  categoryId: product.categoryId ? String(product.categoryId) : null,
  description: product.description,
  price: product.price,
  stock: product.stock,
  unit: product.unit,
  images: product.images || [],
});

async function list(req, res, next) {
  try {
    const saved = await Favourite.find({userId: req.user._id}).sort({createdAt: -1}).lean();
    const ids = saved.map(item => item.productId);
    const products = await Product.find({_id: {$in: ids}}).lean();
    const byId = new Map(products.map(product => [String(product._id), product]));
    const ordered = ids.map(id => byId.get(String(id))).filter(Boolean).map(present);
    res.set('Cache-Control', 'no-store');
    return res.json({success: true, data: {favourites: ordered}});
  } catch (error) { return next(error); }
}

async function add(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.productId)) return res.status(400).json({success: false, message: 'Invalid product.'});
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({success: false, message: 'Product not found.'});
    await Favourite.updateOne({userId: req.user._id, productId: product._id}, {$setOnInsert: {userId: req.user._id, productId: product._id}}, {upsert: true});
    return res.status(201).json({success: true, message: 'Added to favourites.', data: {product: present(product)}});
  } catch (error) { return next(error); }
}

async function remove(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.productId)) return res.status(400).json({success: false, message: 'Invalid product.'});
    await Favourite.deleteOne({userId: req.user._id, productId: req.params.productId});
    return res.json({success: true, message: 'Removed from favourites.', data: {}});
  } catch (error) { return next(error); }
}
module.exports = {list, add, remove};
