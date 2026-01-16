
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, isCloudConnected } from '../services/mockDb';
import { Sauce, Settings, OrderSauce, Order, OrderStatus } from '../types';
import { getSauceRecommendations } from '../services/geminiService';

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sauces, setSauces] = useState<Sauce[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [existingOrders, setExistingOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    peopleCount: 8,
    orderDate: '',
    orderTime: '',
    selectedSauces: [] as string[],
    paymentProof: null as File | null,
    paymentProofPreview: '' as string
  });

  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      const [fetchedSauces, fetchedSettings, fetchedOrders] = await Promise.all([
        db.getSauces(),
        db.getSettings(),
        db.getOrders()
      ]);
      setSauces(fetchedSauces.filter(s => s.active));
      setSettings(fetchedSettings);
      setExistingOrders(fetchedOrders);
    };
    loadInitialData();
  }, []);

  const total = settings ? formData.peopleCount * settings.pricePerPerson : 0;

  const timeOptions = useMemo(() => {
    const times = [];
    for (let hour = 10; hour <= 14; hour++) {
      for (let min = 0; min < 60; min += 15) {
        if (hour === 14 && min > 0) break;
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    for (let hour = 20; hour <= 23; hour++) {
      for (let min = 0; min < 60; min += 15) {
        if (hour === 23 && min > 0) break;
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  }, []);

  const occupiedTimes = useMemo(() => {
    if (!formData.orderDate) return [];
    return existingOrders
      .filter(o => o.orderDate === formData.orderDate && o.status !== OrderStatus.CANCELLED)
      .map(o => o.orderTime);
  }, [existingOrders, formData.orderDate]);

  const handleSauceToggle = (sauceName: string) => {
    if (formData.selectedSauces.length < 6) {
      setFormData({
        ...formData,
        selectedSauces: [...formData.selectedSauces, sauceName]
      });
    }
  };

  const removeSauce = (index: number) => {
    const newSauces = [...formData.selectedSauces];
    newSauces.splice(index, 1);
    setFormData({ ...formData, selectedSauces: newSauces });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        paymentProof: file,
        paymentProofPreview: URL.createObjectURL(file)
      });
    }
  };

  const getAiHelp = async () => {
    setLoadingAi(true);
    const rec = await getSauceRecommendations(
      formData.peopleCount, 
      sauces.map(s => s.name)
    );
    setAiRecommendation(rec);
    setLoadingAi(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedSauces.length !== 6) {
      alert("Debes seleccionar exactamente 6 salsas.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const sauceMap = formData.selectedSauces.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const orderSauces: OrderSauce[] = Object.entries(sauceMap).map(([name, qty]) => ({
        sauceId: name,
        quantity: qty as number
      }));

      const newOrder = await db.saveOrder({
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        peopleCount: formData.peopleCount,
        totalPrice: total,
        orderDate: formData.orderDate,
        orderTime: formData.orderTime,
        paymentProofUrl: formData.paymentProofPreview,
        sauces: orderSauces
      });

      navigate(`/order-success/${newOrder.id}`);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el pedido. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) return <div className="flex justify-center items-center h-64 text-orange-700 font-bold italic">Sincronizando menú...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {!isCloudConnected && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">⚠️ Modo Offline Detectado</p>
          <p className="text-[9px] text-red-600 font-bold">Los pedidos no se sincronizarán con el administrador hasta que se vincule Supabase.</p>
        </div>
      )}

      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold transition-colors border-2 ${step >= s ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-500 border-gray-300'}`}>
              {s}
            </div>
            <span className={`text-xs font-bold ${step >= s ? 'text-orange-700' : 'text-gray-500'}`}>
              {s === 1 ? 'Configurar' : s === 2 ? 'Datos' : 'Pago'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <form onSubmit={handleSubmit} className="p-6 md:p-10">
          
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">Personaliza tu Pata</h2>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Comensales</label>
                <div className="flex items-center gap-6">
                  <input
                    type="number" min="8" value={formData.peopleCount}
                    onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 8 })}
                    className="w-24 p-4 border-2 border-gray-100 rounded-2xl focus:border-orange-500 outline-none text-gray-900 font-black text-xl"
                  />
                  <div className="flex-grow text-right bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase">Total Pedido</p>
                    <p className="text-3xl font-black text-orange-700">${total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Selección de Salsas ({formData.selectedSauces.length}/6)</label>
                  <button type="button" onClick={getAiHelp} disabled={loadingAi} className="text-[10px] text-orange-800 font-black bg-orange-100 px-3 py-1 rounded-full hover:bg-orange-200 transition">
                    {loadingAi ? 'Analizando...' : '✨ SUGERENCIA CHEF'}
                  </button>
                </div>
                {aiRecommendation && (
                  <div className="mb-4 p-5 bg-orange-50 rounded-2xl text-xs text-gray-800 border-2 border-orange-200 relative font-medium leading-relaxed shadow-inner">
                    <button onClick={() => setAiRecommendation(null)} className="absolute top-2 right-3 font-black text-orange-400 hover:text-orange-700">×</button>
                    {aiRecommendation}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {sauces.map((sauce) => (
                    <button key={sauce.id} type="button" onClick={() => handleSauceToggle(sauce.name)} disabled={formData.selectedSauces.length >= 6} className="p-3 text-xs border border-gray-100 rounded-xl hover:border-orange-500 font-bold text-gray-700 disabled:opacity-30 bg-gray-50/50 hover:bg-white transition flex justify-between items-center group">
                      <span>{sauce.name}</span>
                      <span className="text-orange-500 font-black opacity-0 group-hover:opacity-100">+</span>
                    </button>
                  ))}
                </div>
                {formData.selectedSauces.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    {formData.selectedSauces.map((name, idx) => (
                      <span key={idx} className="bg-white px-3 py-1.5 rounded-full text-[10px] border flex items-center gap-2 font-black text-gray-800 shadow-sm">
                        {name} <button type="button" onClick={() => removeSauce(idx)} className="text-red-500 hover:text-red-700 font-black text-sm">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={formData.selectedSauces.length !== 6} className="w-full bg-orange-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-orange-800 transition transform hover:scale-[1.01] active:scale-95 disabled:opacity-50">
                CONTINUAR
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">¿Dónde lo enviamos?</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Día de entrega</label>
                    <input required type="date" min={new Date().toISOString().split('T')[0]} value={formData.orderDate} onChange={(e) => setFormData({ ...formData, orderDate: e.target.value, orderTime: '' })} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-orange-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horario estimado</label>
                    <select required disabled={!formData.orderDate} value={formData.orderTime} onChange={(e) => setFormData({ ...formData, orderTime: e.target.value })} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none font-black bg-white focus:border-orange-500 transition">
                      <option value="">Seleccionar...</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time} disabled={occupiedTimes.includes(time)}>
                          {time} {occupiedTimes.includes(time) ? '— OCUPADO' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tu Nombre</label>
                  <input required type="text" placeholder="Ej: Carlos Gómez" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-orange-500 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dirección Completa</label>
                  <input required type="text" placeholder="Calle, Altura y Barrio" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-orange-500 transition" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black transition hover:bg-gray-200">ATRÁS</button>
                <button type="button" onClick={() => setStep(3)} disabled={!formData.customerName || !formData.address || !formData.orderDate || !formData.orderTime} className="flex-2 bg-orange-700 text-white py-4 px-8 rounded-2xl font-black text-lg shadow-lg hover:bg-orange-800 transition">SIGUIENTE</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter italic">Confirmar Pago</h2>
              <div className="bg-orange-50 p-6 rounded-3xl border-2 border-orange-200 space-y-5">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest">Transferencia a:</p>
                  <p className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Click para copiar alias</p>
                </div>
                <div 
                  className="bg-white p-4 rounded-2xl border-2 border-orange-100 cursor-pointer active:scale-95 transition text-center"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.paymentAlias);
                    alert('¡Alias copiado!');
                  }}
                >
                  <p className="font-mono font-black text-xl text-orange-700">{settings.paymentAlias}</p>
                </div>
                <div className="flex justify-between items-center px-2">
                  <p className="font-black text-gray-500 text-sm">A pagar:</p>
                  <p className="text-3xl font-black text-gray-900">${total.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adjuntar comprobante</label>
                {!formData.paymentProofPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer bg-gray-50 hover:bg-white transition group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-gray-300 group-hover:text-orange-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                      <p className="text-xs font-black text-gray-400">SUBIR CAPTURA</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden border-4 border-orange-500 shadow-xl group">
                    <img src={formData.paymentProofPreview} alt="Comprobante" className="w-full h-56 object-cover" />
                    <button type="button" onClick={() => setFormData({ ...formData, paymentProof: null, paymentProofPreview: '' })} className="absolute top-4 right-4 bg-red-600 text-white w-10 h-10 rounded-full font-black text-2xl shadow-lg transform group-hover:scale-110 transition">×</button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black transition hover:bg-gray-200">ATRÁS</button>
                <button type="submit" disabled={!formData.paymentProof || isSubmitting} className="flex-2 bg-green-700 text-white py-4 px-8 rounded-2xl font-black text-lg shadow-xl hover:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? 'ENVIANDO...' : 'CONFIRMAR PEDIDO'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default OrderForm;
