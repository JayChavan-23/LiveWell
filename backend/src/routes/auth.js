import { Router } from 'express';
import { z } from 'zod';
import { getAuth, getFirestore } from '../services/firebase.js';
import { normalizeEmail, trimString } from '../lib/email-id.js';

const router = Router();

function normalizePhone(phone) {
  if (!phone) return undefined;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return phone;
}

// Basic format checks
const SignupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  dob: z.string().min(4),
  state: z.string().min(1).optional(),
  suburb: z.string().min(1).optional(),
});

function sanitizeSignup(input) {
  const t = (v) => trimString(v);
  return {
    firstName: t(input.firstName),
    lastName: t(input.lastName),
    phone: input.phone ? normalizePhone(t(input.phone)) : undefined,
    email: t(input.email),
    password: input.password,
    dob: t(input.dob),
    state: input.state ? t(input.state) : undefined,
    suburb: input.suburb ? t(input.suburb) : undefined,
  };
}

// POST /api/auth/signup
router.post('/auth/signup', async (req, res, next) => {
  let user; // for cleanup on partial failure
  try {
    const raw = req.body || {};
    const cleaned = sanitizeSignup(raw);
    const data = SignupSchema.parse(cleaned);

    const displayName = `${data.firstName} ${data.lastName}`.trim();

    // 1) Create Firebase Auth user
    const auth = getAuth();
    user = await auth.createUser({
      email: data.email,
      password: data.password,
      phoneNumber: data.phone || undefined,
      displayName,
    });

    // 2) Write FULL profile to Firestore
    const now = new Date().toISOString();
    const profile = {
      uid: user.uid,
      email: data.email,
      normalizedEmail: normalizeEmail(data.email),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      dob: data.dob,
      displayName,
      createdAt: now,
      updatedAt: now,
      // Initialize with 'Account Created' achievement
      completedAchievements: [
        {
          achievementId: 'account_created',
          completedAt: now
        }
      ]
    };
    
    // only include optional fields if present
    if (data.state) profile.state = data.state;
    if (data.suburb) profile.suburb = data.suburb;
    
    const db = getFirestore();
    await db.collection('users').doc(user.uid).set(profile);

    // 3) Return safe profile
    res.status(201).json({
      uid: user.uid,
      email: user.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      dob: data.dob,
      state: data.state,
      suburb: data.suburb,
      displayName,
    });
  } catch (e) {
    if (user?.uid) {
      try { await getAuth().deleteUser(user.uid); } catch { /* ignore cleanup error */ }
    }
    next(e);
  }
});

// POST /api/auth/session  { idToken } → returns profile
router.post('/auth/session', async (req, res, next) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'idToken required' });

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });

    res.json({ uid, ...doc.data() });
  } catch (e) { next(e); }
});

export default router;

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create a new user account
 *     description: Creates a new user account with Firebase Auth and stores user profile in Firestore
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - dob
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 example: "John"
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 example: "Doe"
 *                 description: User's last name
 *               phone:
 *                 type: string
 *                 example: "0412345678"
 *                 description: Phone number (optional). Will be normalized to international format
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *                 description: User's password (minimum 6 characters)
 *               dob:
 *                 type: string
 *                 minLength: 4
 *                 example: "1990-01-15"
 *                 description: Date of birth
 *               state:
 *                 type: string
 *                 minLength: 1
 *                 example: "NSW"
 *                 description: State/province (optional)
 *               suburb:
 *                 type: string
 *                 minLength: 1
 *                 example: "Sydney"
 *                 description: Suburb/city (optional)
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "firebase-user-id-123"
 *                   description: Firebase user ID
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "john.doe@example.com"
 *                 firstName:
 *                   type: string
 *                   example: "John"
 *                 lastName:
 *                   type: string
 *                   example: "Doe"
 *                 phone:
 *                   type: string
 *                   nullable: true
 *                   example: "+61412345678"
 *                   description: Normalized phone number
 *                 dob:
 *                   type: string
 *                   example: "1990-01-15"
 *                 state:
 *                   type: string
 *                   nullable: true
 *                   example: "NSW"
 *                 suburb:
 *                   type: string
 *                   nullable: true
 *                   example: "Sydney"
 *                 displayName:
 *                   type: string
 *                   example: "John Doe"
 *                   description: Full name (firstName + lastName)
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
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User already exists"
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
router.post('/auth/signup', async (req, res, next) => {
  // Your existing route handler code here
});

/**
 * @swagger
 * /api/auth/session:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Get user profile from Firebase ID token
 *     description: Validates Firebase ID token and returns user profile from Firestore
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "firebase-user-id-123"
 *                   description: Firebase user ID
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "john.doe@example.com"
 *                 normalizedEmail:
 *                   type: string
 *                   example: "johndoe@example.com"
 *                   description: Normalized email for ID purposes
 *                 firstName:
 *                   type: string
 *                   example: "John"
 *                 lastName:
 *                   type: string
 *                   example: "Doe"
 *                 phone:
 *                   type: string
 *                   nullable: true
 *                   example: "+61412345678"
 *                 dob:
 *                   type: string
 *                   example: "1990-01-15"
 *                 displayName:
 *                   type: string
 *                   example: "John Doe"
 *                 state:
 *                   type: string
 *                   nullable: true
 *                   example: "NSW"
 *                 suburb:
 *                   type: string
 *                   nullable: true
 *                   example: "Sydney"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                   description: Account creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                   description: Last update timestamp
 *       400:
 *         description: Missing or invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "idToken required"
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid token"
 *       404:
 *         description: User profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile not found"
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