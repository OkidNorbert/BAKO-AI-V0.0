import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamPlayer {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  position: string;
  height_cm: number;
  weight_kg: number;
  team_id: number;
  created_at: string;
  last_session?: string;
  performance_score?: number;
  total_sessions?: number;
}

export const TeamPlayers: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');

  useEffect(() => {
    fetchTeamPlayers();
  }, []);

  const fetchTeamPlayers = async () => {
    try {
      setLoading(true);
      const response = await api.players.getTeamPlayers();
      setPlayers(response.data || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching team players:', error);
      showToast('Failed to load team players', 'error');
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === 'all' || player.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  const positions = ['all', ...Array.from(new Set(players.map(p => p.position).filter(Boolean)))];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Team Players
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your team roster and track player development
          </p>
        </div>

        {/* Search and Filters */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Search Players
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Position
              </label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                {positions.map(position => (
                  <option key={position} value={position}>
                    {position === 'all' ? 'All Positions' : position}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <div key={player.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all`}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {player.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {player.full_name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {player.position || 'Position not set'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{player.email}</span>
                </div>
                
                {player.height_cm && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Height:</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{player.height_cm}cm</span>
                  </div>
                )}
                
                {player.weight_kg && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weight:</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{player.weight_kg}kg</span>
                  </div>
                )}

                {player.performance_score && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Performance:</span>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      {player.performance_score}%
                    </span>
                  </div>
                )}

                {player.total_sessions && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sessions:</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{player.total_sessions}</span>
                  </div>
                )}

                {player.last_session && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Session:</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(player.last_session).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/players/${player.id}`}
                  className={`flex-1 px-4 py-2 bg-orange-600 text-white text-center rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium`}
                >
                  View Profile
                </Link>
                <Link
                  to={`/team/players/${player.id}/edit`}
                  className={`flex-1 px-4 py-2 ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  } text-center rounded-lg transition-colors text-sm font-medium`}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-6xl mb-4">👥</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No players found
            </h3>
            <p>
              {searchTerm || filterPosition !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No players have been added to your team yet'
              }
            </p>
          </div>
        )}

        {/* Add Player Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => showToast('Add player functionality coming soon!', 'info')}
            className={`px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg`}
          >
            + Add New Player
          </button>
        </div>
      </div>
    </div>
  );
};
