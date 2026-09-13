-- Migration: Seed official digital civic rewards and quests for LaporKuy v2.0
-- Description: Inserts standard in-app digital rewards (zero cash out-of-pocket) and gamification quests

-- Clean up any old cash / merchandise rewards
DELETE FROM public.rewards WHERE id IN ('r-wallet', 'r-merch', 'r-1', 'r-2', 'r-3', 'r-4');

-- 1. Insert In-App Civic Digital Rewards
INSERT INTO public.rewards (id, title, category, points_cost, stock, partner_name, description, image_url) VALUES
('r-badge', 'Bingkai Emas Profil & Titel Warga Peduli', 'Titel & Badge', 80, 100, 'Komunitas Warga LaporKuy', 'Aktifkan avatar dengan frame emas berkilau eksklusif dan sematkan gelar kehormatan Warga Peduli pada setiap aktivitas dan laporan Anda.', '/images/rewards/badge.jpg'),
('r-rec', 'Surat Pengakuan Kontribusi Warga Aktif', 'Apresiasi Digital', 120, 40, 'Pusat Aspirasi & Partisipasi Publik', 'Surat keterangan resmi apresiasi dedikasi warga sipil yang dapat dilampirkan pada portofolio pengabdian masyarakat, beasiswa, atau berkas resmi.', '/images/rewards/recommendation.jpg'),
('r-cert', 'E-Sertifikat Kontributor Fasilitas Publik', 'Apresiasi Digital', 150, 50, 'Pemerintah Kota & LaporKuy', 'Sertifikat penghargaan resmi ber-barcode yang diterbitkan atas kontribusi aktif Anda dalam pelaporan dan perbaikan infrastruktur publik.', '/images/rewards/certificate.jpg'),
('r-tree', 'Adopsi 1 Bibit Pohon Penghijauan Kota', 'Dampak Sosial', 200, 25, 'Dinas Lingkungan Hidup & Aksi Hijau', 'Dedikasikan 1 bibit pohon produktif untuk ditanam di Ruang Terbuka Hijau (RTH) kota Surabaya atas nama Anda lengkap dengan nomor akta tanam.', '/images/rewards/tree.jpg'),
('r-fasttrack', 'Voucher Jalur Prioritas Layanan Publik', 'Layanan Publik', 350, 15, 'Mall Pelayanan Publik & Pemda', 'Tiket akses antrean jalur cepat (Fast Track Priority) untuk pengurusan administrasi sipil di Mall Pelayanan Publik (MPP) Surabaya.', '/images/rewards/fasttrack.jpg')
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
