
import { Tenant } from '../types';

/**
 * 🏢 REGISTRO MESTRE DE CLIENTES (TENANTS)
 * 
 * Para que o sistema funcione, você DEVE substituir as chaves abaixo 
 * pelas chaves do seu projeto Firebase.
 * 
 * 1. Vá em console.firebase.google.com
 * 2. Crie um projeto
 * 3. Configurações do Projeto > Geral > Adicionar App Web (</>)
 * 4. Copie as chaves e cole abaixo.
 */
export const tenants: Tenant[] = [
  // --- CLIENTE 1: Exemplo ---
  {
    id: 'cliente-demo',
    name: 'Minha Empresa SaaS',
    slug: 'demo', // Acesse digitando 'demo' no Portal
    firebaseConfig: {
      // SUBSTITUA PELAS SUAS CHAVES REAIS:
      apiKey: "SUA_API_KEY_AQUI",
      authDomain: "seu-projeto.firebaseapp.com",
      databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
      projectId: "seu-projeto",
      storageBucket: "seu-projeto.firebasestorage.app",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456"
    }
  },
  
  // Você pode adicionar mais clientes copiando o bloco acima
];

export const getTenant = (slug: string): Tenant | null => {
  if (!slug) return null;
  const tenant = tenants.find(t => t.slug.toLowerCase() === slug.toLowerCase());
  return tenant || null;
};
