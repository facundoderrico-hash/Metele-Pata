
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, isCloudConnected } from '../services/mockDb';
import { Order, OrderStatus, Sauce, Settings } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'settings' | 'sauces' | 'setup' | 'marketing'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sauces, setSauces] = useState<Sauce[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUrl = window.location.origin + window.location.pathname;

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedSauces, fetchedSettings] = await Promise.all([
        db.getOrders(),
        db.getSauces(),
        db.getSettings()
      ]);
      setOrders(fetchedOrders);
      setSauces(fetchedSauces);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('is_admin') !== 'true') {
      navigate('/admin');
      return;
    }
    loadData();
  }, [navigate]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    await db.updateOrderStatus(id, status);
    loadData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings) {
      await db.saveSettings(settings);
      alert('Configuración guardada correctamente');
    }
  };

  const toggleSauce = async (id: string) => {
    const updated = sauces.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setSauces(updated);
    await db.saveSauces(updated);
  };

  const addSauce = async () => {
    const name = prompt('Nombre de la nueva salsa:');
    if (name) {
      const updated = [...sauces, { id: Date.now().toString(), name, active: true }];
      setSauces(updated);
      await db.saveSauces(updated);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const shareWhatsApp = () => {
    const text = `¡Hola! Ya podés hacer tu pedido de Patas Flambeadas online acá: ${currentUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <div className="w-12 h-12 border-4 border-orange-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-orange-700 uppercase tracking-widest text-sm">Sincronizando...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1 italic">Panel de Control</h1>
          <div className="flex items-center gap-2">
            {isCloudConnected ? (
              <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-200 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Modo Nube Activo
              </span>
            ) : (
              <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-200 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> Modo Local (No compartido)
              </span>
            )}
          </div>
        </div>
        <div className="flex bg-gray-200 rounded-xl p-1 border-2 border-gray-300 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'orders', label: 'PEDIDOS' },
            { id: 'sauces', label: 'SALSAS' },
            { id: 'settings', label: 'AJUSTES' },
            { id: 'marketing', label: 'COMPARTIR' },
            { id: 'setup', label: 'CONEXIÓN' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === tab.id ? 'bg-orange-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <button onClick={loadData} className="text-[10px] font-black text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 hover:bg-orange-100 transition uppercase tracking-widest flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Actualizar
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{orders.length} pedidos totales</span>
          </div>
          {orders.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-3xl border-4 border-dashed border-gray-100 font-black text-gray-300 text-xl italic">Aún no hay pedidos registrados.</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition">
                <div className="flex-grow space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-2xl tracking-tighter">#{order.id}</span>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border-2 ${
                      order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      order.status === OrderStatus.CONFIRMED ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>{order.status}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Cliente</p>
                      <p className="font-bold text-gray-900">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Total</p>
                      <p className="font-bold text-orange-700">${order.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Fecha y Hora</p>
                      <p className="font-bold text-gray-900">{order.orderDate} — {order.orderTime}hs</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Dirección</p>
                      <p className="font-bold text-gray-900">{order.address}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 min-w-[220px] justify-center">
                  <a href={order.paymentProofUrl} target="_blank" className="flex items-center justify-center gap-2 text-sm font-black text-orange-800 border-2 border-orange-200 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Ver Comprobante
                  </a>
                  <select 
                    value={order.status} 
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                    className="p-3 border-2 border-gray-200 rounded-xl text-xs font-black bg-white focus:border-orange-500 outline-none"
                  >
                    <option value={OrderStatus.PENDING}>Pendiente</option>
                    <option value={OrderStatus.CONFIRMED}>Confirmado</option>
                    <option value={OrderStatus.DELIVERED}>Entregado</option>
                    <option value={OrderStatus.CANCELLED}>Cancelado</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 space-y-8">
           <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl">📢</div>
            <div>
              <h2 className="text-2xl font-black italic">Herramientas de Venta</h2>
              <p className="text-gray-500 text-sm font-medium">Comparte tu link con los clientes para empezar a recibir pedidos.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Link de tu tienda</p>
                <div className="bg-white p-4 rounded-2xl border-2 border-gray-200 break-all font-mono text-xs text-orange-700 font-bold">
                  {currentUrl}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(currentUrl)} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-black text-xs hover:bg-gray-800 transition uppercase">Copiar Link</button>
                  <button onClick={shareWhatsApp} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black text-xs hover:bg-green-700 transition uppercase flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.554 4.197 1.608 6.022L0 24l6.117-1.605a11.803 11.803 0 005.925 1.577h.005c6.631 0 12.046-5.414 12.046-12.05 0-3.212-1.252-6.231-3.528-8.507z"/></svg>
                    Enviar
                  </button>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                <p className="font-black text-blue-900 text-sm mb-2 uppercase italic">Tip de Ventas 💡</p>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Pega este link en tu **biografía de Instagram** y ponlo en tu **estado de WhatsApp** cada jueves o viernes. 
                  ¡Los clientes aman la comodidad de pedir sin tener que esperar una respuesta!
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-gray-100 rounded-3xl bg-white text-center space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tu Código QR</p>
              <div className="bg-white p-4 rounded-3xl shadow-2xl border-2 border-orange-100">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`} 
                  alt="Código QR del negocio" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-gray-500 font-bold max-w-[200px]">Imprime este QR y pégalo en tu local para que escaneen y pidan al instante.</p>
              <button onClick={() => window.print()} className="text-[10px] font-black text-orange-700 underline uppercase tracking-widest">Imprimir Panel</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 space-y-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">🚀</div>
            <div>
              <h2 className="text-2xl font-black italic">Guía de Despliegue Profesional</h2>
              <p className="text-gray-500 text-sm font-medium">Sigue estos pasos para que tu negocio esté online hoy mismo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Opción RECOMENDADA: Vercel/Netlify */}
            <div className="bg-white p-8 rounded-3xl border-4 border-orange-600 space-y-6 relative shadow-2xl">
              <div className="absolute -top-5 left-8 bg-orange-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                ★ RECOMENDADO POR EL CHEF IA
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-2xl">☁️</div>
                <h3 className="font-black text-xl italic">Vercel / Netlify (Nube)</h3>
              </div>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">Es la opción más moderna, estable y gratuita para esta aplicación.</p>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                  <p className="text-xs font-bold text-gray-700">Crea una cuenta gratis en <a href="https://vercel.com" target="_blank" className="text-orange-600 underline">Vercel.com</a>.</p>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  <p className="text-xs font-bold text-gray-700">Sube tus archivos o conecta tu cuenta de GitHub.</p>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                  <div className="text-xs font-black text-orange-900 bg-orange-50 p-3 rounded-xl border border-orange-200">
                    IMPORTANTE: En el panel de Vercel, ve a "Environment Variables" y agrega tu <code className="bg-orange-200 px-1 rounded">API_KEY</code> para que la IA funcione.
                  </div>
                </li>
              </ul>
            </div>

            {/* Opción Tradicional: Hostinger */}
            <div className="bg-gray-50 p-8 rounded-3xl border-2 border-gray-200 space-y-6 opacity-80 hover:opacity-100 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🏠</div>
                <h3 className="font-black text-lg italic text-gray-600">Hostinger (Tradicional)</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">Úsalo solo si ya tienes una suscripción activa y prefieres no crear cuentas nuevas.</p>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                  <p className="text-xs font-bold text-gray-500">Sube el contenido a la carpeta <code className="bg-gray-200 px-1 rounded">public_html</code>.</p>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                  <p className="text-xs font-bold text-gray-500 italic">Deberás configurar el archivo <code className="bg-gray-200 px-1 rounded">.htaccess</code> para las rutas de React.</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Estado de Supabase */}
          <div className={`p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-6 ${isCloudConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg ${isCloudConnected ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
              {isCloudConnected ? '✓' : '!'}
            </div>
            <div className="flex-grow text-center md:text-left">
              <p className="font-black text-[10px] uppercase mb-1 tracking-widest">Base de Datos (Supabase):</p>
              <p className={`text-2xl font-black ${isCloudConnected ? 'text-green-700' : 'text-red-700'} italic`}>
                {isCloudConnected ? 'Sincronización Cloud Activa' : 'Base de Datos Desconectada'}
              </p>
              <p className="text-xs font-bold text-gray-500 mt-2">
                {isCloudConnected 
                  ? '¡Excelente! Todos los pedidos y salsas están seguros en la nube de Supabase.' 
                  : 'Sin esto, tus datos se perderán al borrar el historial del navegador. Configura las claves en services/mockDb.ts.'}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-3xl text-green-400 font-mono text-[10px] overflow-x-auto shadow-2xl relative">
              <button onClick={() => copyToClipboard(`create table orders (
  id text primary key,
  customer_name text,
  phone text,
  address text,
  people_count int,
  total_price float,
  order_date date,
  order_time text,
  status text,
  payment_proof_url text,
  sauces jsonb,
  created_at timestamp with time zone default now()
);`)} className="absolute top-4 right-4 bg-gray-800 text-gray-400 hover:text-white px-3 py-1 rounded-lg transition">COPIAR SQL</button>
              <p className="text-gray-500 mb-4 font-sans text-xs uppercase font-black tracking-widest">// Script SQL para Supabase</p>
{`create table orders (
  id text primary key,
  customer_name text,
  phone text,
  address text,
  people_count int,
  total_price float,
  order_date date,
  order_time text,
  status text,
  payment_proof_url text,
  sauces jsonb,
  created_at timestamp with time zone default now()
);

create table sauces (
  id uuid default gen_random_uuid() primary key,
  name text,
  active boolean default true
);

create table settings (
  id int primary key default 1,
  price_per_person int,
  payment_alias text,
  payment_cbu text
);`}
          </div>
        </div>
      )}

      {activeTab === 'sauces' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic">Gestión de Salsas</h2>
            <button onClick={addSauce} className="bg-orange-700 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-orange-800 transition">+ Nueva Salsa</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sauces.map((sauce) => (
              <div key={sauce.id} className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white transition group border-2 hover:border-orange-200">
                <span className={`font-black text-lg ${sauce.active ? 'text-gray-900' : 'text-gray-300 line-through'}`}>{sauce.name}</span>
                <button onClick={() => toggleSauce(sauce.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${sauce.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {sauce.active ? 'Activa' : 'Baja'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="max-w-xl bg-white rounded-3xl p-10 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-black mb-8 italic">Valores del Negocio</h2>
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio por Persona ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                <input type="number" value={settings.pricePerPerson} onChange={(e) => setSettings({ ...settings, pricePerPerson: parseInt(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-4 border-2 border-gray-100 rounded-2xl font-black text-2xl focus:border-orange-500 outline-none transition" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alias de Pago (Transferencia)</label>
              <input type="text" value={settings.paymentAlias} onChange={(e) => setSettings({ ...settings, paymentAlias: e.target.value })} className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold bg-gray-50 focus:bg-white focus:border-orange-500 outline-none transition uppercase" />
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition transform">
              Guardar Cambios
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
