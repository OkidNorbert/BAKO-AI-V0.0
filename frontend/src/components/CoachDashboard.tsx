import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamStats {
  total_players: number;
  active_sessions: number;
  avg_performance: number;
  team_rank: number;
}

interface Player {
  id: number;
  name: string;
  position: string;
  performance_score: number;
  last_session: string;
  improvement: number;
}

export const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team statistics
      const statsResponse = await api.analytics.getTeamStats();
      setTeamStats(statsResponse.data);

      // Fetch team players
      const playersResponse = await api.players.getTeamPlayers();
      setPlayers(playersResponse.data || []);

      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 503 || error.name === 'SilentError') {
        // Service unavailable - show empty state silently
        setTeamStats(null);
        setPlayers([]);
      } else {
        // Only log and show toast for unexpected errors
        console.error('Error fetching team data:', error);
        showToast('Failed to load team data', 'error');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Coach Dashboard
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your team and track player performance
          </p>
        </div>

        {/* Team Stats Overview */}
        {teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Players</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teamStats.total_players}
                  </p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Sessions</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teamStats.active_sessions}
                  </p>
                </div>
                <div className="text-3xl">🏃</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Performance</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teamStats.avg_performance.toFixed(1)}%
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Team Rank</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    #{teamStats.team_rank}
                  </p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/team/players"
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-lg p-6 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">👥</div>
                <div>
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Manage Players
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View and edit player profiles
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/team/analytics"
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-lg p-6 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">📈</div>
                <div>
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Team Analytics
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Performance insights and trends
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/team/training"
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-lg p-6 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">🏋️</div>
                <div>
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Training Plans
                  </h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and assign workouts
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Player Performance Overview */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Player Performance
          </h2>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Player
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Position
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Performance
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Last Session
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Improvement
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {players.map((player) => (
                    <tr key={player.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center`}>
                              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {player.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {player.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {player.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {player.performance_score}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${player.performance_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {player.last_session}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          player.improvement > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {player.improvement > 0 ? '+' : ''}{player.improvement}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/players/${player.id}`}
                          className={`${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-500'} mr-4`}
                        >
                          View Profile
                        </Link>
                        <Link
                          to={`/team/players/${player.id}/edit`}
                          className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Team Activity */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Recent Team Activity
          </h2>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No recent activity to display
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                Activity will appear here once players start training sessions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
