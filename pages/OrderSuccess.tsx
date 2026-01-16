
import React from 'react';
import { useParams, Link } from 'react-router-dom';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const shareWithFriends = () => {
    const text = `¡Acabo de pedir una Pata Flambeada en PataMaster! Mi pedido es el #${orderId}. Pide la tuya acá: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-200">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">¡Éxito Total!</h1>
      <p className="text-lg text-gray-800 font-medium mb-10 leading-relaxed">
        Tu pedido <span className="font-black text-orange-700 bg-orange-50 px-2 py-1 rounded">#{orderId}</span> ha sido registrado. 
        Validaremos tu pago y te avisaremos por WhatsApp.
      </p>
      <div className="space-y-4">
        <Link
          to="/"
          className="block w-full bg-orange-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-orange-800 transition transform hover:-translate-y-1"
        >
          Hacer otro pedido
        </Link>
        <button
          onClick={shareWithFriends}
          className="block w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.554 4.197 1.608 6.022L0 24l6.117-1.605a11.803 11.803 0 005.925 1.577h.005c6.631 0 12.046-5.414 12.046-12.05 0-3.212-1.252-6.231-3.528-8.507z"/>
          </svg>
          Recomendar a amigos
        </button>
        <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-700 font-bold mb-1">¿Necesitas ayuda?</p>
          <a href="https://wa.me/5491100000000" className="text-orange-800 font-black text-lg hover:underline block">
            WhatsApp de Soporte
          </a>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
