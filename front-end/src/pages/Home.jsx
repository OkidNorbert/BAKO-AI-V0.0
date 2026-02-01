import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Image as ImageIcon, ArrowRight } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/team');
      } else if (user.role === 'coach') {
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
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'} rounded-full absolute top-20 left-10 opacity-50 animate-float-slow`}></div>
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-pink-600' : 'bg-pink-400'} rounded-full absolute top-40 right-20 opacity-40 animate-float-medium`}></div>
          <div className={`w-20 h-20 ${isDarkMode ? 'bg-green-500' : 'bg-green-300'} rounded-full absolute bottom-20 left-1/4 opacity-40 animate-float-fast`}></div>
          <div className={`w-12 h-12 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'} rounded-full absolute bottom-40 right-1/3 opacity-50 animate-bounce-slow`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* African-inspired decorative element */}
            <div className="flex justify-center mb-6">
              <svg className="w-40 h-12" viewBox="0 0 200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,12 C8,6 16,3 24,6 C32,9 40,18 48,18 C56,18 64,12 72,9 C80,6 88,6 96,9 C104,12 112,18 120,18 C128,18 136,12 144,9 C152,6 160,6 168,9 C176,12 184,18 192,18 C200,18 200,12 200,12"
                  stroke={isDarkMode ? "#F59E0B" : "#8B5CF6"}
                  strokeWidth="4"
                  strokeLinecap="round" />
              </svg>
            </div>

            <h1 className={`text-5xl sm:text-6xl md:text-7xl font-bold mb-6 ${isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500'
              } animate-gradient`}>
              BAKO Basketball Academy
            </h1>
            <p className={`text-xl sm:text-2xl ${isDarkMode ? 'text-gray-300' : 'text-indigo-800'
              } mb-8 max-w-3xl mx-auto font-medium`}>
              Elevate Your Game with AI-Powered Basketball Analytics. A Professional Environment to Track Progress, Analyze Performance, and Reach Elite Levels.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
              <Link
                to="/login"
                className={`transform transition duration-200 hover:scale-105 shadow-lg px-8 py-4 rounded-full text-xl font-bold flex items-center justify-center space-x-2 ${isDarkMode
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                  }`}
              >
                Staff Login
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
              </Link>

              <Link
                to="/gallery"
                className={`transform transition duration-200 hover:scale-105 shadow-lg px-8 py-4 rounded-full text-xl font-bold flex items-center justify-center space-x-2 ${isDarkMode
                  ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white border-2 border-purple-700 hover:from-purple-900 hover:to-indigo-950'
                  : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50'
                  }`}
              >
                View Gallery
                <ArrowRight className="h-6 w-6 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Cloud decorations */}
        <div className={`hidden sm:block absolute bottom-0 left-0 w-64 h-16 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-full transform translate-y-1/2 opacity-70`}></div>
        <div className={`hidden sm:block absolute bottom-10 right-0 w-80 h-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          } rounded-full transform translate-x-1/4 opacity-60`}></div>
      </div>

      {/* Features Section with playful design */}
      <div className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'
        } rounded-t-5xl`}>
        <div className={`absolute top-0 left-0 w-full h-10 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'
          } rounded-b-full`}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="text-center mb-16">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
              }`}>Our Basketball World</h2>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>A premier training environment where players can develop skills, compete, and excel together!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "AI Performance Analysis",
                description: "Deep-dive into shooting mechanics, dribbling efficiency, and movement speed using our advanced AI engine.",
                color: isDarkMode ? "bg-pink-700" : "bg-pink-500",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
              {
                title: "Team Management",
                description: "Effortlessly manage your rosters, player profiles, and attendance for teams of all levels.",
                color: isDarkMode ? "bg-amber-600" : "bg-yellow-500",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                title: "Skill Tracking",
                description: "Monitor player development over time with comprehensive skill metrics and performance trends.",
                color: isDarkMode ? "bg-green-700" : "bg-green-500",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
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

      {/* African-themed imagery section */}
      <div className={`py-20 overflow-hidden ${isDarkMode ? 'bg-indigo-950' : 'bg-indigo-100'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
              }`}>
              The Future of Basketball Training
            </h2>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              We combine professional expertise with state-of-the-art AI technology to help players achieve their best
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-102">
              <img
                src="https://images.unsplash.com/photo-1725245250734-b19cdc29e974?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="African children playing"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-102 mt-10 md:mt-20">
              <img
                src="https://images.unsplash.com/photo-1557734864-c78b6dfef1b1?q=80&w=3268&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Players learning together"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-w-1 aspect-h-1 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-102">
              <img
                src="https://images.unsplash.com/photo-1594659217736-fe44a3ae36e0?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Player smiling"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center mt-16">
            <Link to="/gallery" className={`inline-flex items-center px-6 py-3 rounded-full font-semibold transition-all duration-200 ${isDarkMode
              ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}>
              View Our Photo Gallery
              <ImageIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* About Us Section with player-friendly elements */}
      <div className={`py-20 relative ${isDarkMode
        ? 'bg-gradient-to-r from-gray-900 to-purple-950'
        : 'bg-gradient-to-r from-indigo-50 to-purple-50'
        }`}>
        <div className="absolute top-0 right-0 opacity-10">
          <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M160 70C160 93.196 141.196 112 118 112C94.804 112 76 93.196 76 70C76 46.804 94.804 28 118 28C141.196 28 160 46.804 160 70Z" fill={isDarkMode ? "#F59E0B" : "#FDE68A"} />
            <path d="M184 120C184 143.196 165.196 162 142 162C118.804 162 100 143.196 100 120C100 96.804 118.804 78 142 78C165.196 78 184 96.804 184 120Z" fill={isDarkMode ? "#60A5FA" : "#BAE6FD"} fillOpacity="0.7" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
              }`}>About BAKO Basketball Academy</h2>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>Our Mission</h3>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  At BAKO Basketball Academy, we're committed to developing elite basketball talent through data-driven training and personalized coaching. Our dedicated team of coaches ensures each player reaches their full potential.
                </p>
                <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>What Makes Us Special</h3>
                <ul className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  <li className="flex items-start">
                    <svg className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-green-500'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced performance analytics and video analysis
                  </li>
                  <li className="flex items-start">
                    <svg className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-green-500'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Professional coaches with competitive experience
                  </li>
                  <li className="flex items-start">
                    <svg className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-green-500'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Skill-level appropriate training programs
                  </li>
                  <li className="flex items-start">
                    <svg className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-green-500'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    State-of-the-art training facilities
                  </li>
                  <li className="flex items-start">
                    <svg className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-green-500'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Team and individual performance tracking
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className={`w-full h-64 rounded-2xl overflow-hidden relative ${isDarkMode
                  ? 'bg-gradient-to-r from-purple-800 to-indigo-900'
                  : 'bg-gradient-to-r from-blue-300 to-purple-300'
                  }`}>
                  {/* African patterns */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/african-fabric.png')",
                    backgroundSize: "200px",
                  }}></div>

                  <div className="absolute top-4 left-4 w-16 h-16 bg-yellow-400 rounded-full opacity-80"></div>
                  <div className="absolute bottom-6 right-8 w-20 h-20 bg-green-400 rounded-full opacity-80"></div>
                  <div className="absolute top-10 right-20 w-10 h-10 bg-pink-400 rounded-full opacity-80"></div>
                  <div className="absolute bottom-16 left-16 w-12 h-12 bg-indigo-400 rounded-full opacity-80"></div>
                  <div className="h-full w-full flex items-center justify-center">
                    <p className={`text-2xl font-bold text-center p-4 ${isDarkMode ? 'text-yellow-300' : 'text-white'
                      }`}>Creating Colorful Memories!</p>
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
                    "BAKO has completely transformed how we analyze games. The AI insights are game-changers for player development."
                  </p>
                  <p className="text-sm font-semibold mt-2">- Coach Sarah W., Elite Academy</p>
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