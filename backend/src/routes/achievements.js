import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { 
  getUserAchievements, 
  awardAchievement, 
  checkMilestoneAchievements,
  initializeUserAchievements,
  ACHIEVEMENTS 
} from '../services/achievements.js';

const router = Router();

/**
 * GET /api/achievements
 * Get all achievements with completion status for the authenticated user
 */
router.get('/achievements', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const achievements = await getUserAchievements(uid);
    res.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    next(error);
  }
});

/**
 * GET /api/achievements/all
 * Get the list of all available achievements (without user-specific status)
 */
router.get('/achievements/all', async (req, res, next) => {
  try {
    res.json({ achievements: ACHIEVEMENTS });
  } catch (error) {
    console.error('Error fetching all achievements:', error);
    next(error);
  }
});

/**
 * POST /api/achievements/initialize
 * Initialize achievements for existing users (adds 'account_created' if not present)
 */
router.post('/achievements/initialize', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const initialized = await initializeUserAchievements(uid);
    
    if (initialized) {
      res.json({ 
        message: 'Achievements initialized successfully',
        accountCreatedAwarded: true 
      });
    } else {
      res.json({ 
        message: 'Achievements already initialized',
        accountCreatedAwarded: false 
      });
    }
  } catch (error) {
    console.error('Error initializing achievements:', error);
    next(error);
  }
});

/**
 * POST /api/achievements/check-milestones
 * Check and award milestone achievements (first week, first month, points milestones)
 */
router.post('/achievements/check-milestones', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const newAchievements = await checkMilestoneAchievements(uid);
    
    res.json({ 
      newAchievements,
      count: newAchievements.length 
    });
  } catch (error) {
    console.error('Error checking milestone achievements:', error);
    next(error);
  }
});

/**
 * POST /api/achievements/award
 * Manually award a specific achievement (for testing or special cases)
 */
router.post('/achievements/award', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { achievementId } = req.body;

    if (!achievementId) {
      return res.status(400).json({ error: 'achievementId is required' });
    }

    const result = await awardAchievement(uid, achievementId);
    res.json(result);
  } catch (error) {
    console.error('Error awarding achievement:', error);
    next(error);
  }
});

export default router;

/**
 * @swagger
 * tags:
 *   - name: Achievements
 *     description: User achievements and rewards system
 *
 * components:
 *   schemas:
 *     Achievement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "account_created"
 *         title:
 *           type: string
 *           example: "Welcome to LiveWell"
 *         description:
 *           type: string
 *           example: "Created your LiveWell account"
 *         icon:
 *           type: string
 *           example: "fi-sr-user-add"
 *         badge:
 *           type: string
 *           example: "🎉"
 *         category:
 *           type: string
 *           example: "Milestone"
 *         points:
 *           type: number
 *           example: 10
 *         completed:
 *           type: boolean
 *           example: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 * /api/achievements:
 *   get:
 *     summary: Get user achievements
 *     description: Get all achievements with completion status for the authenticated user
 *     tags:
 *       - Achievements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 achievements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Achievement'
 *       401:
 *         description: Unauthorized
 *
 * /api/achievements/initialize:
 *   post:
 *     summary: Initialize user achievements
 *     description: Initialize achievements for existing users (adds 'account_created' achievement)
 *     tags:
 *       - Achievements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accountCreatedAwarded:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 */

