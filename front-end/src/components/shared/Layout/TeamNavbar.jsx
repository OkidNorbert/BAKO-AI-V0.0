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
  const [orgName, setOrgName] = useState('');
  const [orgLogo, setOrgLogo] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };

    const fetchOrgData = async () => {
      if (user?.role === 'team' || user?.role === 'coach') {
        try {
          const response = await adminAPI.getProfile();
          if (response.data?.organization) {
            setOrgName(response.data.organization.name);
            setOrgLogo(response.data.organization.logo_url);
          }
        } catch (error) {
          console.error('Error fetching organization data for navbar:', error);
        }
      }
    };

    fetchNotifications();
    fetchOrgData();

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

      // Update local state first to ensure UI is responsive
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      // Optionally update with server data if available in different formats
      if (response.data) {
        const updatedData = response.data.notification || response.data;
        if (updatedData && typeof updatedData === 'object' && updatedData.id) {
          setNotifications(prevNotifications =>
            prevNotifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, ...updatedData }
                : notification
            )
          );
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Local state was already updated, so we don't necessarily need to throw
    }
  };

  const notificationItems = Array.isArray(notifications)
    ? notifications.map(item => ({
      ...item,
      source: 'notification',
      title: item.title || 'Notification',
      date: item.createdAt
    })).sort((a, b) => {
      try {
        return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
      } catch {
        return 0;
      }
    })
    : [];

  const unreadCount = notificationItems.filter(item => !item.read).length;

  const getNotificationIcon = (item) => {
    if (!item) return null;
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
    try {
      await markNotificationAsRead(item.id);
      setNotifications(prev =>
        prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
      );
      navigate('/team/notifications');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    setIsNotificationsOpen(false);
  };

  return (
    <nav className="bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            
            {/* Logo for mobile or when sidebar closed */}
            {!isSidebarOpen && (
                 <h1 className="text-2xl font-black tracking-tighter text-white">
                    BAKO<span className="text-orange-500">.</span>AI
                </h1>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
                onClick={() => navigate('/team/notifications')}
                className="p-3 rounded-2xl relative text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 flex items-center justify-center h-4 w-4 rounded-full bg-orange-500 text-white text-[10px] font-black shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
            </button>

            {/* User Profile Trigger */}
            <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300">
                    <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        {orgLogo || user?.profileImage ? (
                            <img src={orgLogo || user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-white font-black text-xl">
                                {(orgName || user?.name || 'A').charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="hidden md:block text-left mr-2">
                        <p className="text-xs font-black text-white uppercase tracking-wider">{orgName || user?.name || 'User'}</p>
                        <p className="text-[10px] font-bold text-gray-500 leading-tight italic">Elite Access</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                </Menu.Button>
                
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-2 scale-95"
                  enterTo="opacity-100 translate-y-0 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 scale-100"
                  leaveTo="opacity-0 translate-y-2 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-4 w-64 origin-top-right rounded-[2rem] bg-[#1a1d23] border border-white/10 shadow-glass overflow-hidden focus:outline-none">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <p className="text-sm font-black text-white">{user?.name || 'User'}</p>
                        <p className="text-xs font-bold text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    
                    <div className="p-4">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={() => navigate('/team/profile')}
                                    className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                                >
                                    <Settings className="h-5 w-5" />
                                    Account Settings
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={handleLogout}
                                    className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all mt-1 ${active ? 'bg-red-500/10 text-red-500' : 'text-red-500/80'}`}
                                >
                                    <LogOut className="h-5 w-5" />
                                    Sign Out
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TeamNavbar; 