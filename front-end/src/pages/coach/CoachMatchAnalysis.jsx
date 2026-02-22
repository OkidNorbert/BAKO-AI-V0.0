import React, { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { videoAPI, analysisAPI } from '@/services/api';
import { showToast } from '@/components/shared/Toast';
import {
    Upload, Video as VideoIcon, Activity, CheckCircle,
    AlertTriangle, Play, Pause, X, Users, Loader2
} from 'lucide-react';

const JERSEY_PRESETS = [
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

    const [form, setForm] = useState({
        title: '',
        opponent: '',
        ourJersey: 'white jersey',
        opponentJersey: 'dark blue jersey',
        ourTeamId: '1',
        matchDate: new Date().toISOString().split('T')[0],
    });

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
                const r = (await analysisAPI.getLastResultByVideo(videoId)).data;
                setResults(r);
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
                max_players_on_court: 10,
            });

            poll(videoId);
        } catch (err) {
            setStage('error');
            showToast(err.response?.data?.detail || 'Upload failed', 'error');
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
                                <div className="mt-4 relative">
                                    <video ref={videoRef} src={videoPreview} className="w-full rounded-xl" controls />
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
                                        <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 text-gray-400 block">Which team should be highlighted?</label>
                                        <select className={inp} value={form.ourTeamId} onChange={e => set('ourTeamId', e.target.value)}>
                                            <option value="1">Team 1 (left side)</option>
                                            <option value="2">Team 2 (right side)</option>
                                        </select>
                                    </div>
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
                                <h2 className={`font-semibold mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>Analysis Results</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Players Detected', value: results.players_detected ?? '–' },
                                        { label: 'Shooting %', value: results.overall_shooting_percentage ? `${parseFloat(results.overall_shooting_percentage).toFixed(1)}%` : '–' },
                                        { label: 'Total Passes', value: results.total_passes ?? '–' },
                                        { label: 'Interceptions', value: results.total_interceptions ?? '–' },
                                    ].map(s => (
                                        <div key={s.label} className={`rounded-xl p-4 ${dark ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
                                            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                                            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={reset} className={`mt-5 w-full py-2.5 rounded-xl tex-sm font-medium transition border ${dark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}>
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
            </div>
        </div>
    );
};

export default CoachMatchAnalysis;
