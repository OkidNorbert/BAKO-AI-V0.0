import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { Switch } from '@headlessui/react';
import { User, Clock } from 'lucide-react';

const PlayerRegistration = ({ embedded = false, onComplete }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [newContact, setNewContact] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    contactId: '',
    allergies: '',
    specialNeeds: '',
    medications: '',
    specialInstructions: '',
    emergencyContact: '',
    emergencyPhone: '',
    duration: 'full-day'  // Default to full-day
  });
  const [contactData, setContactData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    relationship: 'Contact'
  });
  const [contacts, setContacts] = useState([]);
  const [errors, setErrors] = useState({});
  const [contactErrors, setContactErrors] = useState({});

  // Fetch contacts/contacts on component mount
  React.useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await api.get('/contacts');
        setContacts(response.data || []);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast.error('Failed to load contact/contact data');
      }
    };

    fetchContacts();
  }, []);

  const validatePlayerForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!newContact && !formData.contactId) newErrors.contactId = 'Contact/Contact is required';
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact name is required';
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Emergency contact phone is required';
    if (!formData.duration) newErrors.duration = 'Assigned Group is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateContactForm = () => {
    const newErrors = {};

    // Only validate if we're creating a new contact
    if (newContact) {
      if (!contactData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!contactData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!contactData.phone.trim()) newErrors.phone = 'Phone number is required';
      // Email is optional for contacts
    }

    setContactErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlayerChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is modified
    if (contactErrors[name]) {
      setContactErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isPlayerValid = validatePlayerForm();
    const isContactValid = validateContactForm();

    if (!isPlayerValid || (newContact && !isContactValid)) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      let contactId = formData.contactId;

      // If creating a new contact, register the contact first
      if (newContact) {
        // Make sure the relationship is one of the allowed values from the enum
        const contactPayload = {
          ...contactData,
          relationship: contactData.relationship || 'Contact'
        };

        try {
          const contactResponse = await api.post('/contacts', contactPayload);
          contactId = contactResponse.data._id;
          toast.success('Contact registered successfully');

          // Refresh contacts list
          const contactsResponse = await api.get('/contacts');
          setContacts(contactsResponse.data || []);
        } catch (contactError) {
          console.error('Contact registration error:', contactError);
          const errorMessage = contactError.response?.data?.message || 'Failed to register contact';
          toast.error(errorMessage);
          setLoading(false);
          return;
        }
      }

      // Now register the player with the contact ID
      const playerPayload = {
        ...formData,
        contact: contactId
      };

      // Remove contactId field to avoid confusion
      delete playerPayload.contactId;

      console.log('Sending player registration payload:', playerPayload);

      try {
        const playerResponse = await api.post('/players/register', playerPayload);
        toast.success('Player registered successfully');

        // Reset form or navigate away
        if (embedded) {
          // Just reset the forms if embedded
          setFormData({
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            gender: 'male',
            contactId: '',
            allergies: '',
            specialNeeds: '',
            medications: '',
            specialInstructions: '',
            emergencyContact: '',
            emergencyPhone: '',
            duration: 'full-day'
          });

          setContactData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            address: '',
            emergencyContact: '',
            emergencyPhone: '',
            relationship: 'Contact'
          });

          // Call the onComplete callback if provided
          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }
        } else {
          // Navigate to players list if not embedded
          navigate('/team/players');
        }
      } catch (error) {
        console.error('Registration error:', error);

        let errorMessage = 'Failed to register player';

        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = 'Registration endpoint not found. Please contact an administrator.';
          } else if (error.response.data) {
            errorMessage = error.response.data.message || error.response.data.error || errorMessage;
          }
        }

        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Failed to register player';

      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Registration endpoint not found. Please contact an administrator.';
        } else if (error.response.data) {
          errorMessage = error.response.data.message || error.response.data.error || errorMessage;
        }
      }

      toast.error(errorMessage);
    }
  };

  const inputClassName = (fieldName, errors) => `
    mt-1 block w-full rounded-md shadow-sm
    ${isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
    }
    focus:ring-indigo-500 focus:border-indigo-500
    ${errors && errors[fieldName] ? 'border-red-500' : ''}
  `;

  const labelClassName = (fieldName, errors) => `
    block text-sm font-medium
    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
    ${errors && errors[fieldName] ? 'text-red-500' : ''}
  `;

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
      {!embedded && (
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400'
            : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500'
            } animate-gradient`}>
            Register New Player
          </h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-800'} text-lg`}>
            Fill in the details to register a player with a contact
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Section */}
        <div className={`shadow-lg rounded-lg p-6 transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-white to-gray-50'
          }`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${isDarkMode
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}>
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Contact Information</h2>
            </div>
            <div className="flex items-center">
              <span className={`mr-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {newContact ? 'Register new contact' : 'Use existing contact'}
              </span>
              <Switch
                checked={newContact}
                onChange={setNewContact}
                className={`${newContact ? (isDarkMode ? 'bg-indigo-600' : 'bg-indigo-500') : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
              >
                <span
                  className={`${newContact ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>

          {newContact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClassName('firstName', contactErrors)}>First Name*</label>
                <input
                  type="text"
                  name="firstName"
                  value={contactData.firstName}
                  onChange={handleContactChange}
                  className={inputClassName('firstName', contactErrors)}
                />
                {contactErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{contactErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className={labelClassName('lastName', contactErrors)}>Last Name*</label>
                <input
                  type="text"
                  name="lastName"
                  value={contactData.lastName}
                  onChange={handleContactChange}
                  className={inputClassName('lastName', contactErrors)}
                />
                {contactErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{contactErrors.lastName}</p>
                )}
              </div>
              <div>
                <label className={labelClassName('email', contactErrors)}>Email (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={contactData.email}
                  onChange={handleContactChange}
                  className={inputClassName('email', contactErrors)}
                />
                {contactErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{contactErrors.email}</p>
                )}
              </div>
              <div>
                <label className={labelClassName('phone', contactErrors)}>Phone Number*</label>
                <input
                  type="tel"
                  name="phone"
                  value={contactData.phone}
                  onChange={handleContactChange}
                  className={inputClassName('phone', contactErrors)}
                />
                {contactErrors.phone && (
                  <p className="mt-1 text-sm text-red-500">{contactErrors.phone}</p>
                )}
              </div>
              <div>
                <label className={labelClassName('relationship', contactErrors)}>Relationship</label>
                <select
                  name="relationship"
                  value={contactData.relationship}
                  onChange={handleContactChange}
                  className={inputClassName('relationship', contactErrors)}
                >
                  <option value="Contact">Contact</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClassName('address', contactErrors)}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={contactData.address}
                  onChange={handleContactChange}
                  className={inputClassName('address', contactErrors)}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClassName('contactId', errors)}>Select Contact/Contact*</label>
              <select
                name="contactId"
                value={formData.contactId}
                onChange={handlePlayerChange}
                className={inputClassName('contactId', errors)}
              >
                <option value="">Select Contact/Contact</option>
                {contacts.map(contact => (
                  <option key={contact._id} value={contact._id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
              {errors.contactId && (
                <p className="mt-1 text-sm text-red-500">{errors.contactId}</p>
              )}
            </div>
          )}
        </div>

        {/* Player Information */}
        <div className={`shadow-lg rounded-lg p-6 transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-white to-gray-50'
          }`}>
          <div className="flex items-center mb-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${isDarkMode
              ? 'bg-gradient-to-r from-pink-600 to-rose-600'
              : 'bg-gradient-to-r from-pink-500 to-rose-500'
              }`}>
              <User className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Player Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClassName('firstName', errors)}>First Name*</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handlePlayerChange}
                className={inputClassName('firstName', errors)}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className={labelClassName('lastName', errors)}>Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handlePlayerChange}
                className={inputClassName('lastName', errors)}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
            <div>
              <label className={labelClassName('dateOfBirth', errors)}>Date of Birth*</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handlePlayerChange}
                className={inputClassName('dateOfBirth', errors)}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
            <div>
              <label className={labelClassName('gender', errors)}>Gender*</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handlePlayerChange}
                className={inputClassName('gender', errors)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClassName('duration', errors)}>Assigned Group*</label>
              <div className="flex items-center mt-1 space-x-3">
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  <Users size={18} className="mr-1" />
                </div>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handlePlayerChange}
                  className={inputClassName('duration', errors)}
                >
                  <option value="half-day-morning">Developmental</option>
                  <option value="half-day-afternoon">Intermediate</option>
                  <option value="full-day">Elite</option>
                </select>
              </div>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
              )}
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className={`shadow-lg rounded-lg p-6 transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-white to-gray-50'
          }`}>
          <h2 className="text-xl font-semibold mb-4">Health Information</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className={labelClassName('allergies', errors)}>Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handlePlayerChange}
                rows="2"
                placeholder="List any allergies or write 'None'"
                className={inputClassName('allergies', errors)}
              />
            </div>
            <div>
              <label className={labelClassName('medications', errors)}>Medications</label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handlePlayerChange}
                rows="2"
                placeholder="List any medications or write 'None'"
                className={inputClassName('medications', errors)}
              />
            </div>
            <div>
              <label className={labelClassName('specialNeeds', errors)}>Special Needs</label>
              <textarea
                name="specialNeeds"
                value={formData.specialNeeds}
                onChange={handlePlayerChange}
                rows="2"
                placeholder="Describe any special needs or write 'None'"
                className={inputClassName('specialNeeds', errors)}
              />
            </div>
            <div>
              <label className={labelClassName('specialInstructions', errors)}>Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handlePlayerChange}
                rows="3"
                placeholder="Any additional instructions for the coaching staff"
                className={inputClassName('specialInstructions', errors)}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className={`shadow-lg rounded-lg p-6 transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-br from-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-white to-gray-50'
          }`}>
          <h2 className="text-xl font-semibold mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClassName('emergencyContact', errors)}>Name*</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handlePlayerChange}
                className={inputClassName('emergencyContact', errors)}
              />
              {errors.emergencyContact && (
                <p className="mt-1 text-sm text-red-500">{errors.emergencyContact}</p>
              )}
            </div>
            <div>
              <label className={labelClassName('emergencyPhone', errors)}>Phone Number*</label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handlePlayerChange}
                className={inputClassName('emergencyPhone', errors)}
              />
              {errors.emergencyPhone && (
                <p className="mt-1 text-sm text-red-500">{errors.emergencyPhone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => embedded ? (onComplete && onComplete()) : navigate('/team/players')}
            className={`px-4 py-2 rounded-md ${isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md shadow-md ${isDarkMode
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              } transition-all duration-300 disabled:opacity-50 ${loading ? 'cursor-not-allowed' : ''
              }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registering...
              </span>
            ) : (
              'Register Player'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerRegistration; 