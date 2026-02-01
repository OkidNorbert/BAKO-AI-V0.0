import React, { useState, useEffect } from 'react';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { Search, Plus, Edit2, Trash2, X, Check, RefreshCw, User, Users, Download, MessageSquare, UserPlus } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const ContactManagement = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [currentContact, setCurrentContact] = useState(null);
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

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
    fetchAllPlayers();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/contacts');
      const contactsData = response.data;

      // For each contact, fetch their players
      for (const contact of contactsData) {
        try {
          const playersResponse = await api.get(`/contacts/${contact._id}/players`);
          contact.players = playersResponse.data || [];
        } catch (err) {
          console.error(`Error fetching players for contact ${contact._id}:`, err);
          contact.players = [];
        }
      }

      setContacts(contactsData);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to fetch contacts. Please try again.');
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlayers = async () => {
    try {
      const response = await api.get('/admin/players');
      setAllPlayers(response.data);
    } catch (err) {
      console.error('Error fetching all players:', err);
      toast.error('Failed to fetch players');
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

  const openEditModal = (contact) => {
    setCurrentContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      address: contact.address || '',
      emergencyContact: contact.emergencyContact || '',
      emergencyPhone: contact.emergencyPhone || '',
      relationship: contact.relationship || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (contact) => {
    setCurrentContact(contact);
    setIsDeleteModalOpen(true);
  };

  const openResetModal = (contact) => {
    setCurrentContact(contact);
    setIsResetModalOpen(true);
  };

  const openPlayersModal = (contact) => {
    setCurrentContact(contact);
    setPlayers(contact.players || []);
    setIsPlayersModalOpen(true);
  };

  const handleAssignPlayers = async (playerIds) => {
    setLoading(true);
    try {
      await api.post(`/contacts/${currentContact._id}/players`, { playerIds });
      toast.success('Players updated successfully');
      setIsPlayersModalOpen(false);

      // Update the contact in the local state with the new players
      const updatedContacts = contacts.map(contact => {
        if (contact._id === currentContact._id) {
          return {
            ...contact,
            players: players // Use the players array from the state
          };
        }
        return contact;
      });

      setContacts(updatedContacts);

      // Also fetch fresh data to ensure everything is up to date
      fetchContacts();
    } catch (err) {
      console.error('Error assigning players:', err);
      toast.error(err.response?.data?.message || 'Failed to update players');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    setLoading(true);
    try {
      await api.delete(`/contacts/${currentContact._id}/players/${playerId}`);
      toast.success('Player removed successfully');

      // Update the players array in the current contact
      const updatedPlayers = players.filter(player => player._id !== playerId);
      setPlayers(updatedPlayers);

      // Update the contact in the local state
      const updatedContacts = contacts.map(contact => {
        if (contact._id === currentContact._id) {
          return {
            ...contact,
            players: updatedPlayers
          };
        }
        return contact;
      });

      setContacts(updatedContacts);

      // Also fetch fresh data
      fetchContacts();
    } catch (err) {
      console.error('Error removing player:', err);
      toast.error(err.response?.data?.message || 'Failed to remove player');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contacts', formData);
      toast.success('Contact added successfully');
      setIsAddModalOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Error adding contact:', err);
      toast.error(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/contacts/${currentContact._id}`, formData);
      toast.success('Contact updated successfully');
      setIsEditModalOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Error updating contact:', err);
      toast.error(err.response?.data?.message || 'Failed to update contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    setLoading(true);
    try {
      await api.delete(`/contacts/${currentContact._id}`);
      toast.success('Contact deleted successfully');
      setIsDeleteModalOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error(err.response?.data?.message || 'Failed to delete contact');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCredentials = async () => {
    setLoading(true);
    try {
      await api.post(`/contacts/${currentContact._id}/reset-password`, {});
      toast.success('Credentials reset successfully');
      setIsResetModalOpen(false);
    } catch (err) {
      console.error('Error resetting credentials:', err);
      toast.error(err.response?.data?.message || 'Failed to reset credentials');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm.trim()) return true;

    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
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
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500'
              } animate-gradient`}>
              Contact Management
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-800'} text-lg`}>
              Manage contacts and their players
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={openAddModal}
              className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium ${isDarkMode
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                } transition duration-150 ease-in-out`}
            >
              <UserPlus size={18} /> Add New Contact
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className={`relative mb-8 p-6 rounded-xl shadow-md ${isDarkMode
            ? 'bg-gray-800/60 border border-gray-700'
            : 'bg-white/90 border border-gray-200'
          }`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search contacts by name, email or phone..."
              className={`pl-10 pr-4 py-3 border rounded-lg w-full ${isDarkMode
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
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading contacts data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className={`border-l-4 p-4 mb-6 rounded ${isDarkMode ? 'bg-red-900/50 border-red-700 text-red-100' : 'bg-red-50 border-red-500 text-red-700'
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

        {/* Contact Table */}
        <div className={`relative overflow-hidden rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/90 border border-gray-200'
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
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <tr key={contact._id} className={`${isDarkMode
                        ? 'hover:bg-gray-700/50 transition-colors'
                        : 'hover:bg-gray-50 transition-colors'
                      }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}>
                            <span className="text-white font-medium">
                              {contact.firstName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {contact.relationship || 'Contact'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {contact.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {contact.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode
                              ? 'bg-indigo-900 text-indigo-200'
                              : 'bg-indigo-100 text-indigo-800'
                            }`}>
                            {contact.players?.length || 0} players
                          </div>
                          <button
                            onClick={() => openPlayersModal(contact)}
                            className={`ml-2 p-1.5 rounded-full ${isDarkMode
                                ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800'
                                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                              }`}
                            title="Manage Players"
                          >
                            <User size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(contact)}
                            className={`p-1.5 rounded-full ${isDarkMode
                                ? 'bg-gray-700 text-blue-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
                              }`}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(contact)}
                            className={`p-1.5 rounded-full ${isDarkMode
                                ? 'bg-gray-700 text-red-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-red-600 hover:bg-gray-200'
                              }`}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => openResetModal(contact)}
                            className={`p-1.5 rounded-full ${isDarkMode
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
                    <td colSpan="5" className={`px-6 py-10 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      <div className="flex flex-col items-center">
                        <Users className={`h-8 w-8 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p>{searchTerm ? 'No contacts match your search criteria.' : 'No contacts found.'}</p>
                        {searchTerm && (
                          <button
                            onClick={clearSearch}
                            className={`mt-2 text-sm ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
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

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Contact"
      >
        <form onSubmit={handleAddContact} className="space-y-6">
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Contact">Contact</option>
                    <option value="Contact">Contact</option>
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
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                } disabled:opacity-50`}
            >
              {loading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Contact"
      >
        <form onSubmit={handleEditContact} className="space-y-6">
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Contact">Contact</option>
                    <option value="Contact">Contact</option>
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
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
                    className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
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
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                } disabled:opacity-50`}
            >
              {loading ? 'Updating...' : 'Update Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Contact Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Contact"
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
            Are you sure you want to delete <span className="font-medium">{currentContact?.firstName} {currentContact?.lastName}</span>? This action cannot be undone.
          </p>
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Any players currently associated with this contact will need to be reassigned.
          </p>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteContact}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
                } disabled:opacity-50`}
            >
              {loading ? 'Deleting...' : 'Delete Contact'}
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
            Are you sure you want to reset the login credentials for <span className="font-medium">{currentContact?.firstName} {currentContact?.lastName}</span>?
          </p>
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            A new temporary password will be generated and sent to their email address ({currentContact?.email}).
          </p>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleResetCredentials}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
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
        title={`Players for ${currentContact?.firstName} ${currentContact?.lastName}`}
      >
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="space-y-6">
            {/* Current players section */}
            <div>
              <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Assigned Players
              </h3>
              {players && players.length > 0 ? (
                <div className="space-y-3">
                  {players.map(player => (
                    <div key={player._id} className={`flex justify-between items-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
                      }`}>
                      <div className="flex items-center">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${player.gender === 'female'
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
                        className={`p-1.5 rounded-full ${isDarkMode
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
                <div className={`text-center p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                  <User className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No players assigned to this contact yet.
                  </p>
                </div>
              )}
            </div>

            {/* Add players section */}
            <div>
              <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Add Players
              </h3>
              <div className="mb-4">
                <select
                  id="playerSelect"
                  className={`block w-full rounded-md shadow-sm py-2 px-3 ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const selectedPlayer = allPlayers.find(c => c._id === e.target.value);
                    if (selectedPlayer && !players.some(c => c._id === selectedPlayer._id)) {
                      setPlayers([...players, selectedPlayer]);
                    }
                    e.target.value = ''; // Reset select after selection
                  }}
                >
                  <option value="">Select a player to add</option>
                  {allPlayers
                    .filter(player => !players.some(c => c._id === player._id))
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
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Cancel
            </button>
            <button
              onClick={() => handleAssignPlayers(players.map(c => c._id))}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-sm font-medium ${isDarkMode
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

export default ContactManagement; 