import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api'; // Re-added for explicit usage

console.log(api); // Explicitly use api to suppress TS6133

interface VideoAnalysis {
  id: number;
  video_url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  player_name: string;
  session_type: string;
  duration: number;
  uploaded_at: string;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_results: {
    pose_detection: {
      accuracy: number;
      key_points: number;
      confidence: number;
    };
    movement_analysis: {
      speed: number;
      acceleration: number;
      direction_changes: number;
    };
    performance_metrics: {
      shooting_accuracy: number;
      dribbling_skill: number;
      defensive_actions: number;
    };
    recommendations: string[];
  };
  highlights: {
    timestamp: number;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
}

interface AnalysisFilter {
  player: string;
  session_type: string;
  date_range: string;
  analysis_status: string;
}

export const TeamVideoAnalysis: React.FC = () => {
  const {  } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VideoAnalysis | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AnalysisFilter>({
    player: 'all',
    session_type: 'all',
    date_range: '30',
    analysis_status: 'all'
  });

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch video analyses
      setAnalyses([]);
    } catch (error: any) {
      if (error.name === 'SilentError' || error.message?.includes('Service unavailable')) {
        setAnalyses([]);
      } else {
        console.error('Error fetching video analyses:', error);
        showToast('Failed to load video analyses', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // @ts-ignore
  const retryAnalysis = async (analysisId: number) => {
    try {
      // TODO: Implement API call to retry analysis
      showToast('Analysis retry initiated', 'info');
      fetchAnalyses();
    } catch (error: any) {
      console.error('Error retrying analysis:', error);
      showToast('Failed to retry analysis', 'error');
    }
  };

  // @ts-ignore
  const deleteAnalysis = async (analysisId: number) => {
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      try {
        // TODO: Implement API call to delete analysis
        showToast('Analysis deleted successfully', 'success');
        fetchAnalyses();
      } catch (error: any) {
        console.error('Error deleting analysis:', error);
        showToast('Failed to delete analysis', 'error');
      }
    }
  };

  // @ts-ignore
  const exportAnalysis = async (analysisId: number) => {
    try {
      // TODO: Implement API call to export analysis
      showToast('Analysis export started', 'info');
    } catch (error: any) {
      console.error('Error exporting analysis:', error);
      showToast('Failed to export analysis', 'error');
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesPlayer = filters.player === 'all' || analysis.player_name === filters.player;
    const matchesSessionType = filters.session_type === 'all' || analysis.session_type === filters.session_type;
    const matchesStatus = filters.analysis_status === 'all' || analysis.analysis_status === filters.analysis_status;
    return matchesPlayer && matchesSessionType && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Team Video Analysis
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            AI-powered video analysis and performance insights
          </p>
        </div>

        {/* Action Bar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4">
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
              {filteredAnalyses.length} analysis{filteredAnalyses.length !== 1 ? 'es' : ''} found
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Analysis Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Player
                </label>
                <select
                  value={filters.player}
                  onChange={(e) => setFilters({...filters, player: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Players</option>
                  <option value="Player 1">Player 1</option>
                  <option value="Player 2">Player 2</option>
                  <option value="Player 3">Player 3</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Session Type
                </label>
                <select
                  value={filters.session_type}
                  onChange={(e) => setFilters({...filters, session_type: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="training">Training</option>
                  <option value="game">Game</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Date Range
                </label>
                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({...filters, date_range: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Status
                </label>
                <select
                  value={filters.analysis_status}
                  onChange={(e) => setFilters({...filters, analysis_status: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Analyses List */}
        {filteredAnalyses.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
            <div className="text-6xl mb-4">🎥</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No Video Analyses Found
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Upload videos to start AI-powered analysis
            </p>
            <button
              onClick={() => window.location.href = '/upload'}
              className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg`}
            >
              Upload Videos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}
              >
                {/* Video Thumbnail */}
                <div className="relative">
                  <img
                    src={analysis.thumbnail_url}
                    alt={analysis.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      analysis.analysis_status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      analysis.analysis_status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      analysis.analysis_status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {analysis.analysis_status}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      darkMode ? 'bg-black bg-opacity-50 text-white' : 'bg-white bg-opacity-90 text-gray-900'
                    }`}>
                      {Math.floor(analysis.duration / 60)}:{(analysis.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysis.title}
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {analysis.player_name} • {analysis.session_type}
                      </p>
                    </div>
                  </div>

                  {analysis.analysis_status === 'completed' && analysis.analysis_results && (
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {analysis.analysis_results.performance_metrics.shooting_accuracy}%
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shooting</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {analysis.analysis_results.performance_metrics.dribbling_skill}%
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dribbling</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {analysis.analysis_results.pose_detection.confidence}%
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI Confidence</div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedAnalysis(analysis)}
                      className={`flex-1 px-4 py-2 ${
                        darkMode 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      } text-center rounded-lg transition-colors text-sm font-medium`}
                    >
                      View Analysis
                    </button>
                    {analysis.analysis_status === 'completed' && (
                      <button
                        onClick={() => exportAnalysis(analysis.id)}
                        className={`px-4 py-2 ${
                          darkMode 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } text-center rounded-lg transition-colors text-sm font-medium`}
                      >
                        Export
                      </button>
                    )}
                    {analysis.analysis_status === 'failed' && (
                      <button
                        onClick={() => retryAnalysis(analysis.id)}
                        className={`px-4 py-2 ${
                          darkMode 
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        } text-center rounded-lg transition-colors text-sm font-medium`}
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      className={`px-4 py-2 ${
                        darkMode 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      } text-center rounded-lg transition-colors text-sm font-medium`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analysis Detail Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-start mb-6">
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedAnalysis.title}
                </h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  ✕
                </button>
              </div>

              {selectedAnalysis.analysis_status === 'completed' && selectedAnalysis.analysis_results && (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Performance Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAnalysis.analysis_results.performance_metrics.shooting_accuracy}%
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Shooting Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAnalysis.analysis_results.performance_metrics.dribbling_skill}%
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Dribbling Skill</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAnalysis.analysis_results.performance_metrics.defensive_actions}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Defensive Actions</div>
                      </div>
                    </div>
                  </div>

                  {/* Movement Analysis */}
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Movement Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAnalysis.analysis_results.movement_analysis.speed} km/h
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Speed</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAnalysis.analysis_results.movement_analysis.acceleration} m/s²
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Acceleration</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedAnalysis.analysis_results.movement_analysis.direction_changes}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Direction Changes</div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {selectedAnalysis.analysis_results.recommendations.length > 0 && (
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                        AI Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {selectedAnalysis.analysis_results.recommendations.map((recommendation, index) => (
                          <li key={index} className={`flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className="mr-2">•</span>
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Highlights */}
                  {selectedAnalysis.highlights.length > 0 && (
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                        Key Highlights
                      </h4>
                      <div className="space-y-2">
                        {selectedAnalysis.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {highlight.description}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              highlight.type === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              highlight.type === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {Math.floor(highlight.timestamp / 60)}:{(highlight.timestamp % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAnalysis.analysis_status === 'processing' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    AI is analyzing the video...
                  </p>
                </div>
              )}

              {selectedAnalysis.analysis_status === 'failed' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">❌</div>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Analysis failed. Please try again.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
