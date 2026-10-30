import React from 'react';
import { BookOpen, BookmarkCheck, Quote, BarChart3 } from 'lucide-react';
import { ViewTab } from '../types/book';

interface BottomNavProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  currentlyReadingCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  currentlyReadingCount,
}) => {
  const tabs = [
    {
      id: 'libreria' as ViewTab,
      label: 'Libreria',
      icon: BookOpen,
    },
    {
      id: 'in_lettura' as ViewTab,
      label: 'In Lettura',
      icon: BookmarkCheck,
      badge: currentlyReadingCount > 0 ? currentlyReadingCount : undefined,
    },
    {
      id: 'citazioni' as ViewTab,
      label: 'Citazioni',
      icon: Quote,
    },
    {
      id: 'statistiche' as ViewTab,
      label: 'Statistiche',
      icon: BarChart3,
    },
  ];

  return (
    <nav 
      aria-label="Navigazione principale"
      className="w-full bg-[#fffefc]/98 backdrop-blur-md border-t border-[#ebdcd0]"
    >
      <div className="max-w-screen-md mx-auto grid grid-cols-4 h-13 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 relative min-h-[44px] transition-colors ${
                isActive ? 'text-[#8b5e34]' : 'text-[#8c7f73] hover:text-[#2c2724]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                {typeof tab.badge === 'number' && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#8b5e34] text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight leading-none whitespace-nowrap ${
                  isActive ? 'font-bold text-[#8b5e34]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
