import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import FloatingNavbar from '../../components/FloatingNavbar';
import Quiz from '../../components/Quiz';
import SocialEvents from '../../components/SocialEvents';
import AchievementNotification from '../../components/AchievementNotification';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';

const HealthDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Health');
  const [waterIntake, setWaterIntake] = useState(5);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [userQuizScores, setUserQuizScores] = useState({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({
    frailtyScore: 0,
    steps: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [medicineSchedule, setMedicineSchedule] = useState([]);
  const [hasMedicineSchedule, setHasMedicineSchedule] = useState(false);
  const [nextMedicine, setNextMedicine] = useState(null);
  const [vaccinationSchedule, setVaccinationSchedule] = useState({
    type: 'Flu shot',
    date: '2024-02-15',
    description: 'Annual influenza vaccination'
  });
  
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

  // Hardcoded 7-day historical data
  const historicalData = {
    frailtyScore: [
      { day: 'Today', score: 85, status: 'Excellent' },
      { day: 'Yesterday', score: 82, status: 'Good' },
      { day: '2 days ago', score: 78, status: 'Good' },
      { day: '3 days ago', score: 75, status: 'Good' },
      { day: '4 days ago', score: 80, status: 'Good' },
      { day: '5 days ago', score: 77, status: 'Good' },
      { day: '6 days ago', score: 73, status: 'Fair' }
    ],
    steps: [
      { day: 'Today', completed: 8500, goal: 10000, percentage: 85 },
      { day: 'Yesterday', completed: 8000, goal: 10000, percentage: 80 },
      { day: '2 days ago', completed: 9200, goal: 10000, percentage: 92 },
      { day: '3 days ago', completed: 7500, goal: 10000, percentage: 75 },
      { day: '4 days ago', completed: 8800, goal: 10000, percentage: 88 },
      { day: '5 days ago', completed: 6800, goal: 10000, percentage: 68 },
      { day: '6 days ago', completed: 9500, goal: 10000, percentage: 95 }
    ],
    waterIntake: [
      { day: 'Today', glasses: 6, goal: 8, percentage: 75 },
      { day: 'Yesterday', glasses: 8, goal: 8, percentage: 100 },
      { day: '2 days ago', glasses: 7, goal: 8, percentage: 88 },
      { day: '3 days ago', glasses: 5, goal: 8, percentage: 63 },
      { day: '4 days ago', glasses: 9, goal: 8, percentage: 113 },
      { day: '5 days ago', glasses: 6, goal: 8, percentage: 75 },
      { day: '6 days ago', glasses: 7, goal: 8, percentage: 88 }
    ],
    medicine: [
      { day: 'Today', taken: 2, total: 3, status: 'Partial' },
      { day: 'Yesterday', taken: 3, total: 3, status: 'Complete' },
      { day: '2 days ago', taken: 2, total: 3, status: 'Missed 1' },
      { day: '3 days ago', taken: 3, total: 3, status: 'Complete' },
      { day: '4 days ago', taken: 1, total: 3, status: 'Missed 2' },
      { day: '5 days ago', taken: 3, total: 3, status: 'Complete' },
      { day: '6 days ago', taken: 2, total: 3, status: 'Missed 1' }
    ]
  };

  const navigate = useNavigate();

  // Fetch health data from backend
  const fetchHealthData = async () => {
    try {
      // Fetch frailty data for steps and frailty score
      const frailtyData = await apiFetch('/api/get-frailty-info');
      
      if (frailtyData && frailtyData.frailtyInfo) {
        setHealthMetrics({
          frailtyScore: frailtyData.frailtyInfo.frailtyScore || 0,
          steps: frailtyData.frailtyInfo.steps || 0
        });
      }

      // Fetch medicine schedule
      await fetchMedicineSchedule();
      
      // Fetch quizzes and user scores
      await Promise.all([
        fetchQuizzes(),
        fetchUserQuizScores()
      ]);
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError('Failed to load health data');
      // Keep default values if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const quizData = await apiFetch('/api/quiz/get-quizzes');
      
      if (quizData && quizData.quizzes) {
        setQuizzes(quizData.quizzes);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchUserQuizScores = async () => {
    try {
      const scoresData = await apiFetch('/api/quiz/get-user-scores');
      
      if (scoresData && scoresData.quizScores) {
        setUserQuizScores(scoresData.quizScores);
      }
    } catch (err) {
      console.error('Error fetching user quiz scores:', err);
    }
  };

  // Fetch medicine schedule from backend
  const fetchMedicineSchedule = async () => {
    try {
      const medicineData = await apiFetch('/api/medicine/get-schedule');
      
      if (medicineData) {
        setMedicineSchedule(medicineData.medicines || []);
        setHasMedicineSchedule(medicineData.hasSchedule || false);
        setNextMedicine(medicineData.nextMedicine || null);
      }
    } catch (err) {
      console.error('Error fetching medicine schedule:', err);
      // Keep default empty state if fetch fails
    }
  };

  // Clear state when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      // User logged out, clear all state
      setWaterIntake(5);
      setSelectedQuiz(null);
      setQuizzes([]);
      setUserQuizScores({});
      setHealthMetrics({
        frailtyScore: 0,
        steps: 0
      });
      setError(null);
      setShowMedicineModal(false);
      setShowVaccinationModal(false);
      setShowMetricModal(false);
      setSelectedMetric('');
      setMedicineSchedule([]);
      setHasMedicineSchedule(false);
      setNextMedicine(null);
      setVaccinationSchedule({
        type: 'Flu shot',
        date: '2024-02-15',
        description: 'Annual influenza vaccination'
      });
    } else {
      // New user logged in, clear previous user's data first
      setWaterIntake(5);
      setSelectedQuiz(null);
      setQuizzes([]);
      setUserQuizScores({});
      setHealthMetrics({
        frailtyScore: 0,
        steps: 0
      });
      setError(null);
      setShowMedicineModal(false);
      setShowVaccinationModal(false);
      setShowMetricModal(false);
      setSelectedMetric('');
      setMedicineSchedule([]);
      setHasMedicineSchedule(false);
      setNextMedicine(null);
      setVaccinationSchedule({
        type: 'Flu shot',
        date: '2024-02-15',
        description: 'Annual influenza vaccination'
      });
    }
  }, [user]);

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      navigate('/dashboard');
    } else if (tab === 'Chat') {
      navigate('/chat');
    } else if (tab === 'Goals') {
      navigate('/goals');
    }
  };

  const incrementWater = () => {
    if (waterIntake < 20) { // Reasonable upper limit
      setWaterIntake(waterIntake + 1);
    }
  };

  const decrementWater = () => {
    if (waterIntake > 0) {
      setWaterIntake(waterIntake - 1);
    }
  };

  const handleQuizStart = (quizId) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (quiz) {
      setSelectedQuiz(quiz);
    }
  };

  const handleQuizComplete = async (quizId, score, answers = [], timeSpent = 0) => {
    try {
      // Submit quiz results to backend
      const response = await apiFetch('/api/quiz/submit-quiz', {
        method: 'POST',
        body: {
          quizId,
          score,
          answers,
          timeSpent
        }
      });

      // Show achievement notifications if any
      if (response.newAchievements && response.newAchievements.length > 0) {
        response.newAchievements.forEach(achievement => {
          showAchievement(achievement);
        });
      }

      // Refresh user scores
      await fetchUserQuizScores();
      setSelectedQuiz(null);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Error saving quiz results. Please try again.');
    }
  };

  const handleQuizClose = () => {
    setSelectedQuiz(null);
  };

  // Medicine Schedule Modal Functions
  const handleMedicineScheduleUpdate = (index, field, value) => {
    const updatedSchedule = medicineSchedule.map((medicine, i) => 
      i === index ? { ...medicine, [field]: value } : medicine
    );
    setMedicineSchedule(updatedSchedule);
  };

  const addMedicineField = () => {
    const newMedicine = {
      id: `med_${Date.now()}_${medicineSchedule.length}`,
      period: 'Morning',
      description: '',
      timing: 'After',
      time: '08:00'
    };
    setMedicineSchedule([...medicineSchedule, newMedicine]);
  };

  const removeMedicineField = (index) => {
    if (medicineSchedule.length > 0) {
      const updatedSchedule = medicineSchedule.filter((_, i) => i !== index);
      setMedicineSchedule(updatedSchedule);
    }
  };

  const saveMedicineSchedule = async () => {
    try {
      if (!user?.uid) {
        alert('User not logged in');
        return;
      }

      // Validate that all medicines have descriptions
      const hasEmptyDescriptions = medicineSchedule.some(med => !med.description.trim());
      if (hasEmptyDescriptions) {
        alert('Please fill in all medicine descriptions');
        return;
      }

      // Add unique IDs to medicines
      const medicinesWithIds = medicineSchedule.map((med, index) => ({
        ...med,
        id: med.id || `med_${Date.now()}_${index}`
      }));

      // Save to backend
      await apiFetch('/api/medicine/save-schedule', {
        method: 'POST',
        body: {
          uid: user.uid,
          medicines: medicinesWithIds
        }
      });

      // Update local state
      setMedicineSchedule(medicinesWithIds);
      setHasMedicineSchedule(true);
      
      // Refresh medicine data
      await fetchMedicineSchedule();
      
      setShowMedicineModal(false);
      alert('Medicine schedule saved successfully!');
    } catch (err) {
      console.error('Error saving medicine schedule:', err);
      alert('Error saving medicine schedule. Please try again.');
    }
  };

  // Vaccination Schedule Functions
  const handleVaccinationScheduleUpdate = (field, value) => {
    setVaccinationSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveVaccinationSchedule = () => {
    // Here you would normally save to database
    console.log('Saving vaccination schedule:', vaccinationSchedule);
    setShowVaccinationModal(false);
  };

  const markMedicineAsTaken = async (medicineId) => {
    try {
      if (!user?.uid) {
        alert('User not logged in');
        return;
      }

      const response = await apiFetch('/api/medicine/mark-taken', {
        method: 'POST',
        body: {
          medicineId,
          takenAt: new Date().toISOString()
        }
      });

      // Update local state with the next medicine from the response
      if (response.nextMedicine) {
        setNextMedicine(response.nextMedicine);
      } else {
        // If no next medicine, refresh the full schedule
        await fetchMedicineSchedule();
      }
      
      alert('Medicine marked as taken!');
    } catch (err) {
      console.error('Error marking medicine as taken:', err);
      alert('Error marking medicine as taken. Please try again.');
    }
  };

  const markVaccinationAsTaken = () => {
    // Here you would mark as taken in the database
    console.log('Marking vaccination as taken');
    // You could also update the schedule to set a new future date
  };

  // Handle metric card click
  const handleMetricClick = (metricType) => {
    setSelectedMetric(metricType);
    setShowMetricModal(true);
  };

  // Calculate days remaining until vaccination
  const getDaysUntilVaccination = () => {
    const today = new Date();
    const vaccinationDate = new Date(vaccinationSchedule.date);
    const timeDiff = vaccinationDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const getVaccinationReminderText = () => {
    const daysRemaining = getDaysUntilVaccination();
    if (daysRemaining > 0) {
      return `${vaccinationSchedule.type} coming in ${daysRemaining} days`;
    } else if (daysRemaining === 0) {
      return `${vaccinationSchedule.type} is due today`;
    } else {
      // Don't show anything for overdue vaccinations
      return '';
    }
  };

  // Get medicine reminder text
  const getMedicineReminderText = () => {
    if (!hasMedicineSchedule || !nextMedicine) {
      return 'Add your medicine schedule to get reminders';
    }
    
    const { medicine, hoursUntil } = nextMedicine;
    const timeStr = new Date(nextMedicine.nextTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    if (hoursUntil < 1) {
      return `Take ${medicine.description} now (${timeStr})`;
    } else if (hoursUntil < 24) {
      return `Next: ${medicine.description} in ${Math.round(hoursUntil)} hours (${timeStr})`;
    } else {
      return `Next: ${medicine.description} tomorrow at ${timeStr}`;
    }
  };

  // Health data combining real backend data with static data
  const healthData = {
    frailtyScore: healthMetrics.frailtyScore,
    stepsToday: healthMetrics.steps,
    stepsGoal: 10000,
    waterGoal: 8,
    medicineReminder: getMedicineReminderText(),
    vaccinationReminder: getVaccinationReminderText()
  };

  const getStepsProgress = () => {
    return (healthData.stepsToday / healthData.stepsGoal) * 100;
  };

  const getWaterProgress = () => {
    return (waterIntake / healthData.waterGoal) * 100;
  };

  const getQuizStatus = (quizId) => {
    if (userQuizScores[quizId]) {
      return {
        status: 'Completed',
        score: userQuizScores[quizId].lastScore,
        bestScore: userQuizScores[quizId].bestScore,
        attempts: userQuizScores[quizId].attempts,
        color: 'bg-green-100 text-green-700'
      };
    }
    return {
      status: 'Available',
      score: null,
      color: 'bg-blue-100 text-blue-700'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
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
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      {/* Enhanced Navbar */}
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
            
            {/* Right side - Profile */}
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
        {/* Enhanced Compact Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg flex items-center justify-center">
                <i className="fi fi-sr-heart text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Health Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Comprehensive health monitoring and insights
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Main Health Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Frailty Score */}
          <div 
            onClick={() => handleMetricClick('frailtyScore')}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-green-600 mb-2">{healthData.frailtyScore}</div>
                )}
                <div className="text-base font-medium text-green-700">Frailty Score</div>
                <div className="text-sm text-green-600 mt-1">out of 100</div>
              </div>
              <div className="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center">
                <i className="fi fi-sr-brain text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Steps Today */}
          <div 
            onClick={() => handleMetricClick('steps')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-blue-600 mb-2">{healthData.stepsToday.toLocaleString()}</div>
                )}
                <div className="text-base font-medium text-blue-700">Steps Today</div>
                <div className="text-sm text-blue-600 mt-1">
                  {loading ? 'Loading...' : `${getStepsProgress().toFixed(0)}% of goal`}
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-blue-200 flex items-center justify-center">
                <i className="fi fi-sr-steps-carreer text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Water Intake */}
          <div 
            onClick={() => handleMetricClick('waterIntake')}
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-cyan-600 mb-2">{waterIntake}</div>
                <div className="text-base font-medium text-cyan-700">Water Intake</div>
                <div className="text-sm text-cyan-600 mt-1">{getWaterProgress().toFixed(0)}% of goal</div>
              </div>
              <div className="w-14 h-14 rounded-full bg-cyan-200 flex items-center justify-center">
                <i className="fi fi-sr-glass text-cyan-600 text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Medicine Reminder */}
          <div 
            onClick={() => handleMetricClick('medicine')}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                {hasMedicineSchedule && nextMedicine ? (
                  <>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {new Date(nextMedicine.nextTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                    <div className="text-base font-medium text-orange-700">Medicine</div>
                    <div className="text-sm text-orange-600 mt-1">
                      {nextMedicine.hoursUntil < 1 ? 'Due Now' : 
                       nextMedicine.hoursUntil < 24 ? `In ${Math.round(nextMedicine.hoursUntil)}h` : 
                       'Tomorrow'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-orange-600 mb-2">+</div>
                    <div className="text-base font-medium text-orange-700">Add Schedule</div>
                    <div className="text-sm text-orange-600 mt-1">No medicines set</div>
                  </>
                )}
              </div>
              <div className="w-14 h-14 rounded-full bg-orange-200 flex items-center justify-center">
                <i className="fi fi-sr-pills text-orange-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Medicine Reminder */}
          <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-200/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Medicine Reminder</h3>
              <div className="text-2xl"><i className="fi fi-sr-pills text-gray-600"></i></div>
            </div>
            <p className="text-gray-700 mb-4">{healthData.medicineReminder}</p>
            <div className="flex space-x-3">
              {hasMedicineSchedule && nextMedicine ? (
                <>
                  <button 
                    onClick={() => markMedicineAsTaken(nextMedicine.medicine.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Mark as Taken
                  </button>
                  <button 
                    onClick={() => setShowMedicineModal(true)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Update Schedule
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowMedicineModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Add Medicine Schedule
                </button>
              )}
            </div>
          </div>

          {/* Vaccination Reminder */}
          <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vaccination Reminder</h3>
              <div className="text-2xl"><i className="fi fi-sr-syringe text-gray-600"></i></div>
            </div>
            {healthData.vaccinationReminder && (
              <p className="text-gray-700 mb-4">{healthData.vaccinationReminder}</p>
            )}
            {!healthData.vaccinationReminder && (
              <p className="text-gray-500 mb-4 italic">No upcoming vaccinations scheduled</p>
            )}
            <div className="flex space-x-3">
              <button 
                onClick={markVaccinationAsTaken}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Mark as Taken
              </button>
              <button 
                onClick={() => setShowVaccinationModal(true)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Update Vaccination Reminder
              </button>
            </div>
          </div>
        </div>

        {/* Quizzes Section */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border border-purple-200/50 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Health & Knowledge Quizzes</h3>
            <span className="text-base text-gray-600">Test your knowledge and earn badges</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingQuizzes ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
                <p className="text-lg text-gray-600">Loading quizzes...</p>
              </div>
            ) : quizzes.length > 0 ? (
              quizzes.map((quiz) => {
                const quizStatus = getQuizStatus(quiz.id);
                return (
                  <div key={quiz.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200/50 hover:border-purple-300/50 hover:transform hover:scale-105" onClick={() => handleQuizStart(quiz.id)}>
                    <div className="text-5xl mb-4">
                      <i className={`${quiz.icon} text-gray-600`}></i>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">{quiz.title}</h4>
                    <div className={`inline-block px-3 py-2 rounded-full text-sm font-semibold ${quizStatus.color}`}>
                      {quizStatus.status}
                    </div>
                    {quizStatus.score && (
                      <div className="text-sm text-green-600 mt-3 font-semibold">
                        Last Score: {quizStatus.score}%
                      </div>
                    )}
                    {quizStatus.bestScore && quizStatus.bestScore !== quizStatus.score && (
                      <div className="text-sm text-blue-600 mt-2 font-semibold">
                        Best: {quizStatus.bestScore}%
                      </div>
                    )}
                    {quizStatus.attempts && quizStatus.attempts > 1 && (
                      <div className="text-sm text-gray-500 mt-2">
                        {quizStatus.attempts} attempts
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-600">No quizzes available at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Social Events Section */}
        <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200/50 mb-8">
          <SocialEvents />
        </div>
      </div>

      {/* Quiz Modal */}
      {selectedQuiz && (
        <Quiz
          quiz={selectedQuiz}
          onComplete={handleQuizComplete}
          onClose={handleQuizClose}
        />
      )}

      {/* Medicine Schedule Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="glass-effect-strong rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {hasMedicineSchedule ? 'Update Medicine Schedule' : 'Add Medicine Schedule'}
                </h2>
                <button 
                  onClick={() => setShowMedicineModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {medicineSchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">💊</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No medicines scheduled</h3>
                    <p className="text-gray-500 mb-4">Add your first medicine to get started with reminders</p>
                    <button
                      onClick={addMedicineField}
                      className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                    >
                      Add First Medicine
                    </button>
                  </div>
                ) : (
                  medicineSchedule.map((medicine, index) => (
                    <div key={medicine.id} className="glass-effect rounded-xl p-4 border border-white/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Medicine {index + 1}</h3>
                      {medicineSchedule.length > 1 && (
                        <button
                          onClick={() => removeMedicineField(index)}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          <i className="fi fi-sr-trash"></i>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Period Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Period
                        </label>
                        <select
                          value={medicine.period}
                          onChange={(e) => handleMedicineScheduleUpdate(index, 'period', e.target.value)}
                          className="w-full p-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/20 backdrop-blur-sm text-gray-800"
                        >
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                          <option value="Night">Night</option>
                        </select>
                      </div>

                      {/* Time Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          value={medicine.time}
                          onChange={(e) => handleMedicineScheduleUpdate(index, 'time', e.target.value)}
                          className="w-full p-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/20 backdrop-blur-sm text-gray-800"
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={medicine.description}
                          onChange={(e) => handleMedicineScheduleUpdate(index, 'description', e.target.value)}
                          placeholder="e.g., Blood Pressure Medication"
                          className="w-full p-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                        />
                      </div>

                      {/* Before/After Meal Toggle */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meal Timing
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`timing-${medicine.id}`}
                              value="Before"
                              checked={medicine.timing === 'Before'}
                              onChange={(e) => handleMedicineScheduleUpdate(index, 'timing', e.target.value)}
                              className="mr-2 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">Before Meal</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`timing-${medicine.id}`}
                              value="After"
                              checked={medicine.timing === 'After'}
                              onChange={(e) => handleMedicineScheduleUpdate(index, 'timing', e.target.value)}
                              className="mr-2 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">After Meal</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Medicine Summary */}
                    <div className="mt-4 p-3 glass-effect rounded-xl border border-white/30 backdrop-blur-sm">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{medicine.period} Medicine:</span> {medicine.description} 
                        <span className="text-gray-500"> • {medicine.timing} meal • {medicine.time}</span>
                      </p>
                    </div>
                  </div>
                  ))
                )}

                {/* Add Field Button */}
                <button
                  onClick={addMedicineField}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <i className="fi fi-sr-plus"></i>
                  <span>Add Medicine Field</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={saveMedicineSchedule}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Save Schedule
                </button>
                <button
                  onClick={() => setShowMedicineModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vaccination Schedule Modal */}
      {showVaccinationModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="glass-effect-strong rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Update Vaccination Schedule</h2>
                <button 
                  onClick={() => setShowVaccinationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Vaccination Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vaccination Type
                  </label>
                  <select
                    value={vaccinationSchedule.type}
                    onChange={(e) => handleVaccinationScheduleUpdate('type', e.target.value)}
                    className="w-full p-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/20 backdrop-blur-sm text-gray-800"
                  >
                    <option value="Flu shot">Flu shot</option>
                    <option value="COVID-19 booster">COVID-19 booster</option>
                    <option value="Pneumonia vaccine">Pneumonia vaccine</option>
                    <option value="Shingles vaccine">Shingles vaccine</option>
                    <option value="Tetanus shot">Tetanus shot</option>
                    <option value="Hepatitis B">Hepatitis B</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Vaccination Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={vaccinationSchedule.date}
                    onChange={(e) => handleVaccinationScheduleUpdate('date', e.target.value)}
                    className="w-full p-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/20 backdrop-blur-sm text-gray-800"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={vaccinationSchedule.description}
                    onChange={(e) => handleVaccinationScheduleUpdate('description', e.target.value)}
                    placeholder="e.g., Annual influenza vaccination, recommended by doctor"
                    rows={3}
                    className="w-full p-3 border border-white/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/20 backdrop-blur-sm text-gray-800 placeholder-gray-500 resize-none"
                  />
                </div>

                {/* Vaccination Summary */}
                <div className="p-4 glass-effect rounded-xl border border-white/30 backdrop-blur-sm">
                  <h4 className="font-medium text-blue-900 mb-2">Vaccination Summary</h4>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">{vaccinationSchedule.type}</span> scheduled for{' '}
                    <span className="font-medium">
                      {new Date(vaccinationSchedule.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{vaccinationSchedule.description}</p>
                  <div className="mt-2 text-sm font-medium text-blue-800">
                    {(() => {
                      const daysRemaining = Math.ceil((new Date(vaccinationSchedule.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      if (daysRemaining > 0) {
                        return `${daysRemaining} days remaining`;
                      } else if (daysRemaining === 0) {
                        return 'Due today';
                      } else {
                        return `Overdue by ${Math.abs(daysRemaining)} days`;
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex space-x-4 mt-8">
                <button
                  onClick={saveVaccinationSchedule}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Schedule
                </button>
                <button
                  onClick={() => setShowVaccinationModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Summary Modal */}
      {showMetricModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="glass-effect-strong rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMetric === 'frailtyScore' && 'Frailty Score History'}
                  {selectedMetric === 'steps' && 'Steps History'}
                  {selectedMetric === 'waterIntake' && 'Water Intake History'}
                  {selectedMetric === 'medicine' && 'Medicine History'}
                </h2>
                <button 
                  onClick={() => setShowMetricModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {selectedMetric === 'frailtyScore' && (
                  <div className="space-y-3">
                    {historicalData.frailtyScore.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/30 backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                            <i className="fi fi-sr-brain text-green-700"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.day}</p>
                            <p className="text-sm text-gray-600">Score: {item.score}/100</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                            item.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMetric === 'steps' && (
                  <div className="space-y-3">
                    {historicalData.steps.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/30 backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                            <i className="fi fi-sr-steps-carreer text-blue-700"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.day}</p>
                            <p className="text-sm text-gray-600">{item.completed.toLocaleString()} / {item.goal.toLocaleString()} steps</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-700">{item.percentage}%</span>
                          <div className="w-20 bg-blue-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMetric === 'waterIntake' && (
                  <div className="space-y-3">
                    {historicalData.waterIntake.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/30 backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-cyan-200 rounded-full flex items-center justify-center">
                            <i className="fi fi-sr-glass text-cyan-700"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.day}</p>
                            <p className="text-sm text-gray-600">{item.glasses} / {item.goal} glasses</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-cyan-700">{item.percentage}%</span>
                          <div className="w-20 bg-cyan-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-cyan-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMetric === 'medicine' && (
                  <div className="space-y-3">
                    {historicalData.medicine.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glass-effect rounded-xl border border-white/30 backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                            <i className="fi fi-sr-pills text-orange-700"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.day}</p>
                            <p className="text-sm text-gray-600">{item.taken} / {item.total} doses taken</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.status === 'Complete' ? 'bg-green-100 text-green-800' :
                            item.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowMetricModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Notification */}
      {currentAchievement && (
        <AchievementNotification
          achievement={currentAchievement}
          onClose={() => setCurrentAchievement(null)}
        />
      )}

      {/* Floating Navigation Bar */}
      <FloatingNavbar />

      {/* Footer - Full width, positioned below content */}
      <div className="mt-32">
        <Footer />
      </div>
    </div>
  );
};

export default HealthDashboard;
