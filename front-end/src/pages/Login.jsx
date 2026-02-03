import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Baby, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'team':
          navigate('/team');
          break;
        case 'player':
          navigate('/player');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to login');
      } else {
        // Force navigation based on role
        const userRole = result.user?.role || 'user';
        switch (userRole) {
          case 'team':
            navigate('/team');
            break;
          case 'player':
            navigate('/player');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // If users are already logged in, don't render the login form
  if (user) {
    return null;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white'
        : 'bg-gradient-to-b from-blue-100 to-purple-100 text-gray-900'
      }`}>
      <div className="max-w-md w-full space-y-8">
        <div className={`relative p-8 rounded-3xl shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-300 rounded-full opacity-30"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-pink-400 rounded-full opacity-30"></div>

          <div className="text-center relative z-10">
            <div className="mx-auto h-24 w-24 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl mb-5 flex items-center justify-center shadow-lg">
              <Baby className="h-14 w-14 text-white" />
            </div>

            <h2 className={`text-3xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Welcome to Daystar!
            </h2>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Sign in to nurture bright futures together
            </p>
          </div>

          <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg animate-bounce-in">
                <p className="font-medium">Oops!</p>
                <p>{error}</p>
              </div>
            )}

            <div className="rounded-md -space-y-px">
              <div className="mb-5">
                <label htmlFor="email" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl shadow-sm focus:outline-none ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl shadow-sm focus:outline-none ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg font-semibold transition-all duration-150 transform hover:scale-105"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
              For admin account access, please contact the system administrator
            </p>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
            <div className="w-8 h-8 bg-green-300 rounded-full opacity-30"></div>
          </div>
          <div className="absolute top-1/4 right-0 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-blue-300 rounded-full opacity-30"></div>
          </div>
          <div className="absolute bottom-1/4 right-0 transform translate-x-1/2">
            <div className="w-10 h-10 bg-purple-300 rounded-full opacity-30"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 