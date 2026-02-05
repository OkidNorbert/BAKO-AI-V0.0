import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Target, Users, Globe, Award, Dribbble, Heart } from 'lucide-react';

const About = () => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-orange-50 text-gray-900'}`}>

            {/* Background Court Lines Effect */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-8 border-current rounded-full"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[2px] h-full bg-current"></div>
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full h-[2px] bg-current"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
                <div className="text-center mb-16 relative">
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-9xl opacity-10 font-black tracking-widest text-bako-orange">BAKO</div>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 uppercase tracking-tight relative z-10">
                        About <span className="text-bako-orange">BAKO</span>
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        We're not just coding; we're changing the game. Bridging the gap between raw talent and elite opportunity.
                    </p>
                </div>

                {/* Mission Section with Basketball Card Design */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                    <div className="space-y-6">
                        <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'bg-orange-900 text-orange-300' : 'bg-orange-200 text-orange-800'}`}>
                            Our Mission
                        </div>
                        <h2 className="text-4xl font-bold leading-tight">
                            Elite Analytics.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Accessible to All.</span>
                        </h2>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            BAKO uses cutting-edge computer vision to track every dribble, pass, and shot. We believe that detailed performance data shouldn't be a luxury reserved for the pros.
                        </p>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Whether you're playing on a dusty court in Nairobi or a hardwood gym in New York, BAKO gives you the insights to level up.
                        </p>

                        <div className="pt-4">
                            <button className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-transform hover:-translate-y-1 shadow-lg ${isDarkMode ? 'bg-bako-orange text-white' : 'bg-orange-600 text-white'}`}>
                                <Heart className="w-5 h-5 animate-pulse" />
                                <span>Join Our Community</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative group perspective">
                        <div className="absolute -inset-4 bg-gradient-to-r from-orange-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl skew-y-2 group-hover:skew-y-0 transition-transform duration-500">
                            <img
                                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090"
                                alt="Basketball Court"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                                <div>
                                    <div className="text-orange-400 font-bold uppercase text-sm mb-1">Impact</div>
                                    <div className="text-white text-2xl font-bold">Democratizing The Game</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats / Values Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: <Target className="w-12 h-12" />, title: "Precision", desc: "Pixel-perfect tracking.", color: "text-red-500", bg: "bg-red-100" },
                        { icon: <Users className="w-12 h-12" />, title: "Teamwork", desc: "Built for coaches & squads.", color: "text-blue-500", bg: "bg-blue-100" },
                        { icon: <Globe className="w-12 h-12" />, title: "Global", desc: "From Africa to the World.", color: "text-green-500", bg: "bg-green-100" },
                        { icon: <Trophy className="w-12 h-12" />, title: "Excellence", desc: "Championship standards.", color: "text-yellow-500", bg: "bg-yellow-100" }
                    ].map((item, idx) => (
                        <div key={idx} className={`relative p-8 rounded-3xl border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${isDarkMode
                                ? 'bg-gray-800 border-gray-700 hover:border-orange-500'
                                : 'bg-white border-gray-100 hover:border-orange-400'
                            }`}>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDarkMode ? 'bg-gray-700' : item.bg} ${item.color}`}>
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{item.desc}</p>

                            {/* Decorative Corner */}
                            <div className={`absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-3xl`}>
                                <div className={`absolute top-0 right-0 w-8 h-8 transform translate-x-1/2 -translate-y-1/2 rotate-45 ${isDarkMode ? 'bg-gray-700' : 'bg-orange-100'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Simple Icon component wrapper if needed, or import directly
import { Trophy } from 'lucide-react';

export default About;
