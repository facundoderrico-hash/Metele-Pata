
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import OrderForm from './pages/OrderForm';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import OrderSuccess from './pages/OrderSuccess';
import { db } from './services/mockDb';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  const handleShare = async () => {
    const shareData = {
      title: 'Metele Pata - Pedidos Online',
      text: '¡Haz tu pedido de Patas Flambeadas online!',
      url: window.location.origin + window.location.pathname
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('¡Enlace copiado al portapapeles!');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-orange-700">Metele Pata</span>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-orange-700 transition-colors"
              title="Compartir link"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {isAdminPath ? (
              <Link to="/" className="text-sm font-bold text-gray-700 hover:text-orange-700 transition">
                Ir a Tienda
              </Link>
            ) : (
              <Link to="/admin" className="text-sm font-bold text-gray-700 hover:text-orange-700 transition">
                Acceso Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<OrderForm />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>
        <footer className="bg-white border-t py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-700 text-sm font-medium">
            <p>&copy; {new Date().getFullYear()} Metele Pata. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;