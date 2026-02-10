// src/services/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

let client;

/**
 * Initialize and memoize the Gemini client.
 */
export function getGemini() {
  if (!client) {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('Missing GOOGLE_API_KEY');
    client = new GoogleGenerativeAI(key);
    console.log('[gemini] client initialized');
  }
  return client;
}

/**
 * Retrieve a model by name.
 * Default is light and fast (2.5-flash-lite).
 */
export function getModel(name = 'gemini-2.5-flash-lite') {
  return getGemini().getGenerativeModel({ model: name });
}

/**
 * Backup model (used if the primary call fails).
 */
export function getBackupModel() {
  return getGemini().getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
}

/**
 * Safe content generation with retries and timeout.
 * Used by the nudge scheduler to stay resilient under stress.
 */
export async function safeGenerateContent(prompt, options = {}) {
  const {
    modelName = 'gemini-2.5-flash-lite',
    maxRetries = 2,
    timeoutMs = 15000,
  } = options;

  const model = getModel(modelName);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await model.generateContent(prompt, { signal: controller.signal });
      clearTimeout(timer);

      return res.response.text();
    } catch (err) {
      console.warn(`[gemini] attempt ${attempt} failed:`, err.message);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt)); // backoff
    }
  }
}
