import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, TrendingUp, Target, Lightbulb } from 'lucide-react';
import type { FormQualityIssue } from '../types';

interface FormQualityCardProps {
    formQuality: {
        overall_score: number;
        quality_rating: string;
        issues: FormQualityIssue[];
        strengths: string[];
    };
    actionType?: string;
}

export default function FormQualityCard({ formQuality, actionType }: FormQualityCardProps) {
    const { overall_score, quality_rating, issues, strengths } = formQuality;

    // Determine color scheme based on rating
    const getRatingConfig = () => {
        switch (quality_rating) {
            case 'excellent':
                return {
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    textColor: 'text-green-800 dark:text-green-200',
                    icon: CheckCircle2,
                    iconColor: 'text-green-500',
                    title: '🎉 Excellent Form!',
                };
            case 'good':
                return {
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                    textColor: 'text-blue-800 dark:text-blue-200',
                    icon: CheckCircle2,
                    iconColor: 'text-blue-500',
                    title: '👍 Good Form',
                };
            case 'needs_improvement':
                return {
                    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                    borderColor: 'border-orange-200 dark:border-orange-800',
                    textColor: 'text-orange-800 dark:text-orange-200',
                    icon: AlertCircle,
                    iconColor: 'text-orange-500',
                    title: '⚠️ Form Needs Improvement',
                };
            case 'poor':
                return {
                    bgColor: 'bg-red-50 dark:bg-red-900/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    textColor: 'text-red-800 dark:text-red-200',
                    icon: AlertCircle,
                    iconColor: 'text-red-500',
                    title: '🚨 Poor Form - Needs Work',
                };
            default:
                return {
                    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
                    borderColor: 'border-gray-200 dark:border-gray-800',
                    textColor: 'text-gray-800 dark:text-gray-200',
                    icon: Target,
                    iconColor: 'text-gray-500',
                    title: 'Form Assessment',
                };
        }
    };

    const config = getRatingConfig();
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className=\"bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6\"
                >
                {/* Header */ }
                < div className =\"flex items-center justify-between mb-6\">
                    < div >
                    <h2 className=\"text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2\">
                        < Target className =\"w-6 h-6 text-blue-500\" />
            Form Quality Assessment
          </h2 >
        { actionType && (
            <p className=\"text-sm text-gray-600 dark:text-gray-400 mt-1\">
              Analysis for: <span className=\"font-semibold capitalize\">{actionType.replace(/_/g, ' ')}</span>
            </p >
          )
}
        </div >
      </div >

    {/* Overall Score */ }
    < div className = {`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4 mb-6`}>
        <div className=\"flex items-center justify-between mb-3\">
            < div className =\"flex items-center gap-2\">
                < Icon className = {`w-6 h-6 ${config.iconColor}`} />
                    < h3 className = {`text-lg font-bold ${config.textColor}`}>
                        { config.title }
            </h3 >
          </div >
    <div className=\"text-right\">
        < div className =\"text-3xl font-bold text-gray-900 dark:text-white\">
{ (overall_score * 100).toFixed(0) }%
            </div >
    <div className=\"text-xs text-gray-500 dark:text-gray-400\">
              Overall Score
            </div >
          </div >
        </div >

    {/* Progress Bar */ }
    < div className =\"w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden\">
        < motion.div
initial = {{ width: 0 }}
animate = {{ width: `${overall_score * 100}%` }}
transition = {{ duration: 1, ease: 'easeOut' }}
className = {`h-full ${overall_score >= 0.85
        ? 'bg-green-500'
        : overall_score >= 0.70
            ? 'bg-blue-500'
            : overall_score >= 0.50
                ? 'bg-orange-500'
                : 'bg-red-500'
    }`}
          />
        </div >
      </div >

    {/* Issues Section */ }
{
    issues.length > 0 && (
        <div className=\"mb-6\">
            < h3 className =\"text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2\">
                < AlertCircle className =\"w-5 h-5 text-red-500\" />
            Issues to Fix({ issues.length })
          </h3 >
        <div className=\"space-y-3\">
    {
        issues.map((issue, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className=\"bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4\"
        >
        <div className=\"flex items-start justify-between mb-2\">
        < div className =\"flex items-center gap-2\">
        < AlertCircle className =\"w-5 h-5 text-red-500 flex-shrink-0 mt-0.5\" />
        < h4 className =\"font-semibold text-red-900 dark:text-red-100 capitalize\">
                      { issue.issue_type.replace(/_/g, ' ') }
                    </h4 >
                  </div >
            <span
                className={`px-2 py-1 rounded text-xs font-medium ${issue.severity === 'major'
                        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        : issue.severity === 'moderate'
                            ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                            : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                    }`}
            >
                {issue.severity}
            </span>
                </div >

            <p className=\"text-sm text-red-700 dark:text-red-300 mb-2\">
                  { issue.description }
                </p >

            {(issue.current_value !== undefined || issue.optimal_value) && (
                <div className=\"text-xs text-red-600 dark:text-red-400 mb-2 flex items-center gap-4\">
                    {
                issue.current_value !== undefined && (
                    <span>
                        <strong>Current:</strong> {issue.current_value}
                    </span>
                )
            }
                    {
                issue.optimal_value && (
                    <span>
                        <strong>Target:</strong> {issue.optimal_value}
                    </span>
                )
            }
                  </div >
                )
    }

    {
        issue.recommendation && (
            <div className=\"bg-white dark:bg-gray-800 rounded p-3 mt-2\">
                < div className =\"flex items-start gap-2\">
                    < Lightbulb className =\"w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5\" />
                        < div >
                        <div className=\"text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1\">
                          Drill Recommendation:
                        </div >
            <div className=\"text-xs text-gray-600 dark:text-gray-400\">
        { issue.recommendation }
                        </div >
                      </div >
                    </div >
                  </div >
                )
    }
              </motion.div >
            ))
}
          </div >
        </div >
      )}

{/* Strengths Section */ }
{
    strengths.length > 0 && (
        <div>
          <h3 className=\"text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2\">
            <TrendingUp className=\"w-5 h-5 text-green-500\" />
            Strengths ({strengths.length})
          </h3>
          <div className=\"bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4\">
        < ul className =\"space-y-2\">
    {
        strengths.map((strength, index) => (
            <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className=\"flex items-start gap-2 text-sm text-green-700 dark:text-green-300\"
        >
        <CheckCircle2 className=\"w-5 h-5 text-green-500 flex-shrink-0 mt-0.5\" />
        < span > { strength }</span >
                </motion.li >
              ))
    }
            </ul >
          </div >
        </div >
      )
}

{/* No Issues/Strengths Message */ }
{
    issues.length === 0 && strengths.length === 0 && (
        <div className=\"text-center py-8 text-gray-500 dark:text-gray-400\">
            < Target className =\"w-12 h-12 mx-auto mb-2 opacity-50\" />
                < p > No detailed form analysis available for this action.</p >
        </div >
      )
}
    </motion.div >
  );
}
