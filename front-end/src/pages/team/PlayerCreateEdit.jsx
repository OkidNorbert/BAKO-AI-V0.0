import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { showToast } from '../../components/shared/Toast';
import {
    Save,
    ArrowLeft,
    User,
    Hash,
    Activity,
    Calendar,
    Contact,
    Trophy,
    ArrowUp,
    Weight
} from 'lucide-react';

const PlayerCreateEdit = () => {
    const { playerId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const isEditing = Boolean(playerId);

    const [playerData, setPlayerData] = useState({
        name: '',
        jersey_number: '',
        position: '',
        height_cm: '',
        weight_kg: '',
        date_of_birth: '',
        status: 'active'
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchPlayerData();
        }
    }, [playerId, isEditing]);

    const fetchPlayerData = async () => {
        try {
            setFetching(true);
            const response = await adminAPI.getRoster();
            const players = response.data || [];
            const player = players.find(p => p.id === playerId);

            if (player) {
                setPlayerData({
                    name: player.name || '',
                    jersey_number: player.jersey_number || '',
                    position: player.position || '',
                    height_cm: player.height_cm || '',
                    weight_kg: player.weight_kg || '',
                    date_of_birth: player.date_of_birth ? player.date_of_birth.split('T')[0] : '',
                    status: player.status || 'active'
                });
            } else {
                setError('Player not found');
            }
            setFetching(false);
        } catch (error) {
            console.error('Error fetching player data:', error);
            setError('Failed to load player data');
            setFetching(false);
        }
    };

    const handleInputChange = (field, value) => {
        setPlayerData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const dataToSend = {
                ...playerData,
                jersey_number: playerData.jersey_number !== '' ? parseInt(playerData.jersey_number) : null,
                height_cm: playerData.height_cm !== '' ? parseFloat(playerData.height_cm) : null,
                weight_kg: playerData.weight_kg !== '' ? parseFloat(playerData.weight_kg) : null,
                date_of_birth: playerData.date_of_birth || null
            };

            if (isEditing) {
                await adminAPI.updatePlayer(playerId, dataToSend);
                showToast('Player updated successfully', 'success');
            } else {
                await adminAPI.createPlayer(dataToSend);
                showToast('Player added to roster successfully', 'success');
            }

            navigate('/team/roster');
        } catch (error) {
            console.error('Error saving player:', error);
            setError(error.response?.data?.detail || 'Failed to save player. Please try again.');
            showToast('Error saving player', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-3xl mx-auto px-4">
                <button
                    onClick={() => navigate('/team/roster')}
                    className={`flex items-center space-x-2 mb-6 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    <ArrowLeft size={20} />
                    <span>Back to Roster</span>
                </button>

                <div className={`rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
                    <div className="p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}">
                        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Player' : 'Add New Player'}</h1>
                        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Fill in the player's details below
                        </p>
                    </div>

                    {error && (
                        <div className="p-4 mx-6 mt-6 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <User size={16} className="mr-2 text-orange-500" />
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={playerData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., Stephen Curry"
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Jersey Number */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <Hash size={16} className="mr-2 text-orange-500" />
                                    Jersey Number
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={playerData.jersey_number}
                                    onChange={(e) => handleInputChange('jersey_number', e.target.value)}
                                    placeholder="e.g., 30"
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <Activity size={16} className="mr-2 text-orange-500" />
                                    Position
                                </label>
                                <select
                                    value={playerData.position}
                                    onChange={(e) => handleInputChange('position', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                >
                                    <option value="">Select Position</option>
                                    <option value="Point Guard">Point Guard (PG)</option>
                                    <option value="Shooting Guard">Shooting Guard (SG)</option>
                                    <option value="Small Forward">Small Forward (SF)</option>
                                    <option value="Power Forward">Power Forward (PF)</option>
                                    <option value="Center">Center (C)</option>
                                </select>
                            </div>

                            {/* Height */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <ArrowUp size={16} className="mr-2 text-orange-500" />
                                    Height (cm)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={playerData.height_cm}
                                    onChange={(e) => handleInputChange('height_cm', e.target.value)}
                                    placeholder="e.g., 191"
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <Weight size={16} className="mr-2 text-orange-500" />
                                    Weight (kg)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={playerData.weight_kg}
                                    onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                                    placeholder="e.g., 84"
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <Calendar size={16} className="mr-2 text-orange-500" />
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={playerData.date_of_birth}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center">
                                    <Trophy size={16} className="mr-2 text-orange-500" />
                                    Status
                                </label>
                                <select
                                    value={playerData.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                                        }`}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="injured">Injured</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/team/roster')}
                                className={`px-6 py-2.5 rounded-lg font-medium transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-2.5 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white transition flex items-center shadow-lg shadow-orange-500/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                <Save size={20} className="mr-2" />
                                {loading ? 'Saving...' : (isEditing ? 'Update Player' : 'Add Player')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PlayerCreateEdit;
