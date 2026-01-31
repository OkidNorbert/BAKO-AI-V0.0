import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosConfig';
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash,
  UserPlus,
  CheckCircle,
  XCircle,
  X,
  Shield,
  Users,
  Copy,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [modalRole, setModalRole] = useState('admin'); // 'admin' or 'coach'
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'coach',
    phoneNumber: '',
    address: '',
    // Additional fields for coachs
    specialties: '',
    certifications: '',
    experience: '',
    bio: ''
  });
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [registeredUserInfo, setRegisteredUserInfo] = useState(null);
  const [formError, setFormError] = useState('');
  const { isDarkMode } = useTheme();
  const { refreshAccessToken, logout, user } = useAuth();
  const navigate = useNavigate();

  // Function to generate a secure password
  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Generate a password on component mount and when needed
  useEffect(() => {
    if (useGeneratedPassword) {
      const newPassword = generateSecurePassword();
      setGeneratedPassword(newPassword);
      setNewUser(prev => ({...prev, password: newPassword}));
    }
  }, [useGeneratedPassword]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if we have an access token before making the request
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // Try to refresh token if no access token is available
        try {
          await refreshAccessToken();
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          setError('Your session has expired. Please login again.');
          logout();
          return;
        }
      }
      
      const response = await api.get('/admin/users?roles=coach,admin');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Handle token expiration
      if (error.response && error.response.status === 401) {
        try {
          // Try to refresh the token
          await refreshAccessToken();
          // If successful, retry the request
          const retryResponse = await api.get('/admin/users?roles=coach,admin');
          setUsers(retryResponse.data || []);
          return;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          setError('Your session has expired. Please login again.');
          logout();
          return;
        }
      } else {
        setError('Failed to fetch staff members. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Set up auto-refresh interval to check for new users every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchUsers();
    }, 30000); // 30 seconds
    
    // Clean up the interval when component unmounts
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Add a useEffect to check authentication status
  useEffect(() => {
    // If user is not authenticated, show error
    if (!user) {
      setError('You must be logged in to view this page.');
    }
  }, [user]);

  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const name = (user.name || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      name.includes(searchTermLower) ||
      email.includes(searchTermLower);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleStatusChange = async (userId, newStatus) => {
    // Ensure valid ID
    const validUserId = userId || (selectedUser && (selectedUser.id || selectedUser._id));
    
    if (!validUserId) {
      console.error('Cannot update status: User ID is undefined or invalid');
      toast.error('Failed to update user status: Invalid user ID');
      return;
    }
    
    try {
      await api.patch(`/admin/users/${validUserId}/status`, { status: newStatus });
      
      setUsers(users.map(user =>
        (user.id === validUserId || user._id === validUserId) ? { ...user, status: newStatus } : user
      ));
      
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status. Please try again later.');
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    // Get valid ID from either id or _id property
    const validUserId = userId || (selectedUser && (selectedUser.id || selectedUser._id));
    
    // Add validation to ensure userId exists and is valid
    if (!validUserId || typeof validUserId !== 'string') {
      console.error('Cannot delete user: User ID is undefined or invalid');
      toast.error('Failed to delete user: Invalid user ID');
      return;
    }
    
    // Add confirmation with user details
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${validUserId}`);
      setUsers(users.filter(user => (user.id !== validUserId && user._id !== validUserId)));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again later.');
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    // Ensure we capture both possible ID formats
    const userWithValidId = {
      ...user,
      id: user.id || user._id // Ensure we always have an id property
    };
    
    setSelectedUser(userWithValidId);
    const names = user.name ? user.name.split(' ') : ['', ''];
    
    setEditUserData({
      firstName: names[0] || '',
      lastName: names.slice(1).join(' ') || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || ''
    });
    
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    // Get valid ID from either id or _id property
    const validUserId = selectedUser.id || selectedUser._id;
    
    if (!validUserId) {
      toast.error('Invalid user ID. Cannot update user.');
      return;
    }
    
    try {
      const updatedUserData = {
        name: `${editUserData.firstName} ${editUserData.lastName}`.trim(),
        email: editUserData.email,
        phoneNumber: editUserData.phoneNumber,
        address: editUserData.address
      };
      
      await api.put(`/admin/users/${validUserId}`, updatedUserData);
      
      // Update the user in local state
      setUsers(users.map(user => 
        (user.id === validUserId || user._id === validUserId)
          ? { 
              ...user, 
              name: updatedUserData.name,
              email: updatedUserData.email,
              phoneNumber: updatedUserData.phoneNumber,
              address: updatedUserData.address
            } 
          : user
      ));
      
      setShowEditModal(false);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleResetPasswordClick = (user) => {
    setSelectedUser(user);
    setUseGeneratedPassword(true);
    const newPassword = generateSecurePassword();
    setGeneratedPassword(newPassword);
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      // Make sure we're using the correct ID field from the user object
      const userId = selectedUser.id || selectedUser._id;
      
      if (!userId) {
        toast.error('Invalid user ID. Cannot reset password.');
        return;
      }
      
      const response = await api.post(`/admin/users/${userId}/reset-password`, { 
        password: generatedPassword 
      });
      
      // Show success message and store info for display
      setRegisteredUserInfo({
        name: selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
        username: selectedUser.username || selectedUser.email,
        password: generatedPassword
      });
      
      setShowResetPasswordModal(false);
      setShowPasswordModal(true);
      toast.success('Password reset successfully');
      
      // Refresh the user list to show updated data
      fetchUsers();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleAddButtonClick = (role) => {
    if (role === 'coach') {
      // Redirect to the full coach registration page
      navigate('/admin/coach-registration');
    } else {
      // For admin, show the modal form
      setModalRole(role);
      
      // Generate a new password when opening the modal
      if (useGeneratedPassword) {
        const newPassword = generateSecurePassword();
        setGeneratedPassword(newPassword);
        setNewUser({
          ...newUser,
          role: role,
          password: newPassword
        });
      } else {
        setNewUser({
          ...newUser,
          role: role,
          password: ''
        });
      }
      
      setShowAddModal(true);
    }
  };

  const handlePasswordToggle = () => {
    setUseGeneratedPassword(!useGeneratedPassword);
    
    if (!useGeneratedPassword) {
      // Switching to generated password
      const newPassword = generateSecurePassword();
      setGeneratedPassword(newPassword);
      setNewUser(prev => ({...prev, password: newPassword}));
    } else {
      // Switching to manual password
      setNewUser(prev => ({...prev, password: ''}));
    }
  };

  const handleRegeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setGeneratedPassword(newPassword);
    setNewUser(prev => ({...prev, password: newPassword}));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      const response = await api.post('/admin/users', newUser);
      
      setUsers([...users, response.data]);
      
      // Store the registered user info for display
      setRegisteredUserInfo({
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password
      });
      
      // Show the password modal
      setShowPasswordModal(true);
      
      // Close the add user modal
      setShowAddModal(false);
      
      // Reset form for next use
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'coach',
        phoneNumber: '',
        address: '',
        specialties: '',
        certifications: '',
        experience: '',
        bio: ''
      });
    } catch (error) {
      console.error('Error adding user:', error);
      setFormError(error.response?.data?.message || 'Failed to add user. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100'
      }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading staff data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
      }`}>
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className={`px-6 py-3 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>User Account Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and manage user accounts for coachs and administrators
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleAddButtonClick('coach')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
                  : 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Create Coach Account</span>
            </button>
            <button
              onClick={() => handleAddButtonClick('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Add Admin</span>
            </button>
          </div>
        </div>
        
        {/* Information banner about activating coachs */}
        <div className={`border-l-4 p-4 mb-6 rounded-md ${
          isDarkMode 
            ? 'bg-blue-900/30 border-blue-700 text-blue-300' 
            : 'bg-blue-50 border-blue-500 text-blue-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-400'}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Important Notice</h3>
              <div className="mt-2 text-sm">
                <p>Coachs must be <strong>activated</strong> before they can be paid. Find any coach with "Pending" status and click the "Activate" button to enable them for payments.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className={`p-6 rounded-xl mb-6 shadow-md backdrop-blur-sm ${
          isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-full ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-gray-600'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className={`flex items-center px-3 py-2 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Filter size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className={`ml-2 bg-transparent border-none focus:ring-0 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  <option value="all" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>All Roles</option>
                  <option value="admin" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>Admin</option>
                  <option value="coach" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>Coach</option>
                </select>
              </div>
            </div>
            <div className="flex-1">
              <button
                onClick={fetchUsers}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Refresh user list"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className={`rounded-xl shadow-md overflow-hidden backdrop-blur-sm ${
          isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className={`${
                      isDarkMode 
                        ? 'hover:bg-gray-700 transition-colors' 
                        : 'hover:bg-gray-50 transition-colors'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            user.role === 'admin' 
                              ? isDarkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                              : isDarkMode ? 'bg-gradient-to-r from-green-600 to-teal-600' : 'bg-gradient-to-r from-green-500 to-teal-500'
                          }`}>
                            <span className="text-white font-medium">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{user.name}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {user.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                            : isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'Coach'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active'
                            ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleStatusChange(user.id || user._id, user.status === 'active' ? 'inactive' : 'active')}
                            className={`p-1.5 rounded-full transition-colors ${
                              user.status === 'active'
                                ? isDarkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-600 hover:bg-red-200'
                                : isDarkMode ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title={user.status === 'active' ? 'Deactivate account' : 'Activate account'}
                          >
                            {user.status === 'active' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className={`p-1.5 rounded-full transition-colors ${
                              isDarkMode
                                ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800'
                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                            }`}
                            title="Edit user details"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPasswordClick(user)}
                            className={`p-1.5 rounded-full transition-colors ${
                              isDarkMode
                                ? 'bg-amber-900 text-amber-300 hover:bg-amber-800'
                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                            }`}
                            title="Reset password"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id || user._id)}
                            className={`p-1.5 rounded-full transition-colors ${
                              isDarkMode
                                ? 'bg-gray-700 text-red-400 hover:bg-gray-600'
                                : 'bg-gray-100 text-red-500 hover:bg-gray-200'
                            }`}
                            title="Delete user"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-results">
                    <td colSpan="5" className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <Users className={`h-8 w-8 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className="text-sm">No staff members found matching your search criteria.</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterRole('all');
                          }}
                          className={`mt-2 text-sm ${
                            isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                          }`}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal - Enhanced UI */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full overflow-y-auto max-h-[90vh] shadow-2xl transform transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-purple-900/30' 
              : 'bg-white border border-purple-100'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${
                  isDarkMode 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600'
                }`}>
                  {modalRole === 'admin' ? 'Add New Administrator' : 'Create Coach Account'}
                </h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Fill in the details to create a new account
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {formError && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl shadow-md border border-red-200 animate-fade-in">
                {formError}
              </div>
            )}
            
            {modalRole === 'coach' && (
              <div className={`mb-6 p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/40 text-blue-200 border border-blue-800/30' : 'bg-blue-50 text-blue-800 border border-blue-100'}`}>
                <p className="text-sm">
                  <strong>Note:</strong> This form is for creating simple user accounts only. For complete coach registration with all details, please use the dedicated "Create Coach Account" option.
                </p>
              </div>
            )}
            
            <form onSubmit={handleAddUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                      isDarkMode
                        ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                        : 'bg-gray-50 border-purple-200 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-transparent'
                    }`}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                      isDarkMode
                        ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                        : 'bg-gray-50 border-purple-200 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-transparent'
                    }`}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                    isDarkMode
                      ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                      : 'bg-gray-50 border-purple-200 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-transparent'
                  }`}
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</label>
                  <div className="flex items-center">
                    <label className={`text-xs mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Auto-generate
                    </label>
                    <div 
                      onClick={handlePasswordToggle}
                      className={`relative inline-flex items-center h-5 rounded-full w-10 cursor-pointer transition-colors ease-in-out duration-200 ${
                        useGeneratedPassword 
                          ? isDarkMode ? 'bg-yellow-500' : 'bg-purple-500' 
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform rounded-full bg-white shadow-md transition ease-in-out duration-200 ${
                          useGeneratedPassword ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {useGeneratedPassword ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={newUser.password}
                      readOnly
                      className={`w-full px-4 py-2.5 pr-20 rounded-xl shadow-sm font-mono ${
                        isDarkMode
                          ? 'bg-gray-700/90 border-gray-600 text-white'
                          : 'bg-gray-50 border-purple-200 text-gray-900'
                      }`}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                      <button
                        type="button"
                        onClick={handleRegeneratePassword}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        }`}
                        title="Generate new password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newUser.password)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        }`}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                      isDarkMode
                        ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                        : 'bg-gray-50 border-purple-200 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-transparent'
                    }`}
                    placeholder="Enter password"
                  />
                )}
                <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {useGeneratedPassword 
                    ? "A secure password has been generated automatically." 
                    : "Create a strong password with at least 8 characters."}
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                  required
                  className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                    isDarkMode
                      ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                      : 'bg-gray-50 border-purple-200 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-transparent'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</label>
                <textarea
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                    isDarkMode
                      ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent'
                      : 'bg-gray-50 border-purple-200 text-gray-900 focus:ring-2 focus:ring-purple-400 focus:border-transparent'
                  }`}
                  rows="2"
                  placeholder="Enter address"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-5 py-2.5 rounded-full transition-all duration-200 transform hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
                    isDarkMode 
                      ? modalRole === 'admin'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800' 
                        : 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700'
                      : modalRole === 'admin'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700' 
                        : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
                  }`}
                >
                  {loading ? 'Creating...' : `Create ${modalRole === 'admin' ? 'Admin' : 'Coach'} Account`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && registeredUserInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">{registeredUserInfo.name ? 'Account Created Successfully' : 'Password Reset Successfully'}</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please save these credentials in a secure place. The password will only be shown once.
              </p>
            </div>
            
            <div className={`p-4 rounded-md mb-4 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Name:</p>
                <p>{registeredUserInfo.name}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Email:</p>
                <p>{registeredUserInfo.email}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Role:</p>
                <p className="capitalize">{registeredUserInfo.role}</p>
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Username (for login):</p>
                  <button
                    onClick={() => copyToClipboard(registeredUserInfo.username || registeredUserInfo.email)}
                    className={`p-1 rounded-md text-xs flex items-center ${
                      isDarkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                </div>
                <div className={`font-mono text-sm p-2 rounded ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
                }`}>
                  {registeredUserInfo.username || registeredUserInfo.email}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Password:</p>
                  <button
                    onClick={() => copyToClipboard(registeredUserInfo.password)}
                    className={`p-1 rounded-md text-xs flex items-center ${
                      isDarkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                </div>
                <div className={`font-mono text-sm p-2 rounded ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
                }`}>
                  {registeredUserInfo.password}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full overflow-y-auto max-h-[90vh] ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Edit {selectedUser.role === 'admin' ? 'Administrator' : 'Coach'} Details
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-1 rounded-md ${
                  isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={editUserData.firstName}
                    onChange={(e) => setEditUserData({...editUserData, firstName: e.target.value})}
                    required
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editUserData.lastName}
                    onChange={(e) => setEditUserData({...editUserData, lastName: e.target.value})}
                    required
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  required
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editUserData.phoneNumber}
                  onChange={(e) => setEditUserData({...editUserData, phoneNumber: e.target.value})}
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={editUserData.address}
                  onChange={(e) => setEditUserData({...editUserData, address: e.target.value})}
                  rows="3"
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reset Password</h2>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className={`p-1 rounded-md ${
                  isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                You are about to reset the password for: <strong>{selectedUser.name}</strong>
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className={`w-full px-3 py-2 pr-20 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newPassword = generateSecurePassword();
                        setGeneratedPassword(newPassword);
                      }}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-600 text-gray-300'
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedPassword)}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-600 text-gray-300'
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs mt-1 text-gray-500">
                  A secure password has been generated. You can regenerate it if needed.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 