import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Basketball,
  Trophy,
  Target,
  Activity,
  TrendingUp,
  Zap,
  Star,
  Medal,
  Award,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';

const BasketballAnimations = ({ type, size = 'medium', className = '' }) => {
  const { isDarkMode } = useTheme();
  
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24'
  };

  const animations = {
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    ping: 'animate-ping',
    float: 'animate-float'
  };

  const renderBasketballIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.bounce} ${className}`}>
      <Basketball className={`w-full h-full ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
    </div>
  );

  const renderTrophyIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.pulse} ${className}`}>
      <Trophy className={`w-full h-full ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
    </div>
  );

  const renderTargetIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.ping} ${className}`}>
      <Target className={`w-full h-full ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
    </div>
  );

  const renderActivityIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.spin} ${className}`}>
      <Activity className={`w-full h-full ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
    </div>
  );

  const renderTrendingIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.float} ${className}`}>
      <TrendingUp className={`w-full h-full ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
    </div>
  );

  const renderZapIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.pulse} ${className}`}>
      <Zap className={`w-full h-full ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
    </div>
  );

  const renderStarIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.ping} ${className}`}>
      <Star className={`w-full h-full ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
    </div>
  );

  const renderMedalIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.bounce} ${className}`}>
      <Medal className={`w-full h-full ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
    </div>
  );

  const renderAwardIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.pulse} ${className}`}>
      <Award className={`w-full h-full ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
    </div>
  );

  const renderUsersIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.float} ${className}`}>
      <Users className={`w-full h-full ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
    </div>
  );

  const renderClockIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.pulse} ${className}`}>
      <Clock className={`w-full h-full ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
    </div>
  );

  const renderChartIcon = () => (
    <div className={`${sizeClasses[size]} ${animations.bounce} ${className}`}>
      <BarChart3 className={`w-full h-full ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
    </div>
  );

  const renderBasketballCourt = () => (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Basketball Court */}
      <div className={`absolute inset-0 rounded-lg border-2 ${
        isDarkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-500 bg-orange-100'
      }`}>
        {/* Court Lines */}
        <div className={`absolute top-1/2 left-0 right-0 h-0.5 ${
          isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
        }`} />
        <div className={`absolute top-0 bottom-0 left-1/2 w-0.5 ${
          isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
        }`} />
        <div className={`absolute top-0 bottom-0 right-1/2 w-0.5 ${
          isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
        }`} />
        <div className={`absolute bottom-1/2 left-0 right-0 h-0.5 ${
          isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
        }`} />
        
        {/* Center Circle */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 rounded-full border-2 ${
          isDarkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-500 bg-orange-100'
        }`} />
        
        {/* Free Throw Circles */}
        <div className={`absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-1/6 h-1/6 rounded-full border-2 ${
          isDarkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-500 bg-orange-100'
        }`} />
        <div className={`absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-1/6 h-1/6 rounded-full border-2 ${
          isDarkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-500 bg-orange-100'
        }`} />
        <div className={`absolute bottom-1/4 left-1/4 transform -translate-x-1/2 translate-y-1/2 w-1/6 h-1/6 rounded-full border-2 ${
          isDarkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-500 bg-orange-100'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 w-1/6 h-1/6 rounded-full border-2 ${
          isDarkMode ? 'border-orange-600 bg-orange-900/20' : 'border-orange-500 bg-orange-100'
        }`} />
      </div>
      
      {/* Animated Basketball */}
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${animations.bounce}`}>
        <Basketball className={`w-1/3 h-1/3 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
      </div>
    </div>
  );

  const renderShootingAnimation = () => (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Hoop */}
      <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-1/6 border-b-4 border-l-2 border-r-2 rounded-b-lg ${
        isDarkMode ? 'border-orange-600' : 'border-orange-500'
      }`}>
        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-1/4 h-1/8 rounded-full ${
          isDarkMode ? 'bg-orange-600' : 'bg-orange-500'
        }`} />
      </div>
      
      {/* Ball */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${animations.bounce}`}>
        <Basketball className={`w-1/4 h-1/4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
      </div>
      
      {/* Trajectory Line */}
      <div className={`absolute top-1/3 left-1/2 transform -translate-x-1/2 w-0.5 h-1/3 origin-top rotate-45 ${
        isDarkMode ? 'bg-orange-600/50' : 'bg-orange-500/50'
      }`} />
    </div>
  );

  const renderDribblingAnimation = () => (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Player */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2`}>
        <div className={`w-1/6 h-1/4 rounded-t-full ${
          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
        }`} />
        <div className={`w-1/8 h-1/8 rounded-full ${
          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
        } mx-auto mt-1`} />
      </div>
      
      {/* Basketball */}
      <div className={`absolute bottom-1/3 left-1/2 transform -translate-x-1/2 ${animations.bounce}`}>
        <Basketball className={`w-1/6 h-1/6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
      </div>
      
      {/* Motion Lines */}
      <div className={`absolute bottom-1/2 left-1/2 transform -translate-x-1/2 w-1/3 h-0.5 border-t-2 border-dashed ${
        isDarkMode ? 'border-blue-600' : 'border-blue-500'
      }`} />
    </div>
  );

  const renderProgressRing = (percentage) => (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 36 36">
          <path
            className={`${
              isDarkMode ? 'text-gray-700' : 'text-gray-300'
            }`}
            fill="none"
            strokeWidth="3"
            stroke="currentColor"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.9155 15.9155 0 1 15.9155 15.9155 0"
          />
          <path
            className={`${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`}
            fill="none"
            strokeWidth="3"
            stroke="currentColor"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.9155 15.9155 0 1 15.9155 15.9155 0"
            style={{
              transition: 'stroke-dasharray 0.5s ease-in-out',
              animation: 'progress 2s ease-in-out infinite'
            }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <span className="text-xs font-bold">{percentage}%</span>
        </div>
      </div>
    </div>
  );

  const renderAchievementBadge = (badge) => (
    <div className={`${sizeClasses[size]} ${animations.bounce} ${className}`}>
      <div className={`relative w-full h-full rounded-full border-2 ${
        isDarkMode ? 'border-yellow-600 bg-yellow-900/20' : 'border-yellow-500 bg-yellow-100'
      }`}>
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              {badge.icon}
            </div>
            <div className={`text-xs font-medium mt-1 ${
              isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
            }`}>
              {badge.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'basketball':
      return renderBasketballIcon();
    case 'trophy':
      return renderTrophyIcon();
    case 'target':
      return renderTargetIcon();
    case 'activity':
      return renderActivityIcon();
    case 'trending':
      return renderTrendingIcon();
    case 'zap':
      return renderZapIcon();
    case 'star':
      return renderStarIcon();
    case 'medal':
      return renderMedalIcon();
    case 'award':
      return renderAwardIcon();
    case 'users':
      return renderUsersIcon();
    case 'clock':
      return renderClockIcon();
    case 'chart':
      return renderChartIcon();
    case 'court':
      return renderBasketballCourt();
    case 'shooting':
      return renderShootingAnimation();
    case 'dribbling':
      return renderDribblingAnimation();
    case 'progress':
      return renderProgressRing(75);
    case 'achievement':
      return renderAchievementBadge({
        icon: '🏀',
        name: 'Ball Handler'
      });
    default:
      return renderBasketballIcon();
  }
};

export default BasketballAnimations;
