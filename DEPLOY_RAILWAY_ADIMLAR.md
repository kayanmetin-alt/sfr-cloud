# Railway Deploy – Adım Adım

Bu dosyayı sırayla uygulayın. Her adımı tamamladıktan sonra bir sonrakine geçin.

---

## Adım 1: Projeyi GitHub’a pushlayın

Proje zaten GitHub’da ve güncelse bu adımı atlayın.

1. Terminalde proje klasörüne gidin:
   ```bash
   cd /Users/metinkayan/Desktop/Peojeler/sfr-cloud
   ```
2. Değişiklikleri commit edin:
   ```bash
   git add -A
   git status
   git commit -m "Railway deploy hazırlığı"
   ```
3. GitHub’a gönderin:
   ```bash
   git push origin main
   ```
   (Branch adınız farklıysa `main` yerine onu yazın.)

---

## Adım 2: Railway hesabı açın

1. Tarayıcıda **https://railway.app** adresine gidin.
2. Sağ üstte **Login**’e tıklayın.
3. **Login with GitHub**’ı seçin.
4. GitHub izin ekranında **Authorize Railway** (veya benzeri) ile onaylayın.
5. Giriş yaptıktan sonra Railway ana sayfasına (dashboard) düşeceksiniz.

---

## Adım 3: Yeni proje ve GitHub repo bağlama

1. Railway dashboard’da **New Project** butonuna tıklayın.
2. Açılan pencerede **Deploy from GitHub repo** seçeneğini seçin.
3. **Configure GitHub App** veya **Grant Repository Access** gibi bir bağlantı çıkarsa tıklayın; açılan sayfada **sfr-cloud** (veya reponuzun adı) reposunu seçip **Save** deyin.
4. Repo listesinde **sfr-cloud** (veya kullandığınız repo adı) görününce üzerine tıklayın.
5. **Deploy Now** veya otomatik başlayan deploy’u bekleyin. İlk deploy büyük ihtimalle hata verebilir; bir sonraki adımlarda düzelteceğiz.

---

## Adım 4: Service ayarları (Build ve Start)

1. Açılan projede tek bir **Service** (kutu) görünecek; üzerine tıklayın.
2. Üstte **Settings** sekmesine geçin.
3. **Build** bölümünü bulun.
   - **Build Command** alanına şunu yazın (varsa mevcut metni silin):
     ```bash
     npm install && npm run build:web
     ```
4. **Start** / **Deploy** bölümünü bulun.
   - **Start Command** alanında şunlardan biri olsun (yoksa ekleyin):
     ```bash
     npm start
     ```
     veya
     ```bash
     node server.js
     ```
5. Sayfa otomatik kaydediyorsa bir şey yapmanız gerekmez; kaydetme butonu varsa **Save** deyin.
6. Yeni bir **Deploy** otomatik başlayacak; altta **Deployments** veya **View Logs** ile ilerlemesini izleyin.

---

## Adım 5: Ortam değişkenleri (Variables)

1. Aynı Service sayfasında **Variables** sekmesine tıklayın (Settings yanında).
2. **+ New Variable** veya **RAW Editor** / **Bulk Add** gibi bir seçenek görünecek.
3. Aşağıdaki değişkenleri tek tek ekleyin (isim = tam olarak yazıldığı gibi):

   | Variable Name        | Value |
   |----------------------|--------|
   | `NODE_ENV`           | `production` |
   | `SERVE_WEB_STATIC`   | `web/dist` |
   | `JWT_SECRET`         | Buraya güçlü rastgele bir metin yazın. Bilgisayarınızda terminalde `openssl rand -base64 32` yazıp çıkan değeri kopyalayıp yapıştırabilirsiniz. |

4. **FIREBASE_SERVICE_ACCOUNT_KEY** sadece Firestore kullanacaksanız gerekir; şimdilik eklemeyin.
5. Her satırı ekledikten sonra **Add** / **Save** deyin. Kaydedince yeni bir deploy tetiklenir; bitmesini bekleyin.

---

## Adım 6: Public URL (domain) oluşturma

1. Aynı Service sayfasında **Settings** sekmesine dönün.
2. **Networking** veya **Public Networking** bölümünü bulun.
3. **Generate Domain** butonuna tıklayın.
4. Size bir adres verilecek; örnek: `sfr-cloud-production-xxxx.up.railway.app`. Bu adresi kopyalayıp bir yere not alın.

---

## Adım 7: Deploy’un bitmesini kontrol etme

1. **Deployments** sekmesine gidin.
2. En üstteki (en son) deploy’un durumuna bakın: **Success** / **Active** (yeşil) olmalı.
3. **Build** veya **Deploy** loglarına tıklayıp hata var mı kontrol edin. Özellikle `npm run build:web` ve `npm start` satırlarının hatasız bittiğinden emin olun.

---

## Adım 8: Tarayıcıdan test

1. Tarayıcıda **Adım 6**’da kopyaladığınız URL’i açın (örn. `https://sfr-cloud-production-xxxx.up.railway.app`).
2. Şifre Kasası giriş / kayıt sayfası açılmalı.
3. **Hesap oluştur** ile yeni bir hesap açıp giriş yapmayı deneyin.
4. Giriş yapıp kasa sayfası açılıyorsa deploy başarılı demektir.

---

## Özet kontrol listesi

- [ ] Adım 1: GitHub’a push
- [ ] Adım 2: Railway’e GitHub ile giriş
- [ ] Adım 3: New Project → Deploy from GitHub repo → sfr-cloud seçildi
- [ ] Adım 4: Build Command = `npm install && npm run build:web`, Start Command = `npm start`
- [ ] Adım 5: Variables = `NODE_ENV`, `SERVE_WEB_STATIC`, `JWT_SECRET`
- [ ] Adım 6: Generate Domain ile URL alındı
- [ ] Adım 7: Son deploy Success
- [ ] Adım 8: Tarayıcıdan giriş test edildi

Takıldığınız adımı yazarsanız, o adıma özel detay verebilirim.
