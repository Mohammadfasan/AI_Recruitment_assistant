import React, { useEffect, useState } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Bell,
  Calendar,
  CheckCircle2,
  Star,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  Briefcase
} from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await markAsRead(id);
      if (res.success) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
        toast.success('Marked as read');
      }
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllAsRead();
      if (res.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  if (loading && notifications.length === 0) return <LoadingSpinner size="lg" />;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'InterviewScheduled':
        return <Calendar className="w-5 h-5 text-amber-600" />;
      case 'InterviewCompleted':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'ApplicationStatus':
        return <Briefcase className="w-5 h-5 text-blue-650" />;
      default:
        return <Bell className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getNotifColor = (type, read) => {
    if (read) return 'bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-800/80 opacity-70';
    switch (type) {
      case 'InterviewScheduled':
        return 'bg-amber-50/40 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/30';
      case 'InterviewCompleted':
        return 'bg-emerald-50/40 border-emerald-200/60 dark:bg-emerald-950/10 dark:border-emerald-900/30';
      case 'ApplicationStatus':
        return 'bg-blue-50/30 border-blue-200/60 dark:bg-blue-950/10 dark:border-blue-900/30';
      default:
        return 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 flex items-center space-x-2">
            <Bell className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Notification Center</span>
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 mt-1 text-sm font-semibold">
            Manage alerts and notifications for interview schedules and status changes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-950 text-indigo-605 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-indigo-100/50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 border rounded-2xl shadow-xs transition-all flex items-start gap-4 ${getNotifColor(
                notif.type,
                notif.read
              )}`}
            >
              {/* Icon Container */}
              <div className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shrink-0 shadow-inner">
                {getNotifIcon(notif.type)}
              </div>

              {/* Text info */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`font-bold text-sm ${notif.read ? 'text-zinc-650' : 'text-zinc-900 dark:text-zinc-50'}`}>
                    {notif.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-zinc-400 font-semibold flex items-center shrink-0">
                      <Clock className="w-3 h-3 mr-0.8" />
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="p-1 text-zinc-400 hover:text-indigo-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-semibold">
                  {notif.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-xs">
          <Bell className="w-12 h-12 text-zinc-350 dark:text-zinc-750 mx-auto mb-4" />
          <h3 className="text-zinc-900 dark:text-zinc-50 font-bold text-lg">All caught up!</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mt-2">
            You don't have any notifications or alerts at this time.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
