import React from 'react';
import { BookOpen, Plus, Search, X, FileDown, Video } from 'lucide-react';
import { ViewTab } from '../types/book';

interface HeaderProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onOpenNewBookModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  currentlyReadingCount: number;
  onExportTotalPDF?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewBookModal,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
  currentlyReadingCount,
  onExportTotalPDF,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#fffefc]/90 backdrop-blur-md border-b border-[#ebdcd0] w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand Zone: 1 single element wordmark */}
        <div
          onClick={() => onSelectTab('libreria')}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#8b5e34] text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="text-base sm:text-xl font-bold tracking-tight text-[#2c2724] font-serif-book">
            ExLibris
          </span>
        </div>

        {/* Desktop Nav Zone: 4-5 single-line clean text links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#786c62]">
          <button
            onClick={() => onSelectTab('libreria')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#2c2724] ${
              activeTab === 'libreria' ? 'text-[#8b5e34] font-semibold' : ''
            }`}
          >
            Libreria
          </button>
          <button
            onClick={() => onSelectTab('in_lettura')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#2c2724] flex items-center gap-1.5 ${
              activeTab === 'in_lettura' ? 'text-[#8b5e34] font-semibold' : ''
            }`}
          >
            <span>In Lettura</span>
            {currentlyReadingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-[#8b5e34] text-white rounded-full">
                {currentlyReadingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('citazioni')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#2c2724] ${
              activeTab === 'citazioni' ? 'text-[#8b5e34] font-semibold' : ''
            }`}
          >
            Citazioni
          </button>
          <button
            onClick={() => onSelectTab('statistiche')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#2c2724] ${
              activeTab === 'statistiche' ? 'text-[#8b5e34] font-semibold' : ''
            }`}
          >
            Statistiche
          </button>
        </nav>

        {/* Action Zone: Search toggle + Total PDF report + Primary Action button */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            onClick={onToggleSearch}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
              isSearchOpen || searchQuery
                ? 'bg-[#f4ece3] text-[#8b5e34]'
                : 'text-[#786c62] hover:bg-[#faf7f2] hover:text-[#2c2724]'
            }`}
            title="Cerca libro"
          >
            <Search className="w-4 h-4" />
          </button>

          {onExportTotalPDF && (
            <button
              onClick={onExportTotalPDF}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-[#8b5e34] bg-[#f5ede2] hover:bg-[#ebdcd0] rounded-xl transition-colors flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-2xs"
              title="Guarda video ed esporta Report PDF dell'intera libreria"
            >
              <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8b5e34]" />
              <span className="hidden md:inline">Report PDF</span>
              <span className="hidden sm:inline md:hidden">PDF</span>
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#8b5e34]/15 rounded text-[9px] text-[#8b5e34] font-bold tracking-tight">
                <Video className="w-2.5 h-2.5 text-[#8b5e34]" />
                <span>AD</span>
              </span>
            </button>
          )}

          <button
            onClick={onOpenNewBookModal}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#8b5e34] hover:bg-[#724b27] rounded-xl shadow-xs shadow-[#8b5e34]/20 transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
            title="Aggiungi nuovo libro"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuovo Libro</span>
            <span className="sm:hidden text-xs">Libro</span>
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className="px-4 pb-3 max-w-6xl mx-auto animate-fade-in">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c7e]" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cerca per titolo, autore, genere o citazione..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8c7e] hover:text-[#2c2724]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
