import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Target,
  Users,
  Activity,
  Clock,
  RotateCcw
} from 'lucide-react';

const VideoPlayer = ({ videoSrc, analysisData, onTimeUpdate }) => {
  const { isDarkMode } = useTheme();
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedOverlay, setSelectedOverlay] = useState('players');
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* Mock data removed - using analysisData prop */
  const [playerPositions, setPlayerPositions] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (analysisData) {
      // Map backend events to player format
      if (analysisData.events && Array.isArray(analysisData.events)) {
        setEvents(analysisData.events.map(e => ({
          time: e.timestamp || e.frame / 30, // Fallback to frame count / 30fps
          type: e.type || 'unknown',
          player: e.player_id || 'Unknown',
          result: e.description || e.result || 'completed'
        })));
      }

      // If analysisData has tracks/positions, set them here
      // For now, assuming standard analysis result doesn't include frame-by-frame track data
      // setPlayerPositions([]); 
    }
  }, [analysisData]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }

      // Update player positions based on time if tracks available
      // updatePlayerPositions(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const updatePlayerPositions = (time) => {
    // Real implementation would interpolate positions from tracking data
    // For now, no operation if no tracking data provided
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (video) {
      const newTime = (e.target.value / 100) * duration;
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (video) {
      const newVolume = e.target.value / 100;
      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackSpeed = (speed) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(duration, currentTime + 10);
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, currentTime - 10);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentEvent = () => {
    return events.find(event => Math.abs(event.time - currentTime) < 2);
  };

  const getOverlayColor = (type) => {
    switch (type) {
      case 'players':
        return isDarkMode ? 'rgba(34, 197, 94, 0.8)' : 'rgba(22, 163, 74, 0.8)';
      case 'heatmap':
        return isDarkMode ? 'rgba(239, 68, 68, 0.6)' : 'rgba(220, 38, 38, 0.6)';
      case 'tracking':
        return isDarkMode ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)';
      default:
        return 'rgba(0, 0, 0, 0.5)';
    }
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-black'}`}>
      <div ref={containerRef} className="relative">
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-auto"
          onClick={togglePlayPause}
        />

        {/* Player Overlays */}
        {showOverlays && (
          <div className="absolute inset-0 pointer-events-none">
            {selectedOverlay === 'players' && (
              <>
                {playerPositions.map(player => (
                  <div
                    key={player.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${player.team === 'home'
                        ? 'bg-blue-500 border-white text-white'
                        : 'bg-red-500 border-white text-white'
                      }`}>
                      {player.number}
                    </div>
                    <div className={`text-xs mt-1 text-center font-medium ${player.team === 'home' ? 'text-blue-400' : 'text-red-400'
                      }`}>
                      P{player.id}
                    </div>
                  </div>
                ))}
              </>
            )}

            {selectedOverlay === 'heatmap' && (
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/30 to-transparent" />
            )}

            {selectedOverlay === 'tracking' && (
              <>
                {playerPositions.map(player => (
                  <div
                    key={player.id}
                    className="absolute w-16 h-16 border-2 border-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${player.x}%`,
                      top: `${player.y}%`,
                      borderStyle: 'dashed',
                      animation: 'pulse 2s infinite'
                    }}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Current Event Overlay */}
        {getCurrentEvent() && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`p-3 rounded-lg backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80 text-white' : 'bg-white/80 text-gray-900'
              }`}>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-orange-500" />
                <span className="font-medium">{getCurrentEvent().type.toUpperCase()}</span>
                <span className="text-sm">by {getCurrentEvent().player}</span>
                <span className={`text-sm px-2 py-1 rounded ${getCurrentEvent().result === 'made' || getCurrentEvent().result === 'completed'
                    ? 'bg-green-500 text-white'
                    : getCurrentEvent().result === 'blocked' || getCurrentEvent().result === 'lost'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                  {getCurrentEvent().result}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Video Controls */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent`}>
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / duration) * 100 || 0}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={skipBackward}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <SkipBack size={16} className="text-white" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                  <Pause size={20} className="text-white" />
                ) : (
                  <Play size={20} className="text-white" />
                )}
              </button>

              <button
                onClick={skipForward}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <SkipForward size={16} className="text-white" />
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX size={16} className="text-white" />
                  ) : (
                    <Volume2 size={16} className="text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Playback Speed */}
              <select
                value={playbackSpeed}
                onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
                className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                  }`}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              {/* Overlay Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`p-2 rounded-full transition-colors ${showOverlays ? 'bg-white/20' : 'bg-white/10'
                    }`}
                >
                  <Target size={16} className="text-white" />
                </button>

                {showOverlays && (
                  <select
                    value={selectedOverlay}
                    onChange={(e) => setSelectedOverlay(e.target.value)}
                    className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                      }`}
                  >
                    <option value="players">Players</option>
                    <option value="heatmap">Heatmap</option>
                    <option value="tracking">Tracking</option>
                  </select>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <Maximize size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
