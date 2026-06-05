import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Card,
  Tooltip,
  Badge,
  Image,
  Row,
  Col,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  BookOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/api/axiosInstance';
import type { Book } from '@/types';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;

interface CsvBookRow {
  isbn13?: string;
  isbn10?: string;
  isbn?: string;
  title?: string;
  subtitle?: string;
  authors?: string;
  categories?: string;
  thumbnail?: string;
  description?: string;
  published_year?: string;
  num_pages?: string;
  language?: string;
  publisher?: string;
}

const parseCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const detectDelimiter = (lines: string[]): string => {
  const delimiters = [',', ';'];

  const delimiterStats = delimiters.map((delimiter) => {
    const counts = lines.slice(0, 5).map((line) => parseCsvLine(line, delimiter).length);
    const uniqueCounts = Array.from(new Set(counts));
    return {
      delimiter,
      consistent: uniqueCounts.length === 1,
      count: counts[0] ?? 0,
      variation: uniqueCounts.length,
    };
  });

  const consistentCandidates = delimiterStats.filter((stat) => stat.consistent && stat.count > 1);
  if (consistentCandidates.length > 0) {
    return consistentCandidates.sort((a, b) => b.count - a.count)[0].delimiter;
  }

  return delimiterStats.sort((a, b) => b.count - a.count)[0].delimiter;
};

const parseCsvRows = (csvText: string): CsvBookRow[] => {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines);
  const headers = parseCsvLine(lines[0], delimiter).map((h) => h.trim().toLowerCase());
  const rows: CsvBookRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row as CsvBookRow);
  }

  return rows;
};

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

// ─── ISBN ile yeni kitap eklemek için modal ────────────────────────────────────
const IsbnLookupModal: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previewBook, setPreviewBook] = useState<Book | null>(null);

  const handleIsbnSearch = async () => {
    const { isbn } = form.getFieldsValue();
    if (!isbn) { message.warning('Lütfen ISBN girin.'); return; }
    setLoading(true);
    try {
      const { data } = await axiosInstance.post<Book>('/books/isbn-lookup', { isbn });
      setPreviewBook(data);
      message.success(`"${data.title}" bulundu!`);
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : null;
      message.error(apiMessage ?? 'Bu ISBN için kitap bulunamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewBook) return;
    setLoading(true);
    try {
      await axiosInstance.post('/books/isbn-lookup', {
        isbn: previewBook.isbn,
        stock: form.getFieldValue('stock') ?? 1,
      });
      message.success('Kitap başarıyla eklendi!');
      onSuccess();
      onClose();
      form.resetFields();
      setPreviewBook(null);
    } catch {
      message.error('Kitap eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span><BarcodeOutlined /> ISBN ile Kitap Ekle</span>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Row gutter={8}>
          <Col flex="auto">
            <Form.Item name="isbn" label="ISBN Numarası">
              <Input placeholder="978-3-16-148410-0" size="large" />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item label=" ">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleIsbnSearch}
                loading={loading}
                size="large"
              >
                Sorgula
              </Button>
            </Form.Item>
          </Col>
        </Row>

        {previewBook && (
          <Card
            size="small"
            style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}
          >
            <Row gutter={12} align="middle">
              {previewBook.coverImage && (
                <Col>
                  <Image src={previewBook.coverImage} width={60} preview={false} />
                </Col>
              )}
              <Col flex="auto">
                <Text strong>{previewBook.title}</Text>
                <br />
                <Text type="secondary">{previewBook.authors.map((a) => a.name).join(', ')}</Text>
                <br />
                <Text type="secondary">{previewBook.publisher ?? ''}</Text>
              </Col>
            </Row>

            <Form.Item name="stock" label="Stok Adedi" style={{ marginTop: 12, marginBottom: 0 }}>
              <InputNumber min={1} max={999} defaultValue={1} style={{ width: 120 }} />
            </Form.Item>
          </Card>
        )}

        {previewBook && (
          <Button type="primary" block size="large" onClick={handleSave} loading={loading}>
            Veritabanına Kaydet
          </Button>
        )}
      </Form>
    </Modal>
  );
};

const CsvImportModal: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvBookRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [stock, setStock] = useState<number>(1);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [importTotals, setImportTotals] = useState({ created: 0, updated: 0, skipped: 0 });
  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [activeController, setActiveController] = useState<AbortController | null>(null);
  const cancelRequestedRef = useRef(false);

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      message.warning('Lütfen .csv uzantılı dosya seçin.');
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      if (rows.length === 0) {
        message.warning('CSV içinde işlenecek satır bulunamadı.');
        return;
      }
      setCsvRows(rows);
      setFileName(file.name);
      setCurrentBatch(0);
      setTotalBatches(0);
      setImportTotals({ created: 0, updated: 0, skipped: 0 });
      setImportStatus('idle');
      message.success(`${rows.length} satır hazırlandı.`);
    } catch {
      message.error('CSV dosyası okunamadı.');
    }
  };

  const handleImport = async () => {
    if (!csvRows.length) {
      message.warning('Önce CSV dosyası seçin.');
      return;
    }

    setLoading(true);
    try {
      const batches = chunkArray(csvRows, Number(batchSize) || 300);
      const totals = { created: 0, updated: 0, skipped: 0 };
      setImportStatus('running');
      setTotalBatches(batches.length);
      setCurrentBatch(0);
      setImportTotals(totals);
      cancelRequestedRef.current = false;

      for (let i = 0; i < batches.length; i += 1) {
        if (cancelRequestedRef.current) {
          setImportStatus('idle');
          message.warning(`İçe aktarma iptal edildi (${i}/${batches.length} batch işlendi).`);
          break;
        }

        const controller = new AbortController();
        setActiveController(controller);
        const { data } = await axiosInstance.post('/books/import-csv', {
          rows: batches[i],
          stock,
        }, { timeout: 120000, signal: controller.signal });
        totals.created += data.created ?? 0;
        totals.updated += data.updated ?? 0;
        totals.skipped += data.skipped ?? 0;
        setImportTotals({ ...totals });
        setCurrentBatch(i + 1);
        setActiveController(null);
      }

      if (!cancelRequestedRef.current) {
        setImportStatus('success');
        message.success(
          `İşlem tamamlandı: ${totals.created} yeni, ${totals.updated} güncellendi, ${totals.skipped} atlandı.`
        );
        onSuccess();
        onClose();
        setCsvRows([]);
        setFileName('');
        setStock(1);
        setBatchSize(300);
      }
    } catch (error: unknown) {
      const isAbort = axios.isAxiosError(error) && error.code === 'ERR_CANCELED';
      if (isAbort || cancelRequestedRef.current) {
        setImportStatus('idle');
        message.warning(`İçe aktarma iptal edildi (${currentBatch}/${totalBatches} batch işlendi).`);
        return;
      }
      setImportStatus('error');
      const apiMessage = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : error instanceof Error
          ? error.message
          : 'CSV içe aktarma sırasında hata oluştu.';
      message.error(apiMessage);
    } finally {
      setActiveController(null);
      setLoading(false);
    }
  };

  const handleCancelImport = () => {
    cancelRequestedRef.current = true;
    activeController?.abort();
  };

  return (
    <Modal
      title={<span><UploadOutlined /> CSV ile Toplu Kitap Ekle</span>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            void handleFileChange(e.target.files?.[0]);
          }}
        />
        <Form layout="vertical">
          <Form.Item label="Tüm kayıtlar için stok adedi">
            <InputNumber min={1} max={999} value={stock} onChange={(v) => setStock(Number(v ?? 1))} />
          </Form.Item>
          <Form.Item label="Parça boyutu (batch)">
            <InputNumber
              min={50}
              max={2000}
              value={batchSize}
              onChange={(v) => setBatchSize(Number(v ?? 300))}
            />
          </Form.Item>
        </Form>
        <Text type="secondary">
          Beklenen kolonlar: `isbn13`, `isbn10`, `title`, `subtitle`, `authors`, `categories`,
          `thumbnail`, `description`, `published_year`, `num_pages`.
        </Text>
        <Text type="secondary">
          Ayrıca hem virgül hem de noktalı virgül (`;`) ayraçlı CSV formatlarını destekler.
        </Text>
        <Text type="secondary">
          Alternatif olarak şu başlıklar da desteklenir: `book_title`, `book_publisher`,
          `book_author`, `book_category_name`, `book_productcode`, `book_page_count`,
          `book_released_year`, `book_detail`.
        </Text>
        {fileName ? <Text strong>Seçilen dosya: {fileName} ({csvRows.length} satır)</Text> : null}
        {totalBatches > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }} size={6}>
            <Text>
              Durum:{' '}
              {importStatus === 'running'
                ? `İçe aktarılıyor (${currentBatch}/${totalBatches} batch)`
                : importStatus === 'success'
                  ? `Tamamlandı (${currentBatch}/${totalBatches} batch)`
                  : importStatus === 'error'
                    ? `Hata oluştu (${currentBatch}/${totalBatches} batch işlendi)`
                    : 'Hazır'}
            </Text>
            <Progress
              percent={Math.round((currentBatch / totalBatches) * 100)}
              status={importStatus === 'error' ? 'exception' : undefined}
            />
            <Text type="secondary">
              Toplam: {importTotals.created} yeni, {importTotals.updated} güncellendi, {importTotals.skipped} atlandı
            </Text>
          </Space>
        ) : null}
        <Space>
          <Button type="primary" icon={<UploadOutlined />} onClick={handleImport} loading={loading}>
            CSV'yi İçe Aktar
          </Button>
          <Button danger onClick={handleCancelImport} disabled={!loading}>
            İçe Aktarmayı İptal Et
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};

// ─── Edit Modal ─────────────────────────────────────────────────────────────
const EditBookModal: React.FC<{
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, book, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      form.setFieldsValue({
        title: book.title,
        description: book.description || '',
        publisher: book.publisher || '',
        publishedYear: book.publishedYear || undefined,
        pageCount: book.pageCount || undefined,
        language: book.language || '',
        coverImage: book.coverImage || '',
        stock: book.stock,
        authorNames: book.authors.map((a) => a.name).join(', '),
        categoryNames: book.categories.map((c) => c.name).join(', '),
      });
    }
  }, [book, form]);

  const handleSave = async () => {
    if (!book) {
      message.error('Kitap bilgisi yüklenemedi.');
      return Promise.reject();
    }

    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Yazarları ve kategorileri string'den array'a çevir
      const authorNames = (values.authorNames || '')
        .split(',')
        .map((a: string) => a.trim())
        .filter(Boolean);
      
      const categoryNames = (values.categoryNames || '')
        .split(',')
        .map((c: string) => c.trim())
        .filter(Boolean);

      // Payload oluştur - yalnızca değişen alanları gönder
      const payload: any = {
        title: values.title,
        stock: values.stock,
      };

      // Optional alanları ekle (empty string yerine undefined gönder)
      if (values.description) payload.description = values.description;
      if (values.publisher) payload.publisher = values.publisher;
      if (values.publishedYear) payload.publishedYear = values.publishedYear;
      if (values.pageCount) payload.pageCount = values.pageCount;
      if (values.language) payload.language = values.language;
      if (values.coverImage) payload.coverImage = values.coverImage;
      if (authorNames.length > 0) payload.authorNames = authorNames;
      if (categoryNames.length > 0) payload.categoryNames = categoryNames;

      console.log('📤 Gönderilen payload:', payload);
      console.log('📤 Kitap ID:', book.id);
      
      const { data } = await axiosInstance.put(`/books/${book.id}`, payload);
      console.log('📥 Update response:', data);
      
      message.success('Kitap başarıyla güncellendi!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('❌ Kitap güncelleme hatası:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        console.error('API Error Data:', errorData);
        const apiMessage = errorData?.message;
        message.error(apiMessage ?? `Hata: ${error.message}`);
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Kitap güncellenirken bilinmeyen bir hata oluştu.');
      }
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<span><EditOutlined /> Kitabı Düzenle</span>}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      width={700}
      confirmLoading={loading}
      okText="Kaydet"
      cancelText="İptal"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Kitap Adı"
          rules={[{ required: true, message: 'Kitap adı zorunludur.' }]}
        >
          <Input placeholder="Kitap başlığı" />
        </Form.Item>

        <Form.Item name="description" label="Açıklama">
          <Input.TextArea placeholder="Kitap açıklaması" rows={3} />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="publisher" label="Yayınevi">
              <Input placeholder="Yayınevi adı" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="publishedYear" label="Yayın Yılı">
              <InputNumber placeholder="YYYY" style={{ width: '100%' }} min={1000} max={2100} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="pageCount" label="Sayfa Sayısı">
              <InputNumber placeholder="Sayfa sayısı" style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="language" label="Dil">
              <Input placeholder="Türkçe, İngilizce vb." />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="coverImage" label="Kapak Resmi URL">
          <Input placeholder="https://example.com/image.jpg" type="url" />
        </Form.Item>

        <Form.Item
          name="stock"
          label="Mevcut Stok"
          rules={[{ required: true, message: 'Stok adedi zorunludur.' }]}
        >
          <InputNumber min={0} max={999} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="authorNames" label="Yazarlar (virgülle ayırın)">
          <Input placeholder="Yazar1, Yazar2, Yazar3" />
        </Form.Item>

        <Form.Item name="categoryNames" label="Kategoriler (virgülle ayırın)">
          <Input placeholder="Kategori1, Kategori2" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Ana Bileşen: Kitap Yönetimi Tablosu ─────────────────────────────────────
const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isbnModalOpen, setIsbnModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      console.log('📤 Kitap API çağrısı - Parametreler:', params);
      
      const { data } = await axiosInstance.get('/books', { params });
      console.log('📥 API Yanıtı:', data);
      
      // Backend { books, total, ... } döndürüyor
      const booksList = Array.isArray(data) ? data : (data.books ?? []);
      const totalCount = typeof data === 'object' && data.total ? data.total : booksList.length;
      
      console.log('📊 İşlenen Kitaplar:', booksList.length, 'Toplam:', totalCount);
      setBooks(booksList);
      setTotal(totalCount);
    } catch (error: any) {
      console.error('❌ Kitap yükleme hatası:', error);
      console.error('❌ Hata Detayı:', error.response?.data ?? error.message);
      const errMsg = error.response?.data?.message ?? 'Kitaplar yüklenirken hata oluştu.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/books/${id}`);
      message.success('Kitap silindi.');
      fetchBooks();
    } catch {
      message.error('Kitap silinemedi.');
    }
  };

  const columns: ColumnsType<Book> = [
    {
      title: 'Kapak',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 70,
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={44} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
        ) : (
          <div
            style={{
              width: 44,
              height: 60,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ExclamationCircleOutlined style={{ color: '#bbb' }} />
          </div>
        ),
    },
    {
      title: 'Kitap Adı',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (title: string, record) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.isbn}
          </Text>
        </div>
      ),
    },
    {
      title: 'Yazarlar',
      dataIndex: 'authors',
      key: 'authors',
      render: (authors: Book['authors']) => (
        <Space wrap>
          {authors.map((a) => (
            <Tag key={a.id} color="blue">
              {a.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Kategoriler',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories: Book['categories']) => (
        <Space wrap>
          {categories.map((c) => (
            <Tag key={c.id} color="green">
              {c.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Yayınevи / Yıl',
      key: 'publisher',
      render: (_, record) => (
        <Text type="secondary">
          {record.publisher ?? '—'}
          {record.publishedYear ? ` (${record.publishedYear})` : ''}
        </Text>
      ),
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 90,
      sorter: (a, b) => a.stock - b.stock,
      render: (stock: number) => (
        <Badge
          count={stock}
          showZero
          style={{
            backgroundColor: stock === 0 ? '#ff4d4f' : stock <= 2 ? '#fa8c16' : '#52c41a',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Düzenle">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedBook(record);
                setEditModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Popconfirm
              title="Bu kitabı silmek istediğinize emin misiniz?"
              onConfirm={() => handleDelete(record.id)}
              okText="Evet, Sil"
              cancelText="Vazgeç"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* ─── Sayfa Başlığı ve Araçlar ──────────────────────────── */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <BookOutlined style={{ marginRight: 10, color: '#1677ff' }} />
            Kitap Yönetimi
          </Title>
          <Text type="secondary">{total} kitap bulundu</Text>
        </Col>
        <Col>
          <Space>
            <Search
              placeholder="Kitap adı, ISBN veya yazar ara..."
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onSearch={(val) => { setSearch(val); setPage(1); }}
              style={{ width: 350 }}
            />
            <Button
              type="primary"
              icon={<BarcodeOutlined />}
              onClick={() => setIsbnModalOpen(true)}
            >
              ISBN ile Ekle
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => setCsvModalOpen(true)}>
              CSV İçe Aktar
            </Button>
            <Button icon={<PlusOutlined />}>Manuel Ekle</Button>
          </Space>
        </Col>
      </Row>

      {/* ─── Tablo ─────────────────────────────────────────────── */}
      <Table<Book>
        columns={columns}
        dataSource={books}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 15,
          onChange: (p) => setPage(p),
          showTotal: (tot) => `Toplam ${tot} kitap`,
          showSizeChanger: false,
        }}
        // 🔴 Geciken (stokta olmayan) satirlari kirmizi vurgula
        rowClassName={(record) => {
          if (record.stock === 0) return 'row-out-of-stock';
          return '';
        }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
        scroll={{ x: 900 }}
      />

      {/* ─── CSS: Stok 0 satır için kırmızı arka plan ──────────── */}
      <style>{`
        .row-out-of-stock { background-color: #fff1f0 !important; }
        .row-out-of-stock:hover > td { background-color: #ffe7e6 !important; }
      `}</style>

      {/* ─── ISBN Modal ─────────────────────────────────────────── */}
      <IsbnLookupModal
        open={isbnModalOpen}
        onClose={() => setIsbnModalOpen(false)}
        onSuccess={fetchBooks}
      />
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={fetchBooks}
      />
      <EditBookModal
        open={editModalOpen}
        book={selectedBook}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBook(null);
        }}
        onSuccess={fetchBooks}
      />
    </div>
  );
};

export default BooksPage;
