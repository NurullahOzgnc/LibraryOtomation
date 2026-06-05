import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, Badge, theme } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  HomeOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    { key: '/catalog', icon: <HomeOutlined />, label: <Link to="/catalog">Katalog</Link> },
  { key: '/devices', icon: <DesktopOutlined />, label: <Link to="/devices">Cihazlar</Link> },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profilim',
      onClick: () => navigate('/profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      danger: true,
      onClick: () => { logout(); navigate('/login'); },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* ─── Sticky Header ──────────────────────────────────────── */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: colorBgContainer,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* Logo */}
        <Link to="/catalog" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <BookOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
            Kütüphane
          </Text>
        </Link>

        {/* Nav */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, border: 'none', background: 'transparent' }}
        />

        {/* Sağ taraf */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge count={0} showZero={false}>
            <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} shape="circle" />
          </Badge>

          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size={36} style={{ backgroundColor: '#1677ff', fontWeight: 700 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Text strong style={{ fontSize: 13 }}>{user.name}</Text>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          )}
        </div>
      </Header>

      {/* ─── Content ────────────────────────────────────────────── */}
      <Content style={{ padding: '32px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.45)', padding: '16px 32px' }}>
        <BookOutlined style={{ marginRight: 8 }} />
        Akıllı Kütüphane Yönetim Sistemi © {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};

export default UserLayout;
