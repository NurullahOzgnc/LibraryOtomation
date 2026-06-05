import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  message,
  Badge,
  Row,
  Col,
  Select,
  Switch,
  Tooltip,
  Image,
} from 'antd';
import {
  HistoryOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axiosInstance from '@/api/axiosInstance';
import type { Transaction } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const statusConfig: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'blue', label: 'Aktif' },
  RETURNED: { color: 'green', label: 'İade Edildi' },
  OVERDUE: { color: 'red', label: 'Gecikmiş' },
  CANCELLED: { color: 'default', label: 'İptal' },
};

const LoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/loans', {
        params: {
          page,
          limit: 15,
          status: statusFilter || undefined,
          overdue: showOverdue || undefined,
        },
      });
      setLoans(data.transactions ?? data);
      setTotal(data.total ?? data.length);
    } catch {
      message.error('İşlemler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, showOverdue]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleReturn = async (id: string) => {
    setReturningId(id);
    try {
      const { data } = await axiosInstance.patch(`/loans/${id}/return`);
      const fine = data.fineAmount;
      message.success(
        fine > 0
          ? `İade onaylandı. Gecikme cezası: ₺${fine.toFixed(2)}`
          : 'İade başarıyla onaylandı.'
      );
      fetchLoans();
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'İade işlemi başarısız.';
      message.error(errMsg);
    } finally {
      setReturningId(null);
    }
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_, r) => (
        <div>
          <Text strong>{r.user?.name ?? '—'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{r.user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Kitap',
      key: 'book',
      render: (_, r) => (
        <Space>
          {r.book?.coverImage && (
            <Image
              src={r.book.coverImage}
              width={32}
              height={44}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
          )}
          <div>
            <Text strong style={{ fontSize: 13 }}>{r.book?.title ?? '—'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{r.book?.isbn}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Ödünç / Son İade',
      key: 'dates',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 12 }}>📅 {dayjs(r.borrowedAt).format('DD.MM.YYYY')}</Text>
          <br />
          <Text
            type={r.isOverdue ? 'danger' : 'secondary'}
            style={{ fontSize: 12 }}
          >
            ⏰ {dayjs(r.dueDate).format('DD.MM.YYYY')}
          </Text>
        </div>
      ),
    },
    {
      title: 'İade Tarihi',
      dataIndex: 'returnedAt',
      key: 'returnedAt',
      render: (d: string | null) =>
        d ? (
          <Tag icon={<CheckCircleOutlined />} color="green">
            {dayjs(d).format('DD.MM.YYYY')}
          </Tag>
        ) : (
          <Text type="secondary">Henüz iade edilmedi</Text>
        ),
    },
    {
      title: 'Durum',
      key: 'status',
      render: (_, r) => {
        const isOverdueActive = r.status === 'ACTIVE' && r.isOverdue;
        const cfg = statusConfig[r.status] ?? statusConfig.ACTIVE;
        return (
          <div>
            <Tag
              icon={isOverdueActive ? <WarningOutlined /> : undefined}
              color={isOverdueActive ? 'red' : cfg.color}
            >
              {isOverdueActive ? `Gecikmiş (${r.overdueDays ?? 0}g)` : cfg.label}
            </Tag>
            {(r.fineAmount ?? 0) > 0 && (
              <div>
                <Text type="danger" style={{ fontSize: 12 }}>
                  ₺{r.fineAmount?.toFixed(2)}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'İşlem',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status === 'ACTIVE' ? (
          <Tooltip title="İadeyi Onayla">
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              loading={returningId === record.id}
              onClick={() => handleReturn(record.id)}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              İade Et
            </Button>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <HistoryOutlined style={{ marginRight: 10, color: '#1677ff' }} />
            Ödünç İşlemleri
          </Title>
          <Text type="secondary">{total} işlem bulundu</Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={fetchLoans}>
            Yenile
          </Button>
        </Col>
      </Row>

      {/* Filtreler */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="Durum filtrele"
            allowClear
            style={{ width: 160 }}
            onChange={(val) => { setStatusFilter(val ?? ''); setPage(1); }}
          >
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Space>
            <Switch
              checked={showOverdue}
              onChange={(v) => { setShowOverdue(v); setPage(1); }}
            />
            <Text>Yalnızca Gecikilenler</Text>
            {showOverdue && <Badge count={total} style={{ backgroundColor: '#ff4d4f' }} />}
          </Space>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table<Transaction>
          columns={columns}
          dataSource={loans}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 15,
            onChange: (p) => setPage(p),
            showTotal: (t) => `Toplam ${t} işlem`,
          }}
          rowClassName={(r) =>
            r.isOverdue || r.status === 'OVERDUE' ? 'row-overdue' : ''
          }
          scroll={{ x: 900 }}
        />
        <style>{`
          .row-overdue { background-color: #fff1f0 !important; }
          .row-overdue:hover > td { background-color: #ffe7e6 !important; }
        `}</style>
      </Card>
    </div>
  );
};

export default LoansPage;
