import { Router } from 'express';
import { redisPing } from '../services/redis.js';
const router = Router();
router.get('/redis/ping', async (_req, res, next) => {
  try { res.json({ pong: await redisPing() }); }
  catch (e) { next(e); }
});
export default router;

/**
 * @swagger
 * tags:
 *   - name: System
 *     description: System health and monitoring endpoints
 *
 * /api/redis/ping:
 *   get:
 *     summary: Ping Redis
 *     description: Health check endpoint to verify Redis connectivity.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Redis responded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pong:
 *                   type: string
 *                   example: "PONG"
 *       500:
 *         description: Redis not reachable or server error
 */
