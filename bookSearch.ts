export interface OnlineBookResult {
  title: string;
  author: string;
  coverUrl: string;
  totalPages?: number;
  publishedYear?: string;
  genre?: string;
  isbn?: string;
  source: 'OpenLibrary' | 'GoogleBooks';
  isItalianEdition?: boolean;
  language?: string;
}

export async function searchOnlineBooks(query: string): Promise<OnlineBookResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: OnlineBookResult[] = [];
  const seenCovers = new Set<string>();

  // 1. Google Books API with strict Italian language priority (langRestrict=it)
  try {
    const gbRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(trimmed)}&langRestrict=it&maxResults=10`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (gbRes.ok) {
      const data = await gbRes.json();
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          const info = item.volumeInfo || {};
          let thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
          if (thumb) {
            thumb = thumb.replace('http://', 'https://');
            if (thumb.includes('&edge=curl')) {
              thumb = thumb.replace('&edge=curl', '');
            }
          }

          const isbnObj = info.industryIdentifiers?.find(
            (id: { type: string; identifier: string }) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
          );

          if (info.title && (thumb || info.authors?.length)) {
            const author = info.authors?.join(', ') || 'Autore sconosciuto';
            const key = `${info.title.toLowerCase()}_${author.toLowerCase()}`;
            if (!seenCovers.has(key)) {
              seenCovers.add(key);
              results.push({
                title: info.title,
                author,
                coverUrl: thumb,
                totalPages: info.pageCount || undefined,
                publishedYear: info.publishedDate ? info.publishedDate.slice(0, 4) : undefined,
                genre: info.categories?.[0] || undefined,
                isbn: isbnObj?.identifier,
                source: 'GoogleBooks',
                isItalianEdition: true,
                language: 'Italiano',
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Google Books Italian fetch error or timeout:', err);
  }

  // 2. Open Library API with priority on Italian language editions (language:ita)
  try {
    // Try Italian language query first
    let olRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}+language:ita&limit=10`,
      { signal: AbortSignal.timeout(6000) }
    );

    let data = olRes.ok ? await olRes.json() : null;
    let docs = data?.docs && Array.isArray(data.docs) ? data.docs : [];

    // If Italian query returned fewer than 2 results, fetch general search as backup
    if (docs.length < 2) {
      try {
        const fallbackRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=8`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.docs) {
            docs = [...docs, ...fallbackData.docs];
          }
        }
      } catch {
        // keep whatever docs we have
      }
    }

    const ITALIAN_PUBLISHERS = [
      'mondadori',
      'feltrinelli',
      'einaudi',
      'adelphi',
      'bompiani',
      'rizzoli',
      'garzanti',
      'sellerio',
      'giunti',
      'newton',
      'laterza',
      'salani',
      'fazi',
      'tea',
      'iperborea',
      'neripozza',
    ];

    for (const doc of docs) {
      const coverId = doc.cover_i;
      const isbn = doc.isbn?.[0];
      // Prefer high-res Open Library cover by cover ID, or fallback to ISBN cover
      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
        : '';

      const author = doc.author_name ? doc.author_name.join(', ') : 'Autore sconosciuto';
      const title = doc.title;
      const key = `${(title || '').toLowerCase()}_${author.toLowerCase()}`;

      const langs = Array.isArray(doc.language) ? doc.language : [];
      const publishers = Array.isArray(doc.publisher) ? doc.publisher.map((p: string) => p.toLowerCase()) : [];
      const hasItalianPublisher = publishers.some((p: string) =>
        ITALIAN_PUBLISHERS.some((pub) => p.includes(pub))
      );
      const isItalian = langs.includes('ita') || hasItalianPublisher;

      if (title && coverUrl && !seenCovers.has(key)) {
        seenCovers.add(key);
        results.push({
          title,
          author,
          coverUrl,
          totalPages: doc.number_of_pages_median || undefined,
          publishedYear: doc.first_publish_year ? String(doc.first_publish_year) : undefined,
          genre: doc.subject?.[0] || undefined,
          isbn,
          source: 'OpenLibrary',
          isItalianEdition: isItalian,
          language: isItalian ? 'Italiano' : undefined,
        });
      }
    }
  } catch (err) {
    console.warn('OpenLibrary fetch error or timeout:', err);
  }

  // Sort so Italian editions always appear at the top
  return results.sort((a, b) => {
    if (a.isItalianEdition && !b.isItalianEdition) return -1;
    if (!a.isItalianEdition && b.isItalianEdition) return 1;
    if (a.coverUrl && !b.coverUrl) return -1;
    if (!a.coverUrl && b.coverUrl) return 1;
    return 0;
  });
}

/**
 * Compresses an image file from smartphone camera/gallery to base64 Data URL
 * to keep local storage compact and work 100% offline.
 */
export async function fileToCompressedDataUrl(file: File, maxDim = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // prefer webp or jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Impossibile caricare immagine'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Errore di lettura file'));
    reader.readAsDataURL(file);
  });
}
