import React, { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
    Play,
    Pause,
    Upload,
    ChevronRight,
    Activity as PoseIcon,
    Zap,
    BarChart2,
    Clock,
    CheckCircle2,
    Trophy,
    Dribbble
} from 'lucide-react';

const TrainingAnalysis = () => {
    const { isDarkMode } = useTheme();
    const [isPlaying, setIsPlaying] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [processingStatus, setProcessingStatus] = useState('completed');
    const videoRef = useRef(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400' : 'text-orange-600'
                            }`}>Personal Training</h1>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            AI Pose analysis and skill feedback
                        </p>
                    </div>
                    <button className="flex items-center px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Training
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player */}
                        <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-black' : 'bg-gray-200'}`}>
                            {showSkeleton && (
                                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                                    {/* Simulated Skeleton Overlay */}
                                    <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
                                        <line x1="50" y1="20" x2="50" y2="50" stroke="#FFD700" strokeWidth="1" />
                                        <line x1="50" y1="50" x2="40" y2="80" stroke="#FFD700" strokeWidth="1" />
                                        <line x1="50" y1="50" x2="60" y2="80" stroke="#FFD700" strokeWidth="1" />
                                        <line x1="50" y1="30" x2="35" y2="40" stroke="#FFD700" strokeWidth="1" />
                                        <line x1="50" y1="30" x2="65" y2="45" stroke="#FFD700" strokeWidth="1" />
                                        <circle cx="50" cy="20" r="2" fill="#FFD700" />
                                    </svg>
                                    <div className="absolute top-10 right-10 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                                        <div className="flex items-center text-xs text-yellow-400 font-bold mb-1">
                                            <Zap size={14} className="mr-1" /> SHOOTING FORM
                                        </div>
                                        <div className="text-xl font-bold">84% <span className="text-[10px] text-gray-400 uppercase">Accuracy</span></div>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover"
                                src="https://media.w3.org/2010/05/sintel/trailer.mp4"
                            />

                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center z-20">
                                <button onClick={togglePlay} className="text-white">
                                    {isPlaying ? <Pause size={24} /> : <Play size={24} fill="white" />}
                                </button>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setShowSkeleton(!showSkeleton)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${showSkeleton ? 'bg-yellow-500 text-black' : 'bg-white/20 text-white'
                                            }`}
                                    >
                                        AI SKELETON
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Skill Feedback */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4 border-green-500`}>
                                <h4 className="font-bold mb-2 flex items-center">
                                    <CheckCircle2 size={16} className="text-green-500 mr-2" /> What went well
                                </h4>
                                <ul className={`text-sm space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <li>• Excellent elbow alignment (92°)</li>
                                    <li>• Consistent landing base width</li>
                                    <li>• High release point maintained</li>
                                </ul>
                            </div>
                            <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4 border-orange-500`}>
                                <h4 className="font-bold mb-2 flex items-center">
                                    <PoseIcon size={16} className="text-orange-500 mr-2" /> To improve
                                </h4>
                                <ul className={`text-sm space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <li>• Slight forward lean on jump</li>
                                    <li>• Speed up follow-through extension</li>
                                    <li>• Engage core more during lift</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-indigo-900 to-purple-900' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} text-white shadow-xl`}>
                            <Trophy className="h-10 w-10 mb-4 text-yellow-300" />
                            <h3 className="text-xl font-bold mb-1">Daily Milestones</h3>
                            <p className="text-indigo-100 text-sm mb-4">You've completed 3 out of 5 shooting drills today!</p>
                            <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                                <div className="bg-yellow-300 h-full rounded-full" style={{ width: '60%' }}></div>
                            </div>
                            <span className="text-xs font-medium">60% of daily goal</span>
                        </div>

                        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Latest Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Dribbble size={16} className="text-orange-400" />
                                        <span>Free Throws</span>
                                    </div>
                                    <span className="font-bold">85%</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Zap size={16} className="text-yellow-400" />
                                        <span>Avg Velocity</span>
                                    </div>
                                    <span className="font-bold">12.4 m/s</span>
                                </div>
                                <div className="flex justify-between pb-2">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <BarChart2 size={16} className="text-blue-400" />
                                        <span>Persistence</span>
                                    </div>
                                    <span className="font-bold">High</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingAnalysis;
