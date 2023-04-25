import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react(),
    wasm(),
  ],
  base: '/sudoball',
  build: {
    target: 'esnext',
  },
});
