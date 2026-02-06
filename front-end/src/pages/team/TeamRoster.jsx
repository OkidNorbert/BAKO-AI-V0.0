import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api'; // Updated import
import { useTheme } from '@/context/ThemeContext';
import { MOCK_AUTH_ENABLED } from '@/utils/mockAuth';
import { MOCK_TEAM_ROSTER } from '@/utils/mockData';
import {
  User,
  Calendar,
  Activity,
  Search,
  Filter,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
  TrendingUp,
  Shield,
  FileText,
  ArrowUpDown,
  Trash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeamRoster = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError('');

      if (MOCK_AUTH_ENABLED) {
        console.log('Mock mode: skipping API fetch for Roster');
        // Map mock data to include _id if needed by keys
        setPlayers(MOCK_TEAM_ROSTER.map(p => ({ ...p, _id: p.id })));
        setLoading(false);
        return;
      }

      const response = await adminAPI.getRoster();
      setPlayers(response.data || []);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to fetch roster. Please try again later.');
      toast.error('Failed to load roster');
      setPlayers([]);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (player) => {
    try {
      const newStatus = player.status === 'active' ? 'inactive' : 'active';
      await adminAPI.updatePlayerStatus(player._id, newStatus);

      setPlayers(players.map(p =>
        p._id === player._id ? { ...p, status: newStatus } : p
      ));

      toast.success(`Player ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating player status:', error);
      toast.error('Failed to update player status');
    }
  };

  const handleViewSchedule = (playerId) => {
    window.location.href = `/team/players/${playerId}/schedule`;
  };

  const handleViewPerformance = (playerId) => {
    window.location.href = `/team/players/${playerId}/performance`;
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'position':
          comparison = (a.position || '').localeCompare(b.position || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'ppg':
          comparison = a.ppg - b.ppg;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredPlayers = sortData(players.filter(player => {
    const matchesSearch =
      (player.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (player.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (player.position?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatusFilter = statusFilter === 'all' || player.status === statusFilter;

    return matchesSearch && matchesStatusFilter;
  }));

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with title and actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Team Roster</h1>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage players, positions, and availability
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchPlayers}
                className={`flex items-center px-3 py-2 rounded-lg transition ${isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              <Link
                to="/team/roster/add"
                className={`flex items-center px-3 py-2 rounded-lg transition ${isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
              >
                <Plus size={16} className="mr-2" />
                Add Player
              </Link>
              <Link
                to="/team/reports"
                className={`flex items-center px-3 py-2 rounded-lg transition ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                <TrendingUp size={16} className="mr-2" />
                Stats
              </Link>
            </div>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'
              }`}>
              {error}
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
              }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Players
                  </p>
                  <p className="text-2xl font-bold">{players.length}</p>
                </div>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600'
                  }`}>
                  <User size={20} />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
              }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Active Roster
                  </p>
                  <p className="text-2xl font-bold">
                    {players.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                  <UserCheck size={20} />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
              }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Injured/Reserve
                  </p>
                  <p className="text-2xl font-bold">
                    {players.filter(p => p.status !== 'active').length}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                  <Activity size={20} />
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
              }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Avg PPG
                  </p>
                  <p className="text-2xl font-bold">
                    {players.length > 0
                      ? (players.reduce((acc, p) => acc + Number(p.ppg || 0), 0) / players.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} size={20} />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 ${isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-orange-600 border-gray-600'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-orange-500 border border-gray-300'
                    }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-lg ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-50 text-gray-900 border border-gray-300'
                    }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="injured">Injured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Players Table */}
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }">
                <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                  <tr>
                    <th scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {sortBy === 'name' && (
                          <ArrowUpDown size={14} className={`ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''
                            }`} />
                        )}
                      </div>
                    </th>
                    <th scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                    >
                      Jersey #
                    </th>
                    <th scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                    >
                      Position
                    </th>
                    <th scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {sortBy === 'status' && (
                          <ArrowUpDown size={14} className={`ml-1 ${sortOrder === 'asc' ? 'transform rotate-180' : ''
                            }`} />
                        )}
                      </div>
                    </th>
                    <th scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                    >
                      PPG
                    </th>
                    <th scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'
                  }`}>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player) => (
                      <tr key={player._id} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        } transition duration-150`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode
                                ? 'bg-gray-700 text-orange-400'
                                : 'bg-orange-100 text-orange-600'
                                }`}>
                                <User size={20} />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {player.firstName} {player.lastName}
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                ID: {player._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {player.jerseyNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {player.position}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(player)}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${player.status === 'active'
                              ? isDarkMode
                                ? 'bg-green-900/50 text-green-400 hover:bg-green-800/70'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                              : player.status === 'injured' || player.status === 'inactive'
                                ? isDarkMode
                                  ? 'bg-red-900/50 text-red-400 hover:bg-red-800/70'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                                : isDarkMode
                                  ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-800/70'
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              }`}
                          >
                            {player.status === 'active' ? (
                              <UserCheck size={14} className="mr-1 inline" />
                            ) : (
                              <UserX size={14} className="mr-1 inline" />
                            )}
                            {player.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {player.ppg}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Link
                              to={`/team/players/${player._id}/update`}
                              className={`p-1 rounded-md ${isDarkMode
                                ? 'text-blue-400 hover:bg-gray-700'
                                : 'text-blue-600 hover:bg-blue-100'
                                }`}
                              title="Edit Player"
                            >
                              <Edit size={18} />
                            </Link>
                            <button
                              onClick={() => handleViewPerformance(player._id)}
                              className={`p-1 rounded-md ${isDarkMode
                                ? 'text-green-400 hover:bg-gray-700'
                                : 'text-green-600 hover:bg-green-100'
                                }`}
                              title="View Performance"
                            >
                              <TrendingUp size={18} />
                            </button>
                            <Link
                              to={`/team/players/${player._id}`}
                              className={`p-1 rounded-md ${isDarkMode
                                ? 'text-gray-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              title="View Profile"
                            >
                              <Eye size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-sm">
                        <div className="flex flex-col items-center">
                          <User className={`h-10 w-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
                            }`} />
                          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            No players found matching your filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRoster; 