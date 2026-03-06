import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
        case 'coach':
          if (user.organizationId) {
            navigate('/team');
          } else {
            navigate('/coach');
          }
          break;
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
    <div className="min-h-screen flex bg-[#0f1115] text-white">
      {/* Left Side: Illustration / Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-[#0f1115]/90 z-10" />
        <img
          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop"
          alt="Basketball backdrop"
          className="absolute inset-0 w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[10000ms]"
        />

        <div className="relative z-20 flex flex-col items-start justify-end p-16 pb-24 h-full w-full">
          <h2 className="text-6xl font-black mb-6 tracking-tighter leading-none text-white">
            Elevate Your <span className="text-orange-500">Game.</span>
          </h2>
          <p className="text-xl text-gray-400 font-bold max-w-md">
            AI-Powered Basketball Skill and Performance Analysis for Teams and Players.
          </p>
        </div>

        {/* Floating Accent Shapes */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
        {/* Subtle glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full space-y-10 relative z-10">
          <div className="text-left">
            <h2 className="text-5xl font-black mb-3 text-white tracking-tighter">
              Welcome Back
            </h2>
            <p className="text-lg font-bold text-gray-500">
              Sign in to your dashboard to track your latest games.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center space-x-3 backdrop-blur-sm animate-in zoom-in-95">
                <Shield className="h-5 w-5" />
                <p className="font-bold text-sm tracking-wide">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-[10px] font-black mb-2 uppercase tracking-widest text-gray-500">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-5 pr-12 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                    placeholder="name@example.com"
                  />
                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-orange-500 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Password
                  </label>
                  <a href="#" className="text-[10px] font-black text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest">
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
                    className="block w-full pl-5 pr-12 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none tracking-widest"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-600 group-focus-within:text-orange-500 transition-colors">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-5 px-6 rounded-2xl text-white font-black text-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] ${isLoading ? 'bg-orange-500/50 cursor-not-allowed shadow-none' : 'bg-orange-500 hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:-translate-y-0.5'
                }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  SIGN IN TO BAKO
                  <ArrowRight className="h-5 w-5 ml-3" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm font-bold text-gray-500">
              New to BAKO?{' '}
              <Link to="/register" className="text-orange-500 hover:text-orange-400 font-black tracking-wide underline-offset-4 hover:underline transition-all ml-1">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
