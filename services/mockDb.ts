
import { createClient } from '@supabase/supabase-js';
import { Order, OrderStatus, Sauce, Settings } from '../types';

/**
 * CONFIGURACIÓN DE VÍNCULO:
 * Se han actualizado las credenciales con los valores provistos por el usuario.
 */
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://btquwepipecmppbvwxdz.supabase.co';
const supabaseKey = (process.env as any).SUPABASE_ANON_KEY || 'sb_publishable_IvBCVxD_Yk1atqf9Kjl6wA_wOXph4q9';

// Verificamos si las claves son válidas
export const isCloudConnected = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'TU_URL_DE_SUPABASE' && 
  supabaseKey && 
  supabaseKey !== 'TU_ANON_KEY_DE_SUPABASE'
);

const supabase = isCloudConnected 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const INITIAL_SAUCES: Sauce[] = [
  { id: '1', name: 'Chimichurri', active: true },
  { id: '2', name: 'Mayonesa con Ajo', active: true },
  { id: '3', name: 'Salsa Criolla', active: true },
  { id: '4', name: 'Mostaza y Miel', active: true },
  { id: '5', name: 'Barbacoa', active: true },
  { id: '6', name: 'Picante Suave', active: true },
  { id: '7', name: 'Queso Azul', active: true },
  { id: '8', name: 'Cebollas Caramelizadas', active: true },
];

const getLocalData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const db = {
  getOrders: async (): Promise<Order[]> => {
    if (!supabase) {
      console.info("Info: Usando LocalStorage.");
      return getLocalData<Order[]>('pm_orders', []);
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapeo de snake_case (DB) a camelCase (App)
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
      console.error("Error al obtener pedidos de la nube:", err);
      return getLocalData<Order[]>('pm_orders', []);
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

    // Mapeo de camelCase (App) a snake_case (DB) para insertar
    const dbOrder = {
      id,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      people_count: order.peopleCount,
      total_price: order.totalPrice,
      order_date: order.orderDate,
      order_time: order.orderTime,
      status,
      payment_proof_url: order.paymentProofUrl,
      sauces: order.sauces
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([dbOrder])
      .select()
      .single();

    if (error) {
      console.error("Error al guardar en la nube, guardando localmente:", error);
      const fallbackOrder = { ...order, id, status, created_at: createdAt } as Order;
      const orders = getLocalData<Order[]>('pm_orders', []);
      setLocalData('pm_orders', [fallbackOrder, ...orders]);
      return fallbackOrder;
    }

    // Devolvemos el objeto mapeado de vuelta a camelCase para la App
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
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;
  },

  getSettings: async (): Promise<Settings> => {
    const defaultSettings: Settings = {
      pricePerPerson: 1200,
      paymentAlias: 'PATA.MASTER.PAGO',
      paymentCbu: '0000003100012345678901',
      adminPassword: 'admin123'
    };

    if (!supabase) return getLocalData<Settings>('pm_settings', defaultSettings);
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (error || !data) return defaultSettings;

      return {
        pricePerPerson: data.price_per_person,
        paymentAlias: data.payment_alias,
        paymentCbu: data.payment_cbu,
        adminPassword: data.admin_password || 'admin123'
      };
    } catch {
      return defaultSettings;
    }
  },

  saveSettings: async (settings: Settings): Promise<void> => {
    if (!supabase) {
      setLocalData('pm_settings', settings);
      return;
    }
    const dbSettings = {
      id: 1,
      price_per_person: settings.pricePerPerson,
      payment_alias: settings.paymentAlias,
      payment_cbu: settings.paymentCbu,
      admin_password: settings.adminPassword
    };
    const { error } = await supabase
      .from('settings')
      .upsert(dbSettings);
    
    if (error) throw error;
  },

  getSauces: async (): Promise<Sauce[]> => {
    if (!supabase) return getLocalData<Sauce[]>('pm_sauces', INITIAL_SAUCES);
    
    try {
      const { data, error } = await supabase
        .from('sauces')
        .select('*')
        .order('name');
      
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
    const { error } = await supabase
      .from('sauces')
      .upsert(sauces);
    
    if (error) throw error;
  },

  deleteSauce: async (id: string): Promise<void> => {
    if (!supabase) {
      const sauces = getLocalData<Sauce[]>('pm_sauces', INITIAL_SAUCES);
      const updated = sauces.filter(s => s.id !== id);
      setLocalData('pm_sauces', updated);
      return;
    }
    const { error } = await supabase
      .from('sauces')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
