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
  Trophy,
  ChevronRight
} from 'lucide-react';


const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 bg-[#0a0c0f] text-gray-400 border-t border-white/5 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      <div className="w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: About */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-black mb-6 flex items-center tracking-tighter text-white">
              BAKO<span className="text-orange-500">.</span>AI
            </h2>
            <p className="mb-6 text-sm font-medium leading-relaxed opacity-80">
              Elevate your game with AI-powered basketball analytics. Track performance, analyze matches, and reach your full potential on the court.
            </p>
            <div className="flex space-x-4">
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
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">
              Quick Links
            </h2>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-sm font-bold hover:text-orange-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={14} className="text-orange-500/50" /> About
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-sm font-bold hover:text-orange-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={14} className="text-orange-500/50" /> Programs
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-sm font-bold hover:text-orange-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={14} className="text-orange-500/50" /> Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm font-bold hover:text-orange-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={14} className="text-orange-500/50" /> Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm font-bold hover:text-orange-500 transition-colors flex items-center gap-2">
                  <ChevronRight size={14} className="text-orange-500/50" /> FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">
              Contact Us
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 mr-4 group-hover:border-orange-500/50 transition-colors">
                  <Phone className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-sm font-bold mt-1">+254 784136754</span>
              </li>
              <li className="flex items-start group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 mr-4 group-hover:border-blue-500/50 transition-colors">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-bold mt-1">akumann48@gmail.com</span>
              </li>
              <li className="flex items-start group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 mr-4 group-hover:border-red-500/50 transition-colors">
                  <MapPin className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-sm font-bold mt-1">UCU Mukono, Uganda</span>
              </li>
              <li className="flex items-start group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 mr-4 group-hover:border-yellow-500/50 transition-colors">
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <span className="text-xs font-bold leading-relaxed mt-1">Mon–Fri: 9am–6pm<br/>Sat: 9am–1pm</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white mb-6">
              Newsletter
            </h2>
            <p className="mb-6 text-sm font-medium opacity-80">Get training tips and basketball performance updates.</p>
            <form className="flex flex-col space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm font-bold focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-premium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright section */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold opacity-50">
            &copy; {currentYear} BAKO Analytics. All rights reserved.
          </p>
          <p className="text-sm font-bold opacity-50 flex items-center">
            Built for the love of the game <Heart className="inline h-4 w-4 mx-2 text-orange-500" fill="currentColor" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 