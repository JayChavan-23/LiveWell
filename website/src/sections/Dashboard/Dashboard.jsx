import React, { useState, useEffect, useRef } from 'react';
import walkingImg from '../../assets/walking.jpg';
import vigorousImg from '../../assets/vigirious.jpg';
import strengthImg from '../../assets/strength.jpg';
import sedentaryImg from '../../assets/sedentary.jpg';
import socialImg from '../../assets/elderlysocial.jpg';
import quizImg from '../../assets/elderlyquiz.jpg';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import FloatingNavbar from '../../components/FloatingNavbar';
import AchievementNotification from '../../components/AchievementNotification';
import { QUIZZES } from '../../constants/quizzes';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../auth/AuthProvider';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState({
    steps: 0,
    frailtyScore: location.state?.frailtyScore || 68, // Use location state as fallback
    waterGlasses: 5,
    waterTarget: 8,
    medicineTime: '9:00 AM'
  });
  const [medicineData, setMedicineData] = useState({
    hasSchedule: false,
    nextMedicine: null
  });
  const [dailyExercise, setDailyExercise] = useState({
    briskWalk: '',
    vigorousActivity: '',
    strengthDays: '',
    sedentaryHours: ''
  });
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false);
  const carouselRef = useRef(null);
  const [showMotivationalPopup, setShowMotivationalPopup] = useState(false);
  const [currentMotivationalMessage, setCurrentMotivationalMessage] = useState(null);
  const previousUserRef = useRef(null);
  
  // Food Recipes State
  const [recipes, setRecipes] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [areas, setAreas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const recipesCarouselRef = useRef(null);
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(true);
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  // Challenges state
  const [challenges, setChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completionMessage, setCompletionMessage] = useState('');
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [myLeaderboardRank, setMyLeaderboardRank] = useState(null);
  const [myLeaderboardPoints, setMyLeaderboardPoints] = useState(0);
  const [myLeaderboardName, setMyLeaderboardName] = useState('You');
  const [myLeaderboardUid, setMyLeaderboardUid] = useState(null);
  // Challenges popup modal
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  // Challenge completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  // Challenges info tooltip
  const [showChallengesInfo, setShowChallengesInfo] = useState(false);
  // Full leaderboard modal
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [leaderboardMode, setLeaderboardMode] = useState('weekly'); // 'weekly' or 'alltime'
  const [fullLeaderboard, setFullLeaderboard] = useState([]);
  const [loadingFullLeaderboard, setLoadingFullLeaderboard] = useState(false);
  const [fullLeaderboardMyRank, setFullLeaderboardMyRank] = useState(null);
  const [fullLeaderboardMyPoints, setFullLeaderboardMyPoints] = useState(0);
  
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
  
  const getChallengeImage = (type) => {
    switch (type) {
      case 'steps':
        return walkingImg;
      case 'vigorousMinutes':
        return vigorousImg;
      case 'moderateMinutes':
        return walkingImg;
      case 'strengthDays':
        return strengthImg;
      case 'sedentaryHoursMax':
        return sedentaryImg;
      case 'socialActivity':
        return socialImg;
      case 'mentalActivity':
        return socialImg;
      case 'quiz':
        return quizImg;
      default:
        return walkingImg;
    }
  };

  // Close challenges info tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChallengesInfo && !event.target.closest('.challenges-info-tooltip')) {
        setShowChallengesInfo(false);
      }
    };

    if (showChallengesInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChallengesInfo]);

  // Motivational messages array
  const motivationalMessages = [
    {
      icon: 'fi fi-sr-heart',
      message: "Every step counts! You're doing great on your health journey! 💪",
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: 'fi fi-sr-sun',
      message: "Start your day with a positive mindset. Your health matters! ☀️",
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: 'fi fi-sr-trophy',
      message: "Consistency is key! Keep up the amazing work with your health goals! 🏆",
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: 'fi fi-sr-leaf',
      message: "Small changes lead to big results. You're on the right track! 🌱",
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'fi fi-sr-star',
      message: "Your dedication to health is inspiring! Keep shining bright! ⭐",
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'fi fi-sr-dumbbell',
      message: "Strength comes from within. You're stronger than you think! 💪",
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: 'fi fi-sr-smile',
      message: "A healthy body leads to a happy mind. You're doing fantastic! 😊",
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: 'fi fi-sr-target',
      message: "Focus on progress, not perfection. Every day is a new opportunity! 🎯",
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: 'fi fi-sr-moon',
      message: "Rest well, dream big! Tomorrow is a new opportunity! 🌙",
      color: 'from-indigo-500 to-purple-600'
    },
    {
      icon: 'fi fi-sr-rainbow',
      message: "Life is beautiful when you take care of yourself! 🌈",
      color: 'from-pink-400 to-purple-500'
    },
    {
      icon: 'fi fi-sr-fire',
      message: "You're on fire! Keep that energy burning! 🔥",
      color: 'from-orange-500 to-red-500'
    }
  ];

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Fetch health data from backend
  const fetchHealthData = async () => {
    try {
      // Fetch frailty data for steps and frailty score
      const frailtyData = await apiFetch('/api/get-frailty-info');
      
      if (frailtyData && frailtyData.frailtyInfo) {
        const updates = {};
        
        if (frailtyData.frailtyInfo.steps !== undefined) {
          updates.steps = frailtyData.frailtyInfo.steps;
        }
        
        if (frailtyData.frailtyInfo.frailtyScore !== undefined) {
          updates.frailtyScore = frailtyData.frailtyInfo.frailtyScore;
        }
        
        setHealthMetrics(prev => ({
          ...prev,
          ...updates
        }));
      }
    } catch (err) {
      console.error('Error fetching health data:', err);
      // Keep default values if fetch fails
    }
  };

  // Fetch medicine data from backend
  const fetchMedicineData = async () => {
    try {
      const medicineData = await apiFetch('/api/medicine/get-schedule');
      
      if (medicineData) {
        setMedicineData({
          hasSchedule: medicineData.hasSchedule || false,
          nextMedicine: medicineData.nextMedicine || null
        });
      }
    } catch (err) {
      console.error('Error fetching medicine data:', err);
      // Keep default empty state if fetch fails
    }
  };

  // Get random motivational message
  const getRandomMotivationalMessage = () => {
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    return motivationalMessages[randomIndex];
  };

  // Fetch all filter options (areas, categories, ingredients)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch areas
        const areasResponse = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?a=list');
        const areasData = await areasResponse.json();
        setAreas(areasData.meals || []);

        // Fetch categories
        const categoriesResponse = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.meals || []);

        // Fetch ingredients (limited to first 50 for performance)
        const ingredientsResponse = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
        const ingredientsData = await ingredientsResponse.json();
        setIngredients(ingredientsData.meals?.slice(0, 50) || []);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch random meals
  const fetchRandomMeals = async (count = 12) => {
    try {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(fetch('https://www.themealdb.com/api/json/v1/1/random.php'));
      }
      
      const responses = await Promise.all(promises);
      const dataPromises = responses.map(res => res.json());
      const results = await Promise.all(dataPromises);
      
      const randomMeals = results
        .filter(result => result.meals && result.meals.length > 0)
        .map(result => result.meals[0]);
      
      return randomMeals;
    } catch (error) {
      console.error('Error fetching random meals:', error);
      return [];
    }
  };

  // Fetch recipes based on selected filters
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoadingRecipes(true);
      try {
        let url = '';
        let meals = [];
        
        // Priority: Ingredient > Category > Area
        if (selectedIngredient) {
          setIsRandomMode(false);
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(selectedIngredient)}`;
          const response = await fetch(url);
          const data = await response.json();
          meals = data.meals || [];
        } else if (selectedCategory) {
          setIsRandomMode(false);
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(selectedCategory)}`;
          const response = await fetch(url);
          const data = await response.json();
          meals = data.meals || [];
        } else if (selectedArea) {
          setIsRandomMode(false);
          url = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(selectedArea)}`;
          const response = await fetch(url);
          const data = await response.json();
          meals = data.meals || [];
        } else {
          // Default: Random meals
          setIsRandomMode(true);
          meals = await fetchRandomMeals(12);
        }

        setRecipes(meals);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setRecipes([]);
      } finally {
        setLoadingRecipes(false);
      }
    };

    fetchRecipes();
  }, [selectedArea, selectedCategory, selectedIngredient]);

  // Fetch full recipe details
  const fetchRecipeDetails = async (mealId) => {
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
      const data = await response.json();
      if (data.meals && data.meals.length > 0) {
        setSelectedRecipe(data.meals[0]);
        setShowRecipeModal(true);
        setNutritionInfo(null); // Reset nutrition info when opening new recipe
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    }
  };

  // Ask chatbot about nutrition information
  const askChatbotAboutDish = async () => {
    if (!selectedRecipe) return;
    
    setLoadingNutrition(true);
    try {
      // Get ingredients list for context
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = selectedRecipe[`strIngredient${i}`];
        const measure = selectedRecipe[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
          ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`);
        }
      }

      const prompt = `Analyze this dish for nutritional information: "${selectedRecipe.strMeal}" with ingredients: ${ingredients.join(', ')}. 
      
      Provide a brief summary (3-4 sentences max) about:
      1. Approximate calories per serving
      2. Main nutrients (protein, carbs, fats)
      3. Health benefits or concerns
      4. Is it suitable for elderly people?
      
      Keep it concise and easy to understand.`;

      const response = await apiFetch('/api/chat', {
        method: 'POST',
        body: {
          message: prompt,
          conversationHistory: []
        }
      });

      if (response && response.reply) {
        setNutritionInfo(response.reply);
      }
    } catch (error) {
      console.error('Error fetching nutrition info:', error);
      setNutritionInfo('Sorry, I couldn\'t analyze this dish right now. Please try again later or ask in the main chat.');
    } finally {
      setLoadingNutrition(false);
    }
  };

  // Handle filter changes with toggle functionality
  const handleAreaChange = (area) => {
    if (selectedArea === area) {
      // If clicking the same area, deselect it
      setSelectedArea('');
    } else {
      // Otherwise, select the new area
      setSelectedArea(area);
      setSelectedCategory('');
      setSelectedIngredient('');
    }
  };

  const handleCategoryChange = (category) => {
    if (selectedCategory === category) {
      // If clicking the same category, deselect it
      setSelectedCategory('');
    } else {
      // Otherwise, select the new category
      setSelectedCategory(category);
      setSelectedIngredient('');
    }
  };

  const handleIngredientChange = (ingredient) => {
    if (selectedIngredient === ingredient) {
      // If clicking the same ingredient, deselect it
      setSelectedIngredient('');
    } else {
      // Otherwise, select the new ingredient
      setSelectedIngredient(ingredient);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedArea('');
    setSelectedCategory('');
    setSelectedIngredient('');
    setIsRandomMode(true);
  };

  // Refresh random meals
  const refreshRandomMeals = async () => {
    setLoadingRecipes(true);
    try {
      const meals = await fetchRandomMeals(12);
      setRecipes(meals);
    } catch (error) {
      console.error('Error refreshing random meals:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  // Scroll recipes carousel
  const scrollRecipesCarousel = (direction) => {
    if (recipesCarouselRef.current) {
      const scrollAmount = 320;
      const currentScroll = recipesCarouselRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      recipesCarouselRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Show motivational popup on component mount
  useEffect(() => {
    // Set a random motivational message once
    const randomMessage = getRandomMotivationalMessage();
    setCurrentMotivationalMessage(randomMessage);
    
    // Show popup after a short delay to ensure page is loaded
    const timer = setTimeout(() => {
      setShowMotivationalPopup(true);
    }, 1000);

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setShowMotivationalPopup(false);
      setMedicineData({
        hasSchedule: false,
        nextMedicine: null
      });
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Clear state when user changes (logout/login)
  useEffect(() => {
    const currentUserId = authUser?.uid;
    const previousUserId = previousUserRef.current;
    
    // If user changed (different user logged in), clear all state first
    if (currentUserId && previousUserId && currentUserId !== previousUserId) {
      // Clear localStorage as well to ensure no cached data
      localStorage.removeItem('userData');
      localStorage.removeItem('healthData');
      
      setUser(null);
      setError(null);
      setHealthMetrics({
        steps: 0,
        frailtyScore: 68,
        waterGlasses: 5,
        waterTarget: 8,
        medicineTime: '9:00 AM'
      });
      setDailyExercise({
        briskWalk: '',
        vigorousActivity: '',
        strengthDays: '',
        sedentaryHours: ''
      });
      setShowMotivationalPopup(false);
      setMedicineData({
        hasSchedule: false,
        nextMedicine: null
      });
    } else if (!authUser) {
      // User logged out, clear all state
      setUser(null);
      setError(null);
      setHealthMetrics({
        steps: 0,
        frailtyScore: 68,
        waterGlasses: 5,
        waterTarget: 8,
        medicineTime: '9:00 AM'
      });
      setDailyExercise({
        briskWalk: '',
        vigorousActivity: '',
        strengthDays: '',
        sedentaryHours: ''
      });
      setShowMotivationalPopup(false);
      setMedicineData({
        hasSchedule: false,
        nextMedicine: null
      });
    }
    
    // Update the ref with current user
    previousUserRef.current = currentUserId;
  }, [authUser]);

  // Fetch user data from backend
  useEffect(() => {
    if (!authUser) return; // Don't fetch if no user
    
    // Longer delay to ensure state clearing happens first
    const timer = setTimeout(() => {
      const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await apiFetch('/api/users/get-data');

        // Calculate age from date of birth
        const age = calculateAge(userData.dob);

        // Create user object with real data
        const userObject = {
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          age: age,
          avatar: 'fi fi-sr-user', // Placeholder avatar
          frailtyScore: healthMetrics.frailtyScore,
          achievements: [
            { title: 'General Knowledge Master', icon: 'fi fi-sr-brain', category: 'Quiz Achievement' },
            { title: 'World Explorer', icon: 'fi fi-sr-globe', category: 'Quiz Achievement' },
            { title: 'Math Whiz', icon: 'fi fi-sr-calculator', category: 'Quiz Achievement' },
            { title: 'Health Expert', icon: 'fi fi-sr-heart', category: 'Quiz Achievement' }
          ]
        };

        setUser(userObject);

        // Also fetch health data
        await fetchHealthData();
        
        // Fetch medicine data
        await fetchMedicineData();

        // Initialize challenges once (if first time) and fetch
        setLoadingChallenges(true);
        try {
          const initResult = await apiFetch('/api/challenges/init', { method: 'POST' });
          // Show modal if challenges were just created
          if (initResult && initResult.initialized) {
            setShowChallengesModal(true);
          }
        } catch (_) {}
        try {
          const ch = await apiFetch('/api/challenges');
          setChallenges(ch.challenges || []);
          setCurrentStreak(ch.currentStreak || 0);
        } catch (e) {
          console.error('Error fetching challenges:', e);
        } finally {
          setLoadingChallenges(false);
        }

        // Fetch leaderboard
        try {
          setLoadingLeaderboard(true);
          const lb = await apiFetch('/api/leaderboard?limit=5');
          setLeaderboard(lb.leaderboard || []);
          setMyLeaderboardRank(lb.myRank || null);
          setMyLeaderboardPoints(lb.myPoints || 0);
          setMyLeaderboardName(lb.myDisplayName || 'You');
          setMyLeaderboardUid(lb.myUid || null);
        } catch (e) {
          console.error('Error fetching leaderboard:', e);
        } finally {
          setLoadingLeaderboard(false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');

        // Fallback to mock data if API fails
        const fallbackUser = {
          name: 'User',
          age: null,
          avatar: 'fi fi-sr-user',
          frailtyScore: healthMetrics.frailtyScore,
          achievements: [
            { title: 'General Knowledge Master', icon: 'fi fi-sr-brain', category: 'Quiz Achievement' },
            { title: 'World Explorer', icon: 'fi fi-sr-globe', category: 'Quiz Achievement' },
            { title: 'Math Whiz', icon: 'fi fi-sr-calculator', category: 'Quiz Achievement' },
            { title: 'Health Expert', icon: 'fi fi-sr-heart', category: 'Quiz Achievement' }
          ]
        };
        setUser(fallbackUser);
        
        // Still try to fetch health data
        await fetchHealthData();
        // Even if user fetch failed, attempt to load challenges
        try {
          setLoadingChallenges(true);
          const ch = await apiFetch('/api/challenges');
          setChallenges(ch.challenges || []);
          setCurrentStreak(ch.currentStreak || 0);
        } catch (_) {
        } finally {
          setLoadingChallenges(false);
        }
        // Leaderboard attempt
        try {
          setLoadingLeaderboard(true);
          const lb = await apiFetch('/api/leaderboard?limit=5');
          setLeaderboard(lb.leaderboard || []);
          setMyLeaderboardRank(lb.myRank || null);
          setMyLeaderboardPoints(lb.myPoints || 0);
          setMyLeaderboardName(lb.myDisplayName || 'You');
          setMyLeaderboardUid(lb.myUid || null);
        } catch (_) {
        } finally {
          setLoadingLeaderboard(false);
        }
      } finally {
        setLoading(false);
      }
      };

      fetchUserData();
    }, 200); // Longer delay to ensure state clearing happens first

    return () => clearTimeout(timer);
  }, [authUser, healthMetrics.frailtyScore]);

  const completeChallenge = async (id) => {
    if (completingId) return;
    setCompletingId(id);
    try {
      const result = await apiFetch('/api/challenges/complete', { method: 'POST', body: { id } });
      
      // refresh challenges
      const ch = await apiFetch('/api/challenges');
      setChallenges(ch.challenges || []);
      setCurrentStreak(ch.currentStreak || 0);
      
      // Set completion message based on whether this was the last challenge
      if (result.isLastChallenge && result.streakUpdated) {
        setCompletionMessage(`Congratulations! You've completed all challenges for today! 🔥\nYour streak: ${result.newStreak} day${result.newStreak > 1 ? 's' : ''}!`);
      } else {
        setCompletionMessage('Challenge completed! Keep up the good work!');
      }
      
      // Show completion modal
      setShowCompletionModal(true);
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        setShowCompletionModal(false);
      }, 2000);
      
      // Show achievement notifications if any
      if (result.newAchievements && result.newAchievements.length > 0) {
        result.newAchievements.forEach(achievement => {
          showAchievement(achievement);
        });
      }
      
      // Also refresh leaderboard to show updated points
      try {
        const lb = await apiFetch('/api/leaderboard?limit=5');
        setLeaderboard(lb.leaderboard || []);
        setMyLeaderboardRank(lb.myRank || null);
        setMyLeaderboardPoints(lb.myPoints || 0);
        setMyLeaderboardName(lb.myDisplayName || 'You');
        setMyLeaderboardUid(lb.myUid || null);
      } catch (_) {}
    } catch (e) {
      console.error('Error completing challenge:', e);
    } finally {
      setCompletingId(null);
    }
  };

  const fetchFullLeaderboard = async (mode) => {
    setLoadingFullLeaderboard(true);
    try {
      const lb = await apiFetch(`/api/leaderboard/full?mode=${mode}`);
      setFullLeaderboard(lb.leaderboard || []);
      setFullLeaderboardMyRank(lb.myRank || null);
      setFullLeaderboardMyPoints(lb.myPoints || 0);
    } catch (e) {
      console.error('Error fetching full leaderboard:', e);
    } finally {
      setLoadingFullLeaderboard(false);
    }
  };

  // Fetch full leaderboard when modal opens or mode changes
  useEffect(() => {
    if (showLeaderboardModal) {
      fetchFullLeaderboard(leaderboardMode);
    }
  }, [showLeaderboardModal, leaderboardMode]);

  const reminders = [
    {
      title: 'Medicine Reminder',
      description: 'Time to take your daily medication',
      cta: 'Mark as Taken',
      icon: 'fi fi-sr-pills'
    },
    {
      title: 'Steps Reminder',
      description: 'Aim for 10,000 steps today',
      cta: 'Track Steps',
      icon: 'fi fi-sr-steps-carreer'
    },
    {
      title: 'Water Intake Reminder',
      description: 'Stay hydrated! Drink 8 glasses of water',
      cta: 'Log Water',
      icon: 'fi fi-sr-glass'
    },
    {
      title: 'Mental Quiz Reminder',
      description: 'Take a quick mental wellness check',
      cta: 'Start Quiz',
      icon: 'fi fi-sr-brain'
    },
    {
      title: 'Exercise Reminder',
      description: 'Time for your daily workout routine',
      cta: 'Start Workout',
      icon: 'fi fi-sr-treadmill'
    },
    {
      title: 'Sleep Reminder',
      description: 'Prepare for a good night\'s sleep',
      cta: 'Set Sleep Time',
      icon: 'fi fi-sr-moon'
    },
    {
      title: 'Nutrition Reminder',
      description: 'Plan your healthy meals for today',
      cta: 'Plan Meals',
      icon: 'fi fi-sr-salad'
    },
    {
      title: 'Social Reminder',
      description: 'Connect with friends and family',
      cta: 'Make Call',
      icon: 'fi fi-sr-users'
    }
  ];

  const getScoreCategory = (score) => {
    if (score >= 80) return { category: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { category: 'Doing Well', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 40) return { category: 'Keep Improving', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 20) return { category: 'Needs Attention', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { category: 'Let’s Get Stronger', color: 'text-red-600', bgColor: 'bg-red-100' };
  };
  

  const getScoreRange = (score) => {
    if (score >= 80) return '80-100';
    if (score >= 60) return '60-79';
    if (score >= 40) return '40-59';
    if (score >= 20) return '20-39';
    return '0-19';
  };

  const getImprovementTip = (score) => {
    if (score >= 80) return 'Maintain your current activity level and try new activities.';
    if (score >= 60) return 'Increase moderate activity to 150+ minutes per week.';
    if (score >= 40) return 'Start with 10-15 minutes of daily walking.';
    return 'Begin with 5-10 minutes of gentle walking daily.';
  };

  const getScoreDescription = (score) => {
    if (score >= 80) return 'You have excellent physical activity levels. Keep up the great work!';
    if (score >= 60) return 'You have good physical activity levels. Consider increasing intensity or duration for even better results.';
    if (score >= 40) return 'Your physical activity levels are fair. Focus on increasing daily movement and exercise frequency.';
    if (score >= 20) return 'Your physical activity levels need improvement. Start with small, manageable increases in daily activity.';
    return 'Your physical activity levels are very low. Consult with a healthcare provider to develop a safe exercise plan.';
  };

  const getImprovementTips = (score) => {
    if (score >= 80) {
      return [
        'Maintain your current activity level',
        'Try new activities to keep things interesting',
        'Focus on strength training 2-3 times per week'
      ];
    } else if (score >= 60) {
      return [
        'Increase moderate activity to 150+ minutes per week',
        'Add 1-2 more days of strength training',
        'Aim for 8,000+ steps daily'
      ];
    } else if (score >= 40) {
      return [
        'Start with 10-15 minutes of daily walking',
        'Add light strength exercises 2-3 times per week',
        'Gradually increase daily steps to 6,000+'
      ];
    } else {
      return [
        'Begin with 5-10 minutes of gentle walking',
        'Consult healthcare provider before starting exercise',
        'Focus on daily movement and reducing sitting time'
      ];
    }
  };

  const scoreInfo = getScoreCategory(healthMetrics.frailtyScore);
  const totalPages = Math.ceil(reminders.length / 4);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Chat') {
      navigate('/chat');
    } else if (tab === 'Health') {
      navigate('/health');
    } else if (tab === 'Goals') {
      navigate('/goals');
    }
  };



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

  // Redirect to login if no user
  if (!authUser) {
    navigate('/');
    return null;
  }

  // Handle daily exercise form
  const handleExerciseInputChange = (e) => {
    const { name, value } = e.target;
    setDailyExercise(prev => ({ ...prev, [name]: value }));
  };

  // Handle increment/decrement for exercise fields
  const handleExerciseIncrement = (fieldName, maxValue) => {
    setDailyExercise(prev => {
      const currentValue = parseFloat(prev[fieldName]) || 0;
      const newValue = Math.min(currentValue + (fieldName === 'sedentaryHours' ? 0.5 : 1), maxValue);
      return { ...prev, [fieldName]: newValue.toString() };
    });
  };

  const handleExerciseDecrement = (fieldName) => {
    setDailyExercise(prev => {
      const currentValue = parseFloat(prev[fieldName]) || 0;
      const newValue = Math.max(currentValue - (fieldName === 'sedentaryHours' ? 0.5 : 1), 0);
      return { ...prev, [fieldName]: newValue.toString() };
    });
  };

  const handleExerciseSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingExercise) return;

    setIsSubmittingExercise(true);
    try {
      const uid = authUser?.uid;
      if (!uid) throw new Error('No user logged in');

      // Submit daily exercise data to backend
      await apiFetch('/api/post-daily-exercise', {
        method: 'POST',
        body: { 
          uid, 
          ...dailyExercise,
          date: new Date().toISOString().split('T')[0] // Today's date
        },
      });

      alert('Exercise data saved successfully!');
      
      // Reset form
      setDailyExercise({
        briskWalk: '',
        vigorousActivity: '',
        strengthDays: '',
        sedentaryHours: ''
      });
    } catch (err) {
      console.error('Error saving exercise data:', err);
      alert('Error saving exercise data. Please try again.');
    } finally {
      setIsSubmittingExercise(false);
    }
  };

  // Get today's date formatted
  const getTodaysDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Carousel scroll function
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320; // Width of one video card + gap
      const currentScroll = carouselRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <style jsx>{`
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fade-in-up {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
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

      {/* Enhanced Motivational Popup */}
      {showMotivationalPopup && currentMotivationalMessage && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className={`bg-gradient-to-r ${currentMotivationalMessage.color} rounded-2xl p-6 shadow-2xl border border-white/30 max-w-sm`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center animate-pulse-glow shadow-lg">
                  <i className={`${currentMotivationalMessage.icon} text-white text-xl`}></i>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm leading-relaxed drop-shadow-sm">
                  {currentMotivationalMessage.message}
                </p>
              </div>
              <button
                onClick={() => setShowMotivationalPopup(false)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-all duration-300 hover:scale-110 p-1 rounded-full hover:bg-white/20"
              >
                <i className="fi fi-sr-cross text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Compact Header */}
        <div className="mb-8 animate-fade-in-up">
          {loading || authLoading ? (
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse-glow flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Loading...
                </h1>
                <p className="text-sm text-gray-600">Please wait while we load your data</p>
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-600 rounded-full shadow-md flex items-center justify-center">
                  <i className="fi fi-sr-user text-white text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Good Morning{user.firstName ? `, ${user.firstName}` : ''}!
                  </h1>
                  <p className="text-base text-gray-700 mt-1">
                    Welcome to LiveWell - Track your health progress
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Today's Date</p>
                  <p className="text-lg font-semibold text-gray-700">{getTodaysDate()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-600 rounded-full shadow-md flex items-center justify-center">
                <i className="fi fi-sr-heart text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome to LiveWell
                </h1>
                <p className="text-base text-gray-700 mt-1">
                  Track your health progress and stay motivated
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Main Cards Section - 3 Column Layout */}
        {loading || authLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="glass-effect rounded-2xl p-6 shadow-2xl col-span-3 card-hover">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse-glow">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Loading your profile...</h3>
                <p className="text-sm text-gray-600">Please wait while we fetch your data</p>
              </div>
            </div>
          </div>
        ) : user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Enhanced Left Card - User Profile */}
            <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border border-purple-200/50 flex flex-col justify-center">
              <div className="flex flex-col items-center text-center space-y-5">
                <div className="relative">
                  <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center text-4xl text-green-700">
                    <i className={user.avatar}></i>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-500 rounded-full border-4 border-white flex items-center justify-center">
                    <i className="fi fi-sr-check text-white text-base"></i>
                  </div>
                </div>
                <div className="w-full">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    {user.name}
                  </h2>
                  {user.age && (
                    <p className="text-lg text-gray-700 bg-green-50 px-5 py-2 rounded-full inline-block font-medium">
                      Age: {user.age}
                    </p>
                  )}
                </div>

                <div className="w-full p-6 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-900">Health Score</span>
                    <span className="text-sm text-gray-600 font-medium">Current</span>
                  </div>
                  <div>
                    <span className="text-4xl font-bold text-green-700">{getScoreCategory(user.frailtyScore).category}</span>
                    <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                      <div 
                        className="bg-green-600 h-4 rounded-full transition-all duration-1000" 
                        style={{ width: `${Math.min((user.frailtyScore / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Enhanced Middle Card - How to Improve */}
          <div className="glass-effect rounded-2xl p-8 shadow-2xl card-hover bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 flex flex-col justify-center">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <i className="fi fi-sr-chart-line-up text-white text-3xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Health Improvement</h3>
                <p className="text-base text-gray-700 font-medium">Personalized tips for you</p>
              </div>
            </div>

            <div>
              <div className="bg-orange-50 p-6 rounded-xl border-2 border-orange-200">
                <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                    <i className="fi fi-sr-lightbulb-on text-white text-xl"></i>
                  </div>
                  How to improve:
                </h4>
                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                  {getImprovementTip(healthMetrics.frailtyScore)}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Right Card - Leaderboard */}
          <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 border border-teal-200/50">
            <div className="flex items-center space-x-3 mb-5">
              <div className="flex-shrink-0 w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <i className="fi fi-sr-trophy text-white text-xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Leaderboard</h3>
                <p className="text-sm text-gray-700 font-medium">Top players by points</p>
              </div>
            </div>
            {loadingLeaderboard ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((row, idx) => {
                  const isCurrentUser = row.uid === myLeaderboardUid;
                  return (
                    <div 
                      key={row.uid || idx} 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isCurrentUser ? 'bg-green-50 border-2 border-green-300' : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${isCurrentUser ? 'text-green-700' : 'text-gray-600'}`}>
                          #{idx + 1}
                        </span>
                        <span className={`text-base font-semibold truncate max-w-[140px] ${isCurrentUser ? 'text-green-900' : 'text-gray-900'}`}>
                          {isCurrentUser ? 'You' : row.displayName || 'User'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${isCurrentUser ? 'text-green-700' : 'text-gray-700'}`}>
                        {row.points || 0} pts
                      </span>
                    </div>
                  );
                })}
                
                {/* Show current user if not in top 5 */}
                {myLeaderboardRank && myLeaderboardRank > 5 && (
                  <>
                    <div className="border-t-2 border-gray-200 my-3"></div>
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-50 border-2 border-green-300">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-green-700">
                          #{myLeaderboardRank}
                        </span>
                        <span className="text-base font-semibold text-green-900 truncate max-w-[140px]">
                          You
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-700">
                        {myLeaderboardPoints} pts
                      </span>
                    </div>
                  </>
                )}
                
                {leaderboard.length === 0 && (
                  <div className="text-sm text-gray-700 text-center py-6 font-medium">No leaderboard data yet</div>
                )}
              </div>
            )}
            <button 
              onClick={() => setShowLeaderboardModal(true)}
              className="w-full mt-5 bg-teal-500 text-white py-3 px-4 rounded-xl text-base font-bold hover:bg-teal-600 transition-all duration-300 shadow-md">
              View Full Leaderboard
            </button>
          </div>
        </div>
        ) : null}

        {/* Enhanced Health Dashboard Preview Section */}
        <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/50 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 rounded-full">
                <i className="fi fi-sr-chart-pie text-white text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Health Overview</h3>
                <p className="text-base text-gray-700 font-medium">Quick glimpse of your health activities</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/health')}
              className="group bg-green-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-700 transition-all duration-300 flex items-center space-x-2 text-base shadow-md"
            >
              <span>View Full Dashboard</span>
              <i className="fi fi-sr-arrow-right group-hover:translate-x-1 transition-transform duration-300"></i>
            </button>
          </div>

          {/* Enhanced Health Metrics Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Enhanced Steps Preview */}
            <div className="group glass-effect rounded-2xl p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 hover:border-green-300/70 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fi fi-sr-steps-carreer text-green-600 text-xl"></i>
                </div>
                <span className="text-sm text-gray-700 bg-green-50 px-3 py-1 rounded-full font-bold border border-green-200">Today</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{healthMetrics.steps.toLocaleString()}</div>
              <div className="text-base text-gray-800 font-bold mb-3">Steps Walked</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((healthMetrics.steps / 10000) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-700 font-semibold">{Math.round((healthMetrics.steps / 10000) * 100)}% of 10,000 goal</div>
            </div>

            {/* Enhanced Water Intake Preview */}
            <div className="group glass-effect rounded-2xl p-5 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 hover:border-cyan-300/70 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <i className="fi fi-sr-glass text-cyan-600 text-xl"></i>
                </div>
                <span className="text-sm text-gray-700 bg-cyan-50 px-3 py-1 rounded-full font-bold border border-cyan-200">Today</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{healthMetrics.waterGlasses}</div>
              <div className="text-base text-gray-800 font-bold mb-3">Glasses of Water</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-cyan-600 h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((healthMetrics.waterGlasses / healthMetrics.waterTarget) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-700 font-semibold">{Math.round((healthMetrics.waterGlasses / healthMetrics.waterTarget) * 100)}% of {healthMetrics.waterTarget} glasses goal</div>
            </div>

            {/* Enhanced Medicine Reminder Preview */}
            <div 
              onClick={() => navigate('/health')}
              className="group glass-effect rounded-2xl p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 cursor-pointer shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="fi fi-sr-pills text-orange-600 text-xl"></i>
                </div>
                <span className="text-sm text-gray-700 bg-orange-50 px-3 py-1 rounded-full font-bold border border-orange-200">
                  {medicineData.hasSchedule ? 'Scheduled' : 'Add'}
                </span>
              </div>
              {medicineData.hasSchedule && medicineData.nextMedicine ? (
                <>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {new Date(medicineData.nextMedicine.nextTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                  <div className="text-base text-gray-800 font-bold mb-3">
                    {medicineData.nextMedicine.medicine.description}
                  </div>
                  <div className="text-sm text-gray-700 font-semibold mb-3">
                    {medicineData.nextMedicine.hoursUntil < 1 ? 'Due Now' : 
                     medicineData.nextMedicine.hoursUntil < 24 ? `In ${Math.round(medicineData.nextMedicine.hoursUntil)}h` : 
                     'Tomorrow'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900 mb-2">+</div>
                  <div className="text-base text-gray-800 font-bold mb-3">Add Medicine Schedule</div>
                  <div className="text-sm text-gray-700 font-semibold mb-3">No medicines set</div>
                </>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/health');
                }}
                className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all duration-300 shadow-md"
              >
                <i className="fi fi-sr-arrow-right mr-1"></i>
                {medicineData.hasSchedule ? 'Manage Schedule' : 'Add Schedule'}
              </button>
            </div>
          </div>

 
        </div>

        {/* Challenges Section */}
        <div className="glass-effect rounded-2xl p-6 shadow-2xl card-hover bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-200/50 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-full">
                <i className="fi fi-sr-flag text-white text-2xl"></i>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">Today's Challenges</h3>
                  <div className="relative challenges-info-tooltip">
                    <button
                      onClick={() => setShowChallengesInfo(!showChallengesInfo)}
                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all duration-200 group"
                    >
                      <i className="fi fi-sr-interrogation text-gray-700 group-hover:text-gray-900 text-sm font-bold"></i>
                    </button>
                    {showChallengesInfo && (
                      <div className="absolute left-0 top-9 z-10 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-5 animate-fade-in-up">
                        <button
                          onClick={() => setShowChallengesInfo(false)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                          <i className="fi fi-sr-cross text-sm"></i>
                        </button>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center text-lg">
                          <i className="fi fi-sr-info text-green-600 mr-2 text-xl"></i>
                          About Daily Challenges
                        </h4>
                        <p className="text-base text-gray-800 leading-relaxed mb-3 font-medium">
                          Challenges are designed to keep you active every day! They refresh automatically at midnight with new personalized tasks.
                        </p>
                        <p className="text-base text-gray-800 leading-relaxed font-medium">
                          Complete them to earn <span className="font-bold text-orange-600">25 points each</span> and climb the leaderboard. Your points accumulate forever!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-base text-gray-700 font-medium">Fresh challenges every day • Earn points and climb the leaderboard</p>
              </div>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-3 bg-orange-50 px-5 py-3 rounded-xl border-2 border-orange-300 shadow-md">
                <span className="text-base font-bold text-gray-900">Current Streak</span>
                <span className="text-3xl">🔥</span>
                <span className="text-2xl font-bold text-orange-600">{currentStreak}</span>
              </div>
            )}
          </div>
          {loadingChallenges ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12 bg-green-50 rounded-xl border-2 border-green-200">
              <p className="text-gray-800 text-lg font-semibold">No challenges yet. They will appear after your first login.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {challenges.map((ch) => (
                <div key={ch.id} className={`rounded-3xl overflow-hidden border-2 shadow-lg card-hover ${ch.completed ? 'bg-white border-green-300' : 'bg-white border-gray-300'}`}>
                  <div className={`p-0 relative h-64 bg-gray-900`}>
                    {/* Background Image - Always shown */}
                    <img src={getChallengeImage(ch.target?.type)} alt="challenge" className="absolute inset-0 w-full h-full object-cover opacity-70" loading="lazy" />
                    
                    {/* Dark blur overlay for completed challenges */}
                    {ch.completed && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    )}
                    
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 20%, white 2px, transparent 2px)'}}></div>
                    
                    {/* Completed text overlay */}
                    {ch.completed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-3xl font-medium drop-shadow-lg tracking-wide opacity-90">
                          COMPLETED
                        </span>
                      </div>
                    )}
                    
                    <div className="absolute top-5 left-5">
                      <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 text-white shadow-lg">
                        <i className={`fi ${ch.completed ? 'fi-sr-check' : 'fi-sr-flag'} text-2xl`}></i>
                      </span>
                    </div>
                    <div className="absolute top-5 right-5">
                      <span className="text-base px-4 py-2 rounded-full font-bold bg-white/25 text-white border-2 border-white/40 shadow-md">
                        {ch.points || 25} pts
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <h4 className="font-extrabold text-white text-2xl drop-shadow-lg">{ch.title}</h4>
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="text-base text-gray-800 mb-6 leading-relaxed font-medium">
                      {ch.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold px-3 py-2 rounded-full ${ch.completed ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-orange-100 text-orange-800 border-2 border-orange-300'}`}>
                        {ch.completed ? 'Completed' : 'Pending'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={ch.completed || completingId === ch.id}
                          onClick={() => completeChallenge(ch.id)}
                          className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md ${ch.completed ? 'bg-green-300 text-green-900 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                        >
                          {completingId === ch.id ? 'Saving...' : ch.completed ? 'Done' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Resources Section - YouTube Videos Carousel */}
        <div className="glass-effect rounded-2xl p-6 shadow-2xl mb-6 card-hover">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full">
                <i className="fi fi-sr-play text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Educational Resources</h3>
                <p className="text-sm text-gray-600">Curated videos to help you on your health journey</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => scrollCarousel('left')}
                className="group bg-white/80 rounded-full shadow-lg border border-gray-200 p-2 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <i className="fi fi-sr-angle-left text-gray-600 group-hover:text-purple-600 transition-colors duration-300"></i>
              </button>
              <button 
                onClick={() => scrollCarousel('right')}
                className="group bg-white/80 rounded-full shadow-lg border border-gray-200 p-2 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <i className="fi fi-sr-angle-right text-gray-600 group-hover:text-purple-600 transition-colors duration-300"></i>
              </button>
            </div>
          </div>

          {/* Enhanced YouTube Videos Carousel */}
          <div className="relative">
            <div 
              ref={carouselRef}
              className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Enhanced Video 1 */}
              <div className="group flex-shrink-0 w-80 bg-gradient-to-br from-yellow-50 via-amber-100 to-orange-100 rounded-2xl shadow-lg border border-yellow-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/zz0oE7yfBw8"
                    title="Health & Wellness Video 1"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded-t-2xl pointer-events-auto"
                  ></iframe>
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg pointer-events-none">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-heart text-white text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-yellow-800 bg-gradient-to-r from-yellow-200 to-amber-200 px-3 py-1 rounded-full shadow-sm border border-yellow-300">Health</span>
                  </div>
                  <h4 className="font-bold text-yellow-900 text-base mb-3 line-clamp-2">
                    Health & Wellness Tips for Seniors
                  </h4>
                  <p className="text-sm text-yellow-800 line-clamp-3 leading-relaxed">
                    Essential health tips and exercises specifically designed for older adults to maintain vitality and independence.
                  </p>
                </div>
              </div>

              {/* Enhanced Video 2 */}
              <div className="group flex-shrink-0 w-80 bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 rounded-2xl shadow-lg border border-green-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/8BcPHWGQO44"
                    title="Health & Wellness Video 2"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded-t-2xl pointer-events-auto"
                  ></iframe>
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg pointer-events-none">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-treadmill text-white text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-green-800 bg-gradient-to-r from-green-200 to-emerald-200 px-3 py-1 rounded-full shadow-sm border border-green-300">Exercise</span>
                  </div>
                  <h4 className="font-bold text-green-900 text-base mb-3 line-clamp-2">
                    Exercise Routines for Better Health
                  </h4>
                  <p className="text-sm text-green-800 line-clamp-3 leading-relaxed">
                    Safe and effective exercise routines that can be done at home to improve strength, balance, and overall health.
                  </p>
                </div>
              </div>

              {/* Enhanced Video 3 */}
              <div className="group flex-shrink-0 w-80 bg-gradient-to-br from-blue-50 via-cyan-100 to-indigo-100 rounded-2xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/DRomQhvuFWA"
                    title="Health & Wellness Video 3"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded-t-2xl pointer-events-auto"
                  ></iframe>
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg pointer-events-none">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-salad text-white text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-blue-800 bg-gradient-to-r from-blue-200 to-cyan-200 px-3 py-1 rounded-full shadow-sm border border-blue-300">Nutrition</span>
                  </div>
                  <h4 className="font-bold text-blue-900 text-base mb-3 line-clamp-2">
                    Nutrition and Healthy Eating
                  </h4>
                  <p className="text-sm text-blue-800 line-clamp-3 leading-relaxed">
                    Learn about proper nutrition, meal planning, and healthy eating habits for maintaining optimal health as you age.
                  </p>
                </div>
              </div>

              {/* Enhanced Video 4 */}
              <div className="group flex-shrink-0 w-80 bg-gradient-to-br from-purple-50 via-pink-100 to-rose-100 rounded-2xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/41cMkvsaOOM"
                    title="Health & Wellness Video 4"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded-t-2xl pointer-events-auto"
                  ></iframe>
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg pointer-events-none">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-brain text-white text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-purple-800 bg-gradient-to-r from-purple-200 to-pink-200 px-3 py-1 rounded-full shadow-sm border border-purple-300">Mental</span>
                  </div>
                  <h4 className="font-bold text-purple-900 text-base mb-3 line-clamp-2">
                    Mental Health and Wellness
                  </h4>
                  <p className="text-sm text-purple-800 line-clamp-3 leading-relaxed">
                    Understanding mental health, stress management, and techniques for maintaining emotional well-being.
                  </p>
                </div>
              </div>

              {/* Enhanced Video 5 */}
              <div className="group flex-shrink-0 w-80 bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100 rounded-2xl shadow-lg border border-indigo-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/t2SCv3fhxYs"
                    title="Health & Wellness Video 5"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded-t-2xl pointer-events-auto"
                  ></iframe>
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg pointer-events-none">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-moon text-white text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-indigo-800 bg-gradient-to-r from-indigo-200 to-purple-200 px-3 py-1 rounded-full shadow-sm border border-indigo-300">Sleep</span>
                  </div>
                  <h4 className="font-bold text-indigo-900 text-base mb-3 line-clamp-2">
                    Sleep and Recovery
                  </h4>
                  <p className="text-sm text-indigo-800 line-clamp-3 leading-relaxed">
                    Tips for better sleep quality, recovery techniques, and understanding the importance of rest for health.
                  </p>
                </div>
              </div>

              {/* Enhanced Video 6 */}
              <div className="group flex-shrink-0 w-80 bg-gradient-to-br from-teal-50 via-emerald-100 to-green-100 rounded-2xl shadow-lg border border-teal-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/KD-FmeueFUo"
                    title="Health & Wellness Video 6"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded-t-2xl pointer-events-auto"
                  ></iframe>
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg pointer-events-none">
                    YouTube
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-shield text-white text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-gradient-to-r from-teal-200 to-emerald-200 px-3 py-1 rounded-full shadow-sm border border-teal-300">Preventive</span>
                  </div>
                  <h4 className="font-bold text-teal-900 text-base mb-3 line-clamp-2">
                    Preventive Healthcare
                  </h4>
                  <p className="text-sm text-teal-800 line-clamp-3 leading-relaxed">
                    Learn about preventive healthcare measures, regular check-ups, and early detection of health issues.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Enhanced Food Recipes Section */}
        <div className="glass-effect rounded-2xl p-6 shadow-2xl mb-6 card-hover">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full">
                <i className="fi fi-sr-salad text-white text-lg"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Healthy Food Recipes</h3>
                <p className="text-sm text-gray-600">
                  {isRandomMode ? 'Random delicious meals for inspiration' : 'Discover nutritious meals from around the world'}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {isRandomMode && (
                <button 
                  onClick={refreshRandomMeals}
                  disabled={loadingRecipes}
                  className="group bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg px-4 py-2 hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <i className={`fi fi-sr-refresh text-sm ${loadingRecipes ? 'animate-spin' : ''}`}></i>
                  <span className="text-sm font-semibold">New Random Meals</span>
                </button>
              )}
              <button 
                onClick={() => scrollRecipesCarousel('left')}
                className="group bg-white/80 rounded-full shadow-lg border border-gray-200 p-2 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <i className="fi fi-sr-angle-left text-gray-600 group-hover:text-orange-600 transition-colors duration-300"></i>
              </button>
              <button 
                onClick={() => scrollRecipesCarousel('right')}
                className="group bg-white/80 rounded-full shadow-lg border border-gray-200 p-2 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <i className="fi fi-sr-angle-right text-gray-600 group-hover:text-orange-600 transition-colors duration-300"></i>
              </button>
            </div>
          </div>

          {/* Enhanced Filters Section - 1x3 Grid Layout */}
          <div className="mb-6">
            {/* Clear All Filters Button - Top Right */}
            {(selectedArea || selectedCategory || selectedIngredient) && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-800 bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <i className="fi fi-sr-refresh text-sm"></i>
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}

            {/* Active Filters Display */}
            {(selectedArea || selectedCategory || selectedIngredient) && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <i className="fi fi-sr-filter text-orange-600 text-lg"></i>
                  <span className="text-sm font-bold text-gray-800">Active Filters:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedIngredient && (
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <span>Ingredient: {selectedIngredient}</span>
                      <button onClick={() => setSelectedIngredient('')} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                        <i className="fi fi-sr-cross text-xs"></i>
                      </button>
                    </span>
                  )}
                  {selectedCategory && !selectedIngredient && (
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <span>Category: {selectedCategory}</span>
                      <button onClick={() => setSelectedCategory('')} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                        <i className="fi fi-sr-cross text-xs"></i>
                      </button>
                    </span>
                  )}
                  {selectedArea && !selectedCategory && !selectedIngredient && (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <span>Area: {selectedArea}</span>
                      <button onClick={() => setSelectedArea('')} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                        <i className="fi fi-sr-cross text-xs"></i>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 1x3 Grid Layout for Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Area Filter */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-world text-white text-sm"></i>
                  </div>
                  <label className="text-sm font-bold text-gray-900">Country/Area</label>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(showAllAreas ? areas : areas.slice(0, 6)).map((area) => (
                      <button
                        key={area.strArea}
                        onClick={() => handleAreaChange(area.strArea)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          selectedArea === area.strArea
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        {area.strArea}
                      </button>
                    ))}
                  </div>
                  {areas.length > 6 && (
                    <button
                      onClick={() => setShowAllAreas(!showAllAreas)}
                      className="w-full mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1"
                    >
                      <span>{showAllAreas ? 'Show Less' : `Show More (${areas.length - 6} more)`}</span>
                      <i className={`fi ${showAllAreas ? 'fi-sr-angle-up' : 'fi-sr-angle-down'} text-xs`}></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-list text-white text-sm"></i>
                  </div>
                  <label className="text-sm font-bold text-gray-900">Category</label>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(showAllCategories ? categories : categories.slice(0, 6)).map((category) => (
                      <button
                        key={category.strCategory}
                        onClick={() => handleCategoryChange(category.strCategory)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          selectedCategory === category.strCategory
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {category.strCategory}
                      </button>
                    ))}
                  </div>
                  {categories.length > 6 && (
                    <button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="w-full mt-2 text-xs font-semibold text-green-600 hover:text-green-800 bg-green-100 hover:bg-green-200 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1"
                    >
                      <span>{showAllCategories ? 'Show Less' : `Show More (${categories.length - 6} more)`}</span>
                      <i className={`fi ${showAllCategories ? 'fi-sr-angle-up' : 'fi-sr-angle-down'} text-xs`}></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Ingredient Filter */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-carrot text-white text-sm"></i>
                  </div>
                  <label className="text-sm font-bold text-gray-900">Main Ingredient</label>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={selectedIngredient}
                      onChange={(e) => handleIngredientChange(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-xs font-medium bg-white appearance-none cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                      <option value="">Select an ingredient...</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.strIngredient} value={ingredient.strIngredient}>
                          {ingredient.strIngredient}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <i className="fi fi-sr-angle-down text-purple-600 text-sm"></i>
                    </div>
                  </div>
                  {selectedIngredient && (
                    <button
                      onClick={() => setSelectedIngredient('')}
                      className="w-full text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 py-2 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1"
                    >
                      <i className="fi fi-sr-cross text-xs"></i>
                      <span>Clear Ingredient</span>
                    </button>
                  )}
                  <p className="text-xs text-gray-600 text-center">
                    {ingredients.length} ingredients available
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Recipes Carousel */}
          <div className="relative">
            {loadingRecipes ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading delicious recipes...</p>
                </div>
              </div>
            ) : recipes.length > 0 ? (
              <div 
                ref={recipesCarouselRef}
                className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {recipes.map((recipe) => (
                  <div 
                    key={recipe.idMeal}
                    className="group flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={recipe.strMealThumb}
                        alt={recipe.strMeal}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-3 right-3 bg-orange-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                        Recipe
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                        {recipe.strMeal}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        Click to view full recipe with ingredients and instructions
                      </p>
                      <button 
                        onClick={() => fetchRecipeDetails(recipe.idMeal)}
                        className="w-full bg-gray-800 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-gray-900 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg text-sm"
                      >
                        View Recipe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <i className="fi fi-sr-search text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-600 font-medium text-lg mb-2">No recipes found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Recipe Details Modal */}
        {showRecipeModal && selectedRecipe && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRecipeModal(false)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Image */}
              <div className="relative h-64 overflow-hidden rounded-t-3xl">
                <img
                  src={selectedRecipe.strMealThumb}
                  alt={selectedRecipe.strMeal}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <button
                  onClick={() => setShowRecipeModal(false)}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  <i className="fi fi-sr-cross text-lg"></i>
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                    {selectedRecipe.strMeal}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.strCategory && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {selectedRecipe.strCategory}
                      </span>
                    )}
                    {selectedRecipe.strArea && (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {selectedRecipe.strArea}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                {/* Ask Chatbot Section */}
                <div className="mb-6">
                  <button
                    onClick={askChatbotAboutDish}
                    disabled={loadingNutrition}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loadingNutrition ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Analyzing dish...</span>
                      </>
                    ) : (
                      <>
                        <i className="fi fi-sr-comment-heart text-lg"></i>
                        <span>Ask Chatbot: Is This Dish Good For You?</span>
                      </>
                    )}
                  </button>

                  {/* Nutrition Info Display */}
                  {nutritionInfo && (
                    <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-md animate-fade-in-up">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <i className="fi fi-sr-brain text-white text-lg"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-green-900 mb-2 text-base">Nutritional Analysis</h4>
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                            {nutritionInfo}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ingredients Section */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-list text-white text-lg"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Ingredients</h3>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <ul className="space-y-2">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                        const ingredient = selectedRecipe[`strIngredient${num}`];
                        const measure = selectedRecipe[`strMeasure${num}`];
                        if (ingredient && ingredient.trim()) {
                          return (
                            <li 
                              key={num} 
                              className="flex items-start space-x-3 text-gray-800 py-1 border-b border-gray-100 last:border-0"
                            >
                              <span className="text-orange-500 font-bold mt-0.5">•</span>
                              <span className="flex-1">
                                <span className="font-medium text-gray-900">{measure && measure.trim() ? `${measure} ` : ''}</span>
                                <span className="text-gray-700">{ingredient}</span>
                              </span>
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  </div>
                </div>

                {/* Instructions Section */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <i className="fi fi-sr-book text-white text-lg"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Instructions</h3>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <div className="prose prose-sm max-w-none">
                      {selectedRecipe.strInstructions.split('\n').map((step, index) => {
                        if (step.trim()) {
                          return (
                            <p key={index} className="text-gray-800 leading-relaxed mb-3 text-sm">
                              {step}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Video Tutorial */}
                {selectedRecipe.strYoutube && (
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                        <i className="fi fi-sr-play text-white text-lg"></i>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Video Tutorial</h3>
                    </div>
                    <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <iframe
                        width="100%"
                        height="400"
                        src={`https://www.youtube.com/embed/${selectedRecipe.strYoutube.split('v=')[1]?.split('&')[0] || selectedRecipe.strYoutube.split('/').pop()}`}
                        title={`${selectedRecipe.strMeal} - Video Tutorial`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Challenges Modal */}
      {showChallengesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-9 relative animate-slide-in-right border-4 border-orange-300">
            <button
              onClick={() => setShowChallengesModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <i className="fi fi-sr-cross text-2xl"></i>
            </button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-500 rounded-full mb-6 shadow-lg">
                <i className="fi fi-sr-flag text-white text-4xl"></i>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                New Challenges Created!
              </h3>
              
              <p className="text-gray-800 text-lg mb-7 leading-relaxed font-medium">
                We've created <span className="font-bold text-orange-600">{challenges.length} personalized challenges</span> just for you based on your health profile. Complete them to earn points and climb the leaderboard!
              </p>
              
              <div className="bg-orange-50 rounded-2xl p-5 mb-7 border-2 border-orange-300 shadow-md">
                <div className="flex items-center justify-center space-x-3 text-orange-700">
                  <i className="fi fi-sr-trophy text-2xl"></i>
                  <span className="font-bold text-lg">Earn 25 points per challenge</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowChallengesModal(false)}
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl"
              >
                View My Challenges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Modal */}
      {showLeaderboardModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLeaderboardModal(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden relative animate-slide-in-right border border-gray-200">
            {/* Header */}
            <div className="bg-gray-50 p-7 border-b border-gray-200">
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <i className="fi fi-sr-cross text-2xl"></i>
              </button>
              
              <div className="flex items-center space-x-4 mb-5">
                <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fi fi-sr-trophy text-green-600 text-3xl"></i>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Leaderboard</h3>
                  <p className="text-gray-600 text-base font-medium">See how you rank among all players</p>
                </div>
              </div>
              
              {/* Toggle Switch */}
              <div className="flex items-center justify-center space-x-3 bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setLeaderboardMode('weekly')}
                  className={`flex-1 py-2.5 px-5 rounded-full text-base font-semibold transition-all duration-300 ${
                    leaderboardMode === 'weekly'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setLeaderboardMode('alltime')}
                  className={`flex-1 py-2.5 px-5 rounded-full text-base font-semibold transition-all duration-300 ${
                    leaderboardMode === 'alltime'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
            
            {/* Leaderboard Content */}
            <div className="p-7 overflow-y-auto max-h-[calc(80vh-220px)]">
              {loadingFullLeaderboard ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-600"></div>
                </div>
              ) : fullLeaderboard.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-5 border border-gray-200">
                    <i className="fi fi-sr-users-alt text-gray-400 text-3xl"></i>
                  </div>
                  <p className="text-gray-800 text-lg font-bold">No leaderboard data yet</p>
                  <p className="text-base text-gray-600 mt-2 font-medium">Complete challenges to earn points!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fullLeaderboard.map((row) => {
                    const isCurrentUser = row.uid === myLeaderboardUid;
                    const isMedal = row.rank <= 3;
                    
                    return (
                      <div 
                        key={row.uid || row.rank} 
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border ${
                          isCurrentUser 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Rank Badge */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-base ${
                            isCurrentUser
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isMedal && !isCurrentUser ? (
                              row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : '🥉'
                            ) : (
                              `#${row.rank}`
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate text-base ${
                              isCurrentUser ? 'text-green-700' : 'text-gray-900'
                            }`}>
                              {isCurrentUser ? 'You' : row.displayName || 'User'}
                            </p>
                          </div>
                          
                          {/* Points */}
                          <div className="flex-shrink-0 text-right">
                            <p className={`font-bold text-lg ${
                              isCurrentUser ? 'text-green-700' : 'text-gray-700'
                            }`}>{row.points}</p>
                            <p className="text-xs text-gray-500 font-medium">points</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer with User Stats */}
            {!loadingFullLeaderboard && fullLeaderboard.length > 0 && (
              <div className="border-t border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Your Rank:</span>
                  <span className="font-bold text-gray-900">#{fullLeaderboardMyRank}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">Your Points:</span>
                  <span className="font-bold text-gray-900">{fullLeaderboardMyPoints}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challenge Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-slide-in-right pointer-events-auto border-4 border-green-400">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-5 shadow-lg">
                <i className="fi fi-sr-check text-white text-4xl"></i>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Congratulations! 🎉
              </h3>
              
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line font-medium">
                {completionMessage}
              </p>
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

export default Dashboard;
