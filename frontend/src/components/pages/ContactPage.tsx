import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../Toast';

export const ContactPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Get in Touch
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Have questions? We're here to help!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className={`p-8 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-xl`}>
            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors`}
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} border focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors`}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-orange-50 to-blue-50'}`}>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Email Us
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                support@courtvision.ai
              </p>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Follow Us
              </h3>
              <div className="flex space-x-4">
                {['Twitter', 'LinkedIn', 'Instagram', 'YouTube'].map((social) => (
                  <a
                    key={social}
                    href="#"
                    className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} flex items-center justify-center transition-colors`}
                  >
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{social[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Support Hours
              </h3>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                Monday - Friday: 9 AM - 6 PM EST<br />
                Saturday - Sunday: 10 AM - 4 PM EST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
