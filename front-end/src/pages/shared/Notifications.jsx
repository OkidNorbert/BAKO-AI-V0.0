import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, playerAPI } from '../../services/api';
import {
  Bell,
  Calendar,
  Video,
  Trophy,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  X,
  ChevronRight,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Personal player (unlinked) has no notifications — redirect to dashboard
  useEffect(() => {
    if (user?.role === 'player' && !user?.organizationId) {
      navigate('/player', { replace: true });
    }
  }, [user?.role, user?.organizationId, navigate]);

  useEffect(() => {
    if (user?.role === 'player' && !user?.organizationId) {
      setLoading(false);
      return;
    }
    fetchNotifications();
  }, [filter, user?.role, user?.organizationId]);

  const fetchNotifications = async () => {
    if (user?.role === 'player' && !user?.organizationId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let raw = [];
      const isAdminRole = user?.role === 'team' || user?.role === 'coach' || user?.role === 'admin';

      if (isAdminRole) {
        const res = await adminAPI.getNotifications();
        const data = res?.data;
        raw = Array.isArray(data) ? data : (data?.sent && data?.received ? [...(data.sent || []), ...(data.received || [])] : []);
      } else if (user?.role === 'player' && user?.organizationId) {
        const res = await playerAPI.getNotifications();
        raw = Array.isArray(res?.data) ? res.data : [];
      }

      const list = raw.map(n => ({
        id: n.id,
        type: n.type || 'system_update',
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        timestamp: n.timestamp || n.createdAt || n.created_at,
        read: !!n.read,
        priority: n.priority || 'medium',
        actionUrl: n.actionUrl || n.action_url || null
      }));

      let filtered = list;
      if (filter !== 'all') {
        filtered = list.filter(n => n.type === filter);
      }

      if (user?.role === 'player') {
        filtered = filtered.filter(n => !['team_invite', 'match_scheduled'].includes(n.type));
      }

      setNotifications(filtered);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    try {
      const isAdminRole = user?.role === 'team' || user?.role === 'coach' || user?.role === 'admin';
      if (isAdminRole) await adminAPI.markNotificationAsRead(notificationId);
      else if (user?.role === 'player') await playerAPI.markNotificationAsRead(notificationId);
    } catch (e) {
      console.warn('Error marking notification as read:', e);
    }
  };

  const deleteNotification = async (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    try {
      const isAdminRole = user?.role === 'team' || user?.role === 'coach' || user?.role === 'admin';
      if (isAdminRole) await adminAPI.deleteNotification(notificationId);
      else if (user?.role === 'player') await playerAPI.deleteNotification(notificationId);
    } catch (e) {
      console.warn('Error deleting notification:', e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const isAdminRole = user?.role === 'team' || user?.role === 'coach' || user?.role === 'admin';
      if (isAdminRole) await api.put('/admin/notifications/read-all');
      else if (user?.role === 'player') await playerAPI.markAllNotificationsAsRead();
    } catch (e) {
      console.warn('Error marking all as read:', e);
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'video_analysis':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'team_invite':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'training_reminder':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'match_scheduled':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'performance_update':
        return <Trophy className="w-5 h-5 text-blue-500" />;
      case 'system_update':
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
      case 'announcement':
        return <Bell className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return isDarkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50';
      case 'medium':
        return isDarkMode ? 'border-yellow-500 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-50';
      case 'low':
        return isDarkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50';
      default:
        return isDarkMode ? 'border-gray-500 bg-gray-900/20' : 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Don't render notifications UI for personal player (redirecting)
  if (user?.role === 'player' && !user?.organizationId) {
    return null;
  }

  const filters = [
    { value: 'all', label: 'All Notifications' },
    { value: 'video_analysis', label: 'Video Analysis' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'training_reminder', label: 'Training' },
    { value: 'performance_update', label: 'Performance' },
    { value: 'system_update', label: 'System' }
  ];

  // Add team-specific filters for team accounts
  if (user?.role === 'team') {
    filters.splice(2, 0,
      { value: 'team_invite', label: 'Team Invites' },
      { value: 'match_scheduled', label: 'Matches' }
    );
  }

  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-5xl mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-6xl font-black tracking-tighter text-white">Inbox</h1>
                    {unreadCount > 0 && (
                        <span className="px-4 py-1.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-premium animate-pulse">
                            {unreadCount} UNREAD
                        </span>
                    )}
                </div>
                <p className={`text-xl ${sub}`}>Operational updates and <span className="text-orange-500 font-black">mission</span> status.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
                <button
                    onClick={markAllAsRead}
                    className={`flex items-center px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
                >
                    <CheckCircle className="w-3.5 h-3.5 mr-2" />
                    Sync Read
                </button>
                <button
                    onClick={clearAllNotifications}
                    className={`flex items-center px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all duration-300 bg-red-500 hover:bg-red-600 shadow-premium`}
                >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Purge All
                </button>
                <button
                    onClick={fetchNotifications}
                    className={`p-3 rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="p-2 rounded-[2rem] glass-dark border border-white/5 shadow-glass flex flex-wrap gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {filters.map(f => (
                <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f.value 
                        ? 'bg-orange-500 text-white shadow-premium' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                    {f.label}
                </button>
            ))}
        </div>

        {/* Notifications List Container */}
        <div className={`rounded-[3rem] overflow-hidden border border-white/5 glass-dark shadow-glass min-h-[400px]`}>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-30`}>Retrieving Comms...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                    <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                        <Bell className={`w-10 h-10 opacity-20`} />
                    </div>
                    <h3 className="text-3xl font-black opacity-20 uppercase tracking-tighter">Frequency Silent</h3>
                    <p className={`mt-2 ${sub} max-w-xs mx-auto`}>
                        {filter === 'all'
                        ? 'No active intel. You\'re caught up on all tactical operations.'
                        : `No records found for ${filters.find(f => f.value === filter)?.label}.`
                        }
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-white/5">
                {notifications.map((notification, idx) => (
                    <div
                        key={notification.id}
                        className={`group relative p-8 transition-all duration-500 cursor-pointer ${!notification.read ? 'bg-orange-500/[0.03]' : 'hover:bg-white/[0.02]'}`}
                        onClick={() => setSelectedNotification(notification)}
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {/* Status Indicator */}
                        {!notification.read && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-orange-500 rounded-r-full shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
                        )}

                        <div className="flex items-start gap-8 relative z-10">
                            {/* Icon Stack */}
                            <div className={`flex-shrink-0 w-16 h-16 rounded-2xl border flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${getPriorityColor(notification.priority)}`}>
                                {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content Block */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex-1">
                                        <h3 className={`text-xl font-black tracking-tight group-hover:text-orange-500 transition-colors ${!notification.read ? 'text-white' : 'text-white/60'}`}>
                                            {notification.title}
                                        </h3>
                                        <p className={`text-sm font-medium mt-1 leading-relaxed line-clamp-2 ${!notification.read ? 'text-white/80' : 'text-white/40'}`}>
                                            {notification.message}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                className={`p-3 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all`}
                                                title="Mark as read"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            className={`p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all`}
                                            title="Delete notification"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Clock className="w-3.5 h-3.5 mr-2 text-orange-500" />
                                        {formatTimestamp(notification.timestamp)}
                                    </div>
                                    
                                    {notification.actionUrl && (
                                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-500 group-hover:translate-x-1 transition-transform">
                                            Intelligence Available →
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>

        {/* Intelligence Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-[#0f1115]/95 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in transition-all">
            <div className="max-w-2xl w-full p-12 rounded-[4rem] glass-dark border border-white/5 shadow-premium animate-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-10">
                <div className={`px-6 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-40`}>
                    Communication Details
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className={`p-4 rounded-2xl hover:bg-white/5 transition-all`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center gap-8 mb-12">
                <div className={`w-24 h-24 rounded-[2rem] border-2 flex items-center justify-center shadow-lg ${getPriorityColor(selectedNotification.priority)}`}>
                  {React.cloneElement(getNotificationIcon(selectedNotification.type), { className: "w-10 h-10" })}
                </div>
                <div>
                   <h3 className="text-4xl font-black tracking-tighter mb-4">
                    {selectedNotification.title}
                  </h3>
                  <p className={`text-lg font-medium opacity-60 leading-relaxed`}>
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-10">
                <div className="flex items-center text-[10px] font-black uppercase tracking-widest opacity-30">
                    <Clock className="w-4 h-4 mr-3 text-orange-500" />
                    Sent {new Date(selectedNotification.timestamp).toLocaleString()}
                </div>

                {selectedNotification.actionUrl ? (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      window.location.href = selectedNotification.actionUrl;
                    }}
                    className="px-12 py-5 rounded-3xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-premium hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] transition-all hover:scale-105"
                  >
                    Assess Intel Now
                  </button>
                ) : (
                    <button
                        onClick={() => setSelectedNotification(null)}
                        className="px-12 py-5 rounded-3xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest transition-all"
                    >
                        Close Channel
                    </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
