import express from "express";
import { getLast7DaysSteps } from "../services/stepsHistory.js";
import { getLast7DaysHydration } from "../services/hydrationHistory.js";

const router = express.Router();

/**
 * GET /api/users/:uid/weekly-summary
 * Returns the last 7 days of steps and hydration data.
 */
router.get("/users/:uid/weekly-summary", async (req, res) => {
  const { uid } = req.params;

  try {
    // Fetch both step and hydration histories
    const [steps, hydration] = await Promise.all([
      getLast7DaysSteps(uid),
      getLast7DaysHydration(uid),
    ]);

    // Merge by date to create a unified daily summary
    const map = new Map();

    for (const s of steps) {
      map.set(s.date, { date: s.date, steps: s.steps || 0, hydration: 0 });
    }

    for (const h of hydration) {
      if (map.has(h.date)) {
        map.get(h.date).hydration = h.hydration || 0;
      } else {
        map.set(h.date, { date: h.date, steps: 0, hydration: h.hydration || 0 });
      }
    }

    // Sort ascending by date
    const weeklySummary = Array.from(map.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      uid,
      days: weeklySummary,
      totals: {
        steps: weeklySummary.reduce((sum, d) => sum + d.steps, 0),
        hydration: weeklySummary.reduce((sum, d) => sum + d.hydration, 0),
      },
    });
  } catch (err) {
    console.error("[weekly-summary] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
