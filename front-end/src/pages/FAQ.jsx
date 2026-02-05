import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
    const { isDarkMode } = useTheme();
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "Is BAKO suitable for beginners?",
            answer: "Absolutely! BAKO offers tailored training programs for all skill levels, from complete beginners to elite athletes. Our AI adjusts recommendations based on your current performance."
        },
        {
            question: "What equipment do I need?",
            answer: "Just a smartphone with a camera and a basketball! Our advanced computer vision technology runs directly on your device or in the cloud, processing video from any standard camera."
        },
        {
            question: "How does the subscription work?",
            answer: "We offer flexible monthly and annual plans. You can start with a free trial to explore our improved features. Teams and organizations can contact us for custom enterprise pricing."
        },
        {
            question: "Can I use BAKO offline?",
            answer: "Yes! We have an offline-first architecture. You can record and analyze videos locally, and your data will sync once you're back online."
        },
        {
            question: "Is my data private?",
            answer: "Your privacy is our priority. All video data is encrypted, and we strictly adhere to data protection regulations. You own your performance data."
        }
    ];

    return (
        <div className={`min-h-screen py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-600">
                        Frequently Asked Questions
                    </h1>
                    <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Got questions? We have answers. If you don't see yours here, reach out to us!
                    </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl overflow-hidden shadow-sm border transition-all duration-300 ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 hover:border-yellow-500'
                                    : 'bg-white border-gray-200 hover:border-yellow-400'
                                }`}
                        >
                            <button
                                className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            >
                                <div className="flex items-center">
                                    <HelpCircle className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-600'}`} />
                                    <span className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                        {faq.question}
                                    </span>
                                </div>
                                {openIndex === idx ? (
                                    <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                ) : (
                                    <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                )}
                            </button>

                            <div
                                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-40 py-4 opacity-100' : 'max-h-0 py-0 opacity-0'
                                    } ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                            >
                                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
