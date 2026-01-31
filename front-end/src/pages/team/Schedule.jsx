import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import axios from 'axios';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash,
  Users,
  Filter,
  X
} from 'lucide-react';

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [coachs, setCoachs] = useState([]);
  const [children, setPlayers] = useState([]);
  const [newEvent, setNewEvent] = useState({
    coach: '',
    children: [],
    days: [],
    startTime: '09:00',
    endTime: '17:00',
    sessionType: 'full-day',
    status: 'active',
    maxCapacity: 5,
    ageGroup: 'mixed',
    room: '',
    notes: '',
    title: 'Regular Session',
    attendanceRequired: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getSchedule();
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to fetch schedule data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachsAndPlayers = async () => {
    try {
      // Create an array of promises
      const [coachsResponse, childrenResponse] = await Promise.all([
        adminAPI.getCoachs().catch(error => {
          console.error('Error fetching coachs:', error);
          return { data: [] };
        }),
        
        adminAPI.getPlayers().catch(error => {
          console.error('Error fetching children:', error);
          return { data: [] };
        })
      ]);
      
      setCoachs(coachsResponse.data || []);
      setPlayers(childrenResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddEventClick = () => {
    fetchCoachsAndPlayers();
    setShowAddModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (!newEvent.coach || newEvent.days.length === 0 || !newEvent.startTime || !newEvent.endTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      const response = await adminAPI.createScheduleEvent(newEvent);
      
      setEvents([response.data, ...events]);
      setShowAddModal(false);
      setNewEvent({
        coach: '',
        children: [],
        days: [],
        startTime: '09:00',
        endTime: '17:00',
        sessionType: 'full-day',
        status: 'active',
        maxCapacity: 5,
        ageGroup: 'mixed',
        room: '',
        notes: '',
        title: 'Regular Session',
        attendanceRequired: false
      });
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    const days = [...newEvent.days];
    const index = days.indexOf(day);
    
    if (index === -1) {
      days.push(day);
    } else {
      days.splice(index, 1);
    }
    
    setNewEvent({ ...newEvent, days });
  };

  const handlePlayersChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setNewEvent({ ...newEvent, children: selectedOptions });
  };

  const handleEditClick = (event) => {
    fetchCoachsAndPlayers();
    
    // Convert the event data format to the format expected by the form
    const eventData = {
      id: event.id,
      coach: event.coachId || '',
      children: event.childrenIds || [],
      days: event.days || [],
      startTime: event.startTime || '09:00',
      endTime: event.endTime || '17:00',
      sessionType: event.sessionType || 'full-day',
      status: event.status || 'active',
      maxCapacity: event.maxCapacity || 5,
      ageGroup: event.ageGroup || 'mixed',
      room: event.room || '',
      notes: event.notes || '',
      title: event.title || 'Regular Session',
      attendanceRequired: event.attendanceRequired || false
    };
    
    setEditingEvent(eventData);
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      if (!editingEvent.coach || editingEvent.days.length === 0 || !editingEvent.startTime || !editingEvent.endTime) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      const response = await adminAPI.updateScheduleEvent(editingEvent.id, {
        coach: editingEvent.coach,
        children: editingEvent.children,
        days: editingEvent.days,
        startTime: editingEvent.startTime,
        endTime: editingEvent.endTime,
        sessionType: editingEvent.sessionType,
        status: editingEvent.status,
        maxCapacity: editingEvent.maxCapacity,
        ageGroup: editingEvent.ageGroup,
        room: editingEvent.room,
        notes: editingEvent.notes,
        title: editingEvent.title,
        attendanceRequired: editingEvent.attendanceRequired
      });
      
      // Update the events list with the updated event
      setEvents(events.map(event => event.id === response.data.id ? response.data : event));
      
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDayToggle = (day) => {
    const days = [...editingEvent.days];
    const index = days.indexOf(day);
    
    if (index === -1) {
      days.push(day);
    } else {
      days.splice(index, 1);
    }
    
    setEditingEvent({ ...editingEvent, days });
  };

  const handleEditPlayersChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setEditingEvent({ ...editingEvent, children: selectedOptions });
  };

  const filteredEvents = events.filter(event => {
    if (!event) return false;
    return filterType === 'all' || event.type === filterType;
  });

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await adminAPI.deleteScheduleEvent(eventId);
      
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again later.');
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
      }`}>
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className={`px-6 py-3 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>Schedule Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage and organize academy schedules
            </p>
          </div>
          <button
            onClick={handleAddEventClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              isDarkMode
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white'
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Add Schedule</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
            <div className="flex items-center">
              <X className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className={`p-4 rounded-lg mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-2">
            <Filter className={`h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-50 text-gray-900'
              }`}
            >
              <option value="all">All Events</option>
              <option value="class">Classes</option>
              <option value="activity">Activities</option>
              <option value="meal">Meals</option>
              <option value="nap">Nap Time</option>
            </select>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`p-6 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{event.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(event)}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {event.startTime} - {event.endTime}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {event.attendees || 0} attendees
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No events found</p>
            </div>
          )}
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Schedule</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitEvent} className="space-y-6">
                {/* Coach Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Coach</label>
                  <select
                    value={newEvent.coach}
                    onChange={(e) => setNewEvent({ ...newEvent, coach: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  >
                    <option value="">Select Coach</option>
                    {coachs.map((coach) => (
                      <option key={coach._id || coach.id} value={coach._id || coach.id}>
                        {coach.firstName} {coach.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Players Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Players (hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    value={newEvent.children}
                    onChange={handlePlayersChange}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-32"
                  >
                    {children.map((player) => (
                      <option key={player._id || player.id} value={player._id || player.id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Days Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          newEvent.days.includes(day)
                            ? isDarkMode 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>
                
                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Session Type</label>
                  <select
                    value={newEvent.sessionType}
                    onChange={(e) => setNewEvent({ ...newEvent, sessionType: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="full-day">Full Day</option>
                    <option value="half-day-morning">Half Day (Morning)</option>
                    <option value="half-day-afternoon">Half Day (Afternoon)</option>
                  </select>
                </div>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Regular Session"
                  />
                </div>
                
                {/* Max Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={newEvent.maxCapacity}
                      onChange={(e) => setNewEvent({ ...newEvent, maxCapacity: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age Group</label>
                    <select
                      value={newEvent.ageGroup}
                      onChange={(e) => setNewEvent({ ...newEvent, ageGroup: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="infant">Infant</option>
                      <option value="toddler">Toddler</option>
                      <option value="preschool">Preschool</option>
                    </select>
                  </div>
                </div>
                
                {/* Room */}
                <div>
                  <label className="block text-sm font-medium mb-1">Room</label>
                  <input
                    type="text"
                    value={newEvent.room}
                    onChange={(e) => setNewEvent({ ...newEvent, room: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Room (optional)"
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Additional notes (optional)"
                    rows="3"
                  ></textarea>
                </div>
                
                {/* Attendance Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="attendanceRequired"
                    checked={newEvent.attendanceRequired}
                    onChange={(e) => setNewEvent({ ...newEvent, attendanceRequired: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="attendanceRequired" className="text-sm font-medium">
                    Attendance Required
                  </label>
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Adding...' : 'Add Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditModal && editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Schedule</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateEvent} className="space-y-6">
                {/* Coach Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Coach</label>
                  <select
                    value={editingEvent.coach}
                    onChange={(e) => setEditingEvent({ ...editingEvent, coach: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  >
                    <option value="">Select Coach</option>
                    {coachs.map((coach) => (
                      <option key={coach._id || coach.id} value={coach._id || coach.id}>
                        {coach.firstName} {coach.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Players Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Players (hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    value={editingEvent.children}
                    onChange={handleEditPlayersChange}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-32"
                  >
                    {children.map((player) => (
                      <option key={player._id || player.id} value={player._id || player.id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Days Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleEditDayToggle(day)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          editingEvent.days.includes(day)
                            ? isDarkMode 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={editingEvent.startTime}
                      onChange={(e) => setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={editingEvent.endTime}
                      onChange={(e) => setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>
                
                {/* Session Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Session Type</label>
                  <select
                    value={editingEvent.sessionType}
                    onChange={(e) => setEditingEvent({ ...editingEvent, sessionType: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="full-day">Full Day</option>
                    <option value="half-day-morning">Half Day (Morning)</option>
                    <option value="half-day-afternoon">Half Day (Afternoon)</option>
                  </select>
                </div>
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Regular Session"
                  />
                </div>
                
                {/* Max Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={editingEvent.maxCapacity}
                      onChange={(e) => setEditingEvent({ ...editingEvent, maxCapacity: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Age Group</label>
                    <select
                      value={editingEvent.ageGroup}
                      onChange={(e) => setEditingEvent({ ...editingEvent, ageGroup: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="infant">Infant</option>
                      <option value="toddler">Toddler</option>
                      <option value="preschool">Preschool</option>
                    </select>
                  </div>
                </div>
                
                {/* Room */}
                <div>
                  <label className="block text-sm font-medium mb-1">Room</label>
                  <input
                    type="text"
                    value={editingEvent.room}
                    onChange={(e) => setEditingEvent({ ...editingEvent, room: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Room (optional)"
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={editingEvent.notes}
                    onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Additional notes (optional)"
                    rows="3"
                  ></textarea>
                </div>
                
                {/* Attendance Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editAttendanceRequired"
                    checked={editingEvent.attendanceRequired}
                    onChange={(e) => setEditingEvent({ ...editingEvent, attendanceRequired: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="editAttendanceRequired" className="text-sm font-medium">
                    Attendance Required
                  </label>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editingEvent.status}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="filled">Filled</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Updating...' : 'Update Schedule'}
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

export default Schedule; 