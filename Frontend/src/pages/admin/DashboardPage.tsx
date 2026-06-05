import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  Badge,
  DatePicker,
  Button,
  Spin,
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  HistoryOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axiosInstance from '@/api/axiosInstance';
import type { Transaction } from '@/types';

const { Title, Text } = Typography;

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  activeLoans: number;
  overdueLoans: number;
  totalTransactions: number;
  collectedFines: number;
}

const overdueColumns: ColumnsType<Transaction> = [
  {
    title: 'Kullanıcı',
    key: 'user',
    render: (_, r) => <Text strong>{r.user?.name ?? '—'}</Text>,
  },
  {
    title: 'Kitap',
    key: 'book',
    render: (_, r) => <Text>{r.book?.title ?? '—'}</Text>,
  },
  {
    title: 'Son İade Tarihi',
    dataIndex: 'dueDate',
    key: 'dueDate',
    render: (d: string) => (
      <Tag icon={<ClockCircleOutlined />} color="red">
        {dayjs(d).format('DD.MM.YYYY')}
      </Tag>
    ),
  },
  {
    title: 'Gecikme',
    key: 'overdueDays',
    render: (_, r) => (
      <Badge
        count={`${r.overdueDays ?? 0} gün`}
        style={{ backgroundColor: '#ff4d4f', fontSize: 12 }}
      />
    ),
  },
  {
    title: 'Ceza (₺)',
    dataIndex: 'calculatedFine',
    key: 'calculatedFine',
    render: (fine: number) => (
      <Text type="danger" strong>
        ₺{fine?.toFixed(2)}
      </Text>
    ),
  },
];

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overdueLoans, setOverdueLoans] = useState<Transaction[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOverdue, setLoadingOverdue] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Paralel istekler: kullanıcılar, aktif/geciken işlemler
        const [booksRes, usersRes, activeRes, overdueRes] = await Promise.all([
          axiosInstance.get('/books', { params: { limit: 1 } }),
          axiosInstance.get('/users', { params: { limit: 1 } }),
          axiosInstance.get('/loans', { params: { status: 'ACTIVE', limit: 1 } }),
          axiosInstance.get('/loans', { params: { overdue: true, limit: 1 } }),
        ]);

        setStats({
          totalBooks: booksRes.data.total ?? 0,
          totalUsers: usersRes.data.total ?? 0,
          activeLoans: activeRes.data.total ?? 0,
          overdueLoans: overdueRes.data.total ?? 0,
          totalTransactions: 0,
          collectedFines: 0,
        });
      } catch {
        // Hata yönetimi sessizce geçilebilir (demo amaçlı)
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchOverdue = async () => {
      try {
        const { data } = await axiosInstance.get('/loans', {
          params: { overdue: true, limit: 10 },
        });
        setOverdueLoans(data.transactions ?? []);
      } catch {
        //
      } finally {
        setLoadingOverdue(false);
      }
    };

    fetchStats();
    fetchOverdue();
  }, []);

  const statCards = [
    {
      title: 'Toplam Kitap',
      value: stats?.totalBooks ?? 0,
      icon: <BookOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
      color: '#e6f4ff',
      suffix: <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 14 }} />,
    },
    {
      title: 'Kayıtlı Kullanıcı',
      value: stats?.totalUsers ?? 0,
      icon: <UserOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      color: '#f9f0ff',
    },
    {
      title: 'Aktif Ödünç',
      value: stats?.activeLoans ?? 0,
      icon: <HistoryOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
      color: '#fff7e6',
    },
    {
      title: 'Geciken Kitap',
      value: stats?.overdueLoans ?? 0,
      icon: <WarningOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />,
      color: '#fff1f0',
      valueStyle: { color: '#ff4d4f' },
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            📊 Dashboard
          </Title>
          <Text type="secondary">Kütüphane genel durumu</Text>
        </Col>
        <Col>
          <Space>
            <DatePicker.RangePicker
              defaultValue={[dayjs().startOf('month'), dayjs()]}
              format="DD.MM.YYYY"
            />
            <Button type="primary">Filtrele</Button>
          </Space>
        </Col>
      </Row>

      {/* ─── İstatistik Kartları ──────────────────────────────────── */}
      <Spin spinning={loadingStats}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.title}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 12,
                  background: card.color,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <Statistic
                      title={
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {card.title}
                        </Text>
                      }
                      value={card.value}
                      valueStyle={{ fontWeight: 700, ...(card.valueStyle ?? {}) }}
                      suffix={card.suffix}
                    />
                  </Col>
                  <Col>{card.icon}</Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {/* ─── Geciken Kitaplar Tablosu ─────────────────────────────── */}
      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <Text strong>Geciken Kitaplar</Text>
            {overdueLoans.length > 0 && (
              <Badge count={overdueLoans.length} style={{ backgroundColor: '#ff4d4f' }} />
            )}
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table<Transaction>
          columns={overdueColumns}
          dataSource={overdueLoans}
          rowKey="id"
          loading={loadingOverdue}
          pagination={{ pageSize: 10 }}
          // 🔴 Geciken satırları kırmızı arka planla vurgula
          rowClassName={() => 'row-overdue'}
          locale={{ emptyText: '✅ Geciken kitap bulunmuyor.' }}
        />

        <style>{`
          .row-overdue { background-color: #fff1f0 !important; }
          .row-overdue:hover > td { background-color: #ffe7e6 !important; }
        `}</style>
      </Card>
    </div>
  );
};

export default DashboardPage;
