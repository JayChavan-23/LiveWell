import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { deleteMemory, getActiveMemories } from "../services/memoryStore.js";
import { db } from "../services/db.js";
import { rebuildAiProfile } from "../services/memoryStore.js";

const router = Router();

/**
 * GET /api/memory
 * Fetch all active memories for the user.
 */
router.get("/", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const memories = await getActiveMemories(uid);
    res.json({ memories });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/memory
 * Soft delete memory by key or ID.
 */
router.delete("/", requireAuth(), async (req, res, next) => {
    try {
      const uid = req.user.uid;
      const { key, id } = req.body || {};
  
      if (!key && !id) {
        return res.status(400).json({ error: "Provide memory key or id to delete" });
      }
  
      // 1️⃣ Mark the memory inactive
      const userRef = db().collection("users").doc(uid);
      const memoriesRef = userRef.collection("memories");
  
      let targetRef;
      if (id) {
        targetRef = memoriesRef.doc(id);
      } else {
        const snap = await memoriesRef.where("key", "==", key).where("active", "==", true).limit(1).get();
        if (snap.empty) {
          return res.status(404).json({ error: "Memory not found" });
        }
        targetRef = snap.docs[0].ref;
      }
  
      await targetRef.update({
        active: false,
        updatedAt: new Date().toISOString(),
      });
  
      // 2️⃣ Wait briefly to let Firestore indexes catch up
      await new Promise((r) => setTimeout(r, 300));
  
      // 3️⃣ Rebuild AI profile (to reflect removal)
      const updatedProfile = await rebuildAiProfile(uid);
  
      // 4️⃣ Respond with confirmation + updated profile
      res.json({
        success: true,
        message: "Memory deleted and profile rebuilt successfully",
        updatedProfile,
      });
    } catch (e) {
      console.error("[Memory Delete Error]", e);
      next(e);
    }
  });
  

export default router;
