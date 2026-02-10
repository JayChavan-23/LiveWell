import { getFirestore } from "./firebase.js";
const db = getFirestore();

export function computeFrailtyScore(log) {
  const moderate = parseInt(log.moderateMinutes) || 0;
  const vigorous = parseInt(log.vigorousMinutes) || 0;
  const steps = parseInt(log.steps) || 0;
  const sedentary = parseInt(log.sedentaryHours) || 0;
  const strength = parseInt(log.strengthDays) || 0;

  // 1. MVPA (0–40 pts)
  const mvpaEqDay = moderate + (2 * vigorous);
  const mvpaPts = Math.min(40, (40 * mvpaEqDay) / 120);

  // 2. Steps (0–30 pts)
  let stepsPts = 0;
  if (steps <= 2000) stepsPts = 0;
  else if (steps <= 4000) stepsPts = 10 * (steps - 2000) / 2000;
  else if (steps <= 6000) stepsPts = 10 + (8 * (steps - 4000) / 2000);
  else if (steps <= 8000) stepsPts = 18 + (6 * (steps - 6000) / 2000);
  else if (steps <= 10000) stepsPts = 24 + (4 * (steps - 8000) / 2000);
  else stepsPts = 30;

  // 3. Strength/Balance (0–15 pts)
  let strengthPts = 0;
  if (strength === 0) strengthPts = 0;
  else if (strength === 1) strengthPts = 6;
  else if (strength <= 3) strengthPts = 12;
  else strengthPts = 15;

  // 4. Sedentary hours (0–15 pts)
  let sedentaryPts = 0;
  if (sedentary >= 10) sedentaryPts = 0;
  else if (sedentary >= 8) sedentaryPts = 6;
  else if (sedentary >= 6) sedentaryPts = 6 + (4 * (8 - sedentary) / 2);
  else if (sedentary >= 4) sedentaryPts = 10 + (3 * (6 - sedentary) / 2);
  else sedentaryPts = 15;

  return Math.round(mvpaPts + stepsPts + strengthPts + sedentaryPts);
}

// ---- Firestore Helpers ----
export async function getLatestScore(uid) {
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();
  return doc.exists ? doc.data().frailtyScore || null : null;
}

export async function getScoreHistory(uid, days) {
  const scoresRef = db.collection("users").doc(uid).collection("frailtyInfo");
  const snapshot = await scoresRef.orderBy("date", "desc").limit(days).get();
  return snapshot.docs.map(doc => doc.data());
}

export async function saveFrailtyScore(uid, log) {
  const today = new Date().toISOString().split("T")[0];
  const score = computeFrailtyScore(log);

  // Update user doc with latest score
  await db.collection("users").doc(uid).update({
    frailtyScore: { score, date: today, updatedAt: new Date().toISOString() }
  });

  // Store history
  await db.collection("users").doc(uid).collection("frailtyInfo").doc(today).set({
    score,
    date: today,
    updatedAt: new Date().toISOString()
  });

  return score;
}
