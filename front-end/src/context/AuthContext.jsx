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
    const staffRole = localStorage.getItem('staffRole');

    console.log('AuthContext: Initial state from localStorage:', {
      userRole,
      userName,
      userId,
      organizationId: localStorage.getItem('organizationId'),
      staffRole
    });

    if (accessToken && userRole) {
      const userData = {
        role: userRole,
        name: userName || 'User',
        id: userId,
        organizationId: localStorage.getItem('organizationId'),
        staffRole
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
        const { accessToken, refreshToken, user: backendUser } = response.data;

        // Extract info from token as fallback/sync
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));

        // Map backend user to frontend expectations
        const userData = {
          id: backendUser?.id || tokenPayload.sub,
          email: backendUser?.email || tokenPayload.email,
          role: (backendUser?.accountType || tokenPayload.accountType) === 'personal' ? 'player' : (backendUser?.accountType || tokenPayload.accountType),
          name: backendUser?.fullName || 'User',
          organizationId: backendUser?.organizationId || tokenPayload.organizationId,
          staffRole: backendUser?.staffRole || backendUser?.staff_role || tokenPayload.staffRole || tokenPayload.staff_role, // Added
          teamId: backendUser?.teamId || backendUser?.team_id
        };

        console.log('AuthContext: Login successful, mapped user:', userData);

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userId', userData.id);
        if (userData.organizationId) {
          localStorage.setItem('organizationId', userData.organizationId);
        }
        if (userData.staffRole) { // Added
          localStorage.setItem('staffRole', userData.staffRole); // Added
        }

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
      console.log('AuthContext: Registering with data:', userData);
      const response = await api.post('/auth/register', userData);
      const { accessToken, refreshToken, user: backendUser } = response.data;

      // Map backend fields to frontend expected ones
      const user = {
        ...backendUser,
        role: backendUser.accountType === 'personal' ? 'player' : backendUser.accountType,
        name: backendUser.fullName || 'User',
        staffRole: backendUser.staffRole || backendUser.staff_role // Added
      };

      console.log('AuthContext: Registration successful, mapped user:', user);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userId', user.id);
      if (user.organizationId) {
        localStorage.setItem('organizationId', user.organizationId);
      }
      if (user.staffRole) { // Added
        localStorage.setItem('staffRole', user.staffRole); // Added
      }

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

  const updateUser = async (updateData) => {
    try {
      setLoading(true);
      console.log('AuthContext: Updating user with data:', updateData);

      const response = await api.put('/auth/me', updateData);

      // If team data is present and we are a team, also update organization
      if (updateData.team && user.role === 'team') {
        const teamData = {
          name: updateData.team.name,
          logo_url: updateData.team.logoUrl,
          primary_color: updateData.team.primaryColor,
          secondary_color: updateData.team.secondaryColor,
          jersey_style: updateData.team.jerseyStyle
        };
        await api.put('/admin/organization', teamData);
      }

      const updatedUser = {
        ...user,
        ...response.data,
        name: response.data.full_name || user.name
      };

      setUser(updatedUser);
      localStorage.setItem('userName', updatedUser.name);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('AuthContext: Update user error:', error);
      return { success: false, error: error.response?.data?.message || 'Update failed' };
    } finally {
      setLoading(false);
    }
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
    bypassLogin,
    updateUser
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