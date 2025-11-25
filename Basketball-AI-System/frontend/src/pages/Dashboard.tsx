import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoUpload from '../components/VideoUpload';
import ActionResult from '../components/ActionResult';
import MetricsDisplay from '../components/MetricsDisplay';
import RadarChart from '../components/RadarChart';
import RecommendationCard from '../components/RecommendationCard';
import ProgressChart from '../components/ProgressChart';
import RealTimeVisualization from '../components/RealTimeVisualization';
import { analyzeVideo, getHistory } from '../services/api';
import type { VideoAnalysisResult, UploadProgress, HistoricalData } from '../types';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [, setIsLoadingHistory] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);

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

      // Start processing timer
      const startTime = Date.now();
      setProcessingStartTime(startTime);
      setProcessingTime(0);

      // Generate video_id on frontend BEFORE uploading
      // This allows WebSocket to connect immediately
      const frontendVideoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setCurrentVideoId(frontendVideoId);
      setShowVisualization(true);

      // Call API with video_id - backend will use it for WebSocket streaming
      const result = await analyzeVideo(file, setUploadProgress, frontendVideoId);

      setUploadProgress({ progress: 100, status: 'complete' });

      // Calculate processing time
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      setProcessingTime(totalTime);
      setProcessingStartTime(null);

      setAnalysisResult(result);
      // Keep using the same video_id (backend should use the one we sent)
      if (result.video_id && result.video_id !== frontendVideoId) {
        setCurrentVideoId(result.video_id); // Update if backend generated different one
      }

      // 🎉 Celebrate success with confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Reload history to include new analysis
      await loadHistoricalData();
    } catch (err: any) {
      console.error('Upload error:', err);

      // Handle different error types
      let errorMessage = 'Failed to analyze video. Please try again.';

      if (err?.code === 'NO_PLAYER_DETECTED') {
        // Show structured error with suggestions
        errorMessage = err.originalMessage || err.message;
        if (err.suggestions && Array.isArray(err.suggestions)) {
          errorMessage += '\n\n' + err.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
        }
      } else if (err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = 'Backend server is not running. Please start the backend server first.';
      } else if (err?.response?.data) {
        // Backend returned structured error (FastAPI format)
        const errorData = err.response.data;

        // FastAPI returns errors in 'detail' field
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : errorData.detail.message || errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
          if (errorData.suggestions) {
            errorMessage += '\n\n' + errorData.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
          }
        }
      } else if (err?.message) {
        // Error object with message property
        errorMessage = err.message;
      }

      setError(errorMessage);
      setUploadProgress({ progress: 0, status: 'error', message: 'Upload failed' });
      setProcessingStartTime(null);
    }
  };

  const downloadReport = (result: VideoAnalysisResult) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Basketball AI Performance Report', 20, 20);

    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

    // Processing Time
    if (processingTime > 0) {
      doc.text(`Processing Time: ${processingTime.toFixed(2)}s`, 20, 36);
    }

    // Action Classification
    doc.setFontSize(14);
    doc.text('Action Classification', 20, 50);
    doc.setFontSize(11);
    doc.text(`Action: ${result.action.label.replace(/_/g, ' ').toUpperCase()}`, 25, 58);
    doc.text(`Confidence: ${(result.action.confidence * 100).toFixed(1)}%`, 25, 64);

    // Performance Metrics
    doc.setFontSize(14);
    doc.text('Performance Metrics', 20, 80);
    doc.setFontSize(11);
    doc.text(`Jump Height: ${result.metrics.jump_height.toFixed(2)}m`, 25, 88);
    doc.text(`Movement Speed: ${result.metrics.movement_speed.toFixed(2)}m/s`, 25, 94);
    doc.text(`Form Score: ${(result.metrics.form_score * 100).toFixed(0)}%`, 25, 100);
    doc.text(`Reaction Time: ${result.metrics.reaction_time.toFixed(3)}s`, 25, 106);
    doc.text(`Pose Stability: ${(result.metrics.pose_stability * 100).toFixed(0)}%`, 25, 112);
    doc.text(`Energy Efficiency: ${(result.metrics.energy_efficiency * 100).toFixed(0)}%`, 25, 118);

    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      doc.setFontSize(14);
      doc.text('AI Recommendations', 20, 135);
      doc.setFontSize(10);

      let yPos = 143;
      result.recommendations.forEach((rec, index) => {
        if (yPos > 270) { // New page if needed
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${rec.title}`, 25, yPos);
        yPos += 6;
        const lines = doc.splitTextToSize(rec.message, 160);
        doc.text(lines, 30, yPos);
        yPos += lines.length * 5 + 5;
      });
    }

    // Save PDF
    const filename = `basketball-analysis-${new Date().getTime()}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
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
            <div className="flex gap-4">
              <Link
                to="/live"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                Live Analysis
              </Link>
              <Link
                to="/history"
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View History
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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

            {/* Processing Time Display */}
            {processingStartTime && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Processing... {((Date.now() - processingStartTime) / 1000).toFixed(1)}s
                </p>
              </div>
            )}

            {processingTime > 0 && !processingStartTime && analysisResult && (
              <div className="mt-4 text-center">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Completed in {processingTime.toFixed(2)}s
                </p>
              </div>
            )}
          </motion.div>

          {/* Real-time Visualization */}
          {showVisualization && currentVideoId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🎥 Real-Time Analysis Visualization
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Watch YOLO detection boxes and MediaPipe pose keypoints in real-time as your video is processed
              </p>
              <RealTimeVisualization
                videoId={currentVideoId}
                isProcessing={uploadProgress.status === 'uploading' || uploadProgress.status === 'processing'}
                onClose={() => setShowVisualization(false)}
              />
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Analysis Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                    {error}
                  </div>
                </div>
              </div>
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
                <button
                  onClick={() => downloadReport(analysisResult)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Report
                </button>
              </motion.div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Basketball AI Performance Analysis • Built with React + Vite + TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}

