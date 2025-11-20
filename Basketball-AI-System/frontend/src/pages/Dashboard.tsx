import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoUpload from '../components/VideoUpload';
import ActionResult from '../components/ActionResult';
import MetricsDisplay from '../components/MetricsDisplay';
import RadarChart from '../components/RadarChart';
import RecommendationCard from '../components/RecommendationCard';
import ProgressChart from '../components/ProgressChart';
import { analyzeVideo, getHistory } from '../services/api';
import type { VideoAnalysisResult, UploadProgress, HistoricalData } from '../types';

export default function Dashboard() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load historical data on mount
  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await getHistory();
      setHistoricalData(history);
    } catch (err) {
      console.error('Failed to load history:', err);
      // If history endpoint is not implemented, use empty array
      setHistoricalData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      setError('');
      setUploadProgress({ progress: 0, status: 'uploading' });

      // Call API
      const result = await analyzeVideo(file, setUploadProgress);

      setUploadProgress({ progress: 100, status: 'complete' });
      setAnalysisResult(result);
      
      // Reload history to include new analysis
      await loadHistoricalData();
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to analyze video. Please try again.';
      setError(errorMessage);
      setUploadProgress({ progress: 0, status: 'error', message: 'Upload failed' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🏀 Basketball AI Performance Analysis
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Upload a video to analyze your basketball performance
              </p>
            </div>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              View History
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Video Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <VideoUpload
              onUpload={handleVideoUpload}
              isUploading={uploadProgress.status === 'uploading' || uploadProgress.status === 'processing'}
              progress={uploadProgress.progress}
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}


          {/* Analysis Results */}
          {analysisResult && (
            <>
              {/* Action Classification */}
              <ActionResult
                action={analysisResult.action.label}
                confidence={analysisResult.action.confidence}
                probabilities={analysisResult.action.probabilities}
              />

              {/* Performance Metrics */}
              <MetricsDisplay metrics={analysisResult.metrics} />

              {/* Radar Chart */}
              <RadarChart metrics={analysisResult.metrics} />

              {/* Recommendations */}
              <RecommendationCard recommendations={analysisResult.recommendations} />

              {/* Progress Chart */}
              {historicalData.length > 0 ? (
                <ProgressChart data={historicalData} />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center"
                >
                  <p className="text-gray-500 dark:text-gray-400">
                    No historical data available yet. Upload more videos to see your progress over time.
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-4"
              >
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Analyze Another Video
                </button>
                <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors">
                  Download Report
                </button>
              </motion.div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Basketball AI Performance Analysis • Built with React + Vite + TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}

