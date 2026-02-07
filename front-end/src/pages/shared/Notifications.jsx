import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, playerAPI } from '../../services/api';
import {
  Bell,
  Calendar,
  Video,
  Trophy,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  X,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Personal player (no teamId) has no notifications — redirect to dashboard
  useEffect(() => {
    if (user?.role === 'player' && !user?.teamId) {
      navigate('/player', { replace: true });
    }
  }, [user?.role, user?.teamId, navigate]);

  useEffect(() => {
    if (user?.role === 'player' && !user?.teamId) return;
    fetchNotifications();
  }, [filter, user?.role, user?.teamId]);

  const fetchNotifications = async () => {
    if (user?.role === 'player' && !user?.teamId) return;
    try {
      setLoading(true);
      let raw = [];
      if (user?.role === 'team') {
        const res = await adminAPI.getNotifications();
        const data = res?.data;
        raw = Array.isArray(data) ? data : (data?.sent && data?.received ? [...(data.sent || []), ...(data.received || [])] : []);
      } else if (user?.role === 'player' && user?.teamId) {
        const res = await playerAPI.getNotifications();
        raw = Array.isArray(res?.data) ? res.data : [];
      }
      const list = raw.map(n => ({
        id: n.id,
        type: n.type || 'system_update',
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        timestamp: n.timestamp || n.createdAt || n.created_at,
        read: !!n.read,
        priority: n.priority || 'medium',
        actionUrl: n.actionUrl || n.action_url || null
      }));
      let filtered = list;
      if (filter !== 'all') {
        filtered = list.filter(n => n.type === filter);
      }
      if (user?.role === 'player') {
        filtered = filtered.filter(n => !['team_invite', 'match_scheduled'].includes(n.type));
      }
      setNotifications(filtered);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    try {
      if (user?.role === 'team') await adminAPI.markNotificationAsRead(notificationId);
      else if (user?.role === 'player') await playerAPI.markNotificationAsRead(notificationId);
    } catch (e) {
      console.warn('Error marking notification as read:', e);
    }
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    try {
      if (user?.role === 'team') await adminAPI.deleteNotification(notificationId);
      else if (user?.role === 'player') await playerAPI.deleteNotification(notificationId);
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      if (user?.role === 'player') await playerAPI.markAllNotificationsAsRead();
      // team may not have mark-all endpoint; leave as local-only if needed
    } catch (e) {
      console.warn('Error marking all as read:', e);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'video_analysis':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'team_invite':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'training_reminder':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'match_scheduled':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'performance_update':
        return <Trophy className="w-5 h-5 text-blue-500" />;
      case 'system_update':
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return isDarkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50';
      case 'medium':
        return isDarkMode ? 'border-yellow-500 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50';
      case 'low':
        return isDarkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50';
      default:
        return isDarkMode ? 'border-gray-500 bg-gray-900/20' : 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Don't render notifications UI for personal player (redirecting)
  if (user?.role === 'player' && !user?.teamId) {
    return null;
  }

  const filters = [
    { value: 'all', label: 'All Notifications' },
    { value: 'video_analysis', label: 'Video Analysis' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'training_reminder', label: 'Training' },
    { value: 'performance_update', label: 'Performance' },
    { value: 'system_update', label: 'System' }
  ];

  // Add team-specific filters for team accounts
  if (user?.role === 'team') {
    filters.splice(2, 0,
      { value: 'team_invite', label: 'Team Invites' },
      { value: 'match_scheduled', label: 'Matches' }
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-purple-950'
      : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className={`ml-3 px-2 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white'
                }`}>
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`appearance-none pl-10 pr-8 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {filters.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>

            {/* Actions */}
            <button
              onClick={markAllAsRead}
              className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                } transition-colors`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </button>

            <button
              onClick={clearAllNotifications}
              className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                } transition-colors`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>

            <button
              onClick={fetchNotifications}
              className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                } transition-colors`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className={`rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No notifications found
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {filter === 'all'
                  ? 'You\'re all caught up! Check back later for new notifications.'
                  : `No ${filters.find(f => f.value === filter)?.label.toLowerCase() || 'notifications'} found.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read
                      ? isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      : ''
                    }`}
                  onClick={() => setSelectedNotification(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className={`p-1 rounded hover:bg-gray-200 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center mt-2">
                        <Clock className={`w-3 h-3 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>

                      {/* Action Link */}
                      {notification.actionUrl && (
                        <div className="mt-2">
                          <a
                            href={notification.actionUrl}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className={`inline-flex items-center text-sm font-medium ${isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
                              } transition-colors`}
                          >
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-6 max-w-lg w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedNotification.title}
                </h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className={`p-1 rounded hover:bg-gray-200 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-start space-x-3 mb-4">
                <div className={`p-3 rounded-full ${getPriorityColor(selectedNotification.priority)}`}>
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <div className="flex-1">
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedNotification.message}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className={`w-3 h-3 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(selectedNotification.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedNotification.actionUrl && (
                <div className="flex justify-end">
                  <a
                    href={selectedNotification.actionUrl}
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${isDarkMode
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                      } transition-colors`}
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
