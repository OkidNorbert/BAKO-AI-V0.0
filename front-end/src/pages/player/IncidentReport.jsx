import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import {
  AlertCircle,
  FileText,
  User,
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Baby,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

const IncidentReport = () => {
  const [children, setPlayers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    type: 'health',
    severity: 'low',
    description: '',
    actionTaken: '',
    followUpRequired: false,
    followUpNotes: ''
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchPlayers();
    fetchIncidents();
  }, []);

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

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coach/incidents');
      setIncidents(response.data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Failed to fetch incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Ensure playerId is selected
      if (!formData.playerId) {
        setError('Please select a player.');
        setLoading(false);
        return;
      }
      
      await api.post('/coach/incidents', formData);
      setShowForm(false);
      setFormData({
        playerId: '',
        type: 'health',
        severity: 'low',
        description: '',
        actionTaken: '',
        followUpRequired: false,
        followUpNotes: ''
      });
      fetchIncidents();
    } catch (error) {
      console.error('Error creating incident report:', error);
      setError('Failed to create incident report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return isDarkMode 
          ? 'bg-red-900 text-red-300' 
          : 'bg-red-100 text-red-800';
      case 'medium':
        return isDarkMode 
          ? 'bg-yellow-900 text-yellow-300'
          : 'bg-yellow-100 text-yellow-800';
      case 'low':
        return isDarkMode 
          ? 'bg-green-900 text-green-300'
          : 'bg-green-100 text-green-800';
      default:
        return isDarkMode 
          ? 'bg-gray-700 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return isDarkMode 
          ? 'bg-blue-900 text-blue-300' 
          : 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return isDarkMode 
          ? 'bg-purple-900 text-purple-300'
          : 'bg-purple-100 text-purple-800';
      case 'resolved':
        return isDarkMode 
          ? 'bg-teal-900 text-teal-300'
          : 'bg-teal-100 text-teal-800';
      default:
        return isDarkMode 
          ? 'bg-gray-700 text-gray-300'
          : 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'health':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'behavior':
        return <User className="h-5 w-5 text-yellow-500" />;
      case 'wellbeing':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Filter incidents based on search term and status
  const filteredIncidents = incidents.filter(incident => {
    const player = children.find(c => c._id === incident.playerId);
    const playerName = player ? `${player.firstName} ${player.lastName}`.toLowerCase() : '';
    const matchesSearch = playerName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
                <Shield className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-white'}`} />
              </div>
              <h1 className="text-3xl font-bold text-white">Incident Management</h1>
            </div>
          <button
            onClick={() => setShowForm(true)}
              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${
              isDarkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
            }`}
          >
            <Plus className="h-5 w-5 mr-2" />
            New Report
          </button>
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
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Report Form */}
        {showForm && (
          <div className={`mb-6 p-6 rounded-lg shadow-md ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
              }`}>New Incident Report</h2>
              <button 
                onClick={() => setShowForm(false)}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label className="block mb-1 font-medium">Player</label>
                  <select
                    name="playerId"
                    value={formData.playerId}
                    onChange={handleInputChange}
                  className={`w-full p-2 rounded-md border-none focus:ring-2 ${
                      isDarkMode
                      ? 'bg-gray-700 text-white focus:ring-indigo-500'
                      : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                    }`}
                  required
                  >
                    <option value="">Select a player</option>
                    {children.map(player => (
                      <option key={player._id} value={player._id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Incident Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border-none focus:ring-2 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white focus:ring-indigo-500'
                        : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                    }`}
                    required
                  >
                    <option value="health">Health</option>
                    <option value="behavior">Behavior</option>
                    <option value="wellbeing">Wellbeing</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Severity</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border-none focus:ring-2 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white focus:ring-indigo-500'
                        : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                    }`}
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
                <div>
                <label className="block mb-1 font-medium">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  className={`w-full p-2 rounded-md border-none focus:ring-2 ${
                      isDarkMode
                      ? 'bg-gray-700 text-white focus:ring-indigo-500'
                      : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                    }`}
                  rows={4}
                  required
                ></textarea>
                </div>
                <div>
                <label className="block mb-1 font-medium">Action Taken</label>
                  <textarea
                    name="actionTaken"
                    value={formData.actionTaken}
                    onChange={handleInputChange}
                  className={`w-full p-2 rounded-md border-none focus:ring-2 ${
                      isDarkMode
                      ? 'bg-gray-700 text-white focus:ring-indigo-500'
                      : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                    }`}
                  rows={3}
                  required
                ></textarea>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                  id="followUpRequired"
                    name="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={handleInputChange}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                <label htmlFor="followUpRequired" className="ml-2">
                  Follow-up Required
                </label>
                </div>
                {formData.followUpRequired && (
                  <div>
                  <label className="block mb-1 font-medium">Follow-up Notes</label>
                    <textarea
                      name="followUpNotes"
                      value={formData.followUpNotes}
                      onChange={handleInputChange}
                    className={`w-full p-2 rounded-md border-none focus:ring-2 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white focus:ring-indigo-500'
                        : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                    }`}
                    rows={2}
                  ></textarea>
                </div>
              )}
              <div className="flex justify-end">
                  <button
                    type="submit"
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      isDarkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    }`}
                  disabled={loading}
                  >
                  {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
          </div>
        )}

        {/* Incidents List */}
        <div className={`rounded-lg overflow-hidden shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {filteredIncidents.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIncidents.map(incident => {
                const player = children.find(c => c._id === incident.playerId);
                return (
                  <div key={incident._id} className={`p-6 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                  }`}>
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center mb-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            player?.gender === 'male' 
                            ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {player ? (
                              <span className="font-bold">
                                {player.firstName.charAt(0)}
                              </span>
                            ) : (
                              <User className="h-6 w-6" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                            </h3>
                            <div className="flex items-center text-sm">
                              <Calendar className={`h-4 w-4 mr-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <span>{new Date(incident.date).toLocaleDateString()}</span>
                              <Clock className={`h-4 w-4 ml-3 mr-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <span>{new Date(incident.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${
                            getSeverityColor(incident.severity)
                          }`}>
                            {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${
                            getStatusColor(incident.status)
                          }`}>
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1).replace('-', ' ')}
                          </span>
                          <span className="flex items-center">
                            {getTypeIcon(incident.type)}
                            <span className="ml-1 text-xs capitalize">{incident.type}</span>
                          </span>
                        </div>
                        <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {incident.description}
                        </p>
                        <div className={`p-3 rounded-md mb-2 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <p className="text-sm font-medium">Action Taken:</p>
                          <p className="text-sm">{incident.actionTaken}</p>
                        </div>
                        {incident.followUpRequired && (
                          <div className={`p-3 rounded-md ${
                            isDarkMode ? 'bg-indigo-900 bg-opacity-20' : 'bg-indigo-50'
                          }`}>
                            <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                            }`}>Follow-up Required:</p>
                            <p className="text-sm">{incident.followUpNotes || 'No specific notes'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <Shield className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No incident reports found.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className={`mt-4 px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  Create Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* African pattern decoration - bottom */}
      <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 mt-8"></div>
    </div>
  );
};

export default IncidentReport; 