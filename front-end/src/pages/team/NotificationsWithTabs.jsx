import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import {
  Bell,
  Send,
  Inbox,
  Trash2,
  Check,
  X,
  Filter,
  Search,
  AlertCircle,
  Plus,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Mail
} from 'lucide-react';

const NotificationsWithTabs = () => {
  const [sentNotifications, setSentNotifications] = useState([]);
  const [receivedNotifications, setReceivedNotifications] = useState([]);
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
  const [activeTab, setActiveTab] = useState('received');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentNotifications();
    } else {
      fetchReceivedNotifications();
    }
  }, [activeTab]);

  const fetchSentNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/notifications/sent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSentNotifications(response.data || []);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
      setError('Failed to fetch sent notifications. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReceivedNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/notifications/received', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReceivedNotifications(response.data || []);
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error fetching received notifications:', error);
      setError('Failed to fetch received notifications. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!newNotification.message.trim()) {
      setError('Message is required');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/notifications', newNotification, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new notification to the sent list
      setSentNotifications([response.data, ...sentNotifications]);
      
      // Reset form and close modal
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all'
      });
      setShowNewNotificationForm(false);
      
      // Success message
      setSuccessMessage('Notification sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from the appropriate list
      if (activeTab === 'sent') {
        setSentNotifications(sentNotifications.filter(n => n.id !== id));
      } else {
        setReceivedNotifications(receivedNotifications.filter(n => n.id !== id));
      }
      
      // Success message
      setSuccessMessage('Notification deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/notifications/${id}/mark-as-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the notification in the appropriate list
      if (activeTab === 'sent') {
        setSentNotifications(
          sentNotifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
      } else {
        setReceivedNotifications(
          receivedNotifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
      
      // Success message
      setSuccessMessage('Notification marked as read!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter notifications based on search and type
  const getFilteredNotifications = () => {
    const notificationsToFilter = activeTab === 'sent' ? sentNotifications : receivedNotifications;
    
    return notificationsToFilter.filter(notification => {
      const searchInTitle = (notification?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const searchInMessage = (notification?.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = searchInTitle || searchInMessage;
      const matchesType = filterType === 'all' || notification?.type === filterType;
      
      return matchesSearch && matchesType;
    });
  };

  const handleSelectAll = () => {
    const filteredNotifications = getFilteredNotifications();
    
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

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) {
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete ${selectedNotifications.length} notifications?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const deletePromises = selectedNotifications.map(id => 
        axios.delete(`/api/admin/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(deletePromises);
      
      // Update the appropriate list
      if (activeTab === 'sent') {
        setSentNotifications(sentNotifications.filter(n => !selectedNotifications.includes(n.id)));
      } else {
        setReceivedNotifications(receivedNotifications.filter(n => !selectedNotifications.includes(n.id)));
      }
      
      setSelectedNotifications([]);
      setSuccessMessage(`${selectedNotifications.length} notifications deleted!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      setError('Failed to delete notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) {
      return;
    }
    
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const markPromises = selectedNotifications.map(id => 
        axios.put(`/api/admin/notifications/${id}/mark-as-read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(markPromises);
      
      // Update the appropriate list
      if (activeTab === 'sent') {
        setSentNotifications(
          sentNotifications.map(n => 
            selectedNotifications.includes(n.id) ? { ...n, read: true } : n
          )
        );
      } else {
        setReceivedNotifications(
          receivedNotifications.map(n => 
            selectedNotifications.includes(n.id) ? { ...n, read: true } : n
          )
        );
      }
      
      setSelectedNotifications([]);
      setSuccessMessage(`${selectedNotifications.length} notifications marked as read!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError('Failed to mark notifications as read. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = () => {
    if (activeTab === 'sent') {
      fetchSentNotifications();
    } else {
      fetchReceivedNotifications();
    }
  };

  if (loading && sentNotifications.length === 0 && receivedNotifications.length === 0) {
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
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDarkMode
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
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDarkMode
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

        <div className="mb-6">
          <div className="flex mb-4">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex items-center gap-2 px-4 py-2 rounded-tl-md rounded-bl-md transition-colors ${
                activeTab === 'received'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span>Received</span>
              {receivedNotifications.filter(n => !n.read).length > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                  activeTab === 'received'
                    ? 'bg-white text-blue-600'
                    : isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                }`}>
                  {receivedNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-tr-md rounded-br-md transition-colors ${
                activeTab === 'sent'
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Sent</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className={`flex-1 relative ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full p-2 pl-10 rounded-md ${
                isDarkMode
                  ? 'bg-gray-800 text-white placeholder-gray-400'
                  : 'bg-white text-gray-900 placeholder-gray-500'
              } border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`p-2 rounded-md ${
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-white text-gray-900 border-gray-300'
              } border`}
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {selectedNotifications.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleBulkMarkAsRead}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>Mark Selected as Read</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isDarkMode
                  ? 'bg-red-900 hover:bg-red-800 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : getFilteredNotifications().length === 0 ? (
          <div className={`text-center p-8 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className={`rounded-lg overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
            {getFilteredNotifications().map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                } ${notification.read ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="rounded-sm"
                    />
                  </div>
                  
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                    {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                    {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {notification.type === 'error' && <AlertOctagon className="w-5 h-5 text-red-500" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                        {notification.title || 'Notification'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm">{notification.message}</p>
                    
                    <div className="mt-2 flex justify-end gap-2">
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
              </div>
            ))}
          </div>
        )}

        {/* New Notification Form Modal */}
        {showNewNotificationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`w-full max-w-md rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } p-6 shadow-xl`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">New Notification</h2>
                <button
                  onClick={() => setShowNewNotificationForm(false)}
                  className={`p-1 rounded-full ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
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
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    placeholder="Notification Title"
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Message*</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    placeholder="Notification message..."
                    required
                    rows={4}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400'
                        : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Recipients</label>
                  <select
                    value={newNotification.recipients}
                    onChange={(e) => setNewNotification({...newNotification, recipients: e.target.value})}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="all">All Users</option>
                    <option value="staff">Staff Only</option>
                    <option value="contacts">Contacts Only</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewNotificationForm(false)}
                    className={`px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className={`px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 ${
                      sending ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {sending ? 'Sending...' : 'Send Notification'}
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

export default NotificationsWithTabs;
