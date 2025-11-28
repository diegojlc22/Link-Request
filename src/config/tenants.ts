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
    id: 'cliente-demo',
    name: 'Empresa Demo',
    slug: 'demo', // O cliente acessa via demo.seusistema.com ou digitando 'demo' no portal
    firebaseConfig: {
      apiKey: "AIzaSyBDHw4KVz1xEqyx_rpl-427brY77kPa9wo",
      authDomain: "link-request-43543.firebaseapp.com",
      databaseURL: "https://link-request-43543-default-rtdb.firebaseio.com",
      projectId: "link-request-43543",
      storageBucket: "link-request-43543.firebasestorage.app",
      messagingSenderId: "695289301024",
      appId: "1:695289301024:web:252286047e003c436d5445"
    }
    // Opcional: Se a empresa tiver seu próprio Cloudinary
    // cloudinaryConfig: {
    //   cloudName: "dmykrjvgi",
    //   uploadPreset: "linkteste"
    // }
  },
  
  // --- CLIENTE 2: OUTRO EXEMPLO (Comente ou descomente conforme necessário) ---
  /*
  {
    id: 'client-padaria',
    name: 'Padaria do João',
    slug: 'padaria',
    firebaseConfig: { 
      apiKey: "...",
      authDomain: "...",
      projectId: "...",
      // ...
    }
  }
  */
];

export const getTenant = (slug: string): Tenant | null => {
  if (!slug) return null;
  const tenant = tenants.find(t => t.slug.toLowerCase() === slug.toLowerCase());
  return tenant || null;
};