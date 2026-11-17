import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração explícita do Simulador de Roadmap e Capacity (React 19 + Vite 8).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
