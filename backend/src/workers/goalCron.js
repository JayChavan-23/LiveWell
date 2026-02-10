// src/workers/goalCron.js
import cron from "node-cron";
import { db } from "../services/db.js";
import { queueNudge } from "../services/nudgesQueue.js";

async function scheduleGoalNudges() {
  const usersSnap = await db().collection("users").get();
  for (const user of usersSnap.docs) {
    const uid = user.id;

    const goalsSnap = await db()
      .collection("users")
      .doc(uid)
      .collection("goals")
      .where("status", "==", "active")
      .get();

    if (goalsSnap.empty) continue;

    const goals = goalsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    for (const g of goals) {
      // Simple heuristic: morning or noon reminder
      await queueNudge(
        uid,
        {
          type: "goal_reminder",
          text: `Goal check: ${g.title || g.target || "Your daily goal"} — how’s it going today?`,
          goalId: g.id,
        },
        0,
        { priority: 6 }
      );
    }
  }
  console.log("[GoalCron] Enqueued reminders for active goals");
}

export function startGoalCron() {
  console.log("[GoalCron] Scheduled");
  // Run every day at 08:00
  cron.schedule("0 8 * * *", async () => {
    try {
      await scheduleGoalNudges();
    } catch (e) {
      console.error("[GoalCron] Error:", e);
    }
  });
}
