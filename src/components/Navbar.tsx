import React, { useState } from 'react';
import {
  Lock,
  Cloud,
  CloudOff,
  RefreshCw,
  Building2,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './common/PWAInstallButton';

export const Navbar: React.FC<{ onOpenClosingModal: () => void }> = ({ onOpenClosingModal }) => {
  const {
    settings,
    currentStaff,
    staff,
    setCurrentStaff,
    setIsLocked,
    warehouses,
    activeWarehouseId,
    setActiveWarehouseId,
    cloudSync,
    currentDailyClosing,
  } = useStore();

  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showStaffMenu, setShowStaffMenu] = useState(false);
  const [showWarehouseMenu, setShowWarehouseMenu] = useState(false);

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId) || warehouses[0];

  const handleSync = async () => {
    setIsSyncing(true);
    await cloudSync();
    setIsSyncing(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-900/40">
            <span className="text-white font-bold text-sm">متجر</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
              {settings.storeName || 'دفتر متجري'}
            </span>
          </div>
        </div>

        {/* Zone 2: Contextual Controls (Warehouse + Shift status) */}
        <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Warehouse Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowWarehouseMenu(!showWarehouseMenu);
                setShowStaffMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg transition"
              title="تغيير الفرع أو المستودع النشط"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[90px] sm:max-w-[130px]">{activeWarehouse.name}</span>
            </button>

            {showWarehouseMenu && (
              <div className="absolute top-full mt-1.5 right-0 w-52 bg-slate-850 border border-slate-700 rounded-xl shadow-xl py-1 z-40 bg-slate-900 text-right">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  اختر المستودع / الفرع النشط
                </div>
                {warehouses.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWarehouseId(w.id);
                      setShowWarehouseMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      w.id === activeWarehouseId ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-200'
                    }`}
                  >
                    <span>{w.name}</span>
                    {w.id === activeWarehouseId && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cash Drawer / Shift Indicator */}
          <button
            onClick={onOpenClosingModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
              currentDailyClosing
                ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
            title="تقفيل الصندوق والوردية اليومية (Z-Report)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="whitespace-nowrap">الوردية مفتوحة</span>
          </button>
        </div>

        {/* Zone 3: Staff & Lock & Install */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <PWAInstallButton />

          {/* Cloud Sync Status */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 transition"
            title={isOnline ? 'مزامنة البيانات السحابية (يعمل أوفلاين)' : 'أنت في وضع عدم الاتصال (حفظ محلي)'}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : isOnline ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Staff Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStaffMenu(!showStaffMenu);
                setShowWarehouseMenu(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <User className="w-3.5 h-3.5 text-slate-300" />
              <span className="truncate max-w-[75px] sm:max-w-[100px] text-slate-200">{currentStaff.name}</span>
            </button>

            {showStaffMenu && (
              <div className="absolute top-full mt-1.5 left-0 sm:right-0 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-40 text-right">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  تبديل الموظف / الكاشير
                </div>
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentStaff(s);
                      setShowStaffMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                      s.id === currentStaff.id ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-200'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {s.role === 'owner' ? 'مالك' : s.role === 'manager' ? 'مدير' : 'كاشير'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lock Screen */}
          <button
            onClick={() => setIsLocked(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-slate-300 transition"
            title="قفل الشاشة برمز PIN"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
