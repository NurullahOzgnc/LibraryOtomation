import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './modules/auth/auth.router';
import bookRouter from './modules/books/book.router';
import deviceRouter from './modules/devices/device.router';
import loanRouter from './modules/loans/loan.router';
import userRouter from './modules/users/user.router';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '100mb';

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/books', bookRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/loans', loanRouter);
app.use('/api/users', userRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Uyarı: Bu backend dosyası her çalıştırıldığında PORT numarasına bağlanmaya çalışır.
// Eğer aynı anda birden fazla backend süreci açılırsa burada EADDRINUSE hatası oluşur.
// Bu nedenle development sırasında aynı terminalde yalnızca bir "npm run dev" çalıştırın.
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
