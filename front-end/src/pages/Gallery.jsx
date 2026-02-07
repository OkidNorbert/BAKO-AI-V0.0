import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Camera, Maximize2, X } from 'lucide-react';

const Gallery = () => {
    const { isDarkMode } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);

    const images = [
        { src: "/gallery/1Y9YTgSyvxiEBUjWPFycH.png", type: "wide", title: "AI Basketball Analysis" },
        { src: "/gallery/3CE0QdATLCZ2JwJZsYuBX.png", type: "tall", title: "Performance Insights" },
        { src: "/gallery/Create%20a%20modern%20LinkedIn.jpg", type: "wide", title: "Basketball Analytics" },
        { src: "/gallery/Create%20a%20modern%20LinkedIn-st.jpg", type: "wide", title: "Court & Data" }
    ];

    return (
        <div className={`min-h-screen py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter transform -rotate-2">
                        The <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Highlight</span> Reel
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Capturing the intensity, the passion, and the buzzer-beaters.
                    </p>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:rotate-1 hover:scale-[1.02]"
                            onClick={() => setSelectedImage(img.src)}
                        >
                            <img
                                src={img.src}
                                alt={img.title}
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-sm">
                                <span className="text-white text-2xl font-black mb-2 transform -rotate-3">{img.title}</span>
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <Maximize2 className="w-8 h-8 text-white/80" />
                                </div>
                            </div>

                            {/* Corner Accent */}
                            <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity delay-100"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
                    <button
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <img
                        src={selectedImage}
                        alt="Full screen"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-slide-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default Gallery;
