import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, get, Database, Unsubscribe } from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | null = null;
let db: Database | null = null;

export const initFirebase = (config: FirebaseConfig) => {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    // CRITICAL FIX: Explicitly pass the databaseURL to getDatabase.
    // This ensures connection to the correct instance even if auto-discovery fails.
    if (config.databaseURL) {
      db = getDatabase(app, config.databaseURL);
    } else {
      db = getDatabase(app);
    }
    
    console.log("Firebase Service Initialized with URL:", config.databaseURL);
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

// Generic CRUD Helpers

export const fbGetAll = async <T>(path: string): Promise<T[]> => {
  if (!db) return [];
  try {
    const snapshot = await get(ref(db, path));
    const val = snapshot.val();
    // Map keys to IDs to ensure consistency with the Observer pattern
    return val ? Object.keys(val).map(key => ({
      ...val[key],
      id: key
    })) as T[] : [];
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return [];
  }
};

// Real-time Listener (Observer Pattern)
export const fbSubscribe = <T>(path: string, callback: (data: T[]) => void): Unsubscribe => {
  if (!db) {
    console.warn(`Cannot subscribe to ${path}: DB not initialized`);
    return () => {};
  }
  try {
    console.log(`Subscribing to path: ${path}`);
    const dbRef = ref(db, path);
    
    // The "Engine": Using onValue to listen for real-time changes
    return onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      
      // Transform Firebase Object Map to Array for React
      const data = val ? Object.keys(val).map(key => ({
        ...val[key],
        id: key
      })) : [];
      
      // console.log(`Data received from ${path}:`, data.length, "items");
      callback(data as T[]);
    }, (error) => {
      console.error(`Error subscribing to ${path}:`, error);
    });
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await set(ref(db, `${path}/${id}`), data);
    console.log(`Set success: ${path}/${id}`);
  } catch (error) {
    console.error(`Error setting doc in ${path}:`, error);
  }
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await update(ref(db, `${path}/${id}`), data);
    console.log(`Update success: ${path}/${id}`);
  } catch (error) {
    console.error(`Error updating doc in ${path}:`, error);
  }
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  try {
    await remove(ref(db, `${path}/${id}`));
    console.log(`Delete success: ${path}/${id}`);
  } catch (error) {
    console.error(`Error deleting doc in ${path}:`, error);
  }
};