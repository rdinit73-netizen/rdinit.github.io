import { Book, ReadingGoal } from '../types/book';

const STORAGE_KEY = 'exlibris_reading_journal_books_v1';
const GOAL_KEY = 'exlibris_reading_goal_v1';

// Initial sample books to showcase features out of the box
export const INITIAL_BOOKS: Book[] = [
  {
    id: 'sample-1',
    title: 'Se una notte d\'inverno un viaggiatore',
    author: 'Italo Calvino',
    genre: 'Classico Contemporaneo',
    format: 'cartaceo',
    status: 'letto',
    rating: 5,
    totalPages: 288,
    currentPage: 288,
    startDate: '2026-09-10',
    endDate: '2026-09-22',
    durationDays: 12,
    review: 'Uno straordinario meta-romanzo che celebra il piacere primordiale della lettura. Calvino parla direttamente al Lettore, coinvolgendolo in un labirinto di inizi irresistibili.',
    favoriteParts: 'La descrizione della preparazione del lettore all\'inizio: trovare la posizione migliore, allontanare i rumori e lasciarsi catturare dalla prima pagina.',
    quotes: [
      {
        id: 'q-1-1',
        text: 'Stai per cominciare a leggere il nuovo romanzo di Italo Calvino. Rilassati. Raccogliti. Allontana da te ogni altro pensiero.',
        page: '9',
        createdAt: '2026-09-10',
      },
      {
        id: 'q-1-2',
        text: 'Leggere è andare incontro a qualcosa che sta per essere e ancora nessuno sa cosa sarà.',
        page: '142',
        createdAt: '2026-09-18',
      },
    ],
    coverUrl: 'https://covers.openlibrary.org/b/id/12711674-L.jpg',
    isFavorite: true,
    isbn: '9788804667995',
    favoriteCharacter: 'Ludmilla (La Lettrice)',
    favoriteCharacterReason: 'Rappresenta l\'amore puro per la narrazione autentica, libera da etichette e formalismi accademici.',
    worstCharacter: 'Ermes Marana',
    worstCharacterReason: 'Il falsario senza scrupoli che altera e spezza i fili delle storie per cinismo.',
    recommendRating: 5,
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-22T19:30:00.000Z',
  },
  {
    id: 'sample-2',
    title: 'Il Piccolo Principe',
    author: 'Antoine de Saint-Exupéry',
    genre: 'Favola Filosofica',
    format: 'cartaceo',
    status: 'letto',
    rating: 5,
    totalPages: 120,
    currentPage: 120,
    startDate: '2026-10-02',
    endDate: '2026-10-05',
    durationDays: 3,
    review: 'Riletto dopo anni. Ogni età rivela uno strato nuovo di poesia e saggezza sul significato del tempo, dell\'amicizia e dell\'essenziale.',
    favoriteParts: 'Il dialogo con la volpe sull\'addomesticare e la responsabilità verso la propria rosa.',
    quotes: [
      {
        id: 'q-2-1',
        text: 'Non si vede bene che col cuore. L\'essenziale è invisibile agli occhi.',
        page: '72',
        createdAt: '2026-10-04',
      },
      {
        id: 'q-2-2',
        text: 'È il tempo che hai perduto per la tua rosa che ha fatto la tua rosa così importante.',
        page: '74',
        createdAt: '2026-10-05',
      },
    ],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788845292613-L.jpg',
    isFavorite: true,
    isbn: '9788845292613',
    favoriteCharacter: 'La Volpe',
    favoriteCharacterReason: 'Custode della saggezza più profonda sull\'amicizia, l\'addomesticare e la responsabilità verso chi si ama.',
    worstCharacter: 'L\'Uomo d\'affari',
    worstCharacterReason: 'La cecità dell\'accumulo materiale fine a se stesso, incapace di contemplare la bellezza.',
    recommendRating: 5,
    createdAt: '2026-10-02T14:00:00.000Z',
    updatedAt: '2026-10-05T18:00:00.000Z',
  },
  {
    id: 'sample-3',
    title: '1984',
    author: 'George Orwell',
    genre: 'Fantascienza / Distopia',
    format: 'ebook',
    status: 'in_lettura',
    rating: 4,
    totalPages: 336,
    currentPage: 198,
    startDate: '2026-10-12',
    endDate: '',
    durationDays: 11,
    review: 'Angosciante ma profetico. La neolingua e la manipolazione della verità storica colpiscono come non mai.',
    favoriteParts: 'L\'analisi del ruolo del linguaggio nel modellare i limiti del pensiero pensabile.',
    quotes: [
      {
        id: 'q-3-1',
        text: 'Chi controlla il passato controlla il futuro: chi controlla il presente controlla il passato.',
        page: '42',
        createdAt: '2026-10-14',
      },
    ],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788804668237-L.jpg',
    isFavorite: false,
    isbn: '9788804668237',
    favoriteCharacter: 'Winston Smith',
    favoriteCharacterReason: 'Il coraggio fragile di conservare un diario segreto e difendere la propria umanità.',
    worstCharacter: 'O\'Brien',
    worstCharacterReason: 'L\'inquietante intelligenza messa al servizio del conformismo crudele e della sottomissione psichica.',
    recommendRating: 5,
    createdAt: '2026-10-12T09:00:00.000Z',
    updatedAt: '2026-10-23T08:00:00.000Z',
  },
  {
    id: 'sample-4',
    title: 'Siddhartha',
    author: 'Hermann Hesse',
    genre: 'Filosofia / Narrativa',
    format: 'cartaceo',
    status: 'da_leggere',
    rating: 0,
    totalPages: 160,
    currentPage: 0,
    startDate: '',
    endDate: '',
    durationDays: 0,
    review: '',
    favoriteParts: '',
    quotes: [],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9788807900143-L.jpg',
    isFavorite: false,
    isbn: '9788807900143',
    createdAt: '2026-10-18T16:00:00.000Z',
    updatedAt: '2026-10-18T16:00:00.000Z',
  },
];

const INIT_FLAG_KEY = 'exlibris_initialized_v3';

// In-memory cache in case localStorage is disabled or restricted
let memoryBooks: Book[] | null = null;

// IndexedDB Helper for bulletproof persistence in mobile WebViews
const IDB_NAME = 'exlibris_db';
const IDB_STORE = 'app_data';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
  } catch {
    // Silent fallback
  }
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function migrateBooks(loaded: Book[]): { books: Book[]; changed: boolean } {
  let changed = false;
  const migrated = loaded.map((book) => {
    let bookUpdated = false;
    const copy = { ...book };

    // Check if there is matching sample book to backfill
    const sample = INITIAL_BOOKS.find((s) => s.id === book.id);
    if (sample) {
      if (!copy.favoriteCharacter && sample.favoriteCharacter) {
        copy.favoriteCharacter = sample.favoriteCharacter;
        bookUpdated = true;
      }
      if (!copy.favoriteCharacterReason && sample.favoriteCharacterReason) {
        copy.favoriteCharacterReason = sample.favoriteCharacterReason;
        bookUpdated = true;
      }
      if (!copy.worstCharacter && sample.worstCharacter) {
        copy.worstCharacter = sample.worstCharacter;
        bookUpdated = true;
      }
      if (!copy.worstCharacterReason && sample.worstCharacterReason) {
        copy.worstCharacterReason = sample.worstCharacterReason;
        bookUpdated = true;
      }
      if (typeof copy.recommendRating !== 'number' && typeof sample.recommendRating === 'number') {
        copy.recommendRating = sample.recommendRating;
        bookUpdated = true;
      }
      // Migrate old non-Italian covers to verified Italian edition covers
      if (
        sample.coverUrl &&
        (!copy.coverUrl ||
          copy.coverUrl.includes('8231856') ||
          copy.coverUrl.includes('8575708') ||
          copy.coverUrl.includes('11153215'))
      ) {
        copy.coverUrl = sample.coverUrl;
        bookUpdated = true;
      }
    }

    // For any book with a positive rating and missing recommendRating, default recommendRating to rating
    if (typeof copy.recommendRating !== 'number' && copy.rating > 0) {
      copy.recommendRating = copy.rating;
      bookUpdated = true;
    }

    if (bookUpdated) {
      changed = true;
      return copy;
    }
    return book;
  });

  return { books: migrated, changed };
}

export function loadBooks(): Book[] {
  // 1. Try Native Android Bridge first if available
  try {
    // @ts-expect-error AndroidNative interface
    if (window.AndroidNative && typeof window.AndroidNative.getData === 'function') {
      // @ts-expect-error AndroidNative interface
      const nativeData = window.AndroidNative.getData(STORAGE_KEY);
      if (nativeData) {
        const parsed = JSON.parse(nativeData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { books: migrated, changed } = migrateBooks(parsed);
          if (changed) {
            saveBooks(migrated);
          }
          memoryBooks = migrated;
          return migrated;
        }
      }
    }
  } catch {
    // Fallback to web storage
  }

  // 2. Try LocalStorage
  try {
    const isInit = localStorage.getItem(INIT_FLAG_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const { books: migrated, changed } = migrateBooks(parsed);
        if (changed) {
          saveBooks(migrated);
        }
        memoryBooks = migrated;
        return migrated;
      }
    }
    if (isInit) {
      // User has explicitly cleared or emptied their collection
      memoryBooks = [];
      return [];
    }
  } catch (err) {
    console.warn('LocalStorage load error, checking fallbacks:', err);
  }

  // 3. Try SessionStorage
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (Array.isArray(parsed)) {
        const { books: migrated, changed } = migrateBooks(parsed);
        if (changed) {
          saveBooks(migrated);
        }
        memoryBooks = migrated;
        return migrated;
      }
    }
  } catch {
    // Ignore
  }

  // 4. In-memory check
  if (memoryBooks) {
    const { books: migrated, changed } = migrateBooks(memoryBooks);
    if (changed) {
      saveBooks(migrated);
    }
    memoryBooks = migrated;
    return migrated;
  }

  // First run: initialize with sample books and persist
  try {
    localStorage.setItem(INIT_FLAG_KEY, 'true');
    saveBooks(INITIAL_BOOKS);
  } catch {
    // Ignore
  }
  return INITIAL_BOOKS;
}

export function saveBooks(books: Book[]): void {
  memoryBooks = books;

  // 1. LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    localStorage.setItem(INIT_FLAG_KEY, 'true');
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // 2. SessionStorage backup
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch {
    // Ignore
  }

  // 3. Asynchronous IndexedDB backup
  idbSet(STORAGE_KEY, books);
  idbSet(INIT_FLAG_KEY, 'true');

  // 4. Android Native Bridge SharedPreferences
  try {
    // @ts-expect-error AndroidNative interface
    if (window.AndroidNative && typeof window.AndroidNative.saveData === 'function') {
      // @ts-expect-error AndroidNative interface
      window.AndroidNative.saveData(STORAGE_KEY, JSON.stringify(books));
    }
  } catch {
    // Ignore
  }

  // 5. Notify custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('exlibris_books_saved', { detail: { count: books.length } }));
  }
}

export function loadReadingGoal(): ReadingGoal {
  const currentYear = new Date().getFullYear();
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.targetBooks === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('LocalStorage goal load error:', err);
  }
  return { year: currentYear, targetBooks: 12 };
}

export function saveReadingGoal(goal: ReadingGoal): void {
  try {
    localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
  } catch (err) {
    console.warn('LocalStorage goal save error:', err);
  }
}

/**
 * Calculates days between two date strings (YYYY-MM-DD)
 */
export function calculateDurationDays(startDateStr: string, endDateStr?: string): number | null {
  if (!startDateStr) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;

  const end = endDateStr ? new Date(endDateStr) : new Date();
  if (isNaN(end.getTime())) return null;

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  return diffDays;
}

/**
 * Checks if running inside native Android wrapper
 */
export function isNativeAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  // 1. Explicit global flag injected by native Android WebView
  // @ts-expect-error global flag
  if (window.__IS_ANDROID_NATIVE__ === true) return true;
  // 2. URL parameter or file: protocol (assets in Android WebView are always file:///android_asset/...)
  if (typeof window.location !== 'undefined') {
    if (window.location.protocol === 'file:') return true;
    if (window.location.search && window.location.search.includes('platform=android_native')) return true;
  }
  // 3. Android native marker class on documentElement
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('android-native')) {
    return true;
  }
  // 4. AndroidNative JS bridge injected by MainActivity.kt
  // @ts-expect-error AndroidNative interface
  if (window.AndroidNative) {
    return true;
  }
  // 5. Android WebView user agent check
  const ua = window.navigator?.userAgent || '';
  if (/Android.*(wv|Version\/[0-9.]+ Chrome\/[0-9.]+ Mobile)/i.test(ua)) {
    return true;
  }
  return false;
}
