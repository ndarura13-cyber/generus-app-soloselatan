-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: PELAPORAN REALISASI & LPJ PENGGUNAAN DANA (RAB PROKER)
-- PPG SOLO SELATAN
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Tambahkan kolom realisasi proker & realisasi biaya ke tabel program_kerja
ALTER TABLE IF EXISTS program_kerja
    ADD COLUMN IF NOT EXISTS realisasi_status VARCHAR(50) DEFAULT 'belum_terlaksana',
    ADD COLUMN IF NOT EXISTS deskripsi_realisasi TEXT,
    ADD COLUMN IF NOT EXISTS realisasi_biaya NUMERIC(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tgl_realisasi DATE;

-- 2. Beri komentar pada kolom baru untuk dokumentasi
COMMENT ON COLUMN program_kerja.realisasi_status IS 'Status keterlaksanaan kegiatan: terlaksana / belum_terlaksana';
COMMENT ON COLUMN program_kerja.deskripsi_realisasi IS 'Catatan laporan pertanggungjawaban (LPJ) & evaluasi realisasi kegiatan';
COMMENT ON COLUMN program_kerja.realisasi_biaya IS 'Realisasi penggunaan dana aktual (Rupiah) dari RAB yang dianggarkan';
COMMENT ON COLUMN program_kerja.tgl_realisasi IS 'Tanggal pelaporan / penyelesaian realisasi kegiatan';

-- 3. Update data yang sudah selesai (done) agar memiliki status terlaksana secara default
UPDATE program_kerja
SET realisasi_status = 'terlaksana',
    realisasi_biaya = COALESCE(estimasi_biaya, 0)
WHERE status = 'selesai' AND (realisasi_status IS NULL OR realisasi_status = 'belum_terlaksana');

