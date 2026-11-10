-- ═══════════════════════════════════════════════════════════════════════════
-- SIKLUS ANGGARAN & PROGRAM KERJA PPG SOLO SELATAN TAHUN 2026
-- Konversi Otomatis dari File Excel Resmi ke Skema Database Supabase
-- Total Anggaran Konsolidasi: Rp 617.385.000 (PPG: Rp 411.794.000 + KMM: Rp 205.591.000)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PERSIAPAN SKEMA KOLOM & TIPE DATA
ALTER TABLE IF EXISTS program_kerja
    ADD COLUMN IF NOT EXISTS kategori VARCHAR(20) DEFAULT 'PPG',
    ADD COLUMN IF NOT EXISTS sub_bidang VARCHAR(50),
    ADD COLUMN IF NOT EXISTS realisasi_status VARCHAR(50) DEFAULT 'belum_terlaksana',
    ADD COLUMN IF NOT EXISTS deskripsi_realisasi TEXT,
    ADD COLUMN IF NOT EXISTS realisasi_biaya NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tgl_realisasi DATE;

-- Pastikan penanggung_jawab_id dapat menampung nama bidang/sub-bidang secara langsung
ALTER TABLE IF EXISTS program_kerja DROP CONSTRAINT IF EXISTS program_kerja_penanggung_jawab_id_fkey;
ALTER TABLE IF EXISTS program_kerja ALTER COLUMN penanggung_jawab_id TYPE VARCHAR(255) USING penanggung_jawab_id::text;

-- Opsional: Hapus data proker lama jika ingin fresh-import bersih:
TRUNCATE TABLE program_kerja CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════
-- BAGIAN I: PROGRAM KERJA BIDANG PPG SOLO SELATAN (11 BIDANG)
-- Sub Total Rencana Anggaran PPG: Rp 411.794.000
-- ═══════════════════════════════════════════════════════════════════════════


-- ── BIDANG: BENDAHARA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 1, 'Mengontrol Penggunaan Semua Dana Kegiatan PPG', 'Tiap Kegiatan/ tiap bulan', 'Sie / Bidang PPG',
    'Laporan Pertanggungjawaban Keuangan Setiap Kegiatan PPG', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Bendahara', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 2, 'Konsumsi Musyawaroh Pleno PPG', 'Tiap Bulan', 'Peserta Musyawarah PPG',
    'Konsumsi Musyawarah PPG', '10 pertemuan x (30 Orang x 15.000) x @ Rp. 450.000', 4500000, 'Sampangan',
    'direncanakan', 'daerah', 'Bendahara', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 3, 'Konsumsi Buka Bersama', 'Bulan Romadhon', 'Peserta Musyawarah PPG',
    'Konsumsi acara buka bersama', '55 x 40.000', 2640000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Bendahara', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 4, 'Pemberian Dana Rutin Tiap Pokja', 'Tiap Bulan', 'Tiap Pokja',
    'Dana Operasional di Tiap Pokja', '5 x Rp. 500.000 X 12 bln', 30000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Bendahara', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: SEKRETARIS ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 5, 'Tata Kelola Administrasi dan Kearsipan PPG', 'Tiap Bulan', 'Generus / Pengurus PPG Solo Selatan',
    'Mencatat, mengadministrasi dan mendistribusikan hasil kegiatan dalam PPG (hasil musyawaroh, surat menyurat, proposal kegiatan, laporan dll)', '12 X Rp. 200.000', 2400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Sekretaris', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 6, 'Memperbarui database generus lengkap mulai dari caberawit s/d usia Pranikah, pengajar baik MT, MS dan assistent pengajar', 'Triwulan (Jan, April, Juli, Okt)', 'Sekretaris PPG, GP, POKJA & KMM',
    'Memperbarui database generus lengkap mulai dari caberawit s/d usia Pranikah, pengajar baik MT, MS dan assistent pengajar', '0', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Sekretaris', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 7, 'Laporan pencapaian materi dan presensi tiap pokja', 'Triwulan (September, Desember, Maret, Juni)', 'Generus / Pengurus PPG Solo Selatan',
    'Jan - Maret : April April - Juni : Juli Juli - Sept : Oktober Oktober - Des : Jan - Teknis pengisian lewat Google Form, dikirim ke daerah tiap bulan', 'Fotocopy 4 x Rp. 50.000', 200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Sekretaris', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 8, 'Pembuatan kaleidoskop kegiatan PPG Solo Selatan', 'Setiap Kegiatan PPG', 'Generus / Pengurus PPG Solo Selatan',
    'Menginventarisir dokumentasi kegiatan2 yang diadakan PPG', 'Cetak 1 Album & Pendokumentasian di distribusikan ke POKJA', 2400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Sekretaris', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 9, 'Studi banding &Rekreasi Pengurus', 'Agenda di tahun 2026', 'Pengurus PPG Solo Selatan',
    'Mendukung program kerja PPG Solo Selatan', 'Akomodasi Pengurus Rp 300.000 x 60 org', 18000000, 'Batu-Malang Elo (Magelang) Pantai Gn. Kidul Saloka Park Tubing Klaten',
    'direncanakan', 'daerah', 'Sekretaris', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 10, 'Workshop Penyusunan Program Kerja TA 2027', 'Desember ''26', 'Pengurus PPG (sudah Termasuk Cenderamata)',
    'Mendukung program kerja PPG Solo Selatan', 'Rp. 15.000.000', 15000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Sekretaris', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 11, 'Terobosan Sekretaris PPG Daerah ke POKJA', 'Tiap Semester', 'Sekretaris POKJA',
    'Konsolidasi pengurus dan penguatan tim', '5 x 2 x Rp 50,000', 500000, 'Tiap-tiap Pokja',
    'direncanakan', 'daerah', 'Sekretaris', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: KURIKULUM ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 12, 'Koordinasi Progam Bidang Kurikulum, Bidang Tenaga Pendidik dan Sekretaris', 'Januari; Juni 2026', 'Bidang Kurikulum, Tenaga Pendidik, dan Sekretaris',
    'Pelaksanaan KBM GP berjalan sesuai harapan Bid. Kurikulum', '19 orang x Rp 30.000 x 2', 1140000, 'Semanggi',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 13, 'Pembuatan buku target materi GP', 'Awal ajaran baru tahun 2026 (soft file)', 'Semua GP',
    'Sebagai perangkat Pembelajaran GP Se - Daerah', 'Rp -', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 14, 'Sosialisasi target materi', '3 bulan sekali', 'Pengajar Generus',
    'Kelancaran target materi', 'Rp -', 0, 'Pengajian MT se daerah',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 15, 'Sosialisasi dan sharing perangkat KBM', 'Januari s/d Februari; Juli s/d Agustus', 'Ketua Pokja, PJ KBM Kelompok, Desa, Sekretaris',
    'Melancarkan pengisian perangkat KBM', '5 x Rp 200.000 x 2', 2000000, 'Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 16, 'Pembuatan laporan pencapaian target materi: a. Caberawit', 'Tiap semester (kerjasama dengan sekretaris PPG)', 'PJ KBM Kelompok dan Sekretaris Kelompok',
    'Monitoring dan evaluasi', 'Soft file (Rp.0)', 0, 'Tiap Kelompok (google form)',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 17, 'Pembuatan laporan pencapaian target materi: a. Caberawit: b. Pra Remaja dan Remaja', 'Tiap semester (kerjasama dengan sekretaris PPG)', 'Sekretari Pra Remaja dan Remaja',
    'Monitoring dan evaluasi', 'Soft file (Rp.0)', 0, 'Tiap Pokja (google form)',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 18, 'Menyusun Program Kegiatan Muda Mudi (daerah-desa-kelompok)', '1 tahun', '- Kurikulum - KMM - Kemandirian',
    'Menyelesaikan materi garis – garis besar', 'Soft file (Rp.0)', 0, 'Daerah, desa, kelompok',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 19, 'Pengoptimalan target materi pra nikah 1 s/d 4 a. Kerjasama dengan PNKB b. Kerjasama dengan Bidang Kemandirian c. Kerjasama dengan Bidang KMM', 'Januari; Juni 2026', 'Pra Nikah 1 s/d 4',
    'Pengoptimalan target', '2 x Rp.500.000', 1000000, 'Semanggi',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 20, 'Penyeragaman materi jenjang Pra Nikah 1 – 4 : a. Klasikal : Al – Quran Juz 3 Kitabu Manasikil Haji', 'Tiap bulan', 'Jenjang pra nikah',
    'Semangat dalam mencari ilmu', 'Rp.0', 0, 'Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 21, 'Penyeragaman materi jenjang Pra Nikah 1 – 4 : a. Klasikal : Al – Quran Juz 3 Kitabu Manasikil Haji: b. Tematik : Kerjasama dengan bidang KMM dan Kemandirian', 'Tiap bulan', 'Jenjang pra nikah',
    'Meningkatkan daya juang', 'Rp.150.000 x 10 x 5 pokja (narsum)', 7500000, 'Pokja (PR membuat materi)',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 22, 'Buku Pegangan Guru : a. Pengadaan Buku Pegangan Guru jenjang pra remaja dan remaja', 'Januari 2026', 'Semua Guru GP',
    'Sebagai Pegangan dalam penyampaian Materi KBM', '100 x Rp10.000', 1000000, 'Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 23, 'Buku Pegangan Guru : a. Pengadaan Buku Pegangan Guru jenjang pra remaja dan remaja: b. Pengadaan Buku prestasi jenjang Caberawit', 'Januari 2026', 'Semua Guru Caberawit',
    'Sebagai Pegangan dalam penyampaian Materi KBM', '100 x Rp6.000', 600000, 'Kelompok',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 24, 'Buku Pegangan Guru : a. Pengadaan Buku Pegangan Guru jenjang pra remaja dan remaja: c. Pengadaan Latihan Makna Juz 30', 'Januari 2026', 'Caberawit kelas 5-6 SD',
    'Sebagai Pegangan dalam penyampaian Materi KBM', 'Anggaran masuk di bidang Sarpras', 0, 'Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 25, 'Buku Pegangan Guru : a. Pengadaan Buku Pegangan Guru jenjang pra remaja dan remaja: d. Lembar Pembiasaan', 'Januari – Desember 2026', 'Caberawit sedaerah',
    'Membiasakan 29 karakter luhur', 'Rp.1.500 x 600 pcs (Rp.900.000 x 6)', 5400000, 'Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 26, 'Independent Day: a. Caberawit', '-Mei 2026 -September 2026', 'Caberawit per desa',
    'Peningkatan karakter dan Peningkatan sdm', '2 x 5 POKJA x Rp 2.000.000', 20000000, 'Tiap Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 27, 'Independent Day: a. Caberawit: b. Pra Remaja dan Remaja', 'Januari / Februari 2026', 'Pra Remaja dan Remaja per desa',
    'Peningkatan karakter dan Peningkatan sdm', '5 x Rp 2.000.000', 10000000, 'Tiap pokja',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 28, 'Pengadaan Rapor : Penggandaan Rapor', 'Juli 2026 - Jan 2027', 'PJ KBM Pokja',
    'Dibagikan ke setiap siswa GP', 'Soft file (Rp.0)', 0, '5 Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 29, 'Evaluasi Akhir Semester (1, 2):', 'Jun 2026 Des 2026', 'Pj KBM Pokja',
    'Mengukur dan menilai pencapaian kompetensi siswa selama satu semester pembelajaran', 'Soft file (Rp.0)', 0, '5 Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 30, 'Evaluasi Akhir Semester (1, 2):: 11.1. Pembuatan soal evaluasi GP (caberawit, pra remaja, dan remaja)', 'Mei 2026 Des 2026', 'Bid. Kurikulum',
    'Alat Evaluasi pelaksanaan KBM GP se Daerah', 'Soft file (Rp.0)', 0, '5 Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 31, 'Evaluasi Akhir Semester (1, 2):: 11.2. Penggandaan soal', 'Mei 2026 Des 2026', 'Pokja',
    'Dibagikan ke setiap siswa GP', 'Soft file (Rp.0)', 0, '5 Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 32, 'Evaluasi Akhir Semester (1, 2):: 11.3. Pelaksanaan evaluasi GP', 'Juni 2026 Des 2026', 'Pokja',
    'Evaluasi pelaksanaan KBM GP se Daerah', 'Soft file (Rp.0)', 0, '5 Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 33, 'Evaluasi Akhir Semester (1, 2):: 11.4. Pembagian rapor dan reward', 'Ags 2026 Jan 2027', 'Pokja',
    'Motivasi Siswa GP dalam mengikuti KBM', '2 smt x 5 pkj x 6 org SMP x Rp75.000 = Rp4.500.000 2 smt x 5 pkj x 6 org SMA x Rp75.000 = Rp4.500.000', 9000000, 'Pengajian Remaja Desa (Rapor diambil Orangtua/Wali siswa GP)',
    'direncanakan', 'daerah', 'Kurikulum', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 34, 'Asrama Liburan Sekolah', 'Tiap Liburan Semester Sekolah', 'Seluruh siswa GP',
    'Penuntasan Target Materi dan menambah kepahaman agama', '2 x 5 POKJA x Rp300.000', 3000000, '5 Pokja',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 35, 'Pengadaan buku monitoring Kurikulum PPG ke kelas a. Caberawit', 'Tiap 5 Bulan sekali', '- Koordinator kelompok, desa - Sekretaris pra remaja - Remaja - Sekretaris ppg - MT',
    'Memonitor pelaksanaan KBM pra remaja dan remaja setelah satu bulan', '10 x Rp200.000', 2000000, '5 Pokja Kerjasama dengan sekre PPG',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 36, 'Pengadaan buku monitoring Kurikulum PPG ke kelas a. Caberawit: b. Pra Remaja dan Remaja', 'Tiap 5 Bulan sekali', '- Koordinator kelompok, desa - Sekretaris pra remaja - Remaja - Sekretaris ppg - MT',
    'Memonitor pelaksanaan KBM pra remaja dan remaja setelah satu bulan', '-', 0, '5 Pokja Kerjasama dengan sekre PPG',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 37, 'Sosialisasi dan koordinasi bidang kurikulum dengan PJ', '4 kali setahun', '1. Sekretaris ppg 2. Ketua pokja 3. Ketua remaja desa 4. Mubaligh desa 5. Koordinator gp 6. Pj caberawit desa',
    'Menyamakan visi – misi kurikulum', 'Snack 4 x 40 org x Rp. 10.000 Coffe break 4 x Rp. 150.000 Makan 4 x 40 org x Rp.20.000', 5400000, 'Gentan',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 38, 'Musyawarah Rutin Bidang Kurikulum', 'Tiap Bulan (Minggu pertama)', 'Bidang Kurikulum',
    'Kemajuan PPG Solo Selatan khususnya di Bid. Kurikulum', '11 bln x Rp90.000', 990000, 'Desa Barat',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 39, 'Pembuatan Proker Kurikulum 2027', '2026-11-01', 'Bidang Kurikulum',
    'Pengelolaan dan pelaksanaan pendidikan berjalan dengan baik, terarah, dan sesuai dengan kebutuhan.', '-', 500000, 'Semanggi',
    'direncanakan', 'daerah', 'Kurikulum', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: TENAGA PENDIDIK ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 40, 'Asrama Tilawati', '6 Bulan sekali (Jan, Jul)', 'Semua Guru Caberawit, MT-MS',
    'Untuk meningkatkan kwalitas guru', '15.000 x 80 org x 2 kali', 2400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 41, 'Pelatihan BCM Tematik', '6 Bulan sekali (Mar, Okt)', 'Guru Caberawit, MT',
    'Meningkatkan kemampuan guru caberawit dalam BCM', '15.000 x 80 org x 2 kali', 2400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 42, 'Dana Insentif Guru GP dan Admin GP', 'Setiap Bulan', 'Semua Guru GP',
    'Menmbah motifasi para guru GP', '10.000 x 6 guru / pertemuan x 9 hari dalam 1 bulan x 12 bln x 5 pokja', 32400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 43, 'Pertemuan Guru GP KBM dan PJP', '4 bulan sekali (Jan, Mei, Sept)', 'Guru GP dan KOORDINATOR',
    'Untuk Sharing guna mencari solusi-solusi', '8000 x semua guru GP dan PJP Desa', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 44, 'Pertemuan Sie Tendik', 'Setiap Bulan', 'Semua Sie TENDIK',
    'Untuk evaluasi bulanan kegiatan KBM Desa', '10.000 x 11 org x 12 bulan', 1320000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 45, 'Stimulan THR untuk PJ KBM Desa dan PJ KBM Kelompok', 'Ramadhan 26', 'PJ KBM Kelompok, dan Desa',
    'Mendukung program kerja PPG Solo Selatan', '100.000 x 32 org', 3200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 46, 'Peningkatan Kompetensi Guru 3 target : - Managemant Kelas - Penggunaan Metode Pembelajaran - Pengendalian Emosi Anak Didik', '4 bulan sekali (Jan, Mei, Sept)', 'Semua Guru GP',
    'Untuk meningkatkan kompetensi guru', '5000 x semua guru GP (150 orang) x 3 kali', 2250000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tenaga Pendidik', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: SARANA DAN PRASARANA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 47, 'Pembelian Sarana-Prasarana Penunjang Kurikulum Pembinaan Generus di Solo Selatan Tahun anggaran 2026', '2026', 'Pokja I Bp.Agung K Pokja II ….. Pokja III Bp. M Musthofa Pokja IV Bp. H Abu Bakar Pokja V Bp. Mahfudz',
    'Memfasilitasi Kitab/Materi bagi siswa', 'Terlampir', 60890000, 'Daerah',
    'direncanakan', 'daerah', 'Sarana dan Prasarana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 48, 'Penambahan Sarana-Prasarana Penunjang KBM Pembinaan Generus di Solo Selatan Tahun anggaran 2026', '2026', 'Generus / Pengurus PPG Solo Selatan',
    'Menambah Sarana-prasarana penunjang kegiatan pembinaan Generus (daerah, desa, kelompok.', '-', 90944000, 'Daerah',
    'direncanakan', 'daerah', 'Sarana dan Prasarana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 49, 'Koordinasi rutin Sie Sarpras PPG', 'Tiap 4 bulan Sekali ( April, Agust, Des )', 'Generus / Pengurus PPG Solo Selatan',
    'Mendukung program kerja PPG Solo Selatan', '50.000 x 3 bln', 150000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Sarana dan Prasarana', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 50, 'Pembuatan Database Sarpras Se Daerah', 'Tahun 2026', 'DAERAH, POKJA, KELOMPOK',
    'Mendukung program kerja PPG Solo Selatan', '-', 1000000, 'DAERAH POKJA KELOMPOK',
    'direncanakan', 'daerah', 'Sarana dan Prasarana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: PENGGALANG DANA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 51, 'Mengoptimalkan Shadaqoh PPG berdasar IR. • Punya Mobil/Haji/ASN ( APARATUR SIPIL NEGARA )/Pengusaha min: Rp. 25.000,- • IR 10% min: Rp. 15.000,- • IR 7.5 % min: Rp. 7.500,- • IR 5% min: Rp. 5.000,-', 'Tiap Bulan', 'Jamaah wajib IR',
    'Untuk pembelaan program pembinaan generasi penerus', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 52, 'Mengoptimalkan target COIN PPG perKK/Bulan @Rp. 15.000', 'Tiap Bulan', 'Jamaah',
    'Mendukung program kerja PPG Solo Selatan', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 53, 'Mengoptimalkan target COIN PPG perKK/Bulan @Rp. 15.000: Kualifikasi per KK ialah : 1. Remaja yang sudah berpenghasilan (perantauan), 2. IR nya yang masuk ke Solo Selatan, 3. Single Parent, 4. Kebijakan masing-masing Kyai Kelompok', 'Tiap Bulan', 'Jamaah',
    'Mendukung program kerja PPG Solo Selatan', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 54, 'Mengoptimalkan INFAK shodaqoh pada saat pleno PPG', 'Tiap bulan', 'Semua pengurus PPG',
    'Mendukung program kerja PPG Solo Selatan', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 55, 'Penggalian Dana Lewat Kesanggupan seluruh JM se-Daerah', 'Tahun 2026', 'Seluruh JM se Daerah',
    'Mendukung program kerja PPG Solo Selatan', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 56, 'Mengoptimalkan shodaqoh pada saat pengajian umum daerah', 'Tiap Bulan', 'Seluruh jamaah',
    'Mendukung program kerja PPG Solo Selatan', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 57, 'Pembuatan kartu pembelaan PPG', 'Bulan Desember', 'Seluruh jamaah yg wajib IR',
    'Mendukung program kerja PPG Solo Selatan', '-', 2000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Penggalang Dana', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: SENI DAN OLAHRAGA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 58, 'Latihan Asad Keras', '1 bulan 1 kali', 'Usia SMP DAN SMA',
    'Penjagaan diri dan untuk kerukunan dan kekompakan', '6000 x 260 anak x 12 bulan', 18720000, '5 pokja',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 59, 'Sepak Bola Caberawit', 'Liburan sekolah', 'Caberawit SD kelas 6',
    'Kerukunan dan ke kompakan,pengenalan SMP Asyifah', '-', 7000000, 'SMP Asy-Syifa Sukoharjo Boarding School (@smpasbs)',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 60, 'Pasang Giri Caberawit', 'Liburan srkolah', 'caberawit',
    'Kerukunan dan kekompakan antar caberawit', '-', 6000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 61, 'ACSESSORIS ASAD: a. Body Protector', 'Tahun 2026', 'Generus / Pengurus PPG Solo Selatan',
    'Inventaris dan Sarana Prasarana Olahraga', '400.00 x 2', 800000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 62, 'ACSESSORIS ASAD: b. Handel rintangan lompat', 'Tahun 2026', 'Generus / Pengurus PPG Solo Selatan',
    'Mendukung program kerja PPG Solo Selatan', '20 x 35.000', 700000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 63, 'ACSESSORIS ASAD: c. Pelindung kemaluan (Genitle)', 'Tahun 2026', 'Generus / Pengurus PPG Solo Selatan',
    'Mendukung program kerja PPG Solo Selatan', '2 x 150.000', 300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 64, 'ACSESSORIS ASAD: d. Pelindung tulang kering dewasa', 'Tahun 2026', 'Generus / Pengurus PPG Solo Selatan',
    'Mendukung program kerja PPG Solo Selatan', '2 x 150.000', 300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 65, 'ACSESSORIS ASAD: e. Kun 1 set', 'Tahun 2026', 'Generus / Pengurus PPG Solo Selatan',
    'Mendukung program kerja PPG Solo Selatan', '@ 100.000', 100000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Seni dan Olahraga', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: KEMANDIRIAN ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 66, 'Koordinasi Tim Kemandirian', '1x / Bulan', 'Anggota Bidang Kemandirian',
    'Koordinasi, Evaluasi dan Musyawarah Intern Bidang kemandirian', 'Konsumsi @10.000 X 4 Orang X 12 Bulan', 480000, 'FLEKSIBEL',
    'direncanakan', 'daerah', 'Kemandirian', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 67, 'Pembimbingan Pembuatan Surat Lamaran Pekerjaan', 'September', 'Remaja Usia 19 thn keatas (2 Orang per Klp)',
    'Pembimbingan Tata Cara Pembuatan Surat Lamaran Pekerjaan', 'Kertas Bergaris 1 Rim Rp 300.000 Snack Rp 8.000 x 70 Orang = 560.000', 860000, 'Daerah',
    'direncanakan', 'daerah', 'Kemandirian', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 68, 'Penyusunan Program Kemandirian Caberawit Se-Daerah', '2 x / Bulan (Rabu, Minggu I & III) - Total 24 x Pertemuan Setahun', 'Caberawit di Masing-Masing Kelompok',
    'Melatih Kemandirian Caberawit', 'Pembuatan Hard File Rp 200.000 Soft File Rp 0', 200000, 'Pengajian Caberawit Kelompok',
    'direncanakan', 'daerah', 'Kemandirian', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 69, 'Pelatihan Online Shop', 'Juni 2026 & November 2026', 'Remaja Daerah Usia 20 Tahun Keatas',
    'Melatih Usaha Jual Beli Online dan Jenis-Jenisnya', 'Pembuatan Hard File Rp 200.000 X 2 Soft File Rp 0', 400000, 'Pengajian Remaja Daerah',
    'direncanakan', 'daerah', 'Kemandirian', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: KEPUTRIAN ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 70, 'Thoharoh (Praktik Mandi Junub & Wudhu)', '8 Februari 2026', 'Caberawit kelas 4, 5, 6 & SMP',
    'Memberikan edukasi pada Generus terkait mensucikan Najis', '-', 2000000, 'Daerah',
    'direncanakan', 'daerah', 'Keputrian', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 71, 'Seminar Keputrian (Kolaborasi dengan "FORIDA")', 'September', 'Remaja',
    'Mempersiapkan diri menjadi pasangan/menantu', '-', 2200000, 'Daerah',
    'direncanakan', 'daerah', 'Keputrian', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 72, 'Koordinasi Tim Keputrian PPG', 'Caturwulan sekali', 'Pengurus Keputrian PPG',
    'Koordinasi dan evaluasi Program Kerja', 'a. Konsumsi : @ 100.000 x 3 x pertemuan', 300000, 'Daerah',
    'direncanakan', 'daerah', 'Keputrian', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 73, 'Pelatihan Pembuatan Totebag Painting', 'Juli', 'Remaja',
    'Melatih kemandirian remaja dalam membuat perlengkapan rumah tangga, Perwakilan klompok 2 orang', '-', 1650000, 'Daerah',
    'direncanakan', 'daerah', 'Keputrian', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: BIMBINGAN KONSELING ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 74, 'Buku Solusi / Buku Konseling', 'Januari - Desember', 'Konselor Kelompok / BK',
    'Tempat menulis permasalahan dan solusi-solusi yang ada di kelompok-kelompok', 'Print out lembar konseling 10.000 x 27 = 270.000', 270000, 'daerah',
    'direncanakan', 'daerah', 'Bimbingan Konseling', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 75, 'Pembuatan Buku Panduan/ Pegangan Konselor Kelompok', 'Januari', 'Konselor Kelompok / BK',
    'Sebagai panduan konselor kelompok dalam tugas amal sholih dan tahapan saat konseling generus yang ada di kelompok-kelompok', 'Cetak buku saku konselor Rp.15.000 x 27 = 405.000', 405000, 'daerah',
    'direncanakan', 'daerah', 'Bimbingan Konseling', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 76, 'Update Data Generus yang mempunyai permasalahan', 'Januari - Desember', 'Konselor Kelompok / BK',
    'Menulis permasalahan dan solusi-solusi yang ada di kelompok - kelompok', '-', 0, 'daerah',
    'direncanakan', 'daerah', 'Bimbingan Konseling', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 77, 'Koordinasi Konselor Kelompok se daerah (2 bulan sekali)', '2 bulan sekali', 'Konselor Kelompok / BK',
    'Sharing/ diskusi terkait konseling dan pemecahan masalah generus kelompok sedaerah.', 'Musyawarah koordinasi konselor sedaerah 7.500 x 40 orang x 5 pertemuan', 1500000, 'daerah',
    'direncanakan', 'daerah', 'Bimbingan Konseling', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 78, 'Pelatihan “Mendengar Aktif bagi Konselor”', 'April 2026', 'Konselor Kelompok / BK',
    'Pelatihan konseling materi dasar menjadi konselor.', 'Copy materi dan perlengkapan 75.000 snack 5.000 x 35 = 175.000 Ukhro pemateri (dari luar) 300.000 MMT 75.000', 325000, 'daerah',
    'direncanakan', 'daerah', 'Bimbingan Konseling', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 79, 'Parenting Skill generus bersama orang tua.', 'Juli 2026', 'Konselor Kelompok / BK/ Orang tua',
    'Seminar orang tua bersama anak atau generus.', '-', 1050000, 'POKJA',
    'direncanakan', 'daerah', 'Bimbingan Konseling', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ── BIDANG: TAHFIDZ ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 80, 'Penjaringan dan Pendataan generus yang minat dan mampu ikut program menghafal Al-Quran', 'Semester 1', 'Semua generus',
    'Memberikan motivasi untuk generus supaya mau mengikuti program tahfid serta mendata para generus yang berminat untuk ikut program tahfidz', '-', 500000, 'Kelompok masing masing',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 81, 'Ujian Hafalan Tingkat Desa', '1x/semester', 'Peserta Tahfidz sedesa',
    'Memberikan nasehat dan motivasi bagi para generus yang mengikuti Program Tahfidz Al-Quran', '5 desa x 2 semester x 700.000', 7000000, 'Desa Masing-masing',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 82, 'Ujian Hafalan Tingkat Daerah', '1x/setahun', 'Peserta Tahfidz Sedaerah',
    'Menguji kemampuan hafalan para Peserta Didik Tahfidz', 'Snack 2.000.000, MMT dll 500.000', 3000000, 'Di Daerah',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 83, 'Sosialisasi Guru Pengajar Tahfidz', '1x/setahun', 'Semua koor Tahfidz & Semua Guru Tahfidz',
    '"Meningkatkan kualitas kemampuan dalam mengajar para Guru Tahfidz Memberikan motivasi kepada para guru Tahfidz dan Koor Tahfidz agar semangat dalam pembinaan Tahfidz"', '70 orang x 8.000', 560000, 'Di daerah /di tiap desa',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 84, 'Turba ke Kelompok / Desa', '1x / setahun', 'KBM Tahfidz Kelompok se daerah',
    'Melakukan kontrol terhadap kelancaran program Tahfidz Al-Qur’an yang ada di tingkat kelompok', '-', 500000, 'Kelompok masing masing',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 85, 'Pembuatan Journal, Lembar pantau hafalan dan perlengkapan KBM Tahfidz kelompok', 'Pembagian di bulan desember', 'Untuk tiap kelompok',
    'Memudahkan dalam pengecekan dan evaluasi pelaksanaan KBM Tahfidz', '50.000 x 27 kelompok', 1350000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tahfidz', 2, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 86, 'Musyawarah Koordinasi Rutin', 'Setiap Bulan', 'Koordinator Tahfid Desa dan Daerah',
    'Mengevaluasi semua kegiatan Tahfidz serta merencanakan kegiatan yang akan di laksanakan', '12x100.000', 1200000, 'Semanggi',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 87, 'Kelas Tahfidz Tingkat Daerah', '1x / Bulan', 'Koordinator Tahfid Desa dan Daerah',
    'Mengoptimalkan potensi peserta tahfidz yang memiliki kemampuan atau bakat dalam menghafal Al Qu''an', '12x500.000', 6000000, 'Di daerah / Digilir tiap desa',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 88, 'Pengadaan Al Qur''an Hafalan', 'Semester 1', 'Koordinator Tahfid Daerah',
    'Memfasilitasi peserta tahfidz dalam menghafal Al Qur''an', '20 x100.000', 2000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'Tahfidz', 1, 'PPG', NULL,
    'belum_terlaksana', 0
);

-- ═══════════════════════════════════════════════════════════════════════════
-- BAGIAN II: PROGRAM KERJA KEGIATAN MUDA-MUDI (KMM) - 9 DIVISI RESMI
-- Sub Total Rencana Anggaran KMM: Rp 205.591.000
-- ═══════════════════════════════════════════════════════════════════════════


-- ── DIVISI KMM: UMUM ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 1, 'Camping CAI Sedaerah (Outdoor/indoor)', 'Bulan Juni - Juli (pindah lokasi)', 'Pengurus Remaja Daerah',
    '1. Menumbuhkan kesemangatan dan militansi dalam perjuangan QHJ. 2. Meningkatkan Kreatifitas para Generus. 3. Penggalian potensi dan kemampuan Para Generus. 4. Melatih kedisiplinan dan keuletan para Generus. 5. Menanamkan pada Generus yang berjiwa berilmu, akhlaqulkarimah, dan mandiri.', 'Outdoor', 60000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 2, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 2, 'Musyawaroh Rutin Remaja Daerah', 'Setiap Bulan', 'Pengurus Remaja Daerah',
    'Koordinasi pengurus Remaja se-Daerah (Daerah & Desa), Shodaqoh air minum dari Desa yang ditempati', 'Rp. 200.000 X 12 bulan', 2400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 1, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 3, 'Pengajian Remaja Daerah', 'Setiap Bulan', 'Pengurus Remaja Daerah',
    'Pengajian Remaja tersentral se-Daerah.Solo Selatan. pengajian : 1. dikategorikan sesuai usia 3 kelas 2. dikategorikan sesuai usia 2 kelas 3. gabungan', '> Snack Pengajian 5000 x 600 x 12 = 36.000.000 > Konsumsi Piket 10 x 10.000 x 12 = 1.200.000 > Snack Pemateri 6 x 8.000 x 12 = 576.000', 37776000, 'Masjid Roudhotul Jannah, Pucang Sawit',
    'direncanakan', 'daerah', 'KMM - Umum', 1, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 4, 'Penyusunan Proker Remaja Daerah 2027', 'Sebelum Workshop PPG (November - Desember)', 'Pengurus Remaja Daerah',
    'Menyusun Program Kerja Remaja Daerah selama 1 tahun kedepan', '> Konsumsi Peserta (makan & Snack) 40.000 x 50 org > Cofee Break 200.000 > ATK 100.000', 2300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 2, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 5, 'Festival Anak Sholeh 2026', 'Bulan Oktober (Insyallah di daerah lagi)', 'Pengurus Remaja Daerah',
    'Sarana evaluasi kesiapan dan kemampuan para generasi penerus pada bidang kajian tingkat caberawit dan remaja.', 'Outdoor', 50000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 2, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 6, 'Peningkatan Kapasitas Pengurus Remaja', 'Mei / Juni', 'Tim Inti Remaja Daerah',
    'Sarana kerukunan dan kekompakan antar personil dalam kepengurusan remaja se-Daerah', 'Subsidi Transportasi & Konsumsi', 5000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 1, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 7, 'Kelas "Master Of Ceremony"', 'Januari - Maret', 'Tim Inti Remaja Daerah',
    'Sebagai wadah regenerasi pengisi acara yang dimunculkan lewat generus yang ada di desa desa - diagendakan 4x pertemuan/bulan, dilaksanakan selama 3 bulan - Diampu Oleh H. RM. Suharno, S. Kar', '> Snack 25 org x 7.000,- x 12 pertemuan > Ukhro Pengisi 1 org x 50.000,- 12 Pertemuan', 2700000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 1, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 8, 'Kaderisasi', 'April', 'Tim Inti Remaja Daerah',
    'Sarana evaluasi kesiapan dan kemampuan para generasi penerus sebagai ganti dari generasi sebelumnya.', '30 orang, peserta dan panitia , konsumsi @15rb 1.800.000, Snack 300.000, perkap dan transport 500.000, acara 1.000.000, dekdok & taman media 300.000,', 3900000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 1, 'KMM', 'Umum',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 9, 'Semalam Suntuk malam tahun baru', 'Desember', 'Remaja & Muda-Mudi Daerah',
    'Mendukung program kerja KMM Daerah', 'Subsidi ke desa 1.000.000 x 5', 5000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Umum', 2, 'KMM', 'Umum',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: SEKRETARIS ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 10, 'Presensi Pengajian', '- Januari - April - Juli/Agustus - Oktober', 'Sekretaris Remaja Daerah',
    '1. Monitoring kehadiran Remaja saat Pengajian Remaja Daerah 2. Pembuatan Presensi setiap 3 bulan (Pengajian Remaja Daerah) 3. Presensi yang dibuat untuk 27 kelompok 4. Presensi dicetak menggunakan kertas BC', 'Kertas BC – 1 th 5 Pack, @ 25.000', 125000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Sekretaris', 2, 'KMM', 'Sekretaris',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 11, 'Pembuatan Laporan (Merekap) Presensi Pengajian Remaja Daerah', 'Setiap Bulan Daerah', 'Sekretaris Remaja Daerah',
    '1. Monitoring kehadiran Pengajian Remaja Daerah 2. Memfoto copy Presensi dan dibagikan ke Kyai Kelompok saat musyawaroh Umum Daerah 3. Memfoto copy Presensi dan dibagikan ke Ketua Remaja Desa saat musyawaroh Remaja Daerah untuk didistribusikan ke Kepengurusan Remaja Kelompok 4. Membuat Laporan Persentase kehadiran Pengajian 5. Monitoring dan evaluasi kegiatan setiap kelompok. 6. Update data base, follow up (setiap bulan)', 'Per Bulan 30.000', 360000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Sekretaris', 1, 'KMM', 'Sekretaris',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 12, 'Pendistribusian Jurnal Kegiatan Kelompok', 'Setiap bulan dimulai bulan Januari (Kelompok.)', 'Ketua Remaja Desa dan ketua Remaja kelompok',
    '1. Form dibuat sekretaris Remaja Daerah dan di serahkan ke Desa untuk didistribusikan ke Kelompok 2. Pelaporan setiap 6 bulan sekali 3. Kelompok melaporkan kegiatan pengajian lewat form yang disediakan oleh remaja daerah 4. Desa melaporkan kegiatan pengajian lewat form yang disediakan oleh remaja daerah', '(SoftCopy)', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Sekretaris', 1, 'KMM', 'Sekretaris',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 13, 'Koordinasi Sekretaris / Penerobos remaja se-daerah', '2 kali setahun bulan Januari / april', 'Sekretaris Remaja Daerah',
    'Sekretaris/ penerobos Remaja Kelompok, Desa, Daerah; Tujuan : Mempermudah penyampaian Informasi/pengecekan data', '8.000 x 35 peserta x 2 pertemuan', 560000, 'juni / oktober (menyesuaikan sekretaris PPG)',
    'direncanakan', 'daerah', 'KMM - Sekretaris', 2, 'KMM', 'Sekretaris',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 14, 'Pembuatan Tabel Pelaksaan Proker/ Timeline kegiatan remaja daerah', '2026-01-01', 'Sekretaris Remaja Daerah',
    'digunakan sebagai pengingat masing – masing bidang remaja daerah', 'FC 15.000 x 9 bid. :', 135000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Sekretaris', 1, 'KMM', 'Sekretaris',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: BENDAHARA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 15, 'Melaporkan keuangan muda-i daerah kepada KU daerah melalui ketua remaja daerah.', 'Tahun 2026', 'KU remaja daerah',
    'mengikuti jadwal BPK (laporan 4 bulan sekali)', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Bendahara', 1, 'KMM', 'Bendahara',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 16, 'Shodaqoh setiap remaja Rp. 1000', 'Setiap bulan Kelompok-Desa-Daerah (Pukul 21.00 WIB saat musyawaroh remaja daerah)', 'KU remaja daerah KU remaja desa:',
    '1. Pemasukan kas remaja daerah 2. Untuk form diserahkan ke masing-masing kelompok. 3. Teknis penyetorannya kelompok-kelompok kepada saat musyawaroh remaja desa, dan desa menyetorkan ke daerah saat musyawaroh remaja daerah. Penyetoran ke Daerah Maximal 4 bulan sekali', 'Pembuatan BUKU', 200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Bendahara', 2, 'KMM', 'Bendahara',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 17, 'Koordinasi KU', 'Satu Tahun Sekali Di Bulan Februari awal', 'KU Remaja Daerah',
    'KU remaja kelompok, desa, daerah undangan koordinasi di PJ kan kepada ketua muda-i desa waktu pengajian muda-i daerah Teknis : 1. Penyeragaman teknis pembukuan diisi dari KU Daerah 2. Pelatihan Pembukuan Keuangan 3. Peserta semua KU Remaja Se Daerah', 'Konsumsi : 10.000 x 40', 400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Bendahara', 1, 'KMM', 'Bendahara',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 18, 'Penambah Income Kas Remaja (Garage Sale)', 'Februari/ Maret 2026', 'KU Remaja Daerah',
    'Pemasukan kas Remaja Daerah, Bendahara dan Tim Dhuafa Daerah', 'Operasional', 500000, 'Agustus/ September 2026',
    'direncanakan', 'daerah', 'KMM - Bendahara', 2, 'KMM', 'Bendahara',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: KEILMUAN ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 19, 'Menyusun materi Remaja di Tingkat Daerah, Desa, dan Kelompok sesuai dengan materi di PPG', 'Pengajian Remaja - tingkat Daerah - tingkat Desa - tingkat Kelompok Setiap Bulan', '1. KMM 2. Tim Keilmuan 3. Ketua Remaja Desa 4. Ketua Remaja Kelompok',
    '1. Penuntasan Target Materi dan menambah kepahaman agama 2. Menyesuaikan materi yang ada di kurikulum', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keilmuan', 2, 'KMM', 'Keilmuan',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 20, 'Koordinasi Tim Keilmuan', '3 bulan sekali', '1. Kurikulum PPG (opsional) 2. Ketua Remaja Daerah dan Desa (opsional) 3. Tim Keilmuan',
    '1. Berkoordinasi dan mengevaluasi target materi 2. Bertepatan pengajian remaja daerah', 'Rp. 100.000 x 4 pertemuan', 400000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keilmuan', 1, 'KMM', 'Keilmuan',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: KEMANDIRIAN ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 21, 'Usaha Kemadirian Remaja Daerah', 'Insidental', 'Kemandirian remaja Daerah',
    'Melakukan kegiatan wirausaha di Sie Kemandirian daerah, sehingga bisa menjadi studi kasus untuk desa-desa dan kelompok-kelompok, Teknis pelaksanaan, memprodukisi dan menjual merch di event-event daerah dan juga daring, untuk modal sebisa mungkin kita cari investor', '100,000/ Musyawarah', 300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemandirian', 1, 'KMM', 'Kemandirian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 22, 'Workshop/Pelatihan Public Speaking', 'April', 'Kemandirian remaja Daerah',
    'Tujuannya adalah memningkatakan kemampuan dasar berupa komunikasi pada tiap-tiap remaja, yang di harapkan dapat menunjang karir atau usaha mereka, teknisnya masih kita musyawarahkan sistem yang se efisien mungkin', 'Bingkisan untuk pembicara, Untuk Snack dan waktu pengajian di gabungkan dengan kegiatan muda/i Daerah', 1500000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemandirian', 1, 'KMM', 'Kemandirian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 23, 'Penertiban Informasi Loker', 'Pembuatan Link bulan Januari', 'Kemandirian remaja Daerah',
    'Membuat link Gdrive atau Gdoc untuk menghimpun informasi lowongan kerja terutama yang ownernya orang kita', '-', 0, 'plaksanaan Insidental',
    'direncanakan', 'daerah', 'KMM - Kemandirian', 1, 'KMM', 'Kemandirian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 24, 'Cook n Chill #2', 'Musyawarah pembahasan : bulan April', 'Kemandirian remaja Daerah, Ketua remaja Kelompok, sie Keputrian, Tim Taman Media',
    'Mengadakan suatu kegiatan masak memasak yang melibatkan seluruh remaja kelompok yang bertujuan melatih kemandirian kekompakan kerjasama yang baik yang. Teknis kegiatan dilaksanakan di masjid kelompok yaitu membuat makanan ringan yang nantinya akan dilombakan ( posting lalu dikirim ke Taman Media )', 'Subsidi 100,000/Kelompok = 2.700.000, Hadiah : 400.000', 3100000, 'Pelaksanaan bulan Mei',
    'direncanakan', 'daerah', 'KMM - Kemandirian', 1, 'KMM', 'Kemandirian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 25, 'Koordinasi Sie Kemandirian', '2 bulan sekali', 'Kemandirian remaja Daerah',
    'memperlancar kegiatan sie Kemandirian', '@10rb x 5 orang x 6', 300000, 'atau 6 kali Setahun',
    'direncanakan', 'daerah', 'KMM - Kemandirian', 1, 'KMM', 'Kemandirian',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: KEPUTRIAN ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 26, 'Koordinasi Keputrian Desa se-Daerah', '21 Juni 2026 Aula Arroyan', 'Keputrian Daerah dan Desa',
    'Tujuan : A. Membantu keputrian di Desa memahami tujuan, peran, dan tanggung jawab. B. Memastikan sumber daya baik (waktu, tenaga, dana) bekerja secara optimal. C. Menyelaraskan langkah-langkah atau aktivitas antarbagian agar sesuai dengan rencana kerja. D. Mempererat hubungan antarindividu dan membangun budaya kerja yang kolaboratif dan produktif. Peserta : Keputrian Remaja Desa', 'Snack Peserta : 40 X 5.000 = 200.000 Dorprize : 150.000 Perlengkapan & Media: 200.000', 550000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keputrian', 1, 'KMM', 'Keputrian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 27, 'Koordinasi Rutin Keputrian Remaja Daerah', '8 kali pertemuan', 'Keputrian Remaja Derah',
    'Tujuan : Mengevaluasi kegiatan yang telah dilakukan dan perencanaan kegiatan yang akan datang. Teknis : Musyawarah sie keputrian remaja daerah', '8 x 100.000', 800000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keputrian', 1, 'KMM', 'Keputrian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 28, 'Workshop Merawat Bayi', '03 Mei 2026 Dimasjid daerah', 'Keputrian Daerah',
    'Tujuan : - Memberikan pengetahuan tentang cara merawat bayi - Memberikan pembinaan terkait tata cara perawatan bayi agar lebih berkompeten ketika sudah menjadi ibu. Teknis : Seminar Peserta : SMA dan SMA+', 'Snack Peserta : 300 X 5.000 = 1.500.000 Snack Pembicara = 10.000 MMT & Media : 250.000 Tali asih = Rp300.000 Perlengkapan = Rp 200.000 Doorprice = Rp 100.000 Musyawarah = Rp 200.000', 2560000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keputrian', 1, 'KMM', 'Keputrian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 29, 'Cooking Dessert', '20 September2026 MASJID DAERAH', 'Keputrian Remaja Derah',
    'Tujuan : A. memberikan pengetahuan, keterampilan, dan motivasi kepada peserta agar mampu menciptakan produk kreatif yang memiliki nilai seni, fungsional, dan ekonomis. B. Membekali peserta dengan kemampuan yang dapat diterapkan di kehidupan sehari-hari atau dalam usaha dan menjadikan pribadi yang lebih mandiri. C. Mempererat hubungan sosial melalui kegiatan kelompok yang inspiratif. D. meningkatakan skill kemampuan dalam memasak. Teknis : pelatihan Peserta : Remaja Putri se Daerah', 'Snack Peserta : 200 X 5.000 = 1.000.000 Snack Tamu : 3 X 10.000 = 30.000 Alat dan Bahan: 1.800.000 musyawarah 200.000 tali asih 300.0000 banner 100.000 taman 50.000 tak terduga 100.000', 3580000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keputrian', 2, 'KMM', 'Keputrian',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 30, 'Pengakraban Keputrian Daerah', '2026-11-01', 'keputrian remaja daerah',
    '1. Menyusun Program Kerja Keputrian Remaja Daerah selama 1 tahun kedepan 2. Pengakraban Keputrian Daerah', 'Booking Tempat = Rp 520.000 Konsumsi 2x = Rp 30.000 x 11 = Rp 330.000 Transportasi = Rp 150.000', 1000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Keputrian', 1, 'KMM', 'Keputrian',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: OLAHRAGA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 31, 'Turnamen Mini-Soccer (Proker Tahun 2025)', 'Januari', 'Sie Olah Raga Remaja Daerah Panitia',
    '1. Menjalin kerukunan dan kerjasama yang baik dikalangan Remaja se-Daerah Solo Selatan 2. Sarana olah raga untuk menjaga kesehatan dan kebugaran 3. Sarana untuk menjalin dan mempererat ikatan silaturahim antar remaja se-Daerah Solo Selatan 4. Turnamen antar Desa se Daerah', '-', 9345000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Olahraga', 1, 'KMM', 'Olahraga',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 32, 'Sparring & Fun Footbal SOLTAN', '4 x pertemuan /tahun', 'Sie Olah Raga Remaja Daerah',
    'Teknis Umum dan remaja se-daerah', 'Subsidi Air Minum', 800000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Olahraga', 1, 'KMM', 'Olahraga',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 33, 'Fun Footbal Pengurus Remaja Daerah', 'April', 'Sie Olah Raga Remaja Daerah',
    'Mendukung program kerja KMM Daerah', 'Subsidi Sewa Lapangan', 1000000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Olahraga', 1, 'KMM', 'Olahraga',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: KEMAHASISWAAN ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 34, 'Pengajian Mahasiswa I "Sarasehan Mahasiswa Dengan Kelas 1- 3 SMA"', 'April 2026 Masjid Pucangsawit', 'Kemahasiswaan Daerah dan KMM Daerah',
    'Sharing dan Menerima Kritik, Saran dari Mahasiswa', 'Konsumsi & Snack, diikutkan pengajian remaja Daerah', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemahasiswaan', 1, 'KMM', 'Kemahasiswaan',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 35, 'Pengajian Mahasiswa II "Focus Group Discussion"', 'September 2026 tempat di Masjid Pucangsawit', 'Kemahasiswaan Daerah',
    'Sharing Kegiatan dan Lain-lain Antar Mahasiswa', 'Konsumsi & Snack', 1200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemahasiswaan', 2, 'KMM', 'Kemahasiswaan',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 36, 'Terobosan Pengurus Mahasiswa Ke Mahasiswa Kelompok', 'Agustus - Desember 2026', 'Kemahasiswaan Daerah',
    'Untuk Mengetahui Keadaan Mahasiswa Yang Ada Di Kelompok, Khusus Desa Timur 2 di Kelompok" untuk Desa lain disentralkan di desa', '-', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemahasiswaan', 2, 'KMM', 'Kemahasiswaan',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 37, 'Koordinasi Tim Kemahasiswaan Daerah', '6x dalam 1 tahun', 'Kemahasiswaan Daerah',
    'Memusyawarahkan semua rencana proker tahun 2026', 'Konsumsi dan Snack', 300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemahasiswaan', 1, 'KMM', 'Kemahasiswaan',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 38, 'Pembuatan Database Mahasiswa Solo Selatan', 'September - Desember 2026', 'Kemahasiswaan Daerah',
    'Untuk Mengetahui Jumlah Mahasiswa Non PPM Yang Ada Di Daerah Solo Selatan', 'Konsumsi dan Snack', 100000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Kemahasiswaan', 2, 'KMM', 'Kemahasiswaan',
    'belum_terlaksana', 0
);

-- ── DIVISI KMM: TAMAN MEDIA ──
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 39, 'Mendokumentasi Segala Kegiatan Proker dari bidang lain', 'menyesuaikan Kegiatan yang akan dilaksanakan masing-masing bidang', 'Koordinator Taman Media',
    'Untuk menjadi wadah kegiatan keluar (Sosial Media)', 'Dokumentasi kegiatan taman media berupa foto dan Video Rp. 100.000', 0, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 1, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 40, 'Koordinasi Taman Media', 'Setiap Bulan', 'Tim Taman Media',
    'Mendukung program kerja KMM Daerah', 'Rp 100.000 x 12', 1200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 1, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 41, 'Pengadaan Peralatan Dokumentasi', 'Januari', 'Tim Taman Media',
    'Lensa Kamera Sony 18-105mm, Lighting Studio, Flash Camera', '-', 6300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 1, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 42, 'Pembuatan Konten Ramadhan', 'Januari - Februari', 'Tim Taman Media',
    'Sebagai salah satu syiar kegiatan ramadhan ke Luar (Sosial Media)', '3 pertemuan (Taking Video) x Rp. 100.000', 300000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 1, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 43, 'Pembuatan Kalender Tahun 2027', 'Juni - Juli', 'Tim Taman Media',
    'Mendokumentasikan Masjid Kelompok dan Bangunan SB se - Daerah Solo Selatan Tiap Kelompok dapat 1 Kalender', '30 x Rp. 20.000', 600000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 2, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 44, 'Pembuatan Laporan Kegiatan PPG Ke Musy Kota', 'Setiap Bulan', 'Tim Taman Media',
    'Mendokumentasikan Kegiatan yang ada di Daerah sebagai bahan laporan saat musyawarah Kota', '12 x Rp. 100.000', 1200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 1, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);
INSERT INTO program_kerja (
    id, nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta,
    tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan,
    status, tingkat_wilayah, penanggung_jawab_id, semester, kategori, sub_bidang,
    realisasi_status, realisasi_biaya
) VALUES (
    gen_random_uuid(), 45, 'Langganan Kapasitas di Google Drive', '-', 'Tim Taman Media',
    'Menampung semua file dokumen & dokumentasi kegiatan yang ada di Solo Selatan', '-', 200000, 'Daerah Solo Selatan',
    'direncanakan', 'daerah', 'KMM - Taman Media', 1, 'KMM', 'Taman Media',
    'belum_terlaksana', 0
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFIKASI HASIL IMPORT PROGRAM KERJA
-- ═══════════════════════════════════════════════════════════════════════════
SELECT kategori, COUNT(*) AS jumlah_program, SUM(estimasi_biaya) AS total_anggaran
FROM program_kerja
GROUP BY kategori
ORDER BY kategori;
