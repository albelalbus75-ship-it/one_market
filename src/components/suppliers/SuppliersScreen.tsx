import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Receipt,
  Printer,
  FileSpreadsheet,
  ArrowRightLeft,
  X,
  CreditCard,
  Building,
  Phone,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Supplier, PurchaseItem, PaymentMethod } from '../../types';
import { posAudio } from '../../utils/audio';

export const SuppliersScreen: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    purchases,
    createPurchaseInvoice,
    paySupplierVoucher,
    settleOffset,
    customers,
    products,
    treasuryAccounts,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Modals
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isOffsetModalOpen, setIsOffsetModalOpen] = useState(false);

  // New Supplier Form
  const [suppName, setSuppName] = useState('');
  const [suppCompany, setSuppCompany] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppTaxNum, setSuppTaxNum] = useState('');
  const [suppNotes, setSuppNotes] = useState('');

  // Purchase Invoice Form
  const [purchaseSuppId, setPurchaseSuppId] = useState(suppliers[0]?.id || '');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [itemQty, setItemQty] = useState('10');
  const [itemCost, setItemCost] = useState('5');
  const [purchasePayMethod, setPurchasePayMethod] = useState<PaymentMethod>('credit');
  const [purchasePaidAmount, setPurchasePaidAmount] = useState('0');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Payment Voucher Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTreasuryId, setPaymentTreasuryId] = useState(treasuryAccounts[0]?.id || 't1');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Offset Form
  const [offsetCustomerId, setOffsetCustomerId] = useState(customers[0]?.id || '');
  const [offsetAmount, setOffsetAmount] = useState('');
  const [offsetNotes, setOffsetNotes] = useState('تسوية مقاصة بين حساب المورد والعميل');

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery.trim()) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Total payable debts to suppliers
  const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0);

  // Add Item to Purchase Draft
  const handleAddItemToPurchase = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const qty = parseFloat(itemQty) || 1;
    const cost = parseFloat(itemCost) || prod.costPrice;

    const newItem: PurchaseItem = {
      productId: prod.id,
      productName: prod.name,
      unit: prod.baseUnit,
      quantity: qty,
      costPrice: cost,
      total: Number((qty * cost).toFixed(2)),
    };

    setPurchaseItems([...purchaseItems, newItem]);
    setSelectedProdId('');
    setItemQty('10');
  };

  const handleRemovePurchaseItem = (idx: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  // Submit Purchase Invoice
  const handleSavePurchaseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0 || !purchaseSuppId) return;

    createPurchaseInvoice(
      purchaseSuppId,
      purchaseItems,
      purchasePayMethod,
      parseFloat(purchasePaidAmount) || 0,
      settings.baseCurrency,
      purchaseNotes
    );

    setIsNewPurchaseModalOpen(false);
    setPurchaseItems([]);
    setPurchasePaidAmount('0');
    setPurchaseNotes('');
    posAudio.playSuccessChime();
  };

  // Submit Supplier Payment Voucher
  const handleSavePaymentVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    paySupplierVoucher(
      selectedSupplier.id,
      amt,
      settings.baseCurrency,
      paymentTreasuryId,
      paymentNotes || 'سداد دفعة للمورد'
    );

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    posAudio.playSuccessChime();
  };

  // Submit Offset settlement
  const handleSaveOffset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !offsetCustomerId) return;
    const amt = parseFloat(offsetAmount) || 0;
    if (amt <= 0) return;

    settleOffset(offsetCustomerId, selectedSupplier.id, amt, offsetNotes);
    setIsOffsetModalOpen(false);
    setOffsetAmount('');
    posAudio.playSuccessChime();
  };

  // Create new Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName.trim()) return;

    addSupplier({
      name: suppName.trim(),
      company: suppCompany.trim() || undefined,
      phone: suppPhone.trim(),
      taxNumber: suppTaxNum.trim() || undefined,
      currency: settings.baseCurrency,
      notes: suppNotes.trim() || undefined,
    });

    setIsNewSupplierModalOpen(false);
    setSuppName('');
    setSuppCompany('');
    setSuppPhone('');
    posAudio.playSuccessChime();
  };

  // Invoices for selected supplier
  const supplierInvoices = selectedSupplier
    ? purchases.filter((p) => p.supplierId === selectedSupplier.id)
    : [];

  const purchaseSubtotal = purchaseItems.reduce((acc, it) => acc + it.total, 0);
  const purchaseTax = settings.isTaxEnabled ? purchaseSubtotal * settings.taxRate : 0;
  const purchaseTotal = purchaseSubtotal + purchaseTax;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 select-none pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            الموردون والمشتريات وتكلفة البضاعة
          </h2>
          <p className="text-xs text-slate-400">
            فواتير المشتريات، تحديث متوسط التكلفة التلقائي، سندات الصرف، ومقاصة الحسابات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-850 px-3 py-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">مستحقات الموردين:</span>
            <span className="font-extrabold text-rose-400 font-mono text-sm">
              {totalPayables.toFixed(2)} {settings.baseCurrency}
            </span>
          </div>

          <button
            onClick={() => setIsNewPurchaseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md transition"
          >
            <Receipt className="w-4 h-4" />
            <span>فاتورة مشتريات جديدة</span>
          </button>

          <button
            onClick={() => setIsNewSupplierModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد</span>
          </button>
        </div>
      </div>

      {/* Grid: Suppliers directory (left) & Account info (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Suppliers List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl">
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مورد بالاسم أو الهاتف..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {filteredSuppliers.map((supp) => {
              const isSelected = selectedSupplier?.id === supp.id;
              return (
                <div
                  key={supp.id}
                  onClick={() => setSelectedSupplier(supp)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div>
                      <h4 className="font-bold text-white text-sm leading-tight">{supp.name}</h4>
                      {supp.company && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{supp.company}</div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{supp.phone}</div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[10px] text-slate-400 block">المستحق له:</span>
                      <span
                        className={`text-sm font-extrabold ${
                          supp.balance > 0 ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {supp.balance.toFixed(2)} {supp.currency}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-750 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {supp.notes || 'مورد عام'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSupplier(supp);
                        setPaymentAmount(supp.balance.toString());
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-[11px] font-bold shadow-sm transition"
                    >
                      سند صرف (سداد)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Supplier Detail & Purchase Invoices (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col">
          {selectedSupplier ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{selectedSupplier.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedSupplier.company} · هاتف: {selectedSupplier.phone}{' '}
                    {selectedSupplier.taxNumber && `· ضريبي: ${selectedSupplier.taxNumber}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPaymentAmount(selectedSupplier.balance.toString());
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    سند صرف
                  </button>
                  <button
                    onClick={() => {
                      setOffsetAmount(selectedSupplier.balance.toString());
                      setIsOffsetModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded-xl text-xs font-semibold flex items-center gap-1"
                    title="تسوية مقاصة مع عميل"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>مقاصة</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Balance Box */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">إجمالي المستحق للمورد حالياً:</span>
                  <span className="text-lg font-extrabold text-rose-400 font-mono">
                    {selectedSupplier.balance.toFixed(2)} {selectedSupplier.currency}
                  </span>
                </div>
                <div className="text-left text-xs text-slate-400">
                  <span>عدد فواتير المشتريات: </span>
                  <span className="font-bold text-white font-mono">{supplierInvoices.length}</span>
                </div>
              </div>

              {/* Purchase Invoices list */}
              <div className="flex-1 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-300 mb-2">سجل فواتير التوريد من هذا المورد:</h4>
                {supplierInvoices.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    لا توجد فواتير مشتريات مسجلة بعد لهذا المورد
                  </div>
                ) : (
                  <div className="space-y-2">
                    {supplierInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span className="font-mono">{inv.invoiceNumber}</span>
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                              {inv.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(inv.date).toLocaleDateString('ar-SA')} · الأصناف: {inv.items.length}
                          </div>
                        </div>

                        <div className="text-left font-mono">
                          <span className="text-xs font-bold text-white block">{inv.total} {inv.currency}</span>
                          {inv.remainingAmount > 0 && (
                            <span className="text-[10px] text-rose-400">
                              متبقي: {inv.remainingAmount} {inv.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 text-center">
              <Truck className="w-12 h-12 mb-2 stroke-[1.2]" />
              <p className="text-xs">اختر مورداً من القائمة لعرض كشف الحساب وفواتير التوريد</p>
            </div>
          )}
        </div>
      </div>

      {/* New Purchase Invoice Modal */}
      {isNewPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">إنشاء فاتورة مشتريات جديدة وتحديث التكلفة</h3>
              <button
                onClick={() => setIsNewPurchaseModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseInvoice} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Supplier & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">المورد:</label>
                  <select
                    required
                    value={purchaseSuppId}
                    onChange={(e) => setPurchaseSuppId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">طريقة الدفع:</label>
                  <select
                    value={purchasePayMethod}
                    onChange={(e) => setPurchasePayMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="credit">بالآجل (على حساب المورد)</option>
                    <option value="cash">نقداً من الصندوق</option>
                    <option value="bank">تحويل بنكي / شبكة</option>
                  </select>
                </div>
              </div>

              {/* Add Item Row to draft */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">إضافة أصناف إلى الفاتورة:</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">اختر الصنف:</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => {
                        setSelectedProdId(e.target.value);
                        const p = products.find((pr) => pr.id === e.target.value);
                        if (p) setItemCost(p.costPrice.toString());
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">-- اختر صنفاً --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">الكمية:</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">سعر التكلفة للوحدة:</label>
                    <input
                      type="number"
                      step="any"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!selectedProdId}
                    onClick={handleAddItemToPurchase}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition"
                  >
                    إضافة للصنف
                  </button>
                </div>
              </div>

              {/* Items List in draft */}
              {purchaseItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">أصناف الفاتورة:</span>
                  {purchaseItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/80 p-2 rounded-xl border border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {item.quantity} {item.unit} × {item.costPrice} = {item.total} {settings.baseCurrency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePurchaseItem(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>المجموع:</span>
                  <span className="font-mono">{purchaseSubtotal.toFixed(2)} {settings.baseCurrency}</span>
                </div>
                {settings.isTaxEnabled && (
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة المشتريات (15%):</span>
                    <span className="font-mono">{purchaseTax.toFixed(2)} {settings.baseCurrency}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white text-sm pt-1 border-t border-slate-800">
                  <span>الإجمالي النهائي:</span>
                  <span className="font-mono text-emerald-400 text-base">{purchaseTotal.toFixed(2)} {settings.baseCurrency}</span>
                </div>
              </div>

              {/* Paid amount if any */}
              {purchasePayMethod !== 'credit' && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1">المبلغ المدفوع فوراً للمورد:</label>
                  <input
                    type="number"
                    value={purchasePaidAmount}
                    onChange={(e) => setPurchasePaidAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  اعتماد الفاتورة وتحديث المخزون ومتوسط التكلفة
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Voucher Modal (سند صرف) */}
      {isPaymentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">إصدار سند صرف للمورد</h3>
            <p className="text-xs text-slate-400 mb-3">
              صرف للمورد: <span className="text-rose-400 font-bold">{selectedSupplier.name}</span>
            </p>

            <form onSubmit={handleSavePaymentVoucher} className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">المبلغ المصروف:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-rose-400 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">الصرف من الخزينة / الحساب:</label>
                <select
                  value={paymentTreasuryId}
                  onChange={(e) => setPaymentTreasuryId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {treasuryAccounts.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (رصيد: {t.balance} {t.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">البيان وملاحظات الصرف:</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="سداد دفعة من الحساب..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  اعتماد سند الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offset Settlement Modal (المقاصة) */}
      {isOffsetModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">تسوية مقاصة (عميل - مورد)</h3>
            <p className="text-xs text-slate-400 mb-3">
              إجراء تسوية بين حساب المورد <span className="text-white font-bold">{selectedSupplier.name}</span> وعميل مدين
            </p>

            <form onSubmit={handleSaveOffset} className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اختر العميل المدين:</label>
                <select
                  value={offsetCustomerId}
                  onChange={(e) => setOffsetCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (مدين: {c.balances[settings.baseCurrency] || 0} {settings.baseCurrency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">مبلغ المقاصة للتسوية:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={offsetAmount}
                  onChange={(e) => setOffsetAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-sky-400 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">البيان:</label>
                <input
                  type="text"
                  value={offsetNotes}
                  onChange={(e) => setOffsetNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  اعتماد المقاصة وتحديث الحسابين
                </button>
                <button
                  type="button"
                  onClick={() => setIsOffsetModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">إضافة مورد جديد</h3>
              <button
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم المورد:</label>
                <input
                  type="text"
                  required
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  placeholder="اسم الشخص أو المندوب"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم الشركة أو المؤسسة:</label>
                <input
                  type="text"
                  value={suppCompany}
                  onChange={(e) => setSuppCompany(e.target.value)}
                  placeholder="شركة التوزيع الغذائي..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    required
                    value={suppPhone}
                    onChange={(e) => setSuppPhone(e.target.value)}
                    placeholder="011xxxxxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">الرقم الضريبي:</label>
                  <input
                    type="text"
                    value={suppTaxNum}
                    onChange={(e) => setSuppTaxNum(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ملاحظات التوريد:</label>
                <input
                  type="text"
                  value={suppNotes}
                  onChange={(e) => setSuppNotes(e.target.value)}
                  placeholder="مواعيد الزيارة أو شروط السداد..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  حفظ المورد
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
