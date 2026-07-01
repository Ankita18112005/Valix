import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const XP_REWARDS = {
  SUBMIT_QUALITY_IDEA: 50,
  RECEIVE_UPVOTE: 5,
  HELPFUL_REVIEW: 15,
  JOIN_PROJECT: 30,
  DAILY_LOGIN: 10,
  SPAM_SUBMISSION: -50,
  DUPLICATE_SUBMISSION: -20,
  LOW_QUALITY_SUBMISSION: -10
};

export const awardXP = async (userId, amount, reason) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    
    // Add XP
    await updateDoc(userRef, {
      xp: increment(amount),
      updatedAt: serverTimestamp()
    });

    // Log Activity
    await addDoc(collection(db, 'activity'), {
      userId,
      action: reason,
      xpChange: amount,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Error awarding XP:', err);
  }
};

export const deductXP = async (userId, amount, reason) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      xp: increment(-amount), // Subtract
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, 'activity'), {
      userId,
      action: reason,
      xpChange: -amount,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error('Error deducting XP:', err);
  }
};

export const incrementUserCounter = async (userId, field) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [field]: increment(1)
    });
  } catch (err) {
    console.error(`Error incrementing ${field}:`, err);
  }
};

export const updateTrustScore = async (userId) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    // Simplified Trust Score logic (0-100)
    let score = 50; // Base score
    
    // Positive factors
    if (data.ideasValidated > 5) score += 10;
    if (data.ideasCreated > 0) score += 5;
    if (data.projectsJoined > 0) score += 15;
    if (data.streak >= 7) score += 5;
    
    // Negative factors could be added here based on reports
    
    score = Math.min(100, Math.max(0, score));
    
    await updateDoc(userRef, { trustScore: score });
  } catch (err) {
    console.error('Error updating trust score:', err);
  }
};

export const checkAndUpdateStreak = async (userId) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    const now = new Date();
    const lastLogin = data.lastLogin?.toDate ? data.lastLogin.toDate() : new Date(0);
    
    // Reset time to start of day for comparison
    now.setHours(0,0,0,0);
    const last = new Date(lastLogin);
    last.setHours(0,0,0,0);
    
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let newStreak = data.streak || 0;
    
    if (diffDays === 1) {
      newStreak += 1; // Logged in consecutive days
      await awardXP(userId, XP_REWARDS.DAILY_LOGIN, 'Daily Login Streak');
    } else if (diffDays > 1) {
      newStreak = 1; // Streak broken
    } // if diffDays === 0, already logged in today
    
    await updateDoc(userRef, {
      streak: newStreak,
      lastLogin: serverTimestamp()
    });
    
  } catch (err) {
    console.error('Error checking streak:', err);
  }
};
