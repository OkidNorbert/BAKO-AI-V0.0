import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { playerAPI } from '../../services/api';
import { Video, Upload, PlayCircle, Calendar, RefreshCw, AlertCircle, Zap, CheckCircle, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const TrainingVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState({}); // jobId per video
  const [shootingArm, setShootingArm] = useState('right');
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  useEffect(() => { fetchVideos(); }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await playerAPI.getSchedule(); // reuse existing endpoint pattern
      // fallback: fetch from training-videos
      const res2 = await fetch('/api/player/training-videos', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await res2.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndAnalyse = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('shooting_arm', shootingArm);

      const res = await playerAPI.triggerAnalysis(formData);
      const { job_id } = res.data;

      // Navigate straight to the results / polling page
      navigate(`/player/analysis/${job_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyseExisting = async (video) => {
    // Re-analyse an existing stored video file
    try {
      setAnalysing(prev => ({ ...prev, [video.id]: true }));
      // Fetch the video as a blob and re-submit
      const blobRes = await fetch(video.url || `/uploads/${video.filename}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const blob = await blobRes.blob();
      const file = new File([blob], video.filename || 'video.mp4', { type: 'video/mp4' });
      const formData = new FormData();
      formData.append('video', file);
      formData.append('shooting_arm', shootingArm);

      const res = await playerAPI.triggerAnalysis(formData);
      navigate(`/player/analysis/${res.data.job_id}`);
    } catch {
      setError('Could not start analysis for this video.');
    } finally {
      setAnalysing(prev => ({ ...prev, [video.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[50vh] ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  const card = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-500`}>
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black tracking-tight mb-4">Training Videos</h1>
            <p className={`text-lg leading-relaxed ${sub}`}>
              Upload a personal training clip to analyse your shot form, 
              measure your release angles, and track your make/miss statistics.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full lg:w-auto">
            {/* Shooting Side Selector - Glassmorphic */}
            <div className="flex flex-col gap-2">
                <span className={`text-[10px] uppercase tracking-widest font-bold ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Shooting Side</span>
                <div className={`flex items-center p-1.5 rounded-2xl glass-dark shadow-glass`}>
                    <button 
                        onClick={() => setShootingArm('right')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${shootingArm === 'right' ? 'bg-orange-500 text-white shadow-premium' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Right Hand
                    </button>
                    <button 
                        onClick={() => setShootingArm('left')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${shootingArm === 'left' ? 'bg-orange-500 text-white shadow-premium' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Left Hand
                    </button>
                </div>
            </div>

            {/* PRIMARY ACTION: Upload + Analyse - Premium Glowing Button */}
            <label className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl cursor-pointer font-bold text-lg overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95 shadow-premium ${uploading ? 'opacity-70 pointer-events-none' : ''} bg-gradient-premium text-white`}>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              {uploading
                ? <><div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /><span>Uploading…</span></>
                : <><Zap className="h-5 w-5 fill-current" /><span>Upload & Analyse</span></>
              }
              <input ref={fileRef} type="file" accept="video/*" onChange={handleUploadAndAnalyse} className="hidden" />
            </label>
          </div>
        </div>

        {/* Search & Filters Placeholder */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
             <div className="relative w-full md:w-96 group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isDarkMode ? 'text-gray-600 group-focus-within:text-orange-500' : 'text-gray-400'}`}>
                    <Video className="h-5 w-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="Search videos..." 
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl border transition-all duration-300 outline-none ${isDarkMode ? 'bg-gray-800/50 border-gray-700 focus:border-orange-500/50 text-white' : 'bg-white border-gray-200 focus:border-orange-500'}`}
                />
             </div>
             <div className="flex items-center gap-3 w-full md:w-auto">
                 {['All', 'Last 7 Days', 'Shooting'].map((f) => (
                     <div key={f} className={`px-4 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer hover:border-orange-500/50 transition-all ${isDarkMode ? 'bg-gray-800/30 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'}`}>{f}</div>
                 ))}
             </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-10 p-5 glass rounded-2xl border-l-4 border-red-500 text-red-400 flex items-center animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-6 w-6 mr-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Past Analyses */}
        <PastAnalyses isDarkMode={isDarkMode} navigate={navigate} />

        {/* Stored Videos Grid */}
        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {videos.map((video) => {
              const status = video.job_status || 'analysed'; // mockup shows 'Analysed' or 'Processing'
              return (
                <div key={video.id || video._id} className={`group rounded-[2rem] overflow-hidden border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50 hover:bg-gray-800/40 hover:border-orange-500/20' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                  <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center relative overflow-hidden">
                    {video.thumbnailUrl
                      ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      : <PlayCircle className="h-20 w-20 text-gray-700 group-hover:text-orange-500 transition-colors" />
                    }
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/40 backdrop-blur-md rounded-xl p-2 px-3 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">0:45</span>
                        <PlayCircle className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg leading-tight truncate flex-1 mr-2">{video.title || video.filename || 'Untitled'}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border tracking-wider ${status === 'analysed' ? 'text-orange-500 border-orange-500/30' : 'text-gray-500 border-gray-700'}`}>
                            {status}
                        </span>
                    </div>
                    {video.created_at && (
                      <p className={`text-xs font-semibold mb-6 flex items-center ${sub}`}>
                        {new Date(video.created_at).toLocaleDateString('en-GB')}
                      </p>
                    )}
                    <button
                      onClick={() => handleAnalyseExisting(video)}
                      disabled={!!analysing[video.id]}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white'}`}
                    >
                      {analysing[video.id]
                        ? <><div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Analysing…</>
                        : <><Zap className="h-4 w-4 fill-current" /> Analyse</>
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {videos.length === 0 && (
          <div className={`mt-10 rounded-[3rem] border-2 border-dashed p-24 text-center transition-all duration-500 ${isDarkMode ? 'border-gray-800 bg-gray-900/40 hover:bg-gray-900/60' : 'border-gray-200 bg-white shadow-inner'}`}>
            <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 animate-pulse" />
                <Video className={`h-24 w-24 mx-auto relative ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`} />
            </div>
            <p className={`text-2xl font-bold mb-3 tracking-tight ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>No stored videos yet</p>
            <p className={`text-sm mb-10 max-w-sm mx-auto ${sub}`}>Capture your training session, upload it here, and let our AI provide expert feedback on your performance.</p>
            <button onClick={() => fileRef.current?.click()} className="px-8 py-3.5 bg-orange-500 rounded-2xl text-white font-bold hover:shadow-premium transition-all">Start First Session</button>
          </div>
        )}
      </div>
    </div>
  );
};

/** Shows past personal analysis history with delete support */
const PastAnalyses = ({ isDarkMode, navigate }) => {
  const [analyses, setAnalyses] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  const loadAnalyses = () => {
    playerAPI.listAnalyses()
      .then(r => setAnalyses(r.data || []))
      .catch(() => {});
  };

  useEffect(() => { loadAnalyses(); }, []);

  const handleDelete = async (jobId, e) => {
    e.stopPropagation();
    if (confirmDelete !== jobId) {
      setConfirmDelete(jobId);
      return;
    }
    setDeleting(prev => ({ ...prev, [jobId]: true }));
    setConfirmDelete(null);
    try {
      await playerAPI.deleteAnalysis(jobId);
      setAnalyses(prev => prev.filter(a => (a.job_id || a.id) !== jobId));
    } catch {
      // ignore
    } finally {
      setDeleting(prev => ({ ...prev, [jobId]: false }));
    }
  };

  if (!analyses.length) return null;

  const displayed = showAll ? analyses : analyses.slice(0, 3);

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black tracking-tighter">Recent Analytics</h2>
        {analyses.length > 3 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className={`flex items-center gap-1 text-sm font-bold hover:text-orange-500 transition-colors ${sub}`}
          >
            {showAll ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View All ({analyses.length})</>}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayed.map(a => {
          const res = a.results_json || a;
          const jobId = a.job_id || res.job_id;
          const status = res.status || 'completed';
          const isDeleting = deleting[jobId];
          const isConfirming = confirmDelete === jobId;
          return (
            <div
              key={a.id || jobId}
              className={`group relative w-full text-left p-6 rounded-[2.5rem] flex items-center gap-6 transition-all duration-500 border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50 hover:bg-gray-800/40 hover:border-orange-500/20' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40'}`}
            >
              {/* Status icon */}
              <button
                onClick={() => navigate(`/player/analysis/${jobId}`)}
                className="flex items-center gap-6 flex-1 min-w-0 text-left"
              >
                <div className={`p-4 rounded-3xl transition-transform duration-500 group-hover:scale-110 flex-shrink-0 ${status === 'completed' ? 'bg-green-500/10 text-green-500' : status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {status === 'completed' ? <CheckCircle className="h-8 w-8" /> : status === 'failed' ? <AlertCircle className="h-8 w-8" /> : <Clock className="h-8 w-8 animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">Session #{(jobId || '').slice(0, 8)}</p>
                  <p className={`text-xs font-bold uppercase tracking-widest ${sub}`}>{new Date(a.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                {status === 'completed' && (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-orange-500 font-black text-xl leading-none">{res.made_percentage}%</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${sub}`}>{res.shots_made}/{res.shots_total} made</span>
                  </div>
                )}
              </button>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(jobId, e)}
                disabled={isDeleting}
                className={`relative z-50 flex-shrink-0 p-2.5 rounded-xl transition-all ${isConfirming ? 'bg-red-500 text-white scale-110' : 'bg-white/5 text-gray-500 hover:bg-red-500/10 hover:text-red-500'} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                title={isConfirming ? 'Click again to confirm delete' : 'Delete this analysis'}
              >
                {isDeleting
                  ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Trash2 className="h-4 w-4" />
                }
              </button>
            </div>
          );
        })}
      </div>
      {/* Click-away to cancel confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-40" onClick={() => setConfirmDelete(null)} />
      )}
    </div>
  );
};

export default TrainingVideos;
