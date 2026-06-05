import prisma from '../../config/prisma';

interface GetDevicesParams {
  search?: string;
  page: number;
  limit: number;
  status?: string;
}

export const getDevices = async ({ search, page, limit, status }: GetDevicesParams) => {
  const skip = (page - 1) * limit;
  const where: any = {
    ...(search ? { OR: [{ name: { contains: search } }, { description: { contains: search } }, { location: { contains: search } }] } : {}),
    ...(status ? { status } : {}),
  };

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'PENDING'] } },
        },
      },
    }),
    prisma.device.count({ where }),
  ]);

  const items = devices.map((device) => ({
    ...device,
    availableQuantity: Math.max(
      device.totalQuantity - device.reservations.length - (device.brokenCount ?? 0),
      0
    ),
  }));

  return { devices: items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getDeviceById = async (id: string) => {
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      reservations: {
        orderBy: { startAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      usageLogs: {
        orderBy: { usedAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!device) return null;

  return {
    ...device,
    availableQuantity: Math.max(
      device.totalQuantity - device.reservations.filter((r) => ['CONFIRMED', 'PENDING'].includes(r.status)).length - (device.brokenCount ?? 0),
      0
    ),
  };
};

export const createDevice = async (data: {
  name: string;
  description?: string;
  location?: string;
  totalQuantity: number;
}) => {
  return prisma.device.create({
    data: {
      name: data.name,
      description: data.description,
      location: data.location,
      totalQuantity: data.totalQuantity,
    },
  });
};

export const updateDevice = async (id: string, data: {
  name?: string;
  description?: string;
  location?: string;
  totalQuantity?: number;
  status?: string;
  brokenCount?: number;
}) => {
  return prisma.device.update({
    where: { id },
    data: {
      ...data,
    },
  });
};

export const deleteDevice = async (id: string) => {
  return prisma.device.delete({ where: { id } });
};

export const reserveDevice = async (
  userId: string,
  deviceId: string,
  startAt: Date,
  endAt: Date,
  notes?: string
) => {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    throw new Error('Cihaz bulunamadı.');
  }

  if (endAt <= startAt) {
    throw new Error('Bitiş tarihi başlangıçtan sonra olmalıdır.');
  }

  const effectiveCapacity = Math.max(device.totalQuantity - (device.brokenCount ?? 0), 0);

  if (effectiveCapacity === 0) {
    throw new Error('Bu cihaz şu anda kullanılamıyor.');
  }

  const overlappingReservations = await prisma.deviceReservation.count({
    where: {
      deviceId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      OR: [
        {
          startAt: { lte: endAt },
          endAt: { gte: startAt },
        },
      ],
    },
  });

  if (overlappingReservations >= effectiveCapacity) {
    throw new Error('Bu cihaz için seçilen zaman aralığında rezervasyon yapılabilecek yer kalmadı.');
  }

  const reservation = await prisma.deviceReservation.create({
    data: {
      deviceId,
      userId,
      startAt,
      endAt,
      notes,
    },
  });

  await prisma.deviceUsageLog.create({
    data: {
      deviceId,
      userId,
      action: 'RESERVED',
      notes: notes ? `Rezervasyon: ${notes}` : 'Rezervasyon oluşturuldu.',
    },
  });

  return reservation;
};

export const getReservations = async (userId?: string) => {
  const where = userId ? { userId } : {};
  return prisma.deviceReservation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      device: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getReservationById = async (id: string) => {
  return prisma.deviceReservation.findUnique({
    where: { id },
    include: {
      device: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
};

export const cancelReservation = async (id: string) => {
  return prisma.deviceReservation.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
};

export const completeReservation = async (id: string) => {
  const reservation = await getReservationById(id);
  if (!reservation) {
    throw new Error('Rezervasyon bulunamadı.');
  }

  const completed = await prisma.deviceReservation.update({
    where: { id },
    data: { status: 'COMPLETED' },
  });

  await prisma.deviceUsageLog.create({
    data: {
      deviceId: completed.deviceId,
      userId: completed.userId,
      action: 'COMPLETED',
      notes: 'Rezervasyon tamamlandı.',
    },
  });

  return completed;
};

export const getDeviceUsageLogs = async (deviceId: string, since?: Date) => {
  return prisma.deviceUsageLog.findMany({
    where: {
      deviceId,
      ...(since ? { usedAt: { gte: since } } : {}),
    },
    orderBy: { usedAt: 'desc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};
