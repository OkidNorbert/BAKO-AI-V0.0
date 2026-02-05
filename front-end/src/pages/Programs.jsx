import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, Video, Activity, Trophy, ChevronRight, PlayCircle } from 'lucide-react';

const Programs = () => {
    const { isDarkMode } = useTheme();

    const programs = [
        {
            title: "Fundamentals Mastery",
            icon: <BookOpen className="w-8 h-8 text-white" />,
            desc: "Master the basics: Dribbling mechanics, shooting form, and defensive stance.",
            level: "Rookie",
            color: "from-blue-500 to-blue-600",
            image: "https://images.unsplash.com/photo-1519861531473-920026393112?q=80&w=2076"
        },
        {
            title: "Sharp Shooter AI",
            icon: <Video className="w-8 h-8 text-white" />,
            desc: "Computer vision analysis of your shot arc, release time, and elbow alignment.",
            level: "All Star",
            color: "from-red-500 to-red-600",
            image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090"
        },
        {
            title: "Playmaker Elite",
            icon: <Activity className="w-8 h-8 text-white" />,
            desc: "Advanced ball handling drills and court vision exercises for point guards.",
            level: "MVP",
            color: "from-green-500 to-green-600",
            image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069"
        },
        {
            title: "Team Tactics",
            icon: <Trophy className="w-8 h-8 text-white" />,
            desc: "Learn spacing, pick-and-roll execution, and defensive rotations.",
            level: "Team",
            color: "from-orange-500 to-orange-600",
            image: "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?q=80&w=2070"
        }
    ];

    return (
        <div className={`min-h-screen py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 relative">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase italic tracking-tighter">
                        Training <span className="text-bako-orange">Drills</span>
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Select your drill card. Upload your video. Get AI feedback instantly.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {programs.map((prog, idx) => (
                        <div key={idx} className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                            {/* Background Image with Overlay */}
                            <div className="absolute inset-0">
                                <img
                                    src={prog.image}
                                    alt={prog.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className={`absolute inset-0 bg-gradient-to-r ${prog.color} opacity-80 mix-blend-multiply group-hover:opacity-70 transition-opacity`}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                                        {prog.icon}
                                    </div>
                                    <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-widest rounded-full border border-white/20">
                                        {prog.level}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-300">
                                        {prog.title}
                                    </h3>
                                    <p className="text-white/80 mb-6 line-clamp-2 group-hover:text-white transition-colors">
                                        {prog.desc}
                                    </p>

                                    <div className="flex items-center text-white font-bold group/btn">
                                        <span className="mr-2">Start Training</span>
                                        <PlayCircle className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Programs;
