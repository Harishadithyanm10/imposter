import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  // GitHub Pages uses a repository subpath.
  // Capacitor mobile builds use the root path.
  base: mode === 'github' ? '/imposter/' : '/',

  server: {
    port: 5173,
  },
}));