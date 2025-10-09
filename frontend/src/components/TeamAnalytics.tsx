import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamAnalytics {
  total_players: number;
  active_sessions: number;
  avg_performance: number;
  team_rank: number;
  improvement_rate: number;
  top_performers: Array<{
    id: number;
    name: string;
    performance_score: number;
    improvement: number;
  }>;
  position_breakdown: Array<{
    position: string;
    count: number;
    avg_performance: number;
  }>;
  recent_trends: Array<{
    date: string;
    avg_performance: number;
    sessions_completed: number;
  }>;
}

export const TeamAnalytics: React.FC = () => {
  const {  } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchTeamAnalytics();
  }, [timeRange]);

  const fetchTeamAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.getTeamStats();
      setAnalytics(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching team analytics:', error);
      showToast('Failed to load team analytics', 'error');
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Team Analytics
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Performance insights and team trends
              </p>
            </div>
            <div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Team Performance</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.avg_performance.toFixed(1)}%
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
              <div className="mt-2">
                <span className={`text-sm ${analytics.improvement_rate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {analytics.improvement_rate > 0 ? '+' : ''}{analytics.improvement_rate.toFixed(1)}% vs last period
                </span>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Sessions</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.active_sessions}
                  </p>
                </div>
                <div className="text-3xl">🏃</div>
              </div>
              <div className="mt-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  This week
                </span>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Players</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analytics.total_players}
                  </p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
              <div className="mt-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Team roster
                </span>
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Team Rank</p>
                  <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    #{analytics.team_rank}
                  </p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>
              <div className="mt-2">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Overall ranking
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performers */}
          {analytics && analytics.top_performers.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Top Performers
              </h3>
              <div className="space-y-4">
                {analytics.top_performers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {player.name}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {player.performance_score}% performance
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${
                        player.improvement > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {player.improvement > 0 ? '+' : ''}{player.improvement}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Position Breakdown */}
          {analytics && analytics.position_breakdown.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Position Performance
              </h3>
              <div className="space-y-4">
                {analytics.position_breakdown.map((position) => (
                  <div key={position.position} className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {position.position}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {position.count} player{position.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {position.avg_performance.toFixed(1)}%
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        avg performance
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance Trends */}
        {analytics && analytics.recent_trends.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              Performance Trends
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.recent_trends.slice(-6).map((trend, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(trend.date).toLocaleDateString()}
                    </span>
                    <span className={`text-sm font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      {trend.avg_performance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {trend.sessions_completed} sessions
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(trend.avg_performance, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
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

          <Link
            to="/team/sessions"
            className={`${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-xl shadow-lg p-6 transition-all transform hover:scale-105`}
          >
            <div className="flex items-center space-x-4">
              <div className="text-4xl">📹</div>
              <div>
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  View Sessions
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Monitor team activities
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
