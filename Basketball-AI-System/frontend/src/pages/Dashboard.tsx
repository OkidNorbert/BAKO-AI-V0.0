import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoUpload from '../components/VideoUpload';
import ActionTimeline from '../components/ActionTimeline';
import MetricsDisplay from '../components/MetricsDisplay';
import RadarChart from '../components/RadarChart';
import RecommendationCard from '../components/RecommendationCard';
import ProgressChart from '../components/ProgressChart';
import RealTimeVisualization from '../components/RealTimeVisualization';
import BakoLogo from '../components/BakoLogo';
import { analyzeVideo, getHistory } from '../services/api';
import type { VideoAnalysisResult, UploadProgress, HistoricalData } from '../types';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import { useDarkMode } from '../App';

// Helper function to convert relative URLs to absolute URLs
const getVideoUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  // If URL is already absolute (starts with http:// or https://), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If relative URL, prepend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
};

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
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const { darkMode, toggleDarkMode } = useDarkMode();

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
      setAnalysisResult(null); // Clear previous results
      setVideoLoadError(false); // Reset video error state
      setVideoLoading(true); // Reset video loading state
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

      // Set processing status when upload completes and analysis starts
      setUploadProgress(prev => ({ ...prev, status: 'processing', message: 'Analyzing video...' }));

      // Call API with video_id - backend will use it for WebSocket streaming
      const result = await analyzeVideo(file, setUploadProgress, frontendVideoId);

      // Debug: Log the result to console (always log, not just in dev mode)
      console.log('✅ Analysis result received:', result);
      console.log('📊 Result structure:', {
        hasAction: !!result?.action,
        hasMetrics: !!result?.metrics,
        hasRecommendations: !!result?.recommendations,
        hasTimeline: !!result?.timeline,
        videoId: result?.video_id,
        actionLabel: result?.action?.label,
        metricsKeys: result?.metrics ? Object.keys(result.metrics) : [],
        recommendationsCount: result?.recommendations?.length || 0
      });

      // Validate result structure
      if (!result) {
        console.error('❌ Result is null or undefined!');
        throw new Error('No result returned from analysis');
      }
      
      if (!result.action || !result.metrics) {
        console.error('❌ Result missing required fields:', {
          hasAction: !!result.action,
          hasMetrics: !!result.metrics
        });
      }

      setUploadProgress({ progress: 100, status: 'complete' });

      // Calculate processing time
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000; // Convert to seconds
      setProcessingTime(totalTime);
      setProcessingStartTime(null);

      // Validate result before setting
      if (!result) {
        throw new Error('No result returned from analysis');
      }

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

      // Scroll to results section after a brief delay
      setTimeout(() => {
        const resultsSection = document.getElementById('analysis-results');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);

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
    doc.text('Bako Performance Report', 20, 20);

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
              <BakoLogo size="lg" showText={true} />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 ml-1">
                Upload a video to track your skills and improve your game
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

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
              className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl shadow-lg"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    ⚠️ Analysis Failed
                  </h3>
                  <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line mb-3">
                    {error}
                  </div>
                  {error.includes('player') && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">💡 Quick Tips:</p>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                        <li>Ensure the player is fully visible in the frame</li>
                        <li>Use good lighting conditions</li>
                        <li>Keep the camera steady</li>
                        <li>Try a video with clear basketball action</li>
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => setError('')}
                    className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading Skeleton */}
          {uploadProgress.status === 'processing' && !analysisResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}


          {/* Analysis Results */}
          {analysisResult && (
            <div id="analysis-results">
              {/* Debug: Log result structure - always log for debugging */}
              {(() => {
                console.log('🎯 Rendering analysis results:', {
                  hasAction: !!analysisResult.action,
                  hasMetrics: !!analysisResult.metrics,
                  hasRecommendations: !!analysisResult.recommendations,
                  actionLabel: analysisResult.action?.label,
                  metricsCount: analysisResult.metrics ? Object.keys(analysisResult.metrics).length : 0
                });
                return null;
              })()}
              
              {/* Annotated Video Playback */}
              {(() => {
                const videoUrl = getVideoUrl(analysisResult.annotated_video_url);
                if (!videoUrl) return null;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      AI-Annotated Video
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Watch your video with AI detections: YOLO bounding boxes, MediaPipe pose keypoints, and court/hoop detection
                    </p>
                    <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                      {videoLoadError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-10">
                          <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-center font-medium mb-1">Video playback unavailable</p>
                          <p className="text-xs text-gray-400 mb-2 text-center max-w-md">
                            The video may still be processing, or there may be a CORS/codec compatibility issue.
                          </p>
                          <p className="text-xs text-gray-500 mb-4 text-center">
                            The analysis results are still available below.
                          </p>
                          <div className="flex flex-col gap-2 items-center">
                            <a
                              href={videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                            >
                              Try opening video in new tab
                            </a>
                            <button
                              onClick={() => {
                                setVideoLoadError(false);
                                setVideoLoading(true);
                                // Force video reload
                                const video = document.querySelector('video');
                                if (video) {
                                  video.load();
                                }
                              }}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                            >
                              Retry Loading
                            </button>
                            <p className="text-xs text-gray-500 mt-2 max-w-xs text-center break-all">
                              URL: {videoUrl}
                            </p>
                          </div>
                        </div>
                      ) : videoLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-4 z-10">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                          <p className="text-sm text-gray-400">Loading video...</p>
                          <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
                        </div>
                      ) : null}
                      <video
                        controls
                        className="w-full h-full"
                        src={videoUrl}
                        crossOrigin="anonymous"
                        preload="metadata"
                        onLoadStart={() => {
                          console.log('Video load started:', videoUrl);
                          setVideoLoading(true);
                        }}
                        onLoadedData={() => {
                          console.log('Video loaded successfully');
                          setVideoLoading(false);
                          setVideoLoadError(false);
                        }}
                        onCanPlay={() => {
                          console.log('Video can play');
                          setVideoLoading(false);
                        }}
                        onError={(e) => {
                          const videoElement = e.currentTarget;
                          const error = videoElement.error;
                          let errorMessage = 'Unknown error';
                          
                          if (error) {
                            switch (error.code) {
                              case error.MEDIA_ERR_ABORTED:
                                errorMessage = 'Video loading aborted';
                                break;
                              case error.MEDIA_ERR_NETWORK:
                                errorMessage = 'Network error - video may still be uploading';
                                break;
                              case error.MEDIA_ERR_DECODE:
                                errorMessage = 'Video decode error - codec not supported';
                                break;
                              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                errorMessage = 'Video format not supported';
                                break;
                              default:
                                errorMessage = `Error code: ${error.code}`;
                            }
                          }
                          
                          console.error('Video loading error:', errorMessage);
                          console.error('Video URL:', videoUrl);
                          console.error('Error details:', error);
                          
                          // Check if URL is accessible
                          fetch(videoUrl, { method: 'HEAD' })
                          .then(response => {
                            console.log('Video URL accessibility check:', response.status, response.statusText);
                            if (response.status === 200) {
                              console.log('Video exists but may have CORS or codec issues');
                            } else {
                              console.log('Video may not be available yet or was deleted');
                            }
                          })
                          .catch(fetchError => {
                            console.error('Cannot access video URL:', fetchError);
                          });
                        
                        setVideoLoadError(true);
                        setVideoLoading(false);
                      }}
                      onWaiting={() => {
                        console.log('Video waiting for data...');
                        setVideoLoading(true);
                      }}
                      onPlaying={() => {
                        console.log('Video playing');
                        setVideoLoading(false);
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </motion.div>
                );
              })()}

              {/* Skill Improvement Focus - Recommendations First */}
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                <RecommendationCard recommendations={analysisResult.recommendations} />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    💡 Recommendations
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No specific recommendations available. Continue practicing to improve your skills!
                  </p>
                </motion.div>
              )}

              {/* Action Timeline - All Actions Detected */}
              {analysisResult.timeline && analysisResult.timeline.length > 0 ? (
                <ActionTimeline 
                  timeline={analysisResult.timeline}
                  totalDuration={Math.max(...analysisResult.timeline.map(s => s.end_time))}
                />
              ) : analysisResult.action ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    📊 Actions Detected
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Primary Action: <span className="font-semibold capitalize">{analysisResult.action.label.replace(/_/g, ' ')}</span> ({(analysisResult.action.confidence * 100).toFixed(0)}% confidence)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Timeline analysis not available. The system detected one primary action in this video.
                  </p>
                </motion.div>
              ) : null}

              {/* Performance Metrics */}
              <MetricsDisplay metrics={analysisResult.metrics} />

              {/* Radar Chart */}
              <RadarChart metrics={analysisResult.metrics} />

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
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-3">
                <BakoLogo size="md" showText={true} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                A comprehensive skill-based system for basketball development. Track your progress, 
                identify areas for improvement, and master fundamental skills through data-driven analysis 
                and personalized coaching recommendations.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a 
                  href="mailto:support@bako.com" 
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Email"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/" 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/live" 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Live Analysis
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/history" 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    History
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/compare" 
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Compare Videos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Features
              </h4>
              <ul className="space-y-3">
                <li className="text-sm text-gray-600 dark:text-gray-400">
                  Action Recognition
                </li>
                <li className="text-sm text-gray-600 dark:text-gray-400">
                  Form Analysis
                </li>
                <li className="text-sm text-gray-600 dark:text-gray-400">
                  Performance Metrics
                </li>
                <li className="text-sm text-gray-600 dark:text-gray-400">
                  AI Coaching
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left">
                © {new Date().getFullYear()} Bako. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm text-gray-600 dark:text-gray-400">
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </a>
                <span className="hidden md:inline">•</span>
                <span className="text-xs">
                  Built with <span className="text-red-500">❤️</span> using React, Vite & TypeScript
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

