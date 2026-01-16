
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
    alert(`Copiado: ${text}`);
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
        <div className="flex bg-gray-200 rounded-xl p-1 border-2 border-gray-300 w-full md:w-auto overflow-x-auto shadow-inner">
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
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === tab.id ? 'bg-orange-700 text-white shadow-md scale-105' : 'text-gray-700 hover:bg-gray-300'}`}
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
              <p className="text-xs text-gray-500 font-bold max-w-[200px]">Imprime este QR y pégalo en tu local.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'setup' && (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 space-y-12 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-200">🚀</div>
              <div>
                <h2 className="text-2xl font-black italic">Configuración de Vercel</h2>
                <p className="text-gray-500 text-sm font-medium">Sigue estos 3 pasos para poner tu negocio en órbita.</p>
              </div>
            </div>
            <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
               <p className="text-[10px] font-black text-orange-700 uppercase">Estado Actual:</p>
               <p className="text-xs font-bold text-orange-900 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                 {isCloudConnected ? 'Producción Lista' : 'Configuración Pendiente'}
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100 space-y-4">
              <span className="bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">1</span>
              <h3 className="font-black italic">GitHub</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">Sube tu carpeta a un repositorio. Es gratis y sirve de respaldo.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100 space-y-4">
              <span className="bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">2</span>
              <h3 className="font-black italic">Importar</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">En Vercel, elige el repositorio y dale a "Deploy".</p>
            </div>

            <div className="bg-blue-600 p-6 rounded-3xl border-2 border-blue-500 space-y-4 text-white shadow-xl shadow-blue-200">
              <span className="bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-black">3</span>
              <h3 className="font-black italic">Variables</h3>
              <p className="text-xs font-medium opacity-90 leading-relaxed">Copia estos nombres y busca sus valores abajo.</p>
              <div className="space-y-2">
                {[
                  { name: 'API_KEY', label: 'IA Gemini' },
                  { name: 'SUPABASE_URL', label: 'Base de Datos' },
                  { name: 'SUPABASE_ANON_KEY', label: 'Clave DB' }
                ].map((v) => (
                  <button 
                    key={v.name}
                    onClick={() => copyToClipboard(v.name)}
                    className="w-full flex justify-between items-center bg-blue-700/50 hover:bg-blue-800 p-2 rounded-lg border border-blue-400/30 transition text-[10px] font-black group"
                  >
                    <span>{v.name}</span>
                    <span className="bg-blue-400/20 px-2 py-0.5 rounded text-[8px] group-hover:bg-white group-hover:text-blue-600">COPIAR</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GUIA DE VALORES */}
          <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 space-y-6">
            <h3 className="text-xl font-black italic flex items-center gap-2">
              <span className="bg-orange-100 p-2 rounded-lg text-lg">❓</span> ¿Dónde encuentro mis valores?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">G</div>
                  <h4 className="font-black text-sm uppercase text-gray-400 tracking-tighter">Para API_KEY (IA Gemini)</h4>
                </div>
                <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                  Entra a <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 underline">Google AI Studio</a>. Haz clic en el botón <b>"Create API Key"</b>. Copia ese código largo (empieza con "AIza...").
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm">S</div>
                  <h4 className="font-black text-sm uppercase text-gray-400 tracking-tighter">Para SUPABASE (DB)</h4>
                </div>
                <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                  En tu proyecto de Supabase, ve a: <br/>
                  <b>Settings (Icono Rueda) → API</b>. <br/>
                  Ahí verás <b>Project URL</b> (para el URL) y <b>anon public</b> (para el Anon Key).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-black mb-6 italic flex items-center gap-2">
              <span className="text-green-500">🛡️</span> Scripts de Seguridad (SQL)
            </h3>
            <p className="text-xs text-gray-500 font-bold mb-4 uppercase tracking-widest">Copia y pega esto en el SQL Editor de Supabase para crear tus tablas:</p>
            <div className="bg-gray-900 p-6 rounded-2xl text-green-400 font-mono text-[10px] overflow-x-auto shadow-inner relative group">
                <button 
                  onClick={() => copyToClipboard(`create table orders (
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
);`)} 
                  className="absolute top-4 right-4 bg-white/10 text-white/50 hover:text-white px-3 py-1 rounded-lg text-[9px] font-black transition opacity-0 group-hover:opacity-100"
                >
                  COPIAR TODO EL SQL
                </button>
{`-- 1. Tabla de Pedidos
create table orders (
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

-- 2. Tabla de Salsas
create table sauces (
  id uuid default gen_random_uuid() primary key,
  name text,
  active boolean default true
);

-- 3. Tabla de Ajustes
create table settings (
  id int primary key default 1,
  price_per_person int,
  payment_alias text,
  payment_cbu text
);`}
            </div>
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
