import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  message,
  Modal,
  Form,
  DatePicker,
  Spin,
  Space,
  Input,
} from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import axiosInstance from '@/api/axiosInstance';
import type { Device, DeviceReservation } from '@/types';
import DeviceSlots from '@/components/DeviceSlots';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservations, setReservations] = useState<DeviceReservation[]>([]);
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

  const fetchReservations = async () => {
    try {
      const { data } = await axiosInstance.get('/devices/reservations/me');
      setReservations(data);
    } catch {
      // Sessizce geç
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchReservations();
  }, []);

  const openReservationModal = (device: Device) => {
    setSelectedDevice(device);
    form.resetFields();
    setReservationModalOpen(true);
  };

  const handleReserve = async () => {
    try {
      const values = await form.validateFields();
      setReservationLoading(true);
      await axiosInstance.post(`/devices/${selectedDevice!.id}/reserve`, {
        startAt: values.period[0].toISOString(),
        endAt: values.period[1].toISOString(),
        notes: values.notes,
      });
      message.success('Rezervasyon başarılı.');
      setReservationModalOpen(false);
      fetchDevices();
      fetchReservations();
    } catch (error: unknown) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setReservationLoading(false);
    }
  };

  return (
    <div>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  <DesktopOutlined style={{ marginRight: 10, color: '#1677ff' }} />
                  Cihaz Rezervasyonları
                </Title>
                <Text type="secondary">
                  Kullanılabilir cihazları görüntüleyin ve rezervasyon yapın.
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {devices.map((device) => (
          <Col key={device.id} xs={24} sm={12} lg={8}>
            <Card
              title={device.name}
              bordered={false}
              style={{ borderRadius: 12 }}
              actions={[
                <Button
                  type="primary"
                  onClick={() => openReservationModal(device)}
                  disabled={device.availableQuantity === 0 || device.status !== 'ACTIVE'}
                >
                  Rezervasyon Yap
                </Button>,
              ]}
            >
              <Text type="secondary">{device.location || 'Konum belirtilmemiş'}</Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Text type="secondary">Kullanılabilir: {device.availableQuantity ?? 0}</Text>
                <Text type="secondary">Arızalı: {device.brokenCount ?? 0}</Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <DeviceSlots device={device} onReserve={() => openReservationModal(device)} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Text>{device.description || 'Açıklama yok'}</Text>
              </div>
            </Card>
          </Col>
        ))}
        </Row>
      </Spin>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Title level={5}>Rezervasyonlarım</Title>
        {reservations.length ? (
          reservations.map((reservation) => (
            <Card key={reservation.id} style={{ marginBottom: 12 }}>
              <Text strong>{reservation.device?.name}</Text>
              <div>
                <Text type="secondary">
                  {dayjs(reservation.startAt).format('DD.MM.YYYY HH:mm')} - {dayjs(reservation.endAt).format('DD.MM.YYYY HH:mm')}
                </Text>
              </div>
              <Text>{reservation.status}</Text>
            </Card>
          ))
        ) : (
          <Text type="secondary">Henüz rezervasyonunuz yok.</Text>
        )}
      </Card>

      <Modal
        title={selectedDevice ? `${selectedDevice.name} için Rezervasyon` : 'Rezervasyon Yap'}
        open={reservationModalOpen}
        onCancel={() => setReservationModalOpen(false)}
        onOk={handleReserve}
        okText="Rezervasyon Yap"
        confirmLoading={reservationLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="period"
            label="Rezervasyon Zamanı"
            rules={[{ required: true, message: 'Rezervasyon tarih aralığı gerekli.' }]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Not (opsiyonel)">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DevicesPage;
