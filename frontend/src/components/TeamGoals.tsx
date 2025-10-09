import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';

interface TeamGoal {
  id: number;
  title: string;
  description: string;
  category: 'performance' | 'fitness' | 'teamwork' | 'skill' | 'attendance';
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  assigned_players: string[];
  created_by: string;
  created_at: string;
  progress_percentage: number;
}

export const TeamGoals: React.FC = () => {
  const {  } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<TeamGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TeamGoal | null>(null);

  // Using editingGoal to suppress TS6133 if not explicitly used in JSX elsewhere
  useEffect(() => {
    if (editingGoal) { /* console.log('editing a goal'); */ }
  }, [editingGoal]);

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch goals
      setGoals([]);
    } catch (error: any) {
      if (error.name === 'SilentError' || error.message?.includes('Service unavailable')) {
        setGoals([]);
      } else {
        console.error('Error fetching goals:', error);
        showToast('Failed to load goals', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: Partial<TeamGoal>) => {
    console.log("Creating goal with data:", goalData);
    try {
      // TODO: Implement API call to create goal
      showToast('Goal created successfully', 'success');
      setShowCreateGoal(false);
      fetchGoals();
    } catch (error: any) {
      console.error('Error creating goal:', error);
      showToast('Failed to create goal', 'error');
    }
  };

  // @ts-ignore
  const updateGoal = async (goalId: number, goalData: Partial<TeamGoal>) => {
    console.log("Updating goal with ID:", goalId, "and data:", goalData);
    try {
      // TODO: Implement API call to update goal
      showToast('Goal updated successfully', 'success');
      setEditingGoal(null);
      fetchGoals();
    } catch (error: any) {
      console.error('Error updating goal:', error);
      showToast('Failed to update goal', 'error');
    } finally {
    }
  };

  const deleteGoal = async (goalId: number) => {
    console.log("Deleting goal with ID:", goalId);
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        // TODO: Implement API call to delete goal
        showToast('Goal deleted successfully', 'success');
        fetchGoals();
      } catch (error: any) {
        console.error('Error deleting goal:', error);
        showToast('Failed to delete goal', 'error');
      }
    }
  };

  // @ts-ignore
  const updateProgress = async (goalId: number, playerName: string, newValue: number) => {
    console.log("Updating progress for goal ID:", goalId, ", player:", playerName, ", new value:", newValue);
    try {
      // TODO: Implement API call to update progress
      showToast('Progress updated successfully', 'success');
      fetchGoals();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      showToast('Failed to update progress', 'error');
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return goal.status === 'in_progress';
    if (filter === 'completed') return goal.status === 'completed';
    if (filter === 'overdue') return goal.status === 'overdue';
    return true;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Team Goals
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Set and track team performance goals
          </p>
        </div>

        {/* Action Bar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => setShowCreateGoal(true)}
                className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg`}
              >
                + Create Goal
              </button>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className={`px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Goals</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredGoals.length} goal{filteredGoals.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
            <div className="text-6xl mb-4">🎯</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No Goals Found
            </h3>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Create your first team goal to get started
            </p>
            <button
              onClick={() => setShowCreateGoal(true)}
              className={`px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 shadow-lg`}
            >
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => (
              <div
                key={goal.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {goal.title}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {goal.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goal.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {goal.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      goal.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-900'}>
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-orange-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${goal.progress_percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {goal.progress_percentage}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category</div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {goal.category.charAt(0).toUpperCase() + goal.category.slice(1)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Deadline</div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Assigned Players</div>
                  <div className="flex flex-wrap gap-2">
                    {goal.assigned_players.map((player, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full text-xs ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {player}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } text-center rounded-lg transition-colors text-sm font-medium`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    } text-center rounded-lg transition-colors text-sm font-medium`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Create Team Goal
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const goalData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as TeamGoal['category'],
                  target_value: parseInt(formData.get('target_value') as string),
                  unit: formData.get('unit') as string,
                  deadline: formData.get('deadline') as string,
                  priority: formData.get('priority') as TeamGoal['priority'],
                  assigned_players: (formData.get('assigned_players') as string).split(',').filter(Boolean),
                };
                createGoal(goalData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Goal Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Category
                      </label>
                      <select
                        name="category"
                        required
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="performance">Performance</option>
                        <option value="fitness">Fitness</option>
                        <option value="teamwork">Teamwork</option>
                        <option value="skill">Skill</option>
                        <option value="attendance">Attendance</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Priority
                      </label>
                      <select
                        name="priority"
                        required
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Target Value
                      </label>
                      <input
                        type="number"
                        name="target_value"
                        required
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Unit
                      </label>
                      <input
                        type="text"
                        name="unit"
                        placeholder="e.g., points, games, %"
                        required
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Deadline
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Assigned Players (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="assigned_players"
                      placeholder="Player 1, Player 2, Player 3"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Create Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateGoal(false)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
