import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import {
  Upload,
  Video,
  FileText,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Save,
  X,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Target,
  Activity
} from 'lucide-react';

const MatchUpload = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  
  const [uploadData, setUploadData] = useState({
    title: '',
    opponent: '',
    matchDate: '',
    matchType: 'league',
    venue: '',
    notes: ''
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('idle'); // idle, uploading, processing, completed, error
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const matchTypes = [
    { value: 'league', label: 'League Game' },
    { value: 'practice', label: 'Practice Session' },
    { value: 'scrimmage', label: 'Scrimmage' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid video file (MP4, AVI, MOV, WMV, FLV)');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast.error('Video file must be less than 500MB');
        return;
      }

      setVideoFile(file);
      
      // Create video preview
      const videoURL = URL.createObjectURL(file);
      setVideoPreview(videoURL);
      
      // Auto-fill title with filename if empty
      if (!uploadData.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setUploadData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setUploadData(prev => ({ ...prev, [field]: value }));
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const simulateUpload = async () => {
    setIsUploading(true);
    setUploadStage('uploading');
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    // Simulate processing
    setUploadStage('processing');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate analysis results
    setUploadStage('completed');
    setAnalysisResults({
      totalPlayers: 10,
      detectedPlays: 45,
      possessions: 120,
      shootingPercentage: 48.5,
      keyMoments: [
        { time: '02:15', type: 'turnover', player: 'Point Guard' },
        { time: '05:30', type: '3-pointer', player: 'Shooting Guard' },
        { time: '08:45', type: 'fast break', player: 'Small Forward' },
        { time: '12:20', type: 'block', player: 'Center' }
      ]
    });

    setIsUploading(false);
    toast.success('Video uploaded and analyzed successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    if (!uploadData.title.trim()) {
      toast.error('Please enter a match title');
      return;
    }

    if (!uploadData.matchDate) {
      toast.error('Please select a match date');
      return;
    }

    await simulateUpload();
  };

  const resetUpload = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setUploadData({
      title: '',
      opponent: '',
      matchDate: '',
      matchType: 'league',
      venue: '',
      notes: ''
    });
    setUploadProgress(0);
    setUploadStage('idle');
    setAnalysisResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStageIcon = () => {
    switch (uploadStage) {
      case 'uploading':
        return <Upload className="animate-pulse" />;
      case 'processing':
        return <Activity className="animate-spin" />;
      case 'completed':
        return <CheckCircle className="text-green-500" />;
      case 'error':
        return <AlertTriangle className="text-red-500" />;
      default:
        return <Video />;
    }
  };

  const getStageText = () => {
    switch (uploadStage) {
      case 'uploading':
        return 'Uploading video...';
      case 'processing':
        return 'Analyzing video with AI...';
      case 'completed':
        return 'Analysis complete!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-purple-950'
        : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/team/matches')}
            className={`flex items-center space-x-2 mb-4 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft size={20} />
            <span>Back to Match Analysis</span>
          </button>
          
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Upload Match Video
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Upload game footage for AI-powered basketball analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Upload Form */}
          <div className="space-y-6">
            
            {/* Video Upload Area */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Video className="mr-2" size={24} />
                Video File
              </h2>
              
              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500 bg-gray-700' 
                      : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <Upload className={`mx-auto h-12 w-12 mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Click to upload video
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    MP4, AVI, MOV, WMV, FLV (max 500MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Video className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {videoFile.name}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={resetUpload}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Match Details Form */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="mr-2" size={24} />
                Match Details
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Match Title *
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="e.g., vs. Lakers - Home Game"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Opponent
                  </label>
                  <input
                    type="text"
                    value={uploadData.opponent}
                    onChange={(e) => handleInputChange('opponent', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="e.g., Lakers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Match Date *
                    </label>
                    <input
                      type="date"
                      value={uploadData.matchDate}
                      onChange={(e) => handleInputChange('matchDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Match Type
                    </label>
                    <select
                      value={uploadData.matchType}
                      onChange={(e) => handleInputChange('matchType', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    >
                      {matchTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Venue
                  </label>
                  <input
                    type="text"
                    value={uploadData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="e.g., Home Court"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Notes
                  </label>
                  <textarea
                    value={uploadData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                    placeholder="Additional notes about the match..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !videoFile}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    isUploading || !videoFile
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : isDarkMode
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Activity className="animate-spin" size={20} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Upload & Analyze</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Video Preview & Analysis */}
          <div className="space-y-6">
            
            {/* Video Preview */}
            {videoPreview && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Play className="mr-2" size={24} />
                  Video Preview
                </h2>
                
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    className="w-full rounded-lg"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                  />
                  
                  {/* Video Controls */}
                  <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={togglePlayPause}
                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      
                      <div className="flex-1">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getStageIcon()}
                  <span className="ml-2">{getStageText()}</span>
                </h2>
                
                {uploadStage === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        Upload Progress
                      </span>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : ''}`}>
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {uploadStage === 'processing' && (
                  <div className="space-y-3">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      AI is analyzing your video for:
                    </p>
                    <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Player detection and tracking
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Play pattern recognition
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Shooting analysis
                      </li>
                      <li className="flex items-center">
                        <Activity className="mr-2 h-4 w-4 text-blue-500 animate-spin" />
                        Generating performance metrics...
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Results */}
            {analysisResults && (
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Target className="mr-2" size={24} />
                  Analysis Results
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Players Detected
                      </p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResults.totalPlayers}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Key Plays
                      </p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResults.detectedPlays}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Possessions
                      </p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResults.possessions}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Shooting %
                      </p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResults.shootingPercentage}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Key Moments
                    </h3>
                    <div className="space-y-2">
                      {analysisResults.keyMoments.map((moment, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {moment.time}
                            </span>
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {moment.type}
                            </span>
                          </div>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {moment.player}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate('/team/matches')}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    View Full Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchUpload;
