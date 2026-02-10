import { Router } from "express";
import { getFirestore } from "../services/firebase.js";
import { z } from "zod";
import { checkGoalAchievements } from "../services/achievements.js";

const router = Router();
const db = getFirestore();

const GoalSchema = z.object({
  category: z.enum(["activity", "vaccination", "diet", "meds", "interaction"]),
  target: z.string().min(1),
  progress: z.number().min(0).default(0),
  status: z.enum(["active", "completed"]).default("active"),
});

// New schemas for specific goal types
const QuizGoalSchema = z.object({
  amount: z.number().min(1),
  progress: z.number().min(0).default(0),
  status: z.boolean().default(true)
});

const DietGoalSchema = z.object({
  name: z.string().min(1),
  frequency: z.number().min(0).default(0),
  days: z.number().min(0).default(0),
  progress: z.number().min(0).default(0),
  status: z.boolean().default(true)
});

const PhysicalGoalSchema = z.object({
  type: z.string().min(1),
  days: z.number().min(0).default(0),
  frequency: z.number().min(0).default(0),
  progress: z.number().min(0).default(0),
  status: z.boolean().default(false)
});

const SocialGoalSchema = z.object({
  name: z.string().min(1),
  frequency: z.number().min(0).default(0),
  progress: z.number().min(0).default(0),
  status: z.boolean().default(true)
});

const VaccinationGoalSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  progress: z.number().min(0).default(0),
  status: z.boolean().default(false)
});



// Update goal (progress or status)
router.patch("/goals/:id", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    const updateData = req.body;

    const goalRef = db.collection("users").doc(uid).collection("goals").doc(id);
    const doc = await goalRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Goal not found" });

    const goal = doc.data();

    // Increment streak if progress meets/exceeds target
    let streak = goal.streak;
    let status = goal.status;

    // Extract number from target string for comparison
    const targetMatch = goal.target.match(/(\d+)/);
    const targetNumber = targetMatch ? parseFloat(targetMatch[1]) : 0;

    if (updateData.progress >= targetNumber) {
      streak = (goal.streak || 0) + 1;
      status = "completed";
    }

    const updatedGoal = {
      ...goal,
      ...updateData,
      streak,
      status,
      updatedAt: new Date().toISOString(),
    };

    await goalRef.set(updatedGoal);
    res.json({ success: true, goal: updatedGoal });
  } catch (err) {
    next(err);
  }
});

// List goals
router.get("/goals", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    
    // Fetch all goals from all goal type subcollections
    const goalTypes = ['Quiz', 'diet', 'physical', 'social', 'vaccination'];
    const allGoals = [];
    
    for (const goalType of goalTypes) {
      try {
        const goalsSnapshot = await db
          .collection("users")
          .doc(uid)
          .collection("goals")
          .doc(goalType)
          .collection("items")
          .get();
        
        goalsSnapshot.forEach(doc => {
          allGoals.push({
            id: doc.id,
            goalType,
            ...doc.data()
          });
        });
      } catch (error) {
        console.log(`No goals found for type: ${goalType}`);
        // Continue with other goal types even if one fails
      }
    }
    
    res.json({ success: true, data: allGoals });
  } catch (err) {
    next(err);
  }
});

// Delete goal
router.delete("/goals/:id", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const goalRef = db.collection("users").doc(uid).collection("goals").doc(id);
    const doc = await goalRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Goal not found" });

    await goalRef.delete();
    res.json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;

/**
 * @swagger
 * tags:
 *   - name: Goals
 *     description: APIs for creating, updating, and listing user goals (AVOID Framework)
 *
 * components:
 *   schemas:
 *     Goal:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           enum: [activity, vaccination, diet, meds, interaction]
 *           example: activity
 *         target:
 *           type: string
 *           example: "5000 steps"
 *         progress:
 *           type: number
 *           example: 2500
 *         status:
 *           type: string
 *           enum: [active, completed]
 *           example: active
 *         streak:
 *           type: number
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-03T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-09-03T12:30:00Z"
 *
 * /api/goals:
 *   post:
 *     summary: Create a new goal
 *     description: Add a new goal for the logged-in user.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Goal'
 *     responses:
 *       200:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 goal:
 *                   $ref: '#/components/schemas/Goal'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: List all goals
 *     description: Retrieve all goals for the logged-in user.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 goals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Goal'
 *       401:
 *         description: Unauthorized
 *
 * /api/goals/{id}:
 *   patch:
 *     summary: Update a goal
 *     description: Update progress or status of an existing goal.
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the goal to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progress:
 *                 type: number
 *                 example: 4000
 *               status:
 *                 type: string
 *                 enum: [active, completed]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 goal:
 *                   $ref: '#/components/schemas/Goal'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Goal not found
 */

// New routes for specific goal types

// Get specific goal type
router.get("/goals/type/:goalType", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { goalType } = req.params;
    
    const goalRef = db.collection("users").doc(uid).collection("goals").doc(goalType);
    const doc = await goalRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }
    
    res.json({ success: true, data: doc.data() });
  } catch (err) {
    next(err);
  }
});

// Create new goal
router.post("/goals", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { goalType, ...goalData } = req.body;
    
    let validatedData;
    switch (goalType) {
      case 'Quiz':
        validatedData = QuizGoalSchema.parse(goalData);
        break;
      case 'diet':
        validatedData = DietGoalSchema.parse(goalData);
        break;
      case 'physical':
        validatedData = PhysicalGoalSchema.parse(goalData);
        break;
      case 'social':
        validatedData = SocialGoalSchema.parse(goalData);
        break;
      case 'vaccination':
        validatedData = VaccinationGoalSchema.parse(goalData);
        break;
      default:
        return res.status(400).json({ error: "Invalid goal type" });
    }
    
    // Add metadata
    const goalWithMetadata = {
      ...validatedData,
      createdAt: new Date().toISOString(),
      status: true // Default to active
    };
    
    // Create new goal in the specific goal type subcollection
    const goalRef = db.collection("users").doc(uid).collection("goals").doc(goalType).collection("items").doc();
    await goalRef.set(goalWithMetadata);
    
    res.json({ success: true, data: { id: goalRef.id, goalType, ...goalWithMetadata } });
  } catch (err) {
    next(err);
  }
});

// Update specific goal
router.patch("/goals/:goalType/:id", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { goalType, id } = req.params;
    const updateData = req.body;
    
    const goalRef = db
      .collection("users")
      .doc(uid)
      .collection("goals")
      .doc(goalType)
      .collection("items")
      .doc(id);
    
    const doc = await goalRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }
    
    const previousData = doc.data();
    const wasCompleted = previousData.status === false;
    const isNowCompleted = updateData.status === false;
    
    await goalRef.update(updateData);
    
    // Check for achievements if goal was just completed
    let newAchievements = [];
    if (!wasCompleted && isNowCompleted) {
      // Count all completed goals across all goal types
      const goalTypes = ['Quiz', 'diet', 'physical', 'social', 'vaccination'];
      let completedGoalsCount = 0;
      
      for (const type of goalTypes) {
        try {
          const goalsSnapshot = await db
            .collection("users")
            .doc(uid)
            .collection("goals")
            .doc(type)
            .collection("items")
            .where("status", "==", false)
            .get();
          
          completedGoalsCount += goalsSnapshot.size;
        } catch (error) {
          console.log(`Error counting goals for type ${type}:`, error);
        }
      }
      
      newAchievements = await checkGoalAchievements(uid, completedGoalsCount);
    }
    
    res.json({ 
      success: true, 
      data: { ...previousData, ...updateData },
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (err) {
    next(err);
  }
});

// Delete specific goal
router.delete("/goals/:goalType/:id", async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { goalType, id } = req.params;
    
    const goalRef = db
      .collection("users")
      .doc(uid)
      .collection("goals")
      .doc(goalType)
      .collection("items")
      .doc(id);
    
    const doc = await goalRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }
    
    await goalRef.delete();
    
    res.json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    next(err);
  }
});
