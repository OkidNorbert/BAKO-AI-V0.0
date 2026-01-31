import React, { useState, useEffect } from 'react';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Calendar,
  User,
  FileText,
  Shield,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/incidents');
      setIncidents(response.data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Failed to fetch incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setIsUpdating(true);
      await api.put(`/admin/incidents/${id}`, { 
        status: newStatus,
        resolutionDescription: newStatus === 'resolved' ? resolutionNote : undefined
      });
      
      // Update local state
      setIncidents(prev => prev.map(incident => 
        incident._id === id ? { ...incident, status: newStatus } : incident
      ));
      
      // Close modal if open
      if (selectedIncident && selectedIncident._id === id) {
        setSelectedIncident(null);
      }
      
      setResolutionNote('');
    } catch (error) {
      console.error('Error updating incident status:', error);
      setError('Failed to update incident status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const notifyContact = async (id) => {
    try {
      setIsUpdating(true);
      await api.post(`/admin/incidents/${id}/notify`);
      alert('Contact notification sent successfully');
    } catch (error) {
      console.error('Error notifying contact:', error);
      setError('Failed to send notification to contact. Please try again.');
    } finally {
      setIsUpdating(false);
    }
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
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'behavior':
        return <User className="h-5 w-5 text-yellow-500" />;
      case 'wellbeing':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  // Filter incidents based on search and filters
  const filteredIncidents = incidents.filter(incident => {
    const playerName = incident.playerId?.firstName && incident.playerId?.lastName ? 
      `${incident.playerId.firstName} ${incident.playerId.lastName}`.toLowerCase() : '';
    const reporterName = incident.reportedBy?.firstName && incident.reportedBy?.lastName ? 
      `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}`.toLowerCase() : '';
    
    const matchesSearch = 
      playerName.includes(searchTerm.toLowerCase()) ||
      reporterName.includes(searchTerm.toLowerCase()) ||
      (incident.description && incident.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
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
        : 'bg-gray-100 text-gray-800'
    }`}>
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
              onClick={fetchIncidents}
              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
              }`}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
            <button 
              onClick={() => setError('')} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className={`mb-6 p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-500'
              }`} />
              <input
                type="text"
                placeholder="Search by player name, reporter or description..."
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
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className={`rounded-md border-none focus:ring-2 ${
                  isDarkMode
                    ? 'bg-gray-700 text-white focus:ring-indigo-500'
                    : 'bg-gray-50 text-gray-900 focus:ring-indigo-500'
                }`}
              >
                <option value="all">All Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className={`rounded-lg overflow-hidden shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {filteredIncidents.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIncidents.map(incident => (
                <div key={incident._id} 
                  className={`p-6 cursor-pointer ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'
                  }`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          incident.playerId?.gender === 'male' 
                          ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {incident.playerId ? (
                            <span className="font-bold">
                              {incident.playerId.firstName?.charAt(0)}
                            </span>
                          ) : (
                            <User className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {incident.playerId ? `${incident.playerId.firstName} ${incident.playerId.lastName}` : 'Unknown Player'}
                          </h3>
                          <div className="flex items-center text-sm">
                            <Calendar className={`h-4 w-4 mr-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span>{incident.date ? format(new Date(incident.date), 'PPP') : 'Unknown date'}</span>
                            <Clock className={`h-4 w-4 ml-3 mr-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span>{incident.date ? format(new Date(incident.date), 'p') : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${
                          getSeverityColor(incident.severity)
                        }`}>
                          {incident.severity?.charAt(0).toUpperCase() + incident.severity?.slice(1)}
                        </span>
                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center ${
                          getStatusColor(incident.status)
                        }`}>
                          {incident.status?.charAt(0).toUpperCase() + incident.status?.slice(1).replace('-', ' ')}
                        </span>
                        <span className="flex items-center">
                          {getTypeIcon(incident.type)}
                          <span className="ml-1 text-xs capitalize">{incident.type}</span>
                        </span>
                      </div>
                      <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {incident.description}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Reported by: {incident.reportedBy ? `${incident.reportedBy.firstName} ${incident.reportedBy.lastName}` : 'Unknown'}
                      </p>
                    </div>
                    <div className="flex flex-row md:flex-col space-x-3 md:space-x-0 md:space-y-2">
                      {incident.status !== 'resolved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(incident._id, 'in-progress');
                          }}
                          className={`px-3 py-1 rounded-md text-sm ${
                            isDarkMode
                              ? 'bg-blue-900 hover:bg-blue-800 text-blue-200'
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                          }`}
                          disabled={isUpdating}
                        >
                          <Clock className="h-4 w-4 inline mr-1" />
                          Mark In Progress
                        </button>
                      )}
                      {incident.status !== 'resolved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(incident);
                          }}
                          className={`px-3 py-1 rounded-md text-sm ${
                            isDarkMode
                              ? 'bg-green-900 hover:bg-green-800 text-green-200'
                              : 'bg-green-100 hover:bg-green-200 text-green-800'
                          }`}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          notifyContact(incident._id);
                        }}
                        className={`px-3 py-1 rounded-md text-sm ${
                          isDarkMode
                            ? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200'
                            : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                        }`}
                        disabled={isUpdating}
                      >
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Notify Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <Shield className={`h-12 w-12 mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No incident management records found.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-xl font-bold mb-4">Resolve Incident</h3>
            <p className="mb-4">Please provide resolution details for this incident:</p>
            
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Enter resolution details..."
              className={`w-full p-3 rounded-md mb-4 ${
                isDarkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-50 text-gray-900 placeholder-gray-500'
              }`}
              rows={4}
              required
            ></textarea>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedIncident(null)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(selectedIncident._id, 'resolved')}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-green-700 hover:bg-green-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                disabled={isUpdating || !resolutionNote.trim()}
              >
                {isUpdating ? 'Updating...' : 'Resolve Incident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
