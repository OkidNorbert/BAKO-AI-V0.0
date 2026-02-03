import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';

const BabysitterSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShift, setNewShift] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: '',
    notes: ''
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchSchedule();
  }, [currentDate]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/babysitter/schedule', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: currentDate.toISOString().split('T')[0]
        }
      });
      setSchedule(response.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to fetch schedule. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const token = localStorage.getItem('accessToken');
      await axios.post('/api/babysitter/schedule', newShift, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Shift added successfully');
      setShowAddModal(false);
      setNewShift({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        location: '',
        notes: ''
      });
      fetchSchedule();
    } catch (error) {
      console.error('Error adding shift:', error);
      setError('Failed to add shift. Please try again later.');
    }
  };

  const handleCancelShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to cancel this shift?')) {
      return;
    }

    try {
      setError('');
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/babysitter/schedule/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Shift cancelled successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Error cancelling shift:', error);
      setError('Failed to cancel shift. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Schedule</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousDay}
              className={`p-2 rounded-md ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-medium">
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            <button
              onClick={handleNextDay}
              className={`p-2 rounded-md ${
                isDarkMode
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Shift
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedule.length > 0 ? (
            schedule.map((shift) => (
              <div
                key={shift.id}
                className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {new Date(shift.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(shift.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{shift.location}</span>
                    </div>
                    {shift.children && (
                      <div className="flex items-center text-sm">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{shift.children.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleCancelShift(shift.id)}
                    className={`p-1 rounded-md ${
                      isDarkMode
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="h-5 w-5 text-red-500" />
                  </button>
                </div>
                {shift.notes && (
                  <p className="mt-2 text-sm text-gray-600">{shift.notes}</p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No shifts scheduled for this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className={`relative w-full max-w-md p-6 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Shift</h2>
            <form onSubmit={handleAddShift}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={newShift.date}
                    onChange={(e) => setNewShift(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={newShift.location}
                    onChange={(e) => setNewShift(prev => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={newShift.notes}
                    onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  Add Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabysitterSchedule; 