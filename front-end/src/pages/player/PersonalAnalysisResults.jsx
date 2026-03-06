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
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
            {/* Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900' : 'bg-gradient-to-r from-orange-500 to-red-500'} py-8 px-6 shadow-lg`}>
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <button onClick={() => navigate('/player/training')} className="flex items-center text-white opacity-80 hover:opacity-100 mb-4 text-sm">
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Training Videos
                            </button>
                            <h1 className="text-3xl font-bold text-white">Shot Analysis Results</h1>
                            <p className="text-white opacity-70 text-sm mt-1">Personal training session analysis</p>
                        </div>
                        {result?.shooting_arm && (
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex flex-col items-center">
                                <span className="text-[10px] uppercase tracking-wider text-white/60 font-bold">Shooting Side</span>
                                <span className="text-white font-bold capitalize">{result.shooting_arm} Hand</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-6">

                {/* Shot Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Shots', value: shots_total ?? 0, icon: <BarChart3 className="h-6 w-6 text-blue-400" /> },
                        { label: 'Shots Made', value: shots_made ?? 0, icon: <CheckCircle className="h-6 w-6 text-green-400" /> },
                        { label: 'Shots Missed', value: shots_missed ?? 0, icon: <Target className="h-6 w-6 text-red-400" /> },
                        { label: 'Made %', value: `${made_percentage ?? 0}%`, icon: <TrendingUp className="h-6 w-6 text-orange-400" /> },
                    ].map(stat => (
                        <div key={stat.label} className={`${card} rounded-xl p-5 shadow flex flex-col items-center text-center`}>
                            {stat.icon}
                            <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            <p className={`text-sm mt-1 ${sub}`}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Form Summary */}
                <div className={`${card} rounded-xl p-6 shadow`}>
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Award className="h-5 w-5 text-orange-400" /> Shooting Form Summary
                    </h2>
                    <div className="flex gap-6">
                        <div className={`flex-1 rounded-lg p-4 text-center ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                            <p className="text-3xl font-bold text-green-500">{goodShots}</p>
                            <p className={`text-sm mt-1 ${sub}`}>Good Form Shots</p>
                        </div>
                        <div className={`flex-1 rounded-lg p-4 text-center ${isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                            <p className="text-3xl font-bold text-red-500">{badShots}</p>
                            <p className={`text-sm mt-1 ${sub}`}>Needs Work</p>
                        </div>
                    </div>
                </div>

                {/* Per-Shot Reports */}
                {shot_reports && shot_reports.length > 0 && (
                    <div className={`${card} rounded-xl p-6 shadow`}>
                        <h2 className="text-lg font-bold mb-4">Per-Shot Feedback</h2>
                        <div className="space-y-4">
                            {shot_reports.map((shot) => (
                                <div
                                    key={shot.shot_number}
                                    className={`p-4 rounded-lg border-l-4 ${shot.verdict === 'GOOD FORM'
                                            ? isDarkMode ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-400'
                                            : isDarkMode ? 'bg-orange-900/20 border-orange-500' : 'bg-orange-50 border-orange-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {shot.verdict === 'GOOD FORM'
                                            ? <CheckCircle className="h-5 w-5 text-green-500" />
                                            : <AlertTriangle className="h-5 w-5 text-orange-500" />
                                        }
                                        <span className="font-semibold">Shot {shot.shot_number}: {shot.verdict}</span>
                                    </div>
                                    {shot.issues && shot.issues.length > 0 && (
                                        <ul className={`ml-7 space-y-1 text-sm ${sub}`}>
                                            {shot.issues.map((issue, i) => (
                                                <li key={i}>• {issue}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Annotated Video */}
                {annotated_video_url && (
                    <div className={`${card} rounded-xl p-6 shadow`}>
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Video className="h-5 w-5 text-indigo-400" /> Annotated Video
                        </h2>
                        <video
                            controls
                            className="w-full rounded-lg"
                            src={annotated_video_url}
                        >
                            Your browser does not support video playback.
                        </video>
                        <a
                            href={annotated_video_url}
                            download
                            className="mt-4 inline-block px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm"
                        >
                            Download Annotated Video
                        </a>
                    </div>
                )}

                {/* Back */}
                <div className="text-center pb-6">
                    <Link
                        to="/player/training"
                        className={`px-6 py-3 rounded-full font-semibold ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                        ← Analyse Another Video
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PersonalAnalysisResults;
