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
  FileText,
  Settings,
  Bell,
  BarChart,
  UserPlus,
  ClipboardList,
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  TrendingUp,
  Target
} from 'lucide-react';

const TeamDashboard = () => {
  const [stats, setStats] = useState({
    totalPlayers: 12,
    totalMatches: 8,
    matchesWon: 6,
    pointsPerGame: 85.4,
    recentActivities: [],
    seasonalPerformance: [75, 82, 89, 91, 85, 92, 88, 95],
    shootingAccuracy: [45, 48, 52, 49, 55, 53],
    winRate: 75,
    assistantCoachRatio: '1:6',
    injuryReports: 1,
    pendingAnalysis: 2
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Simulate fetching team stats - in real app this would call API
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Mock data for now since backend endpoints might differ
        setTimeout(() => {
          setStats(prev => ({
            ...prev,
            recentActivities: [
              { id: 1, type: 'Video Uploaded', name: 'vs. Rockets', time: '2 hours ago', icon: <Video /> },
              { id: 2, type: 'Player Added', name: 'Michael Jordan', time: '1 day ago', icon: <UserPlus /> },
              { id: 3, type: 'Analysis Complete', name: 'vs. Lakers', time: '2 days ago', icon: <Activity /> }
            ]
          }));
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Error fetching team stats:', err);
        setError('Failed to fetch statistics');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { name: 'Add Player', icon: <UserPlus size={20} />, link: '/team/roster/add' },
    { name: 'Upload Match', icon: <Video size={20} />, link: '/team/matches' },
    { name: 'Team Schedule', icon: <Calendar size={20} />, link: '/team/schedule' },
    { name: 'Settings', icon: <Settings size={20} />, link: '/team/settings' },
  ];

  // Placeholder for charts
  const performanceChartData = {
    labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6'],
    datasets: [
      {
        label: 'Points Scored',
        data: [78, 85, 92, 88, 95, 89],
        backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.2)' : 'rgba(249, 115, 22, 0.2)',
        borderColor: isDarkMode ? 'rgba(249, 115, 22, 1)' : 'rgba(249, 115, 22, 1)',
        borderWidth: 2,
        fill: true,
      }
    ]
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
          : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-purple-950'
        : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
        <div className={`w-24 h-24 ${isDarkMode ? 'bg-orange-500' : 'bg-orange-300'} rounded-full absolute top-20 left-10 opacity-20 animate-float-slow`}></div>
        <div className={`w-16 h-16 ${isDarkMode ? 'bg-red-600' : 'bg-red-400'} rounded-full absolute top-40 right-20 opacity-20 animate-float-medium`}></div>
        <div className={`w-20 h-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'} rounded-full absolute bottom-20 left-1/4 opacity-20 animate-float-fast`}></div>
      </div>

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
              Season Info: {user?.firstName || 'Season 2025-2026'}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Link
              to="/team/profile"
              className={`px-4 py-2 rounded-full text-sm font-medium ${isDarkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-white text-indigo-600 hover:bg-gray-50 shadow-sm'
                } transition duration-150 ease-in-out`}
            >
              Team Profile
            </Link>
            <Link
              to="/team/notifications"
              className={`px-4 py-2 rounded-full text-sm font-medium ${isDarkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-white text-indigo-600 hover:bg-gray-50 shadow-sm'
                } transition duration-150 ease-in-out flex items-center`}
            >
              <Bell size={16} className="mr-1" />
              Alerts
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Matches',
              value: stats.totalMatches,
              icon: <Video size={24} />,
              color: isDarkMode ? 'from-pink-600 to-pink-800' : 'from-pink-400 to-pink-600'
            },
            {
              title: 'Roster Size',
              value: stats.totalPlayers,
              icon: <Users size={24} />,
              color: isDarkMode ? 'from-blue-600 to-blue-800' : 'from-blue-400 to-blue-600'
            },
            {
              title: 'Matches Won',
              value: stats.matchesWon,
              icon: <Target size={24} />,
              color: isDarkMode ? 'from-green-600 to-green-800' : 'from-green-400 to-green-600'
            },
            {
              title: 'Avg Points',
              value: stats.pointsPerGame,
              icon: <TrendingUp size={24} />,
              color: isDarkMode ? 'from-amber-600 to-amber-800' : 'from-amber-400 to-amber-600'
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`transform transition duration-300 hover:scale-105 p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color} text-white`}>
                  {stat.icon}
                </div>
                <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                  {stat.value}
                </span>
              </div>
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {stat.title}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'
          }`}>
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Win Rate',
              value: `${stats.winRate}%`,
              icon: <Activity size={20} />,
              color: isDarkMode ? 'text-teal-400' : 'text-teal-600'
            },
            {
              title: 'Staff Ratio',
              value: stats.assistantCoachRatio,
              icon: <Users size={20} />,
              color: isDarkMode ? 'text-blue-400' : 'text-blue-600'
            },
            {
              title: 'Injury Reports',
              value: stats.injuryReports,
              icon: <ClipboardList size={20} />,
              color: isDarkMode ? 'text-red-400' : 'text-red-600'
            },
            {
              title: 'Pending Analysis',
              value: stats.pendingAnalysis,
              icon: <Clock size={20} />,
              color: isDarkMode ? 'text-amber-400' : 'text-amber-600'
            },
          ].map((metric, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
            >
              <div className="flex items-center mb-2">
                <span className={`${metric.color} mr-2`}>{metric.icon}</span>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  {metric.title}
                </h3>
              </div>
              <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart Overview */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'
          }`}>
          Season Scoring Trend
        </h2>
        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Points Per Game
            </h3>
            <div className="mt-2 md:mt-0">
              <select
                className={`rounded-md px-3 py-1 text-sm ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                defaultValue="season"
              >
                <option value="season">Current Season</option>
                <option value="last5">Last 5 Games</option>
              </select>
            </div>
          </div>
          <div className="relative h-60">
            {/* Chart Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex items-end justify-around px-4">
                {performanceChartData.datasets[0].data.map((value, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-12 ${isDarkMode ? 'bg-orange-600' : 'bg-orange-500'} rounded-t-md`}
                      style={{ height: `${(value / 120) * 100}%` }}
                    ></div>
                    <span className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {performanceChartData.labels[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Link
              to="/team/analytics"
              className={`text-sm font-medium flex items-center ${isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
                }`}
            >
              View detailed analytics
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'
          }`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className={`transform transition duration-300 hover:scale-105 p-4 rounded-xl flex flex-col items-center justify-center text-center ${isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-750 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-800 shadow-md'
                }`}
            >
              <div className={`p-3 rounded-full mb-3 ${isDarkMode
                  ? 'bg-gradient-to-r from-orange-700 to-red-800'
                  : 'bg-gradient-to-r from-orange-400 to-red-500'
                } text-white`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className={`relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-lg`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'
          }`}>
          Recent Activities
        </h2>

        {stats.recentActivities.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  } transition duration-150 ease-in-out`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4 text-orange-500">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                      {activity.type}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {activity.name}
                    </p>
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            <p>No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDashboard;