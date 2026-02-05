import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Camera, Maximize2, X } from 'lucide-react';

const Gallery = () => {
    const { isDarkMode } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);

    const images = [
        { src: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090", type: "wide" },
        { src: "https://images.unsplash.com/photo-1519861531473-920026393112?q=80&w=2076", type: "tall" },
        { src: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069", type: "square" },
        { src: "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?q=80&w=2070", type: "wide" },
        { src: "https://images.unsplash.com/photo-1628779238951-be2c9f256544?q=80&w=1000", type: "tall" },
        { src: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000", type: "square" }
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
                                alt={`Gallery ${idx}`}
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <Maximize2 className="w-10 h-10 text-white" />
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
