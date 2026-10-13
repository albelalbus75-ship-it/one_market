import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, ShieldAlert } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { posAudio } from '../../utils/audio';

export const LockScreenModal: React.FC = () => {
  const { isLocked, unlockWithPin, currentStaff, staff, setCurrentStaff } = useStore();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pinInput.length >= 6) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    posAudio.playClick();
    setErrorMsg(false);

    if (nextPin.length === 4) {
      setTimeout(() => {
        const success = unlockWithPin(nextPin);
        if (!success) {
          setErrorMsg(true);
          setPinInput('');
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    posAudio.playClick();
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(false);
  };

  const handleBiometric = () => {
    posAudio.playClick();
    // Biometric fingerprint simulation
    setTimeout(() => {
      unlockWithPin(currentStaff.pin);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mb-3">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-bold text-white mb-1">شاشة القفل والأمان</h2>
        <p className="text-xs text-slate-400 mb-4">
          أدخل رمز الـ PIN الخاص بـ <span className="text-emerald-400 font-semibold">{currentStaff.name}</span>
        </p>

        {/* PIN dots */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pinInput.length > idx
                  ? 'bg-emerald-400 scale-125'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 px-3 py-1.5 rounded-xl mb-4 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>رمز PIN غير صحيح. جرب مرة أخرى</span>
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBiometric}
            className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 active:scale-95 text-emerald-400 transition flex items-center justify-center"
            title="فتح بالبصمة"
          >
            <Fingerprint className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 active:scale-95 text-slate-300 transition flex items-center justify-center"
            title="حذف"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Quick switch staff */}
        <div className="border-t border-slate-800/80 pt-3 w-full">
          <span className="text-[11px] text-slate-400 block mb-2">تسجيل دخول موظف آخر:</span>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {staff.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentStaff(s);
                  setPinInput('');
                  setErrorMsg(false);
                }}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  s.id === currentStaff.id
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
