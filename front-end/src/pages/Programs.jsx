import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, Video, Activity, Trophy } from 'lucide-react';

const Programs = () => {
    const { isDarkMode } = useTheme();

    const programs = [
        {
            title: "Fundamentals Mastery",
            icon: <BookOpen className="w-8 h-8 text-blue-500" />,
            desc: "Master the basics of dribbling, shooting, and defense with our structured curriculum.",
            level: "Beginner"
        },
        {
            title: "AI Shot Analysis",
            icon: <Video className="w-8 h-8 text-red-500" />,
            desc: "Get instant feedback on your shooting form using our advanced computer vision technology.",
            level: "All Levels"
        },
        {
            title: "Pro Skill Development",
            icon: <Activity className="w-8 h-8 text-green-500" />,
            desc: "Advanced drills and skill challenges designed to take your game to the elite level.",
            level: "Advanced"
        },
        {
            title: "Team Strategy",
            icon: <Trophy className="w-8 h-8 text-orange-500" />,
            desc: "Learn spacing, movement off the ball, and defensive rotations.",
            level: "Intermediate+"
        }
    ];

    return (
        <div className={`min-h-screen py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                        Learning Adventures
                    </h1>
                    <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Structured programs designed to elevate every aspect of your game.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-10">
                    {programs.map((prog, idx) => (
                        <div key={idx} className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`p-4 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        {prog.icon}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                                        {prog.level}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">{prog.title}</h3>
                                <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{prog.desc}</p>
                                <button className={`w-full py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}>
                                    Start Learning
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Programs;
