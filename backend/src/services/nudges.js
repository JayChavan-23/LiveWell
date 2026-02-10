// src/services/nudges.js
import { getFirestore } from "../services/firebase.js";
import { queueNudge } from "./nudgesQueue.js";
import { safeGenerateContent } from "./gemini.js";
import { buildUserContext } from "./userContext.js";

const db = getFirestore();

/**
 * Helper: classify tone and difficulty for adaptive messages.
 */
function classifyTone(ctx) {
  const mood = ctx.lastMood?.value?.toLowerCase?.() || "";
  if (["sad", "tired", "low", "anxious"].some((m) => mood.includes(m))) return "gentle";
  if (ctx.inactivityHours > 3) return "supportive";
  return "positive";
}
function adjustDifficulty(ctx) {
  const goalsMet = ctx.goals.filter((g) => g.status === "completed").length;
  if (goalsMet > 3) return "increase";
  if (ctx.inactivityHours > 5) return "decrease";
  return "same";
}

/**
 * Generate a short AI nudge text using Gemini.
 */
async function aiComposeNudge(ctx, domain, tone, difficulty) {
  const prompt = `
You are a friendly wellbeing coach for older adults.
Compose one motivating sentence (max 25 words).
Tone: ${tone}. Domain: ${domain}. Difficulty: ${difficulty}.
Recent context:
- steps: ${ctx.stepCount}
- hydration: ${ctx.hydration}
- inactivityHours: ${ctx.inactivityHours}
- last mood: ${ctx.lastMood?.value || "neutral"}
Respond ONLY with the message text.
`;
  const text = await safeGenerateContent(prompt);
  return text.replace(/^["']|["']$/g, "").trim();
}

/**
 * Decide which domains need nudges based on context.
 */
function decideDomains(ctx) {
  const domains = [];
  if (ctx.stepCount < (ctx.profile?.preferences?.frailty?.steps || 6000)) domains.push("activity");
  if (ctx.hydration < (ctx.profile?.preferences?.hydrationTarget || 8)) domains.push("hydration");
  if (ctx.inactivityHours >= 2) domains.push("movement");
  if (["sad", "low"].some((m) => (ctx.lastMood?.value || "").toLowerCase().includes(m)))
    domains.push("mood");
  return domains;
}

/**
 * Main per-user nudge run.
 */
export async function runNudgesForUser(uid) {
  const ctx = await buildUserContext(uid);
  const tone = classifyTone(ctx);
  const difficulty = adjustDifficulty(ctx);
  const domains = decideDomains(ctx);

  console.log(`[AgenticNudge] uid=${uid} tone=${tone} diff=${difficulty} domains=${domains}`);

  for (const domain of domains) {
    try {
      const msgText = await aiComposeNudge(ctx, domain, tone, difficulty);
      const nudge = { type: domain, text: msgText, tone, difficulty };
      await queueNudge(uid, nudge, 0, { priority: 5 });
      await db.collection("users").doc(uid).collection("nudgeStats").add({
        rule: domain,
        tone,
        difficulty,
        createdAt: new Date().toISOString(),
      });
      console.log(`[AgenticNudge] Queued ${domain} for ${uid}`);
    } catch (err) {
      console.error(`[AgenticNudge] ${uid} domain=${domain} failed:`, err);
    }
  }
}

/**
 * Iterate all users (triggered by cron)
 */
export async function runNudgesForAllUsers() {
  const snap = await db.collection("users").get();
  const uids = snap.docs.map((d) => d.id);
  console.log(`[AgenticNudge] Running for ${uids.length} users`);
  for (const uid of uids) {
    await runNudgesForUser(uid);
  }
}
