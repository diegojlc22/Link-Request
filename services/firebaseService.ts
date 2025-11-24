import firebase from 'firebase/app';
import 'firebase/database';
import { FirebaseConfig } from '../types';

let app: firebase.app.App | null = null;
let db: firebase.database.Database | null = null;

// Tenta carregar as configs do ambiente (Vite)
const getEnvConfig = (): FirebaseConfig | null => {
  const env = (import.meta as any).env;
  
  // Se existir .env, usa ele
  if (env && env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: env.VITE_FIREBASE_DATABASE_URL,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID
    };
  }
  return null;
};

export const initFirebase = (manualConfig?: FirebaseConfig): boolean => {
  try {
    let config: FirebaseConfig | null = null;

    // 1. Configuração Manual (passada pelo Setup/LocalStorage) tem prioridade
    if (manualConfig && manualConfig.apiKey && manualConfig.databaseURL) {
      config = manualConfig;
    } 
    // 2. Configuração de Ambiente (.env)
    else {
      config = getEnvConfig();
    }

    if (!config) {
      console.warn("Firebase Init Skipped: Missing configuration.");
      return false;
    }

    if (!firebase.apps.length) {
      app = firebase.initializeApp(config);
      console.log("Firebase App Initialized.");
    } else {
      app = firebase.app();
    }
    
    if (config.databaseURL) {
      db = firebase.database(app!);
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
    const snapshot = await db.ref(path).once('value');
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

export const fbSubscribe = <T>(path: string, callback: (data: T[]) => void): () => void => {
  if (!db) {
    return () => {};
  }
  try {
    const dbRef = db.ref(path);
    const handler = (snapshot: firebase.database.DataSnapshot) => {
      const val = snapshot.val();
      const data = val ? Object.keys(val).map(key => ({
        ...val[key],
        id: key
      })) : [];
      callback(data as T[]);
    };
    
    dbRef.on('value', handler, (error: Error) => {
      console.error(`FIREBASE SYNC ERROR on path '${path}':`, error.message);
    });

    return () => {
      dbRef.off('value', handler);
    };
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await db.ref(`${path}/${id}`).set(data);
  } catch (error) {
    console.error(`Error setting doc in ${path}:`, error);
  }
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await db.ref(`${path}/${id}`).update(data);
  } catch (error) {
    console.error(`Error updating doc in ${path}:`, error);
  }
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db) return;
  try {
    await db.ref().update(updates);
  } catch (error) {
    console.error(`Error executing multi-path update:`, error);
  }
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  try {
    await db.ref(`${path}/${id}`).remove();
  } catch (error) {
    console.error(`Error deleting doc in ${path}:`, error);
  }
};