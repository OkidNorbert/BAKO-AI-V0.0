import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TrainingPlan {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  frequency: string;
  created_at: string;
  assigned_players: number;
  completion_rate: number;
  status: 'active' | 'draft' | 'completed';
}

interface Player {
  id: number;
  name: string;
  position: string;
  performance_score: number;
}

export const TeamTraining: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      setLoading(true);
      
      // Fetch training plans
      const plansResponse = await api.training.getTeamPlans();
      setTrainingPlans(plansResponse.data || []);

      // Fetch team players for assignment
      const playersResponse = await api.players.getTeamPlayers();
      setPlayers(playersResponse.data || []);

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching training data:', error);
      showToast('Failed to load training plans', 'error');
      setLoading(false);
    }
  };

  const filteredPlans = trainingPlans.filter(plan => {
    const matchesCategory = filterCategory === 'all' || plan.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || plan.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const categories = ['all', ...Array.from(new Set(trainingPlans.map(p => p.category).filter(Boolean)))];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Training Plans
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Create and manage team training programs
              </p>
            </div>
            <button
              onClick={() => showToast('Create plan functionality coming soon!', 'info')}
              className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg`}
            >
              + Create Plan
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-orange-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                } focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Training Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    {plan.description}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.status === 'active' ? 'bg-green-100 text-green-800' :
                  plan.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {plan.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{plan.category}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Difficulty:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{plan.difficulty}</span>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{plan.duration} minutes</span>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Frequency:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{plan.frequency}</span>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assigned Players:</span>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{plan.assigned_players}</span>
                </div>

                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completion Rate:</span>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    {plan.completion_rate}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-900'}>{plan.completion_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${plan.completion_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => showToast('View details functionality coming soon!', 'info')}
                  className={`flex-1 px-4 py-2 bg-orange-600 text-white text-center rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium`}
                >
                  View Details
                </button>
                <button
                  onClick={() => showToast('Edit plan functionality coming soon!', 'info')}
                  className={`flex-1 px-4 py-2 ${
                    darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  } text-center rounded-lg transition-colors text-sm font-medium`}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPlans.length === 0 && (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No training plans found
            </h3>
            <p>
              {filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first training plan to get started'
              }
            </p>
          </div>
        )}

        {/* Quick Stats */}
        {trainingPlans.length > 0 && (
          <div className="mt-8">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Training Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {trainingPlans.length}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Plans
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {trainingPlans.filter(p => p.status === 'active').length}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Active Plans
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {trainingPlans.reduce((sum, plan) => sum + plan.assigned_players, 0)}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Assignments
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round(trainingPlans.reduce((sum, plan) => sum + plan.completion_rate, 0) / trainingPlans.length)}%
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Avg Completion
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
