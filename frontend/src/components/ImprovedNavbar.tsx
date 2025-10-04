import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const ImprovedNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getNavLinkClass = (path: string) => {
    const baseClass = 'px-4 py-2 rounded-lg font-medium transition-all';
    if (isActive(path)) {
      return `${baseClass} ${darkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700'}`;
    }
    return `${baseClass} ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`;
  };

  // Public navigation (when not logged in)
  const publicNav = (
    <nav className={`${darkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white'} shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="6" r="2"/>
                <circle cx="6" cy="9" r="2"/>
                <circle cx="18" cy="9" r="2"/>
                <circle cx="6" cy="15" r="2"/>
                <circle cx="18" cy="15" r="2"/>
                <circle cx="12" cy="18" r="2"/>
              </svg>
            </div>
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent'}`}>
              CourtVision AI
            </span>
          </Link>

          {/* Public Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`${darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'} font-medium transition-colors`}>
              Home
            </Link>
            <Link to="#features" className={`${darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'} font-medium transition-colors`}>
              Features
            </Link>
            <Link to="/pricing" className={`${darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'} font-medium transition-colors`}>
              Pricing
            </Link>
            <Link to="/about" className={`${darkMode ? 'text-gray-300 hover:text-orange-400' : 'text-gray-700 hover:text-orange-600'} font-medium transition-colors`}>
              About
            </Link>
          </div>

          {/* Auth Buttons & Dark Mode */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link
              to="/login"
              className="hidden md:inline-block px-6 py-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );

  // User portal navigation (when logged in)
  const userNav = (
    <nav className={`${darkMode ? 'bg-gray-900 border-b-2 border-orange-500' : 'bg-white border-b-2 border-orange-600'} shadow-lg`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="6" r="2"/>
                <circle cx="6" cy="9" r="2"/>
                <circle cx="18" cy="9" r="2"/>
                <circle cx="6" cy="15" r="2"/>
                <circle cx="18" cy="15" r="2"/>
                <circle cx="12" cy="18" r="2"/>
              </svg>
            </div>
            <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              CourtVision AI
            </span>
          </Link>

          {/* User Portal Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/dashboard" className={getNavLinkClass('/dashboard')}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </div>
            </Link>

            <Link to="/upload" className={getNavLinkClass('/upload')}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload</span>
              </div>
            </Link>

            <Link to="/wearables" className={getNavLinkClass('/wearables')}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Wearables</span>
              </div>
            </Link>

            <Link to="/training" className={getNavLinkClass('/training')}>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Training</span>
              </div>
            </Link>

            <Link to="/live" className={getNavLinkClass('/live')}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </Link>
          </div>

          {/* Dark Mode & User Profile Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{user?.role}</p>
              </div>
              <svg
                className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className={`absolute right-0 mt-2 w-56 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-xl border py-2 z-50`}>
                <Link
                  to={`/players/${user?.id}`}
                  className={`flex items-center px-4 py-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  className={`flex items-center px-4 py-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Settings</span>
                </Link>

                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-2`}></div>

                <button
                  onClick={handleLogout}
                  className={`flex items-center w-full px-4 py-3 ${darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} transition-colors text-left`}
                >
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-red-600 font-medium">Logout</span>
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/upload"
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Upload Video
              </Link>
              <Link
                to="/wearables"
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Wearables
              </Link>
              <Link
                to="/training"
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Training
              </Link>
              <Link
                to="/live"
                className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Live Session
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );

  // Show appropriate navbar based on auth state
  return user ? userNav : publicNav;
};
