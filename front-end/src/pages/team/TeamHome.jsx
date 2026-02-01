import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  Users,
  User,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Bell,
  BarChart,
  UserPlus,
  ClipboardList,
  Mail,
  Shield,
  LogOut,
  Activity,
  ChevronRight,
  PlusCircle,
  Clock,
  CheckCircle,
  MessageSquare,
  Trophy
} from 'lucide-react';

const TeamHome = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    matchesAnalyzed: 0,
    teamPerformance: 85,
    recentAnalysis: [],
    weeklyActivity: [75, 82, 89, 91, 85],
    performanceTrends: [12000, 15000, 13500, 17000, 18000, 16500],
    winRate: 65,
    playersPerCoach: '12:1',
    analysisWaitlist: 3,
    pendingVideos: 7
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminAPI.getStats();
        setStats({
          ...response.data,
          weeklyAttendance: response.data.weeklyAttendance || [75, 82, 89, 91, 85],
          monthlyRevenue: response.data.monthlyRevenue || [12000, 15000, 13500, 17000, 18000, 16500],
          occupancyRate: response.data.occupancyRate || 85,
          coachToPlayerRatio: response.data.coachToPlayerRatio || '1:5',
          incidentReports: response.data.incidentReports || 3,
          pendingRequests: response.data.pendingRequests || 7
        });
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err.response?.data?.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    { title: 'User Management', icon: Users, link: '/team/users', color: 'from-blue-500 to-indigo-600' },
    { title: 'Player Management', icon: User, link: '/team/players', color: 'from-green-500 to-teal-600' },
    { title: 'Match Schedule', icon: Calendar, link: '/team/schedule', color: 'from-orange-400 to-pink-500' },
    { title: 'Match Analysis', icon: Activity, link: '/team/analysis', color: 'from-purple-500 to-violet-600' },
    { title: 'Reports & Analytics', icon: FileText, link: '/team/reports', color: 'from-cyan-500 to-blue-600' },
    { title: 'System Settings', icon: Settings, link: '/team/settings', color: 'from-gray-500 to-gray-600' },
    { title: 'Contact Alerts', icon: Bell, link: '/team/notifications', color: 'from-rose-500 to-red-600' },
    { title: 'Coach Registration', icon: UserPlus, link: '/team/coach-registration', color: 'from-pink-500 to-rose-600' },
    { title: 'Attendance', icon: ClipboardList, link: '/team/attendance', color: 'from-emerald-500 to-green-600' },
    { title: 'Security', icon: Shield, link: '/team/security', color: 'from-indigo-500 to-purple-600' }
  ];

  const quickActions = [
    { name: 'Register Coach', icon: <UserPlus size={20} />, link: '/team/coach-registration' },
    { name: 'Match Analysis', icon: <Activity size={20} />, link: '/team/analysis' },
    { name: 'Manage Schedule', icon: <Calendar size={20} />, link: '/team/schedule' },
    { name: 'System Settings', icon: <Settings size={20} />, link: '/team/system-settings' },
  ];

  const recentActivities = [
    { id: 1, type: 'New Coach', name: 'Sarah Johnson', time: '2 hours ago', icon: <UserPlus className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`} /> },
    { id: 2, type: 'Match Analyzed', name: 'LAL vs GSW - Full Game', time: '3 hours ago', icon: <Activity className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} /> },
    { id: 3, type: 'Goal Reached', name: 'Team Shooting: 48%', time: '5 hours ago', icon: <CheckCircle className={`${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} /> },
    { id: 4, type: 'Report Generated', name: 'Player Performance Weekly', time: '1 day ago', icon: <ClipboardList className={`${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} /> },
    { id: 5, type: 'New Message', name: 'From Coach Mike', time: '1 day ago', icon: <MessageSquare className={`${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} /> },
  ];

  // Add performance chart data
  const performanceChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Team Efficiency',
        data: stats.performanceTrends || [75, 82, 78, 85, 88, 92],
        backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        borderColor: isDarkMode ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 1)',
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
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
        }`}>
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className={`px-6 py-3 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 ${isDarkMode
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
            }`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-purple-950'
      : 'bg-gradient-to-b from-blue-100 to-purple-100'
      }`}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
        <div className={`w-24 h-24 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'} rounded-full absolute top-20 left-10 opacity-20 animate-float-slow`}></div>
        <div className={`w-16 h-16 ${isDarkMode ? 'bg-pink-600' : 'bg-pink-400'} rounded-full absolute top-40 right-20 opacity-20 animate-float-medium`}></div>
        <div className={`w-20 h-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'} rounded-full absolute bottom-20 left-1/4 opacity-20 animate-float-fast`}></div>
      </div>

      {/* Header Section */}
      <div className="relative pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8`}>
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500'
              } animate-gradient`}>
              Team Dashboard
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-800'} text-lg`}>
              Welcome back, {user?.firstName || 'Admin'}!
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
              View Profile
            </Link>
            <Link
              to="/team/notifications"
              className={`px-4 py-2 rounded-full text-sm font-medium ${isDarkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-white text-indigo-600 hover:bg-gray-50 shadow-sm'
                } transition duration-150 ease-in-out flex items-center`}
            >
              <Bell size={16} className="mr-1" />
              Contact Alerts
            </Link>
          </div>
        </div>

        {/* African-inspired decorative element */}
        <div className="flex justify-center mb-6">
          <svg className="w-40 h-8" viewBox="0 0 200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,12 C8,6 16,3 24,6 C32,9 40,18 48,18 C56,18 64,12 72,9 C80,6 88,6 96,9 C104,12 112,18 120,18 C128,18 136,12 144,9 C152,6 160,6 168,9 C176,12 184,18 192,18 C200,18 200,12 200,12"
              stroke={isDarkMode ? "#F59E0B" : "#8B5CF6"}
              strokeWidth="4"
              strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Players',
              value: stats.totalPlayers,
              icon: <Users size={24} />,
              color: isDarkMode ? 'from-pink-600 to-pink-800' : 'from-pink-400 to-pink-600'
            },
            {
              title: 'Matches Analyzed',
              value: stats.matchesAnalyzed,
              icon: <Activity size={24} />,
              color: isDarkMode ? 'from-blue-600 to-blue-800' : 'from-blue-400 to-blue-600'
            },
            {
              title: 'Recent Analysis',
              value: stats.recentAnalysis.length,
              icon: <FileText size={24} />,
              color: isDarkMode ? 'from-green-600 to-green-800' : 'from-green-400 to-green-600'
            },
            {
              title: 'Win Rate',
              value: `${stats.winRate}%`,
              icon: <BarChart size={24} />,
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
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
          }`}>
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Occupancy Rate',
              value: `${stats.occupancyRate}%`,
              icon: <Activity size={20} />,
              color: isDarkMode ? 'text-teal-400' : 'text-teal-600'
            },
            {
              title: 'Coach-to-Player Ratio',
              value: stats.coachToPlayerRatio,
              icon: <Users size={20} />,
              color: isDarkMode ? 'text-blue-400' : 'text-blue-600'
            },
            {
              title: 'Incident Management',
              value: stats.incidentReports,
              icon: <ClipboardList size={20} />,
              color: isDarkMode ? 'text-red-400' : 'text-red-600'
            },
            {
              title: 'Pending Requests',
              value: stats.pendingRequests,
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

      {/* Performance Overview */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
          }`}>
          Performance Overview
        </h2>
        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Team Efficiency Trend
            </h3>
            <div className="mt-2 md:mt-0">
              <select
                className={`rounded-md px-3 py-1 text-sm ${isDarkMode
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                defaultValue="6months"
              >
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="quarter">Last Quarter</option>
              </select>
            </div>
          </div>
          <div className="relative h-60">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex items-end justify-around px-4">
                {performanceChartData.datasets[0].data.map((value, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className={`w-12 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'} rounded-t-md`}
                      style={{ height: `${(value / 100) * 100}%` }}
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
              to="/team/reports"
              className={`text-sm font-medium flex items-center ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                }`}
            >
              View detailed reports
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-10">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
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
                ? 'bg-gradient-to-r from-indigo-700 to-purple-800'
                : 'bg-gradient-to-r from-indigo-400 to-purple-500'
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
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
          }`}>
          Recent Activities
        </h2>

        {recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  } transition duration-150 ease-in-out`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
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

        <div className="mt-6 text-center">
          <Link
            to="/team/reports"
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${isDarkMode
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              } transition duration-150 ease-in-out`}
          >
            <BarChart size={16} className="mr-2" />
            View Reports & Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamHome;