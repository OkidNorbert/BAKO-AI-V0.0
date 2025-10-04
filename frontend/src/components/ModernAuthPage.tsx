import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const ModernAuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch real user count
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/stats/public/stats`);
      setTotalUsers(response.data.total_users || 0);
    } catch (error) {
      console.error('Error fetching user count:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, email.split('@')[0], 'player');
        showToast('Welcome to CourtVision AI! 🎉', 'success');
      } else {
        await login(email, password);
        showToast('Welcome back! 🏀', 'success');
      }
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
        (isSignUp ? 'Email already exists or invalid input' : 'Invalid email or password');
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-600 via-orange-500 to-blue-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="6" r="2"/>
                <circle cx="6" cy="9" r="2"/>
                <circle cx="18" cy="9" r="2"/>
                <circle cx="6" cy="15" r="2"/>
                <circle cx="18" cy="15" r="2"/>
                <circle cx="12" cy="18" r="2"/>
              </svg>
            </div>
            <span className="text-3xl font-bold text-white">CourtVision AI</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Transform Your Basketball Performance with AI
          </h1>
          
          <p className="text-xl text-white/90 mb-8">
            Join {totalUsers > 0 ? totalUsers.toLocaleString() : 'elite'} players using AI-powered analysis to improve their game
          </p>

          <div className="space-y-4">
            {[
              { icon: '🎬', text: 'AI-powered video analysis' },
              { icon: '⌚', text: 'Wearable device integration' },
              { icon: '📊', text: 'Real-time performance tracking' },
              { icon: '💪', text: 'Personalized training plans' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 text-white/90">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-xl">
                  {feature.icon}
                </div>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/70 text-sm">
          <p>Trusted by basketball players and coaches worldwide</p>
          {totalUsers > 0 && (
            <p className="mt-2">
              <span className="font-semibold text-white">{totalUsers}</span> active users and growing
            </p>
          )}
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
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
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              CourtVision AI
            </span>
          </div>

          <div className="mb-8">
            <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {isSignUp 
                ? 'Start improving your game today' 
                : 'Continue your basketball journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              {isSignUp && (
                <p className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                loading ? 'cursor-wait' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create account' : 'Continue'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
              }}
              className={`mt-4 w-full py-3 px-4 ${
                darkMode 
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
                  : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
              } font-semibold rounded-lg transition-all`}
            >
              {isSignUp ? 'Sign in instead' : 'Create account'}
            </button>
          </div>

          <p className={`mt-8 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-orange-600 hover:text-orange-700 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
