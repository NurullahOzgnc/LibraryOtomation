import { Request, Response } from 'express';
import { JwtPayload } from '../../middlewares/auth.middleware';
import * as deviceService from './device.service';

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20', status } = req.query;
    const devices = await deviceService.getDevices({
      search: search as string,
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });
    res.status(200).json(devices);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cihazlar yüklenemedi.';
    res.status(500).json({ message });
  }
};

export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const device = await deviceService.getDeviceById(req.params.id);
    if (!device) {
      res.status(404).json({ message: 'Cihaz bulunamadı.' });
      return;
    }
    res.status(200).json(device);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cihaz yüklenirken hata oluştu.';
    res.status(500).json({ message });
  }
};

export const createDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, location, totalQuantity } = req.body;
    if (!name || !totalQuantity) {
      res.status(400).json({ message: 'Cihaz adı ve adet bilgisi gerekli.' });
      return;
    }
    const device = await deviceService.createDevice({
      name,
      description,
      location,
      totalQuantity: Number(totalQuantity),
    });
    res.status(201).json(device);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cihaz oluşturulamadı.';
    res.status(400).json({ message });
  }
};

export const updateDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, location, totalQuantity, status, brokenCount } = req.body;
    const device = await deviceService.updateDevice(req.params.id, {
      name,
      description,
      location,
      totalQuantity: totalQuantity !== undefined ? Number(totalQuantity) : undefined,
      status,
      brokenCount: brokenCount !== undefined ? Number(brokenCount) : undefined,
    });
    res.status(200).json(device);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cihaz güncellenemedi.';
    res.status(400).json({ message });
  }
};

export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    await deviceService.deleteDevice(req.params.id);
    res.status(200).json({ message: 'Cihaz silindi.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Cihaz silinemedi.';
    res.status(400).json({ message });
  }
};

export const reserveDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startAt, endAt, notes } = req.body;
    if (!startAt || !endAt) {
      res.status(400).json({ message: 'Rezervasyon başlangıç ve bitiş tarihi gerekli.' });
      return;
    }
    const authUser = req.user as JwtPayload;
    const reservation = await deviceService.reserveDevice(
      authUser.userId,
      req.params.id,
      new Date(startAt),
      new Date(endAt),
      notes,
    );

    res.status(201).json(reservation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Rezervasyon yapılamadı.';
    res.status(400).json({ message });
  }
};

export const getMyReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.user as JwtPayload;
    const reservations = await deviceService.getReservations(authUser.userId);
    res.status(200).json(reservations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Rezervasyonlar yüklenemedi.';
    res.status(500).json({ message });
  }
};

export const getReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservations = await deviceService.getReservations();
    res.status(200).json(reservations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Rezervasyonlar yüklenemedi.';
    res.status(500).json({ message });
  }
};

export const cancelReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await deviceService.getReservationById(req.params.id);
    if (!reservation) {
      res.status(404).json({ message: 'Rezervasyon bulunamadı.' });
      return;
    }

    const authUser = req.user as JwtPayload;
    if (authUser.role !== 'ADMIN' && reservation.userId !== authUser.userId) {
      res.status(403).json({ message: 'Bu rezervasyonu iptal etme yetkiniz yok.' });
      return;
    }

    await deviceService.cancelReservation(req.params.id);
    res.status(200).json({ message: 'Rezervasyon iptal edildi.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Rezervasyon iptal edilemedi.';
    res.status(400).json({ message });
  }
};

export const completeReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservation = await deviceService.completeReservation(req.params.id);
    res.status(200).json(reservation);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Rezervasyon tamamlanamadı.';
    res.status(400).json({ message });
  }
};

export const getDeviceUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const sinceDate = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const usageLogs = await deviceService.getDeviceUsageLogs(req.params.id, sinceDate);
    res.status(200).json(usageLogs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kullanım geçmişi yüklenemedi.';
    res.status(500).json({ message });
  }
};
