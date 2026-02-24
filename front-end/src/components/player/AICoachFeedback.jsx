import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Zap,
    Target,
    Info
} from 'lucide-react';

const AICoachFeedback = ({ analysisData }) => {
    const { isDarkMode } = useTheme();

    if (!analysisData || (!analysisData.shot_details && !analysisData.feedback)) {
        return (
            <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Process a shooting session to receive AI coaching feedback.
                </p>
            </div>
        );
    }

    const shotDetails = analysisData.shot_details || [];
    const overallFeedback = analysisData.feedback || "Based on your session, work on consistent knee dip and ensuring full elbow extension on release.";

    return (
        <div className="space-y-6">
            {/* Overall AI Summary */}
            <div className={`p-6 rounded-xl border-l-4 border-orange-500 shadow-sm ${isDarkMode ? 'bg-gray-800/50' : 'bg-orange-50/50'}`}>
                <div className="flex items-start">
                    <Zap className="w-6 h-6 text-orange-500 mr-3 mt-1" />
                    <div>
                        <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Coaching Insight</h3>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            "{overallFeedback}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Shot Breakdown Diagnostics */}
            {shotDetails.length > 0 && (
                <div className="space-y-4">
                    <h3 className={`text-lg font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Target className="mr-2 text-blue-500" size={20} />
                        Diagnostic Breakdown ({shotDetails.length} shots)
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {shotDetails.map((shot, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border transition-all hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center">
                                        <span className={`text-sm font-bold mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SHOT #{idx + 1}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${shot.outcome === 'made' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                            }`}>
                                            {shot.outcome}
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        {shot.faults && shot.faults.map((fault, fIdx) => (
                                            <span key={fIdx} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[10px] font-bold">
                                                {fault.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Biometrics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                    {shot.biometrics && Object.entries(shot.biometrics).map(([key, value]) => (
                                        <div key={key}>
                                            <span className={`block text-[10px] uppercase ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {typeof value === 'number' ? `${value.toFixed(1)}°` : value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Specific Coaching Feedback */}
                                {shot.feedback && (
                                    <div className={`mt-2 p-2 rounded text-xs flex items-start ${isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                        <Info size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{shot.feedback}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AICoachFeedback;
