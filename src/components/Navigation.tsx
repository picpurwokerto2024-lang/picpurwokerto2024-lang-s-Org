import React from 'react';
import {
  LayoutDashboard,
  Coins,
  BookOpen,
  Users,
  FileSpreadsheet,
  Target,
  Settings,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { ClassConfig, TabType } from '../types';

export type TabKey = TabType;

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  unpaidCountToday?: number;
  classConfig?: ClassConfig;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unpaidCountToday = 0,
  classConfig,
}) => {
  const allTabs = [
    {
      key: 'dashboard' as TabKey,
      label: 'Beranda',
      icon: LayoutDashboard,
    },
    {
      key: 'jimpitan' as TabKey,
      label: 'Iuran',
      icon: Coins,
      badge: unpaidCountToday > 0 ? `${unpaidCountToday}` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      key: 'kas' as TabKey,
      label: 'Buku Kas',
      icon: BookOpen,
    },
    {
      key: 'siswa' as TabKey,
      label: 'Siswa',
      icon: Users,
    },
    {
      key: 'celengan' as TabKey,
      label: 'Target Kas',
      icon: Target,
    },
    {
      key: 'laporan' as TabKey,
      label: 'Laporan',
      icon: FileSpreadsheet,
    },
  ];

  // Filter tabs according to pengurus preferences
  const enabledTabKeys = classConfig?.enabledTabs || ['dashboard', 'jimpitan', 'kas', 'siswa', 'celengan', 'laporan'];
  const visibleTabs = allTabs.filter((tab) => enabledTabKeys.includes(tab.key));

  const customNavBars = (classConfig?.customNavBars || []).filter((bar) => bar.isActive);

  return (
    <>
      {/* Desktop / Tablet Navigation Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200 sticky top-[61px] z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <nav className="flex items-center space-x-1 py-1.5 overflow-x-auto scrollbar-none">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`nav-tab-${tab.key}`}
                  onClick={() => onSelectTab(tab.key)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>

                  {tab.badge && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-teal-800' : tab.badgeColor
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Custom Navigation Bars added by Pengurus */}
            {customNavBars.map((bar) => (
              <a
                key={bar.id}
                href={bar.url || '#'}
                target={bar.url ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-900 border border-dashed border-slate-200 hover:border-teal-300 transition whitespace-nowrap"
              >
                <span>{bar.icon || '📌'}</span>
                <span>{bar.label}</span>
                {bar.url && <ExternalLink className="w-3 h-3 text-slate-400" />}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan & Bar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (App Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 pb-safe print:hidden">
        <nav
          className="grid gap-1 items-center"
          style={{
            gridTemplateColumns: `repeat(${Math.min(visibleTabs.length + (customNavBars.length > 0 ? 1 : 0), 6)}, minmax(0, 1fr))`,
          }}
        >
          {visibleTabs.slice(0, 6).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`mobile-nav-${tab.key}`}
                onClick={() => onSelectTab(tab.key)}
                className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-teal-800 font-bold bg-teal-50/80' : 'text-slate-500 hover:text-slate-800'
                }`}
                style={{ minHeight: '48px' }}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-teal-700' : 'text-slate-400'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-none truncate max-w-[55px]">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
