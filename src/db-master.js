/* ═══════════════════════════════════════════════════════════════
   PPG Solo Selatan — Master Data & Pengurus Management System
   Hirarki: Daerah (Solo Selatan) > 5 Desa > 27 Kelompok (A-Z)
   ═══════════════════════════════════════════════════════════════ */

import { 
  isSupabaseConfigured, 
  fetchSiswaFromSupabase,
  upsertSiswaToSupabase, 
  deleteSiswaFromSupabase,
  fetchEventPembiasaanFromSupabase,
  upsertEventPembiasaanToSupabase,
  deleteEventPembiasaanFromSupabase,
  fetchNilaiPembiasaanFromSupabase,
  upsertNilaiPembiasaanToSupabase,
  fetchPengurusFromSupabase,
  upsertPengurusToSupabase,
  deletePengurusFromSupabase,
  fetchKbmEventsFromSupabase,
  upsertKbmEventToSupabase,
  deleteKbmEventFromSupabase,
  fetchWilayahFromSupabase
} from "./supabase.js";

export let MASTER_WILAYAH = {
  daerah: {
    id: "daerah-solo-selatan",
    nama: "Solo Selatan",
    kode: "SLO-SEL",
  },
  desa: [
    {
      id: "desa-barat",
      nama: "Barat",
      kelompok: [
        { id: "kel-gentan", nama: "Gentan" },
        { id: "kel-pajang", nama: "Pajang" },
        { id: "kel-sondakan", nama: "Sondakan" },
        { id: "kel-songgalan", nama: "Songgalan" },
        { id: "kel-teposanan", nama: "Teposanan" },
      ],
    },
    {
      id: "desa-selatan",
      nama: "Selatan",
      kelompok: [
        { id: "kel-joyotakan-1", nama: "Joyotakan 1" },
        { id: "kel-joyotakan-2", nama: "Joyotakan 2" },
        { id: "kel-kaliwingko", nama: "Kaliwingko" },
        { id: "kel-solo-baru", nama: "Solo Baru" },
      ],
    },
    {
      id: "desa-tengah",
      nama: "Tengah",
      kelompok: [
        { id: "kel-baluwarti", nama: "Baluwarti" },
        { id: "kel-mojo-1", nama: "Mojo 1" },
        { id: "kel-mojo-2", nama: "Mojo 2" },
        { id: "kel-sampangan", nama: "Sampangan" },
        { id: "kel-semanggi", nama: "Semanggi" },
      ],
    },
    {
      id: "desa-timur-1",
      nama: "Timur 1",
      kelompok: [
        { id: "kel-gunung-sari", nama: "Gunung Sari" },
        { id: "kel-gunung-wijil-1", nama: "Gunung Wijil 1" },
        { id: "kel-gunung-wijil-2", nama: "Gunung Wijil 2" },
        { id: "kel-kapohan", nama: "Kapohan" },
        { id: "kel-randurejo", nama: "Randurejo" },
        { id: "kel-winong", nama: "Winong" },
      ],
    },
    {
      id: "desa-timur-2",
      nama: "Timur 2",
      kelompok: [
        { id: "kel-ngasinan", nama: "Ngasinan" },
        { id: "kel-ngoresan", nama: "Ngoresan" },
        { id: "kel-petoran", nama: "Petoran" },
        { id: "kel-pucangsawit-1", nama: "Pucangsawit 1" },
        { id: "kel-pucangsawit-2", nama: "Pucangsawit 2" },
        { id: "kel-pucangsawit-indah", nama: "Pucangsawit Indah" },
        { id: "kel-sekarpace", nama: "Sekarpace" },
      ],
    },
  ],
};

// Fetch wilayah dari Supabase saat module ini pertama kali dimuat (Top-Level Await)
try {
  const supabaseWilayah = await fetchWilayahFromSupabase();
  if (supabaseWilayah) {
    MASTER_WILAYAH = supabaseWilayah;
  }
} catch (error) {
  console.error("Failed to load MASTER_WILAYAH from Supabase:", error);
}

// Helper: Ambil semua kelompok sebagai flat array (Terurut Alfabetis)
export function getAllKelompok() {
  const result = [];
  MASTER_WILAYAH.desa.forEach((desa) => {
    desa.kelompok.forEach((kel) => {
      result.push({
        ...kel,
        desaId: desa.id,
        desaNama: desa.nama,
      });
    });
  });
  return result.sort((a, b) => a.nama.localeCompare(b.nama));
}

// Master Kategori & Jenjang Usia
export const MASTER_JENJANG = {
  caberawit: {
    label: "Caberawit",
    tingkat: ["PAUD", "TK", "SD"],
  },
  gp_reguler: {
    label: "GP Reguler",
    tingkat: ["1 SMP", "2 SMP", "3 SMP", "1 SMA", "2 SMA", "3 SMA"],
  },
  remaja: {
    label: "Remaja",
    tingkat: ["Kelas Remaja", "Pra-Nikah"],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// STRUKTUR PERAN & TANGGUNG JAWAB RESMI PPG (URUTAN STRUKTURAL RESMI)
// Urutan: Ketua > Wakil Ketua > Sekretaris > Bendahara > Kurikulum >
//         Tenaga Pendidik > Penggalang Dana > Sarana Prasarana >
//         Kegiatan Muda Mudi > Seni dan Olah Raga > Kemandirian >
//         Keputrian > Bimbingan Konseling > Tahfidz
// ═══════════════════════════════════════════════════════════════════════════
export const MASTER_STRUKTUR_PERAN = {
  daerah: {
    kategori: "Pengurus PPG",
    tingkatan: "daerah",
    label: "Pengurus PPG (Tingkat Daerah)",
    roles: [
      "Ketua",
      "Wakil Ketua",
      "Sekretaris",
      "Bendahara",
      "Kurikulum",
      "Tenaga Pendidik",
      "Penggalang Dana",
      "Sarana dan Prasarana",
      "Kegiatan Muda Mudi",
      "Seni dan Olahraga",
      "Kemandirian",
      "Keputrian",
      "Bimbingan Konseling",
      "Tahfidz"
    ]
  },
  desa: {
    kategori: "Koordinator Desa",
    tingkatan: "desa",
    label: "Koordinator Desa (Tingkat Desa)",
    roles: [
      "Koordinator Caberawit (Paud - SD)",
      "Koordinator GP Reguler",
      "Ketua Remaja Desa",
      "Pengurus Desa"
    ]
  },
  kelompok: {
    kategori: "Pamong Kelompok",
    tingkatan: "kelompok",
    label: "Pamong Kelompok (Tingkat Kelompok)",
    roles: [
      "Pamong Caberawit (Paud - SD)",
      "Pamong GP Reguler",
      "Ketua Remaja Kelompok",
      "Pengurus Kelompok"
    ]
  }
};

export function getRolesByTingkatan(tingkatan) {
  const cfg = MASTER_STRUKTUR_PERAN[tingkatan] || MASTER_STRUKTUR_PERAN.kelompok;
  return cfg.roles;
}

// Initial Seed Pengurus PPG Solo Selatan (Sesuai Urutan Struktural Resmi)
const DEFAULT_PENGURUS_LIST = [
  // ── 1. JAJARAN STRUKTUR PENGURUS PPG SOLO SELATAN (TINGKAT DAERAH) ──
  // 1. Ketua
  {
    id: "pengurus-superadmin",
    nama: "H. Ahmad Sulaiman",
    email: "admin.daerah@ppgsolo.org",
    password: "admin",
    noWa: "081234567890",
    tingkatan: "daerah",
    peran: "Ketua",
    jabatan: "Ketua",
    isSuperadmin: true,
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-gentan",
    kelompokNama: "Gentan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T08:00:00Z",
  },
  // 2. Wakil Ketua
  {
    id: "pengurus-daerah-wakil",
    nama: "Ust. H. Abdullah Mansur",
    email: "wakil.daerah@ppgsolo.org",
    password: "123",
    noWa: "081277112233",
    tingkatan: "daerah",
    peran: "Wakil Ketua",
    jabatan: "Wakil Ketua",
    isSuperadmin: false,
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-joyotakan-1",
    kelompokNama: "Joyotakan 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T08:30:00Z",
  },
  // 3. Sekretaris
  {
    id: "pengurus-daerah-sekretaris",
    nama: "Drs. H. Bambang Irawan",
    email: "sekretaris.daerah@ppgsolo.org",
    password: "123",
    noWa: "081388223344",
    tingkatan: "daerah",
    peran: "Sekretaris",
    jabatan: "Sekretaris",
    isSuperadmin: false,
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-winong",
    kelompokNama: "Winong",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T09:00:00Z",
  },
  // 4. Bendahara
  {
    id: "pengurus-daerah-bendahara",
    nama: "H. Sukardi, S.E.",
    email: "bendahara.daerah@ppgsolo.org",
    password: "123",
    noWa: "081399334455",
    tingkatan: "daerah",
    peran: "Bendahara",
    jabatan: "Bendahara",
    isSuperadmin: false,
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-mojo-1",
    kelompokNama: "Mojo 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T09:30:00Z",
  },
  // 5. Kurikulum
  {
    id: "pengurus-daerah-kurikulum",
    nama: "Ust. M. Rasyid",
    email: "kurikulum.daerah@ppgsolo.org",
    password: "123",
    noWa: "081266445566",
    tingkatan: "daerah",
    peran: "Kurikulum",
    jabatan: "Kurikulum",
    isSuperadmin: false,
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-sondakan",
    kelompokNama: "Sondakan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T10:00:00Z",
  },
  // 6. Tenaga Pendidik
  {
    id: "pengurus-daerah-tendik",
    nama: "Ust. Farhan Arifin",
    email: "tendik.daerah@ppgsolo.org",
    password: "123",
    noWa: "081255667788",
    tingkatan: "daerah",
    peran: "Tenaga Pendidik",
    jabatan: "Tenaga Pendidik",
    isSuperadmin: false,
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-ngasinan",
    kelompokNama: "Ngasinan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T10:30:00Z",
  },
  // 7. Penggalang Dana
  {
    id: "pengurus-daerah-dana",
    nama: "Bpk. Hendro Wijaya",
    email: "dana.daerah@ppgsolo.org",
    password: "123",
    noWa: "081233889911",
    tingkatan: "daerah",
    peran: "Penggalang Dana",
    jabatan: "Penggalang Dana",
    isSuperadmin: false,
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-pajang",
    kelompokNama: "Pajang",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T09:45:00Z",
  },
  // 8. Sarana dan Prasarana
  {
    id: "pengurus-daerah-sarpras",
    nama: "Bpk. H. Agus Wahyudi",
    email: "sarpras.daerah@ppgsolo.org",
    password: "123",
    noWa: "081322334488",
    tingkatan: "daerah",
    peran: "Sarana dan Prasarana",
    jabatan: "Sarana dan Prasarana",
    isSuperadmin: false,
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-sekarpace",
    kelompokNama: "Sekarpace",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T11:30:00Z",
  },
  // 9. Kegiatan Muda Mudi
  {
    id: "pengurus-daerah-mudamudi",
    nama: "Ust. Irfan Hakim",
    email: "mudamudi.daerah@ppgsolo.org",
    password: "123",
    noWa: "081344778899",
    tingkatan: "daerah",
    peran: "Kegiatan Muda Mudi",
    jabatan: "Kegiatan Muda Mudi",
    isSuperadmin: false,
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-solo-baru",
    kelompokNama: "Solo Baru",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T11:00:00Z",
  },
  // 10. Seni dan Olahraga
  {
    id: "pengurus-daerah-olahraga",
    nama: "Bpk. Eko Prabowo",
    email: "olahraga.daerah@ppgsolo.org",
    password: "123",
    noWa: "081377665511",
    tingkatan: "daerah",
    peran: "Seni dan Olahraga",
    jabatan: "Seni dan Olahraga",
    isSuperadmin: false,
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-sampangan",
    kelompokNama: "Sampangan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T10:15:00Z",
  },
  // 11. Kemandirian
  {
    id: "pengurus-daerah-kemandirian",
    nama: "Ust. Danang Prasetyo",
    email: "kemandirian.daerah@ppgsolo.org",
    password: "123",
    noWa: "081366114477",
    tingkatan: "daerah",
    peran: "Kemandirian",
    jabatan: "Kemandirian",
    isSuperadmin: false,
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-kapohan",
    kelompokNama: "Kapohan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T11:45:00Z",
  },
  // 12. Keputrian
  {
    id: "pengurus-daerah-keputrian",
    nama: "Ustzh. Siti Aminah",
    email: "keputrian.daerah@ppgsolo.org",
    password: "123",
    noWa: "081399447722",
    tingkatan: "daerah",
    peran: "Keputrian",
    jabatan: "Keputrian",
    isSuperadmin: false,
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-semanggi",
    kelompokNama: "Semanggi",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T12:00:00Z",
  },
  // 13. Bimbingan Konseling
  {
    id: "pengurus-daerah-bk",
    nama: "Ust. Dr. Wahyudi, M.Psi",
    email: "bk.daerah@ppgsolo.org",
    password: "123",
    noWa: "081288443399",
    tingkatan: "daerah",
    peran: "Bimbingan Konseling",
    jabatan: "Bimbingan Konseling",
    isSuperadmin: false,
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-gunung-sari",
    kelompokNama: "Gunung Sari",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T12:15:00Z",
  },
  // 14. Tahfidz
  {
    id: "pengurus-daerah-tahfidz",
    nama: "Ust. H. Ridho Ilahi",
    email: "tahfidz.daerah@ppgsolo.org",
    password: "123",
    noWa: "081388552211",
    tingkatan: "daerah",
    peran: "Tahfidz",
    jabatan: "Tahfidz",
    isSuperadmin: false,
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-solo-baru",
    kelompokNama: "Solo Baru",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-01T10:45:00Z",
  },

  // ── 2. KOORDINATOR DESA (TINGKAT DESA) ──
  {
    id: "pengurus-desa-barat",
    nama: "Ust. Rahmat Hidayat",
    email: "barat@ppgsolo.org",
    password: "123",
    noWa: "081298765432",
    tingkatan: "desa",
    peran: "Koordinator Caberawit (Paud - SD)",
    jabatan: "Koordinator Caberawit (Paud - SD)",
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-gentan",
    kelompokNama: "Gentan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-05T09:00:00Z",
  },
  {
    id: "pengurus-desa-tengah",
    nama: "Ust. Hasan Basri",
    email: "tengah@ppgsolo.org",
    password: "123",
    noWa: "081233449900",
    tingkatan: "desa",
    peran: "Koordinator GP Reguler",
    jabatan: "Koordinator GP Reguler",
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-mojo-1",
    kelompokNama: "Mojo 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-05T10:00:00Z",
  },
  {
    id: "pengurus-desa-selatan",
    nama: "Ust. Syarif Hidayatullah",
    email: "selatan@ppgsolo.org",
    password: "123",
    noWa: "081277665544",
    tingkatan: "desa",
    peran: "Ketua Remaja Desa",
    jabatan: "Ketua Remaja Desa",
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-joyotakan-2",
    kelompokNama: "Joyotakan 2",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-06T09:00:00Z",
  },
  {
    id: "pengurus-desa-timur1",
    nama: "Ust. Burhanuddin",
    email: "timur1@ppgsolo.org",
    password: "123",
    noWa: "081233445577",
    tingkatan: "desa",
    peran: "Pengurus Desa",
    jabatan: "Pengurus Desa",
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-winong",
    kelompokNama: "Winong",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-07T09:00:00Z",
  },
  {
    id: "pengurus-desa-timur2",
    nama: "Ust. M. Ihsan",
    email: "timur2@ppgsolo.org",
    password: "123",
    noWa: "081299881122",
    tingkatan: "desa",
    peran: "Koordinator Caberawit (Paud - SD)",
    jabatan: "Koordinator Caberawit (Paud - SD)",
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-ngasinan",
    kelompokNama: "Ngasinan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-07T10:00:00Z",
  },

  // ── 3. PAMONG KELOMPOK (TINGKAT KELOMPOK) ──
  // Desa Barat
  {
    id: "pengurus-kel-gentan-1",
    nama: "Bpk. Bambang Sutrisno",
    email: "pamong.gentan@ppgsolo.org",
    password: "123",
    noWa: "081356789012",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-gentan",
    kelompokNama: "Gentan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "pengurus-kel-gentan-2",
    nama: "Ibu Siti Rahmawati",
    email: "pamong2.gentan@ppgsolo.org",
    password: "123",
    noWa: "081377889900",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-gentan",
    kelompokNama: "Gentan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-12T14:00:00Z",
  },
  {
    id: "pengurus-kel-sondakan",
    nama: "Ust. Marzuki",
    email: "marzuki.sondakan@ppgsolo.org",
    password: "123",
    noWa: "081266554433",
    tingkatan: "kelompok",
    peran: "Pengurus Kelompok",
    jabatan: "Pengurus Kelompok",
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-sondakan",
    kelompokNama: "Sondakan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-14T08:00:00Z",
  },
  {
    id: "pengurus-kel-pajang",
    nama: "Ust. Hendra Setiawan",
    email: "hendra.pajang@ppgsolo.org",
    password: "123",
    noWa: "081244332211",
    tingkatan: "kelompok",
    peran: "Ketua Remaja Kelompok",
    jabatan: "Ketua Remaja Kelompok",
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-pajang",
    kelompokNama: "Pajang",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-15T09:00:00Z",
  },

  // Desa Tengah
  {
    id: "pengurus-kel-mojo1",
    nama: "Ust. Zulkifli Hasan",
    email: "pamong.mojo1@ppgsolo.org",
    password: "123",
    noWa: "081223344556",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-mojo-1",
    kelompokNama: "Mojo 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-16T10:00:00Z",
  },
  {
    id: "pengurus-kel-mojo2",
    nama: "Bpk. Dwi Prasetyo",
    email: "dwi.mojo2@ppgsolo.org",
    password: "123",
    noWa: "081288776655",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-mojo-2",
    kelompokNama: "Mojo 2",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-17T11:00:00Z",
  },
  {
    id: "pengurus-kel-sampangan",
    nama: "Ust. Agus Salim",
    email: "agus.sampangan@ppgsolo.org",
    password: "123",
    noWa: "081311223344",
    tingkatan: "kelompok",
    peran: "Pengurus Kelompok",
    jabatan: "Pengurus Kelompok",
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-sampangan",
    kelompokNama: "Sampangan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-18T13:00:00Z",
  },
  {
    id: "pengurus-kel-semanggi",
    nama: "Ibu Tri Wahyuni",
    email: "tri.semanggi@ppgsolo.org",
    password: "123",
    noWa: "081344556677",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-semanggi",
    kelompokNama: "Semanggi",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-19T14:00:00Z",
  },

  // Desa Selatan
  {
    id: "pengurus-kel-solobaru",
    nama: "Ibu Siti Fatimah",
    email: "fatimah.solo@ppgsolo.org",
    password: "123",
    noWa: "081399887766",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-solo-baru",
    kelompokNama: "Solo Baru",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "pengurus-kel-joyo1",
    nama: "Ust. Faisal Rahman",
    email: "faisal.joyo1@ppgsolo.org",
    password: "123",
    noWa: "081299001122",
    tingkatan: "kelompok",
    peran: "Ketua Remaja Kelompok",
    jabatan: "Ketua Remaja Kelompok",
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-joyotakan-1",
    kelompokNama: "Joyotakan 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-21T08:00:00Z",
  },
  {
    id: "pengurus-kel-joyo2",
    nama: "Ust. Ridwan Kamil",
    email: "ridwan.joyo2@ppgsolo.org",
    password: "123",
    noWa: "081388990011",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-selatan",
    desaNama: "Selatan",
    kelompokId: "kel-joyotakan-2",
    kelompokNama: "Joyotakan 2",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-22T09:00:00Z",
  },

  // Desa Timur 1
  {
    id: "pengurus-kel-winong",
    nama: "Bpk. Joko Susilo",
    email: "joko.winong@ppgsolo.org",
    password: "123",
    noWa: "081377665522",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-winong",
    kelompokNama: "Winong",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-23T10:00:00Z",
  },
  {
    id: "pengurus-kel-kapohan",
    nama: "Ust. Arif Wibowo",
    email: "arif.kapohan@ppgsolo.org",
    password: "123",
    noWa: "081266778899",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-kapohan",
    kelompokNama: "Kapohan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-23T11:00:00Z",
  },
  {
    id: "pengurus-kel-gw1",
    nama: "Ibu Nurul Hidayah",
    email: "nurul.gw1@ppgsolo.org",
    password: "123",
    noWa: "081355443322",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-gunung-wijil-1",
    kelompokNama: "Gunung Wijil 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-24T12:00:00Z",
  },
  {
    id: "pengurus-kel-gs",
    nama: "Ust. Slamet Riyadi",
    email: "slamet.gs@ppgsolo.org",
    password: "123",
    noWa: "081244556688",
    tingkatan: "kelompok",
    peran: "Ketua Remaja Kelompok",
    jabatan: "Ketua Remaja Kelompok",
    desaId: "desa-timur-1",
    desaNama: "Timur 1",
    kelompokId: "kel-gunung-sari",
    kelompokNama: "Gunung Sari",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-24T14:00:00Z",
  },

  // Desa Timur 2
  {
    id: "pengurus-kel-ngasinan",
    nama: "Bpk. H. Sugeng Riyanto",
    email: "sugeng.ngasinan@ppgsolo.org",
    password: "123",
    noWa: "081333221100",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-ngasinan",
    kelompokNama: "Ngasinan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-25T08:00:00Z",
  },
  {
    id: "pengurus-kel-ngoresan",
    nama: "Ust. Wahid Hasyim",
    email: "wahid.ngoresan@ppgsolo.org",
    password: "123",
    noWa: "081288997766",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-ngoresan",
    kelompokNama: "Ngoresan",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-25T11:00:00Z",
  },
  {
    id: "pengurus-kel-sekarpace",
    nama: "Ust. Anam Mustofa",
    email: "anam.sekarpace@ppgsolo.org",
    password: "123",
    noWa: "081377884422",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-sekarpace",
    kelompokNama: "Sekarpace",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-26T09:00:00Z",
  },
  {
    id: "pengurus-kel-ps1",
    nama: "Ust. Haris Kurniawan",
    email: "haris.ps1@ppgsolo.org",
    password: "123",
    noWa: "081211223388",
    tingkatan: "kelompok",
    peran: "Pengurus Kelompok",
    jabatan: "Pengurus Kelompok",
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-pucangsawit-1",
    kelompokNama: "Pucangsawit 1",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-26T13:00:00Z",
  },
  {
    id: "pengurus-kel-psi",
    nama: "Ibu Dewi Lestari",
    email: "dewi.psi@ppgsolo.org",
    password: "123",
    noWa: "081366554477",
    tingkatan: "kelompok",
    peran: "Ketua Remaja Kelompok",
    jabatan: "Ketua Remaja Kelompok",
    desaId: "desa-timur-2",
    desaNama: "Timur 2",
    kelompokId: "kel-pucangsawit-indah",
    kelompokNama: "Pucangsawit Indah",
    statusApproval: "approved",
    isActive: true,
    registeredAt: "2026-08-26T15:00:00Z",
  },

  // ── 4. PENDING APPROVAL ACCOUNTS (UNTUK DEMO APPROVAL) ──
  {
    id: "pengurus-pending-teposanan",
    nama: "Ust. Wildan Pratama",
    email: "wildan.teposanan@ppgsolo.org",
    password: "123",
    noWa: "081299334411",
    tingkatan: "kelompok",
    peran: "Pamong GP Reguler",
    jabatan: "Pamong GP Reguler",
    desaId: "desa-barat",
    desaNama: "Barat",
    kelompokId: "kel-teposanan",
    kelompokNama: "Teposanan",
    statusApproval: "pending",
    isActive: true,
    registeredAt: "2026-08-27T08:30:00Z",
  },
  {
    id: "pengurus-pending-baluwarti",
    nama: "Ibu Ratna Sari",
    email: "ratna.baluwarti@ppgsolo.org",
    password: "123",
    noWa: "081377221199",
    tingkatan: "kelompok",
    peran: "Pamong Caberawit (Paud - SD)",
    jabatan: "Pamong Caberawit (Paud - SD)",
    desaId: "desa-tengah",
    desaNama: "Tengah",
    kelompokId: "kel-baluwarti",
    kelompokNama: "Baluwarti",
    statusApproval: "pending",
    isActive: true,
    registeredAt: "2026-08-27T11:15:00Z",
  },
];

// Helper Storage Pengurus
const PENGURUS_STORAGE_KEY = "ppg_registered_pengurus_v5";

export function getPengurusList() {
  try {
    const raw = localStorage.getItem(PENGURUS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PENGURUS_STORAGE_KEY, JSON.stringify(DEFAULT_PENGURUS_LIST));
      return DEFAULT_PENGURUS_LIST;
    }
    const parsed = JSON.parse(raw);
    
    // Pastikan jika ada data baru yang belum ada di localstorage, kita gabungkan
    if (parsed.length < DEFAULT_PENGURUS_LIST.length) {
      const existingIds = new Set(parsed.map(p => p.id));
      const missing = DEFAULT_PENGURUS_LIST.filter(p => !existingIds.has(p.id));
      const combined = [...parsed, ...missing];
      localStorage.setItem(PENGURUS_STORAGE_KEY, JSON.stringify(combined));
      return combined.map(p => ({ ...p, isActive: p.isActive !== false }));
    }

    return parsed.map(p => ({
      ...p,
      isActive: p.isActive !== false,
    }));
  } catch (e) {
    return DEFAULT_PENGURUS_LIST;
  }
}

export function savePengurusList(list) {
  localStorage.setItem(PENGURUS_STORAGE_KEY, JSON.stringify(list));
}

export async function syncPengurusFromSupabase() {
  if (!isSupabaseConfigured()) return;
  const res = await fetchPengurusFromSupabase();
  if (res.success && res.data) {
    savePengurusList(res.data);
  }
}

export async function syncSiswaFromSupabase() {
  if (!isSupabaseConfigured()) return;
  const res = await fetchSiswaFromSupabase();
  if (res.success && res.data) {
    saveSiswaList(res.data);
  }
}

export async function syncKbmFromSupabase() {
  if (!isSupabaseConfigured()) return;
  const res = await fetchKbmEventsFromSupabase();
  if (res.success && res.data) {
    localStorage.setItem(KBM_EVENTS_STORAGE_KEY, JSON.stringify(res.data));
  }
}

// Ambil pengurus berdasarkan ID
export function getPengurusById(id) {
  const list = getPengurusList();
  return list.find(p => p.id === id) || null;
}

// Ambil seluruh jajaran Struktur Pengurus PPG Solo Selatan (Tingkat Daerah)
export function getPengurusDaerahList() {
  const list = getPengurusList();
  return list.filter(p => p.tingkatan === "daerah" && p.isActive !== false && p.statusApproval === "approved");
}

// Ambil daftar pengurus aktif & approved di suatu wilayah (Desa / Kelompok)
export function getPengurusByWilayah(desaId, kelompokId = null) {
  const list = getPengurusList();
  return list.filter(p => {
    if (p.isActive === false || p.statusApproval !== "approved") return false;

    if (kelompokId) {
      // Cari pengurus yang bertugas/berasal dari kelompok tersebut
      return p.kelompokId === kelompokId;
    } else if (desaId) {
      // Cari koordinator desa atau seluruh pengurus yang berakar di desa tersebut
      return p.desaId === desaId;
    }
    return false;
  });
}

// Tambah Pendaftaran Pengurus Baru (Self-Registration)
export async function registerNewPengurus(data) {
  const list = getPengurusList();
  
  const exists = list.find(p => p.email && data.email && p.email.toLowerCase() === data.email.toLowerCase());
  if (exists) {
    return { success: false, message: "Email atau akun ini sudah pernah terdaftar!" };
  }

  let newPengurus = {
    nama: data.nama,
    email: data.email,
    password: data.password || "123456",
    noWa: data.noWa,
    tingkatan: data.tingkatan || "kelompok",
    peran: data.peran || "pamong_caberawit",
    jabatan: data.jabatan || "Pamong Kelompok",
    desaId: data.desaId || "desa-barat",
    desaNama: data.desaNama || "Barat",
    kelompokId: data.kelompokId || "kel-gentan",
    kelompokNama: data.kelompokNama || "Gentan",
    statusApproval: "pending",
    isActive: true,
    registeredAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const res = await upsertPengurusToSupabase(newPengurus);
    if (res.success && res.data) {
      newPengurus = { ...newPengurus, ...res.data };
    } else {
      return { success: false, message: res.error || res.message };
    }
  } else {
    newPengurus.id = `pengurus-${Date.now()}`;
  }

  list.push(newPengurus);
  savePengurusList(list);

  return { 
    success: true, 
    data: newPengurus,
    message: "Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan (approval) dari Superadmin Daerah Solo Selatan."
  };
}

// Approve / Tolak Pengurus oleh Superadmin
export async function approvePengurus(pengurusId, isApproved = true) {
  const list = getPengurusList();
  const idx = list.findIndex(p => p.id === pengurusId);
  if (idx === -1) return { success: false, message: "Data pengurus tidak ditemukan." };

  list[idx].statusApproval = isApproved ? "approved" : "rejected";
  list[idx].approvedAt = new Date().toISOString();
  
  if (isSupabaseConfigured()) {
    const res = await upsertPengurusToSupabase(list[idx]);
    if (res.success && res.data) {
      list[idx] = { ...list[idx], ...res.data };
    } else {
      return { success: false, message: res.error || res.message };
    }
  }

  savePengurusList(list);

  return { 
    success: true, 
    data: list[idx],
    message: isApproved ? `Akun ${list[idx].nama} berhasil disetujui!` : `Akun ${list[idx].nama} telah ditolak.` 
  };
}

// Nonaktifkan / Aktifkan kembali Pengurus oleh Superadmin Daerah
export async function togglePengurusActive(pengurusId, makeActive) {
  const list = getPengurusList();
  const idx = list.findIndex(p => p.id === pengurusId);
  if (idx === -1) return { success: false, message: "Data pengurus tidak ditemukan." };

  list[idx].isActive = makeActive;
  list[idx].updatedAt = new Date().toISOString();
  
  if (isSupabaseConfigured()) {
    const res = await upsertPengurusToSupabase(list[idx]);
    if (res.success && res.data) {
      list[idx] = { ...list[idx], ...res.data };
    } else {
      return { success: false, message: res.error || res.message };
    }
  }

  savePengurusList(list);

  return { 
    success: true, 
    data: list[idx],
    message: makeActive 
      ? `Akun ${list[idx].nama} berhasil diaktifkan kembali.` 
      : `Akun ${list[idx].nama} telah dinonaktifkan.` 
  };
}

// Update / Edit Detail Pengurus & Hak Akses (Khusus Superadmin)
export async function updatePengurus(pengurusId, updateData) {
  const list = getPengurusList();
  const idx = list.findIndex(p => p.id === pengurusId);
  if (idx === -1) return { success: false, message: "Data pengurus tidak ditemukan." };

  const roleName = updateData.peran || updateData.jabatan || list[idx].peran || list[idx].jabatan || "Pamong";

  list[idx] = {
    ...list[idx],
    nama: updateData.nama || list[idx].nama,
    email: updateData.email || list[idx].email,
    noWa: updateData.noWa || list[idx].noWa,
    tingkatan: updateData.tingkatan || list[idx].tingkatan,
    peran: roleName,
    jabatan: roleName,
    desaId: updateData.desaId ?? list[idx].desaId,
    desaNama: updateData.desaNama ?? list[idx].desaNama,
    kelompokId: updateData.kelompokId ?? list[idx].kelompokId,
    kelompokNama: updateData.kelompokNama ?? list[idx].kelompokNama,
    isActive: updateData.isActive !== undefined ? updateData.isActive : list[idx].isActive,
    updatedAt: new Date().toISOString(),
  };

  if (updateData.password) {
    list[idx].password = updateData.password;
  }

  savePengurusList(list);

  if (isSupabaseConfigured()) {
    try {
      const dbPayload = {
        nama: list[idx].nama,
        email: list[idx].email,
        no_wa: list[idx].noWa,
        tingkatan: list[idx].tingkatan,
        peran: list[idx].peran,
        jabatan: list[idx].jabatan,
        desa_id: list[idx].desaId,
        desa_nama: list[idx].desaNama,
        kelompok_id: list[idx].kelompokId,
        kelompok_nama: list[idx].kelompokNama,
        is_active: list[idx].isActive,
        updated_at: list[idx].updatedAt
      };
      if (list[idx].password) dbPayload.password = list[idx].password; 
      
      const { error } = await supabase.from('pengurus').update(dbPayload).eq('id', pengurusId);
      if (error) console.error('Supabase updatePengurus error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }

  try {
    const rawSession = localStorage.getItem("ppg_user_session");
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session.id === pengurusId || session.email === list[idx].email) {
        localStorage.setItem("ppg_user_session", JSON.stringify({
          ...session,
          ...list[idx]
        }));
      }
    }
  } catch (e) {
    console.error(e);
  }

  return { 
    success: true, 
    data: list[idx],
    message: `Data pengurus "${list[idx].nama}" berhasil diperbarui!` 
  };
}

// Update Profil Pengurus yang Sedang Bertugas (Self Edit Profile)
export async function updateCurrentProfile(userId, profileData) {
  const list = getPengurusList();
  const idx = list.findIndex(p => p.id === userId || p.email === profileData.email);
  const roleName = profileData.peran || profileData.jabatan || (idx !== -1 ? list[idx].peran : undefined) || "Pengurus";

  if (idx !== -1) {
    list[idx].nama = profileData.nama || list[idx].nama;
    list[idx].email = profileData.email || list[idx].email;
    list[idx].noWa = profileData.noWa || list[idx].noWa;
    list[idx].peran = roleName;
    list[idx].jabatan = roleName;
    if (profileData.desaId) list[idx].desaId = profileData.desaId;
    if (profileData.desaNama) list[idx].desaNama = profileData.desaNama;
    if (profileData.kelompokId) list[idx].kelompokId = profileData.kelompokId;
    if (profileData.kelompokNama) list[idx].kelompokNama = profileData.kelompokNama;
    if (profileData.password) {
      list[idx].password = profileData.password;
    }
    list[idx].updatedAt = new Date().toISOString();
    savePengurusList(list);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        const dbPayload = {
          nama: list[idx].nama,
          email: list[idx].email,
          no_wa: list[idx].noWa,
          peran: list[idx].peran,
          jabatan: list[idx].jabatan,
          desa_id: list[idx].desaId,
          desa_nama: list[idx].desaNama,
          kelompok_id: list[idx].kelompokId,
          kelompok_nama: list[idx].kelompokNama,
          updated_at: list[idx].updatedAt
        };
        if (list[idx].password) {
           dbPayload.password = list[idx].password; 
        }
        
        await supabase.from('pengurus').update(dbPayload).eq('id', list[idx].id);
      } catch (e) {
        console.error('Supabase updateCurrentProfile error:', e);
      }
    }
  }

  // Update session
  try {
    const rawSession = localStorage.getItem("ppg_user_session");
    if (rawSession) {
      const session = JSON.parse(rawSession);
      const updatedSession = {
        ...session,
        nama: profileData.nama || session.nama,
        email: profileData.email || session.email,
        noWa: profileData.noWa || session.noWa,
        peran: roleName,
        jabatan: roleName,
        desaId: profileData.desaId || session.desaId,
        desaNama: profileData.desaNama || session.desaNama,
        kelompokId: profileData.kelompokId || session.kelompokId,
        kelompokNama: profileData.kelompokNama || session.kelompokNama,
      };
      if (profileData.password) {
        updatedSession.password = profileData.password;
      }
      localStorage.setItem("ppg_user_session", JSON.stringify(updatedSession));
      return { success: true, data: updatedSession, message: "Profil Anda berhasil diperbarui!" };
    }
  } catch (e) {
    return { success: false, message: "Gagal menyimpan session profil." };
  }

  return { success: true, message: "Profil berhasil diperbarui!" };
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRAM KERJA TAHUNAN PPG SOLO SELATAN (DATA MASTER & CRUD)
// Struktur Kolom Resmi:
// NO > KEGIATAN > WAKTU > SASARAN/PESERTA > TUJUAN KEGIATAN > RINCIAN BIAYA > EST. BIAYA > TEMPAT PELAKSANAAN
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_PROKER_LIST = [
  {
    id: "proker-1",
    no: 1,
    kegiatan: "Rapat Koordinasi & Evaluasi Pengurus Daerah",
    waktu: "Agustus 2026",
    sasaran: "Pengurus PPG Daerah & Koordinator 5 Desa",
    tujuan: "Penyelarasan target capaian kurikulum generus dan evaluasi kinerja pamong semester ganjil.",
    rincianBiaya: "Konsumsi (35 orang x Rp 30.000): Rp 1.050.000, Modul & Alat Tulis: Rp 450.000",
    estBiaya: 1500000,
    tempat: "Aula Gedung PPG Solo Selatan",
    status: "done", // done | ongoing | upcoming | planned
    targetWilayah: "Tingkat Daerah",
    penanggungJawab: "Sekretaris & Ketua",
    semester: 1
  },
  {
    id: "proker-2",
    no: 2,
    kegiatan: "Pendaftaran Generus Baru & Sinkronisasi Database",
    waktu: "Agustus – September 2026",
    sasaran: "Generus Baru (PAUD, SD, SMP, SMA) di 27 Kelompok",
    tujuan: "Pendataan tertib NIK, mutasi jenjang, dan penertiban nomor induk generus di seluruh 5 Desa.",
    rincianBiaya: "Cetak Formulir & Kartu Generus: Rp 1.800.000, Operasional IT & Server: Rp 700.000",
    estBiaya: 2500000,
    tempat: "27 Kelompok Se-Solo Selatan",
    status: "ongoing",
    targetWilayah: "Seluruh Wilayah (5 Desa)",
    penanggungJawab: "Bidang Kurikulum & Database",
    semester: 1
  },
  {
    id: "proker-3",
    no: 3,
    kegiatan: "Pelatihan Digitalisasi Lembar Pembiasaan Caberawit",
    waktu: "Agustus – September 2026",
    sasaran: "Pamong Caberawit (PAUD & SD) & Wali Murid",
    tujuan: "Peningkatan keterampilan pamong dalam pemantauan sholat 5 waktu dan 29 karakter luhur usia dini.",
    rincianBiaya: "Konsumsi Pelatihan (50 orang): Rp 1.500.000, Banner & Panduan Buku Saku: Rp 800.000, Narasumber: Rp 700.000",
    estBiaya: 3000000,
    tempat: "Masjid Luhur Baluwarti (Desa Tengah)",
    status: "ongoing",
    targetWilayah: "Tingkat Daerah",
    penanggungJawab: "Bidang Tenaga Pendidik",
    semester: 1
  },
  {
    id: "proker-4",
    no: 4,
    kegiatan: "Halaqah Akbar & Pembekalan Remaja Usia Mandiri",
    waktu: "September 2026",
    sasaran: "Remaja SMA & Usia Mandiri Se-Solo Selatan",
    tujuan: "Penguatan dalil-dalil kemandirian, adab pergaulan islami, dan kewirausahaan pemuda.",
    rincianBiaya: "Sewa Sound & Aula: Rp 2.000.000, Konsumsi Peserta (200 porsi): Rp 5.000.000, Pemateri & Doorprize: Rp 1.500.000",
    estBiaya: 8500000,
    tempat: "Gedung Pertemuan Solo Baru (Desa Selatan)",
    status: "upcoming",
    targetWilayah: "Tingkat Daerah",
    penanggungJawab: "Bidang Kegiatan Muda Mudi & Kemandirian",
    semester: 1
  },
  {
    id: "proker-5",
    no: 5,
    kegiatan: "Bimbingan Konseling & Sosialisasi Kelas Pra-Nikah",
    waktu: "Oktober 2026",
    sasaran: "Generus Usia Pra-Nikah & Orang Tua",
    tujuan: "Pembekalan komprehensif fikih munakahat, kesiapan mental, dan manajemen keluarga sakinah.",
    rincianBiaya: "Modul Pra-Nikah (100 eks): Rp 2.000.000, Konsumsi & Snack: Rp 2.500.000, Honorarium Konselor: Rp 1.500.000",
    estBiaya: 6000000,
    tempat: "Aula Baitul Makmur (Desa Barat)",
    status: "planned",
    targetWilayah: "Tingkat Daerah",
    penanggungJawab: "Bidang Bimbingan Konseling & Keputrian",
    semester: 1
  },
  {
    id: "proker-6",
    no: 6,
    kegiatan: "Festival Tahfidz Qur'an & Seni Olahraga Generus",
    waktu: "November 2026",
    sasaran: "Caberawit & GP Reguler (PAUD s/d SMA)",
    tujuan: "Menumbuhkan motivasi hafalan Al-Qur'an, kesehatan jasmani, sportivitas, dan keakraban antar-desa.",
    rincianBiaya: "Piala & Hadiah Juara: Rp 3.500.000, Panggung & Tenda: Rp 3.000.000, Konsumsi Panitia & Juri: Rp 2.500.000, Medis & Logistik: Rp 1.000.000",
    estBiaya: 10000000,
    tempat: "Kompleks Olahraga Sekarpace (Desa Timur 2)",
    status: "planned",
    targetWilayah: "Seluruh Wilayah (5 Desa)",
    penanggungJawab: "Bidang Tahfidz & Seni Olahraga",
    semester: 1
  },
  {
    id: "proker-7",
    no: 7,
    kegiatan: "Musyawarah Evaluasi KBM Semester Ganjil & Rakor Akhir Tahun",
    waktu: "Desember 2026",
    sasaran: "Seluruh Pamong & Pengurus PPG 5 Desa",
    tujuan: "Rekapitulasi ketercapaian materi KBM, rekap presensi, dan pelaporan keuangan tahun berjalan.",
    rincianBiaya: "Laporan Cetak & Berkas: Rp 1.200.000, Konsumsi Rapat Akbar (80 orang): Rp 2.800.000",
    estBiaya: 4000000,
    tempat: "Gedung PPG Solo Selatan",
    status: "planned",
    targetWilayah: "Tingkat Daerah",
    penanggungJawab: "Ketua, Sekretaris & Bendahara",
    semester: 1
  }
];

const PROKER_STORAGE_KEY = "ppg_program_kerja_v1";

export function getProkerList() {
  try {
    const raw = localStorage.getItem(PROKER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROKER_STORAGE_KEY, JSON.stringify(DEFAULT_PROKER_LIST));
      return DEFAULT_PROKER_LIST;
    }
    const parsed = JSON.parse(raw);
    if (parsed.length === 0) {
      localStorage.setItem(PROKER_STORAGE_KEY, JSON.stringify(DEFAULT_PROKER_LIST));
      return DEFAULT_PROKER_LIST;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_PROKER_LIST;
  }
}

export function saveProkerList(list) {
  localStorage.setItem(PROKER_STORAGE_KEY, JSON.stringify(list));
}

export function addProker(data) {
  const list = getProkerList();
  const nextNo = list.length > 0 ? Math.max(...list.map(p => p.no || 0)) + 1 : 1;
  const newProker = {
    id: `proker-${Date.now()}`,
    no: data.no ? parseInt(data.no) : nextNo,
    kegiatan: data.kegiatan || "Kegiatan Baru",
    waktu: data.waktu || "Periode 2026",
    sasaran: data.sasaran || "Semua Jenjang",
    tujuan: data.tujuan || "-",
    rincianBiaya: data.rincianBiaya || "-",
    estBiaya: typeof data.estBiaya === 'number' ? data.estBiaya : parseInt(String(data.estBiaya || '0').replace(/[^0-9]/g, '')) || 0,
    tempat: data.tempat || "Solo Selatan",
    status: data.status || "planned",
    targetWilayah: data.targetWilayah || "Tingkat Daerah",
    penanggungJawab: data.penanggungJawab || "Pengurus PPG",
    semester: data.semester ? parseInt(data.semester) : 1,
    createdAt: new Date().toISOString()
  };

  list.push(newProker);
  saveProkerList(list);
  return { success: true, data: newProker, message: `Program kerja "${newProker.kegiatan}" berhasil ditambahkan!` };
}

export function updateProker(id, updateData) {
  const list = getProkerList();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return { success: false, message: "Data program kerja tidak ditemukan." };

  const parsedBiaya = updateData.estBiaya !== undefined 
    ? (typeof updateData.estBiaya === 'number' ? updateData.estBiaya : parseInt(String(updateData.estBiaya).replace(/[^0-9]/g, '')) || 0)
    : list[idx].estBiaya;

  list[idx] = {
    ...list[idx],
    no: updateData.no !== undefined ? parseInt(updateData.no) : list[idx].no,
    kegiatan: updateData.kegiatan || list[idx].kegiatan,
    waktu: updateData.waktu || list[idx].waktu,
    sasaran: updateData.sasaran || list[idx].sasaran,
    tujuan: updateData.tujuan || list[idx].tujuan,
    rincianBiaya: updateData.rincianBiaya || list[idx].rincianBiaya,
    estBiaya: parsedBiaya,
    tempat: updateData.tempat || list[idx].tempat,
    status: updateData.status || list[idx].status,
    targetWilayah: updateData.targetWilayah || list[idx].targetWilayah,
    penanggungJawab: updateData.penanggungJawab || list[idx].penanggungJawab,
    semester: updateData.semester ? parseInt(updateData.semester) : list[idx].semester,
    updatedAt: new Date().toISOString()
  };

  saveProkerList(list);
  return { success: true, data: list[idx], message: `Program kerja "${list[idx].kegiatan}" berhasil diperbarui!` };
}

export function deleteProker(id) {
  let list = getProkerList();
  const item = list.find(p => p.id === id);
  if (!item) return { success: false, message: "Data program kerja tidak ditemukan." };

  list = list.filter(p => p.id !== id);
  // Re-index nomor urut
  list.forEach((p, index) => {
    p.no = index + 1;
  });
  saveProkerList(list);
  return { success: true, message: `Program kerja "${item.kegiatan}" berhasil dihapus.` };
}

export function getProkerStats() {
  const list = getProkerList();
  const total = list.length;
  const totalAnggaran = list.reduce((acc, p) => acc + (p.estBiaya || 0), 0);
  const ongoing = list.filter(p => p.status === 'ongoing').length;
  const done = list.filter(p => p.status === 'done').length;
  const upcoming = list.filter(p => p.status === 'upcoming').length;
  const planned = list.filter(p => p.status === 'planned').length;

  // Baseline Anggaran Tahun Sebelumnya (Tahun 2025: Rp 30.000.000)
  const anggaranTahunLalu = 30000000;
  const diffAnggaran = totalAnggaran - anggaranTahunLalu;
  const percentGrowth = anggaranTahunLalu > 0 ? parseFloat(((diffAnggaran / anggaranTahunLalu) * 100).toFixed(1)) : 0;

  return {
    total,
    totalAnggaran,
    anggaranTahunLalu,
    diffAnggaran,
    percentGrowth,
    ongoing,
    done,
    upcoming,
    planned
  };
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA: SISWA (GENERUS)
   ═══════════════════════════════════════════════════════════════ */
export const MOCK_SISWA = [
  { id: "s-001", nis: "1001", nama_lengkap: "Tazkia Zhavia Mehrunissa Randika", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2018-05-10", kategori_usia: "caberawit", jenjang_kelas: "TK B", desa_id: "desa-selatan", kelompok_id: "kel-solo-baru", desa_nama: "Selatan", kelompok_nama: "Solo Baru", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-002", nis: "1002", nama_lengkap: "Satriya Yusuf Abdillah", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2017-03-12", kategori_usia: "caberawit", jenjang_kelas: "1 SD", desa_id: "desa-selatan", kelompok_id: "kel-solo-baru", desa_nama: "Selatan", kelompok_nama: "Solo Baru", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-003", nis: "1003", nama_lengkap: "Almeer ibrahim Fathurohim", jenis_kelamin: "L", tempat_lahir: "Sukoharjo", tanggal_lahir: "2016-08-20", kategori_usia: "caberawit", jenjang_kelas: "2 SD", desa_id: "desa-selatan", kelompok_id: "kel-solo-baru", desa_nama: "Selatan", kelompok_nama: "Solo Baru", no_hp: "-", domisili: "Pendatang", status_sambung: "Sambung" },
  { id: "s-004", nis: "1004", nama_lengkap: "Mahira Hasna Nur Susilo", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2016-11-05", kategori_usia: "caberawit", jenjang_kelas: "2 SD", desa_id: "desa-selatan", kelompok_id: "kel-solo-baru", desa_nama: "Selatan", kelompok_nama: "Solo Baru", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-005", nis: "1005", nama_lengkap: "FIDELA", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2019-02-15", kategori_usia: "caberawit", jenjang_kelas: "PAUD", desa_id: "desa-barat", kelompok_id: "kel-sondakan", desa_nama: "Barat", kelompok_nama: "Sondakan", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-006", nis: "1006", nama_lengkap: "KEN FATKHU AL HASANIY", jenis_kelamin: "L", tempat_lahir: "Klaten", tanggal_lahir: "2018-07-22", kategori_usia: "caberawit", jenjang_kelas: "TK A", desa_id: "desa-barat", kelompok_id: "kel-sondakan", desa_nama: "Barat", kelompok_nama: "Sondakan", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-007", nis: "1007", nama_lengkap: "FAID FI'LULKHOIR ATHOYYAR", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2018-09-30", kategori_usia: "caberawit", jenjang_kelas: "TK A", desa_id: "desa-barat", kelompok_id: "kel-sondakan", desa_nama: "Barat", kelompok_nama: "Sondakan", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-008", nis: "1008", nama_lengkap: "Budi Santoso", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2010-04-10", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-tengah", kelompok_id: "kel-semanggi", desa_nama: "Tengah", kelompok_nama: "Semanggi", no_hp: "081234567890", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-009", nis: "1009", nama_lengkap: "Siti Aminah", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2005-12-01", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-winong", desa_nama: "Timur 1", kelompok_nama: "Winong", no_hp: "085612341234", domisili: "Pendatang", status_sambung: "Sambung" },

  // ── Generus Kelompok Gunung Wijil 1 (Desa Timur 1) - Sesuai Dokumen Resmi PDF ──
  { id: "s-gw-01", nis: "2001", nama_lengkap: "Alfian Vega Mabrurie", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2004-03-15", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334401", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-02", nis: "2002", nama_lengkap: "Aris Abdi Rohman Aulia", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2003-07-22", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334402", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-03", nis: "2003", nama_lengkap: "Ichwanudin Syaifullah", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2002-11-10", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334403", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-04", nis: "2004", nama_lengkap: "Ilham Adi Yusuf", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2004-05-18", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334404", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-05", nis: "2005", nama_lengkap: "Irfansyah Nur Alfi Nugroho", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2005-01-30", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334405", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-06", nis: "2006", nama_lengkap: "Mochammad Arif Indra Permana", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2003-09-14", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334406", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-07", nis: "2007", nama_lengkap: "Muhammad Hadi Salam", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2004-12-05", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334407", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-08", nis: "2008", nama_lengkap: "Muhammad Ikhwan N F", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2003-04-19", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334408", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-09", nis: "2009", nama_lengkap: "Awan Fadhli Ramadhan", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2005-10-08", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334409", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-10", nis: "2010", nama_lengkap: "Wildan Candra Ahyari", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2004-08-25", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334410", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-11", nis: "2011", nama_lengkap: "Elsan Dave Julian", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2003-02-17", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334411", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-12", nis: "2012", nama_lengkap: "Khusnan Wildan Kholid", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2002-06-11", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334412", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-13", nis: "2013", nama_lengkap: "Rino Maulana Abdansyah", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2008-03-20", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334413", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-14", nis: "2014", nama_lengkap: "Roihan Ihsan Jaya", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2008-09-12", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334414", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-15", nis: "2015", nama_lengkap: "Fuad Arif", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2009-01-15", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334415", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-16", nis: "2016", nama_lengkap: "Alfan", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2007-11-28", kategori_usia: "gp_reguler", jenjang_kelas: "3 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334416", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-17", nis: "2017", nama_lengkap: "Angger Pangestu Ihsan Jaya", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2009-04-03", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334417", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-18", nis: "2018", nama_lengkap: "Allan Ridhowi", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-02-14", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334418", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-19", nis: "2019", nama_lengkap: "Achmad Nirwan mutaqin lubis", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2012-08-09", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334419", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-20", nis: "2020", nama_lengkap: "Alfido Dafa Arfansyah (FIDO)", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-06-16", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334420", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-21", nis: "2021", nama_lengkap: "Alfiko Dafa Arfansyah (FIKO)", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-06-16", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334421", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-22", nis: "2022", nama_lengkap: "Arifan Tsiqoh Adimstya aji", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2010-10-21", kategori_usia: "gp_reguler", jenjang_kelas: "3 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334422", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-23", nis: "2023", nama_lengkap: "Arsyavin Ega Pratama", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2012-03-04", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334423", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-24", nis: "2024", nama_lengkap: "Cheisa Fadhil F", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-12-18", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334424", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-25", nis: "2025", nama_lengkap: "Fachri Baruna", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2010-07-29", kategori_usia: "gp_reguler", jenjang_kelas: "3 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334425", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-26", nis: "2026", nama_lengkap: "Jifan Tristian Figo Orlando", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2012-05-11", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334426", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-27", nis: "2027", nama_lengkap: "Kaka Rizqy Ramadhan A", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-09-02", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334427", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-28", nis: "2028", nama_lengkap: "Relza Fadlika Maulana Putra", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2010-01-23", kategori_usia: "gp_reguler", jenjang_kelas: "3 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334428", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-29", nis: "2029", nama_lengkap: "Revi Maulana Adi P", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-04-07", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334429", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-30", nis: "2030", nama_lengkap: "Muhammad Fajrun", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2001-11-30", kategori_usia: "remaja", jenjang_kelas: "Kelas Remaja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334430", domisili: "Pribumi", status_sambung: "Sambung" },

  // Generus Caberawit Gunung Wijil 1
  { id: "s-gw-cb-01", nis: "2031", nama_lengkap: "Bilal Al-Fatih", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2018-02-10", kategori_usia: "caberawit", jenjang_kelas: "TK B", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-cb-02", nis: "2032", nama_lengkap: "Fathimah Azzahra", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2017-06-15", kategori_usia: "caberawit", jenjang_kelas: "1 SD", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-cb-03", nis: "2033", nama_lengkap: "Kenzi Radhitya", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2016-09-18", kategori_usia: "caberawit", jenjang_kelas: "2 SD", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-cb-04", nis: "2034", nama_lengkap: "Nafisa Khairunisa", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2015-12-04", kategori_usia: "caberawit", jenjang_kelas: "3 SD", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-cb-05", nis: "2035", nama_lengkap: "Ziyad Muhammad", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2014-04-12", kategori_usia: "caberawit", jenjang_kelas: "4 SD", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "-", domisili: "Pribumi", status_sambung: "Sambung" },

  // Generus Remaja & GP Putri Gunung Wijil 1
  { id: "s-gw-pi-01", nis: "2041", nama_lengkap: "Annisa Nurul Aini", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2004-04-12", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334441", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-02", nis: "2042", nama_lengkap: "Dhiya Ulhaq Safitri", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2003-08-20", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334442", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-03", nis: "2043", nama_lengkap: "Haniifah Putri Rahmadhani", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2007-10-15", kategori_usia: "gp_reguler", jenjang_kelas: "3 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334443", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-04", nis: "2044", nama_lengkap: "Zahra Nabila Firdaus", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2008-05-18", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334444", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-05", nis: "2045", nama_lengkap: "Salma Khoirunnisa", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2009-02-27", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334445", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-06", nis: "2046", nama_lengkap: "Aisyah Humaira Azzahra", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2010-09-14", kategori_usia: "gp_reguler", jenjang_kelas: "3 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334446", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-07", nis: "2047", nama_lengkap: "Naila Syarafina", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2011-03-08", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334447", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-gw-pi-08", nis: "2048", nama_lengkap: "Naura Dania Qanita", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2012-07-21", kategori_usia: "gp_reguler", jenjang_kelas: "1 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-gunung-wijil-1", desa_nama: "Timur 1", kelompok_nama: "Gunung Wijil 1", no_hp: "08122334448", domisili: "Pribumi", status_sambung: "Sambung" },

  // Generus Kelompok Winong (Desa Timur 1)
  { id: "s-wn-01", nis: "2051", nama_lengkap: "Ahmad Fauzi", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2003-05-10", kategori_usia: "remaja", jenjang_kelas: "Mahasiswa", desa_id: "desa-timur-1", kelompok_id: "kel-winong", desa_nama: "Timur 1", kelompok_nama: "Winong", no_hp: "08122334451", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-wn-02", nis: "2052", nama_lengkap: "Bagas Pratama", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2008-01-14", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-winong", desa_nama: "Timur 1", kelompok_nama: "Winong", no_hp: "08122334452", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-wn-03", nis: "2053", nama_lengkap: "Danang Setiawan", jenis_kelamin: "L", tempat_lahir: "Solo", tanggal_lahir: "2011-06-19", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", desa_id: "desa-timur-1", kelompok_id: "kel-winong", desa_nama: "Timur 1", kelompok_nama: "Winong", no_hp: "08122334453", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-wn-04", nis: "2054", nama_lengkap: "Dewi Safitri", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2004-11-22", kategori_usia: "remaja", jenjang_kelas: "Bekerja", desa_id: "desa-timur-1", kelompok_id: "kel-winong", desa_nama: "Timur 1", kelompok_nama: "Winong", no_hp: "08122334454", domisili: "Pribumi", status_sambung: "Sambung" },
  { id: "s-wn-05", nis: "2055", nama_lengkap: "Lestari Nur Indah", jenis_kelamin: "P", tempat_lahir: "Solo", tanggal_lahir: "2008-08-05", kategori_usia: "gp_reguler", jenjang_kelas: "2 SMA", desa_id: "desa-timur-1", kelompok_id: "kel-winong", desa_nama: "Timur 1", kelompok_nama: "Winong", no_hp: "08122334455", domisili: "Pribumi", status_sambung: "Sambung" },
];

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA: EVENT PEMBIASAAN
   ═══════════════════════════════════════════════════════════════ */
export const MOCK_EVENT_PEMBIASAAN = [
  {
    id: "evt-001",
    judul_periode: "Periode Mei 2026",
    status: "selesai",
    habits: [
      "Tertib & Tenang Saat Pengajian",
      "Membaca PR no. 3",
      "Mencuci Piring",
      "Menjaga Adab Dalam Kamar Mandi"
    ],
    created_at: "2026-05-01T00:00:00Z"
  },
  {
    id: "evt-002",
    judul_periode: "Periode Juni 2026",
    status: "berjalan",
    habits: [
      "Tertib & Tenang Saat Pengajian",
      "Membaca PR no. 3",
      "Mencuci Piring",
      "Menjaga Adab Dalam Kamar Mandi"
    ],
    created_at: "2026-06-01T00:00:00Z"
  }
];

export const MOCK_NILAI_PEMBIASAAN = [
  // Data Event 001 (Mei) - Solo Baru
  { event_id: "evt-001", siswa_id: "s-001", nilai: [85, 90, 100, 80] },
  { event_id: "evt-001", siswa_id: "s-002", nilai: [90, 85, 95, 90] },
  { event_id: "evt-001", siswa_id: "s-003", nilai: [80, 80, 80, 80] },
  { event_id: "evt-001", siswa_id: "s-004", nilai: [100, 100, 100, 100] },
  
  // Data Event 002 (Juni) - Sondakan (sebagian sudah dinilai)
  { event_id: "evt-002", siswa_id: "s-005", nilai: [95, 90, 85, 90] }, // Fidela
  { event_id: "evt-002", siswa_id: "s-006", nilai: [16, 8, 14, 14] }, // Ken
  { event_id: "evt-002", siswa_id: "s-007", nilai: [2, 0, 2, 21] },   // Faid
];

/* ═══════════════════════════════════════════════════════════════
   SISWA (GENERUS) CRUD FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */
const SISWA_STORAGE_KEY = "ppg_siswa_v1";

export function getSiswaList() {
  try {
    const raw = localStorage.getItem(SISWA_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(MOCK_SISWA));
      return [...MOCK_SISWA];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(MOCK_SISWA));
      return [...MOCK_SISWA];
    }
    // Jika jumlah data lokal lebih sedikit dari master mock baru, sinkronkan data baru
    if (parsed.length < MOCK_SISWA.length) {
      const existingIds = new Set(parsed.map(x => x.id));
      const newItems = MOCK_SISWA.filter(m => !existingIds.has(m.id));
      const merged = [...parsed, ...newItems];
      localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch (e) {
    return [...MOCK_SISWA];
  }
}

export function saveSiswaList(list) {
  localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(list));
}

export function addSiswa(data) {
  const list = getSiswaList();
  
  // ALGORITMA KATEGORI REMAJA
  // 1. Berdasarkan keadaan (Mahasiswa, Bekerja, Lainnya)
  // 2. Berdasarkan umur: 19-22 (Pra-Nikah), > 22 (Remaja)
  if (data.kategori_usia === "remaja" && data.tanggal_lahir) {
    const birthDate = new Date(data.tanggal_lahir);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Jika jenjang_kelas bukan salah satu status keadaan, maka tentukan berdasarkan umur
    if (!["Mahasiswa", "Bekerja", "Lainnya"].includes(data.jenjang_kelas)) {
      if (age > 22) {
        data.jenjang_kelas = "Kelas Remaja";
      } else {
        data.jenjang_kelas = "Pra-Nikah";
      }
    }
  }

  const newSiswa = {
    id: `siswa-${Date.now()}`,
    nik: data.nik || "-",
    nis: data.nis || "-",
    nama_lengkap: data.nama_lengkap,
    jenis_kelamin: data.jenis_kelamin || "L",
    tempat_lahir: data.tempat_lahir || "-",
    tanggal_lahir: data.tanggal_lahir,
    kategori_usia: data.kategori_usia || "caberawit",
    jenjang_kelas: data.jenjang_kelas,
    desa_id: data.desa_id,
    kelompok_id: data.kelompok_id,
    desa_nama: data.desa_nama,
    kelompok_nama: data.kelompok_nama,
    no_hp: data.no_hp || "-",
    domisili: data.domisili || "Pribumi",
    status_sambung: data.status_sambung || "Sambung",
    created_at: new Date().toISOString()
  };
  list.push(newSiswa);
  saveSiswaList(list);

  // Background Auto-Sync ke Supabase Cloud (jika terkonfigurasi)
  if (isSupabaseConfigured()) {
    upsertSiswaToSupabase(newSiswa).then(res => {
      if (res.success && res.data && res.data[0] && res.data[0].id) {
        // Perbarui ID lokal jika Supabase menghasilkan UUID baru
        const currentList = getSiswaList();
        const idx = currentList.findIndex(s => s.id === newSiswa.id);
        if (idx !== -1) {
          currentList[idx].id = res.data[0].id;
          saveSiswaList(currentList);
        }
      }
    }).catch(err => console.warn("Background auto-sync addSiswa failed:", err));
  }

  return { success: true, data: newSiswa, message: "Data Generus berhasil ditambahkan!" };
}

export function updateSiswa(id, data) {
  const list = getSiswaList();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return { success: false, message: "Data tidak ditemukan." };
  
  // ALGORITMA KATEGORI REMAJA
  if (data.kategori_usia === "remaja" && data.tanggal_lahir) {
    const birthDate = new Date(data.tanggal_lahir);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (!["Mahasiswa", "Bekerja", "Lainnya"].includes(data.jenjang_kelas)) {
      if (age > 22) {
        data.jenjang_kelas = "Kelas Remaja";
      } else {
        data.jenjang_kelas = "Pra-Nikah";
      }
    }
  }

  list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() };
  saveSiswaList(list);

  // Background Auto-Sync ke Supabase Cloud
  if (isSupabaseConfigured()) {
    upsertSiswaToSupabase(list[idx]).catch(err => console.warn("Background auto-sync updateSiswa failed:", err));
  }

  return { success: true, data: list[idx], message: "Data Generus berhasil diperbarui!" };
}

export function deleteSiswa(id) {
  let list = getSiswaList();
  const item = list.find(s => s.id === id);
  if (!item) return { success: false, message: "Data tidak ditemukan." };
  list = list.filter(s => s.id !== id);
  saveSiswaList(list);

  // Background Auto-Sync ke Supabase Cloud
  if (isSupabaseConfigured()) {
    deleteSiswaFromSupabase(id).catch(err => console.warn("Background auto-sync deleteSiswa failed:", err));
  }

  return { success: true, message: `Data "${item.nama_lengkap}" berhasil dihapus.` };
}

/* ── Status Sambung & Filter Generus Aktif ────────────────── */
export function isSiswaAktif(siswa) {
  if (!siswa) return false;
  const status = (siswa.status_sambung || "Sambung").trim().toLowerCase();
  return status === "sambung";
}

export function getSiswaAktifList() {
  return getSiswaList().filter(isSiswaAktif);
}

export function getUmurNumber(tanggalLahir, refDate = new Date()) {
  if (!tanggalLahir) return 0;
  const birthDate = new Date(tanggalLahir);
  if (isNaN(birthDate.getTime())) return 0;
  const target = new Date(refDate);
  let age = target.getFullYear() - birthDate.getFullYear();
  const m = target.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && target.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function calculateUmur(tanggalLahir) {
  if (!tanggalLahir) return "-";
  const age = getUmurNumber(tanggalLahir);
  return `${age} Tahun`;
}

/* ── Otomatisasi Penentuan Jenjang Berdasarkan Usia & Pergantian Tahun ── */

/**
 * Menentukan kategori usia dan jenjang kelas berdasarkan tanggal lahir
 * @param {string} tanggalLahir - YYYY-MM-DD
 * @param {string|null} currentJenjang - Jenjang saat ini untuk proteksi status Mahasiswa/Bekerja
 * @param {Date} refDate - Tanggal referensi acuan (default hari ini)
 */
export function determineJenjangByAge(tanggalLahir, currentJenjang = null, refDate = new Date()) {
  const age = getUmurNumber(tanggalLahir, refDate);

  // Caberawit: Usia Dini (PAUD s.d. 6 SD)
  if (age <= 4) {
    return { kategori_usia: "caberawit", jenjang_kelas: "PAUD", umur: age };
  } else if (age === 5) {
    return { kategori_usia: "caberawit", jenjang_kelas: "TK A", umur: age };
  } else if (age === 6) {
    return { kategori_usia: "caberawit", jenjang_kelas: "TK B", umur: age };
  } else if (age === 7) {
    return { kategori_usia: "caberawit", jenjang_kelas: "1 SD", umur: age };
  } else if (age === 8) {
    return { kategori_usia: "caberawit", jenjang_kelas: "2 SD", umur: age };
  } else if (age === 9) {
    return { kategori_usia: "caberawit", jenjang_kelas: "3 SD", umur: age };
  } else if (age === 10) {
    return { kategori_usia: "caberawit", jenjang_kelas: "4 SD", umur: age };
  } else if (age === 11) {
    return { kategori_usia: "caberawit", jenjang_kelas: "5 SD", umur: age };
  } else if (age === 12) {
    return { kategori_usia: "caberawit", jenjang_kelas: "6 SD", umur: age };
  }

  // GP Reguler: Usia Sekolah (1 SMP s.d. 3 SMA)
  else if (age === 13) {
    return { kategori_usia: "gp_reguler", jenjang_kelas: "1 SMP", umur: age };
  } else if (age === 14) {
    return { kategori_usia: "gp_reguler", jenjang_kelas: "2 SMP", umur: age };
  } else if (age === 15) {
    return { kategori_usia: "gp_reguler", jenjang_kelas: "3 SMP", umur: age };
  } else if (age === 16) {
    return { kategori_usia: "gp_reguler", jenjang_kelas: "1 SMA", umur: age };
  } else if (age === 17) {
    return { kategori_usia: "gp_reguler", jenjang_kelas: "2 SMA", umur: age };
  } else if (age === 18) {
    return { kategori_usia: "gp_reguler", jenjang_kelas: "3 SMA", umur: age };
  }

  // Remaja & Pra-Nikah (19 tahun ke atas)
  else {
    // Jika generus sudah memiliki status spesifik (Mahasiswa, Bekerja, Lainnya), pertahankan statusnya
    if (["Mahasiswa", "Bekerja", "Lainnya"].includes(currentJenjang)) {
      return { kategori_usia: "remaja", jenjang_kelas: currentJenjang, umur: age };
    }
    if (age <= 22) {
      return { kategori_usia: "remaja", jenjang_kelas: "Pra-Nikah", umur: age };
    } else {
      return { kategori_usia: "remaja", jenjang_kelas: "Kelas Remaja", umur: age };
    }
  }
}

/**
 * Urutan kenaikan kelas 1 tingkat tahunan (Tahun Ajaran Baru)
 */
const JENJANG_SEQUENCE = [
  { jenjang: "PAUD", next: "TK A", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "TK A", next: "TK B", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "TK B", next: "1 SD", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "1 SD", next: "2 SD", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "2 SD", next: "3 SD", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "3 SD", next: "4 SD", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "4 SD", next: "5 SD", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "5 SD", next: "6 SD", kat: "caberawit", nextKat: "caberawit" },
  { jenjang: "6 SD", next: "1 SMP", kat: "caberawit", nextKat: "gp_reguler" },
  { jenjang: "1 SMP", next: "2 SMP", kat: "gp_reguler", nextKat: "gp_reguler" },
  { jenjang: "2 SMP", next: "3 SMP", kat: "gp_reguler", nextKat: "gp_reguler" },
  { jenjang: "3 SMP", next: "1 SMA", kat: "gp_reguler", nextKat: "gp_reguler" },
  { jenjang: "1 SMA", next: "2 SMA", kat: "gp_reguler", nextKat: "gp_reguler" },
  { jenjang: "2 SMA", next: "3 SMA", kat: "gp_reguler", nextKat: "gp_reguler" },
  { jenjang: "3 SMA", next: "Pra-Nikah", kat: "gp_reguler", nextKat: "remaja" },
  { jenjang: "Pra-Nikah", next: "Kelas Remaja", kat: "remaja", nextKat: "remaja" }
];

export function naikkanJenjangSatuTingkat(currentJenjang) {
  const found = JENJANG_SEQUENCE.find(j => j.jenjang.toLowerCase() === (currentJenjang || "").toLowerCase());
  if (found) {
    return {
      kategori_usia: found.nextKat,
      jenjang_kelas: found.next,
      berubah: true
    };
  }
  return { jenjang_kelas: currentJenjang, berubah: false };
}

/**
 * Eksekusi Kenaikan Jenjang Massal untuk seluruh siswa
 * @param {Object} options - { mode: 'age' | 'annual_step' }
 * - 'age': Menyesuaikan kelas sesuai usia hari ini berdasarkan tanggal_lahir
 * - 'annual_step': Menaikkan seluruh siswa sekolah 1 jenjang ke atas (+1 kelas tahunan)
 */
export function autoPromoteAllSiswa(options = { mode: "age" }) {
  const mode = options.mode || "age";
  const list = getSiswaList();
  const changes = [];

  const updatedList = list.map(siswa => {
    // Hanya proses generus aktif (Sambung)
    if (!isSiswaAktif(siswa)) return siswa;

    let targetKat = siswa.kategori_usia;
    let targetKelas = siswa.jenjang_kelas;

    if (mode === "age") {
      if (siswa.tanggal_lahir) {
        const res = determineJenjangByAge(siswa.tanggal_lahir, siswa.jenjang_kelas);
        targetKat = res.kategori_usia;
        targetKelas = res.jenjang_kelas;
      }
    } else if (mode === "annual_step") {
      const res = naikkanJenjangSatuTingkat(siswa.jenjang_kelas);
      if (res.berubah) {
        targetKat = res.kategori_usia;
        targetKelas = res.jenjang_kelas;
      }
    }

    if (targetKat !== siswa.kategori_usia || targetKelas !== siswa.jenjang_kelas) {
      changes.push({
        id: siswa.id,
        nama: siswa.nama_lengkap,
        umur: getUmurNumber(siswa.tanggal_lahir),
        before: `${siswa.kategori_usia} - ${siswa.jenjang_kelas}`,
        after: `${targetKat} - ${targetKelas}`,
        desa: siswa.desa_nama,
        kelompok: siswa.kelompok_nama
      });

      return {
        ...siswa,
        kategori_usia: targetKat,
        jenjang_kelas: targetKelas,
        updated_at: new Date().toISOString()
      };
    }

    return siswa;
  });

  if (changes.length > 0) {
    saveSiswaList(updatedList);

    // Background Auto-Sync pembaruan massal ke Supabase Cloud
    if (isSupabaseConfigured()) {
      upsertSiswaToSupabase(updatedList).catch(err => console.warn("Background auto-sync autoPromoteAllSiswa failed:", err));
    }
  }

  return {
    success: true,
    mode: mode,
    totalDiproses: list.length,
    countChanged: changes.length,
    changes: changes
  };
}

/* ═══════════════════════════════════════════════════════════════
   EVENT PEMBIASAAN & NILAI CRUD FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */
const EVENT_PEMBIASAAN_STORAGE_KEY = "ppg_event_pembiasaan_v1";
const NILAI_PEMBIASAAN_STORAGE_KEY = "ppg_nilai_pembiasaan_v1";

export function getEventPembiasaanList() {
  try {
    const raw = localStorage.getItem(EVENT_PEMBIASAAN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EVENT_PEMBIASAAN_STORAGE_KEY, JSON.stringify(MOCK_EVENT_PEMBIASAAN));
      return [...MOCK_EVENT_PEMBIASAAN];
    }
    const parsed = JSON.parse(raw);
    if (parsed.length === 0) {
      localStorage.setItem(EVENT_PEMBIASAAN_STORAGE_KEY, JSON.stringify(MOCK_EVENT_PEMBIASAAN));
      return [...MOCK_EVENT_PEMBIASAAN];
    }
    return parsed;
  } catch (e) {
    return [...MOCK_EVENT_PEMBIASAAN];
  }
}

export function saveEventPembiasaanList(list) {
  localStorage.setItem(EVENT_PEMBIASAAN_STORAGE_KEY, JSON.stringify(list));
}

// Initial Sync helper
export async function syncPembiasaanFromSupabase() {
  if (!isSupabaseConfigured()) return;
  const evRes = await fetchEventPembiasaanFromSupabase();
  if (evRes.success && evRes.data) {
    saveEventPembiasaanList(evRes.data);
  }
  const nilRes = await fetchNilaiPembiasaanFromSupabase();
  if (nilRes.success && nilRes.data) {
    saveNilaiPembiasaanList(nilRes.data);
  }
}

export async function addEventPembiasaan(data) {
  let newEvent = {
    judul_periode: data.judul_periode || "Periode Baru",
    status: data.status || "berjalan",
    habits: data.habits || [],
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const res = await upsertEventPembiasaanToSupabase(newEvent);
    if (res.success && res.data) {
      newEvent = res.data;
    } else {
      return { success: false, message: res.error || res.message };
    }
  } else {
    newEvent.id = `evt-${Date.now()}`;
  }

  const list = getEventPembiasaanList();
  list.push(newEvent);
  saveEventPembiasaanList(list);
  return { success: true, data: newEvent, message: "Event Pembiasaan berhasil ditambahkan!" };
}

export async function updateEventPembiasaan(id, data) {
  const list = getEventPembiasaanList();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return { success: false, message: "Event tidak ditemukan." };
  
  let updatedEvent = {
    ...list[idx],
    ...data,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const res = await upsertEventPembiasaanToSupabase(updatedEvent);
    if (res.success && res.data) {
      updatedEvent = res.data;
    } else {
      return { success: false, message: res.error || res.message };
    }
  }

  list[idx] = updatedEvent;
  saveEventPembiasaanList(list);
  return { success: true, data: list[idx], message: "Event Pembiasaan berhasil diperbarui!" };
}

export async function closeEventPembiasaan(id) {
  const list = getEventPembiasaanList();
  const idx = list.findIndex(e => e.id === id);
  if (idx === -1) return { success: false, message: "Event tidak ditemukan." };
  
  let updatedEvent = {
    ...list[idx],
    status: "selesai",
    closed_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const res = await upsertEventPembiasaanToSupabase(updatedEvent);
    if (res.success && res.data) {
      updatedEvent = res.data;
    } else {
      return { success: false, message: res.error || res.message };
    }
  }

  list[idx] = updatedEvent;
  saveEventPembiasaanList(list);
  return { success: true, data: list[idx], message: "Event Pembiasaan berhasil ditutup dan diarsipkan!" };
}

export async function deleteEventPembiasaan(id) {
  if (isSupabaseConfigured()) {
    const res = await deleteEventPembiasaanFromSupabase(id);
    if (!res.success) {
      return { success: false, message: res.error || res.message };
    }
  }

  let list = getEventPembiasaanList();
  list = list.filter(e => e.id !== id);
  saveEventPembiasaanList(list);
  
  let nilaiList = getNilaiPembiasaanList();
  nilaiList = nilaiList.filter(n => n.event_id !== id);
  saveNilaiPembiasaanList(nilaiList);
  return { success: true, message: "Event Pembiasaan berhasil dihapus." };
}

export function getNilaiPembiasaanList() {
  try {
    const raw = localStorage.getItem(NILAI_PEMBIASAAN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NILAI_PEMBIASAAN_STORAGE_KEY, JSON.stringify(MOCK_NILAI_PEMBIASAAN));
      return [...MOCK_NILAI_PEMBIASAAN];
    }
    const parsed = JSON.parse(raw);
    if (parsed.length === 0) {
      localStorage.setItem(NILAI_PEMBIASAAN_STORAGE_KEY, JSON.stringify(MOCK_NILAI_PEMBIASAAN));
      return [...MOCK_NILAI_PEMBIASAAN];
    }
    return parsed;
  } catch (e) {
    return [...MOCK_NILAI_PEMBIASAAN];
  }
}

export function saveNilaiPembiasaanList(list) {
  localStorage.setItem(NILAI_PEMBIASAAN_STORAGE_KEY, JSON.stringify(list));
}

export async function saveNilaiPembiasaan(event_id, siswa_id, nilaiArray) {
  const list = getNilaiPembiasaanList();
  const idx = list.findIndex(n => n.event_id === event_id && n.siswa_id === siswa_id);
  
  let newNilaiObj = { event_id, siswa_id, nilai: nilaiArray };
  if (idx > -1) {
    newNilaiObj = { ...list[idx], ...newNilaiObj };
  }
  
  if (isSupabaseConfigured()) {
    const res = await upsertNilaiPembiasaanToSupabase(newNilaiObj);
    if (res.success && res.data) {
      newNilaiObj = res.data;
    }
  }

  if (idx > -1) {
    list[idx] = newNilaiObj;
  } else {
    list.push(newNilaiObj);
  }
  saveNilaiPembiasaanList(list);
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA & CRUD: EVENT KBM & REKAP KEHADIRAN
   ═══════════════════════════════════════════════════════════════ */

export const MOCK_KBM_EVENTS = [
  {
    id: "kbm-evt-001",
    judul: "REKAP KEHADIRAN PENGAJIAN REMAJA",
    subjudul: "KEPENGURUSAN REMAJA DAERAH SOLO SELATAN",
    format_kbm: "remaja",
    desa_id: "all",
    kelompok_id: "all",
    gender: "gabung",
    hari_tanggal: "Selasa, 20 Januari 2026",
    jam: "19.30 – 21.00 WIB",
    bulan: "JANUARI",
    tahun: "2026",
    sesi_kelas: [
      {
        kelas: "1 SMP - DEWASA",
        tempat: "Masjid Lt. 1",
        materi: "Seminar Senkom Kota",
        penasehat: "Bp. Abdul Aziz , S.Kom., M.Cs."
      }
    ],
    rekap_kehadiran: {
      // Desa Timur 1
      "kel-gunung-sari": { hadir: 5, ijin: 1, alfa: 11 },
      "kel-gunung-wijil-1": { hadir: 22, ijin: 4, alfa: 16 },
      "kel-gunung-wijil-2": { hadir: 7, ijin: 4, alfa: 17 },
      "kel-kapohan": { hadir: 10, ijin: 3, alfa: 7 },
      "kel-randurejo": { hadir: 7, ijin: 3, alfa: 9 },
      "kel-winong": { hadir: 12, ijin: 3, alfa: 13 },

      // Desa Timur 2
      "kel-ngasinan": { hadir: 3, ijin: 1, alfa: 18 },
      "kel-ngoresan": { hadir: 11, ijin: 31, alfa: 34 },
      "kel-petoran": { hadir: 10, ijin: 11, alfa: 6 },
      "kel-pucangsawit-1": { hadir: 22, ijin: 2, alfa: 68 },
      "kel-pucangsawit-2": { hadir: 6, ijin: 8, alfa: 4 },
      "kel-pucangsawit-indah": { hadir: 16, ijin: 7, alfa: 8 },
      "kel-sekarpace": { hadir: 2, ijin: 1, alfa: 32 },

      // Desa Tengah
      "kel-baluwarti": { hadir: 10, ijin: 7, alfa: 9 },
      "kel-mojo-1": { hadir: 3, ijin: 13, alfa: 10 },
      "kel-mojo-2": { hadir: 9, ijin: 5, alfa: 12 },
      "kel-sampangan": { hadir: 17, ijin: 2, alfa: 11 },
      "kel-semanggi": { hadir: 13, ijin: 5, alfa: 12 },

      // Desa Selatan
      "kel-joyotakan-1": { hadir: 10, ijin: 11, alfa: 1 },
      "kel-joyotakan-2": { hadir: 28, ijin: 5, alfa: 10 },
      "kel-kaliwingko": { hadir: 30, ijin: 3, alfa: 6 },
      "kel-solo-baru": { hadir: 16, ijin: 21, alfa: 30 },

      // Desa Barat
      "kel-gentan": { hadir: 22, ijin: 8, alfa: 14 },
      "kel-pajang": { hadir: 19, ijin: 7, alfa: 11 },
      "kel-sondakan": { hadir: 15, ijin: 8, alfa: 16 },
      "kel-songgalan": { hadir: 5, ijin: 6, alfa: 9 },
      "kel-teposanan": { hadir: 20, ijin: 1, alfa: 14 }
    },
    created_at: "2026-01-20T19:30:00Z"
  }
];

const KBM_EVENTS_STORAGE_KEY = "ppg_kbm_events_v1";

export function getKbmEvents() {
  try {
    const raw = localStorage.getItem(KBM_EVENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(KBM_EVENTS_STORAGE_KEY, JSON.stringify(MOCK_KBM_EVENTS));
      return [...MOCK_KBM_EVENTS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KBM_EVENTS_STORAGE_KEY, JSON.stringify(MOCK_KBM_EVENTS));
      return [...MOCK_KBM_EVENTS];
    }
    return parsed;
  } catch (e) {
    return [...MOCK_KBM_EVENTS];
  }
}

export function getKbmEventById(id) {
  const list = getKbmEvents();
  return list.find(ev => ev.id === id) || null;
}

export async function saveKbmEvent(eventData) {
  const list = getKbmEvents();
  let savedData = { ...eventData };

  if (eventData.id) {
    const idx = list.findIndex(ev => ev.id === eventData.id);
    if (idx > -1) {
      savedData = { ...list[idx], ...eventData, updated_at: new Date().toISOString() };
    }
  } else {
    savedData = {
      ...eventData,
      created_at: new Date().toISOString()
    };
  }

  if (isSupabaseConfigured()) {
    const res = await upsertKbmEventToSupabase(savedData);
    if (res.success && res.data) {
      savedData = { ...savedData, ...res.data };
    } else {
      console.warn("Gagal simpan KBM ke Supabase:", res.error);
    }
  } else if (!savedData.id) {
    savedData.id = `kbm-evt-${Date.now()}`;
  }

  if (eventData.id) {
    const idx = list.findIndex(ev => ev.id === savedData.id);
    if (idx > -1) list[idx] = savedData;
    else list.unshift(savedData);
  } else {
    list.unshift(savedData);
  }

  localStorage.setItem(KBM_EVENTS_STORAGE_KEY, JSON.stringify(list));
  return savedData;
}

export async function deleteKbmEvent(id) {
  if (isSupabaseConfigured()) {
    await deleteKbmEventFromSupabase(id);
  }
  const list = getKbmEvents().filter(ev => ev.id !== id);
  localStorage.setItem(KBM_EVENTS_STORAGE_KEY, JSON.stringify(list));
  return true;
}

