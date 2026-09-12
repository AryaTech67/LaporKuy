# LEMBAR PERNYATAAN PENGGUNAAN AI
**Exasti 2.0: Web Application Competition**

Judul Proyek : LaporKuy
Nama Ketua Tim : Bendzanu Kamagifi
Nama Anggota Tim :
1. Arya Putra Pratama
2. Muhammad Cahyaningrat
3. Muhammad Raditya Utomo

## A. PENGEMBANGAN
**1. Apa AI Coding Assistant / Platform utama yang tim anda gunakan untuk membangun produk ini?**
Antigravity / Gemini 3.1 Pro High

Platform utama yang kami gunakan dalam perancangan dan pengembangan aplikasi LaporKuy adalah Antigravity yang ditenagai oleh model penalaran tingkat tinggi Google Gemini 3.1 Pro (High Reasoning/Thinking Mode). Antigravity difungsikan sebagai Autonomous Agentic Coding Assistant dan AI Pair Programmer komprehensif yang terintegrasi langsung dengan lingkungan pengembangan lokal (IDE dan Terminal).

Keunggulan dan integrasi fungsional yang dimanfaatkan dalam proyek ini meliputi:
1. Large Context Window & Multi-File Reasoning: Mampu memetakan dan menyelaraskan dependensi kode secara holistik lintas ratusan berkas, mencakup Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand state stores, serta skema Supabase PostgreSQL.
2. Architectural Planning Mode: Menerapkan Spec-Driven Development melalui penyusunan Implementation Plan terstruktur sebelum eksekusi berkas, sehingga setiap modul dikembangkan secara terukur sesuai spesifikasi kebutuhan produk (PRD).
3. Live Execution & Verification: Menjalankan eksekusi build, pemeriksaan unit, linting, serta debugging langsung pada terminal lokal untuk memastikan keandalan sistem tanpa kegagalan saat runtime sebelum proses deployment.

## B. LOGIKA PROMPTING
**1. Tuliskan Prompt Utama/Pondasi yang tim anda gunakan di awal proyek untuk mendefinisikan aplikasi yang akan tim anda buat kepada AI:**
**(ROLE & PERSONA)**
Bertindaklah sebagai Lead Civic-Tech Architect dan Principal Fullstack Engineer. Anda ditugaskan untuk merancang dan membangun platform digital partisipasi warga perkotaan bernama "LaporKuy" (v2.0) berbasis pendekatan beyond-the-code yang mendukung target SDGs 11 (Sustainable Cities and Communities) dan SDGs 9 (Industry, Innovation, and Infrastructure).
Visi Utama: "Lapor masalah kota dalam 30 detik, pantau progres penanganan secara transparan dan real-time."

**SYSTEM REQUIREMENTS & SPECIFICATIONS:**
**1. Core User Flow:**
- Frictionless Reporting: Alur pelaporan cepat (Foto Kerusakan -> Deteksi Koordinat GPS Otomatis -> AI Classification & Scoring -> Submit Laporan).
- Interactive Spatial Dashboard: Peta interaktif kota (Surabaya dan aglomerasi) dengan penyaringan kategori masalah (Jalan Rusak, Lampu Mati, Sampah, Banjir, Trotoar Difabel), visualisasi zona rawan, dan kartu ringkasan instan.
- Transparency & SLA Monitoring: Pelacakan status tiket laporan publik (Pending, Terverifikasi, Diproses, Selesai), perhitungan sisa target hari SLA dinas (Dinas Bina Marga, Perhubungan, DLH), serta riwayat perbaikan Before-After.
- Gamified Community Engagement: Sistem poin loyalitas civic, status tingkatan reputasi (Pemula sampai dengan Pahlawan Kota), indikator progres XP, tantangan misi harian/mingguan (Quests), penukaran poin (Rewards catalog), sistem verifikasi dukungan warga (Upvoting), dan lencana apresiasi (badges).

**2. Technical Architecture & Constraints:**
- Framework: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.
- Bundler Engine: Konfigurasikan webpack mode (--webpack) untuk menjamin stabilitas eksekusi native build pada lingkungan Windows.
- Design Tokens & Civic Authority System:
  - Palet warna ketat: Deep Navy Background (#020617), Civic Blue (#0057B8), Action Signal Orange (#F97316) khusus tombol aksi pelaporan, dan semantic status badges.
  - Ergonomi Mobile: Standarisasi target sentuh minimum 48px-56px, floating bottom dock, tata letak squircle side-by-side tiles, dan hindari pengguliran horizontal pada seksi informatif di perangkat mobile.
- State Management & Architecture:
  - Pisahkan Auth State ke dalam Zustand Singleton Store (auth-store.ts) dengan lifecycle initialize() yang idempoten guna mencegah infinite redirect loop.
  - Domain Store (store.ts) untuk mengelola sinkronisasi data laporan, komentar, misi, profil, dan notifikasi dengan fallback mock data yang resilien.
- Mapping Engine: React-Leaflet terintegrasi MapTiler API (mendukung tema dark dataviz, streets, dan satellite) dengan kalkulasi penempatan penanda deterministik (zero purity violation).
- Cloud Backend (Supabase):
  - Gunakan Supabase PostgreSQL 15+ dengan ekstensi uuid-ossp.
  - Susun skema migrasi terpisah untuk 7 tabel entitas: profiles, reports, comments, quests, rewards, notifications, dan report_upvotes.
  - Terapkan Row Level Security (RLS) serta Database Trigger pada auth.users untuk sinkronisasi profil instan pasca-registrasi.

**OUTPUT CONTRACT:**
Hasilkan arsitektur kode modular, teruji (clean build), bebas dependensi usang, dan siap diuji pakai secara responsif baik pada smartphone maupun desktop.

**2. Kendala terbesar apa (bug/error/halusinasi AI) yang tim anda temui selama proses pembuatan, dan bagaimana cara Anda memberikan instruksi ulang (re-prompting) kepada AI untuk menyelesaikannya?**
Selama proses pengembangan dengan model AI, kami menemukan 4 kendala kritis yang membutuhkan investigasi mendalam dan instruksi perbaikan (re-prompting) terarah:

**a. Kendala 'AI Slop' pada Desain Antarmuka (UI Terlalu Kaku dan Monoton):**
- **Permasalahan (AI Slop):** Kode antarmuka awal yang dihasilkan oleh AI terperangkap dalam pola generik 'AI slop' dengan karakteristik desain yang terlalu kaku, datar, dan monoton. Tampilannya menyerupai template dashboard administratif konvensional: tata letak kotak-kotak kaku (boxy layout) tanpa variasi kedalaman visual, palet warna dingin yang menjemukan, ketiadaan micro-interactions atau animasi transisi status laporan, serta tipografi yang kaku tanpa hierarki emosional. Hal ini membuat aplikasi terasa birokratis, dingin, dan tidak ramah bagi warga yang membutuhkan pelaporan cepat.
- **Cara Perbaikan & Re-Prompting yang Benar:**
Kami menginstruksikan AI melalui re-prompting terarah untuk merombak total antarmuka menjadi 'Dynamic & Engaging Civic Experience':
  a. Menghilangkan struktur kotak yang kaku dengan menerapkan sistem kartu modern (squircle tiles bergradasi halus), penataan kedalaman visual (subtle elevation), serta palet warna berkarakter tegas: Deep Navy Background (#020617), Primary Civic Blue (#0057B8), dan Action Signal Orange (#F97316) khusus tombol CTA pelaporan agar langsung menarik atensi pengguna.
  b. Mengikis kesan monoton melalui integrasi gamifikasi visual dan indikator interaktif: menyisipkan progress bar XP warga, tampilan lencana reputasi (badges), kartu ringkasan instan, serta stepper linier pelacakan status penanganan (Pending -> Terverifikasi -> Diproses -> Selesai) lengkap dengan penghitung mundur target SLA dinas.
  c. Mengoptimalkan ergonomi sentuh di layar ponsel: mengganti tata letak statis dengan floating bottom navigation dock, tombol aksi Hero setinggi 56px (h-14) yang ramah jangkauan jempol (thumb zone), serta feedback sentuhan interaktif yang responsif untuk menghidupkan pengalaman pengguna.

**b. Mobile Session Verification Loop (Race Condition pada Auth Guard):**
- **Permasalahan:** AuthGuard membaca status otentikasi dari per-component React store hook. Pada perangkat mobile dengan latensi jaringan seluler yang fluktuatif, pemanggilan supabase.auth.getSession() belum selesai saat komponen me-render rute terlindungi. Hal ini membuat flag isInitialized tertunda dan memicu pengalihan prematur berulang-ulang ke /login, menciptakan putaran pengalihan tanpa henti (infinite redirection loop).
- **Re-Prompting:**
"Refactor autentikasi menjadi Zustand Singleton Store (src/lib/auth-store.ts) dengan inisialisasi yang strictly idempotent menggunakan flag _booted. Pastikan supabase.auth.getSession() hanya dipanggil tepat satu kali saat aplikasi booting melalui AuthProvider tunggal, dan AuthGuard hanya mengevaluasi pengalihan rute setelah isInitialized bernilai true."

**c. React Purity Violation & Marker Glitching pada Komponen Peta (map-view.tsx):**
- **Permasalahan:** AI menyisipkan fungsi tidak murni Math.random() di dalam blok perulangan render komponen Leaflet untuk memberikan sebaran acak penanda laporan. Hal ini melanggar kaidah kemurnian fungsi render React, memicu peringatan ESLint, dan menyebabkan titik penanda bergetar serta berpindah posisi (glitching jitter) setiap kali peta digeser atau diatur perbesarannya.
- **Re-Prompting:**
"Hilangkan Math.random() dari fungsi render MapView. Ganti dengan algoritma pseudo-random hashing deterministik berbasis indeks laporan: const pseudoRandomX = (idx * 0.13) % 0.05 agar koordinat penanda tetap konsisten dan stabil pada setiap siklus render."

**d. Toolchain Native Binding Crash pada Lingkungan Windows (Turbopack SWC Error):**
- **Permasalahan:** Next.js 16 secara bawaan mengaktifkan Turbopack. Pada sistem operasi Windows x64, pustaka native bindings (@next/swc-win32-x64-msvc) mengalami kegagalan (not a valid Win32 application), menyebabkan server pengembangan lokal dan proses kompilasi langsung berhenti secara mendadak.
- **Re-Prompting:**
"Perbarui konfigurasi skrip pada package.json dengan menambahkan flag --webpack ('next dev --webpack' dan 'next build --webpack') untuk beralih ke bundler Webpack yang stabil di Windows."

**3. Apakah ada komponen kode, desain visual, atau database yang tim anda buat/modifikasi secara manual tanpa bantuan AI? Jika ada, sebutkan bagian mana:**
Ya, terdapat sejumlah komponen arsitektural krusial, konfigurasi database, dan aset visual yang kami rancang dan bangun secara manual tanpa bantuan AI guna menjamin keandalan sistem:

**1. Konfigurasi Menyeluruh Ekosistem Backend Supabase (Manual):**
- **Provisioning & Environment Setup:** Mengonfigurasi proyek Supabase cloud secara manual pada dashboard resmi (Project Ref: qgaabxifnyrckkpzqcjk.supabase.co), mengatur kredensial API Keys (NEXT_PUBLIC_SUPABASE_ANON_KEY), konfigurasi URL pengalihan, serta menyelaraskan integrasi SSR client/server (@supabase/ssr).
- **Skema Database & Migrasi SQL Manual (supabase/migrations/):**
  1. **0001_initial_schema.sql:** Mengaktifkan ekstensi uuid-ossp serta merancang struktur DDL untuk 7 tabel relasional utama: a) profiles: Entitas profil warga, pelacak skor reputasi dan kepercayaan (trust_score), poin gamifikasi, streak harian, dan kolom JSONB untuk koleksi lencana apresiasi. b) reports: Entitas data pelaporan infrastruktur dengan koordinat DOUBLE PRECISION (lat/lng), relasi foreign key ke profiles (ON DELETE CASCADE), status penanganan, target SLA dinas, serta penugasan dinas (assigned_dinas). c) comments: Relasi diskusi publik dan tanggapan resmi dari dinas terkait (is_official). d) quests & rewards: Skema misi partisipasi warga dan katalog penukaran imbalan apresiasi. e) notifications & report_upvotes: Sistem riwayat pemberitahuan serta tabel relasi upvote dengan composite primary key (report_id, user_id) guna mencegah manipulasi voting ganda.
  2. **0002_mock_reports_and_notifications.sql:** Penulisan data seeding manual untuk wilayah administratif Kota Surabaya (Kec. Wonokromo, Sukolilo, Rungkut, Dukuh Pakis, Genteng) lengkap dengan data historis komentar penanganan dinas teknis.
  3. **0003_auth_trigger.sql:** Penulisan fungsi PL/pgSQL public.handle_new_user() dengan hak keamanan SECURITY DEFINER dan pembuatan trigger on_auth_user_created pada auth.users untuk sinkronisasi otomatis pembuatan record profil baru setiap kali pengguna mendaftar.
- **Keamanan Data (Row Level Security - RLS):** Mengaktifkan RLS pada seluruh tabel publik dan mengonfigurasi security policies guna melindungi akses pembacaan dan pembaruan data secara terisolasi.

**2. Perancangan Aset Visual & Komponen Logo SVG (Manual):**
- **Desain Logo Vektor Murni (src/components/ui/logo.tsx):** Kode SVG logo dirancang manual (~1.5KB) tanpa AI, memadukan simbol megafon aspirasi, papan checklist laporan, gelombang suara responsif, serta palet warna kustom (#3b82f6 ke #1d4ed8) dengan adaptasi tata letak horizontal maupun vertikal.
- **Kurasi & Kompresi Foto Kerusakan Nyata:** Pengambilan dan kurasi foto riil kerusakan fasilitas perkotaan di Surabaya (public/images/reports/rusak1.jpg, rusak2.jpg, rusak3.jpg) serta dokumentasi foto After perbaikan jalan.

**3. Pengujian Ergonomi pada Perangkat Fisik (Manual Ergonomics & Usability):**
Pengujian manual pada perangkat smartphone fisik (viewport 360px-414px) untuk memvalidasi fluiditas navigasi bottom dock, kenyamanan jangkauan jempol (thumb zone), dan pencegahan pergeseran tata letak (layout shifting) pada peramban bergerak.

---
Bogor, 13 September 2026

Menyetujui,  
Ketua Tim




(Bendzanu Kamagifi)  
NISN / NIM: 0093389827
