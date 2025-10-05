import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamEvent {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: 'practice' | 'game' | 'meeting' | 'training';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: string[];
  created_by: string;
}

export const TeamSchedule: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);

  useEffect(() => {
    fetchTeamEvents();
  }, []);

  const fetchTeamEvents = async () => {
    try {
      setLoading(true);
      const response = await api.schedule.getEvents();
      setEvents(response.data);
    } catch (error: any) {
      // Handle 503 errors silently
      if (error.name === 'SilentError' || error.message?.includes('Service unavailable')) {
        // Service unavailable - show empty state
        setEvents([]);
      } else {
        console.error('Error fetching team events:', error);
        showToast('Failed to load team schedule', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: Partial<TeamEvent>) => {
    try {
      await api.schedule.createEvent(eventData);
      showToast('Event created successfully', 'success');
      setShowCreateEvent(false);
      fetchTeamEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      showToast('Failed to create event', 'error');
    }
  };

  const handleUpdateEvent = async (eventId: number, eventData: Partial<TeamEvent>) => {
    try {
      await api.schedule.updateEvent(eventId, eventData);
      showToast('Event updated successfully', 'success');
      setSelectedEvent(null);
      fetchTeamEvents();
    } catch (error: any) {
      console.error('Error updating event:', error);
      showToast('Failed to update event', 'error');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.schedule.deleteEvent(eventId);
        showToast('Event deleted successfully', 'success');
        fetchTeamEvents();
      } catch (error: any) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event', 'error');
      }
    }
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'practice':
        return 'bg-blue-100 text-blue-800';
      case 'game':
        return 'bg-red-100 text-red-800';
      case 'meeting':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Team Schedule
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage team events, practices, and games
              </p>
            </div>
            <button
              onClick={() => setShowCreateEvent(true)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                darkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              + Schedule Event
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className={`px-3 py-1 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className={`px-3 py-1 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className={`px-3 py-1 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className={`text-center py-2 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 6);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDate(date);

              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-2 border rounded-lg ${
                    darkMode ? 'border-gray-600' : 'border-gray-200'
                  } ${
                    isCurrentMonth
                      ? darkMode ? 'bg-gray-700' : 'bg-white'
                      : darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                  } ${isToday ? 'ring-2 ring-orange-500' : ''}`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-orange-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getEventTypeColor(event.event_type)}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            Upcoming Events
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No events scheduled
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                Schedule your first team event to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {event.title}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.event_type)}`}>
                        {event.event_type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                    {event.description}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{new Date(event.start_time).toLocaleString()}</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className={`px-3 py-1 text-xs rounded ${
                        darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className={`px-3 py-1 text-xs rounded ${
                        darkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Schedule Event
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const eventData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  start_time: formData.get('start_time') as string,
                  end_time: formData.get('end_time') as string,
                  location: formData.get('location') as string,
                  event_type: formData.get('event_type') as 'practice' | 'game' | 'meeting' | 'training',
                };
                handleCreateEvent(eventData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Event Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Event Type
                    </label>
                    <select
                      name="event_type"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="practice">Practice</option>
                      <option value="game">Game</option>
                      <option value="meeting">Meeting</option>
                      <option value="training">Training</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      name="start_time"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      name="end_time"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Schedule Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateEvent(false)}
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

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Event Details
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedEvent.title}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedEvent.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start:</span>
                    <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(selectedEvent.start_time).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>End:</span>
                    <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {new Date(selectedEvent.end_time).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location:</span>
                    <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedEvent.location}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getEventTypeColor(selectedEvent.event_type)}`}>
                      {selectedEvent.event_type}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
