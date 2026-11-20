-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: REKAP ABSENSI BULANAN PER JENJANG (CABERAWIT & GP REGULER)
-- Database: Supabase PostgreSQL (PPG Solo Selatan)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rekap_absensi_bulanan (
    id VARCHAR(150) PRIMARY KEY,
    tahun INT NOT NULL,
    bulan VARCHAR(30) NOT NULL,
    bulan_index INT NOT NULL,
    tahun_ajaran VARCHAR(20) NOT NULL,
    jenjang VARCHAR(50) NOT NULL, -- 'caberawit' | 'gp_reguler'
    desa_id VARCHAR(100),
    desa_nama VARCHAR(100),
    kelompok_id VARCHAR(100) NOT NULL,
    kelompok_nama VARCHAR(100) NOT NULL,
    tanggal_pertemuan JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_pertemuan INT NOT NULL DEFAULT 0,
    records JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk pencarian cepat multi-wilayah dan multi-jenjang
CREATE INDEX IF NOT EXISTS idx_rekap_absensi_periode 
    ON rekap_absensi_bulanan(tahun, bulan_index, jenjang);

CREATE INDEX IF NOT EXISTS idx_rekap_absensi_kelompok 
    ON rekap_absensi_bulanan(kelompok_id);

CREATE INDEX IF NOT EXISTS idx_rekap_absensi_desa 
    ON rekap_absensi_bulanan(desa_id);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE rekap_absensi_bulanan ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (Semua pengurus yang terotentikasi dapat membaca & menyimpan rekap)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rekap_absensi_bulanan' AND policyname = 'Allow public access to rekap_absensi_bulanan'
    ) THEN
        CREATE POLICY "Allow public access to rekap_absensi_bulanan" 
        ON rekap_absensi_bulanan 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- Daftarkan ke Supabase Realtime Publication jika belum ada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE rekap_absensi_bulanan;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication
            NULL;
        END;
    END IF;
END $$;
