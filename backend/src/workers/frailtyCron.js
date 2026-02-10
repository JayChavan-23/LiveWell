import cron from "node-cron";
import { getFirestore } from "../services/firebase.js";
import { computeFrailtyScore } from "../services/frailty.js";
import { updateDailySteps } from "../services/stepsHistory.js";
import { updateDailyHydration } from "../services/hydrationHistory.js";

const db = getFirestore();

export async function recalcFrailtyForAllUsers() {
  const usersSnapshot = await db.collection("users").get();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const today = new Date().toISOString().split("T")[0];

    const logRef = db.collection("users").doc(uid).collection("dailyLogs").doc(today);
    const logSnap = await logRef.get();
    if (!logSnap.exists) continue;

    const log = logSnap.data();
    const score = computeFrailtyScore(log);
    const updatedAt = new Date().toISOString();

    // ✅ Update frailty info in main user doc
    await db.collection("users").doc(uid).set({
      frailtyInfo: {
        ...userDoc.data().frailtyInfo,
        frailtyScore: score,
        updatedAt,
      },
      frailtyScore: { score, date: today, updatedAt },
    }, { merge: true });

    // ✅ Keep historical scores
    await db.collection("users").doc(uid)
      .collection("frailtyScores")
      .doc(today)
      .set({ score, date: today, updatedAt });

    // ✅ NEW: update rolling 7-day steps & hydration
    const steps = log.steps ?? 0;
    const hydration = log.hydration ?? 0;
    await updateDailySteps(uid, steps);
    await updateDailyHydration(uid, hydration);
  }
}

// run every minute for testing
// cron.schedule("* * * * *", recalcFrailtyForAllUsers);

export default recalcFrailtyForAllUsers;
