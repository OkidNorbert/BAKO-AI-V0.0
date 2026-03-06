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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Team Schedule</h1>
          <p className="text-xl text-gray-500">
            Manage practices, matches, and <span className="text-orange-500 font-black">team events</span>
          </p>
        </div>
        {(isCoach || isOwner) && (
          <button
            onClick={handleAddEventClick}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="p-6 rounded-3xl glass-dark border border-white/5 flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 w-full md:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border-none text-white font-bold focus:outline-none focus:ring-0 appearance-none pr-8 cursor-pointer w-full"
          >
            <option value="all" className="bg-gray-900">All Events</option>
            <option value="practice" className="bg-gray-900">Practices</option>
            <option value="match" className="bg-gray-900">Matches</option>
            <option value="workout" className="bg-gray-900">Workouts</option>
            <option value="meeting" className="bg-gray-900">Meetings</option>
          </select>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`p-8 rounded-[2rem] glass-dark border-t-4 border-r border-b border-l border-white/5 hover:bg-white/5 transition-all duration-300 ${
                event.eventType === 'match' ? 'border-t-red-500' :
                event.eventType === 'practice' ? 'border-t-orange-500' :
                event.eventType === 'workout' ? 'border-t-green-500' : 'border-t-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-xl text-white mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-xl border ${
                      event.eventType === 'match' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                      event.eventType === 'practice' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                      event.eventType === 'workout' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                    }`}>
                      {event.eventType}
                    </span>
                    {event.mandatory && (
                      <span className="text-[10px] uppercase font-black tracking-widest text-red-500">*Required</span>
                    )}
                  </div>
                </div>
                {(isCoach || isOwner) && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditClick(event)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteEvent(event.id)} className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/30">
                      <Trash size={14} />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-400 mb-6 font-bold leading-relaxed line-clamp-2">{event.notes || event.description}</p>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <div className="p-2 rounded-xl bg-white/5 text-gray-500"><CalendarIcon size={16} /></div>
                  {event.date ? new Date(event.date).toLocaleDateString() : (event.start_time ? new Date(event.start_time).toLocaleDateString() : 'N/A')}
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <div className="p-2 rounded-xl bg-white/5 text-gray-500"><Clock size={16} /></div>
                  {event.startTime ? `${event.startTime} - ${event.endTime}` : (event.start_time ? `${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A')}
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <div className="p-2 rounded-xl bg-white/5 text-gray-500"><MapPin size={16} /></div>
                  {event.location || 'TBD'}
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                  <div className="p-2 rounded-xl bg-white/5 text-gray-500"><Users size={16} /></div>
                  {event.attendees || 0} participants
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center glass-dark rounded-[3rem] border border-white/5">
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-2">
                <CalendarIcon size={40} />
              </div>
              <p className="text-xl font-black text-white">No Scheduled Events</p>
              <p className="text-gray-500 font-bold mb-4">Your team calendar is completely open.</p>
              {(isCoach || isOwner) && (
                <button onClick={handleAddEventClick} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                  <Plus size={18} /> Schedule First Event
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Event Modals */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-dark border border-white/10 rounded-[3rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-white">{showAddModal ? 'Schedule Event' : 'Edit Event'}</h2>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSubmitEvent : handleUpdateEvent} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Event Title</label>
                <input
                  type="text"
                  value={showAddModal ? newEvent.title : editingEvent.title}
                  onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, title: e.target.value }) : setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                  placeholder="e.g. Morning Practice"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Event Type</label>
                  <div className="px-4 py-1 rounded-2xl bg-white/5 border border-white/10">
                    <select
                      value={showAddModal ? newEvent.eventType : editingEvent.eventType}
                      onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, eventType: e.target.value }) : setEditingEvent({ ...editingEvent, eventType: e.target.value })}
                      className="w-full bg-transparent border-none text-white font-bold p-3 focus:ring-0 appearance-none cursor-pointer"
                    >
                      <option value="practice" className="bg-gray-900">Practice</option>
                      <option value="match" className="bg-gray-900">Match</option>
                      <option value="workout" className="bg-gray-900">Workout</option>
                      <option value="meeting" className="bg-gray-900">Team Meeting</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Lead Coach</label>
                  <div className="px-4 py-1 rounded-2xl bg-white/5 border border-white/10">
                    <select
                      value={showAddModal ? newEvent.coachId : editingEvent.coachId}
                      onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, coachId: e.target.value }) : setEditingEvent({ ...editingEvent, coachId: e.target.value })}
                      className="w-full bg-transparent border-none text-white font-bold p-3 focus:ring-0 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-gray-900">Select Coach</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id} className="bg-gray-900">{coach.name || coach.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Assign Players (Multi-select)</label>
                <select
                  multiple
                  value={showAddModal ? newEvent.playerIds : editingEvent.playerIds}
                  onChange={handlePlayersChange}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold h-32 custom-scrollbar"
                >
                  {players.map((player) => (
                    <option key={player.id} value={player.id} className="p-2 hover:bg-orange-500">{player.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Event Date</label>
                <input
                  type="date"
                  value={showAddModal ? newEvent.date : editingEvent.date}
                  onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, date: e.target.value }) : setEditingEvent({ ...editingEvent, date: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                  required
                />
              </div>

              {showAddModal && (
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Recurring Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-4 py-2 font-bold text-sm rounded-xl transition-colors border ${newEvent.days.includes(day) ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={showAddModal ? newEvent.startTime : editingEvent.startTime}
                    onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, startTime: e.target.value }) : setEditingEvent({ ...editingEvent, startTime: e.target.value })}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">End Time</label>
                  <input
                    type="time"
                    value={showAddModal ? newEvent.endTime : editingEvent.endTime}
                    onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, endTime: e.target.value }) : setEditingEvent({ ...editingEvent, endTime: e.target.value })}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Location / Court</label>
                  <input
                    type="text"
                    value={showAddModal ? newEvent.location : editingEvent.location}
                    onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, location: e.target.value }) : setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 font-bold"
                    placeholder="e.g. Main Gym"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Max Players</label>
                  <input
                    type="number"
                    value={showAddModal ? newEvent.maxPlayers : editingEvent.maxPlayers}
                    onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, maxPlayers: parseInt(e.target.value) }) : setEditingEvent({ ...editingEvent, maxPlayers: parseInt(e.target.value) })}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 font-bold"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Notes / Instructions</label>
                <textarea
                  value={showAddModal ? newEvent.notes : editingEvent.notes}
                  onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, notes: e.target.value }) : setEditingEvent({ ...editingEvent, notes: e.target.value })}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 font-bold custom-scrollbar"
                  placeholder="e.g. Bring white jersey"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <input
                  type="checkbox"
                  id="eventRequired"
                  checked={showAddModal ? newEvent.mandatory : editingEvent.mandatory}
                  onChange={(e) => showAddModal ? setNewEvent({ ...newEvent, mandatory: e.target.checked }) : setEditingEvent({ ...editingEvent, mandatory: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-gray-900"
                />
                <label htmlFor="eventRequired" className="text-sm font-bold text-white">
                  Mandatory Event
                </label>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-8 py-4 rounded-2xl font-black text-sm transition-colors text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-4 rounded-2xl font-black text-sm transition-colors bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : (showAddModal ? 'Schedule Event' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSchedule;
