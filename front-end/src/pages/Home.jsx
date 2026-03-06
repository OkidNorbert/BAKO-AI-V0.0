import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Calendar, Video, ArrowRight, Activity, TrendingUp, Shield } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  // Removed automatic redirect to dashboard to allow authenticated users to view landing page


  return (
    <div className="min-h-screen bg-[#0f1115] text-white selection:bg-orange-500/30 selection:text-orange-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] mix-blend-screen opacity-50" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen opacity-40" />
          <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen opacity-30" />
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo placeholder/decorative element */}
            <div className="flex justify-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 p-[2px] shadow-[0_0_40px_rgba(249,115,22,0.4)] animate-in zoom-in duration-700">
                <div className="w-full h-full rounded-3xl bg-[#0f1115] flex items-center justify-center">
                  <Activity size={36} className="text-orange-500" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] animate-in slide-in-from-bottom-8 duration-700">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-white to-blue-400">
                BAKO
              </span>
              <br />Analytics
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-bold animate-in slide-in-from-bottom-8 duration-700 delay-100">
              Elevate Your Game. <span className="text-white">AI-Powered</span> Basketball Skill and Performance Analysis for Teams and Players.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12 animate-in slide-in-from-bottom-8 duration-700 delay-200">
              <Link
                to={user ? (user.role === 'team' ? '/team' : '/player') : '/login'}
                className="group relative inline-flex items-center justify-center px-10 py-5 font-black text-xl text-white transition-all duration-200 bg-orange-500 border border-transparent rounded-[2rem] hover:bg-orange-600 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">{user ? 'Enter Dashboard' : 'Get Started'}</span>
                <ArrowRight className="h-6 w-6 ml-3 relative transition-transform group-hover:translate-x-2" />
              </Link>

              <Link
                to="/gallery"
                className="group inline-flex items-center justify-center px-10 py-5 font-black text-xl text-gray-300 transition-all duration-200 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:text-white hover:-translate-y-1"
              >
                <span>View Features</span>
                <Activity className="h-6 w-6 ml-3 text-orange-500 transition-transform group-hover:scale-110" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 relative z-10 border-t border-white/5 bg-[#0a0c0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tighter text-white">
              Professional Analytics for <span className="text-orange-500">Everyone</span>
            </h2>
            <p className="text-xl font-bold max-w-3xl mx-auto text-gray-400">
              From local courts to pro leagues, get the data you need to win.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Team Management",
                description: "Manage rosters, track player stats over time, and analyze match performance.",
                icon: <Shield size={32} />,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                border: "group-hover:border-blue-500/30"
              },
              {
                title: "Player Development",
                description: "Upload training videos for AI feedback on shooting form and movement.",
                icon: <TrendingUp size={32} />,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                border: "group-hover:border-orange-500/30"
              },
              {
                title: "Match Analysis",
                description: "Full game breakdown with player tracking, heatmaps, and event detection.",
                icon: <Video size={32} />,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                border: "group-hover:border-purple-500/30"
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group p-10 rounded-[3rem] glass-dark border border-white/5 transition-all duration-300 hover:bg-white/5 hover:-translate-y-2 ${feature.border}`}
              >
                <div className={`inline-flex items-center justify-center p-5 rounded-2xl ${feature.bg} ${feature.color} mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-black mb-4 text-white tracking-tight leading-none">
                  {feature.title}
                </h3>
                <p className="text-gray-400 font-bold leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Imagery Section - Basketball Focus */}
      <div className="py-32 relative bg-[#0f1115] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-orange-500/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tighter text-white">
              See The Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Clearly</span>
            </h2>
            <p className="text-xl font-bold max-w-3xl mx-auto text-gray-400">
              Advanced computer vision tracks every move, pass, and shot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group relative bg-white/5 aspect-square">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent opacity-80 z-10" />
              <img
                src="/gallery/1Y9YTgSyvxiEBUjWPFycH.png"
                alt="AI Basketball Analysis"
                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute bottom-10 left-10 right-10 z-20">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Feature</p>
                <p className="text-2xl font-black text-white">Skeletal Tracking</p>
              </div>
            </div>
            
            <div className="rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group relative bg-white/5 aspect-square mt-0 md:mt-24">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent opacity-80 z-10" />
              <img
                src="/gallery/3CE0QdATLCZ2JwJZsYuBX.png"
                alt="Performance Insights"
                className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute bottom-10 left-10 right-10 z-20">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Insights</p>
                <p className="text-2xl font-black text-white">Performance Metrics</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-24">
            <Link to="/gallery" className="inline-flex items-center px-10 py-5 rounded-[2rem] font-black text-lg bg-white/10 hover:bg-white/20 text-white transition-all border border-white/5 hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              See All Capabilities
              <Activity className="h-6 w-6 ml-3 text-orange-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* About/Mission Section */}
      <div className="py-32 relative bg-[#0a0c0f] border-t border-white/5 overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 opacity-10 blur-sm pointer-events-none transform translate-x-1/3 -translate-y-1/3">
          <svg width="600" height="600" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="#f97316" strokeWidth="20" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4 text-white tracking-tighter">
              Why Choose BAKO?
            </h2>
          </div>

          <div className="p-12 sm:p-16 rounded-[4rem] glass-dark border border-white/5">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-4xl font-black mb-6 text-white tracking-tight leading-none">
                  Empowering <span className="text-orange-500">African</span> Basketball
                </h3>
                <p className="text-lg font-bold mb-12 text-gray-400 leading-relaxed">
                  BAKO is designed for low-resource environments, bringing elite-level analytics to everyone. We believe talent is everywhere, but opportunity is not. We're bridging that gap.
                </p>
                
                <h3 className="text-xl font-black mb-6 text-white uppercase tracking-widest text-[12px] opacity-50">
                  Key Capabilities
                </h3>
                
                <ul className="space-y-6">
                  {[
                    { text: "Advanced Computer Vision for Player Tracking", icon: <TrendingUp className="h-6 w-6 text-orange-500" /> },
                    { text: "Detailed Shot Charts and Heatmaps", icon: <Activity className="h-6 w-6 text-blue-500" /> },
                    { text: "Team Roster and Performance Management", icon: <Shield className="h-6 w-6 text-purple-500" /> },
                    { text: "Offline-First Video Processing", icon: <Video className="h-6 w-6 text-green-500" /> }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center text-lg font-bold text-gray-300">
                      <div className="p-2 rounded-xl bg-white/5 mr-4 border border-white/5">
                        {item.icon}
                      </div>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="relative">
                <div className="w-full aspect-square rounded-[3rem] overflow-hidden relative bg-gradient-to-br from-orange-500/20 to-purple-500/10 border border-white/10 group">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-20 transition-transform duration-1000 group-hover:scale-110" style={{
                    backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1.5px)",
                    backgroundSize: "24px 24px",
                  }}></div>

                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-500 rounded-full opacity-60 mix-blend-screen blur-[40px] animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500 rounded-full opacity-40 mix-blend-screen blur-[50px]"></div>

                  <div className="h-full w-full flex items-center justify-center relative z-10">
                    <p className="text-5xl font-black text-center p-8 text-white tracking-tighter leading-none drop-shadow-2xl">
                      Data-Driven <br/><span className="text-orange-500">Decisions</span>
                    </p>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="absolute -bottom-10 -left-10 md:-left-16 p-8 rounded-[2rem] border border-white/10 max-w-sm glass-dark shadow-2xl animate-in slide-in-from-bottom-4 duration-500 delay-300">
                  <div className="flex items-center mb-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                         <div key={star} className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                           <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                           </svg>
                         </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-300 leading-relaxed mb-4">
                    "This tool transformed our training. We now track every player's progress with absolute precision."
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-orange-500">- Coach David, Youth League</p>
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
