
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as rtdb from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: rtdb.Database | undefined;

// --- CONFIGURAÇÃO ---
// PREENCHA AQUI PARA CONFIGURAR UMA VEZ SÓ (MODO FIXO)
// Ao preencher estes dados, o sistema funcionará em qualquer dispositivo sem pedir configuração.
const firebaseConfig = {
  apiKey: "AIzaSyBDHw4KVz1xEqyx_rpl-427brY77kPa9wo",
  authDomain: "link-request-43543.firebaseapp.com",
  databaseURL: "https://link-request-43543-default-rtdb.firebaseio.com",
  projectId: "link-request-43543",
  storageBucket: "link-request-43543.firebasestorage.app",
  messagingSenderId: "695289301024",
  appId: "1:695289301024:web:252286047e003c436d5445"
};

const getEnvConfig = (): FirebaseConfig | null => {
  // Se o usuário preencheu o FIXED_CONFIG no código, usa ele com prioridade máxima
  if (FIXED_CONFIG && FIXED_CONFIG.apiKey !== "") {
    console.log("Using FIXED_CONFIG from code.");
    return FIXED_CONFIG;
  }

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

// Helper para normalizar dados do Firebase
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

// --- UPLOAD HÍBRIDO INTELIGENTE ---
// Tenta Cloudinary > Se falhar ou não tiver config, usa Base64 (Banco Local)

export const fbUploadImage = async (base64String: string, fileName: string): Promise<string> => {
  const storageConfig = getStorageConfig();

  // 1. TENTATIVA CLOUDINARY (Se configurado)
  if (storageConfig && storageConfig.cloudName && storageConfig.uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", base64String);
      formData.append("upload_preset", storageConfig.uploadPreset);
      // Opcional: folder
      // formData.append("folder", "link_requests");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${storageConfig.cloudName}/image/upload`, 
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        console.log("Upload Cloudinary Sucesso");
        return data.secure_url;
      } else {
        console.error("Erro Cloudinary:", data);
        // Não lança erro, deixa cair no fallback
      }
    } catch (error) {
      console.error("Falha na conexão com Cloudinary. Usando fallback local.", error);
    }
  }

  // 2. FALLBACK: BANCO DE DADOS LOCAL (BASE64)
  // Se não tem nuvem ou a nuvem falhou, salva a string da imagem direto no banco.
  // Isso garante que o usuário nunca fique travado, mas aumenta o peso do banco.
  console.warn("Usando armazenamento local (Base64) para imagem.");
  return base64String;
};
