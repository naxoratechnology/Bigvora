const mongoose = require('mongoose');
const Cart = require('./cart.model');
const Product = require('../product/product.model');

const isProductId = value => mongoose.isObjectIdOrHexString(value);

function present(product, quantity) {
  return {
    id: String(product._id),
    name: product.name,
    category: product.category,
    categoryId: product.categoryId ? String(product.categoryId) : null,
    description: product.description,
    price: product.price,
    priceValue: Number(product.price),
    stock: product.stock,
    unit: product.unit,
    images: product.images || [],
    quantity,
    icon: 'cube-outline',
    tint: '#EDF3FF',
  };
}

async function cartItems(userId) {
  const cart = await Cart.findOne({userId}).lean();
  if (!cart?.items?.length) return [];
  const products = await Product.find({
    _id: {$in: cart.items.map(item => item.productId)},
  }).lean();
  const productsById = new Map(
    products.map(product => [String(product._id), product]),
  );
  return cart.items
    .map(item => {
      const product = productsById.get(String(item.productId));
      return product ? present(product, item.quantity) : null;
    })
    .filter(Boolean);
}

async function respond(res, userId) {
  res.set('Cache-Control', 'no-store');
  return res.json({success: true, data: {items: await cartItems(userId)}});
}

async function list(req, res, next) {
  try {
    return await respond(res, req.user._id);
  } catch (error) {
    return next(error);
  }
}

async function setQuantity(req, res, next) {
  try {
    const productId = req.params.productId;
    const quantity = Number(req.body?.quantity);
    if (!isProductId(productId)) {
      return res.status(400).json({success: false, message: 'Invalid product.'});
    }
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 999) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a whole number between 0 and 999.',
      });
    }

    const product = await Product.findById(productId).select('_id').lean();
    if (!product && quantity > 0) {
      return res.status(404).json({success: false, message: 'Product not found.'});
    }

    let cart = await Cart.findOne({userId: req.user._id});
    if (!cart && quantity === 0) return await respond(res, req.user._id);
    if (!cart) cart = new Cart({userId: req.user._id, items: []});

    const itemIndex = cart.items.findIndex(
      item => String(item.productId) === String(productId),
    );
    if (quantity === 0) {
      if (itemIndex >= 0) cart.items.splice(itemIndex, 1);
    } else if (itemIndex >= 0) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.push({productId, quantity});
    }

    await cart.save();
    return await respond(res, req.user._id);
  } catch (error) {
    return next(error);
  }
}

async function clear(req, res, next) {
  try {
    await Cart.deleteOne({userId: req.user._id});
    return res.json({success: true, data: {items: []}});
  } catch (error) {
    return next(error);
  }
}

module.exports = {list, setQuantity, clear};
