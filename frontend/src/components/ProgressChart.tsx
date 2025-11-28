import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import type { HistoricalData } from '../types';

interface ProgressChartProps {
  data: HistoricalData[];
}

export default function ProgressChart({ data }: ProgressChartProps) {
  // Prepare data for chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    jump: item.metrics.jump_height,
    speed: item.metrics.movement_speed,
    form: item.metrics.form_score,
    stability: item.metrics.pose_stability,
  }));

  // Calculate trends
  const calculateTrend = (key: keyof typeof chartData[0]) => {
    if (chartData.length < 2) return 0;
    const first = chartData[0][key] as number;
    const last = chartData[chartData.length - 1][key] as number;
    return ((last - first) / first) * 100;
  };

  const trends = {
    jump: calculateTrend('jump'),
    speed: calculateTrend('speed'),
    form: calculateTrend('form'),
    stability: calculateTrend('stability'),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            📊 Progress Over Time
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Last {data.length} sessions</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track your improvement across multiple training sessions
        </p>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Jump Height', key: 'jump', color: 'orange', unit: 'm' },
          { label: 'Speed', key: 'speed', color: 'blue', unit: 'm/s' },
          { label: 'Form Score', key: 'form', color: 'green', unit: '/1' },
          { label: 'Stability', key: 'stability', color: 'purple', unit: '/1' },
        ].map((metric, index) => {
          const trend = trends[metric.key as keyof typeof trends];
          const isPositive = trend > 0;

          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {metric.label}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(chartData[chartData.length - 1]?.[metric.key as keyof typeof chartData[0]] as number)?.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.unit}
                </span>
              </div>
              <div className={`flex items-center space-x-1 mt-2 text-xs font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Line Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickLine={{ stroke: '#CBD5E1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="jump"
              name="Jump Height (m)"
              stroke="#FF6B00"
              strokeWidth={3}
              dot={{ fill: '#FF6B00', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="speed"
              name="Speed (m/s)"
              stroke="#2196F3"
              strokeWidth={3}
              dot={{ fill: '#2196F3', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="form"
              name="Form Score"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="stability"
              name="Stability"
              stroke="#8B5CF6"
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
      >
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          📈 Progress Insights
        </h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {Object.entries(trends).map(([key, value]) => {
            if (Math.abs(value) > 5) {
              const isPositive = value > 0;
              return (
                <li key={key} className="flex items-center space-x-2">
                  <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                    {isPositive ? '↗' : '↘'}
                  </span>
                  <span>
                    Your <strong>{key}</strong> has {isPositive ? 'improved' : 'decreased'} by{' '}
                    <strong>{Math.abs(value).toFixed(1)}%</strong> over the last {data.length} sessions
                  </span>
                </li>
              );
            }
            return null;
          })}
        </ul>
      </motion.div>
    </motion.div>
  );
}

