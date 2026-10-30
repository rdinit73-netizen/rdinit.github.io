import React from 'react';
import { Star, Bookmark, BookOpen, Clock, ThumbsUp, UserCheck, UserX } from 'lucide-react';
import { Book } from '../types/book';

interface BookCardProps {
  book: Book;
  onOpenDetail: (book: Book) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onQuickPageAdvance?: (id: string, addedPages: number, e: React.MouseEvent) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onOpenDetail,
  onToggleFavorite,
  onQuickPageAdvance,
}) => {
  const percent = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;

  const getStatusBadge = () => {
    switch (book.status) {
      case 'in_lettura':
        return { label: 'In lettura', color: 'text-amber-800 bg-amber-50 border-amber-200' };
      case 'letto':
        return { label: 'Letto', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
      case 'da_leggere':
        return { label: 'Da leggere', color: 'text-sky-800 bg-sky-50 border-sky-200' };
      case 'abbandonato':
        return { label: 'Abbandonato', color: 'text-stone-600 bg-stone-100 border-stone-200' };
      default:
        return { label: book.status, color: 'text-stone-700 bg-stone-100 border-stone-200' };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div
      onClick={() => onOpenDetail(book)}
      className="group relative bg-[#fffefc] rounded-2xl border border-[#ebdcd0] p-3.5 hover:border-[#8b5e34]/60 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Top row: Cover + info */}
      <div className="flex gap-3.5">
        {/* Cover */}
        <div className="w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-[#f0eae1] border border-[#ded5cb] shadow-sm shrink-0 relative flex items-center justify-center">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="p-2 text-center text-[#9a8c7e]">
              <BookOpen className="w-6 h-6 mx-auto mb-1 text-[#b5a79a]" />
              <span className="text-[9px] line-clamp-2 leading-none">{book.title}</span>
            </div>
          )}

          {/* Format badge tag */}
          <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/60 backdrop-blur-xs text-[9px] text-white rounded font-mono">
            {book.format === 'cartaceo' ? '📖' : book.format === 'ebook' ? '📱' : '🎧'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusInfo.color} whitespace-nowrap`}
              >
                {statusInfo.label}
              </span>

              <button
                type="button"
                onClick={(e) => onToggleFavorite(book.id, e)}
                className="p-1 -mr-1 -mt-1 text-[#9a8c7e] hover:text-[#d97706] transition-colors"
                title={book.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    book.isFavorite ? 'fill-[#d97706] text-[#d97706]' : 'hover:fill-[#d97706]/20'
                  }`}
                />
              </button>
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-[#2c2724] font-serif-book leading-snug mt-1.5 line-clamp-2 group-hover:text-[#8b5e34] transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-[#786c62] line-clamp-1 mt-0.5">{book.author}</p>
          </div>

          {/* Unboxed metadata separator */}
          <div className="mt-2 text-[11px] text-[#8c7f73] flex items-center gap-1.5 flex-wrap">
            <span>{book.genre}</span>
            {book.totalPages > 0 && (
              <>
                <span aria-hidden="true" className="text-[#c4b6a8]">·</span>
                <span>{book.totalPages} pag</span>
              </>
            )}
            {book.durationDays && book.durationDays > 0 && (
              <>
                <span aria-hidden="true" className="text-[#c4b6a8]">·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3 inline text-[#8b5e34]" />
                  <span>{book.durationDays} gg</span>
                </span>
              </>
            )}
          </div>

          {/* Rating stars & recommendation */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= book.rating
                      ? 'fill-[#d97706] text-[#d97706]'
                      : 'text-[#e5dcce]'
                  }`}
                />
              ))}
              {book.rating > 0 && (
                <span className="text-[11px] font-semibold text-[#8b5e34] ml-1">
                  {book.rating}.0
                </span>
              )}
            </div>

            {typeof book.recommendRating === 'number' && book.recommendRating > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/70"
                title={`Consiglieresti la lettura: ${book.recommendRating}/5 stelle`}
              >
                <ThumbsUp className="w-2.5 h-2.5 text-amber-600" />
                <span>Consiglio: {book.recommendRating}/5</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reading Progress bar if in_lettura */}
      {book.status === 'in_lettura' && (
        <div className="mt-3 pt-2.5 border-t border-[#f0e6dc]">
          <div className="flex items-center justify-between text-[11px] text-[#786c62] mb-1">
            <span className="font-medium">
              Pagina {book.currentPage} di {book.totalPages || '?'}
            </span>
            <span className="font-semibold text-[#8b5e34]">{percent}%</span>
          </div>
          <div className="w-full h-2 bg-[#f0eae1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#b07d4b] to-[#8b5e34] rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          {onQuickPageAdvance && book.currentPage < book.totalPages && (
            <div className="flex justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={(e) => onQuickPageAdvance(book.id, 10, e)}
                className="px-2 py-0.5 text-[10px] bg-[#f5ede2] hover:bg-[#ebdcd0] text-[#8b5e34] font-medium rounded-md transition-colors"
              >
                +10 pag
              </button>
              <button
                type="button"
                onClick={(e) => onQuickPageAdvance(book.id, 25, e)}
                className="px-2 py-0.5 text-[10px] bg-[#f5ede2] hover:bg-[#ebdcd0] text-[#8b5e34] font-medium rounded-md transition-colors"
              >
                +25 pag
              </button>
            </div>
          )}
        </div>
      )}

      {/* Characters & insights section on card */}
      {book.favoriteCharacter || book.worstCharacter ? (
        <div className="mt-3 pt-2.5 border-t border-[#f0e6dc] space-y-1.5">
          {book.favoriteCharacter && (
            <div className="text-[11px] bg-emerald-50/70 rounded-lg px-2.5 py-1.5 border border-emerald-100/90 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  <span className="text-emerald-700/80 font-normal">Migliore:</span>{' '}
                  <strong className="font-semibold text-emerald-950">{book.favoriteCharacter}</strong>
                </span>
              </div>
              {book.favoriteCharacterReason && (
                <p className="text-[10px] text-emerald-800/85 italic line-clamp-1 pl-5">
                  "{book.favoriteCharacterReason}"
                </p>
              )}
            </div>
          )}

          {book.worstCharacter && (
            <div className="text-[11px] bg-rose-50/70 rounded-lg px-2.5 py-1.5 border border-rose-100/90 flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-rose-800 font-medium">
                <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="truncate">
                  <span className="text-rose-700/80 font-normal">Peggiore:</span>{' '}
                  <strong className="font-semibold text-rose-950">{book.worstCharacter}</strong>
                </span>
              </div>
              {book.worstCharacterReason && (
                <p className="text-[10px] text-rose-800/85 italic line-clamp-1 pl-5">
                  "{book.worstCharacterReason}"
                </p>
              )}
            </div>
          )}
        </div>
      ) : book.quotes && book.quotes.length > 0 ? (
        <div className="mt-2.5 pt-2 border-t border-[#f2eae1] text-[11px] text-[#786c62] italic font-serif-book line-clamp-1">
          "{book.quotes[0].text}"
        </div>
      ) : null}
    </div>
  );
};
