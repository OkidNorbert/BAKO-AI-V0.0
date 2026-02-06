import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { adminAPI } from '../../services/api';
import VideoPlayer from '../../components/team/video-player';
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
  Clock,
  Eye,
  Download,
  Share,
  Target,
  Users,
  Activity,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';

const MatchAnalysis = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { isDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [analysisView, setAnalysisView] = useState('list'); // list, player, detailed

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

      // Mock data logic removed to prepare for real backend integration

      const response = await adminAPI.getMatches();
      setMatches(response.data || []);
      setLoading(false);

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

  const handleOpenMatchDetails = (match) => {
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
    try {
      setUpdateLoading(true);
      setUpdateError('');

      const response = await adminAPI.updateMatch(editingMatch.id, formData);
      const updatedMatch = response.data || { ...editingMatch, ...formData };

      setMatches(matches.map(m => m.id === editingMatch.id ? updatedMatch : m));
      setUpdateSuccess('Match updated successfully');

      setTimeout(() => {
        setShowEditModal(false);
        setUpdateSuccess('');
      }, 1000);
    } catch (error) {
      console.error('Error updating match:', error);
      setUpdateError('Failed to update match');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddMatchClick = () => {
    navigate('/team/matches/upload');
  };

  const handleViewMatch = (match) => {
    setSelectedMatch(match);
    setShowVideoPlayer(true);
    setAnalysisView('player');
  };

  const handleBackToList = () => {
    setShowVideoPlayer(false);
    setSelectedMatch(null);
    setAnalysisView('list');
  };

  const handleVideoTimeUpdate = (currentTime) => {
    // Handle video time updates for analysis
    if (selectedMatch) {
      // Update analysis based on current video time
    }
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

      {/* Video Player View */}
      {showVideoPlayer && selectedMatch && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className={`flex items-center space-x-2 mb-4 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ArrowLeft size={20} />
              <span>Back to Matches</span>
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMatch.title}
                </h1>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedMatch.date} • {selectedMatch.duration} • {selectedMatch.type}
                </p>
              </div>

              <div className="flex space-x-2 mt-4 md:mt-0">
                <button className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}>
                  <Download size={16} className="mr-2" />
                  Export
                </button>
                <button className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                  <Share size={16} className="mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <VideoPlayer
                videoSrc={`/api/videos/${selectedMatch.id}`}
                analysisData={selectedMatch.analysisData}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            </div>

            {/* Analysis Sidebar */}
            <div className="space-y-6">
              {/* Match Stats */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <BarChart className="mr-2" size={20} />
                  Match Statistics
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Players Detected</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Plays</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Possessions</span>
                    <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>120</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Shooting %</span>
                    <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>48.5%</span>
                  </div>
                </div>
              </div>

              {/* Key Events */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="mr-2" size={20} />
                  Key Events
                </h3>

                <div className="space-y-2">
                  {[
                    { time: '02:15', type: 'Turnover', player: 'PG #23' },
                    { time: '05:30', type: '3-Pointer', player: 'SG #30' },
                    { time: '08:45', type: 'Fast Break', player: 'SF #35' },
                    { time: '12:20', type: 'Block', player: 'C #11' }
                  ].map((event, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {event.time}
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {event.type}
                        </span>
                      </div>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.player}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Tools */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Target className="mr-2" size={20} />
                  Analysis Tools
                </h3>

                <div className="space-y-2">
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Player Tracking Analysis
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Shot Chart Generation
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Movement Heatmap
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Performance Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {!showVideoPlayer && (
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
      )}

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


export default MatchAnalysis; 