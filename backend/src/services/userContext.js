// src/services/userContext.js
import { getFirestore } from "../services/firebase.js";

const db = getFirestore();

/**
 * Collects the latest snapshot of a user’s state across goals, logs, and profile.
 * This provides consistent input for AI-driven nudge logic.
 */
export async function buildUserContext(uid) {
  const now = new Date();

  const userRef = db.collection("users").doc(uid);

  const [frailtySnap, hydrationSnap, goalsSnap, moodSnap, profileSnap] =
    await Promise.all([
      userRef.collection("frailtyLogs").orderBy("date", "desc").limit(1).get(),
      userRef.collection("dailyLogs").orderBy("date", "desc").limit(1).get(),
      userRef.collection("goals").where("status", "==", "active").get(),
      userRef.collection("memories")
        .where("type", "==", "mood")
        .orderBy("updatedAt", "desc")
        .limit(1)
        .get(),
      userRef.collection("aiProfile").doc("prefs").get(),
    ]);

  const frailty = frailtySnap.empty ? {} : frailtySnap.docs[0].data();
  const hydrationLog = hydrationSnap.empty ? {} : hydrationSnap.docs[0].data();
  const goals = goalsSnap.docs.map((d) => d.data());
  const lastMood = moodSnap.empty ? null : moodSnap.docs[0].data();
  const profile = profileSnap.exists ? profileSnap.data() : {};

  // Simplified derived fields
  const inactivityHours = frailty?.sedentaryHours ?? 0;
  const stepCount = frailty?.steps ?? 0;
  const hydration = hydrationLog?.hydration ?? 0;

  return {
    uid,
    now,
    frailty,
    hydrationLog,
    goals,
    lastMood,
    profile,
    inactivityHours,
    stepCount,
    hydration,
  };
}
