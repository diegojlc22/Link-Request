
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kb para evitar alertas desnecessários
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Configuração manual para dividir bibliotecas pesadas em arquivos separados
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/database'],
          charts: ['recharts'],
          ui: ['lucide-react', 'date-fns']
        }
      }
    }
  }
});