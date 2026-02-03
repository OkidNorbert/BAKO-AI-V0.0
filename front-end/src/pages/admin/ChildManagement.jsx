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
  Video,
  Info,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import ChildRegistration from '../admin/ChildRegistration';

const ChildManagement = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { isDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  const [matchStats, setMatchStats] = useState({
    total: 0,
    byStatus: {
      analyzed: 0,
      processing: 0,
      pending: 0,
      error: 0
    },
    byType: {
      practice: 0,
      league: 0,
      scrimmage: 0,
      other: 0
    }
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Calculate statistics whenever matches data changes
    if (matches.length > 0) {
      const stats = {
        total: matches.length,
        byStatus: {
          analyzed: 0,
          processing: 0,
          pending: 0,
          error: 0
        },
        byType: {
          practice: 0,
          league: 0,
          scrimmage: 0,
          other: 0
        }
      };

      matches.forEach(match => {
        const type = match.type || 'other';
        if (stats.byType[type] !== undefined) stats.byType[type]++;
        else stats.byType.other++;

        const status = match.analysisStatus || 'pending';
        if (stats.byStatus[status] !== undefined) stats.byStatus[status]++;
        else stats.byStatus.pending++;
      });

      setMatchStats(stats);
    }
  }, [matches]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Mock match data
      setTimeout(() => {
        const mockMatches = [
          { id: '1', title: 'vs. Lakers', date: '2025-01-20', type: 'league', analysisStatus: 'analyzed', duration: '1:45:00', notes: 'Great defense in Q4' },
          { id: '2', title: 'Practice Scrimmage', date: '2025-01-22', type: 'practice', analysisStatus: 'processing', duration: '0:55:00', notes: 'Focus on pick and roll' },
          { id: '3', title: 'vs. Warriors', date: '2025-01-25', type: 'league', analysisStatus: 'pending', duration: '1:50:00', notes: 'Upload pending' },
          { id: '4', title: 'Shooting Drills', date: '2025-01-26', type: 'practice', analysisStatus: 'analyzed', duration: '0:30:00', notes: 'Curry 3pt drills' },
          { id: '5', title: 'vs. Bulls', date: '2025-01-18', type: 'league', analysisStatus: 'error', duration: '1:40:00', notes: 'Cor corrupted file' },
        ];
        setMatches(mockMatches);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
      setError('Failed to fetch matches');
    }
  };

  const filteredMatches = matches.filter(match => {
    if (!match) return false;

    const title = (match.title || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    const matchesSearch = title.includes(searchTermLower);
    const matchesType = filterType === 'all' || match.type === filterType;

    return matchesSearch && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'analyzed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const handleViewMatch = (match) => {
    setEditingMatch(match);
    setIsEditMode(false);
    setShowEditModal(true);
    setUpdateError('');
  };

  const handleEditMatch = (match, e) => {
    e.stopPropagation();
    setEditingMatch(match);
    setFormData({ ...match });
    setIsEditMode(true);
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    // Mock update
    setUpdateSuccess('Match updated successfully');
    setTimeout(() => {
      setMatches(matches.map(m => m.id === editingMatch.id ? { ...m, ...formData } : m));
      setShowEditModal(false);
      setUpdateSuccess('');
    }, 1000);
  };

  const handleAddMatchClick = () => {
    navigate('/team/matches/upload');
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
          : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading match data...</p>
        </div>
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
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
              }`}>Match Analysis</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload and manage game footage for AI analysis
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <button
              onClick={handleAddMatchClick}
              className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
            >
              <Video className="mr-2 h-5 w-5" />
              Upload Match
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
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total Matches</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                  {matchStats.total}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-800' : 'bg-blue-200'
                }`}>
                <Video className={`h-6 w-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-green-900 to-emerald-900 shadow-lg'
              : 'bg-gradient-to-br from-green-50 to-emerald-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Analyzed</p>
                <div className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                  {matchStats.byStatus.analyzed}
                </div>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-800' : 'bg-green-200'
                }`}>
                <CheckCircle className={`h-6 w-6 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-yellow-900 to-amber-900 shadow-lg'
              : 'bg-gradient-to-br from-yellow-50 to-amber-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Processing</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-yellow-900'}`}>
                  {matchStats.byStatus.processing}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-yellow-800' : 'bg-yellow-200'
                }`}>
                <Clock className={`h-6 w-6 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-purple-900 to-indigo-900 shadow-lg'
              : 'bg-gradient-to-br from-purple-50 to-indigo-100 shadow-md'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>League Games</p>
                <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                  {matchStats.byType.league}
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
                  placeholder="Search matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-full ${isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-gray-600'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500'
                    }`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`rounded-full px-3 py-2.5 ${isDarkMode
                    ? 'bg-gray-700 text-white focus:ring-2 focus:ring-orange-500'
                    : 'bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500'
                  }`}
              >
                <option value="all">All Types</option>
                <option value="league">League Game</option>
                <option value="practice">Practice</option>
                <option value="scrimmage">Scrimmage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className={`rounded-xl shadow-md overflow-hidden backdrop-blur-sm ${isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'
          }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Match Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((match) => (
                    <tr key={match.id} className={`${isDarkMode
                        ? 'hover:bg-gray-700 transition-colors'
                        : 'hover:bg-gray-50 transition-colors'
                      }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                            }`}>
                            <Play className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{match.title}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {match.notes || 'No notes'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {match.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                        {match.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center ${getStatusColor(match.analysisStatus)}`}>
                          {match.analysisStatus === 'analyzed' && <CheckCircle className="w-4 h-4 mr-1" />}
                          {match.analysisStatus === 'processing' && <Clock className="w-4 h-4 mr-1" />}
                          {match.analysisStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {match.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewMatch(match)}
                            className={`p-1.5 rounded-full transition-colors ${isDarkMode
                                ? 'bg-gray-700 text-indigo-400 hover:bg-gray-600'
                                : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'
                              }`}
                            title="View details"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <Video className={`h-8 w-8 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <p className="text-sm">No matches found matching your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View/Edit Modal (Simplified) */}
      {showEditModal && editingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-lg w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <h3 className="text-xl font-bold mb-4">{editingMatch.title}</h3>
            <p className="mb-4">Status: {editingMatch.analysisStatus}</p>
            <button
              onClick={() => setShowEditModal(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildManagement;                          } p - 2 border`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Duration of Stay</label>
                        <select
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
                        >
                          <option value="full-day">Full-day</option>
                          <option value="half-day-morning">Half-day (Morning)</option>
                          <option value="half-day-afternoon">Half-day (Afternoon)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
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
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
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
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
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
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
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
                      className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
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
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">Contact Phone</label>
                        <input
                          type="text"
                          name="emergencyPhone"
                          value={formData.emergencyPhone}
                          onChange={handleInputChange}
                          className={`w - full rounded - md ${
  isDarkMode
    ? 'bg-gray-700 border-gray-600'
    : 'bg-white border-gray-300'
} p - 2 border`}
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
                    className={`px - 4 py - 2 rounded - md ${
  isDarkMode
    ? 'bg-gray-700 text-white hover:bg-gray-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
} `}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px - 4 py - 2 rounded - md ${
  isDarkMode
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-blue-500 text-white hover:bg-blue-600'
} ${ updateLoading ? 'opacity-50 cursor-not-allowed' : '' } `}
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
                        <p className="text-base">{editingChild.firstName} {editingChild.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date of Birth</p>
                        <p className="text-base">
                          {editingChild.dateOfBirth ? new Date(editingChild.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Age</p>
                        <p className="text-base">{calculateAge(editingChild.dateOfBirth)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gender</p>
                        <p className="text-base capitalize">{editingChild.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Duration of Stay</p>
                        <p className="text-base capitalize">
                          {formatDuration(editingChild.duration)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-base capitalize">{editingChild.status || 'Active'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Parent Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Parent Name</p>
                        <p className="text-base">{getParentName(editingChild)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Parent Email</p>
                        <p className="text-base">
                          {editingChild.parent?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Health Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Allergies</p>
                        <p className="text-base">{editingChild.allergies || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Special Needs</p>
                        <p className="text-base">{editingChild.specialNeeds || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Medications</p>
                        <p className="text-base">{editingChild.medications || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  {editingChild.specialInstructions && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-2">Special Instructions</h3>
                      <p className="text-base">{editingChild.specialInstructions}</p>
                    </div>
                  )}
                  
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Emergency Contact</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-base">{editingChild.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-base">{editingChild.emergencyPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-2">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`px - 4 py - 2 rounded - md ${
  isDarkMode
    ? 'bg-gray-700 text-white hover:bg-gray-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
} `}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleEditChild(editingChild, { stopPropagation: () => {} });
                    }}
                    className={`px - 4 py - 2 rounded - md ${
  isDarkMode
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-blue-500 text-white hover:bg-blue-600'
} `}
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Register Child & Guardian Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50" onClick={handleRegisterModalClose}></div>
          <div className={`relative w - full max - w - 4xl p - 6 mx - 4 rounded - lg shadow - lg overflow - hidden ${
  isDarkMode ? 'bg-gray-800' : 'bg-white'
} `}>
            <button
              onClick={handleRegisterModalClose}
              className={`absolute top - 4 right - 4 ${ isDarkMode ? 'text-gray-300' : 'text-gray-500' } hover: text - gray - 700 z - 10`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-6">Register Child with Guardian</h2>
            
            <div className="w-full max-h-[80vh] overflow-y-auto pr-2">
              <ChildRegistration embedded={true} onComplete={handleRegisterModalClose} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded - lg p - 6 max - w - md w - full ${
  isDarkMode ? 'bg-gray-800' : 'bg-white'
} `}>
            <div className="flex items-center mb-4">
              <AlertTriangle className={`h - 6 w - 6 mr - 2 ${ isDarkMode ? 'text-red-400' : 'text-red-600' } `} />
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
            </div>
            
            <p className="mb-6">
              Are you sure you want to delete {deletingChild.firstName} {deletingChild.lastName}? 
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
                className={`px - 4 py - 2 rounded - md ${
  isDarkMode
    ? 'bg-gray-700 text-white hover:bg-gray-600'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
} `}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChild}
                disabled={deleteLoading}
                className={`px - 4 py - 2 rounded - md ${
  isDarkMode
    ? 'bg-red-600 text-white hover:bg-red-700'
    : 'bg-red-600 text-white hover:bg-red-700'
} ${ deleteLoading ? 'opacity-50 cursor-not-allowed' : '' } `}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildManagement; 