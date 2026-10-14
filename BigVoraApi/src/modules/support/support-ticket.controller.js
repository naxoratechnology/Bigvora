const mongoose = require('mongoose');
const SupportTicket = require('./support-ticket.model');

const categories = ['order', 'payment', 'delivery', 'account', 'return', 'other'];
const statuses = ['open', 'in_progress', 'resolved', 'closed'];
const present = ticket => ({
  id: String(ticket._id), subject: ticket.subject, message: ticket.message,
  category: ticket.category, status: ticket.status, createdAt: ticket.createdAt, updatedAt: ticket.updatedAt,
  customer: ticket.customerId && typeof ticket.customerId === 'object' ? {id: String(ticket.customerId._id), name: ticket.customerId.fullName || 'Customer', email: ticket.customerId.email || '', mobile: ticket.customerId.mobile || ''} : undefined,
});
const validId = id => mongoose.isObjectIdOrHexString(id);

exports.create = async (req, res, next) => { try {
  const {subject, message, category = 'other'} = req.body || {};
  if (typeof subject !== 'string' || !subject.trim() || typeof message !== 'string' || !message.trim()) return res.status(400).json({success: false, message: 'Subject and message are required.'});
  if (!categories.includes(category)) return res.status(400).json({success: false, message: 'Select a valid support category.'});
  const ticket = await SupportTicket.create({customerId: req.user._id, subject: subject.trim(), message: message.trim(), category});
  return res.status(201).json({success: true, data: {ticket: present(ticket)}});
} catch (error) { return next(error); }};

exports.listMine = async (req, res, next) => { try {
  const tickets = await SupportTicket.find({customerId: req.user._id}).sort({createdAt: -1}).lean();
  return res.json({success: true, data: {tickets: tickets.map(present)}});
} catch (error) { return next(error); }};

exports.adminList = async (req, res, next) => { try {
  const status = String(req.query.status || 'all');
  const filter = status === 'all' ? {} : statuses.includes(status) ? {status} : null;
  if (!filter) return res.status(400).json({success: false, message: 'Invalid ticket status.'});
  const tickets = await SupportTicket.find(filter).populate('customerId', 'fullName email mobile').sort({createdAt: -1}).lean();
  return res.json({success: true, data: {tickets: tickets.map(present)}});
} catch (error) { return next(error); }};

exports.updateStatus = async (req, res, next) => { try {
  if (!validId(req.params.id)) return res.status(400).json({success: false, message: 'Invalid support ticket.'});
  const status = String(req.body?.status || '');
  if (!statuses.includes(status)) return res.status(400).json({success: false, message: 'Select a valid ticket status.'});
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {$set: {status}}, {new: true}).populate('customerId', 'fullName email mobile');
  if (!ticket) return res.status(404).json({success: false, message: 'Support ticket not found.'});
  return res.json({success: true, data: {ticket: present(ticket)}});
} catch (error) { return next(error); }};
