# Projeyi GitHub’a Pushlama

Bu dosya **Şifre Kasası (sfr-cloud)** uygulamanızı GitHub’a göndermek için `git add`, `git commit`, `git push` komutlarını adım adım anlatır. GitHub’a pushladıktan sonra Railway bu repodan otomatik deploy alacak.

---

## Uygulamanız için tek blok (kopyala-yapıştır)

Proje klasöründe terminal açıp sırayla şunları çalıştırın:

```bash
cd /Users/metinkayan/Desktop/Peojeler/sfr-cloud
git add -A
git status
git commit -m "Railway deploy hazırlığı"
git push origin main
```

- Branch adınız **main** değilse (örn. `master`): son satırda `main` yerine `master` yazın.
- İlk kez push ediyorsanız veya hata alırsanız aşağıdaki adımlara bakın.

---

## Önce: GitHub’da repo var mı?

- **Varsa:** Aşağıdaki “Push adımları”na geçin.
- **Yoksa:** Önce GitHub’da boş bir repo oluşturun:
  1. https://github.com/new
  2. Repository name: `sfr-cloud` (veya istediğiniz isim)
  3. Public seçin, **Create repository** deyin.
  4. “Push an existing repository” bölümünde gösterilen komutlardan sadece **remote ekleme** ve **push** kısmını kullanacağız (aşağıda).

---

## 1. Terminalde proje klasörüne girin

```bash
cd /Users/metinkayan/Desktop/Peojeler/sfr-cloud
```

---

## 2. `git add -A` — Tüm değişiklikleri sahneye al

**Ne yapar:** Yeni eklenen, değiştirilen ve silinen dosyaların hepsini bir sonraki commit’e dahil eder.

- `git add -A` = “Tüm (All) değişiklikleri ekle”
- Sadece belli dosyalar eklemek isterseniz: `git add dosyaadi.js` (şimdilik `-A` yeterli)

```bash
git add -A
```

Çıktıda hata yoksa sessizce biter.

---

## 3. `git status` — Ne eklendi kontrol et (isteğe bağlı)

**Ne yapar:** Hangi dosyaların commit’e hazır olduğunu listeler.

```bash
git status
```

Örnek çıktı:
- **Changes to be committed:** Yeşil ile listelenen dosyalar bir sonraki commit’e gidecek.
- **Untracked files:** Varsa bunlar henüz `git add` edilmemiştir (`git add -A` ile eklenir).

---

## 4. `git commit -m "mesaj"` — Commit oluştur

**Ne yapar:** Sahneye aldığınız değişiklikleri yerel Git geçmişinde tek bir “kayıt” (commit) olarak kaydeder. `-m` sonrasındaki metin bu commit’in kısa açıklamasıdır.

```bash
git commit -m "Railway deploy hazırlığı"
```

- Mesajı değiştirmek isterseniz tırnak içindeki metni değiştirin (Türkçe karakter kullanabilirsiniz).
- **İlk kez commit atıyorsanız** ve “Please tell me who you are” hatası alırsanız önce şunları yazın:
  ```bash
  git config --global user.email "github-email@örnek.com"
  git config --global user.name "Adınız Soyadınız"
  ```
  Sonra tekrar `git commit -m "..."` çalıştırın.

Commit başarılı olunca “1 file changed” veya “X files changed” benzeri bir satır görürsünüz.

---

## 5. `git push origin main` — GitHub’a gönder

**Ne yapar:** Yereldeki `main` branch’ini GitHub’daki `origin` adresine gönderir. Böylece tüm commit’ler (ve dosyalar) GitHub’da görünür.

```bash
git push origin main
```

- Branch adınız **main** değilse (örn. `master`) şunu kullanın:
  ```bash
  git push origin master
  ```
  Branch adını öğrenmek için: `git branch`

**İlk kez push ediyorsanız:**

- GitHub’da repo yeni oluşturulduysa, “remote” henüz ekli olmayabilir. Önce remote’u ekleyin (GitHub’daki repo URL’inizi kullanın):
  ```bash
  git remote add origin https://github.com/KULLANICI_ADINIZ/sfr-cloud.git
  ```
  Sonra:
  ```bash
  git push -u origin main
  ```
- Kullanıcı adı/şifre veya **Personal Access Token** istenirse:
  - Şifre artık kabul edilmiyor; GitHub **token** ister.
  - GitHub → Settings → Developer settings → Personal access tokens → Generate new token (repo yetkisi verin).
  - Şifre yerine bu token’ı yapıştırın.

Push başarılı olunca “Writing objects: 100%” ve “main -> main” benzeri satırlar görürsünüz.

---

## Kısa özet

| Komut | Açıklama |
|--------|----------|
| `cd /Users/metinkayan/Desktop/Peojeler/sfr-cloud` | Proje klasörüne gir |
| `git add -A` | Tüm değişiklikleri commit’e hazırla |
| `git status` | (İsteğe bağlı) Nelerin eklendiğini gör |
| `git commit -m "Railway deploy hazırlığı"` | Yerel commit oluştur |
| `git push origin main` | GitHub’a gönder |

Hangi adımda takıldığınızı (ve tam hata mesajını) yazarsanız, o adıma özel net komut verebilirim.
