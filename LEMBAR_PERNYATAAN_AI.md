# LEMBAR PERNYATAAN PENGGUNAAN AI
### Exasti 2.0: Web Application Competition

---

| Data Proyek | Keterangan |
| :--- | :--- |
| **Judul Proyek** | **LaporKuy** (Platform Pelaporan Masalah Fasilitas Kota Berbasis Civic-Tech) |
| **Nama Ketua Tim** | **Bendzanu Kamagifi** (NISN: 0093389827) |
| **Nama Anggota Tim** | 1. Arya Putra Pratama<br>2. Muhammad Cahyaningrat<br>3. Muhammad Raditya Utomo |

---

### A. PENGEMBANGAN

#### 1. Apa AI Coding Assistant / Platform utama yang tim anda gunakan untuk membangun produk ini?
**Antigravity (Google Gemini)**

Platform utama yang kami gunakan adalah **Antigravity** dengan model dasar **Google Gemini**. Kami memanfaatkan AI ini secara praktis sebagai *pair programming partner* yang terhubung langsung di lingkungan editor kode (IDE) dan terminal lokal.

Peran nyata pemanfaatan AI dalam proyek ini:
1. **Akselerasi Pembuatan Kerangka Kode (Scaffolding):** Membantu membuatkan komponen dasar Next.js 16 (App Router), penulisan antarmuka TypeScript (*interface/types*), dan utilitas Tailwind CSS agar proses pengembangan lebih cepat.
2. **Bantuan Debugging Terminal:** Membantu menganalisis pesan error pada terminal lokal saat terjadi kendala kompilasi Webpack, dependensi npm, atau sintaks TypeScript.
3. **Eksplorasi Ide Solusi Logika:** Membantu merumuskan logika penanganan status laporan dan struktur penulisan query integrasi Supabase.

---

### B. LOGIKA PROMPTING

#### 1. Tuliskan Prompt Utama/Pondasi yang tim anda gunakan di awal proyek untuk mendefinisikan aplikasi yang akan tim anda buat kepada AI:

```text
"Halo! Kami sedang membuat aplikasi web bernama 'LaporKuy' untuk perlombaan Exasti 2.0.
Aplikasi ini adalah platform civic-tech tempat warga bisa melaporkan masalah fasilitas publik di kota (seperti jalan berlubang, lampu jalan mati, tumpukan sampah, dan saluran banjir).

Kebutuhan aplikasi yang ingin kami bangun:
1. Alur Lapor Warga: Form lapor dengan unggah foto kerusakan, input judul, kategori masalah, alamat/koordinat peta, serta deskripsi singkat.
2. Peta Sebaran Interaktif: Peta kota (studi kasus Surabaya) yang menampilkan titik-titik laporan menggunakan penanda (marker) yang bisa difilter berdasarkan kategori.
3. Dashboard Status & Tracking: Warga bisa melihat progres laporan (Menunggu Verifikasi, Sedang Ditangani, Selesai Beres) lengkap dengan catatan dari dinas terkait.
4. Fitur Gamifikasi Civic: Poin keaktifan warga, sistem level/peringkat, dan misi harian agar warga termotivasi ikut menjaga kotanya.
5. Dashboard Admin Khusus: Panel bagi petugas dinas/admin kota untuk memverifikasi laporan masuk dan mengunggah foto bukti setelah perbaikan.

Tech stack yang kami gunakan:
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS untuk antarmuka yang modern, responsif, dan ramah pengguna HP
- Supabase (PostgreSQL) sebagai basis data penyimpanan laporan warga
- Leaflet / OpenStreetMap untuk tampilan peta interaktif

Tolong bantu buatkan struktur folder awal yang rapi dan rancangan komponen utamanya."
```

#### 2. Kendala terbesar apa (bug/error/halusinasi AI) yang tim anda temui selama proses pembuatan, dan bagaimana cara Anda memberikan instruksi ulang (re-prompting) kepada AI untuk menyelesaikannya?

Selama proses coding bersama AI, kami menemukan 3 kendala teknis utama yang harus kami perbaiki melalui re-prompting terarah:

##### a. Error Leaflet Map saat Server-Side Rendering (Window is not defined)
- **Kendala:** Kode awal yang diberikan AI langsung mengimpor pustaka Leaflet pada komponen halaman Next.js. Hal ini menyebabkan error `ReferenceError: window is not defined` karena Leaflet mencoba mengakses objek browser saat Next.js masih me-render di sisi server.
- **Solusi Re-prompting:** *"Komponen Leaflet crash saat build karena dieksekusi di server. Tolong refactor MapView menggunakan next/dynamic dengan opsi ssr: false, dan pastikan Leaflet hanya di-load saat komponen sudah mount di sisi browser client."*

##### b. Desain Tampilan Awal Terlalu Kaku & Monoton (Generic Dashboard)
- **Kendala:** Tampilan awal yang dihasilkan AI terlihat sangat kaku seperti template admin perkantoran lama: tombol-tombol kecil tidak nyaman untuk layar HP, warna abu-abu datar, dan tidak memiliki identitas khas aplikasi civic modern.
- **Solusi Re-prompting:** *"Rombak UI LaporKuy agar lebih hidup dan modern untuk warga. Gunakan palet civic blue (#0057B8) dipadu aksen oranye pada tombol aksi lapor, buat kartu laporan dengan rounded corner yang lembut, tambahkan navigasi bottom bar untuk mobile, dan buat alur pelaporannya simpel dalam 3 langkah."*

##### c. Sinkronisasi Status Verifikasi Laporan antara Admin dan Frontend Warga
- **Kendala:** Ketika admin memverifikasi laporan di dashboard admin, perubahan status laporan tidak langsung terlihat di halaman warga tanpa harus me-refresh halaman secara manual.
- **Solusi Re-prompting:** *"Buatkan mekanisme sinkronisasi state dua arah. Ketika admin mengupdate status atau menambahkan catatan tindak lanjut dinas, perbarui tabel Supabase sekaligus dispatch custom event di browser agar tampilan laporan warga langsung ter-update secara otomatis."*

#### 3. Apakah ada komponen kode, desain visual, atau database yang tim anda buat/modifikasi secara manual tanpa bantuan AI? Jika ada, sebutkan bagian mana:

1. **Perancangan Skema Database Supabase & Data Seeding Nyata:** Kami merancang manual relasi tabel di Supabase (`reports`, `profiles`, `comments`, `quests`, `rewards`), menulis migrasi SQL, menyusun trigger pembuatan akun otomatis, serta menginput data awal laporan riil untuk area wilayah Kota Surabaya (Kecamatan Wonokromo, Sukolilo, Rungkut, Genteng, dsb.).
2. **Desain Identitas Logo SVG LaporKuy (`src/components/ui/logo.tsx`):** Logo resmi LaporKuy (perpaduan simbol megafon aspirasi warga, papan checklist laporan, dan gelombang suara) kami desain secara manual dalam bentuk kode vektor SVG murni (~1.5KB) tanpa dependensi gambar eksternal agar ringan dan tajam di semua ukuran layar.
3. **Kurasi Foto Kerusakan Lapangan & Uji Coba Langsung di Smartphone:** Pengambilan dan pemilihan foto kerusakan jalan dan fasilitas nyata untuk contoh aduan, serta pengujian langsung membuka website di HP fisik (layar 360px–414px) untuk memastikan tombol mudah dijangkau ibu jari saat dipakai di jalan.

---

Bogor, 13 September 2026

**Yang menyatakan,**  
**Ketua Tim**

*(Tanda Tangan)*

**<u>(Bendzanu Kamagifi)</u>**  
NISN: 0093389827

**Anggota Tim:**
- Arya Putra Pratama
- Muhammad Cahyaningrat
- Muhammad Raditya Utomo
