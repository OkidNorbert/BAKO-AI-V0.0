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

  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Team Schedule</h1>
                <p className={`text-xl ${sub}`}>Your roadmap to <span className="text-orange-500 font-black">victory</span>. Stay locked in.</p>
            </div>
            <div className={`flex items-center gap-4 p-4 rounded-[2rem] border-2 shadow-glass ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                <div className="h-12 w-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-premium">
                    <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Next Event</p>
                   <p className="text-xl font-black">{filteredEvents[0]?.title || 'Rest Day'}</p>
                </div>
            </div>
        </div>

        {/* Filter & Stats Row */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 p-2 rounded-3xl glass-dark border border-white/5 shadow-glass w-full lg:w-auto">
                {['all', 'practice', 'match', 'workout'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${filterType === type 
                            ? 'bg-orange-500 text-white shadow-premium scale-105' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>
            
            <div className="flex gap-4 w-full lg:w-auto">
                <div className="flex-1 lg:w-48 p-6 glass-dark rounded-[2.5rem] border border-white/5 shadow-glass group hover:border-orange-500/30 transition-all duration-500">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity">Total Events</p>
                    <p className="text-3xl font-black text-white">{filteredEvents.length}</p>
                </div>
                <div className="flex-1 lg:w-48 p-6 glass-dark rounded-[2.5rem] border border-white/5 shadow-glass group hover:border-red-500/30 transition-all duration-500">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-opacity">Matches</p>
                    <p className="text-3xl font-black text-red-500">{events.filter(e => e.eventType === 'match').length}</p>
                </div>
            </div>
        </div>

        {error && (
            <div className="p-6 glass rounded-3xl border-l-4 border-red-500 text-red-400 font-bold animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="h-5 w-5 mr-3 inline" /> {error}
            </div>
        )}

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => {
              const typeConfig = {
                match: { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-500', icon: <Trophy /> },
                practice: { border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-500', icon: <Activity /> },
                workout: { border: 'border-green-500/50', bg: 'bg-green-500/10', text: 'text-green-500', icon: <Activity /> },
                meeting: { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-500', icon: <Users /> }
              }[event.eventType] || { border: 'border-white/20', bg: 'bg-white/5', text: 'text-white', icon: <CalendarIcon /> };

              return (
                <div
                    key={event.id}
                    className={`group relative p-8 rounded-[3rem] glass-dark border border-white/5 shadow-glass hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-6`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    {/* Background abstract element */}
                    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                        {React.cloneElement(typeConfig.icon, { className: "h-32 w-32" })}
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`px-5 py-2 rounded-2xl ${typeConfig.bg} border ${typeConfig.border} ${typeConfig.text} text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}>
                                {typeConfig.icon && React.cloneElement(typeConfig.icon, { className: "h-3 w-3" })}
                                {event.eventType}
                            </div>
                            {event.mandatory && (
                                <div className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Mandatory
                                </div>
                            )}
                        </div>

                        <h3 className="text-3xl font-black tracking-tight mb-4 group-hover:text-orange-500 transition-colors">{event.title}</h3>
                        <p className={`text-sm font-medium mb-10 line-clamp-2 opacity-50 group-hover:opacity-100 transition-opacity leading-relaxed`}>
                            {event.notes || event.description || 'No additional session details provided.'}
                        </p>

                        <div className="mt-auto space-y-4">
                            <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                <CalendarIcon className="h-5 w-5 mr-4 text-orange-500" />
                                <span className="text-sm font-black text-white/80">
                                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Date TBD'}
                                </span>
                            </div>
                            <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                <Clock className="h-5 w-5 mr-4 text-orange-500" />
                                <span className="text-sm font-black text-white/80">
                                    {event.startTime ? `${event.startTime} - ${event.endTime}` : 'Time TBD'}
                                </span>
                            </div>
                            <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                                <MapPin className="h-5 w-5 mr-4 text-orange-500" />
                                <span className="text-sm font-black text-white/80 line-clamp-1">{event.location || 'Tactical Room'}</span>
                            </div>
                        </div>
                    </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-24 glass-dark rounded-[4rem] border border-white/5 text-center">
                <CalendarIcon className="h-24 w-24 mx-auto mb-6 text-white opacity-10" />
                <h3 className="text-3xl font-black opacity-20 uppercase tracking-tighter">Mission Log Clear</h3>
                <p className={`mt-2 ${sub}`}>No upcoming team operations scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerSchedule;
