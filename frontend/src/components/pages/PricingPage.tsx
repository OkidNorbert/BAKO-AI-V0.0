import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  const { darkMode } = useTheme();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individual players getting started',
      features: [
        '5 video uploads per month',
        'Basic pose detection',
        'Performance dashboard',
        'Mobile app access',
        'Community support'
      ],
      cta: 'Start Free',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For serious players and coaches',
      features: [
        'Unlimited video uploads',
        'Advanced AI analysis',
        'Wearable device integration',
        'Real-time streaming',
        'Personalized training plans',
        'Priority support',
        'Export data and reports'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Team',
      price: '$99',
      period: 'per month',
      description: 'For teams and basketball academies',
      features: [
        'Everything in Pro',
        'Up to 20 players',
        'Team analytics dashboard',
        'Coach collaboration tools',
        'Custom branding',
        'Dedicated support',
        'API access',
        'Advanced reporting'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} py-20`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Simple, Transparent Pricing
          </h1>
          <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Choose the plan that's right for you. Start with a free 14-day trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-2xl ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-2xl transform scale-105'
                  : darkMode
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
              } shadow-xl`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-yellow-400 text-gray-900 font-bold text-sm rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>
              
              <div className="mb-4">
                <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-lg ${plan.highlighted ? 'text-orange-100' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  /{plan.period}
                </span>
              </div>

              <p className={`mb-6 ${plan.highlighted ? 'text-orange-100' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className={`w-6 h-6 ${plan.highlighted ? 'text-orange-200' : 'text-green-500'} mr-2 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlighted ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className={`block w-full py-3 px-6 text-center font-bold rounded-lg transition-all transform hover:scale-105 ${
                  plan.highlighted
                    ? 'bg-white text-orange-600 hover:bg-gray-50'
                    : darkMode
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className={`mt-16 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="mb-4">All plans include a 14-day free trial. No credit card required.</p>
          <p>Need a custom plan? <Link to="/contact" className="text-orange-600 hover:text-orange-700 font-semibold">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
};
