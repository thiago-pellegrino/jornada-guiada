import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// A Jornada Guiada lê as capacidades de ../../especificações (raiz do repositório).
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Configuração explícita do Simulador de Roadmap e Capacity (React 19 + Vite 8).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: [repoRoot] },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
