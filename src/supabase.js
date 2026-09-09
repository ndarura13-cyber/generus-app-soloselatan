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

/* ═══════════════════════════════════════════════════════════════
   FUNGSI SINKRONISASI PEMBIASAAN
   ═══════════════════════════════════════════════════════════════ */

export async function fetchEventPembiasaanFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("event_pembiasaan")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const formattedData = data.map(evt => {
      const habits = [];
      if (evt.habit_1) habits.push(evt.habit_1);
      if (evt.habit_2) habits.push(evt.habit_2);
      if (evt.habit_3) habits.push(evt.habit_3);
      if (evt.habit_4) habits.push(evt.habit_4);
      return {
        id: evt.id,
        judul_periode: evt.judul_periode,
        status: evt.status,
        habits: habits,
        created_at: evt.created_at,
        updated_at: evt.updated_at
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function upsertEventPembiasaanToSupabase(evtData) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const payload = {
      judul_periode: evtData.judul_periode,
      status: evtData.status || 'berjalan',
      habit_1: evtData.habits?.[0] || null,
      habit_2: evtData.habits?.[1] || null,
      habit_3: evtData.habits?.[2] || null,
      habit_4: evtData.habits?.[3] || null,
    };
    
    const isUuid = typeof evtData.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evtData.id);
    if (isUuid) {
      payload.id = evtData.id;
    }

    const { data, error } = await client
      .from("event_pembiasaan")
      .upsert([payload], { onConflict: "id" })
      .select();

    if (error) throw error;
    
    const returnedRow = data[0];
    const habits = [];
    if (returnedRow.habit_1) habits.push(returnedRow.habit_1);
    if (returnedRow.habit_2) habits.push(returnedRow.habit_2);
    if (returnedRow.habit_3) habits.push(returnedRow.habit_3);
    if (returnedRow.habit_4) habits.push(returnedRow.habit_4);
      
    const formatted = {
      id: returnedRow.id,
      judul_periode: returnedRow.judul_periode,
      status: returnedRow.status,
      habits: habits,
      created_at: returnedRow.created_at,
      updated_at: returnedRow.updated_at
    };

    return { success: true, data: formatted };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteEventPembiasaanFromSupabase(id) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return { success: true };

    const { error } = await client
      .from("event_pembiasaan")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchNilaiPembiasaanFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("nilai_pembiasaan")
      .select("*");

    if (error) throw error;
    
    const formattedData = data.map(n => {
      const nilai = [
        n.nilai_1 || 0,
        n.nilai_2 || 0,
        n.nilai_3 || 0,
        n.nilai_4 || 0
      ];
      return {
        id: n.id,
        event_id: n.event_id,
        siswa_id: n.siswa_id,
        nilai: nilai
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function upsertNilaiPembiasaanToSupabase(nilaiData) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const payload = {
      event_id: nilaiData.event_id,
      siswa_id: nilaiData.siswa_id,
      nilai_1: nilaiData.nilai?.[0] || 0,
      nilai_2: nilaiData.nilai?.[1] || 0,
      nilai_3: nilaiData.nilai?.[2] || 0,
      nilai_4: nilaiData.nilai?.[3] || 0
    };

    const isUuid = typeof nilaiData.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nilaiData.id);
    if (isUuid) {
      payload.id = nilaiData.id;
    }

    const { data, error } = await client
      .from("nilai_pembiasaan")
      .upsert([payload], { onConflict: "event_id, siswa_id" })
      .select();
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

/* ═══════════════════════════════════════════════════════════════
   FUNGSI SINKRONISASI PEMBIASAAN
   ═══════════════════════════════════════════════════════════════ */

export async function fetchEventPembiasaanFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("event_pembiasaan")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const formattedData = data.map(evt => {
      const habits = [];
      if (evt.habit_1) habits.push(evt.habit_1);
      if (evt.habit_2) habits.push(evt.habit_2);
      if (evt.habit_3) habits.push(evt.habit_3);
      if (evt.habit_4) habits.push(evt.habit_4);
      return {
        id: evt.id,
        judul_periode: evt.judul_periode,
        status: evt.status,
        habits: habits,
        created_at: evt.created_at,
        updated_at: evt.updated_at
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function upsertEventPembiasaanToSupabase(evtData) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const payload = {
      judul_periode: evtData.judul_periode,
      status: evtData.status || 'berjalan',
      habit_1: evtData.habits?.[0] || null,
      habit_2: evtData.habits?.[1] || null,
      habit_3: evtData.habits?.[2] || null,
      habit_4: evtData.habits?.[3] || null,
    };
    
    const isUuid = typeof evtData.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evtData.id);
    if (isUuid) {
      payload.id = evtData.id;
    }

    const { data, error } = await client
      .from("event_pembiasaan")
      .upsert([payload], { onConflict: "id" })
      .select();

    if (error) throw error;
    
    const returnedRow = data[0];
    const habits = [];
    if (returnedRow.habit_1) habits.push(returnedRow.habit_1);
    if (returnedRow.habit_2) habits.push(returnedRow.habit_2);
    if (returnedRow.habit_3) habits.push(returnedRow.habit_3);
    if (returnedRow.habit_4) habits.push(returnedRow.habit_4);
      
    const formatted = {
      id: returnedRow.id,
      judul_periode: returnedRow.judul_periode,
      status: returnedRow.status,
      habits: habits,
      created_at: returnedRow.created_at,
      updated_at: returnedRow.updated_at
    };

    return { success: true, data: formatted };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteEventPembiasaanFromSupabase(id) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return { success: true };

    const { error } = await client
      .from("event_pembiasaan")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchNilaiPembiasaanFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("nilai_pembiasaan")
      .select("*");

    if (error) throw error;
    
    const formattedData = data.map(n => {
      const nilai = [
        n.nilai_1 || 0,
        n.nilai_2 || 0,
        n.nilai_3 || 0,
        n.nilai_4 || 0
      ];
      return {
        id: n.id,
        event_id: n.event_id,
        siswa_id: n.siswa_id,
        nilai: nilai
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function upsertNilaiPembiasaanToSupabase(nilaiData) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const payload = {
      event_id: nilaiData.event_id,
      siswa_id: nilaiData.siswa_id,
      nilai_1: nilaiData.nilai?.[0] || 0,
      nilai_2: nilaiData.nilai?.[1] || 0,
      nilai_3: nilaiData.nilai?.[2] || 0,
      nilai_4: nilaiData.nilai?.[3] || 0
    };

    const isUuid = typeof nilaiData.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nilaiData.id);
    if (isUuid) {
      payload.id = nilaiData.id;
    }

    const { data, error } = await client
      .from("nilai_pembiasaan")
      .upsert([payload], { onConflict: "event_id, siswa_id" })
      .select();

    if (error) throw error;
    
    const returnedRow = data[0];
    const formatted = {
      id: returnedRow.id,
      event_id: returnedRow.event_id,
      siswa_id: returnedRow.siswa_id,
      nilai: [returnedRow.nilai_1, returnedRow.nilai_2, returnedRow.nilai_3, returnedRow.nilai_4]
    };

    return { success: true, data: formatted };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
   FUNGSI SINKRONISASI PENGURUS
   ═══════════════════════════════════════════════════════════════ */

export async function fetchPengurusFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("pengurus")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    
    const formattedData = data.map(p => ({
      id: p.id,
      nama: p.nama,
      no_wa: p.no_wa,
      tingkatan: p.tingkatan,
      peran: p.peran,
      daerah_id: p.daerah_id,
      desa_id: p.desa_id,
      kelompok_id: p.kelompok_id,
      isSuperadmin: p.is_superadmin,
      statusApproval: p.status_approval,
      email: p.email,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return { success: true, data: formattedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function upsertPengurusToSupabase(p) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const payload = {
      nama: p.nama,
      no_wa: p.no_wa,
      tingkatan: p.tingkatan,
      peran: p.peran,
      daerah_id: p.daerah_id || null,
      desa_id: p.desa_id || null,
      kelompok_id: p.kelompok_id || null,
      is_superadmin: p.isSuperadmin || false,
      status_approval: p.statusApproval || 'pending',
      email: p.email || null,
    };

    const isUuid = typeof p.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
    if (isUuid) {
      payload.id = p.id;
    }

    const { data, error } = await client
      .from("pengurus")
      .upsert([payload], { onConflict: "id" })
      .select();

    if (error) throw error;
    
    const row = data[0];
    return { 
      success: true, 
      data: {
        id: row.id,
        nama: row.nama,
        no_wa: row.no_wa,
        tingkatan: row.tingkatan,
        peran: row.peran,
        daerah_id: row.daerah_id,
        desa_id: row.desa_id,
        kelompok_id: row.kelompok_id,
        isSuperadmin: row.is_superadmin,
        statusApproval: row.status_approval,
        email: row.email,
        created_at: row.created_at,
        updated_at: row.updated_at
      } 
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deletePengurusFromSupabase(id) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return { success: true };

    const { error } = await client
      .from("pengurus")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
   FUNGSI SINKRONISASI ABSENSI / KBM
   ═══════════════════════════════════════════════════════════════ */

export async function fetchKbmEventsFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data, error } = await client
      .from("absensi_sesi")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const formattedData = data.map(evt => {
      let rekapKehadiran = {};
      try {
        if (evt.catatan_sesi) {
          rekapKehadiran = JSON.parse(evt.catatan_sesi);
        }
      } catch(e) {}
      
      return {
        id: evt.id,
        jenis: evt.kategori_usia === 'caberawit' ? 'kelompok' : 'desa',
        title: evt.materi_kbm || "Event KBM",
        date: evt.tanggal_kbm,
        kategori_usia: [evt.kategori_usia],
        materi: evt.materi_kbm,
        pengajar: "Pengajar",
        absensi: rekapKehadiran,
        created_at: evt.created_at
      };
    });

    return { success: true, data: formattedData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function upsertKbmEventToSupabase(evtData) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const { data: kelData } = await client.from("kelompok").select("id").limit(1);
    const validKelompokId = kelData && kelData.length > 0 ? kelData[0].id : null;
    if (!validKelompokId) return { success: false, message: "Tidak ada data kelompok di Supabase" };

    const payload = {
      kelompok_id: validKelompokId,
      kategori_usia: evtData.kategori_usia?.[0] || 'caberawit',
      tanggal_kbm: evtData.date || new Date().toISOString().split('T')[0],
      materi_kbm: evtData.title || evtData.materi || 'Materi KBM',
      catatan_sesi: JSON.stringify(evtData.absensi || {})
    };

    const isUuid = typeof evtData.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evtData.id);
    if (isUuid) {
      payload.id = evtData.id;
    }

    const { data, error } = await client
      .from("absensi_sesi")
      .upsert([payload], { onConflict: "id" })
      .select();

    if (error) throw error;
    
    const returnedRow = data[0];
    evtData.id = returnedRow.id;
    
    return { success: true, data: evtData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteKbmEventFromSupabase(id) {
  const client = getSupabase();
  if (!client) return { success: false, message: "Supabase client belum aktif." };

  try {
    const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return { success: true };

    const { error } = await client
      .from("absensi_sesi")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
