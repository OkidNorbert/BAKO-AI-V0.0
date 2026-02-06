import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { Bell, Calendar, User, Home, FileText, Trophy, Sun, Moon, ChevronDown, LogOut, Video, TrendingUp } from 'lucide-react';
import BasketballLogo from '../BasketballLogo';

const Navbar = ({ role }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role-specific navigation links
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
      case 'team':
        return [
          { to: '/team', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
          { to: '/team/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
          { to: '/team/notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications' }
        ];
      case 'player':
        return [
          { to: '/player', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
          { to: '/player/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
          { to: '/player/training', icon: <Video className="h-5 w-5" />, label: 'Training Videos' },
          { to: '/player/skills', icon: <TrendingUp className="h-5 w-5" />, label: 'Skill Analytics' },
          { to: '/player/notifications', icon: <Bell className="h-5 w-5" />, label: 'Notifications' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900 shadow-xl'
      : 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg'
      }`}>
      {/* Decorative border */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className={`p-1 rounded-full transition-all duration-300 transform group-hover:scale-110 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                <BasketballLogo className={`h-10 w-10`} color={isDarkMode ? '#FB923C' : '#4F46E5'} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">BAKO</span>
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-blue-100'}`}>Basketball Analytics</span>
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
                    className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-white ${isActive
                      ? isDarkMode ? 'bg-gray-800 text-yellow-300' : 'bg-white bg-opacity-20 font-semibold'
                      : 'hover:bg-white hover:bg-opacity-20'
                      }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.label}</span>
                  </Link>
                );
              })}
              {/* Always show Home link for easy exit from dashboard */}
              <Link
                to="/"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-white hover:bg-white hover:bg-opacity-20`}
              >
                <Home className="h-5 w-5" />
                <span className="ml-2">Landing Page</span>
              </Link>
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

              {user ? (
                <div className="relative">
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
                      <Link
                        to={`/${role}/profile`}
                        className={`flex items-center px-4 py-2 text-sm hover:text-indigo-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                          }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        <span>Your Profile</span>
                      </Link>
                      <Link
                        to={`/${role}/notifications`}
                        className={`flex items-center px-4 py-2 text-sm hover:text-indigo-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                          }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        <span>Notifications</span>
                      </Link>
                      <Link
                        to="/register"
                        className={`flex items-center px-4 py-2 text-sm hover:text-indigo-600 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                          }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        <span>Register New Account</span>
                      </Link>
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
                  {user.email || "Staff Member"}
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
              <span>Staff Login</span>
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