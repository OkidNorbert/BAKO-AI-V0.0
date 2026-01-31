import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import { Baby, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Players = () => {
  const [children, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activity, setActivity] = useState({
    type: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coach/children');
      setPlayers(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching children:', err);
      setError(err.response?.data?.message || 'Failed to fetch children');
      toast.error('Failed to load children data');
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    try {
      await api.post(`/coach/children/${selectedPlayer._id}/activities`, activity);
      toast.success('Activity added successfully');
      setActivity({
        type: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedPlayer(null);
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error(err.response?.data?.message || 'Failed to add activity');
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${
        isDarkMode ? 'text-red-400' : 'text-red-600'
      }`}>
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Players Under Care</h1>
        <button
          onClick={fetchPlayers}
          className={`px-4 py-2 rounded-lg flex items-center ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`rounded-lg shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className="text-2xl font-bold flex items-center">
              <Baby className="h-6 w-6 mr-2" />
              Players List
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <Baby className={`h-12 w-12 mx-auto mb-4 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-300'
                  }`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No children assigned to you yet.
                  </p>
                </div>
              ) : (
                children.map((player) => (
                  <div
                    key={player._id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        player.gender === 'male' 
                          ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                      }`}>
                        <span className="font-bold">
                          {player.firstName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold">{player.firstName} {player.lastName}</h3>
                        <p className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {calculateAge(player.dateOfBirth)} years old
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {selectedPlayer && (
          <div className={`rounded-lg shadow-lg overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className="text-2xl font-bold flex items-center">
                <Activity className="h-6 w-6 mr-2" />
                Add Activity
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleActivitySubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Activity Type
                  </label>
                  <select
                    value={activity.type}
                    onChange={(e) => setActivity({ ...activity, type: e.target.value })}
                    className={`w-full rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="play">Play</option>
                    <option value="learning">Learning</option>
                    <option value="rest">Rest</option>
                    <option value="meal">Meal</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={activity.description}
                    onChange={(e) => setActivity({ ...activity, description: e.target.value })}
                    className={`w-full rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={activity.date}
                    onChange={(e) => setActivity({ ...activity, date: e.target.value })}
                    className={`w-full rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(null)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                  >
                    Add Activity
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

export default Players; 