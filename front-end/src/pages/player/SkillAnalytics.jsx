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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overall Score</span>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-3xl font-bold mt-2">{summary.overall != null && summary.overall !== '' ? summary.overall : '—'}</p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Based on recent sessions</p>
          </div>
          <div className={`rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shooting</span>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold mt-2">{summary.shooting != null && summary.shooting !== '' ? summary.shooting : '—'}</p>
          </div>
          <div className={`rounded-xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Defense</span>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold mt-2">{summary.defense != null && summary.defense !== '' ? summary.defense : '—'}</p>
          </div>
        </div>

        <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-500" />
              Skill breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Skill</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Category</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Score</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Last updated</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {skills.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`px-6 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No skill data for this period. Complete training sessions to see analytics here.
                    </td>
                  </tr>
                ) : (
                  skills.map((skill) => (
                    <tr key={skill.id}>
                      <td className="px-6 py-4 font-medium">{skill.name}</td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{skill.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'}`}>
                          {skill.score}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(skill.lastUpdated)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillAnalytics;
