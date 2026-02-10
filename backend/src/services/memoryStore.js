// src/services/memoryStore.js
import { getFirestore } from "../services/firebase.js";
import { normalizeMemory, MemoryItemSchema, AiProfileSchema } from "../schemas/memory.js";

const db = getFirestore();

/**
 * Save or update a memory item for a user.
 * - If the same key already exists → mark old one inactive and insert new one.
 * - Always regenerate aiProfile after update.
 */
export async function upsertMemory(uid, rawMemory) {
  const memory = normalizeMemory(rawMemory);

  const colRef = db.collection("users").doc(uid).collection("memories");

  // Look for existing active memory with same key
  const existingSnap = await colRef
    .where("key", "==", memory.key)
    .where("active", "==", true)
    .get();

  const batch = db.batch();

  // Mark old ones inactive
  existingSnap.forEach((doc) => {
    batch.update(doc.ref, { active: false, updatedAt: new Date().toISOString() });
  });

  // Add new one
  const newRef = colRef.doc();
  batch.set(newRef, memory);
  await batch.commit();
  
  // 🔄 Rebuild aiProfile
  return memory;
}

export async function mergeFactsIntoProfile(uid, facts) {
  for (const fact of facts) {
    await upsertMemory(uid, fact);
  }
  await rebuildAiProfile(uid);
  // rebuildAiProfile will be called inside upsertMemory automatically
}

/**
 * Fetch all active memories for a user.
 */
export async function getActiveMemories(uid) {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("memories")
    .where("active", "==", true)
    .orderBy("updatedAt", "desc") // Most recent first
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Get recent mood changes (for mood tracking)
 */
export async function getRecentMoods(uid, limit = 5) {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("memories")
    .where("type", "==", "mood")
    .where("active", "==", true)
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Rebuilds the aiProfile doc from active memories with enhanced categorization.
 */
export async function rebuildAiProfile(uid) {
  const memories = await getActiveMemories(uid);
  const profile = {
    updatedAt: new Date().toISOString(),
  };

  // Initialize containers
  let health = {};
  let allergies = [];
  let diet = [];
  let preferences = {};
  let conditions = [];
  let medications = [];
  let mood = null;
  let recentSymptoms = [];

  for (const mem of memories) {
    switch (mem.key) {
      // Diabetes handling
      case "diabetes.type":
        health.diabetesType = mem.value;
        health.diabetes = true;
        break;
      
      // Hypertension
      case "hypertension":
        health.hypertension = !!mem.value;
        break;
      
      // BMI
      case "BMI":
        health.bmi = mem.value;
        break;

      default:
        // Handle different memory types
        switch (mem.type) {
          case "condition":
            conditions.push({
              condition: mem.key,
              active: true,
              severity: mem.severity || 'unknown',
              updatedAt: mem.updatedAt
            });
            break;
          
          case "allergy":
            const allergen = mem.key.replace("allergy.", "");
            allergies.push({
              allergen,
              severity: mem.severity || 'moderate',
              confirmed: mem.confidence > 0.8
            });
            break;
          
          case "diet":
            const dietType = mem.key.replace("diet.", "");
            diet.push({
              type: dietType,
              since: mem.createdAt,
              strict: mem.confidence > 0.9
            });
            break;
          
          case "medication":
            const medName = mem.key.replace("medication.", "");
            medications.push({
              name: medName,
              active: !!mem.value,
              dosage: mem.dosage || 'unknown',
              frequency: mem.frequency || 'unknown',
              updatedAt: mem.updatedAt
            });
            break;
          
          case "preference":
            // Handle nested preference keys
            if (mem.key.includes('.')) {
              const [category, subkey] = mem.key.split('.');
              if (!preferences[category]) preferences[category] = {};
              preferences[category][subkey] = mem.value;
            } else {
              preferences[mem.key] = mem.value;
            }
            break;
          
          case "mood":
            // Keep most recent mood
            if (!mood || new Date(mem.updatedAt) > new Date(mood.updatedAt)) {
              mood = {
                current: mem.value,
                confidence: mem.confidence,
                updatedAt: mem.updatedAt,
                source: mem.source?.kind || 'unknown'
              };
            }
            break;
          
          case "symptom":
            // Track recent symptoms (last 30 days)
            const symptomDate = new Date(mem.updatedAt);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            if (symptomDate > thirtyDaysAgo) {
              recentSymptoms.push({
                symptom: mem.key,
                severity: mem.value,
                date: mem.updatedAt,
                confidence: mem.confidence
              });
            }
            break;
          
            case "health_condition": {
              // Frailty metrics
              if (mem.key.startsWith("frailty.")) {
                if (!health.frailty) health.frailty = {};
                const frailtyKey = mem.key.replace("frailty.", "");
                health.frailty[frailtyKey] = mem.value;
              }
              // Injuries
              else if (mem.key.startsWith("injury.") || mem.key.endsWith("_injury")) {
                const part = mem.key.replace(/^injury\.|_injury$/g, "");
                if (!health.injuries) health.injuries = [];
                if (!health.injuries.includes(part)) health.injuries.push(part);
              }
              // Other generic conditions
              else {
                health[mem.key] = mem.value === undefined ? true : mem.value;
              }
              break;
            }            
        }
    }
  }

  // Only add to profile if they have content
  if (Object.keys(health).length > 0) {
    profile.health = health;
  }
  
  if (conditions.length > 0) {
    profile.conditions = conditions;
  }
  
  if (allergies.length > 0) {
    profile.allergies = allergies;
  }
  
  if (diet.length > 0) {
    profile.diet = diet;
  }
  
  if (medications.length > 0) {
    profile.medications = medications;
  }
  
  if (Object.keys(preferences).length > 0) {
    profile.preferences = preferences;
  }
  
  if (mood) {
    profile.mood = mood;
  }
  
  if (recentSymptoms.length > 0) {
    profile.recentSymptoms = recentSymptoms.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  }

  // Add summary stats
  profile.summary = {
    totalConditions: conditions.length,
    totalAllergies: allergies.length,
    totalMedications: medications.filter(m => m.active).length,
    lastUpdated: new Date().toISOString(),
    profileCompleteness: calculateProfileCompleteness(profile)
  };

  // Validate before saving
  const safeProfile = AiProfileSchema.parse(profile);
  
  await db
    .collection("users")
    .doc(uid)
    .collection("aiProfile")
    .doc("prefs")
    .set(safeProfile, { merge: true });
    
  return safeProfile;
}

/**
 * Calculate how complete a user's profile is (0-1 scale)
 */
function calculateProfileCompleteness(profile) {
  let score = 0;
  let maxScore = 10;

  // Health info
  if (profile.health && Object.keys(profile.health).length > 0) score += 2;
  
  // Conditions
  if (profile.conditions && profile.conditions.length > 0) score += 1;
  
  // Allergies
  if (profile.allergies && profile.allergies.length > 0) score += 1;
  
  // Diet preferences  
  if (profile.diet && profile.diet.length > 0) score += 1;
  
  // Medications
  if (profile.medications && profile.medications.length > 0) score += 1;
  
  // Preferences (hydration, exercise, etc.)
  if (profile.preferences && Object.keys(profile.preferences).length > 0) score += 2;
  
  // Recent mood
  if (profile.mood) score += 1;
  
  // Recent symptoms/activity
  if (profile.recentSymptoms && profile.recentSymptoms.length > 0) score += 1;

  return Math.round((score / maxScore) * 100) / 100;
}

/**
 * Map health info into memory items and persist (enhanced version).
 */
export async function saveHealthToMemories(uid, health) {
  const items = [];

  // Allergies → memory items
  if (health.allergies) {
    for (const [key, val] of Object.entries(health.allergies)) {
      if (val) {
        items.push({
          type: "allergy",
          key: `allergy.${key}`,
          value: true,
          confidence: 0.9,
        });
      }
    }
  }

  // Dietary preferences → memory items
  if (health.dietaryPreferences) {
    for (const [key, val] of Object.entries(health.dietaryPreferences)) {
      if (val) {
        items.push({
          type: "diet",
          key: `diet.${key}`,
          value: true,
          confidence: 0.9,
        });
      }
    }
  }

  // Hydration target
  if (health.hydrationTarget != null) {
    items.push({
      type: "preference",
      key: "hydrationTarget",
      value: health.hydrationTarget,
      confidence: 0.9,
    });
  }

  // BMI calculation
  if (health.height && health.weight) {
    let heightCm = Number(health.height);

    if (health.heightUnit === "ft") {
      const feet = Number(health.height);
      const inches = Number(health.heightInches || 0);
      const totalInches = feet * 12 + inches;
      heightCm = totalInches * 2.54; // convert to cm
    }

    const w = Number(health.weight);
    if (heightCm > 0) {
      const bmi = +(w / ((heightCm / 100) ** 2)).toFixed(1);
      if (Number.isFinite(bmi)) {
        items.push({
          type: "health_condition",
          key: "BMI",
          value: bmi,
          confidence: 0.9,
        });
      }
    }
  }

  // Age (if provided)
  if (health.age) {
    items.push({
      type: "preference",
      key: "age",
      value: Number(health.age),
      confidence: 0.95,
    });
  }

  // Activity level
  if (health.activityLevel) {
    items.push({
      type: "preference",
      key: "activityLevel",
      value: health.activityLevel,
      confidence: 0.9,
    });
  }

  // Sleep target
  if (health.sleepTarget) {
    items.push({
      type: "preference",
      key: "sleepTarget",
      value: Number(health.sleepTarget),
      confidence: 0.9,
    });
  }

  // Save each memory
  for (const item of items) {
    await upsertMemory(uid, item);
  }
}

/**
 * Map frailty info into memory items and persist.
 */
export async function saveFrailtyToMemories(uid, frailty) {
  const items = [];

  if (frailty.steps !== undefined) {
    items.push({
      type: "preference",
      key: "frailty.steps",
      value: frailty.steps,
      confidence: 0.9,
    });
  }

  if (frailty.frailtyScore !== undefined) {
    items.push({
      type: "health_condition",
      key: "frailty.score",
      value: frailty.frailtyScore,
      confidence: 0.9,
    });
  }

  if (frailty.moderateMinutes !== undefined) {
    items.push({
      type: "preference",
      key: "frailty.moderateMinutes",
      value: frailty.moderateMinutes,
      confidence: 0.9,
    });
  }

  if (frailty.vigorousMinutes !== undefined) {
    items.push({
      type: "preference",
      key: "frailty.vigorousMinutes",
      value: frailty.vigorousMinutes,
      confidence: 0.9,
    });
  }

  if (frailty.sedentaryHours !== undefined) {
    items.push({
      type: "preference",
      key: "frailty.sedentaryHours",
      value: frailty.sedentaryHours,
      confidence: 0.9,
    });
  }

  if (frailty.strengthDays !== undefined) {
    items.push({
      type: "preference",
      key: "frailty.strengthDays",
      value: frailty.strengthDays,
      confidence: 0.9,
    });
  }

  for (const item of items) {
    await upsertMemory(uid, item);
  }
}

/**
 * Save medication information
 */
export async function saveMedicationToMemories(uid, medications) {
  const items = [];

  for (const med of medications) {
    items.push({
      type: "medication",
      key: `medication.${med.name.toLowerCase().replace(/\s+/g, '_')}`,
      value: true,
      dosage: med.dosage,
      frequency: med.frequency,
      confidence: 0.9,
    });
  }

  for (const item of items) {
    await upsertMemory(uid, item);
  }
}

/**
 * Save symptom tracking
 */
export async function saveSymptomToMemories(uid, symptom, severity, notes = '') {
  const item = {
    type: "symptom",
    key: symptom.toLowerCase().replace(/\s+/g, '_'),
    value: severity, // e.g., "mild", "moderate", "severe"
    notes,
    confidence: 0.8,
  };

  await upsertMemory(uid, item);
}

/**
 * Get user's health summary for AI context
 * Enhanced to pull from both user's base healthInfo AND AI profile
 */
export async function getHealthSummaryForAI(uid) {
  // Get user's base profile (from onboarding)
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const healthInfo = userData.healthInfo || {};
  
  // Get AI profile (from memories)
  const profileDoc = await db
    .collection("users")
    .doc(uid)
    .collection("aiProfile")
    .doc("prefs")
    .get();
  const aiProfile = profileDoc.exists ? profileDoc.data() : {};

  let summary = "User's Health Profile:\n";
  
  // ALLERGIES - Pull from healthInfo first (onboarding data)
  const allergies = [];
  if (healthInfo.allergies) {
    if (healthInfo.allergies.nuts) allergies.push('nuts');
    if (healthInfo.allergies.dairy) allergies.push('dairy');
    if (healthInfo.allergies.shellfish) allergies.push('shellfish');
    if (healthInfo.allergies.gluten) allergies.push('gluten');
    if (healthInfo.allergies.other) allergies.push(healthInfo.allergies.other);
  }
  // Also check AI profile for any additional allergies from conversations
  if (aiProfile.allergies && aiProfile.allergies.length > 0) {
    aiProfile.allergies.forEach(a => {
      if (!allergies.includes(a.allergen)) {
        allergies.push(a.allergen);
      }
    });
  }
  if (allergies.length > 0) {
    summary += "• Allergies: " + allergies.join(', ') + '\n';
  }
  
  // DIETARY PREFERENCES - Pull from healthInfo first (onboarding data)
  const dietPrefs = [];
  if (healthInfo.dietaryPreferences) {
    if (healthInfo.dietaryPreferences.vegan) dietPrefs.push('vegan');
    if (healthInfo.dietaryPreferences.halal) dietPrefs.push('halal');
    if (healthInfo.dietaryPreferences.vegetarian) dietPrefs.push('vegetarian');
    if (healthInfo.dietaryPreferences.keto) dietPrefs.push('keto');
    if (healthInfo.dietaryPreferences.other) dietPrefs.push(healthInfo.dietaryPreferences.other);
  }
  // Also check AI profile for any additional dietary preferences from conversations
  if (aiProfile.diet && aiProfile.diet.length > 0) {
    aiProfile.diet.forEach(d => {
      if (!dietPrefs.includes(d.type)) {
        dietPrefs.push(d.type);
      }
    });
  }
  if (dietPrefs.length > 0) {
    summary += "• Dietary Preferences: " + dietPrefs.join(', ') + '\n';
  }
  
  // DIABETIC STATUS - from healthInfo
  if (healthInfo.diabetic) {
    summary += "• Medical Condition: Diabetic\n";
  }
  
  // OTHER MEDICAL CONDITIONS - from healthInfo
  if (healthInfo.medicalConditions && healthInfo.medicalConditions.trim()) {
    summary += "• Other Medical Conditions: " + healthInfo.medicalConditions + '\n';
  }

  // Health conditions from AI profile
  if (aiProfile.health) {
    summary += "• Health Metrics: ";
    const conditions = [];
    if (aiProfile.health.diabetes) conditions.push(`Diabetes (${aiProfile.health.diabetesType || 'type unknown'})`);
    if (aiProfile.health.hypertension) conditions.push('Hypertension');
    if (aiProfile.health.bmi) conditions.push(`BMI: ${aiProfile.health.bmi}`);
    if (aiProfile.health.frailty) conditions.push(`Frailty Score: ${aiProfile.health.frailty.score || 'assessed'}`);
    if (conditions.length > 0) {
      summary += conditions.join(', ') + '\n';
    } else {
      summary += 'None tracked\n';
    }
  }

  // Other conditions from AI profile
  if (aiProfile.conditions && aiProfile.conditions.length > 0) {
    summary += "• Additional Conditions: " + aiProfile.conditions.map(c => c.condition.replace(/_/g, ' ')).join(', ') + '\n';
  }

  // Current medications from AI profile
  if (aiProfile.medications && aiProfile.medications.length > 0) {
    const activeMeds = aiProfile.medications.filter(m => m.active);
    if (activeMeds.length > 0) {
      summary += "• Current Medications: " + activeMeds.map(m => m.name).join(', ') + '\n';
    }
  }

  // Current mood from AI profile
  if (aiProfile.mood) {
    summary += `• Current Mood: ${aiProfile.mood.current} (updated ${new Date(aiProfile.mood.updatedAt).toLocaleDateString()})\n`;
  }

  // Preferences from healthInfo and AI profile
  const prefs = [];
  if (healthInfo.hydrationTarget) prefs.push(`Hydration goal: ${healthInfo.hydrationTarget} cups/day`);
  if (aiProfile.preferences) {
    if (aiProfile.preferences.sleepTarget) prefs.push(`Sleep goal: ${aiProfile.preferences.sleepTarget} hours/night`);
    if (aiProfile.preferences.activityLevel) prefs.push(`Activity level: ${aiProfile.preferences.activityLevel}`);
  }
  if (prefs.length > 0) {
    summary += "• Wellness Preferences: " + prefs.join(', ') + '\n';
  }

  // Recent symptoms from AI profile
  if (aiProfile.recentSymptoms && aiProfile.recentSymptoms.length > 0) {
    const symptoms = aiProfile.recentSymptoms.slice(0, 3); // Show only recent 3
    summary += "• Recent Symptoms: " + symptoms.map(s => `${s.symptom} (${s.severity})`).join(', ') + '\n';
  }

  // Profile completeness from AI profile
  if (aiProfile.summary) {
    summary += `• Profile Completeness: ${Math.round(aiProfile.summary.profileCompleteness * 100)}%\n`;
  }

  return summary;
}

// src/services/memoryStore.js

/**
 * Soft delete a memory item by key or ID.
 */
export async function deleteMemory(uid, { key, id }) {
  const colRef = db.collection("users").doc(uid).collection("memories");

  let targetQuery;

  if (id) {
    targetQuery = colRef.doc(id);
  } else if (key) {
    const snap = await colRef.where("key", "==", key).where("active", "==", true).get();
    if (snap.empty) return { deleted: 0 };
    const batch = db.batch();
    snap.forEach(doc => {
      batch.update(doc.ref, { active: false, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
    await rebuildAiProfile(uid);
    return { deleted: snap.size };
  } else {
    throw new Error("Must provide either memory key or id to delete");
  }

  const doc = await targetQuery.get();
  if (!doc.exists) return { deleted: 0 };

  await doc.ref.update({
    active: false,
    updatedAt: new Date().toISOString(),
  });

  await rebuildAiProfile(uid);

  return { deleted: 1 };
}
