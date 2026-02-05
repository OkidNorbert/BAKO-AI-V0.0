import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Target, Users, Globe, Award } from 'lucide-react';

const About = () => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                        About BAKO Basketball
                    </h1>
                    <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Bridging the gap between talent and opportunity through accessible AI technology.
                    </p>
                </div>

                {/* Mission Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                        <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            BAKO is designed for low-resource environments, bringing elite-level analytics to everyone. We believe talent is everywhere, but opportunity is not.
                        </p>
                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            By leveraging advanced computer vision and AI, we provide professional-grade insights that were previously only available to NBA teams, making them accessible to local courts and youth leagues across Africa and the world.
                        </p>
                    </div>
                    <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl skew-y-3 transform transition hover:skew-y-0 duration-500">
                        <img
                            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090"
                            alt="Basketball Court"
                            className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 opacity-20 ${isDarkMode ? 'bg-orange-900' : 'bg-orange-500'}`}></div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="grid md:grid-cols-4 gap-8 mb-20">
                    {[
                        { icon: <Target className="w-10 h-10 text-orange-500" />, title: "Precision", desc: "Data-driven insights for real improvement." },
                        { icon: <Users className="w-10 h-10 text-blue-500" />, title: "Community", desc: "Empowering coaches and players together." },
                        { icon: <Globe className="w-10 h-10 text-green-500" />, title: "Accessibility", desc: "Elite tech for every court, everywhere." },
                        { icon: <Award className="w-10 h-10 text-purple-500" />, title: "Excellence", desc: "Helping you reach your full potential." }
                    ].map((item, idx) => (
                        <div key={idx} className={`p-6 rounded-xl shadow-lg border-t-4 border-orange-500 transform hover:-translate-y-2 transition duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="mb-4">{item.icon}</div>
                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default About;
