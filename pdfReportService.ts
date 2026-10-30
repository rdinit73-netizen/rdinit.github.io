import { jsPDF } from 'jspdf';
import { Book } from '../types/book';

const STATUS_LABELS: Record<string, string> = {
  letto: 'Letto',
  in_lettura: 'In Lettura',
  da_leggere: 'Da Leggere',
  abbandonato: 'Abbandonato',
};

const FORMAT_LABELS: Record<string, string> = {
  cartaceo: 'Cartaceo',
  ebook: 'E-book',
  audiolibro: 'Audiolibro',
};

/**
 * Draws a vector 5-pointed star at (cx, cy).
 * Completely avoids Unicode 8-bit font encoding bugs (e.g. ★ turning into &).
 */
function drawVectorStar(
  doc: jsPDF,
  cx: number,
  cy: number,
  outerRadius: number,
  isFilled: boolean
): void {
  const spikes = 5;
  const innerRadius = outerRadius * 0.42;
  const step = Math.PI / spikes;
  let rot = (Math.PI / 2) * 3; // start pointing upwards

  if (isFilled) {
    doc.setFillColor(217, 119, 6); // warm amber #d97706
    doc.setDrawColor(180, 95, 6);
  } else {
    doc.setFillColor(242, 238, 232); // soft unfilled gray #f2eee8
    doc.setDrawColor(210, 202, 192);
  }
  doc.setLineWidth(0.18);

  for (let i = 0; i < spikes; i++) {
    const ox = cx + Math.cos(rot) * outerRadius;
    const oy = cy + Math.sin(rot) * outerRadius;
    if (i === 0) doc.moveTo(ox, oy);
    else doc.lineTo(ox, oy);
    rot += step;

    const ix = cx + Math.cos(rot) * innerRadius;
    const iy = cy + Math.sin(rot) * innerRadius;
    doc.lineTo(ix, iy);
    rot += step;
  }
  doc.close();
  doc.fillStroke();
}

/**
 * Draws a row of vector stars (e.g. 5 stars) at (startX, startY)
 */
function drawVectorStarRating(
  doc: jsPDF,
  startX: number,
  startY: number,
  rating: number,
  maxStars = 5,
  starRadius = 2.4,
  spacing = 5.8
): void {
  const roundRating = Math.max(0, Math.min(maxStars, Math.round(rating)));
  for (let i = 0; i < maxStars; i++) {
    const cx = startX + i * spacing + starRadius;
    const cy = startY;
    drawVectorStar(doc, cx, cy, starRadius, i < roundRating);
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('it-IT');
  } catch {
    return dateStr;
  }
}

/**
 * Converts any image Data URL to a clean, standardized JPEG Data URL
 * to guarantee 100% compatibility with jsPDF without format crashes.
 */
async function ensureJpegDataUrl(dataUrl: string): Promise<string> {
  // If already JPEG or PNG, jsPDF supports them natively with zero transformation
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/png')) {
    return dataUrl;
  }
  if (typeof document === 'undefined') return dataUrl;
  try {
    return await new Promise<string>((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(dataUrl), 1500);
      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 300;
          canvas.height = img.naturalHeight || 450;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(dataUrl);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.90));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  } catch {
    return dataUrl;
  }
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (result && result.startsWith('data:image/')) {
        resolve(result);
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function loadImageDataInternal(url: string): Promise<string | null> {
  // 1. Android Native Container Bridge: Native Java/Kotlin HTTP connection bypasses ALL browser CORS
  // and follows all 301/302 redirects (OpenLibrary/Archive.org), returning standard JPEG data URL
  try {
    const bridge = typeof window !== 'undefined'
      ? (window as unknown as { AndroidNative?: { fetchImageBase64?: (u: string) => string | null } }).AndroidNative
      : undefined;
    if (bridge && typeof bridge.fetchImageBase64 === 'function') {
      const nativeB64 = bridge.fetchImageBase64(url);
      if (nativeB64 && nativeB64.startsWith('data:image/')) {
        return nativeB64;
      }
    }
  } catch {
    // Continue to web fallbacks
  }

  // 2. Fast DOM extraction if already loaded in an <img> tag on page (e.g. inside BookDetailModal)
  if (typeof document !== 'undefined') {
    try {
      const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
      const matched = imgs.find((im) => im.src === url || (url.startsWith('http') && im.src.includes(url.slice(15))));
      if (matched && matched.complete && matched.naturalWidth > 0) {
        const c = document.createElement('canvas');
        c.width = matched.naturalWidth;
        c.height = matched.naturalHeight;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(matched, 0, 0);
          const domB64 = c.toDataURL('image/jpeg', 0.90);
          if (domB64 && domB64.startsWith('data:image/jpeg')) return domB64;
        }
      }
    } catch {
      // If canvas is tainted or blocked, continue
    }
  }

  // 3. Direct fetch with blob (cleanest when CORS header is present, e.g. OpenLibrary / archive.org)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const blob = await res.blob();
      const b64 = await blobToDataUrl(blob);
      if (b64) return await ensureJpegDataUrl(b64);
    }
  } catch {
    // Continue to proxy
  }

  // 3. CORS Image Proxy fallback (essential for Google Books or sources with strict CORS policies)
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg&q=85`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(proxyUrl, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const blob = await res.blob();
      const b64 = await blobToDataUrl(blob);
      if (b64) return await ensureJpegDataUrl(b64);
    }
  } catch {
    // Continue to canvas fallback
  }

  // 4. HTML Image with crossOrigin anonymous + Canvas
  if (typeof document !== 'undefined') {
    try {
      const canvasB64 = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => {
          img.src = '';
          resolve(null);
        }, 3000);

        img.onload = () => {
          clearTimeout(timer);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 300;
            canvas.height = img.naturalHeight || img.height || 450;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        img.src = url;
      });
      if (canvasB64) return canvasB64;
    } catch {
      // Ignored
    }
  }

  return null;
}

/**
 * Loads an image from a URL or base64 and returns a clean JPEG Data URL for jsPDF.
 * Implements a generous 6000ms timeout race so cover images load reliably even over mobile networks.
 */
async function loadImageData(url?: string): Promise<string | null> {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  // If already clean base64 data URL
  if (trimmed.startsWith('data:image/')) {
    return await ensureJpegDataUrl(trimmed);
  }

  // 6000ms timeout race so cover images have ample time across mobile networks
  return Promise.race([
    loadImageDataInternal(trimmed),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
  ]);
}

/**
 * Draws an elegant bookplate placeholder when no cover image is available.
 */
function drawCoverPlaceholder(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  book: Book
): void {
  // Warm bookplate background
  doc.setFillColor(250, 246, 240);
  doc.setDrawColor(220, 208, 195);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'FD');

  // Decorative inner frame
  doc.setDrawColor(235, 224, 212);
  doc.setLineWidth(0.2);
  doc.rect(x + 2, y + 2, w - 4, h - 4);

  // Top ExLibris header
  doc.setFont('times', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(139, 94, 52);
  doc.text('EX LIBRIS', x + w / 2, y + 7.5, { align: 'center' });

  // Book title snippet
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(44, 39, 36);
  const titleSnippet = doc.splitTextToSize(book.title, w - 6);
  const maxLines = Math.min(titleSnippet.length, 4);
  doc.text(titleSnippet.slice(0, maxLines), x + w / 2, y + 16, { align: 'center' });

  // Author snippet at bottom
  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 108, 98);
  const authorSnippet = doc.splitTextToSize(book.author || 'Autore', w - 6);
  doc.text(authorSnippet.slice(0, 2), x + w / 2, y + h - 5, { align: 'center' });
}

/**
 * Renders an accessible floating banner on mobile screens when automatic download
 * is blocked by mobile browser popup/download policies.
 */
function showMobilePdfReadyBanner(blobUrl: string, filename: string): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById('exlibris-pdf-mobile-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'exlibris-pdf-mobile-banner';
  banner.className =
    'fixed top-3 left-3 right-3 z-50 bg-[#2c2724] text-white p-3.5 rounded-2xl shadow-2xl border border-[#d97706]/50 flex items-center justify-between gap-3 animate-fade-in';

  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
      <div style="width: 38px; height: 38px; border-radius: 10px; background-color: #8b5e34; color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>
      </div>
      <div style="min-width: 0;">
        <p style="font-size: 13px; font-weight: 600; color: #fffefc; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: serif;">PDF Pronto</p>
        <p style="font-size: 11px; color: #dfd7cc; margin: 2px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${filename}</p>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
      <a
        href="${blobUrl}"
        download="${filename}"
        target="_blank"
        rel="noopener noreferrer"
        style="padding: 7px 12px; background-color: #8b5e34; color: white; font-size: 11px; font-weight: 600; border-radius: 10px; text-decoration: none; display: inline-block;"
      >
        Apri PDF
      </a>
      <button
        type="button"
        id="exlibris-pdf-close-btn"
        style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #dfd7cc; background: transparent; border: none; font-size: 16px; cursor: pointer;"
      >
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  const closeBtn = banner.querySelector('#exlibris-pdf-close-btn');
  closeBtn?.addEventListener('click', () => {
    banner.remove();
  });

  setTimeout(() => {
    if (banner.parentElement) {
      banner.style.opacity = '0';
      banner.style.transition = 'opacity 0.3s ease';
      setTimeout(() => banner.remove(), 300);
    }
  }, 15000);
}

/**
 * Universal PDF exporter that guarantees delivery on smartphones (both mobile
 * browsers via Web Share API / Blob URL and native Android WebView via Native Bridge).
 */
export async function exportPdfDocument(
  doc: jsPDF,
  filename: string,
  title: string = 'Scheda Libro ExLibris'
): Promise<void> {
  const bridge = typeof window !== 'undefined'
    ? (window as unknown as { AndroidNative?: { saveAndOpenPdf?: (b64: string, name?: string, title?: string) => void; showToast?: (msg: string) => void } }).AndroidNative
    : undefined;

  // 1. Android Native Container Bridge (saves bytes & launches ACTION_VIEW / SHARE intent)
  if (bridge && typeof bridge.saveAndOpenPdf === 'function') {
    try {
      const dataUri = doc.output('datauristring');
      bridge.saveAndOpenPdf(dataUri, filename, title);
      return;
    } catch (e) {
      console.warn('Native Android saveAndOpenPdf failed, falling back:', e);
      if (typeof bridge.showToast === 'function') {
        bridge.showToast('Esportazione PDF in corso...');
      }
    }
  }

  // 2. Detect mobile device
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1));

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // 3. Direct download and open (no share sheet)
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 2000);
  } catch {
    // Ignored
  }

  // Open directly in a new tab/window if permitted
  try {
    window.open(blobUrl, '_blank');
  } catch {
    // Ignored
  }

  if (isMobile) {
    showMobilePdfReadyBanner(blobUrl, filename);
  }
}

/**
 * Generates an elegant PDF document for a single book record with cover image
 */
export async function generateSingleBookPDF(book: Book): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to ensure text fits or add new page
  const checkNewPage = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageBorder();
    }
  };

  const drawPageBorder = () => {
    doc.setDrawColor(235, 220, 208); // subtle warm border
    doc.setLineWidth(0.4);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 140, 130);
    doc.text('ExLibris - Diario Letterario Personale', margin, pageHeight - 15);
    doc.text(new Date().toLocaleDateString('it-IT'), pageWidth - margin, pageHeight - 15, { align: 'right' });
  };

  drawPageBorder();

  // Header Banner
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(139, 94, 52); // Siena (#8b5e34)
  doc.text('EXLIBRIS | SCHEDA DEL LIBRO', margin, y);
  y += 6;

  // Pre-fetch cover image
  const coverData = await loadImageData(book.coverUrl);

  const coverWidth = 35;
  const coverHeight = 52.5; // standard 1:1.5 book aspect ratio
  const coverX = margin;
  const coverY = y;

  if (coverData) {
    try {
      const imgFormat = coverData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(coverData, imgFormat, coverX, coverY, coverWidth, coverHeight);
      doc.setDrawColor(215, 200, 185);
      doc.setLineWidth(0.35);
      doc.rect(coverX, coverY, coverWidth, coverHeight);
    } catch {
      drawCoverPlaceholder(doc, coverX, coverY, coverWidth, coverHeight, book);
    }
  } else {
    drawCoverPlaceholder(doc, coverX, coverY, coverWidth, coverHeight, book);
  }

  // Book Information on the right of the cover
  const infoX = margin + coverWidth + 7;
  const infoWidth = contentWidth - coverWidth - 7;
  let curY = y;

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(44, 39, 36); // ink
  const titleLines = doc.splitTextToSize(book.title, infoWidth);
  doc.text(titleLines, infoX, curY + 4);
  curY += 4 + titleLines.length * 6.5;

  // Author
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(120, 108, 98);
  doc.text(`di ${book.author || 'Autore sconosciuto'}`, infoX, curY);
  curY += 5.5;

  // Genre & ISBN
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(139, 94, 52);
  doc.text(`Genere: ${book.genre || 'Generale'}${book.isbn ? `  |  ISBN: ${book.isbn}` : ''}`, infoX, curY);
  curY += 6.5;

  // Metadata 2-Column Grid
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(78, 67, 58);

  const colW = infoWidth / 2;

  // Row 1: Stato & Formato
  doc.setFont('helvetica', 'bold');
  doc.text('Stato:', infoX, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(STATUS_LABELS[book.status] || book.status, infoX + 16, curY);

  doc.setFont('helvetica', 'bold');
  doc.text('Formato:', infoX + colW, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(FORMAT_LABELS[book.format] || book.format, infoX + colW + 18, curY);
  curY += 5;

  // Row 2: Pagine & Tempo
  doc.setFont('helvetica', 'bold');
  doc.text('Pagine:', infoX, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${book.currentPage} / ${book.totalPages || '-'} pag`, infoX + 16, curY);

  if (book.durationDays) {
    doc.setFont('helvetica', 'bold');
    doc.text('Tempo:', infoX + colW, curY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${book.durationDays} giorni`, infoX + colW + 18, curY);
  }
  curY += 5;

  // Row 3: Date lettura
  doc.setFont('helvetica', 'bold');
  doc.text('Inizio:', infoX, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(book.startDate), infoX + 16, curY);

  doc.setFont('helvetica', 'bold');
  doc.text('Fine:', infoX + colW, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(book.endDate), infoX + colW + 18, curY);
  curY += 6;

  y = Math.max(coverY + coverHeight + 5, curY + 2);

  // Horizontal divider
  doc.setDrawColor(216, 205, 193);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Ratings Block (Valutazione e Indice di Consiglio)
  doc.setFillColor(251, 248, 244);
  doc.setDrawColor(235, 220, 208);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  const halfWidth = contentWidth / 2;

  // Personal Rating
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(139, 94, 52);
  doc.text('VALUTAZIONE PERSONALE', margin + 6, y + 6);
  // Draw Vector Stars
  drawVectorStarRating(doc, margin + 6, y + 14, book.rating || 0, 5, 2.5, 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(180, 95, 6); // amber
  doc.text(`${book.rating || 0} / 5 stelle`, margin + 6 + 5 * 6 + 4, y + 15);

  // Recommend Rating
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(139, 94, 52);
  doc.text('CONSIGLIERESTI LA LETTURA?', margin + halfWidth + 6, y + 6);
  if (typeof book.recommendRating === 'number' && book.recommendRating > 0) {
    drawVectorStarRating(doc, margin + halfWidth + 6, y + 14, book.recommendRating, 5, 2.5, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 95, 6);
    doc.text(`${book.recommendRating} / 5 stelle`, margin + halfWidth + 6 + 5 * 6 + 4, y + 15);
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(140, 130, 120);
    doc.text('Non ancora specificato', margin + halfWidth + 6, y + 15);
  }
  y += 28;

  // Characters Section (Personaggio Preferito & Personaggio Peggiore)
  if (book.favoriteCharacter || book.worstCharacter) {
    checkNewPage(45);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(44, 39, 36);
    doc.text('ANALISI DEI PERSONAGGI', margin, y);
    y += 6;

    if (book.favoriteCharacter) {
      doc.setFillColor(248, 252, 248);
      doc.setDrawColor(200, 230, 200);
      doc.roundedRect(margin, y, contentWidth, 17, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(34, 110, 48);
      doc.text('Personaggio Preferito:', margin + 4, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 80, 30);
      doc.text(book.favoriteCharacter, margin + 45, y + 5);

      if (book.favoriteCharacterReason) {
        doc.setFont('times', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(60, 75, 60);
        const reasonLines = doc.splitTextToSize(`"Motivo: ${book.favoriteCharacterReason}"`, contentWidth - 8);
        doc.text(reasonLines, margin + 4, y + 11);
      }
      y += 21;
    }

    if (book.worstCharacter) {
      checkNewPage(22);
      doc.setFillColor(254, 248, 248);
      doc.setDrawColor(245, 210, 210);
      doc.roundedRect(margin, y, contentWidth, 17, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(170, 45, 45);
      doc.text('Personaggio Peggiore / Meno Amato:', margin + 4, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(130, 30, 30);
      doc.text(book.worstCharacter, margin + 65, y + 5);

      if (book.worstCharacterReason) {
        doc.setFont('times', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(85, 55, 55);
        const worstReasonLines = doc.splitTextToSize(`"Motivo: ${book.worstCharacterReason}"`, contentWidth - 8);
        doc.text(worstReasonLines, margin + 4, y + 11);
      }
      y += 21;
    }
  }

  // Review
  if (book.review) {
    checkNewPage(30);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(44, 39, 36);
    doc.text('RECENSIONE E NOTE', margin, y);
    y += 5;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(44, 39, 36);
    const revLines = doc.splitTextToSize(book.review, contentWidth);
    doc.text(revLines, margin, y);
    y += revLines.length * 5 + 6;
  }

  // Favorite parts
  if (book.favoriteParts) {
    checkNewPage(25);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(139, 94, 52);
    doc.text('PARTI PIÙ BELLE & RIFLESSIONI CHIAVE', margin, y);
    y += 5;

    doc.setFont('times', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 50, 45);
    const favLines = doc.splitTextToSize(book.favoriteParts, contentWidth);
    doc.text(favLines, margin, y);
    y += favLines.length * 4.8 + 6;
  }

  // Quotes
  if (book.quotes && book.quotes.length > 0) {
    checkNewPage(30);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(139, 94, 52);
    doc.text('CITAZIONI ANNOTATE', margin, y);
    y += 5;

    book.quotes.forEach((q) => {
      checkNewPage(20);
      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(44, 39, 36);

      const quotePrefix = `"${q.text}"${q.page ? ` (pag. ${q.page})` : ''}`;
      const qLines = doc.splitTextToSize(quotePrefix, contentWidth - 6);
      doc.text(qLines, margin + 4, y);
      y += qLines.length * 4.8 + 3;
    });
  }

  const safeFilename = `${(book.title || 'Scheda_Libro')
    .slice(0, 30)
    .replace(/[^a-zA-Z0-9]/g, '_')}_ExLibris.pdf`;
  await exportPdfDocument(doc, safeFilename, `Scheda: ${book.title}`);
}

/**
 * Generates an exhaustive PDF summary of the entire library
 */
export async function generateTotalLibraryPDF(books: Book[]): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let currentPageNum = 1;
  let y = margin;

  const drawPageLayout = (pageNum: number) => {
    doc.setDrawColor(235, 220, 208);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 140, 130);
    doc.text('ExLibris - Registro Completo dei Libri', margin, pageHeight - 13);
    doc.text(`Pagina ${pageNum}`, pageWidth - margin, pageHeight - 13, { align: 'right' });
  };

  const checkNewPage = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin - 10) {
      doc.addPage();
      currentPageNum++;
      y = margin;
      drawPageLayout(currentPageNum);
    }
  };

  drawPageLayout(currentPageNum);

  // Title Banner
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(44, 39, 36);
  doc.text('ExLibris - Registro Totale della Libreria', margin, y);
  y += 7;

  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(120, 108, 98);
  doc.text(`Report generato il ${new Date().toLocaleDateString('it-IT')} - Totale ${books.length} opere catalogate`, margin, y);
  y += 7;

  // Stats Highlights Box
  const totalBooks = books.length;
  const readCount = books.filter((b) => b.status === 'letto').length;
  const readingCount = books.filter((b) => b.status === 'in_lettura').length;
  const toReadCount = books.filter((b) => b.status === 'da_leggere').length;
  const ratedBooks = books.filter((b) => b.rating > 0);
  const avgRating = ratedBooks.length
    ? (ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length).toFixed(1)
    : '-';
  const recBooks = books.filter((b) => (b.recommendRating || 0) > 0);
  const avgRec = recBooks.length
    ? (recBooks.reduce((sum, b) => sum + (b.recommendRating || 0), 0) / recBooks.length).toFixed(1)
    : '-';

  doc.setFillColor(251, 248, 244);
  doc.setDrawColor(225, 210, 198);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 50, 42);

  const statsStr = `Letti: ${readCount}  |  In Lettura: ${readingCount}  |  Da Leggere: ${toReadCount}  |  Media Voto: ${avgRating}/5  |  Media Consiglio: ${avgRec}/5`;
  doc.text(statsStr, margin + 4, y + 10);
  y += 22;

  // Books List
  books.forEach((book, index) => {
    checkNewPage(38);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230, 220, 210);
    doc.setLineWidth(0.3);

    // Book Item Header
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(139, 94, 52);
    doc.text(`${index + 1}. ${book.title}`, margin, y);

    // Status Badge text on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 90, 80);
    const statusText = `[${STATUS_LABELS[book.status] || book.status}]`;
    doc.text(statusText, pageWidth - margin, y, { align: 'right' });
    y += 5;

    // Subtitle (Author, Genre, Pages)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 70, 65);
    const authorLine = `Autore: ${book.author}  |  Genere: ${book.genre || 'Generale'}  |  Pagine: ${book.totalPages || '-'}`;
    doc.text(authorLine, margin, y);
    y += 4.5;

    // Ratings using vector stars and clear text
    const rRating = book.rating || 0;
    const recRating = book.recommendRating || 0;

    if (rRating > 0) {
      drawVectorStarRating(doc, margin, y - 0.6, rRating, 5, 1.4, 3.6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 95, 6);
      let ratingLabel = ` (${rRating}/5)`;
      if (recRating > 0) {
        ratingLabel += `   |   Consiglio: ${recRating}/5 stelle`;
      }
      doc.text(ratingLabel, margin + 5 * 3.6 + 2, y + 0.6);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(140, 130, 120);
      let unratedLabel = 'Non ancora valutato';
      if (recRating > 0) {
        unratedLabel += `   |   Consiglio: ${recRating}/5 stelle`;
      }
      doc.text(unratedLabel, margin, y);
    }
    y += 4.5;

    // Characters (if any)
    if (book.favoriteCharacter || book.worstCharacter) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 70, 60);
      let charText = '';
      if (book.favoriteCharacter) {
        charText += `Preferito: ${book.favoriteCharacter}`;
      }
      if (book.worstCharacter) {
        if (charText) charText += '   |   ';
        charText += `Peggiore: ${book.worstCharacter}`;
      }
      doc.text(charText, margin, y);
      y += 4.5;
    }

    // Review Snippet (if any)
    if (book.review) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(90, 80, 75);
      const snippet = book.review.length > 130 ? `${book.review.slice(0, 130)}...` : book.review;
      const snippetLines = doc.splitTextToSize(`"${snippet}"`, contentWidth);
      doc.text(snippetLines, margin, y);
      y += snippetLines.length * 3.8;
    }

    // Separator line
    y += 2;
    doc.setDrawColor(240, 230, 222);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;
  });

  await exportPdfDocument(
    doc,
    'ExLibris_Report_Libreria_Completo.pdf',
    'Registro Completo Libreria ExLibris'
  );
}
