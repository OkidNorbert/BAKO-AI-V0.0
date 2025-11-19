import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
import type { ActionProbabilities } from '../types';

interface ActionResultProps {
  action: string;
  confidence: number;
  probabilities: ActionProbabilities;
}

const ACTION_COLORS: Record<string, string> = {
  // Shooting types
  free_throw: 'from-orange-500 to-red-500',
  two_point_shot: 'from-orange-600 to-red-600',
  three_point_shot: 'from-yellow-500 to-orange-500',
  layup: 'from-red-500 to-pink-500',
  dunk: 'from-purple-600 to-red-600',
  
  // Ball handling
  dribbling: 'from-blue-500 to-cyan-500',
  passing: 'from-green-500 to-emerald-500',
  
  // Movement
  defense: 'from-purple-500 to-pink-500',
  running: 'from-indigo-500 to-blue-500',
  walking: 'from-teal-500 to-cyan-500',
  
  // Game actions
  blocking: 'from-red-600 to-orange-600',
  picking: 'from-yellow-600 to-orange-600',
  
  // Other
  ball_in_hand: 'from-amber-500 to-yellow-500',
  idle: 'from-gray-500 to-slate-500',
};

const ACTION_EMOJIS: Record<string, string> = {
  // Shooting types
  free_throw: '🎯',
  two_point_shot: '🏀',
  three_point_shot: '🌟',
  layup: '🏃‍♂️🏀',
  dunk: '💪🏀',
  
  // Ball handling
  dribbling: '⛹️',
  passing: '🤝',
  
  // Movement
  defense: '🛡️',
  running: '🏃',
  walking: '🚶',
  
  // Game actions
  blocking: '✋',
  picking: '🧱',
  
  // Other
  ball_in_hand: '🏀',
  idle: '🧍',
};

export default function ActionResult({ action, confidence, probabilities }: ActionResultProps) {
  const sortedActions = Object.entries(probabilities)
    .sort(([, a], [, b]) => b - a);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-6"
    >
      {/* Main Action */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl text-4xl"
        >
          {ACTION_EMOJIS[action.toLowerCase() as keyof typeof ACTION_EMOJIS] || '🏀'}
        </motion.div>

        <div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Action Detected
            </h3>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 uppercase">
            {action}
          </h2>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            {(confidence * 100).toFixed(1)}%
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-500 dark:text-gray-400">Confidence</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                High
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Bars */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Probability Distribution
        </h4>
        {sortedActions.map(([actionName, probability], index) => (
          <motion.div
            key={actionName}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-xl">
                  {ACTION_EMOJIS[actionName as keyof typeof ACTION_EMOJIS]}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {actionName}
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {(probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${ACTION_COLORS[actionName as keyof typeof ACTION_COLORS] || 'from-gray-400 to-gray-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${probability * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confidence Indicator */}
      <div className={`p-4 rounded-lg border-l-4 ${
        confidence >= 0.9
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
          : confidence >= 0.7
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
          : 'bg-red-50 dark:bg-red-900/20 border-red-500'
      }`}>
        <p className="text-sm font-medium">
          {confidence >= 0.9
            ? '✅ Very confident prediction'
            : confidence >= 0.7
            ? '⚠️ Good prediction, but consider retaking video'
            : '❌ Low confidence - please upload a clearer video'}
        </p>
      </div>
    </motion.div>
  );
}

