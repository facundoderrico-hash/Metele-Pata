import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const startApp = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error("Error: No se encontró el contenedor #root");
    return;
  }
  
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Asegurar que el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}