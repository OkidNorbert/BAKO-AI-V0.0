import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

// Sample gallery data - in a real app, you'd fetch this from an API
const galleryItems = [
  {
    id: 1,
    src: 'https://plus.unsplash.com/premium_photo-1682750331018-d3b24be9b027?q=80&w=3271&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Players playing with building blocks',
    category: 'activities',
    title: 'Creative Building'
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1571210862729-78a52d3779a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Outdoor playground with children',
    category: 'facilities',
    title: 'Outdoor Playground'
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Players during art class',
    category: 'activities',
    title: 'Art Class Fun'
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Nap time area with comfortable beds',
    category: 'facilities',
    title: 'Cozy Nap Area'
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Players having lunch together',
    category: 'daily-life',
    title: 'Lunch Time'
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1716654716581-3c92ba53de10?q=80&w=2774&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Story time with teacher',
    category: 'activities',
    title: 'Story Time'
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1685358287448-2c8ad243fb24?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Players learning to count',
    category: 'learning',
    title: 'Math Skills'
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Colorful classroom with toys',
    category: 'facilities',
    title: 'Colorful Classroom'
  },
  {
    id: 9,
    src: 'https://images.unsplash.com/photo-1537655780520-1e392ead81f2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Players playing outdoors',
    category: 'outdoor',
    title: 'Outdoor Play'
  },
  {
    id: 10,
    src: 'https://images.unsplash.com/photo-1567057419565-4349c49d8a04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Music class with instruments',
    category: 'activities',
    title: 'Music Class'
  },
  {
    id: 11,
    src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Players celebrating birthday',
    category: 'events',
    title: 'Birthday Celebration'
  },
  {
    id: 12,
    src: 'https://images.unsplash.com/photo-1526634332515-d56c5fd16991?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    alt: 'Graduation day at academy',
    category: 'events',
    title: 'Graduation Day'
  }
];

const categories = [
  { id: 'all', name: 'All Photos' },
  { id: 'activities', name: 'Activities' },
  { id: 'facilities', name: 'Facilities' },
  { id: 'daily-life', name: 'Daily Life' },
  { id: 'events', name: 'Events' },
  { id: 'learning', name: 'Learning' },
  { id: 'outdoor', name: 'Outdoor' }
];

const Gallery = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGallery, setFilteredGallery] = useState(galleryItems);
  const [selectedImage, setSelectedImage] = useState(null);

  // Apply filters when category or search query changes
  useEffect(() => {
    let result = galleryItems;

    // Apply category filter
    if (activeCategory !== 'all') {
      result = result.filter(item => item.category === activeCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    setFilteredGallery(result);
  }, [activeCategory, searchQuery]);

  const openLightbox = (image) => {
    setSelectedImage(image);
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    // Re-enable scrolling when lightbox is closed
    document.body.style.overflow = 'auto';
  };

  const navigateLightbox = (direction) => {
    const currentIndex = filteredGallery.findIndex(img => img.id === selectedImage.id);
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredGallery.length;
    } else {
      newIndex = (currentIndex - 1 + filteredGallery.length) % filteredGallery.length;
    }

    setSelectedImage(filteredGallery[newIndex]);
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      {/* Hero Section */}
      <div className={`w-full py-12 px-4 ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
        <div className="max-w-7xl mx-auto">
          <button
            onClick={goBack}
            className={`mb-4 flex items-center text-sm font-medium ${isDarkMode ? 'text-indigo-300 hover:text-white' : 'text-indigo-700 hover:text-indigo-900'
              }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-800'}`}>
                Photo Gallery
              </h1>
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                Explore moments of joy, learning, and growth at BAKO Basketball Academy
              </p>
            </div>

            <div className="mt-6 md:mt-0 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <input
                type="text"
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 pr-3 py-2 rounded-full w-full md:w-64 ${isDarkMode
                    ? 'bg-indigo-800 border-indigo-700 text-white placeholder-indigo-400 focus:ring-indigo-500 focus:border-indigo-500'
                    : 'bg-white border-indigo-200 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Filter className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Filter:</span>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${activeCategory === category.id
                    ? isDarkMode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredGallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGallery.map(image => (
              <div
                key={image.id}
                className={`rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 cursor-pointer ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                onClick={() => openLightbox(image)}
              >
                <div className="aspect-w-3 aspect-h-2">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {image.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                    }`}>
                    {categories.find(cat => cat.id === image.category)?.name || image.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-medium mb-2">No photos found</h3>
            <p>Try changing your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 text-white z-50 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white z-50 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
            onClick={() => navigateLightbox('prev')}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white z-50 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
            onClick={() => navigateLightbox('next')}
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <div className="relative max-w-4xl w-full">
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="mx-auto max-h-[80vh] max-w-full object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4">
              <h3 className="text-xl font-medium">{selectedImage.title}</h3>
              <p className="text-sm text-gray-300">
                {categories.find(cat => cat.id === selectedImage.category)?.name || selectedImage.category}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery; 