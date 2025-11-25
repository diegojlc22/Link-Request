
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as rtdb from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: rtdb.Database | undefined;

// --- CONFIGURAÇÃO DO IMGUR (GRATUITO) ---
// Para produção, crie sua chave em: https://api.imgur.com/oauth2/addclient
// Selecione "Anonymous usage without user authorization"
const IMGUR_CLIENT_ID = "2c544c760829876"; // Client ID público de demonstração

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

export const fbSubscribeRecent = <T>(path: string, limit: number, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    const dbQuery = rtdb.query(rtdb.ref(db, path), rtdb.orderByKey(), rtdb.limitToLast(limit));
    return rtdb.onValue(dbQuery, (snapshot) => {
      const data = normalizeData<T>(snapshot.val());
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

// --- ALTERNATIVE STORAGE: IMGUR API ---

export const fbUploadImage = async (base64String: string, path?: string): Promise<string> => {
  // Nota: O parâmetro 'path' é ignorado no Imgur, pois ele gera seu próprio ID.
  
  // 1. Limpar o header do base64 (data:image/jpeg;base64,...)
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

  const formData = new FormData();
  formData.append("image", base64Data);
  formData.append("type", "base64");

  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.data.error || "Falha no upload para o Imgur");
    }

    // Retorna o link direto da imagem
    return data.data.link;
  } catch (error) {
    console.error("Error uploading image to Imgur:", error);
    throw error;
  }
};
