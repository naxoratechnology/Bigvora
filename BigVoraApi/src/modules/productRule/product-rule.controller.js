const mongoose = require('mongoose');
const ProductRule = require('./product-rule.model');

const icons = ['refresh-outline', 'shield-checkmark-outline', 'cube-outline', 'ribbon-outline', 'checkmark-circle-outline'];
function fail(message) { const error = new Error(message); error.status = 400; throw error; }
function id(value) { if (!mongoose.isObjectIdOrHexString(value)) fail('Invalid product rule ID.'); return value; }
function input(body, partial = false) {
  const allowed = ['title', 'description', 'icon', 'isActive'];
  if (!body || typeof body !== 'object' || Object.keys(body).some(key => !allowed.includes(key))) fail('Invalid product rule fields.');
  const value = {};
  if ('title' in body) { if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 80) fail('Enter a valid rule title.'); value.title = body.title.trim(); }
  else if (!partial) fail('Rule title is required.');
  if ('description' in body) { if (typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 240) fail('Enter a valid rule description.'); value.description = body.description.trim(); }
  else if (!partial) fail('Rule description is required.');
  if ('icon' in body) { if (!icons.includes(body.icon)) fail('Select a valid rule icon.'); value.icon = body.icon; }
  else if (!partial) value.icon = 'checkmark-circle-outline';
  if ('isActive' in body) { if (typeof body.isActive !== 'boolean') fail('Invalid rule status.'); value.isActive = body.isActive; }
  return value;
}
const present = rule => ({id:String(rule._id),title:rule.title,description:rule.description,icon:rule.icon,isActive:rule.isActive,version:rule.__v});
const wrap = action => async (req,res,next) => { try { await action(req,res); } catch (error) { if (error.status === 400 || error.name === 'ValidationError') return res.status(400).json({success:false,message:error.message}); next(error); } };
exports.list = wrap(async (req,res) => res.json({success:true,data:{rules:(await ProductRule.find().sort({createdAt:-1})).map(present)}}));
exports.create = wrap(async (req,res) => { const rule=await ProductRule.create({...input(req.body),createdBy:req.adminId}); res.status(201).json({success:true,data:{rule:present(rule)}}); });
exports.update = wrap(async (req,res) => { const {version,...body}=req.body||{}; if (!Number.isSafeInteger(version)||version<0) fail('A valid rule version is required.'); const rule=await ProductRule.findOneAndUpdate({_id:id(req.params.id),__v:version},{$set:input(body,true),$inc:{__v:1}},{new:true,runValidators:true}); if(!rule)return res.status(409).json({success:false,message:'Rule changed or no longer exists. Refresh and try again.'}); res.json({success:true,data:{rule:present(rule)}}); });
exports.remove = wrap(async (req,res) => { const productCount=await require('../product/product.model').countDocuments({ruleIds:id(req.params.id)}); if(productCount)return res.status(409).json({success:false,message:'Remove this rule from products before deleting it.'}); const rule=await ProductRule.findByIdAndDelete(req.params.id); if(!rule)return res.status(404).json({success:false,message:'Product rule not found.'}); res.json({success:true,data:{id:req.params.id}}); });
