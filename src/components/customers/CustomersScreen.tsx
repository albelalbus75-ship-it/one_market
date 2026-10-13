import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Wallet,
  Printer,
  Share2,
  FileText,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Customer, Voucher } from '../../types';
import { posAudio } from '../../utils/audio';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    collectDebt,
    invoices,
    vouchers,
    treasuryAccounts,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modals
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectCurrency, setCollectCurrency] = useState(settings.baseCurrency);
  const [collectTreasuryId, setCollectTreasuryId] = useState(treasuryAccounts[0]?.id || 't1');
  const [collectNotes, setCollectNotes] = useState('');
  const [lastVoucher, setLastVoucher] = useState<Voucher | null>(null);

  // New Customer Form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custTaxNum, setCustTaxNum] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState('2000');
  const [custPriceTier, setCustPriceTier] = useState<'retail' | 'wholesale'>('retail');
  const [custNotes, setCustNotes] = useState('');

  // Filtered customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery.trim())
  );

  // Customer debt total
  const totalDebts = customers.reduce((sum, c) => {
    return sum + (c.balances[settings.baseCurrency] || 0);
  }, 0);

  // Open Collect Modal
  const handleOpenCollect = (c: Customer) => {
    setSelectedCustomer(c);
    setCollectAmount((c.balances[settings.baseCurrency] || 0).toString());
    setCollectCurrency(settings.baseCurrency);
    setCollectNotes('سداد دفعة من الحساب');
    setIsCollectModalOpen(true);
  };

  // Submit debt collection
  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = parseFloat(collectAmount) || 0;
    if (amt <= 0) return;

    const voucher = collectDebt(
      selectedCustomer.id,
      amt,
      collectCurrency,
      collectTreasuryId,
      collectNotes
    );

    setLastVoucher(voucher);
    setIsCollectModalOpen(false);
    posAudio.playSuccessChime();
  };

  // Create new customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    addCustomer({
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim() || undefined,
      taxNumber: custTaxNum.trim() || undefined,
      creditLimit: parseFloat(custCreditLimit) || 1000,
      priceTier: custPriceTier,
      notes: custNotes.trim() || undefined,
    });

    setIsNewCustModalOpen(false);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustTaxNum('');
    posAudio.playSuccessChime();
  };

  // Filter invoices for selected customer
  const customerInvoices = selectedCustomer
    ? invoices.filter((inv) => inv.customerId === selectedCustomer.id)
    : [];

  // Filter vouchers for selected customer
  const customerVouchers = selectedCustomer
    ? vouchers.filter((v) => v.partyId === selectedCustomer.id && v.type === 'receipt')
    : [];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 select-none pb-24">
      {/* Header & Debt Summary KPI */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            دفتر ديون العملاء والحسابات
          </h2>
          <p className="text-xs text-slate-400">
            دفتر مستقل لكل عميل، تتبع أرصدة العملات، سندات القبض والتحصيل الفوري
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-850 px-3.5 py-1.5 rounded-2xl border border-slate-800 flex items-center gap-2">
            <span className="text-xs text-slate-400">إجمالي ديون السوق:</span>
            <span className="text-sm font-extrabold text-amber-400 font-mono">
              {totalDebts.toFixed(2)} {settings.baseCurrency}
            </span>
          </div>

          <button
            onClick={() => setIsNewCustModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customers list (left) & Account Statement (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Customers Directory (5 columns) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الجوال..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Customer Cards List */}
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
            {filteredCustomers.map((cust) => {
              const debt = cust.balances[settings.baseCurrency] || 0;
              const isSelected = selectedCustomer?.id === cust.id;

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div>
                      <h4 className="font-bold text-white text-sm leading-tight">{cust.name}</h4>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{cust.phone}</span>
                        {cust.priceTier === 'wholesale' && (
                          <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800 px-1 rounded">
                            سعر جملة
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[10px] text-slate-400 block">الرصيد:</span>
                      <span
                        className={`text-sm font-extrabold ${
                          debt > 0 ? 'text-amber-400' : debt < 0 ? 'text-sky-400' : 'text-slate-400'
                        }`}
                      >
                        {debt > 0 ? `+${debt.toFixed(2)}` : debt.toFixed(2)} {settings.baseCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Multi-currency support preview if any other currency exists */}
                  {Object.entries(cust.balances).map(([curr, val]) => {
                    if (curr === settings.baseCurrency || val === 0) return null;
                    return (
                      <div key={curr} className="text-[10px] text-slate-400 font-mono text-left">
                        رصيد {curr}: <span className="font-bold text-amber-300">{val} {curr}</span>
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-slate-750 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      {cust.notes || 'لا توجد ملاحظات'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCollect(cust);
                      }}
                      className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold shadow-sm transition active:scale-95"
                    >
                      سند قبض (تحصيل)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Customer Statement of Account (7 columns) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col">
          {selectedCustomer ? (
            <>
              {/* Customer Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">{selectedCustomer.name}</h3>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 font-mono text-slate-300">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedCustomer.address || 'العنوان غير محدد'} {selectedCustomer.taxNumber && `· الرقم الضريبي: ${selectedCustomer.taxNumber}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCollect(selectedCustomer)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>سند قبض</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
                    title="طباعة كشف الحساب"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Balances & Credit Limit Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 block">رصيد الدين الحالي:</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">
                    {selectedCustomer.balances[settings.baseCurrency] || 0} {settings.baseCurrency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">الحد الائتماني المسموح:</span>
                  <span className="text-base font-bold text-slate-200 font-mono">
                    {selectedCustomer.creditLimit || 0} {settings.baseCurrency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">فئة التسعير:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {selectedCustomer.priceTier === 'wholesale' ? 'أسعار الجملة' : 'أسعار التجزئة'}
                  </span>
                </div>
              </div>

              {/* Transactions History Tab: Invoices & Vouchers */}
              <div className="flex-1 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-300 mb-2">
                  سجل الحركات المالية والفواتير وسندات السداد:
                </h4>

                {customerInvoices.length === 0 && customerVouchers.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    لا توجد فواتير أو سندات مسجلة لهذا العميل حتى الآن
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Render Invoices */}
                    {customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="font-mono">{inv.invoiceNumber}</span>
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                              {inv.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(inv.date).toLocaleDateString('ar-SA')} · الأصناف: {inv.items.length}
                          </div>
                        </div>

                        <div className="text-left font-mono">
                          <span className="text-xs font-bold text-white block">{inv.total} {inv.currency}</span>
                          {inv.remainingAmount > 0 && (
                            <span className="text-[10px] text-amber-400">
                              متبقي: {inv.remainingAmount} {inv.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Render Receipt Vouchers */}
                    {customerVouchers.map((vch) => (
                      <div
                        key={vch.id}
                        className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <span>سند قبض</span>
                            <span className="font-mono text-xs">({vch.voucherNumber})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(vch.date).toLocaleDateString('ar-SA')} · {vch.notes}
                          </div>
                        </div>

                        <div className="text-left font-mono font-bold text-emerald-400 text-sm">
                          -{vch.amount} {vch.currency}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 text-center">
              <Users className="w-12 h-12 mb-2 stroke-[1.2]" />
              <p className="text-xs">اختر عميلاً من القائمة لعرض كشف الحساب وسجل السداد</p>
            </div>
          )}
        </div>
      </div>

      {/* Debt Collection Modal (سند قبض) */}
      {isCollectModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">إصدار سند قبض نقدية</h3>
            <p className="text-xs text-slate-400 mb-3">
              تحصيل من: <span className="text-emerald-400 font-bold">{selectedCustomer.name}</span>
            </p>

            <form onSubmit={handleConfirmCollect} className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">المبلغ المحصل:</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">إيداع إلى الخزينة / الحساب:</label>
                <select
                  value={collectTreasuryId}
                  onChange={(e) => setCollectTreasuryId(e.target.value)}
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
                <label className="text-xs text-slate-300 block mb-1">البيان / ملاحظات السند:</label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="سداد دفعة من الحساب..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                >
                  اعتماد السند وخصم الدين
                </button>
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">إضافة عميل جديد</h3>
              <button
                onClick={() => setIsNewCustModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">اسم العميل:</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="اسم الشخص أو المؤسسة أو المطعم"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">فئة التسعير:</label>
                  <select
                    value={custPriceTier}
                    onChange={(e) => setCustPriceTier(e.target.value as 'retail' | 'wholesale')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="retail">تجزئة عادي</option>
                    <option value="wholesale">جملة مخفض</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">الحد الائتماني (الدين الأقصى):</label>
                  <input
                    type="number"
                    value={custCreditLimit}
                    onChange={(e) => setCustCreditLimit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">الرقم الضريبي (اختياري):</label>
                  <input
                    type="text"
                    value={custTaxNum}
                    onChange={(e) => setCustTaxNum(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">العنوان والموقع:</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="الحي، الشارع..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="ملاحظات الحساب أو التوصيل..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  حفظ العميل
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
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
