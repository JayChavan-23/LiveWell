import { getFirestore } from './firebase.js';

// Predefined achievements available to all users
export const ACHIEVEMENTS = [
  {
    id: 'account_created',
    title: 'Welcome to LiveWell',
    description: 'Created your LiveWell account',
    icon: 'fi-sr-user-add',
    badge: '🎉',
    category: 'Milestone',
    points: 10
  },
  {
    id: 'daily_champion',
    title: 'Daily Champion',
    description: 'Completed all 3 daily challenges',
    icon: 'fi-sr-trophy',
    badge: '🏆',
    category: 'Challenges',
    points: 50
  },
  {
    id: 'daily_champion_3',
    title: '3-Day Streak',
    description: 'Completed all daily challenges for 3 days in a row',
    icon: 'fi-sr-flame',
    badge: '🔥',
    category: 'Challenges',
    points: 100
  },
  {
    id: 'daily_champion_7',
    title: 'Week Warrior',
    description: 'Completed all daily challenges for 7 days in a row',
    icon: 'fi-sr-trophy-star',
    badge: '⭐',
    category: 'Challenges',
    points: 200
  },
  {
    id: 'hydration_hero',
    title: 'Hydration Hero',
    description: 'Completed your daily hydration goal',
    icon: 'fi-sr-droplet',
    badge: '💧',
    category: 'Health',
    points: 25
  },
  {
    id: 'hydration_week',
    title: 'Hydration Master',
    description: 'Completed hydration goal for 7 days in a row',
    icon: 'fi-sr-glass-water',
    badge: '🌊',
    category: 'Health',
    points: 100
  },
  {
    id: 'step_master',
    title: 'Step Master',
    description: 'Achieved 10,000 steps in a day',
    icon: 'fi-sr-shoe-print',
    badge: '👟',
    category: 'Fitness',
    points: 50
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Attended a social event',
    icon: 'fi-sr-users',
    badge: '🦋',
    category: 'Social',
    points: 30
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Scored 80% or higher on a quiz',
    icon: 'fi-sr-brain',
    badge: '🧠',
    category: 'Mental',
    points: 40
  },
  {
    id: 'first_week',
    title: 'First Week',
    description: 'Completed your first week on LiveWell',
    icon: 'fi-sr-calendar-check',
    badge: '📅',
    category: 'Milestone',
    points: 75
  },
  {
    id: 'first_month',
    title: 'First Month',
    description: 'Completed your first month on LiveWell',
    icon: 'fi-sr-confetti',
    badge: '🎊',
    category: 'Milestone',
    points: 150
  },
  {
    id: 'points_500',
    title: 'Rising Star',
    description: 'Earned 500 total points',
    icon: 'fi-sr-star',
    badge: '🌟',
    category: 'Points',
    points: 50
  },
  {
    id: 'points_1000',
    title: 'Super Star',
    description: 'Earned 1,000 total points',
    icon: 'fi-sr-stars',
    badge: '✨',
    category: 'Points',
    points: 100
  },
  {
    id: 'first_goal',
    title: 'Goal Getter',
    description: 'Completed your first goal',
    icon: 'fi-sr-target',
    badge: '🎯',
    category: 'Goals',
    points: 25
  },
  {
    id: 'goals_3',
    title: 'Triple Threat',
    description: 'Completed 3 goals',
    icon: 'fi-sr-bullseye-arrow',
    badge: '🎪',
    category: 'Goals',
    points: 50
  },
  {
    id: 'goals_10',
    title: 'Goal Master',
    description: 'Completed 10 goals',
    icon: 'fi-sr-trophy-star',
    badge: '🏅',
    category: 'Goals',
    points: 100
  },
  {
    id: 'first_quiz',
    title: 'Quiz Beginner',
    description: 'Completed your first quiz',
    icon: 'fi-sr-graduation-cap',
    badge: '📝',
    category: 'Mental',
    points: 20
  },
  {
    id: 'all_quizzes',
    title: 'Quiz Champion',
    description: 'Completed all available quizzes',
    icon: 'fi-sr-diploma',
    badge: '🎓',
    category: 'Mental',
    points: 150
  },
  {
    id: 'first_social_event',
    title: 'Social Starter',
    description: 'Joined your first social event',
    icon: 'fi-sr-user-heart',
    badge: '🤝',
    category: 'Social',
    points: 30
  }
];

/**
 * Get all achievements with completion status for a user
 */
export async function getUserAchievements(uid) {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const completedAchievements = userData.completedAchievements || [];

    // Map achievements with completion status and date
    const achievementsWithStatus = ACHIEVEMENTS.map(achievement => {
      const completed = completedAchievements.find(ca => ca.achievementId === achievement.id);
      return {
        ...achievement,
        completed: !!completed,
        completedAt: completed?.completedAt || null
      };
    });

    return achievementsWithStatus;
  } catch (error) {
    console.error('Error getting user achievements:', error);
    throw error;
  }
}

/**
 * Award an achievement to a user
 */
export async function awardAchievement(uid, achievementId) {
  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const completedAchievements = userData.completedAchievements || [];

    // Check if achievement already completed
    const alreadyCompleted = completedAchievements.some(
      ca => ca.achievementId === achievementId
    );

    if (alreadyCompleted) {
      return { awarded: false, message: 'Achievement already completed' };
    }

    // Find achievement details
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error('Achievement not found');
    }

    // Add achievement to user's completed list
    const completedEntry = {
      achievementId,
      completedAt: new Date().toISOString()
    };

    await userRef.update({
      completedAchievements: [...completedAchievements, completedEntry],
      updatedAt: new Date().toISOString()
    });

    return {
      awarded: true,
      achievement: {
        ...achievement,
        completedAt: completedEntry.completedAt
      }
    };
  } catch (error) {
    console.error('Error awarding achievement:', error);
    throw error;
  }
}

/**
 * Check and award milestone achievements based on user data
 */
export async function checkMilestoneAchievements(uid) {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return [];
    }

    const userData = userDoc.data();
    const completedAchievements = userData.completedAchievements || [];
    const createdAt = new Date(userData.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const allTimePoints = userData.allTimePoints || 0;

    const newAchievements = [];

    // Check first week achievement
    if (daysSinceCreation >= 7 && !completedAchievements.some(ca => ca.achievementId === 'first_week')) {
      const result = await awardAchievement(uid, 'first_week');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    // Check first month achievement
    if (daysSinceCreation >= 30 && !completedAchievements.some(ca => ca.achievementId === 'first_month')) {
      const result = await awardAchievement(uid, 'first_month');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    // Check points milestones
    if (allTimePoints >= 500 && !completedAchievements.some(ca => ca.achievementId === 'points_500')) {
      const result = await awardAchievement(uid, 'points_500');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    if (allTimePoints >= 1000 && !completedAchievements.some(ca => ca.achievementId === 'points_1000')) {
      const result = await awardAchievement(uid, 'points_1000');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking milestone achievements:', error);
    return [];
  }
}

/**
 * Check and award streak-based achievements
 */
export async function checkStreakAchievements(uid, currentStreak) {
  try {
    const newAchievements = [];

    // Check 3-day streak
    if (currentStreak === 3) {
      const result = await awardAchievement(uid, 'daily_champion_3');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    // Check 7-day streak
    if (currentStreak === 7) {
      const result = await awardAchievement(uid, 'daily_champion_7');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking streak achievements:', error);
    return [];
  }
}

/**
 * Check and award goal-based achievements
 */
export async function checkGoalAchievements(uid, completedGoalsCount) {
  try {
    const newAchievements = [];

    // Check first goal
    if (completedGoalsCount === 1) {
      const result = await awardAchievement(uid, 'first_goal');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    // Check 3 goals
    if (completedGoalsCount === 3) {
      const result = await awardAchievement(uid, 'goals_3');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    // Check 10 goals
    if (completedGoalsCount === 10) {
      const result = await awardAchievement(uid, 'goals_10');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking goal achievements:', error);
    return [];
  }
}

/**
 * Check and award quiz-based achievements
 */
export async function checkQuizAchievements(uid, completedQuizzesCount, totalQuizzes) {
  try {
    const newAchievements = [];

    // Check first quiz
    if (completedQuizzesCount === 1) {
      const result = await awardAchievement(uid, 'first_quiz');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    // Check all quizzes completed
    if (totalQuizzes && completedQuizzesCount >= totalQuizzes) {
      const result = await awardAchievement(uid, 'all_quizzes');
      if (result.awarded) newAchievements.push(result.achievement);
    }

    return newAchievements;
  } catch (error) {
    console.error('Error checking quiz achievements:', error);
    return [];
  }
}

/**
 * Award social event achievement
 */
export async function checkSocialEventAchievement(uid) {
  try {
    const result = await awardAchievement(uid, 'first_social_event');
    return result.awarded ? [result.achievement] : [];
  } catch (error) {
    console.error('Error checking social event achievement:', error);
    return [];
  }
}

/**
 * Initialize completedAchievements field for existing users
 */
export async function initializeUserAchievements(uid) {
  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // If completedAchievements doesn't exist, create it with 'account_created'
    if (!userData.completedAchievements) {
      await userRef.update({
        completedAchievements: [
          {
            achievementId: 'account_created',
            completedAt: userData.createdAt || new Date().toISOString()
          }
        ],
        updatedAt: new Date().toISOString()
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error initializing user achievements:', error);
    throw error;
  }
}

