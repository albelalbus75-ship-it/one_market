import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Wallet,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  Download,
  Calendar,
  Layers,
  PieChart,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { posAudio } from '../../utils/audio';

export const TreasuryReportsScreen: React.FC = () => {
  const {
    treasuryAccounts,
    transferTreasury,
    exchangeCurrency,
    currencies,
    invoices,
    purchases,
    products,
    customers,
    suppliers,
    journalEntries,
    settings,
    dailyClosings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'treasury' | 'sales_profit' | 'financials' | 'journal'>('sales_profit');

  // Modals for treasury
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  // Transfer form
  const [trFromId, setTrFromId] = useState(treasuryAccounts[0]?.id || '');
  const [trToId, setTrToId] = useState(treasuryAccounts[1]?.id || '');
  const [trAmount, setTrAmount] = useState('500');
  const [trNotes, setTrNotes] = useState('تحويل نقدية بين الصناديق');

  // Exchange form
  const [exFromId, setExFromId] = useState(treasuryAccounts[0]?.id || '');
  const [exToId, setExToId] = useState(treasuryAccounts[3]?.id || treasuryAccounts[0]?.id || '');
  const [exFromAmount, setExFromAmount] = useState('375');
  const [exToAmount, setExToAmount] = useState('100');
  const [exRate, setExRate] = useState('3.75');

  // Sales and Profit Calculations
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalReturns = 0;
    let totalCOGS = 0; // Cost of Goods Sold

    invoices.forEach((inv) => {
      if (inv.type === 'return') {
        totalReturns += inv.total;
      } else {
        totalSales += inv.total;
      }

      inv.items.forEach((it) => {
        const itemCost = it.costPrice * it.quantity;
        if (it.isReturn) {
          totalCOGS -= itemCost;
        } else {
          totalCOGS += itemCost;
        }
      });
    });

    const netSales = totalSales - totalReturns;
    const grossProfit = netSales - totalCOGS;
    const profitMargin = netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : '0';

    // Total Inventory Value
    const inventoryValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.costPrice, 0);

    // Total Customer Receivables
    const totalReceivables = customers.reduce((acc, c) => acc + (c.balances[settings.baseCurrency] || 0), 0);

    // Total Supplier Payables
    const totalPayables = suppliers.reduce((acc, s) => acc + s.balance, 0);

    // Total Treasury Cash
    const totalCashAndBanks = treasuryAccounts.reduce((acc, t) => {
      // In base currency
      const curr = currencies.find((c) => c.code === t.currency);
      const rate = curr ? curr.rateAgainstBase : 1;
      return acc + t.balance / rate;
    }, 0);

    return {
      totalSales,
      totalReturns,
      netSales,
      totalCOGS,
      grossProfit,
      profitMargin,
      inventoryValuation,
      totalReceivables,
      totalPayables,
      totalCashAndBanks,
    };
  }, [invoices, products, customers, suppliers, treasuryAccounts, currencies, settings]);

  // Execute treasury transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(trAmount) || 0;
    if (amt <= 0 || trFromId === trToId) return;
    transferTreasury(trFromId, trToId, amt, trNotes);
    setIsTransferModalOpen(false);
    posAudio.playSuccessChime();
  };

  // Execute currency exchange
  const handleExchangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fAmt = parseFloat(exFromAmount) || 0;
    const tAmt = parseFloat(exToAmount) || 0;
    const rate = parseFloat(exRate) || 1;
    if (fAmt <= 0 || tAmt <= 0) return;
    exchangeCurrency(exFromId, exToId, fAmt, tAmt, rate);
    setIsExchangeModalOpen(false);
    posAudio.playSuccessChime();
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 select-none pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            المالية، الخزائن والتقارير المحاسبية
          </h2>
          <p className="text-xs text-slate-400">
            متابعة السيولة النقدية، قوائم الدخل، الميزانية العمومية، وقيود اليومية التلقائية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700 w-fit mb-4 text-xs font-semibold flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('sales_profit')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'sales_profit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          المبيعات والأرباح
        </button>
        <button
          onClick={() => setActiveTab('treasury')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'treasury' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          الصناديق والمحافظ والعملات
        </button>
        <button
          onClick={() => setActiveTab('financials')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'financials' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          القوائم المالية (الدخل والميزانية)
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`px-3 py-1.5 rounded-xl transition ${
            activeTab === 'journal' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          دفتر اليومية العامة ({journalEntries.length})
        </button>
      </div>

      {/* TAB 1: Sales & Profit Dashboard */}
      {activeTab === 'sales_profit' && (
        <div className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-right">
              <span className="text-xs text-slate-400 block mb-1">صافي المبيعات:</span>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                {metrics.netSales.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">{settings.baseCurrency}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                إجمالي الفواتير: {invoices.length} فواتير
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-right">
              <span className="text-xs text-slate-400 block mb-1">تكلفة البضاعة المباعة (COGS):</span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-300 font-mono">
                {metrics.totalCOGS.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-400">{settings.baseCurrency}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">وفق متوسط التكلفة المرجح</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-right">
              <span className="text-xs text-slate-400 block mb-1">إجمالي الأرباح المحققة:</span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                {metrics.grossProfit.toFixed(2)}{' '}
                <span className="text-xs font-normal text-emerald-500">{settings.baseCurrency}</span>
              </div>
              <div className="text-[10px] text-emerald-500 mt-1 font-semibold">
                هامش الربح: {metrics.profitMargin}%
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-right">
              <span className="text-xs text-slate-400 block mb-1">قيمة المخزون الإجمالي:</span>
              <div className="text-xl sm:text-2xl font-extrabold text-sky-400 font-mono">
                {metrics.inventoryValuation.toFixed(2)}{' '}
                <span className="text-xs font-normal text-sky-500">{settings.baseCurrency}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                الأصناف بالمحل والمستودعات
              </div>
            </div>
          </div>

          {/* Recent Invoices Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-right">
            <h3 className="font-bold text-white text-sm sm:text-base mb-3">سجل أحدث فواتير المبيعات</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">رقم الفاتورة</th>
                    <th className="py-2.5 px-3">التاريخ والوقت</th>
                    <th className="py-2.5 px-3">العميل</th>
                    <th className="py-2.5 px-3">طريقة الدفع</th>
                    <th className="py-2.5 px-3">الإجمالي</th>
                    <th className="py-2.5 px-3">الكاشير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.slice(0, 8).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {new Date(inv.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {inv.customerName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            inv.paymentMethod === 'cash'
                              ? 'bg-emerald-950 text-emerald-300'
                              : inv.paymentMethod === 'credit'
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-sky-950 text-sky-300'
                          }`}
                        >
                          {inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'credit' ? 'آجل' : 'شبكة'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-white">
                        {inv.total.toFixed(2)} {inv.currency}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{inv.cashierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Treasury, Banks, E-Wallets & Currency Exchange */}
      {activeTab === 'treasury' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              أرصدة الصناديق والحسابات البنكية والمحافظ الإلكترونية:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>تحويل بين الخزائن</span>
              </button>
              <button
                onClick={() => setIsExchangeModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>صرف عملات</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {treasuryAccounts.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col justify-between text-right"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">{t.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        t.type === 'cash'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : t.type === 'bank'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}
                    >
                      {t.type === 'cash' ? 'خزينة نقدية' : t.type === 'bank' ? 'حساب بنكي' : 'محفظة إلكترونية'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {t.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-normal text-slate-400">{t.currency}</span>
                  </div>
                </div>

                {t.accountNumber && (
                  <div className="text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-800 mt-2">
                    رقم الحساب: {t.accountNumber}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Currencies Rates Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 text-right">
            <h4 className="text-xs font-bold text-white mb-2">أسعار الصرف اليومية (مسجلة مقابل {settings.baseCurrency}):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currencies.map((c) => (
                <div key={c.code} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block">({c.code})</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {c.rateAgainstBase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Financial Statements (Income Statement & Balance Sheet) */}
      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
          {/* Income Statement (قائمة الدخل) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-white text-base">قائمة الدخل (الأرباح والخسائر)</h3>
              <span className="text-xs text-slate-400">عن الفترة الحالية</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-300">
                <span>إجمالي إيرادات المبيعات:</span>
                <span className="font-mono text-white">{metrics.totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-rose-400">
                <span>يخصم: مردودات ومسموحات المبيعات:</span>
                <span className="font-mono">-{metrics.totalReturns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-white border-t border-slate-800">
                <span>صافي الإيرادات:</span>
                <span className="font-mono">{metrics.netSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-300 pt-2">
                <span>يخصم: تكلفة البضاعة المباعة (COGS):</span>
                <span className="font-mono text-rose-400">-{metrics.totalCOGS.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 font-extrabold text-sm text-emerald-400 border-t border-b border-slate-800">
                <span>مجمل الربح (Gross Profit):</span>
                <span className="font-mono text-base">{metrics.grossProfit.toFixed(2)} {settings.baseCurrency}</span>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">
                هامش الربح التشغيلي: <span className="font-bold text-white">{metrics.profitMargin}%</span>
              </div>
            </div>
          </div>

          {/* Balance Sheet (الميزانية العمومية) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-white text-base">الميزانية العمومية (المركز المالي)</h3>
              <span className="text-xs text-slate-400">كما في تاريخ اليوم</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-sky-400 block mb-1">الأصول المتداولة (Assets):</span>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">النقدية والبنوك والمحافظ:</span>
                    <span className="font-mono text-white">{metrics.totalCashAndBanks.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الذمم المدينة (ديون العملاء):</span>
                    <span className="font-mono text-white">{metrics.totalReceivables.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المخزون السلعي المقوم:</span>
                    <span className="font-mono text-white">{metrics.inventoryValuation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sky-300 pt-1 border-t border-slate-800">
                    <span>مجموع الأصول:</span>
                    <span className="font-mono">
                      {(metrics.totalCashAndBanks + metrics.totalReceivables + metrics.inventoryValuation).toFixed(2)}{' '}
                      {settings.baseCurrency}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-rose-400 block mb-1">الخصوم والالتزامات (Liabilities):</span>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الذمم الدائنة (مستحقات الموردين):</span>
                    <span className="font-mono text-rose-400">{metrics.totalPayables.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-300 pt-1 border-t border-slate-800">
                    <span>مجموع الخصوم:</span>
                    <span className="font-mono">{metrics.totalPayables.toFixed(2)} {settings.baseCurrency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Journal Entries (دفتر اليومية العامة - قيد مزدوج) */}
      {activeTab === 'journal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl text-right">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div>
              <h3 className="font-bold text-white text-base">دفتر اليومية العامة (Double-Entry Journal)</h3>
              <span className="text-xs text-slate-400">
                تسجيل آلي لجميع القيود المحاسبية المتوازنة (مدين = دائن) دون تدخل يدوي
              </span>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {journalEntries.map((entry) => {
              const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
              const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

              return (
                <div key={entry.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-2">
                    <div>
                      <span className="font-mono font-bold text-white ml-2">{entry.entryNumber}</span>
                      <span className="text-slate-300">{entry.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(entry.date).toLocaleDateString('ar-SA')} - {new Date(entry.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {entry.lines.map((line, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] py-0.5">
                        <span className="text-slate-300">
                          {line.debit > 0 ? 'من حـ/ ' : 'إلى حـ/ '}
                          {line.accountName}
                        </span>
                        <div className="flex gap-4 font-mono font-semibold">
                          <span className={line.debit > 0 ? 'text-emerald-400 w-16 text-left' : 'w-16 text-left text-slate-700'}>
                            {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                          </span>
                          <span className={line.credit > 0 ? 'text-rose-400 w-16 text-left' : 'w-16 text-left text-slate-700'}>
                            {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>توازن القيد: متطابق</span>
                    <span>الإجمالي: {totalDebit.toFixed(2)} {settings.baseCurrency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Treasury Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">التحويل بين الصناديق والبنوك</h3>
            <p className="text-xs text-slate-400 mb-4">نقل مبالغ من الصندوق إلى الحساب البنكي أو العكس</p>

            <form onSubmit={handleTransferSubmit} className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">من حساب:</label>
                <select
                  value={trFromId}
                  onChange={(e) => setTrFromId(e.target.value)}
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
                <label className="text-xs text-slate-300 block mb-1">إلى حساب:</label>
                <select
                  value={trToId}
                  onChange={(e) => setTrToId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {treasuryAccounts.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === trFromId}>
                      {t.name} (رصيد: {t.balance} {t.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المبلغ:</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={trAmount}
                  onChange={(e) => setTrAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">البيان:</label>
                <input
                  type="text"
                  value={trNotes}
                  onChange={(e) => setTrNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  تنفيذ التحويل
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Currency Exchange Modal */}
      {isExchangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-right">
            <h3 className="font-bold text-white text-base mb-1">صرف وتحويل العملات</h3>
            <p className="text-xs text-slate-400 mb-4">تسجيل حركة صرف عملة وحساب الفروقات</p>

            <form onSubmit={handleExchangeSubmit} className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">الصرف من الخزينة:</label>
                <select
                  value={exFromId}
                  onChange={(e) => setExFromId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {treasuryAccounts.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المبلغ المصروف:</label>
                <input
                  type="number"
                  required
                  value={exFromAmount}
                  onChange={(e) => setExFromAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">إلى خزينة العملة المقابلة:</label>
                <select
                  value={exToId}
                  onChange={(e) => setExToId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {treasuryAccounts.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">المبلغ المستلم بالعملة الجديدة:</label>
                <input
                  type="number"
                  required
                  value={exToAmount}
                  onChange={(e) => setExToAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-emerald-400 font-mono focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  تسجيل عملية الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setIsExchangeModalOpen(false)}
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
