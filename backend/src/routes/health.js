import { Router } from 'express';
import { z } from 'zod';
import { getFirestore } from '../services/firebase.js';
import { requireAuth } from '../middlewares/auth.js';
import { saveHealthToMemories } from "../services/memoryStore.js";

const router = Router();

// Helpers
const Boolish = z.union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform(v => v === true || v === 'true');

const AllergiesSchema = z.object({
  nuts: Boolish.optional(),
  dairy: Boolish.optional(),
  shellfish: Boolish.optional(),
  gluten: Boolish.optional(),
  other: z.string().optional(),
}).catchall(z.union([Boolish, z.string()]));

const DietSchema = z.object({
  vegan: Boolish.optional(),
  halal: Boolish.optional(),
  vegetarian: Boolish.optional(),
  keto: Boolish.optional(),
  other: z.string().optional(),
}).catchall(z.union([Boolish, z.string()]));

const HealthSchema = z.object({
  uid: z.string().min(1),
  diabetic: Boolish,
  allergies: AllergiesSchema.default({}),
  dietaryPreferences: DietSchema.default({}),
  medicalConditions: z.string().optional(),
  hydrationTarget: z.coerce.number().int().min(0).max(10),
  height: z.union([z.string(), z.coerce.number()]),
  heightUnit: z.enum(['cm', 'ft']),
  heightInches: z.coerce.number().int().min(0).max(11).optional(),
  weight: z.coerce.number(),
  consent: Boolish,
});

// never write undefined to Firestore
function stripUndefined(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    service: "live-well-backend"
  });
});


// POST /api/health/health-info  → save health info into user doc
router.post('/post-health-info', async (req, res, next) => {
  try {
    if (!req.body) return res.status(400).json({ error: 'Missing request body' });

    const data = HealthSchema.parse(req.body);

    const healthInfo = stripUndefined({
      diabetic: data.diabetic,
      allergies: data.allergies,
      dietaryPreferences: data.dietaryPreferences,
      medicalConditions: data.medicalConditions || '',
      hydrationTarget: data.hydrationTarget,
      height: data.height,
      heightUnit: data.heightUnit,
      heightInches: data.heightUnit === 'ft' ? (data.heightInches ?? 0) : undefined,
      weight: data.weight,
      consent: data.consent,
      updatedAt: new Date().toISOString(),
    });

    const db = getFirestore();
    await db.collection('users').doc(data.uid).set({ healthInfo }, { merge: true });

    //save info for AI personalization
    await saveHealthToMemories(data.uid, healthInfo);

    res.json({ success: true });
  } catch (err) {
    if (err?.name === 'ZodError') {
      console.error('Zod validation failed:', err.issues);
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    console.error('Health info save error:', err);
    next(err);
  }
});

// GET /api/health/:uid  → fetch full user health data
router.get('/get-health-info', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = doc.data();
    res.json({ uid, healthInfo: data.healthInfo || {} });
  } catch (err) {
    console.error('Error fetching health info:', err);
    next(err);
  }
});

export default router;

/**
 * @swagger
 * /api/post-health-info:
 *   post:
 *     tags:
 *       - Health Information
 *     summary: Save user's health information and preferences
 *     description: Updates user's health profile including allergies, dietary preferences, medical conditions, and physical measurements
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - diabetic
 *               - hydrationTarget
 *               - height
 *               - heightUnit
 *               - weight
 *               - consent
 *             properties:
 *               uid:
 *                 type: string
 *                 minLength: 1
 *                 example: "firebase-user-id-123"
 *                 description: User's Firebase UID
 *               diabetic:
 *                 oneOf:
 *                   - type: boolean
 *                   - type: string
 *                     enum: ['true', 'false']
 *                 example: false
 *                 description: Whether the user is diabetic
 *               allergies:
 *                 type: object
 *                 properties:
 *                   nuts:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: true
 *                   dairy:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: false
 *                   shellfish:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: false
 *                   gluten:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: true
 *                   other:
 *                     type: string
 *                     example: "latex, peanuts"
 *                     description: Other allergies not covered by standard options
 *                 description: User's allergies (all fields optional)
 *               dietaryPreferences:
 *                 type: object
 *                 properties:
 *                   vegan:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: false
 *                   halal:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: true
 *                   vegetarian:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: false
 *                   keto:
 *                     oneOf:
 *                       - type: boolean
 *                       - type: string
 *                         enum: ['true', 'false']
 *                     example: false
 *                   other:
 *                     type: string
 *                     example: "low sodium"
 *                     description: Other dietary preferences not covered by standard options
 *                 description: User's dietary preferences (all fields optional)
 *               medicalConditions:
 *                 type: string
 *                 example: "Hypertension, Arthritis"
 *                 description: Additional medical conditions (optional)
 *               hydrationTarget:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 example: 8
 *                 description: Daily hydration target in glasses/cups
 *               height:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                 example: 170
 *                 description: User's height (number for cm, string for ft)
 *               heightUnit:
 *                 type: string
 *                 enum: ['cm', 'ft']
 *                 example: "cm"
 *                 description: Height measurement unit
 *               heightInches:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 11
 *                 example: 6
 *                 description: Additional inches when using feet (required only if heightUnit is 'ft')
 *               weight:
 *                 type: number
 *                 example: 70.5
 *                 description: User's weight in kg
 *               consent:
 *                 oneOf:
 *                   - type: boolean
 *                   - type: string
 *                     enum: ['true', 'false']
 *                 example: true
 *                 description: User's consent to data processing
 *     responses:
 *       200:
 *         description: Health information saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation error or missing request body
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Missing request body"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Validation failed"
 *                     issues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           code:
 *                             type: string
 *                           expected:
 *                             type: string
 *                           received:
 *                             type: string
 *                           path:
 *                             type: array
 *                             items:
 *                               type: string
 *                           message:
 *                             type: string
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
router.post('/post-health-info', async (req, res, next) => {
  // Your existing route handler code here
});

/**
 * @swagger
 * /api/get-health-info:
 *   get:
 *     tags:
 *       - Health Information
 *     summary: Get user's health information and preferences
 *     description: Retrieves the authenticated user's complete health profile including allergies, dietary preferences, and medical information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "firebase-user-id-123"
 *                 healthInfo:
 *                   type: object
 *                   properties:
 *                     diabetic:
 *                       type: boolean
 *                       example: false
 *                     allergies:
 *                       type: object
 *                       properties:
 *                         nuts:
 *                           type: boolean
 *                           example: true
 *                         dairy:
 *                           type: boolean
 *                           example: false
 *                         shellfish:
 *                           type: boolean
 *                           example: false
 *                         gluten:
 *                           type: boolean
 *                           example: true
 *                         other:
 *                           type: string
 *                           example: "latex, peanuts"
 *                     dietaryPreferences:
 *                       type: object
 *                       properties:
 *                         vegan:
 *                           type: boolean
 *                           example: false
 *                         halal:
 *                           type: boolean
 *                           example: true
 *                         vegetarian:
 *                           type: boolean
 *                           example: false
 *                         keto:
 *                           type: boolean
 *                           example: false
 *                         other:
 *                           type: string
 *                           example: "low sodium"
 *                     medicalConditions:
 *                       type: string
 *                       example: "Hypertension, Arthritis"
 *                     hydrationTarget:
 *                       type: integer
 *                       example: 8
 *                     height:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                       example: 170
 *                     heightUnit:
 *                       type: string
 *                       enum: ['cm', 'ft']
 *                       example: "cm"
 *                     heightInches:
 *                       type: integer
 *                       example: 6
 *                       description: Only present when heightUnit is 'ft'
 *                     weight:
 *                       type: number
 *                       example: 70.5
 *                     consent:
 *                       type: boolean
 *                       example: true
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