# Şifre Kasası – Railway’e Deploy

Bu rehber, sfr-cloud uygulamasını **Railway** üzerinde çalıştırmak için adım adım anlatır. SSH veya sunucu yönetimi gerekmez; GitHub’a push ile otomatik deploy olur.

---

## Ön koşullar

- [Railway](https://railway.app) hesabı (GitHub ile giriş yapabilirsiniz)
- Proje **GitHub**’da bir repoda (public veya private)

---

## Canlıya alma – Hızlı özet

1. **railway.app** → GitHub ile giriş → **New Project** → **Deploy from GitHub repo** → reponuzu seçin.
2. **Settings** → **Build Command:** `npm install && npm run build:web` → **Start Command:** `npm start`.
3. **Variables** → `NODE_ENV=production`, `SERVE_WEB_STATIC=web/dist`, `JWT_SECRET=` (güçlü rastgele metin).
4. **Settings** → **Networking** → **Generate Domain** ile public URL alın.
5. Tarayıcıdan bu URL ile erişin; API ve web aynı adreste çalışır.

---

## 1. Railway hesabı ve proje

1. [railway.app](https://railway.app) → **Login** → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo**.
3. Repoyu seçin (örn. `kayanmetin-alt/sfr-cloud`). Yetki istenirse **Authorize** deyin.
4. Branch: **main** (veya kullandığınız branch). Railway projeyi çeker ve ilk build’i başlatır.

---

## 2. Build ve Start komutları

İlk deploy muhtemelen başarısız olur çünkü web build alınmamıştır. Ayarları güncelleyin:

1. Açılan **Service**’e tıklayın (veya sol menüden **Service** seçin).
2. **Settings** sekmesine gidin.
3. **Build** bölümünde:
   - **Build Command:** `npm install && npm run build:web`  
     (Bu komut hem bağımlılıkları kurar hem de `web/dist` oluşturur.)
4. **Deploy** bölümünde:
   - **Start Command:** `npm start`  
     (Varsayılan `node server.js` veya `npm start` ise değiştirmeyin.)
5. **Save** / değişiklikler otomatik kaydedilir; yeni bir deploy tetiklenir.

---

## 3. Ortam değişkenleri (Variables)

1. Service sayfasında **Variables** sekmesine gidin (veya **Settings** içinde **Variables**).
2. **Add Variable** veya **RAW Editor** ile şunları ekleyin:

| Değişken | Değer | Zorunlu |
|----------|--------|---------|
| `NODE_ENV` | `production` | Evet |
| `SERVE_WEB_STATIC` | `web/dist` | Evet (web arayüzü için) |
| `JWT_SECRET` | Güçlü rastgele metin (örn. `openssl rand -base64 32` çıktısı) | Evet |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | (Firestore kullanacaksanız JSON tek satır) | Hayır |

**PORT** Railway tarafından otomatik atanır; tanımlamanız gerekmez.

Kaydettikten sonra deploy yeniden başlayabilir; bitmesini bekleyin.

---

## 4. Public URL (domain)

1. **Settings** → **Networking** (veya **Deployments** sonrası **Generate Domain**).
2. **Generate Domain**’e tıklayın. Örnek: `sfr-cloud-production.up.railway.app`.
3. Bu URL hem API hem de web arayüzü için kullanılır (aynı sunucu).

Tarayıcıda bu adresi açarak giriş / kayıt yapabilirsiniz.

---

## 5. Veritabanı (SQLite) hakkında

Varsayılan olarak proje **SQLite** kullanır (`sfr.db`). Railway’de dosya sistemi **geçici** olabilir; redeploy’da veritabanı sıfırlanabilir.

- **Kalıcı veri istiyorsanız:** Railway’de **Volume** ekleyip `SQLITE_PATH` ile veritabanı dosyasını volume içine yönlendirin (Railway dokümantasyonunda “Volumes”).
- **Test / kişisel kullanım:** Geçici SQLite yeterli olabilir; redeploy’da hesabı yeniden oluşturursunuz.

---

## 6. iOS ve masaüstü

- **iOS:** `AppConfig.swift` içinde `apiBaseURL` değerini Railway domain’iniz yapın (örn. `https://sfr-cloud-production.up.railway.app`). Sonunda `/` olmasın.
- **Electron masaüstü:** Production’da aynı URL’i kullanabilirsiniz.

---

## 7. Güncelleme

GitHub’a push yaptığınızda Railway otomatik yeni deploy başlatır. Ekstra işlem gerekmez.

---

## Özet kontrol listesi

| Adım | Ne yaptın |
|------|-----------|
| 1 | Railway hesabı, GitHub repo bağlandı |
| 2 | Build: `npm install && npm run build:web`, Start: `npm start` |
| 3 | Variables: `NODE_ENV`, `SERVE_WEB_STATIC`, `JWT_SECRET` |
| 4 | Generate Domain ile public URL alındı |
| 5 | Tarayıcıdan URL ile giriş test edildi |

Uygulama adresi: **https://SERVIS-ADINIZ.up.railway.app**
