import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Video, ArrowRight, Activity, TrendingUp, Shield } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user) {
      if (user.role === 'team') {
        navigate('/team');
      } else if (user.role === 'player') {
        navigate('/player');
      }
    }
  }, [user, navigate]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-purple-950'
        : 'bg-gradient-to-b from-blue-100 to-purple-100'
      }`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-10 pb-20">
        <div className="absolute top-0 left-0 right-0 h-full">
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-orange-500' : 'bg-orange-400'} rounded-full absolute top-20 left-10 opacity-50 animate-float-slow`}></div>
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-red-600' : 'bg-red-400'} rounded-full absolute top-40 right-20 opacity-40 animate-float-medium`}></div>
          <div className={`w-20 h-20 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'} rounded-full absolute bottom-20 left-1/4 opacity-40 animate-float-fast`}></div>
          <div className={`w-12 h-12 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-400'} rounded-full absolute bottom-40 right-1/3 opacity-50 animate-bounce-slow`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* Logo placeholder/decorative element */}
            <div className="flex justify-center mb-6">
              <svg className="w-40 h-12" viewBox="0 0 200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,12 C20,6 40,3 60,6 C80,9 100,18 120,18 C140,18 160,12 180,9 C200,6 220,6 240,9"
                  stroke={isDarkMode ? "#F97316" : "#EA580C"}
                  strokeWidth="4"
                  strokeLinecap="round" />
              </svg>
            </div>

            <h1 className={`text-5xl sm:text-6xl md:text-7xl font-bold mb-6 ${isDarkMode
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500'
              } animate-gradient`}>
              BAKO Analytics
            </h1>
            <p className={`text-xl sm:text-2xl ${isDarkMode ? 'text-gray-300' : 'text-indigo-900'
              } mb-8 max-w-3xl mx-auto font-medium`}>
              Elevate Your Game. AI-Powered Basketball Performance Analysis for Teams and Players.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
              <Link
                to="/login"
                className={`transform transition duration-200 hover:scale-105 shadow-lg px-8 py-4 rounded-full text-xl font-bold flex items-center justify-center space-x-2 ${isDarkMode
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800'
                  }`}
              >
                Get Started
                <ArrowRight className="h-6 w-6 ml-2" />
              </Link>

              <Link
                to="/gallery" // Keeping gallery or maybe a 'demo' link
                className={`transform transition duration-200 hover:scale-105 shadow-lg px-8 py-4 rounded-full text-xl font-bold flex items-center justify-center space-x-2 ${isDarkMode
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white border-2 border-gray-700 hover:from-gray-900 hover:to-black'
                    : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50'
                  }`}
              >
                View Features
                <Activity className="h-6 w-6 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Background shapes */}
        <div className={`hidden sm:block absolute bottom-0 left-0 w-64 h-16 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-full transform translate-y-1/2 opacity-70`}></div>
        <div className={`hidden sm:block absolute bottom-10 right-0 w-80 h-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-full transform translate-x-1/4 opacity-60`}></div>
      </div>

      {/* Features Section */}
      <div className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-t-5xl`}>
        <div className={`absolute top-0 left-0 w-full h-10 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
          } rounded-b-full`}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="text-center mb-16">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-orange-400' : 'text-indigo-700'
              }`}>Professional Analytics for Everyone</h2>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>From local courts to pro leagues, get the data you need to win.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Team Management",
                description: "Manage rosters, track player stats over time, and analyze match performance.",
                color: isDarkMode ? "bg-orange-700" : "bg-orange-500",
                icon: <Shield className="h-12 w-12" />,
              },
              {
                title: "Player Development",
                description: "Upload training videos for AI feedback on shooting form and movement.",
                color: isDarkMode ? "bg-red-600" : "bg-red-500",
                icon: <TrendingUp className="h-12 w-12" />,
              },
              {
                title: "Match Analysis",
                description: "Full game breakdown with player tracking, heatmaps, and event detection.",
                color: isDarkMode ? "bg-blue-700" : "bg-blue-500",
                icon: <Video className="h-12 w-12" />,
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`transform transition duration-300 hover:scale-105 rounded-3xl p-8 shadow-xl ${isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white'
                  }`}
              >
                <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full ${feature.color} text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{feature.title}</h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Imagery Section - Basketball Focus */}
      <div className={`py-20 overflow-hidden ${isDarkMode ? 'bg-indigo-950' : 'bg-indigo-50'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-orange-400' : 'text-indigo-700'
              }`}>
              See The Game Clearly
            </h2>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              Advanced computer vision tracks every move, pass, and shot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-102">
              <img
                src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=2090&auto=format&fit=crop"
                alt="Basketball hoop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-102 mt-10 md:mt-20">
              <img
                src="https://images.unsplash.com/photo-1519861531473-920026393112?q=80&w=2076&auto=format&fit=crop"
                alt="Players in action"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-102">
              <img
                src="https://images.unsplash.com/photo-1518407613690-d9fc990e795f?q=80&w=2070&auto=format&fit=crop"
                alt="Training drill"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center mt-16">
            <Link to="/gallery" className={`inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-200 ${isDarkMode
                ? 'bg-orange-500 text-white hover:bg-orange-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}>
              See Analysis Examples
              <Activity className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* About/Mission Section */}
      <div className={`py-20 relative ${isDarkMode
          ? 'bg-gradient-to-r from-gray-900 to-purple-950'
          : 'bg-gradient-to-r from-indigo-50 to-purple-100'
        }`}>
        <div className="absolute top-0 right-0 opacity-10">
          <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke={isDarkMode ? "#F97316" : "#EA580C"} strokeWidth="20" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-orange-400' : 'text-indigo-700'
              }`}>Why Choose BAKO?</h2>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>Empowering African Basketball</h3>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  BAKO is designed for low-resource environments, bringing elite-level analytics to everyone. We believe talent is everywhere, but opportunity is not. We're bridging that gap.
                </p>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>Key Capabilities</h3>
                <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  <li className="flex items-start">
                    <TrendingUp className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-blue-500'}`} />
                    Advanced Computer Vision for Player Tracking
                  </li>
                  <li className="flex items-start">
                    <Activity className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-blue-500'}`} />
                    Detailed Shot Charts and Heatmaps
                  </li>
                  <li className="flex items-start">
                    <Shield className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-blue-500'}`} />
                    Team Roster and Performance Management
                  </li>
                  <li className="flex items-start">
                    <Video className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-orange-400' : 'text-blue-500'}`} />
                    Offline-First Video Processing
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className={`w-full h-64 rounded-2xl overflow-hidden relative ${isDarkMode
                    ? 'bg-gradient-to-r from-purple-800 to-indigo-900'
                    : 'bg-gradient-to-r from-blue-300 to-purple-300'
                  }`}>
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 2px, transparent 2.5px)",
                    backgroundSize: "30px 30px",
                  }}></div>

                  <div className="absolute top-4 left-4 w-16 h-16 bg-orange-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute bottom-6 right-8 w-20 h-20 bg-blue-500 rounded-full opacity-80"></div>

                  <div className="h-full w-full flex items-center justify-center">
                    <p className={`text-2xl font-bold text-center p-4 ${isDarkMode ? 'text-yellow-300' : 'text-white'
                      }`}>Data-Driven Decisions</p>
                  </div>
                </div>

                {/* Testimonial */}
                <div className={`absolute -bottom-10 -right-10 p-4 rounded-lg shadow-lg max-w-xs ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-700'
                  }`}>
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
                          }`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm italic">
                    "This tool transformed our training. We now track every player's progress with precision."
                  </p>
                  <p className="text-sm font-semibold mt-2">- Coach David, Youth League</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 