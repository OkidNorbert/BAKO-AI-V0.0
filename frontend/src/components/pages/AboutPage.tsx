import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            About CourtVision AI
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Democratizing elite-level sports analytics for everyone
          </p>
        </div>

        <div className="space-y-12">
          <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-orange-50 to-blue-50'}`}>
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Our Mission
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              CourtVision AI was created to make professional-grade basketball performance analysis 
              accessible to everyone. While NBA teams use expensive systems like Catapult and PlaySight, 
              we believe every player deserves access to AI-powered insights to improve their game.
            </p>
          </div>

          <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Our Technology
            </h2>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
              Built with cutting-edge AI and computer vision:
            </p>
            <ul className="space-y-3">
              {[
                'MediaPipe for real-time pose detection',
                'YOLOv8 for basketball object recognition',
                'PyTorch for machine learning models',
                'Real-time WebSocket streaming',
                'Cloud-based processing infrastructure'
              ].map((tech, i) => (
                <li key={i} className="flex items-center">
                  <svg className="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{tech}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <h2 className={`text-3xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Ready to Transform Your Game?
            </h2>
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-xl"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
