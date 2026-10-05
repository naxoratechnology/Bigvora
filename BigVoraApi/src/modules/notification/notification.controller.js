const Notification = require('./notification.model');
const NotificationRead = require('./notification-read.model');

const present = (notification, readIds) => ({
  id: String(notification._id),
  title: notification.title,
  message: notification.message,
  icon: notification.icon || 'notifications-outline',
  createdAt: notification.createdAt,
  isRead: readIds.has(String(notification._id)),
});

exports.list = async (req, res, next) => {
  try {
    const notifications = await Notification.find({isActive: true}).sort({createdAt: -1}).lean();
    const reads = await NotificationRead.find({userId: req.user._id, notificationId: {$in: notifications.map(item => item._id)}}).select('notificationId').lean();
    const readIds = new Set(reads.map(item => String(item.notificationId)));
    res.set('Cache-Control', 'no-store');
    return res.json({success: true, data: {notifications: notifications.map(item => present(item, readIds))}});
  } catch (error) { return next(error); }
};

exports.readAll = async (req, res, next) => {
  try {
    const notifications = await Notification.find({isActive: true}).select('_id').lean();
    if (notifications.length) {
      await NotificationRead.bulkWrite(notifications.map(item => ({updateOne: {filter: {userId: req.user._id, notificationId: item._id}, update: {$setOnInsert: {userId: req.user._id, notificationId: item._id}}, upsert: true}})));
    }
    return res.json({success: true, data: {}});
  } catch (error) { return next(error); }
};
