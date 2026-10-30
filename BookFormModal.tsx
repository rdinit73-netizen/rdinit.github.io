import React, { useState, useEffect } from 'react';
import { X, Search, Star, Calendar, Bookmark, Book as BookIcon, Check, Sparkles, Image as ImageIcon, Film, ThumbsUp, UserCheck, UserX } from 'lucide-react';
import { Book, ReadingStatus, BookFormat } from '../types/book';
import { calculateDurationDays, isNativeAndroid } from '../services/storage';
import {
  getCoverAdCooldownRemaining,
  setLastCoverAdTimestamp,
  requestNativeRewardedAd,
  recordFullscreenAdShown,
} from '../services/adService';
import { CoverSearchModal } from './CoverSearchModal';
import { OnlineBookResult } from '../services/bookSearch';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  initialBook?: Book | null;
  onRequestRewardedAd?: (onRewardEarned: () => void) => void;
}

const COMMON_GENRES = [
  'Narrativa',
  'Classico',
  'Giallo / Thriller',
  'Saggistica',
  'Fantasy / Fantascienza',
  'Filosofia',
  'Biografie & Memorie',
  'Poesia',
  'Storia',
  'Crescita Personale',
  'Romance',
  'Altro',
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBook,
  onRequestRewardedAd,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Narrativa');
  const [customGenre, setCustomGenre] = useState('');
  const [format, setFormat] = useState<BookFormat>('cartaceo');
  const [status, setStatus] = useState<ReadingStatus>('in_lettura');
  const [rating, setRating] = useState(0);
  const [totalPages, setTotalPages] = useState<number | ''>(250);
  const [currentPage, setCurrentPage] = useState<number | ''>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState<number | ''>('');
  const [review, setReview] = useState('');
  const [favoriteParts, setFavoriteParts] = useState('');
  const [initialQuote, setInitialQuote] = useState('');
  const [initialQuotePage, setInitialQuotePage] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isbn, setIsbn] = useState('');
  const [favoriteCharacter, setFavoriteCharacter] = useState('');
  const [favoriteCharacterReason, setFavoriteCharacterReason] = useState('');
  const [worstCharacter, setWorstCharacter] = useState('');
  const [worstCharacterReason, setWorstCharacterReason] = useState('');
  const [recommendRating, setRecommendRating] = useState(0);

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(() => getCoverAdCooldownRemaining());
  const isNative = isNativeAndroid();

  // Track 60-second cooldown timer
  useEffect(() => {
    if (!isOpen) return;
    setCooldownRemaining(getCoverAdCooldownRemaining());

    const interval = setInterval(() => {
      const remaining = getCoverAdCooldownRemaining();
      setCooldownRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCoverSearchClick = () => {
    if (cooldownRemaining > 0) return;

    // Start 60-second cooldown from the moment of press
    setLastCoverAdTimestamp(Date.now());
    setCooldownRemaining(60);

    const onRewardEarned = () => {
      recordFullscreenAdShown();
      setIsCoverModalOpen(true);
    };

    // 1. Try native Android Rewarded Ad first
    const handledByNative = requestNativeRewardedAd(onRewardEarned);
    if (!handledByNative) {
      // 2. Fallback to Web preview simulated Rewarded Ad
      if (onRequestRewardedAd) {
        onRequestRewardedAd(onRewardEarned);
      } else {
        onRewardEarned();
      }
    }
  };

  // Initialize or populate form
  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title);
      setAuthor(initialBook.author);
      if (COMMON_GENRES.includes(initialBook.genre)) {
        setGenre(initialBook.genre);
        setCustomGenre('');
      } else {
        setGenre('Altro');
        setCustomGenre(initialBook.genre);
      }
      setFormat(initialBook.format);
      setStatus(initialBook.status);
      setRating(initialBook.rating);
      setTotalPages(initialBook.totalPages || '');
      setCurrentPage(initialBook.currentPage || 0);
      setStartDate(initialBook.startDate || '');
      setEndDate(initialBook.endDate || '');
      setDurationDays(initialBook.durationDays ?? '');
      setReview(initialBook.review || '');
      setFavoriteParts(initialBook.favoriteParts || '');
      setCoverUrl(initialBook.coverUrl || '');
      setIsFavorite(initialBook.isFavorite || false);
      setIsbn(initialBook.isbn || '');
      setFavoriteCharacter(initialBook.favoriteCharacter || '');
      setFavoriteCharacterReason(initialBook.favoriteCharacterReason || '');
      setWorstCharacter(initialBook.worstCharacter || '');
      setWorstCharacterReason(initialBook.worstCharacterReason || '');
      setRecommendRating(initialBook.recommendRating || 0);
      setInitialQuote('');
      setInitialQuotePage('');
    } else {
      // Default new book
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      setAuthor('');
      setGenre('Narrativa');
      setCustomGenre('');
      setFormat('cartaceo');
      setStatus('in_lettura');
      setRating(0);
      setTotalPages(300);
      setCurrentPage(0);
      setStartDate(today);
      setEndDate('');
      setDurationDays(1);
      setReview('');
      setFavoriteParts('');
      setCoverUrl('');
      setIsFavorite(false);
      setIsbn('');
      setFavoriteCharacter('');
      setFavoriteCharacterReason('');
      setWorstCharacter('');
      setWorstCharacterReason('');
      setRecommendRating(0);
      setInitialQuote('');
      setInitialQuotePage('');
    }
  }, [initialBook, isOpen]);

  // Auto-calculate duration days when start/end dates change
  useEffect(() => {
    if (startDate) {
      const calcDays = calculateDurationDays(startDate, endDate || undefined);
      if (calcDays !== null) {
        setDurationDays(calcDays);
      }
    }
  }, [startDate, endDate]);

  // When status is changed to "letto", ensure end date and current page = totalPages
  const handleStatusChange = (newStatus: ReadingStatus) => {
    setStatus(newStatus);
    const today = new Date().toISOString().slice(0, 10);
    if (newStatus === 'letto') {
      if (!endDate) setEndDate(today);
      if (totalPages && (currentPage === 0 || currentPage === '')) {
        setCurrentPage(totalPages);
      }
    } else if (newStatus === 'in_lettura') {
      if (!startDate) setStartDate(today);
    }
  };

  const handleSelectCover = (url: string, autoFill?: Partial<OnlineBookResult>) => {
    setCoverUrl(url);
    if (autoFill) {
      if (!title && autoFill.title) setTitle(autoFill.title);
      if (!author && autoFill.author) setAuthor(autoFill.author);
      if ((!totalPages || totalPages === 300) && autoFill.totalPages) {
        setTotalPages(autoFill.totalPages);
      }
      if (!isbn && autoFill.isbn) setIsbn(autoFill.isbn);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalGenre = genre === 'Altro' && customGenre.trim() ? customGenre.trim() : genre;
    const finalTotal = Number(totalPages) || 0;
    const finalCurrent = Number(currentPage) || 0;

    const existingQuotes = initialBook?.quotes || [];
    const newQuotes = [...existingQuotes];
    if (initialQuote.trim()) {
      newQuotes.push({
        id: `q-${Date.now()}`,
        text: initialQuote.trim(),
        page: initialQuotePage.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    onSave({
      id: initialBook?.id,
      title: title.trim(),
      author: author.trim() || 'Autore sconosciuto',
      genre: finalGenre,
      format,
      status,
      rating,
      totalPages: finalTotal,
      currentPage: Math.min(finalCurrent, finalTotal || finalCurrent),
      startDate,
      endDate: status === 'letto' ? endDate || new Date().toISOString().slice(0, 10) : endDate,
      durationDays: typeof durationDays === 'number' ? durationDays : undefined,
      review: review.trim(),
      favoriteParts: favoriteParts.trim(),
      quotes: newQuotes,
      coverUrl: coverUrl.trim(),
      isFavorite,
      isbn: isbn.trim() || undefined,
      favoriteCharacter: favoriteCharacter.trim() || undefined,
      favoriteCharacterReason: favoriteCharacterReason.trim() || undefined,
      worstCharacter: worstCharacter.trim() || undefined,
      worstCharacterReason: worstCharacterReason.trim() || undefined,
      recommendRating: recommendRating || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-40 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in ${
          isNative ? 'bottom-[54px]' : 'bottom-[102px] md:bottom-0'
        }`}
      >
        <div className="bg-[#fffefc] rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl overflow-hidden border border-[#e8dfd5] mb-1 sm:mb-0">
          {/* Top Bar */}
          <div className="px-5 py-3.5 border-b border-[#ebdcd0] flex items-center justify-between bg-[#fbf8f4]">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#f2e7db] text-[#8b5e34] flex items-center justify-center">
                <BookIcon className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-[#2c2724] font-serif-book">
                  {initialBook ? 'Modifica Scheda Libro' : 'Aggiungi Nuovo Libro al Registro'}
                </h3>
                <span className="text-xs text-[#786c62]">
                  {initialBook ? 'Aggiorna note e progressi' : 'Compila i dettagli e salva nel diario'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#786c62] hover:bg-[#ede5dc] hover:text-[#2c2724] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form scrollable area */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Quick cover + Title & Author section */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Cover thumbnail / action */}
              <div className="w-28 sm:w-32 shrink-0 flex flex-col items-center">
                <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#f0eae1] border border-[#d8cdc1] shadow-inner relative flex items-center justify-center group">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Copertina"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  ) : (
                    <div className="p-3 text-center text-[#9a8c7e]">
                      <ImageIcon className="w-7 h-7 mx-auto mb-1 text-[#b5a79a]" />
                      <span className="text-[10px] leading-tight block">Nessuna copertina</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCoverSearchClick}
                  disabled={cooldownRemaining > 0}
                  title={
                    cooldownRemaining > 0
                      ? `Disponibile tra ${cooldownRemaining}s`
                      : 'Guarda un breve annuncio di prova per sbloccare la ricerca online'
                  }
                  className={`mt-2 w-full py-1.5 px-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                    cooldownRemaining > 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-[#f4ebe0] hover:bg-[#ebdcd0] text-[#8b5e34] border border-[#ebdcd0] active:scale-95 shadow-xs cursor-pointer'
                  }`}
                >
                  <Film className={`w-3.5 h-3.5 shrink-0 ${cooldownRemaining > 0 ? 'text-slate-400' : 'text-[#8b5e34]'}`} />
                  <span className="truncate">
                    {cooldownRemaining > 0
                      ? `Attendi ${cooldownRemaining}s`
                      : 'Cerca Copertina'}
                  </span>
                  {cooldownRemaining === 0 && (
                    <span className="text-[9px] bg-[#8b5e34] text-white px-1 py-0.2 rounded font-black tracking-tight shrink-0">
                      Ad
                    </span>
                  )}
                </button>
              </div>

              {/* Title & Author Fields */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                    Titolo del Libro *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es. Il nome della rosa, Le città invisibili..."
                    className="w-full px-3 py-2 text-sm bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                    Autore *
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Es. Umberto Eco, Italo Calvino..."
                    className="w-full px-3 py-2 text-sm bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                      Genere
                    </label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                    >
                      {COMMON_GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                      Formato
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as BookFormat)}
                      className="w-full px-2.5 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                    >
                      <option value="cartaceo">Cartaceo</option>
                      <option value="ebook">E-book</option>
                      <option value="audiolibro">Audiolibro</option>
                    </select>
                  </div>
                </div>

                {genre === 'Altro' && (
                  <div>
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder="Specifica genere..."
                      className="w-full px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-lg focus:outline-none text-[#2c2724]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status & Rating Selector */}
            <div className="p-3.5 bg-[#fbf8f4] rounded-2xl border border-[#ebdcd0] space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-2">
                  Stato di Lettura
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'in_lettura', label: 'In lettura' },
                    { key: 'letto', label: 'Letto' },
                    { key: 'da_leggere', label: 'Da leggere' },
                    { key: 'abbandonato', label: 'Abbandonato' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleStatusChange(item.key as ReadingStatus)}
                      className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                        status === item.key
                          ? 'bg-[#8b5e34] text-white border-[#8b5e34] shadow-sm font-semibold'
                          : 'bg-white text-[#786c62] border-[#ded5cb] hover:border-[#8b5e34]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-[#4e433a]">
                  Valutazione Personale:
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(rating === starVal ? 0 : starVal)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`${starVal} stelle`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          starVal <= rating
                            ? 'fill-[#d97706] text-[#d97706]'
                            : 'text-[#d8cdc1] hover:text-[#b5a79a]'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-xs font-semibold text-[#d97706] ml-1">
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Consiglieresti la Lettura? (1 a 5 stelle) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#ede5dc]">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#8b5e34]" />
                  <span className="text-xs font-semibold text-[#4e433a]">
                    Consiglieresti la lettura?
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRecommendRating(recommendRating === starVal ? 0 : starVal)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`${starVal} stelle su 5`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          starVal <= recommendRating
                            ? 'fill-[#d97706] text-[#d97706]'
                            : 'text-[#d8cdc1] hover:text-[#b5a79a]'
                        }`}
                      />
                    </button>
                  ))}
                  {recommendRating > 0 ? (
                    <span className="text-xs font-semibold text-[#d97706] ml-1">
                      {recommendRating}/5
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#9a8c7e] ml-1">Non specificato</span>
                  )}
                </div>
              </div>
            </div>

            {/* Reading Dates & Duration Math */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8b5e34]" />
                  <span>Data Inizio</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8b5e34]" />
                  <span>Data Fine</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                  Durata (giorni)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Calcolata auto"
                    className="w-full px-2.5 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#9a8c7e]">
                    giorni
                  </span>
                </div>
              </div>
            </div>

            {/* Pages & Progress */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                  Pagine Totali
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Es. 320"
                  className="w-full px-3 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                  Pagine Lette Attuali
                </label>
                <input
                  type="number"
                  min="0"
                  max={typeof totalPages === 'number' ? totalPages : undefined}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Es. 150"
                  className="w-full px-3 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
                />
              </div>
            </div>

            {/* Recensione & Commenti */}
            <div>
              <label className="block text-xs font-semibold text-[#4e433a] mb-1">
                Recensione / Commento Personale
              </label>
              <textarea
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Cosa ne pensi? Quali emozioni o riflessioni ti ha lasciato questo libro?..."
                className="w-full px-3 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724]"
              />
            </div>

            {/* Parti Più Belle & Riflessioni Chiave */}
            <div>
              <label className="block text-xs font-semibold text-[#4e433a] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8b5e34]" />
                <span>Parti Più Belle / Capitoli Memorabili</span>
              </label>
              <textarea
                rows={2}
                value={favoriteParts}
                onChange={(e) => setFavoriteParts(e.target.value)}
                placeholder="Momento preferito, capitolo chiave, colpo di scena, atmosfera indimenticabile..."
                className="w-full px-3 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724]"
              />
            </div>

            {/* Analisi dei Personaggi: Preferito e Peggiore con relativi motivi */}
            <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#ebdcd0] space-y-3">
              <span className="block text-xs font-bold text-[#4e433a] uppercase tracking-wider">
                Personaggi Notabili & Impressioni
              </span>

              {/* Personaggio Preferito */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Personaggio Preferito</span>
                </div>
                <input
                  type="text"
                  value={favoriteCharacter}
                  onChange={(e) => setFavoriteCharacter(e.target.value)}
                  placeholder="Nome del personaggio preferito..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[#2c2724]"
                />
                <textarea
                  rows={2}
                  value={favoriteCharacterReason}
                  onChange={(e) => setFavoriteCharacterReason(e.target.value)}
                  placeholder="Motivo: perché è il tuo preferito? Quale aspetto o scelta ti ha colpito?..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-[#2c2724]"
                />
              </div>

              {/* Personaggio Peggiore / Meno Amato */}
              <div className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900">
                  <UserX className="w-3.5 h-3.5 text-rose-700" />
                  <span>Personaggio Peggiore / Meno Amato</span>
                </div>
                <input
                  type="text"
                  value={worstCharacter}
                  onChange={(e) => setWorstCharacter(e.target.value)}
                  placeholder="Nome del personaggio peggiore o più sgradito..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-[#2c2724]"
                />
                <textarea
                  rows={2}
                  value={worstCharacterReason}
                  onChange={(e) => setWorstCharacterReason(e.target.value)}
                  placeholder="Motivo: perché lo consideri il peggiore? Quali difetti, ipocrisie o azioni ti sono dispiaciute?..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 text-[#2c2724]"
                />
              </div>
            </div>

            {/* Prima Citazione Facoltativa (se nuovo libro) */}
            {!initialBook && (
              <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#ede5dc] space-y-2">
                <label className="block text-xs font-semibold text-[#4e433a]">
                  Aggiungi una Citazione / Frase Memorabile (Opzionale)
                </label>
                <textarea
                  rows={2}
                  value={initialQuote}
                  onChange={(e) => setInitialQuote(e.target.value)}
                  placeholder="«Inserisci qui una frase indimenticabile del libro...»"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#d8cdc1] rounded-lg focus:outline-none text-[#2c2724] font-serif-book italic"
                />
                <div className="flex justify-end">
                  <input
                    type="text"
                    value={initialQuotePage}
                    onChange={(e) => setInitialQuotePage(e.target.value)}
                    placeholder="Pagina (es. 42)"
                    className="w-32 px-2.5 py-1 text-xs bg-white border border-[#d8cdc1] rounded-lg focus:outline-none text-[#2c2724]"
                  />
                </div>
              </div>
            )}

            {/* Favorite toggle and ISBN */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8b5e34] focus:ring-[#8b5e34] border-[#d8cdc1]"
                />
                <span className="text-xs font-medium text-[#4e433a] flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-[#8b5e34]" />
                  Aggiungi ai libri Preferiti
                </span>
              </label>

              <div className="flex items-center gap-1 text-xs text-[#786c62]">
                <span>ISBN:</span>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="Opzionale"
                  className="w-28 px-2 py-1 text-[11px] bg-[#faf7f2] border border-[#d8cdc1] rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </form>

          {/* Footer Save Action - safely enclosed inside the modal card */}
          <div className="px-5 py-3.5 border-t border-[#ebdcd0] bg-[#fcfaf7] flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-[#786c62] hover:text-[#2c2724] bg-transparent hover:bg-[#ede5dc]/50 rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="px-5 sm:px-6 py-2.5 bg-[#8b5e34] hover:bg-[#724b27] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-[#8b5e34]/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{initialBook ? 'Salva Modifiche' : 'Registra Libro'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Online cover search modal */}
      <CoverSearchModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        initialQuery={`${title} ${author}`.trim()}
        onSelectCover={handleSelectCover}
      />
    </>
  );
};
