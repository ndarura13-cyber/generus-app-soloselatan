-- ═══════════════════════════════════════════════════════════════════════════
-- PPG SOLO SELATAN — Skema Database & Master Data (Supabase / PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TABEL MASTER WILAYAH (Daerah -> Desa -> Kelompok)
-- ═══════════════════════════════════════════════════════════════════════════

-- A. Daerah (Tingkat 1)
CREATE TABLE IF NOT EXISTS daerah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_daerah VARCHAR(100) NOT NULL UNIQUE,
    kode_daerah VARCHAR(20) DEFAULT 'SOLO-SELATAN',
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Desa (Tingkat 2 - 5 Desa)
CREATE TABLE IF NOT EXISTS desa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daerah_id UUID NOT NULL REFERENCES daerah(id) ON DELETE CASCADE,
    nama_desa VARCHAR(100) NOT NULL,
    kode_desa VARCHAR(20),
    urutan INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(daerah_id, nama_desa)
);

-- C. Kelompok (Tingkat 3 - 27 Kelompok)
CREATE TABLE IF NOT EXISTS kelompok (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desa_id UUID NOT NULL REFERENCES desa(id) ON DELETE CASCADE,
    nama_kelompok VARCHAR(100) NOT NULL,
    alamat_kegiatan TEXT,
    urutan INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(desa_id, nama_kelompok)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. TABEL PENGURUS & PENGGUNA SISTEM (Struktur Peran Resmi PPG)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE tingkat_wilayah_enum AS ENUM ('daerah', 'desa', 'kelompok');
CREATE TYPE status_approval_enum AS ENUM ('pending', 'approved', 'rejected');

-- KATEGORI PERAN & TANGGUNG JAWAB RESMI:
-- 1. Pengurus PPG (Tingkat Daerah):
--    'Ketua', 'Wakil Ketua', 'Bendahara', 'Sekretaris', 'Penggalang Dana', 
--    'Kurikulum', 'Seni dan Olahraga', 'Tenaga Pendidik', 'Tahfidz', 
--    'Kegiatan Muda Mudi', 'Sarana dan Prasarana', 'Kemandirian', 'Keputrian', 'Bimbingan Konseling'
-- 2. Koordinator Desa (Tingkat Desa):
--    'Koordinator Caberawit (Paud - SD)', 'Koordinator GP Reguler', 'Ketua Remaja Desa', 'Pengurus Desa'
-- 3. Pamong Kelompok (Tingkat Kelompok):
--    'Pamong Caberawit (Paud - SD)', 'Pamong GP Reguler', 'Ketua Remaja Kelompok', 'Pengurus Kelompok'

CREATE TABLE IF NOT EXISTS pengurus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID, -- Terhubung ke Supabase Auth (auth.users)
    nama VARCHAR(150) NOT NULL,
    no_wa VARCHAR(30) NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT, -- Untuk enkripsi kata sandi jika tanpa Supabase Auth
    tingkatan tingkat_wilayah_enum NOT NULL DEFAULT 'kelompok',
    
    -- Peran / Tanggung Jawab Resmi Sesuai Kategori
    peran VARCHAR(100) NOT NULL DEFAULT 'Pamong Caberawit (Paud - SD)',
    
    -- Relasi Wilayah Tanggung Jawab & Asal
    daerah_id UUID REFERENCES daerah(id) ON DELETE SET NULL,
    desa_id UUID REFERENCES desa(id) ON DELETE SET NULL,
    kelompok_id UUID REFERENCES kelompok(id) ON DELETE SET NULL,
    
    -- Status Hak Akses & Approval
    is_superadmin BOOLEAN DEFAULT FALSE,
    status_approval status_approval_enum NOT NULL DEFAULT 'pending',
    disetujui_oleh_id UUID REFERENCES pengurus(id),
    disetujui_pada TIMESTAMPTZ,
    alasan_penolakan TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. TABEL PESERTA DIDIK / SISWA (Inti Database)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE kategori_usia_enum AS ENUM ('caberawit', 'gp_reguler', 'remaja');
CREATE TYPE jenjang_kelas_enum AS ENUM (
    'PAUD', 'TK A', 'TK B', 
    '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD',
    '1 SMP', '2 SMP', '3 SMP',
    '1 SMA', '2 SMA', '3 SMA',
    'Mahasiswa', 'Bekerja', 'Lainnya'
);
CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
CREATE TYPE domisili_enum AS ENUM ('Pribumi', 'Pendatang');
CREATE TYPE status_sambung_enum AS ENUM ('Sambung', 'Pindah Sambung', 'Menikah');

CREATE TABLE IF NOT EXISTS siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(20) UNIQUE,
    nis VARCHAR(30),
    nama_lengkap VARCHAR(150) NOT NULL,
    nama_panggilan VARCHAR(50),
    jenis_kelamin jenis_kelamin_enum NOT NULL,
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE NOT NULL,
    
    -- Kategori & Jenjang
    kategori_usia kategori_usia_enum NOT NULL,
    jenjang_kelas jenjang_kelas_enum NOT NULL,
    
    -- Relasi Hirarki Wilayah
    kelompok_id UUID NOT NULL REFERENCES kelompok(id) ON DELETE RESTRICT,
    desa_id UUID NOT NULL REFERENCES desa(id) ON DELETE RESTRICT,
    daerah_id UUID NOT NULL REFERENCES daerah(id) ON DELETE RESTRICT,
    
    -- Data Orang Tua / Wali & Kontak
    nama_ayah VARCHAR(150),
    nama_ibu VARCHAR(150),
    no_wa_ortu VARCHAR(30),
    no_hp VARCHAR(30),
    alamat_domisili TEXT,
    domisili domisili_enum DEFAULT 'Pribumi',
    
    -- Status Sambung & Status Aktif (Hanya 'Sambung' yang dihitung aktif; 'Menikah' & 'Pindah Sambung' nonaktif)
    status_sambung status_sambung_enum DEFAULT 'Sambung',
    status_aktif BOOLEAN GENERATED ALWAYS AS (status_sambung = 'Sambung') STORED,
    foto_url TEXT,
    catatan_khusus TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing untuk pencarian cepat & status aktif
CREATE INDEX IF NOT EXISTS idx_siswa_nama ON siswa(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_siswa_nik ON siswa(nik);
CREATE INDEX IF NOT EXISTS idx_siswa_kelompok ON siswa(kelompok_id);
CREATE INDEX IF NOT EXISTS idx_siswa_desa ON siswa(desa_id);
CREATE INDEX IF NOT EXISTS idx_siswa_kategori ON siswa(kategori_usia);
CREATE INDEX IF NOT EXISTS idx_siswa_jenjang ON siswa(jenjang_kelas);
CREATE INDEX IF NOT EXISTS idx_siswa_status_sambung ON siswa(status_sambung);
CREATE INDEX IF NOT EXISTS idx_siswa_status_aktif ON siswa(status_aktif);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW KHUSUS: GENERUS AKTIF (Hanya status 'Sambung')
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_siswa_aktif AS
SELECT 
    s.*,
    EXTRACT(YEAR FROM age(CURRENT_DATE, s.tanggal_lahir))::INT AS umur_terkini,
    d.nama_desa,
    k.nama_kelompok
FROM siswa s
JOIN desa d ON s.desa_id = d.id
JOIN kelompok k ON s.kelompok_id = k.id
WHERE s.status_sambung = 'Sambung';

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTION & TRIGGER: OTOMATISASI PENGUBAHAN JENJANG BERDASARKAN USIA / TAHUN
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_kalkulasi_jenjang_otomatis(
    p_tgl_lahir DATE,
    p_jenjang_saat_ini jenjang_kelas_enum
)
RETURNS TABLE (
    kategori_baru kategori_usia_enum,
    jenjang_baru jenjang_kelas_enum,
    umur_hitung INT
) AS $$
DECLARE
    v_umur INT;
BEGIN
    v_umur := EXTRACT(YEAR FROM age(CURRENT_DATE, p_tgl_lahir))::INT;
    umur_hitung := v_umur;

    -- Caberawit (PAUD s.d. 6 SD)
    IF v_umur <= 4 THEN
        kategori_baru := 'caberawit'; jenjang_baru := 'PAUD';
    ELSIF v_umur = 5 THEN
        kategori_baru := 'caberawit'; jenjang_baru := 'TK A';
    ELSIF v_umur = 6 THEN
        kategori_baru := 'caberawit'; jenjang_baru := 'TK B';
    ELSIF v_umur = 7 THEN
        kategori_baru := 'caberawit'; jenjang_baru := '1 SD';
    ELSIF v_umur = 8 THEN
        kategori_baru := 'caberawit'; jenjang_baru := '2 SD';
    ELSIF v_umur = 9 THEN
        kategori_baru := 'caberawit'; jenjang_baru := '3 SD';
    ELSIF v_umur = 10 THEN
        kategori_baru := 'caberawit'; jenjang_baru := '4 SD';
    ELSIF v_umur = 11 THEN
        kategori_baru := 'caberawit'; jenjang_baru := '5 SD';
    ELSIF v_umur = 12 THEN
        kategori_baru := 'caberawit'; jenjang_baru := '6 SD';
    -- GP Reguler (1 SMP s.d. 3 SMA)
    ELSIF v_umur = 13 THEN
        kategori_baru := 'gp_reguler'; jenjang_baru := '1 SMP';
    ELSIF v_umur = 14 THEN
        kategori_baru := 'gp_reguler'; jenjang_baru := '2 SMP';
    ELSIF v_umur = 15 THEN
        kategori_baru := 'gp_reguler'; jenjang_baru := '3 SMP';
    ELSIF v_umur = 16 THEN
        kategori_baru := 'gp_reguler'; jenjang_baru := '1 SMA';
    ELSIF v_umur = 17 THEN
        kategori_baru := 'gp_reguler'; jenjang_baru := '2 SMA';
    ELSIF v_umur = 18 THEN
        kategori_baru := 'gp_reguler'; jenjang_baru := '3 SMA';
    -- Remaja & Pra-Nikah (> 18 tahun)
    ELSE
        kategori_baru := 'remaja';
        IF p_jenjang_saat_ini IN ('Mahasiswa', 'Bekerja', 'Lainnya') THEN
            jenjang_baru := p_jenjang_saat_ini;
        ELSIF v_umur <= 22 THEN
            jenjang_baru := 'Pra-Nikah';
        ELSE
            jenjang_baru := 'Kelas Remaja';
        END IF;
    END IF;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Prosedur Batch: Kenaikan Jenjang Massal Pergantian Tahun Ajaran Baru
CREATE OR REPLACE PROCEDURE sp_kenaikan_jenjang_tahunan()
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    v_kat kategori_usia_enum;
    v_jenjang jenjang_kelas_enum;
    v_umur INT;
BEGIN
    FOR rec IN SELECT id, tanggal_lahir, jenjang_kelas FROM siswa WHERE status_sambung = 'Sambung' LOOP
        SELECT kategori_baru, jenjang_baru, umur_hitung 
        INTO v_kat, v_jenjang, v_umur
        FROM fn_kalkulasi_jenjang_otomatis(rec.tanggal_lahir, rec.jenjang_kelas);
        
        UPDATE siswa
        SET kategori_usia = v_kat,
            jenjang_kelas = v_jenjang,
            updated_at = NOW()
        WHERE id = rec.id AND (kategori_usia <> v_kat OR jenjang_kelas <> v_jenjang);
    END LOOP;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. TABEL MUTASI SISWA (Pindah Kelompok / Cabang)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE status_mutasi_enum AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS mutasi_siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    kelompok_asal_id UUID NOT NULL REFERENCES kelompok(id),
    kelompok_tujuan_id UUID NOT NULL REFERENCES kelompok(id),
    tanggal_mutasi DATE NOT NULL DEFAULT CURRENT_DATE,
    alasan_mutasi TEXT,
    status status_mutasi_enum DEFAULT 'pending',
    diajukan_oleh_id UUID REFERENCES pengurus(id),
    disetujui_oleh_id UUID REFERENCES pengurus(id), -- Superadmin / Pengurus Daerah
    catatan_persetujuan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. TABEL PROGRAM KERJA TAHUNAN (8 KOLOM RESMI)
-- NO > KEGIATAN > WAKTU > SASARAN/PESERTA > TUJUAN KEGIATAN > RINCIAN BIAYA > EST. BIAYA > TEMPAT PELAKSANAAN
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE status_proker_enum AS ENUM ('direncanakan', 'akan_datang', 'sedang_berlangsung', 'selesai');

CREATE TABLE IF NOT EXISTS program_kerja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_urut INT NOT NULL,
    judul_program VARCHAR(255) NOT NULL,
    waktu_pelaksanaan VARCHAR(100) NOT NULL, -- Contoh: 'Agustus 2026', 'September 2026'
    sasaran_peserta VARCHAR(200) NOT NULL, -- Contoh: 'Generus Caberawit (SD)', 'Remaja & Pra-Nikah'
    tujuan_kegiatan TEXT NOT NULL,
    rincian_biaya TEXT,
    estimasi_biaya NUMERIC(15, 2) DEFAULT 0,
    tempat_pelaksanaan VARCHAR(255) NOT NULL, -- Contoh: 'Aula Gedung PPG Solo Selatan'
    status status_proker_enum DEFAULT 'direncanakan',
    tingkat_wilayah tingkat_wilayah_enum DEFAULT 'daerah',
    desa_id UUID REFERENCES desa(id) ON DELETE SET NULL,
    kelompok_id UUID REFERENCES kelompok(id) ON DELETE SET NULL,
    penanggung_jawab_id UUID REFERENCES pengurus(id) ON DELETE SET NULL,
    semester INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. TABEL ABSENSI KBM (Multi-Jenjang)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS absensi_sesi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelompok_id UUID NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
    kategori_usia kategori_usia_enum NOT NULL,
    jenjang_kelas jenjang_kelas_enum,
    tanggal_kbm DATE NOT NULL DEFAULT CURRENT_DATE,
    materi_kbm VARCHAR(255),
    pengajar_id UUID REFERENCES pengurus(id),
    catatan_sesi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE status_kehadiran_enum AS ENUM ('hadir', 'izin', 'sakit', 'alpa');

CREATE TABLE IF NOT EXISTS absensi_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesi_id UUID NOT NULL REFERENCES absensi_sesi(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    status_kehadiran status_kehadiran_enum NOT NULL DEFAULT 'hadir',
    keterangan VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sesi_id, siswa_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. TABEL EVENT PEMBIASAAN (Dinamis per Periode)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE status_event_enum AS ENUM ('berjalan', 'selesai');

CREATE TABLE IF NOT EXISTS event_pembiasaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul_periode VARCHAR(150) NOT NULL, -- Contoh: "Periode Mei 2026"
    status status_event_enum DEFAULT 'berjalan',
    
    -- 4 Daftar Pembiasaan Aktif
    habit_1 VARCHAR(150),
    habit_2 VARCHAR(150),
    habit_3 VARCHAR(150),
    habit_4 VARCHAR(150),
    
    dibuat_oleh_id UUID REFERENCES pengurus(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nilai_pembiasaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES event_pembiasaan(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    
    -- Nilai Persentase (0 - 100)
    nilai_1 INT DEFAULT 0,
    nilai_2 INT DEFAULT 0,
    nilai_3 INT DEFAULT 0,
    nilai_4 INT DEFAULT 0,
    
    diisi_oleh_id UUID REFERENCES pengurus(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, siswa_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. MASTER SEED DATA: 1 DAERAH, 5 DESA, 27 KELOMPOK
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_daerah_id UUID;
    v_desa_barat_id UUID;
    v_desa_tengah_id UUID;
    v_desa_selatan_id UUID;
    v_desa_timur1_id UUID;
    v_desa_timur2_id UUID;
BEGIN
    -- 1. Insert Daerah Solo Selatan
    INSERT INTO daerah (nama_daerah, kode_daerah, keterangan)
    VALUES ('Solo Selatan', 'SLO-SEL', 'Daerah Penggerak Pembina Generus Solo Selatan')
    ON CONFLICT (nama_daerah) DO UPDATE SET keterangan = EXCLUDED.keterangan
    RETURNING id INTO v_daerah_id;

    -- 2. Insert 5 Desa (Terurut Alfabetis A-Z)
    INSERT INTO desa (daerah_id, nama_desa, kode_desa, urutan)
    VALUES (v_daerah_id, 'Barat', 'DESA-BRT', 1)
    ON CONFLICT (daerah_id, nama_desa) DO UPDATE SET urutan = EXCLUDED.urutan
    RETURNING id INTO v_desa_barat_id;

    INSERT INTO desa (daerah_id, nama_desa, kode_desa, urutan)
    VALUES (v_daerah_id, 'Selatan', 'DESA-SLT', 2)
    ON CONFLICT (daerah_id, nama_desa) DO UPDATE SET urutan = EXCLUDED.urutan
    RETURNING id INTO v_desa_selatan_id;

    INSERT INTO desa (daerah_id, nama_desa, kode_desa, urutan)
    VALUES (v_daerah_id, 'Tengah', 'DESA-TGH', 3)
    ON CONFLICT (daerah_id, nama_desa) DO UPDATE SET urutan = EXCLUDED.urutan
    RETURNING id INTO v_desa_tengah_id;

    INSERT INTO desa (daerah_id, nama_desa, kode_desa, urutan)
    VALUES (v_daerah_id, 'Timur 1', 'DESA-TM1', 4)
    ON CONFLICT (daerah_id, nama_desa) DO UPDATE SET urutan = EXCLUDED.urutan
    RETURNING id INTO v_desa_timur1_id;

    INSERT INTO desa (daerah_id, nama_desa, kode_desa, urutan)
    VALUES (v_daerah_id, 'Timur 2', 'DESA-TM2', 5)
    ON CONFLICT (daerah_id, nama_desa) DO UPDATE SET urutan = EXCLUDED.urutan
    RETURNING id INTO v_desa_timur2_id;

    -- 3. Insert 27 Kelompok (Terurut Alfabetis A-Z per Desa)
    -- A. Desa Barat (5 Kelompok)
    INSERT INTO kelompok (desa_id, nama_kelompok, urutan) VALUES
    (v_desa_barat_id, 'Gentan', 1),
    (v_desa_barat_id, 'Pajang', 2),
    (v_desa_barat_id, 'Sondakan', 3),
    (v_desa_barat_id, 'Songgalan', 4),
    (v_desa_barat_id, 'Teposanan', 5)
    ON CONFLICT (desa_id, nama_kelompok) DO NOTHING;

    -- B. Desa Selatan (4 Kelompok)
    INSERT INTO kelompok (desa_id, nama_kelompok, urutan) VALUES
    (v_desa_selatan_id, 'Joyotakan 1', 1),
    (v_desa_selatan_id, 'Joyotakan 2', 2),
    (v_desa_selatan_id, 'Kaliwingko', 3),
    (v_desa_selatan_id, 'Solo Baru', 4)
    ON CONFLICT (desa_id, nama_kelompok) DO NOTHING;

    -- C. Desa Tengah (5 Kelompok)
    INSERT INTO kelompok (desa_id, nama_kelompok, urutan) VALUES
    (v_desa_tengah_id, 'Baluwarti', 1),
    (v_desa_tengah_id, 'Mojo 1', 2),
    (v_desa_tengah_id, 'Mojo 2', 3),
    (v_desa_tengah_id, 'Sampangan', 4),
    (v_desa_tengah_id, 'Semanggi', 5)
    ON CONFLICT (desa_id, nama_kelompok) DO NOTHING;

    -- D. Desa Timur 1 (6 Kelompok)
    INSERT INTO kelompok (desa_id, nama_kelompok, urutan) VALUES
    (v_desa_timur1_id, 'Gunung Sari', 1),
    (v_desa_timur1_id, 'Gunung Wijil 1', 2),
    (v_desa_timur1_id, 'Gunung Wijil 2', 3),
    (v_desa_timur1_id, 'Kapohan', 4),
    (v_desa_timur1_id, 'Randurejo', 5),
    (v_desa_timur1_id, 'Winong', 6)
    ON CONFLICT (desa_id, nama_kelompok) DO NOTHING;

    -- E. Desa Timur 2 (7 Kelompok)
    INSERT INTO kelompok (desa_id, nama_kelompok, urutan) VALUES
    (v_desa_timur2_id, 'Ngasinan', 1),
    (v_desa_timur2_id, 'Ngoresan', 2),
    (v_desa_timur2_id, 'Petoran', 3),
    (v_desa_timur2_id, 'Pucangsawit 1', 4),
    (v_desa_timur2_id, 'Pucangsawit 2', 5),
    (v_desa_timur2_id, 'Pucangsawit Indah', 6),
    (v_desa_timur2_id, 'Sekarpace', 7)
    ON CONFLICT (desa_id, nama_kelompok) DO NOTHING;

    -- 4. Sample Pengurus Sesuai Kategori Resmi PPG
    INSERT INTO pengurus (nama, no_wa, email, tingkatan, peran, daerah_id, desa_id, kelompok_id, is_superadmin, status_approval)
    VALUES ('H. Ahmad Sulaiman', '081234567890', 'admin.daerah@ppgsolo.org', 'daerah', 'Ketua', v_daerah_id, v_desa_barat_id, NULL, TRUE, 'approved')
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO pengurus (nama, no_wa, email, tingkatan, peran, daerah_id, desa_id, kelompok_id, is_superadmin, status_approval)
    VALUES ('Ust. Rahmat Hidayat', '081298765432', 'barat@ppgsolo.org', 'desa', 'Koordinator Caberawit (Paud - SD)', v_daerah_id, v_desa_barat_id, NULL, FALSE, 'approved')
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO pengurus (nama, no_wa, email, tingkatan, peran, daerah_id, desa_id, kelompok_id, is_superadmin, status_approval)
    VALUES ('Bpk. Bambang Sutrisno', '081356789012', 'pamong.gentan@ppgsolo.org', 'kelompok', 'Pamong Caberawit (Paud - SD)', v_daerah_id, v_desa_barat_id, NULL, FALSE, 'approved')
    ON CONFLICT (email) DO NOTHING;

    -- 5. Seed Data Program Kerja Tahunan (8 Kolom Resmi)
    INSERT INTO program_kerja (nomor_urut, judul_program, waktu_pelaksanaan, sasaran_peserta, tujuan_kegiatan, rincian_biaya, estimasi_biaya, tempat_pelaksanaan, status, tingkat_wilayah)
    VALUES 
    (1, 'Rapat Koordinasi & Evaluasi Pengurus Daerah', 'Agustus 2026', 'Pengurus PPG Daerah & Koordinator 5 Desa', 'Penyelarasan target capaian kurikulum generus dan evaluasi kinerja pamong semester ganjil.', 'Konsumsi (35 orang x Rp 30.000): Rp 1.050.000, Modul & ATK: Rp 450.000', 1500000, 'Aula Gedung PPG Solo Selatan', 'selesai', 'daerah'),
    (2, 'Pendaftaran Generus Baru & Sinkronisasi Database', 'Agustus – September 2026', 'Generus Baru (PAUD, SD, SMP, SMA) di 27 Kelompok', 'Pendataan tertib NIK, mutasi jenjang, dan penertiban nomor induk generus di seluruh 5 Desa.', 'Cetak Formulir & Kartu: Rp 1.800.000, Server & IT: Rp 700.000', 2500000, '27 Kelompok Se-Solo Selatan', 'sedang_berlangsung', 'daerah'),
    (3, 'Pelatihan Digitalisasi Lembar Pembiasaan Caberawit', 'Agustus – September 2026', 'Pamong Caberawit (PAUD & SD) & Wali Murid', 'Peningkatan keterampilan pamong dalam pemantauan sholat 5 waktu dan 29 karakter luhur usia dini.', 'Konsumsi Pelatihan (50 orang): Rp 1.500.000, Banner & Panduan Buku Saku: Rp 800.000, Narasumber: Rp 700.000', 3000000, 'Masjid Luhur Baluwarti (Desa Tengah)', 'sedang_berlangsung', 'daerah'),
    (4, 'Halaqah Akbar & Pembekalan Remaja Usia Mandiri', 'September 2026', 'Remaja SMA & Usia Mandiri Se-Solo Selatan', 'Penguatan dalil-dalil kemandirian, adab pergaulan islami, dan kewirausahaan pemuda.', 'Sewa Sound & Aula: Rp 2.000.000, Konsumsi (200 porsi): Rp 5.000.000, Doorprize: Rp 1.500.000', 8500000, 'Gedung Pertemuan Solo Baru (Desa Selatan)', 'akan_datang', 'daerah'),
    (5, 'Bimbingan Konseling & Sosialisasi Kelas Pra-Nikah', 'Oktober 2026', 'Generus Usia Pra-Nikah & Orang Tua', 'Pembekalan komprehensif fikih munakahat, kesiapan mental, dan manajemen keluarga sakinah.', 'Modul Pra-Nikah: Rp 2.000.000, Konsumsi: Rp 2.500.000, Honorarium Konselor: Rp 1.500.000', 6000000, 'Aula Baitul Makmur (Desa Barat)', 'direncanakan', 'daerah'),
    (6, 'Festival Tahfidz Qur''an & Seni Olahraga Generus', 'November 2026', 'Caberawit & GP Reguler (PAUD s/d SMA)', 'Menumbuhkan motivasi hafalan Al-Qur''an, kesehatan jasmani, sportivitas, dan keakraban antar-desa.', 'Piala & Hadiah: Rp 3.500.000, Panggung: Rp 3.000.000, Konsumsi: Rp 2.500.000, Logistik: Rp 1.000.000', 10000000, 'Kompleks Olahraga Sekarpace (Desa Timur 2)', 'direncanakan', 'daerah'),
    (7, 'Musyawarah Evaluasi KBM Semester Ganjil & Rakor Akhir Tahun', 'Desember 2026', 'Seluruh Pamong & Pengurus PPG 5 Desa', 'Rekapitulasi ketercapaian materi KBM, rekap presensi, dan pelaporan keuangan tahun berjalan.', 'Laporan Cetak: Rp 1.200.000, Konsumsi Rapat Akbar: Rp 2.800.000', 4000000, 'Gedung PPG Solo Selatan', 'direncanakan', 'daerah');

END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. SUPABASE ROW LEVEL SECURITY (RLS) & PUBLIC POLICIES
-- Mengaktifkan RLS dan memberikan hak akses penuh (CRUD) ke anon & authenticated
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE daerah ENABLE ROW LEVEL SECURITY;
ALTER TABLE desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE kelompok ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi_sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_pembiasaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai_pembiasaan ENABLE ROW LEVEL SECURITY;

-- Otomatis membuat policy CRUD untuk semua tabel publik
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT IN ('spatial_ref_sys')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access for all operations" ON %I', t);
        EXECUTE format('CREATE POLICY "Public access for all operations" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. SUPABASE REALTIME REPLICATION
-- Menambahkan tabel ke publikasi realtime Supabase untuk sinkronisasi multi-device
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE siswa;
        ALTER PUBLICATION supabase_realtime ADD TABLE absensi_sesi;
        ALTER PUBLICATION supabase_realtime ADD TABLE absensi_detail;
        ALTER PUBLICATION supabase_realtime ADD TABLE event_pembiasaan;
        ALTER PUBLICATION supabase_realtime ADD TABLE nilai_pembiasaan;
        ALTER PUBLICATION supabase_realtime ADD TABLE program_kerja;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Lewati jika tabel sudah ada di publikasi
END $$;