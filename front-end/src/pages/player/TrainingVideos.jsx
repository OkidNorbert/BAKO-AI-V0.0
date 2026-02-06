import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MOCK_AUTH_ENABLED } from '@/utils/mockAuth';
import { MOCK_TRAINING_VIDEOS } from '@/utils/mockData';
import api from '@/utils/axiosConfig';
import { Video, Upload, PlayCircle, Calendar, RefreshCw, AlertCircle } from 'lucide-react';

const TrainingVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');

      if (MOCK_AUTH_ENABLED) {
        console.log('Mock mode: skipping API videos fetch');
        setVideos(MOCK_TRAINING_VIDEOS);
        setLoading(false);
        return;
      }

      const response = await api.get('/player/training-videos');
      setVideos(Array.isArray(response.data) ? response.data : response.data?.videos || []);
    } catch (err) {
      console.error('Error fetching training videos:', err);
      setError('Failed to load training videos.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      if (MOCK_AUTH_ENABLED) {
        console.log('Mock mode: simulating video upload');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time

        // Add a new mock video
        const newVideo = {
          id: Math.random().toString(36).substr(2, 9),
          title: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'processing'
        };
        setVideos(prev => [newVideo, ...prev]);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('video', file);
      await api.post('/player/training-videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(data) => data]
      });
      await fetchVideos();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
            <Video className="h-8 w-8 mr-2 text-orange-500" />
            Training Videos
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchVideos}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100 border border-gray-200'} transition-colors`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white transition-colors ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
              <Upload className="h-4 w-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Video'}</span>
              <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-md flex items-center">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {videos.length === 0 ? (
          <div className={`rounded-xl border-2 border-dashed p-12 text-center ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-white'}`}>
            <Video className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No training videos yet</p>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Upload game or practice footage to get started with analysis.</p>
            <label className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer ${isDarkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'} text-white transition-colors`}>
              <Upload className="h-5 w-5 mr-2" />
              <span>Upload Video</span>
              <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id || video._id} className={`rounded-xl overflow-hidden shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="aspect-video bg-gray-700 flex items-center justify-center relative">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <PlayCircle className="h-16 w-16 text-gray-500" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{video.title || video.name || 'Untitled'}</h3>
                  {video.uploadedAt && (
                    <p className={`text-sm mt-1 flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(video.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingVideos;
