import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Award,
  Clock,
  Layers,
  Star,
  Flame,
  Target,
  Edit2,
  Check,
  FileDown,
  Video,
} from 'lucide-react';
import { Book, ReadingGoal } from '../types/book';
import { generateTotalLibraryPDF } from '../services/pdfReportService';
import { requestNativeRewardedAd } from '../services/adService';

interface StatsViewProps {
  books: Book[];
  goal: ReadingGoal;
  onUpdateGoal: (newGoal: ReadingGoal) => void;
  onOpenBook: (book: Book) => void;
  onRequestRewardedAd?: (onRewardEarned: () => void) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  books,
  goal,
  onUpdateGoal,
  onOpenBook,
  onRequestRewardedAd,
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempTarget, setTempTarget] = useState(goal.targetBooks);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = () => {
    if (isExportingPDF) return;

    const executePdf = async () => {
      setIsExportingPDF(true);
      try {
        await generateTotalLibraryPDF(books);
      } catch (err: unknown) {
        console.error('Error generating total PDF:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (typeof window !== 'undefined' && (window as unknown as { AndroidNative?: { showToast?: (s: string) => void } }).AndroidNative?.showToast) {
          (window as unknown as { AndroidNative?: { showToast?: (s: string) => void } }).AndroidNative?.showToast?.('Errore PDF: ' + errMsg);
        } else {
          alert('Errore generazione PDF: ' + errMsg);
        }
      } finally {
        setIsExportingPDF(false);
      }
    };

    const handledByNative = requestNativeRewardedAd(executePdf);
    if (!handledByNative) {
      if (onRequestRewardedAd) {
        onRequestRewardedAd(executePdf);
      } else {
        executePdf();
      }
    }
  };

  const currentYear = new Date().getFullYear();

  // Completed books
  const finishedBooks = books.filter((b) => b.status === 'letto');
  const finishedThisYear = finishedBooks.filter((b) => {
    if (!b.endDate) return false;
    return new Date(b.endDate).getFullYear() === currentYear;
  });

  const currentlyReading = books.filter((b) => b.status === 'in_lettura');
  const toRead = books.filter((b) => b.status === 'da_leggere');

  // Total pages read
  const totalPagesRead = books.reduce((acc, b) => {
    if (b.status === 'letto') return acc + (b.totalPages || b.currentPage || 0);
    return acc + (b.currentPage || 0);
  }, 0);

  // Average reading duration in days for finished books
  const booksWithDuration = finishedBooks.filter(
    (b) => typeof b.durationDays === 'number' && b.durationDays > 0
  );
  const avgDuration =
    booksWithDuration.length > 0
      ? Math.round(
          booksWithDuration.reduce((acc, b) => acc + (b.durationDays || 0), 0) /
            booksWithDuration.length
        )
      : null;

  // Average rating
  const ratedBooks = books.filter((b) => b.rating > 0);
  const avgRating =
    ratedBooks.length > 0
      ? (
          ratedBooks.reduce((acc, b) => acc + b.rating, 0) / ratedBooks.length
        ).toFixed(1)
      : null;

  // Genre breakdown
  const genreCounts: Record<string, number> = {};
  books.forEach((b) => {
    const g = b.genre || 'Altro';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

  // Format breakdown
  const formatCounts = {
    cartaceo: books.filter((b) => b.format === 'cartaceo').length,
    ebook: books.filter((b) => b.format === 'ebook').length,
    audiolibro: books.filter((b) => b.format === 'audiolibro').length,
  };

  // 5-star masterpieces
  const fiveStarBooks = books.filter((b) => b.rating === 5);

  // Goal progress
  const goalPercent = Math.min(
    100,
    Math.round((finishedThisYear.length / Math.max(1, goal.targetBooks)) * 100)
  );

  const handleSaveGoal = () => {
    onUpdateGoal({
      ...goal,
      targetBooks: Math.max(1, Number(tempTarget) || 1),
    });
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-6">
      {/* Annual Reading Goal Card */}
      <div className="p-5 sm:p-6 bg-[#fffefc] rounded-2xl border border-[#ebdcd0] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#f4ece3] text-[#8b5e34] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#2c2724] font-serif-book">
                Obiettivo di Lettura {currentYear}
              </h3>
              <p className="text-xs text-[#786c62]">
                Hai letto {finishedThisYear.length} di {goal.targetBooks} libri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#8b5e34] bg-[#f5ede2] hover:bg-[#ebdcd0] rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
              title="Guarda video e scarica il report PDF completo della libreria"
            >
              <FileDown className={`w-3.5 h-3.5 ${isExportingPDF ? 'animate-bounce' : ''}`} />
              <span>{isExportingPDF ? 'PDF...' : 'Report PDF'}</span>
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-[#8b5e34]/15 rounded text-[9px] text-[#8b5e34] font-bold tracking-tight">
                <Video className="w-2.5 h-2.5 text-[#8b5e34]" />
                <span>AD</span>
              </span>
            </button>

            {!isEditingGoal ? (
              <button
                onClick={() => {
                  setTempTarget(goal.targetBooks);
                  setIsEditingGoal(true);
                }}
                className="p-1.5 text-[#786c62] hover:text-[#8b5e34] hover:bg-[#faf4ec] rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modifica</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={tempTarget}
                  onChange={(e) => setTempTarget(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-lg text-center"
                />
                <button
                  onClick={handleSaveGoal}
                  className="p-1.5 bg-[#8b5e34] text-white rounded-lg hover:bg-[#724b27]"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-[#786c62]">
            <span>Avanzamento annuale</span>
            <span className="font-bold text-[#8b5e34]">{goalPercent}%</span>
          </div>
          <div className="w-full h-3 bg-[#f0eae1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d97706] to-[#8b5e34] rounded-full transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8c7f73] pt-1">
            {finishedThisYear.length >= goal.targetBooks
              ? '🎉 Fantastico! Hai completato il tuo obiettivo per quest\'anno!'
              : `Mancano ${goal.targetBooks - finishedThisYear.length} libri per raggiungere il tuo traguardo.`}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#fffefc] p-4 rounded-2xl border border-[#ebdcd0] flex flex-col justify-between">
          <span className="text-[11px] text-[#8c7f73] uppercase tracking-wide font-medium flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#8b5e34]" />
            Libri Letti
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#2c2724] tabular-nums font-serif-book">
              {finishedBooks.length}
            </span>
            <span className="text-[10px] text-[#9a8c7e] block mt-0.5">
              +{currentlyReading.length} in lettura
            </span>
          </div>
        </div>

        <div className="bg-[#fffefc] p-4 rounded-2xl border border-[#ebdcd0] flex flex-col justify-between">
          <span className="text-[11px] text-[#8c7f73] uppercase tracking-wide font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#8b5e34]" />
            Pagine Totali
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#2c2724] tabular-nums font-serif-book">
              {totalPagesRead.toLocaleString('it-IT')}
            </span>
            <span className="text-[10px] text-[#9a8c7e] block mt-0.5">pagine sfogliate</span>
          </div>
        </div>

        <div className="bg-[#fffefc] p-4 rounded-2xl border border-[#ebdcd0] flex flex-col justify-between">
          <span className="text-[11px] text-[#8c7f73] uppercase tracking-wide font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#8b5e34]" />
            Tempo Medio
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#2c2724] tabular-nums font-serif-book">
              {avgDuration ? `${avgDuration}` : '—'}
            </span>
            <span className="text-[10px] text-[#9a8c7e] block mt-0.5">
              {avgDuration ? 'giorni per libro' : 'dati in arrivo'}
            </span>
          </div>
        </div>

        <div className="bg-[#fffefc] p-4 rounded-2xl border border-[#ebdcd0] flex flex-col justify-between">
          <span className="text-[11px] text-[#8c7f73] uppercase tracking-wide font-medium flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[#d97706]" />
            Voto Medio
          </span>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#2c2724] tabular-nums font-serif-book">
              {avgRating ? `${avgRating}` : '—'}
            </span>
            <span className="text-[10px] text-[#9a8c7e] block mt-0.5">su 5.0 stelle</span>
          </div>
        </div>
      </div>

      {/* Genres and Formats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Genres */}
        <div className="bg-[#fffefc] p-5 rounded-2xl border border-[#ebdcd0] space-y-3">
          <h4 className="text-sm font-semibold text-[#2c2724] font-serif-book flex items-center gap-2">
            <Award className="w-4 h-4 text-[#8b5e34]" />
            <span>Generi Più Letti</span>
          </h4>

          {sortedGenres.length > 0 ? (
            <div className="space-y-2.5">
              {sortedGenres.slice(0, 5).map(([genre, count]) => {
                const pct = Math.round((count / books.length) * 100);
                return (
                  <div key={genre} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#4e433a] font-medium">{genre}</span>
                      <span className="text-[#8c7f73] tabular-nums">
                        {count} {count === 1 ? 'libro' : 'libri'} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#f0eae1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8b5e34] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#9a8c7e] italic">Nessun libro inserito.</p>
          )}
        </div>

        {/* Reading Formats */}
        <div className="bg-[#fffefc] p-5 rounded-2xl border border-[#ebdcd0] space-y-3">
          <h4 className="text-sm font-semibold text-[#2c2724] font-serif-book flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#8b5e34]" />
            <span>Formato Preferito</span>
          </h4>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 bg-[#faf7f2] rounded-xl text-center border border-[#ede5dc]">
              <span className="text-xl block mb-1">📖</span>
              <span className="text-[11px] text-[#786c62] block font-medium">Cartaceo</span>
              <span className="text-lg font-bold text-[#2c2724] tabular-nums font-serif-book">
                {formatCounts.cartaceo}
              </span>
            </div>

            <div className="p-3 bg-[#faf7f2] rounded-xl text-center border border-[#ede5dc]">
              <span className="text-xl block mb-1">📱</span>
              <span className="text-[11px] text-[#786c62] block font-medium">E-book</span>
              <span className="text-lg font-bold text-[#2c2724] tabular-nums font-serif-book">
                {formatCounts.ebook}
              </span>
            </div>

            <div className="p-3 bg-[#faf7f2] rounded-xl text-center border border-[#ede5dc]">
              <span className="text-xl block mb-1">🎧</span>
              <span className="text-[11px] text-[#786c62] block font-medium">Audiolibro</span>
              <span className="text-lg font-bold text-[#2c2724] tabular-nums font-serif-book">
                {formatCounts.audiolibro}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Star Masterpieces showcase */}
      {fiveStarBooks.length > 0 && (
        <div className="bg-[#fffefc] p-5 rounded-2xl border border-[#ebdcd0] space-y-3">
          <h4 className="text-sm font-semibold text-[#2c2724] font-serif-book flex items-center gap-2">
            <Star className="w-4 h-4 fill-[#d97706] text-[#d97706]" />
            <span>I Tuoi Libri a 5 Stelle ({fiveStarBooks.length})</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fiveStarBooks.map((b) => (
              <div
                key={b.id}
                onClick={() => onOpenBook(b)}
                className="group p-2 rounded-xl bg-[#faf7f2] border border-[#ede5dc] hover:border-[#8b5e34] transition-all cursor-pointer flex items-center gap-2.5"
              >
                <div className="w-10 h-14 rounded-md overflow-hidden bg-[#e8dfd5] shrink-0">
                  {b.coverUrl ? (
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#2c2724] line-clamp-1 font-serif-book">
                    {b.title}
                  </p>
                  <p className="text-[10px] text-[#786c62] line-clamp-1">{b.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
