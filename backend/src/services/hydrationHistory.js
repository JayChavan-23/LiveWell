import { getFirestore } from "./firebase.js";
const db = getFirestore();

/**
 * Add or update today's hydration total, and prune to last 7 days.
 * @param {string} uid - User ID
 * @param {number} hydration - Glasses or ml consumed today
 */
export async function updateDailyHydration(uid, hydration) {
  const today = new Date().toISOString().slice(0, 10);
  const ref = db.collection("users").doc(uid).collection("hydrationHistory").doc(today);

  await ref.set(
    { date: today, hydration, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  // Remove entries older than 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const oldDocs = await db
    .collection("users")
    .doc(uid)
    .collection("hydrationHistory")
    .where("date", "<", cutoff.toISOString().slice(0, 10))
    .get();

  const batch = db.batch();
  oldDocs.forEach((d) => batch.delete(d.ref));
  if (!oldDocs.empty) await batch.commit();

  console.log(`[HydrationHistory] Updated ${uid}: ${hydration} units for ${today}`);
}

/**
 * Fetch last 7 days of hydration, sorted ascending by date.
 * @param {string} uid - User ID
 * @returns {Promise<Array<{date: string, hydration: number}>>}
 */
export async function getLast7DaysHydration(uid) {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("hydrationHistory")
    .orderBy("date", "desc")
    .limit(7)
    .get();

  const data = snap.docs.map((d) => d.data());
  return data.sort((a, b) => new Date(a.date) - new Date(b.date));
}
