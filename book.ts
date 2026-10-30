export type ReadingStatus = 'letto' | 'in_lettura' | 'da_leggere' | 'abbandonato';
export type BookFormat = 'cartaceo' | 'ebook' | 'audiolibro';

export interface BookQuote {
  id: string;
  text: string;
  page?: string;
  note?: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  format: BookFormat;
  status: ReadingStatus;
  rating: number; // 0 - 5
  totalPages: number;
  currentPage: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays?: number; // Calculated or manual
  review: string; // Recensione personale / commenti
  quotes: BookQuote[]; // Parti più belle / citazioni
  favoriteParts: string; // Note sulle parti più belle / riflessioni chiave
  coverUrl: string;
  isFavorite: boolean;
  isbn?: string;
  favoriteCharacter?: string; // Personaggio preferito
  favoriteCharacterReason?: string; // Motivo personaggio preferito
  worstCharacter?: string; // Personaggio peggiore / meno amato
  worstCharacterReason?: string; // Motivo personaggio peggiore
  recommendRating?: number; // Suggeriresti la lettura? (1-5 stelle, 0 = non specificato)
  createdAt: string;
  updatedAt: string;
}

export interface ReadingGoal {
  year: number;
  targetBooks: number;
}

export type ViewTab = 'libreria' | 'in_lettura' | 'citazioni' | 'statistiche';
export type SortOption = 'recent' | 'rating_desc' | 'title_asc' | 'pages_desc' | 'duration_asc';
