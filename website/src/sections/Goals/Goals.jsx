import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, getAuthToken } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';
import Footer from '../../components/Footer';
import FloatingNavbar from '../../components/FloatingNavbar';
import AchievementNotification from '../../components/AchievementNotification';

const Goals = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' or 'completed'
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [goalToMarkComplete, setGoalToMarkComplete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    category: 'physical',
    activityType: '',
    targetAmount: '',
    targetDays: '',
    vaccinationType: '',
    vaccinationDate: '',
    dietGoal: '',
    dietFrequency: '',
    dietDays: '',
    socialGoal: '',
    socialCount: '',
    quizCount: '',
    currentProgress: 0,
    completedDays: 0,
    isCompleted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  
  // Achievement notification state
  const [achievementNotifications, setAchievementNotifications] = useState([]);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  // Function to show achievement notifications
  const showAchievement = (achievement) => {
    setAchievementNotifications(prev => [...prev, achievement]);
  };
  
  // Process achievement queue
  useEffect(() => {
    if (achievementNotifications.length > 0 && !currentAchievement) {
      setCurrentAchievement(achievementNotifications[0]);
      setAchievementNotifications(prev => prev.slice(1));
    }
  }, [achievementNotifications, currentAchievement]);

  // Goal categories with their icons and colors
  const goalCategories = {
    physical: { 
      name: 'Physical Activities', 
      icon: 'fi fi-sr-treadmill', 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    vaccination: { 
      name: 'Vaccination Goal', 
      icon: 'fi fi-sr-shield', 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    diet: { 
      name: 'Diet and Nutrition Goal', 
      icon: 'fi fi-sr-salad', 
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    social: { 
      name: 'Social Interaction Goal', 
      icon: 'fi fi-sr-users', 
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    quiz: { 
      name: 'Quiz Goal', 
      icon: 'fi fi-sr-brain', 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  };

  // Load goals from Firebase
  const fetchGoals = async () => {
    try {
      setLoading(true);

      // Fetch all goals at once
      const response = await apiFetch('/api/goals', {
        method: 'GET'
      });

      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        console.log('Goals data received:', response.data);
        
        // Handle array format: [{...}, {...}, ...]
        const goalsArray = Array.isArray(response.data) ? response.data : [];
        
        if (goalsArray.length > 0) {
          console.log('Processing goals array:', goalsArray);
          // Map Firebase data to frontend structure
          const processedGoals = goalsArray.map(goal => {
            const goalType = goal.goalType || 'physical'; // Fallback for old goals
            const mappedGoal = mapFirebaseGoalToFrontend(goalType, goal);
            return {
              ...mappedGoal,
              id: goal.id, // Use the actual Firebase document ID
              goalType: goalType,
              createdAt: goal.createdAt
            };
          });
          
          console.log('Final goals array:', processedGoals);
          setGoals(processedGoals);
        } else {
          console.log('No goals data found');
          setGoals([]);
        }
      } else {
        console.log('No goals data received or response failed:', response);
        setGoals([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setLoading(false);
    }
  };

  // Map Firebase goal data to frontend structure
  const mapFirebaseGoalToFrontend = (goalType, firebaseData) => {
    console.log('Mapping Firebase data:', { goalType, firebaseData });
    const baseGoal = {
      id: goalType,
      category: goalType.toLowerCase(),
      currentProgress: 0,
      completedDays: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      progress: firebaseData.progress || 0 // Map progress field from Firebase
    };
    console.log('Mapped baseGoal:', baseGoal);

    switch (goalType) {
      case 'Quiz':
        return {
          ...baseGoal,
          quizCount: firebaseData.amount?.toString() || '0',
          isCompleted: !firebaseData.status // status: true = open, status: false = completed
        };
      
      case 'diet':
        return {
          ...baseGoal,
          dietGoal: firebaseData.name || '',
          dietFrequency: firebaseData.frequency?.toString() || '',
          dietDays: firebaseData.days?.toString() || '',
          isCompleted: !firebaseData.status // status: true = open, status: false = completed
        };
      
      case 'physical':
        return {
          ...baseGoal,
          activityType: firebaseData.type || '',
          targetDays: firebaseData.days?.toString() || '',
          targetAmount: firebaseData.frequency?.toString() || '',
          isCompleted: !firebaseData.status // status: true = open, status: false = completed
        };
      
      case 'social':
        return {
          ...baseGoal,
          socialGoal: firebaseData.name || '',
          socialCount: firebaseData.frequency?.toString() || '',
          isCompleted: !firebaseData.status // status: true = open, status: false = completed
        };
      
      case 'vaccination':
        return {
          ...baseGoal,
          vaccinationType: firebaseData.name || '',
          vaccinationDate: firebaseData.date || '',
          isCompleted: !firebaseData.status // status: true = open, status: false = completed
        };
      
      default:
        return null;
    }
  };

  // Create new goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Map frontend data to Firebase structure
      const firebaseData = mapFrontendGoalToFirebase(newGoal);
      const goalType = getGoalTypeFromCategory(newGoal.category);

      const response = await apiFetch('/api/goals', {
        method: 'POST',
        body: {
          goalType,
          ...firebaseData
        }
      });

      if (response.success) {
        // Refresh goals from Firebase
        await fetchGoals();
        
        // Reset form
        setNewGoal({
          category: 'physical',
          activityType: '',
          targetAmount: '',
          targetDays: '',
          vaccinationType: '',
          vaccinationDate: '',
          dietGoal: '',
          dietFrequency: '',
          dietDays: '',
          socialGoal: '',
          socialCount: '',
          quizCount: '',
          currentProgress: 0,
          completedDays: 0,
          isCompleted: false
        });
        
        setShowCreateForm(false);
      } else {
        console.error('Failed to create goal:', response.error);
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map frontend goal data to Firebase structure
  const mapFrontendGoalToFirebase = (goal) => {
    switch (goal.category) {
      case 'quiz':
        return {
          amount: parseInt(goal.quizCount) || 0,
          progress: 0 // Initialize progress to 0
        };
      
      case 'diet':
        return {
          name: goal.dietGoal,
          frequency: parseInt(goal.dietFrequency) || 0,
          days: parseInt(goal.dietDays) || 0,
          progress: 0 // Initialize progress to 0
        };
      
      case 'physical':
        return {
          type: goal.activityType,
          days: parseInt(goal.targetDays) || 0,
          frequency: parseInt(goal.targetAmount) || 0,
          progress: 0, // Initialize progress to 0
          status: true // status: true = open, status: false = completed
        };
      
      case 'social':
        return {
          name: goal.socialGoal,
          frequency: parseInt(goal.socialCount) || 0,
          progress: 0 // Initialize progress to 0
        };
      
      case 'vaccination':
        return {
          name: goal.vaccinationType,
          date: goal.vaccinationDate,
          progress: 0, // Initialize progress to 0
          status: true // status: true = open, status: false = completed
        };
      
      default:
        return {};
    }
  };

  // Get Firebase goal type from category
  const getGoalTypeFromCategory = (category) => {
    const categoryMap = {
      'quiz': 'Quiz',
      'diet': 'diet',
      'physical': 'physical',
      'social': 'social',
      'vaccination': 'vaccination'
    };
    return categoryMap[category] || category;
  };

  // Update goal progress
  const handleUpdateProgress = async (goalId, goalType, newProgress) => {
    try {
      const response = await apiFetch(`/api/goals/${goalType}/${goalId}`, {
        method: 'PATCH',
        body: { progress: newProgress }
      });

      if (response.success) {
        // Refresh goals from Firebase
        await fetchGoals();
      } else {
        console.error('Failed to update progress:', response.error);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Show mark complete confirmation modal
  const handleMarkComplete = (goalId, goalType) => {
    setGoalToMarkComplete({ id: goalId, type: goalType });
    setShowMarkCompleteModal(true);
  };

  // Confirm mark goal as complete
  const confirmMarkComplete = async () => {
    if (goalToMarkComplete) {
      try {
        const response = await apiFetch(`/api/goals/${goalToMarkComplete.type}/${goalToMarkComplete.id}`, {
          method: 'PATCH',
          body: { status: false } // status: false = completed
        });

        if (response.success) {
          // Show achievement notifications if any
          if (response.newAchievements && response.newAchievements.length > 0) {
            response.newAchievements.forEach(achievement => {
              showAchievement(achievement);
            });
          }
          
          // Refresh goals from Firebase
          await fetchGoals();
          setShowMarkCompleteModal(false);
          setGoalToMarkComplete(null);
        } else {
          console.error('Failed to mark goal as complete:', response.error);
        }
      } catch (error) {
        console.error('Error marking goal as complete:', error);
      }
    }
  };

  // Cancel mark complete
  const cancelMarkComplete = () => {
    setShowMarkCompleteModal(false);
    setGoalToMarkComplete(null);
  };

  // Show delete confirmation modal
  const handleDeleteGoal = (goalId) => {
    setGoalToDelete(goalId);
    setShowDeleteModal(true);
  };

  // Confirm delete goal
  const confirmDeleteGoal = async () => {
    if (goalToDelete && !isDeleting) {
      setIsDeleting(true);
      try {
        const goal = goals.find(g => g.id === goalToDelete);
        if (!goal) {
          console.error('Goal not found for deletion');
          setIsDeleting(false);
          return;
        }
        
        console.log('Deleting goal:', { goalToDelete, goalType: goal.goalType, goal });
        const response = await apiFetch(`/api/goals/${goal.goalType}/${goalToDelete}`, {
          method: 'DELETE'
        });

        if (response.success) {
          // Refresh goals from Firebase
          await fetchGoals();
          setShowDeleteModal(false);
          setGoalToDelete(null);
        } else {
          console.error('Failed to delete goal:', response.error);
          // Still close the modal and refresh goals even if there's an error
          setShowDeleteModal(false);
          setGoalToDelete(null);
          await fetchGoals();
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
        // Still close the modal and refresh goals even if there's an error
        setShowDeleteModal(false);
        setGoalToDelete(null);
        await fetchGoals();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setGoalToDelete(null);
  };


  // Calculate progress percentage
  const getProgressPercentage = (goal) => {
    // Use the progress field from Firebase, fallback to currentProgress for old goals
    const currentProgress = goal.progress || goal.currentProgress || 0;
    console.log('Calculating progress for goal:', { goal, currentProgress });
    
    if (goal.category === 'physical') {
      const targetAmount = parseFloat(goal.targetAmount);
      // Only show progress if target amount is set and greater than 0
      if (!targetAmount || targetAmount <= 0) return null;
      return Math.min((currentProgress / targetAmount) * 100, 100);
    }
    if (goal.category === 'diet') {
      const targetFrequency = parseFloat(goal.dietFrequency);
      // Only show progress if target frequency is set and greater than 0
      if (!targetFrequency || targetFrequency <= 0) return null;
      return Math.min((currentProgress / targetFrequency) * 100, 100);
    }
    if (goal.category === 'social') {
      const targetCount = parseFloat(goal.socialCount);
      // Only show progress if target count is set and greater than 0
      if (!targetCount || targetCount <= 0) return null;
      return Math.min((currentProgress / targetCount) * 100, 100);
    }
    if (goal.category === 'quiz') {
      const targetCount = parseFloat(goal.quizCount);
      // Only show progress if target count is set and greater than 0
      if (!targetCount || targetCount <= 0) return null;
      return Math.min((currentProgress / targetCount) * 100, 100);
    }
    if (goal.category === 'vaccination') {
      // For vaccination, progress is based on days remaining
      const daysRemaining = getDaysRemaining(goal);
      const totalDays = 30; // Assuming 30 days target
      const progress = Math.max(0, (totalDays - daysRemaining) / totalDays * 100);
      return Math.min(progress, 100);
    }
    return null; // No progress bar for unknown categories
  };

  // Calculate days remaining for vaccination
  const getDaysRemaining = (goal) => {
    if (goal.category === 'vaccination' && goal.vaccinationDate) {
      const today = new Date();
      const vaccinationDate = new Date(goal.vaccinationDate);
      const timeDiff = vaccinationDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff;
    }
    return 0;
  };

  // Get progress status
  const getProgressStatus = (goal) => {
    const percentage = getProgressPercentage(goal);
    // If no progress bar (null), return a neutral status
    if (percentage === null) return { status: 'No Target Set', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    if (percentage >= 100) return { status: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (percentage >= 75) return { status: 'Almost There', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (percentage >= 50) return { status: 'Good Progress', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (percentage >= 25) return { status: 'Getting Started', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'Just Started', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  // Clear state when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      // User logged out, clear all state
      setGoals([]);
      setShowCreateForm(false);
      setActiveTab('ongoing');
      setShowMarkCompleteModal(false);
      setGoalToMarkComplete(null);
      setIsDeleting(false);
      setNewGoal({
        category: 'physical',
        activityType: '',
        targetAmount: '',
        targetDays: '',
        vaccinationType: '',
        vaccinationDate: '',
        dietGoal: '',
        dietFrequency: '',
        dietDays: '',
        socialGoal: '',
        socialCount: '',
        quizCount: '',
        currentProgress: 0,
        completedDays: 0,
        isCompleted: false
      });
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setGoalToDelete(null);
    } else {
      // New user logged in, clear previous user's data first
      setGoals([]);
      setShowCreateForm(false);
      setActiveTab('ongoing');
      setShowMarkCompleteModal(false);
      setGoalToMarkComplete(null);
      setIsDeleting(false);
      setNewGoal({
        category: 'physical',
        activityType: '',
        targetAmount: '',
        targetDays: '',
        vaccinationType: '',
        vaccinationDate: '',
        dietGoal: '',
        dietFrequency: '',
        dietDays: '',
        socialGoal: '',
        socialCount: '',
        quizCount: '',
        currentProgress: 0,
        completedDays: 0,
        isCompleted: false
      });
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setGoalToDelete(null);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchGoals();
    } else if (!authLoading && !user) {
      // User is not authenticated, redirect to login
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Debug: Log goals state (remove in production)
  // console.log('Goals state:', goals);
  // console.log('Loading state:', loading);
  // console.log('Goals length:', goals.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
      {/* Navbar */}
      <nav className="glass-effect shadow-xl border-b border-white/20 sticky top-0 z-40">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Name */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <div className="relative">
                <img src="/livewell-logo.svg" alt="LiveWell Logo" className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                LiveWell
              </span>
            </div>
            
            {/* Right side - Profile and Logout */}
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate('/profile')}
                className="group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="transition-transform duration-300 group-hover:scale-110"><i className="fi fi-sr-user"></i></span>
                <span>Profile</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header for when no goals exist */}
        {!loading && goals.length === 0 && (
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <i className="fi fi-sr-chart-pie text-white text-lg"></i>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent">Your Goals</h1>
              </div>
              <p className="text-xl text-gray-600 mb-6">Set, track, and achieve your health goals</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
              >
                <i className="fi fi-ss-plus text-lg"></i>
                <span>Create Your First Goal</span>
              </button>
            </div>
          </div>
        )}

        {/* Create Goal Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/30 bg-gradient-to-br from-white/90 to-gray-50/90">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Create New Goal</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fi fi-sr-cross text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Category
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {Object.entries(goalCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {newGoal.category === 'physical' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter the type of physical activity you want to achieve
                      </label>
                      <input
                        type="text"
                        value={newGoal.activityType}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, activityType: e.target.value }))}
                        placeholder="e.g., Walking"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter how many you want to achieve (Optional)
                      </label>
                      <input
                        type="text"
                        value={newGoal.targetAmount}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                        placeholder="e.g., 10000 Steps"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter how many days you want to achieve (Optional)
                      </label>
                      <input
                        type="number"
                        value={newGoal.targetDays}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, targetDays: e.target.value }))}
                        placeholder="e.g., 30"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </>
                )}

                {newGoal.category === 'vaccination' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vaccination Type
                      </label>
                      <input
                        type="text"
                        value={newGoal.vaccinationType}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, vaccinationType: e.target.value }))}
                        placeholder="e.g., Flu Shot, COVID-19 Booster, Tetanus"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vaccination Date
                      </label>
                      <input
                        type="date"
                        value={newGoal.vaccinationDate}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, vaccinationDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </>
                )}

                {newGoal.category === 'diet' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What is your Diet/Nutrition goals?
                      </label>
                      <input
                        type="text"
                        value={newGoal.dietGoal}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, dietGoal: e.target.value }))}
                        placeholder="Eat Daily Meals"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequency? How many times a day you want to achieve that (Optional)
                      </label>
                      <input
                        type="number"
                        value={newGoal.dietFrequency}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, dietFrequency: e.target.value }))}
                        placeholder="e.g., 3"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days (Optional)
                      </label>
                      <input
                        type="number"
                        value={newGoal.dietDays}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, dietDays: e.target.value }))}
                        placeholder="e.g., 30"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </>
                )}

                {newGoal.category === 'social' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Social Interaction Goal
                      </label>
                      <input
                        type="text"
                        value={newGoal.socialGoal}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, socialGoal: e.target.value }))}
                        placeholder="e.g., Attend Social Events"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How many would you like to attend? (Optional)
                      </label>
                      <input
                        type="number"
                        value={newGoal.socialCount}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, socialCount: e.target.value }))}
                        placeholder="e.g., 5"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </>
                )}

                {newGoal.category === 'quiz' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How many quizzes do you want to solve?
                      </label>
                      <input
                        type="number"
                        value={newGoal.quizCount}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, quizCount: e.target.value }))}
                        placeholder="e.g., 10"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/30 bg-gradient-to-br from-white/90 to-gray-50/90">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <i className="fi fi-sr-trash text-red-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Goal</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete this goal? This action cannot be undone, but don't worry - you can always create a new goal to continue your journey!
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    No, Keep It
                  </button>
                  <button
                    onClick={confirmDeleteGoal}
                    disabled={isDeleting}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      isDeleting 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark Complete Confirmation Modal */}
        {showMarkCompleteModal && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-effect rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/30 bg-gradient-to-br from-white/90 to-gray-50/90">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <i className="fi fi-sr-check text-green-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🎉 Amazing Work!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  You're about to mark this goal as complete! This is a fantastic achievement and shows your dedication to your health journey. Keep up the excellent work!
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelMarkComplete}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Not Yet
                  </button>
                  <button
                    onClick={confirmMarkComplete}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Yes, Complete It! 🎯
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Progress Summary - Show above cards when goals exist */}
        {!loading && goals.length > 0 && (
          <div className="mb-8 glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30 animate-fade-in-up">
            {/* Header with Icon and Create Button */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <i className="fi fi-sr-chart-line text-white text-lg"></i>
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Your Goals</h1>
                  <p className="text-sm text-gray-600">Set, track, and achieve your health goals</p>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                <div className="text-center lg:text-right">
                  <div className="text-2xl font-bold text-gray-900">{goals.length}</div>
                  <div className="text-xs text-gray-500">Total Goals</div>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <i className="fi fi-sr-plus text-lg"></i>
                  <span>Create New Goal</span>
                </button>
              </div>
            </div>
            
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Active Goals */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      {goals.filter(goal => !goal.isCompleted).length}
                    </div>
                    <div className="text-sm font-medium text-orange-700">Active Goals</div>
                    <div className="text-xs text-orange-600 mt-1">In Progress</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">
                    <i className="fi fi-sr-play text-orange-600 text-xl"></i>
                  </div>
                </div>
              </div>

              {/* Completed Goals */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {goals.filter(goal => goal.isCompleted).length}
                    </div>
                    <div className="text-sm font-medium text-green-700">Completed</div>
                    <div className="text-xs text-green-600 mt-1">Achievements</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                    <i className="fi fi-sr-check text-green-600 text-xl"></i>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {goals.length > 0 ? Math.round((goals.filter(goal => goal.isCompleted).length / goals.length) * 100) : 0}%
                    </div>
                    <div className="text-sm font-medium text-blue-700">Success Rate</div>
                    <div className="text-xs text-blue-600 mt-1">Completion</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                    <i className="fi fi-sr-trophy text-blue-600 text-xl"></i>
                  </div>
                </div>
              </div>

              {/* Goals with Progress */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {goals.filter(goal => getProgressPercentage(goal) !== null).length}
                    </div>
                    <div className="text-sm font-medium text-purple-700">Tracked</div>
                    <div className="text-xs text-purple-600 mt-1">With Progress</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
                    <i className="fi fi-sr-chart-pie text-purple-600 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Goals Toggle - Show when goals exist */}
        {!loading && goals.length > 0 && (
          <div className="mb-6 glass-effect rounded-lg p-4 shadow-lg card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'ongoing'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                On-going ({goals.filter(goal => !goal.isCompleted).length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'completed'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Completed ({goals.filter(goal => goal.isCompleted).length})
              </button>
            </div>
          </div>
        )}

        {/* Goals Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30 animate-fade-in-up">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your goals...</p>
            </div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30 animate-fade-in-up">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
              <p className="text-gray-600 mb-6">Start your health journey by creating your first goal!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals
              .filter(goal => {
                if (activeTab === 'ongoing') {
                  return !goal.isCompleted;
                } else if (activeTab === 'completed') {
                  return goal.isCompleted;
                }
                return true;
              })
              .map((goal) => {
              const category = goalCategories[goal.category];
              const progressStatus = getProgressStatus(goal);
              const progressPercentage = getProgressPercentage(goal);
              
              return (
                <div key={goal.id} className={`glass-effect rounded-xl p-6 shadow-2xl card-hover bg-gradient-to-br from-white/80 to-gray-50/80 border border-white/30 ${category.borderColor} hover:shadow-xl transition-all duration-300`}>
                  {/* Goal Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center text-white text-xl`}>
                      <i className={category.icon}></i>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${progressStatus.bgColor} ${progressStatus.color}`}>
                        {progressStatus.status}
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete goal"
                      >
                        <i className="fi fi-sr-trash text-sm"></i>
                      </button>
                    </div>
                  </div>

                  {/* Goal Details */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {goal.activityType || goal.vaccinationType || goal.dietGoal || goal.socialGoal || (goal.category === 'quiz' ? `Quiz Goal (${goal.quizCount})` : '') || category.name}
                    </h3>
                    {goal.category === 'physical' && (
                      <>
                        {goal.targetAmount && (
                          <p className="text-sm text-gray-600 mb-1">
                            Target: {goal.targetAmount}
                          </p>
                        )}
                        {goal.targetDays && (
                          <p className="text-sm text-gray-600 mb-1">
                            Days: {goal.completedDays} / {goal.targetDays}
                          </p>
                        )}
                        {goal.targetAmount && (
                          <p className="text-sm text-gray-600">
                            Progress: {goal.progress || goal.currentProgress || 0} / {goal.targetAmount}
                          </p>
                        )}
                      </>
                    )}
                    {goal.category === 'vaccination' && (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          Date: {new Date(goal.vaccinationDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Days Remaining: {getDaysRemaining(goal)}
                        </p>
                      </>
                    )}
                    {goal.category === 'diet' && (
                      <>
                        {goal.dietFrequency && (
                          <p className="text-sm text-gray-600 mb-1">
                            Frequency: {goal.dietFrequency} times/day
                          </p>
                        )}
                        {goal.dietDays && (
                          <p className="text-sm text-gray-600 mb-1">
                            Days: {goal.completedDays} / {goal.dietDays}
                          </p>
                        )}
                        {goal.dietFrequency && (
                          <p className="text-sm text-gray-600">
                            Progress: {goal.progress || goal.currentProgress || 0} / {goal.dietFrequency}
                          </p>
                        )}
                      </>
                    )}
                    {goal.category === 'social' && (
                      <>
                        {goal.socialCount && (
                          <p className="text-sm text-gray-600 mb-1">
                            Target: {goal.socialCount} events
                          </p>
                        )}
                        {goal.socialCount && (
                          <p className="text-sm text-gray-600">
                            Progress: {goal.progress || goal.currentProgress || 0} / {goal.socialCount}
                          </p>
                        )}
                      </>
                    )}
                    {goal.category === 'quiz' && (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          Target: {goal.quizCount} quizzes
                        </p>
                        <p className="text-sm text-gray-600">
                          Progress: {goal.progress || goal.currentProgress || 0} / {goal.quizCount}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Progress Bar - Only show if there's a valid target */}
                  {progressPercentage !== null && (goal.category === 'physical' || goal.category === 'diet' || goal.category === 'social' || goal.category === 'quiz') && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r ${category.color} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}


                  {/* Mark Complete Button */}
                  {!goal.isCompleted && (
                    <div className="mb-4">
                      <button
                        onClick={() => handleMarkComplete(goal.id, goal.goalType)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        {goal.category === 'vaccination' ? 'Mark Vaccination Complete' : 'Mark as Complete'}
                      </button>
                    </div>
                  )}

                  {/* Update Progress */}
                  {((goal.category === 'physical' && goal.targetAmount) || 
                    (goal.category === 'diet' && goal.dietFrequency) || 
                    (goal.category === 'social' && goal.socialCount) ||
                    (goal.category === 'quiz' && goal.quizCount)) && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Update Progress
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                handleUpdateProgress(goal.id, goal.goalType, value);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            const value = parseFloat(input.value);
                            if (!isNaN(value) && value >= 0) {
                              handleUpdateProgress(goal.id, goal.goalType, value);
                              input.value = '';
                            }
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Goal Status */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${goal.isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                        {goal.isCompleted ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-600">
                        {new Date(goal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Footer - Full width, positioned below content */}
      <div className="mt-32">
        <Footer />
      </div>

      {/* Achievement Notification */}
      {currentAchievement && (
        <AchievementNotification
          achievement={currentAchievement}
          onClose={() => setCurrentAchievement(null)}
        />
      )}

      {/* Floating Navigation Bar */}
      <FloatingNavbar />

    </div>
  );
};

export default Goals;
