// src/services/nudgesQueue.js
import { getRedis } from "../services/redis.js";
import { getFirestore } from "../services/firebase.js";

const db = getFirestore();

/**
 * Queue a nudge in Firestore (with Redis fast lane if available)
 */
export async function queueNudge(
  uid,
  nudge,
  delayMinutes = 0,
  {
    priority = 5,
    maxAttempts = 3,
    expiryMs = 6 * 60 * 60 * 1000, // 6h
  } = {}
) {
  const now = Date.now();
  const sendAt = new Date(now + delayMinutes * 60_000).toISOString();

  const ref = await db
    .collection("users")
    .doc(uid)
    .collection("nudges")
    .add({
      ...nudge,
      createdAt: new Date(now).toISOString(),
      sendAt,
      delivered: false,
      priority,
      attempts: 0,
      maxAttempts,
      expiryMs,
    });

  try {
    const client = await getRedis();
    await client.zAdd("nudgeQueue", [
      {
        score: new Date(sendAt).getTime(),
        value: JSON.stringify({ uid, nudgeId: ref.id }),
      },
    ]);
  } catch (err) {
    console.warn("[queueNudge] Redis unavailable, fallback only to Firestore");
  }

  console.log(`[NudgeQueued] ${nudge.type} for ${uid} @ ${sendAt}`);
  return { id: ref.id, sendAt };
}

/**
 * Pop due nudges (score <= now)
 */
export async function popDueNudges(limit = 100) {
  const client = await getRedis();
  const now = Date.now();

  let items = [];
  try {
    items = await client.zRangeByScore("nudgeQueue", 0, now, {
      LIMIT: { offset: 0, count: limit },
    });
  } catch (err) {
    console.warn("[popDueNudges] Redis unavailable, no queue pop");
    return [];
  }

  if (!items.length) return [];

  // Remove from Redis to avoid duplicate delivery
  await client.zRem("nudgeQueue", items);

  const parsed = [];
  for (const raw of items) {
    try {
      parsed.push(JSON.parse(raw));
    } catch (_) {}
  }

  const result = [];
  for (const { uid, nudgeId } of parsed) {
    const ref = db.collection("users").doc(uid).collection("nudges").doc(nudgeId);
    const snap = await ref.get();
    if (!snap.exists) continue;

    const data = snap.data();
    if (data.delivered) continue;

    const sendAtMs = new Date(data.sendAt).getTime();
    if (now > sendAtMs + (data.expiryMs ?? 6 * 60 * 60 * 1000)) {
      await ref.set({ expiredAt: new Date().toISOString() }, { merge: true });
      continue;
    }

    result.push({ uid, nudgeId, ref, data });
  }

  // Sort by priority ascending (lower = higher priority)
  result.sort((a, b) => (a.data.priority ?? 5) - (b.data.priority ?? 5));
  return result;
}

/**
 * Requeue a failed nudge with delay backoff
 */
export async function requeueNudge(uid, nudgeId, delayMinutes = 30) {
  const ref = db.collection("users").doc(uid).collection("nudges").doc(nudgeId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data();
  const nextSendAt = new Date(Date.now() + delayMinutes * 60_000).toISOString();

  await ref.set(
    {
      attempts: (data.attempts ?? 0) + 1,
      sendAt: nextSendAt,
      lastAttemptAt: new Date().toISOString(),
    },
    { merge: true }
  );

  try {
    const client = await getRedis();
    await client.zAdd("nudgeQueue", [
      {
        score: new Date(nextSendAt).getTime(),
        value: JSON.stringify({ uid, nudgeId }),
      },
    ]);
  } catch (err) {
    console.warn("[requeueNudge] Redis unavailable, will rely on Firestore poller");
  }

  console.log(`[NudgeRequeued] ${data.type} for ${uid} → ${nextSendAt}`);
}

/**
 * Mark a nudge as delivered
 */
export async function markDelivered(uid, nudgeId, method = "socket") {
  const ref = db.collection("users").doc(uid).collection("nudges").doc(nudgeId);
  await ref.set(
    {
      delivered: true,
      deliveredAt: new Date().toISOString(),
      deliveryMethod: method,
    },
    { merge: true }
  );
  return ref;
}
