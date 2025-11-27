import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, TrendingUp, ChevronRight } from 'lucide-react';
import type { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendations: Recommendation[];
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  excellent: CheckCircle,
  improvement: TrendingUp,
  focus: AlertTriangle,
  warning: Info,
  positive: CheckCircle,
  strength: CheckCircle,
  intro: Info,
  info: Info,
};

const COLOR_MAP: Record<string, string> = {
  excellent: 'from-green-500 to-emerald-500',
  improvement: 'from-blue-500 to-cyan-500',
  focus: 'from-yellow-500 to-orange-500',
  warning: 'from-red-500 to-pink-500',
  positive: 'from-green-500 to-emerald-500',
  strength: 'from-green-500 to-emerald-500',
  intro: 'from-blue-500 to-cyan-500',
  info: 'from-blue-500 to-cyan-500',
};

const BG_MAP: Record<string, string> = {
  excellent: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  improvement: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  focus: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  warning: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  positive: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  strength: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  intro: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const PRIORITY_COLORS = {
  high: 'text-red-600 dark:text-red-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-green-600 dark:text-green-400',
};

export default function RecommendationCard({ recommendations }: RecommendationCardProps) {
  // Safety check
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            💡 AI-Generated Recommendations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No recommendations available at this time.
          </p>
        </div>
      </motion.div>
    );
  }

  // Sort by priority
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          💡 AI-Generated Recommendations
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Personalized insights based on your performance analysis
        </p>
      </div>

      <div className="space-y-4">
        {sortedRecommendations.map((recommendation, index) => {
          const Icon = ICON_MAP[recommendation.type] || Info; // Fallback to Info icon
          const colorClass = COLOR_MAP[recommendation.type] || COLOR_MAP.focus;
          const bgClass = BG_MAP[recommendation.type] || BG_MAP.focus;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
              className={`border rounded-xl p-5 ${bgClass} transition-all duration-200 cursor-pointer group`}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {recommendation.title}
                    </h4>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${PRIORITY_COLORS[recommendation.priority]} bg-white dark:bg-gray-800 border border-current`}>
                      {recommendation.priority}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {recommendation.message}
                  </p>

                  {/* Action Button */}
                  <button className="flex items-center space-x-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group-hover:translate-x-1 duration-200">
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress indicator for focus items */}
              {recommendation.priority === 'high' && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span>Priority Action</span>
                    <span className="font-semibold">Focus Area</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${colorClass}`}
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      {sortedRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: sortedRecommendations.length * 0.1 + 0.2 }}
          className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Action Plan Summary
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {sortedRecommendations.filter(r => r.priority === 'high').length} high priority •{' '}
                {sortedRecommendations.filter(r => r.priority === 'medium').length} medium •{' '}
                {sortedRecommendations.filter(r => r.priority === 'low').length} low priority
              </p>
            </div>
            <button className="btn-primary text-sm py-2 px-4">
              Create Training Plan
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

