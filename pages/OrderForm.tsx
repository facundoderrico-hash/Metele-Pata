
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
    peopleCount: '' as string | number,
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

  const peopleCountNum = Number(formData.peopleCount);
  const isValidPeopleCount = formData.peopleCount !== '' && peopleCountNum >= 8;
  const showMinError = formData.peopleCount !== '' && peopleCountNum > 0 && peopleCountNum < 8;
  const total = settings && isValidPeopleCount ? peopleCountNum * settings.pricePerPerson : 0;

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
    if (!isValidPeopleCount) return;
    setLoadingAi(true);
    const rec = await getSauceRecommendations(
      peopleCountNum, 
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
        peopleCount: peopleCountNum,
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

  // Clases compartidas para inputs con ALTO CONTRASTE y tamaño PROPORCIONADO
  const inputBaseClasses = "w-full p-3.5 border-2 border-gray-200 rounded-xl outline-none font-bold text-black bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-gray-400 placeholder:font-normal text-base";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {!isCloudConnected && (
        <div className="mb-4 p-3 bg-red-600 rounded-xl text-center shadow-md border-b-2 border-red-800">
          <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1">⚠️ MODO LOCAL ACTIVO</p>
        </div>
      )}

      {/* Steps Header - Más compacto */}
      <div className="flex justify-between mb-6 px-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all border-2 ${step >= s ? 'bg-orange-700 text-white border-orange-700 shadow-md scale-105' : 'bg-white text-gray-300 border-gray-200'}`}>
              {s}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tight ${step >= s ? 'text-orange-900' : 'text-gray-400'}`}>
              {s === 1 ? 'Pedido' : s === 2 ? 'Datos' : 'Pago'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <form onSubmit={handleSubmit} className="p-5 md:p-8">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-50 pb-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Armar Pedido</h2>
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Paso 1: Configuración</p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Comensales (Mínimo 8)</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="8"
                      value={formData.peopleCount}
                      onChange={(e) => setFormData({ ...formData, peopleCount: e.target.value })}
                      className={`${inputBaseClasses} text-xl w-24 text-center ${showMinError ? 'border-red-500 bg-red-50' : ''}`}
                    />
                    <div className="flex-grow flex flex-col items-center justify-center bg-gray-900 p-3 rounded-xl border-b-2 border-gray-700">
                      <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Subtotal</p>
                      <p className="text-xl font-black text-white">${total.toLocaleString()}</p>
                    </div>
                  </div>
                  {showMinError && (
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter px-1">⚠️ Mínimo 8 personas para el pedido.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Salsas: Elegí 6 ({formData.selectedSauces.length}/6)</label>
                  <button 
                    type="button" 
                    onClick={getAiHelp} 
                    disabled={loadingAi || !isValidPeopleCount} 
                    className="text-[8px] text-white font-black bg-orange-700 px-3 py-1.5 rounded-full shadow-md disabled:opacity-30"
                  >
                    {loadingAi ? '...' : '✨ SUGERENCIA'}
                  </button>
                </div>

                {aiRecommendation && (
                  <div className="p-4 bg-orange-50 rounded-2xl text-[11px] text-orange-900 border-l-4 border-orange-500 relative font-bold leading-normal shadow-sm">
                    <button onClick={() => setAiRecommendation(null)} className="absolute top-2 right-3 font-black text-orange-400 text-base">×</button>
                    {aiRecommendation}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {sauces.map((sauce) => (
                    <button 
                      key={sauce.id} 
                      type="button" 
                      onClick={() => handleSauceToggle(sauce.name)} 
                      disabled={formData.selectedSauces.length >= 6} 
                      className="p-3 text-[11px] border-2 border-gray-100 rounded-xl font-bold text-black bg-white hover:border-orange-500 transition-all flex justify-between items-center disabled:opacity-30 active:scale-95"
                    >
                      <span className="truncate">{sauce.name}</span>
                      <span className="text-orange-600 font-black">+</span>
                    </button>
                  ))}
                </div>

                {formData.selectedSauces.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    {formData.selectedSauces.map((name, idx) => (
                      <span key={idx} className="bg-white px-2.5 py-1 rounded-lg text-[9px] border border-orange-200 flex items-center gap-1.5 font-black text-gray-900 shadow-sm">
                        {name} 
                        <button type="button" onClick={() => removeSauce(idx)} className="text-red-500 font-black text-sm">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="button" 
                onClick={() => setStep(2)} 
                disabled={formData.selectedSauces.length !== 6 || !isValidPeopleCount} 
                className="w-full bg-orange-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-orange-800 transition active:scale-95 disabled:opacity-40"
              >
                CONTINUAR
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-50 pb-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Datos de Entrega</h2>
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Paso 2: Contacto</p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Fecha</label>
                    <input 
                      required 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]} 
                      value={formData.orderDate} 
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value, orderTime: '' })} 
                      className={inputBaseClasses} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Hora</label>
                    <select 
                      required 
                      disabled={!formData.orderDate} 
                      value={formData.orderTime} 
                      onChange={(e) => setFormData({ ...formData, orderTime: e.target.value })} 
                      className={inputBaseClasses}
                    >
                      <option value="">...</option>
                      {timeOptions.map(time => (
                        <option key={time} value={time} disabled={occupiedTimes.includes(time)}>
                          {time} {occupiedTimes.includes(time) ? '(X)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Nombre Completo</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Juan Pérez" 
                    value={formData.customerName} 
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} 
                    className={inputBaseClasses} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">WhatsApp / Celular</label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="351 123 4567" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    className={inputBaseClasses} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Dirección Exacta</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Calle 123, Barrio Centro" 
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    className={inputBaseClasses} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-800 py-3.5 rounded-xl font-black text-xs transition">ATRÁS</button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)} 
                  disabled={!formData.customerName || !formData.phone || !formData.address || !formData.orderDate || !formData.orderTime} 
                  className="flex-[2] bg-orange-700 text-white py-3.5 px-4 rounded-xl font-black text-sm shadow-md disabled:opacity-40"
                >
                  IR AL PAGO
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-50 pb-4 text-center">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Confirmación</h2>
                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Paso 3: Pago</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border-b-4 border-orange-700 space-y-4 shadow-lg">
                <div className="flex justify-between items-center">
                  <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Alias de Pago:</p>
                  <p className="text-[7px] text-white/50 uppercase font-bold">Toca para copiar</p>
                </div>
                <div 
                  className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer active:bg-white/10 transition-colors text-center"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.paymentAlias);
                    alert('¡Alias copiado!');
                  }}
                >
                  <p className="font-mono font-black text-lg text-white tracking-wider">{settings.paymentAlias}</p>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-white/5">
                  <p className="font-black text-gray-500 text-[10px] uppercase">A transferir:</p>
                  <p className="text-2xl font-black text-white leading-none">${total.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Sube el comprobante de pago</label>
                {!formData.paymentProofPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white transition-all">
                    <div className="flex flex-col items-center justify-center p-4">
                      <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ADJUNTAR FOTO</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-orange-600 shadow-lg group">
                    <img src={formData.paymentProofPreview} alt="Comprobante" className="w-full h-56 object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, paymentProof: null, paymentProofPreview: '' })} 
                      className="absolute top-3 right-3 bg-red-600 text-white w-9 h-9 rounded-full font-black text-xl shadow-md border-2 border-white"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-xl font-black text-xs transition">ATRÁS</button>
                <button 
                  type="submit" 
                  disabled={!formData.paymentProof || isSubmitting} 
                  className="flex-[2] bg-green-700 text-white py-4 px-4 rounded-xl font-black text-lg shadow-lg hover:bg-green-800 transition active:scale-95 disabled:opacity-40"
                >
                  {isSubmitting ? '...' : 'RESERVAR'}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
      
      <p className="text-center mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest">Metele Pata OS v2.6</p>
    </div>
  );
};

export default OrderForm;