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
} from 'antd';
import {
  MailOutlined,
  LockOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.post<AuthResponse>('/auth/login', values);
      setAuth(data.user, data.token);
      message.success(`Hoş geldin, ${data.user.name}!`);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/catalog', { replace: true });
    } catch (err: unknown) {
      const errMsg =
        err && typeof err === 'object' && 'response' in err && (err as any).response?.data?.message
          ? (err as any).response.data.message
          : err instanceof Error
          ? err.message
          : 'E-posta veya şifre hatalı.';
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
            <Title level={1} style={{ color: '#fff', margin: 0 }}>
              Akıllı Kütüphane
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16 }}>
              Kitaplarla dolu bir dünyaya hoş geldin.
              <br />
              Ödünç al, keşfet, öğren.
            </Text>

            {/* Dekoratif floating cards */}
            <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['📚 5.000+ Kitap', '👥 2.000+ Üye', '⚡ Anlık Stok'].map((item) => (
                <div
                  key={item}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    padding: '10px 20px',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
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
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <BookOutlined style={{ fontSize: 36, color: '#1677ff' }} />
              <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
                Giriş Yap
              </Title>
              <Text type="secondary">Hesabına erişmek için bilgilerini gir</Text>
            </div>

            <Form<LoginForm>
              layout="vertical"
              onFinish={onFinish}
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'E-posta zorunludur.' },
                  { type: 'email', message: 'Geçerli bir e-posta girin.' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#bbb' }} />}
                  placeholder="E-posta adresi"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Şifre zorunludur.' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bbb' }} />}
                  placeholder="Şifre"
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
                  Giriş Yap
                </Button>
              </Form.Item>
            </Form>

            <Divider plain>
              <Text type="secondary">veya</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Hesabın yok mu? </Text>
              <Link to="/register">
                <Text style={{ color: '#1677ff', fontWeight: 600 }}>Kayıt Ol</Text>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;
