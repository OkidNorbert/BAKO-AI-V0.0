import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import api from '../../utils/axiosConfig';
import {
  Search,
  Filter,
  Edit,
  FileText,
  Calendar,
  BarChart,
  Users,
  Info,
  User,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import PlayerRegistration from './PlayerRegistration';

const PlayerManagement = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAge, setFilterAge] = useState('all');
  const { isDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    total: 0,
    byAge: {
      U12: 0,
      U14: 0,
      U16: 0,
      U18: 0
    },
    byGender: {
      male: 0,
      female: 0,
      other: 0
    }
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Calculate statistics whenever player data changes
    if (players.length > 0) {
      const stats = {
        total: players.length,
        byAge: {
          U12: 0,
          U14: 0,
          U16: 0,
          U18: 0
        },
        byGender: {
          male: 0,
          female: 0,
          other: 0
        }
      };

      players.forEach(player => {
        // Calculate age stats
        let age = 0;
        if (player.dateOfBirth) {
          const birthDate = new Date(player.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        if (age < 12) stats.byAge.U12++;
        else if (age < 14) stats.byAge.U14++;
        else if (age < 16) stats.byAge.U16++;
        else stats.byAge.U18++;

        // Calculate gender stats
        const gender = player.gender || 'other';
        stats.byGender[gender]++;
      });

      setPlayerStats(stats);
    }
  }, [players]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch contacts first
      try {
        const contactsResponse = await api.get('/admin/users?role=contact');
        setContacts(contactsResponse.data || []);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        // Mock contact data
        setContacts([
          { id: '101', firstName: 'John', lastName: 'Johnson', email: 'john@example.com' },
          { id: '102', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@example.com' }
        ]);
      }

      // Then fetch players
      try {
        const playersResponse = await api.get('/admin/players');

        // Process player data to ensure contact info is available
        const processedPlayers = (playersResponse.data || []).map(player => {
          // If contact info is missing, try to find the contact from the contacts list
          if (!player.contact && player.contactId) {
            const matchedContact = contacts.find(p => p.id === player.contactId);
            if (matchedContact) {
              return {
                ...player,
                contact: {
                  firstName: matchedContact.firstName,
                  lastName: matchedContact.lastName,
                  email: matchedContact.email
                }
              };
            }
          }
          return player;
        });

        setPlayers(processedPlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to fetch player data. Please try again later.');

        // Mock data for development
        setPlayers([
          {
            id: '1',
            firstName: 'Emma',
            lastName: 'Johnson',
            dateOfBirth: new Date('2019-05-15'),
            gender: 'female',
            allergies: 'Peanuts',
            status: 'active',
            contactId: '101',
            contact: {
              firstName: 'John',
              lastName: 'Johnson',
              email: 'john@example.com'
            },
            createdAt: new Date('2022-09-01')
          },
          {
            id: '2',
            firstName: 'Noah',
            lastName: 'Williams',
            dateOfBirth: new Date('2021-02-20'),
            gender: 'male',
            allergies: 'None',
            status: 'active',
            contactId: '102',
            contact: {
              firstName: 'Sarah',
              lastName: 'Williams',
              email: 'sarah@example.com'
            },
            createdAt: new Date('2022-10-15')
          }
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    if (!player) return false;

    const fullName = `${player.firstName || ''} ${player.lastName || ''}`.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    // Calculate age for age filtering
    let age = 0;
    if (player.dateOfBirth) {
      const birthDate = new Date(player.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Map age to filter categories
    let ageGroup = 'U18'; // default
    if (age < 12) ageGroup = 'U12';
    else if (age < 14) ageGroup = 'U14';
    else if (age < 16) ageGroup = 'U16';

    const matchesSearch = fullName.includes(searchTermLower);
    const matchesAge = filterAge === 'all' || filterAge === ageGroup;

    return matchesSearch && matchesAge;
  });

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age < 1 ? 'Under 1 yr' : `${age} yrs`;
  };

  const formatGroup = (duration) => {
    switch (duration) {
      case 'half-day-morning':
        return 'Developmental';
      case 'half-day-afternoon':
        return 'Intermediate';
      case 'full-day':
        return 'Elite';
      default:
        return 'All Levels';
    }
  };

  const getContactName = (player) => {
    if (player.contact) {
      return `${player.contact.firstName || ''} ${player.contact.lastName || ''}`;
    }

    if (player.contactId) {
      const matchedContact = contacts.find(p => p.id === player.contactId);
      if (matchedContact) {
        return `${matchedContact.firstName || ''} ${matchedContact.lastName || ''}`;
      }
    }

    return 'N/A';
  };

  const handleViewPlayer = (player) => {
    setEditingPlayer(player);
    setIsEditMode(false);
    setShowEditModal(true);
    setUpdateError('');
    setUpdateSuccess('');
  };

  const handleEditPlayer = (player, e) => {
    e.stopPropagation();
    setEditingPlayer(player);
    // Initialize form data with player data
    setFormData({
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().split('T')[0] : '',
      gender: player.gender || '',
      allergies: player.allergies || '',
      specialNeeds: player.specialNeeds || '',
      medications: player.medications || '',
      specialInstructions: player.specialInstructions || '',
      emergencyContact: player.emergencyContact || '',
      emergencyPhone: player.emergencyPhone || '',
      duration: player.duration || 'full-day',
      status: player.status || 'active'
    });
    setIsEditMode(true);
    setShowEditModal(true);
    setUpdateError('');
    setUpdateSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      setUpdateLoading(true);
      setUpdateError('');
      setUpdateSuccess('');

      // Call API to update player
      const response = await api.put(`/admin/players/${editingPlayer.id}`, formData);

      // Update players array with updated player
      setPlayers(prevPlayers =>
        prevPlayers.map(player =>
          player.id === editingPlayer.id ? { ...player, ...response.data } : player
        )
      );

      setUpdateSuccess('Player information updated successfully!');
      setUpdateLoading(false);

      // Wait a moment before switching back to view mode
      setTimeout(() => {
        setIsEditMode(false);
        setEditingPlayer(response.data);
      }, 1500);

    } catch (error) {
      console.error('Error updating player:', error);
      setUpdateError(error.response?.data?.message || 'Failed to update player. Please try again.');
      setUpdateLoading(false);
    }
  };

  const handleAddPlayerClick = () => {
    setShowRegisterModal(true);
  };

  const handleRegisterModalClose = () => {
    setShowRegisterModal(false);
    // Refresh the players list after registration
    fetchData();
  };

  const handleDeletePlayer = (player, e) => {
    e.stopPropagation();
    setDeletingPlayer(player);
    setShowDeleteModal(true);
    setDeleteError('');
  };

  const confirmDeletePlayer = async () => {
    if (!deletingPlayer) return;

    try {
      setDeleteLoading(true);
      setDeleteError('');

      await api.delete(`/admin/players/${deletingPlayer.id}`);

      // Update local state to remove the deleted player
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== deletingPlayer.id));

      // Close the modal
      setShowDeleteModal(false);
      setDeletingPlayer(null);
      setDeleteLoading(false);
    } catch (error) {
      console.error('Error deleting player:', error);
      setDeleteError(error.response?.data?.message || 'Failed to delete player. Please try again.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading player data...</p>
        </div>
      </div>
    );
  }

  if (error && players.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
        }`}>
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => fetchData()}
          className={`px-6 py-3 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 ${isDarkMode
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
    <div className={`min-h-screen ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white'
      : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
      }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}>Team Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Add and manage your team roster and player information
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={handleAddPlayerClick}
              className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
            >
              <Users className="mr-2 h-5 w-5" />
              Add New Player
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
            ? 'bg-gradient-to-br from-blue-900 to-indigo-900 shadow-lg'
            : 'bg-gradient-to-br from-blue-50 to-indigo-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total Players</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                  {playerStats.total}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-800' : 'bg-blue-200'
                }`}>
                <Users className={`h-6 w-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
            ? 'bg-gradient-to-br from-pink-900 to-rose-900 shadow-lg'
            : 'bg-gradient-to-br from-pink-50 to-rose-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-pink-300' : 'text-pink-700'}`}>Gender Distribution</p>
                <div className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-pink-900'}`}>
                  <span>{playerStats.byGender.male}</span>
                  <span className="text-sm"> boys</span>
                  <span className="mx-2">/</span>
                  <span>{playerStats.byGender.female}</span>
                  <span className="text-sm"> girls</span>
                </div>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-pink-800' : 'bg-pink-200'
                }`}>
                <Users className={`h-6 w-6 ${isDarkMode ? 'text-pink-300' : 'text-pink-600'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
            ? 'bg-gradient-to-br from-green-900 to-emerald-900 shadow-lg'
            : 'bg-gradient-to-br from-green-50 to-emerald-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>U12 & U14 Rosters</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                  {playerStats.byAge.U12 + playerStats.byAge.U14}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-800' : 'bg-green-200'
                }`}>
                <User className={`h-6 w-6 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
            ? 'bg-gradient-to-br from-purple-900 to-indigo-900 shadow-lg'
            : 'bg-gradient-to-br from-purple-50 to-indigo-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>U16 & U18 Rosters</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                  {playerStats.byAge.U16 + playerStats.byAge.U18}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-800' : 'bg-purple-200'
                }`}>
                <Calendar className={`h-6 w-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className={`p-6 rounded-xl mb-6 shadow-md backdrop-blur-sm ${isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'
          }`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <input
                  type="text"
                  placeholder="Search players by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-full ${isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-gray-600'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500'
                    }`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                className={`rounded-full px-3 py-2.5 ${isDarkMode
                  ? 'bg-gray-700 text-white focus:ring-2 focus:ring-indigo-500'
                  : 'bg-gray-50 text-gray-900 focus:ring-2 focus:ring-indigo-500'
                  }`}
              >
                <option value="all">All Ages</option>
                <option value="U12">U12 (Under 12)</option>
                <option value="U14">U14 (12-13 yrs)</option>
                <option value="U16">U16 (14-15 yrs)</option>
                <option value="U18">U18 (16-18 yrs)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className={`rounded-xl shadow-md overflow-hidden backdrop-blur-sm ${isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'
          }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Notes / Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Group / Level
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <tr key={player.id} className={`${isDarkMode
                      ? 'hover:bg-gray-700 transition-colors'
                      : 'hover:bg-gray-50 transition-colors'
                      }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${player.gender === 'female'
                            ? isDarkMode ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-gradient-to-r from-pink-500 to-purple-500'
                            : isDarkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}>
                            <span className="text-white font-medium">
                              {(player.firstName || '').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{`${player.firstName} ${player.lastName}`}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {player.gender || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {calculateAge(player.dateOfBirth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getContactName(player)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {player.allergies || 'None'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatGroup(player.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewPlayer(player)}
                            className={`p-1.5 rounded-full transition-colors ${isDarkMode
                              ? 'bg-gray-700 text-indigo-400 hover:bg-gray-600'
                              : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'
                              }`}
                            title="View details"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleEditPlayer(player, e)}
                            className={`p-1.5 rounded-full transition-colors ${isDarkMode
                              ? 'bg-gray-700 text-green-400 hover:bg-gray-600'
                              : 'bg-gray-100 text-green-600 hover:bg-gray-200'
                              }`}
                            title="Edit player"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePlayer(player, e)}
                            className={`p-1.5 rounded-full transition-colors ${isDarkMode
                              ? 'bg-gray-700 text-red-400 hover:bg-gray-600'
                              : 'bg-gray-100 text-red-600 hover:bg-gray-200'
                              }`}
                            title="Delete player"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <Users className={`h-8 w-8 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className="text-sm">No players found matching your search criteria.</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterAge('all');
                          }}
                          className={`mt-2 text-sm ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
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

      {/* View/Edit Player Modal */}
      {showEditModal && editingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Edit Player Information' : 'Player Information'}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className={`p-1 rounded-md ${isDarkMode
                  ? 'hover:bg-gray-700'
                  : 'hover:bg-gray-100'
                  }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {updateSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                {updateSuccess}
              </div>
            )}

            {updateError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                {updateError}
              </div>
            )}

            {isEditMode ? (
              <form onSubmit={handleUpdatePlayer}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium block mb-1">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Assigned Group</label>
                        <select
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                        >
                          <option value="half-day-morning">Developmental</option>
                          <option value="half-day-afternoon">Intermediate</option>
                          <option value="full-day">Elite</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Health Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium block mb-1">Allergies</label>
                        <input
                          type="text"
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                          placeholder="None"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Special Needs</label>
                        <input
                          type="text"
                          name="specialNeeds"
                          value={formData.specialNeeds}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                          placeholder="None"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Medications</label>
                        <input
                          type="text"
                          name="medications"
                          value={formData.medications}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                          placeholder="None"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                    <textarea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full rounded-md ${isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-white border-gray-300'
                        } p-2 border`}
                      placeholder="Any special instructions"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium block mb-1">Contact Name</label>
                        <input
                          type="text"
                          name="emergencyContact"
                          value={formData.emergencyContact}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Contact Phone</label>
                        <input
                          type="text"
                          name="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={handleInputChange}
                          className={`w-full rounded-md ${isDarkMode
                            ? 'bg-gray-700 border-gray-600'
                            : 'bg-white border-gray-300'
                            } p-2 border`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setUpdateError('');
                      setUpdateSuccess('');
                    }}
                    className={`px-4 py-2 rounded-md ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md ${isDarkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                      } ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-base">{editingPlayer.firstName} {editingPlayer.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date of Birth</p>
                        <p className="text-base">
                          {editingPlayer.dateOfBirth ? new Date(editingPlayer.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Age</p>
                        <p className="text-base">{calculateAge(editingPlayer.dateOfBirth)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gender</p>
                        <p className="text-base capitalize">{editingPlayer.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Duration of Stay</p>
                        <p className="text-base capitalize">
                          {formatDuration(editingPlayer.duration)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-base capitalize">{editingPlayer.status || 'Active'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Contact Name</p>
                        <p className="text-base">{getContactName(editingPlayer)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contact Email</p>
                        <p className="text-base">
                          {editingPlayer.contact?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Health Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Allergies</p>
                        <p className="text-base">{editingPlayer.allergies || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Special Needs</p>
                        <p className="text-base">{editingPlayer.specialNeeds || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Medications</p>
                        <p className="text-base">{editingPlayer.medications || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  {editingPlayer.specialInstructions && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                      <p className="text-base">{editingPlayer.specialInstructions}</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Emergency Contact</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-base">{editingPlayer.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-base">{editingPlayer.emergencyPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 rounded-md ${isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditPlayer(editingPlayer, { stopPropagation: () => { } });
                    }}
                    className={`px-4 py-2 rounded-md ${isDarkMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div >
      )
      }

      {/* Register Player & Contact Modal */}
      {
        showRegisterModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black opacity-50" onClick={handleRegisterModalClose}></div>
            <div className={`relative w-full max-w-4xl p-6 mx-4 rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
              <button
                onClick={handleRegisterModalClose}
                className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} hover:text-gray-700 z-10`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold mb-6">Register Player with Contact</h2>

              <div className="w-full max-h-[80vh] overflow-y-auto pr-2">
                <PlayerRegistration embedded={true} onComplete={handleRegisterModalClose} />
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteModal && deletingPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
              <div className="flex items-center mb-4">
                <AlertTriangle className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                <h2 className="text-xl font-bold">Confirm Deletion</h2>
              </div>

              <p className="mb-6">
                Are you sure you want to delete {deletingPlayer.firstName} {deletingPlayer.lastName}?
                This action cannot be undone.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className={`px-4 py-2 rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlayer}
                  disabled={deleteLoading}
                  className={`px-4 py-2 rounded-md ${isDarkMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                    } ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default PlayerManagement; 