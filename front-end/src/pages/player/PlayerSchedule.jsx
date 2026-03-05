import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { playerAPI } from '../../services/api';
import {
    Calendar as CalendarIcon,
    Clock,
    Filter,
    MapPin,
    Users,
    Activity,
    Trophy
} from 'lucide-react';

const PlayerSchedule = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('all');
    const { isDarkMode } = useTheme();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            fetchEvents();
        }
    }, [isAuthenticated]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await playerAPI.getSchedule();
            setEvents(response.data || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setError('Failed to fetch schedule data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        if (!event) return false;
        return filterType === 'all' || event.eventType === filterType;
    });

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
                            Your team's upcoming practices, matches, and events
                        </p>
                    </div>
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
                            className={`rounded-md border-none focus:ring-2 focus:ring-orange-500 ${isDarkMode
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

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border-l-4 border-red-500">
                        {error}
                    </div>
                )}

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
                                    } shadow-md hover:shadow-lg transition-shadow duration-200`}
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
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <CalendarIcon className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                            <p className="text-gray-500 dark:text-gray-400 text-lg">No scheduled events for your team</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerSchedule;
