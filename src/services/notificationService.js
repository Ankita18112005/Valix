import { collection, addDoc, updateDoc, doc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const createNotification = async (userId, title, message, type = 'general', relatedId = null) => {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      relatedId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return;
    
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    
    await batch.commit();
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
  }
};
