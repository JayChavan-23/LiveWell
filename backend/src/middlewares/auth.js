import { getAuth } from '../services/firebase.js';

/**
 * Firebase authentication middleware.
 * Ensures the request has a valid Firebase ID token in the Authorization header.
 * In non-production environments, you can bypass with an `x-demo-user` header.
 */
export function requireAuth() {
  return async (req, res, next) => {
    try {
      // 🔹 Dev shortcut: allow overriding user with header (ONLY outside production)
      const devUid = req.headers['x-demo-user'];
      if (process.env.NODE_ENV !== 'production' && devUid) {
        console.log('[requireAuth] Dev mode user override:', devUid);
        req.user = { uid: String(devUid) };
        return next();
      }

      // 🔹 Check for Authorization header
      const authz = req.headers.authorization || '';
      if (!authz.startsWith('Bearer ')) {
        return res
          .status(401)
          .json({ error: 'Missing Authorization Bearer token' });
      }

      // 🔹 Extract token and verify with Firebase Admin
      const idToken = authz.slice(7);
      const decoded = await getAuth().verifyIdToken(idToken);

      // Attach decoded user info to request
      req.user = {
        uid: decoded.uid,
        email: decoded.email || null,
        phone_number: decoded.phone_number || null,
      };

      return next();
    } catch (e) {
      console.error('[requireAuth] Verification failed:', e.message);
      return res.status(401).json({
        error: 'Unauthorized',
        details: e?.message,
      });
    }
  };
}
