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

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold flex items-center">
            <BarChart2 className="h-8 w-8 mr-2 text-orange-500" />
            Skill Analytics
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSkills}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100 border border-gray-200'} transition-colors`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-amber-500/10 border-l-4 border-amber-500 text-amber-700 dark:text-amber-400 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Analytics Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Target className="mr-2 text-orange-500" />
                Performance Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <span className={`text-xs uppercase font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall Score</span>
                  <p className="text-3xl font-bold text-orange-500">{summary.overall || '—'}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <span className={`text-xs uppercase font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Shooting</span>
                  <p className="text-3xl font-bold text-yellow-500">{summary.shooting || '—'}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className={`text-xs uppercase font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Defense</span>
                  <p className="text-3xl font-bold text-green-500">{summary.defense || '—'}</p>
                </div>
              </div>
            </div>

            {/* Video Analysis Section (if a session is selected) */}
            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h2 className="text-lg font-semibold flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Session Feedback
                </h2>
              </div>
              <div className="p-6">
{skills.length > 0 && skills[0].videoUrl && ( 
 <VideoPlayer 
 videoSrc={skills[0].videoUrl} 
 analysisData={skills[0].analysisData} 
 /> 
 )}
                <AICoachFeedback analysisData={skills.length > 0 ? skills[0].analysisData : null} />
              </div>
            </div>
          </div>

          {/* Sidebar: Recent Sessions / Skill Breakdown */}
          <div className="space-y-6">
            <div className={`rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-bold mb-4">Training Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Sessions</span>
                  <span className="font-bold">{summary.training_sessions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Minutes</span>
                  <span className="font-bold">{summary.training_minutes || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Distance</span>
                  <span className="font-bold">{summary.distance || '0.00'} km</span>
                </div>
              </div>
            </div>

            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="font-semibold capitalize">Skill progress</h3>
              </div>
              <div className="p-4 space-y-3">
                {skills.map((skill, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{skill.name}</span>
                      <span className="font-bold text-orange-500">{skill.score}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${skill.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default SkillAnalytics;
