import { useState } from 'react';
import { motion } from 'framer-motion';

interface BakoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function BakoLogo({ className = '', size = 'md', showText = true }: BakoLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const sizeMap = {
    sm: { width: 32, height: 32, fontSize: 'text-xl' },
    md: { width: 48, height: 48, fontSize: 'text-2xl' },
    lg: { width: 64, height: 64, fontSize: 'text-3xl' }
  };

  const dimensions = sizeMap[size];

  const handleInteraction = () => {
    setIsHovered(true);
    setIsTouched(true);
    setTimeout(() => {
      setIsHovered(false);
      setIsTouched(false);
    }, 600);
  };

  return (
    <div 
      className={`flex items-center gap-3 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleInteraction}
    >
      {/* Logo SVG */}
      <motion.div
        className="relative"
        animate={{
          scale: isHovered || isTouched ? 1.1 : 1,
          rotate: isHovered || isTouched ? [0, -5, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut"
        }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 120 120"
          className="cursor-pointer"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="55"
            fill="url(#bakoGradient)"
            stroke="url(#bakoStroke)"
            strokeWidth="2"
            animate={{
              scale: isHovered || isTouched ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="bakoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="bakoStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>

          {/* Basketball Icon - Split Animation */}
          <g>
            {/* Left half of basketball */}
            <motion.g
              animate={{
                x: isHovered || isTouched ? -12 : 0,
                rotate: isHovered || isTouched ? -20 : 0,
                opacity: isHovered || isTouched ? 0.8 : 1,
              }}
              transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1] // Bouncy ease
              }}
            >
              <path
                d="M 30 60 Q 30 40, 50 40 Q 60 35, 60 50 Q 60 65, 50 70 Q 40 75, 30 70 Z"
                fill="white"
                opacity="0.95"
              />
              <line
                x1="40"
                y1="50"
                x2="50"
                y2="60"
                stroke="#1f2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="40"
                y1="70"
                x2="50"
                y2="60"
                stroke="#1f2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </motion.g>
            
            {/* Right half of basketball */}
            <motion.g
              animate={{
                x: isHovered || isTouched ? 12 : 0,
                rotate: isHovered || isTouched ? 20 : 0,
                opacity: isHovered || isTouched ? 0.8 : 1,
              }}
              transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1] // Bouncy ease
              }}
            >
              <path
                d="M 90 60 Q 90 40, 70 40 Q 60 35, 60 50 Q 60 65, 70 70 Q 80 75, 90 70 Z"
                fill="white"
                opacity="0.95"
              />
              <line
                x1="80"
                y1="50"
                x2="70"
                y2="60"
                stroke="#1f2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="80"
                y1="70"
                x2="70"
                y2="60"
                stroke="#1f2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </motion.g>

          </g>

          {/* AI Sparkles - Appear on hover */}
          {(isHovered || isTouched) && (
            <>
              <motion.circle
                cx="20"
                cy="30"
                r="3"
                fill="#fbbf24"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: 0.1 }}
              />
              <motion.circle
                cx="100"
                cy="30"
                r="3"
                fill="#60a5fa"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              <motion.circle
                cx="20"
                cy="90"
                r="3"
                fill="#34d399"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
              <motion.circle
                cx="100"
                cy="90"
                r="3"
                fill="#f472b6"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, delay: 0.4 }}
              />
            </>
          )}
        </svg>
      </motion.div>

      {/* Text */}
      {showText && (
        <motion.span
          className={`font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ${dimensions.fontSize} dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400`}
          animate={{
            scale: isHovered || isTouched ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          Bako
        </motion.span>
      )}
    </div>
  );
}

