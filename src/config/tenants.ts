import { Tenant, FirebaseConfig } from '../types';

/**
 * 🏢 REGISTRO MESTRE DE CLIENTES (TENANTS)
 * 
 * Para adicionar um novo cliente:
 * 1. Crie o projeto no Firebase Console.
 * 2. Adicione as credenciais abaixo.
 * 3. Dê git push.
 * 
 * O sistema vai detectar o cliente automaticamente pelo SLUG.
 */
export const tenants: Tenant[] = [
  // --- CLIENTE 1: EMPRESA DEMO ---
  {
    id: 'client-demo',
    name: 'Empresa Demo',
    slug: 'demo', // Acessível via demo.app.com ou pelo portal digitando "demo"
    config: {
      apiKey: "SUA_API_KEY_DO_FIREBASE_DEMO",
      authDomain: "projeto-demo.firebaseapp.com",
      projectId: "projeto-demo",
      storageBucket: "projeto-demo.firebasestorage.app",
      messagingSenderId: "123456789",
      appId: "1:123456:web:...",
      databaseURL: "https://projeto-demo-default-rtdb.firebaseio.com"
    }
  },
  
  // --- CLIENTE 2: EXEMPLO ---
  // {
  //   id: 'client-nike',
  //   name: 'Nike Filiais',
  //   slug: 'nike',
  //   config: { ... }
  // }
];

export const getTenantConfig = (slug: string): FirebaseConfig | null => {
  const tenant = tenants.find(t => t.slug.toLowerCase() === slug.toLowerCase());
  return tenant ? tenant.config : null;
};
