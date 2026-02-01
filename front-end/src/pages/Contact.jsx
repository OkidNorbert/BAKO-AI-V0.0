import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

const Contact = () => {
  const { isDarkMode } = useTheme();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    playerAge: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
    preferredContact: 'email'
  });
  const [formStatus, setFormStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send data to an API endpoint
    // For demonstration purposes, we'll just show a success message
    setFormStatus('success');
    
    // Reset form after 5 seconds
    setTimeout(() => {
      setFormStatus(null);
      setFormState({
        name: '',
        email: '',
        phone: '',
        playerAge: '',
        preferredDate: '',
        preferredTime: '',
        message: '',
        preferredContact: 'email'
      });
    }, 5000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Hero Section */}
      <div className={`relative py-16 ${
        isDarkMode ? 'bg-indigo-950' : 'bg-indigo-100'
      }`}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/african-fabric.png')",
          backgroundSize: "200px",
        }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className={`text-4xl sm:text-5xl font-bold mb-6 ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-700'
            }`}>Contact Us</h1>
            <p className="text-xl max-w-3xl mx-auto">
              We'd love to hear from you! Schedule a tour, ask questions, or learn more about our programs.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
              }`}>Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                  }`} />
                  <div>
                    <h3 className="font-medium">Visit Us</h3>
                    <p className={`mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      123 Sunshine Avenue<br />
                      Nairobi, Kenya 00100
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                  }`} />
                  <div>
                    <h3 className="font-medium">Call Us</h3>
                    <p className={`mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <a href="tel:+254123456789" className="hover:underline">+254 123 456 789</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                  }`} />
                  <div>
                    <h3 className="font-medium">Email Us</h3>
                    <p className={`mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <a href="mailto:hello@daystaracademy.com" className="hover:underline">hello@daystaracademy.com</a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                  }`} />
                  <div>
                    <h3 className="font-medium">Hours of Operation</h3>
                    <p className={`mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Monday - Friday: 7:00 AM - 6:00 PM<br />
                      Saturday: 8:00 AM - 12:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Map */}
              <div className="mt-10 rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.819917806043!2d36.81955531475423!3d-1.2746859990688624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f10a56c8abe21%3A0x7cf14938ee6985b5!2sNairobi%2C%20Kenya!5e0!3m2!1sen!2sus!4v1625123456789!5m2!1sen!2sus" 
                  width="100%" 
                  height="300" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  title="BAKO Basketball Academy Location"
                ></iframe>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
              }`}>Schedule a Tour</h2>
              
              {formStatus === 'success' ? (
                <div className={`p-6 rounded-lg ${
                  isDarkMode ? 'bg-green-900' : 'bg-green-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <h3 className={`font-medium ${
                      isDarkMode ? 'text-green-300' : 'text-green-800'
                    }`}>Thank you for your interest!</h3>
                  </div>
                  <p className={`mt-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    We've received your request and will contact you soon to confirm your tour.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow-md ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label 
                        htmlFor="name" 
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Your Name*
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                            : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="email" 
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Email Address*
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                            : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="phone" 
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formState.phone}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                            : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="playerAge" 
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Player's Age
                      </label>
                      <select
                        id="playerAge"
                        name="playerAge"
                        value={formState.playerAge}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                            : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                        }`}
                      >
                        <option value="">Select age range</option>
                        <option value="infant">Infant (0-12 months)</option>
                        <option value="toddler">Toddler (1-2 years)</option>
                        <option value="preschool">Preschool (3-4 years)</option>
                        <option value="prek">Pre-K (4-5 years)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="preferredDate" 
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Preferred Visit Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Calendar className={`h-5 w-5 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <input
                          type="date"
                          id="preferredDate"
                          name="preferredDate"
                          value={formState.preferredDate}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                              : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="preferredTime" 
                        className={`block mb-2 text-sm font-medium ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        Preferred Time
                      </label>
                      <select
                        id="preferredTime"
                        name="preferredTime"
                        value={formState.preferredTime}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                            : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                        }`}
                      >
                        <option value="">Select time</option>
                        <option value="morning">Morning (9AM - 11AM)</option>
                        <option value="afternoon">Afternoon (1PM - 3PM)</option>
                        <option value="evening">Evening (4PM - 5PM)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label 
                      htmlFor="message" 
                      className={`block mb-2 text-sm font-medium ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}
                    >
                      Additional Information
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      value={formState.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 text-white focus:ring-yellow-500 border-gray-600' 
                          : 'bg-gray-50 text-gray-900 focus:ring-indigo-500 border-gray-300'
                      }`}
                      placeholder="Let us know any specific questions or concerns you might have..."
                    ></textarea>
                  </div>
                  
                  <div className="mt-6">
                    <p className={`mb-2 text-sm font-medium ${
                      isDarkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Preferred Contact Method
                    </p>
                    <div className="flex space-x-6">
                      <div className="flex items-center">
                        <input
                          id="contactEmail"
                          name="preferredContact"
                          type="radio"
                          value="email"
                          checked={formState.preferredContact === 'email'}
                          onChange={handleChange}
                          className={`h-4 w-4 ${
                            isDarkMode ? 'text-yellow-500' : 'text-indigo-600'
                          }`}
                        />
                        <label
                          htmlFor="contactEmail"
                          className="ml-2"
                        >
                          Email
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="contactPhone"
                          name="preferredContact"
                          type="radio"
                          value="phone"
                          checked={formState.preferredContact === 'phone'}
                          onChange={handleChange}
                          className={`h-4 w-4 ${
                            isDarkMode ? 'text-yellow-500' : 'text-indigo-600'
                          }`}
                        />
                        <label
                          htmlFor="contactPhone"
                          className="ml-2"
                        >
                          Phone
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                        isDarkMode 
                          ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      Schedule My Tour
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-16 ${
        isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'
      }`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-2xl font-bold mb-8 text-center ${
            isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
          }`}>Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className={`p-6 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <h3 className="font-bold text-lg">What are your operating hours?</h3>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                We're open from 7:00 AM to 6:00 PM Monday through Friday, and 8:00 AM to 12:00 PM on Saturdays. We're closed on Sundays and major holidays.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <h3 className="font-bold text-lg">What age groups do you accept?</h3>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                We welcome children from 3 months to 5 years old across our various programs. Our care and curriculum are tailored to each developmental stage.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <h3 className="font-bold text-lg">How do you handle dietary restrictions?</h3>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                We accommodate various dietary needs and allergies. Please discuss your player's specific requirements during enrollment, and we'll work together to ensure their nutritional needs are met.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <h3 className="font-bold text-lg">What is your staff-to-player ratio?</h3>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                We maintain excellent staff-to-player ratios that exceed national standards: 1:3 for infants, 1:4 for toddlers, 1:6 for preschoolers, and 1:8 for Pre-K children.
              </p>
            </div>
            
            <div className={`p-6 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <h3 className="font-bold text-lg">Do you offer part-time enrollment?</h3>
              <p className={`mt-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Yes, we offer flexible scheduling options including full-time, part-time, and even drop-in care when space is available. Contact us to discuss what works best for your family.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact; 