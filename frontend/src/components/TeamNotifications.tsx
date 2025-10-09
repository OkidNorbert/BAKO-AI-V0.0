import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';

interface TeamNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  is_read: boolean;
  action_url?: string;
  action_text?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: string[];
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const TeamNotifications: React.FC = () => {
  const {  } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<TeamNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_types: ['info', 'warning', 'success'],
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch notifications
      setNotifications([]);
    } catch (error: any) {
      if (error.name === 'SilentError' || error.message?.includes('Service unavailable')) {
        setNotifications([]);
      } else {
        console.error('Error fetching notifications:', error);
        showToast('Failed to load notifications', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // TODO: Implement API call to mark notification as read
      setNotifications(notifications.map(n => 
        n.id === notificationId ? {...n, is_read: true} : n
      ));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implement API call to mark all notifications as read
      setNotifications(notifications.map(n => ({...n, is_read: true})));
      showToast('All notifications marked as read', 'success');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      showToast('Failed to mark all notifications as read', 'error');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      // TODO: Implement API call to delete notification
      setNotifications(notifications.filter(n => n.id !== notificationId));
      showToast('Notification deleted', 'success');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      showToast('Failed to delete notification', 'error');
    }
  };

  const updateSettings = async () => {
    try {
      // TODO: Implement API call to update notification settings
      showToast('Notification settings updated', 'success');
      setShowSettings(false);
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      showToast('Failed to update notification settings', 'error');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Team Notifications
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Stay updated with team activities and important alerts
          </p>
        </div>

        {/* Action Bar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-4">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`px-4 py-2 ${
                      darkMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } rounded-lg transition-colors text-sm font-medium`}
                  >
                    Mark All Read
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`px-4 py-2 ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } rounded-lg transition-colors`}
              >
                ⚙️ Settings
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Notification Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`text-md font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Notification Types
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications' },
                    { key: 'push_notifications', label: 'Push Notifications' },
                    { key: 'sms_notifications', label: 'SMS Notifications' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onChange={(e) => setSettings({
                          ...settings,
                          [key]: e.target.checked
                        })}
                        className="mr-3"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className={`text-md font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Quiet Hours
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => setSettings({...settings, quiet_hours_start: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => setSettings({...settings, quiet_hours_end: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <button
                  onClick={updateSettings}
                  className={`mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
            <div className="text-6xl mb-4">🔔</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              {filter === 'unread' ? 'No Unread Notifications' : 
               filter === 'read' ? 'No Read Notifications' : 'No Notifications'}
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filter === 'all' ? 'You\'re all caught up!' : 
               filter === 'unread' ? 'All notifications have been read' : 
               'No notifications have been read yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 ${
                  !notification.is_read ? 'border-l-4 border-orange-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}></div>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      )}
                    </div>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        notification.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {notification.priority} priority
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className={`px-3 py-1 text-xs ${
                          darkMode 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } rounded-lg transition-colors`}
                      >
                        Mark Read
                      </button>
                    )}
                    {notification.action_url && (
                      <button
                        onClick={() => window.open(notification.action_url, '_blank')}
                        className={`px-3 py-1 text-xs ${
                          darkMode 
                            ? 'bg-orange-600 text-white hover:bg-orange-700' 
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        } rounded-lg transition-colors`}
                      >
                        {notification.action_text || 'View'}
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className={`px-3 py-1 text-xs ${
                        darkMode 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      } rounded-lg transition-colors`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
