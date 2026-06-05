import { Request, Response } from 'express';
import * as bookService from './book.service';
import { fetchBookByIsbn } from './isbn.service';

export const getAllBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, page = '1', limit = '15' } = req.query;
    const books = await bookService.getAllBooks({
      search: search as string,
      category: category as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
    res.status(200).json(books);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kitaplar yüklenirken hata oluştu.';
    console.error('❌ getAllBooks error:', message);
    res.status(500).json({ message });
  }
};

export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await bookService.getBookById(req.params.id);
    if (!book) { res.status(404).json({ message: 'Kitap bulunamadı.' }); return; }
    res.status(200).json(book);
  } catch {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

export const searchBookByIsbn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isbn, stock } = req.body;
    if (!isbn) { res.status(400).json({ message: 'ISBN zorunludur.' }); return; }
    const parsedStock = Number(stock);
    const safeStock =
      Number.isFinite(parsedStock) && parsedStock >= 1 ? Math.floor(parsedStock) : undefined;

    const book = await fetchBookByIsbn(isbn, safeStock);
    res.status(200).json(book);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ISBN sorgulaması başarısız.';
    res.status(502).json({ message });
  }
};

export const createBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await bookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kitap eklenemedi.';
    res.status(400).json({ message });
  }
};

export const importBooksFromCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rows, stock } = req.body as { rows?: unknown[]; stock?: number };
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ message: 'CSV satırları boş olamaz.' });
      return;
    }

    const result = await bookService.importBooksFromCsvRows(rows as any[], Number(stock ?? 1));
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'CSV içe aktarma başarısız.';
    res.status(400).json({ message });
  }
};

export const updateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await bookService.updateBook(req.params.id, req.body);
    res.status(200).json(book);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kitap güncellenemedi.';
    res.status(400).json({ message });
  }
};

export const deleteBook = async (req: Request, res: Response): Promise<void> => {
  try {
    await bookService.deleteBook(req.params.id);
    res.status(200).json({ message: 'Kitap silindi.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Kitap silinemedi.';
    res.status(400).json({ message });
  }
};
