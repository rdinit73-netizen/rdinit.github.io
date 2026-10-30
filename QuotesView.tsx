import React, { useState } from 'react';
import { Quote as QuoteIcon, Search, Copy, Check, BookOpen, Plus, Sparkles } from 'lucide-react';
import { Book } from '../types/book';

interface QuotesViewProps {
  books: Book[];
  onOpenBook: (book: Book) => void;
  onAddQuoteToBook: (bookId: string, quoteText: string, page?: string) => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  books,
  onOpenBook,
  onAddQuoteToBook,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [quoteText, setQuoteText] = useState('');
  const [quotePage, setQuotePage] = useState('');

  // Collect all quotes
  const allQuotes = books.flatMap((b) =>
    (b.quotes || []).map((q) => ({
      ...q,
      bookId: b.id,
      bookTitle: b.title,
      bookAuthor: b.author,
      bookCover: b.coverUrl,
      bookRating: b.rating,
    }))
  );

  const filteredQuotes = allQuotes.filter((q) => {
    const term = searchTerm.toLowerCase();
    return (
      q.text.toLowerCase().includes(term) ||
      q.bookTitle.toLowerCase().includes(term) ||
      q.bookAuthor.toLowerCase().includes(term)
    );
  });

  const handleCopy = (id: string, text: string, author: string, title: string, page?: string) => {
    const formatted = `«${text}»\n— ${author}, ${title}${page ? ` (pag. ${page})` : ''}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !quoteText.trim()) return;
    onAddQuoteToBook(selectedBookId, quoteText.trim(), quotePage.trim() || undefined);
    setQuoteText('');
    setQuotePage('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Introduction */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-[#faf4ec] via-[#f7eee2] to-[#eddcc8] rounded-2xl border border-[#e2d3c2] relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8b5e34] mb-1">
            <QuoteIcon className="w-4 h-4" />
            <span>Taccuino dei Pensieri</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2c2724] font-serif-book">
            Citazioni & Parti Più Belle
          </h2>
          <p className="text-xs sm:text-sm text-[#786c62] mt-1 leading-relaxed">
            I passaggi più significativi, le frasi da ricordare e le parole che hanno lasciato il segno durante le tue letture.
          </p>
        </div>

        <div className="absolute right-4 bottom-2 opacity-15 pointer-events-none">
          <QuoteIcon className="w-28 h-28 text-[#8b5e34]" />
        </div>
      </div>

      {/* Controls: Search and Add New */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c7e]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per frase, autore o titolo..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#ded5cb] rounded-xl focus:outline-none focus:border-[#8b5e34] text-[#2c2724]"
          />
        </div>

        {books.length > 0 && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-[#8b5e34] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#724b27] transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Citazione</span>
          </button>
        )}
      </div>

      {/* Add Quote inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 sm:p-5 bg-[#fffefc] rounded-2xl border border-[#8b5e34]/40 shadow-sm space-y-3 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#4e433a] uppercase tracking-wide">
              Aggiungi Citazione a un Libro
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[#786c62] hover:text-[#2c2724]"
            >
              Annulla
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e433a] mb-1">
              Seleziona Libro
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none text-[#2c2724]"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4e433a] mb-1">
              Testo della Frase o Passaggio *
            </label>
            <textarea
              rows={3}
              required
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="«Scrivi la citazione del libro...»"
              className="w-full px-3 py-2 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:border-[#8b5e34] font-serif-book italic text-[#2c2724]"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              value={quotePage}
              onChange={(e) => setQuotePage(e.target.value)}
              placeholder="Pagina (es. 42)"
              className="w-32 px-3 py-1.5 text-xs bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none text-[#2c2724]"
            />

            <button
              type="submit"
              disabled={!quoteText.trim()}
              className="px-4 py-2 bg-[#8b5e34] text-white rounded-xl text-xs font-semibold hover:bg-[#724b27] disabled:opacity-50 transition-colors"
            >
              Salva nel Taccuino
            </button>
          </div>
        </form>
      )}

      {/* Quote Cards Feed */}
      {filteredQuotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.map((q) => {
            const correspondingBook = books.find((b) => b.id === q.bookId);
            return (
              <div
                key={q.id}
                className="bg-[#fffefc] rounded-2xl border border-[#ebdcd0] p-4 sm:p-5 flex flex-col justify-between hover:border-[#8b5e34]/50 hover:shadow-md transition-all group"
              >
                <div>
                  <QuoteIcon className="w-5 h-5 text-[#bfa993] mb-2" />
                  <p className="text-sm sm:text-base text-[#2c2724] font-serif-book italic leading-relaxed">
                    «{q.text}»
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f2eae1] flex items-center justify-between gap-2">
                  <div
                    onClick={() => correspondingBook && onOpenBook(correspondingBook)}
                    className="cursor-pointer group/link flex items-center gap-2 min-w-0"
                    title="Apri scheda libro"
                  >
                    <BookOpen className="w-4 h-4 text-[#8b5e34] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[#4e433a] group-hover/link:text-[#8b5e34] line-clamp-1 block">
                        {q.bookTitle}
                      </span>
                      <span className="text-[11px] text-[#8c7f73] line-clamp-1">
                        {q.bookAuthor} {q.page ? `· pag. ${q.page}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(q.id, q.text, q.bookAuthor, q.bookTitle, q.page)
                    }
                    className="p-1.5 text-[#9a8c7e] hover:text-[#8b5e34] hover:bg-[#faf4ec] rounded-lg transition-colors shrink-0"
                    title="Copia negli appunti"
                  >
                    {copiedId === q.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-[#786c62] bg-[#fffefc] rounded-2xl border border-[#ebdcd0] p-6 space-y-2">
          <QuoteIcon className="w-10 h-10 mx-auto text-[#bfa993]" />
          <h3 className="text-sm font-semibold text-[#2c2724]">
            {searchTerm ? 'Nessuna citazione trovata' : 'Nessuna citazione registrata ancora'}
          </h3>
          <p className="text-xs text-[#8c7f73] max-w-sm mx-auto">
            {searchTerm
              ? 'Prova con un altro termine di ricerca.'
              : 'Apri una scheda libro o usa il pulsante in alto per aggiungere la tua prima frase memorabile.'}
          </p>
        </div>
      )}
    </div>
  );
};
