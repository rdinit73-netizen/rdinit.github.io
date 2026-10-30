import React, { useState } from 'react';
import {
  X,
  Star,
  Calendar,
  Clock,
  BookOpen,
  Edit3,
  Trash2,
  Bookmark,
  Quote as QuoteIcon,
  Plus,
  Sparkles,
  CheckCircle,
  Copy,
  Check,
  FileDown,
  Video,
  ThumbsUp,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book, ReadingStatus } from '../types/book';
import { isNativeAndroid } from '../services/storage';
import { generateSingleBookPDF } from '../services/pdfReportService';
import { requestNativeRewardedAd } from '../services/adService';

interface BookDetailModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: ReadingStatus) => void;
  onUpdateRating: (id: string, newRating: number) => void;
  onUpdateProgress: (id: string, newPage: number) => void;
  onAddQuote: (bookId: string, quoteText: string, page?: string) => void;
  onDeleteQuote: (bookId: string, quoteId: string) => void;
  onToggleFavorite: (id: string) => void;
  onRequestRewardedAd?: (onRewardEarned: () => void) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateRating,
  onUpdateProgress,
  onAddQuote,
  onDeleteQuote,
  onToggleFavorite,
  onRequestRewardedAd,
}) => {
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuotePage, setNewQuotePage] = useState('');
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tempPage, setTempPage] = useState<number | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const isNative = isNativeAndroid();

  const handleDownloadPDF = () => {
    if (isGeneratingPDF || !book) return;

    const executePdf = async () => {
      setIsGeneratingPDF(true);
      try {
        await generateSingleBookPDF(book);
      } catch (err: unknown) {
        console.error('Error generating PDF:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (typeof window !== 'undefined' && (window as unknown as { AndroidNative?: { showToast?: (s: string) => void } }).AndroidNative?.showToast) {
          (window as unknown as { AndroidNative?: { showToast?: (s: string) => void } }).AndroidNative?.showToast?.('Errore PDF: ' + errMsg);
        } else {
          alert('Errore generazione PDF: ' + errMsg);
        }
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    // 1. Try native Android Rewarded Ad first
    const handledByNative = requestNativeRewardedAd(executePdf);
    if (!handledByNative) {
      if (onRequestRewardedAd) {
        onRequestRewardedAd(executePdf);
      } else {
        executePdf();
      }
    }
  };

  if (!isOpen || !book) return null;

  const percent =
    book.totalPages > 0
      ? Math.min(100, Math.round(((tempPage !== null ? tempPage : book.currentPage) / book.totalPages) * 100))
      : 0;

  const handleStatusClick = (status: ReadingStatus) => {
    onUpdateStatus(book.id, status);
    if (status === 'letto') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8b5e34', '#d97706', '#22c55e', '#3b82f6'],
      });
    }
  };

  const handleSaveProgress = () => {
    if (tempPage !== null) {
      onUpdateProgress(book.id, tempPage);
      if (tempPage >= book.totalPages && book.status !== 'letto') {
        handleStatusClick('letto');
      }
      setTempPage(null);
    }
  };

  const handleAddQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText.trim()) return;
    onAddQuote(book.id, newQuoteText.trim(), newQuotePage.trim() || undefined);
    setNewQuoteText('');
    setNewQuotePage('');
    setIsAddingQuote(false);
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in ${
        isNative ? 'bottom-[54px]' : 'bottom-[102px] md:bottom-0'
      }`}
    >
      <div className="bg-[#fffefc] rounded-2xl w-full max-w-2xl max-h-full flex flex-col shadow-2xl overflow-hidden border border-[#ebdcd0] mb-1 sm:mb-0">
        {/* Sticky Header */}
        <div className="px-5 py-3.5 border-b border-[#ebdcd0] flex items-center justify-between bg-[#fcfaf7]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(book.id)}
              className="p-1.5 rounded-full text-[#9a8c7e] hover:text-[#d97706] hover:bg-[#ede5dc] transition-colors"
              title="Preferiti"
            >
              <Bookmark
                className={`w-5 h-5 ${
                  book.isFavorite ? 'fill-[#d97706] text-[#d97706]' : ''
                }`}
              />
            </button>
            <span className="text-xs text-[#786c62] uppercase tracking-wider font-semibold">
              Scheda Libro
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-2.5 py-1 text-xs font-semibold text-[#8b5e34] bg-[#f5ede2] hover:bg-[#ebdcd0] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60 shadow-2xs"
              title="Guarda un breve video sponsorizzato ed esporta la Scheda Libro in PDF con Copertina"
            >
              <FileDown className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
              <span className="text-[11px] font-bold">{isGeneratingPDF ? 'PDF...' : 'PDF'}</span>
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#8b5e34]/15 rounded text-[9px] text-[#8b5e34] font-bold tracking-tight">
                <Video className="w-2.5 h-2.5 text-[#8b5e34]" />
                <span>AD</span>
              </span>
            </button>
            <button
              onClick={() => onEdit(book)}
              className="p-2 rounded-full text-[#786c62] hover:bg-[#ede5dc] hover:text-[#2c2724] transition-colors"
              title="Modifica libro"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#786c62] hover:bg-[#ede5dc] hover:text-[#2c2724] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 pb-16 sm:pb-8">
          {/* Hero Profile */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Book Cover */}
            <div className="w-28 sm:w-36 aspect-[2/3] rounded-2xl overflow-hidden bg-[#f0eae1] border border-[#d8cdc1] shadow-md shrink-0 mx-auto sm:mx-0 relative flex items-center justify-center">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="p-3 text-center text-[#9a8c7e]">
                  <BookOpen className="w-10 h-10 mx-auto mb-1 text-[#b5a79a]" />
                  <span className="text-xs font-serif-book">{book.title}</span>
                </div>
              )}
            </div>

            {/* Info and status */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-[#2c2724] font-serif-book leading-tight">
                {book.title}
              </h2>
              <p className="text-sm font-medium text-[#786c62]">{book.author}</p>

              {/* Unboxed Metadata */}
              <div className="text-xs text-[#8c7f73] flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-1">
                <span>{book.genre}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{book.format}</span>
                {book.totalPages > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{book.totalPages} pagine</span>
                  </>
                )}
                {book.isbn && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>ISBN: {book.isbn}</span>
                  </>
                )}
              </div>

              {/* Rating selection */}
              <div className="pt-2 flex items-center justify-center sm:justify-start gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onUpdateRating(book.id, book.rating === s ? 0 : s)}
                    className="p-1 hover:scale-110 transition-transform"
                    title={`Imposta ${s} stelle`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= book.rating
                          ? 'fill-[#d97706] text-[#d97706]'
                          : 'text-[#ded5cb] hover:text-[#d97706]'
                      }`}
                    />
                  </button>
                ))}
                {book.rating > 0 && (
                  <span className="text-xs font-semibold text-[#8b5e34] ml-1.5">
                    {book.rating}/5 stelle
                  </span>
                )}
              </div>

              {/* Recommendation rating */}
              <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-[#786c62] flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#d97706]" />
                  <span>Consiglieresti la lettura:</span>
                </span>
                {typeof book.recommendRating === 'number' && book.recommendRating > 0 ? (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (book.recommendRating || 0)
                              ? 'fill-[#d97706] text-[#d97706]'
                              : 'text-[#ded5cb]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-[#d97706] ml-1">
                      ({book.recommendRating}/5)
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEdit(book)}
                    className="text-[11px] text-[#8b5e34] hover:underline font-medium"
                  >
                    Imposta consiglio (1-5 stelle)
                  </button>
                )}
              </div>

              {/* Status Tabs */}
              <div className="pt-2">
                <div className="inline-flex p-1 bg-[#f4ece3] rounded-xl gap-1">
                  {(['in_lettura', 'letto', 'da_leggere', 'abbandonato'] as ReadingStatus[]).map(
                    (st) => {
                      const labels: Record<ReadingStatus, string> = {
                        in_lettura: 'In lettura',
                        letto: 'Letto',
                        da_leggere: 'Da leggere',
                        abbandonato: 'Abbandonato',
                      };
                      const isActive = book.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusClick(st)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                            isActive
                              ? 'bg-white text-[#8b5e34] shadow-xs font-semibold'
                              : 'text-[#786c62] hover:text-[#2c2724]'
                          }`}
                        >
                          {labels[st]}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reading Dates & Duration Box */}
          <div className="p-4 bg-[#faf6f0] rounded-2xl border border-[#ebdcd0] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#f0e6dc] text-[#8b5e34] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-[#8c7f73] block uppercase tracking-wide">Iniziato il</span>
                <span className="font-semibold text-[#2c2724]">
                  {book.startDate ? new Date(book.startDate).toLocaleDateString('it-IT') : 'Non impostata'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#f0e6dc] text-[#8b5e34] flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-[#8c7f73] block uppercase tracking-wide">Completato il</span>
                <span className="font-semibold text-[#2c2724]">
                  {book.endDate ? new Date(book.endDate).toLocaleDateString('it-IT') : 'In corso'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#f0e6dc] text-[#8b5e34] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-[#8c7f73] block uppercase tracking-wide">Durata lettura</span>
                <span className="font-semibold text-[#8b5e34]">
                  {book.durationDays ? `${book.durationDays} giorni` : 'In corso'}
                </span>
              </div>
            </div>
          </div>

          {/* Reading Progress interactive slider */}
          {book.totalPages > 0 && (
            <div className="p-4 bg-[#fffefc] rounded-2xl border border-[#ebdcd0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#4e433a]">
                  Progresso Lettura: {tempPage !== null ? tempPage : book.currentPage} di{' '}
                  {book.totalPages} pagine
                </span>
                <span className="font-bold text-[#8b5e34]">{percent}%</span>
              </div>

              <input
                type="range"
                min="0"
                max={book.totalPages}
                value={tempPage !== null ? tempPage : book.currentPage}
                onChange={(e) => setTempPage(Number(e.target.value))}
                className="w-full accent-[#8b5e34] cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1.5">
                  {[10, 25, 50].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const cur = tempPage !== null ? tempPage : book.currentPage;
                        const next = Math.min(book.totalPages, cur + inc);
                        setTempPage(next);
                      }}
                      className="px-2 py-0.5 text-[11px] bg-[#f5ede2] hover:bg-[#ebdcd0] text-[#8b5e34] rounded font-medium transition-colors"
                    >
                      +{inc} pag
                    </button>
                  ))}
                </div>

                {tempPage !== null && tempPage !== book.currentPage && (
                  <button
                    type="button"
                    onClick={handleSaveProgress}
                    className="px-3 py-1 text-xs font-semibold bg-[#8b5e34] text-white rounded-lg shadow-xs hover:bg-[#724b27] transition-colors"
                  >
                    Salva Avanzamento
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Review & Comments */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[#2c2724] font-serif-book">
              Recensione & Note Personali
            </h3>
            {book.review ? (
              <p className="text-xs sm:text-sm text-[#4e433a] leading-relaxed bg-[#faf7f2] p-4 rounded-xl border border-[#ede5dc] whitespace-pre-wrap">
                {book.review}
              </p>
            ) : (
              <p className="text-xs text-[#9a8c7e] italic bg-[#faf7f2] p-3 rounded-xl border border-dashed border-[#ede5dc]">
                Nessuna recensione inserita per questo libro. Clicca su Modifica per aggiungerne una.
              </p>
            )}
          </div>

          {/* Favorite Parts / Highlights */}
          {book.favoriteParts && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#2c2724] font-serif-book flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8b5e34]" />
                <span>Parti Più Belle & Riflessioni</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#4e433a] leading-relaxed bg-[#faf7f2] p-4 rounded-xl border border-[#ede5dc] whitespace-pre-wrap">
                {book.favoriteParts}
              </p>
            </div>
          )}

          {/* Analisi dei Personaggi: Preferito e Peggiore con relativi motivi */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2c2724] font-serif-book flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#8b5e34]" />
              <span>Analisi dei Personaggi</span>
            </h3>

            {book.favoriteCharacter || book.worstCharacter ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {book.favoriteCharacter && (
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <UserCheck className="w-4 h-4 text-emerald-700" />
                      <span>Personaggio Preferito</span>
                    </div>
                    <p className="font-semibold text-emerald-950 text-sm">
                      {book.favoriteCharacter}
                    </p>
                    {book.favoriteCharacterReason && (
                      <p className="text-emerald-900/90 text-xs italic leading-relaxed pt-1.5 border-t border-emerald-200/70">
                        "{book.favoriteCharacterReason}"
                      </p>
                    )}
                  </div>
                )}

                {book.worstCharacter && (
                  <div className="p-3.5 bg-rose-50/80 border border-rose-200/90 rounded-2xl space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <UserX className="w-4 h-4 text-rose-700" />
                      <span>Personaggio Peggiore / Meno Amato</span>
                    </div>
                    <p className="font-semibold text-rose-950 text-sm">
                      {book.worstCharacter}
                    </p>
                    {book.worstCharacterReason && (
                      <p className="text-rose-900/90 text-xs italic leading-relaxed pt-1.5 border-t border-rose-200/70">
                        "{book.worstCharacterReason}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#faf7f2] rounded-xl border border-dashed border-[#ede5dc] flex items-center justify-between gap-3">
                <p className="text-xs text-[#9a8c7e] italic">
                  Nessun personaggio annotato. Vuoi inserire il tuo personaggio preferito e quello peggiore con le relative motivazioni?
                </p>
                <button
                  type="button"
                  onClick={() => onEdit(book)}
                  className="shrink-0 px-2.5 py-1 text-xs font-semibold text-[#8b5e34] bg-[#f5ede2] hover:bg-[#ebdcd0] rounded-lg transition-colors"
                >
                  Compila
                </button>
              </div>
            )}
          </div>

          {/* Quotes Notebook Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#2c2724] font-serif-book flex items-center gap-1.5">
                <QuoteIcon className="w-4 h-4 text-[#8b5e34]" />
                <span>Citazioni & Frasi Memorabili ({book.quotes.length})</span>
              </h3>

              {!isAddingQuote && (
                <button
                  type="button"
                  onClick={() => setIsAddingQuote(true)}
                  className="px-2.5 py-1 text-xs font-medium text-[#8b5e34] bg-[#f5ede2] hover:bg-[#ebdcd0] rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Frase</span>
                </button>
              )}
            </div>

            {/* Inline Add Quote Form */}
            {isAddingQuote && (
              <form
                onSubmit={handleAddQuoteSubmit}
                className="p-3.5 bg-[#fbf8f4] rounded-xl border border-[#8b5e34]/30 space-y-2"
              >
                <textarea
                  rows={2}
                  required
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="«Scrivi la citazione memorabile del libro...»"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#d8cdc1] rounded-lg focus:outline-none focus:border-[#8b5e34] font-serif-book italic text-[#2c2724]"
                />
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={newQuotePage}
                    onChange={(e) => setNewQuotePage(e.target.value)}
                    placeholder="Pagina (es. 85)"
                    className="w-28 px-2.5 py-1 text-xs bg-white border border-[#d8cdc1] rounded-lg focus:outline-none text-[#2c2724]"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingQuote(false)}
                      className="px-2.5 py-1 text-xs text-[#786c62] hover:text-[#2c2724]"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={!newQuoteText.trim()}
                      className="px-3 py-1 text-xs bg-[#8b5e34] text-white rounded-lg font-medium hover:bg-[#724b27]"
                    >
                      Salva Frase
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List of quotes */}
            {book.quotes.length > 0 ? (
              <div className="space-y-2.5">
                {book.quotes.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-[#faf7f2] rounded-xl border border-[#ede5dc] relative group hover:border-[#8b5e34]/40 transition-colors"
                  >
                    <p className="text-xs sm:text-sm text-[#2c2724] font-serif-book italic leading-relaxed">
                      «{q.text}»
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#ebdcd0]/60 text-[11px] text-[#8c7f73]">
                      <span>{q.page ? `Pagina ${q.page}` : 'Citazione'}</span>
                      <button
                        onClick={() => onDeleteQuote(book.id, q.id)}
                        className="text-[#9a8c7e] hover:text-red-600 transition-colors opacity-70 group-hover:opacity-100"
                        title="Elimina citazione"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9a8c7e] italic py-2">
                Nessuna frase annotata per questo libro.
              </p>
            )}
          </div>

          {/* Delete Book Confirmation */}
          <div className="pt-4 border-t border-[#ebdcd0]">
            {showDeleteConfirm ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs text-red-800 font-medium">
                  Confermi l'eliminazione definitiva di questo libro?
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1 text-xs bg-white text-stone-700 rounded-lg border border-stone-200"
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      onDelete(book.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs bg-red-700 text-white rounded-lg font-medium hover:bg-red-800"
                  >
                    Sì, elimina
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-red-700 hover:text-red-900 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina questo libro dall'archivio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
