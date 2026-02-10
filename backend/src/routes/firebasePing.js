import { Router } from 'express';
import { getFirestore } from '../services/firebase.js';
const router = Router();
router.post('/ping', async (_req, res, next) => {
  try {
    const db = getFirestore();
    const ref = db.collection('pings').doc();
    const data = { ok: true, at: new Date().toISOString() };
    await ref.set(data);
    const snap = await ref.get();
    res.json({ id: ref.id, data: snap.data() });
  } catch (e) { next(e); }
});
export default router;

/**
 * @swagger
 * /api/ping:
 *   post:
 *     tags:
 *       - Health Check
 *     summary: Test database connectivity and create a ping record
 *     description: Creates a ping record in Firestore to verify database connectivity and API functionality
 *     responses:
 *       200:
 *         description: Ping successful - database is accessible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123def456"
 *                   description: Firestore document ID of the created ping record
 *                 data:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                       example: true
 *                       description: Status indicator
 *                     at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.123Z"
 *                       description: ISO timestamp when the ping was created
 *       500:
 *         description: Internal server error - database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Database connection failed"
 */