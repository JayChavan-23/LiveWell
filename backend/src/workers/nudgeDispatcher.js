// src/workers/nudgeDispatcher.js
import cron from "node-cron";
import { popDueNudges, requeueNudge, markDelivered } from "../services/nudgesQueue.js";
import { getFirestore } from "../services/firebase.js";
import { getRedis } from "../services/redis.js";
import { initSocket } from "../sockets/index.js";

// This will be populated by initSocket() called from server.js
let ioInstance = null;

/**
 * Register the socket instance for direct emits.
 * (server.js calls initSocket() and passes it here.)
 */
export function registerSocket(io) {
  ioInstance = io;
}

/**
 * Emit a message to a user’s private room.
 */
function emitToUser(uid, event, payload) {
  if (!ioInstance) {
    console.warn("[NudgeDispatcher] No socket instance yet.");
    return false;
  }
  try {
    ioInstance.to(`user:${uid}`).emit(event, payload);
    return true;
  } catch (err) {
    console.error("[NudgeDispatcher] emitToUser error:", err);
    return false;
  }
}

/**
 * Attempt to deliver a queued nudge.
 */
async function tryDeliver(n) {
  const { uid, nudgeId, ref, data } = n;

  const ok = emitToUser(uid, "nudge:new", { id: nudgeId, ...data });
  if (ok) {
    await markDelivered(uid, nudgeId, "socket");

    const db = getFirestore();
    await db.collection("users").doc(uid).collection("nudgeStats").add({
      nudgeId,
      type: data.type,
      sentAt: new Date().toISOString(),
      via: "socket",
      opened: false,
      responded: false,
      priority: data.priority ?? 5,
    });

    console.log(`[NudgeDelivered] ${data.type} → ${uid} (socket)`);
    return;
  }

  // Retry with exponential backoff
  const attempts = data.attempts ?? 0;
  if (attempts < (data.maxAttempts ?? 3)) {
    const delay = [15, 30, 60][Math.min(attempts, 2)]; // minutes
    await requeueNudge(uid, nudgeId, delay);
  } else {
    await ref.set(
      {
        failedAt: new Date().toISOString(),
        failureReason: "socket_offline_or_error",
      },
      { merge: true }
    );
    console.warn(`[NudgeFailed] ${data.type} → ${uid} (max attempts reached)`);
  }
}

/**
 * Cron job to poll due nudges and deliver.
 * Runs every 30 seconds.
 */
export function startNudgeDispatcher(io) {
  if (io) registerSocket(io);
  console.log("[NudgeDispatcher] Initialized");

  cron.schedule("*/30 * * * * *", async () => {
    try {
      const due = await popDueNudges(100);
      if (!due.length) return;
      console.log(`[NudgeDispatcher] Found ${due.length} due nudges`);
      for (const item of due) {
        await tryDeliver(item);
      }
    } catch (e) {
      console.error("[NudgeDispatcher] Error:", e);
    }
  });
}
