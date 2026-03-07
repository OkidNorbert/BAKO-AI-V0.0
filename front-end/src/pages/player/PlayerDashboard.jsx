import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  Video,
  Calendar,
  Clock,
  Activity as ActivityIcon,
  AlertCircle,
  ChevronRight,
  Bell,
  RefreshCw,
  Home,
  Target,
  PlayCircle,
  TrendingUp,
  Award,
  BarChart3,
  Zap,
  Users,
  Eye,
  Timer,
  Star,
  MessageSquare,
  Megaphone,
  Trophy
} from 'lucide-react';

const PlayerDashboard = () => {
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead: markRead } = useNotifications();

  // Player performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    shootingAccuracy: 0,
    dribbleSpeed: 0,
    verticalJump: 0,
    sprintSpeed: 0,
    overallRating: 0,
    improvementRate: 0,
    weeklyStats: {
      sessionsCompleted: 0,
      minutesTrained: 0,
      shotsAttempted: 0,
      shotsMade: 0
    }
  });

  // Skill improvement trends
  const [skillTrends, setSkillTrends] = useState({
    shooting: [],
    dribbling: [],
    defense: [],
    fitness: []
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Mock data logic removed to prepare for real backend integration

      // Fetch player data (notifications only for team-created accounts)
      const promises = [
        api.get('/player/training-videos').catch(() => ({ data: [] })),
        api.get('/player/training-history').catch(() => ({ data: [] })),
        api.get('/player/performance-metrics').catch(() => ({ data: {} })),
        api.get('/player/skill-trends').catch(() => ({ data: { shooting: [], dribbling: [], defense: [], fitness: [] } })),
        ...(user?.organizationId ? [api.get('/communications/announcements').catch(() => ({ data: { announcements: [] } }))] : [])
      ];
      const results = await Promise.all(promises);
      const videosResponse = results[0];
      const historyResponse = results[1];
      const metricsResponse = results[2];
      const trendsResponse = results[3];
      const announcementsResponse = user?.organizationId ? results[4] : null;

      setTrainingVideos(videosResponse.data || []);
      setTrainingHistory(historyResponse.data || []);
      if (announcementsResponse) {
        setAnnouncements(announcementsResponse.data.announcements || []);
      }

      // Set performance metrics with robust fallback
      const metricsData = metricsResponse.data || {};
      setPerformanceMetrics({
        shootingAccuracy: metricsData.shootingAccuracy || 0,
        dribbleSpeed: metricsData.dribbleSpeed || 0,
        verticalJump: metricsData.verticalJump || 0,
        sprintSpeed: metricsData.sprintSpeed || 0,
        overallRating: metricsData.overallRating || 0,
        improvementRate: metricsData.improvementRate || 0,
        weeklyStats: {
          sessionsCompleted: metricsData.weeklyStats?.sessionsCompleted || 0,
          minutesTrained: metricsData.weeklyStats?.minutesTrained || 0,
          shotsAttempted: metricsData.weeklyStats?.shotsAttempted || 0,
          shotsMade: metricsData.weeklyStats?.shotsMade || 0
        }
      });

      // Set skill trends
      const trends = trendsResponse.data || {
        shooting: [],
        dribbling: [],
        defense: [],
        fitness: []
      };
      setSkillTrends(trends);

    } catch (err) {
      console.error('fetchData:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
      else if (err.code === 'ERR_NETWORK') setError('Unable to connect. Please check your connection.');
      else setError('Failed to fetch data. Please try again.');
      setTrainingVideos([]);
      setTrainingHistory([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await markRead(notificationId);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-7xl mx-auto p-8 space-y-12">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4">Player Dashboard</h1>
                <p className={`text-xl ${sub}`}>Welcome back, <span className="text-orange-500 font-black">{user?.firstName || 'Champ'}</span>. Ready to grind?</p>
            </div>

        </div>

        {error && (
          <div className="mb-6 p-6 glass rounded-3xl border-l-4 border-red-500 text-red-400 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-4" />
              <span className="font-bold">{error}</span>
            </div>
            <button onClick={() => { setIsRetrying(true); fetchData().finally(() => setIsRetrying(false)); }} disabled={isRetrying} className={`px-4 py-2 rounded-xl flex items-center font-bold text-xs ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <RefreshCw className={`h-3 w-3 mr-2 ${isRetrying ? 'animate-spin' : ''}`} /> Retry
            </button>
          </div>
        )}

        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Overall Rating', value: performanceMetrics.overallRating, icon: <Star />, color: 'bg-orange-500' },
                { label: 'Shooting %', value: `${performanceMetrics.shootingAccuracy}%`, icon: <Target />, color: 'bg-red-500' },
                { label: 'Improvement', value: `+${performanceMetrics.improvementRate}%`, icon: <TrendingUp />, color: 'bg-green-500' },
                { label: 'Training Sessions', value: performanceMetrics.weeklyStats?.sessionsCompleted || 0, icon: <Timer />, color: 'bg-blue-500' },
              ].map(stat => (
                <div key={stat.label} className={`group p-8 rounded-[2.5rem] border transition-all duration-500 hover:scale-105 ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50 hover:bg-gray-800/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                    <div className={`p-3 rounded-2xl mb-4 text-white inline-block shadow-lg ${stat.color}`}>
                        {React.cloneElement(stat.icon, { className: 'h-6 w-6' })}
                    </div>
                    <p className={`text-3xl font-black tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                    <p className={`text-[10px] uppercase tracking-widest font-black ${sub}`}>{stat.label}</p>
                </div>
              ))}
        </div>

        {/* Combined Feeds Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left Column: Communications & Activity */}
            <div className="lg:col-span-1 space-y-10">
                {/* Announcements */}
                <div className={`rounded-[3rem] p-8 glass-dark shadow-glass overflow-hidden relative`}>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Megaphone className="h-32 w-32" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight mb-8">Team News</h2>
                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <p className={`text-sm italic opacity-50`}>No new announcements from coach.</p>
                        ) : (
                            announcements.slice(0, 3).map((ann, i) => (
                                <div key={i} className={`p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors`}>
                                    <h3 className="font-black text-sm mb-1">{ann.title}</h3>
                                    <p className="text-[11px] opacity-60 line-clamp-2">{ann.content}</p>
                                </div>
                            ))
                        )}
                        <Link to="/player/announcements" className="block text-center pt-4 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400">View Bulletin Board</Link>
                    </div>
                </div>

                {/* Notifications */}
                <div className={`rounded-[3rem] p-8 border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
                    <h2 className="text-2xl font-black tracking-tight mb-8 flex items-center justify-between">
                        Pulse
                        {unreadCount > 0 && <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />}
                    </h2>
                    <div className="space-y-4">
                        {notifications.slice(0, 3).map((n, i) => (
                            <div key={i} onClick={() => !n.read && markAsRead(n.id)} className={`p-5 rounded-2xl transition-all cursor-pointer ${!n.read ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-white/5'}`}>
                                <h3 className={`text-xs font-black ${!n.read ? 'text-orange-400' : ''}`}>{n.title}</h3>
                                <p className="text-[10px] opacity-60 truncate">{n.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Training & Performance */}
            <div className="lg:col-span-2 space-y-10">
                {/* Videos Feed */}
                <div className={`rounded-[3rem] p-8 border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black tracking-tight">Recent Sessions</h2>
                        <Link to="/player/training" className="text-xs font-black uppercase tracking-widest text-orange-500">All Sessions</Link>
                    </div>
                    {trainingVideos.length === 0 ? (
                        <div className="text-center py-10 opacity-40">
                            <Video className="h-16 w-16 mx-auto mb-4" />
                            <p className="font-bold">No footage detected yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {trainingVideos.slice(0, 2).map((v, i) => (
                                <Link key={i} to={`/player/training`} className="group block relative aspect-video rounded-3xl overflow-hidden bg-black">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                    <PlayCircle className="absolute inset-0 m-auto h-12 w-12 text-white/50 group-hover:text-orange-500 transition-all z-20 scale-150 group-hover:scale-100 opacity-0 group-hover:opacity-100" />
                                    <div className="absolute bottom-6 left-6 z-20">
                                        <p className="text-white font-black text-lg">{v.title || 'Training Clip'}</p>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{v.status}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Performance Trends Chart Placeholder */}
                <div className={`rounded-[3rem] p-8 glass-dark shadow-glass`}>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black tracking-tight">Efficiency Trends</h2>
                        <div className="flex gap-2">
                            {['7D', '1M', '6M'].map(t => <button key={t} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-colors ${t === '7D' ? 'bg-orange-500 text-white shadow-premium' : 'bg-white/5 hover:bg-white/10'}`}>{t}</button>)}
                        </div>
                    </div>
                    {/* Simulated Graph Lines */}
                    <div className="h-48 flex items-end gap-2 px-2">
                        {[40, 60, 45, 80, 55, 90, 75, 85, 95, 80, 100].map((h, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div style={{ height: `${h}%` }} className={`w-full rounded-t-lg transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] ${i === 10 ? 'bg-orange-500' : 'bg-white/10 group-hover:bg-white/20'}`} />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Access Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-t border-white/5">
                {[
                    { label: 'Bio Analysis', path: '/player/training', icon: <PlayCircle /> },
                    { label: 'Drill Schedule', path: '/player/schedule', icon: <Calendar /> },
                    { label: 'Leaderboard', path: '/player/skills', icon: <Trophy /> },
                    { label: 'Account', path: '/player/profile', icon: <Users /> },
                ].map(action => (
                    <Link key={action.label} to={action.path} className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] transition-all duration-500 hover:bg-orange-500 hover:text-white group`}>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-transparent group-hover:border-white/30 transition-all">
                            {React.cloneElement(action.icon, { className: 'h-8 w-8' })}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">{action.label}</span>
                    </Link>
                ))}
        </div>
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getSessionTypeIcon = (type) => {
  switch (type) {
    case 'shooting': return <Target className="h-4 w-4" />;
    case 'dribbling': return <ActivityIcon className="h-4 w-4" />;
    case 'defense': return <TrendingUp className="h-4 w-4" />;
    default: return <Video className="h-4 w-4" />;
  }
};

const getSessionTypeColor = (type, isDarkMode) => {
  switch (type) {
    case 'shooting': return isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800';
    case 'dribbling': return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
    case 'defense': return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
    default: return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
  }
};

export default PlayerDashboard;
