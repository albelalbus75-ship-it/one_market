import React from 'react';
import {
  ShoppingCart,
  Boxes,
  Users,
  Truck,
  BarChart3,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'pos'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'treasury_reports'
  | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, cartCount }) => {
  const tabs = [
    { id: 'pos' as NavTab, label: 'نقطة البيع', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
    { id: 'inventory' as NavTab, label: 'المخزون', icon: Boxes },
    { id: 'customers' as NavTab, label: 'العملاء والديون', icon: Users },
    { id: 'suppliers' as NavTab, label: 'المشتريات', icon: Truck },
    { id: 'treasury_reports' as NavTab, label: 'التقارير والمالية', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 select-none pb-safe">
      <div className="max-w-7xl mx-auto flex items-center justify-around h-15 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors min-w-[50px] ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
