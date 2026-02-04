import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/utils/axiosConfig';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Set up polling for new notifications every minute
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 60000);
      
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Update unread count whenever notifications change
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get role from auth context or localStorage
      const role = user?.role || localStorage.getItem('userRole');
      
      if (!role) {
        console.warn('No user role found, cannot fetch notifications');
        setError('Authentication required');
        return;
      }
      
      console.log(`Fetching notifications for role: ${role}`);
      
      try {
        const response = await api.get(`/${role}/notifications`);
        
        if (response.data && Array.isArray(response.data)) {
          setNotifications(response.data);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('Error fetching notifications from API:', apiError);
        
        // If server is not running, use fallback data immediately
        if (apiError.code === 'ERR_NETWORK') {
          throw new Error('Server connection refused');
        }
        
        // For authentication errors, handle specifically
        if (apiError.response?.status === 401) {
          console.warn('Authentication error fetching notifications');
          throw new Error('Authentication required');
        }
        
        // For other errors, try to continue with fallback data
      }
      
      // Use the test real-time notification placeholder
      console.log('Using a test real-time notification placeholder');
      const testNotifications = [
        {
          id: '1',
          title: 'Real-time Test Notification',
          message: 'This is a test notification from the BAKO notification system.',
          type: 'alert',
          read: false,
          createdAt: new Date(),
          source: 'https://via.placeholder.com/40x40?text=DS:1'
        },
        {
          id: '2',
          title: 'Training Session Completed',
          message: 'Your training session was analyzed and is ready for review.',
          type: 'training',
          read: true,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          source: 'https://via.placeholder.com/40x40?text=DS:2'
        },
        {
          id: '3',
          title: 'Important System Alert',
          message: 'The basketball analytics system will be under maintenance this Friday for updates.',
          type: 'alert',
          read: false,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          source: 'https://via.placeholder.com/40x40?text=DS:3'
        }
      ];
      
      setNotifications(testNotifications);
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
      
      if (err.message === 'Server connection refused') {
        setError('Server is not running. Using test notifications.');
      } else if (err.message === 'Authentication required') {
        setError('Authentication required');
      } else {
        setError('Failed to load notifications');
      }
      
      // In case of complete failure, show a single error notification
      setNotifications([{
        id: 'error-1',
        title: 'Notification System Error',
        message: 'Could not connect to notification service. Please try again later.',
        type: 'alert',
        read: false,
        createdAt: new Date(),
        source: 'https://via.placeholder.com/40x40?text=ERROR'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchNotifications();
    setIsRetrying(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      setLoading(true);
      
      // Update local state first for immediate UI feedback
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Get role from auth context or localStorage
      const role = user?.role || localStorage.getItem('userRole');
      
      if (!role) {
        console.warn('No user role found, cannot mark notification as read');
        return;
      }
      
      // Attempt to update on the server
      try {
        await api.put(`/${role}/notifications/${notificationId}/read`);
      } catch (apiError) {
        console.warn('Error marking notification as read on server:', apiError);
        // Continue with local state update only
      }
    } catch (err) {
      console.error('Error in markAsRead:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      
      // Update local state first for immediate UI feedback
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Get role from auth context or localStorage
      const role = user?.role || localStorage.getItem('userRole');
      
      if (!role) {
        console.warn('No user role found, cannot mark all notifications as read');
        return;
      }
      
      // Attempt to update on the server
      try {
        await api.put(`/${role}/notifications/read-all`);
      } catch (apiError) {
        console.warn('Error marking all notifications as read on server:', apiError);
        // Continue with local state update only
      }
    } catch (err) {
      console.error('Error in markAllAsRead:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      setLoading(true);
      
      // Update local state first for immediate UI feedback
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // Get role from auth context or localStorage
      const role = user?.role || localStorage.getItem('userRole');
      
      if (!role) {
        console.warn('No user role found, cannot delete notification');
        return;
      }
      
      // Attempt to update on the server
      try {
        await api.delete(`/${role}/notifications/${notificationId}`);
      } catch (apiError) {
        console.warn('Error deleting notification on server:', apiError);
        // Continue with local state update only
      }
    } catch (err) {
      console.error('Error in deleteNotification:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (notification) => {
    // For real-time notifications (e.g., from WebSockets)
    setNotifications(prev => [notification, ...prev]);
  };

  // Get appropriate icon class based on notification type
  const getNotificationTypeClass = (type) => {
    switch (type) {
      case 'payment':
        return 'bg-purple-50 border-purple-200';
      case 'training':
        return 'bg-green-50 border-green-200';
      case 'alert':
        return 'bg-red-50 border-red-200';
      case 'budget':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading, 
        error,
        isRetrying,
        fetchNotifications,
        handleRetry,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        getNotificationTypeClass
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 