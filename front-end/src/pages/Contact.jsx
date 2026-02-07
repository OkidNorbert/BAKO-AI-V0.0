import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';

const Contact = () => {
    const { isDarkMode } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Message sent! (This is a demo)');
    };

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-orange-50 text-gray-900'}`}>

            {/* Background Court Textures */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle, ${isDarkMode ? '#ffffff' : '#000000'} 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }}></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black mb-4 uppercase italic tracking-tighter">
                        Court <span className="text-bako-orange">Side</span> Support
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Got a game plan? We're here to help you execute it. Reach out to our coaching staff.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Contact Info Card */}
                    <div className="space-y-8">
                        <div className={`p-8 rounded-3xl shadow-xl border-l-8 border-bako-orange ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <h3 className="text-2xl font-bold mb-8 flex items-center">
                                <span className="text-bako-orange mr-2">///</span> Contact Details
                            </h3>

                            <div className="space-y-8">
                                <div className="flex items-start group">
                                    <div className={`p-4 rounded-xl mr-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 text-bako-orange group-hover:bg-bako-orange group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg uppercase tracking-wide">Phone</h4>
                                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>+254 123 456 789</p>
                                        <p className={`text-sm mt-1 uppercase font-bold tracking-wider opacity-60`}>Mon-Fri • Tip Off 7am</p>
                                    </div>
                                </div>

                                <div className="flex items-start group">
                                    <div className={`p-4 rounded-xl mr-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 text-bako-orange group-hover:bg-bako-orange group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg uppercase tracking-wide">Email</h4>
                                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>info@bakobasketball.com</p>
                                        <p className={`text-sm mt-1 uppercase font-bold tracking-wider opacity-60`}>24HR Response Time</p>
                                    </div>
                                </div>

                                <div className="flex items-start group">
                                    <div className={`p-4 rounded-xl mr-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-700 text-bako-orange group-hover:bg-bako-orange group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg uppercase tracking-wide">Headquarters</h4>
                                        <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nairobi, Kenya</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form "Clipboard" */}
                    <div className="relative">
                        <div className={`absolute -inset-4 bg-bako-orange/20 rounded-[2.5rem] transform rotate-2`}></div>
                        <div className={`relative p-8 rounded-3xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-2xl font-bold uppercase italic">Message Board</h3>
                                <MessageSquare className="w-6 h-6 text-bako-orange" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Player Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-lg font-medium border-2 focus:ring-0 focus:border-bako-orange transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
                                                }`}
                                            placeholder="Enter Name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 rounded-lg font-medium border-2 focus:ring-0 focus:border-bako-orange transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
                                                }`}
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-lg font-medium border-2 focus:ring-0 focus:border-bako-orange transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
                                            }`}
                                        placeholder="What's the game plan?"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Message Details</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="4"
                                        className={`w-full px-4 py-3 rounded-lg font-medium border-2 focus:ring-0 focus:border-bako-orange transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
                                            }`}
                                        placeholder="Type your message here..."
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center px-6 py-4 rounded-xl text-base font-bold uppercase tracking-widest text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transform hover:scale-[1.02] transition-all shadow-lg"
                                >
                                    <Send className="w-5 h-5 mr-2" />
                                    Send to Bench
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
