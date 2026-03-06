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

        // Extract jersey colours saved in the summary_stats event
        if (analysisData?.events) {
          const summary = analysisData.events.find(e => e.event_type === 'summary_stats');
          if (summary?.details) {
            analysisData.team_1_jersey = summary.details.team_1_jersey || '';
            analysisData.team_2_jersey = summary.details.team_2_jersey || '';
          }
        }

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
      <div className="flex items-center justify-center min-h-screen bg-[#0f1115]">
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500 rounded-full blur-[20px] opacity-20 animate-pulse"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 relative z-10 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
          </div>
          <p className="mt-8 text-sm font-black uppercase tracking-widest text-orange-500 animate-pulse">Loading Videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Video Player View */}
      {showVideoPlayer && selectedMatch && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <button
                onClick={handleBackToList}
                className="flex items-center space-x-2 mb-6 text-gray-500 hover:text-white transition-colors font-bold text-sm"
              >
                <ArrowLeft size={16} />
                <span>Back to Matches</span>
              </button>
              <h1 className="text-6xl font-black tracking-tighter mb-2 text-white">{selectedMatch.title}</h1>
              <div className="flex items-center gap-3 text-sm font-bold text-gray-400">
                <span className="px-3 py-1 bg-white/5 rounded-xl border border-white/10 uppercase tracking-widest text-[10px]">{selectedMatch.analysis_mode}</span>
                <span>{new Date(selectedMatch.created_at).toLocaleDateString()}</span>
                <span>&bull;</span>
                <span>{selectedMatch.duration_seconds ? `${Math.round(selectedMatch.duration_seconds)}s` : 'Unknown length'}</span>
              </div>
            </div>

            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                onClick={() => {
                  const url = (selectedMatch.has_annotated && selectedMatch.annotated_download_url)
                    ? selectedMatch.annotated_download_url
                    : selectedMatch.download_url;
                  if (!url) return;
                  window.open(`${url}${url.includes('?') ? '&' : '?'}token=${localStorage.getItem('accessToken')}`);
                }}
                className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all shadow-sm"
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
              <button className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm bg-blue-500 hover:bg-blue-600 border border-blue-400/20 text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Share size={16} className="mr-2" />
                Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Video & Tactical Column */}
            <div className="xl:col-span-2 space-y-8">
              <div className="rounded-[2rem] overflow-hidden glass-dark border border-white/5 shadow-xl relative group">
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
              </div>

              {/* Tactical View Section */}
              <div className="p-8 rounded-[2rem] glass-dark border border-white/5">
                <h3 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
                  <Layout className="mr-3 text-orange-500" size={24} />
                  Live Tactical Board
                </h3>
                <div className="bg-black/30 rounded-2xl overflow-hidden border border-white/5">
                  <TacticalBoard
                    players={liveTacticalData.players}
                    ball={liveTacticalData.ball}
                    team1Jersey={selectedMatch.analysisData?.team_1_jersey || ''}
                    team2Jersey={selectedMatch.analysisData?.team_2_jersey || ''}
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
                    isDarkMode={true}
                  />
                </div>
              </div>
            </div>

            {/* Analysis Sidebar */}
            <div className="space-y-8">
              {/* Match Stats */}
              <div className="p-8 rounded-[2rem] glass-dark border border-white/5">
                <h3 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
                  <BarChart className="mr-3 text-blue-500" size={24} />
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
                    <div className="space-y-6">
                      {/* Possession Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                          <span className="text-orange-500">Home {data.team_1_possession_percent}%</span>
                          <span className="text-blue-500">{data.team_2_possession_percent}% Away</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full flex overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000"
                            style={{ width: `${data.team_1_possession_percent}%` }}
                          />
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
                            style={{ width: `${data.team_2_possession_percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <MatchStatCard
                          label="Passes (H/A)"
                          value={`${data.team_1_passes || 0} - ${data.team_2_passes || 0}`}
                          icon={<Share size={18} />}
                          color="text-orange-500"
                          bgIcon="bg-orange-500/10"
                        />
                        <MatchStatCard
                          label="Intercepts"
                          value={`${data.team_1_interceptions || 0} - ${data.team_2_interceptions || 0}`}
                          icon={<Target size={18} />}
                          color="text-emerald-500"
                          bgIcon="bg-emerald-500/10"
                        />
                        <MatchStatCard
                          label="Distance"
                          value={`${data.total_distance_meters || 0}m`}
                          icon={<Activity size={18} />}
                          color="text-blue-500"
                          bgIcon="bg-blue-500/10"
                        />
                        <MatchStatCard
                          label="Players"
                          value={data.players_detected}
                          icon={<Users size={18} />}
                          color="text-purple-500"
                          bgIcon="bg-purple-500/10"
                        />
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shooting Accuracy</h4>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest ${percentage > 45 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                            {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}% ACC
                          </span>
                        </div>

                        <div className="space-y-4">
                          <ShootingBar label="Attempts" value={totalCount} total={totalCount} color="bg-white/20" />
                          <ShootingBar label="Made" value={madeCount} total={totalCount} color="bg-green-500" />
                          <ShootingBar label="Missed" value={missedCount} total={totalCount} color="bg-red-500" />
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <Activity className="h-8 w-8 text-gray-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm font-bold text-gray-500">Analysis metrics syncing...</p>
                  </div>
                )}
              </div>

              {/* Highlights / Coaching Clips */}
              <div className="p-8 rounded-[2rem] glass-dark border border-white/5">
                <h3 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
                  <Zap className="mr-3 text-yellow-500" size={24} />
                  Highlights
                </h3>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar">
                  {isFetchingClips ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                  ) : clips.length > 0 ? (
                    clips.map((clip, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${activeClip === clip
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        onClick={() => {
                          setActiveClip(clip);
                          setSeekTime(clip.timestamp_start);
                          setTimeout(() => setSeekTime(null), 100);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest py-1 px-2 rounded-lg border ${clip.clip_type === 'poor_spacing' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            clip.clip_type === 'late_rotation' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              clip.clip_type === 'low_decision_quality' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                            {clip.clip_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold font-mono py-1">
                            {new Date((clip.timestamp_start || 0) * 1000).toISOString().substr(14, 5)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-300 line-clamp-2 mt-1">
                          {clip.description}
                        </p>

                        {activeClip === clip && (
                          <div className="mt-4 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const clipUrl = `/clips/${selectedMatch.id}/${clip.file_path.split('/').pop()}`;
                                window.open(clipUrl, '_blank');
                              }}
                              className="text-[10px] font-black uppercase tracking-widest flex items-center bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                            >
                              <Play size={12} className="mr-2" /> Play Clip
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
                      <Zap className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-500">
                        {selectedMatch.analysisData?.advanced_analytics ? "No anomalies detected." : "Process video to extract highlights."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Events */}
              <div className="p-8 rounded-[2rem] glass-dark border border-white/5">
                <h3 className="text-2xl font-black mb-6 flex items-center text-white tracking-tight">
                  <Activity className="mr-3 text-purple-500" size={24} />
                  Key Events
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                  {selectedMatch.analysisData && selectedMatch.analysisData.events && selectedMatch.analysisData.events.length > 0 ? (
                    selectedMatch.analysisData.events.filter(e => e.event_type !== 'summary_stats').map((event, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          const time = event.timestamp_seconds || (event.frame ? event.frame / 30 : 0);
                          setSeekTime(time);
                          setTimeout(() => setSeekTime(null), 100);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl cursor-pointer bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-bold group"
                      >
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-[10px] font-mono font-black text-gray-500 bg-gray-900 rounded-lg px-2 py-1">
                            {event.timestamp ? new Date(event.timestamp * 1000).toISOString().substr(14, 5) : (event.frame ? (event.frame / 30).toFixed(2) : '-')}
                          </span>
                          <span className="text-gray-300 group-hover:text-white transition-colors">
                            {event.event_type === 'shot'
                              ? `${event.details?.outcome === 'made' ? '🏀 Made' : event.details?.outcome === 'missed' ? '❌ Missed' : '❓ Unknown'} ${event.details?.type && event.details?.type !== 'unknown' ? event.details.type : ''} Shot`.replace('  ', ' ')
                              : (event.event_type || event.type || 'unknown').charAt(0).toUpperCase() + (event.event_type || event.type || 'unknown').slice(1)}
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 mt-1">
                          {event.details?.player ? `P${event.details.player}` : (event.player_id && event.player_id !== -1 ? `P${event.player_id}` : 'TEAM')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm font-bold text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                      Timeline empty.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {!showVideoPlayer && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Video Hub</h1>
              <p className="text-xl text-gray-500">
                Upload and manage game footage for <span className="text-orange-500 font-black">AI analysis</span>.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button
                onClick={handleAddMatchClick}
                className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm bg-orange-500 hover:bg-orange-600 border border-orange-500/20 text-white transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                <Video className="mr-2 h-5 w-5" />
                Upload Match
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="p-8 rounded-[2rem] glass-dark border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Total Videos</p>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-500">
                  <Video className="h-5 w-5" />
                </div>
              </div>
              <p className="text-5xl font-black text-white">{matchStats.total}</p>
            </div>
            
            <div className="p-8 rounded-[2rem] glass-dark border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Analyzed</p>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-green-500/20 text-green-500">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-5xl font-black text-white">{matchStats.byStatus.completed}</p>
            </div>
            
            <div className="p-8 rounded-[2rem] glass-dark border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Processing</p>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-yellow-500/20 text-yellow-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="text-5xl font-black text-white">{matchStats.byStatus.processing}</p>
            </div>
            
            <div className="p-8 rounded-[2rem] glass-dark border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Failed</p>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/20 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className="text-5xl font-black text-white">{matchStats.byStatus.failed}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-6 rounded-3xl glass-dark border border-white/5 flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-bold"
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 w-full md:w-auto">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent border-none text-white font-bold focus:outline-none focus:ring-0 appearance-none pr-8 cursor-pointer w-full py-2"
              >
                <option value="all" className="bg-gray-900">All Analytics</option>
                <option value="team" className="bg-gray-900">Team Focused</option>
                <option value="personal" className="bg-gray-900">Player Isolated</option>
              </select>
            </div>
          </div>

          {/* Matches List */}
          <div className="rounded-[3rem] overflow-hidden glass-dark border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 w-2/5">Video Details</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Date Logged</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Mode</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                      <tr key={match.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center">
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 relative overflow-hidden group-hover:border-orange-500/30 transition-colors">
                              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <Play className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors z-10" />
                            </div>
                            <div className="ml-5">
                              <div className="font-black text-white text-lg">{match.title}</div>
                              <div className="text-xs font-bold text-gray-500 flex items-center mt-1">
                                {match.duration_seconds ? <span className="mr-2"><Clock className="inline mr-1" size={12} /> {Math.round(match.duration_seconds)}s</span> : null}
                                <span className="truncate max-w-[150px] md:max-w-xs">{match.description || 'No description provided'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-300">
                          {new Date(match.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400">
                            {match.analysis_mode}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 bg-white/5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                            match.status === 'completed' ? 'text-green-500 border-green-500/20' :
                            match.status === 'processing' ? 'text-yellow-500 border-yellow-500/20' :
                            match.status === 'failed' ? 'text-red-500 border-red-500/20' : 'text-gray-500 border-white/10'
                          }`}>
                            {match.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {match.status === 'processing' && <Clock className="w-3 h-3 mr-1 animate-pulse" />}
                            {match.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {match.status}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleViewMatch(match)}
                              className="p-3 rounded-xl transition-colors bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-transparent hover:border-white/10 group/btn shadow-sm"
                              title="View details"
                            >
                              <Target className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteMatch(match.id, e)}
                              className="p-3 rounded-xl transition-colors bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 border border-transparent hover:border-red-500/20 shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Video className="h-10 w-10 text-gray-500" />
                          </div>
                          <p className="text-xl font-black text-white mb-2">No videos found</p>
                          <p className="text-sm font-bold text-gray-500">Upload your first match or adjust search filters.</p>
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

      {/* Edit Modal (Keeping structure exactly same) */}
      {showEditModal && editingMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="rounded-[3rem] p-8 max-w-lg w-full glass-dark border border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-8 right-8 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <Trash2 size={20} className="opacity-0" />
              <div className="absolute inset-0 flex items-center justify-center">X</div>
            </button>
            <h3 className="text-2xl font-black mb-2 text-white">{editingMatch.title}</h3>
            <p className="mb-8 text-sm font-bold text-gray-500">Status: <span className="uppercase tracking-widest">{editingMatch.status}</span></p>
            <button onClick={() => setShowEditModal(false)} className="w-full bg-white/10 hover:bg-white/20 text-white font-black px-6 py-4 rounded-2xl transition-all">Close Modal</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchAnalysis;

const MatchStatCard = ({ label, value, icon, isDarkMode, color = "text-indigo-500", bgIcon }) => (
  <div className="p-4 rounded-2xl glass-dark border border-white/5 transition-all hover:border-white/20 hover:bg-white/5">
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-xl bg-white/5 ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-black text-white leading-none mb-1">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</div>
  </div>
);

const ShootingBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-gray-500">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

