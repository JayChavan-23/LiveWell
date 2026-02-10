import { Router } from 'express';
import { db } from '../services/db.js';
import { requireAuth } from '../middlewares/auth.js';
import { checkSocialEventAchievement } from '../services/achievements.js';

const router = Router();

/**
 * POST /api/social/events - Create a new social event
 * Body: { title, category, date, startTime, endTime, location, imageUrl, imageStoragePath }
 * Auth: Bearer (Firebase)
 */
router.post('/events', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { title, category, date, startTime, endTime, location, imageUrl, imageStoragePath } = req.body || {};
    
    // Validate required fields
    if (!title || !category || !date || !startTime || !endTime || !location?.name || !location?.address) {
      return res.status(400).json({ error: 'Missing required fields: title, category, date, startTime, endTime, location.name, location.address' });
    }

    // Create startsAt timestamp for sorting
    const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
    const now = new Date().toISOString();

    // Create event document
    const eventData = {
      hostUid: uid,
      title,
      category,
      date,
      startTime,
      endTime,
      startsAt,
      location,
      imageUrl: imageUrl || '',
      imageStoragePath: imageStoragePath || '',
      attendeeCount: 1, // Host is automatically attending
      createdAt: now,
      updatedAt: now
    };

    // Add to social events collection
    console.log('Creating event with data:', eventData);
    const eventRef = await db().collection('socialEvents').add(eventData);
    console.log('Event created with ID:', eventRef.id);
    
    // Add host as attendee
    await eventRef.collection('attendees').doc(uid).set({
      uid,
      joinedAt: now,
      isHost: true
    });
    console.log('Host added as attendee');

    // Check for social event achievement (first time hosting/joining an event)
    const newAchievements = await checkSocialEventAchievement(uid);

    res.status(201).json({
      success: true,
      eventId: eventRef.id,
      message: 'Social event created successfully',
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/social/events - Get all social events
 * Query: { limit = 50, category, upcoming = true }
 * Auth: Bearer (Firebase)
 */
router.get('/events', requireAuth(), async (req, res, next) => {
  try {
    console.log('=== SOCIAL EVENTS ROUTE HIT ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request path:', req.path);
    console.log('Request query:', req.query);
    console.log('Request headers:', req.headers);
    console.log('User from auth:', req.user);
    
    const { limit = 50, category, upcoming = 'true' } = req.query;
    const uid = req.user.uid;
    console.log('Fetching events for user:', uid);

    let query = db().collection('socialEvents');

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    // Filter upcoming events if requested (disabled for now due to startsAt field)
    // if (upcoming === 'true') {
    //   const now = new Date().toISOString();
    //   query = query.where('startsAt', '>=', now);
    // }

    // Order by start time (only if startsAt field exists)
    // For now, let's remove the orderBy to avoid query issues
    query = query.limit(parseInt(limit));

    console.log('Executing query...');
    let eventsSnap;
    try {
      eventsSnap = await query.get();
    } catch (queryError) {
      console.error('Query error:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Query failed',
        details: queryError.message
      });
    }
    
    const events = [];

    console.log('Found', eventsSnap.docs.length, 'events');
    console.log('Query snapshot empty:', eventsSnap.empty);

    // If no documents exist, return empty array (collection doesn't exist yet)
    if (eventsSnap.empty) {
      console.log('No events found in collection');
      return res.json({
        success: true,
        events: [],
        message: 'No events found'
      });
    }

    for (const doc of eventsSnap.docs) {
      const eventData = { id: doc.id, ...doc.data() };
      
      // Ensure startsAt exists for sorting (create from date + startTime if missing)
      if (!eventData.startsAt && eventData.date && eventData.startTime) {
        eventData.startsAt = new Date(`${eventData.date}T${eventData.startTime}:00`).toISOString();
      }
      
      // Check if current user is attending
      const attendeeDoc = await doc.ref.collection('attendees').doc(uid).get();
      eventData.isAttending = attendeeDoc.exists;
      
      // Get attendee names (limit to 10 for performance)
      const attendeesSnap = await doc.ref.collection('attendees')
        .orderBy('joinedAt', 'asc')
        .limit(10)
        .get();
      
      const attendees = [];
      for (const attendeeDoc of attendeesSnap.docs) {
        const attendeeData = attendeeDoc.data();
        // Get user name from users collection
        try {
          const userDoc = await db().collection('users').doc(attendeeData.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            attendees.push({
              uid: attendeeData.uid,
              name: userData.name || userData.displayName || 'Anonymous User',
              isHost: attendeeData.isHost,
              joinedAt: attendeeData.joinedAt
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          attendees.push({
            uid: attendeeData.uid,
            name: 'Anonymous User',
            isHost: attendeeData.isHost,
            joinedAt: attendeeData.joinedAt
          });
        }
      }
      
      eventData.attendees = attendees;
      events.push(eventData);
    }

    res.json({ success: true, events });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/social/events/:eventId/join - Join a social event
 * Auth: Bearer (Firebase)
 */
router.post('/events/:eventId/join', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { eventId } = req.params;

    const eventRef = db().collection('socialEvents').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already attending
    const attendeeDoc = await eventRef.collection('attendees').doc(uid).get();
    if (attendeeDoc.exists) {
      return res.status(400).json({ error: 'You are already attending this event' });
    }

    // Add user as attendee
    const now = new Date().toISOString();
    await eventRef.collection('attendees').doc(uid).set({
      uid,
      joinedAt: now,
      isHost: false
    });

    // Update attendee count
    await eventRef.update({
      attendeeCount: eventDoc.data().attendeeCount + 1,
      updatedAt: now
    });

    // Check for social event achievement (first time joining an event)
    const newAchievements = await checkSocialEventAchievement(uid);

    res.json({ 
      success: true, 
      message: 'Successfully joined the event',
      newAchievements: newAchievements.length > 0 ? newAchievements : undefined
    });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/social/events/:eventId/leave - Leave a social event
 * Auth: Bearer (Firebase)
 */
router.delete('/events/:eventId/leave', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { eventId } = req.params;

    const eventRef = db().collection('socialEvents').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Check if user is the host
    if (eventData.hostUid === uid) {
      return res.status(400).json({ error: 'Host cannot leave their own event. Delete the event instead.' });
    }

    // Check if user is attending
    const attendeeDoc = await eventRef.collection('attendees').doc(uid).get();
    if (!attendeeDoc.exists) {
      return res.status(400).json({ error: 'You are not attending this event' });
    }

    // Remove user from attendees
    await eventRef.collection('attendees').doc(uid).delete();

    // Update attendee count
    await eventRef.update({
      attendeeCount: eventData.attendeeCount - 1,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Successfully left the event' });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/social/events/:eventId - Delete a social event (host only)
 * Auth: Bearer (Firebase)
 */
router.delete('/events/:eventId', requireAuth(), async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { eventId } = req.params;

    const eventRef = db().collection('socialEvents').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();

    // Check if user is the host
    if (eventData.hostUid !== uid) {
      return res.status(403).json({ error: 'Only the host can delete this event' });
    }

    // Delete the event (this will also delete all subcollections)
    await eventRef.delete();

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (e) {
    next(e);
  }
});

export default router;
