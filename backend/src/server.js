// src/server.js
import 'dotenv/config';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { createApp } from './app.js';
import { initFirebase } from './services/firebase.js';
import { getRedis, redisQuit } from './services/redis.js';
import { initSocket } from './sockets/index.js';
import {recalcFrailtyForAllUsers} from "./workers/frailtyCron.js";
import "./workers/nudgesCron.js";
// src/server.js
import "./workers/nudgeDispatcher.js";
import { startGoalCron } from "./workers/goalCron.js";
import {startNudgesWorker} from "./workers/nudgesCron.js";

// -------------------------------------------------------------
// MAIN ENTRY
// -------------------------------------------------------------
const PORT = Number(process.env.PORT || 4000);

async function start() {
  // Initialize Firebase and Redis (if enabled)
  initFirebase();
  // await getRedis(); // enable only if you’re using redis adapter now

  // Determine mode: server (default) or scheduler
  const role = process.env.WORKER_ROLE || 'server';
  if (role === 'scheduler') {
    console.log('[server] starting in SCHEDULER mode');
    // Lazy-import scheduler so it doesn’t pollute server workers
    const { startNudgesScheduler } = await import('./workers/nudgesCron.js');
    await startNudgesScheduler();
    return; // no HTTP server
  }

  // ----------------------------
  // HTTP(S) SERVER
  // ----------------------------
  const app = createApp();
  const useHttps = process.env.HTTPS === 'true' && process.env.SSL_KEY && process.env.SSL_CERT;

  const server = useHttps
    ? https.createServer(
        {
          key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
          cert: fs.readFileSync(process.env.SSL_CERT, 'utf8'),
        },
        app
      )
    : http.createServer(app);

  // Attach sockets
  initSocket(server);

  // Start listener
  server.listen(PORT, () =>
    console.log(`[server] listening on http${useHttps ? 's' : ''}://localhost:${PORT}`)
  );

  // Start background goal cron
  startGoalCron();

  // Graceful shutdown
  const shutdown = async (sig) => {
    console.log(`[server] ${sig} received`);
    server.close(async () => {
      await redisQuit();
      process.exit(0);
    });
    setTimeout(async () => {
      await redisQuit().catch(() => {});
      process.exit(1);
    }, 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// -------------------------------------------------------------
// BOOTSTRAP
// -------------------------------------------------------------
start().catch((e) => {
  console.error('[server] fatal', e);
  process.exit(1);
});e1313c8205a39bf4ad2180ef3b876a
