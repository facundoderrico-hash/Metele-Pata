
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto evita que la app explote al buscar process.env en el navegador
    'process.env': process.env
  }
});
