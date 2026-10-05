const mongoose = require('mongoose');
const Notification = require('./notification.model');
const NotificationRead = require('./notification-read.model');

const icons = [
  'notifications-outline',
  'sparkles-outline',
  'pricetag-outline',
  'cube-outline',
  'gift-outline',
  'megaphone-outline',
];
const present = notification => ({
  id: String(notification._id),
  title: notification.title,
  message: notification.message,
  icon: notification.icon,
  isActive: notification.isActive,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
  version: notification.__v,
});
const fail = (message, status = 400) => Object.assign(new Error(message), {status});
const id = value => {
  if (!mongoose.isObjectIdOrHexString(value)) throw fail('Invalid notification.');
  return value;
};
function input(body, partial = false) {
  const allowed = ['title', 'message', 'icon', 'isActive'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) throw fail('Invalid notification fields.');
  const value = {};
  for (const field of ['title', 'message']) {
    if (!(field in body)) {
      if (!partial) throw fail(`${field === 'title' ? 'Title' : 'Message'} is required.`);
      continue;
    }
    if (typeof body[field] !== 'string' || !body[field].trim()) throw fail(`Enter a valid ${field}.`);
    value[field] = body[field].trim();
  }
  if ('icon' in body) {
    if (!icons.includes(body.icon)) throw fail('Select a valid notification icon.');
    value.icon = body.icon;
  } else if (!partial) value.icon = 'notifications-outline';
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') throw fail('Invalid notification status.');
    value.isActive = body.isActive;
  }
  return value;
}
const wrap = action => async (req, res, next) => { try { await action(req, res); } catch (error) { next(error); } };

exports.list = wrap(async (req, res) => {
  const notifications = await Notification.find().sort({createdAt: -1}).lean();
  res.json({success: true, data: {notifications: notifications.map(present)}});
});
exports.create = wrap(async (req, res) => {
  const notification = await Notification.create({...input(req.body), createdBy: req.adminId});
  res.status(201).json({success: true, data: {notification: present(notification)}});
});
exports.update = wrap(async (req, res) => {
  const {version, ...body} = req.body || {};
  if (!Number.isSafeInteger(version) || version < 0) throw fail('A valid notification version is required.');
  const notification = await Notification.findOneAndUpdate({_id: id(req.params.id), __v: version}, {$set: input(body, true), $inc: {__v: 1}}, {new: true, runValidators: true});
  if (!notification) throw fail('Notification changed or no longer exists. Refresh and try again.', 409);
  res.json({success: true, data: {notification: present(notification)}});
});
exports.remove = wrap(async (req, res) => {
  const notificationId = id(req.params.id);
  const notification = await Notification.findByIdAndDelete(notificationId);
  if (!notification) throw fail('Notification not found.', 404);
  await NotificationRead.deleteMany({notificationId});
  res.json({success: true, data: {id: notificationId}});
});
