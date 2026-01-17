
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, isCloudConnected } from '../services/mockDb';
import { Order, OrderStatus, Sauce, Settings } from '../types';

/**
 * Componente principal del panel de administración.
 */
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'settings' | 'sauces' | 'setup' | 'marketing'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sauces, setSauces] = useState<Sauce[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados para Modales de Salsas
  const [editingSauce, setEditingSauce] = useState<{ id: string, name: string } | null>(null);
  const [deletingSauce, setDeletingSauce] = useState<{ id: string, name: string } | null>(null);
  const [isAddingSauce, setIsAddingSauce] = useState(false);
  const [newSauceName, setNewSauceName] = useState('');
  const [isCreatingSauce, setIsCreatingSauce] = useState(false);

  // Estados de Filtros
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');

  const currentUrl = window.location.origin + window.location.pathname;

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [fetchedOrders, fetchedSauces, fetchedSettings] = await Promise.all([
        db.getOrders(),
        db.getSauces(),
        db.getSettings()
      ]);
      setOrders(fetchedOrders);
      setSauces(fetchedSauces);
      setSettings(fetchedSettings);
    } catch (err: any) {
      console.error("Error al cargar datos:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('is_admin') !== 'true') {
      navigate('/admin');
      return;
    }
    loadData();
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesName = order.customerName.toLowerCase().includes(filterName.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesDate = !filterDate || order.orderDate === filterDate;
      return matchesName && matchesStatus && matchesDate;
    });
  }, [orders, filterName, filterStatus, filterDate]);

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      await db.updateOrderStatus(id, status);
      await loadData(true);
    } catch (err) {
      alert("Error al actualizar el estado");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      await db.saveSettings(settings);
      setFeedback({ type: 'success', message: '¡Configuración guardada!' });
      setTimeout(() => setFeedback(null), 3000);
      await loadData(true); 
    } catch (err: any) {
      const errorMsg = err.message || (typeof err === 'string' ? err : 'Error de conexión');
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSauce = async (id: string) => {
    const updated = sauces.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setSauces(updated);
    try {
      await db.saveSauces(updated);
    } catch (err: any) {
      alert("Error: " + (err.message || "No se pudo actualizar la salsa"));
      loadData(true);
    }
  };

  const handleAddSauce = async () => {
    if (!newSauceName.trim()) return;
    
    setIsCreatingSauce(true);
    try {
      const newSauce: Sauce = { 
        id: `temp-${Date.now()}`, 
        name: newSauceName.trim(), 
        active: true 
      };
      
      const updated = [...sauces, newSauce];
      await db.saveSauces(updated);
      
      setNewSauceName('');
      setIsAddingSauce(false);
      await loadData(true); 
    } catch (err: any) {
      alert("Error al crear la salsa: " + (err.message || "Verifica la conexión"));
    } finally {
      setIsCreatingSauce(false);
    }
  };

  const handleUpdateSauceName = async () => {
    if (editingSauce && editingSauce.name.trim()) {
      const updated = sauces.map(s => s.id === editingSauce.id ? { ...s, name: editingSauce.name.trim() } : s);
      try {
        await db.saveSauces(updated);
        setEditingSauce(null);
        await loadData(true);
      } catch (err: any) {
        alert("Error al actualizar: " + (err.message || "No se pudo guardar"));
      }
    }
  };

  const confirmDeleteSauce = async () => {
    if (deletingSauce) {
      try {
        await db.deleteSauce(deletingSauce.id);
        setDeletingSauce(null);
        await loadData(true);
      } catch (err: any) {
        alert("Error al eliminar: " + (err.message || "Intenta de nuevo"));
      }
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

  const clearFilters = () => {
    setFilterName('');
    setFilterStatus('all');
    setFilterDate('');
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <div className="w-12 h-12 border-4 border-orange-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-orange-700 uppercase tracking-widest text-sm">Sincronizando Sistema...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-gray-900">
      {/* MODAL EDITAR SALSA */}
      {editingSauce && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black italic mb-6 text-gray-900">Editar Sauce</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                value={editingSauce.name}
                onChange={(e) => setEditingSauce({ ...editingSauce, name: e.target.value })}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold text-lg bg-white text-gray-900 focus:border-orange-500 outline-none transition"
              />
              <div className="flex gap-3">
                <button onClick={() => setEditingSauce(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-black text-xs uppercase text-gray-500">Cancelar</button>
                <button onClick={handleUpdateSauceName} className="flex-1 bg-orange-700 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-orange-100">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR SALSA */}
      {deletingSauce && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border-b-8 border-red-600 animate-in zoom-in duration-300">
            <h3 className="text-xl font-black italic mb-2 text-gray-900">¿Eliminar Salsa?</h3>
            <p className="text-sm text-gray-500 mb-6 font-bold">{deletingSauce.name}</p>
            <div className="flex flex-col gap-2">
              <button onClick={confirmDeleteSauce} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Sí, eliminar</button>
              <button onClick={() => setDeletingSauce(null)} className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-black text-xs uppercase">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR SALSA */}
      {isAddingSauce && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black italic mb-6 text-gray-900">Nueva Salsa</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nombre de la salsa"
                value={newSauceName}
                onChange={(e) => setNewSauceName(e.target.value)}
                autoFocus
                className="w-full p-4 border-2 border-gray-100 rounded-2xl font-bold text-lg bg-white text-gray-900 focus:border-orange-500 outline-none transition"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddingSauce(false)} 
                  disabled={isCreatingSauce}
                  className="flex-1 bg-gray-100 py-3 rounded-xl font-black text-xs uppercase text-gray-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddSauce} 
                  disabled={isCreatingSauce || !newSauceName.trim()}
                  className="flex-1 bg-orange-700 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreatingSauce ? 'Guardando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tight text-orange-800">Metele Pata OS</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Panel de Control del Negocio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { localStorage.removeItem('is_admin'); navigate('/admin'); }} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase hover:bg-gray-200 transition">Salir</button>
        </div>
      </div>

      {/* TABS NAVEGACIÓN */}
      <div className="flex overflow-x-auto gap-2 mb-8 no-scrollbar pb-2">
        {[
          { id: 'orders', label: 'Pedidos', icon: '📋' },
          { id: 'sauces', label: 'Salsas', icon: '🍯' },
          { id: 'settings', label: 'Ajustes', icon: '⚙️' },
          { id: 'marketing', label: 'Marketing', icon: '📣' },
          { id: 'setup', label: 'Config', icon: '☁️' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase whitespace-nowrap transition-all flex items-center gap-2 border-2 ${activeTab === tab.id ? 'bg-orange-700 text-white border-orange-700 shadow-lg shadow-orange-100' : 'bg-white text-gray-400 border-gray-50 hover:border-gray-200'}`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden min-h-[400px]">
        {activeTab === 'orders' && (
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex-1 min-w-[200px] relative">
                <input 
                  type="text" 
                  placeholder="Filtrar por nombre..." 
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full p-3 border-2 border-gray-100 rounded-xl font-bold text-sm bg-white text-gray-900 outline-none focus:border-orange-500 appearance-none transition-all"
                />
              </div>
              
              <div className="flex-shrink-0">
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="p-3 border-2 border-gray-100 rounded-xl font-bold text-sm bg-white text-gray-900 outline-none focus:border-orange-500 transition-all cursor-pointer"
                />
              </div>

              <div className="flex-shrink-0">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="p-3 border-2 border-gray-100 rounded-xl font-bold text-sm bg-white text-gray-900 outline-none focus:border-orange-500"
                >
                  <option value="all">Todos los estados</option>
                  {Object.values(OrderStatus).map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {(filterName || filterDate || filterStatus !== 'all') && (
                <button 
                  onClick={clearFilters}
                  className="p-3 text-orange-700 font-black text-xs uppercase hover:underline"
                >
                  Limpiar ×
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Entrega</th>
                    <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Total</th>
                    <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Estado</th>
                    <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest text-center">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.length > 0 ? filteredOrders.map(order => (
                    <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-6">
                        <p className="font-black text-lg text-gray-900 leading-tight">{order.customerName}</p>
                        <p className="text-xs font-bold text-gray-400">{order.phone}</p>
                      </td>
                      <td className="py-6">
                        <p className="font-black text-gray-900">{order.orderDate}</p>
                        <p className="text-xs font-bold text-orange-600">{order.orderTime} hs</p>
                      </td>
                      <td className="py-6">
                        <p className="font-black text-sm text-gray-900">${order.totalPrice.toLocaleString()}</p>
                        <p className="text-[9px] font-bold text-gray-400">{order.peopleCount} comensales</p>
                      </td>
                      <td className="py-6">
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 outline-none transition bg-white text-gray-900 ${
                            order.status === OrderStatus.CONFIRMED ? 'bg-green-50 text-green-700 border-green-100' :
                            order.status === OrderStatus.CANCELLED ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-orange-50 text-orange-700 border-orange-100'
                          }`}
                        >
                          {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-6 text-center">
                        <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 text-gray-400 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-all inline-block">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </a>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <p className="text-gray-300 font-black uppercase text-xs tracking-widest italic">No se encontraron pedidos para este filtro</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sauces' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black italic text-gray-900">Catálogo de Salsas</h3>
              <button 
                onClick={() => setIsAddingSauce(true)}
                className="bg-orange-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase hover:bg-orange-800 transition shadow-lg shadow-orange-100"
              >
                + Nueva Salsa
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sauces.map(sauce => (
                <div key={sauce.id} className="p-4 border-2 border-gray-50 rounded-2xl flex items-center justify-between group hover:border-orange-100 transition-all bg-white">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleSauce(sauce.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${sauce.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {sauce.active ? '✓' : '×'}
                    </button>
                    <div>
                      <p className={`font-black ${sauce.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{sauce.name}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{sauce.active ? 'Activa' : 'Pausada'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingSauce({ id: sauce.id, name: sauce.name })} className="p-2 text-gray-400 hover:text-orange-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                    <button onClick={() => setDeletingSauce({ id: sauce.id, name: sauce.name })} className="p-2 text-gray-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-8 max-w-2xl">
            <h3 className="text-xl font-black italic mb-8 text-gray-900">Ajustes Generales</h3>
            {settings && (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Precio por Persona</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">$</span>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={settings.pricePerPerson === 0 ? '' : settings.pricePerPerson}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, ''); 
                          setSettings({ ...settings, pricePerPerson: val === '' ? 0 : Number(val) });
                        }}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-100 rounded-xl font-black text-lg bg-white text-gray-900 focus:border-orange-500 outline-none transition appearance-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Clave Admin (Local)</label>
                    <input 
                      type="text" 
                      value={settings.adminPassword}
                      onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl font-black text-lg bg-white text-gray-900 focus:border-orange-500 outline-none transition appearance-none"
                      required
                    />
                    <p className="text-[9px] text-gray-400 italic font-bold">Clave guardada localmente.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Alias MP / Transferencia</label>
                  <input 
                    type="text" 
                    value={settings.paymentAlias}
                    onChange={(e) => setSettings({ ...settings, paymentAlias: e.target.value })}
                    className="w-full p-4 border-2 border-orange-100 bg-white text-orange-800 rounded-xl font-black text-xl outline-none appearance-none"
                    required
                  />
                </div>
                
                <div className="pt-4 relative">
                  {feedback && (
                    <div className={`absolute -top-8 left-0 right-0 text-center font-black text-[11px] uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-300 ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {feedback.message}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-3 ${
                      isSaving ? 'bg-gray-400 text-white' : 
                      feedback?.type === 'success' ? 'bg-green-600 text-white' : 'bg-orange-700 text-white hover:bg-orange-800'
                    }`}
                  >
                    {isSaving ? 'Guardando...' : feedback?.type === 'success' ? '¡Hecho!' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="p-8">
            <h3 className="text-xl font-black italic mb-6 text-gray-900">Difusión</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-green-50 rounded-3xl border-2 border-green-100">
                <h4 className="text-lg font-black text-green-900 mb-2">WhatsApp Directo</h4>
                <button onClick={shareWhatsApp} className="w-full bg-green-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-green-100">Compartir</button>
              </div>
              <div className="p-6 bg-orange-50 rounded-3xl border-2 border-orange-100">
                <h4 className="text-lg font-black text-orange-900 mb-2">URL del Sistema</h4>
                <div className="flex gap-2">
                  <input readOnly value={currentUrl} className="flex-1 bg-white border border-orange-200 rounded-lg px-3 py-2 text-[10px] font-mono text-gray-500" />
                  <button onClick={() => copyToClipboard(currentUrl)} className="bg-orange-700 text-white px-4 rounded-lg font-black text-[10px] uppercase">Copiar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="p-8 text-gray-900">
            <h3 className="text-xl font-black italic mb-6">Estado Técnico</h3>
            <div className={`p-6 rounded-3xl border-2 ${isCloudConnected ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full animate-pulse ${isCloudConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h4 className={`font-black uppercase text-xs ${isCloudConnected ? 'text-green-800' : 'text-red-800'}`}>
                  {isCloudConnected ? 'Conectado a la Nube' : 'Modo Offline'}
                </h4>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center mt-12 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Metele Pata OS • v3.0.4</p>
    </div>
  );
};

export default AdminDashboard;
