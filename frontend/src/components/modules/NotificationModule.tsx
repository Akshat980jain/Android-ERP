import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, Calendar, BookOpen, CreditCard, Briefcase } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'academic' | 'finance' | 'library' | 'placement' | 'general';
  read: boolean;
  createdAt: string;
  targetRoles?: string[];
}

export function NotificationModule() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'academic' | 'finance' | 'library' | 'placement'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await apiClient.getNotifications();
        if (res && Array.isArray((res as any).notifications)) {
          setNotifications((res as any).notifications);
        } else if (Array.isArray(res as any)) {
          setNotifications(res as any);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
      setLoading(false);
    }
    fetchNotifications();
  }, []);

  // Realtime: listen for server-pushed notifications
  const { socket } = useAuth();
  useEffect(() => {
    if (!socket) return;
    const handler = (notification: any) => {
      setNotifications(prev => [{ ...(notification as Notification), read: false }, ...prev]);
    };
    socket.on('notification', handler);
    return () => {
      socket.off('notification', handler);
    };
  }, [socket]);

  const filteredNotifications = notifications.filter(notification => {
    if (notification.targetRoles && !notification.targetRoles.includes(user?.role || '')) return false;
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'academic':
      case 'finance':
      case 'library':
      case 'placement':
        return notification.category === filter;
      default:
        return true;
    }
  });

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      setNotifications(prev => prev.map(notif => notif._id === id ? { ...notif, read: true } : notif));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch {}
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif._id !== id));
    // Optionally, call an API to delete notification
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic':
        return <BookOpen className="w-4 h-4" />;
      case 'finance':
        return <CreditCard className="w-4 h-4" />;
      case 'library':
        return <BookOpen className="w-4 h-4" />;
      case 'placement':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read && (n.targetRoles ? n.targetRoles.includes(user?.role || '') : true)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <Button onClick={markAllAsRead} variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'unread', 'academic', 'finance', 'library', 'placement'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading notifications...</h3>
            </CardContent>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card key={notification._id} className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-1 text-gray-500">
                          {getCategoryIcon(notification.category)}
                          <span className="text-xs capitalize">{notification.category}</span>
                        </div>
                      </div>
                      <p className={`text-sm ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification._id)}
                        variant="outline"
                        size="sm"
                      >
                        Mark as Read
                      </Button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}