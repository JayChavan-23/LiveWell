import { getFirestore } from "./firebase.js";
const db = getFirestore();

/**
 * Add or update today's step total, and prune to last 7 days.
 * @param {string} uid - User ID
 * @param {number} steps - Total steps for the day
 */
export async function updateDailySteps(uid, steps) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ref = db.collection("users").doc(uid).collection("stepHistory").doc(today);

  await ref.set(
    { date: today, steps, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  // Remove entries older than 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const oldDocs = await db
    .collection("users")
    .doc(uid)
    .collection("stepHistory")
    .where("date", "<", cutoff.toISOString().slice(0, 10))
    .get();

  const batch = db.batch();
  oldDocs.forEach((d) => batch.delete(d.ref));
  if (!oldDocs.empty) await batch.commit();

  console.log(`[StepsHistory] Updated ${uid}: ${steps} steps for ${today}`);
}

/**
 * Fetch last 7 days of steps, sorted ascending by date.
 * @param {string} uid - User ID
 * @returns {Promise<Array<{date: string, steps: number}>>}
 */
export async function getLast7DaysSteps(uid) {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("stepHistory")
    .orderBy("date", "desc")
    .limit(7)
    .get();

  const data = snap.docs.map((d) => d.data());
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
}
