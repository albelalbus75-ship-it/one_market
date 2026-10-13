import { supabase } from './supabase';

type Table = 'products' | 'customers' | 'invoices';

// طابور العمليات المعلقة (يُخزّن في localStorage)
const QUEUE_KEY = 'motagri_sync_queue';

interface QueuedOp {
  id: string;
  table: Table;
  op: 'upsert' | 'delete';
  payload: any;
  storeId: string;
  ts: number;
}

function loadQueue(): QueuedOp[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}
function saveQueue(q: QueuedOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export const sync = {
  // ← يُستدعى من StoreContext عند كل mutation
  push(table: Table, op: 'upsert' | 'delete', payload: any, storeId: string) {
    const queue = loadQueue();
    queue.push({
      id: crypto.randomUUID(),
      table, op, payload, storeId,
      ts: Date.now(),
    });
    saveQueue(queue);
    // حاول فوراً
    if (navigator.onLine) this.flush();
  },

  // ← يفرّغ الطابور للسيرفر
  async flush(): Promise<void> {
    if (!navigator.onLine) return;
    const queue = loadQueue();
    if (queue.length === 0) return;

    const remaining: QueuedOp[] = [];
    for (const item of queue) {
      try {
        if (item.op === 'upsert') {
          const { error } = await supabase
            .from(item.table)
            .upsert({ ...item.payload, store_id: item.storeId },
                    { onConflict: 'id' });
          if (error) throw error;
        } else {
          // soft delete
          const { error } = await supabase
            .from(item.table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.payload.id);
          if (error) throw error;
        }
      } catch {
        remaining.push(item);  // أبقِها للمحاولة القادمة
      }
    }
    saveQueue(remaining);
  },

  // ← يسحب البيانات من السيرفر عند تسجيل الدخول
  async pullInitial(storeId: string): Promise<{
    products: any[]; customers: any[]; invoices: any[];
  }> {
    const [p, c, i] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', storeId).is('deleted_at', null),
      supabase.from('customers').select('*').eq('store_id', storeId).is('deleted_at', null),
      supabase.from('invoices').select('*').eq('store_id', storeId).order('date', { ascending: false }).limit(500),
    ]);
    return {
      products: p.data || [],
      customers: c.data || [],
      invoices: i.data || [],
    };
  },

  // ← يستمع للتغييرات الحيّة من أجهزة أخرى
  subscribe(
    storeId: string,
    handlers: {
      onProduct?: (row: any) => void;
      onCustomer?: (row: any) => void;
      onInvoice?: (row: any) => void;
    }
  ) {
    const channel = supabase
      .channel(`store:${storeId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
        (p) => handlers.onProduct?.(p.new))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'customers', filter: `store_id=eq.${storeId}` },
        (p) => handlers.onCustomer?.(p.new))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoices', filter: `store_id=eq.${storeId}` },
        (p) => handlers.onInvoice?.(p.new))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },
};
