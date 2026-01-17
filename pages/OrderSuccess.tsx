
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../services/mockDb';
import { Order } from '../types';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      db.getOrderById(orderId).then(data => {
        setOrder(data);
        setLoading(false);
      });
    }
  }, [orderId]);

  const shareReceipt = () => {
    if (!order) return;

    const sauceList = order.sauces.map(s => `  🔸 *${s.sauceId}* (x${s.quantity})`).join('\n');
    
    const text = 
      `🔥 *METELE PATA - TICKET DIGITAL* 🔥\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🆔 *Pedido:* #${order.id}\n` +
      `👤 *Cliente:* ${order.customerName}\n` +
      `📞 *WhatsApp:* ${order.phone}\n\n` +
      `📅 *Fecha:* ${order.orderDate}\n` +
      `⏰ *Hora:* ${order.orderTime} hs\n` +
      `📍 *Dirección:* ${order.address}\n\n` +
      `👥 *Comensales:* ${order.peopleCount} personas\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🍯 *SALSAS ELEGIDAS:*\n` +
      `${sauceList}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL A PAGAR: $${order.totalPrice.toLocaleString()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✨ _¡Muchas gracias por tu compra!_\n` +
      `👨‍🍳 _Estamos preparando lo mejor para vos._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <div className="w-12 h-12 border-4 border-orange-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-orange-700 uppercase tracking-widest text-xs">Cargando comprobante...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight italic">¡Listo!</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Pedido Confirmado</p>
      </div>

      {order && (
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 mb-8 transform hover:scale-[1.01] transition-transform">
          {/* Header Ticket */}
          <div className="bg-gray-900 p-6 text-center border-b-4 border-orange-700">
            <h2 className="text-xl font-black italic text-white tracking-widest uppercase">Metele Pata</h2>
            <p className="text-orange-400 font-black text-[10px] mt-1">COMPROBANTE DIGITAL</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-200">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase">Orden</p>
                <p className="font-black text-gray-900 text-lg">#{order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase">Fecha</p>
                <p className="font-black text-gray-900">{order.orderDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Cliente</p>
                  <p className="font-bold text-gray-900 leading-tight">{order.customerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Entrega en</p>
                  <p className="font-bold text-gray-900 leading-tight">{order.address}</p>
                  <p className="text-[10px] font-black text-orange-700 mt-1 uppercase tracking-tighter">{order.orderTime} hs</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase">Cantidad</p>
                  <p className="font-bold text-gray-900">{order.peopleCount} personas</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-3 text-center">Detalle de Salsas</p>
              <div className="space-y-1">
                {order.sauces.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-700">{s.sauceId}</span>
                    <span className="font-black text-orange-700">x{s.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Total Pagado</p>
                <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">${order.totalPrice.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-200">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11h2v2H3v-2zm8 5h2v2h-2v-2zm-2-4h2v2H9v-2zm8 1h2v2h-2v-2zM4 4h6v6H4V4zm2 2v2h2V6H6zm8-2h6v6h-6V4zm2 2v2h2V6h-2zM4 14h6v6H4v-6zm2 2v2h2v-2H6zm10 0h2v2h-2v-2zm-4-4h2v2h-2v-2zm-2-4h2v2H9V6zm4 0h2v2h-2V6z"/></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={shareReceipt}
          className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition flex items-center justify-center gap-3 transform active:scale-95"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.554 4.197 1.608 6.022L0 24l6.117-1.605a11.803 11.803 0 005.925 1.577h.005c6.631 0 12.046-5.414 12.046-12.05 0-3.212-1.252-6.231-3.528-8.507z"/>
          </svg>
          COMPARTIR COMPROBANTE
        </button>

        <Link
          to="/"
          className="block w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-sm text-center tracking-widest uppercase hover:bg-gray-200 transition"
        >
          Hacer otro pedido
        </Link>
      </div>

      <div className="mt-12 p-6 bg-orange-50 rounded-[2rem] border-2 border-orange-100">
        <p className="text-sm text-orange-900 font-bold mb-1 text-center italic">¿Necesitas ayuda con tu pedido?</p>
        <a href="https://wa.me/5491100000000" className="text-orange-700 font-black text-lg hover:underline block text-center">
          WhatsApp Soporte
        </a>
      </div>
      
      <p className="text-center mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest italic">Metele Pata OS • v3.1.1</p>
    </div>
  );
};

export default OrderSuccess;
