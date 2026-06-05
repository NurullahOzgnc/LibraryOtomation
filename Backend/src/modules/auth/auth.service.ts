import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async ({ name, email, password }: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Bu e-posta adresi zaten kayıtlı.');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: 'USER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { user, token };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('E-posta veya şifre hatalı.');
  }

  // Ban kontrolü
  if (user.isBanned) {
    throw new Error(`Hesabınız yasaklanmıştır. Neden: ${user.banReason || 'Belirtilmedi'}`);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('E-posta veya şifre hatalı.');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  const { password: _pwd, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      transactions: {
        select: {
          id: true,
          borrowedAt: true,
          dueDate: true,
          returnedAt: true,
          status: true,
          fineAmount: true,
          book: { select: { id: true, title: true, isbn: true, coverImage: true } },
        },
        orderBy: { borrowedAt: 'desc' },
        take: 20,
      },
    },
  });
};
