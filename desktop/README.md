# Şifre Kasası – Masaüstü uygulaması

Bu klasör, web arayüzünü bir masaüstü uygulaması penceresinde açan Electron uygulamasıdır. Tarayıcı yerine bilgisayarda "uygulama" gibi kullanırsınız.

## Kurulum

```bash
cd desktop
npm install
```

## Geliştirme modunda çalıştırma

```bash
npm start
```

- Uygulama açıldığında **backend** (API) ve **web** (Vite) sunucuları yoksa otomatik başlatılır.
- Zaten backend ve web çalışıyorsa pencere doğrudan onlara bağlanır.
- Pencere kapatıldığında uygulamanın başlattığı sunucular da kapatılır.

## Paketleyip tek tıkla açılır uygulama oluşturma

Tek başına çalışan **.app** (macOS) veya **.exe** (Windows) üretmek için:

```bash
cd desktop
npm run dist
```

- Önce web arayüzü build edilir, backend paketlenir, sonra Electron ile uygulama oluşturulur.
- Çıktılar `desktop/dist/` içinde olur:
  - **macOS:** `Şifre Kasası.app`, `.dmg`, `.zip`
  - **Windows:** kurulum (.exe) ve portable sürüm.

Paketlenmiş uygulama açıldığında kendi backend'ini başlatır ve arayüzü pencerede gösterir; veritabanı kullanıcı veri klasöründe saklanır (tarayıcı veya terminal gerekmez).

Sadece paketi test etmek için (installer üretmeden): `npm run pack` — `dist/` içinde çalıştırılabilir uygulama oluşturur.

## Gereksinimler

- Node.js (proje kökü ve `web` klasöründe `npm install` yapılmış olmalı)
