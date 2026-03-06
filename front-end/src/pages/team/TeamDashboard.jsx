import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  Users,
  Video,
  Calendar,
  Activity,
  Settings,
  Bell,
  BarChart,
  UserPlus,
  ChevronRight,
  PlusCircle,
  Clock,
  TrendingUp,
  Target
} from 'lucide-react';

// Import our team components
import TeamStats from '../../components/team/team-stats';
import TeamDashboardChart from '../../components/team/team-dashboard-chart';
import RecentGames from '../../components/team/recent-games';
import PlayerManagement from '../../components/team/player-management';

const TeamDashboard = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    matchesAnalyzed: 0,
    recentActivities: [],
    performanceData: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        setError('');

        // Mock data logic removed to prepare for real backend integration

        const [statsResponse, notificationsResponse] = await Promise.all([
          adminAPI.getStats().catch(() => ({ data: {} })),
          adminAPI.getNotifications().catch(() => ({ data: [] }))
        ]);

        const statsData = statsResponse.data || {};
        const recentActivities = notificationsResponse.data || [];

        setStats({
          totalPlayers: statsData.total_players || 0,
          totalMatches: statsData.total_matches || 0,
          matchesAnalyzed: statsData.videos_analyzed || 0,
          winRate: 0, // Not calculated in backend yet
          recentActivities: recentActivities.slice(0, 5), // Use notifications as proxy for activity for now
          performanceData: statsData.performance_data || null,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching team stats:', error);
        setError('Failed to load team statistics');
        setStats(prev => ({ ...prev, loading: false }));
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, []);

  const quickActions = [
    {
      name: 'Link Player',
      icon: <UserPlus size={20} />,
      link: '/team/roster',
      description: 'Link player account to roster'
    },
    {
      name: 'Match History',
      icon: <Clock size={20} />,
      link: '/team/matches',
      description: 'View past match analysis'
    },
    {
      name: 'Upload Match',
      icon: <Video size={20} />,
      link: '/team/matches',
      description: 'Analyze match video'
    },
    {
      name: 'Team Schedule',
      icon: <Calendar size={20} />,
      link: '/team/schedule',
      description: 'View team schedule'
    },
    {
      name: 'Analytics',
      icon: <BarChart size={20} />,
      link: '/team/analytics',
      description: 'View detailed analytics'
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      link: '/team/settings',
      description: 'Team configuration'
    }
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="mb-6 p-6 glass rounded-3xl border-l-4 border-amber-500 text-amber-400 font-bold animate-in fade-in">
        {stats.error}
        <button onClick={() => window.location.reload()} className="ml-4 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-xl transition-colors">
            Retry
        </button>
      </div>
    );
  }

  const sub = "text-gray-500";

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Team Hub</h1>
          <p className="text-xl text-gray-500">
            Lead <span className="text-orange-500 font-black">{user?.name || user?.firstName || 'Your Team'}</span> to victory.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/team/profile"
            className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
          >
            Team Settings
          </Link>
          <Link
            to="/team/notifications"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            <Bell className="h-4 w-4" />
            Inbox
          </Link>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="group p-6 rounded-[2rem] glass-dark border border-white/5 hover:bg-white/5 transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-orange-500/20 text-gray-400 group-hover:text-orange-500 transition-colors mb-4 border border-white/5">
                {action.icon}
            </div>
            <p className="font-black text-sm text-white">{action.name}</p>
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-10">
          <div className="rounded-[3rem] p-10 glass-dark border border-white/5 relative overflow-hidden">
            <h2 className="text-2xl font-black tracking-tight mb-8">Performance Overview</h2>
            <TeamStats stats={{
                totalPlayers: stats.totalPlayers || 0,
                activePlayers: stats.totalPlayers || 0,
                gamesAnalyzed: stats.matchesAnalyzed || 0,
                totalVideos: stats.matchesAnalyzed || 0,
                winRate: stats.winRate || 0,
                gamesPlayed: stats.totalMatches || 0,
                trainingVideos: 0
            }} />
          </div>

          <div className="rounded-[3rem] overflow-hidden border border-white/5 glass-dark flex flex-col">
            <div className="p-10 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
              <Link to="/team/notifications" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">View All</Link>
            </div>
            <div className="p-8 bg-black/20">
              {stats.recentActivities.length > 0 ? (
                <RecentGames games={stats.recentActivities.map(activity => ({
                    id: activity.id,
                    title: activity.title,
                    type: activity.type === 'match' ? 'win' : (activity.type === 'analysis' ? 'analysis' : 'training'),
                    description: activity.message || activity.status || '',
                    date: activity.createdAt || activity.date || new Date().toISOString()
                }))} />
              ) : (
                <p className="text-center text-gray-500 font-bold py-10">No recent activity detected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-10">
          <div className="rounded-[3rem] p-8 glass-dark border border-white/5 relative overflow-hidden">
            <h2 className="text-xl font-black tracking-tight mb-6">Activity Trends</h2>
            <TeamDashboardChart data={stats.performanceData || []} />
          </div>

          <div className="rounded-[3rem] p-8 glass-dark border border-white/5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black tracking-tight">Roster Status</h2>
                    <Link to="/team/roster" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">View Roster</Link>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div>
                            <p className="text-white font-bold text-sm">Total Players</p>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-1">Active Roster</p>
                        </div>
                        <div className="text-2xl font-black text-orange-500">{stats.totalPlayers}</div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div>
                            <p className="text-white font-bold text-sm">Matches Analyzed</p>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-1">This Season</p>
                        </div>
                        <div className="text-2xl font-black text-green-500">{stats.matchesAnalyzed}</div>
                    </div>

                    <Link to="/team/roster" className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest border border-white/5 transition-colors">
                        <UserPlus size={16} /> Manage Roster
                    </Link>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;