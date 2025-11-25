import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHistory } from '../services/api';
import type { HistoricalData } from '../types';

export default function Comparison() {
    const [history, setHistory] = useState<HistoricalData[]>([]);
    const [selectedId1, setSelectedId1] = useState<number | null>(null);
    const [selectedId2, setSelectedId2] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await getHistory();
            setHistory(data);
            // Auto-select first two if available
            if (data.length >= 2) {
                setSelectedId1(0);
                setSelectedId2(1);
            } else if (data.length === 1) {
                setSelectedId1(0);
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getSelectedData = (index: number | null) => {
        if (index === null) return null;
        return history[index];
    };

    const data1 = getSelectedData(selectedId1);
    const data2 = getSelectedData(selectedId2);

    const calculateDiff = (val1: number, val2: number) => {
        const diff = val2 - val1;
        const percent = (diff / val1) * 100;
        return { diff, percent };
    };

    const renderMetricComparison = (
        label: string,
        val1: number,
        val2: number,
        unit: string,
        inverse = false // if true, lower is better (not used for current metrics but good for future)
    ) => {
        const { diff, percent } = calculateDiff(val1, val2);
        const isImprovement = inverse ? diff < 0 : diff > 0;
        const isNeutral = diff === 0;

        return (
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 items-center">
                <div className="text-right font-medium text-gray-900 dark:text-white">
                    {val1.toFixed(2)}{unit}
                </div>
                <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        {label}
                    </div>
                    {!isNeutral && (
                        <div className={`text-xs font-bold flex items-center justify-center gap-1 ${isImprovement ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                            {isImprovement ? <ArrowRight className="w-3 h-3 rotate-[-45deg]" /> : <ArrowRight className="w-3 h-3 rotate-[45deg]" />}
                            {Math.abs(percent).toFixed(1)}%
                        </div>
                    )}
                </div>
                <div className="text-left font-medium text-gray-900 dark:text-white">
                    {val2.toFixed(2)}{unit}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Compare Analysis
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Compare two sessions side-by-side
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    </div>
                ) : history.length < 2 ? (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Not Enough Data
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            You need at least 2 analysis records to use the comparison view.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                        >
                            Upload Video
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Selection Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Selection 1 */}
                            <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select First Session (Baseline)
                                </label>
                                <select
                                    value={selectedId1 ?? ''}
                                    onChange={(e) => setSelectedId1(Number(e.target.value))}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    {history.map((item, index) => (
                                        <option key={index} value={index}>
                                            {new Date(item.date).toLocaleDateString()} - {item.action}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selection 2 */}
                            <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Second Session (Comparison)
                                </label>
                                <select
                                    value={selectedId2 ?? ''}
                                    onChange={(e) => setSelectedId2(Number(e.target.value))}
                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    {history.map((item, index) => (
                                        <option key={index} value={index}>
                                            {new Date(item.date).toLocaleDateString()} - {item.action}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Comparison View */}
                        {data1 && data2 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="text-center font-semibold text-gray-900 dark:text-white">
                                        {new Date(data1.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        METRIC
                                    </div>
                                    <div className="text-center font-semibold text-gray-900 dark:text-white">
                                        {new Date(data2.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="p-6">
                                    {renderMetricComparison(
                                        "Jump Height",
                                        data1.metrics.jump_height,
                                        data2.metrics.jump_height,
                                        "m"
                                    )}
                                    {renderMetricComparison(
                                        "Movement Speed",
                                        data1.metrics.movement_speed,
                                        data2.metrics.movement_speed,
                                        "m/s"
                                    )}
                                    {renderMetricComparison(
                                        "Form Score",
                                        data1.metrics.form_score,
                                        data2.metrics.form_score,
                                        "/1"
                                    )}
                                    {renderMetricComparison(
                                        "Pose Stability",
                                        data1.metrics.pose_stability,
                                        data2.metrics.pose_stability,
                                        "/1"
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
