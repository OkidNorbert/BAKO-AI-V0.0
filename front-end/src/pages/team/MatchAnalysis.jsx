import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { videoAPI, analysisAPI, advancedAnalyticsAPI } from '../../services/api';
import VideoPlayer from '../../components/team/video-player';
import {
  Search,
  Filter,
  Edit,
  FileText,
  Calendar,
  BarChart,
  Video,
  Info,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Share,
  Target,
  Users,
  Activity,
  TrendingUp,
  ArrowLeft,
  Layout,
  Zap
} from 'lucide-react';
import TacticalBoard from '../../components/team/tactical-board';

const MatchAnalysis = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { isDarkMode } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [analysisView, setAnalysisView] = useState('list'); // list, player, detailed
  const [liveTacticalData, setLiveTacticalData] = useState({ players: [], ball: null });
  const [seekTime, setSeekTime] = useState(null);

  // Highlights state
  const [clips, setClips] = useState([]);
  const [isFetchingClips, setIsFetchingClips] = useState(false);
  const [activeClip, setActiveClip] = useState(null);

  const [matchStats, setMatchStats] = useState({
    total: 0,
    byStatus: {
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0
    },
    byType: {
      team: 0,
      personal: 0
    }
  });

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (matches.length > 0) {
      const stats = {
        total: matches.length,
        byStatus: {
          completed: 0,
          processing: 0,
          pending: 0,
          failed: 0
        },
        byType: {
          team: 0,
          personal: 0
        }
      };

      matches.forEach(match => {
        const type = match.analysis_mode || 'team';
        if (stats.byType[type] !== undefined) stats.byType[type]++;

        const status = match.status || 'pending';
        if (stats.byStatus[status] !== undefined) stats.byStatus[status]++;
        else stats.byStatus.pending++;
      });

      setMatchStats(stats);
    }
  }, [matches]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await videoAPI.list({ page_size: 100 });
      setMatches(response.data.videos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
      setError('Failed to fetch videos');
    }
  };

  const filteredMatches = matches.filter(match => {
    if (!match) return false;
    const title = (match.title || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = title.includes(searchTermLower);
    const matchesType = filterType === 'all' || match.analysis_mode === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const handleOpenMatchDetails = (match) => {
    setEditingMatch(match);
    setIsEditMode(false);
    setShowEditModal(true);
    setUpdateError('');
  };

  const handleEditMatch = (match, e) => {
    e.stopPropagation();
    setEditingMatch(match);
    setFormData({ ...match });
    setIsEditMode(true);
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateMatch = async (e) => {
    setShowEditModal(false);
  };

  const handleAddMatchClick = () => {
    navigate('/team/matches/upload');
  };

  const handleViewMatch = async (match) => {
    let analysisData = null;
    if (match.status === 'completed') {
      try {
        const res = await analysisAPI.getLastResultByVideo(match.id);
        analysisData = res.data;

        try {
          const detRes = await analysisAPI.getDetections(analysisData.id);
          if (detRes.data && detRes.data.detections) {
            analysisData.detections = detRes.data.detections;
          }
        } catch (detError) {
          console.warn("Could not fetch detections", detError);
        }
      } catch (e) {
        console.error("Could not fetch analysis", e);
      }
    }

    // Fetch coaching clips (Highlights)
    if (match.status === 'completed') {
      try {
        setIsFetchingClips(true);
        const clipsRes = await advancedAnalyticsAPI.getClips(match.id);
        if (clipsRes.data && clipsRes.data.clips) {
          setClips(clipsRes.data.clips);
        } else {
          setClips([]);
        }
      } catch (clipError) {
        console.warn("Could not fetch clips", clipError);
        setClips([]);
      } finally {
        setIsFetchingClips(false);
      }
    } else {
      setClips([]);
    }

    setSelectedMatch({ ...match, analysisData });
    setShowVideoPlayer(true);
    setAnalysisView('player');
  };

  const handleBackToList = () => {
    setShowVideoPlayer(false);
    setSelectedMatch(null);
    setAnalysisView('list');
    setClips([]);
    setActiveClip(null);
  };

  const handleDeleteMatch = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await videoAPI.delete(id);
        setMatches(matches.filter(m => m.id !== id));
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const handleVideoTimeUpdate = (currentTime) => {
    if (selectedMatch) {
      // Logic for time-dependent UI updates
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white'
      : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
      }`}>

      {/* Video Player View */}
      {showVideoPlayer && selectedMatch && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className={`flex items-center space-x-2 mb-4 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ArrowLeft size={20} />
              <span>Back to Matches</span>
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMatch.title}
                </h1>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(selectedMatch.created_at).toLocaleDateString()} • {selectedMatch.duration_seconds ? `${Math.round(selectedMatch.duration_seconds)}s` : 'Unknown duration'} • {selectedMatch.analysis_mode}
                </p>
              </div>

              <div className="flex space-x-2 mt-4 md:mt-0">
                <button
                  onClick={() => {
                    const url = (selectedMatch.has_annotated && selectedMatch.annotated_download_url)
                      ? selectedMatch.annotated_download_url
                      : selectedMatch.download_url;
                    if (!url) return;
                    window.open(`${url}${url.includes('?') ? '&' : '?'}token=${localStorage.getItem('accessToken')}`);
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}>
                  <Download size={16} className="mr-2" />
                  Export
                </button>
                <button className={`flex items-center px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}>
                  <Share size={16} className="mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-6">
              <VideoPlayer
                videoSrc={(() => {
                  const url = (selectedMatch.has_annotated && selectedMatch.annotated_download_url)
                    ? selectedMatch.annotated_download_url
                    : selectedMatch.download_url;
                  return url ? `${url}${url.includes('?') ? '&' : '?'}token=${localStorage.getItem('accessToken')}` : '';
                })()}
                analysisData={selectedMatch.analysisData}
                onTimeUpdate={handleVideoTimeUpdate}
                onTacticalUpdate={setLiveTacticalData}
                seekTo={seekTime}
              />

              {/* Tactical View Section (under video) */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Layout className="mr-2" size={20} />
                  Live Tactical Board (2D View)
                </h3>
                <TacticalBoard
                  players={liveTacticalData.players}
                  ball={liveTacticalData.ball}
                  team1Stats={selectedMatch.analysisData ? {
                    name: 'HOME',
                    possession: selectedMatch.analysisData.team_1_possession_percent,
                    passes: selectedMatch.analysisData.team_1_passes || 0,
                    interceptions: selectedMatch.analysisData.team_1_interceptions || 0
                  } : {}}
                  team2Stats={selectedMatch.analysisData ? {
                    name: 'AWAY',
                    possession: selectedMatch.analysisData.team_2_possession_percent,
                    passes: selectedMatch.analysisData.team_2_passes || 0,
                    interceptions: selectedMatch.analysisData.team_2_interceptions || 0
                  } : {}}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

            {/* Analysis Sidebar */}
            <div className="space-y-6">
              {/* Match Stats */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <BarChart className="mr-2" size={20} />
                  Match Statistics
                </h3>

                {selectedMatch.analysisData ? (() => {
                  const data = selectedMatch.analysisData;
                  const events = data.events || [];
                  const shots = events.filter(e => e.event_type === 'shot');
                  const madeCount = data.shots_made || shots.filter(s => s.details?.outcome === 'made').length;
                  const missedCount = data.shots_missed || shots.filter(s => s.details?.outcome === 'missed').length;
                  const totalCount = data.shot_attempts || shots.length;
                  const percentage = data.overall_shooting_percentage || (totalCount > 0 ? (madeCount / totalCount * 100) : 0);

                  return (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Possession Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                          <span className="text-blue-500">Home {data.team_1_possession_percent}%</span>
                          <span className="text-red-500">{data.team_2_possession_percent}% Away</span>
                        </div>
                        <div className="h-2 w-full bg-gray-700 rounded-full flex overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${data.team_1_possession_percent}%` }}
                          />
                          <div
                            className="h-full bg-red-500 transition-all duration-1000"
                            style={{ width: `${data.team_2_possession_percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <MatchStatCard
                          label="Passes (H/A)"
                          value={`${data.team_1_passes || 0} / ${data.team_2_passes || 0}`}
                          icon={<Share size={14} />}
                          isDarkMode={isDarkMode}
                          subtitle="Split by team"
                        />
                        <MatchStatCard
                          label="Interceptions (H/A)"
                          value={`${data.team_1_interceptions || 0} / ${data.team_2_interceptions || 0}`}
                          icon={<Target size={14} />}
                          isDarkMode={isDarkMode}
                          color="text-emerald-500"
                          subtitle="Split by team"
                        />
                        <MatchStatCard
                          label="Distance"
                          value={`${data.total_distance_meters || 0}m`}
                          icon={<Activity size={14} />}
                          isDarkMode={isDarkMode}
                        />
                        <MatchStatCard
                          label="Players"
                          value={data.players_detected}
                          icon={<Users size={14} />}
                          isDarkMode={isDarkMode}
                        />
                      </div>

                      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold uppercase tracking-wider">Shooting Performance</h4>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${percentage > 45 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}% ACC
                          </span>
                        </div>

                        <div className="space-y-2">
                          <ShootingBar label="Attempts" value={totalCount} total={totalCount} color="bg-gray-500" isDarkMode={isDarkMode} />
                          <ShootingBar label="Made" value={madeCount} total={totalCount} color="bg-green-500" isDarkMode={isDarkMode} />
                          <ShootingBar label="Missed" value={missedCount} total={totalCount} color="bg-red-500" isDarkMode={isDarkMode} />
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-gray-500">Analysis data not available yet.</p>
                )}
              </div>

              {/* Highlights / Coaching Clips */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="mr-2 text-yellow-500" size={20} />
                  Coaching Highlights
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {isFetchingClips ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500"></div>
                    </div>
                  ) : clips.length > 0 ? (
                    clips.map((clip, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${activeClip === clip
                          ? (isDarkMode ? 'bg-orange-950/30 border-orange-500' : 'bg-orange-50 border-orange-400')
                          : (isDarkMode ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300')
                          }`}
                        onClick={() => {
                          setActiveClip(clip);
                          setSeekTime(clip.timestamp_start);
                          setTimeout(() => setSeekTime(null), 100);
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold uppercase py-0.5 px-1.5 rounded ${clip.clip_type === 'poor_spacing' ? 'bg-red-500/20 text-red-500' :
                            clip.clip_type === 'late_rotation' ? 'bg-orange-500/20 text-orange-500' :
                              clip.clip_type === 'low_decision_quality' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-gray-500/20 text-gray-400'
                            }`}>
                            {clip.clip_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            {new Date(clip.timestamp_start * 1000).toISOString().substr(14, 5)}
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {clip.description}
                        </p>

                        {activeClip === clip && (
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const clipUrl = `/clips/${selectedMatch.id}/${clip.file_path.split('/').pop()}`;
                                window.open(clipUrl, '_blank');
                              }}
                              className="text-xs flex items-center bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                            >
                              <Play size={12} className="mr-1" /> View Clip
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedMatch.analysisData?.advanced_analytics ? "No coaching clips identified." : "Process video to extract highlights."}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Events */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="mr-2" size={20} />
                  Key Events
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedMatch.analysisData && selectedMatch.analysisData.events && selectedMatch.analysisData.events.length > 0 ? (
                    selectedMatch.analysisData.events.filter(e => e.event_type !== 'summary_stats').map((event, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          const time = event.timestamp_seconds || (event.frame ? event.frame / 30 : 0);
                          setSeekTime(time);
                          setTimeout(() => setSeekTime(null), 100);
                        }}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transform transition-transform hover:scale-[1.02] ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {event.timestamp ? new Date(event.timestamp * 1000).toISOString().substr(14, 5) : (event.frame ? (event.frame / 30).toFixed(2) : '-')}
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {event.event_type === 'shot'
                              ? `${event.details?.outcome === 'made' ? '🏀 Made' : '❌ Missed'} ${event.details?.type || ''} Shot`
                              : (event.event_type || event.type || 'unknown').charAt(0).toUpperCase() + (event.event_type || event.type || 'unknown').slice(1)}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {event.details?.player ? `P${event.details.player}` : (event.player_id ? `P${event.player_id}` : '')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No key events detected.
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Tools */}
              <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Target className="mr-2" size={20} />
                  Analysis Tools
                </h3>

                <div className="space-y-2">
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Player Tracking Analysis
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Shot Chart Generation
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Movement Heatmap
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                    Performance Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {!showVideoPlayer && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}>Match Analysis</h1>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload and manage game footage for AI analysis
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button
                onClick={handleAddMatchClick}
                className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition-colors`}
              >
                <Video className="mr-2 h-5 w-5" />
                Upload Match
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-blue-900 to-indigo-900 shadow-lg'
              : 'bg-gradient-to-br from-blue-50 to-indigo-100 shadow-md'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total Videos</p>
                  <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>{matchStats.total}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-800' : 'bg-blue-200'}`}>
                  <Video className={`h-6 w-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-green-900 to-emerald-900 shadow-lg'
              : 'bg-gradient-to-br from-green-50 to-emerald-100 shadow-md'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Analyzed</p>
                  <div className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                    {matchStats.byStatus.completed}
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-800' : 'bg-green-200'}`}>
                  <CheckCircle className={`h-6 w-6 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-yellow-900 to-amber-900 shadow-lg'
              : 'bg-gradient-to-br from-yellow-50 to-amber-100 shadow-md'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Processing</p>
                  <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-yellow-900'}`}>
                    {matchStats.byStatus.processing}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-yellow-800' : 'bg-yellow-200'}`}>
                  <Clock className={`h-6 w-6 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
                </div>
              </div>
            </div>
            <div className={`p-6 rounded-xl transform transition-all duration-300 hover:scale-105 ${isDarkMode
              ? 'bg-gradient-to-br from-purple-900 to-indigo-900 shadow-lg'
              : 'bg-gradient-to-br from-purple-50 to-indigo-100 shadow-md'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Failed</p>
                  <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                    {matchStats.byStatus.failed}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-800' : 'bg-purple-200'}`}>
                  <AlertTriangle className={`h-6 w-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className={`p-6 rounded-xl mb-6 shadow-md backdrop-blur-sm ${isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'}`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-full ${isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-gray-600'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-orange-500'
                      }`}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`rounded-full px-3 py-2.5 ${isDarkMode
                    ? 'bg-gray-700 text-white focus:ring-2 focus:ring-orange-500'
                    : 'bg-gray-50 text-gray-900 focus:ring-2 focus:ring-orange-500'
                    }`}
                >
                  <option value="all">All Mode</option>
                  <option value="team">Team</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Matches List */}
          <div className={`rounded-xl shadow-md overflow-hidden backdrop-blur-sm ${isDarkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-80'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                      <tr key={match.id} className={isDarkMode ? 'hover:bg-gray-700 transition-colors' : 'hover:bg-gray-50 transition-colors'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <Play className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{match.title}</div>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{match.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(match.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{match.analysis_mode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center ${getStatusColor(match.status)}`}>
                            {match.status === 'completed' && <CheckCircle className="w-4 h-4 mr-1" />}
                            {match.status === 'processing' && <Clock className="w-4 h-4 mr-1" />}
                            {match.status === 'failed' && <AlertTriangle className="w-4 h-4 mr-1" />}
                            {match.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {match.duration_seconds ? `${Math.round(match.duration_seconds)}s` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewMatch(match)}
                              className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700 text-indigo-400 hover:bg-gray-600' : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'}`}
                              title="View details"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteMatch(match.id, e)}
                              className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-gray-100 text-red-600 hover:bg-gray-200'}`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center">
                          <Video className={`h-8 w-8 mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className="text-sm">No videos found matching your search criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit Modal (Simplified) */}
      {showEditModal && editingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-lg w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-xl font-bold mb-4">{editingMatch.title}</h3>
            <p className="mb-4">Status: {editingMatch.status}</p>
            <button onClick={() => setShowEditModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchAnalysis;

const MatchStatCard = ({ label, value, icon, isDarkMode, color = "text-indigo-500", subtitle }) => (
  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100 shadow-sm'} transition-all hover:scale-[1.02]`}>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'} ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-xl font-black mb-0.5">{value}</div>
    <div className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
    {subtitle && <div className="text-[9px] opacity-60 italic mt-0.5">{subtitle}</div>}
  </div>
);

const ShootingBar = ({ label, value, total, color, isDarkMode }) => {
  const percentage = total > 0 ? (value / total * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{value}</span>
      </div>
      <div className={`h-1.5 w-full rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};