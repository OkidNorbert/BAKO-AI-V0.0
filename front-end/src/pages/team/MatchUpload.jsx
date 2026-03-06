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

  const isCoach = user?.role === 'coach';
  const isLinked = !!user?.organizationId;

  if (user?.role === 'team') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Shield size={64} className="text-orange-500 mb-6" />
        <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Operational Access Restricted</h1>
        <p className={`max-w-md mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Match analysis and operational management are delegated to the Coaching Staff.
          Please ensure you have linked a Coach to your organization to perform these tasks.
        </p>
        <button
          onClick={() => navigate('/team/staff')}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Manage Coaching Staff
        </button>
      </div>
    );
  }

  if (!isCoach || !isLinked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <AlertTriangle size={64} className="text-yellow-500 mb-6" />
        <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Access Required</h1>
        <p className={`max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {!isCoach ? "This feature is reserved for the Coaching Staff." : "You must be linked to an organization to upload match videos."}
        </p>
      </div>
    );
  }
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
    { name: 'Grey', description: 'grey jersey', hex: '#9CA3AF' },
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
          keyMoments: data.events ? data.events.filter(e => e.event_type !== 'summary_stats').map(e => ({
            time: formatTime(e.timestamp_seconds || (e.frame ? e.frame / 30 : 0)),
            type: e.event_type,
            player: e.player_id || e.details?.player ? `Player ${e.player_id || e.details.player}` : 'Team'
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
        enable_advanced_analytics: true,
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <button
            onClick={() => navigate('/team/matches')}
            className="flex items-center space-x-2 mb-6 text-gray-500 hover:text-white transition-colors font-bold text-sm"
          >
            <ArrowLeft size={16} />
            <span>Back to Analysis</span>
          </button>
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Upload Video</h1>
          <p className="text-xl text-gray-500">
            Upload game footage for <span className="text-orange-500 font-black">AI-powered</span> basketball analysis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Upload Form */}
        <div className="space-y-8">
          
          {/* Video Upload Area */}
          <div className="p-8 rounded-[2rem] glass-dark border border-white/5">
            <h2 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
              <VideoIcon className="mr-3 text-orange-500" size={28} />
              Video File
            </h2>

            {!videoFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center cursor-pointer transition-all hover:border-orange-500/50 hover:bg-orange-500/5 group"
              >
                <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="h-10 w-10 text-orange-500" />
                </div>
                <p className="text-xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors">
                  Click to upload video
                </p>
                <p className="text-sm font-bold text-gray-500">
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
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <VideoIcon size={32} />
                  </div>
                  <div>
                    <p className="font-black text-white text-lg truncate max-w-[200px] md:max-w-xs">
                      {videoFile.name}
                    </p>
                    <p className="text-sm font-bold text-gray-500 mt-1">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Match Details Form */}
          <div className="p-8 rounded-[2rem] glass-dark border border-white/5">
            <h2 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
              <FileText className="mr-3 text-blue-500" size={28} />
              Match Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                  Match Title *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                  placeholder="e.g., vs. Lakers - Home Game"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                  Opponent
                </label>
                <input
                  type="text"
                  value={uploadData.opponent}
                  onChange={(e) => handleInputChange('opponent', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                  placeholder="e.g., Lakers"
                />
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-sm uppercase font-black tracking-widest text-white mb-6 flex items-center">
                  <span className="text-purple-500 mr-2"><Users size={16} /></span>
                  Team Identity & Colors
                </h3>

                {/* Our Team Jersey Color */}
                <div className="mb-6">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-3">
                    Your Team Jersey
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {jerseyColorPresets.map((preset) => (
                      <button
                        key={preset.description}
                        type="button"
                        onClick={() => handleInputChange('ourTeamJersey', preset.description)}
                        className={`p-3 rounded-2xl transition-all border-2 flex flex-col items-center justify-center ${uploadData.ourTeamJersey === preset.description
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                          }`}
                        title={preset.name}
                      >
                        <div
                          className="w-8 h-8 rounded-full mb-2 shadow-inner border border-white/10"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-[9px] uppercase font-black tracking-wider text-gray-400">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opponent Team Jersey Color */}
                <div className="mb-6">
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-3">
                    Opponent Jersey
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {jerseyColorPresets.map((preset) => (
                      <button
                        key={preset.description}
                        type="button"
                        onClick={() => handleInputChange('opponentJersey', preset.description)}
                        className={`p-3 rounded-2xl transition-all border-2 flex flex-col items-center justify-center ${uploadData.opponentJersey === preset.description
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/5 bg-white/5 hover:bg-white/10'
                          }`}
                        title={preset.name}
                      >
                        <div
                          className="w-8 h-8 rounded-full mb-2 shadow-inner border border-white/10"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-[9px] uppercase font-black tracking-wider text-gray-400">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                      Which team is ours?
                    </label>
                    <div className="px-4 py-1 rounded-2xl bg-white/5 border border-white/10">
                      <select
                        value={uploadData.ourTeamId}
                        onChange={(e) => handleInputChange('ourTeamId', e.target.value)}
                        className="w-full bg-transparent border-none text-white font-bold p-3 focus:ring-0 appearance-none cursor-pointer"
                      >
                        <option value="1" className="bg-gray-900">Team 1 (highlight as ours)</option>
                        <option value="2" className="bg-gray-900">Team 2 (highlight as ours)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                      Max players on court
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={uploadData.maxPlayersOnCourt}
                      onChange={(e) => handleInputChange('maxPlayersOnCourt', e.target.value)}
                      className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 font-bold"
                    />
                  </div>
                </div>

                {/* Analysis Options */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-4">
                    Expert Options
                  </h4>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={uploadData.clearStubs}
                        onChange={(e) => handleInputChange('clearStubs', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-gray-900"
                      />
                      <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                        Clear cached data (fresh detection)
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={uploadData.readFromStub}
                        onChange={(e) => handleInputChange('readFromStub', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-gray-900"
                      />
                      <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                        Use cached detections (faster)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    value={uploadData.matchDate}
                    onChange={(e) => handleInputChange('matchDate', e.target.value)}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                    Match Type
                  </label>
                  <div className="px-4 py-1 rounded-2xl bg-white/5 border border-white/10">
                    <select
                      value={uploadData.matchType}
                      onChange={(e) => handleInputChange('matchType', e.target.value)}
                      className="w-full bg-transparent border-none text-white font-bold p-3 focus:ring-0 appearance-none cursor-pointer"
                    >
                      {matchTypes.map(type => (
                        <option key={type.value} value={type.value} className="bg-gray-900">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  value={uploadData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
                  placeholder="e.g., Home Court"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                  Notes
                </label>
                <textarea
                  value={uploadData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold custom-scrollbar"
                  placeholder="Additional notes about the match..."
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isUploading || !videoFile}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center space-x-3 ${isUploading || !videoFile
                    ? 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10 shadow-none'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <Activity className="animate-spin text-white" size={24} />
                      <span>{uploadStage === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} />
                      <span>Upload & Analyze</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Video Preview & Analysis */}
        <div className="space-y-8">
          
          {/* Video Preview */}
          {videoPreview && (
            <div className="p-8 rounded-[2rem] glass-dark border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <h2 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
                <Play className="mr-3 text-green-500" size={28} />
                Preview
              </h2>

              <div className="relative rounded-[2rem] overflow-hidden bg-black/50 border border-white/10">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full aspect-video object-contain"
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onClick={togglePlayPause}
                />

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={togglePlayPause}
                      className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                    >
                      {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
                    </button>

                    <div className="flex-1">
                      {/* Progress Bar */}
                      <div className="h-1 bg-white/20 rounded-full mb-2 cursor-pointer relative overflow-hidden group">
                        <div 
                          className="absolute top-0 left-0 h-full bg-orange-500 group-hover:bg-orange-400 transition-colors"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-gray-300">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="p-8 rounded-[2rem] glass-dark border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                  uploadStage === 'error' ? 'bg-red-500/20 text-red-500' :
                  uploadStage === 'completed' ? 'bg-green-500/20 text-green-500' :
                  'bg-orange-500/20 text-orange-500'
                }`}>
                  {uploadStage === 'uploading' && <Upload className="animate-bounce" size={28} />}
                  {uploadStage === 'processing' && <Activity className="animate-pulse" size={28} />}
                  {uploadStage === 'completed' && <CheckCircle size={28} />}
                  {uploadStage === 'error' && <AlertTriangle size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Status</h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">{currentStep || 'Processing...'}</p>
                </div>
              </div>

              {uploadStage === 'uploading' && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm uppercase tracking-widest font-black text-gray-400">
                    <span>Progress</span>
                    <span className="text-white">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-4 p-1 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>
              )}

              {uploadStage === 'processing' && (
                <div className="space-y-6">
                  <div className="flex justify-between text-sm uppercase tracking-widest font-black text-gray-400">
                    <span>Analysis Engine Processing</span>
                    <span className="text-white animate-pulse">Running</span>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`flex-1 h-2 rounded-full bg-orange-500/50 animate-pulse`} style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              {uploadStage === 'error' && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 font-bold flex items-center gap-2">
                    <AlertTriangle size={16} /> Something went wrong. Please try again.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analysis Results Preview */}
          {analysisResults && uploadStage === 'completed' && (
            <div className="p-8 rounded-[2rem] glass-dark border border-orange-500/30 animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-[0_0_40px_rgba(249,115,22,0.1)]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white flex items-center">
                  <Target className="mr-3 text-orange-500" size={28} />
                  Analysis Complete
                </h2>
                <div className="px-3 py-1 bg-green-500/20 text-green-500 border border-green-500/30 rounded-xl text-[10px] uppercase font-black tracking-widest">
                  Ready
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">Players Tracked</div>
                  <div className="text-4xl font-black text-white">{analysisResults.totalPlayers || '-'}</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-2">Est. Possessions</div>
                  <div className="text-4xl font-black text-orange-500">{analysisResults.possessions || '-'}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-400">Head to the Match Analysis dashboard to view full player stats, heatmaps, and event timelines generated by BAKO.AI.</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button onClick={resetUpload} className="py-4 rounded-xl border border-white/10 text-white font-black hover:bg-white/5 transition-colors">
                    Upload Another
                  </button>
                  <button onClick={() => navigate('/team/matches')} className="py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    View Insights
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchUpload;
