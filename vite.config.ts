
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Definimos las variables específicas como strings directos
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
    // Proporcionamos un objeto vacío de respaldo para evitar errores de referencia
    'process.env': '({})'
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
