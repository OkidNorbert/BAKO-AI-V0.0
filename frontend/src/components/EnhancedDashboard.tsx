import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';

interface Stats {
  total_videos: number;
  total_sessions: number;
  avg_accuracy: number;
  improvement_rate: number;
}

interface RecentSession {
  id: number;
  date: string;
  duration: number;
  performance_score: number;
}

export const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats>({
    total_videos: 0,
    total_sessions: 0,
    avg_accuracy: 0,
    improvement_rate: 0,
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch real performance data from backend
      const performanceResponse = await api.analytics.getPerformance(user.id, 30);
      const performanceData = performanceResponse.data;

      // Calculate stats from real data
      setStats({
        total_videos: performanceData.total_sessions || 0,
        total_sessions: performanceData.total_sessions || 0,
        avg_accuracy: performanceData.shot_accuracy || 0,
        improvement_rate: performanceData.avg_workload || 0,
      });

      // Fetch recent sessions from backend
      const sessionsResponse = await api.sessions.getPlayerSessions(user.id);
      setRecentSessions(sessionsResponse.data || []);

      // Fetch performance trends from backend
      const trendsResponse = await api.analytics.getPerformance(user.id, 30);
      setPerformanceData(trendsResponse.data || []);

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Unable to load dashboard data. Please try again.');
      showToast('Failed to load dashboard data', 'error');
      setLoading(false);
    }
  };

  // Performance data will be fetched from backend
  const [performanceData, setPerformanceData] = useState([]);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your performance data..." />;
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-semibold mb-2`}>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Performance Dashboard</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track your basketball performance and improvement</p>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-orange-600`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>Total Videos</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-2`}>{stats.total_videos}</p>
            </div>
            <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-100'} rounded-full p-3`}>
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-blue-600`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>Training Sessions</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-2`}>{stats.total_sessions}</p>
            </div>
            <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-100'} rounded-full p-3`}>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-green-600`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>Avg Accuracy</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-2`}>{stats.avg_accuracy}%</p>
            </div>
            <div className={`${darkMode ? 'bg-green-900' : 'bg-green-100'} rounded-full p-3`}>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-purple-600`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>Improvement</p>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-2`}>+{stats.improvement_rate}%</p>
            </div>
            <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-100'} rounded-full p-3`}>
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Performance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#ea580c" strokeWidth={2} />
              <Line type="monotone" dataKey="speed" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="stamina" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Sessions Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Recent Sessions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recentSessions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="performance_score" fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

        {/* Quick Actions */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/upload"
            className={`flex items-center p-4 border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-orange-500 hover:bg-orange-900' : 'border-gray-300 hover:border-orange-600 hover:bg-orange-50'} rounded-lg transition-colors`}
          >
            <svg className="w-8 h-8 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upload Video</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Analyze new training footage</p>
            </div>
          </Link>

          <Link
            to="/training"
            className={`flex items-center p-4 border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-blue-900' : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
          >
            <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Training Plan</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>View recommendations</p>
            </div>
          </Link>

          <Link
            to="/wearables"
            className={`flex items-center p-4 border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-green-500 hover:bg-green-900' : 'border-gray-300 hover:border-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
          >
            <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Connect Device</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sync wearable data</p>
            </div>
          </Link>
        </div>
      </div>

        {/* Recent Activity */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Recent Activity</h2>
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className={`flex items-center justify-between p-4 border ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg transition-colors`}
            >
              <div className="flex items-center">
                <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-100'} rounded-lg p-2 mr-3`}>
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Training Session</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{session.date} • {session.duration} minutes</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-orange-600">{session.performance_score}%</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Performance</p>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};
