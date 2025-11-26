
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as rtdb from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: rtdb.Database | undefined;

// --- CONFIGURAÇÃO FIXA (GERADA PELO INSTALADOR) ---
const FIXED_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyBDHw4KVz1xEqyx_rpl-427brY77kPa9wo",
  authDomain: "link-request-43543.firebaseapp.com",
  databaseURL: "https://link-request-43543-default-rtdb.firebaseio.com",
  projectId: "link-request-43543",
  storageBucket: "link-request-43543.firebasestorage.app",
  messagingSenderId: "695289301024",
  appId: "1:695289301024:web:252286047e003c436d5445"
};

const getEnvConfig = (): FirebaseConfig | null => {
  if (FIXED_CONFIG && FIXED_CONFIG.apiKey !== "") {
    return FIXED_CONFIG;
  }
  return null;
};

// Ler configuração de Storage (Cloudinary)
const getStorageConfig = () => {
  try {
    const local = localStorage.getItem('link_req_storage_config');
    return local ? JSON.parse(local) : null;
  } catch (e) {
    return null;
  }
};

export const initFirebase = (manualConfig?: FirebaseConfig): boolean => {
  try {
    let config: FirebaseConfig | null = manualConfig && manualConfig.apiKey ? manualConfig : getEnvConfig();

    if (!config) {
      console.warn("Firebase Init Skipped: Missing configuration.");
      return false;
    }

    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    if (app) {
      db = rtdb.getDatabase(app);
    }
    
    return true;
  } catch (error) {
    console.error("Firebase initialization critical error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

const normalizeData = <T>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item, index) => item ? { ...item, id: String(index) } : null).filter(Boolean) as T[];
  }
  return Object.keys(val).map(key => ({
    ...val[key],
    id: key
  })) as T[];
};

export const fbGetAll = async <T>(path: string): Promise<T[]> => {
  if (!db) return [];
  try {
    const dbRef = rtdb.ref(db, path);
    const snapshot = await rtdb.get(dbRef);
    if (snapshot.exists()) {
      return normalizeData<T>(snapshot.val());
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const fbSubscribe = <T>(path: string, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    const dbRef = rtdb.ref(db, path);
    return rtdb.onValue(dbRef, (snapshot) => {
      callback(normalizeData<T>(snapshot.val()));
    });
  } catch (error) {
    return () => {};
  }
};

export const fbSubscribeRecent = <T>(path: string, limit: number, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    const dbQuery = rtdb.query(rtdb.ref(db, path), rtdb.orderByKey(), rtdb.limitToLast(limit));
    return rtdb.onValue(dbQuery, (snapshot) => {
      callback(normalizeData<T>(snapshot.val()));
    });
  } catch (error) {
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) return;
  await rtdb.set(rtdb.ref(db, `${path}/${id}`), data);
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  await rtdb.update(rtdb.ref(db, `${path}/${id}`), data);
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db) return;
  await rtdb.update(rtdb.ref(db), updates);
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  await rtdb.remove(rtdb.ref(db, `${path}/${id}`));
};

export const fbUploadImage = async (base64String: string, fileName: string): Promise<string> => {
  const storageConfig = getStorageConfig();
  if (storageConfig && storageConfig.cloudName && storageConfig.uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", base64String);
      formData.append("upload_preset", storageConfig.uploadPreset);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${storageConfig.cloudName}/image/upload`, 
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (data.secure_url) return data.secure_url;
    } catch (error) {
      console.error("Cloudinary failed", error);
    }
  }
  return base64String;
};
