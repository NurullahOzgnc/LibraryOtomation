import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosInstance from '@/api/axiosInstance';
import type { Device } from '@/types';
import DeviceSlots from '@/components/DeviceSlots';

const { Title, Text } = Typography;

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/devices', { params: { limit: 50 } });
      setDevices(data.devices ?? data);
    } catch {
      message.error('Cihazlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const openModal = (device?: Device) => {
    setSelectedDevice(device ?? null);
    form.setFieldsValue(device ? {
      name: device.name,
      description: device.description,
      location: device.location,
      totalQuantity: device.totalQuantity,
      status: device.status,
    } : {
      totalQuantity: 1,
      status: 'ACTIVE',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (selectedDevice) {
        await axiosInstance.put(`/devices/${selectedDevice.id}`, values);
        message.success('Cihaz güncellendi.');
      } else {
        await axiosInstance.post('/devices', values);
        message.success('Cihaz oluşturuldu.');
      }
      setModalVisible(false);
      fetchDevices();
    } catch (error: unknown) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`/devices/${id}`);
      message.success('Cihaz silindi.');
      fetchDevices();
    } catch {
      message.error('Cihaz silinemedi.');
    }
  };

  const columns: ColumnsType<Device> = [
    {
      title: 'Cihaz',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Konum',
      dataIndex: 'location',
      key: 'location',
      render: (location) => location || <Text type="secondary">Belirtilmemiş</Text>,
    },
    {
      title: 'Toplam Adet',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
    },
    {
      title: 'Kullanılabilir',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      render: (value = 0) => <Tag color={value ? 'green' : 'red'}>{value}</Tag>,
    },
      {
        title: 'Slotlar',
        key: 'slots',
        render: (_value, record) => (
          <div>
            <DeviceSlots device={record} isAdmin onToggleBroken={async (newBroken) => {
              try {
                await axiosInstance.put(`/devices/${record.id}`, { brokenCount: newBroken });
                message.success('Cihaz durumu güncellendi.');
                fetchDevices();
              } catch {
                message.error('Güncelleme başarısız.');
              }
            }} />
          </div>
        ),
      },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Düzenle">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModal(record)}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 20, width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <DesktopOutlined style={{ marginRight: 10, color: '#1677ff' }} />
              Cihaz Yönetimi
            </Title>
            <Text type="secondary">Cihaz ekleyebilir, düzenleyebilir ve silebilirsiniz.</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Yeni Cihaz
          </Button>
        </Space>

        <Table<Device>
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={selectedDevice ? 'Cihazı Düzenle' : 'Yeni Cihaz Oluştur'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText="Kaydet"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Cihaz Adı" rules={[{ required: true, message: 'Cihaz adı zorunlu.' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Açıklama">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="location" label="Konum">
            <Input />
          </Form.Item>
          <Form.Item name="totalQuantity" label="Toplam Adet" rules={[{ required: true, message: 'Adet giriniz.' }]}> 
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Durum">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DevicesPage;
