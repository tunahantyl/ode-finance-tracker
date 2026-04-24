# Öde — Minimalist Aile Bütçe Takip Sistemi

Manuel veri girişine dayalı, sade ve veri odaklı bir bütçe takip uygulaması.
**Stack:** Node.js (Express) + PostgreSQL + React (Vite + TypeScript) + Tailwind CSS + Recharts.

> ödedimmi.com'un tasarım felsefesinden ilham alınmıştır: temiz arayüz, güçlü hiyerarşi,
> veri odaklı görselleştirme.

---

## İçindekiler
1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Mimari](#mimari)
3. [Veritabanı Şeması](#veritabanı-şeması)
4. [API Referansı](#api-referansı)
5. [Frontend](#frontend)
6. [Test ve Doğrulama](#test-ve-doğrulama)
7. [Portfolio için Notlar](#portfolio-için-notlar)
8. [Sorun Giderme](#sorun-giderme)

---

## Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ (önerilen 20/22)
- PostgreSQL 14+ (yerel kurulum)

### 1) PostgreSQL hazırlığı
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

### Eklenebilecekler (roadmap)
- Aktarma (account → account) — `transfer` tipi.
- Tekrarlanan işlemler (recurring).
- Dosya yedekleme (CSV import/export).
- E-posta doğrulama / parola sıfırlama.
- Çoklu para birimi + günlük kur API'si.
- Mobile-first PWA + offline-first.
- E2E testler (Playwright).
- Docker Compose (postgres + backend + frontend).

---

## Sorun Giderme

| Belirti | Çözüm |
|---------|-------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL servisi çalışmıyor. Hizmetler → `postgresql-x64-16` Başlat. |
| `password authentication failed` | `.env`'deki `PGPASSWORD` ve `DATABASE_URL` parolanızla aynı mı? |
| `database "ode_db" does not exist` | `psql -U postgres -c "CREATE DATABASE ode_db;"` |
| Frontend'de `Network Error` | Backend çalışıyor mu? `http://localhost:5000/api/health` 200 dönüyor mu? Vite proxy `/api → :5000` ayarlı. |
| Bakiye eşleşmiyor | Hesap kartından 🔄 (recalculate) bas; `current_balance = initial_balance + Σ(income) − Σ(expense)`. |
| `gen_random_uuid does not exist` | Migration `pgcrypto` extension'ı kurar — Postgres 13+ gerekli. |

---

## Lisans
Bu proje portfolio amaçlıdır. Özgürce inceleyin, fork edin, geliştirin.
