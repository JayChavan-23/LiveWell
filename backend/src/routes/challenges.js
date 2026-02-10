import { Router } from "express";
import { z } from "zod";
import { getFirestore } from "../services/firebase.js";
import { requireAuth } from "../middlewares/auth.js";
import { awardAchievement, checkStreakAchievements, checkMilestoneAchievements } from "../services/achievements.js";

const router = Router();
const db = getFirestore();

// Helper function to get the current week identifier (YYYY-WW format)
function getCurrentWeekId() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper function to ensure weekly points are initialized for current week
async function ensureWeeklyPoints(userRef) {
  const currentWeek = getCurrentWeekId();
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  
  const userData = userSnap.data();
  const lastWeek = userData.currentWeek || null;
  
  // If it's a new week, reset weeklyPoints
  if (lastWeek !== currentWeek) {
    await userRef.set({
      currentWeek,
      weeklyPoints: 0,
      allTimePoints: userData.allTimePoints || userData.points || 0,
    }, { merge: true });
  }
}

// Predefined challenge pools based on frailty scores

const PHYSICAL_CHALLENGES = {
  // Very Low (0-25): Gentle, safe activities
  veryLow: [
    {
      id: 'gentle-walk',
      title: 'Take a Gentle Walk',
      description: 'Walk for 10-15 minutes at a comfortable pace.',
      category: 'physical',
      target: { type: 'steps', value: 2000 },
    },
    {
      id: 'chair-exercises',
      title: 'Chair Exercises',
      description: 'Do 5 minutes of seated stretching exercises.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 5 },
    },
    {
      id: 'light-stretching',
      title: 'Light Stretching',
      description: 'Perform gentle stretches for 10 minutes.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 10 },
    },
    {
      id: 'standing-balance',
      title: 'Balance Practice',
      description: 'Practice standing balance exercises for 5 minutes.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 5 },
    },
  ],
  // Low (26-50): Light activities
  low: [
    {
      id: 'short-walk',
      title: 'Take a Short Walk',
      description: 'Walk for 20 minutes at a comfortable pace.',
      category: 'physical',
      target: { type: 'steps', value: 4000 },
    },
    {
      id: 'light-cardio',
      title: 'Light Cardio',
      description: 'Do 15 minutes of light aerobic activity.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 15 },
    },
    {
      id: 'arm-exercises',
      title: 'Arm Exercises',
      description: 'Perform light arm exercises with household items.',
      category: 'physical',
      target: { type: 'strengthDays', value: 1 },
    },
    {
      id: 'walking-stairs',
      title: 'Climb Some Stairs',
      description: 'Walk up and down stairs 2-3 times slowly.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 10 },
    },
  ],
  // Moderate (51-75): Regular activities
  moderate: [
    {
      id: 'brisk-walk',
      title: 'Take a Brisk Walk',
      description: 'Walk at a brisk pace for 25 minutes.',
      category: 'physical',
      target: { type: 'steps', value: 6000 },
    },
    {
      id: 'moderate-exercise',
      title: 'Moderate Exercise',
      description: 'Do 20 minutes of moderate aerobic activity.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 20 },
    },
    {
      id: 'strength-training',
      title: 'Strength Training',
      description: 'Complete a light strength training session.',
      category: 'physical',
      target: { type: 'strengthDays', value: 1 },
    },
    {
      id: 'cycling-walk',
      title: 'Cycle or Walk',
      description: 'Go for a 30-minute bike ride or brisk walk.',
      category: 'physical',
      target: { type: 'moderateMinutes', value: 30 },
    },
  ],
  // High (76-100): Active lifestyle
  high: [
    {
      id: 'long-walk',
      title: 'Long Walk or Jog',
      description: 'Walk or jog for 30-40 minutes.',
      category: 'physical',
      target: { type: 'steps', value: 10000 },
    },
    {
      id: 'vigorous-activity',
      title: 'Vigorous Exercise',
      description: 'Do 25 minutes of vigorous aerobic activity.',
      category: 'physical',
      target: { type: 'vigorousMinutes', value: 25 },
    },
    {
      id: 'full-workout',
      title: 'Complete Workout',
      description: 'Complete a full strength and cardio workout.',
      category: 'physical',
      target: { type: 'strengthDays', value: 1 },
    },
    {
      id: 'sports-activity',
      title: 'Play Sports',
      description: 'Engage in a sport or active recreation for 30 minutes.',
      category: 'physical',
      target: { type: 'vigorousMinutes', value: 30 },
    },
  ],
};

const SOCIAL_CHALLENGES = [
  {
    id: 'call-friend',
    title: 'Call a Friend or Family',
    description: 'Have a meaningful conversation with someone you care about.',
    category: 'social',
    target: { type: 'socialActivity' },
  },
  {
    id: 'video-chat',
    title: 'Video Chat with Loved Ones',
    description: 'Connect face-to-face with family or friends via video call.',
    category: 'social',
    target: { type: 'socialActivity' },
  },
  {
    id: 'visit-neighbor',
    title: 'Visit a Neighbor',
    description: 'Spend time with a neighbor or invite them for tea.',
    category: 'social',
    target: { type: 'socialActivity' },
  },
  {
    id: 'community-activity',
    title: 'Join a Community Activity',
    description: 'Attend a local community event or group activity.',
    category: 'social',
    target: { type: 'socialActivity' },
  },
  {
    id: 'write-letter',
    title: 'Write a Letter or Email',
    description: 'Reach out to an old friend with a heartfelt message.',
    category: 'social',
    target: { type: 'socialActivity' },
  },
];

const MENTAL_CHALLENGES = [
  {
    id: 'read-book',
    title: 'Read a Book or Article',
    description: 'Spend 20-30 minutes reading something interesting.',
    category: 'mental',
    target: { type: 'mentalActivity' },
  },
  {
    id: 'puzzle-game',
    title: 'Solve a Puzzle',
    description: 'Complete a crossword, sudoku, or jigsaw puzzle.',
    category: 'mental',
    target: { type: 'mentalActivity' },
  },
  {
    id: 'learn-something',
    title: 'Learn Something New',
    description: 'Watch an educational video or learn a new skill.',
    category: 'mental',
    target: { type: 'mentalActivity' },
  },
  {
    id: 'memory-game',
    title: 'Play a Memory Game',
    description: 'Challenge your memory with cards or an app.',
    category: 'mental',
    target: { type: 'mentalActivity' },
  },
  {
    id: 'journaling',
    title: 'Write in a Journal',
    description: 'Reflect on your day and write down your thoughts.',
    category: 'mental',
    target: { type: 'mentalActivity' },
  },
];

function generatePredefinedChallenges(uid, user, score, preferredNonPhysicalType = 'social') {
  const now = new Date().toISOString();
  const today = now.split('T')[0]; // YYYY-MM-DD
  
  // Determine frailty tier
  let tier = 'low';
  if (score <= 25) tier = 'veryLow';
  else if (score <= 50) tier = 'low';
  else if (score <= 75) tier = 'moderate';
  else tier = 'high';
  
  // Get physical challenges for this tier
  const physicalPool = PHYSICAL_CHALLENGES[tier];
  
  // Create a seeded random function based on uid and date for consistent daily challenges
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  // Generate seed from uid and today's date
  const seedStr = `${uid}-${today}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
    seed = seed & seed; // Convert to 32bit integer
  }
  
  // Shuffle and pick 2 physical challenges
  const shuffledPhysical = [...physicalPool].sort(() => seededRandom(seed++) - 0.5);
  const selectedPhysical = shuffledPhysical.slice(0, 2).map((ch, idx) => ({
    ...ch,
    id: `${today}-${ch.id}`,
    points: 25,
    progress: 0,
    completed: false,
    createdAt: now,
    completedAt: null,
  }));
  
  // Pick 1 social or mental challenge
  const nonPhysicalPool = preferredNonPhysicalType === 'mental' ? MENTAL_CHALLENGES : SOCIAL_CHALLENGES;
  const shuffledNonPhysical = [...nonPhysicalPool].sort(() => seededRandom(seed++) - 0.5);
  const selectedNonPhysical = {
    ...shuffledNonPhysical[0],
    id: `${today}-${shuffledNonPhysical[0].id}`,
    points: 25,
    progress: 0,
    completed: false,
    createdAt: now,
    completedAt: null,
  };
  
  // Return exactly 3 challenges: 2 physical + 1 social/mental
  return [...selectedPhysical, selectedNonPhysical];
}

async function ensureUserChallenges(uid) {
  const userRef = db.collection("users").doc(uid);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayChallengesRef = userRef.collection("challenges").doc(today).collection("items");
  
  // Ensure weekly points are initialized
  await ensureWeeklyPoints(userRef);
  
  // Check if challenges exist for today
  const existing = await todayChallengesRef.get();
  if (!existing.empty) {
    // Challenges already exist for today, no need to regenerate
    return false;
  }

  // Look at yesterday's challenges to determine what type the non-physical challenge was
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  const yesterdayChallengesRef = userRef.collection("challenges").doc(yesterdayDate).collection("items");
  
  let preferredNonPhysicalType = 'social'; // Default to social for first-time users
  
  try {
    const yesterdaySnap = await yesterdayChallengesRef.get();
    if (!yesterdaySnap.empty) {
      // Find the non-physical challenge from yesterday
      const yesterdayChallenges = yesterdaySnap.docs.map(d => d.data());
      const yesterdayNonPhysical = yesterdayChallenges.find(c => 
        c.category === 'social' || c.category === 'mental'
      );
      
      if (yesterdayNonPhysical) {
        // Alternate: if yesterday was social, today is mental; if yesterday was mental, today is social
        preferredNonPhysicalType = yesterdayNonPhysical.category === 'social' ? 'mental' : 'social';
      }
    }
  } catch (e) {
    // If error fetching yesterday's challenges, just use default (social)
    console.log('Could not fetch yesterday challenges, using default:', e.message);
  }

  // Generate new challenges for today with alternating non-physical type
  const userSnap = await userRef.get();
  if (!userSnap.exists) return false;
  const user = userSnap.data();
  const score = user?.frailtyInfo?.frailtyScore ?? user?.frailtyScore?.score ?? 50;
  const generated = generatePredefinedChallenges(uid, user, Number(score) || 50, preferredNonPhysicalType);
  const batch = db.batch();
  for (const ch of generated) batch.set(todayChallengesRef.doc(ch.id), ch);
  // Initialize points if not present
  batch.set(userRef, { 
    weeklyPoints: user.weeklyPoints || 0,
    allTimePoints: user.allTimePoints || user.points || 0,
    points: user.weeklyPoints || user.points || 0 
  }, { merge: true });
  await batch.commit();
  return true;
}

// Initialize challenges for a user if not present.
router.post("/challenges/init", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const created = await ensureUserChallenges(uid);
    res.json({ ok: true, initialized: created });
  } catch (e) {
    next(e);
  }
});

// Get current user's challenges
router.get("/challenges", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const userRef = db.collection("users").doc(uid);
    const todayChallengesRef = userRef.collection("challenges").doc(today).collection("items");
    
    let snap = await todayChallengesRef.get();
    if (snap.empty) {
      // Auto-initialize for legacy users who never got challenges or for new day
      await ensureUserChallenges(uid);
      snap = await todayChallengesRef.get();
    }
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Get user's current streak
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const currentStreak = userData.currentStreak || 0;
    
    res.json({ 
      challenges: items,
      currentStreak
    });
  } catch (e) {
    next(e);
  }
});

const CompleteSchema = z.object({ id: z.string().min(1) });

// Complete a challenge by id; award points once.
router.post("/challenges/complete", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { id } = CompleteSchema.parse(req.body || {});
    const userRef = db.collection("users").doc(uid);
    
    // Ensure weekly points are set for current week
    await ensureWeeklyPoints(userRef);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayChallengesRef = userRef.collection("challenges").doc(today).collection("items");
    const chRef = todayChallengesRef.doc(id);
    const chSnap = await chRef.get();
    if (!chSnap.exists) return res.status(404).json({ error: "Challenge not found" });
    const ch = chSnap.data();
    if (ch.completed) return res.json({ ok: true, alreadyCompleted: true });

    const points = ch.points || 25;
    
    // Check if this is the last challenge of the day
    const allChallengesSnap = await todayChallengesRef.get();
    const allChallenges = allChallengesSnap.docs.map(d => d.data());
    const totalChallenges = allChallenges.length;
    const completedCount = allChallenges.filter(c => c.completed).length;
    const isLastChallenge = completedCount === totalChallenges - 1; // After this one completes, all will be done
    
    let streakUpdated = false;
    let newStreak = 0;
    
    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      const userData = userDoc.exists ? userDoc.data() : {};
      const currWeeklyPoints = typeof userData.weeklyPoints === "number" ? userData.weeklyPoints : 0;
      const currAllTimePoints = typeof userData.allTimePoints === "number" ? userData.allTimePoints : 0;
      
      let updates = { 
        weeklyPoints: currWeeklyPoints + points,
        allTimePoints: currAllTimePoints + points,
        points: currWeeklyPoints + points // Keep for backward compatibility
      };
      
      // If this is the last challenge, update streak
      if (isLastChallenge) {
        const lastStreakDate = userData.lastStreakDate || null;
        const currentStreak = userData.currentStreak || 0;
        
        // Check if user completed yesterday's challenges
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        
        if (lastStreakDate === yesterdayDate) {
          // Continue streak
          newStreak = currentStreak + 1;
        } else if (lastStreakDate === today) {
          // Already updated today (edge case)
          newStreak = currentStreak;
        } else {
          // Start new streak
          newStreak = 1;
        }
        
        updates.currentStreak = newStreak;
        updates.lastStreakDate = today;
        streakUpdated = true;
      }
      
      tx.update(userRef, updates);
      tx.update(chRef, { completed: true, completedAt: new Date().toISOString() });
    });
    
    // Award achievements after transaction completes
    const newAchievements = [];
    
    // If all challenges completed for the day, award Daily Champion
    if (isLastChallenge) {
      const dailyChampion = await awardAchievement(uid, 'daily_champion');
      if (dailyChampion.awarded) {
        newAchievements.push(dailyChampion.achievement);
      }
      
      // Check streak-based achievements
      if (streakUpdated && newStreak > 1) {
        const streakAchievements = await checkStreakAchievements(uid, newStreak);
        newAchievements.push(...streakAchievements);
      }
    }
    
    // Check milestone achievements (points, time-based)
    const milestones = await checkMilestoneAchievements(uid);
    newAchievements.push(...milestones);
    
    res.json({ 
      ok: true, 
      awarded: points,
      isLastChallenge,
      streakUpdated,
      newStreak: streakUpdated ? newStreak : undefined,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (e) {
    next(e);
  }
});

// Leaderboard: top N users by points (for dashboard preview)
router.get("/leaderboard", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    
    // Ensure current user's weekly points are up to date
    await ensureWeeklyPoints(db.collection("users").doc(uid));
    
    const qs = await db.collection("users").orderBy("weeklyPoints", "desc").limit(limit).get();
    const rows = qs.docs.map(d => {
      const u = d.data();
      return {
        uid: d.id,
        displayName: u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "User",
        points: u.weeklyPoints || 0,
      };
    });
    
    // Always include current user's rank and points
    const meDoc = await db.collection("users").doc(uid).get();
    const me = meDoc.exists ? meDoc.data() : {};
    const myPoints = typeof me.weeklyPoints === "number" ? me.weeklyPoints : 0;
    const myDisplayName = me.displayName || `${me.firstName || ""} ${me.lastName || ""}`.trim() || me.email || "You";
    const higherSnap = await db.collection("users")
      .where("weeklyPoints", ">", myPoints)
      .orderBy("weeklyPoints", "desc")
      .get();
    const myRank = higherSnap.size + 1;
    
    res.json({ 
      leaderboard: rows, 
      myRank, 
      myPoints,
      myDisplayName,
      myUid: uid
    });
  } catch (e) {
    next(e);
  }
});

// Full Leaderboard: all users with weekly or all-time filter
router.get("/leaderboard/full", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const mode = req.query.mode === "alltime" ? "alltime" : "weekly"; // "weekly" or "alltime"
    const pointsField = mode === "alltime" ? "allTimePoints" : "weeklyPoints";
    
    // Ensure current user's weekly points are up to date
    await ensureWeeklyPoints(db.collection("users").doc(uid));
    
    // Get all users ordered by the appropriate points field
    const qs = await db.collection("users").orderBy(pointsField, "desc").get();
    const rows = qs.docs.map((d, idx) => {
      const u = d.data();
      return {
        rank: idx + 1,
        uid: d.id,
        displayName: u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "User",
        points: u[pointsField] || 0,
      };
    });
    
    // Find current user in the list
    const myIndex = rows.findIndex(r => r.uid === uid);
    const myData = myIndex >= 0 ? rows[myIndex] : null;
    
    res.json({ 
      leaderboard: rows,
      mode,
      myRank: myData ? myData.rank : rows.length + 1,
      myPoints: myData ? myData.points : 0,
      myDisplayName: myData ? myData.displayName : "You",
      myUid: uid
    });
  } catch (e) {
    next(e);
  }
});

export default router;


