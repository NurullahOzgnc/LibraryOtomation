import React, { useState } from 'react';
import { Modal, Typography, Checkbox, Spin, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import axiosInstance from '@/api/axiosInstance';

const { Title, Text, Paragraph } = Typography;

interface TermsAndPoliciesModalProps {
  visible: boolean;
  onAccept: () => void;
  loading?: boolean;
}

const TermsAndPoliciesModal: React.FC<TermsAndPoliciesModalProps> = ({ 
  visible, 
  onAccept, 
  loading = false 
}) => {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed) {
      message.error('Şartları kabul etmeniz gereklidir.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.post('/users/terms/accept');
      message.success('Şartları kabul ettiniz.');
      setAgreed(false);
      onAccept();
    } catch (err) {
      message.error('Şartları kabul ederken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <span>Kullanıcı Şartları ve Gizlilik Politikası</span>
        </div>
      }
      open={visible}
      onOk={handleAccept}
      onCancel={() => {
        /* Modal kapatılamaz */
      }}
      closable={false}
      maskClosable={false}
      okText="Kabul Et"
      cancelText="Çıkış Yap"
      okButtonProps={{ disabled: !agreed || submitting }}
      cancelButtonProps={{ danger: true }}
      width={700}
      centered
    >
      <Spin spinning={loading} tip="Yükleniyor...">
        <div style={{ maxHeight: '60vh', overflowY: 'auto', marginBottom: 20 }}>
          <Title level={4}>1. Hizmet Şartları</Title>
          <Paragraph>
            Akıllı Kütüphane platformunu kullanarak, aşağıdaki şartları kabul etmektesiniz:
          </Paragraph>
          <ul>
            <li>Hesabınız sadece kişisel kullanım için kullanılacak</li>
            <li>Geçerli bilgiler sağlamaktan sorumlusunuz</li>
            <li>Yasal olmayan faaliyetlerde bulunmayacaksınız</li>
            <li>Diğer kullanıcıların haklarına saygı duyacaksınız</li>
          </ul>

          <Title level={4}>2. Kütüphane Kuralları</Title>
          <Paragraph>
            <ul>
              <li>Maksimum ödünç sayısı: 5 kitap</li>
              <li>Ödünç süresi: 21 gün</li>
              <li>Gecikme cezası: Günlük 1 TL</li>
              <li>Zarar gören kitaplar için ödeme yapılacak</li>
            </ul>
          </Paragraph>

          <Title level={4}>3. Gizlilik Politikası</Title>
          <Paragraph>
            Sizin kişisel verilerinizi (ad, e-posta, telefon) şifreli olarak saklıyoruz ve yalnızca
            kütüphane hizmetleri için kullanıyoruz. Hiçbir şekilde üçüncü taraflara paylaşmayız.
          </Paragraph>

          <Title level={4}>4. Veri ve Güvenlik</Title>
          <Paragraph>
            Hesabınızın güvenliğini korumak sizin sorumluluğunuzdur. Şifrenizi kimseyle paylaşmayın.
            Kütüphane, veri kayıplarından sorumlu tutulamaz.
          </Paragraph>

          <Title level={4}>5. Yönetici Hakları</Title>
          <Paragraph>
            Yönetici, kurallara uymayan kullanıcıları uyarabilir, geçici veya kalıcı şekilde yasaklayabilir
            ve gerekirse hukuki işlem başlatabilir.
          </Paragraph>
        </div>

        <div
          style={{
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Checkbox
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          >
            <Text strong>
              Yukarıdaki tüm şartları okudum ve kabul ediyorum
            </Text>
          </Checkbox>
        </div>
      </Spin>
    </Modal>
  );
};

export default TermsAndPoliciesModal;
