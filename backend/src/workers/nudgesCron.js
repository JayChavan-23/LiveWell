// src/workers/nudgesCron.js
import cron from "node-cron";
import { runNudgesForAllUsers } from "../services/nudges.js";

/**
 * Starts the "agentic" nudge scheduler — typically run by a separate
 * worker role (WORKER_ROLE=scheduler). It runs once on boot, then hourly.
 */
export async function startNudgesScheduler() {
  console.log("[NudgeScheduler] starting hourly agentic scheduler...");

  // Run immediately when server starts
  try {
    await runNudgesForAllUsers();
    console.log("[NudgeScheduler] initial run complete");
  } catch (err) {
    console.error("[NudgeScheduler] initial run error:", err);
  }

  // Schedule to run every hour at minute 10
  cron.schedule("10 * * * *", async () => {
    console.log("[NudgeScheduler] tick @", new Date().toISOString());
    try {
      await runNudgesForAllUsers();
      console.log("[NudgeScheduler] hourly run complete");
    } catch (err) {
      console.error("[NudgeScheduler] error:", err);
    }
  });

  console.log("[NudgeScheduler] Initialized");
}

/**
 * Starts a simpler worker that just runs every hour (used in main server mode)
 */
let cronJob = null;

export function startNudgesWorker() {
  if (cronJob) {
    console.log("[Nudge Cron] Worker already running");
    return;
  }

  cronJob = cron.schedule("0 * * * *", async () => {
    console.log("[Nudge Cron] Running hourly nudge check...");
    try {
      await runNudgesForAllUsers();
      console.log("[Nudge Cron] All user nudges executed successfully");
    } catch (err) {
      console.error("[Nudge Cron] Error:", err);
    }
  });

  console.log("[Nudge Cron] Worker started - will run every hour");
}
