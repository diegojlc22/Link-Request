import * as firebaseApp from 'firebase/app';
import * as rtdb from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: any;
let db: rtdb.Database | undefined;

// Workaround for conflicting type definitions
const { initializeApp, getApps, getApp } = firebaseApp as any;

// Mantém suporte a .env para quem ainda usa o modo antigo (Single Tenant local)
const getEnvConfig = (): FirebaseConfig | null => {
  try {
    if (typeof import.meta === 'undefined') return null;
    const env = (import.meta as any).env;
    if (!env) return null;

    if (env.VITE_FIREBASE_API_KEY) {
      const config: FirebaseConfig = {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: env.VITE_FIREBASE_DATABASE_URL,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID
      };

      if (!config.databaseURL && config.projectId) {
         config.databaseURL = `https://${config.projectId}-default-rtdb.firebaseio.com`;
      }

      return config;
    }
  } catch (e) {
    console.warn("Error reading env vars:", e);
  }
  return null;
};

const getStorageConfig = () => {
  try {
    const env = (import.meta as any).env;
    if (env && env.VITE_CLOUDINARY_CLOUD_NAME && env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      return {
        cloudName: env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET,
        source: 'env'
      };
    }
    const local = localStorage.getItem('link_req_storage_config');
    if (local) {
      const parsed = JSON.parse(local);
      return { ...parsed, source: 'local' };
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Modificado para aceitar config manual
export const initFirebase = (manualConfig?: FirebaseConfig): boolean => {
  try {
    // Se passarmos uma config manual nova, precisamos reiniciar o app se ele já existir com outra config
    // Para simplificar neste MVP, assumimos que o reload da página cuida da limpeza
    if (db) return true;

    let config: FirebaseConfig | null = null;
    
    // Prioridade: Config Manual (Multi-Tenant) > Env Vars (Single Tenant Legacy)
    if (manualConfig && manualConfig.apiKey) {
        config = manualConfig;
    } else {
        config = getEnvConfig();
    }

    if (!config) {
      // Falha silenciosa se não tiver config, o App vai mostrar a tela de Setup/Portal
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
    
    return !!db;
  } catch (error) {
    console.error("Firebase initialization critical error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

export const fbMonitorConnection = (callback: (connected: boolean) => void) => {
    if (!db && !initFirebase()) return () => {};
    try {
        const connectedRef = rtdb.ref(db!, '.info/connected');
        return rtdb.onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                callback(true);
            } else {
                callback(false);
            }
        });
    } catch (e) {
        console.error("Monitor connection failed", e);
        return () => {};
    }
};

const normalizeData = <T>(val: any): T[] => {
  if (!val) return [];
  try {
    if (Array.isArray(val)) {
      return val.map((item, index) => item ? { ...item, id: String(index) } : null).filter(Boolean) as T[];
    }
    if (typeof val === 'object' && val !== null) {
      return Object.keys(val).map(key => {
        const item = val[key];
        if (typeof item === 'object' && item !== null) {
            return { ...item, id: key };
        }
        return null;
      }).filter(Boolean) as T[];
    }
    return [];
  } catch (e) {
    console.error("Error normalizing data:", e);
    return [];
  }
};

export const fbGetAll = async <T>(path: string): Promise<T[]> => {
  if (!db && !initFirebase()) return [];
  try {
    const dbRef = rtdb.ref(db!, path);
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
  if (!db && !initFirebase()) return () => {};
  try {
    const dbRef = rtdb.ref(db!, path);
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
  if (!db && !initFirebase()) return () => {};
  try {
    const dbQuery = rtdb.query(rtdb.ref(db!, path), rtdb.orderByKey(), rtdb.limitToLast(limit));
    return rtdb.onValue(dbQuery, (snapshot) => {
      callback(normalizeData<T>(snapshot.val()));
    }, (error) => {
      console.error(`FIREBASE QUERY ERROR on path '${path}':`, error.message);
    });
  } catch (error) {
    console.error(`Error setting up recent listener for ${path}:`, error);
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db && !initFirebase()) {
      throw new Error("Database not initialized");
  }
  try {
    await rtdb.set(rtdb.ref(db!, `${path}/${id}`), data);
  } catch (error) {
    console.error(`Error setting doc in ${path}:`, error);
    throw error;
  }
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db && !initFirebase()) return;
  try {
    await rtdb.update(rtdb.ref(db!, `${path}/${id}`), data);
  } catch (error) {
    console.error(`Error updating doc in ${path}:`, error);
  }
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db && !initFirebase()) return;
  try {
    await rtdb.update(rtdb.ref(db!), updates);
  } catch (error) {
    console.error(`Error executing multi-path update:`, error);
  }
};

export const fbDelete = async (path: string, id: string) => {
  if (!db && !initFirebase()) return;
  try {
    await rtdb.remove(rtdb.ref(db!, `${path}/${id}`));
  } catch (error) {
    console.error(`Error deleting doc in ${path}:`, error);
  }
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
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        return data.secure_url;
      }
    } catch (error) {
      console.error("Falha na conexão com Cloudinary. Usando fallback local.", error);
    }
  }

  if (base64String.length > 1500000) {
      console.warn("Imagem muito grande para fallback local.");
      throw new Error("Imagem muito grande. Configure o Cloudinary ou use imagens menores.");
  }

  return base64String;
};