import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Camera, Image as ImageIcon } from 'lucide-react';

const Gallery = () => {
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600">
                        Fun Photo Gallery
                    </h1>
                    <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        See BAKO in action. From local courts to championship games.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px]">
                    {/* Main large image */}
                    <div className="md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden relative group cursor-pointer">
                        <img
                            src="https://images.unsplash.com/photo-1519861531473-920026393112?q=80&w=2000"
                            alt="Basketball Action"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Camera className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {[
                        "https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000",
                        "https://images.unsplash.com/photo-1628779238951-be2c9f256544?q=80&w=1000",
                        "https://images.unsplash.com/photo-1544919982-b61976f0ba43?q=80&w=1000",
                        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000"
                    ].map((src, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden relative group cursor-pointer hover:shadow-xl transition-all">
                            <img
                                src={src}
                                alt={`Gallery ${idx}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Gallery;
