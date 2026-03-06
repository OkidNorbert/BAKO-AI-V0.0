import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'player' // Default to player
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'team':
        case 'coach':
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Map frontend role to backend account_type
      const accountTypeMapping = {
        'player': 'personal',
        'team': 'team',
        'coach': 'coach'
      };

      const result = await register({
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
        account_type: accountTypeMapping[formData.accountType] || 'personal'
      });

      if (!result.success) {
        setError(result.error || 'Failed to register');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already logged in, don't render the registration form
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[#0f1115] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full space-y-10 p-10 sm:p-14 rounded-[3rem] glass-dark border border-white/5 relative z-10 shadow-2xl">
        <div className="text-center">
          <h2 className="text-5xl font-black text-white tracking-tighter mb-4">
            Create an Account
          </h2>
          <p className="text-lg font-bold text-gray-500">
            Join the <span className="text-orange-500 font-black">BAKO</span> basketball analytics platform.
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl font-bold text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Account Type Selection */}
            <div>
              <label htmlFor="accountType" className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                Account Type
              </label>
              <div className="px-4 py-1 rounded-2xl bg-white/5 border border-white/10">
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none text-white font-bold py-4 pr-8 focus:ring-0 appearance-none cursor-pointer outline-none"
                >
                  <option value="player" className="bg-gray-900">Personal Player</option>
                  <option value="coach" className="bg-gray-900">Team Coach</option>
                  <option value="team" className="bg-gray-900">Team Organization</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2 mt-2">
                {formData.accountType === 'team' ? 'Team Name' : 'Full Name'}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-5 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                placeholder={formData.accountType === 'team' ? "Enter team name" : "Enter your full name"}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2 mt-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full px-5 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2 mt-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none tracking-widest"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2 mt-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full px-5 py-4 rounded-2xl font-bold bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all outline-none tracking-widest"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-5 px-6 rounded-2xl text-white font-black text-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] ${isLoading ? 'bg-orange-500/50 cursor-not-allowed shadow-none' : 'bg-orange-500 hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:-translate-y-0.5'
                }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-sm font-bold text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-400 font-black tracking-wide underline-offset-4 hover:underline transition-all ml-1"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
