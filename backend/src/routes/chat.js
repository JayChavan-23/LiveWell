import { Router } from "express";
import { getModel, getBackupModel } from "../services/gemini.js";
import { db } from "../services/db.js";
import { requireAuth } from "../middlewares/auth.js";
import { upsertMemory, mergeFactsIntoProfile, getHealthSummaryForAI, rebuildAiProfile } from "../services/memoryStore.js";
import { MemoryItemSchema } from "../schemas/memory.js";

const router = Router();

/**
 * Extract structured memories from assistant reply (<memories>...</memories>)
 * Stores in memoryStore + AIProfile.
 */
async function extractMemoriesFromReply(uid, reply, chatId) {
  const matches = reply.match(/<memories>([\s\S]*?)<\/memories>/);
  if (!matches) return;

  try {
    const parsed = JSON.parse(matches[1]);

    if (Array.isArray(parsed)) {
      const facts = [];
      for (const raw of parsed) {
        const memory = MemoryItemSchema.parse({
          ...raw,
          source: { kind: "chat", chatId },
        });
        await upsertMemory(uid, memory);
        facts.push(memory);
      }

      // Merge durable facts into AIProfile
      if (facts.length > 0) {
        await mergeFactsIntoProfile(uid, facts);
      }
    }
  } catch (err) {
    console.error("Failed to parse memories:", err);
  }
}

/**
 * Extracts health-related facts from a raw user message.
 * Used as a fallback before LLM-generated <memories> extraction.
 */
export async function extractFactsFromUserMessage(uid, message, chatId) {
  if (!message || typeof message !== "string") return [];

  const lowerMsg = message.toLowerCase();
  const facts = [];

  // --- 🩺 Health conditions ---
  const conditionMap = {
    diabetes: "diabetes",
    "high blood pressure": "hypertension",
    hypertension: "hypertension",
    asthma: "asthma",
    migraine: "migraine",
    "high cholesterol": "cholesterol",
    cholesterol: "cholesterol",
    arthritis: "arthritis",
  };

  for (const [phrase, key] of Object.entries(conditionMap)) {
    if (lowerMsg.includes(phrase)) {
      facts.push({
        type: "health_condition",
        key,
        value: true,
        confidence: 0.9,
        source: { kind: "chat", chatId },
      });
    }
  }

  // --- 🤕 Injuries ---
  const injuryPatterns = [
    "injury",
    "pain",
    "fracture",
    "sprain",
    "strain",
    "torn ligament",
  ];

  for (const word of injuryPatterns) {
    if (lowerMsg.includes(word)) {
      // Extract nearby body part if mentioned
      const match = lowerMsg.match(
        /(?:back|knee|shoulder|arm|leg|ankle|neck|hip|wrist|hand|foot|elbow)/
      );
      const bodyPart = match ? match[0].replace(/\s+/g, "_") : "unspecified";
      facts.push({
        type: "health_condition",
        key: `injury.${bodyPart}`,
        value: true,
        confidence: 0.85,
        source: { kind: "chat", chatId },
      });      
    }
  }

  // --- 😌 Mood / mental state ---
  const moods = {
    happy: "happy",
    sad: "sad",
    anxious: "anxious",
    stressed: "stressed",
    depressed: "depressed",
    tired: "tired",
    energetic: "energetic",
    calm: "calm",
  };

  for (const [phrase, moodValue] of Object.entries(moods)) {
    if (lowerMsg.includes(phrase)) {
      facts.push({
        type: "mood",
        key: "mood",
        value: moodValue,
        confidence: 0.85,
        source: { kind: "chat", chatId },
      });
    }
  }

  // Save and return any found facts
  const saved = [];
  for (const fact of facts) {
    await upsertMemory(uid, fact);
    saved.push(fact);
  }

  return saved;
}


/**
 * Generate reply with fallback model
 */
async function generateWithFallback(prompt) {
  try {
    const primary = getModel();
    const result = await primary.generateContent(prompt);
    return result.response?.text();
  } catch (err) {
    console.error("[AI] Primary model failed:", err.message);
    try {
      const backup = getBackupModel();
      const result = await backup.generateContent(prompt);
      return result.response?.text();
    } catch (backupErr) {
      console.error("[AI] Backup model failed:", backupErr.message);
      throw new Error("All AI providers failed");
    }
  }
}

/**
 * POST /api/chat
 */
router.post("/chat", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { message, chatId } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    // 1) Resolve chat container
    const chatsCol = db().collection("users").doc(uid).collection("chats");
    let chatRef;
    if (chatId) {
      chatRef = chatsCol.doc(chatId);
    } else {
      chatRef = await chatsCol.add({
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        turnCount: 0,
        title: "New Chat",
      });
    }

    // 2) Fallback fact extraction FIRST
    const fallbackFacts = await extractFactsFromUserMessage(uid, message, chatRef.id);
    if (fallbackFacts.length > 0) {
      console.log(`[Memory] ${fallbackFacts.length} new facts found → updating AIProfile`);
      await mergeFactsIntoProfile(uid, fallbackFacts);
    }

    // 3) Load fresh AIProfile (after merge)
    const aiProfileDoc = await db()
      .collection("users")
      .doc(uid)
      .collection("aiProfile")
      .doc("prefs")
      .get();
    const aiProfile = aiProfileDoc.exists ? aiProfileDoc.data() : {};

    // 4) Load recent messages and summary
    const msgsSnap = await chatRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    const recent = msgsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();

    const sumDoc = await chatRef.collection("meta").doc("summary").get();
    const summary = sumDoc.exists ? sumDoc.data().text : "";

    // 5) Build AI context summary (more readable than raw JSON)
    const healthSummary = await getHealthSummaryForAI(uid);

    // 6) Build system preamble
    const systemPreamble = `
You are LiveWell's assistant. Be concise, supportive, and actionable.

🔹 CRITICAL - Memory extraction instructions:
(… your full extraction guidelines …)

🔹 CRITICAL - User Health Information:
When replying, you MUST ALWAYS acknowledge and respect the user's known health information:
- **Allergies**: If the user has ANY allergies listed in their profile (nuts, dairy, shellfish, gluten, or others), NEVER suggest foods containing those allergens. Always actively avoid recommending foods they're allergic to.
- **Dietary Preferences**: If the user has dietary preferences (vegan, halal, vegetarian, keto, or others), ALWAYS respect these preferences in your meal recommendations. Tailor all food suggestions to match their dietary requirements.
- **Medical Conditions**: If the user is diabetic or has other medical conditions, provide appropriate advice that considers their condition.

When asked about their allergies or dietary preferences, you should clearly state what's in their profile.
When recommending meals or foods, explicitly acknowledge their preferences/allergies and ensure recommendations align with them.

Example: If user is allergic to nuts and asks for meal recommendations, say something like:
"Since you're allergic to nuts, I'll make sure to recommend nut-free meals. Here are some great options..."

🔹 GOAL CREATION FEATURE:
When the user expresses intent to set a goal (e.g., "I want to walk 10,000 steps", "Set a goal to run", "Remind me to take flu vaccine"), you should:
1. Identify the goal type: physical (steps/running), vaccination, diet, social, or quiz
2. Extract the specific details (amount, days, date, etc.)
3. Respond with a confirmation request wrapped in special tags

Use this format ONLY when user wants to create a goal:
<goal_creation>
{
  "goalType": "physical|vaccination|diet|social|Quiz",
  "details": {
    // For physical: {"type": "Steps|Running", "amount": number, "days": number}
    // For vaccination: {"name": "vaccine name", "date": "YYYY-MM-DD"}
    // For diet: {"name": "diet goal name", "frequency": number, "days": number}
    // For social: {"name": "social activity", "frequency": number}
    // For Quiz: {"amount": number}
  },
  "confirmationMessage": "Natural language confirmation message to user"
}
</goal_creation>

Examples:
- User: "I want to walk 10000 steps for 7 days"
  Response: <goal_creation>{"goalType":"physical","details":{"type":"Steps","amount":10000,"days":7},"confirmationMessage":"I'll help you set a goal to walk 10,000 steps daily for 7 days. This is a great way to stay active! Would you like me to create this goal?"}</goal_creation>

- User: "Remind me to take flu vaccine in 30 days"
  Response: <goal_creation>{"goalType":"vaccination","details":{"name":"Flu Vaccine","date":"2025-11-14"},"confirmationMessage":"I'll set a reminder for you to get the Flu Vaccine by November 14, 2025. Staying up to date with vaccinations is important for your health. Shall I create this reminder?"}</goal_creation>

Current user profile summary:
${healthSummary}

Chat summary:
${summary || "No previous context"}
`;

    // 7) Build prompt
    const historyAsText = recent.map((m) => `${m.role}: ${m.text}`).join("\n");
    const fullPrompt = `${systemPreamble}\n\nRecent messages:\n${historyAsText}\n\nuser: ${message}\n\nassistant:`;

    // Log for debugging
    console.log("[Prompt Context]", {
      user: uid,
      knownHealth: aiProfile.health || {},
      allergies: aiProfile.allergies?.map((a) => a.allergen) || [],
      diet: aiProfile.diet?.map((d) => d.type) || [],
      mood: aiProfile.mood?.current || null,
    });

    // 8) Generate AI reply
    const reply = await generateWithFallback(fullPrompt);
    const now = new Date().toISOString();

    // 9) Persist conversation
    const batch = db().batch();
    const msgsCol = chatRef.collection("messages");
    const uMsgRef = msgsCol.doc();
    const aMsgRef = msgsCol.doc();

    batch.set(uMsgRef, { role: "user", text: message, createdAt: now });
    batch.set(aMsgRef, { role: "assistant", text: reply, createdAt: now });
    batch.set(chatRef, { updatedAt: now, turnCount: recent.length / 2 + 1 }, { merge: true });

    await batch.commit();

    // 10) Extract and merge assistant-generated memories
    await extractMemoriesFromReply(uid, reply, chatRef.id);
    await rebuildAiProfile(uid); // ensure profile reflects new memories

    // 11) Check for goal creation request
    let goalCreation = null;
    const goalMatch = reply.match(/<goal_creation>([\s\S]*?)<\/goal_creation>/);
    if (goalMatch) {
      try {
        goalCreation = JSON.parse(goalMatch[1]);
      } catch (err) {
        console.error("Failed to parse goal creation:", err);
      }
    }

    // Clean reply (remove tags)
    let cleanReply = reply
      .replace(/<memories>[\s\S]*?<\/memories>/g, "")
      .replace(/<goal_creation>[\s\S]*?<\/goal_creation>/g, "")
      .trim();

    res.status(200).json({
      chatId: chatRef.id,
      reply: cleanReply,
      at: now,
      factsExtracted: fallbackFacts.length > 0 || reply.includes("<memories>"),
      goalCreation: goalCreation, // Include goal creation data if present
    });
  } catch (err) {
    console.error("Chat handler failed:", err);
    next(err);
  }
});

// GET /api/chat/:chatId - (unchanged)
router.get("/chat/:chatId", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;

    const chatRef = db()
      .collection("users")
      .doc(uid)
      .collection("chats")
      .doc(chatId);

    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const msgsSnap = await chatRef
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();
    const messages = msgsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const summaryDoc = await chatRef.collection("meta").doc("summary").get();
    const summary = summaryDoc.exists ? summaryDoc.data() : null;

    res.json({
      chatId,
      metadata: chatDoc.data(),
      summary,
      messages,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/chats - (unchanged)
router.get("/chats", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { limit = 50 } = req.query;

    const chatsCol = db().collection("users").doc(uid).collection("chats");
    const chatsSnap = await chatsCol
      .orderBy("updatedAt", "desc")
      .limit(parseInt(limit))
      .get();

    const chats = chatsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ chats });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/chat/:chatId - (unchanged)
router.delete("/chat/:chatId", requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { chatId } = req.params;

    const chatRef = db()
      .collection("users")
      .doc(uid)
      .collection("chats")
      .doc(chatId);

    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat not found" });
    }

    await chatRef.delete();
    res.json({ message: "Chat deleted successfully" });
  } catch (e) {
    next(e);
  }
});

// POST /api/summarize - Generate summary without creating a chat
router.post('/summarize', requireAuth(), async (req, res, next) => {
  try {
    const { messages, category, prompt } = req.body || {};
    
    if (!messages || !Array.isArray(messages) || !category) {
      return res.status(400).json({ error: 'messages array and category are required' });
    }

    // Use Gemini to generate summary without creating a chat
    const model = getModel();
    const result = await model.generateContent(prompt);
    const summary = result.response?.text() || 'Unable to generate summary at this time.';

    res.json({ summary });
  } catch (e) {
    next(e);
  }
});

// POST /api/chat/create-goal - Confirm and create a goal
router.post('/chat/create-goal', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { goalType, details, chatId } = req.body || {};
    
    if (!goalType || !details) {
      return res.status(400).json({ error: 'goalType and details are required' });
    }

    // Map goal data to match the expected schema
    let goalData = {};
    
    switch (goalType) {
      case 'physical':
        goalData = {
          type: details.type || 'Steps',
          days: details.days || 0,
          frequency: details.amount || 0,
          progress: 0,
          status: true  // true = ongoing/active, false = completed
        };
        break;
      
      case 'vaccination':
        goalData = {
          name: details.name || 'Vaccination',
          date: details.date || new Date().toISOString().split('T')[0],
          progress: 0,
          status: true  // true = ongoing/active, false = completed
        };
        break;
      
      case 'diet':
        goalData = {
          name: details.name || 'Diet Goal',
          frequency: details.frequency || 0,
          days: details.days || 0,
          progress: 0,
          status: true  // true = ongoing/active, false = completed
        };
        break;
      
      case 'social':
        goalData = {
          name: details.name || 'Social Activity',
          frequency: details.frequency || 0,
          progress: 0,
          status: true  // true = ongoing/active, false = completed
        };
        break;
      
      case 'Quiz':
        goalData = {
          amount: details.amount || 0,
          progress: 0,
          status: true  // true = ongoing/active, false = completed
        };
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid goal type' });
    }

    // Create goal in database
    const goalRef = db()
      .collection("users")
      .doc(uid)
      .collection("goals")
      .doc(goalType)
      .collection("items")
      .doc();
    
    const goalWithMetadata = {
      ...goalData,
      createdAt: new Date().toISOString(),
      createdViaChat: true,
      chatId: chatId || null
    };
    
    await goalRef.set(goalWithMetadata);

    // Send confirmation message back to chat
    const confirmationMessage = `Great! I've created your goal successfully. You can track your progress in the Goals section. Keep up the great work! 🎯`;

    res.json({
      success: true,
      goalId: goalRef.id,
      goalType,
      confirmationMessage,
      goal: goalWithMetadata
    });
  } catch (err) {
    console.error("Create goal failed:", err);
    next(err);
  }
});

export default router;

/**
 * @swagger
 * tags:
 *   - name: Chat
 *     description: Chatbot conversation APIs
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /api/chat:
 *   post:
 *     summary: Send a message to the LiveWell assistant
 *     description: |
 *       Sends a user message to the LiveWell chatbot.  
 *       If `chatId` is not provided, a new chat session is created.  
 *       The assistant reply is generated via Gemini and stored along with the conversation.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Can you suggest a light exercise routine?"
 *               chatId:
 *                 type: string
 *                 description: Optional. Existing chatId to continue conversation.
 *     responses:
 *       200:
 *         description: Assistant reply generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chatId:
 *                   type: string
 *                   example: "abc123"
 *                 reply:
 *                   type: string
 *                   example: "Sure! A 10-minute walk after meals is a great start."
 *                 at:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-09-03T14:22:00Z"
 *       400:
 *         description: Invalid input (missing message)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error
 *
 * /api/chat/{chatId}:
 *   get:
 *     summary: Fetch a full chat conversation
 *     description: Retrieves all messages, metadata, and summary for a given chat session.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat session
 *     responses:
 *       200:
 *         description: Chat conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chatId:
 *                   type: string
 *                   example: "abc123"
 *                 metadata:
 *                   type: object
 *                   example:
 *                     createdAt: "2025-09-03T12:00:00Z"
 *                     updatedAt: "2025-09-03T14:22:00Z"
 *                     turnCount: 5
 *                 summary:
 *                   type: object
 *                   nullable: true
 *                   example:
 *                     text: "- Discussed exercise routines\n- User asked about diet"
 *                     updatedAt: "2025-09-03T14:20:00Z"
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "msg1"
 *                       role:
 *                         type: string
 *                         enum: [user, assistant]
 *                         example: "user"
 *                       text:
 *                         type: string
 *                         example: "What should I eat for breakfast?"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-03T14:10:00Z"
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 *
 * /api/chats:
 *   get:
 *     summary: Fetch all user chat conversations
 *     description: Retrieves a list of all chat conversations for the authenticated user, ordered by most recent first.
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of chats to return
 *     responses:
 *       200:
 *         description: Chat list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "abc123"
 *                       title:
 *                         type: string
 *                         example: "Exercise Routine"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-03T12:00:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-09-03T14:22:00Z"
 *                       turnCount:
 *                         type: integer
 *                         example: 5
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Server error
 */
