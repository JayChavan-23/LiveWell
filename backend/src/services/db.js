import { getFirestore } from './firebase.js';
export const db = () => getFirestore();
export const nowISO = () => new Date().toISOString();
export const withTimestamps = (data) => ({ ...data, createdAt: nowISO(), updatedAt: nowISO() });