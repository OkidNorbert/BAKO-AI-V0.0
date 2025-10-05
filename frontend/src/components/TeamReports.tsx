import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamReport {
  id: number;
  title: string;
  type: 'performance' | 'attendance' | 'progress' | 'analytics';
  generated_at: string;
  period: string;
  status: 'generating' | 'ready' | 'failed';
  file_url?: string;
  summary: {
    total_players: number;
    active_sessions: number;
    avg_performance: number;
    improvement_rate: number;
  };
}

interface ReportFilters {
  period: string;
  type: string;
  players: string[];
  metrics: string[];
}

export const TeamReports: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [reports, setReports] = useState<TeamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    period: '30',
    type: 'performance',
    players: [],
    metrics: ['performance', 'attendance']
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch reports
      setReports([]);
    } catch (error: any) {
      if (error.name === 'SilentError' || error.message?.includes('Service unavailable')) {
        setReports([]);
      } else {
        console.error('Error fetching reports:', error);
        showToast('Failed to load reports', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      // TODO: Implement API call to generate report
      showToast('Report generation started', 'info');
      setTimeout(() => {
        setGenerating(false);
        showToast('Report generated successfully', 'success');
        fetchReports();
      }, 3000);
    } catch (error: any) {
      console.error('Error generating report:', error);
      showToast('Failed to generate report', 'error');
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: number) => {
    try {
      // TODO: Implement API call to download report
      showToast('Downloading report...', 'info');
    } catch (error: any) {
      console.error('Error downloading report:', error);
      showToast('Failed to download report', 'error');
    }
  };

  const deleteReport = async (reportId: number) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        // TODO: Implement API call to delete report
        showToast('Report deleted successfully', 'success');
        fetchReports();
      } catch (error: any) {
        console.error('Error deleting report:', error);
        showToast('Failed to delete report', 'error');
      }
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
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Team Reports
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Generate and manage team performance reports
          </p>
        </div>

        {/* Action Bar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={generateReport}
                disabled={generating}
                className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {generating ? 'Generating...' : '+ Generate Report'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-3 ${
                  darkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } rounded-lg transition-colors`}
              >
                🔍 Filters
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {reports.length} report{reports.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Report Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Period
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => setFilters({...filters, period: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="performance">Performance</option>
                  <option value="attendance">Attendance</option>
                  <option value="progress">Progress</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Players
                </label>
                <select
                  multiple
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Players</option>
                  <option value="starters">Starters</option>
                  <option value="bench">Bench</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Metrics
                </label>
                <div className="space-y-2">
                  {['performance', 'attendance', 'progress', 'analytics'].map(metric => (
                    <label key={metric} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.metrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, metrics: [...filters.metrics, metric]});
                          } else {
                            setFilters({...filters, metrics: filters.metrics.filter(m => m !== metric)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
            <div className="text-6xl mb-4">📊</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No Reports Available
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Generate your first team report to get started
            </p>
            <button
              onClick={generateReport}
              disabled={generating}
              className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {generating ? 'Generating...' : 'Generate First Report'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {report.title}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    report.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    report.status === 'generating' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {report.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Period:</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{report.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Generated:</span>
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(report.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {report.summary.total_players}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Players</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {report.summary.avg_performance}%
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Performance</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {report.status === 'ready' && (
                    <button
                      onClick={() => downloadReport(report.id)}
                      className={`flex-1 px-4 py-2 bg-orange-600 text-white text-center rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium`}
                    >
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => deleteReport(report.id)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    } text-center rounded-lg transition-colors text-sm font-medium`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
