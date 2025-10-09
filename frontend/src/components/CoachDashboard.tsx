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
  const {  } = useAuth();
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
      try {
        const statsResponse = await api.analytics.getTeamStats();
        setTeamStats(statsResponse.data);
      } catch (error) {
        console.warn('Failed to fetch team stats:', error);
        // Set default stats
        setTeamStats({
          total_players: 0,
          active_sessions: 0,
          avg_performance: 0,
          team_rank: 0
        });
      }

      // Fetch team players
      try {
        const playersResponse = await api.players.getTeamPlayers();
        setPlayers(playersResponse.data || []);
      } catch (error) {
        console.warn('Failed to fetch team players:', error);
        // Set empty array as fallback
        setPlayers([]);
      }

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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} overflow-x-hidden`}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full landscape-compact">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 landscape-text-sm`}>
            Coach Dashboard
          </h1>
          <p className={`text-sm sm:text-base lg:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} landscape-text-sm`}>
            Manage your team and track player performance
          </p>
        </div>

        {/* Team Stats Overview */}
        {teamStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8 landscape-grid-2">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Players</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teamStats.total_players}
                  </p>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl">👥</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Sessions</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teamStats.active_sessions}
                  </p>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl">🏃</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Performance</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {teamStats.avg_performance.toFixed(1)}%
                  </p>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl">📊</div>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Team Rank</p>
                  <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    #{teamStats.team_rank}
                  </p>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl">🏆</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-4 sm:mb-8">
          <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              to="/team/players"
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl">👥</div>
                <div>
                  <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Manage Players
                  </h3>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    View and edit player profiles
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/team/analytics"
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl">📈</div>
                <div>
                  <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Team Analytics
                  </h3>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Performance insights and trends
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/team/training"
              className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 transition-all transform hover:scale-105`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl">🏋️</div>
                <div>
                  <h3 className={`text-base sm:text-lg lg:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Training Plans
                  </h3>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Create and assign workouts
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Player Performance Overview */}
        <div className="mb-4 sm:mb-8">
          <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
            Player Performance
          </h2>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-lg overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Player
                    </th>
                    <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider hidden sm:table-cell`}>
                      Position
                    </th>
                    <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Performance
                    </th>
                    <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider hidden lg:table-cell`}>
                      Last Session
                    </th>
                    <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider hidden md:table-cell`}>
                      Improvement
                    </th>
                    <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {players.map((player) => (
                    <tr key={player.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center`}>
                              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {player.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-4">
                            <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {player.name || 'Unknown Player'}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} sm:hidden`}>
                              {player.position}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} hidden sm:table-cell`}>
                        {player.position}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {player.performance_score}%
                          </div>
                          <div className="ml-2 w-12 sm:w-16 bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div 
                              className="bg-green-500 h-1.5 sm:h-2 rounded-full" 
                              style={{ width: `${player.performance_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} hidden lg:table-cell`}>
                        {player.last_session}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                          player.improvement > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {player.improvement > 0 ? '+' : ''}{player.improvement}%
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <Link
                            to={`/players/${player.id}`}
                            className={`${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-500'} text-xs sm:text-sm`}
                          >
                            View
                          </Link>
                          <Link
                            to={`/team/players/${player.id}/edit`}
                            className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} text-xs sm:text-sm`}
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Team Activity */}
        <div className="mb-4 sm:mb-8">
          <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
            Recent Team Activity
          </h2>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6`}>
            <div className="text-center py-6 sm:py-8">
              <div className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4">📊</div>
              <p className={`text-sm sm:text-base lg:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No recent activity to display
              </p>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                Activity will appear here once players start training sessions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
