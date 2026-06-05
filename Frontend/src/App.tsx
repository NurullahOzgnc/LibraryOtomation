import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import trTR from 'antd/locale/tr_TR';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import UserLayout from '@/components/layout/UserLayout';

// Admin Sayfaları
import DashboardPage from '@/pages/admin/DashboardPage';
import BooksPage from '@/pages/admin/BooksPage';
import UsersPage from '@/pages/admin/UsersPage';
import LoansPage from '@/pages/admin/LoansPage';
import DevicesPage from '@/pages/admin/DevicesPage';

// Kullanıcı Sayfaları
import CatalogPage from '@/pages/user/CatalogPage';
import ProfilePage from '@/pages/user/ProfilePage';
import UserDevicesPage from '@/pages/user/DevicesPage';

// Auth Sayfaları
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Components
import TermsAndPoliciesModal from '@/components/TermsAndPoliciesModal';

// Store
import { useAuthStore } from '@/store/authStore';

dayjs.locale('tr');

// ─── Korumalı Route'lar ───────────────────────────────────────────────────────
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/catalog" replace />;
  return <>{children}</>;
};

const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── App ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Terms modal'ı kontrol et: kullanıcı giriş yapmış ve henüz terms'i kabul etmemiş ise göster
  useEffect(() => {
    if (isAuthenticated && user && !user.termsAcceptedAt) {
      setShowTermsModal(true);
    }
  }, [isAuthenticated, user]);

  // Hydration bitene kadar loading göster
  if (!_hasHydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Yükleniyor..." />
      </div>
    );
  }

  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: { siderBg: '#001529' },
          Table: { rowHoverBg: '#f5f5f5' },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          {/* Terms Modal */}
          <TermsAndPoliciesModal 
            visible={showTermsModal} 
            onAccept={() => setShowTermsModal(false)} 
          />

          <Routes>
            {/* ─── Auth ──────────────────────────────────────────── */}
            <Route
              path="/login"
              element={
                isAuthenticated
                  ? <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/catalog'} replace />
                  : <LoginPage />
              }
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/catalog" replace /> : <RegisterPage />}
            />

            {/* ─── Admin Rotaları ─────────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="books" element={<BooksPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="loans" element={<LoansPage />} />
            </Route>

            {/* ─── Kullanıcı Rotaları ─────────────────────────────── */}
            <Route
              path="/"
              element={
                <UserRoute>
                  <UserLayout />
                </UserRoute>
              }
            >
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="devices" element={<UserDevicesPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route index element={<Navigate to="/catalog" replace />} />
            </Route>

            {/* ─── Fallback ──────────────────────────────────────── */}
            <Route
              path="*"
              element={
                <Navigate
                  to={
                    isAuthenticated
                      ? user?.role === 'ADMIN'
                        ? '/admin'
                        : '/catalog'
                      : '/login'
                  }
                  replace
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
