import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { playerAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import {
    Target, TrendingUp, CheckCircle, AlertTriangle,
    RefreshCw, ChevronLeft, BarChart3, Award, Video, Clock
} from 'lucide-react';

const POLL_INTERVAL_MS = 4000;

const PersonalAnalysisResults = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
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

    const card = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

    if (loading || result?.status === 'processing') {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
                <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-orange-500 mb-6" />
                <p className="text-lg font-semibold">Analysing your video…</p>
                <p className={`text-sm mt-2 ${sub}`}>Ball detection · Pose estimation · Shot scoring</p>
                <p className={`text-xs mt-4 ${sub}`}>This can take a few minutes depending on video length.</p>
            </div>
        );
    }

    if (error || result?.status === 'failed') {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
                <AlertTriangle className="h-14 w-14 text-red-500 mb-4" />
                <p className="text-lg font-semibold">Analysis Failed</p>
                <p className={`text-sm mt-2 ${sub}`}>{result?.error || error}</p>
                <Link to="/player/training" className="mt-6 px-5 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600">
                    ← Back to Training
                </Link>
            </div>
        );
    }

    const { shots_total, shots_made, shots_missed, made_percentage, shot_reports, annotated_video_url } = result || {};
    const goodShots = (shot_reports || []).filter(s => s.verdict === 'GOOD FORM').length;
    const badShots = (shot_reports || []).filter(s => s.verdict !== 'GOOD FORM').length;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-900'} transition-all duration-500 pb-20`}>

      <div className="max-w-5xl mx-auto p-8 space-y-12">
        {/* Title & Shooting Hand Badge */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-5xl font-black tracking-tight mb-2">Analysis Results</h1>
                <p className={`text-lg ${sub}`}>Personal training session performance breakdown</p>
            </div>
            {result?.shooting_arm && (
                <div className={`flex flex-col items-center px-8 py-3 rounded-2xl border-2 ${isDarkMode ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'}`}>
                    <span className={`text-[10px] uppercase tracking-widest font-black mb-1 ${isDarkMode ? 'text-orange-500/60' : 'text-orange-400'}`}>Shooting Side</span>
                    <span className="text-xl font-black capitalize tracking-tight">{result.shooting_arm} Hand</span>
                </div>
            )}
        </div>

        {/* Shot Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Shots', value: shots_total ?? 0, gradient: 'from-blue-500 to-indigo-600', icon: <BarChart3 className="h-6 w-6" /> },
            { label: 'Shots Made', value: shots_made ?? 0, gradient: 'from-green-500 to-emerald-600', icon: <CheckCircle className="h-6 w-6" /> },
            { label: 'Shots Missed', value: shots_missed ?? 0, gradient: 'from-red-500 to-rose-600', icon: <Target className="h-6 w-6" /> },
            { label: 'Made %', value: `${made_percentage ?? 0}%`, gradient: 'from-orange-500 to-red-600', icon: <TrendingUp className="h-6 w-6" /> },
          ].map(stat => (
            <div key={stat.label} className={`group relative rounded-[2rem] p-7 overflow-hidden transition-all duration-500 hover:scale-105 border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50 hover:bg-gray-800/40' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl'}`}>
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 bg-gradient-to-br ${stat.gradient}`} />
                <div className={`inline-flex p-3 rounded-2xl mb-4 bg-gradient-to-br text-white shadow-lg ${stat.gradient}`}>
                    {stat.icon}
                </div>
                <p className={`text-4xl font-black tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                <p className={`text-[10px] uppercase tracking-widest font-black ${sub}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left: Summary & Video */}
            <div className="lg:col-span-2 space-y-10">
                {/* Form Summary */}
                <div className={`rounded-[2.5rem] p-8 border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100'}`}>
                    <h2 className="text-2xl font-black tracking-tight mb-8">Form Summary</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className={`rounded-3xl p-6 transition-all duration-300 ${isDarkMode ? 'bg-green-500/5 border border-green-500/20' : 'bg-green-50 border border-green-100'}`}>
                            <p className="text-4xl font-black text-green-500 mb-1">{goodShots}</p>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Good Form</p>
                        </div>
                        <div className={`rounded-3xl p-6 transition-all duration-300 ${isDarkMode ? 'bg-red-500/5 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                            <p className="text-4xl font-black text-red-500 mb-1">{badShots}</p>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Needs Work</p>
                        </div>
                    </div>
                </div>

                {/* Annotated Video */}
                {annotated_video_url && (
                    <div className={`rounded-[2.5rem] overflow-hidden border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                        <div className="p-8 flex justify-between items-center border-b border-inherit">
                            <h2 className="text-2xl font-black tracking-tight">AI Annotated Video</h2>
                            <a href={annotated_video_url} download className="text-xs font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">Download</a>
                        </div>
                        <div className="bg-black aspect-video relative">
                            <video controls className="w-full h-full" src={annotated_video_url}>
                                Your browser does not support playback.
                            </video>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Per-Shot Feedback */}
            <div className="lg:col-span-1">
                <div className={`rounded-[2.5rem] p-8 border h-full ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100'}`}>
                    <h2 className="text-2xl font-black tracking-tight mb-8">Shot Log</h2>
                    <div className="space-y-4">
                        {(shot_reports || []).map((shot) => (
                            <div key={shot.shot_number} className={`p-5 rounded-2xl border transition-all duration-300 ${shot.verdict === 'GOOD FORM' 
                                ? (isDarkMode ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-100')
                                : (isDarkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-100')}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-1.5 rounded-lg ${shot.verdict === 'GOOD FORM' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                                        {shot.verdict === 'GOOD FORM' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    </div>
                                    <span className="font-black text-sm tracking-tight">Shot {shot.shot_number}</span>
                                </div>
                                {shot.issues && shot.issues.length > 0 && (
                                    <ul className="space-y-1.5 opacity-70">
                                        {shot.issues.map((issue, i) => (
                                            <li key={i} className="text-[11px] font-bold leading-tight">• {issue}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Action Footer */}
        <div className="flex justify-center py-10">
            <Link to="/player/training" className={`group flex items-center gap-2 px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${isDarkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Analyse Another Session
            </Link>
        </div>
      </div>
    </div>
  );
};

export default PersonalAnalysisResults;
