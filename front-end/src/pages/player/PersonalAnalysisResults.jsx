import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { playerAPI } from '../../services/api';
import {
    Target, TrendingUp, CheckCircle, AlertTriangle,
    ChevronLeft, BarChart3, Award, Zap, Clock
} from 'lucide-react';

const POLL_INTERVAL_MS = 4000;

const PersonalAnalysisResults = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const pollerRef = useRef(null);

    const fetchResult = async () => {
        try {
            const res = await playerAPI.getAnalysisResult(jobId);
            const data = res.data;
            setResult(data);
            if (data?.status === 'completed' || data?.status === 'failed') {
                clearInterval(pollerRef.current);
                setLoading(false);
            }
        } catch (err) {
            setError('Failed to fetch analysis results.');
            clearInterval(pollerRef.current);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResult();
        pollerRef.current = setInterval(fetchResult, POLL_INTERVAL_MS);
        return () => clearInterval(pollerRef.current);
    }, [jobId]);

    if (loading || result?.status === 'processing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1115] text-white">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-orange-500 rounded-full blur-[30px] opacity-25 animate-pulse" />
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 relative z-10 shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-orange-500 animate-pulse">Analysing your video...</p>
                <p className="text-xs mt-3 text-gray-600 font-bold">Ball detection · Pose estimation · Shot scoring</p>
                <p className="text-xs mt-2 text-gray-700 font-bold">This can take a few minutes depending on video length.</p>
            </div>
        );
    }

    if (error || result?.status === 'failed') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1115] text-white">
                <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 mb-6">
                    <AlertTriangle className="h-14 w-14 text-red-500" />
                </div>
                <p className="text-2xl font-black mb-3">Analysis Failed</p>
                <p className="text-sm text-gray-500 font-bold mb-8">{result?.error || error}</p>
                <Link to="/player/training" className="px-8 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                    ← Back to Training
                </Link>
            </div>
        );
    }

    const { shots_total, shots_made, shots_missed, made_percentage, shot_reports, annotated_video_url, shooting_arm } = result || {};
    const goodShots = (shot_reports || []).filter(s => s.verdict === 'GOOD FORM').length;
    const badShots = (shot_reports || []).filter(s => s.verdict !== 'GOOD FORM').length;
    const pct = typeof made_percentage === 'number' ? made_percentage : parseFloat(made_percentage) || 0;

    return (
        <div className="min-h-screen bg-[#0f1115] text-white pb-24">
            <div className="max-w-6xl mx-auto px-6 py-12 space-y-14">

                {/* ── Header ─────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500 mb-3">Personal Training Session</p>
                        <h1 className="text-6xl font-black tracking-tighter leading-none">Analysis<br />Results</h1>
                    </div>
                    {shooting_arm && (
                        <div className="flex flex-col items-center px-8 py-4 rounded-[1.5rem] border border-orange-500/20 bg-orange-500/5">
                            <span className="text-[10px] uppercase tracking-widest font-black text-orange-500/50 mb-1">Shooting Side</span>
                            <span className="text-2xl font-black capitalize">{shooting_arm} Hand</span>
                        </div>
                    )}
                </div>

                {/* ── Hero Stats ─────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Big Percentage Card */}
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent p-10 flex flex-col justify-between group hover:border-orange-500/20 transition-all duration-500">
                        <div className="absolute -top-10 -right-10 h-48 w-48 bg-orange-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-50" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-4">Make Percentage</p>
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-[7rem] font-black leading-none tracking-tighter text-white">{pct.toFixed(0)}</span>
                                <span className="text-5xl font-black text-orange-500 mb-3">%</span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.6)]"
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs font-bold text-gray-600 mt-2 uppercase tracking-widest">
                                {pct >= 50 ? '🔥 Great shooting' : pct >= 30 ? '💪 Keep going' : '🏋️ Room to grow'}
                            </p>
                        </div>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-orange-500/10">
                                <TrendingUp className="h-5 w-5 text-orange-500" />
                            </div>
                            <span className="text-sm font-bold text-gray-400">Shot accuracy score</span>
                        </div>
                    </div>

                    {/* Shot counts stacked */}
                    <div className="flex flex-col gap-6">
                        {/* Total */}
                        <div className="flex-1 rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 flex items-center gap-6 group hover:border-white/10 hover:bg-white/5 transition-all duration-300">
                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500 flex-shrink-0">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Total Shots</p>
                                <p className="text-5xl font-black tracking-tighter">{shots_total ?? 0}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 flex-1">
                            {/* Made */}
                            <div className="rounded-[2rem] border border-green-500/10 bg-green-500/5 p-8 flex flex-col justify-between group hover:border-green-500/20 hover:bg-green-500/10 transition-all duration-300">
                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-green-500/10 text-green-500 mb-4">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60 mb-1">Made</p>
                                    <p className="text-5xl font-black tracking-tighter text-green-400">{shots_made ?? 0}</p>
                                </div>
                            </div>
                            {/* Missed */}
                            <div className="rounded-[2rem] border border-red-500/10 bg-red-500/5 p-8 flex flex-col justify-between group hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-300">
                                <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 mb-4">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 mb-1">Missed</p>
                                    <p className="text-5xl font-black tracking-tighter text-red-400">{shots_missed ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Form Summary + Video ────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">

                        {/* Form Summary */}
                        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-2xl bg-yellow-500/10 text-yellow-500">
                                    <Zap className="h-5 w-5 fill-current" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">Form Summary</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="rounded-3xl p-8 border border-green-500/15 bg-green-500/5 relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-green-500 rounded-full blur-3xl opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60 mb-3">Good Form</p>
                                    <p className="text-7xl font-black tracking-tighter text-green-400">{goodShots}</p>
                                    <div className="mt-3 h-1 w-full bg-green-500/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500/50 rounded-full" style={{ width: shots_total ? `${(goodShots / shots_total) * 100}%` : '0%' }} />
                                    </div>
                                </div>
                                <div className="rounded-3xl p-8 border border-orange-500/15 bg-orange-500/5 relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-orange-500 rounded-full blur-3xl opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500/60 mb-3">Needs Work</p>
                                    <p className="text-7xl font-black tracking-tighter text-orange-400">{badShots}</p>
                                    <div className="mt-3 h-1 w-full bg-orange-500/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500/50 rounded-full" style={{ width: shots_total ? `${(badShots / shots_total) * 100}%` : '0%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Annotated Video */}
                        {annotated_video_url && (
                            <div className="rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/[0.02]">
                                <div className="px-10 py-6 flex justify-between items-center border-b border-white/5">
                                    <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
                                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                        AI Annotated Video
                                    </h2>
                                    <a href={annotated_video_url} download className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors px-4 py-2 rounded-xl border border-orange-500/20 hover:bg-orange-500/5">
                                        Download
                                    </a>
                                </div>
                                <div className="bg-black aspect-video">
                                    <video
                                        key={annotated_video_url}
                                        controls
                                        className="w-full h-full"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:#9ca3af;">
                                                    <p style="font-size:13px;font-weight:700;">Unable to play video in browser.</p>
                                                    <a href="${annotated_video_url}" download style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#f97316;padding:8px 20px;border:1px solid rgba(249,115,22,0.3);border-radius:12px;">
                                                        Download to watch
                                                    </a>
                                                </div>`;
                                        }}
                                    >
                                        <source src={annotated_video_url} type="video/mp4" />
                                        Your browser does not support video playback.
                                    </video>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Shot Log ───────────────────────────────────── */}
                    <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 h-fit">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                                <Award className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Shot Log</h2>
                        </div>
                        <div className="space-y-4">
                            {(shot_reports || []).map((shot) => (
                                <div
                                    key={shot.shot_number}
                                    className={`p-5 rounded-2xl border transition-all duration-300 ${shot.verdict === 'GOOD FORM'
                                            ? 'bg-green-500/5 border-green-500/15 hover:border-green-500/30'
                                            : 'bg-orange-500/5 border-orange-500/15 hover:border-orange-500/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-7 w-7 rounded-xl flex items-center justify-center ${shot.verdict === 'GOOD FORM' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                                {shot.verdict === 'GOOD FORM'
                                                    ? <CheckCircle className="h-4 w-4" />
                                                    : <AlertTriangle className="h-4 w-4" />
                                                }
                                            </div>
                                            <span className="font-black text-sm tracking-tight">Shot {shot.shot_number}</span>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${shot.verdict === 'GOOD FORM' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-orange-500 border-orange-500/20 bg-orange-500/5'}`}>
                                            {shot.verdict === 'GOOD FORM' ? 'Made' : 'Work'}
                                        </span>
                                    </div>
                                    {shot.issues && shot.issues.length > 0 && (
                                        <ul className="space-y-1.5">
                                            {shot.issues.map((issue, i) => (
                                                <li key={i} className="text-[11px] font-bold text-gray-500 leading-tight flex items-start gap-2">
                                                    <span className="text-orange-500 mt-0.5">•</span>
                                                    {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {(!shot_reports || !shot_reports.length) && (
                                <div className="py-12 text-center">
                                    <Clock className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-gray-600">No shot data recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Footer CTA ─────────────────────────────────── */}
                <div className="flex justify-center pt-6">
                    <Link
                        to="/player/training"
                        className="group flex items-center gap-3 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Analyse Another Session
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PersonalAnalysisResults;
