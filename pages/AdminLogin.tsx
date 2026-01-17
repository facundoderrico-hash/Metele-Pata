
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/mockDb';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const settings = await db.getSettings();
      const correctPassword = settings.adminPassword || 'admin123';

      if (password === correctPassword) {
        localStorage.setItem('is_admin', 'true');
        navigate('/admin/dashboard');
      } else {
        alert('Contraseña incorrecta. Si no la cambiaste, intenta con admin123');
      }
    } catch (err) {
      console.error(err);
      alert('Error al verificar las credenciales. Intenta de nuevo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100">
        <div className="w-16 h-16 bg-orange-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h2 className="text-3xl font-black text-center mb-1 italic tracking-tight text-gray-900">Acceso Admin</h2>
        <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-widest mb-8">Metele Pata OS Control</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contraseña de Seguridad</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-100 rounded-2xl font-black text-xl bg-white text-gray-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition text-center appearance-none"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition shadow-xl active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? 'VERIFICANDO...' : 'ENTRAR AL PANEL'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-[10px] font-bold text-gray-300">
          Si olvidaste tu clave, contacta a soporte técnico.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
