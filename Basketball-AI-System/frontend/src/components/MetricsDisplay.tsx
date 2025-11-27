import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Activity, Target, Clock, Wind, Battery } from 'lucide-react';
import type { PerformanceMetrics } from '../types';

interface MetricsDisplayProps {
  metrics: PerformanceMetrics;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  trend?: number;
  color: string;
  delay: number;
}

function MetricCard({ icon, label, value, unit, trend, color, delay }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendText = () => {
    if (trend === undefined) return null;
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend}%`;
  };

  const getTrendColor = () => {
    if (trend === undefined) return 'text-gray-500';
    if (trend > 0) return 'text-green-600 dark:text-green-400';
    if (trend < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="metric-card group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-xs font-semibold ${getTrendColor()}`}>
              {getTrendText()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </p>
        <div className="flex items-baseline space-x-1">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          >
            {value}
          </motion.span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        </div>
      </div>

      {/* Progress bar based on value */}
      <div className="mt-3 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${color.replace('from-', 'from-').replace('to-', 'to-')}`}
          initial={{ width: 0 }}
          animate={{ width: '85%' }} // Adjust based on actual metric value
          transition={{ duration: 1, delay: delay + 0.2 }}
        />
      </div>
    </motion.div>
  );
}

export default function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  // Helper function to safely format numbers
  const safeFormat = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return value.toFixed(decimals);
  };

  // Core metrics (always shown)
  const coreMetrics = [
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      label: 'Jump Height',
      value: safeFormat(metrics.jump_height, 2),
      unit: 'm',
      trend: 8,
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: <Activity className="w-6 h-6 text-white" />,
      label: 'Movement Speed',
      value: safeFormat(metrics.movement_speed, 1),
      unit: 'm/s',
      trend: 12,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Target className="w-6 h-6 text-white" />,
      label: 'Form Score',
      value: safeFormat(metrics.form_score, 2),
      unit: '/1.0',
      trend: 5,
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      label: 'Reaction Time',
      value: safeFormat(metrics.reaction_time, 2),
      unit: 's',
      trend: -3,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Wind className="w-6 h-6 text-white" />,
      label: 'Pose Stability',
      value: safeFormat(metrics.pose_stability, 2),
      unit: '/1.0',
      trend: 6,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: <Battery className="w-6 h-6 text-white" />,
      label: 'Energy Efficiency',
      value: safeFormat(metrics.energy_efficiency, 2),
      unit: '/1.0',
      trend: 4,
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  // Enhanced biomechanics metrics (shown if available)
  const biomechanicsMetrics = [];
  
  if (metrics.elbow_angle !== undefined && metrics.elbow_angle !== null) {
    biomechanicsMetrics.push({
      icon: <Target className="w-6 h-6 text-white" />,
      label: 'Elbow Angle',
      value: safeFormat(metrics.elbow_angle, 1),
      unit: '°',
      color: 'from-red-500 to-orange-500',
    });
  }
  
  if (metrics.release_angle !== undefined && metrics.release_angle !== null) {
    biomechanicsMetrics.push({
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      label: 'Release Angle',
      value: safeFormat(metrics.release_angle, 1),
      unit: '°',
      color: 'from-yellow-500 to-orange-500',
    });
  }
  
  if (metrics.stability_score !== undefined && metrics.stability_score !== null) {
    biomechanicsMetrics.push({
      icon: <Wind className="w-6 h-6 text-white" />,
      label: 'Balance Score',
      value: safeFormat((metrics.stability_score * 100), 0),
      unit: '%',
      color: 'from-blue-500 to-indigo-500',
    });
  }
  
  if (metrics.smoothness_score !== undefined && metrics.smoothness_score !== null) {
    biomechanicsMetrics.push({
      icon: <Activity className="w-6 h-6 text-white" />,
      label: 'Movement Smoothness',
      value: safeFormat((metrics.smoothness_score * 100), 0),
      unit: '%',
      color: 'from-green-500 to-teal-500',
    });
  }
  
  if (metrics.follow_through_score !== undefined && metrics.follow_through_score !== null) {
    biomechanicsMetrics.push({
      icon: <Zap className="w-6 h-6 text-white" />,
      label: 'Follow-Through',
      value: safeFormat((metrics.follow_through_score * 100), 0),
      unit: '%',
      color: 'from-purple-500 to-pink-500',
    });
  }

  const metricsConfig = [...coreMetrics, ...biomechanicsMetrics];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            📊 Performance Metrics & Biomechanics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive analysis of your movement, form, and technique
          </p>
        </div>
      </div>
      
      {biomechanicsMetrics.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ✨ <strong>Enhanced Analysis:</strong> Biomechanics features detected. See detailed metrics below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricsConfig.map((metric, index) => (
          <MetricCard
            key={metric.label}
            {...metric}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-200 dark:border-primary-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Overall Performance Score
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on all metrics combined
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {safeFormat(
                ((metrics.form_score ?? 0) + (metrics.pose_stability ?? 0) + (metrics.energy_efficiency ?? 0)) / 3 * 100,
                0
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">out of 100</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

