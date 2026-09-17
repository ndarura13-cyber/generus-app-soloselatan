/**
 * supabase.js — Modul Integrasi Database Supabase untuk PPG Solo Selatan
 * Menggunakan @supabase/supabase-js via CDN ESM tanpa perlu bundler eksternal.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


const UUID_MAP = {
  "daerah-solo-selatan": "8a9c20cb-7011-4e43-b89b-08708bab28cd",
  "8a9c20cb-7011-4e43-b89b-08708bab28cd": "daerah-solo-selatan",
  "desa-barat": "d4e05c08-740f-4616-8901-550d82e40d03",
  "d4e05c08-740f-4616-8901-550d82e40d03": "desa-barat",
  "desa-selatan": "2567d87f-7592-4a76-80da-19c3a8cd7634",
  "2567d87f-7592-4a76-80da-19c3a8cd7634": "desa-selatan",
  "desa-tengah": "2382963b-d89d-4447-8b6c-5b923dabe574",
  "2382963b-d89d-4447-8b6c-5b923dabe574": "desa-tengah",
  "desa-timur-1": "1687efe3-f572-47b7-9e2e-ca89517ff515",
  "1687efe3-f572-47b7-9e2e-ca89517ff515": "desa-timur-1",
  "desa-timur-2": "84d49306-7876-4f25-9719-f356becabb2e",
  "84d49306-7876-4f25-9719-f356becabb2e": "desa-timur-2",
  "kel-gentan": "78f8baaf-8de5-4210-b024-bc63ca3f9363",
  "78f8baaf-8de5-4210-b024-bc63ca3f9363": "kel-gentan",
  "kel-pajang": "8e0f3849-86b2-4cbd-9b21-62bd0385f227",
  "8e0f3849-86b2-4cbd-9b21-62bd0385f227": "kel-pajang",
  "kel-sondakan": "6783debc-7157-4b7f-a25e-1be2f6bda77b",
  "6783debc-7157-4b7f-a25e-1be2f6bda77b": "kel-sondakan",
  "kel-songgalan": "7b56a614-5b38-4d26-97eb-a86c70c9948f",
  "7b56a614-5b38-4d26-97eb-a86c70c9948f": "kel-songgalan",
  "kel-teposanan": "89643ffb-02e1-40c6-860f-50fdc0d8a873",
  "89643ffb-02e1-40c6-860f-50fdc0d8a873": "kel-teposanan",
  "kel-joyotakan-1": "77920eac-e491-420c-8449-44b56fd5b933",
  "77920eac-e491-420c-8449-44b56fd5b933": "kel-joyotakan-1",
  "kel-joyotakan-2": "42c26f45-fb47-4a98-9b9b-3a18b47192c3",
  "42c26f45-fb47-4a98-9b9b-3a18b47192c3": "kel-joyotakan-2",
  "kel-kaliwingko": "735e57b0-f7ce-4c1d-85bd-8b754106d0e7",
  "735e57b0-f7ce-4c1d-85bd-8b754106d0e7": "kel-kaliwingko",
  "kel-solo-baru": "398592f8-3ca1-443d-a9a0-be6dc1916442",
  "398592f8-3ca1-443d-a9a0-be6dc1916442": "kel-solo-baru",
  "kel-baluwarti": "e0a289be-b6cc-45de-8d1f-ac8e45972883",
  "e0a289be-b6cc-45de-8d1f-ac8e45972883": "kel-baluwarti",
  "kel-mojo-1": "9c81b237-232a-4c52-8eb5-45f940cc97a0",
  "9c81b237-232a-4c52-8eb5-45f940cc97a0": "kel-mojo-1",
  "kel-mojo-2": "a7c1af44-0e5c-4fbb-a86f-e95bc5f179a1",
  "a7c1af44-0e5c-4fbb-a86f-e95bc5f179a1": "kel-mojo-2",
  "kel-sampangan": "e0a91130-16df-4bd0-82f8-36b9b3302bf9",
  "e0a91130-16df-4bd0-82f8-36b9b3302bf9": "kel-sampangan",
  "kel-semanggi": "29c4c4ab-b1dc-40cc-9a6f-468359bab38e",
  "29c4c4ab-b1dc-40cc-9a6f-468359bab38e": "kel-semanggi",
  "kel-gunung-sari": "8e04825a-8181-4289-b770-fc277f5bc91f",
  "8e04825a-8181-4289-b770-fc277f5bc91f": "kel-gunung-sari",
  "kel-gunung-wijil-1": "ce792de0-56b3-4a08-ad17-5f17fc97114c",
  "ce792de0-56b3-4a08-ad17-5f17fc97114c": "kel-gunung-wijil-1",
  "kel-gunung-wijil-2": "654556c9-d8dd-4e00-93c9-1fb9bf65476f",
  "654556c9-d8dd-4e00-93c9-1fb9bf65476f": "kel-gunung-wijil-2",
  "kel-kapohan": "43fbd57e-f810-49d4-800d-451f79c34a5c",
  "43fbd57e-f810-49d4-800d-451f79c34a5c": "kel-kapohan",
  "kel-randurejo": "15834786-4d30-4b49-947e-31b3316972e4",
  "15834786-4d30-4b49-947e-31b3316972e4": "kel-randurejo",
  "kel-winong": "16dd2196-77da-4c4c-a054-6ee9da6ec1f3",
  "16dd2196-77da-4c4c-a054-6ee9da6ec1f3": "kel-winong",
  "kel-ngasinan": "11941c31-3585-4d12-ba33-2c4b95511c33",
  "11941c31-3585-4d12-ba33-2c4b95511c33": "kel-ngasinan",
  "kel-ngoresan": "d24602d1-4bf0-41ad-85d8-305f5d5b0d95",
  "d24602d1-4bf0-41ad-85d8-305f5d5b0d95": "kel-ngoresan",
  "kel-petoran": "bcd2dd15-2111-4860-bd54-b25aa54b4806",
  "bcd2dd15-2111-4860-bd54-b25aa54b4806": "kel-petoran",
  "kel-pucangsawit-1": "1e7702b3-ef35-43c4-842f-369b3eb663ae",
  "1e7702b3-ef35-43c4-842f-369b3eb663ae": "kel-pucangsawit-1",
  "kel-pucangsawit-2": "ebaf1b25-6ec6-43d6-8f9d-4ef89928301f",
  "ebaf1b25-6ec6-43d6-8f9d-4ef89928301f": "kel-pucangsawit-2",
  "kel-pucangsawit-indah": "32f9c6a8-c590-4fcb-8c20-f076c949e466",
  "32f9c6a8-c590-4fcb-8c20-f076c949e466": "kel-pucangsawit-indah",
  "kel-sekarpace": "57941bad-744a-454b-b8ca-c7ab9bd05fc0",
  "57941bad-744a-454b-b8ca-c7ab9bd05fc0": "kel-sekarpace"
};

function mapIdToUuid(id) {
  if (!id) return null;
  return UUID_MAP[id] || id;
}

function mapUuidToId(uuid) {
  if (!uuid) return null;
  return UUID_MAP[uuid] || uuid;
}

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

    const resultData = error ? (await client.from("siswa").select("*").order("nama_lengkap", { ascending: true })).data || [] : data || [];
    
    // Map nama_desa -> desa_nama agar sesuai standar UI
    const mappedData = resultData.map(s => {
      return {
        ...s,
        daerah_id: mapUuidToId(s.daerah_id),
        desa_id: mapUuidToId(s.desa_id),
        kelompok_id: mapUuidToId(s.kelompok_id),
        desa_nama: s.nama_desa || s.desa_nama || '-',
        kelompok_nama: s.nama_kelompok || s.kelompok_nama || '-'
      };
    });
    
    return { success: true, data: mappedData };
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

// Proker CRUD functions (fetchProkerFromSupabase, upsertProkerToSupabase, deleteProkerFromSupabase)
// are fully defined with schema mapping in the Program Kerja section at the bottom of this file.

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
    return { success: true };
  } catch (err) {
    console.warn("Auto-sync Supabase (Upsert Nilai) gagal:", err);
    return { success: false, error: err.message };
  }
}



// Inisialisasi awal saat modul dimuat
initSupabaseClient();



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
      noWa: p.no_wa,
      tingkatan: p.tingkatan,
      peran: p.peran,
      daerahId: mapUuidToId(p.daerah_id),
      desaId: mapUuidToId(p.desa_id),
      kelompokId: mapUuidToId(p.kelompok_id),
      isSuperadmin: p.is_superadmin,
      statusApproval: p.status_approval,
      isActive: p.is_active !== false,
      email: p.email,
      password: p.password_hash,
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
      no_wa: p.noWa || p.no_wa || null,
      tingkatan: p.tingkatan,
      peran: p.peran,
      daerah_id: mapIdToUuid(p.daerahId || p.daerah_id) || null,
      desa_id: mapIdToUuid(p.desaId || p.desa_id) || null,
      kelompok_id: mapIdToUuid(p.kelompokId || p.kelompok_id) || null,
      is_superadmin: p.isSuperadmin !== undefined ? p.isSuperadmin : (p.is_superadmin || false),
      status_approval: p.statusApproval || p.status_approval || 'pending',
      email: p.email || null,
    };

    if (p.password) payload.password_hash = p.password;

    const isUuid = typeof p.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
    if (isUuid) {
      payload.id = p.id;
    }

    let data, error;
    
    if (payload.id) {
      const res = await client
        .from("pengurus")
        .upsert([payload], { onConflict: "id" })
        .select();
      data = res.data;
      error = res.error;
    } else {
      const res = await client
        .from("pengurus")
        .insert([payload])
        .select();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    
    const row = data[0];
    return { 
      success: true, 
      data: {
        id: row.id,
        nama: row.nama,
        no_wa: row.no_wa,
        noWa: row.no_wa,
        tingkatan: row.tingkatan,
        peran: row.peran,
        jabatan: row.peran,
        daerahId: mapUuidToId(row.daerah_id),
        desaId: mapUuidToId(row.desa_id),
        kelompokId: mapUuidToId(row.kelompok_id),
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
        format_kbm: evt.kategori_usia === 'caberawit' ? 'kelompok' : 'desa',
        judul: evt.materi_kbm || "Event KBM",
        hari_tanggal: evt.tanggal_kbm,
        jam: '19.30 - 21.00 WIB',
        kategori_usia: [evt.kategori_usia],
        materi: evt.materi_kbm,
        pengajar: "Pengajar",
        rekap_kehadiran: rekapKehadiran,
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
      kategori_usia: evtData.format_kbm === 'kelompok' ? 'caberawit' : 'remaja',
      tanggal_kbm: evtData.hari_tanggal || new Date().toISOString().split('T')[0],
      materi_kbm: evtData.judul || evtData.materi || 'Materi KBM',
      catatan_sesi: JSON.stringify(evtData.rekap_kehadiran || {})
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

// --- MASTER WILAYAH ---
export async function fetchWilayahFromSupabase() {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabase();
  if (!client) return null;
  try {
    const [daerahRes, desaRes, kelRes] = await Promise.all([
      client.from('daerah').select('*').order('created_at', { ascending: true }),
      client.from('desa').select('*').order('urutan', { ascending: true }),
      client.from('kelompok').select('*').order('urutan', { ascending: true })
    ]);

    if (!daerahRes.data || !desaRes.data || !kelRes.data) return null;

    const d = daerahRes.data[0] || {};
    const daerahId = mapUuidToId(d.id) || "daerah-solo-selatan";

    const desaMapped = desaRes.data.map(desa => {
      const desaId = mapUuidToId(desa.id) || desa.id;
      const kelompokMapped = kelRes.data
        .filter(k => k.desa_id === desa.id)
        .map(k => ({
          id: mapUuidToId(k.id) || k.id,
          nama: k.nama_kelompok || k.nama
        }));

      return {
        id: desaId,
        nama: desa.nama_desa || desa.nama,
        kelompok: kelompokMapped
      };
    });

    return {
      daerah: {
        id: daerahId,
        nama: d.nama_daerah || "Solo Selatan",
        kode: d.kode_daerah || "SLO-SEL"
      },
      desa: desaMapped
    };
  } catch (err) {
    console.error("Supabase Error fetching Wilayah:", err.message);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROKER (PROGRAM KERJA)
   ═══════════════════════════════════════════════════════════════ */

export async function fetchProkerFromSupabase() {
  const client = getSupabase();
  if (!client) return { success: false, data: [] };

  try {
    const { data, error } = await client
      .from("program_kerja")
      .select("*")
      .order("nomor_urut", { ascending: true });

    if (error) throw error;

    const statusMapFromDb = {
      'selesai': 'done',
      'sedang_berlangsung': 'ongoing',
      'akan_datang': 'upcoming',
      'direncanakan': 'planned'
    };

    const mapped = (data || []).map(row => ({
      id: row.id,
      no: row.nomor_urut,
      kegiatan: row.judul_program,
      waktu: row.waktu_pelaksanaan,
      sasaran: row.sasaran_peserta,
      tujuan: row.tujuan_kegiatan,
      rincianBiaya: row.rincian_biaya,
      estBiaya: Number(row.estimasi_biaya) || 0,
      tempat: row.tempat_pelaksanaan,
      status: statusMapFromDb[row.status] || row.status || 'planned',
      tingkatWilayah: row.tingkat_wilayah || 'daerah',
      semester: row.semester || 1,
      desaId: row.desa_id,
      kelompokId: row.kelompok_id
    }));

    return { success: true, data: mapped };
  } catch (err) {
    console.error("Supabase Error fetching Proker:", err);
    return { success: false, data: [], error: err.message };
  }
}

export async function upsertProkerToSupabase(proker) {
  const client = getSupabase();
  if (!client) return null;

  try {
    const statusMapToDb = {
      'done': 'selesai',
      'ongoing': 'sedang_berlangsung',
      'upcoming': 'akan_datang',
      'planned': 'direncanakan'
    };

    const isUuid = typeof proker.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(proker.id);

    const record = {
      nomor_urut: parseInt(proker.no) || 1,
      judul_program: proker.kegiatan,
      waktu_pelaksanaan: proker.waktu || null,
      sasaran_peserta: proker.sasaran || null,
      tujuan_kegiatan: proker.tujuan || null,
      rincian_biaya: proker.rincianBiaya || null,
      estimasi_biaya: Number(proker.estBiaya) || 0,
      tempat_pelaksanaan: proker.tempat || null,
      status: statusMapToDb[proker.status] || proker.status || 'direncanakan',
      tingkat_wilayah: proker.tingkatWilayah || 'daerah',
      semester: parseInt(proker.semester) || 1
    };

    if (isUuid) record.id = proker.id;

    const { data, error } = await client
      .from("program_kerja")
      .upsert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Supabase Error upserting Proker:", err.message);
    return null;
  }
}

export async function deleteProkerFromSupabase(prokerId) {
  const client = getSupabase();
  if (!client) return false;
  try {
    const isUuid = typeof prokerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prokerId);
    if (!isUuid) return true; // Local item only

    const { error } = await client.from('program_kerja').delete().eq('id', prokerId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase Error deleting Proker:", err.message);
    return false;
  }
}
