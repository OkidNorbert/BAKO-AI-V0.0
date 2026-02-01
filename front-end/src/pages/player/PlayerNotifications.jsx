import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import {
  Bell,
  ChevronLeft,
  Search,
  Trash2,
  CheckSquare,
  AlertCircle,
  Filter,
  RefreshCw,
  Check,
  BellOff,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PlayerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, read, unread
  const [isRetrying, setIsRetrying] = useState(false);
  const [processingItems, setProcessingItems] = useState([]);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchQuery, filterType]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/player/notifications');

      setNotifications(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);

      if (error.code === 'ERR_NETWORK') {
        setError('Server is not running. Using test notifications.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to fetch notifications. Please try again later.');
      }

      // For development - set mock data if API fails
      setNotifications([
        {
          id: '1',
          title: 'New Match Analysis',
          message: 'The analysis for yesterday\'s match against the Lakers is ready for viewing.',
          type: 'analysis',
          read: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          title: 'Training Goal Met',
          message: 'Congratulations! You achieved 85% shooting accuracy in your latest drill.',
          type: 'achievement',
          read: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          title: 'Coach Feedback',
          message: 'Coach Miller left a comment on your shooting form video.',
          type: 'message',
          read: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
        {
          id: '4',
          title: 'Practice Reminder',
          message: 'Don\'t forget to upload your daily 50 free-throws session.',
          type: 'reminder',
          read: true,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
          id: '5',
          title: 'New Drill Available',
          message: 'A new advanced dribbling course is now accessible in Training.',
          type: 'training',
          read: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        }
      ]);
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchNotifications();
    setIsRetrying(false);
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        notif =>
          notif.title.toLowerCase().includes(query) ||
          notif.message.toLowerCase().includes(query)
      );
    }

    // Apply read/unread filter
    if (filterType === 'read') {
      filtered = filtered.filter(notif => notif.read);
    } else if (filterType === 'unread') {
      filtered = filtered.filter(notif => !notif.read);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId) => {
    try {
      // Add to processing items to show loading state
      setProcessingItems(prev => [...prev, notificationId]);

      // First update UI for better responsiveness
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));

      // Then call API
      try {
        await api.put(`/player/notifications/${notificationId}/read`);
        setSuccess('Notification marked as read');
      } catch (apiError) {
        console.error('API error marking notification as read:', apiError);
        // But keep the UI updated even if API fails
      }

    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read.');
    } finally {
      // Remove from processing items
      setProcessingItems(prev => prev.filter(id => id !== notificationId));
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update UI first for responsiveness
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));

      // Then call API
      try {
        await api.put('/player/notifications/read-all');
        setSuccess('All notifications marked as read');
      } catch (apiError) {
        console.error('API error marking all notifications as read:', apiError);
        // But keep the UI updated even if API fails
      }

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read.');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Add to processing items
      setProcessingItems(prev => [...prev, notificationId]);

      // First update UI for better responsiveness
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Then call API
      try {
        await api.delete(`/player/notifications/${notificationId}`);
        setSuccess('Notification deleted');
      } catch (apiError) {
        console.error('API error deleting notification:', apiError);
        // Keep the UI updated even if API fails
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification.');
    } finally {
      // Remove from processing items
      setProcessingItems(prev => prev.filter(id => id !== notificationId));
    }
  };

  // Function to format timestamp as relative time
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 7) {
      return date.toLocaleDateString();
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get notification type badge color
  const getTypeColor = (type) => {
    switch (type) {
      case 'analysis':
        return isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800';
      case 'achievement':
        return isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'schedule':
        return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'message':
        return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'reminder':
        return isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'training':
        return isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800';
      default:
        return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center">
            <Link to="/player" className={`mr-4 p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              }`}>
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center">
              <Bell className={`h-6 w-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`px-3 py-2 rounded-md flex items-center transition-colors ${isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
                }`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={markAllAsRead}
              disabled={!filteredNotifications.some(n => !n.read)}
              className={`px-3 py-2 rounded-md flex items-center transition-colors ${!filteredNotifications.some(n => !n.read)
                  ? `${isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                  : isDarkMode
                    ? 'bg-blue-700 hover:bg-blue-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                }`}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-md ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError('')} className="text-current hover:text-red-500">
                  <span className="sr-only">Dismiss</span>
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-md ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  <span>{success}</span>
                </div>
                <button onClick={() => setSuccess('')} className="text-current hover:text-green-500">
                  <span className="sr-only">Dismiss</span>
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`mb-6 p-4 rounded-lg shadow-md transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} size={20} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 border-none focus:ring-blue-500'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200 focus:ring-blue-500'
                  }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDarkMode
                    ? 'bg-gray-700 text-white border-none'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-center p-12 rounded-lg shadow-md transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <BellOff className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {filterType === 'unread'
                  ? "You've read all notifications!"
                  : filterType === 'read'
                    ? "No read notifications yet"
                    : searchQuery
                      ? `No results found for "${searchQuery}"`
                      : "You don't have any notifications yet"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 rounded-lg shadow-md transition-all ${notification.read
                        ? isDarkMode ? 'bg-gray-800' : 'bg-white'
                        : isDarkMode
                          ? 'bg-blue-900/20 border-l-4 border-blue-500'
                          : 'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className={`font-medium ${!notification.read && 'font-semibold'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center text-xs gap-2">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          {!notification.read && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                              }`}>
                              unread
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            disabled={processingItems.includes(notification.id)}
                            className={`p-2 rounded-full transition-colors ${isDarkMode
                                ? 'hover:bg-gray-700 text-blue-400 hover:text-blue-300'
                                : 'hover:bg-gray-100 text-blue-600 hover:text-blue-700'
                              }`}
                            title="Mark as read"
                          >
                            {processingItems.includes(notification.id) ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <CheckSquare className="h-5 w-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          disabled={processingItems.includes(notification.id)}
                          className={`p-2 rounded-full transition-colors ${isDarkMode
                              ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                              : 'hover:bg-gray-100 text-red-500 hover:text-red-600'
                            }`}
                          title="Delete notification"
                        >
                          {processingItems.includes(notification.id) ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoachNotifications;

