import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Clock, Users, Award, Music, Palette, BookOpen, Globe } from 'lucide-react';

const Programs = () => {
  const { isDarkMode } = useTheme();

  // Program age groups
  const ageGroups = [
    {
      name: 'Infants',
      age: '6 weeks - 12 months',
      description: 'Nurturing care in a safe, stimulating environment focused on sensory experiences and developmental milestones.',
      ratio: '1:3 (caregiver to player)',
      image: 'https://images.unsplash.com/photo-1554684765-8f7757fd37e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Toddlers',
      age: '1 - 2 years',
      description: 'Encouraging exploration, independence, and social skills through play-based activities and routines.',
      ratio: '1:4 (caregiver to player)',
      image: 'https://images.unsplash.com/photo-1587876931567-564ce588bfbd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Preschool',
      age: '3 - 4 years',
      description: 'Structured learning experiences that develop cognitive skills, creativity, and prepare children for kindergarten.',
      ratio: '1:8 (caregiver to player)',
      image: 'https://images.unsplash.com/photo-1602046819300-71c0a2659342?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Pre-K',
      age: '4 - 5 years',
      description: 'Comprehensive kindergarten readiness program focusing on academic, social, and emotional development.',
      ratio: '1:10 (caregiver to player)',
      image: 'https://images.unsplash.com/photo-1629196867932-643fb3746af1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  // Special programs
  const specialPrograms = [
    {
      name: 'Cultural Exploration',
      description: 'Weekly activities celebrating diverse cultures, with a focus on African heritage, stories, music, and traditions.',
      icon: <Globe className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
    },
    {
      name: 'Music & Movement',
      description: 'Interactive sessions with diverse musical instruments, songs, and dances from around the world.',
      icon: <Music className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
    },
    {
      name: 'Art Studio',
      description: 'Creative expression through various art mediums, exploring techniques inspired by artists from diverse backgrounds.',
      icon: <Palette className={`h-8 w-8 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />
    },
    {
      name: 'Early Literacy',
      description: 'Multilingual storytelling and early reading activities featuring diverse characters and authors.',
      icon: <BookOpen className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
    }
  ];

  // Daily schedule example
  const dailySchedule = [
    { time: '7:00 - 8:30', activity: 'Arrival & Free Play' },
    { time: '8:30 - 9:00', activity: 'Breakfast' },
    { time: '9:00 - 9:30', activity: 'Morning Circle (Songs, Calendar, Weather)' },
    { time: '9:30 - 10:30', activity: 'Learning Centers / Curriculum Activities' },
    { time: '10:30 - 11:30', activity: 'Outdoor Play (Weather Permitting)' },
    { time: '11:30 - 12:15', activity: 'Lunch' },
    { time: '12:15 - 2:30', activity: 'Rest / Quiet Time' },
    { time: '2:30 - 3:00', activity: 'Afternoon Snack' },
    { time: '3:00 - 4:00', activity: 'Special Programs (Art, Music, Cultural Activities)' },
    { time: '4:00 - 5:00', activity: 'Free Play / Outside Time' },
    { time: '5:00 - 6:00', activity: 'Quiet Activities & Departure' }
  ];

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
            }`}>Our Programs</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Diverse, engaging activities designed to nurture your player's development at every stage
            </p>
          </div>
        </div>
      </div>

      {/* Age-Based Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>Age-Based Programs</h2>
            <p className={`max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Our programs are thoughtfully designed to meet the developmental needs of each age group</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {ageGroups.map((group, index) => (
              <div key={index} className={`rounded-xl overflow-hidden shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="h-64 overflow-hidden">
                  <img 
                    src={group.image} 
                    alt={group.name} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-2xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>{group.name}</h3>
                      <p className={`${
                        isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                      } font-medium`}>{group.age}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${
                      isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                    } text-sm font-medium`}>
                      {group.ratio}
                    </div>
                  </div>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{group.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Approach */}
      <section className={`py-16 ${
        isDarkMode ? 'bg-gray-800' : 'bg-indigo-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-3xl font-bold mb-6 ${
                isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
              }`}>Our Curriculum Approach</h2>
              <div className={`space-y-6 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <p>At Daystar Daycare, we implement a holistic curriculum that combines elements from proven educational approaches with culturally responsive teaching practices:</p>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Award className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                      isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                    }`} />
                    <div>
                      <h3 className={`font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>Play-Based Learning</h3>
                      <p>Player-led exploration and discovery through hands-on activities and play.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                      isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                    }`} />
                    <div>
                      <h3 className={`font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>Cultural Responsiveness</h3>
                      <p>Integration of diverse cultural perspectives, stories, and traditions into daily learning.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                      isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                    }`} />
                    <div>
                      <h3 className={`font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>Whole Player Development</h3>
                      <p>Equal focus on cognitive, social-emotional, physical, and creative growth.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Award className={`h-6 w-6 mt-1 mr-3 flex-shrink-0 ${
                      isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                    }`} />
                    <div>
                      <h3 className={`font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>Kindergarten Readiness</h3>
                      <p>Intentional preparation for school success while respecting each player's developmental pace.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl overflow-hidden ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            } shadow-xl`}>
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-4 flex items-center ${
                  isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
                }`}>
                  <Calendar className="h-6 w-6 mr-2" />
                  Sample Daily Schedule
                </h3>
                <div className={`space-y-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {dailySchedule.map((item, index) => (
                    <div key={index} className="flex border-b border-dashed last:border-b-0 pb-2 last:pb-0">
                      <span className={`w-24 font-medium ${
                        isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                      }`}>{item.time}</span>
                      <span>{item.activity}</span>
                    </div>
                  ))}
                </div>
                <p className={`mt-4 text-sm italic ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>* Schedules are adjusted according to age group and may vary</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>Enrichment Programs</h2>
            <p className={`max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Special activities to nurture your player's creative expression and cultural awareness</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {specialPrograms.map((program, index) => (
              <div key={index} className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
              } transition-colors duration-300 shadow-lg`}>
                <div className="flex justify-center mb-4">
                  {program.icon}
                </div>
                <h3 className={`text-xl font-bold text-center mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>{program.name}</h3>
                <p className={`text-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Details & Pricing */}
      <section className={`py-16 ${
        isDarkMode ? 'bg-indigo-950' : 'bg-indigo-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>Program Details</h2>
            <p className={`max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Flexible scheduling options to meet your family's needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Full-Time Care',
                description: 'Monday through Friday, 7:00 AM to 6:00 PM',
                features: [
                  'All meals and snacks included',
                  'Full curriculum activities',
                  'Regular progress reports',
                  'Contact-teacher conferences'
                ],
                cta: 'Schedule a Tour'
              },
              {
                title: 'Part-Time Care',
                description: 'Flexible scheduling options available',
                features: [
                  '2-3 days per week options',
                  'Morning or afternoon sessions',
                  'Meals during attended sessions',
                  'Prorated program participation'
                ],
                cta: 'Check Availability'
              },
              {
                title: 'Drop-In Care',
                description: 'Subject to availability',
                features: [
                  'Emergency backup care',
                  'Advance reservation required',
                  'Integration with daily activities',
                  'Hourly rates available'
                ],
                cta: 'Learn More'
              }
            ].map((option, index) => (
              <div key={index} className={`rounded-xl overflow-hidden shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className={`p-6 ${
                  isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{option.title}</h3>
                  <p className={`${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{option.description}</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {option.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg className={`h-5 w-5 mt-0.5 mr-2 flex-shrink-0 ${
                          isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6">
                  <a 
                    href="/contact" 
                    className={`block w-full text-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {option.cta}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-12 p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg text-center`}>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>For detailed pricing information and current availability, please contact us.</p>
            <div className="mt-4">
              <a 
                href="/contact" 
                className={`inline-flex items-center px-6 py-3 rounded-full font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Clock className="h-5 w-5 mr-2" />
                Schedule a Visit
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${
              isDarkMode ? 'text-yellow-300' : 'text-indigo-600'
            }`}>What Contacts Say</h2>
            <p className={`max-w-3xl mx-auto ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Hear from families who have experienced our programs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "My son loves the cultural activities! He comes home singing songs and sharing stories about different countries. It's beautiful to see him embracing diversity at such a young age.",
                author: "Chioma A.",
                role: "Contact of Preschooler"
              },
              {
                quote: "The curriculum here is exceptional. My daughter has developed so much confidence and curiosity. Her teachers truly understand her learning style and nurture her interests.",
                author: "Michael J.",
                role: "Contact of Toddler"
              },
              {
                quote: "As working contacts, we needed a place that provided more than just basic care. Daystar has exceeded our expectations with their enrichment programs and loving environment.",
                author: "Fatima & James R.",
                role: "Contacts of Infant"
              }
            ].map((testimonial, index) => (
              <div key={index} className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg`}>
                <svg className={`h-10 w-10 mb-4 ${
                  isDarkMode ? 'text-gray-700' : 'text-indigo-100'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className={`mb-4 italic ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>"{testimonial.quote}"</p>
                <div>
                  <p className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{testimonial.author}</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-yellow-300' : 'text-indigo-500'
                  }`}>{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Programs; 