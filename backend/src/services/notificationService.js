import Notification from '../models/Notification.js';

export const createNotification = async ({ userId, title, message, type = 'System' }) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

export const getNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({ createdAt: -1 });
};

export const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
};

export const markAllAsRead = async (userId) => {
  return await Notification.updateMany({ userId, read: false }, { read: true });
};
