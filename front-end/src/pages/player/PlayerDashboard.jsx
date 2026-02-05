import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import {
  Video,
  Calendar,
  Clock,
  Activity as ActivityIcon,
  AlertCircle,
  ChevronRight,
  Bell,
  RefreshCw,
  Home,
  Target,
  PlayCircle,
  TrendingUp,
  Award,
  BarChart3,
  Zap,
  Users,
  Eye,
  Timer,
  Star
} from 'lucide-react';

const PlayerDashboard = () => {
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Player performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    shootingAccuracy: 0,
    dribbleSpeed: 0,
    verticalJump: 0,
    sprintSpeed: 0,
    overallRating: 0,
    improvementRate: 0,
    weeklyStats: {
      sessionsCompleted: 0,
      minutesTrained: 0,
      shotsAttempted: 0,
      shotsMade: 0
    }
  });

  // Skill improvement trends
  const [skillTrends, setSkillTrends] = useState({
    shooting: [],
    dribbling: [],
    defense: [],
    fitness: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all player data
      const [videosResponse, historyResponse, notificationsResponse, metricsResponse, trendsResponse] = await Promise.all([
        api.get('/player/training-videos').catch(() => ({ data: [] })),
        api.get('/player/training-history').catch(() => ({ data: [] })),
        api.get('/player/notifications').catch(() => ({ data: [] })),
        api.get('/player/performance-metrics').catch(() => ({ data: {} })),
        api.get('/player/skill-trends').catch(() => ({ data: { shooting: [], dribbling: [], defense: [], fitness: [] } }))
      ]);
      
      setTrainingVideos(videosResponse.data || []);
      setTrainingHistory(historyResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      
      // Set performance metrics with defaults if API fails
      const metrics = metricsResponse.data || {
        shootingAccuracy: 68.5,
        dribbleSpeed: 7.2,
        verticalJump: 28.5,
        sprintSpeed: 4.8,
        overallRating: 85,
        improvementRate: 12.3,
        weeklyStats: {
          sessionsCompleted: 4,
          minutesTrained: 180,
          shotsAttempted: 85,
          shotsMade: 58
        }
      };
      setPerformanceMetrics(metrics);
      
      // Set skill trends with mock data if API fails
      const trends = trendsResponse.data || {
        shooting: [
          { date: '2025-01-20', value: 65, improvement: 2.5 },
          { date: '2025-01-27', value: 68.5, improvement: 3.5 },
          { date: '2025-02-03', value: 72, improvement: 4.5 },
          { date: '2025-02-10', value: 75, improvement: 3.0 }
        ],
        dribbling: [
          { date: '2025-01-20', value: 6.8, improvement: 1.2 },
          { date: '2025-01-27', value: 7.2, improvement: 2.4 },
          { date: '2025-02-03', value: 7.8, improvement: 2.6 },
          { date: '2025-02-10', value: 8.1, improvement: 2.3 }
        ],
        defense: [
          { date: '2025-01-20', value: 70, improvement: 3.0 },
          { date: '2025-01-27', value: 73, improvement: 3.5 },
          { date: '2025-02-03', value: 76, improvement: 3.8 },
          { date: '2025-02-10', value: 79, improvement: 3.2 }
        ],
        fitness: [
          { date: '2025-01-20', value: 65, improvement: 2.0 },
          { date: '2025-01-27', value: 68, improvement: 3.5 },
          { date: '2025-02-03', value: 71, improvement: 3.8 },
          { date: '2025-02-10', value: 74, improvement: 3.6 }
        ]
      };
      setSkillTrends(trends);
      
    } catch (err) {
      console.error('fetchData:', err);
      if (err.response?.status === 401) navigate('/login');
      else if (err.code === 'ERR_NETWORK') setError('Unable to connect. Please check your connection.');
      else setError('Failed to fetch data. Please try again.');
      setTrainingVideos([]);
      setTrainingHistory([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/player/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-800'}`}>
      <div className="h-2 w-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500" />
      <div className="max-w-7xl mx-auto p-6">
        <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} py-8 px-6 rounded-t-xl shadow-lg relative z-10 mb-6`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white bg-opacity-20'}`}>
              <Home className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-white'}`} />
            </div>
            <h1 className="text-3xl font-bold text-white">Player Dashboard</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border-l-4 border-red-500 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              <span>{error}</span>
            </div>
            <button onClick={() => { setIsRetrying(true); fetchData().finally(() => setIsRetrying(false)); }} disabled={isRetrying} className={`px-3 py-1 rounded-md flex items-center ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} /> Retry
            </button>
          </div>
        )}

        <div className={`mb-6 rounded-xl shadow-lg overflow-hidden`}>
          <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
            <h2 className="flex items-center">
              <Bell className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'}`} />
              Recent Notifications
              {unreadCount > 0 && <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>{unreadCount} new</span>}
            </h2>
          </div>
          <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Bell className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 3).map((n, i) => (
                  <div key={n.id || i} className={`p-4 rounded-lg ${n.read ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-50') : (isDarkMode ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200')}`} onClick={() => !n.read && markAsRead(n.id)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-medium ${!n.read && (isDarkMode ? 'text-indigo-300' : 'text-indigo-700')}`}>{n.title}</h3>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{n.message}</p>
                      </div>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <div className="text-center mt-4">
                    <Link to="/player/notifications" className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                      View All ({notifications.length}) <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics Section */}
        <div className={`rounded-xl shadow-lg overflow-hidden mb-6`}>
          <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
            <h2 className="flex items-center">
              <BarChart3 className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'}`} /> Performance Metrics
            </h2>
          </div>
          <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overall Rating</span>
                  <Star className={`h-4 w-4 ${performanceMetrics.overallRating >= 80 ? 'text-green-500' : performanceMetrics.overallRating >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{performanceMetrics.overallRating}</p>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shooting Accuracy</span>
                  <Target className={`h-4 w-4 ${performanceMetrics.shootingAccuracy >= 70 ? 'text-green-500' : 'text-orange-500'}`} />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{performanceMetrics.shootingAccuracy}%</p>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Improvement Rate</span>
                  <TrendingUp className={`h-4 w-4 ${performanceMetrics.improvementRate >= 10 ? 'text-green-500' : 'text-blue-500'}`} />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>+{performanceMetrics.improvementRate}%</p>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weekly Sessions</span>
                  <Timer className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{performanceMetrics.weeklyStats.sessionsCompleted}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Minutes Trained</p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{performanceMetrics.weeklyStats.minutesTrained}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shots Attempted</p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{performanceMetrics.weeklyStats.shotsAttempted}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shots Made</p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{performanceMetrics.weeklyStats.shotsMade}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-xl shadow-lg overflow-hidden`}>
            <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
              <h2 className="flex items-center">
                <Video className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'}`} /> Training Videos
              </h2>
            </div>
            <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {trainingVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Video className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>No training videos uploaded yet.</p>
                  <Link to="/player/training" className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                    <PlayCircle className="h-4 w-4 mr-2" /> Upload Your First Video
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {trainingVideos.map(v => (
                    <Link key={v._id || v.id} to={`/player/training/${v._id || v.id}`} className={`block p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${v.status === 'analyzed' ? (isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') : v.status === 'processing' ? (isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') : (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')}`}>
                          <Video className="h-6 w-6" />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="font-medium">{v.title || v.filename || 'Training Session'}</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{v.status === 'analyzed' ? 'Analysis Complete' : v.status === 'processing' ? 'Processing...' : 'Pending Analysis'}</p>
                        </div>
                        <ChevronRight className={`ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                    </Link>
                  ))}
                  <div className="text-center mt-4">
                    <Link to="/player/training" className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                      View All Videos <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`rounded-xl shadow-lg overflow-hidden`}>
            <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
              <h2 className="flex items-center">
                <ActivityIcon className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'}`} /> Training History
              </h2>
            </div>
            <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {trainingHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ActivityIcon className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No training sessions recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trainingHistory.map(s => (
                    <div key={s._id || s.id} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full ${getSessionTypeColor(s.type, isDarkMode)}`}>{getSessionTypeIcon(s.type)}</div>
                        <div className="ml-3 flex-1">
                          <h3 className="font-medium">{s.title || s.type || 'Training Session'}</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.description || 'Basketball training session'}</p>
                          <div className="flex items-center text-xs mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="mr-2">{formatDate(s.date || s.createdAt)}</span>
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatTime(s.date || s.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-4">
                    <Link to="/player/skills" className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                      View Skill Analytics <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skill Improvement Trends Section */}
        <div className={`rounded-xl shadow-lg overflow-hidden mb-6`}>
          <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
            <h2 className="flex items-center">
              <TrendingUp className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-indigo-600'}`} /> Skill Trends
            </h2>
          </div>
          <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Shooting Trend */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Target className="mr-2 h-5 w-5 text-orange-500" />
                  Shooting Accuracy
                </h3>
                <div className="space-y-2">
                  {skillTrends.shooting.slice(-3).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{trend.value}%</span>
                        {trend.improvement > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            +{trend.improvement}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/player/skills" className={`w-full text-center mt-3 px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                  View Detailed Analytics
                </Link>
              </div>

              {/* Dribbling Trend */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <ActivityIcon className="mr-2 h-5 w-5 text-blue-500" />
                  Dribble Speed
                </h3>
                <div className="space-y-2">
                  {skillTrends.dribbling.slice(-3).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{trend.value}</span>
                        {trend.improvement > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            +{trend.improvement}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fitness Trend */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-medium mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="mr-2 h-5 w-5 text-green-500" />
                  Fitness Score
                </h3>
                <div className="space-y-2">
                  {skillTrends.fitness.slice(-3).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{trend.value}</span>
                        {trend.improvement > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            +{trend.improvement}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Link to="/player/training" className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-md'}`}>
            <Video className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upload Training Video</h3>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Analyze your performance</p>
          </Link>
          
          <Link to="/player/skills" className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-md'}`}>
            <BarChart3 className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Skill Analytics</h3>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>View detailed metrics</p>
          </Link>
          
          <Link to="/player/profile" className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-md'}`}>
            <Users className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Player Profile</h3>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your info</p>
          </Link>
        </div>

        <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 mt-8" />
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
const getSessionTypeIcon = (type) => {
  switch (type) {
    case 'shooting': return <Target className="h-4 w-4" />;
    case 'dribbling': return <ActivityIcon className="h-4 w-4" />;
    case 'defense': return <TrendingUp className="h-4 w-4" />;
    default: return <Video className="h-4 w-4" />;
  }
};
const getSessionTypeColor = (type, isDarkMode) => {
  switch (type) {
    case 'shooting': return isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800';
    case 'dribbling': return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
    case 'defense': return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
    default: return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
  }
};
};

export default PlayerDashboard;
