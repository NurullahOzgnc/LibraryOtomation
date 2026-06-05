import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Row,
  Col,
  Select,
  Input,
  Avatar,
  Modal,
  Form,
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  CrownOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axiosInstance from '@/api/axiosInstance';
import type { User } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'USER' | ''>('');
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/users', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          role: roleFilter || undefined,
        },
      });
      setUsers(data.users ?? data);
      setTotal(data.total ?? data.length);
    } catch {
      message.error('Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/users/${id}`);
      message.success('Kullanıcı silindi.');
      fetchUsers();
    } catch {
      message.error('Kullanıcı silinemedi.');
    }
  };

  const handleRoleChange = async (id: string, role: 'ADMIN' | 'USER') => {
    try {
      await axiosInstance.put(`/users/${id}`, { role });
      message.success('Rol güncellendi.');
      fetchUsers();
    } catch {
      message.error('Rol güncellenemedi.');
    }
  };

  // ─── Ban sistemi ────────────────────────────────────────────────────────────
  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    form.resetFields();
    setBanModalVisible(true);
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) {
      message.warning('Ban sebebi belirtiniz.');
      return;
    }

    setBanLoading(true);
    try {
      await axiosInstance.post(`/users/${selectedUser.id}/ban`, { reason: banReason });
      message.success('Kullanıcı banlandı.');
      setBanModalVisible(false);
      fetchUsers();
    } catch {
      message.error('Ban işlemi başarısız.');
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await axiosInstance.post(`/users/${userId}/unban`);
      message.success('Kullanıcı banı kaldırıldı.');
      fetchUsers();
    } catch {
      message.error('Ban kaldırma işlemi başarısız.');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Kullanıcı',
      key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar size={36} style={{ backgroundColor: r.role === 'ADMIN' ? '#ff4d4f' : '#1677ff', fontWeight: 700 }}>
            {r.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{r.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (p: string | null) => p ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record) => (
        <Tag
          icon={role === 'ADMIN' ? <CrownOutlined /> : <UserOutlined />}
          color={role === 'ADMIN' ? 'red' : 'blue'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleRoleChange(record.id, role === 'ADMIN' ? 'USER' : 'ADMIN')}
        >
          {role}
        </Tag>
      ),
    },
    {
      title: 'Ban Durumu',
      key: 'banned',
      render: (_, record) => {
        if (record.isBanned) {
          return (
            <Tag color="red" icon={<LockOutlined />}>
              Banlandı
            </Tag>
          );
        }
        return <Tag color="green">Aktif</Tag>;
      },
    },
    {
      title: 'İşlem Sayısı',
      key: 'transactions',
      render: (_, r) => (
        <Badge
          count={r._count?.transactions ?? 0}
          showZero
          style={{ backgroundColor: '#1677ff' }}
        />
      ),
    },
    {
      title: 'Üyelik Tarihi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="Düzenle">
            <Button type="text" icon={<EditOutlined />} />
          </Tooltip>
          {record.isBanned ? (
            <Popconfirm
              title="Ban kaldırılsın mı?"
              onConfirm={() => handleUnban(record.id)}
              okText="Evet" cancelText="Hayır"
            >
              <Tooltip title="Ban kaldır">
                <Button type="text" icon={<UnlockOutlined />} style={{ color: '#52c41a' }} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Ban et">
              <Button 
                type="text" 
                icon={<LockOutlined />} 
                danger
                onClick={() => openBanModal(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Sil">
            <Popconfirm
              title="Bu kullanıcıyı silmek istediğinize emin misiniz?"
              onConfirm={() => handleDelete(record.id)}
              okText="Evet" cancelText="Hayır" okButtonProps={{ danger: true }}
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 10, color: '#1677ff' }} />
            Kullanıcı Yönetimi
          </Title>
          <Text type="secondary">{total} kullanıcı kayıtlı</Text>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Search
            placeholder="İsim veya e-posta ara..."
            allowClear
            prefix={<SearchOutlined />}
            onSearch={(val) => { setSearch(val); setPage(1); }}
          />
        </Col>
        <Col>
          <Select
            placeholder="Rol filtrele"
            allowClear
            style={{ width: 140 }}
            onChange={(val) => { setRoleFilter(val ?? ''); setPage(1); }}
          >
            <Option value="ADMIN">Admin</Option>
            <Option value="USER">Kullanıcı</Option>
          </Select>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table<User>
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 15,
            onChange: (p) => setPage(p),
            showTotal: (t) => `Toplam ${t} kullanıcı`,
          }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Ban Modal */}
      <Modal
        title={`${selectedUser?.name} - Ban Et`}
        open={banModalVisible}
        onCancel={() => setBanModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBanModalVisible(false)}>
            İptal
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={banLoading}
            onClick={handleBan}
          >
            Banla
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Ban Sebebi" required>
            <Input.TextArea
              rows={4}
              placeholder="Kullanıcıyı neden banladığınızı açıklayınız..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              maxLength={500}
            />
          </Form.Item>
          <Text type="secondary">{banReason.length}/500</Text>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
