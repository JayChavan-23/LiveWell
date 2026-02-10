import { createClient } from 'redis';
let client = null;

export async function getRedis() {
  if (client) return client;
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = createClient({ url });
  client.on('error', (e) => console.error('[redis] error', e));
  await client.connect();
  console.log('[redis] connected to', url);
  return client;
}
export async function redisPing() {
  const c = await getRedis();
  return c.ping();
}
export async function redisQuit() {
  if (!client) return;
  try { await client.quit(); console.log('[redis] closed'); }
  catch (e) { console.warn('[redis] close error', e); }
  finally { client = null; }
}
