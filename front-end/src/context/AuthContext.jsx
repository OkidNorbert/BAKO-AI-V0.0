import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '@/utils/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('AuthContext: Initial mount effect running');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    const userId = localStorage.getItem('userId');

    console.log('AuthContext: Initial state from localStorage:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      userRole,
      userName,
      userId
    });

    if (accessToken && userRole) {
      const userData = {
        role: userRole,
        name: userName || 'User',
        id: userId
      };
      console.log('AuthContext: Setting initial user state:', userData);
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext: Login attempt for:', email);
    // Clear dev session flag on real login
    localStorage.removeItem('isDevSession');
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('AuthContext: Login response:', response.data);

      if (response.data && response.data.accessToken) {
        const { accessToken, refreshToken } = response.data;
        // Extract user info from JWT token
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const userRole = tokenPayload.user?.role || tokenPayload.role;
        const userId = tokenPayload.user?.id || response.data.user?.id;
        const userName = response.data.user?.name || 'User';

        console.log('AuthContext: Extracted user info:', {
          userRole,
          userName,
          userId
        });

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userId', userId);

        // Set user state immediately
        const userData = {
          role: userRole,
          name: userName,
          id: userId,
          email: response.data.user?.email
        };
        console.log('AuthContext: Setting user state after login:', userData);
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        console.log('AuthContext: Login failed - no token received');
        return {
          success: false,
          error: 'No token received from server'
        };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.message || 'An error occurred during login'
      };
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', userData);
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userRole', user.role || 'player');
      localStorage.setItem('userName', user.name || 'User');
      localStorage.setItem('userId', user.id);

      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('isDevSession'); // Clear dev session flag
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const bypassLogin = (role) => {
    const mockUser = {
      role: role,
      name: role === 'team' ? 'Dev Team' : 'Dev Player',
      id: 'dev-id-' + Math.random().toString(36).substr(2, 9),
      email: `dev-${role}@example.com`
    };

    // Set dev session flag to suppress network error popups
    localStorage.setItem('isDevSession', 'true');

    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      user: mockUser,
      role: role,
      id: mockUser.id,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    }));
    const signature = "fake-signature";
    const fakeToken = `${header}.${payload}.${signature}`;

    localStorage.setItem('accessToken', fakeToken);
    localStorage.setItem('refreshToken', 'dev-refresh-token');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', mockUser.name);
    localStorage.setItem('userId', mockUser.id);

    setUser(mockUser);
    setIsAuthenticated(true);

    return { success: true, user: mockUser };
  };

  const value = {
    user,
    loading,
    isRefreshing,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    bypassLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;