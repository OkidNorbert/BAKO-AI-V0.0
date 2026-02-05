import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, HelpCircle, AlertCircle } from 'lucide-react';

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                        Playbook <span className="text-bako-orange">Breakdown</span>
                    </h1>
                    <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Common questions about the BAKO system.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className={`group rounded-2xl border-2 transition-all duration-300 ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 hover:border-orange-500/50'
                                    : 'bg-white border-gray-200 hover:border-orange-300'
                                } ${openIndex === idx ? 'ring-2 ring-orange-500/20 border-orange-500' : ''}`}
                        >
                            <button
                                className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none"
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            >
                                <div className="flex items-center space-x-4">
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${openIndex === idx
                                            ? 'bg-orange-500 text-white'
                                            : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {idx < 9 ? `0${idx + 1}` : idx + 1}
                                    </span>
                                    <span className={`font-bold text-lg md:text-xl ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                                        {faq.question}
                                    </span>
                                </div>
                                <div className={`transform transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}>
                                    <ChevronDown className={`w-6 h-6 ${openIndex === idx ? 'text-orange-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`} />
                                </div>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-48' : 'max-h-0'
                                    }`}
                            >
                                <div className={`px-8 pb-8 pl-[4.5rem] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Support CTA */}
                <div className={`mt-16 text-center p-8 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                    <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className="text-xl font-bold mb-2">Still stuck on the bench?</h3>
                    <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Our support team is ready to help you get back in the game.</p>
                    <button className={`px-8 py-3 rounded-full font-bold transition-transform hover:-translate-y-1 ${isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}>
                        <a href="/contact">Contact Support</a>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default FAQ;
