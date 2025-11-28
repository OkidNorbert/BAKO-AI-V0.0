import { motion } from 'framer-motion';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { PerformanceMetrics } from '../types';

interface RadarChartProps {
  metrics: PerformanceMetrics;
}

export default function RadarChartComponent({ metrics }: RadarChartProps) {
  // Prepare data for radar chart
  const data = [
    {
      metric: 'Jump',
      value: (metrics.jump_height / 1.0) * 100, // Normalize to 100
      fullMark: 100,
    },
    {
      metric: 'Speed',
      value: (metrics.movement_speed / 10.0) * 100, // Normalize to 100
      fullMark: 100,
    },
    {
      metric: 'Form',
      value: metrics.form_score * 100,
      fullMark: 100,
    },
    {
      metric: 'Reaction',
      value: Math.max(0, 100 - (metrics.reaction_time * 100)), // Lower is better, invert
      fullMark: 100,
    },
    {
      metric: 'Stability',
      value: metrics.pose_stability * 100,
      fullMark: 100,
    },
    {
      metric: 'Efficiency',
      value: metrics.energy_efficiency * 100,
      fullMark: 100,
    },
  ];

  // Calculate overall score
  const overallScore = data.reduce((sum, item) => sum + item.value, 0) / data.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📈 Performance Profile
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Comprehensive view of all performance metrics
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Radar Chart */}
        <div className="w-full lg:w-2/3">
          <ResponsiveContainer width="100%" height={400}>
            <RechartsRadar data={data}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#64748B', fontSize: 14, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#FF6B00"
                fill="#FF6B00"
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </RechartsRadar>
          </ResponsiveContainer>
        </div>

        {/* Score Summary */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Overall Score */}
          <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Overall Score
            </p>
            <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {overallScore.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              out of 100
            </p>
          </div>

          {/* Individual Scores */}
          <div className="space-y-3">
            {data.map((item, index) => (
              <motion.div
                key={item.metric}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.metric}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-10 text-right">
                    {item.value.toFixed(0)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Performance Level */}
          <div className={`p-4 rounded-lg border-l-4 ${
            overallScore >= 85
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : overallScore >= 70
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
              : 'bg-red-50 dark:bg-red-900/20 border-red-500'
          }`}>
            <p className="text-sm font-semibold mb-1">
              {overallScore >= 85
                ? '🌟 Excellent Performance!'
                : overallScore >= 70
                ? '👍 Good Performance'
                : '💪 Room for Improvement'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {overallScore >= 85
                ? 'You\'re performing at an elite level across all metrics.'
                : overallScore >= 70
                ? 'Solid performance with some areas to focus on.'
                : 'Focus on the lower-scoring areas for significant gains.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

