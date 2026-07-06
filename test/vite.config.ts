import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/react-bitmap/',
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from one level up (our parent directory) so Vite can access ../src
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      // Create an alias to import the library as if it were an npm package
      'react-bitmap': resolve(__dirname, '../src/index.ts'),
    },
  },
});
