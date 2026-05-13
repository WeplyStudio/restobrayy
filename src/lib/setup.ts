import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function initializeDatabase() {
  try {
    // 1. Initialize Queue
    const queueRef = doc(db, 'settings', 'queue');
    const queueSnap = await getDoc(queueRef);
    if (!queueSnap.exists()) {
      await setDoc(queueRef, {
        currentNumber: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      });
      console.log('Queue settings initialized');
    }

    // 2. Add sample categories if empty
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      try {
        const cats = ['Makanan Utama', 'Minuman', 'Cemilan', 'Dessert'];
        for (const name of cats) {
          await addDoc(collection(db, 'categories'), { name });
        }
        console.log('Categories initialized');
      } catch (e: any) {
        if (e.code !== 'permission-denied') throw e;
      }
    }
  } catch (err: any) {
    if (err.code !== 'permission-denied') {
      console.warn('Database initialization warning:', err.message);
    }
  }
}

export async function ensureAdmin(uid: string) {
  try {
    const adminRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, { createdAt: new Date() });
      console.log('User registered as admin:', uid);
    }
  } catch (err) {
    console.warn('Failed to ensure admin status:', err);
  }
}
