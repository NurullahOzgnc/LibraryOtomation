import prisma from '../../config/prisma';

interface GetAllUsersParams {
  search?: string;
  role?: 'ADMIN' | 'USER';
  page: number;
  limit: number;
}

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isBanned: true,
  banReason: true,
  bannedAt: true,
  termsAcceptedAt: true,
  createdAt: true,
  _count: { select: { transactions: true } },
} as const;

export const getAllUsers = async ({ search, role, page, limit }: GetAllUsersParams) => {
  const skip = (page - 1) * limit;
  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    } : {}),
    ...(role ? { role } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, select: USER_SELECT, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_SELECT,
      transactions: {
        include: { book: { select: { id: true, title: true, isbn: true, coverImage: true } } },
        orderBy: { borrowedAt: 'desc' },
      },
    },
  });
};

export const updateUser = async (
  id: string,
  data: { name?: string; phone?: string; role?: 'ADMIN' | 'USER' },
  requesterRole: 'ADMIN' | 'USER'
) => {
  // Sadece admin rol değiştirebilir
  if (data.role && requesterRole !== 'ADMIN') {
    throw new Error('Rol değiştirmek için yönetici yetkisi gerekli.');
  }

  return prisma.user.update({
    where: { id },
    data: { name: data.name, phone: data.phone, ...(data.role ? { role: data.role } : {}) },
    select: USER_SELECT,
  });
};

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};

// ─── Ban sistemi ─────────────────────────────────────────────────────
export const banUser = async (userId: string, reason: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      banReason: reason,
      bannedAt: new Date(),
    },
    select: USER_SELECT,
  });
};

export const unbanUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: false,
      banReason: null,
      bannedAt: null,
    },
    select: USER_SELECT,
  });
};

// ─── Terms & Policies acceptance ─────────────────────────────────────
export const acceptTerms = async (userId: string, ipAddress?: string, userAgent?: string) => {
  const [user, acceptance] = await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { termsAcceptedAt: new Date() },
      select: USER_SELECT,
    }),
    prisma.termsAcceptance.create({
      data: {
        userId,
        version: '1.0',
        ipAddress,
        userAgent,
      },
    }),
  ]);

  return { user, acceptance };
};

export const hasAcceptedTerms = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { termsAcceptedAt: true },
  });

  return !!user?.termsAcceptedAt;
};
