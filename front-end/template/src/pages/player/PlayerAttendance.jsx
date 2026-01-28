import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  Baby
} from 'lucide-react';
import { format } from 'date-fns';

const PlayerAttendance = () => {
  const [children, setPlayers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchPlayers();
    fetchAttendanceRecords();
  }, [selectedDate]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coach/children');
      setPlayers(response.data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to fetch children. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/coach/attendance/daily?date=${selectedDate}`);
      setAttendanceRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setError('Failed to fetch attendance records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (playerId, status, sessionType = 'full-day') => {
    try {
      setLoading(true);
      await api.post('/coach/attendance/mark', {
        playerId,
        status,
        sessionType,
        date: selectedDate
      });
      
      // Refresh attendance records
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError('Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (playerId) => {
    try {
      setLoading(true);
      const response = await api.post('/coach/attendance/check-in', {
        playerId,
        date: selectedDate
      });
      
      if (response.data) {
        // Refresh attendance records
        fetchAttendanceRecords();
      }
    } catch (error) {
      console.error('Error checking in player:', error);
      setError('Failed to check in player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (playerId) => {
    try {
      setLoading(true);
      const response = await api.post('/coach/attendance/check-out', {
        playerId,
        date: selectedDate
      });
      
      if (response.data) {
        // Refresh attendance records
        fetchAttendanceRecords();
      }
    } catch (error) {
      console.error('Error checking out player:', error);
      setError('Failed to check out player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return format(new Date(time), 'h:mm a');
  };

  // Define a function to filter and combine data
  const getFilteredPlayers = () => {
    if (!children.length) return [];
    
    return children.filter(player => {
      const name = `${player.firstName} ${player.lastName}`.toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      
      // Find attendance record for this player
      const attendance = attendanceRecords.find(a => a.playerId && (a.playerId._id === player._id || a.playerId === player._id));
      
      // If filtering by status and not 'all', check if attendance status matches
      const matchesStatus = filterStatus === 'all' || 
        (attendance && attendance.status === filterStatus) || 
        (filterStatus === 'not-marked' && !attendance);
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredPlayers = getFilteredPlayers();

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
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
          py-8 px-6 rounded-t-xl shadow-lg relative z-10
        `}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white bg-opacity-20'
              }`}>
                <Baby className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-white'}`} />
              </div>
              <h1 className="text-3xl font-bold text-white">Player Attendance</h1>
            </div>
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
                className={`rounded-md border-none focus:ring-2 focus:ring-offset-1 ${
                isDarkMode
                    ? 'bg-gray-700 text-white focus:ring-yellow-400'
                    : 'bg-white bg-opacity-80 text-gray-900 focus:ring-blue-400'
              }`}
            />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
            <button 
              onClick={() => setError('')} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
              }`} />
              <input
                type="text"
                placeholder="Search by player name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-md border-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-indigo-500'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className={`h-4 w-4 ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
              }`} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`rounded-md border-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-700 text-white focus:ring-indigo-500'
                    : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                }`}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="not-marked">Not Marked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className={`rounded-lg overflow-hidden shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <table className="w-full">
            <thead>
              <tr className={`${
                isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'
              }`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Player Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Session Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Check-in Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Check-out Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => {
                  const attendance = attendanceRecords.find(a => 
                    a.playerId && (a.playerId._id === player._id || a.playerId === player._id)
                  );
                  const hasAttendance = !!attendance;
                  
                  return (
                    <tr key={player._id} className={`${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            player.gender === 'male' 
                            ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                          }`}>
                            <span className="font-bold">
                              {player.firstName.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium">
                            {player.firstName} {player.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={attendance?.sessionType || 'full-day'}
                          onChange={(e) => handleMarkAttendance(player._id, attendance?.status || 'present', e.target.value)}
                          className={`rounded-md border-none focus:ring-2 ${
                            isDarkMode
                              ? 'bg-gray-700 text-white focus:ring-indigo-500'
                              : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                          }`}
                          disabled={hasAttendance}
                        >
                          <option value="full-day">Full Day</option>
                          <option value="half-day-morning">Half Day (Morning)</option>
                          <option value="half-day-afternoon">Half Day (Afternoon)</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasAttendance ? (
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attendance.status === 'present'
                              ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                              : attendance.status === 'absent'
                                ? isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                                : isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getStatusIcon(attendance.status)}
                            <span className="ml-1 capitalize">{attendance.status}</span>
                          </div>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Not Marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendance?.checkInTime ? (
                          <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {formatTime(attendance.checkInTime)}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(player._id)}
                            className={`px-3 py-1 rounded transition-colors ${
                              isDarkMode
                                ? 'bg-indigo-700 hover:bg-indigo-600 text-white'
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            }`}
                            disabled={loading}
                          >
                            Check In
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attendance?.checkOutTime ? (
                          <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {formatTime(attendance.checkOutTime)}
                          </span>
                        ) : attendance?.checkInTime ? (
                          <button
                            onClick={() => handleCheckOut(player._id)}
                            className={`px-3 py-1 rounded transition-colors ${
                              isDarkMode
                                ? 'bg-green-700 hover:bg-green-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                            disabled={loading}
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Not checked in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleMarkAttendance(player._id, 'present')}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                              hasAttendance && attendance.status === 'present'
                                ? isDarkMode ? 'bg-green-900 text-green-300 cursor-not-allowed' : 'bg-green-100 text-green-800 cursor-not-allowed'
                                : isDarkMode ? 'bg-gray-700 hover:bg-green-900 text-gray-300 hover:text-green-300' : 'bg-gray-100 hover:bg-green-100 text-gray-800 hover:text-green-800'
                            }`}
                            disabled={hasAttendance && attendance.status === 'present'}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(player._id, 'absent')}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                              hasAttendance && attendance.status === 'absent'
                                ? isDarkMode ? 'bg-red-900 text-red-300 cursor-not-allowed' : 'bg-red-100 text-red-800 cursor-not-allowed'
                                : isDarkMode ? 'bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300' : 'bg-gray-100 hover:bg-red-100 text-gray-800 hover:text-red-800'
                            }`}
                            disabled={hasAttendance && attendance.status === 'absent'}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(player._id, 'late')}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${
                              hasAttendance && attendance.status === 'late'
                                ? isDarkMode ? 'bg-yellow-900 text-yellow-300 cursor-not-allowed' : 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                                : isDarkMode ? 'bg-gray-700 hover:bg-yellow-900 text-gray-300 hover:text-yellow-300' : 'bg-gray-100 hover:bg-yellow-100 text-gray-800 hover:text-yellow-800'
                            }`}
                            disabled={hasAttendance && attendance.status === 'late'}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Baby className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No children found for the selected criteria.
                    </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* African pattern decoration - bottom */}
      <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 mt-8"></div>
    </div>
  );
};

export default PlayerAttendance; 