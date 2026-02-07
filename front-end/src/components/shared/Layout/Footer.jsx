import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sun,
  Cloud,
  Star,
  Facebook,
  Instagram,
  Twitter,
  Rocket,
  Music,
  Palette,
  Trophy,
  Smile,
  Baby
} from 'lucide-react';


const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-8 ${isDarkMode ? 'bg-indigo-950 text-white' : 'bg-indigo-100 text-gray-800'
      }`}>
      {/* Playful top border with animated elements */}
      <div className="w-full h-6 flex overflow-hidden relative">
        <div className="h-full flex-1 bg-red-400 rounded-b-lg transform -translate-y-1"></div>
        <div className="h-full flex-1 bg-yellow-400 rounded-b-lg transform -translate-y-2"></div>
        <div className="h-full flex-1 bg-green-400 rounded-b-lg transform -translate-y-1"></div>
        <div className="h-full flex-1 bg-blue-400 rounded-b-lg transform -translate-y-2"></div>
        <div className="h-full flex-1 bg-purple-400 rounded-b-lg transform -translate-y-1"></div>

        {/* Bouncing stars */}
        <div className="absolute top-1 left-1/4">
          <Star className="h-4 w-4 text-yellow-200 animate-bounce" />
        </div>
        <div className="absolute top-2 left-2/3">
          <Star className="h-3 w-3 text-yellow-200 animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: About */}
          <div className="flex flex-col">
            <h2 className={`text-2xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-yellow-300' : 'text-indigo-700'
              }`}>
              <div className="mr-3 h-10 w-10 rounded-lg overflow-hidden shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop"
                  alt="BAKO Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              BAKO Analytics
            </h2>
            <p className="mb-4 text-lg leading-relaxed" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>
              Elevate your game with AI-powered basketball analytics! Track performance, analyze matches, and reach your full potential on the court!
            </p>
            <div className="flex space-x-4 mt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className={`${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'} transform transition-transform hover:scale-110`}>
                <Facebook size={24} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className={`${isDarkMode ? 'text-pink-300 hover:text-pink-200' : 'text-pink-600 hover:text-pink-800'} transform transition-transform hover:scale-110`}>
                <Instagram size={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className={`${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-500 hover:text-blue-700'} transform transition-transform hover:scale-110`}>
                <Twitter size={24} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-yellow-300' : 'text-indigo-700'
              }`}>
              <Palette className="mr-2 h-5 w-5" />
              Quick Links
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className={`hover:underline flex items-center ${isDarkMode ? 'text-gray-300 hover:text-yellow-300' : 'text-gray-600 hover:text-indigo-700'
                  }`}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/programs" className={`hover:underline flex items-center ${isDarkMode ? 'text-gray-300 hover:text-yellow-300' : 'text-gray-600 hover:text-indigo-700'
                  }`}>
                  Programs
                </Link>
              </li>
              <li>
                <Link to="/gallery" className={`hover:underline flex items-center ${isDarkMode ? 'text-gray-300 hover:text-yellow-300' : 'text-gray-600 hover:text-indigo-700'
                  }`}>
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`hover:underline flex items-center ${isDarkMode ? 'text-gray-300 hover:text-yellow-300' : 'text-gray-600 hover:text-indigo-700'
                  }`}>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className={`hover:underline flex items-center ${isDarkMode ? 'text-gray-300 hover:text-yellow-300' : 'text-gray-600 hover:text-indigo-700'
                  }`}>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-yellow-300' : 'text-indigo-700'
              }`}>
              <Cloud className="mr-2 h-5 w-5" />
              Reach Our Treehouse
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Phone className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`} />
                <span className="text-lg" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>+254 123 456 789</span>
              </li>
              <li className="flex items-start">
                <Mail className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`} />
                <span className="text-lg" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>info@bakobasketball.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`} />
                <span className="text-lg" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>123 Sunshine Avenue, Nairobi</span>
              </li>
              <li className="flex items-start">
                <Clock className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                  }`} />
                <span className="text-lg" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Mon-Fri: 7am-6pm <br />Sat: 8am-12pm</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-yellow-300' : 'text-indigo-700'
              }`}>
              <Music className="mr-2 h-5 w-5" />
              Join Our Adventure Club!
            </h2>
            <p className="mb-4 text-lg" style={{ fontFamily: "'Comic Sans MS', cursive, sans-serif" }}>Get training tips and basketball performance updates!</p>
            <form className="flex flex-col space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className={`px-4 py-2 rounded-lg focus:outline-none ${isDarkMode
                  ? 'bg-gray-800 text-white border border-gray-700 focus:border-yellow-400'
                  : 'bg-white text-gray-900 border-2 border-indigo-200 focus:border-indigo-400'
                  }`}
              />
              <button
                type="submit"
                className={`px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${isDarkMode
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-gray-900 hover:from-yellow-400 hover:to-yellow-300 shadow-lg'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg'
                  }`}
              >
                Join the Fun!
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright section */}
        <div className="mt-8 pt-8 border-t border-opacity-20 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
            &copy; {currentYear} BAKO Basketball. All rights reserved.
            <span className="mx-2">|</span>
            Made with <Heart className="inline h-4 w-4 text-red-500 animate-pulse" /> for champions on the court!
          </p>
        </div>

        {/* Decorative elements for kid-friendly look */}
        <div className="relative h-24 overflow-hidden">
          {/* Clouds */}
          <div className={`absolute w-20 h-10 rounded-t-full ${isDarkMode ? 'bg-indigo-900' : 'bg-white'} left-1/4 bottom-0`}></div>
          <div className={`absolute w-32 h-16 rounded-t-full ${isDarkMode ? 'bg-indigo-900' : 'bg-white'} left-1/3 bottom-0`}></div>
          <div className={`absolute w-24 h-12 rounded-t-full ${isDarkMode ? 'bg-indigo-900' : 'bg-white'} left-1/2 bottom-0`}></div>
          <div className={`absolute w-20 h-10 rounded-t-full ${isDarkMode ? 'bg-indigo-900' : 'bg-white'} left-2/3 bottom-0`}></div>

          {/* Little characters */}
          <div className="absolute bottom-0 left-1/6">
            <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
              <Smile className="h-5 w-5 text-yellow-800" />
            </div>
          </div>
          <div className="absolute bottom-0 right-1/6">
            <div className="w-8 h-8 bg-green-300 rounded-full flex items-center justify-center">
              <Baby className="h-5 w-5 text-green-800" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 