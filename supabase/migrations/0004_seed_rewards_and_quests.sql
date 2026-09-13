-- Migration: Seed official rewards and quests for LaporKuy v2.0
-- Description: Inserts standard catalog rewards and gamification quests

-- 1. Insert Rewards Catalog
INSERT INTO public.rewards (id, title, category, points_cost, stock, partner_name, description, image_url) VALUES
('r-cert', 'E-Sertifikat Kontributor Fasilitas Publik', 'Apresiasi Digital', 150, 50, 'Pemerintah Kota & LaporKuy', 'Sertifikat penghargaan resmi ber-barcode yang diterbitkan atas kontribusi aktif Anda dalam pelaporan dan perbaikan infrastruktur publik.', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'),
('r-badge', 'Bingkai Emas Profil & Titel Warga Peduli', 'Titel & Badge', 80, 100, 'Komunitas Warga LaporKuy', 'Aktifkan avatar dengan frame emas berkilau eksklusif dan sematkan gelar kehormatan Warga Peduli pada setiap aktivitas dan laporan Anda.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'),
('r-tree', 'Adopsi 1 Bibit Pohon Penghijauan Kota', 'Dampak Sosial', 200, 25, 'Dinas Lingkungan Hidup & Aksi Hijau', 'Dedikasikan 1 bibit pohon produktif untuk ditanam di Ruang Terbuka Hijau (RTH) kota Surabaya atas nama Anda lengkap dengan nomor akta tanam.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80'),
('r-fasttrack', 'Voucher Jalur Prioritas Layanan Publik', 'Layanan Publik', 350, 15, 'Mall Pelayanan Publik & Pemda', 'Tiket akses antrean jalur cepat (Fast Track Priority) untuk pengurusan administrasi sipil di Mall Pelayanan Publik (MPP) Surabaya.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80'),
('r-rec', 'Surat Pengakuan Kontribusi Warga Aktif', 'Apresiasi Digital', 120, 40, 'Pusat Aspirasi & Partisipasi Publik', 'Surat keterangan resmi apresiasi dedikasi warga sipil yang dapat dilampirkan pada portofolio pengabdian masyarakat, beasiswa, atau berkas resmi.', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80'),
('r-merch', 'Tumbler Eksklusif #LaporKuy', 'Dampak Sosial', 450, 10, 'LaporKuy Official Civic Store', 'Tumbler stainless steel 500ml tahan panas & dingin dengan ukiran nama akun Anda dan logo resmi LaporKuy peduli lingkungan.', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80'),
('r-wallet', 'Saldo E-Wallet / Pulsa Rp 25.000', 'Layanan Publik', 280, 30, 'GoPay / OVO / Telkomsel', 'Voucher saldo digital yang dapat dicairkan langsung ke nomor e-wallet atau nomor ponsel terdaftar pelapor.', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  points_cost = EXCLUDED.points_cost,
  stock = EXCLUDED.stock,
  partner_name = EXCLUDED.partner_name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url;

-- 2. Insert Gamification Quests
INSERT INTO public.quests (id, title, description, reward_points, progress, target, type, is_claimed, expires_in) VALUES
('q-1', 'Pelapor Harian', 'Laporkan minimal 1 kerusakan infrastruktur kota hari ini', 15, 0, 1, 'daily', false, 'Hari ini'),
('q-2', 'Verifikator Komunitas', 'Berikan dukungan (upvote) pada 3 laporan warga lain', 10, 0, 3, 'daily', false, 'Hari ini'),
('q-3', 'Penjelajah Wilayah', 'Laporkan masalah fasilitas di area target Kecamatan Gubeng', 50, 0, 1, 'weekly', false, '5 hari lagi'),
('q-4', 'Aksi Peduli Lingkungan', 'Laporkan titik tumpukan sampah liar atau saluran mampet ke DLH', 100, 0, 1, 'seasonal', false, '14 hari lagi')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward_points = EXCLUDED.reward_points,
  target = EXCLUDED.target,
  type = EXCLUDED.type,
  expires_in = EXCLUDED.expires_in;
