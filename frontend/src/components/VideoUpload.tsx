import React, { useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';

interface UploadProgress {
  percentage: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

export const VideoUpload: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    percentage: 0,
    status: 'idle',
    message: '',
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a video file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setProgress({
        percentage: 10,
        status: 'uploading',
        message: 'Preparing upload...',
      });

      // Step 1: Get upload metadata (presigned URL)
      const metadataResponse = await api.videos.getUploadMetadata(
        1, // Default session ID - will be user-selectable in future
        selectedFile.name,
        selectedFile.size
      );

      const { video_id, upload_url } = metadataResponse.data;
      showToast('Upload started...', 'info');

      setProgress({
        percentage: 20,
        status: 'uploading',
        message: 'Uploading video...',
      });

      // Step 2: Upload file directly to storage (MinIO/S3)
      const axios = await import('axios');
      await axios.default.put(upload_url, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(20 + (progressEvent.loaded * 60) / (progressEvent.total || 1));
          setProgress({
            percentage: percentCompleted,
            status: 'uploading',
            message: `Uploading... ${percentCompleted}%`,
          });
        },
      });

      setProgress({
        percentage: 85,
        status: 'processing',
        message: 'Confirming upload...',
      });

      // Step 3: Confirm upload
      await api.videos.confirmUpload(video_id);
      showToast('Upload confirmed, processing video...', 'success');

      setProgress({
        percentage: 90,
        status: 'processing',
        message: 'Processing video with AI...',
      });

      // Simulate AI processing (in real app, poll for results)
      setTimeout(() => {
        setProgress({
          percentage: 100,
          status: 'complete',
          message: 'Analysis complete!',
        });

        // Mock analysis results
        setAnalysisResult({
          video_id,
          summary: {
            total_shots: 45,
            successful_shots: 35,
            accuracy: 77.8,
            avg_jump_height: 28.5,
            avg_speed: 15.2,
            total_distance: 1250,
          },
          events: [
            { type: 'shot', timestamp: 12.5, success: true, form_score: 85 },
            { type: 'dribble', timestamp: 18.2, effectiveness: 92 },
            { type: 'jump', timestamp: 25.8, height: 32, form_score: 88 },
          ],
          recommendations: [
            'Your shooting form is excellent, but consider adjusting your elbow angle slightly',
            'Great footwork on defense, maintain this consistency',
            'Increase your vertical jump training for better rebounding',
          ],
        });
      }, 3000);

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || 'Upload failed. Please try again.';
      setProgress({
        percentage: 0,
        status: 'error',
        message: errorMessage,
      });
      showToast(errorMessage, 'error');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setProgress({ percentage: 0, status: 'idle', message: '' });
    setAnalysisResult(null);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Video Analysis</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upload your training footage for AI-powered performance analysis</p>
        </div>

        {!analysisResult ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}>
            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? darkMode 
                    ? 'border-orange-500 bg-orange-900' 
                    : 'border-orange-600 bg-orange-50'
                  : darkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              id="video-upload"
            />

            {progress.status === 'idle' && !selectedFile && (
              <label htmlFor="video-upload" className="cursor-pointer">
                <svg
                  className={`mx-auto h-16 w-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Drag and drop your video here
                </p>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>or click to browse files</p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Supported formats: MP4, MOV, AVI (max 500MB)
                </p>
              </label>
            )}

            {selectedFile && progress.status === 'idle' && (
              <div>
                <svg
                  className="mx-auto h-16 w-16 text-green-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{selectedFile.name}</p>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleUpload}
                    className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Upload and Analyze
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className={`px-6 py-3 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} font-semibold rounded-lg transition-colors`}
                  >
                    Choose Different File
                  </button>
                </div>
              </div>
            )}

            {(progress.status === 'uploading' || progress.status === 'processing') && (
              <div>
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto mb-4"></div>
                <p className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{progress.message}</p>
                <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3 mb-4 max-w-md mx-auto`}>
                  <div
                    className="bg-orange-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{progress.percentage}%</p>
              </div>
            )}

            {progress.status === 'error' && (
              <div>
                <svg
                  className="mx-auto h-16 w-16 text-red-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xl font-semibold text-red-600 mb-4">{progress.message}</p>
                <button
                  onClick={resetUpload}
                  className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analysis Results</h2>
                <button
                  onClick={resetUpload}
                  className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} font-semibold rounded-lg transition-colors`}
                >
                  Upload Another Video
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-50'} rounded-lg p-4`}>
                  <p className={`${darkMode ? 'text-orange-200' : 'text-gray-600'} text-sm`}>Shot Accuracy</p>
                  <p className="text-3xl font-bold text-orange-600">{analysisResult.summary.accuracy}%</p>
                </div>
                <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-4`}>
                  <p className={`${darkMode ? 'text-blue-200' : 'text-gray-600'} text-sm`}>Avg Jump Height</p>
                  <p className="text-3xl font-bold text-blue-600">{analysisResult.summary.avg_jump_height}"</p>
                </div>
                <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg p-4`}>
                  <p className={`${darkMode ? 'text-green-200' : 'text-gray-600'} text-sm`}>Avg Speed</p>
                  <p className="text-3xl font-bold text-green-600">{analysisResult.summary.avg_speed} mph</p>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Recommendations</h3>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-6 h-6 text-orange-600 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
          </div>

            {/* Event Timeline */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Event Timeline</h3>
              <div className="space-y-3">
                {analysisResult.events.map((event: any, index: number) => (
                  <div key={index} className="flex items-center border-l-4 border-orange-600 pl-4 py-2">
                    <div className="flex-1">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>{event.type}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.timestamp}s
                        {event.success !== undefined && ` • ${event.success ? 'Success' : 'Miss'}`}
                        {event.form_score && ` • Form Score: ${event.form_score}%`}
                        {event.height && ` • Height: ${event.height}"`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
