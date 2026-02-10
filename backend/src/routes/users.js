import { Router } from 'express';
import { z } from 'zod';
import { getAuth, getFirestore } from '../services/firebase.js';
import { requireAuth } from '../middlewares/auth.js';
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

/** -------------------------
 *  LOGIN (session establish)
 *  -------------------------
 * POST /api/users/login
 * Body: { email, password }
 * Verifies creds with Firebase Auth (via REST) and returns Firestore profile + idToken
 */

router.post('/users/login', async (req, res, next) => {
  try {
    const { phoneOrEmail, password } = req.body || {};
    if (!phoneOrEmail || !password) {
      return res.status(400).json({ error: 'Email/Phone and password required', received: req.body });
    }

    let email = phoneOrEmail;

    // If input looks like a phone number, resolve it to email via Firestore
    if (!phoneOrEmail.includes('@')) {
      const phoneNorm = normalizePhone(phoneOrEmail);
      const db = getFirestore();
      const snapshot = await db.collection('users')
        .where('phone', '==', phoneNorm)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'No user with this phone' });
      }
      email = snapshot.docs[0].data().email;
    }

    // 🔹 Authenticate using Firebase REST API
    const apiKey = process.env.FIREBASE_API_KEY;
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    if (!resp.ok) {
      const err = await resp.json();
      return res.status(400).json({ error: 'Invalid credentials', details: err });
    }

    const data = await resp.json();
    res.json({ 
      uid: data.localId, 
      token: data.idToken,
      email: email // Include the resolved email for frontend Firebase auth
    });
  } catch (e) {
    next(e);
  }
});

/** -------------------------
 *  GET USER PROFILE
 *  -------------------------
 * GET /api/users   (auth required)
 */
router.get('/users/get-data', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });

    res.json({ uid, ...doc.data() });
  } catch (err) {
    console.error('Error fetching user details:', err);
    next(err);
  }
});

/** -------------------------
 *  COMPLETE GOOGLE SIGNUP
 *  -------------------------
 * POST /api/users/complete-google-signup  (auth required)
 * For Google users who are already authenticated via Firebase Auth
 * but need to complete their profile in Firestore
 */
const GoogleSignupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  dob: z.string().min(4),
  state: z.string().min(1).optional(),
  suburb: z.string().min(1).optional(),
});

router.post('/users/complete-google-signup', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not found in auth token' });
    }

    const data = GoogleSignupSchema.parse(sanitize(req.body || {}));
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    const now = new Date().toISOString();

    // Create or update Firestore profile
    const profile = {
      uid,
      email,
      normalizedEmail: normalizeEmail(email),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ? normalizePhone(data.phone) : null,
      dob: data.dob,
      displayName,
      updatedAt: now,
    };

    // Add optional fields
    if (data.state) profile.state = data.state;
    if (data.suburb) profile.suburb = data.suburb;

    const db = getFirestore();
    const docRef = db.collection('users').doc(uid);
    const doc = await docRef.get();

    // Set createdAt and initial achievement only if this is a new profile
    if (!doc.exists) {
      profile.createdAt = now;
      profile.completedAchievements = [
        {
          achievementId: 'account_created',
          completedAt: now
        }
      ];
    }

    await docRef.set(profile, { merge: true });

    // Also update Firebase Auth displayName and phone if provided
    const auth = getAuth();
    const authUpdates = { displayName };
    if (data.phone) authUpdates.phoneNumber = normalizePhone(data.phone);
    await auth.updateUser(uid, authUpdates);

    res.status(200).json({ uid, ...profile });
  } catch (e) {
    next(e);
  }
});

/** -------------------------
 *  UPDATE OWN PROFILE
 *  -------------------------
 * PATCH /api/users  (auth required)
 */
const UpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dob: z.string().min(4).optional(), // "YYYY-MM-DD" preferred
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional(), // allow email update (Auth + Firestore)
}).refine(obj => Object.keys(obj).length > 0, { message: 'No fields to update' });

function sanitize(obj) {
  const t = (v) => trimString(v);
  const out = { ...obj };
  if (out.firstName !== undefined) out.firstName = t(out.firstName);
  if (out.lastName !== undefined) out.lastName = t(out.lastName);
  if (out.phone !== undefined) out.phone = t(out.phone);
  if (out.dob !== undefined) out.dob = t(out.dob);
  if (out.displayName !== undefined) out.displayName = t(out.displayName);
  if (out.email !== undefined) out.email = t(out.email);
  return out;
}

router.patch('/users', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const data = UpdateSchema.parse(sanitize(req.body || {}));
    const now = new Date().toISOString();

    // Update Firebase Auth for email / phone / displayName if provided
    const authUpdates = {};
    if (data.displayName) authUpdates.displayName = data.displayName;
    if (data.phone !== undefined) authUpdates.phoneNumber = data.phone || undefined;
    if (data.email) authUpdates.email = data.email;
    if (Object.keys(authUpdates).length) {
      const auth = getAuth();
      await auth.updateUser(uid, authUpdates);
    }

    // Firestore updates
    const fsUpdates = { ...data, updatedAt: now };
    if (data.email) fsUpdates.normalizedEmail = normalizeEmail(data.email);

    const db = getFirestore();
    await db.collection('users').doc(uid).set(fsUpdates, { merge: true });

    const updated = await db.collection('users').doc(uid).get();
    res.json({ uid, ...updated.data() });
  } catch (e) {
    next(e);
  }
});

/** -------------------------
 *  DELETE OWN ACCOUNT
 *  -------------------------
 * DELETE /api/users  (auth required)
 * NOTE: This deletes Auth user and the top-level profile doc.
 *       Deleting subcollections (health, assessments, chats) can be added later.
 */
router.delete('/users', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;

    // delete Firestore profile
    const db = getFirestore();
    await db.collection('users').doc(uid).delete();

    // TODO: recursive delete of subcollections if needed

    // delete Auth user
    const auth = getAuth();
    await auth.deleteUser(uid);

    res.json({ ok: true, message: 'Account deleted' });
  } catch (e) {
    next(e);
  }
});

export default router;

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Authentication and user profile management APIs
 *
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *           example: "abc123"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           example: "+61412345678"
 *         dob:
 *           type: string
 *           example: "1980-05-15"
 *         state:
 *           type: string
 *           example: "NSW"
 *         suburb:
 *           type: string
 *           example: "Sydney"
 *         displayName:
 *           type: string
 *           example: "Johnny"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /api/users/login:
 *   post:
 *     summary: Login with email or phone
 *     description: Authenticate using Firebase Auth. Accepts either email or phone number along with password.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneOrEmail:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: "abc123"
 *                 token:
 *                   type: string
 *                   description: Firebase ID token
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *
 * /api/users/get-data:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the Firestore profile of the authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Missing uid
 *       404:
 *         description: User not found
 *
 * /api/users:
 *   patch:
 *     summary: Update user profile
 *     description: Update profile fields for the authenticated user. Supports updating Firebase Auth (email, phone, displayName) and Firestore profile.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               phone:
 *                 type: string
 *                 example: "+61412345678"
 *               dob:
 *                 type: string
 *                 example: "1980-05-15"
 *               state:
 *                 type: string
 *                 example: "NSW"
 *               suburb:
 *                 type: string
 *                 example: "Sydney"
 *               displayName:
 *                 type: string
 *                 example: "Johnny"
 *               email:
 *                 type: string
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Validation error or no fields to update
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user’s account from Firebase Auth and Firestore.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deleted"
 *       401:
 *         description: Unauthorized
 */
