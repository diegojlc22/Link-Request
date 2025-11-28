import { Tenant } from '../types';

/**
 * 🏢 REGISTRO MESTRE DE CLIENTES (TENANTS)
 * 
 * Cada cliente tem seu próprio banco de dados (Firebase) e pode ter
 * seu próprio armazenamento de imagens (Cloudinary).
 */
export const tenants: Tenant[] = [
  // --- CLIENTE 1: EMPRESA DEMO ---
  {
    id: 'client-demo',
    name: 'Empresa Demo',
    slug: 'demo', 
    firebaseConfig: {
      apiKey: "SUA_API_KEY_DO_FIREBASE_DEMO",
      authDomain: "projeto-demo.firebaseapp.com",
      projectId: "projeto-demo",
      storageBucket: "projeto-demo.firebasestorage.app",
      messagingSenderId: "123456789",
      appId: "1:123456:web:...",
      databaseURL: "https://projeto-demo-default-rtdb.firebaseio.com"
    },
    // Opcional: Se a empresa tiver seu próprio Cloudinary
    // cloudinaryConfig: {
    //   cloudName: "demo-cloud",
    //   uploadPreset: "demo-preset"
    // }
  },
  
  // --- CLIENTE 2: OUTRO EXEMPLO ---
  // {
  //   id: 'client-padaria',
  //   name: 'Padaria do João',
  //   slug: 'padaria',
  //   firebaseConfig: { ... },
  //   cloudinaryConfig: { ... }
  // }
];

export const getTenant = (slug: string): Tenant | null => {
  const tenant = tenants.find(t => t.slug.toLowerCase() === slug.toLowerCase());
  return tenant || null;
};
