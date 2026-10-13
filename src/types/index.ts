// Data types for Motagri POS & Store Management

export type UserRole = 'owner' | 'manager' | 'cashier';

export interface UserStaff {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit PIN
  phone?: string;
  active: boolean;
}

export type UnitType = 'piece' | 'kg' | 'g' | 'liter' | 'ml';

export interface ProductPackaging {
  id: string;
  name: string; // e.g., 'كرتون', 'درزن', 'كيس 5 كجم'
  barcode: string;
  conversionFactor: number; // e.g., 24 pieces in carton, or 5000g in 5kg bag
  sellingPrice: number;
  wholesalePrice: number;
  costPrice: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string;
  category: string;
  baseUnit: UnitType; // e.g., 'piece' or 'kg'
  costPrice: number; // متوسط التكلفة WAC
  sellingPrice: number; // سعر التجزئة
  wholesalePrice: number; // سعر الجملة
  minSellingPrice?: number;
  stockQuantity: number; // Current stock in base unit
  minStockAlert: number;
  isWeighted: boolean; // منتج وزني (خضروات، لحوم، جبن)
  tareWeight?: number; // وزن الفارغ
  expiryDate?: string; // YYYY-MM-DD
  packagings: ProductPackaging[]; // تعبئات متعددة
  warehouseStocks: Record<string, number>; // warehouseId -> stock
  imageUrl?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  isDefault: boolean;
}

export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled';

export interface StockTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
  status: TransferStatus;
  notes?: string;
  createdByName: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  balances: Record<string, number>; // currencyCode -> balance (positive = they owe us, negative = credit)
  creditLimit?: number;
  priceTier: 'retail' | 'wholesale';
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company?: string;
  taxNumber?: string;
  balance: number; // positive = we owe them
  currency: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'credit' | 'bank' | 'wallet';

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  packagingId?: string;
  unitName: string;
  conversionFactor: number;
  quantity: number;
  isWeighted?: boolean;
  unitPrice: number;
  costPrice: number;
  discount: number; // مبلغ الخصم
  subtotal: number; // (unitPrice * quantity) - discount
  isReturn?: boolean; // هل هذا البند مرتجع
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO date
  type: 'sale' | 'return' | 'exchange';
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // خصم إضافي على الفاتورة
  taxAmount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  currency: string;
  warehouseId: string;
  cashierName: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  warehouseId: string;
  paymentMethod: PaymentMethod;
  currency: string;
  notes?: string;
}

export interface TreasuryAccount {
  id: string;
  name: string; // e.g., 'الصندوق الرئيسي', 'بنك الراجحي', 'محفظة STC Pay'
  type: 'cash' | 'bank' | 'wallet';
  currency: string;
  balance: number;
  accountNumber?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateAgainstBase: number; // 1 Base Currency = X Units of this currency
  isBase: boolean;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: 'receipt' | 'payment'; // سند قبض (Receipt) أو سند صرف (Payment)
  date: string;
  partyType: 'customer' | 'supplier' | 'expense' | 'other';
  partyId?: string;
  partyName: string;
  amount: number;
  currency: string;
  treasuryAccountId: string;
  notes?: string;
  createdByName: string;
}

export interface JournalEntryLine {
  accountId: string;
  accountName: string;
  debit: number; // مدين
  credit: number; // دائن
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType?: 'sale' | 'purchase' | 'voucher' | 'closing' | 'manual';
  referenceId?: string;
  lines: JournalEntryLine[];
}

export interface DailyClosing {
  id: string;
  closingNumber: string;
  date: string;
  shiftStartTime: string;
  shiftEndTime: string;
  cashierName: string;
  openingCash: number;
  totalCashSales: number;
  totalCreditSales: number;
  totalBankSales: number;
  totalReturns: number;
  totalCashCollected: number;
  totalCashExpenses: number;
  expectedCash: number;
  actualCashCount: number;
  cashDifference: number; // actual - expected
  billDenominations: Record<string, number>; // e.g. "500": 2, "100": 5
  notes?: string;
  isClosed: boolean;
}

export interface StoreSettings {
  storeName: string;
  activity: string; // بقالة، سوبرماركت، مخبز، ورشة
  phone: string;
  address: string;
  taxNumber: string;
  taxRate: number; // e.g., 0.15 for 15%
  isTaxEnabled: boolean;
  baseCurrency: string; // e.g., 'SAR', 'EGP', 'AED'
  receiptFooterMessage: string;
  allowNegativeStock: boolean;
  printPaperSize: '80mm' | '58mm';
  cloudSyncEnabled: boolean;
  lastSyncTime?: string;
}
