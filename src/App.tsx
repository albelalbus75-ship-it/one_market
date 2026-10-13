import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { BottomNav, NavTab } from './components/BottomNav';
import { POSScreen } from './components/pos/POSScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { CustomersScreen } from './components/customers/CustomersScreen';
import { SuppliersScreen } from './components/suppliers/SuppliersScreen';
import { TreasuryReportsScreen } from './components/reports/TreasuryReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { LockScreenModal } from './components/auth/LockScreenModal';
import { DailyClosingModal } from './components/pos/DailyClosingModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const { cart } = useStore();
  const [currentTab, setCurrentTab] = useState<NavTab>('pos');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-amber-950 px-3 py-1 text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>وضع عدم الاتصال نشط (Offline-First) — جميع البيانات تُحفظ محلياً على جهازك</span>
        </div>
      )}

      {/* Top App Bar */}
      <Navbar onOpenClosingModal={() => setIsClosingModalOpen(true)} />

      {/* Main Tab Screen Content */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'pos' && <POSScreen />}
        {currentTab === 'inventory' && <InventoryScreen />}
        {currentTab === 'customers' && <CustomersScreen />}
        {currentTab === 'suppliers' && <SuppliersScreen />}
        {currentTab === 'treasury_reports' && <TreasuryReportsScreen />}
        {currentTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Bottom Android Tab Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        cartCount={cart.length}
      />

      {/* Security PIN Lock Screen */}
      <LockScreenModal />

      {/* Cash Drawer Daily Closing (Z-Report) */}
      <DailyClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
