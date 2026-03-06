import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { playerAPI } from '../../services/api';
import { Video, Upload, PlayCircle, Calendar, RefreshCw, AlertCircle, Zap, CheckCircle, Clock } from 'lucide-react';

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
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Video className="h-7 w-7 mr-2 text-orange-500" />
              Training Videos
            </h1>
            <p className={`text-sm mt-1 ${sub}`}>Upload a personal training clip to analyse your shot form & make/miss stats</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Handedness Selector */}
            <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <button 
                onClick={() => setShootingArm('right')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${shootingArm === 'right' ? 'bg-orange-500 text-white shadow' : sub}`}
              >
                Right Hand
              </button>
              <button 
                onClick={() => setShootingArm('left')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${shootingArm === 'left' ? 'bg-orange-500 text-white shadow' : sub}`}
              >
                Left Hand
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchVideos}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100 border border-gray-200'} transition-colors`}
              >
                <RefreshCw className="h-4 w-4" /><span>Refresh</span>
              </button>

              {/* PRIMARY ACTION: Upload + Analyse */}
              <label className={`flex items-center space-x-2 px-5 py-2.5 rounded-full cursor-pointer font-semibold shadow-md hover:shadow-lg transition-all ${uploading ? 'opacity-70 pointer-events-none' : ''} ${isDarkMode ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}>
                {uploading
                  ? <><div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /><span>Uploading…</span></>
                  : <><Zap className="h-4 w-4" /><span>Upload &amp; Analyse</span></>
                }
                <input ref={fileRef} type="file" accept="video/*" onChange={handleUploadAndAnalyse} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* How it works callout */}
        <div className={`mb-6 p-4 rounded-xl border ${isDarkMode ? 'border-orange-700/30 bg-orange-900/10' : 'border-orange-200 bg-orange-50'}`}>
          <p className="font-semibold text-orange-500 mb-1">🏀 How Personal Analysis Works</p>
          <ul className={`text-sm space-y-1 ${sub}`}>
            <li>1. Select your <strong>Shooting Hand</strong> (Right or Left).</li>
            <li>2. Click <strong>Upload &amp; Analyse</strong> and select your training video.</li>
            <li>3. The AI detects your elbow angles on the selected arm, ball release, and scores each shot.</li>
            <li>4. Results appear automatically — usually within 1-3 minutes per minute of video.</li>
          </ul>
        </div>

        {/* Past Analyses */}
        <PastAnalyses isDarkMode={isDarkMode} navigate={navigate} />

        {/* Stored Videos */}
        {videos.length > 0 && (
          <>
            <h2 className="text-lg font-bold mt-8 mb-4">Stored Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={video.id || video._id} className={`rounded-xl overflow-hidden shadow-lg ${card}`}>
                  <div className="aspect-video bg-gray-700 flex items-center justify-center relative">
                    {video.thumbnailUrl
                      ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      : <PlayCircle className="h-16 w-16 text-gray-500" />
                    }
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{video.title || video.filename || 'Untitled'}</h3>
                    {video.created_at && (
                      <p className={`text-sm mt-1 flex items-center ${sub}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={() => handleAnalyseExisting(video)}
                      disabled={!!analysing[video.id]}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-60"
                    >
                      {analysing[video.id]
                        ? <><div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing…</>
                        : <><Zap className="h-4 w-4" /> Analyse This Video</>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {videos.length === 0 && (
          <div className={`rounded-xl border-2 border-dashed p-12 text-center ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-white'}`}>
            <Video className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>No stored videos yet</p>
            <p className={`text-sm mb-6 ${sub}`}>Click "Upload &amp; Analyse" above to start your first session.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Shows past personal analysis history */
const PastAnalyses = ({ isDarkMode, navigate }) => {
  const [analyses, setAnalyses] = useState([]);
  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    playerAPI.listAnalyses()
      .then(r => setAnalyses(r.data || []))
      .catch(() => { });
  }, []);

  if (!analyses.length) return null;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Past Analyses</h2>
      <div className="space-y-3">
        {analyses.map(a => {
          const res = a.results_json || a;
          return (
            <button
              key={a.id || a.job_id}
              onClick={() => navigate(`/player/analysis/${a.job_id || res.job_id}`)}
              className={`w-full text-left p-4 rounded-xl flex items-center gap-4 shadow hover:shadow-md transition-shadow ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
            >
              {res.status === 'completed'
                ? <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                : res.status === 'failed'
                  ? <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                  : <Clock className="h-8 w-8 text-orange-400 flex-shrink-0 animate-pulse" />
              }
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">Analysis #{(a.job_id || '').slice(0, 8)}</p>
                <p className={`text-sm ${sub}`}>{new Date(a.created_at).toLocaleString()}</p>
              </div>
              {res.status === 'completed' && (
                <div className="flex gap-4 text-sm flex-shrink-0">
                  <span className="text-green-500 font-bold">{res.shots_made}/{res.shots_total} made</span>
                  <span className={sub}>{res.made_percentage}%</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingVideos;
