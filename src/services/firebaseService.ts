import * as firebaseApp from 'firebase/app';
import * as rtdb from 'firebase/database';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { FirebaseConfig, CloudinaryConfig } from '../types';

let app: any;
let db: rtdb.Database | undefined;
let auth: Auth | undefined;
let activeCloudinaryConfig: CloudinaryConfig | null = null;
let currentConfig: FirebaseConfig | null = null;

// Workaround for conflicting type definitions
const { initializeApp, getApps, getApp, deleteApp } = firebaseApp as any;

const getEnvFirebaseConfig = (): FirebaseConfig | null => {
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

const getEnvCloudinaryConfig = (): CloudinaryConfig | null => {
  try {
    const env = (import.meta as any).env;
    if (env && env.VITE_CLOUDINARY_CLOUD_NAME && env.VITE_CLOUDINARY_UPLOAD_PRESET) {
      return {
        cloudName: env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const initFirebase = (manualFirebaseConfig?: FirebaseConfig, manualCloudinaryConfig?: CloudinaryConfig): boolean => {
  try {
    // 1. Configurar Cloudinary
    if (manualCloudinaryConfig) {
        activeCloudinaryConfig = manualCloudinaryConfig;
    } else if (!activeCloudinaryConfig) {
        activeCloudinaryConfig = getEnvCloudinaryConfig();
    }

    // 2. Configurar Firebase
    // Se já estiver inicializado com a mesma config, retorna true
    if (db && auth) return true; 

    let config: FirebaseConfig | null = null;
    
    if (manualFirebaseConfig && manualFirebaseConfig.apiKey) {
        config = manualFirebaseConfig;
    } else {
        config = getEnvFirebaseConfig();
    }

    if (!config) {
      return false;
    }
    
    currentConfig = config;

    // Garante que só inicializa uma vez
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    if (app) {
      db = rtdb.getDatabase(app);
      auth = getAuth(app);
    }
    
    return !!db && !!auth;
  } catch (error) {
    console.error("Firebase initialization critical error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db && !!auth;

export const getFirebaseAuth = () => {
    if (!auth) initFirebase();
    return auth;
};

// --- AUTHENTICATION HELPERS ---

export const fbSignIn = async (email: string, pass: string) => {
    if (!auth) {
        // Tenta inicializar antes de falhar
        initFirebase();
        if (!auth) throw new Error("Auth não inicializado. Verifique tenants.ts ou .env");
    }
    return await signInWithEmailAndPassword(auth!, email, pass);
};

export const fbSignOut = async () => {
    if (!auth) return;
    return await signOut(auth);
};

export const fbResetPassword = async (email: string) => {
    if (!auth) throw new Error("Auth not initialized");
    return await sendPasswordResetEmail(auth, email);
};

export const fbOnAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
    if (!auth) initFirebase();
    if (auth) {
        return onAuthStateChanged(auth, callback);
    }
    return () => {};
};

/**
 * Cria usuário em instância secundária para não deslogar o admin atual.
 */
export const fbCreateUserSecondary = async (email: string, pass: string) => {
    if (!currentConfig) throw new Error("Firebase config missing");

    const secondaryAppName = `secondaryApp-${Date.now()}`;
    const secondaryApp = initializeApp(currentConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        await signOut(secondaryAuth);
        return userCredential.user;
    } catch (error) {
        throw error;
    } finally {
        await deleteApp(secondaryApp);
    }
};

// --- DATABASE HELPERS ---

export const fbMonitorConnection = (callback: (connected: boolean) => void) => {
    if (!db && !initFirebase()) return () => {};
    try {
        const connectedRef = rtdb.ref(db!, '.info/connected');
        return rtdb.onValue(connectedRef, (snap) => {
            callback(snap.val() === true);
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
  if (!db && !initFirebase()) throw new Error("Database not initialized");
  await rtdb.set(rtdb.ref(db!, `${path}/${id}`), data);
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db && !initFirebase()) return;
  await rtdb.update(rtdb.ref(db!, `${path}/${id}`), data);
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db && !initFirebase()) return;
  await rtdb.update(rtdb.ref(db!), updates);
};

export const fbDelete = async (path: string, id: string) => {
  if (!db && !initFirebase()) return;
  await rtdb.remove(rtdb.ref(db!, `${path}/${id}`));
};

export const fbUploadImage = async (base64String: string, fileName: string): Promise<string> => {
  const storageConfig = activeCloudinaryConfig;

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
      console.error("Cloudinary Error:", error);
    }
  }

  if (base64String.length > 1500000) {
      throw new Error("Imagem muito grande (>1.5MB) para armazenamento local. Configure Cloudinary.");
  }
  return base64String;
};
