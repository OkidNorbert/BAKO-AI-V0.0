import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosConfig';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Clock,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  Edit,
  Trophy,
  Target,
  Activity,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { showToast } from '@/components/shared/Toast';

const PlayerProfile = () => {
  const { playerId } = useParams();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    position: '',
    jerseyNumber: '',
    experience: '',
    height: '',
    weight: '',
    bio: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { isDarkMode } = useTheme();
  const { user, deleteAccount } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // If we have a playerId, we're likely in a team context viewing a player
  // If not, we're a player viewing our own profile
  const isOwnProfile = !playerId || (user && user.playerId === playerId);

  useEffect(() => {
    fetchProfile();
  }, [playerId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = playerId ? `/players/${playerId}` : '/player/profile';
      const response = await api.get(endpoint);

      if (playerId) {
        // Response from /players/{id}
        const data = response.data;
        setProfile({
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          dateOfBirth: data.date_of_birth || '',
          position: data.position || '',
          jerseyNumber: data.jersey_number || '',
          experience: data.experience_years || '',
          height: data.height_cm || '',
          weight: data.weight_kg || '',
          bio: data.bio || '',
          profileImage: data.avatar_url || data.image_url || null,
          createdAt: data.created_at
        });
      } else {
        // Response from /player/profile
        const { user, player } = response.data;
        // Merge user and player data into flat state
        setProfile({
          firstName: user?.full_name?.split(' ')[0] || player?.name?.split(' ')[0] || '',
          lastName: user?.full_name?.split(' ').slice(1).join(' ') || player?.name?.split(' ').slice(1).join(' ') || '',
          email: user?.email || '',
          phone: player?.phone || user?.phone || '',
          address: player?.address || '',
          dateOfBirth: player?.date_of_birth || '',
          position: player?.position || '',
          jerseyNumber: player?.jersey_number || '',
          experience: player?.experience_years || '',
          height: player?.height_cm || '',
          weight: player?.weight_kg || '',
          bio: player?.bio || '',
          profileImage: user?.avatar_url || player?.avatar_url || null,
          createdAt: user?.created_at
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    setError('');
    setSuccess('');
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setSaving(false);
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only image files (JPG, PNG, GIF) are allowed');
      setSaving(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/player/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(data) => data],
        timeout: 30000
      });
      if (response.data?.imageUrl) {
        setProfile(prev => ({ ...prev, profileImage: response.data.imageUrl }));
        setSuccess('Profile image updated successfully');
      } else {
        setError('Failed to upload image: Invalid server response');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // If we're updating a specific player via admin (team context)
      if (playerId) {
        const adminPayload = {
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          jersey_number: profile.jerseyNumber ? parseInt(profile.jerseyNumber) : null,
          position: profile.position,
          height_cm: profile.height ? parseFloat(profile.height) : null,
          weight_kg: profile.weight ? parseFloat(profile.weight) : null,
          date_of_birth: profile.dateOfBirth || null,
          experience_years: profile.experience,
          bio: profile.bio,
          phone: profile.phone,
          address: profile.address
        };
        await api.put(`/players/${playerId}`, adminPayload);
      } else {
        // Personal profile update (nested structure)
        const personalPayload = {
          user: {
            full_name: `${profile.firstName} ${profile.lastName}`.trim(),
          },
          player: {
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            jersey_number: profile.jerseyNumber ? parseInt(profile.jerseyNumber) : null,
            position: profile.position,
            height_cm: profile.height ? parseFloat(profile.height) : null,
            weight_kg: profile.weight ? parseFloat(profile.weight) : null,
            date_of_birth: profile.dateOfBirth || null,
            experience_years: profile.experience,
            bio: profile.bio,
            phone: profile.phone,
            address: profile.address
          }
        };
        await api.put('/player/profile', personalPayload);
      }
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile(); // Refresh to ensure synchronization
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile. Please try again.');
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmPhrase !== 'DELETE MY ACCOUNT') {
      showToast('Please type the confirmation phrase exactly', 'error');
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteAccount();
      if (result.success) {
        showToast('Account deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete account', 'error');
      }
    } catch (error) {
      showToast('An error occurred during account deletion', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-orange-500 to-red-600">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  const sub = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-[#0f1115] text-white' : 'bg-gray-50 text-gray-800'}`}>
      
      {/* Premium Profile Header */}
      <div className={`${isDarkMode ? 'bg-white/5 border-b border-white/5' : 'bg-white border-b border-gray-100'} py-16 px-8 relative overflow-hidden`}>
        {/* Abstract background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="relative group">
            <div className="w-48 h-48 rounded-[3rem] border-4 border-orange-500/20 overflow-hidden shadow-premium transition-transform duration-500 group-hover:scale-105">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                  <User className="h-24 w-24 opacity-20" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute -bottom-2 -right-2 p-4 rounded-2xl cursor-pointer bg-orange-500 hover:bg-orange-600 text-white shadow-premium transition-all duration-300 hover:scale-110">
                <Camera className="h-5 w-5" />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-6">
                <Trophy className="h-3 w-3" /> Professional Account
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-4">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className={`text-xl ${sub} mb-8`}>Crafting the <span className="text-orange-500 font-black">future</span> of elite basketball.</p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="glass-dark px-6 py-3 rounded-2xl flex items-center border border-white/5 hover:border-white/10 transition-colors">
                <Award className="h-4 w-4 mr-3 text-orange-500" />
                <span className="text-sm font-black">{profile.position || 'UNASSIGNED'} • #{profile.jerseyNumber || '00'}</span>
              </div>
              <div className="glass-dark px-6 py-3 rounded-2xl flex items-center border border-white/5 hover:border-white/10 transition-colors">
                <Activity className="h-4 w-4 mr-3 text-orange-500" />
                <span className="text-sm font-black">{profile.experience || 0} SEASONS ACTIVE</span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center transition-all duration-300 ${isEditing ? 'bg-white/10 hover:bg-white/20 border border-white/10' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-premium hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-105'}`}
            >
              {isEditing ? <><Edit className="h-4 w-4 mr-2" /> Cancel</> : <><Edit className="h-4 w-4 mr-2" /> Edit Bio</>}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        {error && (
          <div className="mt-8 p-6 glass rounded-3xl border-l-4 border-red-500 text-red-400 font-bold animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-5 w-5 mr-3 inline" /> {error}
          </div>
        )}
        {success && (
          <div className="mt-8 p-6 glass rounded-3xl border-l-4 border-green-500 text-green-400 font-bold animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="h-5 w-5 mr-3 inline" /> {success}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Identity Form */}
            <div className={`rounded-[3rem] overflow-hidden border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
                <div className={`px-10 py-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                    <h2 className="text-2xl font-black tracking-tight flex items-center">
                    <User className={`h-6 w-6 mr-3 text-orange-500`} />
                    Identity
                    </h2>
                </div>
                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { id: 'firstName', label: 'First Name', type: 'text' },
                        { id: 'lastName', label: 'Last Name', type: 'text' },
                        { id: 'email', label: 'Contact Email', type: 'email' },
                        { id: 'phone', label: 'Phone Line', type: 'text' },
                        { id: 'dateOfBirth', label: 'Brith Date', type: 'date' },
                        { id: 'position', label: 'Tactical Position', type: 'text' },
                        { id: 'jerseyNumber', label: 'Jersey #', type: 'text' },
                        { id: 'experience', label: 'Experience Years', type: 'text' },
                        { id: 'height', label: 'Height (cm)', type: 'text' },
                        { id: 'weight', label: 'Weight (kg)', type: 'text' }
                    ].map((field) => (
                    <div key={field.id} className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest opacity-50 block ml-2`}>
                            {field.label}
                        </label>
                        <input
                        type={field.type}
                        name={field.id}
                        value={profile[field.id] || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-6 py-4 rounded-2xl border transition-all duration-300 outline-none font-bold text-sm ${isEditing ? (isDarkMode ? 'bg-white/5 border-orange-500/50 text-white focus:bg-white/10' : 'bg-gray-50 border-orange-500/30 focus:bg-white') : (isDarkMode ? 'bg-transparent border-white/5 text-gray-500' : 'bg-gray-100/50 border-gray-100 text-gray-400')}`}
                        />
                    </div>
                    ))}
                </div>
            </div>

            {/* Narrative Form */}
            <div className={`rounded-[3rem] overflow-hidden border ${isDarkMode ? 'bg-gray-800/20 border-gray-700/50' : 'bg-white border-gray-100 shadow-xl'}`}>
                <div className={`px-10 py-8 border-b ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
                    <h2 className="text-2xl font-black tracking-tight flex items-center">
                    <Target className={`h-6 w-6 mr-3 text-orange-500`} />
                    Elite Bio
                    </h2>
                </div>
                <div className="p-10 text-right">
                    <textarea
                    name="bio"
                    value={profile.bio || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows="6"
                    placeholder="Describe your athletic journey..."
                    className={`w-full px-8 py-6 rounded-[2rem] border transition-all duration-300 outline-none font-medium text-sm resize-none mb-6 ${isEditing ? (isDarkMode ? 'bg-white/5 border-orange-500/50 text-white focus:bg-white/10' : 'bg-gray-50 border-orange-500/30 focus:bg-white') : (isDarkMode ? 'bg-transparent border-white/5 text-gray-500' : 'bg-gray-100/50 border-gray-100 text-gray-400')}`}
                    />
                    {isEditing && (
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white shadow-premium hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-105 transition-all duration-300 ${saving ? 'opacity-50 grayscale' : ''}`}
                        >
                            {saving ? 'Syncing...' : 'Confirm Changes'}
                        </button>
                    )}
                </div>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-12">
            
            {/* Quick Highlights */}
            <div className={`rounded-[3rem] p-10 glass-dark shadow-glass border border-white/5 relative overflow-hidden group`}>
                <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700">
                    <Trophy className="h-64 w-64" />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-10">Elite Scorecard</h2>
                <div className="space-y-8">
                    <div className="flex items-center group/card">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover/card:bg-orange-500 group-hover/card:text-white transition-all duration-500">
                            <Target className="h-8 w-8" />
                        </div>
                        <div className="ml-6">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Position</p>
                            <h3 className="text-xl font-black">{profile.position || 'READY'}</h3>
                        </div>
                    </div>
                    <div className="flex items-center group/card">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover/card:bg-orange-500 group-hover/card:text-white transition-all duration-500">
                            <Award className="h-8 w-8" />
                        </div>
                        <div className="ml-6">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Tenure</p>
                            <h3 className="text-xl font-black">{profile.experience || '0'} YEARS</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone Refactor */}
            {isOwnProfile && (
                <div className={`rounded-[3rem] p-10 border transition-all duration-500 group ${isDarkMode ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' : 'bg-red-50 border-red-100 hover:bg-red-100/50'}`}>
                    <h3 className={`text-xl font-black tracking-tight mb-4 flex items-center gap-3 text-red-500`}>
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                    Security
                    </h3>
                    <p className={`text-xs font-medium mb-8 leading-relaxed opacity-60`}>
                    Removing your account will permanently scrub all biometric data and training history from our servers. This action cannot be reversed.
                    </p>
                    <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all duration-500 shadow-premium"
                    >
                    Deactivate Account
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Delete Confirmation Modal Refactor */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-xl p-12 rounded-[4rem] glass-dark border border-red-500/30 shadow-[0_0_100px_rgba(239,68,68,0.2)]">
            <div className="flex flex-col items-center text-center gap-6 mb-10">
              <div className="w-24 h-24 rounded-[2rem] bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-black tracking-tighter">Final Confirmation</h2>
              <p className={`text-sm font-medium opacity-60 max-w-sm`}>
                This will dissolve your BAKO presence. All analytics, session data, and records will be deleted permanently.
              </p>
            </div>

            <div className="space-y-4 mb-10">
              <label className={`block text-[10px] font-black uppercase tracking-widest opacity-50 text-center mb-4`}>
                Type <span className="text-red-500 underline">DELETE MY ACCOUNT</span> to proceed
              </label>
              <input
                type="text"
                value={deleteConfirmPhrase}
                onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                placeholder="Type confirmation phrase..."
                className="w-full px-8 py-6 rounded-3xl bg-white/5 border border-red-500/30 text-white text-center font-bold outline-none focus:bg-white/10 focus:border-red-500 transition-all"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmPhrase(''); }}
                className="flex-1 px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmPhrase !== 'DELETE MY ACCOUNT' || isDeleting}
                className={`flex-1 px-8 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${deleteConfirmPhrase === 'DELETE MY ACCOUNT'
                  ? 'bg-red-500 text-white shadow-premium hover:bg-red-600'
                  : 'bg-white/5 text-white/20 cursor-not-allowed grayscale'
                  }`}
              >
                {isDeleting ? 'Erasing...' : 'Scrub Data'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mt-20 opacity-20" />
    </div>
  );
};

export default PlayerProfile;
