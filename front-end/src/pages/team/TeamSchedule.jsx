import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit,
  Trash,
  Users,
  Filter,
  X,
  MapPin,
  Clipboard,
  Activity,
  Trophy
} from 'lucide-react';

const TeamSchedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { isDarkMode } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [players, setPlayers] = useState([]);

  const isCoach = user?.role === 'coach';
  const isOwner = user?.role === 'team';
  // New Event State
  const [newEvent, setNewEvent] = useState({
    coachId: '',
    playerIds: [],
    days: [],
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    eventType: 'practice', // practice, match, workout, meeting
    status: 'scheduled',
    maxPlayers: 15,
    level: 'all',
    location: '', // Court 1, Gym, Away
    notes: '',
    title: 'Team Practice',
    mandatory: true
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

  const fetchCoachesAndPlayers = async () => {
    try {
      // Fetch coaches (users with role 'coach' or 'admin')
      const usersResponse = await adminAPI.getUsers();
      const allUsers = usersResponse.data || [];
      const coachesList = allUsers.filter(u => u.role === 'coach' || u.role === 'admin');

      // Fetch players from roster
      const rosterResponse = await adminAPI.getRoster();
      const playersList = rosterResponse.data || [];

      setCoaches(coachesList);
      setPlayers(playersList);
    } catch (error) {
      console.error('Error fetching coaches/players:', error);
    }
  };

  const handleAddEventClick = () => {
    fetchCoachesAndPlayers();
    setShowAddModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const eventData = {
        title: newEvent.title,
        type: newEvent.eventType,
        start_time: `${newEvent.date}T${newEvent.startTime}:00`,
        end_time: `${newEvent.date}T${newEvent.endTime}:00`,
        location: newEvent.location,
        description: newEvent.notes
      };

      const response = await adminAPI.createScheduleEvent(eventData);
      const createdEvent = response.data;

      // Update local state with the newly created event from server
      setEvents([...events, createdEvent]);
      setShowAddModal(false);
      setNewEvent({
        coachId: '',
        playerIds: [],
        days: [],
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        eventType: 'practice',
        status: 'scheduled',
        maxPlayers: 15,
        level: 'all',
        location: '',
        notes: '',
        title: 'Team Practice',
        mandatory: true
      });
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    const days = [...newEvent.days];
    const index = days.indexOf(day);
    if (index === -1) days.push(day);
    else days.splice(index, 1);
    setNewEvent({ ...newEvent, days });
  };

  const handlePlayersChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setNewEvent({ ...newEvent, playerIds: selectedOptions });
  };

  const handleEditClick = (event) => {
    fetchCoachesAndPlayers();
    setEditingEvent({
      ...event,
      coachId: event.coachId || '',
      playerIds: event.playerIds || [],
      days: event.days || [],
      eventType: event.eventType || 'practice',
      mandatory: event.mandatory || false
    });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // await adminAPI.updateScheduleEvent(editingEvent.id, editingEvent);
      setEvents(events.map(ev => ev.id === editingEvent.id ? editingEvent : ev));
      setShowEditModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      // Mock success
      setEvents(events.map(ev => ev.id === editingEvent.id ? editingEvent : ev));
      setShowEditModal(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (!event) return false;
    return filterType === 'all' || event.eventType === filterType;
  });

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    try {
      // await adminAPI.deleteScheduleEvent(eventId);
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      setEvents(events.filter(event => event.id !== eventId)); // Mock
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white'
      : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
      }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600'
              }`}>Team Schedule</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage practices, matches, and team events
            </p>
          </div>
          {isCoach && (
            <button
              onClick={handleAddEventClick}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${isDarkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                }`}
            >
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </button>
          )}
        </div>

        {/* Filter */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex items-center space-x-2">
            <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`rounded-md ${isDarkMode
                ? 'bg-gray-700 text-white'
                : 'bg-gray-50 text-gray-900'
                }`}
            >
              <option value="all">All Events</option>
              <option value="practice">Practices</option>
              <option value="match">Matches</option>
              <option value="workout">Workouts</option>
              <option value="meeting">Meetings</option>
            </select>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } border-l-4 ${event.eventType === 'match' ? 'border-red-500' :
                    event.eventType === 'practice' ? 'border-orange-500' :
                      event.eventType === 'workout' ? 'border-green-500' : 'border-blue-500'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${event.eventType === 'match' ? 'bg-red-100 text-red-800' :
                        event.eventType === 'practice' ? 'bg-orange-100 text-orange-800' :
                          event.eventType === 'workout' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {event.eventType}
                      </span>
                      {event.mandatory && (
                        <span className="ml-2 text-xs text-red-500 font-semibold">*Mandatory</span>
                      )}
                    </div>
                  </div>
                  {isCoach && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditClick(event)}
                        className={`p-1 rounded-md ${isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                          }`}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className={`p-1 rounded-md ${isDarkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                          }`}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{event.notes || event.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {event.date ? new Date(event.date).toLocaleDateString() : (event.start_time ? new Date(event.start_time).toLocaleDateString() : 'N/A')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {event.startTime ? `${event.startTime} - ${event.endTime}` : (event.start_time ? `${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {event.location || 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {event.attendees || 0} participants
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No scheduled events</p>
            </div>
          )}
        </div>

        {/* Add Event Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Event</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitEvent} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g. Morning Practice"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Event Type</label>
                    <select
                      value={newEvent.eventType}
                      onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="practice">Practice</option>
                      <option value="match">Match</option>
                      <option value="workout">Workout</option>
                      <option value="meeting">Team Meeting</option>
                    </select>
                  </div>

                  {/* Coach Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Lead Coach</label>
                    <select
                      value={newEvent.coachId}
                      onChange={(e) => setNewEvent({ ...newEvent, coachId: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Select Coach</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.name || coach.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Players Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Assign Players (hold Ctrl/Cmd to select multiple)</label>
                  <select
                    multiple
                    value={newEvent.playerIds}
                    onChange={handlePlayersChange}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-32"
                  >
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Event Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>

                {/* Days Selection */}
                <div>
                  <label className="block text-sm font-medium mb-1">Recurring Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1 text-sm rounded-full ${newEvent.days.includes(day)
                          ? isDarkMode
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-500 text-white'
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

                {/* Location & Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Location / Court</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g. Main Court"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Players</label>
                    <input
                      type="number"
                      value={newEvent.maxPlayers}
                      onChange={(e) => setNewEvent({ ...newEvent, maxPlayers: parseInt(e.target.value) })}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      min="1"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1">Notes / Instructions</label>
                  <textarea
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g. Bring white jersey"
                    rows="3"
                  ></textarea>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="eventRequired"
                    checked={newEvent.mandatory}
                    onChange={(e) => setNewEvent({ ...newEvent, mandatory: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="eventRequired" className="text-sm font-medium">
                    Required
                  </label>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className={`px-4 py-2 rounded-lg ${isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg ${isDarkMode
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Adding...' : 'Add Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal (Simplified for brevity, similar structure to Add) */}
        {showEditModal && editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Event</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateEvent} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title</label>
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Event Type</label>
                  <select
                    value={editingEvent.eventType}
                    onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="practice">Practice</option>
                    <option value="match">Match</option>
                    <option value="workout">Workout</option>
                    <option value="meeting">Team Meeting</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Save Changes
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

export default TeamSchedule;