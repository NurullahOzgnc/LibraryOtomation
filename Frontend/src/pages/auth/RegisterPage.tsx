import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  Divider,
  message,
  Row,
  Col,
  Steps,
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  BookOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';

const { Title, Text } = Typography;

interface RegisterForm {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm<RegisterForm>();

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post<AuthResponse>('/auth/register', {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });
      setAuth(data.user, data.token);
      setSuccess(true);
      message.success('Hesabın başarıyla oluşturuldu!');
      setTimeout(() => navigate('/catalog'), 1800);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Kayıt işlemi başarısız.';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #001529 0%, #003366 50%, #001529 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Row style={{ width: '100%', maxWidth: 960 }} gutter={[48, 0]} align="middle">
        {/* Sol panel — Branding */}
        <Col xs={0} md={12}>
          <div style={{ color: '#fff', textAlign: 'center' }}>
            <BookOutlined style={{ fontSize: 72, color: '#1677ff', marginBottom: 24 }} />
            <Title level={2} style={{ color: '#fff' }}>
              Topluluğumuza Katıl
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
              Binlerce kitaba ücretsiz eriş,
              <br />
              ödünç al ve takip et.
            </Text>

            <Steps
              direction="vertical"
              style={{ marginTop: 40, textAlign: 'left' }}
              current={-1}
              items={[
                { title: <Text style={{ color: '#fff' }}>Ücretsiz kayıt ol</Text>, status: 'process' },
                { title: <Text style={{ color: '#fff' }}>Kitapları keşfet</Text>, status: 'process' },
                { title: <Text style={{ color: '#fff' }}>Ödünç al ve takip et</Text>, status: 'process' },
              ]}
            />
          </div>
        </Col>

        {/* Sağ panel — Form */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              padding: '8px 8px',
            }}
          >
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleFilled style={{ fontSize: 64, color: '#52c41a' }} />
                <Title level={3} style={{ marginTop: 16 }}>
                  Hesabın Oluşturuldu!
                </Title>
                <Text type="secondary">Kataloğa yönlendiriliyorsunuz...</Text>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <BookOutlined style={{ fontSize: 36, color: '#1677ff' }} />
                  <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                    Kayıt Ol
                  </Title>
                  <Text type="secondary">Birkaç saniyede üyeliğini oluştur</Text>
                </div>

                <Form<RegisterForm>
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  size="large"
                  autoComplete="off"
                >
                  <Form.Item
                    name="name"
                    rules={[
                      { required: true, message: 'Ad Soyad zorunludur.' },
                      { min: 3, message: 'En az 3 karakter olmalı.' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#bbb' }} />}
                      placeholder="Ad Soyad"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'E-posta zorunludur.' },
                      { type: 'email', message: 'Geçerli e-posta girin.' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined style={{ color: '#bbb' }} />}
                      placeholder="E-posta adresi"
                    />
                  </Form.Item>

                  <Form.Item name="phone">
                    <Input
                      prefix={<PhoneOutlined style={{ color: '#bbb' }} />}
                      placeholder="Telefon (isteğe bağlı)"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Şifre zorunludur.' },
                      { min: 6, message: 'En az 6 karakter olmalı.' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#bbb' }} />}
                      placeholder="Şifre"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Şifre tekrarı zorunludur.' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Şifreler eşleşmiyor.'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#bbb' }} />}
                      placeholder="Şifreyi tekrar gir"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 8 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                    >
                      Kayıt Ol
                    </Button>
                  </Form.Item>
                </Form>

                <Divider plain>
                  <Text type="secondary">veya</Text>
                </Divider>

                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">Zaten hesabın var mı? </Text>
                  <Link to="/login">
                    <Text style={{ color: '#1677ff', fontWeight: 600 }}>Giriş Yap</Text>
                  </Link>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RegisterPage;
