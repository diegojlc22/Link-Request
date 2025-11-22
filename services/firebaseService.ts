
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
      // Warning: If the config changed but the app name is default, Firebase will use the old config.
      // The DataContext handles this by forcing a page reload on config change.
    }
    
    // Explicitly pass the databaseURL to getDatabase.
    if (config.databaseURL) {
      db = getDatabase(app, config.databaseURL);
      console.log("Firebase DB Initialized with URL:", config.databaseURL);
    } else {
      console.error("Missing databaseURL in config");
      return false;
    }
    
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
    const dbRef = ref(db, path);
    
    // The "Engine": Using onValue to listen for real-time changes
    return onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      
      // Transform Firebase Object Map to Array for React
      const data = val ? Object.keys(val).map(key => ({
        ...val[key],
        id: key
      })) : [];
      
      // console.log(`Sync update for ${path}:`, data.length);
      callback(data as T[]);
    }, (error) => {
      console.error(`FIREBASE PERMISSION OR NETWORK ERROR on ${path}:`, error);
    });
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) {
      console.error("DB not initialized, cannot set data.");
      return;
  }
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
