import { Router } from 'express';
import { z } from 'zod';
import { getFirestore } from '../services/firebase.js';
import { requireAuth } from '../middlewares/auth.js';
import { saveDailyLog } from "../services/frailtyLogs.js";
import { saveFrailtyToMemories } from '../services/memoryStore.js';

const router = Router();

const FrailtySchema = z.object({
  uid: z.string().min(1),
  moderateMinutes: z.coerce.number().min(0),
  vigorousMinutes: z.coerce.number().min(0),
  steps: z.coerce.number().min(0),
  sedentaryHours: z.coerce.number().min(0),
  strengthDays: z.coerce.number().min(0),
  frailtyScore: z.coerce.number().min(0).max(100),
});

// Save frailty info
router.post('/post-frailty-info', async (req, res, next) => {
  try {
    const data = FrailtySchema.parse(req.body);
    const frailtyInfo = {
      moderateMinutes: data.moderateMinutes,
      vigorousMinutes: data.vigorousMinutes,
      steps: data.steps,
      sedentaryHours: data.sedentaryHours,
      strengthDays: data.strengthDays,
      frailtyScore: data.frailtyScore,
      updatedAt: new Date().toISOString(),
    };
    console.log("id: ", data.uid);
    const db = getFirestore();
    await db.collection('users').doc(data.uid).set({ frailtyInfo }, { merge: true });
    console.log("DONEE: ");
    //saving info for AI personalization
    await saveFrailtyToMemories(data.uid, frailtyInfo);
    res.json({ success: true });
  } catch (err) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    next(err);
  }
});

router.get('/get-frailty-info', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });

    const data = doc.data();
    
    res.json({ uid, frailtyInfo: data.frailtyInfo || {} });
  } catch (err) {
    console.error('Error fetching frailty info:', err);
    next(err);
  }
});

// Save daily log (steps, hydration, etc.)
router.post('/frailty/logs', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    await saveDailyLog(uid, req.body);
    res.json({ success: true, message: 'Daily log saved' });
  } catch (err) {
    next(err);
  }
});

// Get latest frailty score (calculated by cron)
router.get('/frailty/score', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const score = await getLatestScore(uid);
    res.json({ uid, score });
  } catch (err) {
    next(err);
  }
});

// Get score history (e.g. past 30 days)
router.get('/frailty/history', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { days = 30 } = req.query;
    const history = await getScoreHistory(uid, parseInt(days));
    res.json({ uid, history });
  } catch (err) {
    next(err);
  }
});


export default router;

/**
 * @swagger
 * /api/post-frailty-info:
 *   post:
 *     tags:
 *       - Frailty Assessment
 *     summary: Save user's frailty assessment information
 *     description: Updates user's frailty information including activity metrics and calculated frailty score
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - moderateMinutes
 *               - vigorousMinutes
 *               - steps
 *               - sedentaryHours
 *               - strengthDays
 *               - frailtyScore
 *             properties:
 *               uid:
 *                 type: string
 *                 minLength: 1
 *                 example: "firebase-user-id-123"
 *                 description: User's Firebase UID
 *               moderateMinutes:
 *                 type: number
 *                 minimum: 0
 *                 example: 150
 *                 description: Minutes of moderate physical activity per week
 *               vigorousMinutes:
 *                 type: number
 *                 minimum: 0
 *                 example: 75
 *                 description: Minutes of vigorous physical activity per week
 *               steps:
 *                 type: number
 *                 minimum: 0
 *                 example: 8000
 *                 description: Average daily steps
 *               sedentaryHours:
 *                 type: number
 *                 minimum: 0
 *                 example: 6
 *                 description: Hours of sedentary behavior per day
 *               strengthDays:
 *                 type: number
 *                 minimum: 0
 *                 example: 3
 *                 description: Days per week doing strength training
 *               frailtyScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 25
 *                 description: Calculated frailty score (0-100, lower is better)
 *     responses:
 *       200:
 *         description: Frailty information saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       expected:
 *                         type: string
 *                       received:
 *                         type: string
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/post-frailty-info', async (req, res, next) => {
  // Your existing route handler code here
});

/**
 * @swagger
 * /api/get-frailty-info:
 *   get:
 *     tags:
 *       - Frailty Assessment
 *     summary: Get user's frailty assessment information
 *     description: Retrieves the authenticated user's frailty information from their profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Frailty information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "firebase-user-id-123"
 *                 frailtyInfo:
 *                   type: object
 *                   properties:
 *                     moderateMinutes:
 *                       type: number
 *                       example: 150
 *                     vigorousMinutes:
 *                       type: number
 *                       example: 75
 *                     steps:
 *                       type: number
 *                       example: 8000
 *                     sedentaryHours:
 *                       type: number
 *                       example: 6
 *                     strengthDays:
 *                       type: number
 *                       example: 3
 *                     frailtyScore:
 *                       type: number
 *                       example: 25
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Missing UID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing uid"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/get-frailty-info', requireAuth(), async (req, res, next) => {
  // Your existing route handler code here
});

/**
 * @swagger
 * /api/frailty/logs:
 *   post:
 *     tags:
 *       - Frailty Logs
 *     summary: Save daily activity log
 *     description: Saves daily log data including steps, hydration, and other activity metrics for frailty assessment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Daily log data (structure depends on saveDailyLog service implementation)
 *             example:
 *               steps: 8500
 *               hydration: 2.5
 *               sleepHours: 7
 *               exerciseMinutes: 30
 *               date: "2024-01-15"
 *     responses:
 *       200:
 *         description: Daily log saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Daily log saved"
 *       400:
 *         description: Missing UID or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing uid"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post('/frailty/logs', requireAuth(), async (req, res, next) => {
  // Your existing route handler code here
});

/**
 * @swagger
 * /api/frailty/score:
 *   get:
 *     tags:
 *       - Frailty Assessment
 *     summary: Get latest calculated frailty score
 *     description: Retrieves the user's most recent frailty score as calculated by the system cron job
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest frailty score retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "firebase-user-id-123"
 *                 score:
 *                   type: number
 *                   example: 25
 *                   description: Latest calculated frailty score
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get('/frailty/score', requireAuth(), async (req, res, next) => {
  // Your existing route handler code here
});

/**
 * @swagger
 * /api/frailty/history:
 *   get:
 *     tags:
 *       - Frailty Assessment
 *     summary: Get frailty score history
 *     description: Retrieves the user's frailty score history for a specified number of days (default 30)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           example: 30
 *         description: Number of days of history to retrieve
 *     responses:
 *       200:
 *         description: Frailty score history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "firebase-user-id-123"
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2024-01-15"
 *                       score:
 *                         type: number
 *                         example: 25
 *                   description: Array of historical frailty scores
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */