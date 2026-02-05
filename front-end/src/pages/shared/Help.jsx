import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  HelpCircle,
  Search,
  Video,
  FileText,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Book,
  Download,
  Users,
  Settings,
  Shield,
  Camera,
  Target,
  Activity,
  Trophy,
  Calendar,
  BarChart3
} from 'lucide-react';

const Help = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      description: 'Learn the basics of BAKO Basketball Analytics',
      articles: [
        {
          title: 'Creating Your Account',
          description: 'Step-by-step guide to setting up your team or player account',
          content: 'To get started with BAKO Basketball Analytics, you need to create an account. Choose between a Team account for coaches and managers, or a Player account for individual athletes.',
          videoUrl: null
        },
        {
          title: 'Uploading Your First Video',
          description: 'Learn how to upload training videos for AI analysis',
          content: 'Upload your basketball training videos to get detailed AI-powered analysis. Our system will analyze shooting form, movement patterns, and provide improvement suggestions.',
          videoUrl: '/help/videos/upload'
        },
        {
          title: 'Understanding Your Dashboard',
          description: 'Navigate and understand your analytics dashboard',
          content: 'Your dashboard provides a comprehensive overview of your performance metrics, training history, and skill improvement trends.',
          videoUrl: '/help/videos/dashboard'
        }
      ]
    },
    {
      id: 'video-analysis',
      title: 'Video Analysis',
      icon: <Video className="w-5 h-5" />,
      description: 'Everything about video upload and AI analysis',
      articles: [
        {
          title: 'Video Upload Requirements',
          description: 'Supported formats, size limits, and best practices',
          content: 'Upload videos in MP4, AVI, MOV, WMV, or FLV format. Maximum file size is 500MB. For best results, use well-lit videos with clear view of the player.',
          videoUrl: null
        },
        {
          title: 'AI Analysis Features',
          description: 'What our AI can detect and analyze',
          content: 'Our AI analyzes shooting mechanics, movement patterns, player positioning, and provides detailed feedback for improvement.',
          videoUrl: '/help/videos/ai-features'
        },
        {
          title: 'Understanding Analysis Results',
          description: 'How to interpret your video analysis reports',
          content: 'Analysis results include shooting percentages, movement efficiency, and personalized improvement recommendations.',
          videoUrl: '/help/videos/results'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Metrics',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Understanding your performance data',
      articles: [
        {
          title: 'Performance Metrics Explained',
          description: 'Learn about shooting accuracy, dribbling speed, and other key metrics',
          content: 'Performance metrics include shooting percentages, movement speed, vertical jump measurements, and overall skill ratings.',
          videoUrl: null
        },
        {
          title: 'Reading Skill Trends',
          description: 'How to interpret your improvement over time',
          content: 'Skill trends show your progress across different areas like shooting, dribbling, and defensive skills over time.',
          videoUrl: '/help/videos/trends'
        },
        {
          title: 'Team vs Player Analytics',
          description: 'Understanding the difference between team and player analytics',
          content: 'Team accounts focus on overall team performance, while player accounts provide individual skill analysis.',
          videoUrl: null
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <Settings className="w-5 h-5" />,
      description: 'Common issues and their solutions',
      articles: [
        {
          title: 'Video Upload Issues',
          description: 'Problems uploading videos and how to fix them',
          content: 'Common upload issues include file format errors, size limits, and network problems. Try converting to MP4 format or reducing file size.',
          videoUrl: null
        },
        {
          title: 'Analysis Not Starting',
          description: 'When video analysis gets stuck or fails',
          content: 'If analysis is not starting, check your internet connection and try re-uploading the video in a different format.',
          videoUrl: null
        },
        {
          title: 'Dashboard Display Problems',
          description: 'Fixing display and loading issues',
          content: 'Clear your browser cache and cookies, or try using a different browser if dashboard elements are not displaying correctly.',
          videoUrl: null
        }
      ]
    }
  ];

  const faqs = [
    {
      question: 'What video formats are supported?',
      answer: 'We support MP4, AVI, MOV, WMV, and FLV formats. For best results, we recommend MP4 with H.264 encoding.',
      category: 'video-analysis'
    },
    {
      question: 'How long does video analysis take?',
      answer: 'Analysis typically takes 2-5 minutes depending on video length. You\'ll receive a notification when it\'s complete.',
      category: 'video-analysis'
    },
    {
      question: 'Can I analyze multiple players in one video?',
      answer: 'Yes! Our AI can detect and analyze multiple players in the same video. Each player will be tracked individually.',
      category: 'video-analysis'
    },
    {
      question: 'What metrics are tracked?',
      answer: 'We track shooting accuracy, dribbling speed, vertical jump, movement efficiency, and overall skill ratings.',
      category: 'analytics'
    },
    {
      question: 'How accurate is the AI analysis?',
      answer: 'Our AI has been trained on thousands of basketball videos and achieves 95%+ accuracy in shot detection and movement analysis.',
      category: 'video-analysis'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes, you can export your analytics data as CSV files from the analytics dashboard.',
      category: 'analytics'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. All videos and personal data are encrypted and stored securely. We never share your data without permission.',
      category: 'security'
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime from your account settings. Your access will continue until the end of your billing period.',
      category: 'account'
    },
    {
      question: 'Can I switch between team and player accounts?',
      answer: 'Currently, each account type is separate. You would need to create a new account if you want to switch roles.',
      category: 'account'
    }
  ];

  const filteredCategories = helpCategories.filter(category => {
    const categoryContent = category.title.toLowerCase() + ' ' + category.description.toLowerCase();
    return categoryContent.includes(searchTerm.toLowerCase());
  });

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-purple-950'
        : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Help & Support
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Find answers to common questions and learn how to get the most out of BAKO Basketball Analytics
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search for help articles, FAQs, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <MessageCircle className={`w-8 h-8 mx-auto mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Live Chat</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Chat with our support team in real-time
            </p>
            <button className={`inline-flex items-center px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}>
              Start Chat
            </button>
          </div>

          <div className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <Mail className={`w-8 h-8 mx-auto mb-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Support</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Get help via email within 24 hours
            </p>
            <a 
              href="mailto:support@bako-basketball.com"
              className={`inline-flex items-center px-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } transition-colors`}
            >
              Send Email
            </a>
          </div>

          <div className={`p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <Phone className={`w-8 h-8 mx-auto mb-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Phone Support</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Call us for immediate assistance
            </p>
            <a 
              href="tel:+1-800-BAKO-HELP"
              className={`inline-flex items-center px-4 py-2 rounded-lg ${
                isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              } transition-colors`}
            >
              Call Now
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Help Categories */}
          <div className="lg:col-span-2">
            <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Help Categories
            </h2>
            
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.id} className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                  <button
                    onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                    className={`w-full p-4 text-left flex items-center justify-between ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {category.title}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeCategory === category.id ? 'rotate-90' : ''
                    } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </button>
                  
                  {/* Expanded Articles */}
                  {activeCategory === category.id && (
                    <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      {category.articles.map((article, index) => (
                        <div key={index} className={`p-4 ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        } ${index < category.articles.length - 1 ? 'border-b' : ''}`}>
                          <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {article.title}
                          </h4>
                          <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {article.description}
                          </p>
                          {article.content && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {article.content}
                            </p>
                          )}
                          {article.videoUrl && (
                            <a
                              href={article.videoUrl}
                              className={`inline-flex items-center text-sm font-medium mt-3 ${
                                isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
                              } transition-colors`}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Watch Tutorial
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Frequently Asked Questions
            </h2>
            
            <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
              <div className="max-h-96 overflow-y-auto">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className={`border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  } ${index < filteredFaqs.length - 1 ? '' : 'border-b-0'}`}>
                    <button
                      onClick={() => toggleFaq(index)}
                      className={`w-full p-4 text-left ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {faq.question}
                        </h4>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          expandedFaq === index ? 'rotate-90' : ''
                        } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                    </button>
                    
                    {expandedFaq === index && (
                      <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className={`mt-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
          <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Additional Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/help/user-guide"
              className={`p-4 rounded-lg text-center ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <FileText className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                User Guide
              </span>
            </a>

            <a
              href="/help/video-tutorials"
              className={`p-4 rounded-lg text-center ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Video className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Video Tutorials
              </span>
            </a>

            <a
              href="/help/api-docs"
              className={`p-4 rounded-lg text-center ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <ExternalLink className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                API Docs
              </span>
            </a>

            <a
              href="/help/community"
              className={`p-4 rounded-lg text-center ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <Users className={`w-6 h-6 mx-auto mb-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Community
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
