import prisma from '../../config/prisma';

interface GetAllLoansParams {
  status?: string;
  overdue?: boolean;
  page: number;
  limit: number;
}

interface CreateLoanInput {
  userId: string;
  bookId: string;
  dueDays: number;
}

const FINE_PER_DAY = 2; // TL ceza/gün

export const getAllLoans = async ({ status, overdue, page, limit }: GetAllLoansParams) => {
  const skip = (page - 1) * limit;
  const now = new Date();

  const where = {
    ...(status ? { status } : {}),
    ...(overdue ? { dueDate: { lt: now }, returnedAt: null } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, isbn: true, coverImage: true } },
      },
      orderBy: { borrowedAt: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  // Her kayda gecikme süresini ve hesaplanan cezayı ekle
  const enriched = transactions.map((t) => {
    const isOverdue = !t.returnedAt && t.dueDate < now;
    const overdueDays = isOverdue
      ? Math.floor((now.getTime() - t.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return { ...t, isOverdue, overdueDays, calculatedFine: overdueDays * FINE_PER_DAY };
  });

  return { transactions: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getLoanById = async (id: string) => {
  return prisma.transaction.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      book: true,
    },
  });
};

export const createLoan = async ({ userId, bookId, dueDays }: CreateLoanInput) => {
  // Stok kontrolü
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error('Kitap bulunamadı.');
  if (book.stock <= 0) throw new Error('Bu kitap şu an stokta yok.');

  // Aktif ödünç kopyası var mı?
  const activeForUser = await prisma.transaction.findFirst({
    where: { userId, bookId, status: 'ACTIVE' },
  });
  if (activeForUser) throw new Error('Bu kitabı zaten ödünç almışsınız.');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: { userId, bookId, dueDate, status: 'ACTIVE' },
      include: { book: true, user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.book.update({ where: { id: bookId }, data: { stock: { decrement: 1 } } }),
  ]);

  return transaction;
};

export const returnBook = async (id: string) => {
  const loan = await prisma.transaction.findUnique({ where: { id } });
  if (!loan) throw new Error('İşlem bulunamadı.');
  if (loan.returnedAt) throw new Error('Bu kitap zaten iade edilmiş.');

  const now = new Date();
  const isOverdue = now > loan.dueDate;
  const overdueDays = isOverdue
    ? Math.floor((now.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const fineAmount = overdueDays * FINE_PER_DAY;

  const [updated] = await prisma.$transaction([
    prisma.transaction.update({
      where: { id },
      data: { returnedAt: now, status: 'RETURNED', fineAmount },
      include: { book: true, user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.book.update({ where: { id: loan.bookId }, data: { stock: { increment: 1 } } }),
  ]);

  return updated;
};
