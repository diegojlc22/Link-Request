
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, getDocs, setDoc, doc, deleteDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    // Pass the entire config object, including databaseURL if present
    app = initializeApp(config);
    db = getFirestore(app);
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

// Generic CRUD Helpers

export const fbGetAll = async <T>(collectionName: string): Promise<T[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(doc => doc.data() as T);
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
};

// Real-time Listener
export const fbSubscribe = <T>(collectionName: string, callback: (data: T[]) => void): Unsubscribe => {
  if (!db) return () => {};
  try {
    const q = collection(db, collectionName);
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as T);
      callback(data);
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    });
  } catch (error) {
    console.error(`Error setting up listener for ${collectionName}:`, error);
    return () => {};
  }
};

export const fbSet = async (collectionName: string, id: string, data: any) => {
  if (!db) return;
  try {
    await setDoc(doc(db, collectionName, id), data);
  } catch (error) {
    console.error(`Error setting doc in ${collectionName}:`, error);
  }
};

export const fbUpdate = async (collectionName: string, id: string, data: any) => {
  if (!db) return;
  try {
    await updateDoc(doc(db, collectionName, id), data);
  } catch (error) {
    console.error(`Error updating doc in ${collectionName}:`, error);
  }
};

export const fbDelete = async (collectionName: string, id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting doc in ${collectionName}:`, error);
  }
};
