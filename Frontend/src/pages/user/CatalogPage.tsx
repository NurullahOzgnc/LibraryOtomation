import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Tag,
  Typography,
  Spin,
  Empty,
  Button,
  Badge,
  Pagination,
  Modal,
  Descriptions,
  message,
  Tooltip,
  Image,
} from 'antd';
import {
  SearchOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import type { Book } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// ─── Kitap Kartı ─────────────────────────────────────────────────────────────
const BookCard: React.FC<{ book: Book; onBorrow: (book: Book) => void }> = ({ book, onBorrow }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const isOutOfStock = book.stock === 0;

  return (
    <>
      <Card
        hoverable={!isOutOfStock}
        cover={
          <div
            style={{
              height: 200,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #e6f4ff, #bae0ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={book.title}
                style={{ height: 200, width: '100%', objectFit: 'cover' }}
                preview={false}
              />
            ) : (
              <BookOutlined style={{ fontSize: 56, color: '#91caff' }} />
            )}
            {/* Stok badge */}
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <Badge
                count={isOutOfStock ? 'Stokta Yok' : `${book.stock} adet`}
                style={{
                  backgroundColor: isOutOfStock ? '#ff4d4f' : '#52c41a',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
        }
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          opacity: isOutOfStock ? 0.7 : 1,
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: '14px 16px' } }}
        onMouseEnter={(e) => {
          if (!isOutOfStock) {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }}
      >
        {/* Başlık */}
        <Tooltip title={book.title}>
          <Text
            strong
            style={{
              fontSize: 14,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              height: 40,
            }}
          >
            {book.title}
          </Text>
        </Tooltip>

        {/* Yazarlar */}
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
          {book.authors.map((a) => a.name).join(', ')}
        </Text>

        {/* Kategoriler */}
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {book.categories.slice(0, 2).map((c) => (
            <Tag key={c.id} color="blue" style={{ fontSize: 10, margin: 0 }}>
              {c.name}
            </Tag>
          ))}
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => setDetailOpen(true)}
            style={{ flex: 1 }}
          >
            Detay
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<ShoppingCartOutlined />}
            disabled={isOutOfStock || !isAuthenticated}
            onClick={() => onBorrow(book)}
            style={{ flex: 1 }}
          >
            {isOutOfStock ? 'Stokta Yok' : 'Ödünç Al'}
          </Button>
        </div>
      </Card>

      {/* ─── Detay Modal ──────────────────────────────────────────── */}
      <Modal
        title={book.title}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Kapat
          </Button>,
          <Button
            key="borrow"
            type="primary"
            disabled={isOutOfStock || !isAuthenticated}
            onClick={() => { setDetailOpen(false); onBorrow(book); }}
          >
            Ödünç Al
          </Button>,
        ]}
        width={560}
      >
        <Row gutter={16}>
          {book.coverImage && (
            <Col span={8}>
              <Image src={book.coverImage} style={{ borderRadius: 8, width: '100%' }} preview={false} />
            </Col>
          )}
          <Col span={book.coverImage ? 16 : 24}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Yazar">
                {book.authors.map((a) => a.name).join(', ')}
              </Descriptions.Item>
              <Descriptions.Item label="Yayınevi">{book.publisher ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Yıl">{book.publishedYear ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Sayfa">{book.pageCount ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="ISBN">{book.isbn}</Descriptions.Item>
              <Descriptions.Item label="Stok">{book.stock} adet</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
        {book.description && (
          <Paragraph
            type="secondary"
            style={{ marginTop: 16, fontSize: 13, maxHeight: 150, overflow: 'auto' }}
          >
            {book.description}
          </Paragraph>
        )}
      </Modal>
    </>
  );
};

// ─── Ödünç Alma Onay Modal ────────────────────────────────────────────────────
const BorrowModal: React.FC<{
  book: Book | null;
  open: boolean;
  onClose: () => void;
}> = ({ book, open, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleBorrow = async () => {
    if (!book) return;
    setLoading(true);
    try {
      await axiosInstance.post('/loans', { bookId: book.id, dueDays: 14 });
      message.success(`"${book.title}" 14 günlüğüne ödünç alındı!`);
      onClose();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ödünç alınamadı.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Kitabı Ödünç Al"
      open={open}
      onCancel={onClose}
      onOk={handleBorrow}
      okText="Onayla"
      cancelText="Vazgeç"
      confirmLoading={loading}
    >
      {book && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {book.coverImage && (
            <Image src={book.coverImage} width={80} preview={false} style={{ borderRadius: 8, marginBottom: 12 }} />
          )}
          <Title level={5}>{book.title}</Title>
          <Text type="secondary">{book.authors.map((a) => a.name).join(', ')}</Text>
          <br /><br />
          <Text>
            Bu kitabı <Text strong>14 gün</Text> süreyle ödünç almak istediğinize emin misiniz?
          </Text>
          <br />
          <Text type="danger" style={{ fontSize: 12 }}>
            Süre aşımında günlük ₺2 ceza uygulanır.
          </Text>
        </div>
      )}
    </Modal>
  );
};

// ─── Ana Bileşen ───────────────────────────────────────────────────────────────
const CatalogPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [borrowBook, setBorrowBook] = useState<Book | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/books', {
        params: {
          page,
          limit: 12,
          search: search || undefined,
          category: selectedCategory || undefined,
        },
      });
      setBooks(data.books ?? data);
      setTotal(data.total ?? data.length);

      // Kategorileri topla
      const cats = new Set<string>();
      (data.books ?? data).forEach((b: Book) => b.categories.forEach((c) => cats.add(c.name)));
      setCategories((prev) => [...new Set([...prev, ...cats])]);
    } catch {
      message.error('Kitaplar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  return (
    <div>
      {/* Başlık */}
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0 }}>
          📚 Kitap Kataloğu
        </Title>
        <Text type="secondary">{total} kitap mevcut</Text>
      </div>

      {/* Filtreler */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }} align="middle">
        <Col xs={24} sm={12} md={14}>
          <Search
            placeholder="Kitap adı, ISBN veya yazar ara..."
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            onSearch={(val) => { setSearch(val); setPage(1); }}
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Select
            placeholder={<><FilterOutlined /> Kategori</>}
            allowClear
            size="large"
            style={{ width: '100%' }}
            onChange={(val) => { setSelectedCategory(val ?? ''); setPage(1); }}
          >
            {categories.map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={4} md={4}>
          <Button
            size="large"
            onClick={() => { setSearch(''); setSelectedCategory(''); setPage(1); }}
          >
            Sıfırla
          </Button>
        </Col>
      </Row>

      {/* Kitap Grid'i */}
      <Spin spinning={loading}>
        {books.length === 0 && !loading ? (
          <Empty description="Kitap bulunamadı." style={{ marginTop: 80 }} />
        ) : (
          <Row gutter={[16, 20]}>
            {books.map((book) => (
              <Col key={book.id} xs={12} sm={8} md={6} lg={4}>
                <BookCard book={book} onBorrow={setBorrowBook} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* Sayfalama */}
      {total > 12 && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Pagination
            current={page}
            total={total}
            pageSize={12}
            onChange={setPage}
            showTotal={(tot) => `Toplam ${tot} kitap`}
          />
        </div>
      )}

      {/* Ödünç Modal */}
      <BorrowModal
        book={borrowBook}
        open={!!borrowBook}
        onClose={() => setBorrowBook(null)}
      />
    </div>
  );
};

export default CatalogPage;
