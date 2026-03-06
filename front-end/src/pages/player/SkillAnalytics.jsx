import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosConfig';
import {
  BarChart2,
  Target,
  TrendingUp,
  RefreshCw,
  Activity,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import VideoPlayer from '../../components/team/video-player';
import AICoachFeedback from '../../components/player/AICoachFeedback';
import { Trophy, Clock } from 'lucide-react';

const displayVal = (val, suffix = '', precision = 0) => {
  if (val === undefined || val === null || val === '') return '—';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '—';
  // Check if it's a small float that should be rounded (e.g. 0.45 km)
  if (precision > 0) return `${num.toFixed(precision)}${suffix}`;
  return `${Math.round(num)}${suffix}`;
};

const SkillAnalytics = () => {
  const { playerId } = useParams();
  const [skills, setSkills] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchSkills();
  }, [dateRange, playerId]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError('');

      if (playerId) {
        // Use generic analytics endpoint if viewing specific player
        const response = await api.get(`/analytics/player/${playerId}`, {
          params: { period_days: 30 }
        });
        const data = response.data;

        // Map PlayerAnalyticsSummary to the UI's expected format
        setSkills([]); // The generic endpoint doesn't return a list of individual skills yet
        setSummary({
          overall: data.avg_shot_form_consistency ? Math.round(data.avg_shot_form_consistency) : '—',
          shooting: data.avg_shot_form_consistency ? Math.round(data.avg_shot_form_consistency) : '—',
          defense: '—', // Metric not currently in generic summary
          training_sessions: data.total_training_sessions,
          training_minutes: Math.round(data.total_training_minutes || 0),
          distance: data.total_distance_km?.toFixed(2)
        });
      } else {
        // Fallback or default for personal account
        const response = await api.get('/player/skills', {
          params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        const data = response.data?.data ?? response.data;
        if (data) {
          setSkills(Array.isArray(data.skills) ? data.skills : []);
          setSummary(data.summary && typeof data.summary === 'object' ? data.summary : {});
        } else {
          setSkills([]);
          setSummary({});
        }
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skill analytics.');
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? '—' : format(d, 'MMM d, yyyy');
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[50vh] ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto p-8 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4">Skill Analytics</h1>
                <p className={`text-xl ${sub}`}>Visualizing your path to <span className="text-orange-500 font-black">Elite</span> performance.</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                onClick={fetchSkills}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                >
                <RefreshCw className="h-4 w-4" />
                <span>Sync Data</span>
                </button>
            </div>
        </div>

        {error && (
          <div className="mb-6 p-6 glass rounded-3xl border-l-4 border-amber-500 text-amber-400 font-bold animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Analytics Content */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Overview Stats */}
            <div className={`rounded-[3rem] p-10 glass-dark shadow-glass border border-white/5 overflow-hidden relative`}>
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <BarChart2 className="h-48 w-48" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-8">Performance Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: 'Overall Score', value: summary.overall, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
                        { label: 'Shooting', value: summary.shooting, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', suffix: '%' },
                        { label: 'Defense', value: summary.defense, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20', suffix: '%' }
                    ].map(item => (
                        <div key={item.label} className={`p-6 rounded-3xl border ${item.bg}`}>
                            <span className={`text-[10px] uppercase font-black tracking-widest ${sub}`}>{item.label}</span>
                            <p className={`text-4xl font-black mt-1 ${item.color}`}>{displayVal(item.value, item.suffix)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Session Feedback */}
            <div className={`rounded-[3rem] overflow-hidden border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
                <div className={`px-10 py-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                    <h2 className="text-2xl font-black tracking-tight flex items-center">
                        <Zap className="h-6 w-6 mr-3 text-yellow-500" />
                        Session Feedback
                    </h2>
                </div>
                <div className="p-10">
                    {skills.length > 0 && skills[0].videoUrl && ( 
                        <div className="rounded-3xl overflow-hidden mb-8 border border-white/10">
                            <VideoPlayer 
                                videoSrc={skills[0].videoUrl} 
                                analysisData={skills[0].analysisData} 
                            /> 
                        </div>
                    )}
                    <div className="glass-dark rounded-3xl p-8 border border-white/5">
                        <AICoachFeedback analysisData={skills.length > 0 ? skills[0].analysisData : null} />
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar: Stats & Skills */}
          <div className="space-y-10">
            
            {/* Training Totals */}
            <div className={`rounded-[3rem] p-8 glass-dark shadow-glass border border-white/5`}>
                <h3 className="text-xl font-black tracking-tight mb-8">Training Totals</h3>
                <div className="space-y-6">
                    {[
                        { label: 'Sessions', value: summary.training_sessions || 0, icon: <Activity className="h-4 w-4" /> },
                        { label: 'Minutes Trained', value: summary.training_minutes || 0, icon: <TrendingUp className="h-4 w-4" /> },
                        { label: 'Distance Covered', value: `${summary.distance || '0.00'} km`, icon: <Zap className="h-4 w-4" /> }
                    ].map(stat => (
                        <div key={stat.label} className="flex justify-between items-center group">
                            <span className={`text-sm font-bold flex items-center transition-colors group-hover:text-orange-500 ${sub}`}>
                                <span className="mr-2 p-1.5 rounded-lg bg-white/5 border border-white/10">{stat.icon}</span>
                                {stat.label}
                            </span>
                            <span className="font-black text-lg">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Skill Progress */}
            <div className={`rounded-[3rem] overflow-hidden border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
                <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50">Skill Mastery</h3>
                </div>
                <div className="p-8 space-y-6">
                    {skills.length > 0 ? skills.map((skill, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-xs font-black">
                        <span className="uppercase tracking-wider">{skill.name}</span>
                        <span className="text-orange-500">{skill.score}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${skill.score}%` }} />
                        </div>
                    </div>
                    )) : (
                        <div className="text-center py-6 opacity-40 italic text-sm">
                            No skill data available.
                        </div>
                    )}
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  );
};

export default SkillAnalytics;
