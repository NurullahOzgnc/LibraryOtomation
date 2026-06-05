/**
 * isbn.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Google Books API üzerinden ISBN numarasıyla kitap bilgisi çeker ve
 * Prisma aracılığıyla MSSQL veritabanına upsert (varsa güncelle, yoksa ekle)
 * yapar. Yazarlar otomatik oluşturulur/ilişkilendirilir.
 *
 * Kullanım (örnek):
 *   const book = await fetchBookByIsbn('9780132350884');
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import prisma from '../../config/prisma';

// ─── Google Books API dönüş tipi (kullandığımız alanlar) ──────────────────────
interface GoogleBookVolumeInfo {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  language?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: Array<{
    id: string;
    volumeInfo: GoogleBookVolumeInfo;
  }>;
}

// ─── Veritabanına kaydedilen kitabın dönüş tipi ───────────────────────────────
export interface SavedBook {
  id: string;
  isbn: string;
  title: string;
  description: string | null;
  publisher: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  language: string | null;
  coverImage: string | null;
  stock: number;
  totalCopies: number;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string; slug: string }[];
}

// ─── Yardımcı: Tarih stringinden yıl çekme ───────────────────────────────────
const parseYear = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
};

// ─── Yardımcı: Kategori ismine slug üretme ────────────────────────────────────
const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

// ─── Ana fonksiyon ────────────────────────────────────────────────────────────
/**
 * ISBN numarasını Google Books API'de sorgular, bulunan bilgileri veritabanına
 * upsert eder ve kaydedilen/güncellenen `Book` nesnesini döndürür.
 *
 * @param isbn  - Sorgulanacak ISBN numarası (10 veya 13 haneli, tire olabilir)
 * @param stock - Verilirse stok/topy copy bilgisi bu değere ayarlanır
 */
export const fetchBookByIsbn = async (isbn: string, stock?: number): Promise<SavedBook> => {
  // ISBN'deki olası tireleri veya boşlukları kaldır
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (cleanIsbn.length < 10) {
    throw new Error('Geçerli bir ISBN girin (10 veya 13 karakter).');
  }

  const hasStockOverride = Number.isFinite(stock) && (stock as number) >= 1;
  const normalizedStock = hasStockOverride ? Math.floor(stock as number) : 1;

  // ── 1. Google Books API isteği ──────────────────────────────────────────────
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim(); // opsiyonel; yoksa limitsiz ama kısıtlı

  let volumeInfo: GoogleBookVolumeInfo;

  try {
    const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
    const requestWithKey = () =>
      axios.get<GoogleBooksResponse>(baseUrl, {
        timeout: 8000,
        params: {
          q: `isbn:${cleanIsbn}`,
          ...(apiKey ? { key: apiKey } : {}),
        },
      });

    let data: GoogleBooksResponse;
    try {
      const response = await requestWithKey();
      data = response.data;
    } catch (firstError: unknown) {
      // Key hatalı/limitli ise key olmadan tekrar dene; en azından kamu sorgusu çalışsın.
      const status = axios.isAxiosError(firstError) ? firstError.response?.status : undefined;
      const shouldRetryWithoutKey = Boolean(apiKey) && (status === 400 || status === 401 || status === 403);
      if (!shouldRetryWithoutKey) throw firstError;

      const fallbackResponse = await axios.get<GoogleBooksResponse>(baseUrl, {
        timeout: 8000,
        params: { q: `isbn:${cleanIsbn}` },
      });
      data = fallbackResponse.data;
    }

    if (!data.totalItems || !data.items?.length) {
      throw new Error(`ISBN ${cleanIsbn} için Google Books'ta sonuç bulunamadı.`);
    }

    volumeInfo = data.items[0].volumeInfo;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const apiMessage =
        (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
      throw new Error(
        `Google Books API hatası${status ? ` (${status})` : ''}: ${apiMessage ?? error.message}`
      );
    }
    throw error;
  }

  // ── 2. Gelen veriyi parse et ────────────────────────────────────────────────
  const title = volumeInfo.title ?? 'Başlıksız';
  const description = volumeInfo.description ?? null;
  const publisher = volumeInfo.publisher ?? null;
  const publishedYear = parseYear(volumeInfo.publishedDate);
  const pageCount = volumeInfo.pageCount ?? null;
  const language = volumeInfo.language ?? null;

  // Thumbnail URL: HTTPS'e zorla (Google bazen HTTP döndürür)
  const coverImage = volumeInfo.imageLinks?.thumbnail
    ? volumeInfo.imageLinks.thumbnail.replace('http://', 'https://')
    : null;

  const authorNames: string[] = volumeInfo.authors ?? ['Bilinmeyen Yazar'];
  const categoryNames: string[] = volumeInfo.categories ?? [];

  // ── 3. Yazarları upsert et ──────────────────────────────────────────────────
  const authorRecords = await Promise.all(
    authorNames.map((name) =>
      prisma.author.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // ── 4. Kategorileri upsert et ───────────────────────────────────────────────
  const categoryRecords = await Promise.all(
    categoryNames.map((name) => {
      const slug = toSlug(name);
      return prisma.category.upsert({
        where: { name },
        update: {},
        create: { name, slug },
      });
    })
  );

  // ── 5. Kitabı upsert et ─────────────────────────────────────────────────────
  //    • ISBN zaten varsa: meta verileri güncelle, stok/kopya sayısı DEĞİŞMEZ
  //    • ISBN yoksa: yeni kayıt oluştur (verilen stok değeriyle)
  const existingBook = await prisma.book.findUnique({ where: { isbn: cleanIsbn } });

  const savedBook = await prisma.book.upsert({
    where: { isbn: cleanIsbn },
    create: {
      isbn: cleanIsbn,
      title,
      description,
      publisher,
      publishedYear,
      pageCount,
      language,
      coverImage,
      stock: normalizedStock,
      totalCopies: normalizedStock,
      authors: { connect: authorRecords.map((a) => ({ id: a.id })) },
      categories: { connect: categoryRecords.map((c) => ({ id: c.id })) },
    },
    update: {
      // Stok gönderilmediyse korunur; gönderildiyse yeni değere set edilir.
      title,
      description,
      publisher,
      publishedYear,
      pageCount,
      language,
      coverImage,
      ...(hasStockOverride ? { stock: normalizedStock, totalCopies: normalizedStock } : {}),
      // Yazar ve kategorileri sıfırla ve yeniden bağla
      authors: {
        set: existingBook ? [] : undefined,
        connect: authorRecords.map((a) => ({ id: a.id })),
      },
      categories: {
        set: existingBook ? [] : undefined,
        connect: categoryRecords.map((c) => ({ id: c.id })),
      },
    },
    include: {
      authors: true,
      categories: true,
    },
  });

  console.log(
    `📚 ISBN ${cleanIsbn} ${existingBook ? 'güncellendi' : 'yeni olarak eklendi'}: "${title}"`
  );

  return savedBook as SavedBook;
};
