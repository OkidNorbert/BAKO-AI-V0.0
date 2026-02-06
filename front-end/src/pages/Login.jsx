import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, Mail, Shield } from 'lucide-react';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, bypassLogin } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user) {
      // Redirect based on user role if already logged in
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

  // If users are already logged in, skip the form
  if (user) {
    return null;
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left Side: Illustration / Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 z-10"></div>
        <img
          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop"
          alt="Basketball backdrop"
          className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-10000"
        />

        <div className="relative z-20 flex flex-col items-start justify-end p-16 pb-24 text-white h-full w-full">
          {/* Branding removed as per request */}
          <h2 className="text-5xl font-medium mb-4 tracking-tight leading-none uppercase">
            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Game.</span>
          </h2>
          <p className="text-xl text-gray-200 max-w-md font-medium">
            AI-Powered Basketball Skill and Performance Analysis for Teams and Players.
          </p>

          {/* Est. text removed as per request */}
        </div>

        {/* Floating Accent Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center p-8 sm:p-12 lg:p-16 pt-2 lg:pt-4">
        <div className="max-w-md w-full space-y-8 animate-fade-in-up">
          <div className="text-left">
            {/* Mobile branding removed as per request */}

            <h2 className={`text-4xl font-medium mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome Back
            </h2>
            <p className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in to your dashboard to track your latest games.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-2xl flex items-center space-x-3 animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="font-semibold text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className={`block text-xs font-medium mb-1 uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full px-5 py-3.5 rounded-2xl font-medium transition-all duration-200 outline-none border-2 ${isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-600 placeholder-gray-400'
                      }`}
                    placeholder="name@example.com"
                  />
                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className={`block text-xs font-medium uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Password
                  </label>
                  <a href="#" className="text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-widest leading-none">
                    Forgot?
                  </a>
                </div>
                <div className="relative group">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full px-5 py-3.5 rounded-2xl font-medium transition-all duration-200 outline-none border-2 ${isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500 placeholder-gray-500'
                      : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-600 placeholder-gray-400'
                      }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-4 px-6 rounded-2xl text-white font-medium text-lg shadow-xl transform transition duration-200 hover:scale-[1.02] active:scale-[0.98] ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/25'
                }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  SIGN IN TO BAKO
                  <ArrowRight className="h-6 w-6 ml-3" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 space-y-4">
            <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              New to BAKO?{' '}
              <Link to="/register" className="text-indigo-500 hover:text-indigo-400 font-bold decoration-2 underline-offset-4 hover:underline transition-all">
                Create an account
              </Link>
            </p>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <span className={`block text-xs font-bold uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Developer Access
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => bypassLogin('team')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 text-orange-400 hover:bg-gray-800 hover:border-orange-500/50'
                    : 'bg-white border-gray-200 text-orange-600 hover:bg-gray-50 hover:border-orange-300'}`}
                >
                  Team Login
                </button>
                <button
                  onClick={() => bypassLogin('player')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 text-indigo-400 hover:bg-gray-800 hover:border-indigo-500/50'
                    : 'bg-white border-gray-200 text-indigo-600 hover:bg-gray-50 hover:border-indigo-300'}`}
                >
                  Player Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 