import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

export const FeaturesPage: React.FC = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Powerful Features
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Everything you need to analyze, track, and improve your basketball performance
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {[
            {
              title: 'AI Video Analysis',
              description: 'Advanced computer vision analyzes your technique',
              features: [
                '33-point pose detection with MediaPipe',
                'Shot form and release analysis',
                'Movement pattern recognition',
                'Automatic event detection',
                'Form scoring and recommendations'
              ],
              icon: '🎬'
            },
            {
              title: 'Wearable Integration',
              description: 'Connect your fitness trackers for complete insights',
              features: [
                'Apple Watch & HealthKit integration',
                'Fitbit, Garmin, and more',
                'Real-time heart rate monitoring',
                'Sleep and recovery tracking',
                'Workload management'
              ],
              icon: '⌚'
            },
            {
              title: 'Performance Analytics',
              description: 'Deep insights into every aspect of your game',
              features: [
                'Shooting accuracy by zone',
                'Jump height and vertical tracking',
                'Speed and agility metrics',
                'Comparative analysis',
                'Progress tracking over time'
              ],
              icon: '📊'
            },
            {
              title: 'Personalized Training',
              description: 'AI-powered recommendations tailored to you',
              features: [
                'Weakness identification',
                'Custom training programs',
                'Position-specific drills',
                'Weekly workout plans',
                'Expected improvement predictions'
              ],
              icon: '💪'
            },
            {
              title: 'Real-time Streaming',
              description: 'Live monitoring during practice and games',
              features: [
                'WebSocket live data streaming',
                'Real-time coach feedback',
                'Live performance metrics',
                'Multi-player tracking',
                'Session recording'
              ],
              icon: '📡'
            },
            {
              title: 'Team Management',
              description: 'Tools for coaches to manage their teams',
              features: [
                'Team performance analytics',
                'Player comparisons',
                'Group training sessions',
                'Coach-player communication',
                'Custom team reports'
              ],
              icon: '👥'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-white to-gray-50'} shadow-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="text-6xl mb-4">{feature.icon}</div>
              <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {feature.title}
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.features.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            to="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-xl"
          >
            Start Free Trial →
          </Link>
        </div>
      </div>
    </div>
  );
};
