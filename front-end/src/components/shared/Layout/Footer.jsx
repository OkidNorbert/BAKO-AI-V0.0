import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Cloud,
  Star,
  Facebook,
  Instagram,
  Twitter,
  Rocket,
  Music,
  Palette,
  Trophy
} from 'lucide-react';


const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-8 ${isDarkMode ? 'bg-indigo-950 text-white' : 'bg-indigo-100 text-gray-800'
      }`}>
      <div className="w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />

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
            <p className="mb-4 text-lg leading-relaxed text-inherit">
              Elevate your game with AI-powered basketball analytics. Track performance, analyze matches, and reach your full potential on the court.
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
              Contact Us
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Phone className={`h-5 w-5 mr-2 flex-shrink-0 ${isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`} />
                <span className="text-lg">+254 123 456 789</span>
              </li>
              <li className="flex items-start">
                <Mail className={`h-5 w-5 mr-2 flex-shrink-0 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                  }`} />
                <span className="text-lg">info@bakobasketball.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className={`h-5 w-5 mr-2 flex-shrink-0 ${isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`} />
                <span className="text-lg">Nairobi, Kenya</span>
              </li>
              <li className="flex items-start">
                <Clock className={`h-5 w-5 mr-2 flex-shrink-0 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'
                  }`} />
                <span className="text-lg">Mon–Fri: 9am–6pm · Sat: 9am–1pm</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-yellow-300' : 'text-indigo-700'
              }`}>
              <Music className="mr-2 h-5 w-5" />
              Newsletter
            </h2>
            <p className="mb-4 text-lg">Get training tips and basketball performance updates.</p>
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
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright section */}
        <div className="mt-8 pt-8 border-t border-opacity-20 text-center">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            &copy; {currentYear} BAKO Basketball Analytics. All rights reserved.
            <span className="mx-2">|</span>
            Made with <Heart className="inline h-4 w-4 text-red-500 animate-pulse" /> for the court.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 