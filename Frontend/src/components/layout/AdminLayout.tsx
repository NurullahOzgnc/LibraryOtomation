import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, theme } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/admin/books',
    icon: <BookOutlined />,
    label: 'Kitap Yönetimi',
  },
  {
    key: '/admin/devices',
    icon: <DesktopOutlined />,
    label: 'Cihaz Yönetimi',
  },
  {
    key: '/admin/users',
    icon: <UserOutlined />,
    label: 'Kullanıcılar',
  },
  {
    key: '/admin/loans',
    icon: <HistoryOutlined />,
    label: 'Ödünç İşlemleri',
  },
];

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profilim',
      onClick: () => navigate('/admin/profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #002040 100%)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Logo / Başlık */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            transition: 'all 0.2s',
          }}
        >
          <BookOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          {!collapsed && (
            <Text
              strong
              style={{ color: '#fff', marginLeft: 12, fontSize: 16, whiteSpace: 'nowrap' }}
            >
              Kütüphane
            </Text>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
        />
      </Sider>

      {/* ─── Main Layout ────────────────────────────────────────────────── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        {/* ─── Header ───────────────────────────────────────────────────── */}
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Collapse Toggle */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, width: 40, height: 40 }}
          />

          {/* Sağ taraf: Bildirim + Kullanıcı */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18 }} />}
              style={{ width: 40, height: 40 }}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = '#f5f5f5')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
                }
              >
                <Avatar
                  size={36}
                  style={{ backgroundColor: '#1677ff', fontWeight: 600 }}
                >
                  {user?.name?.charAt(0).toUpperCase() ?? 'A'}
                </Avatar>
                <div style={{ lineHeight: 1.3 }}>
                  <Text strong style={{ display: 'block', fontSize: 13 }}>
                    {user?.name ?? 'Admin'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Yönetici
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* ─── Content ──────────────────────────────────────────────────── */}
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
