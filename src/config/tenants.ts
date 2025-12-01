
import { Tenant } from '../types';

/**
 * 🏢 REGISTRO MESTRE DE CLIENTES (TENANTS)
 */
export const tenants: Tenant[] = [
  // --- CLIENTE PRINCIPAL (SEU PROJETO) ---
  {
    id: 'link-request-master',
    name: 'Link Request (Produção)',
    slug: 'demo', // Acesse digitando 'demo' no Portal
    firebaseConfig: {
      apiKey: "AIzaSyBDHw4KVz1xEqyx_rpl-427brY77kPa9wo",
      authDomain: "link-request-43543.firebaseapp.com",
      databaseURL: "https://link-request-43543-default-rtdb.firebaseio.com",
      projectId: "link-request-43543",
      storageBucket: "link-request-43543.firebasestorage.app",
      messagingSenderId: "695289301024",
      appId: "1:695289301024:web:252286047e003c436d5445"
    },
    cloudinaryConfig: {
      cloudName: "dmykrjvgi",
      uploadPreset: "linkteste"
    }
  },
  
  // Exemplo de outro cliente (opcional)
  /*
  {
    id: 'cliente-2',
    name: 'Outra Empresa',
    slug: 'outra',
    firebaseConfig: { ... }
  }
  */
];

export const getTenant = (slug: string): Tenant | null => {
  if (!slug) return null;
  const tenant = tenants.find(t => t.slug.toLowerCase() === slug.toLowerCase());
  return tenant || null;
};
