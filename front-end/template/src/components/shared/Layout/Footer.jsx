import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import {
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  Activity,
  Trophy,
  Target,
  Users,
  Facebook,
  Instagram,
  Twitter,
  BarChart2,
  Shield,
  Zap
} from 'lucide-react';

const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full py-12 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'
      } border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: About */}
          <div className="flex flex-col">
            <div className="flex items-center mb-6">
              <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-600'}`}>
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">BAKO</h2>
            </div>
            <p className={`mb-6 text-sm leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Elevating basketball performance through advanced data analytics and personalized training insights. Providing teams and children with the tools to dominate the court.
            </p>
            <div className="flex space-x-4">
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}>
                <Facebook size={20} />
              </a>
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}>
                <Instagram size={20} />
              </a>
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}>
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className={`text-sm hover:underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'}`}>
                  About BAKO
                </Link>
              </li>
              <li>
                <Link to="/programs" className={`text-sm hover:underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'}`}>
                  Training Programs
                </Link>
              </li>
              <li>
                <Link to="/gallery" className={`text-sm hover:underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'}`}>
                  Media Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className={`text-sm hover:underline ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-indigo-600'}`}>
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-3 text-indigo-500" />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>+254 123 456 789</span>
              </li>
              <li className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-3 text-indigo-500" />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>contact@bako.ai</span>
              </li>
              <li className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-3 text-indigo-500" />
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Newsletter</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Get the latest insights on basketball performance and analytics.
            </p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Email address"
                className={`px-4 py-2 text-sm rounded-md focus:outline-none border ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-indigo-500'
                  }`}
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-center`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            &copy; {currentYear} BAKO Basketball Analytics. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} flex items-center`}>
              Made with <Heart className="inline h-3 w-3 mx-1 text-red-500" /> for the love of the game
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 