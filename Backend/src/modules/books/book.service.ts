import prisma from '../../config/prisma';

interface GetAllBooksParams {
  search?: string;
  category?: string;
  page: number;
  limit: number;
}

interface CreateBookInput {
  isbn: string;
  title: string;
  description?: string;
  publisher?: string;
  publishedYear?: number;
  pageCount?: number;
  language?: string;
  coverImage?: string;
  stock: number;
  authorNames: string[];
  categoryNames: string[];
}

interface CsvBookInput {
  isbn13?: string;
  isbn10?: string;
  isbn?: string;
  title?: string;
  subtitle?: string;
  authors?: string;
  categories?: string;
  thumbnail?: string;
  description?: string;
  published_year?: string | number;
  num_pages?: string | number;
  language?: string;
  publisher?: string;
  book_title?: string;
  book_publisher?: string;
  book_author?: string;
  book_category_name?: string;
  book_productcode?: string;
  book_page_count?: string | number;
  book_released_year?: string | number;
  book_detail?: string;
}

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const sanitizeIsbn = (value?: string): string =>
  (value ?? '').replace(/[^0-9Xx]/g, '').toUpperCase();

const splitValues = (value?: string): string[] =>
  (value ?? '')
    .split(/[;,|/]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const getFirstFilled = (...values: Array<string | number | undefined | null>): string => {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
};

export const getAllBooks = async ({ search, category, page, limit }: GetAllBooksParams) => {
  const skip = (page - 1) * limit;
  const normalizedSearch = search?.trim();
  const normalizedCategory = category?.trim();

  const where = {
    ...(normalizedSearch ? {
      OR: [
        { title: { contains: normalizedSearch } },
        { isbn: { contains: normalizedSearch } },
        { authors: { some: { name: { contains: normalizedSearch } } } },
      ],
    } : {}),
    ...(normalizedCategory
      ? {
          categories: {
            some: {
              OR: [
                { name: normalizedCategory },
                { name: { contains: normalizedCategory } },
                { slug: toSlug(normalizedCategory) },
              ],
            },
          },
        }
      : {}),
  };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: {
        authors: true,
        categories: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.book.count({ where }),
  ]);

  return { books, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getBookById = async (id: string) => {
  return prisma.book.findUnique({
    where: { id },
    include: { authors: true, categories: true },
  });
};

export const createBook = async (data: CreateBookInput) => {
  const { authorNames, categoryNames, ...bookData } = data;

  const authors = await Promise.all(
    authorNames.map((name) =>
      prisma.author.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name, slug: toSlug(name) } })
    )
  );

  return prisma.book.create({
    data: {
      ...bookData,
      authors: { connect: authors.map((a) => ({ id: a.id })) },
      categories: { connect: categories.map((c) => ({ id: c.id })) },
    },
    include: { authors: true, categories: true },
  });
};

export const updateBook = async (id: string, data: Partial<CreateBookInput>) => {
  const { authorNames, categoryNames, isbn, ...bookData } = data;

  // Yalnızca gönderilen alanları update et (undefined alanları görmezden gel)
  const updateData: any = {};
  
  if (bookData.title !== undefined) updateData.title = bookData.title;
  if (bookData.description !== undefined) updateData.description = bookData.description || null;
  if (bookData.publisher !== undefined) updateData.publisher = bookData.publisher || null;
  if (bookData.publishedYear !== undefined) updateData.publishedYear = bookData.publishedYear || null;
  if (bookData.pageCount !== undefined) updateData.pageCount = bookData.pageCount || null;
  if (bookData.language !== undefined) updateData.language = bookData.language || null;
  if (bookData.coverImage !== undefined) updateData.coverImage = bookData.coverImage || null;
  if (bookData.stock !== undefined) updateData.stock = bookData.stock;

  // Authors güncelle (eğer gönderildiyse)
  if (authorNames && authorNames.length > 0) {
    const authors = await Promise.all(
      authorNames.map((name) =>
        prisma.author.upsert({ where: { name }, update: {}, create: { name } })
      )
    );
    updateData.authors = {
      set: authors.map((a) => ({ id: a.id })),
    };
  }

  // Categories güncelle (eğer gönderildiyse)
  if (categoryNames && categoryNames.length > 0) {
    const categories = await Promise.all(
      categoryNames.map((name) =>
        prisma.category.upsert({ where: { name }, update: {}, create: { name, slug: toSlug(name) } })
      )
    );
    updateData.categories = {
      set: categories.map((c) => ({ id: c.id })),
    };
  }

  return prisma.book.update({
    where: { id },
    data: updateData,
    include: { authors: true, categories: true },
  });
};

export const deleteBook = async (id: string) => {
  // Önce kitap ile ilişkili tüm işlemleri sil
  await prisma.transaction.deleteMany({ where: { bookId: id } });
  // Sonra kitabı sil (ilişkili authors/categories otomatik silinir)
  return prisma.book.delete({ where: { id } });
};

export const importBooksFromCsvRows = async (rows: CsvBookInput[], stock = 1) => {
  const normalizedStock = Number.isFinite(stock) && stock >= 1 ? Math.floor(stock) : 1;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ row: number; reason: string }> = [];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 2; // header satırından dolayı

    try {
      const cleanIsbn =
        sanitizeIsbn(getFirstFilled(row.isbn13, row.isbn, row.book_productcode, row.isbn10));
      const title = [getFirstFilled(row.title, row.book_title), row.subtitle?.trim()]
        .filter(Boolean)
        .join(' - ');

      if (!cleanIsbn || cleanIsbn.length < 10) {
        skipped += 1;
        errors.push({ row: rowNumber, reason: 'Geçerli ISBN bulunamadı.' });
        continue;
      }

      if (!title) {
        skipped += 1;
        errors.push({ row: rowNumber, reason: 'Kitap başlığı boş.' });
        continue;
      }

      const authorNames = splitValues(getFirstFilled(row.authors, row.book_author));
      const categoryNames = splitValues(getFirstFilled(row.categories, row.book_category_name));

      const authorRecords = await Promise.all(
        (authorNames.length ? authorNames : ['Bilinmeyen Yazar']).map((name) =>
          prisma.author.upsert({
            where: { name },
            update: {},
            create: { name },
          })
        )
      );

      const categoryRecords = await Promise.all(
        categoryNames.map((name) =>
          prisma.category.upsert({
            where: { name },
            update: {},
            create: { name, slug: toSlug(name) || `kategori-${Date.now()}-${i}` },
          })
        )
      );

      const yearValue = Number.parseInt(
        getFirstFilled(row.published_year, row.book_released_year),
        10
      );
      const pageCountValue = Number.parseInt(
        getFirstFilled(row.num_pages, row.book_page_count),
        10
      );
      const descriptionValue = getFirstFilled(row.description, row.book_detail) || null;
      const publisherValue = getFirstFilled(row.publisher, row.book_publisher) || null;

      const existing = await prisma.book.findUnique({ where: { isbn: cleanIsbn } });
      await prisma.book.upsert({
        where: { isbn: cleanIsbn },
        create: {
          isbn: cleanIsbn,
          title,
          description: descriptionValue,
          publisher: publisherValue,
          publishedYear: Number.isNaN(yearValue) ? null : yearValue,
          pageCount: Number.isNaN(pageCountValue) ? null : pageCountValue,
          language: row.language?.trim() || null,
          coverImage: row.thumbnail?.trim() || null,
          stock: normalizedStock,
          totalCopies: normalizedStock,
          authors: { connect: authorRecords.map((a) => ({ id: a.id })) },
          categories: { connect: categoryRecords.map((c) => ({ id: c.id })) },
        },
        update: {
          title,
          description: descriptionValue,
          publisher: publisherValue,
          publishedYear: Number.isNaN(yearValue) ? null : yearValue,
          pageCount: Number.isNaN(pageCountValue) ? null : pageCountValue,
          language: row.language?.trim() || null,
          coverImage: row.thumbnail?.trim() || null,
          stock: normalizedStock,
          totalCopies: normalizedStock,
          authors: {
            set: [],
            connect: authorRecords.map((a) => ({ id: a.id })),
          },
          categories: {
            set: [],
            connect: categoryRecords.map((c) => ({ id: c.id })),
          },
        },
      });

      if (existing) updated += 1;
      else created += 1;
    } catch (error: unknown) {
      skipped += 1;
      const reason = error instanceof Error ? error.message : 'Bilinmeyen hata';
      errors.push({ row: rowNumber, reason });
    }
  }

  return { totalRows: rows.length, created, updated, skipped, errors: errors.slice(0, 20) };
};
