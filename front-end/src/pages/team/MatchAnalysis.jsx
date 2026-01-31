import React, { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
    Play,
    Pause,
    Square,
    Upload,
    ChevronRight,
    Layers,
    User,
    BarChart2,
    Activity,
    Maximize,
    Settings,
    Clock,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

const MatchAnalysis = () => {
    const { isDarkMode } = useTheme();
    const [isPlaying, setIsPlaying] = useState(false);
    const [showOverlays, setShowOverlays] = useState(true);
    const [processingStatus, setProcessingStatus] = useState('completed'); // 'processing', 'completed', 'failed'
    const videoRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400' : 'text-blue-600'
                            }`}>Match Analysis</h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Full match processing and player tracking
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button className={`flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors`}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Match
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Player Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}>
                            {/* Overlay simulation */}
                            {showOverlays && (
                                <div className="absolute inset-0 pointer-events-none z-10">
                                    <div className="absolute top-1/4 left-1/3 w-32 h-64 border-2 border-yellow-400 rounded-lg animate-pulse">
                                        <div className="absolute top-0 left-0 bg-yellow-400 text-black text-[10px] font-bold px-1 rounded-br">
                                            PLAYER #14 - LEBRON J.
                                        </div>
                                    </div>
                                    <div className="absolute top-1/3 right-1/4 w-32 h-64 border-2 border-blue-400 rounded-lg">
                                        <div className="absolute top-0 left-0 bg-blue-400 text-white text-[10px] font-bold px-1 rounded-br">
                                            PLAYER #30 - STEPH C.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                src="https://media.w3.org/2010/05/sintel/trailer.mp4" // Placeholder
                            />

                            {/* Custom Controls */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
                                <div className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer">
                                    <div
                                        className="h-full bg-blue-500 rounded-full relative"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                                            {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
                                        </button>
                                        <span className="text-white text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => setShowOverlays(!showOverlays)}
                                            className={`p-1.5 rounded-lg transition-colors ${showOverlays ? 'bg-blue-600 text-white' : 'text-white hover:bg-white/20'}`}
                                            title="Toggle Analytics Overlays"
                                        >
                                            <Layers size={20} />
                                        </button>
                                        <button className="text-white hover:text-blue-400 transition-colors">
                                            <Maximize size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Timeline / Events */}
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                                Match Timeline
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { time: '02:45', player: 'LeBron J.', action: '3pt Shot Made', type: 'success' },
                                    { time: '04:12', player: 'Steph C.', action: 'Fastbreak Assist', type: 'info' },
                                    { time: '07:30', player: 'Anthony D.', action: 'Blocked Shot', type: 'success' },
                                ].map((event, idx) => (
                                    <div key={idx} className={`flex items-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'} cursor-pointer transition-colors`}>
                                        <span className="text-blue-400 font-mono text-sm w-16">{event.time}</span>
                                        <div className="flex-1">
                                            <span className="font-bold mr-2">{event.player}</span>
                                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{event.action}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info Section */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-400">Processing Status</h3>
                            <div className="flex items-center space-x-3 mb-4">
                                {processingStatus === 'completed' ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : processingStatus === 'processing' ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                                ) : (
                                    <AlertCircle className="h-6 w-6 text-red-500" />
                                )}
                                <span className="font-bold capitalize">{processingStatus}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Match analysis, player detection, and statistics extraction completed successfully. All data is ready for viewing.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-400">Match Insights</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm">Active Players</span>
                                    </div>
                                    <span className="font-bold">12</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <BarChart2 className="h-4 w-4 text-purple-400" />
                                        <span className="text-sm">Total Posessions</span>
                                    </div>
                                    <span className="font-bold">48</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2">
                                        <Activity className="h-4 w-4 text-green-400" />
                                        <span className="text-sm">Adv. Data Points</span>
                                    </div>
                                    <span className="font-bold">1.2M</span>
                                </div>
                            </div>
                            <button className={`w-full mt-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                                }`}>
                                View Full Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchAnalysis;
