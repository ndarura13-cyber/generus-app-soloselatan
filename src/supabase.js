/**
 * supabase.js — Modul Integrasi Database Supabase untuk PPG Solo Selatan
 * Menggunakan @supabase/supabase-js via CDN ESM tanpa perlu bundler eksternal.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const STORAGE_KEY_CONFIG = "ppg_supabase_config_v1";

// Default / Cached Config
let supabaseClient = null;

const DEFAULT_CONFIG = {
  url: "https://coodtfhfszrfscjvgrjh.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvb2R0Zmhmc3pyZnNjanZncmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NzA5NDgsImV4cCI6MjEwNDM0Njk0OH0.m07Zoe_i92fCwT22-ThtMMJF8Z-xq1hAvGkpcpAt-q4",
  autoSync: true
};

/**
 * Mendapatkan konfigurasi Supabase dari LocalStorage (dengan default project resmi)
 */
export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch (e) {
    console.error("Gagal membaca konfigurasi Supabase:", e);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Menyimpan konfigurasi Supabase ke LocalStorage dan refresh client
 */
export function saveSupabaseConfig(config) {
  try {
    const current = getSupabaseConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    initSupabaseClient();
    return { success: true, config: updated };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Inisialisasi atau re-inisialisasi Supabase Client
 */
export function initSupabaseClient() {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.anonKey && cfg.url.startsWith("http")) {
    try {
      supabaseClient = createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseClient;
    } catch (err) {
      console.warn("Inisialisasi Supabase gagal:", err);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return null;
}

/**
 * Mengembalikan instance client Supabase yang aktif
 */
export function getSupabase() {
  if (!supabaseClient) {
    initSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Cek apakah kredensial Supabase sudah terkonfigurasi
 */
export function isSupabaseConfigured() {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.anonKey && cfg.url.startsWith("http"));
}

/**
 * Uji koneksi ke Supabase dengan query sederhana ke tabel master 'daerah'
 */
export async function testSupabaseConnection() {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: "Kredensial Supabase belum diisi (URL atau Anon Key kosong)."
    };
  }

  try {
    const { data, error, count } = await client
      .from("daerah")
      .select("*", { count: "exact", head: false })
      .limit(1);

    if (error) {
      return {
        success: false,
        message: `Koneksi Supabase gagal: ${error.message} (Kode: ${error.code || "-"})`
      };
    }

    return {
      success: true,
      message: "Berhasil terhubung ke Supabase Cloud Database!",
      dataCount: count || (data ? data.length : 0)
    };
  } catch (err) {
    return {
      success: false,
      message: `Terjadi kendala jaringan saat menghubungi Supabase: ${err.message}`
    };
  }
}

/* ═══════════════════════════════════════════════════════════════
   FUNGSI SINKRONISASI DATA (SUPABASE <-> LOCALSTORAGE)
   ═══════════════════════════════════════════════════════════════ */

let cachedWilayah = null;

export async function getWilayahCache() {
  if (cachedWilayah) return cachedWilayah;
  const client = getSupabase();
  if (!client) return null;

  try {
    const [daerahRes, desaRes, kelRes] = await Promise.all([
      client.from('daerah').select('*'),
      client.from('desa').select('*'),
      client.from('kelompok').select('*')
    ]);

    cachedWilayah = {
      daerahList: daerahRes.data || [],
      desaList: desaRes.data || [],
      kelList: kelRes.data || [],
      defaultDaerahId: daerahRes.data?.[0]?.id || null
    };
    return cachedWilayah;
  } catch (e) {
    console.warn("Gagal mengambil master wilayah dari Supabase:", e);
    return null;
  }
}

function formatSiswaForSupabase(s, cache) {
  const desaList = cache?.desaList || [];
  const kelList = cache?.kelList || [];
  const defaultDaerahId = cache?.defaultDaerahId || null;

  const isUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let desaId = isUuid(s.desa_id) ? s.desa_id : null;
  if (!desaId) {
    const found = desaList.find(d => 
      (s.desa_id && d.kode_desa && d.kode_desa.toLowerCase().includes(s.desa_id.replace('desa-', ''))) ||
      (s.desa_nama && d.nama_desa.toLowerCase() === s.desa_nama.toLowerCase())
    );
    desaId = found?.id || desaList[0]?.id;
  }

  let kelId = isUuid(s.kelompok_id) ? s.kelompok_id : null;
  if (!kelId) {
    const found = kelList.find(k => 
      (s.kelompok_nama && k.nama_kelompok.toLowerCase() === s.kelompok_nama.toLowerCase())
    );
    kelId = found?.id || kelList[0]?.id;
  }

  let jenjang = s.jenjang_kelas;
  if (jenjang === 'Kelas Remaja' || jenjang === 'Pra-Nikah') {
    jenjang = 'Lainnya';
  }

  const payload = {
    nik: s.nik && s.nik !== '-' ? s.nik : null,
    nis: s.nis && s.nis !== '-' ? s.nis : null,
    nama_lengkap: s.nama_lengkap,
    jenis_kelamin: s.jenis_kelamin || 'L',
    tempat_lahir: s.tempat_lahir || 'Solo',
    tanggal_lahir: s.tanggal_lahir,
    kategori_usia: s.kategori_usia,
    jenjang_kelas: jenjang,
    desa_id: desaId,
    kelompok_id: kelId,
    daerah_id: isUuid(s.daerah_id) ? s.daerah_id : defaultDaerahId,
    no_hp: s.no_hp && s.no_hp !== '-' ? s.no_hp : null,
    domisili: s.domisili === 'Pendatang' ? 'Pendatang' : 'Pribumi',
    status_sambung: s.status_sambung || 'Sambung',
    catatan_khusus: s.catatan_khusus || null
  };

  if (isUuid(s.id)) {
    payload.id = s.id;
  }

  return payload;
}

/**
 * Mengambil data seluruh generus dari view 'v_siswa_aktif' atau tabel 'siswa' di Supabase
 */
export async function fetchSiswaFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("v_siswa_aktif")
      .select("*")
      .order("nama_lengkap", { ascending: true });

    if (error) {
      // Fallback ke tabel siswa langsung jika view belum terpanggil
      const fallback = await client.from("siswa").select("*").order("nama_lengkap", { ascending: true });
      if (fallback.error) throw fallback.error;
      return { success: true, data: fallback.data || [] };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Mengunggah satu atau banyak data generus ke Supabase (Upsert otomatis)
 */
export async function upsertSiswaToSupabase(siswaOrArray) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const cache = await getWilayahCache();
    const rawList = Array.isArray(siswaOrArray) ? siswaOrArray : [siswaOrArray];
    const records = rawList.map(s => formatSiswaForSupabase(s, cache));

    const { data, error } = await client
      .from("siswa")
      .upsert(records, { onConflict: "id" })
      .select();

    if (error) throw error;
    return { success: true, data: data };
  } catch (err) {
    console.warn("Auto-sync Supabase (Upsert) gagal:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Menghapus generus dari Supabase berdasarkan ID
 */
export async function deleteSiswaFromSupabase(id) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return { success: true }; // Data belum sinkron ke cloud UUID

    const { error } = await client
      .from("siswa")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.warn("Auto-sync Supabase (Delete) gagal:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Mengambil program kerja dari Supabase
 */
export async function fetchProkerFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("program_kerja")
      .select("*")
      .order("nomor_urut", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Inisialisasi awal saat modul dimuat
initSupabaseClient();
