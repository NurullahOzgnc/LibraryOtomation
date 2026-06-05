// ─── Ortak TypeScript tipleri (Frontend) ─────────────────────────────────────

export type Role = 'ADMIN' | 'USER';
export type TransactionStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';

export interface Author {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Book {
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
  authors: Author[];
  categories: Category[];
  _count?: { transactions: number };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  isBanned?: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  termsAcceptedAt?: string | null;
  createdAt: string;
  _count?: { transactions: number };
}

export interface Device {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  totalQuantity: number;
  availableQuantity?: number;
  brokenCount?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceReservation {
  id: string;
  deviceId: string;
  userId: string;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  device?: Device;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface DeviceUsageLog {
  id: string;
  deviceId: string;
  userId: string;
  usedAt: string;
  durationMinutes?: number | null;
  action: string;
  notes?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Transaction {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: TransactionStatus;
  fineAmount: number;
  notes: string | null;
  // Enriched fields (backend tarafından hesaplanır)
  isOverdue?: boolean;
  overdueDays?: number;
  calculatedFine?: number;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  book?: Pick<Book, 'id' | 'title' | 'isbn' | 'coverImage'>;
}

// ─── API Dönüş Tipleri ────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ─── Auth Store State ─────────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
