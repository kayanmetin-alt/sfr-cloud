# Şifre Kasası (Bulut)

Eski sfr uygulamanızın tüm özelliklerini içeren, veritabanı + web + iOS destekli yeni sürüm.

## Yapı

- **backend/** (kökte): Node.js API (Express + SQLite)
- **web/**: React (Vite) — tarayıcıdan ve mobil tarayıcıdan erişim
- **ios/SifreKasasiCloud/**: SwiftUI iOS uygulaması kaynak kodu

## Uygulamayı çalıştırmak için gerekli olanlar

| Ortam | Gerekli |
|--------|--------|
| **Yerel (geliştirme)** | Node.js 18+ (tercihen 20), npm. `.env` **zorunlu değil**; veritabanı için varsayılan SQLite kullanılır. |
| **Canlı (Railway)** | DEPLOY.md’deki adımlar: Railway hesabı, GitHub repo, ortam değişkenleri (JWT_SECRET, SERVE_WEB_STATIC). |

**Yerel hızlı başlangıç:** Proje kökünde `npm install` → `npm run dev` (backend). Ayrı terminalde `cd web` → `npm install` → `npm run dev` (web). Tarayıcıda http://localhost:5173 açın.

---

## 1. Backend’i çalıştırma

```bash
cd /Users/metinkayan/Desktop/Peojeler/sfr-cloud
npm install
npm run dev
```

API varsayılan olarak **http://localhost:3001** adresinde çalışır. Veritabanı dosyası proje kökünde `sfr.db` olarak oluşturulur.

## 2. Web uygulamasını çalıştırma

```bash
cd web
npm install
npm run dev
```

Tarayıcıda **http://localhost:5173** açın. Geliştirme modunda `/api` istekleri otomatik olarak backend’e (3001) yönlendirilir.

## 3. iOS uygulaması

iOS kısmı sadece kaynak koddur. Xcode’da yeni bir proje oluşturup bu dosyaları eklemeniz gerekir.

### Sizin yapacaklarınız

1. Xcode’da **File → New → Project** ile yeni bir **App** oluşturun (SwiftUI, iOS).
2. Ürün adı: **OnlineKasa** (veya istediğiniz isim). OnlineKasa kullanırsanız hazır dosyalarla uyumlu olur.
3. Oluşan proje içinde Xcode’un oluşturduğu **OnlineKasaApp.swift** dosyasını silin (aynı isimde olan bizim `OnlineKasaApp.swift` kullanılacak).
4. **File → Add Files to "OnlineKasa"…** ile `ios/SifreKasasiCloud` klasörünü ekleyin (içindeki tüm .swift dosyaları ve Config, Models, Services, State, Views alt klasörleri projeye dahil olmalı).
5. **OnlineKasaApp.swift** içindeki `@main` entry point’in tek kaldığından emin olun.
6. API adresi: Simülatörde backend’i kendi bilgisayarınızda çalıştırıyorsanız `AppConfig.swift` içinde `apiBaseURL` şu an `http://localhost:3001`. Gerçek cihazda test için bilgisayarınızın yerel IP’sini kullanın (örn. `http://192.168.1.10:3001`) veya yayına aldığınız sunucu URL’sini yazın.
7. **Signing & Capabilities**’de takım ve bundle ID’nizi ayarlayın.

### Simülatörde localhost

Simülatör aynı makinede çalıştığı için `http://localhost:3001` çalışır. Backend’i `npm run dev` ile açık tutun; web’i kapatıp sadece iOS uygulamasını da kullanabilirsiniz.

## Özellikler (eski uygulamayla uyumlu)

- **Kurulum:** Ana parola + güvenlik sorusu/cevabı
- **Giriş / Kilidi aç:** Parola ile giriş; sayfa yenilenince (web) veya uygulama kapatılınca (iOS) tekrar parola istenir
- **Şifre listesi:** Arama, listede maskeleme, kopyalama, düzenleme, silme
- **Yeni kayıt / Düzenleme:** Site adı + şifre; eski şifreleri saklama (ayarlardan)
- **Ayarlar:** Eski şifreleri sakla, listede maskele, güvenlik kilidi, otomatik kilitleme, parola değiştir, hesap sil, destek / gizlilik linkleri
- **Kurtarma:** Parolamı unuttum → güvenlik sorusu → yeni parola

Veriler sunucuda şifreli saklanır; şifreleme anahtarı parolanızdan türetilir (client-side encryption).

## Ortam değişkenleri (backend)

| Değişken | Zorunlu? | Açıklama |
|----------|----------|----------|
| **PORT** | Hayır | Backend portu (varsayılan 3001) |
| **JWT_SECRET** | Hayır (yerel) / Evet (canlı) | JWT imzası; canlıda mutlaka güçlü bir değer verin |
| **SQLITE_PATH** | Hayır | Veritabanı dosyası yolu (varsayılan: proje kökünde `sfr.db`) |
| **FIREBASE_SERVICE_ACCOUNT_KEY** | Hayır | Tanımlıysa Firestore kullanılır; yoksa SQLite kullanılır |
| **SERVE_WEB_STATIC** | Sadece canlı | Örn. `web/dist` — backend bu klasörü statik sunar (Railway tek sunucu) |

## Canlıya alma (Railway)

Detaylı adımlar için **DEPLOY.md** dosyasına bakın. Kısaca:

1. [Railway](https://railway.app) hesabı açın (GitHub ile), **Deploy from GitHub repo** ile reponuzu bağlayın.
2. Build: `npm install && npm run build:web`, Start: `npm start`; Variables: `NODE_ENV=production`, `SERVE_WEB_STATIC=web/dist`, `JWT_SECRET=` (güçlü değer).
3. **Generate Domain** ile public URL alın; API ve web aynı adreste çalışır.
4. iOS’ta `AppConfig.apiBaseURL`’i Railway URL’iniz yapın (örn. `https://xxx.up.railway.app`).
