
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, onValue, Database } from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: Database | undefined;

// --- CONFIGURAÇÃO FIXA (PREENCHA AQUI PARA FUNCIONAR EM QUALQUER DISPOSITIVO) ---
const FIXED_CONFIG: FirebaseConfig | null = {
  apiKey: "", // Cole sua apiKey aqui
  authDomain: "", // Cole seu authDomain aqui
  databaseURL: "", // Cole sua databaseURL aqui
  projectId: "", // Cole seu projectId aqui
  storageBucket: "", // Cole seu storageBucket aqui
  messagingSenderId: "", // Cole seu messagingSenderId aqui
  appId: "" // Cole seu appId aqui
};

// Tenta carregar as configs do ambiente (Vite), Fixas ou LocalStorage
const getEnvConfig = (): FirebaseConfig | null => {
  // Prioridade 1: Configuração Fixa no Código (Recomendado para Deploy Global)
  if (FIXED_CONFIG && FIXED_CONFIG.apiKey !== "") {
    return FIXED_CONFIG;
  }

  // Prioridade 2: Configuração Salva via UI (LocalStorage) - Solução de emergência/local
  try {
    const localConfig = localStorage.getItem('firebase_config_override');
    if (localConfig) {
      const parsed = JSON.parse(localConfig);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Erro ao ler config do localStorage", e);
  }

  // Prioridade 3: Variáveis de Ambiente (.env)
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
    let config: FirebaseConfig | null = null;

    if (manualConfig && manualConfig.apiKey && manualConfig.databaseURL) {
      config = manualConfig;
    } else {
      config = getEnvConfig();
    }

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
      db = getDatabase(app);
      console.log("Firebase Connected");
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
    const dbRef = ref(db, path);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      // Handle potential array or object structure
      if (Array.isArray(val)) {
        return val.map((item, index) => ({ ...item, id: String(index) }));
      }
      return Object.keys(val).map(key => ({
        ...val[key],
        id: key
      })) as T[];
    }
    return [];
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
    const dbRef = ref(db, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      let data: any[] = [];
      
      if (val) {
        if (Array.isArray(val)) {
           data = val.map((item, index) => item ? { ...item, id: String(index) } : null).filter(Boolean);
        } else {
           data = Object.keys(val).map(key => ({
             ...val[key],
             id: key
           }));
        }
      }
      
      callback(data as T[]);
    }, (error) => {
      console.error(`FIREBASE SYNC ERROR on path '${path}':`, error.message);
    });

    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    const dbRef = ref(db, `${path}/${id}`);
    await set(dbRef, data);
  } catch (error) {
    console.error(`Error setting doc in ${path}:`, error);
    throw error; // Re-throw to allow caller to handle
  }
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  try {
    const dbRef = ref(db, `${path}/${id}`);
    await update(dbRef, data);
  } catch (error) {
    console.error(`Error updating doc in ${path}:`, error);
  }
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db) return;
  try {
    const dbRef = ref(db);
    await update(dbRef, updates);
  } catch (error) {
    console.error(`Error executing multi-path update:`, error);
  }
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  try {
    const dbRef = ref(db, `${path}/${id}`);
    await remove(dbRef);
  } catch (error) {
    console.error(`Error deleting doc in ${path}:`, error);
  }
};
