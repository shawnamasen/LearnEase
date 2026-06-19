import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';

const DEFAULTS = {
  chats: 0,
  quizzesGenerated: 0,
  quizzesTaken: 0,
  correctAnswers: 0,
  totalAnswers: 0,
  reviewersGenerated: 0,
  lastActiveAt: null,
  createdAt: null
};

function uidFromUser(user) {
  return user?.uid || user?.user_id || user?.localId || null;
}

export async function ensureProgressDoc(user) {
  const uid = uidFromUser(user);
  if (!uid) return null;
  const ref = doc(db, 'progress', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...DEFAULTS, createdAt: serverTimestamp(), lastActiveAt: serverTimestamp() });
  }
  return ref;
}

export async function getProgress(user) {
  const uid = uidFromUser(user);
  if (!uid) return { ...DEFAULTS };
  const ref = doc(db, 'progress', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULTS };
  return { ...DEFAULTS, ...snap.data() };
}

export async function trackEvent(user, type, payload = {}) {
  const uid = uidFromUser(user);
  if (!uid) return;
  const ref = await ensureProgressDoc(user);
  if (!ref) return;

  const updates = { lastActiveAt: serverTimestamp() };

  if (type === 'chat') updates.chats = increment(1);
  if (type === 'quiz_generated') updates.quizzesGenerated = increment(1);
  if (type === 'quiz_taken') {
    updates.quizzesTaken = increment(1);
    const { correct = 0, total = 0 } = payload;
    updates.correctAnswers = increment(Number(correct) || 0);
    updates.totalAnswers = increment(Number(total) || 0);
  }
  if (type === 'reviewer_generated') updates.reviewersGenerated = increment(1);

  await updateDoc(ref, updates);
}

export function saveRecentActivity(user, activity) {
  const uid = uidFromUser(user);
  if (!uid) return;

  const recentActivityKey = `learnease_recent_activity_${uid}`;
  const activityCountKey = `learnease_activity_count_${uid}`;

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(recentActivityKey) || '[]');
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  const item = {
    title: activity.title || 'Activity',
    type: activity.type || 'general',
    meta: activity.meta || '',
    time: new Date().toLocaleString()
  };

  list.unshift(item);
  list = list.slice(0, 10);

  localStorage.setItem(recentActivityKey, JSON.stringify(list));

  const currentCount = Number(localStorage.getItem(activityCountKey) || 0);
  localStorage.setItem(activityCountKey, String(currentCount + 1));
}