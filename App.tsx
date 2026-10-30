import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Filter,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  BookMarked,
  Search,
  FileDown,
  Video,
} from 'lucide-react';
import { Book, ReadingStatus, ReadingGoal, ViewTab, SortOption } from './types/book';
import {
  loadBooks,
  saveBooks,
  loadReadingGoal,
  saveReadingGoal,
  isNativeAndroid,
  INITIAL_BOOKS,
} from './services/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BookCard } from './components/BookCard';
import { BookDetailModal } from './components/BookDetailModal';
import { BookFormModal } from './components/BookFormModal';
import { QuotesView } from './components/QuotesView';
import { StatsView } from './components/StatsView';
import { AdMobBanner } from './components/AdMobBanner';
import { FullScreenAdModal } from './components/FullScreenAdModal';
import {
  requestNativeInterstitialAd,
  requestNativeRewardedAd,
  recordFullscreenAdShown,
  resetFullscreenAdTimer,
  isInterstitialAdReady,
} from './services/adService';
import { generateTotalLibraryPDF } from './services/pdfReportService';

// Generated literary hero image
import heroBannerImg from './assets/images/reading_journal_hero_1792745113387.jpg';

export default function App() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [goal, setGoal] = useState<ReadingGoal>(() => loadReadingGoal());
  const [activeTab, setActiveTab] = useState<ViewTab>('libreria');

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<string>('tutti');
  const [selectedGenre, setSelectedGenre] = useState<string>('tutti');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modals
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isExportingTotalPDF, setIsExportingTotalPDF] = useState(false);

  const handleExportTotalPDF = () => {
    if (isExportingTotalPDF) return;

    const executeTotalPdf = async () => {
      setIsExportingTotalPDF(true);
      try {
        await generateTotalLibraryPDF(books);
      } catch (err: unknown) {
        console.error('Error generating total PDF:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (typeof window !== 'undefined' && (window as unknown as { AndroidNative?: { showToast?: (s: string) => void } }).AndroidNative?.showToast) {
          (window as unknown as { AndroidNative?: { showToast?: (s: string) => void } }).AndroidNative?.showToast?.('Errore PDF libreria: ' + errMsg);
        } else {
          alert('Errore generazione PDF: ' + errMsg);
        }
      } finally {
        setIsExportingTotalPDF(false);
      }
    };

    handleRequestRewardedAd(executeTotalPdf);
  };

  // Full-Screen Ad States (Rewarded Video & 5-Minute Interstitial)
  const [interstitialModalOpen, setInterstitialModalOpen] = useState(false);
  const [rewardedModalOpen, setRewardedModalOpen] = useState(false);
  const [rewardedCallback, setRewardedCallback] = useState<(() => void) | null>(null);

  // Reset ads timer to 0 elapsed time upon opening the app
  useEffect(() => {
    resetFullscreenAdTimer();
  }, []);

  // Handles menu button clicks: triggers full-screen ad ONLY after timer has expired (5 min)
  const handleSelectBottomTab = (tab: ViewTab) => {
    setIsFormOpen(false);
    setSelectedBook(null);
    setActiveTab(tab);

    // Once timer is expired (5 min since app open or last ad), trigger ad on menu button press
    if (isInterstitialAdReady()) {
      recordFullscreenAdShown();

      // 1. Try native Android Interstitial Ad first
      const handledByNative = requestNativeInterstitialAd(() => {
        recordFullscreenAdShown();
      });

      // 2. Fallback to Web preview simulated Interstitial Ad
      if (!handledByNative) {
        setInterstitialModalOpen(true);
      }
    }
  };

  const handleRequestRewardedAd = (onRewardEarned: () => void) => {
    // 1. Try native Android Rewarded Ad first
    const handledByNative = requestNativeRewardedAd(() => {
      recordFullscreenAdShown();
      onRewardEarned();
    });

    // 2. Fallback to Web preview simulated Rewarded Ad
    if (!handledByNative) {
      setRewardedCallback(() => onRewardEarned);
      setRewardedModalOpen(true);
    }
  };

  // Synchronize state with LocalStorage
  const handleUpdateBooks = (updatedBooks: Book[]) => {
    setBooks(updatedBooks);
    saveBooks(updatedBooks);
  };

  const handleUpdateGoal = (newGoal: ReadingGoal) => {
    setGoal(newGoal);
    saveReadingGoal(newGoal);
  };

  // Add or edit book handler
  const handleSaveBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const now = new Date().toISOString();
    if (bookData.id) {
      // Edit existing
      const updated = books.map((b) =>
        b.id === bookData.id
          ? {
              ...b,
              ...bookData,
              updatedAt: now,
            }
          : b
      );
      handleUpdateBooks(updated);
      if (selectedBook && selectedBook.id === bookData.id) {
        setSelectedBook({
          ...selectedBook,
          ...bookData,
          updatedAt: now,
        });
      }
    } else {
      // Create new book
      const newBook: Book = {
        ...bookData,
        id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newBook, ...books];
      handleUpdateBooks(updated);
    }
    setEditingBook(null);
  };

  const handleDeleteBook = (id: string) => {
    const updated = books.filter((b) => b.id !== id);
    handleUpdateBooks(updated);
    if (selectedBook?.id === id) {
      setSelectedBook(null);
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = books.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
    handleUpdateBooks(updated);
    if (selectedBook?.id === id) {
      setSelectedBook({ ...selectedBook, isFavorite: !selectedBook.isFavorite });
    }
  };

  const handleUpdateStatus = (id: string, newStatus: ReadingStatus) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated = books.map((b) => {
      if (b.id !== id) return b;
      const isFinishing = newStatus === 'letto';
      return {
        ...b,
        status: newStatus,
        endDate: isFinishing && !b.endDate ? today : b.endDate,
        currentPage: isFinishing ? b.totalPages : b.currentPage,
        updatedAt: new Date().toISOString(),
      };
    });
    handleUpdateBooks(updated);
    if (selectedBook?.id === id) {
      const updatedSelected = updated.find((b) => b.id === id) || null;
      setSelectedBook(updatedSelected);
    }
  };

  const handleUpdateRating = (id: string, newRating: number) => {
    const updated = books.map((b) => (b.id === id ? { ...b, rating: newRating } : b));
    handleUpdateBooks(updated);
    if (selectedBook?.id === id) {
      setSelectedBook({ ...selectedBook, rating: newRating });
    }
  };

  const handleUpdateProgress = (id: string, newPage: number) => {
    const updated = books.map((b) =>
      b.id === id ? { ...b, currentPage: Math.min(b.totalPages || newPage, newPage) } : b
    );
    handleUpdateBooks(updated);
    if (selectedBook?.id === id) {
      setSelectedBook({ ...selectedBook, currentPage: newPage });
    }
  };

  const handleQuickPageAdvance = (id: string, addedPages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const newPage = Math.min(book.totalPages || book.currentPage + addedPages, book.currentPage + addedPages);
    handleUpdateProgress(id, newPage);
  };

  const handleAddQuote = (bookId: string, quoteText: string, page?: string) => {
    const newQuote = {
      id: `q-${Date.now()}`,
      text: quoteText,
      page,
      createdAt: new Date().toISOString(),
    };
    const updated = books.map((b) =>
      b.id === bookId ? { ...b, quotes: [newQuote, ...(b.quotes || [])] } : b
    );
    handleUpdateBooks(updated);
    if (selectedBook?.id === bookId) {
      setSelectedBook({ ...selectedBook, quotes: [newQuote, ...(selectedBook.quotes || [])] });
    }
  };

  const handleDeleteQuote = (bookId: string, quoteId: string) => {
    const updated = books.map((b) =>
      b.id === bookId
        ? { ...b, quotes: (b.quotes || []).filter((q) => q.id !== quoteId) }
        : b
    );
    handleUpdateBooks(updated);
    if (selectedBook?.id === bookId) {
      setSelectedBook({
        ...selectedBook,
        quotes: (selectedBook.quotes || []).filter((q) => q.id !== quoteId),
      });
    }
  };

  // Distinct genres for filtering
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.genre) set.add(b.genre);
    });
    return Array.from(set).sort();
  }, [books]);

  // Filtered & Sorted books
  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => {
        // Tab specific pre-filters
        if (activeTab === 'in_lettura') {
          if (b.status !== 'in_lettura') return false;
        }

        // Status Filter
        if (activeTab === 'libreria') {
          if (statusFilter === 'in_lettura' && b.status !== 'in_lettura') return false;
          if (statusFilter === 'letto' && b.status !== 'letto') return false;
          if (statusFilter === 'da_leggere' && b.status !== 'da_leggere') return false;
          if (statusFilter === 'preferiti' && !b.isFavorite) return false;
        }

        // Genre Filter
        if (selectedGenre !== 'tutti' && b.genre !== selectedGenre) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = b.title.toLowerCase().includes(q);
          const matchesAuthor = b.author.toLowerCase().includes(q);
          const matchesGenre = b.genre.toLowerCase().includes(q);
          const matchesReview = b.review?.toLowerCase().includes(q);
          const matchesQuotes = b.quotes?.some((quote) => quote.text.toLowerCase().includes(q));
          if (!matchesTitle && !matchesAuthor && !matchesGenre && !matchesReview && !matchesQuotes) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'rating_desc') return b.rating - a.rating;
        if (sortOption === 'title_asc') return a.title.localeCompare(b.title);
        if (sortOption === 'pages_desc') return b.totalPages - a.totalPages;
        if (sortOption === 'duration_asc') return (a.durationDays || 999) - (b.durationDays || 999);
        // Default: recent
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [books, activeTab, statusFilter, selectedGenre, sortOption, searchQuery]);

  const currentlyReadingCount = useMemo(
    () => books.filter((b) => b.status === 'in_lettura').length,
    [books]
  );

  const [isNative, setIsNative] = useState(() => isNativeAndroid());

  useEffect(() => {
    // Re-verify if AndroidNative bridge is injected or class added
    if (isNativeAndroid()) {
      setIsNative(true);
    }
  }, []);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#fbf9f5] flex flex-col font-sans selection:bg-[#dfd7cc]">
      {/* Top Bar Contract */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewBookModal={() => {
          setEditingBook(null);
          setIsFormOpen(true);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        currentlyReadingCount={currentlyReadingCount}
        onExportTotalPDF={handleExportTotalPDF}
      />

      {/* Main Content Area: generous bottom padding ensures no content or buttons are ever covered by bottom bars */}
      <main className={`flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 ${isNative ? 'pb-24' : 'pb-36 md:pb-24'}`}>
        {/* TAB 1: LIBRERIA */}
        {activeTab === 'libreria' && (
          <div className="space-y-5">
            {/* Literary Hero Welcome Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#ebdcd0] overflow-hidden bg-white shadow-xs relative">
              <div className="flex flex-col md:flex-row items-center">
                <div className="p-5 sm:p-7 flex-1 min-w-0 z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4ece3] text-[#8b5e34] text-xs font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Registro & Taccuino di Lettura</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-[#2c2724] font-serif-book leading-tight">
                    Il Tuo Archivio Letterario Personale
                  </h1>

                  <p className="text-xs sm:text-sm text-[#786c62] mt-2 max-w-lg leading-relaxed">
                    Registra i libri letti, analizza i personaggi preferiti e peggiori, annota le citazioni più belle e stampa report completi in PDF. Tutto custodito nel tuo diario letterario personale.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <button
                      onClick={() => {
                        setEditingBook(null);
                        setIsFormOpen(true);
                      }}
                      className="px-4 py-2 bg-[#8b5e34] hover:bg-[#724b27] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registra Nuovo Libro</span>
                    </button>

                    <button
                      onClick={handleExportTotalPDF}
                      disabled={isExportingTotalPDF}
                      className="px-3.5 py-2 bg-[#f5ede2] hover:bg-[#ebdcd0] disabled:opacity-60 text-[#8b5e34] rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Guarda video e scarica o condividi il report PDF completo della libreria"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>{isExportingTotalPDF ? 'Generazione PDF...' : 'Report PDF Libreria'}</span>
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#8b5e34]/15 rounded text-[9px] text-[#8b5e34] font-bold tracking-tight">
                        <Video className="w-2.5 h-2.5 text-[#8b5e34]" />
                        <span>AD</span>
                      </span>
                    </button>

                    <div className="text-xs text-[#8c7f73] flex items-center gap-2 pl-1">
                      <span>{books.length} libri archiviati</span>
                      <span aria-hidden="true">·</span>
                      <span>{books.filter((b) => b.status === 'letto').length} letti</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-5/12 h-44 sm:h-52 md:h-64 relative overflow-hidden shrink-0">
                  <img
                    src={heroBannerImg}
                    alt="Diario di lettura"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-transparent to-transparent opacity-80" />
                </div>
              </div>
            </div>

            {/* Filter Bar & Controls */}
            <div className="bg-[#fffefc] p-3.5 sm:p-4 rounded-2xl border border-[#ebdcd0] space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Segmented Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: 'tutti', label: 'Tutti' },
                    { id: 'in_lettura', label: 'In lettura' },
                    { id: 'letto', label: 'Letti' },
                    { id: 'da_leggere', label: 'Da leggere' },
                    { id: 'preferiti', label: 'Preferiti' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                        statusFilter === tab.id
                          ? 'bg-[#8b5e34] text-white shadow-xs font-semibold'
                          : 'bg-[#faf7f2] text-[#786c62] hover:text-[#2c2724]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Genre & Sort Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Genre dropdown */}
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-[#faf7f2] border border-[#ded5cb] rounded-xl text-[#4e433a] focus:outline-none focus:border-[#8b5e34]"
                  >
                    <option value="tutti">Tutti i generi</option>
                    {allGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  {/* Sort dropdown */}
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-2.5 py-1.5 text-xs bg-[#faf7f2] border border-[#ded5cb] rounded-xl text-[#4e433a] focus:outline-none focus:border-[#8b5e34]"
                  >
                    <option value="recent">Più recenti</option>
                    <option value="rating_desc">Voto più alto</option>
                    <option value="title_asc">Titolo (A-Z)</option>
                    <option value="pages_desc">Più pagine</option>
                    <option value="duration_asc">Lettura più veloce</option>
                  </select>
                </div>
              </div>

              {/* Active Search Badge Info */}
              {searchQuery && (
                <div className="flex items-center justify-between text-xs text-[#786c62] pt-1 border-t border-[#f2eae1]">
                  <span>
                    Risultati per: <strong className="text-[#2c2724]">"{searchQuery}"</strong> (
                    {filteredBooks.length} trovati)
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#8b5e34] hover:underline"
                  >
                    Azzera ricerca
                  </button>
                </div>
              )}
            </div>

            {/* Books Grid */}
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onOpenDetail={setSelectedBook}
                    onToggleFavorite={handleToggleFavorite}
                    onQuickPageAdvance={handleQuickPageAdvance}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[#786c62] bg-[#fffefc] rounded-2xl border border-[#ebdcd0] p-6 space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-[#c4b6a8]" />
                <h3 className="text-base font-semibold text-[#2c2724] font-serif-book">
                  Nessun libro trovato
                </h3>
                <p className="text-xs text-[#8c7f73] max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'tutti' || selectedGenre !== 'tutti'
                    ? 'Nessun volume corrisponde ai filtri selezionati. Prova a reimpostare i criteri.'
                    : 'Il tuo registro di lettura è ancora vuoto. Inizia aggiungendo il tuo primo libro letto!'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('tutti');
                    setSelectedGenre('tutti');
                    setEditingBook(null);
                    setIsFormOpen(true);
                  }}
                  className="mt-2 px-4 py-2 bg-[#8b5e34] text-white rounded-xl text-xs font-semibold hover:bg-[#724b27] transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Aggiungi un Libro</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IN LETTURA */}
        {activeTab === 'in_lettura' && (
          <div className="space-y-5">
            <div className="p-5 sm:p-6 bg-[#fffefc] rounded-2xl border border-[#ebdcd0]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8b5e34] mb-1">
                <BookMarked className="w-4 h-4" />
                <span>Libri aperti sulla scrivania</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2c2724] font-serif-book">
                Attualmente In Lettura ({currentlyReadingCount})
              </h2>
              <p className="text-xs sm:text-sm text-[#786c62] mt-1">
                Aggiorna le pagine lette ogni giorno con un tocco e tieni traccia del tuo ritmo.
              </p>
            </div>

            {currentlyReadingCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {books
                  .filter((b) => b.status === 'in_lettura')
                  .map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onOpenDetail={setSelectedBook}
                      onToggleFavorite={handleToggleFavorite}
                      onQuickPageAdvance={handleQuickPageAdvance}
                    />
                  ))}
              </div>
            ) : (
              <div className="py-16 text-center text-[#786c62] bg-[#fffefc] rounded-2xl border border-[#ebdcd0] p-6 space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-[#c4b6a8]" />
                <h3 className="text-base font-semibold text-[#2c2724] font-serif-book">
                  Non hai nessun libro aperto al momento
                </h3>
                <p className="text-xs text-[#8c7f73] max-w-sm mx-auto">
                  Scegli un libro dalla tua libreria oppure registralo subito per iniziare a tracciare le tue pagine.
                </p>
                <button
                  onClick={() => {
                    setEditingBook(null);
                    setIsFormOpen(true);
                  }}
                  className="px-4 py-2 bg-[#8b5e34] text-white rounded-xl text-xs font-semibold hover:bg-[#724b27] transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inizia una Nuova Lettura</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CITAZIONI */}
        {activeTab === 'citazioni' && (
          <QuotesView
            books={books}
            onOpenBook={setSelectedBook}
            onAddQuoteToBook={handleAddQuote}
          />
        )}

        {/* TAB 4: STATISTICHE */}
        {activeTab === 'statistiche' && (
          <StatsView
            books={books}
            goal={goal}
            onUpdateGoal={handleUpdateGoal}
            onOpenBook={setSelectedBook}
            onRequestRewardedAd={handleRequestRewardedAd}
          />
        )}
      </main>

      {/* Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        onEdit={(book) => {
          setSelectedBook(null);
          setEditingBook(book);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteBook}
        onUpdateStatus={handleUpdateStatus}
        onUpdateRating={handleUpdateRating}
        onUpdateProgress={handleUpdateProgress}
        onAddQuote={handleAddQuote}
        onDeleteQuote={handleDeleteQuote}
        onToggleFavorite={handleToggleFavorite}
        onRequestRewardedAd={handleRequestRewardedAd}
      />

      {/* Book Form Modal (New or Edit) */}
      <BookFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBook(null);
        }}
        onSave={handleSaveBook}
        initialBook={editingBook}
        onRequestRewardedAd={handleRequestRewardedAd}
      />

      {/* Rewarded Video Ad Modal for Web Preview */}
      <FullScreenAdModal
        isOpen={rewardedModalOpen}
        type="rewarded"
        onClose={() => {
          setRewardedModalOpen(false);
          setRewardedCallback(null);
        }}
        onRewardEarned={() => {
          recordFullscreenAdShown();
          if (rewardedCallback) {
            rewardedCallback();
            setRewardedCallback(null);
          }
        }}
      />

      {/* Periodic 5-Minute Interstitial Ad Modal for Web Preview */}
      <FullScreenAdModal
        isOpen={interstitialModalOpen}
        type="interstitial"
        onClose={() => {
          recordFullscreenAdShown();
          setInterstitialModalOpen(false);
        }}
      />

      {/* Mobile Fixed Bottom Bar: BottomNav docked directly with AdMob banner (0px gap) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col shadow-lg border-t border-[#ebdcd0] bg-[#fffefc]">
        <BottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectBottomTab}
          currentlyReadingCount={currentlyReadingCount}
        />

        {/* When NOT in native Android (Web / preview), attach the test AdMob banner
            directly below the bottom menu with ZERO gap.
            In native Android, the native AdView in activity_main.xml already sits below the WebView! */}
        {!isNative && (
          <AdMobBanner />
        )}
      </div>

      {/* Desktop AdMob Test Banner fixed at bottom for web preview */}
      {!isNative && (
        <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50">
          <AdMobBanner />
        </div>
      )}
    </div>
  );
}
