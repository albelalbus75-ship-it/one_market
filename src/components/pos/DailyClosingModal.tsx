import React, { useState } from 'react';
import { Landmark, X, Printer, CheckCircle2, AlertTriangle, Coins, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { posAudio } from '../../utils/audio';

interface DailyClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyClosingModal: React.FC<DailyClosingModalProps> = ({ isOpen, onClose }) => {
  const {
    currentDailyClosing,
    performDailyClosing,
    openNewShift,
    settings,
    currentStaff,
    dailyClosings,
  } = useStore();

  const [denominations, setDenominations] = useState<Record<string, number>>({
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    '5': 0,
    '1': 0,
  });

  const [notes, setNotes] = useState('');
  const [newOpeningCash, setNewOpeningCash] = useState(500);
  const [closedSummary, setClosedSummary] = useState<unknown | null>(null);

  if (!isOpen) return null;

  // Compute total counted cash
  const countedCash = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  const expectedCash = currentDailyClosing?.expectedCash || 0;
  const variance = countedCash - expectedCash;

  const handleDenomChange = (denom: string, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [denom]: Math.max(0, count),
    }));
  };

  const handleCloseShift = () => {
    posAudio.playClick();
    const result = performDailyClosing(denominations, notes);
    setClosedSummary(result);
  };

  const handleStartNewShift = () => {
    openNewShift(newOpeningCash);
    setClosedSummary(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">تقفيل الصندوق وجرد الوردية (Z-Report)</h3>
              <span className="text-[11px] text-slate-400">
                الكاشير: {currentStaff.name} · التاريخ: {new Date().toLocaleDateString('ar-SA')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If shift is already closed or just closed */}
        {!currentDailyClosing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-lg mb-1">الوردية مغلقة حالياً</h4>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              تم تقفيل الصندوق وتسجيل الفروقات بنجاح في دفتر اليومية. يمكنك فتح وردية جديدة الآن بمبلغ عهدة افتتاحي.
            </p>

            <div className="w-full max-w-xs bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 mb-4 text-right">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                مبلغ العهدة النقدية الافتتاحية ({settings.baseCurrency}):
              </label>
              <input
                type="number"
                value={newOpeningCash}
                onChange={(e) => setNewOpeningCash(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-base font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleStartNewShift}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
            >
              فتح وردية جديدة وبدء العمل
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Shift Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-right">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">العهدة الافتتاحية:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {currentDailyClosing.openingCash} {settings.baseCurrency}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">مبيعات الكاش (نقد):</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {currentDailyClosing.totalCashSales} {settings.baseCurrency}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">مبيعات الشبكة / البنك:</span>
                <span className="text-sm font-bold text-sky-400 font-mono">
                  {currentDailyClosing.totalBankSales} {settings.baseCurrency}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">مبيعات الآجل (ديون):</span>
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {currentDailyClosing.totalCreditSales} {settings.baseCurrency}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">تحصيل ديون كاش:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  +{currentDailyClosing.totalCashCollected} {settings.baseCurrency}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">مصروفات ودفعات كاش:</span>
                <span className="text-sm font-bold text-rose-400 font-mono">
                  -{currentDailyClosing.totalCashExpenses} {settings.baseCurrency}
                </span>
              </div>
            </div>

            {/* Expected vs Counted Summary Banner */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">النقد المتوقع في الدرج:</span>
                <span className="text-lg font-extrabold text-white font-mono">
                  {expectedCash.toFixed(2)} {settings.baseCurrency}
                </span>
              </div>

              <div className="text-left">
                <span className="text-[11px] text-slate-400 block">المعدود الفعلي بالدرج:</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {countedCash.toFixed(2)} {settings.baseCurrency}
                </span>
              </div>
            </div>

            {/* Variance indicator */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                variance === 0
                  ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                  : variance > 0
                  ? 'bg-blue-950/30 border-blue-800 text-blue-300'
                  : 'bg-rose-950/30 border-rose-800 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {variance === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  {variance === 0
                    ? 'الجرد متطابق 100% ولا توجد فروقات'
                    : variance > 0
                    ? `يوجد زيادة نقدية في الصندوق بقيمة ${variance.toFixed(2)} ${settings.baseCurrency}`
                    : `يوجد عجز نقدي في الصندوق بقيمة ${Math.abs(variance).toFixed(2)} ${settings.baseCurrency}`}
                </span>
              </div>
              <span className="font-mono text-sm">{variance > 0 ? `+${variance}` : variance}</span>
            </div>

            {/* Denomination Counter Breakdown */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>عد فئات العملة الورقية والمعدنية:</span>
                </div>
                <button
                  onClick={() =>
                    setDenominations({
                      '500': 0,
                      '200': 0,
                      '100': 0,
                      '50': 0,
                      '20': 0,
                      '10': 0,
                      '5': 0,
                      '1': 0,
                    })
                  }
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  تصفير
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(denominations).map((denom) => (
                  <div key={denom} className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-bold text-white font-mono">{denom} ر.س</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ={(Number(denom) * (denominations[denom] || 0)).toFixed(0)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom] || ''}
                      onChange={(e) => handleDenomChange(denom, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">ملاحظات التقفيل والجرد:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أية ملاحظات حول الوردية أو أسباب الفروقات..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleCloseShift}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد التقفيل وإغلاق الوردية (Z-Report)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                title="طباعة التقرير الفوري"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
