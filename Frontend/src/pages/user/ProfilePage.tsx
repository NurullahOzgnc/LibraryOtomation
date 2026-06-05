import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Typography,
  Avatar,
  Statistic,
  Spin,
  Badge,
  Descriptions,
  Button,
  message,
} from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import type { Transaction } from '@/types';

const { Title, Text } = Typography;

const statusConfig: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  ACTIVE: { color: 'blue', label: 'Aktif', icon: <BookOutlined /> },
  RETURNED: { color: 'green', label: 'İade Edildi', icon: <CheckCircleOutlined /> },
  OVERDUE: { color: 'red', label: 'Gecikmiş', icon: <WarningOutlined /> },
  CANCELLED: { color: 'default', label: 'İptal', icon: <ClockCircleOutlined /> },
};

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const { data } = await axiosInstance.get(`/users/${user.id}`);
        setTransactions(data.transactions ?? []);
      } catch {
        message.error('Profil bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  // İstatistikler
  const stats = {
    total: transactions.length,
    active: transactions.filter((t) => t.status === 'ACTIVE').length,
    returned: transactions.filter((t) => t.status === 'RETURNED').length,
    overdue: transactions.filter((t) => t.status === 'OVERDUE' || t.isOverdue).length,
    totalFine: transactions.reduce((sum, t) => sum + (t.fineAmount ?? 0), 0),
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Kitap',
      key: 'book',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {r.book?.coverImage ? (
            <img
              src={r.book.coverImage}
              alt=""
              style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }}
            />
          ) : (
            <div
              style={{
                width: 36, height: 48, borderRadius: 4,
                background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <BookOutlined style={{ color: '#91caff' }} />
            </div>
          )}
          <div>
            <Text strong style={{ fontSize: 13 }}>{r.book?.title ?? '—'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{r.book?.isbn}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Ödünç Tarihi',
      dataIndex: 'borrowedAt',
      key: 'borrowedAt',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY'),
      sorter: (a, b) => dayjs(a.borrowedAt).unix() - dayjs(b.borrowedAt).unix(),
    },
    {
      title: 'Son İade',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (d: string, r) => {
        const isLate = !r.returnedAt && dayjs(d).isBefore(dayjs());
        return (
          <Text type={isLate ? 'danger' : undefined}>
            {dayjs(d).format('DD.MM.YYYY')}
          </Text>
        );
      },
    },
    {
      title: 'İade Tarihi',
      dataIndex: 'returnedAt',
      key: 'returnedAt',
      render: (d: string | null) =>
        d ? dayjs(d).format('DD.MM.YYYY') : <Text type="secondary">—</Text>,
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Aktif', value: 'ACTIVE' },
        { text: 'İade Edildi', value: 'RETURNED' },
        { text: 'Gecikmiş', value: 'OVERDUE' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string, r) => {
        const cfg = statusConfig[status] ?? statusConfig.ACTIVE;
        const isOverdueActive = status === 'ACTIVE' && r.isOverdue;
        return (
          <Tag
            icon={isOverdueActive ? <WarningOutlined /> : cfg.icon}
            color={isOverdueActive ? 'red' : cfg.color}
          >
            {isOverdueActive ? 'Gecikmiş' : cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Ceza (₺)',
      dataIndex: 'fineAmount',
      key: 'fineAmount',
      render: (fine: number) =>
        fine > 0 ? (
          <Text type="danger" strong>₺{fine.toFixed(2)}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
      sorter: (a, b) => a.fineAmount - b.fineAmount,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div>
        <Title level={3} style={{ marginBottom: 24 }}>
          <UserOutlined style={{ marginRight: 10, color: '#1677ff' }} />
          Profilim
        </Title>

        <Row gutter={[24, 24]}>
          {/* ─── Kullanıcı Bilgileri ─────────────────────────────── */}
          <Col xs={24} md={8}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Avatar
                size={80}
                style={{ backgroundColor: '#1677ff', fontSize: 32, fontWeight: 700, marginBottom: 16 }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Title level={4} style={{ marginBottom: 4 }}>{user?.name}</Title>
              <Tag color={user?.role === 'ADMIN' ? 'red' : 'blue'}>{user?.role}</Tag>

              <Descriptions column={1} size="small" style={{ marginTop: 20, textAlign: 'left' }}>
                <Descriptions.Item label={<><MailOutlined /> E-posta</>}>
                  {user?.email}
                </Descriptions.Item>
                {user?.phone && (
                  <Descriptions.Item label={<><PhoneOutlined /> Telefon</>}>
                    {user.phone}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Üyelik">
                  {user?.createdAt ? dayjs(user.createdAt).format('DD.MM.YYYY') : '—'}
                </Descriptions.Item>
              </Descriptions>

              <Button type="default" block style={{ marginTop: 16 }}>
                Profili Düzenle
              </Button>
            </Card>
          </Col>

          {/* ─── İstatistik Kartları ─────────────────────────────── */}
          <Col xs={24} md={16}>
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              {[
                { title: 'Toplam İşlem', value: stats.total, color: '#e6f4ff' },
                { title: 'Aktif Ödünç', value: stats.active, color: '#fff7e6' },
                { title: 'İade Edildi', value: stats.returned, color: '#f6ffed' },
                { title: 'Geciken', value: stats.overdue, color: '#fff1f0', valueStyle: { color: '#ff4d4f' } },
              ].map((s) => (
                <Col span={12} key={s.title}>
                  <Card
                    size="small"
                    bordered={false}
                    style={{ borderRadius: 10, background: s.color }}
                  >
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: 12 }}>{s.title}</Text>}
                      value={s.value}
                      valueStyle={{ fontWeight: 700, ...(s.valueStyle ?? {}) }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Toplam ceza */}
            {stats.totalFine > 0 && (
              <Card
                size="small"
                bordered={false}
                style={{ borderRadius: 10, background: '#fff1f0', marginBottom: 20 }}
              >
                <Statistic
                  title={<Text type="danger">Toplam Gecikme Cezası</Text>}
                  value={stats.totalFine}
                  prefix="₺"
                  precision={2}
                  valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
                />
              </Card>
            )}
          </Col>

          {/* ─── Ödünç Geçmişi Tablosu ───────────────────────────── */}
          <Col span={24}>
            <Card
              title={
                <span>
                  <BookOutlined style={{ marginRight: 8 }} />
                  Ödünç Geçmişim
                  <Badge count={stats.total} style={{ marginLeft: 8, backgroundColor: '#1677ff' }} />
                </span>
              }
              bordered={false}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            >
              <Table<Transaction>
                columns={columns}
                dataSource={transactions}
                rowKey="id"
                pagination={{ pageSize: 10, showTotal: (t) => `Toplam ${t} işlem` }}
                rowClassName={(record) => {
                  if (record.status === 'OVERDUE' || record.isOverdue) return 'row-overdue';
                  return '';
                }}
                scroll={{ x: 700 }}
              />
              <style>{`
                .row-overdue { background-color: #fff1f0 !important; }
                .row-overdue:hover > td { background-color: #ffe7e6 !important; }
              `}</style>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default ProfilePage;
