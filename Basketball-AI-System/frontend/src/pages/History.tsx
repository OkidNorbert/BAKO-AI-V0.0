import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHistory } from '../services/api';
import type { HistoricalData } from '../types';
import ProgressChart from '../components/ProgressChart';

export default function History() {
    const [history, setHistory] = useState<HistoricalData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            const data = await getHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history:', err);
            setError('Failed to load analysis history');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/"
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Analysis History
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    View your past performance analyses
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                ) : history.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                    >
                        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No Analysis History
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Upload your first video to start tracking your performance
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                        >
                            Upload Video
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {/* Progress Chart */}
                        {history.length >= 2 && (
                            <ProgressChart data={history} />
                        )}

                        {/* History List */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Recent Sessions
                            </h2>
                            {history.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(item.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                                {item.action.replace(/_/g, ' ').toUpperCase()}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Jump Height</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {item.metrics.jump_height.toFixed(2)}m
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Speed</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {item.metrics.movement_speed.toFixed(2)}m/s
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Form Score</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {(item.metrics.form_score * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Stability</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {(item.metrics.pose_stability * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
