# Öde — Minimalist Aile Bütçe Takip Sistemi

> Manuel veri girişine dayalı, sade ve veri odaklı bir bütçe takip uygulaması.
> ödedimmi.com'un tasarım felsefesinden ilham alınmıştır: temiz arayüz, güçlü hiyerarşi,
> veri odaklı görselleştirme.

### 🌐 Canlı Demo
- **Web:** https://tunatest2.site
- **API:** https://api.tunatest2.site/api/health

### 🛠️ Stack
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2-FF6B6B)
![Zod](https://img.shields.io/badge/Zod-3-3068B7)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)

### 🚀 Production Mimarisi
```
Tarayıcı
   │
   ├──► tunatest2.site  (Hostinger shared)         React/Vite static dosyalar
   │
   └──► api.tunatest2.site  (Hostinger VPS)        Nginx (SSL/HTTPS, rate-limit)
                                                       │
                                                       ▼
                                                   Node.js :5050  (PM2: ode-backend)
                                                       │
                                                       ▼
                                                   Neon PostgreSQL  (Frankfurt, SSL)
```

---

## İçindekiler
1. [Hızlı Başlangıç (lokal)](#hızlı-başlangıç)
2. [Production Deployment](#production-deployment)
3. [Mimari](#mimari)
4. [Veritabanı Şeması](#veritabanı-şeması)
5. [API Referansı](#api-referansı)
6. [Frontend](#frontend)
7. [Test ve Doğrulama](#test-ve-doğrulama)
8. [Portfolio için Notlar](#portfolio-için-notlar)
9. [Sorun Giderme](#sorun-giderme)

---

## Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ (önerilen 22 LTS)
- PostgreSQL 14+ — **iki seçenek**: yerel kurulum **veya** Neon (cloud, 0 kurulum)

### 1) PostgreSQL hazırlığı

#### Seçenek A — Neon (cloud, önerilir, ücretsiz tier var)
1. https://neon.tech → sign up (GitHub ile 30 saniye)
2. **Create project** → name: `ode_db` → region: en yakın (örn. Frankfurt)
3. Dashboard → **Connection string**'i kopyala. Şuna benzer:
   ```
   postgresql://user:pass@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Bu URL'i `.env`'deki `DATABASE_URL`'e yapıştır + `PGSSL=true` ekle. Hepsi bu — kurulum yok, ileride ücretsiz backup, branching, monitoring hazır.

#### Seçenek B — Yerel PostgreSQL
1. https://www.postgresql.org/download/windows/ üzerinden EnterpriseDB installer ile kurun.
2. Kurulum sırasında parolayı not edin (`postgres` önerilir; `.env`'e gireceğiz).
3. Bir veritabanı oluşturun:
   ```sql
   CREATE DATABASE ode_db;
   ```
   pgAdmin → sağ tık → Create → Database, veya CMD:
   ```bat
   psql -U postgres -c "CREATE DATABASE ode_db;"
   ```

### 2) Bağımlılıklar
Repo köküne girin:
```bash
npm run install:all
```
Bu hem `backend/` hem `frontend/` klasörlerinde `npm install` çalıştırır.

### 3) Ortam değişkenleri
`backend/.env` zaten mevcut (varsayılan değerlerle). PostgreSQL parolanız farklıysa düzenleyin:
```
PGPASSWORD=seninParolan
DATABASE_URL=postgresql://postgres:seninParolan@localhost:5432/ode_db
JWT_SECRET=uzun-rastgele-bir-string
```

### 4) Migration
```bash
npm run db:migrate
```
Bu tüm tabloları, indeksleri ve trigger'ları oluşturur.

### 5) Çalıştırma
İki ayrı terminal:
```bash
# Terminal 1 — backend (http://localhost:5000)
npm run dev:backend

# Terminal 2 — frontend (http://localhost:5173)
npm run dev:frontend
```

Tarayıcı: http://localhost:5173 → "Kayıt Ol" → ilk kullanıcınızı oluşturun.
İlk kayıttan sonra otomatik olarak:
- Bir adet "Nakit" hesabı,
- 15 adet varsayılan kategori (Market, Maaş, Faturalar, vs.) seed'lenir.

---

## Production Deployment

Bu proje **gerçek bir production ortamında** çalışıyor (https://tunatest2.site). Kurulum hikayesi
ve karar ağacı aşağıda — adım adım rehber için: [`DEPLOY.md`](./DEPLOY.md).

### Altyapı seçimi

| Katman | Servis | Neden? |
|--------|--------|--------|
| **Frontend** | Hostinger Shared Hosting | Maliyetsiz statik dosya servisi; Vite build'in 240 KB gzip'li çıktısı için gereğinden fazla. |
| **Backend** | Kendi Ubuntu 24.04 VPS'im | Tam kontrol, izole PM2 process; aynı VPS'te eski bir Python bot çalışıyor — etkilenmedi. |
| **Database** | Neon (cloud PostgreSQL) | Sıfır operasyonel yük; otomatik backup, point-in-time recovery, SSL by default. |
| **DNS** | Hostinger DNS yönetimi | Domain (`tunatest2.site`) zaten Hostinger'dan; A-record'ları tek panelden. |
| **SSL** | Let's Encrypt (Certbot) | Ücretsiz, otomatik 90-günlük yenileme. |

### Production mimari diyagramı

```
                       ┌───────────────────────┐
   tarayıcı  ─────────►│  tunatest2.site       │  Hostinger shared (Apache)
   (https)             │  React/Vite static    │  .htaccess: SPA fallback,
                       │  240 KB gzip          │             HTTPS redirect,
                       └───────────┬───────────┘             cache + security
                                   │
                                   │ XHR (fetch /api/*)
                                   ▼
                       ┌───────────────────────┐
                       │ api.tunatest2.site    │  Hostinger VPS (Ubuntu 24.04)
                       │ Nginx :443 (SSL)      │  Certbot — auto-renew
                       │ rate-limit 10 r/s     │
                       └───────────┬───────────┘
                                   │ proxy_pass http://127.0.0.1:5050
                                   ▼
                       ┌───────────────────────┐
                       │ Node.js (Express)     │  PM2 process: ode-backend
                       │ :5050 (loopback only) │  user: ode (sandbox)
                       │ Helmet, JWT, Zod      │  bnb-bot (eski) korunmuş
                       └───────────┬───────────┘
                                   │ pg pool, SSL
                                   ▼
                       ┌───────────────────────┐
                       │ Neon PostgreSQL       │  eu-central (Frankfurt)
                       │ neondb (managed)      │  PITR backup, branching
                       └───────────────────────┘
```

### Karar günlüğü (ne öğrendim)

| Sorun | Çözüm |
|-------|-------|
| **Eski bot var, ne dokunmalı?** | `setup-vps.sh` idempotent yazıldı; her bağımlılık kurmadan önce `command -v X` ile kontrol. PM2 izole process (`name: ode-backend`), eski `bnb-bot`'a hiç dokunulmadı. |
| **Port çakışması** — Python bot zaten 5000'de | Backend `.env`'de `PORT=5050` ayarlandı. Nginx önündeki `proxy_pass` da güncellendi. Dış dünyaya hiç port görünmüyor (sadece 443). |
| **Nginx + Certbot tavuk-yumurta** | Önce `ssl-cert-snakeoil` (Ubuntu varsayılanı) ile Nginx'in SSL bloğu çalışsın diye geçici sertifika; sonra `certbot --nginx` o satırları gerçek Let's Encrypt cert'iyle değiştirdi. |
| **Hostinger File Manager ZIP extract bug'ı** | `dist.zip` ile yükleme, dosya içeriklerini karıştırdı. Çözüm: drag-drop yerine **`Upload Files` ile her dosyayı tek tek yükle, klasörü ayrı oluştur**. ZIP path'leri Hostinger'da güvenilmez. |
| **CORS ayrı domain'ler** | `CLIENT_URL=https://tunatest2.site,https://www.tunatest2.site` (virgülle) → backend env-driven CORS allowlist; her origin için header'lar Vary'lendi. |
| **`.env` placeholder'la deploy** | `DATABASE_URL=postgresql://USER:PASSWORD@HOST/...` örnek değeri yanlışlıkla canlıya gitti, "EAI_AGAIN HOST" hatası — tek satır heredoc + `$(openssl rand -hex 48)` ile JWT otomatik üretip `.env`'i tek seferde temiz yazma alışkanlığı edinildi. |

### Dosyalar — production katmanı

```
deploy/
├── nginx-api.conf         # Nginx server block (rate-limit, security headers, proxy)
└── setup-vps.sh           # Idempotent VPS bootstrap (Node 22, PM2, Nginx, Certbot, ode user)

backend/
├── .env.production.example  # Şablon (Neon URL, JWT_SECRET, PORT=5050, CORS)
└── ecosystem.config.cjs     # PM2 config (isolated, max-memory-restart, log paths)

frontend/
├── .env.production         # VITE_API_URL=https://api.tunatest2.site/api
└── public/.htaccess        # SPA routing + HTTPS redirect + cache + security headers

.github/workflows/
├── deploy-backend.yml      # SSH ile VPS'e deploy (opsiyonel CI/CD)
└── deploy-frontend.yml     # FTP ile Hostinger'a deploy (opsiyonel CI/CD)
```

### Production hardening checklist

- [x] HTTPS zorunlu (HSTS `max-age=63072000` + HTTP→HTTPS 301)
- [x] CORS env-driven allowlist + credentials, origin başına Vary
- [x] Rate limit: API 600/15dk, auth 30/15dk
- [x] Helmet — XSS, frame-options, content-type-options, referrer-policy
- [x] Veritabanı SSL zorunlu (Neon `sslmode=require` → `verify-full` semantik)
- [x] JWT secret 96-char hex (cryptographically random)
- [x] Backend bind 127.0.0.1:5050 (dış dünyadan direkt erişilemez, sadece Nginx üstünden)
- [x] Trust-proxy doğru ayarlı (rate-limit gerçek IP üzerinden çalışıyor)
- [x] PM2 max-memory-restart 300MB (memory leak koruma)
- [x] PM2 startup script kayıtlı (VPS reboot'ta otomatik başlar)
- [x] Certbot otomatik yenileme (90 gün, systemd timer)

---

## Mimari

### Klasör Yapısı (monorepo)
```
ode/
├── backend/
│   └── src/
│       ├── config/         # env config
│       ├── db/             # pg pool, migrations, migrate.js, seed.js
│       │   └── migrations/
│       ├── middlewares/    # errorHandler, auth, validate
│       ├── modules/        # her özellik kendi klasöründe (modular monolith)
│       │   ├── auth/       # auth.routes / .controller / .service / .schema
│       │   ├── accounts/
│       │   ├── categories/
│       │   ├── transactions/
│       │   └── reports/
│       ├── utils/
│       ├── app.js          # express app
│       └── server.js       # entry
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Transactions, Accounts, Categories, Reports, Login, Register
│       ├── layouts/        # AppLayout, AuthLayout
│       ├── components/     # composite (StatCard, TransactionRow, CategoryDonut, ...)
│       ├── ui/             # primitives (Button, Input, Card, Modal, Skeleton, EmptyState, Confirm)
│       ├── hooks/          # (yer ayrıldı)
│       ├── lib/            # api client, queries (TanStack), formatters
│       ├── context/        # AuthContext
│       ├── routes/         # RequireAuth
│       └── types/          # paylaşılan TS tipleri
└── package.json            # workspace-style script'ler
```

### Backend Katmanları (Modular Monolith)
Her modül **route → controller → service** sırasını izler. **Repository** katmanı şimdilik
service içinde inline `pg` query'leri olarak tutuluyor; büyürse ayrı dosyaya çıkarılabilir.

```
HTTP -> [validate (zod)] -> controller -> service (business + DB tx) -> pg pool
                                              \-> seed/util fonksiyonlar
```

### Bakiye Yönetimi: Service Katmanı + DB Transaction
Sorulan kritik karar:
> *Trigger mı, service katmanı mı?*

**Service katmanı + `BEGIN/COMMIT`** seçildi. Sebepler:
| Kriter            | Trigger | **Service (seçilen)** |
|-------------------|---------|-----------------------|
| Test edilebilirlik| Düşük   | Yüksek                |
| Şeffaflık         | Gizli   | Akış kodda görünür    |
| Taşınabilirlik    | DB'ye bağlı | DB-agnostik       |
| Atomiklik         | Otomatik | `withTransaction()` ile |
| Debug kolaylığı   | Zor     | Kolay                 |

Uygulama: `transactions.service.js` içindeki `create/update/delete` metotları
`pool.connect()` → `BEGIN` → `INSERT/UPDATE transactions` + `UPDATE accounts.current_balance`
→ `COMMIT` (hata olursa `ROLLBACK`). `SELECT ... FOR UPDATE` ile race-condition koruması.

**Self-healing:** `POST /api/accounts/:id/recalculate` endpoint'i, saklanan `current_balance`'i
gerçek `transactions` toplamından yeniden hesaplar — kullanıcılar için ekstra güven.

### Hata Yönetimi
- `AppError` sınıfı + alt fabrikalar (`NotFound`, `Conflict`, ...).
- Tek noktadan `errorHandler` middleware: zod hataları → 400 + `details[]`,
  pg unique violation → 409, FK violation → 409.
- Frontend'de `extractApiError()` + `sonner` toast ile minimal bildirim.
- Form alan-altı hatalar (`react-hook-form` + `zod`).

### Güvenlik
- `helmet`, `cors` (sadece `CLIENT_URL`), 15dk pencereli rate-limit (auth daha sıkı: 30/15dk).
- Bcrypt (10 round) parola hash.
- JWT (HS256) 7gün TTL.
- Tüm write endpoint'leri `requireAuth` arkasında.
- Tüm sorgular `WHERE user_id = $1` ile sandbox'lanır → user-tenant izolasyonu.

---

## Veritabanı Şeması
`backend/src/db/migrations/001_init.sql` dosyasında tam tanım. Özet:

```
users (id, email, password_hash, full_name, ...)
  ├──< accounts (id, user_id, name, type, current_balance, initial_balance, currency, color, icon, is_archived, ...)
  │       └──< transactions
  ├──< categories (id, user_id, name, type, color, icon, parent_id, is_archived, ...)
  │       └──< transactions
  └──< transactions (id, user_id, account_id, category_id, type, amount, description, transaction_date, ...)
```

İndeksler: `idx_tx_user_date`, `idx_tx_account`, `idx_tx_category`, `idx_tx_user_type_date`.
Trigger'lar: sadece `updated_at` otomatik güncelleme (yan etki yok).

---

## API Referansı

Tüm uçlar `/api` prefix'iyle servis edilir. Auth'lu uçlar `Authorization: Bearer <token>` bekler.

### Auth
| Method | Path                  | Body                                 | Açıklama |
|--------|-----------------------|--------------------------------------|----------|
| POST   | `/api/auth/register`  | `{ email, password, fullName }`      | Kullanıcı oluştur + token |
| POST   | `/api/auth/login`     | `{ email, password }`                | Giriş + token |
| GET    | `/api/auth/me`        | —                                    | Token'dan user |

### Accounts
| Method | Path                                  | Açıklama |
|--------|---------------------------------------|----------|
| GET    | `/api/accounts`                       | Tüm hesaplar |
| GET    | `/api/accounts/:id`                   | Tek hesap |
| POST   | `/api/accounts`                       | Yeni hesap |
| PATCH  | `/api/accounts/:id`                   | Güncelle |
| DELETE | `/api/accounts/:id`                   | Sil (FK varsa 409) |
| POST   | `/api/accounts/:id/recalculate`       | Bakiyeyi tx toplamından yeniden hesapla |

### Categories
`GET / POST / PATCH / DELETE /api/categories[/{id}]` — `?type=income|expense&includeArchived=true`

### Transactions
`GET / POST / PATCH / DELETE /api/transactions[/{id}]`
Filtreler (GET): `from`, `to`, `type`, `accountId`, `categoryId`, `search`, `limit`, `offset`.
Yanıt: `{ items: [...], total, limit, offset }`.

### Reports
| Path                                    | Açıklama |
|-----------------------------------------|----------|
| `GET /api/reports/summary?from=&to=`   | `{ totalBalance, income, expense, net, transactionCount, ... }` |
| `GET /api/reports/by-category?...`     | Kategori başına toplam + yüzde |
| `GET /api/reports/timeline?granularity=day|month` | Günlük/aylık gelir-gider serisi |
| `GET /api/reports/recent-transactions?limit=10` | Dashboard'daki son işlem listesi |

### Örnek SQL (kategori dağılımı)
```sql
SELECT c.id, c.name, c.color,
       COALESCE(SUM(t.amount),0) AS total,
       COUNT(t.id) AS count
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.user_id = $1
  AND t.type = 'expense'
  AND t.transaction_date BETWEEN $2 AND $3
GROUP BY c.id, c.name, c.color
ORDER BY total DESC;
```
Yüzde frontend'de hesaplanır (cache-friendly, esnek).

---

## Frontend

### Tasarım Sistemi (Tailwind)
- **Renk paleti** (custom):
  - `canvas` `#FAFAFA`, `ink` `#0F172A`, `muted` `#64748B`, `line` `#E5E7EB`,
    `positive` `#10B981`, `negative` `#EF4444`.
- **Tipografi:** Inter, `tabular-nums` para alanlarında (zıplama yok).
- **Component primitive'leri:** `Button`, `Input`, `Select`, `Textarea`, `Card`, `Modal`,
  `Skeleton*`, `EmptyState`, `Confirm`. HTML class kalabalığı bunlarla soyutlanır.

### Veri Akışı
- **TanStack Query** ile data fetching, cache, invalidation.
- Tek `axios` instance + JWT interceptor + 401 auto-redirect.
- Mutasyonlar (create/update/delete tx) sonrası otomatik `accounts` + `report` invalidation
  → bakiye anında yenilenir.

### Görselleştirme
- **Recharts** seçildi (tema uyumlu, tree-shake'li, dekleratif).
  - `<AreaChart>` — Gelir/gider zaman serisi (günlük/aylık).
  - `<PieChart>` — Kategori dağılımı (donut, ortada toplam).

### UX Detayları
- **Skeleton loading:** Sayfa düzeni korunur, layout-shift yok.
- **Boş durumlar:** Her listede minimal CTA.
- **Toast bildirimleri:** `sonner` ile sağ-üst, 3.5s, hata/başarı renkleri.
- **Form validasyonu:** Submit'ten önce zod, alan-altı hatalar.
- **Keyboard:** Modal'da `Esc` kapatır, focus-visible ring.

---

## Test ve Doğrulama

### Backend birim testleri
```bash
cd backend
npm test
```
Schema validasyonları, bcrypt, JWT için 9 test (DB gerektirmez).

### Manuel doğrulama (DB kurulduktan sonra)
1. `npm run db:migrate` çalıştır.
2. `npm run dev:backend` & `npm run dev:frontend`.
3. Tarayıcıda `http://localhost:5173/register` → kayıt.
4. Yeni hesap oluştur → birkaç işlem ekle → bakiye anında güncellenir.
5. Bir işlemi sil → bakiye geri alınır (atomik tx).
6. Hesap kartında 🔄 ikonuna tıkla → `recalculate` doğrulaması.
7. Dashboard'da donut + timeline + son işlemler görünür.

### Hızlı API smoke testi (PowerShell)
```powershell
# Health
Invoke-RestMethod http://localhost:5000/api/health

# Register
$body = @{ email='test@test.com'; password='secret123'; fullName='Test User' } | ConvertTo-Json
$r = Invoke-RestMethod http://localhost:5000/api/auth/register -Method POST -Body $body -ContentType 'application/json'
$h = @{ Authorization = "Bearer $($r.token)" }

# Listele
Invoke-RestMethod http://localhost:5000/api/accounts -Headers $h
Invoke-RestMethod http://localhost:5000/api/categories -Headers $h
```

---

## Portfolio için Notlar

Bu projede portfolio kalitesi için bilinçli yapılan tercihler:

| Konu | Tercih | Neden? |
|------|--------|--------|
| Mimari | Modular monolith (`modules/<feature>/`) | Mikroservis kompleksitesi olmadan domain-by-feature. Büyüyünce kolayca ayrılır. |
| ORM | **Yok** (raw `pg` + sade SQL) | Şeffaflık, performans, görüşmede SQL bilgini göstermek. |
| Migration | Plain `.sql` + ufak runner | Build-from-scratch beceri sergisi; Knex/Prisma'ya geçiş kolay. |
| Validation | Zod | Tek schema → hem runtime hem TS tipi. Tutarlılık. |
| Auth | JWT + bcrypt | Endüstri standardı, stateless. |
| Bakiye | Service-layer + tx | DB-agnostic, test edilebilir, açık akış. |
| Frontend state | TanStack Query | Server-state için Redux'tan üstün, modern stack. |
| Styling | Tailwind + primitive layer | Hızlı + tutarlı + class-bloat çözümü. |
| Charts | Recharts | Hafif, dekleratif, tree-shake. |
| Dosya yapısı | atomic-design-lite | Karmaşıklığı erken yormaz. |
| Tipler | TypeScript (strict) | Refactor güvenliği. |
| **Production DB** | Neon (managed PG) | Yedekleme, branching, monitoring "free tier"da hazır; VPS'te DB yönetmek değer üretmiyor. |
| **Backend hosting** | Kendi VPS + PM2 + Nginx | Tam kontrol, izole process, eski projelerle birlikte yaşar. |
| **Frontend hosting** | Hostinger shared | 240 KB gzip için VPS + CDN overkill; shared hosting + `.htaccess` yeterli. |
| **HTTPS** | Let's Encrypt + Certbot | Otomatik 90-gün yenileme. Modern TLS varsayılanları (`options-ssl-nginx.conf`). |
| **Process izolasyonu** | PM2 + ayrı OS user (`ode`) | Eski botla aynı VPS'te birlikte koşar, birbirini bozmaz. |
| **Konfigürasyon** | Env-driven (12-factor) | `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET`, `DATABASE_URL` — kod değişmeden ortam değişir. |

### Eklenebilecekler (roadmap)
**Ürün özellikleri**
- Aktarma (account → account) — `transfer` tipi
- Tekrarlanan işlemler (recurring)
- Dosya yedekleme (CSV import/export)
- E-posta doğrulama / parola sıfırlama
- Çoklu para birimi + günlük kur API'si
- Mobile-first PWA + offline-first

**Teknik / DevOps**
- E2E testler (Playwright) — CI'da koşar
- Docker Compose (postgres + backend + frontend) — local stack
- GitHub Actions otomatik deploy (workflow dosyaları zaten hazır, [`DEPLOY.md`](./DEPLOY.md))
- OpenAPI / Swagger — `/api/docs`
- Uptime monitoring — `https://api.tunatest2.site/api/health` ping (UptimeRobot ücretsiz tier)
- Application monitoring — Sentry (error tracking), pino → Loki (log aggregation)

---

## Sorun Giderme

### Lokal geliştirme

| Belirti | Çözüm |
|---------|-------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL servisi çalışmıyor. Hizmetler → `postgresql-x64-16` Başlat. |
| `password authentication failed` | `.env`'deki `PGPASSWORD` ve `DATABASE_URL` parolanızla aynı mı? |
| `database "ode_db" does not exist` | `psql -U postgres -c "CREATE DATABASE ode_db;"` |
| Frontend'de `Network Error` | Backend çalışıyor mu? `http://localhost:5000/api/health` 200 dönüyor mu? Vite proxy `/api → :5000` ayarlı. |
| Bakiye eşleşmiyor | Hesap kartından 🔄 (recalculate) bas; `current_balance = initial_balance + Σ(income) − Σ(expense)`. |
| `gen_random_uuid does not exist` | Migration `pgcrypto` extension'ı kurar — Postgres 13+ gerekli. |

### Production (canlı ortam)

| Belirti | Olası neden | Çözüm |
|---------|-------------|-------|
| `getaddrinfo EAI_AGAIN HOST` | `.env`'de DATABASE_URL placeholder kalmış (`@HOST/`) | Tek satır heredoc + gerçek Neon URL. PM2 restart `--update-env` |
| `nginx -t` → `no "ssl_certificate" is defined` | Certbot daha çalışmadan SSL bloğu var | Snakeoil cert (`/etc/ssl/certs/ssl-cert-snakeoil.pem`) ile bootstrap, sonra `certbot --nginx` |
| Frontend MIME error: `Refused to apply style` | `assets/` klasörü `public_html/` rootuna gitmemiş, `.htaccess` SPA fallback CSS'e HTML döndürüyor | Hostinger File Manager → `assets/` klasörünü manuel oluştur, dosyaları tek tek yükle |
| `502 Bad Gateway` | Backend çökmüş, Nginx Node'a ulaşamıyor | `sudo -u ode pm2 logs ode-backend --lines 30` → hata sebebini gör; çoğunlukla DB bağlantısı |
| CORS error: `No 'Access-Control-Allow-Origin'` | `CLIENT_URL` env'inde origin yok | Backend `.env`'e ekle: `CLIENT_URL=https://tunatest2.site,https://www.tunatest2.site` → `pm2 restart --update-env` |
| `pm2: command not found` (yeni shell) | PATH'de yok | `npm i -g pm2` yeniden kur veya `node /usr/lib/node_modules/pm2/bin/pm2 ...` |
| Eski bot etkilendi | İzolasyon ihlal edilmiş | PM2 ayrı user altında (`sudo -u ode pm2 ...`); Nginx server_name match'i ile siteler izole. Yine de etkilendi: `pm2 list` ile root'un PM2'sinde bot online mı doğrula |
| Certbot rate-limit | Aynı domain için sık dene | Let's Encrypt: 50 sertifika/hafta. Test için `--staging` flag kullan |

### Yararlı tanı komutları

```bash
# Backend logs (canlı)
sudo -u ode pm2 logs ode-backend --lines 50

# Backend HTTP testi (VPS içinden)
curl -i http://127.0.0.1:5050/api/health

# Backend HTTP testi (dış dünyadan)
curl -i https://api.tunatest2.site/api/health

# Nginx config syntax
sudo nginx -t

# Nginx error log
sudo tail -f /var/log/nginx/ode-api.error.log

# Hangi process port 5050'de?
sudo ss -tlnp | grep ':5050'

# Sertifika geçerlilik
sudo certbot certificates
```

---

## Lisans
Bu proje portfolio amaçlıdır. Özgürce inceleyin, fork edin, geliştirin.

---

## İletişim

Geri bildirim, soru, iş birliği önerisi için:
- GitHub: [@tunahantyl](https://github.com/tunahantyl)
- Repo: [tunahantyl/ode-finance-tracker](https://github.com/tunahantyl/ode-finance-tracker)
- Live demo: https://tunatest2.site
