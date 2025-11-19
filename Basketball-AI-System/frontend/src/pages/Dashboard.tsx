import { useState } from 'react';
import { motion } from 'framer-motion';
import VideoUpload from '../components/VideoUpload';
import ActionResult from '../components/ActionResult';
import MetricsDisplay from '../components/MetricsDisplay';
import RadarChart from '../components/RadarChart';
import RecommendationCard from '../components/RecommendationCard';
import ProgressChart from '../components/ProgressChart';
import { analyzeVideo } from '../services/api';
import type { VideoAnalysisResult, UploadProgress } from '../types';

export default function Dashboard() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');

  // Mock historical data (replace with real API call)
  const mockHistoricalData = [
    {
      date: '2025-01-13',
      metrics: {
        jump_height: 0.65,
        movement_speed: 5.8,
        form_score: 0.82,
        reaction_time: 0.25,
        pose_stability: 0.78,
        energy_efficiency: 0.72,
      },
      action: 'shooting',
    },
    {
      date: '2025-01-15',
      metrics: {
        jump_height: 0.68,
        movement_speed: 6.1,
        form_score: 0.85,
        reaction_time: 0.23,
        pose_stability: 0.81,
        energy_efficiency: 0.75,
      },
      action: 'shooting',
    },
    {
      date: '2025-01-17',
      metrics: {
        jump_height: 0.70,
        movement_speed: 6.3,
        form_score: 0.87,
        reaction_time: 0.22,
        pose_stability: 0.83,
        energy_efficiency: 0.76,
      },
      action: 'shooting',
    },
    {
      date: '2025-01-20',
      metrics: {
        jump_height: 0.72,
        movement_speed: 6.5,
        form_score: 0.89,
        reaction_time: 0.21,
        pose_stability: 0.85,
        energy_efficiency: 0.78,
      },
      action: 'shooting',
    },
  ];

  const handleVideoUpload = async (file: File) => {
    try {
      setError('');
      setUploadProgress({ progress: 0, status: 'uploading' });

      // Call API
      const result = await analyzeVideo(file, setUploadProgress);

      setUploadProgress({ progress: 100, status: 'complete' });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to analyze video. Please try again.');
      setUploadProgress({ progress: 0, status: 'error', message: 'Upload failed' });
    }
  };

  // Mock data for demo (remove when backend is ready)
  const mockResult: VideoAnalysisResult = {
    video_id: 'demo-123',
    action: {
      label: 'three_point_shot',
      confidence: 0.942,
      probabilities: {
        free_throw: 0.012,
        two_point_shot: 0.045,
        three_point_shot: 0.942,
        layup: 0.008,
        dunk: 0.002,
        dribbling: 0.032,
        passing: 0.015,
        defense: 0.008,
        running: 0.005,
        walking: 0.003,
        blocking: 0.002,
        picking: 0.001,
        ball_in_hand: 0.020,
        idle: 0.003,
      },
    },
    metrics: {
      jump_height: 0.72,
      movement_speed: 6.5,
      form_score: 0.89,
      reaction_time: 0.21,
      pose_stability: 0.85,
      energy_efficiency: 0.78,
    },
    recommendations: [
      {
        type: 'excellent',
        title: 'Excellent Shooting Form!',
        message: 'Your shooting form is exceptional with a score of 89/100. Your elbow angle is perfect at 92°, which is within the optimal range for accuracy.',
        priority: 'low',
      },
      {
        type: 'focus',
        title: 'Work on Jump Height Consistency',
        message: 'Your current jump height of 0.72m is good, but you can improve to 0.80m with targeted plyometric exercises. Try box jumps and depth jumps 3 times per week.',
        priority: 'medium',
      },
      {
        type: 'improvement',
        title: 'Great Reaction Time!',
        message: 'Your reaction time of 0.21s is 15% faster than the average player. This gives you a competitive advantage in game situations.',
        priority: 'low',
      },
    ],
    timestamp: new Date().toISOString(),
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

          {/* Demo Button (remove when backend is ready) */}
          {!analysisResult && uploadProgress.status === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <button
                onClick={() => setAnalysisResult(mockResult)}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
              >
                View Demo Results
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Click to see sample analysis (Backend not connected yet)
              </p>
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
              <ProgressChart data={mockHistoricalData} />

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

