import { supabase } from './supabase';
import type { Product, Customer, SaleInvoice, Supplier } from '../types';

type Table = 'products' | 'customers' | 'invoices' | 'suppliers' | 'vouchers'
           | 'treasury_accounts' | 'daily_closings' | 'journal_entries';

interface QueuedOp {
  id: string;
  table: Table;
  op: 'upsert' | 'delete';
  payload: any;
  storeId: string;
  ts: number;
}

const QUEUE_KEY = 'motagri_sync_queue';

function loadQueue(): QueuedOp[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}
function saveQueue(q: QueuedOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

// ═══ Converters: camelCase ↔ snake_case ═══
export const toProductRow = (p: Product) => ({
  id: p.id, name: p.name, code: p.code, barcode: p.barcode,
  category: p.category, base_unit: p.baseUnit,
  cost_price: p.costPrice, selling_price: p.sellingPrice,
  wholesale_price: p.wholesalePrice, stock_quantity: p.stockQuantity,
  min_stock_alert: p.minStockAlert, is_weighted: p.isWeighted,
  expiry_date: p.expiryDate || null, packagings: p.packagings,
  warehouse_stocks: p.warehouseStocks,
  updated_at: new Date().toISOString(),
});
export const fromProductRow = (r: any): Product => ({
  id: r.id, name: r.name, code: r.code || '', barcode: r.barcode || '',
  category: r.category || '', baseUnit: r.base_unit,
  costPrice: Number(r.cost_price), sellingPrice: Number(r.selling_price),
  wholesalePrice: Number(r.wholesale_price),
  stockQuantity: Number(r.stock_quantity),
  minStockAlert: Number(r.min_stock_alert),
  isWeighted: r.is_weighted, expiryDate: r.expiry_date || undefined,
  packagings: r.packagings || [], warehouseStocks: r.warehouse_stocks || {},
});

export const toCustomerRow = (c: Customer) => ({
  id: c.id, name: c.name, phone: c.phone, address: c.address,
  tax_number: c.taxNumber, balances: c.balances,
  credit_limit: c.creditLimit, price_tier: c.priceTier, notes: c.notes,
  updated_at: new Date().toISOString(),
});
export const fromCustomerRow = (r: any): Customer => ({
  id: r.id, name: r.name, phone: r.phone || '', address: r.address,
  taxNumber: r.tax_number, balances: r.balances || {},
  creditLimit: Number(r.credit_limit || 0), priceTier: r.price_tier || 'retail',
  notes: r.notes,
});

export const toSupplierRow = (s: Supplier) => ({
  id: s.id, name: s.name, phone: s.phone, company: s.company,
  tax_number: s.taxNumber, balance: s.balance, currency: s.currency,
  notes: s.notes, updated_at: new Date().toISOString(),
});
export const fromSupplierRow = (r: any): Supplier => ({
  id: r.id, name: r.name, phone: r.phone || '', company: r.company,
  taxNumber: r.tax_number, balance: Number(r.balance || 0),
  currency: r.currency || 'SAR', notes: r.notes,
});

export const toInvoiceRow = (inv: SaleInvoice) => ({
  id: inv.id, invoice_number: inv.invoiceNumber, date: inv.date,
  type: inv.type, customer_id: inv.customerId || null,
  customer_name: inv.customerName, items: inv.items,
  subtotal: inv.subtotal, discount: inv.discount, tax_amount: inv.taxAmount,
  total: inv.total, paid_amount: inv.paidAmount,
  remaining_amount: inv.remainingAmount, payment_method: inv.paymentMethod,
  currency: inv.currency, warehouse_id: inv.warehouseId,
  cashier_name: inv.cashierName, notes: inv.notes,
  updated_at: new Date().toISOString(),
});
export const fromInvoiceRow = (r: any): SaleInvoice => ({
  id: r.id, invoiceNumber: r.invoice_number, date: r.date, type: r.type,
  customerId: r.customer_id, customerName: r.customer_name,
  items: r.items || [], subtotal: Number(r.subtotal),
  discount: Number(r.discount), taxAmount: Number(r.tax_amount),
  total: Number(r.total), paidAmount: Number(r.paid_amount),
  remainingAmount: Number(r.remaining_amount),
  paymentMethod: r.payment_method, currency: r.currency,
  warehouseId: r.warehouse_id, cashierName: r.cashier_name, notes: r.notes,
});

// ═══ Public API ═══
export const sync = {
  getPendingCount: () => loadQueue().length,

  push(table: Table, op: 'upsert' | 'delete', payload: any, storeId: string) {
    const queue = loadQueue();
    queue.push({ id: crypto.randomUUID(), table, op, payload, storeId, ts: Date.now() });
    saveQueue(queue);
    if (navigator.onLine) this.flush();
  },

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
            .upsert({ ...item.payload, store_id: item.storeId }, { onConflict: 'id' });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(item.table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.payload.id);
          if (error) throw error;
        }
      } catch {
        remaining.push(item);
      }
    }
    saveQueue(remaining);
  },

  async pullInitial(storeId: string) {
    const [p, c, i, s] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', storeId).is('deleted_at', null),
      supabase.from('customers').select('*').eq('store_id', storeId).is('deleted_at', null),
      supabase.from('invoices').select('*').eq('store_id', storeId).order('date', { ascending: false }).limit(500),
      supabase.from('suppliers').select('*').eq('store_id', storeId).is('deleted_at', null),
    ]);
    return {
      products: p.data || [],
      customers: c.data || [],
      invoices: i.data || [],
      suppliers: s.data || [],
    };
  },

  subscribe(storeId: string, handlers: {
    onProduct?: (row: any) => void;
    onCustomer?: (row: any) => void;
    onInvoice?: (row: any) => void;
  }) {
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
