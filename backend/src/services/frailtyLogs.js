import { getFirestore } from "./firebase.js";
const db = getFirestore();

export async function saveDailyLog(uid, log) {
  const today = new Date().toISOString().split("T")[0];
  await db.collection("users")
    .doc(uid)
    .collection("dailyLogs")
    .doc(today)
    .set({
      ...log,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
}
