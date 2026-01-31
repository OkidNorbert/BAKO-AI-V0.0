import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Phone, Mail, Clock, Award, Heart, Shield, Book } from 'lucide-react';

const About = () => {
  const { isDarkMode } = useTheme();

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
            }`}>About Daystar Daycare</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Where every player shines bright and diverse cultures thrive together
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className={`text-3xl font-bold mb-6 ${
                isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
              }`}>Our Story</h2>
              <div className={`space-y-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <p>Founded in 2015, BAKO Basketball Academy began with a simple vision: to create a nurturing environment where children from all backgrounds could learn, play, and grow together.</p>
                <p>Our center was established by a team of experienced educators and contacts who recognized the need for quality playercare that celebrates diversity and embraces cultural differences as strengths.</p>
                <p>Over the years, we have grown from a small facility caring for just 15 children to a vibrant community center serving over 100 families from diverse backgrounds. Throughout our growth, we have maintained our commitment to providing individualized care and cultural awareness in all our programs.</p>
              </div>
            </div>
            <div className="relative">
              <div className={`rounded-2xl overflow-hidden shadow-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <img 
                  src="https://images.unsplash.com/photo-1540479859555-17af45c78602?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Players playing together" 
                  className="w-full h-72 object-cover"
                />
                <div className="p-6">
                  <h3 className={`text-xl font-bold mb-2 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                  }`}>A Place Where Players Thrive</h3>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Our center is designed to be a safe, engaging space where children can explore their world and discover their potential.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className={`py-16 ${
        isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>Our Core Values</h2>
            <p className={`mt-4 max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>These principles guide everything we do at Daystar Daycare</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Heart className={`h-8 w-8 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />,
                title: 'Care & Compassion',
                description: 'We provide nurturing care that helps each player feel valued and secure.'
              },
              {
                icon: <Shield className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />,
                title: 'Safety & Security',
                description: 'We maintain a safe environment where children can explore without worry.'
              },
              {
                icon: <Book className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />,
                title: 'Education & Growth',
                description: 'We foster learning through play and structured activities.'
              },
              {
                icon: <Award className={`h-8 w-8 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} />,
                title: 'Diversity & Inclusion',
                description: 'We celebrate all cultures and backgrounds as enriching our community.'
              }
            ].map((value, index) => (
              <div key={index} className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-white hover:bg-gray-50'
              } transition-colors duration-300 shadow-md`}>
                <div className="flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className={`text-xl font-bold text-center mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>{value.title}</h3>
                <p className={`text-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>Meet Our Team</h2>
            <p className={`mt-4 max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Our dedicated staff brings years of experience and a passion for children's education</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                title: 'Center Director',
                image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                bio: 'With over 15 years in early playerhood education, Sarah ensures our center provides the highest quality care.'
              },
              {
                name: 'David Okafor',
                title: 'Lead Teacher',
                image: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                bio: 'David specializes in creative learning and brings African cultural elements into our daily activities.'
              },
              {
                name: 'Maya Patel',
                title: 'Curriculum Coordinator',
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                bio: 'Maya develops our inclusive curriculum that celebrates diversity while meeting educational standards.'
              }
            ].map((member, index) => (
              <div key={index} className={`rounded-xl overflow-hidden shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{member.name}</h3>
                  <p className={`text-sm font-medium mb-3 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                  }`}>{member.title}</p>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>All our staff are certified in First Aid and CPR, background checked, and receive ongoing training in early playerhood development.</p>
          </div>
        </div>
      </section>
      
      {/* Contact Info */}
      <section className={`py-16 ${
        isDarkMode ? 'bg-indigo-950' : 'bg-indigo-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className={`text-3xl font-bold ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>Visit Us Today</h2>
            <p className={`mt-4 max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>We'd love to meet you and your player! Schedule a tour or get in touch with any questions.</p>
          </div>

          <div className={`grid md:grid-cols-2 gap-8 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <div className={`rounded-xl p-8 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } shadow-lg`}>
              <h3 className={`text-xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                  }`} />
                  <div>
                    <p className="font-medium">Address:</p>
                    <p>123 Main Street, Cityville, State 12345</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                  }`} />
                  <div>
                    <p className="font-medium">Phone:</p>
                    <p>(123) 456-7890</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                  }`} />
                  <div>
                    <p className="font-medium">Email:</p>
                    <p>hello@daystaracademy.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                  }`} />
                  <div>
                    <p className="font-medium">Hours of Operation:</p>
                    <p>Monday - Friday: 7:00 AM - 6:00 PM</p>
                    <p>Saturday: 8:00 AM - 12:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="rounded-xl overflow-hidden h-full">
                {/* Replace with your actual Google Maps iframe or a map component */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215256954771!2d-73.98585668459473!3d40.758895279323035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ1JzMyLjAiTiA3M8KwNTknMDUuMCJX!5e0!3m2!1sen!2sus!4v1617836069569!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0, minHeight: '300px' }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Daystar Daycare Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About; 