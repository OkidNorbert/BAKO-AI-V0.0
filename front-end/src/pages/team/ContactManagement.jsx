import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, X, Check, RefreshCw, User, Users, Download, MessageSquare, UserPlus, Baby } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const GuardianManagement = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [children, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [currentGuardian, setCurrentGuardian] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    relationship: '',
  });

  // Fetch guardians on component mount
  useEffect(() => {
    fetchGuardians();
    fetchAllPlayers();
  }, []);

  const fetchGuardians = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/guardians');
      const guardiansData = response.data;
      
      // For each guardian, fetch their children
      for (const guardian of guardiansData) {
        try {
          const childrenResponse = await api.get(`/guardians/${guardian._id}/children`);
          guardian.children = childrenResponse.data || [];
        } catch (err) {
          console.error(`Error fetching children for guardian ${guardian._id}:`, err);
          guardian.children = [];
        }
      }
      
      setGuardians(guardiansData);
    } catch (err) {
      console.error('Error fetching guardians:', err);
      setError('Failed to fetch guardians. Please try again.');
      toast.error('Failed to fetch guardians');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlayers = async () => {
    try {
      const response = await api.get('/admin/children');
      setAllPlayers(response.data);
    } catch (err) {
      console.error('Error fetching all children:', err);
      toast.error('Failed to fetch children');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const openAddModal = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      relationship: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (guardian) => {
    setCurrentGuardian(guardian);
    setFormData({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      phone: guardian.phone || '',
      address: guardian.address || '',
      emergencyContact: guardian.emergencyContact || '',
      emergencyPhone: guardian.emergencyPhone || '',
      relationship: guardian.relationship || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (guardian) => {
    setCurrentGuardian(guardian);
    setIsDeleteModalOpen(true);
  };

  const openResetModal = (guardian) => {
    setCurrentGuardian(guardian);
    setIsResetModalOpen(true);
  };

  const openPlayersModal = (guardian) => {
    setCurrentGuardian(guardian);
    setPlayers(guardian.children || []);
    setIsPlayersModalOpen(true);
  };

  const handleAssignPlayers = async (playerIds) => {
    setLoading(true);
    try {
      await api.post(`/guardians/${currentGuardian._id}/children`, { playerIds });
      toast.success('Players updated successfully');
      setIsPlayersModalOpen(false);
      
      // Update the guardian in the local state with the new children
      const updatedGuardians = guardians.map(guardian => {
        if (guardian._id === currentGuardian._id) {
          return {
            ...guardian,
            children: children // Use the children array from the state
          };
        }
        return guardian;
      });
      
      setGuardians(updatedGuardians);
      
      // Also fetch fresh data to ensure everything is up to date
      fetchGuardians();
    } catch (err) {
      console.error('Error assigning children:', err);
      toast.error(err.response?.data?.message || 'Failed to update children');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    setLoading(true);
    try {
      await api.delete(`/guardians/${currentGuardian._id}/children/${playerId}`);
      toast.success('Player removed successfully');
      
      // Update the children array in the current guardian
      const updatedPlayers = children.filter(player => player._id !== playerId);
      setPlayers(updatedPlayers);
      
      // Update the guardian in the local state
      const updatedGuardians = guardians.map(guardian => {
        if (guardian._id === currentGuardian._id) {
          return {
            ...guardian,
            children: updatedPlayers
          };
        }
        return guardian;
      });
      
      setGuardians(updatedGuardians);
      
      // Also fetch fresh data
      fetchGuardians();
    } catch (err) {
      console.error('Error removing player:', err);
      toast.error(err.response?.data?.message || 'Failed to remove player');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/guardians', formData);
      toast.success('Guardian added successfully');
      setIsAddModalOpen(false);
      fetchGuardians();
    } catch (err) {
      console.error('Error adding guardian:', err);
      toast.error(err.response?.data?.message || 'Failed to add guardian');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGuardian = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/guardians/${currentGuardian._id}`, formData);
      toast.success('Guardian updated successfully');
      setIsEditModalOpen(false);
      fetchGuardians();
    } catch (err) {
      console.error('Error updating guardian:', err);
      toast.error(err.response?.data?.message || 'Failed to update guardian');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuardian = async () => {
    setLoading(true);
    try {
      await api.delete(`/guardians/${currentGuardian._id}`);
      toast.success('Guardian deleted successfully');
      setIsDeleteModalOpen(false);
      fetchGuardians();
    } catch (err) {
      console.error('Error deleting guardian:', err);
      toast.error(err.response?.data?.message || 'Failed to delete guardian');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCredentials = async () => {
    setLoading(true);
    try {
      await api.post(`/guardians/${currentGuardian._id}/reset-password`, {});
      toast.success('Credentials reset successfully');
      setIsResetModalOpen(false);
    } catch (err) {
      console.error('Error resetting credentials:', err);
      toast.error(err.response?.data?.message || 'Failed to reset credentials');
    } finally {
      setLoading(false);
    }
  };

  const filteredGuardians = guardians.filter(guardian => {
    if (!searchTerm.trim()) return true;
    
    const fullName = `${guardian.firstName} ${guardian.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      fullName.includes(searchLower) || 
      (guardian.email && guardian.email.toLowerCase().includes(searchLower)) ||
      (guardian.phone && guardian.phone.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-purple-950' 
        : 'bg-gradient-to-b from-blue-100 to-purple-100'
    }`}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
        <div className={`w-24 h-24 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'} rounded-full absolute top-20 left-10 opacity-20 animate-float-slow`}></div>
        <div className={`w-16 h-16 ${isDarkMode ? 'bg-pink-600' : 'bg-pink-400'} rounded-full absolute top-40 right-20 opacity-20 animate-float-medium`}></div>
        <div className={`w-20 h-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'} rounded-full absolute bottom-20 left-1/4 opacity-20 animate-float-fast`}></div>
      </div>

      {/* Header Section */}
      <div className="relative pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8`}>
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${
              isDarkMode 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500'
            } animate-gradient`}>
              Guardian Management
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-800'} text-lg`}>
              Manage guardians and their children
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={openAddModal}
              className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              } transition duration-150 ease-in-out`}
            >
              <UserPlus size={18} /> Add New Guardian
            </button>
          </div>
        </div>
        
        {/* Search bar */}
        <div className={`relative mb-8 p-6 rounded-xl shadow-md ${
          isDarkMode 
            ? 'bg-gray-800/60 border border-gray-700' 
            : 'bg-white/90 border border-gray-200'
        }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search guardians by name, email or phone..."
              className={`pl-10 pr-4 py-3 border rounded-lg w-full ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-white border-gray-300 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading guardians data...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className={`border-l-4 p-4 mb-6 rounded ${
            isDarkMode ? 'bg-red-900/50 border-red-700 text-red-100' : 'bg-red-50 border-red-500 text-red-700'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <X size={20} className="mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Guardian Table */}
        <div className={`relative overflow-hidden rounded-xl shadow-md ${
          isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/90 border border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Players</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {filteredGuardians.length > 0 ? (
                  filteredGuardians.map((guardian) => (
                    <tr key={guardian._id} className={`${
                      isDarkMode 
                        ? 'hover:bg-gray-700/50 transition-colors' 
                        : 'hover:bg-gray-50 transition-colors'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode 
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}>
                            <span className="text-white font-medium">
                              {guardian.firstName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {guardian.firstName} {guardian.lastName}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {guardian.relationship || 'Guardian'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {guardian.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {guardian.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDarkMode
                              ? 'bg-indigo-900 text-indigo-200'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {guardian.children?.length || 0} children
                          </div>
                          <button
                            onClick={() => openPlayersModal(guardian)}
                            className={`ml-2 p-1.5 rounded-full ${
                              isDarkMode 
                                ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' 
                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                            }`}
                            title="Manage Players"
                          >
                            <Baby size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(guardian)}
                            className={`p-1.5 rounded-full ${
                              isDarkMode 
                                ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' 
                                : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
                            }`}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(guardian)}
                            className={`p-1.5 rounded-full ${
                              isDarkMode 
                                ? 'bg-gray-700 text-red-300 hover:bg-gray-600' 
                                : 'bg-gray-100 text-red-600 hover:bg-gray-200'
                            }`}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => openResetModal(guardian)}
                            className={`p-1.5 rounded-full ${
                              isDarkMode 
                                ? 'bg-gray-700 text-amber-300 hover:bg-gray-600' 
                                : 'bg-gray-100 text-amber-600 hover:bg-gray-200'
                            }`}
                            title="Reset Password"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className={`px-6 py-10 text-center text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className="flex flex-col items-center">
                        <Users className={`h-8 w-8 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p>{searchTerm ? 'No guardians match your search criteria.' : 'No guardians found.'}</p>
                        {searchTerm && (
                          <button
                            onClick={clearSearch}
                            className={`mt-2 text-sm ${
                              isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                            }`}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Guardian Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Guardian"
      >
        <form onSubmit={handleAddGuardian} className="space-y-6">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Fields marked with an asterisk (*) are required.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    First Name*
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Name*
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Contact">Contact</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandcontact">Grandcontact</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Adding...' : 'Add Guardian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Guardian Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Guardian"
      >
        <form onSubmit={handleEditGuardian} className="space-y-6">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Fields marked with an asterisk (*) are required.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    First Name*
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Last Name*
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone*
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Contact">Contact</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandcontact">Grandcontact</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Updating...' : 'Update Guardian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Guardian Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Guardian"
      >
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center mb-4">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-900' : 'bg-red-100'}`}>
              <Trash2 className={`h-6 w-6 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} />
            </div>
            <h3 className={`ml-3 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Confirm Deletion
            </h3>
          </div>
          
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Are you sure you want to delete <span className="font-medium">{currentGuardian?.firstName} {currentGuardian?.lastName}</span>? This action cannot be undone.
          </p>
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Any children currently associated with this guardian will need to be reassigned.
          </p>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGuardian}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Deleting...' : 'Delete Guardian'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Credentials Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Credentials"
      >
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="flex items-center mb-4">
            <div className={`p-2 rounded-full ${isDarkMode ? 'bg-amber-900' : 'bg-amber-100'}`}>
              <RefreshCw className={`h-6 w-6 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`} />
            </div>
            <h3 className={`ml-3 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Reset User Credentials
            </h3>
          </div>
          
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Are you sure you want to reset the login credentials for <span className="font-medium">{currentGuardian?.firstName} {currentGuardian?.lastName}</span>?
          </p>
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            A new temporary password will be generated and sent to their email address ({currentGuardian?.email}).
          </p>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleResetCredentials}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-amber-600 text-white hover:bg-amber-700' 
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Resetting...' : 'Reset Credentials'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Players Management Modal */}
      <Modal
        isOpen={isPlayersModalOpen}
        onClose={() => setIsPlayersModalOpen(false)}
        title={`Players for ${currentGuardian?.firstName} ${currentGuardian?.lastName}`}
      >
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="space-y-6">
            {/* Current children section */}
            <div>
              <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Assigned Players
              </h3>
              {children && children.length > 0 ? (
                <div className="space-y-3">
                  {children.map(player => (
                    <div key={player._id} className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          player.gender === 'female'
                            ? isDarkMode ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-gradient-to-r from-pink-500 to-purple-500'
                            : isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}>
                          <span className="text-white font-medium">
                            {player.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {player.firstName} {player.lastName}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {player.dateOfBirth 
                              ? `${new Date(player.dateOfBirth).toLocaleDateString()} (${new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} yrs)` 
                              : 'No DOB'
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player._id)}
                        className={`p-1.5 rounded-full ${
                          isDarkMode 
                            ? 'bg-gray-600 text-red-300 hover:bg-gray-500' 
                            : 'bg-gray-100 text-red-500 hover:bg-red-100'
                        }`}
                        title="Remove player"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center p-6 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <Baby className={`h-12 w-12 mx-auto mb-3 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No children assigned to this guardian yet.
                  </p>
                </div>
              )}
            </div>

            {/* Add children section */}
            <div>
              <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Add Players
              </h3>
              <div className="mb-4">
                <select
                  id="playerSelect"
                  className={`block w-full rounded-md shadow-sm py-2 px-3 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const selectedPlayer = allPlayers.find(c => c._id === e.target.value);
                    if (selectedPlayer && !children.some(c => c._id === selectedPlayer._id)) {
                      setPlayers([...children, selectedPlayer]);
                    }
                    e.target.value = ''; // Reset select after selection
                  }}
                >
                  <option value="">Select a player to add</option>
                  {allPlayers
                    .filter(player => !children.some(c => c._id === player._id))
                    .map(player => (
                      <option key={player._id} value={player._id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsPlayersModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAssignPlayers(children.map(c => c._id))}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              } disabled:opacity-50`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GuardianManagement; 