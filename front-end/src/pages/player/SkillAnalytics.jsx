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
  Zap,
  Trophy,
  Clock,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import VideoPlayer from '../../components/team/video-player';
import AICoachFeedback from '../../components/player/AICoachFeedback';

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
  const [activeSkillIndex, setActiveSkillIndex] = useState(0); // Track currently selected shot
  const [skillTrends, setSkillTrends] = useState({ shooting: [], dribbling: [], defense: [], fitness: [] });
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
    fetchTrends();
  }, [dateRange, playerId]);

  const fetchTrends = async () => {
    if (!playerId) {
      try {
        const res = await api.get('/player/skill-trends');
        setSkillTrends(res.data);
      } catch (e) {
        console.error("Failed to load skill trends", e);
      }
    }
  };

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError('');
      setActiveSkillIndex(0); // Reset index on fetch

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

  const handleDeleteShot = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this shot analysis? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/player/skills/${skillId}`);
      // Refresh skills after deletion
      await fetchSkills();
    } catch (err) {
      console.error('Failed to delete shot:', err);
      setError('Failed to delete the shot analysis. Please try again.');
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

  // Format the trend data for Recharts (MUST be before any early returns)
  const shootingTrendData = React.useMemo(() => {
    if (!skillTrends || !skillTrends.shooting || skillTrends.shooting.length === 0) return [];
    return skillTrends.shooting.map((score, idx) => ({
      name: `Session ${idx + 1}`,
      score: score
    }));
  }, [skillTrends]);

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

            {/* Overview Stats & Trends */}
            <div className={`rounded-[3rem] p-10 glass-dark shadow-glass border border-white/5 overflow-hidden relative`}>
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <BarChart2 className="h-48 w-48" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-8">Performance Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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

              {/* Trend Chart using Recharts */}
              {shootingTrendData.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 opacity-50">Shooting Form Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={shootingTrendData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#333' : '#eee'} />
                      <XAxis dataKey="name" stroke={isDarkMode ? '#999' : '#666'} tick={{ fontSize: 10 }} />
                      <YAxis stroke={isDarkMode ? '#999' : '#666'} tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', border: `1px solid ${isDarkMode ? '#444' : '#ccc'}`, borderRadius: '8px' }}
                        labelStyle={{ color: isDarkMode ? '#fff' : '#333' }}
                        itemStyle={{ color: '#f97316' }}
                        formatter={(value) => `${value}%`}
                      />
                      <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Session Feedback with Video Gallery */}
            <div className={`rounded-[3rem] overflow-hidden border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
              <div className={`px-10 py-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'} flex justify-between items-center`}>
                <h2 className="text-2xl font-black tracking-tight flex items-center">
                  <Zap className="h-6 w-6 mr-3 text-yellow-500" />
                  Session Feedback
                </h2>
                {skills.length > 0 && (
                  <div className="text-sm font-bold text-gray-500">
                    Viewing {activeSkillIndex + 1} of {skills.length} Shots
                  </div>
                )}
              </div>

              <div className="p-10">
                {skills.length > 0 ? (
                  <>
                    {/* Active Video Player */}
                    {skills[activeSkillIndex]?.videoUrl && (
                      <div className="rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl bg-black">
                        <VideoPlayer
                          videoSrc={skills[activeSkillIndex].videoUrl}
                          analysisData={skills[activeSkillIndex].analysisData}
                          key={skills[activeSkillIndex].videoUrl} // Force remount on change
                        />
                      </div>
                    )}

                    {/* Active Feedback */}
                    <div className="glass-dark rounded-3xl p-8 border border-white/5 mb-8">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-black tracking-tight text-orange-500">
                          {skills[activeSkillIndex]?.name || 'Analysis Feedback'}
                        </h3>
                        {skills[activeSkillIndex]?.id && (
                          <button
                            onClick={() => handleDeleteShot(skills[activeSkillIndex].id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete this shot analysis"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <AICoachFeedback analysisData={skills[activeSkillIndex]?.analysisData} />
                    </div>

                    {/* Shot Timeline / Gallery selector */}
                    {skills.length > 1 && (
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-4 opacity-50">Select Shot Analysis</h4>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                          {skills.map((skill, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveSkillIndex(idx)}
                              className={`flex-shrink-0 snap-start w-48 p-4 rounded-2xl border text-left transition-all duration-300 ${activeSkillIndex === idx
                                ? 'bg-orange-500/10 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                                : isDarkMode
                                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold">{skill.name}</span>
                                <span className={`text-xs font-black ${skill.score >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                                  {skill.score}%
                                </span>
                              </div>
                              <div className="text-xs opacity-70 truncate">
                                {formatDate(skill.date)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-gray-500 font-medium">
                    No analysis data available for the selected period.
                  </div>
                )}
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
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50">Skill Mastery (Recent Shots)</h3>
              </div>
              <div className="p-8 space-y-6">
                {skills.length > 0 ? skills.slice(0, 8).map((skill, idx) => (
                  <div
                    key={idx}
                    className={`space-y-2 cursor-pointer transition-opacity ${activeSkillIndex === idx ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    onClick={() => setActiveSkillIndex(idx)}
                  >
                    <div className="flex justify-between text-xs font-black">
                      <span className="uppercase tracking-wider">{skill.name}</span>
                      <span className={skill.score >= 80 ? 'text-green-500' : 'text-yellow-500'}>{skill.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full shadow-[0_0_10px_rgba(249,115,22,0.5)] ${skill.score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}
                        style={{ width: `${skill.score}%` }}
                      />
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
