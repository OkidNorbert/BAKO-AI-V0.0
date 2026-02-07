import React, { useState, useRef, useEffect, Fragment } from 'react';
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
import { Menu, Transition } from '@headlessui/react';

const TeamNavbar = ({ onSidebarToggle }) => {
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
        // Mock data logic removed to prepare for real backend integration

        // Fetch notifications using adminAPI
        const notificationsResponse = await adminAPI.getNotifications();

        // Handle different response formats
        if (notificationsResponse.data) {
          // If the response has sent and received properties (new format)
          if (notificationsResponse.data.sent && notificationsResponse.data.received) {
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

        // Fetch communications
        try {
          const communicationsResponse = await adminAPI.getCommunications();

          // Ensure communications is an array
          setCommunications(Array.isArray(communicationsResponse.data) ? communicationsResponse.data : []);
        } catch (commError) {
          console.error('Error fetching communications:', commError);
          setCommunications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
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
      const response = await adminAPI.markNotificationAsRead(notificationId);

      if (response.data && response.data.notification) {
        // Update notifications state with the server response
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, ...response.data.notification }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Safely combine notifications and communications for the dropdown
  const combinedItems = [
    ...(Array.isArray(notifications) ? notifications.map(item => ({
      ...item,
      source: 'notification',
      title: item.title || 'Notification',
      date: item.createdAt
    })) : []),
    ...(Array.isArray(communications) ? communications.filter(comm => comm?.type === 'notification').map(item => ({
      id: `comm-${item._id || item.id || Date.now() + Math.random().toString(36).substring(2, 9)}`,
      title: item.subject || 'Message',
      message: item.content,
      type: 'info',
      read: false,
      createdAt: item.sentDate,
      source: 'communication'
    })) : [])
  ].sort((a, b) => {
    // Safely handle date parsing
    try {
      return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
    } catch (error) {
      return 0;
    }
  });

  const unreadCount = Array.isArray(combinedItems)
    ? combinedItems.filter(item => !item.read).length
    : 0;

  const getNotificationIcon = (item) => {
    if (!item) return null;

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

  const handleItemClick = async (item) => {
    if (!item) return;

    if (item.source === 'notification') {
      try {
        await markNotificationAsRead(item.id);
        // Update the notifications state to reflect the read status
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === item.id
              ? { ...notification, read: true }
              : notification
          )
        );
        navigate('/admin/notifications');
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    } else {
      navigate('/admin/communications');
    }
    setIsNotificationsOpen(false);
  };

  return (
    <nav className={`border-b transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900 shadow-xl border-gray-700'
      : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg border-blue-600'
      }`}>
      {/* African pattern decoration - top border */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500"></div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-2 rounded-md ${isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-white hover:text-white hover:bg-white hover:bg-opacity-20'
                }`}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md ${isDarkMode
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <div className="ml-4 relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-md relative ${isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } ring-1 ring-black ring-opacity-5 overflow-hidden z-50`}>
                  <div className={`py-2 px-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Notifications</h3>
                      <button
                        onClick={() => navigate('/admin/notifications')}
                        className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                          }`}
                      >
                        View all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {combinedItems.length > 0 ? (
                      combinedItems.map((item) => (
                        <div
                          key={item.id}
                          className={`px-4 py-3 border-b cursor-pointer ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                            } ${!item.read ? 'font-medium' : ''}`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-start">
                            {getNotificationIcon(item)}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                }`}>
                                {item.title || 'Notification'}
                              </p>
                              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                {item.message}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                {new Date(item.date || item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`px-4 py-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="ml-4 relative" ref={userMenuRef}>
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${isDarkMode
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-white hover:bg-opacity-20'
                    }`}>
                    <div className={`h-8 w-8 rounded-full overflow-hidden border-2 ${isDarkMode ? 'border-yellow-400' : 'border-white'
                      }`}>
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user?.name || 'Admin User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-indigo-700 text-white'
                          }`}>
                          <span className="text-lg font-bold">
                            {user?.firstName ? user.firstName.charAt(0) : (user?.name ? user.name.charAt(0) : 'A')}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-white font-medium hidden sm:block">
                      {user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Admin')}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-white`} />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl shadow-lg ring-1 ring-opacity-5 focus:outline-none ${isDarkMode
                    ? 'bg-gray-800 ring-gray-700'
                    : 'bg-white ring-gray-200'
                    }`}>
                    <div className="py-2">
                      <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{user?.email || 'user@example.com'}</p>
                      </div>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => navigate('/admin/profile')}
                            className={`flex w-full items-center px-4 py-2 text-sm ${active
                              ? isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-100 text-gray-900'
                              : isDarkMode
                                ? 'text-gray-300'
                                : 'text-gray-700'
                              }`}
                          >
                            <User className="mr-3 h-5 w-5" />
                            Profile
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => navigate('/admin/settings')}
                            className={`flex w-full items-center px-4 py-2 text-sm ${active
                              ? isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-100 text-gray-900'
                              : isDarkMode
                                ? 'text-gray-300'
                                : 'text-gray-700'
                              }`}
                          >
                            <Settings className="mr-3 h-5 w-5" />
                            Settings
                          </button>
                        )}
                      </Menu.Item>
                      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`flex w-full items-center px-4 py-2 text-sm ${active
                                ? isDarkMode
                                  ? 'bg-gray-700 text-red-400'
                                  : 'bg-gray-100 text-red-600'
                                : isDarkMode
                                  ? 'text-red-400'
                                  : 'text-red-600'
                                }`}
                            >
                              <LogOut className="mr-3 h-5 w-5" />
                              Logout
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TeamNavbar; 