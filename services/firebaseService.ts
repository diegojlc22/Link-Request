import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, get, Database, Unsubscribe } from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | null = null;
let db: Database | null = null;

// Tenta carregar as configs do ambiente (Vite)
const getEnvConfig = (): FirebaseConfig | null => {
  const env = (import.meta as any).env;
  
  if (!env || !env.VITE_FIREBASE_API_KEY) {
    return null;
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };
};

export const initFirebase = (manualConfig?: FirebaseConfig): boolean => {
  try {
    // 1. Prioridade: Configuração Automática (.env)
    let config = getEnvConfig();

    // 2. Fallback: Configuração manual (caso legado ou teste específico)
    if (!config && manualConfig) {
      config = manualConfig;
    }

    if (!config || !config.apiKey || !config.databaseURL) {
      console.warn("Firebase Init Skipped: Missing configuration (Check .env file).");
      return false;
    }

    if (getApps().length === 0) {
      app = initializeApp(config);
      console.log("Firebase App Initialized via Environment.");
    } else {
      app = getApp();
    }
    
    if (config.databaseURL) {
      db = getDatabase(app, config.databaseURL);
      console.log("Firebase Connected");
    } else {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Firebase initialization critical error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

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

export const fbSubscribe = <T>(path: string, callback: (data: T[]) => void): Unsubscribe => {
  if (!db) {
    return () => {};
  }
  try {
    const dbRef = ref(db, path);
    return onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      const data = val ? Object.keys(val).map(key => ({
        ...val[key],
        id: key
      })) : [];
      callback(data as T[]);
    }, (error) => {
      console.error(`FIREBASE SYNC ERROR on path '${path}':`, error.message);
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
  } catch (error) {
    console.error(`Error setting doc in ${path}:`, error);
  }
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await update(ref(db, `${path}/${id}`), data);
  } catch (error) {
    console.error(`Error updating doc in ${path}:`, error);
  }
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db) return;
  try {
    await update(ref(db), updates);
  } catch (error) {
    console.error(`Error executing multi-path update:`, error);
  }
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  try {
    await remove(ref(db, `${path}/${id}`));
  } catch (error) {
    console.error(`Error deleting doc in ${path}:`, error);
  }
};