import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import {
  User,
  Calendar,
  Check,
  Clock,
  Activity as ActivityIcon,
  AlertCircle,
  ChevronRight,
  Bell,
  RefreshCw,
  Baby,
  Home
} from 'lucide-react';

const CoachHome = () => {
  const [children, setPlayers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data in parallel
      const [childrenResponse, activitiesResponse, notificationsResponse] = await Promise.all([
        api.get('/coach/children').catch(err => ({ data: [] })),
        api.get('/coach/activities').catch(err => ({ data: [] })),
        api.get('/coach/notifications').catch(err => ({ data: [] }))
      ]);

      setPlayers(childrenResponse.data || []);
      setActivities(activitiesResponse.data || []);
      setNotifications(notificationsResponse.data || []);

    } catch (error) {
      console.error('Error in fetchData:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        navigate('/login');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else {
        setError('Failed to fetch data. Please try again later.');
      }

      // Set empty arrays on error
      setPlayers([]);
      setActivities([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchData();
    setIsRetrying(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/coach/notifications/${notificationId}/read`);

      // Update local states
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-gray-900 text-white'
      : 'bg-blue-50 text-gray-800'
      }`}>
      {/* African pattern decoration - top */}
      <div className="h-2 w-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500"></div>

      <div className="max-w-7xl mx-auto p-6">
        <div className={`
          ${isDarkMode
            ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
          }
          py-8 px-6 rounded-t-xl shadow-lg relative z-10 mb-6
        `}>
          <div className="flex items-center">
            <div className={`p-3 rounded-full mr-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white bg-opacity-20'
              }`}>
              <Home className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-white'}`} />
            </div>
            <h1 className="text-3xl font-bold text-white">Player Dashboard</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-opacity-80 shadow-md flex items-center justify-between bg-red-100 text-red-800 border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`px-3 py-1 rounded-md flex items-center ${isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry
            </button>
          </div>
        )}

        {/* Notifications */}
        <div className={`mb-6 rounded-xl shadow-lg overflow-hidden`}>
          <div className={`
            px-6 py-4 text-xl font-semibold
            ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}
          `}>
            <h2 className="flex items-center">
              <Bell className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'}`} />
              Recent Notifications
              {unreadCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                  {unreadCount} new
                </span>
              )}
            </h2>
          </div>

          <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Bell className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No notifications yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div
                    key={notification.id || index}
                    className={`p-4 rounded-lg transition-all duration-200 ${notification.read
                      ? isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                      : isDarkMode ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'
                      }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-medium ${!notification.read && (isDarkMode ? 'text-indigo-300' : 'text-indigo-700')}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                      </div>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <div className="text-center mt-4">
                    <Link
                      to="/coach/notifications"
                      className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode
                        ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100'
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                        }`}
                    >
                      <span>View All ({notifications.length})</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assigned Players */}
          <div className={`rounded-xl shadow-lg overflow-hidden`}>
            <div className={`
              px-6 py-4 text-xl font-semibold
              ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}
            `}>
              <h2 className="flex items-center">
                <ActivityIcon className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'}`} />
                Skill Progress
              </h2>
            </div>

            <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {children.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Baby className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No skill data available yet. Start your first training session!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map(player => (
                    <Link
                      key={player._id}
                      to={`/coach/children/${player._id}`}
                      className={`block p-4 rounded-lg transition-all duration-200 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${player.gender === 'male'
                          ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                          }`}>
                          <span className="font-bold">
                            {player.firstName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium">{player.firstName} {player.lastName}</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {calculateAge(player.dateOfBirth)} years old
                          </p>
                        </div>
                        <ChevronRight className={`ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                    </Link>
                  ))}
                  <Link
                    to="/player/skills"
                    className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode
                      ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100'
                      : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                      }`}
                  >
                    <span>View Detailed Analytics</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className={`rounded-xl shadow-lg overflow-hidden`}>
            <div className={`
              px-6 py-4 text-xl font-semibold
              ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}
            `}>
              <h2 className="flex items-center">
                <ActivityIcon className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'}`} />
                Recent Activities
              </h2>
            </div>

            <div className={`p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <ActivityIcon className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No activities recorded yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map(activity => {
                    const player = activity.playerId;
                    return (
                      <div
                        key={activity._id}
                        className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start">
                          <div className={`p-2 rounded-full ${getActivityColor(activity.type, isDarkMode)
                            }`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="ml-3">
                            <h3 className="font-medium">{activity.title}</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                            </p>
                            <div className="flex items-center text-xs mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="mr-2">{formatDate(activity.date)}</span>
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatTime(activity.date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-center mt-4">
                    <Link
                      to="/player/training"
                      className={`inline-flex items-center px-4 py-2 rounded-md ${isDarkMode
                        ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-100'
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                        }`}
                    >
                      <span>View All Sessions</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* African pattern decoration - bottom */}
      <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 mt-8"></div>
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'Unknown';

  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate.getTime())) return 'Unknown';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

const getActivityIcon = (type) => {
  switch (type) {
    case 'shooting':
      return <User className="h-4 w-4" />;
    case 'dribbling':
      return <Clock className="h-4 w-4" />;
    case 'movement':
      return <ActivityIcon className="h-4 w-4" />;
    default:
      return <Check className="h-4 w-4" />;
  }
};

const getActivityColor = (type, isDarkMode) => {
  switch (type) {
    case 'shooting':
      return isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800';
    case 'dribbling':
      return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
    case 'movement':
      return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
    default:
      return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
  }
};

export default CoachHome; 