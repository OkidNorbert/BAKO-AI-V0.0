import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  Users,
  Video,
  Calendar,
  Activity,
  Settings,
  Bell,
  BarChart,
  UserPlus,
  ChevronRight,
  PlusCircle,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';

// Import our team components
import TeamStats from '../../components/team/team-stats';
import TeamDashboardChart from '../../components/team/team-dashboard-chart';
import RecentGames from '../../components/team/recent-games';
import PlayerManagement from '../../components/team/player-management';

const TeamDashboard = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    matchesAnalyzed: 0,
    recentActivities: [],
    performanceData: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        setError('');

        const [statsResponse, notificationsResponse] = await Promise.all([
          adminAPI.getStats().catch(() => ({ data: {} })),
          adminAPI.getNotifications().catch(() => ({ data: [] }))
        ]);

        const statsData = statsResponse.data || {};
        const recentActivities = notificationsResponse.data || [];

        setStats({
          totalPlayers: statsData.totalPlayers || 0,
          totalMatches: statsData.totalMatches || 0,
          matchesAnalyzed: statsData.matchesAnalyzed || 0,
          recentActivities: recentActivities.slice(0, 5), // Use notifications as proxy for activity for now
          performanceData: statsData.performanceData || null,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching team stats:', error);
        setError('Failed to load team statistics');
        setStats(prev => ({ ...prev, loading: false }));
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, []);

  const quickActions = [
    {
      name: 'Add Player',
      icon: <UserPlus size={20} />,
      link: '/team/roster/add',
      description: 'Add new player to roster'
    },
    {
      name: 'Create Team',
      icon: <PlusCircle size={20} />,
      link: '/team/roster/new',
      description: 'Create new team profile'
    },
    {
      name: 'Upload Match',
      icon: <Video size={20} />,
      link: '/team/matches',
      description: 'Analyze match video'
    },
    {
      name: 'Team Schedule',
      icon: <Calendar size={20} />,
      link: '/team/schedule',
      description: 'View team schedule'
    },
    {
      name: 'Analytics',
      icon: <BarChart size={20} />,
      link: '/team/analytics',
      description: 'View detailed analytics'
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      link: '/team/settings',
      description: 'Team configuration'
    }
  ];

  if (stats.loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="text-center">
          <p className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 py-2 rounded ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-purple-950'
      : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>

      {/* Header Section */}
      <div className="relative pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8`}>
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500'
              } animate-gradient`}>
              Team Dashboard
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-800'} text-lg`}>
              Welcome back, {user?.firstName || 'Coach'}! Here's your team's performance overview.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Link
              to="/team/profile"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-white text-indigo-600 hover:bg-gray-50 shadow-sm'
                }`}
            >
              Team Profile
            </Link>
            <Link
              to="/team/notifications"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-white text-indigo-600 hover:bg-gray-50 shadow-sm'
                }`}
            >
              <Bell className="inline h-4 w-4 mr-1" />
              Notifications
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className={`p-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${isDarkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-white hover:bg-gray-50 text-gray-900 shadow-md'
              }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-100 text-indigo-600'}`}>
                {action.icon}
              </div>
              <div>
                <p className="font-medium">{action.name}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Stats and Recent Activity */}
        <div className="lg:col-span-2 space-y-6">

          {/* Team Stats Component */}
          <TeamStats stats={{
            totalPlayers: stats.totalPlayers || 0,
            activePlayers: stats.totalPlayers || 0,
            gamesAnalyzed: stats.matchesAnalyzed || 0,
            totalVideos: (stats.matchesAnalyzed || 0) + 2,
            winRate: 65,
            gamesPlayed: stats.totalMatches || 0,
            trainingVideos: 12
          }} />

          {/* Recent Games Component */}
          {/* Transform mock activities to match RecentGames expected format */}
          <RecentGames games={stats.recentActivities.map(activity => ({
            id: activity.id,
            title: activity.title,
            type: activity.type === 'match' ? 'win' : (activity.type === 'analysis' ? 'analysis' : 'training'),
            description: activity.message || activity.status || '',
            date: activity.createdAt || activity.date || new Date().toISOString()
          }))} />

        </div>

        {/* Right Column - Charts and Player Management */}
        <div className="space-y-6">

          {/* Performance Chart */}
          <TeamDashboardChart
            data={stats.performanceData || []}
          />

          {/* Player Management Overview */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Player Management
              </h3>
              <Link
                to="/team/roster"
                className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              <div className={`flex justify-between items-center p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total Players
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Active roster
                  </p>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {stats.totalPlayers}
                </div>
              </div>

              <div className={`flex justify-between items-center p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Matches Analyzed
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    This season
                  </p>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {stats.matchesAnalyzed}
                </div>
              </div>

              <Link
                to="/team/roster/add"
                className={`block w-full text-center p-3 rounded-lg transition-colors ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
              >
                <UserPlus className="inline h-4 w-4 mr-2" />
                Add New Player
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;