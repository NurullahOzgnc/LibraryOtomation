# 📚 Kütüphane Otomasyon Sistemi (Library Automation)

Akıllı kütüphane yönetim için tam kapsamlı bir web uygulaması. Kitap envanterini yönetmek, ödünç işlemlerini izlemek ve kullanıcı hesaplarını düzenlemek için tasarlanmıştır.

## 🎯 Özellikler

- ✅ Kitap envanteri yönetimi (Ekleme, Düzenleme, Silme)
- ✅ Kullanıcı giriş ve kimlik doğrulama (JWT)
- ✅ Kitap ödünç ve iade işlemleri
- ✅ Üye profil yönetimi
- ✅ Arama ve filtreleme özellikleri
- ✅ Responsive ve kullanıcı dostu arayüz
- ✅ Güvenli veri depolama (Prisma ORM)

## 💻 Teknoloji Yığını

### Frontend
- **React 19** - UI kütüphanesi
- **Vite** - Hızlı geliştirme sunucusu
- **TypeScript** - Tür güvenliği
- **Ant Design** - UI bileşen kütüphanesi
- **Zustand** - State yönetimi
- **React Router** - Sayfalar arası gezinti
- **Axios** - HTTP istekleri

### Backend
- **Node.js & Express** - Sunucu çerçevesi
- **TypeScript** - Tür güvenliği
- **Prisma** - ORM ve veritabanı yönetimi
- **JWT** - Kimlik doğrulama
- **Bcryptjs** - Şifre şifreleme
- **Zod** - Veri doğrulaması
- **CORS** - Çapraz kaynak istekleri

## 📁 Proje Yapısı

```
LibraryOtomation/
├── Frontend/                 # React uygulaması
│   ├── src/
│   │   ├── components/       # UI bileşenleri
│   │   ├── pages/           # Sayfa bileşenleri
│   │   ├── hooks/           # Custom hooks
│   │   └── services/        # API servisleri
│   └── package.json
│
├── Backend/                  # Express sunucusu
│   ├── src/
│   │   ├── routes/          # API yolları
│   │   ├── controllers/      # İş mantığı
│   │   ├── models/          # Veri modelleri
│   │   ├── middleware/      # Ara yazılımlar
│   │   └── server.ts        # Sunucu giriş noktası
│   ├── prisma/              # Veritabanı şeması
│   └── package.json
│
└── README.md
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 16 veya daha yüksek
- npm veya yarn
- PostgreSQL (veya .env dosyasında belirtilen veritabanı)

### Adımlar

#### 1. Depoyu Klonla
```bash
git clone https://github.com/NurullahOzgnc/LibraryOtomation.git
cd LibraryOtomation
```

#### 2. Backend Kurulumu
```bash
cd Backend

# Bağımlılıkları yükle
npm install

# Çevresel değişkenleri ayarla
cp .env.example .env
# .env dosyasını düzenle ve veritabanı URL'sini ekle

# Prisma kurulumunu yap
npm run prisma:generate

# Veritabanı migrasyonlarını çalıştır
npm run prisma:migrate

# Geliştirme sunucusunu başlat
npm run dev
```

Backend sunucusu `http://localhost:5000` adresinde çalışacaktır.

#### 3. Frontend Kurulumu
```bash
cd Frontend

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Frontend uygulaması `http://localhost:5173` adresinde çalışacaktır.

## 📝 API Endpoints

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi

### Kitaplar
- `GET /api/books` - Tüm kitapları getir
- `GET /api/books/:id` - Belirli bir kitabı getir
- `POST /api/books` - Yeni kitap ekle
- `PUT /api/books/:id` - Kitabı güncelle
- `DELETE /api/books/:id` - Kitabı sil

### Ödünç İşlemleri
- `POST /api/loans` - Kitap ödünç al
- `PUT /api/loans/:id/return` - Kitabı iade et
- `GET /api/loans` - Ödünç işlemlerini getir

### Kullanıcılar
- `GET /api/users/profile` - Kullanıcı profilini getir
- `PUT /api/users/profile` - Profil bilgilerini güncelle

## 🔐 Güvenlik

- JWT tabanlı kimlik doğrulama
- Bcryptjs ile şifre şifreleme
- CORS yapılandırması
- Zod ile giriş doğrulaması
- Güvenli token yönetimi

## 🛠️ Geliştirme

### Kodu Biçimlendir
```bash
# Frontend
cd Frontend && npm run lint

# Backend
cd Backend && npm run build
```

### Prisma Studio ile Veritabanını Görüntüle
```bash
cd Backend
npm run prisma:studio
```

## 📦 Build ve Deployment

### Frontend Build
```bash
cd Frontend
npm run build
# Derlenen dosyalar `dist/` klasöründe oluşturulur
```

### Backend Build
```bash
cd Backend
npm run build
# Derlenen dosyalar `dist/` klasöründe oluşturulur
npm start
```
