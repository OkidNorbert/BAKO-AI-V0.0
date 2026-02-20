import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { videoAPI, analysisAPI } from '../../services/api'; // Import API services
import { showToast } from '../../components/shared/Toast';
import {
  Upload,
  Video as VideoIcon,
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
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const [uploadData, setUploadData] = useState({
    title: '',
    opponent: '',
    matchDate: new Date().toISOString().split('T')[0],
    matchType: 'league',
    venue: '',
    notes: '',
    // Team identity (used by backend to assign teams + focus highlights)
    ourTeamJersey: 'white jersey',
    opponentJersey: 'dark blue jersey',
    ourTeamId: '1',
    // Safety: enforce basketball constraint (<=10 players on court)
    maxPlayersOnCourt: '10',
    // Additional options
    clearStubs: true,
    readFromStub: false,
  });

  // Jersey color presets
  const jerseyColorPresets = [
    { name: 'White', description: 'white jersey', hex: '#F5F5F5' },
    { name: 'Black', description: 'black jersey', hex: '#1F2937' },
    { name: 'Red', description: 'red jersey', hex: '#DC2626' },
    { name: 'Blue', description: 'blue jersey', hex: '#2563EB' },
    { name: 'Dark Blue', description: 'dark blue jersey', hex: '#1E40AF' },
    { name: 'Yellow', description: 'yellow jersey', hex: '#FBBF24' },
    { name: 'Green', description: 'green jersey', hex: '#10B981' },
    { name: 'Purple', description: 'purple jersey', hex: '#A855F7' },
    { name: 'Orange', description: 'orange jersey', hex: '#F97316' },
  ];

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('idle'); // idle, uploading, processing, completed, error
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [organizationId, setOrganizationId] = useState(null);

  const matchTypes = [
    { value: 'league', label: 'League Game' },
    { value: 'practice', label: 'Practice Session' },
    { value: 'scrimmage', label: 'Scrimmage' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch organization ID on mount if user is a team
  useEffect(() => {
    const fetchOrgId = async () => {
      // Logic to fetch organization ID would go here.
      // For now, if the user object has teamId, we use it.
      // Or we could fetch it from an endpoint.
      if (user?.organizationId) {
        setOrganizationId(user.organizationId);
      } else if (user?.teamId) {
        setOrganizationId(user.teamId);
      }
      // If needed, we could call an API to get the user's organization
      // const org = await api.get('/teams/me');
      // setOrganizationId(org.id);
    };

    if (user) {
      // Fallback: use a placeholder or handle missing ID (maybe backend handles it if user is owner)
      // For the purpose of this task, assuming user has organization context or we pass a dummy ID if allowing loose constraints
      fetchOrgId();
    }
  }, [user]);


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/x-matroska'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.mkv')) {
        showToast('Please select a valid video file (MP4, AVI, MOV, WMV, FLV, MKV)', 'error');
        return;
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        showToast('Video file must be less than 500MB', 'error');
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

  const pollStatus = async (videoId) => {
    try {
      const statusResponse = await videoAPI.getStatus(videoId);
      const { status, progress_percent, current_step, error_message } = statusResponse.data;

      setUploadProgress(progress_percent || 0);
      setCurrentStep(current_step || 'Processing...');

      if (status === 'completed') {
        setUploadStage('completed');
        setCurrentStep('Analysis complete!');
        setUploadProgress(100);

        // Fetch results
        const resultResponse = await analysisAPI.getLastResultByVideo(videoId);
        const data = resultResponse.data;

        // Map backend data to frontend model
        setAnalysisResults({
          totalPlayers: data.players_detected,
          detectedPlays: data.total_passes + data.total_interceptions, // Proxy for plays
          possessions: Math.round(data.total_frames / 30 / 24 * 2), // Rough estimate or use real possession data if available
          shootingPercentage: data.overall_shooting_percentage ? parseFloat(data.overall_shooting_percentage).toFixed(1) : 0,
          keyMoments: data.events ? data.events.map(e => ({
            time: formatTime(e.timestamp_seconds),
            type: e.event_type,
            player: `Player ${e.player_id}`
          })) : []
        });

        setIsUploading(false);
        showToast('Video uploaded and analyzed successfully!', 'success');
        return; // Stop polling
      } else if (status === 'failed') {
        setUploadStage('error');
        setIsUploading(false);
        showToast(`Analysis failed: ${error_message}`, 'error');
        return; // Stop polling
      } else {
        // Continue polling
        setTimeout(() => pollStatus(videoId), 2000);
      }
    } catch (error) {
      console.error("Polling error:", error);
      setUploadStage('error');
      setIsUploading(false);
      showToast('Error checking analysis status', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!videoFile) {
      showToast('Please select a video file', 'error');
      return;
    }

    if (!uploadData.title.trim()) {
      showToast('Please enter a match title', 'error');
      return;
    }

    if (!uploadData.matchDate) {
      showToast('Please select a match date', 'error');
      return;
    }

    setIsUploading(true);
    setUploadStage('uploading');
    setUploadProgress(0);
    setCurrentStep('Uploading video...');

    try {
      // 1. Upload Video
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.notes);
      formData.append('analysis_mode', 'team'); // Hardcoded for team dashboard
      if (user?.organizationId || organizationId) {
        formData.append('organization_id', user?.organizationId || organizationId);
      }

      const uploadResponse = await videoAPI.upload(formData);
      const videoId = uploadResponse.data.id;

      // 2. Trigger Analysis
      setUploadStage('processing');
      setCurrentStep('Queuing analysis...');

      const analysisOptions = {
        our_team_jersey: uploadData.ourTeamJersey,
        opponent_jersey: uploadData.opponentJersey,
        our_team_id: parseInt(uploadData.ourTeamId || '1', 10),
        max_players_on_court: parseInt(uploadData.maxPlayersOnCourt || '10', 10),
        read_from_stub: uploadData.readFromStub,
        clear_stubs_after: uploadData.clearStubs,
      };

      await analysisAPI.triggerTeamAnalysis(videoId, analysisOptions);

      // 3. Poll Status
      pollStatus(videoId);

    } catch (error) {
      console.error("Upload/Analysis error:", error);
      setUploadStage('error');
      setIsUploading(false);
      if (error.response && error.response.data && error.response.data.detail) {
        showToast(`Error: ${error.response.data.detail}`, 'error');
      } else {
        showToast(error.message || 'An error occurred during upload.', 'error');
      }
    }
  };

  const resetUpload = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setUploadData({
      title: '',
      opponent: '',
      matchDate: new Date().toISOString().split('T')[0],
      matchType: 'league',
      venue: '',
      notes: '',
      ourTeamJersey: 'white jersey',
      opponentJersey: 'dark blue jersey',
      ourTeamId: '1',
      maxPlayersOnCourt: '10',
      clearStubs: true,
      readFromStub: false,
    });
    setUploadProgress(0);
    setUploadStage('idle');
    setAnalysisResults(null);
    setCurrentStep('');
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
        return <VideoIcon />;
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
                <VideoIcon className="mr-2" size={24} />
                Video File
              </h2>

              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDarkMode
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                >
                  <Upload className={`mx-auto h-12 w-12 mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Click to upload video
                  </p>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    MP4, AVI, MOV, WMV, FLV, MKV (max 500MB)
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
                        <VideoIcon className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
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

                <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`text-sm font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Users className="mr-2" size={16} />
                    Team Identity & Colors
                  </h3>

                  {/* Our Team Jersey Color */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Your Team Jersey Color
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {jerseyColorPresets.map((preset) => (
                        <button
                          key={preset.description}
                          type="button"
                          onClick={() => handleInputChange('ourTeamJersey', preset.description)}
                          className={`p-3 rounded-lg transition-all border-2 flex flex-col items-center justify-center ${
                            uploadData.ourTeamJersey === preset.description
                              ? isDarkMode ? 'border-orange-400' : 'border-orange-500'
                              : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                          }`}
                          title={preset.name}
                        >
                          <div
                            className="w-6 h-6 rounded-full mb-1 border border-gray-400"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opponent Team Jersey Color */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Opponent Jersey Color
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {jerseyColorPresets.map((preset) => (
                        <button
                          key={preset.description}
                          type="button"
                          onClick={() => handleInputChange('opponentJersey', preset.description)}
                          className={`p-3 rounded-lg transition-all border-2 flex flex-col items-center justify-center ${
                            uploadData.opponentJersey === preset.description
                              ? isDarkMode ? 'border-blue-400' : 'border-blue-500'
                              : isDarkMode ? 'border-gray-600' : 'border-gray-300'
                          }`}
                          title={preset.name}
                        >
                          <div
                            className="w-6 h-6 rounded-full mb-1 border border-gray-400"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className={`text-xs text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Which team is ours?
                      </label>
                      <select
                        value={uploadData.ourTeamId}
                        onChange={(e) => handleInputChange('ourTeamId', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                      >
                        <option value="1">Team 1 (highlight as ours)</option>
                        <option value="2">Team 2 (highlight as ours)</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Max players on court
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={uploadData.maxPlayersOnCourt}
                        onChange={(e) => handleInputChange('maxPlayersOnCourt', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                      />
                    </div>
                  </div>

                  {/* Analysis Options */}
                  <div className="mt-4 pt-4 border-t border-gray-400/20">
                    <h4 className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      ANALYSIS OPTIONS
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadData.clearStubs}
                          onChange={(e) => handleInputChange('clearStubs', e.target.checked)}
                          className="rounded"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Clear cached data before analysis (ensures fresh detection)
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadData.readFromStub}
                          onChange={(e) => handleInputChange('readFromStub', e.target.checked)}
                          className="rounded"
                        />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Use cached detections (faster but may be less accurate)
                        </span>
                      </label>
                    </div>
                  </div>
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
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${isUploading || !videoFile
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                    : isDarkMode
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <Activity className="animate-spin" size={20} />
                      <span>{uploadStage === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
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
                  <span className="ml-2">{currentStep || 'Processing...'}</span>
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
                      Status: <span className="font-semibold">{currentStep}</span>
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Analysis Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : ''}`}>
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
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
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {analysisResults.keyMoments.length > 0 ? (
                        analysisResults.keyMoments.map((moment, index) => (
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
                        ))
                      ) : (
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No key moments detected.</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/team/matches')}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${isDarkMode
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
