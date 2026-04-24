# Öde — Production Deploy Kılavuzu

**Stack:**
- 🗄️  **DB** — Neon (cloud PostgreSQL, ücretsiz)
- 🖥️  **Backend** — Senin VPS'in (Ubuntu, `api.tunatest2.site`)
- 🌐  **Frontend** — Hostinger shared hosting (`tunatest2.site`)
- 🔀  **CI/CD** — GitHub Actions (push → otomatik deploy)

---

## ÖZET (Yol Haritası)

| # | Aşama | Süre |
|---|-------|------|
| A | Neon hesabı + DB oluştur | 3 dk |
| B | GitHub repo oluştur + kodu push'la | 5 dk |
| C | DNS kayıtları (Hostinger panelinde) | 2 dk |
| D | VPS bootstrap (Node, PM2, Nginx, Certbot) | 5 dk |
| E | Backend ilk deploy + SSL sertifikası | 5 dk |
| F | Hostinger FTP credentials + frontend deploy | 5 dk |
| G | GitHub Secrets ekle → CI/CD çalışır | 3 dk |

**Toplam: ~30 dk.**

---

## A. Neon (Cloud PostgreSQL)

1. https://neon.tech → "Sign up" (GitHub ile giriş yapabilirsin).
2. **Create project**:
   - Project name: `ode`
   - Database name: `ode_db`
   - Region: **Frankfurt** (Türkiye'ye en yakın, en düşük gecikme)
3. Sol panel → **Dashboard** → "Connection string" kutusu.
   - **Connection pooling: ON** seç (`-pooler` içeren URL'i kopyala).
   - URL şöyle görünecek:
     ```
     postgresql://ode_owner:abc123@ep-xxx-pooler.eu-central-1.aws.neon.tech/ode_db?sslmode=require
     ```
   - Bunu bir yere kaydet — birazdan VPS `.env`'ine yapıştıracağız.
4. (Opsiyonel) Yerelden migration çalıştırmak istersen: `backend/.env`'deki `DATABASE_URL`'i geçici olarak Neon URL ile değiştir → `npm run db:migrate` → eski değere geri al.

---

## B. GitHub Repo

```bash
cd C:\Users\mtuna\Desktop\FinanceTracker
git init
git add .
git commit -m "Initial commit: Öde finance tracker"
```

Sonra GitHub'da yeni repo oluştur (private veya public):
1. https://github.com/new → name: `ode-finance-tracker`
2. README/LICENSE/gitignore EKLEME (zaten var).
3. Komutlar:
   ```bash
   git remote add origin git@github.com:<KULLANICI_ADI>/ode-finance-tracker.git
   git branch -M main
   git push -u origin main
   ```

---

## C. DNS — Hostinger Panel

1. Hostinger paneline gir → **Domains** → `tunatest2.site` → **DNS / Name Servers** → **Manage DNS records**.
2. Şu kayıtları ekle:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | (Hostinger varsayılanı — dokunma) | — |
| A | `www` | (Hostinger varsayılanı — dokunma) | — |
| **A** | **`api`** | **\<VPS_IP_ADRESI>** | 300 |

> `<VPS_IP_ADRESI>`: VPS'inin public IPv4'ü. Bilmiyorsan VPS'te: `curl ifconfig.me`

3. Kaydet. Yayılma genelde 5 dk sürer. Test:
   ```bash
   nslookup api.tunatest2.site
   ```

---

## D. VPS Bootstrap

VPS'ine SSH ile bağlan (örn. `ssh root@<VPS_IP>`).

```bash
# Repo'yu çek (root olarak)
cd /tmp
git clone https://github.com/<KULLANICI_ADI>/ode-finance-tracker.git
cd ode-finance-tracker

# Bootstrap
chmod +x deploy/setup-vps.sh
sudo ./deploy/setup-vps.sh
```

Bu script:
- Node.js 22 LTS (varsa atlar)
- PM2 (varsa atlar — eski bot ETKİLENMEZ)
- Nginx (varsa atlar — sadece yeni server block ekleyeceğiz)
- Certbot
- `ode` adında system user
- `/var/www/ode` dizini

> **NOT:** Eski bot'unuz farklı bir kullanıcı veya `/home/...` dizininde çalışıyorsa hiç dokunulmaz. PM2 process listesi de korunur.

---

## E. Backend İlk Deploy

```bash
# Repo'yu kalıcı yere koy
sudo -u ode git clone https://github.com/<KULLANICI_ADI>/ode-finance-tracker.git /var/www/ode

# Production .env oluştur
sudo -u ode cp /var/www/ode/backend/.env.production.example /var/www/ode/backend/.env

# JWT secret üret + .env'i düzenle
openssl rand -hex 48     # çıktıyı kopyala
sudo -u ode nano /var/www/ode/backend/.env
```

`.env`'i şu şekilde doldur:
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://tunatest2.site,https://www.tunatest2.site
TRUST_PROXY=1
DATABASE_URL=postgresql://ode_owner:....@ep-xxx-pooler.eu-central-1.aws.neon.tech/ode_db?sslmode=require
PGSSL=true
JWT_SECRET=BURAYA_OPENSSL_CIKTI_YAPISTIR
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

```bash
# Bağımlılıklar + migration + ilk başlatma
sudo -u ode bash -c "cd /var/www/ode/backend && npm install --omit=dev"
sudo -u ode bash -c "cd /var/www/ode/backend && npm run db:migrate"
sudo -u ode bash -c "cd /var/www/ode/backend && pm2 start ecosystem.config.cjs"
sudo -u ode pm2 save

# PM2'yi sistem boot'unda başlat (sadece bir kez gerekli; eski process'ler korunur)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ode --hp /home/ode
```

### Nginx server block

```bash
sudo cp /var/www/ode/deploy/nginx-api.conf /etc/nginx/sites-available/api.tunatest2.site
sudo ln -s /etc/nginx/sites-available/api.tunatest2.site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Let's Encrypt SSL

```bash
sudo certbot --nginx -d api.tunatest2.site
# E-posta: kendi mailin
# Terms: A
# Redirect: 2 (HTTP'yi HTTPS'e yönlendir)
```

### Doğrulama

```bash
curl https://api.tunatest2.site/api/health
# Beklenen: {"status":"ok","service":"ode-backend","time":"..."}
```

---

## F. Hostinger Frontend Deploy

### F.1 — FTP credentials

Hostinger panel → **Hosting** → `tunatest2.site` → **Files** → **FTP Accounts**.
- Mevcut FTP kullanıcısını kullan veya yeni oluştur.
- Bilgileri not et:
  - **FTP Server:** `ftp.tunatest2.site` (veya panelden gösterilen)
  - **FTP Username:** `u123456789.tunatest2`
  - **FTP Password:** (sen belirledin)
  - **Port:** 21

### F.2 — İlk deploy (manuel — bir kez)

GitHub Actions kuruldukça artık otomatik olacak; ama ilk seferi manuel yapalım:

**Yerelinde:**
```bash
cd C:\Users\mtuna\Desktop\FinanceTracker\frontend
npm run build
```

`frontend/dist/` klasöründeki **TÜM içeriği** Hostinger File Manager veya FileZilla ile şuraya yükle:
- `tunatest2.site` ana sitesi → `/public_html/`
- VEYA: subdomain (örn. `ode.tunatest2.site`) yapacaksan → önce panelden subdomain oluştur, sonra ona ait klasöre yükle.

**Önemli:** `dist/.htaccess` dosyasının da yüklendiğinden emin ol (gizli dosyaları göster).

### F.3 — Test

Tarayıcı: https://tunatest2.site → Öde login ekranı görmeli.

---

## G. GitHub Actions (CI/CD)

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

### Backend deploy secrets:
| Secret | Değer |
|--------|-------|
| `VPS_HOST` | VPS IP adresin (örn. `95.x.x.x`) |
| `VPS_PORT` | `22` (varsayılan) |
| `VPS_USER` | `ode` |
| `VPS_SSH_KEY` | Aşağıda anlatılıyor |
| `VPS_APP_DIR` | `/var/www/ode` |

#### SSH key oluşturma:
**Yerelinde:**
```bash
ssh-keygen -t ed25519 -f ode_deploy -C "github-deploy" -N ""
# Bu iki dosya oluşur: ode_deploy (private), ode_deploy.pub (public)
```

**VPS'te** (root olarak):
```bash
sudo -u ode mkdir -p /home/ode/.ssh
sudo -u ode bash -c "echo '<ode_deploy.pub içeriği>' >> /home/ode/.ssh/authorized_keys"
sudo -u ode chmod 600 /home/ode/.ssh/authorized_keys
sudo -u ode chmod 700 /home/ode/.ssh
```

`ode_deploy` (private key) içeriğini → GitHub'da `VPS_SSH_KEY` secret olarak yapıştır.

### Frontend deploy secrets:
| Secret | Değer |
|--------|-------|
| `FTP_SERVER` | Hostinger FTP host (örn. `ftp.tunatest2.site`) |
| `FTP_USERNAME` | Hostinger FTP user |
| `FTP_PASSWORD` | Hostinger FTP password |
| `FTP_REMOTE_DIR` | `/public_html/` (veya subdomain dizini) |

### Test
```bash
git commit --allow-empty -m "ci: trigger deploy"
git push origin main
```

GitHub repo → **Actions** sekmesinde iki workflow çalışmalı:
- ✅ Deploy Backend
- ✅ Deploy Frontend

---

## SSS / Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `502 Bad Gateway` (api.tunatest2.site) | Backend çalışmıyor. `pm2 logs ode-backend` ile bak. |
| `CORS error` (tarayıcıda) | `.env`'deki `CLIENT_URL` doğru mu? `pm2 restart ode-backend` |
| `connection refused` Neon | Neon `?sslmode=require` URL kullandın mı? `PGSSL=true` ayarlı mı? |
| Frontend boş sayfa | `dist/.htaccess` yüklendi mi? Tarayıcı console'unda 404'ler var mı? |
| Login sonra istek atmıyor | Frontend `.env.production` dosyasında `VITE_API_URL=https://api.tunatest2.site/api` doğru mu? Build edip yeniden upload. |
| GitHub Actions FTP hatası | Hostinger'da FTP IP whitelist olabilir → "Allow All" yap. |
| Eski bot durdu mu? | `pm2 list` → eski process'ler hala "online" görmelisin. |

### Yararlı komutlar
```bash
# Logları izle
sudo -u ode pm2 logs ode-backend --lines 50
sudo tail -f /var/log/nginx/ode-api.error.log

# Restart
sudo -u ode pm2 restart ode-backend

# Migration (yeni schema değişikliği geldiğinde)
sudo -u ode bash -c "cd /var/www/ode/backend && npm run db:migrate"

# SSL otomatik yenileme test
sudo certbot renew --dry-run
```

---

## Sıfır-Downtime Güncellemeler

GitHub Actions sayesinde:
- `git push origin main` → ~1 dk içinde her iki taraf otomatik deploy.
- PM2 `startOrReload` kullanır → kesintisiz restart.
- Frontend FTP upload sırasında ~1 sn `index.html` boş olabilir; bu da büyük sorun değil.

İleride zero-downtime için: PM2 cluster mode + 2 instance + reload.
