import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import {
  Bell,
  Mail,
  Send,
  Trash2,
  Check,
  X,
  Filter,
  Search,
  Clock,
  User,
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
  CheckSquare,
  RefreshCw,
  Users,
  Calendar,
  Info,
  ArrowUpDown,
  ChevronDown,
  BookOpen,
  Settings,
  Layers,
  AlertTriangle,
  CheckCircle,
  AlertOctagon
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    recipients: 'all'
  });
  const { isDarkMode } = useTheme();
  const [showNewNotificationForm, setShowNewNotificationForm] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      setRefreshing(true);
      const response = await adminAPI.getNotifications();
      // Ensure notifications is always an array
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications. Please try again later.');
      // Set empty array on error to prevent filter errors
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!newNotification.message.trim()) {
      setError('Message is required');
      return;
    }

    try {
      setSending(true);
      setError('');

      const response = await adminAPI.createNotification(newNotification);

      if (!response.data || !response.data.id) {
        throw new Error('Invalid response from server');
      }

      // Add the new notification to the list
      setNotifications(prev => [response.data, ...prev]);

      // Reset form
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all'
      });

      setShowNewNotificationForm(false);
      setSuccessMessage('Notification sent successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await adminAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setSuccessMessage('Notification deleted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification. Please try again later.');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await adminAPI.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read. Please try again later.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) {
      setError('No notifications selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const deletePromises = selectedNotifications.map(id =>
        adminAPI.deleteNotification(id)
      );

      await Promise.all(deletePromises);

      // Remove deleted notifications from the list
      setNotifications(notifications.filter(note => !selectedNotifications.includes(note.id)));

      // Clear selection
      setSelectedNotifications([]);

      // Show success message
      setSuccessMessage(`${selectedNotifications.length} notification(s) deleted successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting notifications:', error);

      if (error.response) {
        setError(`Failed to delete notifications: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to delete notifications: No response from server. Please check your connection.');
      } else {
        setError(`Failed to delete notifications: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) {
      setError('No notifications selected');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const markAsReadPromises = selectedNotifications.map(id =>
        adminAPI.markNotificationAsRead(id)
      );

      await Promise.all(markAsReadPromises);

      // Update notifications in the list
      setNotifications(
        notifications.map(notification =>
          selectedNotifications.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );

      // Clear selection
      setSelectedNotifications([]);

      // Show success message
      setSuccessMessage(`${selectedNotifications.length} notification(s) marked as read!`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error marking notifications as read:', error);

      if (error.response) {
        setError(`Failed to mark notifications as read: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to mark notifications as read: No response from server. Please check your connection.');
      } else {
        setError(`Failed to mark notifications as read: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(i => i !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter(notification => {
      if (!notification) return false;

      const searchInTitle = (notification.title?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const searchInMessage = (notification.message?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesSearch = searchInTitle || searchInMessage;
      const matchesType = filterType === 'all' || notification.type === filterType;

      return matchesSearch && matchesType;
    })
    : [];

  // Sort notifications
  const sortedNotifications = Array.isArray(filteredNotifications)
    ? [...filteredNotifications].sort((a, b) => {
      if (!a || !b) return 0;

      const dateA = new Date(a.date || a.createdAt || new Date());
      const dateB = new Date(b.date || b.createdAt || new Date());

      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else if (sortOrder === 'oldest') {
        return dateA - dateB;
      }
      return 0;
    })
    : [];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'schedule':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'payment':
        return <Mail className="h-5 w-5 text-green-500" />;
      case 'registration':
        return <Users className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'info':
        return isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200';
      case 'warning':
        return isDarkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200';
      case 'success':
        return isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200';
      case 'error':
        return isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200';
      case 'schedule':
        return isDarkMode ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-200';
      case 'payment':
        return isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200';
      case 'registration':
        return isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200';
      default:
        return isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
    }
  };

  const refreshNotifications = async () => {
    try {
      setRefreshing(true);
      setError('');

      // Clear selected notifications
      setSelectedNotifications([]);

      // Fetch fresh data
      const response = await adminAPI.getNotifications();

      setNotifications(response.data);
      setSuccessMessage('Notifications refreshed!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error refreshing notifications:', error);

      if (error.response) {
        setError(`Failed to refresh notifications: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to refresh notifications: No response from server. Please check your connection.');
      } else {
        setError(`Failed to refresh notifications: ${error.message}`);
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshNotifications}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowNewNotificationForm(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
              <Plus className="h-4 w-4" />
              <span>New Notification</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                  }`}
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="schedule">Schedule</option>
                <option value="payment">Payment</option>
                <option value="registration">Registration</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={`rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                  }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm flex items-center gap-4`}>
            <span className="text-sm">Selected: {selectedNotifications.length}</span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkMarkAsRead}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                <Eye className="h-3 w-3" />
                <span>Mark Read</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${isDarkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : !Array.isArray(notifications) || notifications.length === 0 ? (
          <div className={`text-center p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className={`text-center p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No notifications match your search criteria</p>
          </div>
        ) : (
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-sm`}>
            <div className="grid grid-cols-[auto,1fr,auto] gap-3 items-center p-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <button
                  className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  onClick={handleSelectAll}
                >
                  <CheckSquare className={`h-4 w-4 ${selectedNotifications.length === filteredNotifications.length
                      ? 'text-blue-500'
                      : 'text-gray-400'
                    }`} />
                </button>
              </div>
              <div className="font-medium">Message</div>
              <div>Actions</div>
            </div>

            {Array.isArray(sortedNotifications) && sortedNotifications.map(notification => (
              <div
                key={notification.id}
                className={`grid grid-cols-[auto,1fr,auto] gap-3 items-center p-3 border-b border-gray-200 dark:border-gray-700 ${notification.read ? 'opacity-70' : ''
                  }`}
              >
                <div>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="rounded-sm border-gray-400"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className={`font-semibold ${notification.read ? '' : 'font-bold'}`}>
                      {notification.title || 'Notification'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-1 text-sm">{notification.message}</p>

                  {notification.recipients && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>
                        {notification.recipients === 'all'
                          ? 'All Users'
                          : notification.recipients === 'contacts'
                            ? 'Teams'
                            : notification.recipients === 'players'
                              ? 'Players'
                              : notification.recipients}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Notification Form Modal */}
        {showNewNotificationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-500" />
                  <span>Send Notification</span>
                </h2>
                <button
                  onClick={() => setShowNewNotificationForm(false)}
                  className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Notification Title"
                    className={`w-full p-2 rounded-md ${isDarkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message*</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Notification message..."
                    required
                    rows={4}
                    className={`w-full p-2 rounded-md ${isDarkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                      className={`w-full p-2 rounded-md ${isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-50 text-gray-900'
                        }`}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                      <option value="schedule">Schedule</option>
                      <option value="payment">Payment</option>
                      <option value="registration">Registration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Recipients</label>
                    <select
                      value={newNotification.recipients}
                      onChange={(e) => setNewNotification({ ...newNotification, recipients: e.target.value })}
                      className={`w-full p-2 rounded-md ${isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-50 text-gray-900'
                        }`}
                    >
                      <option value="all">All Users</option>
                      <option value="teams">Teams Only</option>
                      <option value="players">Players Only</option>
                      <option value="admins">Admins Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewNotificationForm(false)}
                    className={`px-4 py-2 rounded-md ${isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !newNotification.message}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } ${sending || !newNotification.message ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 