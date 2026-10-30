import React, { useState } from 'react';
import { Search, X, Check, Loader2, BookOpen, Upload, Link as LinkIcon } from 'lucide-react';
import { searchOnlineBooks, OnlineBookResult, fileToCompressedDataUrl } from '../services/bookSearch';
import { isNativeAndroid } from '../services/storage';

interface CoverSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  onSelectCover: (coverUrl: string, autoFillData?: Partial<OnlineBookResult>) => void;
}

export const CoverSearchModal: React.FC<CoverSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onSelectCover,
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OnlineBookResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'online' | 'upload' | 'url'>('online');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Trigger search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const items = await searchOnlineBooks(query);
      setResults(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Perform search on mount if initial query was given
  React.useEffect(() => {
    if (isOpen && initialQuery && !hasSearched) {
      setQuery(initialQuery);
      handleSearch();
    }
  }, [isOpen, initialQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const compressedDataUrl = await fileToCompressedDataUrl(file);
      onSelectCover(compressedDataUrl);
      onClose();
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleApplyManualUrl = () => {
    if (manualUrl.trim()) {
      onSelectCover(manualUrl.trim());
      onClose();
    }
  };

  const isNative = isNativeAndroid();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in ${
        isNative ? 'bottom-[54px]' : 'bottom-[102px] md:bottom-0'
      }`}
    >
      <div className="bg-[#fffefc] rounded-2xl w-full max-w-xl max-h-full flex flex-col shadow-2xl overflow-hidden border border-[#e8dfd5] mb-1 sm:mb-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ebdcd0] flex items-center justify-between bg-[#fcfaf7]">
          <div>
            <h3 className="text-base font-semibold text-[#2c2724] font-serif-book">
              Recupera Copertina Libro
            </h3>
            <p className="text-xs text-[#786c62] mt-0.5">
              Cerca online via Open Library / Google Books o carica da foto
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#786c62] hover:bg-[#ede5dc] hover:text-[#2c2724] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#ede5dc] px-5 bg-[#faf7f2] gap-4">
          <button
            onClick={() => setActiveTab('online')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'online'
                ? 'border-[#8b5e34] text-[#8b5e34] font-semibold'
                : 'border-transparent text-[#786c62] hover:text-[#2c2724]'
            }`}
          >
            Cerca Online
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#8b5e34] text-[#8b5e34] font-semibold'
                : 'border-transparent text-[#786c62] hover:text-[#2c2724]'
            }`}
          >
            Foto / Galleria
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'url'
                ? 'border-[#8b5e34] text-[#8b5e34] font-semibold'
                : 'border-transparent text-[#786c62] hover:text-[#2c2724]'
            }`}
          >
            Incolla URL
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'online' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c7e]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Titolo, autore o ISBN (es. Il nome della rosa)..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-4 py-2.5 bg-[#8b5e34] text-white rounded-xl text-sm font-medium hover:bg-[#724b27] disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Cerca</span>
                </button>
              </form>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4ece3]/80 rounded-lg border border-[#e8dfd5] text-[11px] text-[#786c62]">
                <span className="font-semibold text-[#8b5e34]">🇮🇹 Priorità Edizioni Italiane:</span>
                <span>Copertine ricercate e ordinate privilegiando editori e traduzioni in italiano.</span>
              </div>

              {loading && (
                <div className="py-12 text-center text-[#786c62] space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#8b5e34]" />
                  <p className="text-sm font-medium">Ricerca copertine ed edizioni in italiano in corso...</p>
                </div>
              )}

              {!loading && hasSearched && results.length === 0 && (
                <div className="py-10 text-center text-[#786c62] bg-[#f9f6f1] rounded-xl p-4">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#9c8e80]" />
                  <p className="text-sm font-medium">Nessuna copertina trovata per "{query}"</p>
                  <p className="text-xs text-[#9a8c7e] mt-1">
                    Prova a verificare il titolo in italiano, a cercare solo per autore o ISBN, oppure carica una foto.
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.map((res, idx) => (
                    <div
                      key={idx}
                      className="group border border-[#e5dcce] rounded-xl p-2.5 flex flex-col justify-between bg-[#fffefc] hover:border-[#8b5e34] transition-all hover:shadow-md cursor-pointer relative"
                      onClick={() => {
                        onSelectCover(res.coverUrl, res);
                        onClose();
                      }}
                    >
                      <div className="aspect-[2/3] w-full rounded-lg bg-[#f0eae1] overflow-hidden mb-2 relative flex items-center justify-center">
                        {res.coverUrl ? (
                          <img
                            src={res.coverUrl}
                            alt={res.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              // Fallback for broken cover
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="p-2 text-center">
                            <BookOpen className="w-8 h-8 mx-auto text-[#a89a8c] mb-1" />
                            <span className="text-[10px] text-[#786c62]">Copertina assente</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-[9px] text-white rounded">
                          {res.source}
                        </span>
                        {res.isItalianEdition && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-800/85 backdrop-blur-xs text-[9px] font-semibold text-white rounded shadow-xs flex items-center gap-0.5">
                            🇮🇹 Italiano
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[#2c2724] line-clamp-1 font-serif-book">
                          {res.title}
                        </p>
                        <p className="text-[11px] text-[#786c62] line-clamp-1">{res.author}</p>
                        {res.totalPages && (
                          <p className="text-[10px] text-[#9a8c7e]">{res.totalPages} pagine</p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="mt-2 w-full py-1.5 text-[11px] font-medium bg-[#f5ede2] text-[#8b5e34] group-hover:bg-[#8b5e34] group-hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Seleziona</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4 py-3">
              <div className="border-2 border-dashed border-[#d8cdc1] rounded-2xl p-6 text-center bg-[#faf7f2]">
                <Upload className="w-10 h-10 mx-auto text-[#8b5e34] mb-3" />
                <h4 className="text-sm font-semibold text-[#2c2724]">
                  Carica foto della copertina
                </h4>
                <p className="text-xs text-[#786c62] mt-1 max-w-sm mx-auto">
                  Scatta una foto con lo smartphone o seleziona un'immagine dalla galleria. Viene
                  compressa e salvata localmente per funzionare anche offline!
                </p>

                <label className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b5e34] text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-[#724b27] transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>{uploadLoading ? 'Compressione in corso...' : 'Scegli o Scatta Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-[#4e433a] mb-1.5">
                  Indirizzo Web dell'immagine copertina (URL)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c7e]" />
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#faf7f2] border border-[#d8cdc1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b5e34]/30 focus:border-[#8b5e34] text-[#2c2724]"
                  />
                </div>
              </div>

              {manualUrl && (
                <div className="flex items-center gap-4 p-3 bg-[#faf7f2] rounded-xl border border-[#ede5dc]">
                  <img
                    src={manualUrl}
                    alt="Anteprima copertina"
                    className="w-14 h-20 object-cover rounded-md shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => ((e.target as HTMLElement).style.opacity = '0.3')}
                  />
                  <div className="text-xs text-[#786c62]">
                    <p className="font-semibold text-[#2c2724]">Anteprima copertina</p>
                    <p className="mt-0.5 text-[11px]">Se l'immagine è visibile, premi "Usa questa copertina".</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyManualUrl}
                disabled={!manualUrl.trim()}
                className="w-full py-2.5 bg-[#8b5e34] text-white rounded-xl text-sm font-medium hover:bg-[#724b27] disabled:opacity-50 transition-colors"
              >
                Usa questa copertina
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
