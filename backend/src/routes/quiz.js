import { Router } from 'express';
import { z } from 'zod';
import { getFirestore } from '../services/firebase.js';
import { requireAuth } from '../middlewares/auth.js';
import { checkQuizAchievements } from '../services/achievements.js';

const router = Router();

// Quiz submission schema validation
const QuizSubmissionSchema = z.object({
  quizId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.number(),
    selectedAnswer: z.number()
  })),
  score: z.number().min(0).max(100),
  timeSpent: z.number().optional() // in seconds
});

// GET /api/quiz/get-quizzes - Get all available quizzes
router.get('/get-quizzes', requireAuth(), async (req, res, next) => {
  try {
    const db = getFirestore();
    const quizzesSnapshot = await db.collection('quizzes').get();
    
    const quizzes = [];
    quizzesSnapshot.forEach(doc => {
      quizzes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ quizzes });
  } catch (err) {
    console.error('Error fetching quizzes:', err);
    next(err);
  }
});

// GET /api/quiz/get-quiz/:id - Get specific quiz by ID
router.get('/get-quiz/:id', requireAuth(), async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getFirestore();
    const quizDoc = await db.collection('quizzes').doc(id).get();
    
    if (!quizDoc.exists) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ quiz: { id: quizDoc.id, ...quizDoc.data() } });
  } catch (err) {
    console.error('Error fetching quiz:', err);
    next(err);
  }
});

// POST /api/quiz/submit-quiz - Submit quiz results
router.post('/submit-quiz', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const data = QuizSubmissionSchema.parse(req.body);
    const db = getFirestore();
    
    // Store quiz result in user's profile
    const quizResult = {
      quizId: data.quizId,
      score: data.score,
      answers: data.answers,
      timeSpent: data.timeSpent || 0,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add to user's quiz history
    await db.collection('users').doc(uid).collection('quizHistory').add(quizResult);

    // Update user's quiz scores summary
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const quizScores = userData.quizScores || {};
    
    quizScores[data.quizId] = {
      bestScore: Math.max(quizScores[data.quizId]?.bestScore || 0, data.score),
      lastScore: data.score,
      attempts: (quizScores[data.quizId]?.attempts || 0) + 1,
      lastAttempted: new Date().toISOString()
    };

    await db.collection('users').doc(uid).set({ quizScores }, { merge: true });

    // Check for quiz achievements
    const completedQuizzesCount = Object.keys(quizScores).length;
    
    // Get total number of quizzes
    const quizzesSnapshot = await db.collection('quizzes').get();
    const totalQuizzes = quizzesSnapshot.size;
    
    const newAchievements = await checkQuizAchievements(uid, completedQuizzesCount, totalQuizzes);

    res.json({ 
      success: true, 
      message: 'Quiz submitted successfully',
      score: data.score,
      quizResult,
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (err) {
    if (err?.name === 'ZodError') {
      console.error('Zod validation failed:', err.issues);
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    console.error('Error submitting quiz:', err);
    next(err);
  }
});

// GET /api/quiz/get-user-scores - Get user's quiz scores and history
router.get('/get-user-scores', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const db = getFirestore();
    
    // Get user's quiz scores summary
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const quizScores = userData.quizScores || {};

    // Get recent quiz history (last 10 attempts)
    const historySnapshot = await db.collection('users').doc(uid).collection('quizHistory')
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    const recentHistory = [];
    historySnapshot.forEach(doc => {
      recentHistory.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ 
      quizScores,
      recentHistory
    });
  } catch (err) {
    console.error('Error fetching user quiz scores:', err);
    next(err);
  }
});

export default router;
