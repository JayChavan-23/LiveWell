// src/routes/nudges.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { runNudgesForUser } from "../services/nudges.js";

const router = Router();

/**
 * Manually trigger nudges for the authenticated user
 * (useful for testing before sockets/push are set up)
 */
router.get("/nudges/run", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const nudges = await runNudgesForUser(uid);
    res.json({ nudges });
  } catch (err) {
    next(err);
  }
});

export default router;
