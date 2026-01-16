
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Definimos solo las variables necesarias para evitar errores de serialización
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
    // Proporcionamos un objeto vacío para process.env para evitar 'process is not defined'
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || ''),
      SUPABASE_URL: JSON.stringify(process.env.SUPABASE_URL || ''),
      SUPABASE_ANON_KEY: JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
