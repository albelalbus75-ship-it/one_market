import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Warehouse,
  Customer,
  Supplier,
  TreasuryAccount,
  Currency,
  StoreSettings,
  UserStaff,
  SaleInvoice,
  SaleItem,
  PurchaseInvoice,
  PurchaseItem,
  StockTransfer,
  Voucher,
  JournalEntry,
  DailyClosing,
  PaymentMethod,
} from '../types';
import {
  initialProducts,
  initialWarehouses,
  initialCustomers,
  initialSuppliers,
  initialTreasuryAccounts,
  initialCurrencies,
  initialSettings,
  initialStaff,
  initialInvoices,
  initialJournalEntries,
} from '../data/initialData';
import { posAudio } from '../utils/audio';

interface CartItem extends SaleItem {
  maxStock: number;
}

interface StoreContextType {
  // Store info & active state
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  staff: UserStaff[];
  currentStaff: UserStaff;
  setCurrentStaff: (staff: UserStaff) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  unlockWithPin: (pin: string) => boolean;
  warehouses: Warehouse[];
  activeWarehouseId: string;
  setActiveWarehouseId: (id: string) => void;
  
  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, newStock: number, reason: string) => void;
  
  // Warehouses & Transfers
  transfers: StockTransfer[];
  createTransfer: (fromWarehouseId: string, toWarehouseId: string, items: { productId: string; quantity: number }[], notes?: string) => boolean;
  updateTransferStatus: (transferId: string, status: StockTransfer['status']) => void;

  // POS & Sales
  cart: CartItem[];
  addToCart: (product: Product, packagingId?: string, quantity?: number, isReturn?: boolean, customPrice?: number) => void;
  updateCartItemQty: (index: number, qty: number) => void;
  updateCartItemDiscount: (index: number, discount: number) => void;
  updateCartItemPrice: (index: number, price: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  salePriceTier: 'retail' | 'wholesale';
  setSalePriceTier: (tier: 'retail' | 'wholesale') => void;
  invoices: SaleInvoice[];
  processSale: (
    paymentMethod: PaymentMethod,
    paidAmount: number,
    notes?: string
  ) => SaleInvoice | null;
  lastInvoice: SaleInvoice | null;
  setLastInvoice: (inv: SaleInvoice | null) => void;

  // Customers & Debt
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'balances'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  collectDebt: (customerId: string, amount: number, currency: string, treasuryAccountId: string, notes?: string) => Voucher;

  // Suppliers & Purchases
  suppliers: Supplier[];
  addSupplier: (supp: Omit<Supplier, 'id' | 'balance'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  purchases: PurchaseInvoice[];
  createPurchaseInvoice: (
    supplierId: string,
    items: PurchaseItem[],
    paymentMethod: PaymentMethod,
    paidAmount: number,
    currency?: string,
    notes?: string
  ) => PurchaseInvoice;
  paySupplierVoucher: (supplierId: string, amount: number, currency: string, treasuryAccountId: string, notes?: string) => Voucher;
  settleOffset: (customerId: string, supplierId: string, amount: number, notes?: string) => void;

  // Currencies & Treasury
  currencies: Currency[];
  treasuryAccounts: TreasuryAccount[];
  transferTreasury: (fromId: string, toId: string, amount: number, notes?: string) => void;
  exchangeCurrency: (fromId: string, toId: string, fromAmount: number, toAmount: number, exchangeRate: number, notes?: string) => void;
  vouchers: Voucher[];

  // Daily Closing & Shifts
  currentDailyClosing: DailyClosing | null;
  dailyClosings: DailyClosing[];
  performDailyClosing: (billDenominations: Record<string, number>, notes?: string) => DailyClosing;
  openNewShift: (openingCash: number) => void;

  // Journal & Accounting
  journalEntries: JournalEntry[];

  // System & Cloud Sync
  cloudSync: () => Promise<boolean>;
  exportBackup: () => string;
  importBackup: (jsonData: string) => boolean;
  resetAllData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  SETTINGS: 'motagri_settings',
  PRODUCTS: 'motagri_products',
  WAREHOUSES: 'motagri_warehouses',
  TRANSFERS: 'motagri_transfers',
  CUSTOMERS: 'motagri_customers',
  SUPPLIERS: 'motagri_suppliers',
  CURRENCIES: 'motagri_currencies',
  TREASURY: 'motagri_treasury',
  STAFF: 'motagri_staff',
  INVOICES: 'motagri_invoices',
  PURCHASES: 'motagri_purchases',
  VOUCHERS: 'motagri_vouchers',
  JOURNAL: 'motagri_journal',
  CLOSINGS: 'motagri_closings',
  ACTIVE_CLOSING: 'motagri_active_closing',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store base state
  const [settings, setSettings] = useState<StoreSettings>(() => loadStored(STORAGE_KEYS.SETTINGS, initialSettings));
  const [staff] = useState<UserStaff[]>(() => loadStored(STORAGE_KEYS.STAFF, initialStaff));
  const [currentStaff, setCurrentStaff] = useState<UserStaff>(staff[0]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [warehouses] = useState<Warehouse[]>(() => loadStored(STORAGE_KEYS.WAREHOUSES, initialWarehouses));
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(warehouses[0]?.id || 'w1');

  // Products
  const [products, setProducts] = useState<Product[]>(() => loadStored(STORAGE_KEYS.PRODUCTS, initialProducts));
  const [transfers, setTransfers] = useState<StockTransfer[]>(() => loadStored(STORAGE_KEYS.TRANSFERS, []));

  // Customers & Suppliers
  const [customers, setCustomers] = useState<Customer[]>(() => loadStored(STORAGE_KEYS.CUSTOMERS, initialCustomers));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored(STORAGE_KEYS.SUPPLIERS, initialSuppliers));

  // Currencies & Treasury
  const [currencies] = useState<Currency[]>(() => loadStored(STORAGE_KEYS.CURRENCIES, initialCurrencies));
  const [treasuryAccounts, setTreasuryAccounts] = useState<TreasuryAccount[]>(() => loadStored(STORAGE_KEYS.TREASURY, initialTreasuryAccounts));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => loadStored(STORAGE_KEYS.VOUCHERS, []));

  // POS cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [salePriceTier, setSalePriceTier] = useState<'retail' | 'wholesale'>('retail');
  const [invoices, setInvoices] = useState<SaleInvoice[]>(() => loadStored(STORAGE_KEYS.INVOICES, initialInvoices));
  const [lastInvoice, setLastInvoice] = useState<SaleInvoice | null>(invoices[0] || null);

  // Purchases
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => loadStored(STORAGE_KEYS.PURCHASES, []));

  // Closings & Shift
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>(() => loadStored(STORAGE_KEYS.CLOSINGS, []));
  const [currentDailyClosing, setCurrentDailyClosing] = useState<DailyClosing | null>(() => {
    const saved = loadStored<DailyClosing | null>(STORAGE_KEYS.ACTIVE_CLOSING, null);
    if (saved) return saved;
    // Default open shift
    return {
      id: 'shift-' + Date.now(),
      closingNumber: 'CLS-2026-001',
      date: new Date().toISOString().split('T')[0],
      shiftStartTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      shiftEndTime: '',
      cashierName: staff[0]?.name || 'الكاشير',
      openingCash: 500,
      totalCashSales: 0,
      totalCreditSales: 0,
      totalBankSales: 0,
      totalReturns: 0,
      totalCashCollected: 0,
      totalCashExpenses: 0,
      expectedCash: 500,
      actualCashCount: 500,
      cashDifference: 0,
      billDenominations: { '100': 3, '50': 2, '10': 10 },
      isClosed: false,
    };
  });

  // Journal entries
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => loadStored(STORAGE_KEYS.JOURNAL, initialJournalEntries));

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TREASURY, JSON.stringify(treasuryAccounts));
  }, [treasuryAccounts]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }, [transfers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));
  }, [vouchers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLOSINGS, JSON.stringify(dailyClosings));
  }, [dailyClosings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLOSING, JSON.stringify(currentDailyClosing));
  }, [currentDailyClosing]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Unlock with PIN
  const unlockWithPin = (pin: string): boolean => {
    const found = staff.find((s) => s.pin === pin);
    if (found) {
      setCurrentStaff(found);
      setIsLocked(false);
      posAudio.playClick();
      return true;
    }
    posAudio.playErrorBuzz();
    return false;
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Product management
  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...p,
      id: 'p-' + Date.now(),
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (productId: string, newStock: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const diff = newStock - prod.stockQuantity;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const wStocks = { ...p.warehouseStocks, [activeWarehouseId]: newStock };
          return { ...p, stockQuantity: newStock, warehouseStocks: wStocks };
        }
        return p;
      })
    );
    // Double entry for inventory adjustment
    if (diff !== 0) {
      const val = Math.abs(diff) * prod.costPrice;
      const isIncrease = diff > 0;
      const entry: JournalEntry = {
        id: 'je-' + Date.now(),
        entryNumber: `JE-ADJ-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString(),
        description: `تسوية جرد بضاعة: ${prod.name} (${reason})`,
        lines: [
          { accountId: '120', accountName: 'المخزون السلعي', debit: isIncrease ? val : 0, credit: !isIncrease ? val : 0 },
          { accountId: '520', accountName: isIncrease ? 'أرباح تسوية جرد' : 'خسائر تسوية جرد وتالف', debit: !isIncrease ? val : 0, credit: isIncrease ? val : 0 },
        ],
      };
      setJournalEntries((prev) => [entry, ...prev]);
    }
  };

  // Transfers
  const createTransfer = (
    fromWarehouseId: string,
    toWarehouseId: string,
    items: { productId: string; quantity: number }[],
    notes?: string
  ): boolean => {
    if (fromWarehouseId === toWarehouseId) return false;
    // Check if sufficient stock in fromWarehouse
    for (const it of items) {
      const p = products.find((prod) => prod.id === it.productId);
      const available = p?.warehouseStocks[fromWarehouseId] ?? 0;
      if (available < it.quantity) {
        posAudio.playErrorBuzz();
        return false;
      }
    }

    const transferItems = items.map((it) => {
      const p = products.find((prod) => prod.id === it.productId)!;
      return {
        productId: it.productId,
        productName: p.name,
        quantity: it.quantity,
        unit: p.baseUnit,
      };
    });

    const newTransfer: StockTransfer = {
      id: 'tr-' + Date.now(),
      transferNumber: `TR-${new Date().getFullYear()}-${(transfers.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString(),
      fromWarehouseId,
      toWarehouseId,
      items: transferItems,
      status: 'pending',
      notes,
      createdByName: currentStaff.name,
    };

    setTransfers((prev) => [newTransfer, ...prev]);
    posAudio.playSuccessChime();
    return true;
  };

  const updateTransferStatus = (transferId: string, newStatus: StockTransfer['status']) => {
    const tr = transfers.find((t) => t.id === transferId);
    if (!tr || tr.status === newStatus) return;

    if (newStatus === 'received' && tr.status !== 'received') {
      // Execute the actual movement of inventory
      setProducts((prev) =>
        prev.map((p) => {
          const item = tr.items.find((it) => it.productId === p.id);
          if (item) {
            const fromStock = (p.warehouseStocks[tr.fromWarehouseId] || 0) - item.quantity;
            const toStock = (p.warehouseStocks[tr.toWarehouseId] || 0) + item.quantity;
            return {
              ...p,
              warehouseStocks: {
                ...p.warehouseStocks,
                [tr.fromWarehouseId]: Math.max(0, fromStock),
                [tr.toWarehouseId]: toStock,
              },
            };
          }
          return p;
        })
      );
    }

    setTransfers((prev) => prev.map((t) => (t.id === transferId ? { ...t, status: newStatus } : t)));
    posAudio.playSuccessChime();
  };

  // Customers
  const addCustomer = (cust: Omit<Customer, 'id' | 'balances'>) => {
    const newCust: Customer = {
      ...cust,
      id: 'c-' + Date.now(),
      balances: { [settings.baseCurrency]: 0 },
    };
    setCustomers((prev) => [newCust, ...prev]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Debt collection
  const collectDebt = (
    customerId: string,
    amount: number,
    currency: string,
    treasuryAccountId: string,
    notes?: string
  ): Voucher => {
    const cust = customers.find((c) => c.id === customerId);
    const voucher: Voucher = {
      id: 'v-' + Date.now(),
      voucherNumber: `RCV-${Date.now().toString().slice(-5)}`,
      type: 'receipt',
      date: new Date().toISOString(),
      partyType: 'customer',
      partyId: customerId,
      partyName: cust?.name || 'عميل',
      amount,
      currency,
      treasuryAccountId,
      notes: notes || 'سداد دفعة من الحساب / دين العميل',
      createdByName: currentStaff.name,
    };

    // Update customer balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const curBal = c.balances[currency] || 0;
          return {
            ...c,
            balances: {
              ...c.balances,
              [currency]: curBal - amount,
            },
          };
        }
        return c;
      })
    );

    // Update treasury account balance
    setTreasuryAccounts((prev) =>
      prev.map((t) => (t.id === treasuryAccountId ? { ...t, balance: t.balance + amount } : t))
    );

    // Add to daily shift if cash
    if (currentDailyClosing) {
      setCurrentDailyClosing((prev) =>
        prev
          ? {
              ...prev,
              totalCashCollected: prev.totalCashCollected + amount,
              expectedCash: prev.expectedCash + amount,
            }
          : null
      );
    }

    // Double entry
    const entry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: `JE-RCV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      description: `سند قبض نقدية من العميل: ${cust?.name}`,
      lines: [
        { accountId: '101', accountName: 'الصندوق / الحساب المستلم', debit: amount, credit: 0 },
        { accountId: '130', accountName: `ذمم مدينة (العميل: ${cust?.name})`, debit: 0, credit: amount },
      ],
    };
    setJournalEntries((prev) => [entry, ...prev]);
    setVouchers((prev) => [voucher, ...prev]);

    posAudio.playSuccessChime();
    return voucher;
  };

  // Suppliers & Purchases
  const addSupplier = (supp: Omit<Supplier, 'id' | 'balance'>) => {
    const newSupp: Supplier = {
      ...supp,
      id: 's-' + Date.now(),
      balance: 0,
      currency: settings.baseCurrency,
    };
    setSuppliers((prev) => [newSupp, ...prev]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const createPurchaseInvoice = (
    supplierId: string,
    items: PurchaseItem[],
    paymentMethod: PaymentMethod,
    paidAmount: number,
    currency = settings.baseCurrency,
    notes?: string
  ): PurchaseInvoice => {
    const supp = suppliers.find((s) => s.id === supplierId);
    const subtotal = items.reduce((acc, it) => acc + it.total, 0);
    const taxAmount = settings.isTaxEnabled ? subtotal * settings.taxRate : 0;
    const total = subtotal + taxAmount;
    const remainingAmount = Math.max(0, total - paidAmount);

    const invoice: PurchaseInvoice = {
      id: 'pur-' + Date.now(),
      invoiceNumber: `PUR-${new Date().getFullYear()}-${(purchases.length + 1).toString().padStart(4, '0')}`,
      date: new Date().toISOString(),
      supplierId,
      supplierName: supp?.name || 'مورد عام',
      items,
      subtotal,
      taxAmount,
      total,
      paidAmount,
      remainingAmount,
      warehouseId: activeWarehouseId,
      paymentMethod,
      currency,
      notes,
    };

    // Update stock & weighted average cost for each item
    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((it) => it.productId === p.id);
        if (item) {
          const currentTotalCost = p.stockQuantity * p.costPrice;
          const newTotalCost = currentTotalCost + item.total;
          const newQty = p.stockQuantity + item.quantity;
          const newAvgCost = newQty > 0 ? Number((newTotalCost / newQty).toFixed(2)) : item.costPrice;

          const currentWarehouseStock = p.warehouseStocks[activeWarehouseId] || 0;
          return {
            ...p,
            stockQuantity: newQty,
            costPrice: newAvgCost,
            warehouseStocks: {
              ...p.warehouseStocks,
              [activeWarehouseId]: currentWarehouseStock + item.quantity,
            },
          };
        }
        return p;
      })
    );

    // Update supplier balance if remaining > 0
    if (remainingAmount > 0) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, balance: s.balance + remainingAmount } : s))
      );
    }

    // Update treasury account if paid
    if (paidAmount > 0) {
      const treasuryId = paymentMethod === 'cash' ? 't1' : 't2';
      setTreasuryAccounts((prev) =>
        prev.map((t) => (t.id === treasuryId ? { ...t, balance: t.balance - paidAmount } : t))
      );
      if (currentDailyClosing && paymentMethod === 'cash') {
        setCurrentDailyClosing((prev) =>
          prev
            ? {
                ...prev,
                totalCashExpenses: prev.totalCashExpenses + paidAmount,
                expectedCash: prev.expectedCash - paidAmount,
              }
            : null
        );
      }
    }

    // Double entry for purchase
    const entry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: `JE-PUR-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      description: `فاتورة مشتريات رقم ${invoice.invoiceNumber} من ${supp?.name}`,
      lines: [
        { accountId: '120', accountName: 'المخزون السلعي (مشتريات)', debit: subtotal, credit: 0 },
        ...(taxAmount > 0 ? [{ accountId: '140', accountName: 'ضريبة القيمة المضافة مدخلات', debit: taxAmount, credit: 0 }] : []),
        ...(paidAmount > 0 ? [{ accountId: '101', accountName: 'الصندوق / البنك', debit: 0, credit: paidAmount }] : []),
        ...(remainingAmount > 0 ? [{ accountId: '201', accountName: `ذمم دائنة (المورد: ${supp?.name})`, debit: 0, credit: remainingAmount }] : []),
      ],
    };
    setJournalEntries((prev) => [entry, ...prev]);
    setPurchases((prev) => [invoice, ...prev]);

    posAudio.playSuccessChime();
    return invoice;
  };

  const paySupplierVoucher = (
    supplierId: string,
    amount: number,
    currency: string,
    treasuryAccountId: string,
    notes?: string
  ): Voucher => {
    const supp = suppliers.find((s) => s.id === supplierId);
    const voucher: Voucher = {
      id: 'v-' + Date.now(),
      voucherNumber: `PAY-${Date.now().toString().slice(-5)}`,
      type: 'payment',
      date: new Date().toISOString(),
      partyType: 'supplier',
      partyId: supplierId,
      partyName: supp?.name || 'مورد',
      amount,
      currency,
      treasuryAccountId,
      notes: notes || 'سداد دفعة للمورد',
      createdByName: currentStaff.name,
    };

    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, balance: Math.max(0, s.balance - amount) } : s))
    );

    setTreasuryAccounts((prev) =>
      prev.map((t) => (t.id === treasuryAccountId ? { ...t, balance: t.balance - amount } : t))
    );

    if (currentDailyClosing) {
      setCurrentDailyClosing((prev) =>
        prev
          ? {
              ...prev,
              totalCashExpenses: prev.totalCashExpenses + amount,
              expectedCash: prev.expectedCash - amount,
            }
          : null
      );
    }

    const entry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: `JE-PAY-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      description: `سند صرف للمورد: ${supp?.name}`,
      lines: [
        { accountId: '201', accountName: `ذمم دائنة (المورد: ${supp?.name})`, debit: amount, credit: 0 },
        { accountId: '101', accountName: 'الصندوق / الحساب المسدد منه', debit: 0, credit: amount },
      ],
    };
    setJournalEntries((prev) => [entry, ...prev]);
    setVouchers((prev) => [voucher, ...prev]);

    posAudio.playSuccessChime();
    return voucher;
  };

  // Offset settlement (المقاصة بين عميل ومورد)
  const settleOffset = (customerId: string, supplierId: string, amount: number, notes?: string) => {
    const cust = customers.find((c) => c.id === customerId);
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!cust || !supp) return;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const curBal = c.balances[settings.baseCurrency] || 0;
          return {
            ...c,
            balances: {
              ...c.balances,
              [settings.baseCurrency]: curBal - amount,
            },
          };
        }
        return c;
      })
    );

    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, balance: Math.max(0, s.balance - amount) } : s))
    );

    const entry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: `JE-OFFSET-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      description: `تسوية مقاصة بين العميل (${cust.name}) والمورد (${supp.name}) - ${notes || ''}`,
      lines: [
        { accountId: '201', accountName: `ذمم دائنة (المورد: ${supp.name})`, debit: amount, credit: 0 },
        { accountId: '130', accountName: `ذمم مدينة (العميل: ${cust.name})`, debit: 0, credit: amount },
      ],
    };
    setJournalEntries((prev) => [entry, ...prev]);
    posAudio.playSuccessChime();
  };

  // Treasury transfers
  const transferTreasury = (fromId: string, toId: string, amount: number, notes?: string) => {
    setTreasuryAccounts((prev) =>
      prev.map((t) => {
        if (t.id === fromId) return { ...t, balance: t.balance - amount };
        if (t.id === toId) return { ...t, balance: t.balance + amount };
        return t;
      })
    );

    const fromAcc = treasuryAccounts.find((t) => t.id === fromId);
    const toAcc = treasuryAccounts.find((t) => t.id === toId);

    const entry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: `JE-TRF-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      description: `تحويل نقدية من [${fromAcc?.name}] إلى [${toAcc?.name}] - ${notes || ''}`,
      lines: [
        { accountId: '101', accountName: toAcc?.name || 'الحساب المحول إليه', debit: amount, credit: 0 },
        { accountId: '101', accountName: fromAcc?.name || 'الحساب المحول منه', debit: 0, credit: amount },
      ],
    };
    setJournalEntries((prev) => [entry, ...prev]);
    posAudio.playSuccessChime();
  };

  const exchangeCurrency = (
    fromId: string,
    toId: string,
    fromAmount: number,
    toAmount: number,
    exchangeRate: number,
    notes?: string
  ) => {
    setTreasuryAccounts((prev) =>
      prev.map((t) => {
        if (t.id === fromId) return { ...t, balance: t.balance - fromAmount };
        if (t.id === toId) return { ...t, balance: t.balance + toAmount };
        return t;
      })
    );
    posAudio.playSuccessChime();
  };

  // POS Cart management
  const addToCart = (
    product: Product,
    packagingId?: string,
    quantity = 1,
    isReturn = false,
    customPrice?: number
  ) => {
    posAudio.playScanBeep();
    const pkg = product.packagings.find((p) => p.id === packagingId);
    const conversionFactor = pkg ? pkg.conversionFactor : 1;
    const unitName = pkg ? pkg.name : product.baseUnit === 'kg' ? 'كجم' : product.baseUnit === 'g' ? 'غرام' : 'قطعة';
    
    // Determine price based on priceTier or packaging
    let basePrice = product.sellingPrice;
    if (pkg) {
      basePrice = salePriceTier === 'wholesale' ? pkg.wholesalePrice : pkg.sellingPrice;
    } else {
      basePrice = salePriceTier === 'wholesale' ? product.wholesalePrice : product.sellingPrice;
    }
    const finalPrice = customPrice !== undefined ? customPrice : basePrice;

    setCart((prev) => {
      // Find existing item with same packaging and return status
      const existingIdx = prev.findIndex(
        (it) => it.productId === product.id && it.packagingId === packagingId && it.isReturn === isReturn
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = existing.quantity + quantity;
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          subtotal: Number((newQty * existing.unitPrice - existing.discount).toFixed(2)),
        };
        return updated;
      }

      const availableStock = product.warehouseStocks[activeWarehouseId] ?? product.stockQuantity;
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        barcode: pkg ? pkg.barcode : product.barcode,
        packagingId,
        unitName,
        conversionFactor,
        quantity,
        isWeighted: product.isWeighted,
        unitPrice: finalPrice,
        costPrice: product.costPrice * conversionFactor,
        discount: 0,
        subtotal: Number((quantity * finalPrice).toFixed(2)),
        isReturn,
        maxStock: availableStock,
      };

      return [newItem, ...prev];
    });
  };

  const updateCartItemQty = (index: number, qty: number) => {
    posAudio.playClick();
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      updated[index] = {
        ...item,
        quantity: qty,
        subtotal: Number((qty * item.unitPrice - item.discount).toFixed(2)),
      };
      return updated;
    });
  };

  const updateCartItemDiscount = (index: number, discount: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      const safeDiscount = Math.max(0, Math.min(item.quantity * item.unitPrice, discount));
      updated[index] = {
        ...item,
        discount: safeDiscount,
        subtotal: Number((item.quantity * item.unitPrice - safeDiscount).toFixed(2)),
      };
      return updated;
    });
  };

  const updateCartItemPrice = (index: number, price: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      updated[index] = {
        ...item,
        unitPrice: price,
        subtotal: Number((item.quantity * price - item.discount).toFixed(2)),
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    posAudio.playClick();
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    posAudio.playClick();
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomerId(null);
  };

  // Process POS checkout
  const processSale = (
    paymentMethod: PaymentMethod,
    paidAmount: number,
    notes?: string
  ): SaleInvoice | null => {
    if (cart.length === 0) return null;

    const hasReturns = cart.some((it) => it.isReturn);
    const hasSales = cart.some((it) => !it.isReturn);
    let invoiceType: SaleInvoice['type'] = 'sale';
    if (hasReturns && hasSales) invoiceType = 'exchange';
    else if (hasReturns && !hasSales) invoiceType = 'return';

    // Calculate subtotal
    const subtotal = cart.reduce((acc, it) => {
      const sign = it.isReturn ? -1 : 1;
      return acc + it.subtotal * sign;
    }, 0);

    const taxAmount = settings.isTaxEnabled && subtotal > 0 ? Number((subtotal * settings.taxRate).toFixed(2)) : 0;
    const total = Math.max(0, Number((subtotal + taxAmount - cartDiscount).toFixed(2)));
    const remainingAmount = paymentMethod === 'credit' ? total : Math.max(0, total - paidAmount);

    const cust = selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId) : null;
    const customerName = cust ? cust.name : 'زبون نقدي';

    const invoice: SaleInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(4, '0')}`,
      date: new Date().toISOString(),
      type: invoiceType,
      customerId: selectedCustomerId || undefined,
      customerName,
      items: [...cart],
      subtotal,
      discount: cartDiscount,
      taxAmount,
      total,
      paidAmount: paymentMethod === 'credit' ? 0 : paidAmount,
      remainingAmount,
      paymentMethod,
      currency: settings.baseCurrency,
      warehouseId: activeWarehouseId,
      cashierName: currentStaff.name,
      notes,
    };

    // Deduct stock for sales, add stock for returns
    setProducts((prev) =>
      prev.map((p) => {
        const cartItems = cart.filter((it) => it.productId === p.id);
        if (cartItems.length > 0) {
          let deltaStock = 0;
          cartItems.forEach((ci) => {
            const baseQty = ci.quantity * ci.conversionFactor;
            if (ci.isReturn) {
              deltaStock += baseQty; // returned item comes back
            } else {
              deltaStock -= baseQty; // sold item leaves
            }
          });
          const currentWStock = p.warehouseStocks[activeWarehouseId] ?? p.stockQuantity;
          return {
            ...p,
            stockQuantity: p.stockQuantity + deltaStock,
            warehouseStocks: {
              ...p.warehouseStocks,
              [activeWarehouseId]: currentWStock + deltaStock,
            },
          };
        }
        return p;
      })
    );

    // Update customer debt if credit sale
    if (selectedCustomerId && remainingAmount > 0) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === selectedCustomerId) {
            const curBal = c.balances[settings.baseCurrency] || 0;
            return {
              ...c,
              balances: {
                ...c.balances,
                [settings.baseCurrency]: curBal + remainingAmount,
              },
            };
          }
          return c;
        })
      );
    }

    // Update treasury account
    if (paymentMethod !== 'credit' && paidAmount > 0) {
      const treasuryId = paymentMethod === 'cash' ? 't1' : paymentMethod === 'bank' ? 't2' : 't3';
      setTreasuryAccounts((prev) =>
        prev.map((t) => (t.id === treasuryId ? { ...t, balance: t.balance + paidAmount } : t))
      );
    }

    // Update shift closing
    if (currentDailyClosing) {
      setCurrentDailyClosing((prev) => {
        if (!prev) return null;
        const isCash = paymentMethod === 'cash';
        const isCredit = paymentMethod === 'credit';
        const isBank = paymentMethod === 'bank' || paymentMethod === 'wallet';

        return {
          ...prev,
          totalCashSales: isCash ? prev.totalCashSales + total : prev.totalCashSales,
          totalCreditSales: isCredit ? prev.totalCreditSales + total : prev.totalCreditSales,
          totalBankSales: isBank ? prev.totalBankSales + total : prev.totalBankSales,
          totalReturns: invoiceType === 'return' ? prev.totalReturns + Math.abs(subtotal) : prev.totalReturns,
          expectedCash: isCash ? prev.expectedCash + total : prev.expectedCash,
        };
      });
    }

    // Double entry journal
    const entry: JournalEntry = {
      id: 'je-' + Date.now(),
      entryNumber: `JE-INV-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      description: `فاتورة ${invoiceType === 'return' ? 'مرتجع' : 'مبيعات'} رقم ${invoice.invoiceNumber} (${customerName})`,
      lines: [
        ...(paymentMethod === 'cash' ? [{ accountId: '101', accountName: 'الصندوق (نقدية)', debit: total, credit: 0 }] : []),
        ...(paymentMethod === 'bank' || paymentMethod === 'wallet' ? [{ accountId: '102', accountName: 'البنك / الشبكة', debit: total, credit: 0 }] : []),
        ...(paymentMethod === 'credit' ? [{ accountId: '130', accountName: `ذمم مدينة (العميل: ${customerName})`, debit: total, credit: 0 }] : []),
        { accountId: '401', accountName: 'إيرادات المبيعات', debit: 0, credit: subtotal },
        ...(taxAmount > 0 ? [{ accountId: '240', accountName: 'ضريبة القيمة المضافة مخرجات', debit: 0, credit: taxAmount }] : []),
      ],
    };
    setJournalEntries((prev) => [entry, ...prev]);

    setInvoices((prev) => [invoice, ...prev]);
    setLastInvoice(invoice);
    clearCart();
    posAudio.playSuccessChime();
    return invoice;
  };

  // Daily Closing (Z-Report / Shift End)
  const performDailyClosing = (
    billDenominations: Record<string, number>,
    notes?: string
  ): DailyClosing => {
    if (!currentDailyClosing) throw new Error('لا يوجد وردية نشطة');

    // Calculate actual cash count
    let actualCash = 0;
    Object.entries(billDenominations).forEach(([denom, count]) => {
      actualCash += Number(denom) * count;
    });

    const cashDiff = actualCash - currentDailyClosing.expectedCash;

    const closedReport: DailyClosing = {
      ...currentDailyClosing,
      shiftEndTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      actualCashCount: actualCash,
      cashDifference: cashDiff,
      billDenominations,
      notes,
      isClosed: true,
    };

    setDailyClosings((prev) => [closedReport, ...prev]);

    // Record difference in journal if any
    if (cashDiff !== 0) {
      const isSurplus = cashDiff > 0;
      const absDiff = Math.abs(cashDiff);
      const entry: JournalEntry = {
        id: 'je-' + Date.now(),
        entryNumber: `JE-CLS-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString(),
        description: `فروقات جرد الصندوق اليومي وردية [${currentStaff.name}]: ${isSurplus ? 'زيادة' : 'عجز'}`,
        lines: [
          { accountId: '101', accountName: 'الصندوق', debit: isSurplus ? absDiff : 0, credit: !isSurplus ? absDiff : 0 },
          { accountId: '550', accountName: isSurplus ? 'فروقات نقدية (زيادة)' : 'فروقات نقدية (عجز صندوق)', debit: !isSurplus ? absDiff : 0, credit: isSurplus ? absDiff : 0 },
        ],
      };
      setJournalEntries((prev) => [entry, ...prev]);
    }

    setCurrentDailyClosing(null);
    posAudio.playSuccessChime();
    return closedReport;
  };

  const openNewShift = (openingCash: number) => {
    const newShift: DailyClosing = {
      id: 'shift-' + Date.now(),
      closingNumber: `CLS-${new Date().getFullYear()}-${(dailyClosings.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      shiftStartTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      shiftEndTime: '',
      cashierName: currentStaff.name,
      openingCash,
      totalCashSales: 0,
      totalCreditSales: 0,
      totalBankSales: 0,
      totalReturns: 0,
      totalCashCollected: 0,
      totalCashExpenses: 0,
      expectedCash: openingCash,
      actualCashCount: openingCash,
      cashDifference: 0,
      billDenominations: {},
      isClosed: false,
    };
    setCurrentDailyClosing(newShift);
    posAudio.playSuccessChime();
  };

  // Cloud sync simulation
  const cloudSync = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setSettings((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
        }));
        posAudio.playSuccessChime();
        resolve(true);
      }, 1000);
    });
  };

  // Export encrypted/structured JSON backup
  const exportBackup = (): string => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'دفتر متجري POS',
      settings,
      products,
      warehouses,
      transfers,
      customers,
      suppliers,
      treasuryAccounts,
      invoices,
      purchases,
      vouchers,
      journalEntries,
      dailyClosings,
    };
    return JSON.stringify(data, null, 2);
  };

  const importBackup = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.settings) setSettings(data.settings);
      if (data.invoices && Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.treasuryAccounts && Array.isArray(data.treasuryAccounts)) setTreasuryAccounts(data.treasuryAccounts);
      posAudio.playSuccessChime();
      return true;
    } catch {
      posAudio.playErrorBuzz();
      return false;
    }
  };

  const resetAllData = () => {
    localStorage.clear();
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setTreasuryAccounts(initialTreasuryAccounts);
    setSettings(initialSettings);
    setInvoices(initialInvoices);
    setPurchases([]);
    setTransfers([]);
    setVouchers([]);
    setJournalEntries(initialJournalEntries);
    setDailyClosings([]);
    posAudio.playSuccessChime();
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        staff,
        currentStaff,
        setCurrentStaff,
        isLocked,
        setIsLocked,
        unlockWithPin,
        warehouses,
        activeWarehouseId,
        setActiveWarehouseId,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        transfers,
        createTransfer,
        updateTransferStatus,
        cart,
        addToCart,
        updateCartItemQty,
        updateCartItemDiscount,
        updateCartItemPrice,
        removeFromCart,
        clearCart,
        cartDiscount,
        setCartDiscount,
        selectedCustomerId,
        setSelectedCustomerId,
        salePriceTier,
        setSalePriceTier,
        invoices,
        processSale,
        lastInvoice,
        setLastInvoice,
        customers,
        addCustomer,
        updateCustomer,
        collectDebt,
        suppliers,
        addSupplier,
        updateSupplier,
        purchases,
        createPurchaseInvoice,
        paySupplierVoucher,
        settleOffset,
        currencies,
        treasuryAccounts,
        transferTreasury,
        exchangeCurrency,
        vouchers,
        currentDailyClosing,
        dailyClosings,
        performDailyClosing,
        openNewShift,
        journalEntries,
        cloudSync,
        exportBackup,
        importBackup,
        resetAllData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
