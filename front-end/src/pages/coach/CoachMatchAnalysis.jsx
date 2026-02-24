import React, { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { videoAPI, analysisAPI } from '@/services/api';
import { showToast } from '@/components/shared/Toast';
import VideoPlayer from '@/components/team/video-player';
import TacticalBoard from '@/components/team/tactical-board';
import {
    Upload, Video as VideoIcon, Activity, CheckCircle,
    AlertTriangle, Play, Pause, X, Users, Loader2, Clock,
    ArrowRight, ChevronRight
} from 'lucide-react';

const JERSEY_PRESETS = [
    { name: 'Grey', desc: 'grey jersey', hex: '#9CA3AF' },
    { name: 'White', desc: 'white jersey', hex: '#F5F5F5' },
    { name: 'Black', desc: 'black jersey', hex: '#1F2937' },
    { name: 'Red', desc: 'red jersey', hex: '#DC2626' },
    { name: 'Blue', desc: 'blue jersey', hex: '#2563EB' },
    { name: 'Dark Blue', desc: 'dark blue jersey', hex: '#1E40AF' },
    { name: 'Yellow', desc: 'yellow jersey', hex: '#FBBF24' },
    { name: 'Green', desc: 'green jersey', hex: '#10B981' },
    { name: 'Purple', desc: 'purple jersey', hex: '#A855F7' },
    { name: 'Orange', desc: 'orange jersey', hex: '#F97316' },
];

const ColorPicker = ({ value, onChange, label, accentClass }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">{label}</p>
        <div className="flex flex-wrap gap-2">
            {JERSEY_PRESETS.map(p => (
                <button
                    key={p.desc}
                    type="button"
                    onClick={() => onChange(p.desc)}
                    title={p.name}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${value === p.desc ? `${accentClass} scale-110 shadow-md` : 'border-transparent opacity-70 hover:opacity-100 hover:scale-110'
                        }`}
                    style={{ backgroundColor: p.hex, borderColor: value === p.desc ? undefined : 'transparent' }}
                />
            ))}
        </div>
        <p className="text-xs mt-1 text-gray-500">Selected: <span className="font-medium capitalize">{value}</span></p>
    </div>
);

const CoachMatchAnalysis = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [stage, setStage] = useState('idle'); // idle | uploading | processing | completed | error
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [results, setResults] = useState(null);
    const [liveTacticalData, setLiveTacticalData] = useState({ players: [], ball: null });

    const [form, setForm] = useState({
        title: '',
        opponent: '',
        ourJersey: 'white jersey',
        opponentJersey: 'dark blue jersey',
        ourTeamId: '1',
        maxPlayers: 10,
        clearCache: true,
        useCache: false,
        matchDate: new Date().toISOString().split('T')[0],
    });

    const [pastMatches, setPastMatches] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await videoAPI.list({ page_size: 10 });
            setPastMatches(res.data.videos || []);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validExt = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/x-matroska'];
        if (!validExt.includes(file.type) && !file.name.endsWith('.mkv')) {
            showToast('Please select a valid video file (MP4, AVI, MOV, WMV, FLV, MKV)', 'error'); return;
        }
        if (file.size > 500 * 1024 * 1024) {
            showToast('Max file size is 500 MB', 'error'); return;
        }
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
        if (!form.title) set('title', file.name.replace(/\.[^/.]+$/, ''));
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const poll = async (videoId) => {
        try {
            const res = await videoAPI.getStatus(videoId);
            const { status, progress_percent, current_step, error_message } = res.data;
            setProgress(progress_percent || 0);
            setCurrentStep(current_step || 'Processing…');
            if (status === 'completed') {
                setStage('completed'); setProgress(100);

                // Fetch both results and video metadata (to get annotated URL)
                const [rRes, vRes] = await Promise.all([
                    analysisAPI.getLastResultByVideo(videoId),
                    videoAPI.getById(videoId)
                ]);

                const r = rRes.data;
                const videoData = vRes.data;

                // Fetch detections for overlay
                try {
                    const detRes = await analysisAPI.getDetections(r.id);
                    if (detRes.data?.detections) {
                        r.detections = detRes.data.detections;
                    }
                } catch (detErr) {
                    console.warn('Failed to fetch detections:', detErr);
                }

                setResults(r);

                // Select best video source
                const url = (videoData.has_annotated && videoData.annotated_download_url)
                    ? videoData.annotated_download_url
                    : videoData.download_url;
                setVideoPreview(url);

                showToast('Analysis complete!', 'success');
            } else if (status === 'failed') {
                setStage('error');
                showToast(`Analysis failed: ${error_message}`, 'error');
            } else {
                setTimeout(() => poll(videoId), 2000);
            }
        } catch {
            setStage('error');
            showToast('Error checking status', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) { showToast('Please select a video', 'error'); return; }
        if (!form.title.trim()) { showToast('Please enter a match title', 'error'); return; }

        setStage('uploading'); setProgress(0); setCurrentStep('Uploading video…');

        try {
            const fd = new FormData();
            fd.append('file', videoFile);
            fd.append('title', form.title);
            fd.append('analysis_mode', 'team');
            if (user?.organizationId) fd.append('organization_id', user.organizationId);

            const { data } = await videoAPI.upload(fd);
            const videoId = data.id;

            setStage('processing'); setCurrentStep('Queuing analysis…');

            await analysisAPI.triggerTeamAnalysis(videoId, {
                our_team_jersey: form.ourJersey,
                opponent_jersey: form.opponentJersey,
                our_team_id: parseInt(form.ourTeamId, 10),
                max_players_on_court: parseInt(form.maxPlayers, 10),
                read_from_stub: form.useCache,
                clear_stubs_after: form.clearCache,
                enable_advanced_analytics: true,
            });

            poll(videoId);
        } catch (err) {
            setStage('error');
            showToast(err.response?.data?.detail || 'Upload failed', 'error');
        } finally {
            fetchHistory(); // Refresh history list
        }
    };

    const viewPastAnalysis = async (video) => {
        if (video.status !== 'completed') {
            showToast('This video is still processing', 'info');
            return;
        }
        setStage('processing');
        try {
            const { data } = await analysisAPI.getLastResultByVideo(video.id);

            // Fetch detections for overlay
            try {
                const detRes = await analysisAPI.getDetections(data.id);
                if (detRes.data?.detections) {
                    data.detections = detRes.data.detections;
                }
            } catch (detErr) {
                console.warn('Failed to fetch detections:', detErr);
            }

            setResults(data);
            setStage('completed');

            // Prefer annotated video source
            const url = (video.has_annotated && video.annotated_download_url)
                ? video.annotated_download_url
                : video.download_url;
            setVideoPreview(url);

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setStage('error');
            showToast('Failed to fetch analysis result', 'error');
        }
    };

    const reset = () => {
        setVideoFile(null); setVideoPreview(null); setStage('idle');
        setProgress(0); setResults(null); setCurrentStep('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const dark = isDarkMode;
    const base = `min-h-screen p-6 md:p-10 ${dark ? 'bg-gray-900' : 'bg-gray-50'}`;
    const card = `rounded-2xl border p-6 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
    const inp = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-orange-500/30 ${dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-orange-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-400'
        }`;

    return (
        <div className={base}>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                        Match Analysis
                    </h1>
                    <p className={`mt-1 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Upload a game video, choose team colours, and get AI-powered insights.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: upload + form */}
                    <div className="space-y-6">
                        {/* Video upload */}
                        <div className={card}>
                            <h2 className={`font-semibold mb-4 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                <VideoIcon size={18} /> Video File
                            </h2>
                            {!videoFile ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${dark ? 'border-gray-600 hover:border-orange-500/50 bg-gray-700/40' : 'border-gray-200 hover:border-orange-400 bg-gray-50'
                                        }`}
                                >
                                    <Upload className={`mx-auto mb-3 ${dark ? 'text-gray-400' : 'text-gray-400'}`} size={36} />
                                    <p className={`font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Click to upload video</p>
                                    <p className="text-xs mt-1 text-gray-400">MP4, AVI, MOV, WMV, MKV · max 500 MB</p>
                                    <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
                                </div>
                            ) : (
                                <div className={`flex items-center justify-between p-4 rounded-xl ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <VideoIcon size={24} className="text-orange-500" />
                                        <div>
                                            <p className={`text-sm font-medium truncate max-w-[200px] ${dark ? 'text-white' : 'text-gray-800'}`}>{videoFile.name}</p>
                                            <p className="text-xs text-gray-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                        </div>
                                    </div>
                                    <button onClick={reset} className={`p-1.5 rounded-lg ${dark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}>
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            {videoPreview && (
                                <div className="mt-4 space-y-4">
                                    <VideoPlayer
                                        videoSrc={`${videoPreview}${videoPreview.includes('?') ? '&' : '?'}token=${localStorage.getItem('accessToken')}`}
                                        analysisData={results}
                                        onTacticalUpdate={setLiveTacticalData}
                                    />

                                    {results?.detections && (
                                        <div className={`p-4 rounded-xl border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                                2D Tactical View
                                            </h3>
                                            <TacticalBoard
                                                players={liveTacticalData.players}
                                                ball={liveTacticalData.ball}
                                                isDarkMode={dark}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Match details */}
                        <form onSubmit={handleSubmit} className={card}>
                            <h2 className={`font-semibold mb-5 flex items-center gap-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                <Users size={18} /> Match Details & Jersey Colours
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 text-gray-400 block">Match Title *</label>
                                    <input className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. vs. Thunder – League Game" required />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 text-gray-400 block">Opponent</label>
                                    <input className={inp} value={form.opponent} onChange={e => set('opponent', e.target.value)} placeholder="Opponent team name" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 text-gray-400 block">Match Date *</label>
                                    <input type="date" className={inp} value={form.matchDate} onChange={e => set('matchDate', e.target.value)} required />
                                </div>

                                {/* Jersey colour pickers */}
                                <div className={`p-4 rounded-xl border space-y-5 ${dark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50'}`}>
                                    <ColorPicker label="Your Team Jersey" value={form.ourJersey} onChange={v => set('ourJersey', v)} accentClass="border-orange-500" />
                                    <ColorPicker label="Opponent Jersey" value={form.opponentJersey} onChange={v => set('opponentJersey', v)} accentClass="border-blue-500" />

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 text-gray-400 block">Which team is ours?</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: '1', label: 'Team 1 (our team)' },
                                                { id: '2', label: 'Team 2' },
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => set('ourTeamId', t.id)}
                                                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${form.ourTeamId === t.id
                                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                                        : `${dark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`
                                                        }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 text-gray-400 block">Max players on court</label>
                                        <input
                                            type="number"
                                            className={inp}
                                            value={form.maxPlayers}
                                            onChange={e => set('maxPlayers', e.target.value)}
                                            min="1"
                                            max="20"
                                        />
                                    </div>
                                </div>

                                {/* Analysis Options */}
                                <div className={`p-4 rounded-xl border space-y-4 ${dark ? 'border-gray-700 bg-gray-900/10' : 'border-gray-100 bg-blue-50/30'}`}>
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Analysis Options</h3>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:bg-orange-500 checked:border-orange-500 transition-all"
                                                checked={form.clearCache}
                                                onChange={e => set('clearCache', e.target.checked)}
                                            />
                                            <CheckCircle className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Clear cached data before analysis</p>
                                            <p className="text-[10px] text-gray-500 italic">Ensures fresh detection results</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer group border-t pt-3 border-gray-200/50 dark:border-gray-700/50">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:bg-blue-500 checked:border-blue-500 transition-all"
                                                checked={form.useCache}
                                                onChange={e => set('useCache', e.target.checked)}
                                            />
                                            <CheckCircle className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none" />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Use cached detections</p>
                                            <p className="text-[10px] text-gray-500 italic">Faster analysis (skips tracking if possible)</p>
                                        </div>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={stage !== 'idle' || !videoFile}
                                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {stage === 'idle'
                                        ? <><Upload size={16} /> Upload &amp; Analyse</>
                                        : <><Loader2 size={16} className="animate-spin" /> {stage === 'uploading' ? 'Uploading…' : 'Processing…'}</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: progress + results */}
                    <div className="space-y-6">
                        {stage !== 'idle' && (
                            <div className={card}>
                                <div className="flex items-center gap-3 mb-4">
                                    {stage === 'completed' && <CheckCircle size={22} className="text-green-500" />}
                                    {stage === 'error' && <AlertTriangle size={22} className="text-red-500" />}
                                    {(stage === 'uploading' || stage === 'processing') && <Loader2 size={22} className="animate-spin text-orange-500" />}
                                    <h2 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{currentStep || 'Processing…'}</h2>
                                </div>
                                {(stage === 'uploading' || stage === 'processing') && (
                                    <div>
                                        <div className="flex justify-between text-xs mb-1 text-gray-400">
                                            <span>Progress</span><span>{progress}%</span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {results && (
                            <div className={card}>
                                <h2 className={`font-semibold mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>📊 Complete Analysis Results</h2>

                                {/* Team Info with Colors */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className={`p-4 rounded-xl border-2 ${dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Our Team</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full" style={{
                                                backgroundColor: JERSEY_PRESETS.find(p => p.desc === form.ourJersey)?.hex || '#F5F5F5'
                                            }} />
                                            <div>
                                                <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                                                    {JERSEY_PRESETS.find(p => p.desc === form.ourJersey)?.name || 'Team'}
                                                </p>
                                                <p className="text-xs text-gray-400">Jersey</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 ${dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Opponent</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full" style={{
                                                backgroundColor: JERSEY_PRESETS.find(p => p.desc === form.opponentJersey)?.hex || '#1F2937'
                                            }} />
                                            <div>
                                                <p className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                                                    {JERSEY_PRESETS.find(p => p.desc === form.opponentJersey)?.name || 'Opponent'}
                                                </p>
                                                <p className="text-xs text-gray-400">Jersey</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Stats Grid */}
                                <div className="space-y-6">
                                    {/* Detection & Players */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-400">Match Dynamics</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Players Detected</p>
                                                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                                    {results.players_detected ?? '–'}
                                                </p>
                                            </div>
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Total Frames</p>
                                                <p className="text-3xl font-bold">{results.total_frames ?? '–'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Possession */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-400">Ball Possession %</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className={`rounded-lg p-4 border-l-4 ${dark ? 'bg-gray-700/40 border-blue-500' : 'bg-blue-50 border-blue-400'}`}>
                                                <p className="text-xs text-gray-400 mb-2">Team 1</p>
                                                <p className="text-2xl font-bold text-blue-500">
                                                    {results.team_1_possession_percent !== null ? `${parseFloat(results.team_1_possession_percent).toFixed(1)}%` : '–'}
                                                </p>
                                            </div>
                                            <div className={`rounded-lg p-4 border-l-4 ${dark ? 'bg-gray-700/40 border-purple-500' : 'bg-purple-50 border-purple-400'}`}>
                                                <p className="text-xs text-gray-400 mb-2">Team 2</p>
                                                <p className="text-2xl font-bold text-purple-500">
                                                    {results.team_2_possession_percent !== null ? `${parseFloat(results.team_2_possession_percent).toFixed(1)}%` : '–'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Offensive Stats */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-400">Offensive Analysis</h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Total Passes</p>
                                                <p className="text-2xl font-bold text-green-500">{results.total_passes ?? '–'}</p>
                                            </div>
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Shots Attempted</p>
                                                <p className="text-2xl font-bold text-orange-500">{results.shot_attempts ?? '–'}</p>
                                            </div>
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Shooting %</p>
                                                <p className="text-2xl font-bold text-red-500">
                                                    {results.overall_shooting_percentage ? `${parseFloat(results.overall_shooting_percentage).toFixed(1)}%` : '–'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Defensive Stats */}
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-400">Defensive Analysis</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-red-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Interceptions</p>
                                                <p className="text-2xl font-bold text-red-500">{results.total_interceptions ?? '–'}</p>
                                            </div>
                                            <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-indigo-50'}`}>
                                                <p className="text-xs text-gray-400 mb-1">Defensive Actions</p>
                                                <p className="text-2xl font-bold text-indigo-500">{results.defensive_actions ?? '–'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Movement & Load */}
                                    {(results.total_distance_meters || results.avg_speed_kmh || results.max_speed_kmh) && (
                                        <div>
                                            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-gray-400">Movement & Load</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-emerald-50'}`}>
                                                    <p className="text-xs text-gray-400 mb-1">Total Distance (m)</p>
                                                    <p className="text-2xl font-bold text-emerald-500">
                                                        {results.total_distance_meters ? `${parseFloat(results.total_distance_meters).toFixed(0)}` : '–'}
                                                    </p>
                                                </div>
                                                <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-sky-50'}`}>
                                                    <p className="text-xs text-gray-400 mb-1">Avg Speed (km/h)</p>
                                                    <p className="text-2xl font-bold text-sky-500">
                                                        {results.avg_speed_kmh ? `${parseFloat(results.avg_speed_kmh).toFixed(1)}` : '–'}
                                                    </p>
                                                </div>
                                                <div className={`rounded-lg p-4 ${dark ? 'bg-gray-700/50' : 'bg-fuchsia-50'}`}>
                                                    <p className="text-xs text-gray-400 mb-1">Max Speed (km/h)</p>
                                                    <p className="text-2xl font-bold text-fuchsia-500">
                                                        {results.max_speed_kmh ? `${parseFloat(results.max_speed_kmh).toFixed(1)}` : '–'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Duration */}
                                    <div className={`border-t ${dark ? 'border-gray-600' : 'border-gray-200'} pt-4`}>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-400">Analysis Duration</p>
                                            <p className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                                                {results.duration_seconds ? `${parseFloat(results.duration_seconds).toFixed(1)}s` : '–'}
                                            </p>
                                        </div>
                                        {results.processing_time_seconds && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Processing took {parseFloat(results.processing_time_seconds).toFixed(1)}s
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={reset}
                                    className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium transition border ${dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Analyse Another Match
                                </button>
                            </div>
                        )}

                        {stage === 'idle' && !results && (
                            <div className={`rounded-2xl border p-8 text-center ${dark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-100'}`}>
                                <Activity size={40} className="mx-auto mb-4 text-gray-300" />
                                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Upload a match video to see AI-powered insights here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Match History Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-orange-500" />
                        <h2 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Recent Analyses</h2>
                    </div>

                    {historyLoading && pastMatches.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-orange-500" size={32} />
                        </div>
                    ) : pastMatches.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pastMatches.map((m) => (
                                <div
                                    key={m.id}
                                    className={`${card} hover:border-orange-500/30 transition-all cursor-pointer group`}
                                    onClick={() => viewPastAnalysis(m)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2 rounded-lg ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <VideoIcon size={18} className="text-orange-500" />
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${m.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                            m.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                'bg-orange-500/10 text-orange-500'
                                            }`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <h3 className={`font-bold text-sm mb-1 truncate ${dark ? 'text-white' : 'text-gray-900'}`}>{m.title}</h3>
                                    <p className="text-xs text-gray-400 mb-4">{new Date(m.created_at).toLocaleDateString()}</p>

                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-[11px] font-medium text-gray-500">View Insights</span>
                                        <ChevronRight size={14} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${card} text-center py-12`}>
                            <p className="text-sm text-gray-400">No past analyses found. Start by uploading a match video above.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachMatchAnalysis;
