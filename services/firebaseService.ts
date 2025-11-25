
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as rtdb from 'firebase/database';
import * as storage from 'firebase/storage';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: rtdb.Database | undefined;
let st: storage.FirebaseStorage | undefined;

// --- CONFIGURAÇÃO FIXA ---
// DEIXE COMO NULL PARA MODO "PRODUTO/VENDA"
const FIXED_CONFIG: FirebaseConfig | null = null;

const getEnvConfig = (): FirebaseConfig | null => {
  if (FIXED_CONFIG && FIXED_CONFIG.apiKey !== "") return FIXED_CONFIG;

  try {
    const localConfig = localStorage.getItem('firebase_config_override');
    if (localConfig) {
      const parsed = JSON.parse(localConfig);
      if (parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (e) {
    console.warn("Erro ao ler config do localStorage", e);
  }

  const env = (import.meta as any).env;
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
    let config: FirebaseConfig | null = manualConfig && manualConfig.apiKey ? manualConfig : getEnvConfig();

    if (!config) {
      console.warn("Firebase Init Skipped: Missing configuration.");
      return false;
    }

    if (getApps().length === 0) {
      app = initializeApp(config);
      console.log("Firebase App Initialized.");
    } else {
      app = getApp();
    }
    
    if (app) {
      db = rtdb.getDatabase(app);
      st = storage.getStorage(app);
    }
    
    return true;
  } catch (error) {
    console.error("Firebase initialization critical error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

// Helper para normalizar dados do Firebase (Array ou Object para Array)
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
    // Para GetAll inicial, usamos query limitado também se for requests, 
    // mas aqui mantemos genérico. O ideal é evitar fbGetAll em coleções grandes.
    const snapshot = await rtdb.get(dbRef);
    if (snapshot.exists()) {
      return normalizeData<T>(snapshot.val());
    }
    return [];
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return [];
  }
};

// Listener genérico (baixa tudo - usar com cuidado)
export const fbSubscribe = <T>(path: string, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    const dbRef = rtdb.ref(db, path);
    return rtdb.onValue(dbRef, (snapshot) => {
      callback(normalizeData<T>(snapshot.val()));
    }, (error) => {
      console.error(`FIREBASE SYNC ERROR on path '${path}':`, error.message);
    });
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    return () => {};
  }
};

// NOVO: Listener Otimizado (baixa apenas os últimos N itens)
export const fbSubscribeRecent = <T>(path: string, limit: number, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    // Ordena pela chave (que contém o timestamp na estrutura 'r'+Date.now()) e pega os últimos
    const dbQuery = rtdb.query(rtdb.ref(db, path), rtdb.orderByKey(), rtdb.limitToLast(limit));
    
    return rtdb.onValue(dbQuery, (snapshot) => {
      // O resultado de query vem como objeto, normalizamos
      const data = normalizeData<T>(snapshot.val());
      // Firebase retorna ordenado por chave ascendente (mais antigo -> mais novo)
      // O DataContext já faz o sort reverso (mais novo -> mais antigo), então enviamos raw
      callback(data);
    }, (error) => {
      console.error(`FIREBASE QUERY ERROR on path '${path}':`, error.message);
    });
  } catch (error) {
    console.error(`Error setting up recent listener for ${path}:`, error);
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await rtdb.set(rtdb.ref(db, `${path}/${id}`), data);
  } catch (error) {
    console.error(`Error setting doc in ${path}:`, error);
    throw error;
  }
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    await rtdb.update(rtdb.ref(db, `${path}/${id}`), data);
  } catch (error) {
    console.error(`Error updating doc in ${path}:`, error);
  }
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db) return;
  try {
    await rtdb.update(rtdb.ref(db), updates);
  } catch (error) {
    console.error(`Error executing multi-path update:`, error);
  }
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  try {
    await rtdb.remove(rtdb.ref(db, `${path}/${id}`));
  } catch (error) {
    console.error(`Error deleting doc in ${path}:`, error);
  }
};

// --- STORAGE FUNCTIONS ---

export const fbUploadImage = async (base64String: string, path: string): Promise<string> => {
  if (!st) throw new Error("Storage not initialized");
  
  // Remove header data:image/jpeg;base64, if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  
  const storageRef = storage.ref(st, path);
  
  try {
    await storage.uploadString(storageRef, base64Data, 'base64');
    const url = await storage.getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
