# Web Programlama Dersi Dönem Projesi Raporu

**Proje Adı:** Öde - Minimalist Aile Bütçe Takip Sistemi  
**Tarih:** 19 Mayıs 2026  

---

## 1. Projenin Amacı ve Özeti

"Öde", manuel veri girişine dayalı, sade ve veri odaklı bir kişisel/aile bütçe takip uygulamasıdır. Günümüzde karmaşık ve göz yorucu arayüzlere sahip finans uygulamalarının aksine, bu proje ile kullanıcıların gelir ve giderlerini en hızlı ve temiz şekilde kayıt altına alabilmesi, hiyerarşik ve veri odaklı görselleştirmelerle finansal durumlarını anlık olarak takip edebilmesi amaçlanmıştır. 

Proje, güncel Web geliştirme teknolojileri (React, Node.js, PostgreSQL) kullanılarak tam kapsamlı (Full-Stack) bir web uygulaması olarak geliştirilmiş ve web programlama prensiplerine uygun şekilde canlıya (production) alınmıştır.

---

## 2. Kullanılan Teknolojiler (Tech Stack)

Projenin hem istemci (frontend) hem de sunucu (backend) tarafında modern, ölçeklenebilir ve performanslı teknolojiler tercih edilmiştir:

**Frontend (İstemci):**
- **React (v18) & TypeScript:** Kullanıcı arayüzü ve tip güvenliği.
- **Vite:** Hızlı geliştirme ortamı ve build aracı.
- **Tailwind CSS:** Modern ve hızlı arayüz şekillendirme.
- **Recharts:** Veri görselleştirme (Gelir-gider pasta ve alan grafikleri).
- **TanStack Query (React Query):** Sunucu durumu (server-state) yönetimi, veri çekme ve önbellekleme.

**Backend (Sunucu):**
- **Node.js (v22) & Express.js (v5):** RESTful API altyapısı.
- **PostgreSQL (Neon DB):** İlişkisel veritabanı yönetimi (Cloud tabanlı).
- **Zod:** İstek (request) ve veri doğrulama (validation).
- **JWT (JSON Web Token) & Bcrypt:** Kimlik doğrulama ve şifreleme.

**Altyapı & Deployment:**
- **Hostinger Shared Hosting:** Statik Frontend dosyalarının sunulması.
- **Hostinger VPS (Ubuntu 24.04):** PM2 ile izole edilmiş Node.js backend sunucusu.
- **Nginx & Certbot:** Reverse proxy, rate-limiting ve Let's Encrypt ile ücretsiz SSL yönetimi.

---

## 3. Sistem Mimarisi

Uygulama istemci-sunucu (Client-Server) mimarisine göre tasarlanmıştır:
1. **İstemci (Tarayıcı):** React SPA (Single Page Application) olarak çalışır ve kullanıcı etkileşimlerini yönetir. Statik dosyalar Hostinger üzerinden servis edilir.
2. **API Ağ Geçidi (Nginx):** Frontend'den gelen API istekleri Nginx üzerinden karşılanır. Güvenlik başlıkları (headers) ve oran sınırlandırması (rate-limit) uygulanarak izole edilmiş Node.js sunucusuna iletilir.
3. **Sunucu Uygulaması (Node.js):** Gelen istekleri işler, Zod ile doğrular, iş mantığını (business logic) çalıştırır ve veritabanı ile etkileşime girer. Modüler monolitik (Modular Monolith) bir yapı tercih edilmiştir (Auth, Accounts, Categories, Transactions, Reports modülleri şeklinde ayrılmıştır).
4. **Veritabanı (Neon PostgreSQL):** Verilerin güvenli ve tutarlı bir şekilde saklandığı katmandır.

---

## 4. Geliştirilen Özellikler ve Modüller

- **Kullanıcı Yönetimi (Auth):** Kayıt olma, giriş yapma, şifrelerin `bcrypt` ile hash'lenmesi ve güvenli oturum yönetimi (JWT). Her kullanıcı kendi verisini izole bir şekilde yönetir.
- **Hesap (Account) Yönetimi:** Nakit, Banka Kartı, Kredi Kartı gibi farklı hesap türlerinin oluşturulması, güncellenmesi ve bakiyelerinin anlık takibi.
- **Kategori Yönetimi:** İşlemlerin sınıflandırılması için Gelir ve Gider kategorilerinin renk ve ikon destekli olarak tanımlanması. Yeni kayıtlarda varsayılan kategoriler sisteme otomatik eklenmektedir.
- **İşlem (Transaction) Yönetimi:** Gelir ve gider ekleme işlemleri. Bu işlemler gerçekleştirilirken, hesap bakiyeleri veritabanı "Transaction (BEGIN/COMMIT)" blokları kullanılarak atomik olarak güncellenir.
- **Raporlar ve Dashboard:** `Recharts` kütüphanesi kullanılarak aylık/günlük finansal özetlerin, kategori bazlı harcama dağılımlarının pasta (donut) ve zaman serisi (area chart) grafikleriyle gösterimi.

---

## 5. Veritabanı Tasarımı

Sistemde 4 temel tablo bulunmaktadır:
1. **users:** Sistemdeki kullanıcıları tutar. (id, email, password_hash, full_name vb.)
2. **accounts:** Kullanıcıların finansal hesaplarını tutar. (id, user_id, name, type, current_balance vb.)
3. **categories:** Kullanıcı bazlı işlem kategorilerini barındırır. (id, user_id, name, type, color, icon vb.)
4. **transactions:** Hesaplar arası veya harici finansal hareketleri tutar. (id, user_id, account_id, category_id, type, amount, transaction_date vb.)

Tablolar arasında "One-to-Many" ilişkiler kurularak veri bütünlüğü `Foreign Key` kısıtlamalarıyla sağlanmıştır. Performans için tarih ve kullanıcı kimliğine (user_id) dayalı özel indeksler tanımlanmıştır.

---

## 6. Güvenlik ve Hata Yönetimi

- **Kimlik Doğrulama:** JWT tabanlı, 7 gün geçerlilik süreli token mekanizması kullanılmıştır. Tüm veri yazma/okuma işlemleri token doğrulaması (Auth Middleware) arkasına alınmıştır.
- **Veri Doğrulama:** Client-side form validasyonları dışında, backend tarafında `Zod` ile şema bazlı kesin doğrulama yapılarak hatalı veri girişlerinin önüne geçilmiştir.
- **Siber Güvenlik:** `Helmet` ile HTTP başlıkları (XSS korumaları vb.) sıkılaştırılmış, `CORS` kuralları ile yalnızca belirli alan adlarına (origin) izin verilmiştir.
- **İzole Veri (Tenant Isolation):** SQL sorgularında her zaman `WHERE user_id = $1` filtresi zorunlu tutularak, kullanıcıların birbirlerinin verisine erişmesi kesinlikle engellenmiştir.

---

## 7. Sonuç ve Değerlendirme

Bu proje kapsamında; sıfırdan modern bir Web API tasarlama, güvenli kullanıcı yetkilendirme altyapısı kurma, ilişkisel bir veritabanını modelleme ve gelişmiş bir Frontend SPA (Single Page Application) geliştirme süreçleri başarıyla tamamlanmıştır. Uygulamanın bir VPS ve paylaşımlı hosting üzerine CI/CD prensipleri göz önüne alınarak canlıya çıkarılması (production deployment), Web Programlama dersindeki teorik bilgilerin gerçek dünya senaryolarında, tümüyle çalışan "production-ready" bir uygulamaya dönüştürülmesi ile sonuçlanmıştır.
