import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Bell, Calendar, User, Home, FileText, Trophy, Sun, Moon, ChevronDown, LogOut, Video, TrendingUp, MessageSquare, X, Clock } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';


const Navbar = ({ role }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const { notifications, unreadCount, markAsRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isDropdownOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isNotificationsOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role-specific navigation links (player: Notifications only if account created by a team)
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
      case 'team':
      case 'coach':
        return [
          { to: '/team', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
          { to: '/team/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
          { to: '/team/notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications' }
        ];
      case 'player': {
        const isLinked = !!user?.organizationId;
        const base = [
          { to: '/player', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
          { to: '/player/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
          { to: '/player/training', icon: <Video className="h-5 w-5" />, label: 'Training Videos' },
          { to: '/player/skills', icon: <TrendingUp className="h-5 w-5" />, label: 'Skill Analytics' }
        ];
        if (isLinked) {
          base.push({ to: '/player/schedule', icon: <Calendar className="h-5 w-5" />, label: 'Team Schedule' });
          base.push({ to: '/player/announcements', icon: <MessageSquare className="h-5 w-5" />, label: 'Team Announcements' });
          base.push({ to: '/player/notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications' });
        }
        return base;
      }
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${isDarkMode
      ? 'glass-dark shadow-2xl'
      : 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm'
      }`}>
      {/* Premium accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-orange-500 to-red-600"></div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to={user && role ? `/${role}` : '/'} className="flex items-center space-x-3 group">
              <div className="flex flex-col">
                <span className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    BAKO<span className="text-orange-500">.</span>AI
                </span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] -mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Analytics
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center">
            {/* Role-specific navigation links */}
            <div className="flex items-center space-x-4 mr-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold relative group ${isActive
                      ? isDarkMode ? 'text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-white/5' : 'text-orange-600 bg-orange-50'
                      : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.label}</span>
                    {isActive && (
                        <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                    )}
                  </Link>
                );
              })}

            </div>

            <div className="flex items-center space-x-5">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all duration-200 ${isDarkMode
                  ? 'bg-gray-800 text-orange-400 hover:bg-gray-700'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications Bell */}
              {user && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`p-2 rounded-full relative transition-all duration-200 ${isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                      }`}
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-indigo-600">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                      }`}>
                      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50 border-gray-100'
                        }`}>
                        <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                        <Link
                          to={`/${role}/notifications`}
                          className="text-xs text-orange-500 hover:text-orange-400 font-semibold"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          View All
                        </Link>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((n) => (
                            <div
                              key={n.id}
                              className={`p-4 border-b last:border-0 cursor-pointer transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-50 hover:bg-blue-50'
                                } ${!n.read ? 'bg-orange-500/5' : ''}`}
                              onClick={() => {
                                markAsRead(n.id);
                                setIsNotificationsOpen(false);
                                navigate(`/${role}/notifications`);
                              }}
                            >
                              <div className="flex space-x-3">
                                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-orange-500' : 'bg-transparent'}`} />
                                <div className="space-y-1">
                                  <p className={`text-sm font-semibold leading-none ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {n.title}
                                  </p>
                                  <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {n.message}
                                  </p>
                                  <div className="flex items-center text-[10px] text-gray-400">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(n.timestamp || n.createdAt || n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2 opacity-20" />
                            <p className="text-sm text-gray-500">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && !['/login', '/register'].includes(location.pathname) ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-white hover:bg-opacity-20'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${isDarkMode ? 'border-orange-400' : 'border-white'
                      }`}>
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name || `${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800 text-orange-400' : 'bg-indigo-700 text-white'
                          }`}>
                          <span className="text-lg font-bold">
                            {user.firstName ? user.firstName.charAt(0) : (user.name ? user.name.charAt(0) : 'U')}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-white font-medium">
                      {user.name || (user.firstName && `${user.firstName} ${user.lastName}`)}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-white transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''
                      }`} />
                  </button>

                  {/* User dropdown */}
                  {isDropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-20 py-2 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
                      }`}>
                      {!(role === 'player' && !user?.organizationId) && (
                        <Link
                          to={`/${role}/notifications`}
                          className={`flex items-center px-4 py-2 text-sm hover:text-indigo-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                            }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          <span>Notifications</span>
                        </Link>
                      )}
                      {role !== 'player' && (
                        <Link
                          to="/register"
                          className={`flex items-center px-4 py-2 text-sm hover:text-indigo-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                            }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          <span>Register New Account</span>
                        </Link>
                      )}
                      <div className={`my-1 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-2 text-sm text-left text-red-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                          }`}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${isDarkMode
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                    : 'bg-white text-indigo-600 hover:bg-blue-50'
                    }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleTheme}
              className={`mr-3 p-2 rounded-full ${isDarkMode
                ? 'bg-gray-800 text-orange-400'
                : 'bg-white bg-opacity-20 text-white'
                }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg text-white ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-white hover:bg-opacity-20'
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
        <div className={`px-4 pt-2 pb-3 space-y-1 ${isDarkMode ? 'bg-gray-900' : 'bg-indigo-700'
          }`}>
          {/* User info on mobile */}
          {user && (
            <div className={`flex items-center px-3 py-3 mb-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-indigo-800'
              }`}>
              <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isDarkMode ? 'border-orange-400' : 'border-white'
                }`}>
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name || `${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700 text-orange-400' : 'bg-indigo-600 text-white'
                    }`}>
                    <span className="text-lg font-bold">
                      {user.firstName ? user.firstName.charAt(0) : (user.name ? user.name.charAt(0) : 'U')}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-white font-medium">
                  {user.name || (user.firstName && `${user.firstName} ${user.lastName}`)}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-indigo-200'}`}>
                  {user.email || "Account"}
                </p>
              </div>
            </div>
          )}

          {/* Role-specific navigation links */}
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${isActive
                  ? isDarkMode
                    ? 'bg-gray-800 text-orange-400'
                    : 'bg-white bg-opacity-20 text-white font-semibold'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                <span className="ml-2">{link.label}</span>
              </Link>
            );
          })}

          {!user && (
            <Link
              to="/login"
              className={`flex items-center justify-center px-3 py-3 rounded-lg font-medium ${isDarkMode
                ? 'bg-orange-500 text-gray-900 hover:bg-orange-400'
                : 'bg-white text-indigo-700 hover:bg-blue-50'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-5 w-5 mr-2" />
              <span>Sign In</span>
            </Link>
          )}

          {user && (
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center justify-center px-3 py-3 rounded-lg font-medium ${isDarkMode
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-red-600 hover:bg-red-50'
                }`}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 