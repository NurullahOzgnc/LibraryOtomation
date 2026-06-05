import React, { useState } from 'react';
import { Modal, Button, Checkbox, Space, Alert, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import axiosInstance from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TERMS_CONTENT = `
Kütüphane Kullanım Şartları ve Politikası

1. GENEL ŞARTLAR
Akıllı Kütüphane hizmetini kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.

2. SORUMLULUK
- Ödünç aldığınız kitaplardan siz sorumlusunuz.
- Zamanında iade etmezseniz geç iade ücreti ödemelisiniz.
- Hasarlı veya kayıp kitapların ücretini ödemelisiniz.

3. YASAKLI DAVRANIŞLAR
- Kütüphanede silah, uyuşturucu vb. kaçak malzeme getirmek
- Başkasına ait hesabı kullanmak
- Sistem güvenliğini tehlikeye atmak
- Hakaret veya tehdit içeren davranışlarda bulunmak

4. KÜTÜPHANE HEDEFLERİ
Bizim misyonumuz toplumun bilgiye ve kültüre erişimini kolaylaştırmaktır.

Bu şartları okudum, anladım ve kabul ediyorum.
`;

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleAccept = async () => {
    if (!agreed) {
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/users/terms/accept');
      // Store'u güncelle
      const { setAuth } = useAuthStore.getState();
      if (user) {
        setAuth(
          { ...user, termsAcceptedAt: new Date().toISOString() },
          useAuthStore.getState().token!
        );
      }
      onClose();
    } catch (error) {
      console.error('Terms acceptance failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="📋 Kullanım Şartlarını Kabul Et"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="cancel"
          disabled={loading}
          onClick={onClose}
        >
          Daha Sonra
        </Button>,
        <Button
          key="accept"
          type="primary"
          loading={loading}
          disabled={!agreed}
          onClick={handleAccept}
        >
          Kabul Et ve Devam Et
        </Button>,
      ]}
      width={700}
      closable={false}
      maskClosable={false}
    >
      <Spin spinning={loading}>
        <Alert
          message="Lütfen aşağıdaki şartları dikkatlice okuyun"
          type="warning"
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          showIcon
        />

        <div
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            padding: 16,
            maxHeight: 400,
            overflowY: 'auto',
            marginBottom: 16,
            backgroundColor: '#fafafa',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {TERMS_CONTENT}
        </div>

        <Space>
          <Checkbox
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          >
            <strong>Şartları okudum ve kabul ediyorum</strong>
          </Checkbox>
        </Space>
      </Spin>
    </Modal>
  );
};

export default TermsModal;
