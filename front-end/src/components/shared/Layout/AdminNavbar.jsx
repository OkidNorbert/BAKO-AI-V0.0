import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import axios from 'axios';
import {
  Bell,
  Menu as MenuIcon,
  User,
  LogOut,
  Sun,
  Moon,
  X,
  ChevronDown,
  MessageSquare,
  Mail,
  Settings
} from 'lucide-react';
import { adminAPI } from '../../../services/api';

const AdminNavbar = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Fetch notifications and communications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch notifications using adminAPI
        const notificationsResponse = await adminAPI.getNotifications();
        
        // Ensure notifications is always an array
        if (notificationsResponse.data) {
          // Check if the response has sent and received properties (new format)
          if (notificationsResponse.data.sent && notificationsResponse.data.received) {
            // Combine sent and received notifications
            const combined = [
              ...(Array.isArray(notificationsResponse.data.sent) ? notificationsResponse.data.sent : []),
              ...(Array.isArray(notificationsResponse.data.received) ? notificationsResponse.data.received : [])
            ];
            setNotifications(combined);
          } else if (Array.isArray(notificationsResponse.data)) {
            // Old format - direct array
            setNotifications(notificationsResponse.data);
          } else {
            // Unknown format, use empty array
            setNotifications([]);
          }
        } else {
          setNotifications([]);
        }
        
        // Fetch communications using adminAPI
        const communicationsResponse = await adminAPI.getCommunications();
        
        setCommunications(Array.isArray(communicationsResponse.data) ? communicationsResponse.data : []);
      } catch (error) {
        console.error('Error fetching notifications/communications:', error);
        // Set empty arrays on error
        setNotifications([]);
        setCommunications([]);
      }
    };

    fetchNotifications();
    
    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    onSidebarToggle(newState);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await adminAPI.markNotificationAsRead(notificationId);
      
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Combine notifications and communications for the dropdown
  const combinedItems = [
    ...(Array.isArray(notifications) ? notifications.map(item => ({
      ...item,
      source: 'notification',
      title: item.title || 'Notification',
      date: item.createdAt
    })) : []),
    ...(Array.isArray(communications) ? communications.filter(comm => comm.type === 'notification').map(item => ({
      id: `comm-${item.id}`,
      title: item.subject || 'Message',
      message: item.content,
      type: 'info',
      read: false,
      createdAt: item.sentDate,
      source: 'communication'
    })) : [])
  ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const unreadCount = combinedItems.filter(item => !item.read).length;

  const getNotificationIcon = (item) => {
    if (item.source === 'communication') {
      return <Mail className="h-4 w-4 text-blue-500 mr-2" />;
    }
    
    switch (item.type) {
      case 'success':
        return <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>;
      case 'warning':
        return <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>;
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>;
      default:
        return <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>;
    }
  };

  const handleItemClick = (item) => {
    if (item.source === 'notification') {
      markNotificationAsRead(item.id);
      navigate('/team/notifications');
    } else {
      navigate('/team/communications');
    }
    setIsNotificationsOpen(false);
  };

  return (
    <nav className={`border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'border-gray-700 bg-gray-800 bg-opacity-70 backdrop-blur-sm' 
        : 'border-indigo-100 bg-white bg-opacity-70 backdrop-blur-sm'
    }`}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-full relative transition-colors duration-200 ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-50 backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-gray-800 bg-opacity-90 ring-1 ring-gray-700' 
                    : 'bg-white bg-opacity-90 ring-1 ring-gray-200'
                }`}>
                  <div className={`py-2 px-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                      <button
                        onClick={() => navigate('/team/notifications')}
                        className={`text-sm ${
                          isDarkMode 
                            ? 'text-indigo-400 hover:text-indigo-300' 
                            : 'text-indigo-600 hover:text-indigo-500'
                        }`}
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {combinedItems.length > 0 ? (
                      combinedItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleItemClick(item)}
                          className={`w-full p-3 flex items-start border-b last:border-b-0 ${
                            isDarkMode 
                              ? item.read ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-700 bg-gray-700 bg-opacity-50 hover:bg-gray-600' 
                              : item.read ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-100 bg-blue-50 hover:bg-blue-100'
                          } transition-colors duration-200`}
                        >
                          {getNotificationIcon(item)}
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {item.message || item.content}
                            </p>
                            <p className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {new Date(item.date || item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className={`p-4 text-center ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`flex items-center space-x-2 p-2 rounded-full transition-all duration-200 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className={`h-8 w-8 rounded-full bg-gradient-to-tr ${
                  isDarkMode ? 'from-purple-600 to-indigo-700' : 'from-blue-500 to-indigo-600'
                } flex items-center justify-center text-white`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </div>
                <ChevronDown className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </button>

              {isUserMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl shadow-lg focus:outline-none ${
                  isDarkMode 
                    ? 'bg-gray-800 ring-1 ring-gray-700 backdrop-blur-sm' 
                    : 'bg-white ring-1 ring-gray-200 backdrop-blur-sm'
                }`}>
                  <div className="py-2">
                    <div className={`px-4 py-3 border-b ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</p>
                      <p className={`text-sm truncate ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{user?.email || 'user@example.com'}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        navigate('/team/profile');
                        setIsUserMenuOpen(false);
                      }}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <User className="mr-3 h-5 w-5" />
                      Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/team/settings');
                        setIsUserMenuOpen(false);
                      }}
                      className={`flex w-full items-center px-4 py-2 text-sm ${
                        isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      Settings
                    </button>
                    
                    <div className={`border-t ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <button
                        onClick={handleLogout}
                        className={`flex w-full items-center px-4 py-2 text-sm ${
                          isDarkMode ? 'text-red-400 hover:bg-gray-700 hover:text-red-300' : 'text-red-600 hover:bg-gray-100 hover:text-red-700'
                        }`}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar; 