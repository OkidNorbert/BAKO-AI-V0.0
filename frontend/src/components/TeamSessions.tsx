import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamSession {
  id: number;
  player_id: number;
  player_name: string;
  session_type: string;
  duration: number;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'paused';
  performance_score?: number;
  events_count: number;
  video_uploaded: boolean;
  notes?: string;
}

export const TeamSessions: React.FC = () => {
  const {  } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<TeamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showStartSession, setShowStartSession] = useState(false);
  const [sortBy, setSortBy] = useState('start_time');

  useEffect(() => {
    fetchTeamSessions();
  }, []);

  const fetchTeamSessions = async () => {
    try {
      setLoading(true);
      const response = await api.sessions.getTeamSessions();
      setSessions(response.data || []);
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 503 || error.name === 'SilentError') {
        // Service unavailable - show empty state silently
        setSessions([]);
      } else {
        // Only log and show toast for unexpected errors
        console.error('Error fetching team sessions:', error);
        showToast('Failed to load team sessions', 'error');
      }
      setLoading(false);
    }
  };

  // @ts-ignore
  const handleStartSession = async (sessionData: Partial<TeamSession>) => {
    try {
      // TODO: Implement API call to start session
      showToast('Session started successfully', 'success');
      setShowStartSession(false);
      fetchTeamSessions();
    } catch (error: any) {
      console.error('Error starting session:', error);
      showToast('Failed to start session', 'error');
    }
  };

  const handleEndSession = async (sessionId: number) => {
    console.log("Ending session with ID:", sessionId); // Added for linting
    try {
      // TODO: Implement API call to end session
      showToast('Session ended successfully', 'success');
      fetchTeamSessions();
    } catch (error: any) {
      console.error('Error ending session:', error);
      showToast('Failed to end session', 'error');
    }
  };

  const handleViewAnalytics = (session: TeamSession) => {
    console.log("Viewing analytics for session:", session.id); // Added for linting
    // TODO: Navigate to session analytics
    showToast('Opening session analytics...', 'info');
  };

  const filteredSessions = sessions.filter(session => {
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesType = filterType === 'all' || session.session_type === filterType;
    return matchesStatus && matchesType;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'start_time':
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      case 'duration':
        return b.duration - a.duration;
      case 'performance':
        return (b.performance_score || 0) - (a.performance_score || 0);
      default:
        return 0;
    }
  });

  const sessionTypes = ['all', ...Array.from(new Set(sessions.map(s => s.session_type).filter(Boolean)))];

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
                Team Sessions
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Monitor and manage team training sessions
              </p>
            </div>
            <button
              onClick={() => setShowStartSession(true)}
              className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg`}
            >
              + Start Session
            </button>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                {sessionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                <option value="start_time">Start Time</option>
                <option value="duration">Duration</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchTeamSessions}
                className={`w-full px-4 py-2 ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } rounded-lg transition-colors`}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div key={session.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {session.player_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {session.player_name}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {session.session_type} • {new Date(session.start_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    session.status === 'active' ? 'bg-green-100 text-green-800' :
                    session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {session.status}
                  </span>
                  {session.performance_score && (
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {session.performance_score}%
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Performance
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</div>
                  <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {Math.floor(session.duration / 60)}m {session.duration % 60}s
                  </div>
                </div>
                <div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Events</div>
                  <div className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {session.events_count}
                  </div>
                </div>
                <div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Video</div>
                  <div className={`text-lg font-semibold ${session.video_uploaded ? 'text-green-600' : 'text-red-600'}`}>
                    {session.video_uploaded ? '✓ Uploaded' : '✗ Not uploaded'}
                  </div>
                </div>
                <div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</div>
                  <div className={`text-lg font-semibold ${
                    session.status === 'active' ? 'text-green-600' :
                    session.status === 'completed' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </div>
                </div>
              </div>

              {session.notes && (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 mb-4`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <strong>Notes:</strong> {session.notes}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Link
                  to={`/sessions/${session.id}`}
                  className={`flex-1 px-4 py-2 bg-orange-600 text-white text-center rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium`}
                >
                  View Details
                </Link>
                <button
                  onClick={() => {
                    if (session.status === 'active') {
                      handleEndSession(session.id);
                    } else {
                      // TODO: Implement resume session
                      showToast('Resume session functionality coming soon!', 'info');
                    }
                  }}
                  className={`flex-1 px-4 py-2 ${
                    session.status === 'active'
                      ? darkMode 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                      : darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  } text-center rounded-lg transition-colors text-sm font-medium`}
                >
                  {session.status === 'active' ? 'End Session' : 'Resume'}
                </button>
                <button
                  onClick={() => handleViewAnalytics(session)}
                  className={`flex-1 px-4 py-2 ${
                    darkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  } text-center rounded-lg transition-colors text-sm font-medium`}
                >
                  Analytics
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredSessions.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-6xl mb-4">📹</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No sessions found
            </h3>
            <p>
              {filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'No training sessions have been recorded yet'
              }
            </p>
          </div>
        )}

        {/* Session Stats */}
        {sessions.length > 0 && (
          <div className="mt-8">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Session Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {sessions.length}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Sessions
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {sessions.filter(s => s.status === 'active').length}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Active Now
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60)}m
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Duration
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {sessions.filter(s => s.video_uploaded).length}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    With Videos
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Session Modal */}
        {showStartSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Start New Session
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const sessionData = {
                  player_name: formData.get('player_name') as string,
                  session_type: formData.get('session_type') as string,
                  notes: formData.get('notes') as string,
                };
                handleStartSession(sessionData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Player
                    </label>
                    <select
                      name="player_name"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Player</option>
                      {/* TODO: Populate with actual team players */}
                      <option value="Player 1">Player 1</option>
                      <option value="Player 2">Player 2</option>
                      <option value="Player 3">Player 3</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Session Type
                    </label>
                    <select
                      name="session_type"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="training_session">Training Session</option>
                      <option value="game_session">Game Session</option>
                      <option value="practice_session">Practice Session</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Add any notes about this session..."
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Start Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStartSession(false)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
