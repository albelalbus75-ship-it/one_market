import React, { useState } from 'react';
import { Scale, X, Check, RefreshCw } from 'lucide-react';
import { Product } from '../../types';
import { posAudio } from '../../utils/audio';

interface WeightScaleModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (weight: number, pricePerUnit: number) => void;
  currencySymbol: string;
}

export const WeightScaleModal: React.FC<WeightScaleModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  currencySymbol,
}) => {
  if (!isOpen || !product) return null;

  const [weightKg, setWeightKg] = useState<number>(1.0);
  const [tareKg, setTareKg] = useState<number>(product.tareWeight || 0);
  const [customPrice, setCustomPrice] = useState<number>(product.sellingPrice);
  const [mode, setMode] = useState<'by_weight' | 'by_amount'>('by_weight');
  const [targetAmount, setTargetAmount] = useState<number>(product.sellingPrice);

  const netWeight = Math.max(0, weightKg - tareKg);
  const totalAmount = Number((netWeight * customPrice).toFixed(2));

  const handleWeightChange = (val: number) => {
    setWeightKg(Math.max(0, val));
  };

  const handleAmountChange = (amt: number) => {
    setTargetAmount(amt);
    if (customPrice > 0) {
      setWeightKg(Number((amt / customPrice).toFixed(3)));
    }
  };

  const handleConfirm = () => {
    posAudio.playClick();
    onConfirm(netWeight, customPrice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">{product.name}</h3>
              <span className="text-[11px] text-slate-400">وزن إلكتروني / تسعير بالوزن أو المبلغ</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-800 p-1 rounded-xl mb-4 gap-1">
          <button
            onClick={() => setMode('by_weight')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'by_weight' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            وزن بالكيلوغرام (كجم)
          </button>
          <button
            onClick={() => setMode('by_amount')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'by_amount' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            مبلغ محدد ({currencySymbol})
          </button>
        </div>

        {/* Digital Scale Display Box */}
        <div className="bg-slate-950 border border-emerald-900/60 rounded-2xl p-4 mb-4 text-center">
          <div className="text-[11px] text-slate-400 mb-1">الوزن الصافي (Net Weight)</div>
          <div className="text-4xl font-extrabold text-emerald-400 font-mono tracking-tight mb-2">
            {netWeight.toFixed(3)} <span className="text-base font-normal text-emerald-500">كجم</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900 px-2 text-slate-300">
            <span>سعر الكيلو: {customPrice} {currencySymbol}</span>
            <span className="font-bold text-white text-sm">
              الإجمالي: {totalAmount} {currencySymbol}
            </span>
          </div>
        </div>

        {/* Quick Weight Adjusters */}
        {mode === 'by_weight' ? (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                min="0"
                value={weightKg || ''}
                onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="0.000"
              />
            </div>

            {/* Preset quick weight buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[0.25, 0.5, 1.0, 2.0].map((w) => (
                <button
                  key={w}
                  onClick={() => handleWeightChange(w)}
                  className="py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
                >
                  {w} كجم
                </button>
              ))}
            </div>

            {/* Tare weight option */}
            <div className="flex items-center justify-between text-xs bg-slate-800/60 p-2 rounded-xl">
              <span className="text-slate-400">وزن الفارغ (العلبة/الكيس):</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={tareKg}
                  onChange={(e) => setTareKg(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-0.5 text-center text-xs text-white"
                />
                <button
                  onClick={() => setTareKg(0)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                  title="تصفير الفارغ"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <label className="text-xs text-slate-400 block">أدخل المبلغ المطلوب بيعه:</label>
            <input
              type="number"
              step="1"
              value={targetAmount || ''}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
              placeholder="0.00"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 20, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleAmountChange(amt)}
                  className="py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60"
                >
                  {amt} {currencySymbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={netWeight <= 0}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-98"
        >
          <Check className="w-4 h-4" />
          <span>إضافة للسلة ({totalAmount} {currencySymbol})</span>
        </button>
      </div>
    </div>
  );
};
