import { motion } from 'framer-motion';
import { Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TimelineSegment } from '../types';

interface ActionTimelineProps {
  timeline: TimelineSegment[];
  totalDuration?: number;
}

const ACTION_COLORS: Record<string, string> = {
  free_throw: 'bg-orange-500',
  two_point_shot: 'bg-red-500',
  three_point_shot: 'bg-yellow-500',
  layup: 'bg-pink-500',
  dunk: 'bg-purple-500',
  dribbling: 'bg-blue-500',
  passing: 'bg-green-500',
  defense: 'bg-purple-600',
  running: 'bg-indigo-500',
  walking: 'bg-teal-500',
  blocking: 'bg-red-600',
  picking: 'bg-yellow-600',
  ball_in_hand: 'bg-amber-500',
  idle: 'bg-gray-500',
};

const ACTION_EMOJIS: Record<string, string> = {
  free_throw: '🎯',
  two_point_shot: '🏀',
  three_point_shot: '🌟',
  layup: '🏃‍♂️🏀',
  dunk: '💪🏀',
  dribbling: '⛹️',
  passing: '🤝',
  defense: '🛡️',
  running: '🏃',
  walking: '🚶',
  blocking: '✋',
  picking: '🧱',
  ball_in_hand: '🏀',
  idle: '🧍',
};

export default function ActionTimeline({ timeline, totalDuration }: ActionTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  const maxDuration = totalDuration || Math.max(...timeline.map(s => s.end_time));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityBadge = (rating?: string) => {
    if (!rating) return null;
    
    const badges = {
      excellent: { icon: CheckCircle2, color: 'text-green-500 bg-green-50 dark:bg-green-900/20', text: 'Excellent' },
      good: { icon: CheckCircle2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', text: 'Good' },
      needs_improvement: { icon: AlertCircle, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20', text: 'Needs Work' },
      poor: { icon: AlertCircle, color: 'text-red-500 bg-red-50 dark:bg-red-900/20', text: 'Poor' },
    };

    const badge = badges[rating as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Action Timeline
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            All actions detected in your video with form quality assessments
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {timeline.length} {timeline.length === 1 ? 'segment' : 'segments'}
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="mb-6">
        <div className="relative h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          {timeline.map((segment, index) => {
            const left = (segment.start_time / maxDuration) * 100;
            const width = ((segment.end_time - segment.start_time) / maxDuration) * 100;
            const actionLabel = segment.action.label.toLowerCase();
            const color = ACTION_COLORS[actionLabel] || 'bg-gray-500';
            
            return (
              <motion.div
                key={index}
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`absolute h-full ${color} opacity-80 hover:opacity-100 transition-opacity`}
                style={{ left: `${left}%` }}
                title={`${segment.action.label} (${formatTime(segment.start_time)} - ${formatTime(segment.end_time)})`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>0:00</span>
          <span>{formatTime(maxDuration)}</span>
        </div>
      </div>

      {/* Segments List */}
      <div className="space-y-4">
        {timeline.map((segment, index) => {
          const actionLabel = segment.action.label.toLowerCase();
          const emoji = ACTION_EMOJIS[actionLabel] || '🏀';
          const color = ACTION_COLORS[actionLabel] || 'bg-gray-500';
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-2xl`}>
                    {emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {segment.action.label.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {(segment.action.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                {getQualityBadge(segment.form_quality?.quality_rating)}
              </div>

              {/* Form Quality Details */}
              {segment.form_quality && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Form Score
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            segment.form_quality.overall_score >= 0.85
                              ? 'bg-green-500'
                              : segment.form_quality.overall_score >= 0.70
                              ? 'bg-blue-500'
                              : segment.form_quality.overall_score >= 0.50
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${segment.form_quality.overall_score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                        {(segment.form_quality.overall_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Issues */}
                  {segment.form_quality.issues.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                        Issues to Fix ({segment.form_quality.issues.length})
                      </h4>
                      <div className="space-y-2">
                        {segment.form_quality.issues.slice(0, 3).map((issue, i) => (
                          <div key={i} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="font-medium text-red-900 dark:text-red-100 capitalize">
                                {issue.issue_type.replace(/_/g, ' ')}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                issue.severity === 'major'
                                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                                  : issue.severity === 'moderate'
                                  ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                                  : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-red-700 dark:text-red-300 text-xs ml-6">
                              {issue.description}
                              {issue.current_value !== undefined && issue.optimal_value && (
                                <span className="ml-2">
                                  (Current: {issue.current_value}, Target: {issue.optimal_value})
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {segment.form_quality.strengths.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {segment.form_quality.strengths.map((strength, i) => (
                          <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Jump Height</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {segment.metrics.jump_height.toFixed(2)}m
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Speed</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {segment.metrics.movement_speed.toFixed(1)} m/s
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Stability</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {(segment.metrics.pose_stability * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

