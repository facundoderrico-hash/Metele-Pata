import { createClient } from '@supabase/supabase-js';
import { Order, OrderStatus, Sauce, Settings } from '../types';

/**
 * CONFIGURACIÓN DE BASE DE DATOS:
 * Prioriza las variables inyectadas en el shim del index.html.
 */
const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || 'https://btquwepipecmppbvwxdz.supabase.co';
const supabaseKey = (window as any).process?.env?.SUPABASE_ANON_KEY || 'sb_publishable_IvBCVxD_Yk1atqf9Kjl6wA_wOXph4q9';

// Detección de conexión: Es true si tenemos las credenciales mínimas.
export const isCloudConnected = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  supabaseKey && 
  supabaseKey.length > 20
);

const supabase = isCloudConnected 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const INITIAL_SAUCES: Sauce[] = [
  { id: 'sauce-1', name: 'Chimichurri', active: true },
  { id: 'sauce-2', name: 'Mayonesa con Ajo', active: true },
  { id: 'sauce-3', name: 'Salsa Criolla', active: true },
  { id: 'sauce-4', name: 'Mostaza y Miel', active: true },
  { id: 'sauce-5', name: 'Barbacoa', active: true },
  { id: 'sauce-6', name: 'Picante Suave', active: true },
  { id: 'sauce-7', name: 'Queso Azul', active: true },
  { id: 'sauce-8', name: 'Cebollas Caramelizadas', active: true },
];

const getLocalData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  getOrders: async (): Promise<Order[]> => {
    if (!supabase) return getLocalData<Order[]>('pm_orders', []);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(o => ({
        id: o.id,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        peopleCount: o.people_count,
        totalPrice: o.total_price,
        orderDate: o.order_date,
        orderTime: o.order_time,
        status: o.status as OrderStatus,
        paymentProofUrl: o.payment_proof_url,
        sauces: o.sauces,
        created_at: o.created_at
      }));
    } catch (err) {
      console.error("Error al obtener pedidos:", err);
      return getLocalData<Order[]>('pm_orders', []);
    }
  },

  getOrderById: async (id: string): Promise<Order | null> => {
    if (!supabase) {
      const orders = getLocalData<Order[]>('pm_orders', []);
      return orders.find(o => o.id === id) || null;
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        customerName: data.customer_name,
        phone: data.phone,
        address: data.address,
        peopleCount: data.people_count,
        totalPrice: data.total_price,
        orderDate: data.order_date,
        orderTime: data.order_time,
        status: data.status as OrderStatus,
        paymentProofUrl: data.payment_proof_url,
        sauces: data.sauces,
        created_at: data.created_at
      };
    } catch (err) {
      console.error("Error al obtener pedido:", err);
      return null;
    }
  },
  
  saveOrder: async (order: Omit<Order, 'id' | 'created_at' | 'status'>): Promise<Order> => {
    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const status = OrderStatus.PENDING;
    const createdAt = new Date().toISOString();

    if (!supabase) {
      const newOrder = { ...order, id, status, created_at: createdAt } as Order;
      const orders = getLocalData<Order[]>('pm_orders', []);
      setLocalData('pm_orders', [newOrder, ...orders]);
      return newOrder;
    }

    const dbOrder = {
      id,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      people_count: Number(order.peopleCount),
      total_price: Number(order.totalPrice),
      order_date: order.orderDate,
      order_time: order.orderTime,
      status,
      payment_proof_url: order.paymentProofUrl,
      sauces: order.sauces
    };

    const { data, error } = await supabase.from('orders').insert([dbOrder]).select().single();
    if (error) throw error;
    return {
      id: data.id,
      customerName: data.customer_name,
      phone: data.phone,
      address: data.address,
      peopleCount: data.people_count,
      totalPrice: data.total_price,
      orderDate: data.order_date,
      orderTime: data.order_time,
      status: data.status,
      paymentProofUrl: data.payment_proof_url,
      sauces: data.sauces,
      created_at: data.created_at
    };
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    if (!supabase) {
      const orders = getLocalData<Order[]>('pm_orders', []);
      const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
      setLocalData('pm_orders', updated);
      return;
    }
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  },

  getSettings: async (): Promise<Settings> => {
    const defaultSettings: Settings = {
      pricePerPerson: 12500,
      paymentAlias: 'PATA.MASTER.PAGO',
      paymentCbu: '',
      adminPassword: 'admin123'
    };

    const localPass = localStorage.getItem('pm_admin_pass') || 'admin123';

    if (!supabase) return { ...getLocalData<Settings>('pm_settings', defaultSettings), adminPassword: localPass };
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('price_per_person, payment_alias, payment_cbu')
        .eq('id', 1)
        .maybeSingle();
      
      if (error || !data) return { ...defaultSettings, adminPassword: localPass };

      return {
        pricePerPerson: Number(data.price_per_person),
        paymentAlias: data.payment_alias,
        paymentCbu: data.payment_cbu,
        adminPassword: localPass
      };
    } catch {
      return { ...defaultSettings, adminPassword: localPass };
    }
  },

  saveSettings: async (settings: Settings): Promise<void> => {
    if (settings.adminPassword) {
      localStorage.setItem('pm_admin_pass', settings.adminPassword);
    }

    if (!supabase) {
      setLocalData('pm_settings', settings);
      return;
    }

    const dbSettings = {
      id: 1,
      price_per_person: Number(settings.pricePerPerson),
      payment_alias: settings.paymentAlias,
      payment_cbu: settings.paymentCbu
    };
    
    const { error } = await supabase
      .from('settings')
      .upsert(dbSettings, { onConflict: 'id' });
    
    if (error) throw error;
  },

  getSauces: async (): Promise<Sauce[]> => {
    if (!supabase) return getLocalData<Sauce[]>('pm_sauces', INITIAL_SAUCES);
    try {
      const { data, error } = await supabase.from('sauces').select('*').order('name');
      if (error || !data || data.length === 0) return INITIAL_SAUCES;
      return data;
    } catch {
      return INITIAL_SAUCES;
    }
  },

  saveSauces: async (sauces: Sauce[]): Promise<void> => {
    if (!supabase) {
      setLocalData('pm_sauces', sauces);
      return;
    }
    
    const newSauces = sauces
      .filter(s => s.id.startsWith('temp-'))
      .map(({ id, ...rest }) => rest);
      
    const existingSauces = sauces.filter(s => !s.id.startsWith('temp-'));

    if (newSauces.length > 0) {
      const { error: insertError } = await supabase.from('sauces').insert(newSauces);
      if (insertError) throw insertError;
    }

    if (existingSauces.length > 0) {
      const { error: upsertError } = await supabase.from('sauces').upsert(existingSauces);
      if (upsertError) throw upsertError;
    }
  },

  deleteSauce: async (id: string): Promise<void> => {
    if (!supabase) {
      const sauces = getLocalData<Sauce[]>('pm_sauces', INITIAL_SAUCES);
      const updated = sauces.filter(s => s.id !== id);
      setLocalData('pm_sauces', updated);
      return;
    }
    const { error } = await supabase.from('sauces').delete().eq('id', id);
    if (error) throw error;
  }
};