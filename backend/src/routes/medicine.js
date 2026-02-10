import { Router } from 'express';
import { z } from 'zod';
import { getFirestore } from '../services/firebase.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// Medicine schema validation
const MedicineSchema = z.object({
  id: z.string().optional(),
  period: z.enum(['Morning', 'Afternoon', 'Evening', 'Night']),
  description: z.string().min(1, 'Description is required'),
  timing: z.enum(['Before', 'After']),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

const MedicineScheduleSchema = z.object({
  uid: z.string().min(1),
  medicines: z.array(MedicineSchema).min(1, 'At least one medicine is required'),
});

// Helper function to get next medicine time
function getNextMedicineTime(medicines, takenToday = []) {
  if (!medicines || medicines.length === 0) return null;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  // Sort medicines by time
  const sortedMedicines = medicines
    .map(med => ({
      ...med,
      timeInMinutes: parseInt(med.time.split(':')[0]) * 60 + parseInt(med.time.split(':')[1])
    }))
    .sort((a, b) => a.timeInMinutes - b.timeInMinutes);
  
  // Find next medicine today that hasn't been taken yet
  for (const med of sortedMedicines) {
    // Skip if this medicine was already taken today
    if (takenToday.includes(med.id)) {
      continue;
    }
    
    if (med.timeInMinutes > currentTime) {
      const nextTime = new Date();
      nextTime.setHours(parseInt(med.time.split(':')[0]), parseInt(med.time.split(':')[1]), 0, 0);
      return {
        medicine: med,
        nextTime: nextTime.toISOString(),
        hoursUntil: Math.round((med.timeInMinutes - currentTime) / 60 * 10) / 10
      };
    }
  }
  
  // If no medicine today, return first medicine tomorrow
  const firstMed = sortedMedicines[0];
  const tomorrowTime = new Date();
  tomorrowTime.setDate(tomorrowTime.getDate() + 1);
  tomorrowTime.setHours(parseInt(firstMed.time.split(':')[0]), parseInt(firstMed.time.split(':')[1]), 0, 0);
  
  return {
    medicine: firstMed,
    nextTime: tomorrowTime.toISOString(),
    hoursUntil: Math.round((24 * 60 - currentTime + firstMed.timeInMinutes) / 60 * 10) / 10
  };
}

// POST /api/medicine/save-schedule - Save medicine schedule
router.post('/save-schedule', requireAuth(), async (req, res, next) => {
  try {
    if (!req.body) return res.status(400).json({ error: 'Missing request body' });

    const data = MedicineScheduleSchema.parse(req.body);
    const db = getFirestore();
    
    // Save medicine schedule to user document
    await db.collection('users').doc(data.uid).set({ 
      medicineSchedule: data.medicines,
      medicineScheduleUpdatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Medicine schedule saved successfully' });
  } catch (err) {
    if (err?.name === 'ZodError') {
      console.error('Zod validation failed:', err.issues);
      return res.status(400).json({ error: 'Validation failed', issues: err.issues });
    }
    console.error('Medicine schedule save error:', err);
    next(err);
  }
});

// GET /api/medicine/get-schedule - Get medicine schedule
router.get('/get-schedule', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = doc.data();
    const medicines = data.medicineSchedule || [];
    
    // Get today's taken medicines
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');
    
    const historySnapshot = await db.collection('users').doc(uid).collection('medicineHistory')
      .where('takenAt', '>=', todayStart)
      .where('takenAt', '<=', todayEnd)
      .get();
    
    const takenToday = [];
    historySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.medicineId) {
        takenToday.push(data.medicineId);
      }
    });
    
    // Get next medicine time (excluding taken ones)
    const nextMedicine = getNextMedicineTime(medicines, takenToday);
    
    res.json({ 
      medicines,
      nextMedicine,
      hasSchedule: medicines.length > 0,
      lastUpdated: data.medicineScheduleUpdatedAt,
      takenToday
    });
  } catch (err) {
    console.error('Error fetching medicine schedule:', err);
    next(err);
  }
});

// POST /api/medicine/mark-taken - Mark medicine as taken
router.post('/mark-taken', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const { medicineId, takenAt } = req.body;
    
    if (!medicineId) {
      return res.status(400).json({ error: 'Medicine ID is required' });
    }

    const db = getFirestore();
    const takenTime = takenAt || new Date().toISOString();
    
    // Add to medicine history
    await db.collection('users').doc(uid).collection('medicineHistory').add({
      medicineId,
      takenAt: takenTime,
      createdAt: new Date().toISOString()
    });

    // Get updated medicine schedule with next medicine
    const doc = await db.collection('users').doc(uid).get();
    const data = doc.data();
    const medicines = data.medicineSchedule || [];
    
    // Get today's taken medicines (including the one just marked)
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const todayEnd = new Date(today + 'T23:59:59.999Z');
    
    const historySnapshot = await db.collection('users').doc(uid).collection('medicineHistory')
      .where('takenAt', '>=', todayStart)
      .where('takenAt', '<=', todayEnd)
      .get();
    
    const takenToday = [];
    historySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.medicineId) {
        takenToday.push(data.medicineId);
      }
    });
    
    // Get next medicine time (excluding taken ones)
    const nextMedicine = getNextMedicineTime(medicines, takenToday);

    res.json({ 
      success: true, 
      message: 'Medicine marked as taken',
      nextMedicine,
      takenToday
    });
  } catch (err) {
    console.error('Error marking medicine as taken:', err);
    next(err);
  }
});

// GET /api/medicine/history - Get medicine history
router.get('/history', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });

    const db = getFirestore();
    const historySnapshot = await db.collection('users').doc(uid).collection('medicineHistory')
      .orderBy('takenAt', 'desc')
      .limit(30) // Last 30 entries
      .get();

    const history = [];
    historySnapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ history });
  } catch (err) {
    console.error('Error fetching medicine history:', err);
    next(err);
  }
});

export default router;
