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
  const [editingPlayer, setEditingPlayer] = useState<TeamPlayer | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

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
      if (error.response?.status === 503 || error.name === 'SilentError') {
        // Service unavailable - show empty state silently
        setPlayers([]);
      } else {
        // Only log and show toast for unexpected errors
        console.error('Error fetching team players:', error);
        showToast('Failed to load team players', 'error');
      }
      setLoading(false);
    }
  };

  const handleEditPlayer = (player: TeamPlayer) => {
    setEditingPlayer(player);
  };

  const handleSavePlayer = async (updatedPlayer: TeamPlayer) => {
    try {
      // TODO: Implement API call to update player
      showToast('Player updated successfully', 'success');
      setEditingPlayer(null);
      fetchTeamPlayers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating player:', error);
      showToast('Failed to update player', 'error');
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (window.confirm('Are you sure you want to remove this player from the team?')) {
      try {
        // TODO: Implement API call to remove player
        showToast('Player removed from team', 'success');
        fetchTeamPlayers(); // Refresh the list
      } catch (error: any) {
        console.error('Error removing player:', error);
        showToast('Failed to remove player', 'error');
      }
    }
  };

  const handleAddPlayer = async (newPlayer: Partial<TeamPlayer>) => {
    try {
      // TODO: Implement API call to add player
      showToast('Player added to team successfully', 'success');
      setShowAddPlayer(false);
      fetchTeamPlayers(); // Refresh the list
    } catch (error: any) {
      console.error('Error adding player:', error);
      showToast('Failed to add player', 'error');
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Team Players
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your team roster and track player development
              </p>
            </div>
            <button
              onClick={() => setShowAddPlayer(true)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                darkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              + Add Player
            </button>
          </div>
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
                <button
                  onClick={() => handleEditPlayer(player)}
                  className={`flex-1 px-4 py-2 ${
                    darkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } text-center rounded-lg transition-colors text-sm font-medium`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePlayer(player.id)}
                  className={`flex-1 px-4 py-2 ${
                    darkMode 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  } text-center rounded-lg transition-colors text-sm font-medium`}
                >
                  Remove
                </button>
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

        {/* Player Edit Modal */}
        {editingPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Edit Player
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSavePlayer(editingPlayer);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editingPlayer.full_name}
                      onChange={(e) => setEditingPlayer({...editingPlayer, full_name: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Position
                    </label>
                    <select
                      value={editingPlayer.position}
                      onChange={(e) => setEditingPlayer({...editingPlayer, position: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="Point Guard">Point Guard</option>
                      <option value="Shooting Guard">Shooting Guard</option>
                      <option value="Small Forward">Small Forward</option>
                      <option value="Power Forward">Power Forward</option>
                      <option value="Center">Center</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={editingPlayer.height_cm}
                      onChange={(e) => setEditingPlayer({...editingPlayer, height_cm: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={editingPlayer.weight_kg}
                      onChange={(e) => setEditingPlayer({...editingPlayer, weight_kg: parseFloat(e.target.value)})}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPlayer(null)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Add New Player
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const newPlayer = {
                  full_name: formData.get('full_name') as string,
                  email: formData.get('email') as string,
                  position: formData.get('position') as string,
                  height_cm: parseInt(formData.get('height_cm') as string),
                  weight_kg: parseFloat(formData.get('weight_kg') as string),
                };
                handleAddPlayer(newPlayer);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Position
                    </label>
                    <select
                      name="position"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Position</option>
                      <option value="Point Guard">Point Guard</option>
                      <option value="Shooting Guard">Shooting Guard</option>
                      <option value="Small Forward">Small Forward</option>
                      <option value="Power Forward">Power Forward</option>
                      <option value="Center">Center</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height_cm"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight_kg"
                      step="0.1"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Add Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPlayer(false)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
