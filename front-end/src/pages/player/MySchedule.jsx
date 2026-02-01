import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, MapPin, CheckCircle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MySchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDay, setCurrentDay] = useState(getCurrentDayName());
  const [assignedPlayers, setAssignedPlayers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();
  const { user, refreshAccessToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Get current day name
  function getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  // Memoize fetchScheduleData to prevent unnecessary re-renders
  const fetchScheduleData = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError('');

      if (showToast) {
        toast.loading('Refreshing your schedule...', { id: 'refresh-toast' });
      }

      // Get coach's schedule
      const scheduleResponse = await api.get('/player/schedule');
      setSchedules(scheduleResponse.data || []);

      // Get children assigned to this coach
      const childrenResponse = await api.get('/player/children');
      setAssignedPlayers(childrenResponse.data || []);

      if (showToast) {
        toast.success('Schedule refreshed!', { id: 'refresh-toast' });
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);

      if (error.response?.status === 401) {
        // Handle token expiration
        try {
          await refreshAccessToken();
          // Retry the request after token refresh
          const scheduleResponse = await api.get('/player/schedule');
          setSchedules(scheduleResponse.data || []);

          const childrenResponse = await api.get('/player/children');
          setAssignedPlayers(childrenResponse.data || []);

          if (showToast) {
            toast.success('Schedule refreshed!', { id: 'refresh-toast' });
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          setError('Your session has expired. Please log in again.');
          toast.error('Session expired. Please log in again.', { id: 'refresh-toast' });
          // Navigate to login after a short delay
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        setError('Failed to load schedule data. Please try again later.');
        if (showToast) {
          toast.error('Failed to refresh data.', { id: 'refresh-toast' });
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate, refreshAccessToken]);

  // Check authentication and load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchScheduleData();
    } else {
      // If not authenticated, redirect to login
      navigate('/login');
    }
  }, [fetchScheduleData, isAuthenticated, navigate]);

  // Add periodic refresh to keep data current
  useEffect(() => {
    // Refresh data every 10 minutes
    const refreshInterval = setInterval(() => {
      if (isAuthenticated) {
        fetchScheduleData();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [fetchScheduleData, isAuthenticated]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchScheduleData(true);
  };

  const getTodaySchedule = () => {
    return schedules.filter(schedule => schedule.days.includes(currentDay));
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';

    // Parse the time string (format: "HH:MM")
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours, 10));
    time.setMinutes(parseInt(minutes, 10));

    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get children for a specific schedule
  const getPlayersForSchedule = (scheduleId) => {
    const schedule = schedules.find(s => s._id === scheduleId || s.id === scheduleId);
    if (!schedule || !schedule.children) return [];

    return schedule.children || [];
  };

  // Check if a session is current/active
  const isSessionActive = (schedule) => {
    if (!schedule.days.includes(currentDay)) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + (currentMinutes / 60);

    const [startHour, startMinutes] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinutes] = schedule.endTime.split(':').map(Number);

    const startTime = startHour + (startMinutes / 60);
    const endTime = endHour + (endMinutes / 60);

    return currentTime >= startTime && currentTime <= endTime;
  };

  // Navigate to view a player's details
  const viewPlayerDetails = (playerId) => {
    navigate(`/player/children/${playerId}`);
  };

  if (loading && !refreshing) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-xl font-semibold mb-2">Error Loading Schedule</p>
        <p className="text-center max-w-md mb-6">{error}</p>
        <button
          onClick={handleManualRefresh}
          className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-medium`}
        >
          Try Again
        </button>
      </div>
    );
  }

  const todaySchedules = getTodaySchedule();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              My Schedule
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              View your assigned schedules and children
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`mt-4 md:mt-0 px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${refreshing
                ? isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                : isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Schedule'}
          </button>
        </div>

        {/* Today's Schedule Section */}
        <div className={`mb-8 p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex items-center mb-4">
            <Calendar className={`mr-2 h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <h2 className="text-xl font-semibold">Today's Schedule ({currentDay})</h2>
          </div>

          {todaySchedules.length > 0 ? (
            <div className="space-y-6">
              {todaySchedules.map((schedule) => {
                const isActive = isSessionActive(schedule);
                const schedulePlayers = getPlayersForSchedule(schedule._id || schedule.id);

                return (
                  <div
                    key={schedule._id || schedule.id}
                    className={`p-4 rounded-lg border-l-4 ${isActive
                        ? isDarkMode ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'
                        : isDarkMode ? 'bg-gray-700 border-gray-500' : 'bg-gray-50 border-gray-300'
                      }`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3">
                      <div className="mb-2 md:mb-0">
                        <h3 className="font-medium text-lg">
                          {schedule.title}
                          {isActive && (
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                              }`}>
                              Active Now
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                      </div>
                      <div className={`text-sm px-3 py-1 rounded-lg ${schedule.ageGroup === 'infant'
                          ? isDarkMode ? 'bg-pink-900/30 text-pink-200' : 'bg-pink-100 text-pink-800'
                          : schedule.ageGroup === 'toddler'
                            ? isDarkMode ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-100 text-purple-800'
                            : schedule.ageGroup === 'preschool'
                              ? isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {schedule.ageGroup ? schedule.ageGroup.charAt(0).toUpperCase() + schedule.ageGroup.slice(1) : 'Mixed'} Group
                      </div>
                    </div>

                    {schedule.room && (
                      <div className="flex items-center mb-3 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{schedule.room}</span>
                      </div>
                    )}

                    {schedulePlayers.length > 0 ? (
                      <div>
                        <h4 className="font-medium mb-2">
                          Assigned Players ({schedulePlayers.length}/{schedule.maxCapacity || '?'})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {schedulePlayers.map((player) => (
                            <div
                              key={player._id || player.id}
                              className={`p-3 rounded-lg flex items-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-white hover:bg-gray-50'
                                } cursor-pointer transition-colors`}
                              onClick={() => viewPlayerDetails(player._id || player.id)}
                            >
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${player.gender === 'male'
                                  ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                  : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                                }`}>
                                <span>{player.firstName?.charAt(0) || player.fullName?.charAt(0) || 'C'}</span>
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">{player.firstName ? `${player.firstName} ${player.lastName}` : player.fullName}</p>
                                <p className="text-xs">
                                  {player.age || 'Unknown age'} • {player.attendance || 'Full day'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                        <User className="h-5 w-5 mx-auto mb-1" />
                        <p>No children assigned to this session yet</p>
                      </div>
                    )}

                    {schedule.notes && (
                      <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}>
                        <div className="flex items-start">
                          <Info className="h-4 w-4 mr-2 mt-0.5" />
                          <p className="text-sm">{schedule.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
              <Calendar className={`h-8 w-8 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <h3 className="text-lg font-medium mb-2">No Schedules Today</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                You don't have any scheduled sessions for {currentDay}.
              </p>
            </div>
          )}
        </div>

        {/* Weekly Schedule Section (simplified) */}
        <div className={`mb-8 p-6 rounded-xl shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className={`mr-2 h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <h2 className="text-xl font-semibold">Weekly Overview</h2>
            </div>
          </div>

          {schedules.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                const daySchedules = schedules.filter(s => s.days.includes(day));
                const isToday = day === currentDay;

                return (
                  <div key={day} className={`p-4 rounded-lg ${isToday
                      ? isDarkMode ? 'bg-blue-900/20 border border-blue-500' : 'bg-blue-50 border border-blue-300'
                      : isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                    }`}>
                    <h3 className={`text-md font-medium mb-2 ${isToday ? (isDarkMode ? 'text-blue-300' : 'text-blue-700') : ''
                      }`}>{day}</h3>

                    {daySchedules.length > 0 ? (
                      <div className="space-y-2">
                        {daySchedules.map(schedule => (
                          <div key={`${day}-${schedule.id}`} className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                            }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{schedule.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${schedule.ageGroup === 'infant'
                                  ? isDarkMode ? 'bg-pink-900/30 text-pink-200' : 'bg-pink-100 text-pink-800'
                                  : schedule.ageGroup === 'toddler'
                                    ? isDarkMode ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-100 text-purple-800'
                                    : schedule.ageGroup === 'preschool'
                                      ? isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                                      : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {schedule.ageGroup ? schedule.ageGroup.charAt(0).toUpperCase() + schedule.ageGroup.slice(1).substring(0, 3) : 'Mix'}
                              </span>
                            </div>
                            <div className="text-xs mt-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center p-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        No scheduled sessions
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No weekly schedules available.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySchedule; 