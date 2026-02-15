# Şifre Kasası – İnternete Alma (Deploy)

Backend ve web’i ücretsiz (veya ücretli) hostlara alıp domain almadan kullanabilirsiniz.

## Genel akış

1. **Backend** → Render (veya Railway) üzerinde çalışır → size `https://xxx.onrender.com` gibi bir adres verilir.
2. **Web** → Vercel’e deploy edilir → `https://sfr-cloud.xxx.vercel.app` gibi adres.
3. Web build alırken backend adresini ortam değişkeniyle verirsiniz; böylece tarayıcı doğru API’ye istek atar.

---

## 1. Backend’i Render’da çalıştırma

1. [render.com](https://render.com) hesabı açın.
2. **New → Web Service**.
3. Repo’yu bağlayın (veya “Deploy an existing image” / manuel deploy).
4. Ayarlar:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Root directory:** (proje kökü, backend’in olduğu yer; repo kökü ise boş bırakın)
5. **Environment:**
   - `NODE_VERSION` = `20` (veya 18)
   - `JWT_SECRET` = güçlü rastgele bir metin (üretim için mutlaka kendi değeriniz)
   - `PORT` = Render otomatik verir, genelde boş bırakılır.
6. Deploy edin. Servis adresi örn: `https://sfr-cloud-api.onrender.com`.

**Not:** Render ücretsiz planda uygulama bir süre kullanılmazsa uyur; ilk istekte 30–60 sn gecikme olabilir. Kalıcı veritabanı için Render’da disk ekleyebilir veya SQLite yerine ileride PostgreSQL kullanabilirsiniz (şu an SQLite, proje kökünde `sfr.db` oluşur; ücretsiz planda restart’ta silinebilir).

---

## 2. Web’i Vercel’de yayınlama

1. [vercel.com](https://vercel.com) hesabı açın.
2. **Add New → Project** ile repoyu import edin.
3. **Root Directory** → `web` seçin (web uygulaması `web` klasöründe).
4. **Build command:** `npm run build`
   **Output directory:** `dist`
5. **Environment Variables:**
   - `VITE_API_URL` = Backend adresiniz (sonunda `/` olmasın), örn: `https://sfr-cloud-api.onrender.com`
6. Deploy’a basın. Site adresi örn: `https://sfr-cloud-xxx.vercel.app`.

Artık bu adresten giriş yapıp şifrelerinize erişirsiniz; API istekleri `VITE_API_URL` ile Render’daki backend’e gider.

---

## 3. Kendi domain’inizi bağlama (isteğe bağlı)

- **Vercel:** Project → Settings → Domains → kendi domain’inizi ekleyin (örn. `sifrekasasi.com`). DNS’te Vercel’in verdiği kaydı kullanın.
- **Render:** Web Service → Settings → Custom Domain → domain’inizi ekleyin.

Böylece ileride ücretsiz adresler kalkarsa sadece DNS’i aynı tutup yeni hosta yönlendirebilirsiniz.

---

## 4. iOS ve masaüstü uygulaması

- **iOS:** `AppConfig.swift` (veya ilgili config) içinde `apiBaseURL` değerini production backend adresiniz yapın (örn. `https://sfr-cloud-api.onrender.com`).
- **Electron masaüstü:** Geliştirme modunda `localhost` kullanır. Paketlenmiş uygulama kendi yerel backend’ini kullanır; “internetten tek hesap” için backend’i Render’a alıp iOS ve web’i aynı API’ye bağlamanız yeterli.

---

## 5. Özet kontrol listesi

- [ ] Backend Render’da çalışıyor, adres belli
- [ ] `JWT_SECRET` production için ayarlandı
- [ ] Web Vercel’de deploy edildi
- [ ] `VITE_API_URL` = backend adresi (slash’sız)
- [ ] Tarayıcıda web adresinden giriş test edildi
- [ ] İstenirse custom domain eklendi
