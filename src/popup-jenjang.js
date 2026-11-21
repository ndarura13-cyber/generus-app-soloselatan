/**
 * popup-jenjang.js
 * Mengelola semua popup & modal ringkasan cepat dan rincian jenjang generus
 * di halaman landing (index.html) serta integrasi data real-time dengan database (db-master.js).
 */
"use strict";

import { getSiswaList, MASTER_WILAYAH, getAllKelompok, isSiswaAktif, syncSiswaFromSupabase } from "./db-master.js";

/* ───────────── Konfigurasi Kategori & Jenjang ───────────── */
const KATEGORI_CONFIG = {
  all:          { name: "Ringkasan Cepat: Seluruh Generus Solo Selatan", tier: "Semua Kategori & Jenjang", icon: "groups",        color: "#1a56c4", usia: "PAUD s.d. Usia Mandiri / Pra-Nikah" },
  caberawit:    { name: "Kategori Caberawit (PAUD – SD)",               tier: "Jenjang Usia Dini",         icon: "child_care",    color: "#d97706", usia: "PAUD, TK & SD (3–12 Thn)" },
  gp_reguler:   { name: "Kategori GP Reguler (SMP – SMA)",              tier: "Jenjang Usia Sekolah",      icon: "school",        color: "#1a56c4", usia: "1 SMP – 3 SMA (13–18 Thn)" },
  remaja:       { name: "Kategori Usia Remaja & Pra-Nikah",             tier: "Jenjang Pra-Nikah",         icon: "diversity_3",   color: "#2e8b57", usia: "19 – 22+ Tahun" },
  PAUD:         { name: "Jenjang PAUD (Pendidikan Anak Usia Dini)",     tier: "Caberawit",                 icon: "toys",          color: "#d97706", usia: "Usia 3 – 4 Tahun" },
  "TK A":       { name: "Jenjang TK A (Taman Kanak-Kanak A)",           tier: "Caberawit",                 icon: "palette",       color: "#d97706", usia: "Usia 5 Tahun" },
  "TK B":       { name: "Jenjang TK B (Taman Kanak-Kanak B)",           tier: "Caberawit",                 icon: "palette",       color: "#d97706", usia: "Usia 6 Tahun" },
  "1 SD":       { name: "Jenjang Kelas 1 SD",                          tier: "Caberawit",                 icon: "menu_book",     color: "#d97706", usia: "Usia 7 Tahun" },
  "2 SD":       { name: "Jenjang Kelas 2 SD",                          tier: "Caberawit",                 icon: "menu_book",     color: "#d97706", usia: "Usia 8 Tahun" },
  "3 SD":       { name: "Jenjang Kelas 3 SD",                          tier: "Caberawit",                 icon: "menu_book",     color: "#d97706", usia: "Usia 9 Tahun" },
  "4 SD":       { name: "Jenjang Kelas 4 SD",                          tier: "Caberawit",                 icon: "menu_book",     color: "#d97706", usia: "Usia 10 Tahun" },
  "5 SD":       { name: "Jenjang Kelas 5 SD",                          tier: "Caberawit",                 icon: "menu_book",     color: "#d97706", usia: "Usia 11 Tahun" },
  "6 SD":       { name: "Jenjang Kelas 6 SD",                          tier: "Caberawit",                 icon: "menu_book",     color: "#d97706", usia: "Usia 12 Tahun" },
  "1 SMP":      { name: "Jenjang Kelas 1 SMP / Kelas 7",               tier: "GP Reguler",                icon: "school",        color: "#1a56c4", usia: "Usia 13 Tahun" },
  "2 SMP":      { name: "Jenjang Kelas 2 SMP / Kelas 8",               tier: "GP Reguler",                icon: "school",        color: "#1a56c4", usia: "Usia 14 Tahun" },
  "3 SMP":      { name: "Jenjang Kelas 3 SMP / Kelas 9",               tier: "GP Reguler",                icon: "school",        color: "#1a56c4", usia: "Usia 15 Tahun" },
  "1 SMA":      { name: "Jenjang Kelas 1 SMA / Kelas 10",              tier: "GP Reguler",                icon: "history_edu",   color: "#1a56c4", usia: "Usia 16 Tahun" },
  "2 SMA":      { name: "Jenjang Kelas 2 SMA / Kelas 11",              tier: "GP Reguler",                icon: "history_edu",   color: "#1a56c4", usia: "Usia 17 Tahun" },
  "3 SMA":      { name: "Jenjang Kelas 3 SMA / Kelas 12",              tier: "GP Reguler",                icon: "history_edu",   color: "#1a56c4", usia: "Usia 18 Tahun" },
  "Pra-Nikah":  { name: "Bimbingan Pra-Nikah",                         tier: "Remaja",                    icon: "favorite",      color: "#2e8b57", usia: "Usia 19 – 22 Tahun" },
  "Kelas Remaja": { name: "Kelas Remaja Mandiri",                      tier: "Remaja",                    icon: "groups",        color: "#2e8b57", usia: "Usia > 22 Tahun" },
  "Mahasiswa":  { name: "Remaja Berstatus Mahasiswa",                  tier: "Remaja & Pra-Nikah",        icon: "school",        color: "#2e8b57", usia: "Usia 19+ Tahun" },
  "Bekerja":    { name: "Remaja Berstatus Bekerja / Wirausaha",        tier: "Remaja & Pra-Nikah",        icon: "work",          color: "#2e8b57", usia: "Usia 19+ Tahun" },
  "Lainnya":    { name: "Remaja Status Lainnya",                       tier: "Remaja & Pra-Nikah",        icon: "more_horiz",    color: "#2e8b57", usia: "Usia 19+ Tahun" },
  desa:         { name: "Wilayah 5 Desa Binaan PPG Solo Selatan",      tier: "Wilayah Tingkat Desa",      icon: "location_city", color: "#7c3aed", usia: "Terdiri dari 27 Kelompok" },
  kelompok:     { name: "Daftar 27 Kelompok Binaan Solo Selatan",      tier: "Wilayah Tingkat Kelompok",  icon: "home_work",     color: "#0284c7", usia: "Tersebar di 5 Desa" },
};

const KATEGORI_UTAMA = ["caberawit", "gp_reguler", "remaja", "all"];

/* ───────────── Hitung Statistik dari Database (Hanya Generus Aktif: Sambung) ───────────── */
function hitungStat(key) {
  const cfg = KATEGORI_CONFIG[key] || {
    name: "Kategori " + key,
    tier: "Jenjang Generus",
    icon: "school",
    color: "#1a56c4",
    usia: "Solo Selatan"
  };

  const isWilayah = key === "desa" || key === "kelompok";
  const allSiswa = getSiswaList();
  // Hanya ambil generus yang berstatus 'Sambung' sebagai generus aktif
  const siswaList = allSiswa.filter(isSiswaAktif);
  const totalNonAktif = allSiswa.length - siswaList.length;

  let filtered = [];
  if (!isWilayah) {
    if (key === "all") {
      filtered = siswaList;
    } else if (KATEGORI_UTAMA.includes(key)) {
      if (key.toLowerCase() === "remaja") {
        filtered = siswaList.filter(function(s) {
          const kat = (s.kategori_usia || "").toLowerCase();
          const isSmp = s.jenjang_kelas === "1 SMP" || s.jenjang_kelas === "2 SMP" || s.jenjang_kelas === "3 SMP" || (s.jenjang_kelas && s.jenjang_kelas.includes("SMP"));
          return kat === "remaja" || isSmp;
        });
      } else {
        filtered = siswaList.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === key.toLowerCase(); });
      }
    } else {
      filtered = siswaList.filter(function(s) {
        return (s.jenjang_kelas || "").trim().toLowerCase() === key.trim().toLowerCase();
      });
    }
  }

  const total  = filtered.length;
  const lCount = filtered.filter(function(s) { return (s.jenis_kelamin || "").toUpperCase() === "L"; }).length;
  const pCount = filtered.filter(function(s) { return (s.jenis_kelamin || "").toUpperCase() === "P"; }).length;

  const cabCount = filtered.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === "caberawit"; }).length;
  const gpCount  = filtered.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === "gp_reguler"; }).length;
  const remCount = filtered.filter(function(s) {
    const kat = (s.kategori_usia || "").toLowerCase();
    const isSmp = s.jenjang_kelas === "1 SMP" || s.jenjang_kelas === "2 SMP" || s.jenjang_kelas === "3 SMP" || (s.jenjang_kelas && s.jenjang_kelas.includes("SMP"));
    return kat === "remaja" || isSmp;
  }).length;

  const desaStats = (MASTER_WILAYAH.desa || []).map(function(desa) {
    const inDesa = filtered.filter(function(s) { return s.desa_id === desa.id; });
    const kelompokStats = (desa.kelompok || []).map(function(kel) {
      const siswaKel = inDesa.filter(function(s) { return s.kelompok_id === kel.id; });
      return {
        id: kel.id,
        nama: kel.nama,
        count: siswaKel.length,
        siswa: siswaKel
      };
    }).filter(function(k) { return k.count > 0; });

    return {
      id: desa.id,
      nama: desa.nama,
      total: inDesa.length,
      siswa: inDesa,
      kelompokStats: kelompokStats,
      allKelompok: desa.kelompok || []
    };
  }).filter(function(d) {
    return key === "all" || isWilayah || d.total > 0;
  });

  return {
    key: key,
    total: total,
    lCount: lCount,
    pCount: pCount,
    cabCount: cabCount,
    gpCount: gpCount,
    remCount: remCount,
    desaStats: desaStats,
    cfg: cfg,
    isWilayah: isWilayah,
    filtered: filtered
  };
}

/* ───────────── Sinkronisasi Data ke Landing Page ───────────── */
export function updateAngka() {
  try {
    const allList = getSiswaList();
    // Hanya generus yang berstatus 'Sambung' yang dihitung aktif
    const list = allList.filter(isSiswaAktif);
    const total = list.length;
    const cab = list.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === "caberawit"; }).length;
    const gp  = list.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === "gp_reguler"; }).length;
    const rem = list.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === "remaja"; }).length;
    const desaCount = (MASTER_WILAYAH.desa || []).length;
    const kelCount  = getAllKelompok().length;

    // 1. Update Hero Badge
    const heroEl = document.getElementById("heroGenerusCount");
    if (heroEl) {
      heroEl.textContent = total.toLocaleString("id-ID") + "+";
      heroEl.dataset.target = total;
    }

    // 2. Update Stat Cards (data-target dan textContent)
    function syncCard(sel, val) {
      const card = document.querySelector(sel);
      if (card) {
        const numEl = card.querySelector(".stat-num");
        if (numEl) {
          numEl.dataset.target = val;
          numEl.textContent = val.toLocaleString("id-ID");
        }
      }
    }

    syncCard('.stat-card[data-kategori-stat="all"]', total);
    syncCard('.stat-card[data-kategori-stat="caberawit"]', cab);
    syncCard('.stat-card[data-kategori-stat="gp_reguler"]', gp);
    syncCard('.stat-card[data-kategori-stat="remaja"]', rem);
    syncCard('.stat-card[data-kategori-stat="desa"]', desaCount);
    syncCard('.stat-card[data-kategori-stat="kelompok"]', kelCount);

    // 3. Update Badges di Section Jenjang
    const badgeCb = document.getElementById("badgeCaberawit");
    const badgeGp = document.getElementById("badgeGP");
    const badgeRm = document.getElementById("badgeRemaja");
    if (badgeCb) badgeCb.textContent = "Usia Dini (" + cab + " Generus)";
    if (badgeGp) badgeGp.textContent = "Usia Sekolah (" + gp + " Generus)";
    if (badgeRm) badgeRm.textContent = "Pra-Nikah (" + rem + " Generus)";

    // 4. Update Angka pada Tombol Jenjang (Level Pills)
    document.querySelectorAll(".level-pill[data-kategori]").forEach(function(pill) {
      const kat = pill.getAttribute("data-kategori");
      const c = list.filter(function(s) {
        return (s.jenjang_kelas || "").trim().toLowerCase() === kat.trim().toLowerCase();
      }).length;
      pill.innerHTML = kat + (c > 0 ? " <span class=\"pill-count\">" + c + "</span>" : "");
    });

  } catch (err) {
    console.warn("[popup-jenjang] updateAngka error:", err);
  }
}

/* ───────────── Tampilkan Modal Detail ───────────── */
export function bukaModal(key) {
  const modal = document.getElementById("modalJenjangDetail");
  if (!modal) {
    console.error("[popup-jenjang] Modal #modalJenjangDetail tidak ditemukan!");
    return;
  }

  const stat = hitungStat(key);
  if (!stat) return;

  const cfg = stat.cfg;
  const total = stat.total;
  const lCount = stat.lCount;
  const pCount = stat.pCount;
  const desaSt = stat.desaStats;
  const isWilayah = stat.isWilayah;
  const lPct = total > 0 ? Math.round((lCount / total) * 100) : 0;
  const pPct = total > 0 ? 100 - lPct : 0;

  const elIcon = document.getElementById("mjIcon");
  const elBadge = document.getElementById("mjBadge");
  const elTitle = document.getElementById("mjTitle");
  const elBody = document.getElementById("mjBody");
  const elIconWrapper = document.getElementById("mjIconWrapper");

  // Icon & Header
  if (elIcon) {
    elIcon.innerHTML = `<span class="material-symbols-outlined" style="font-size:28px;color:${cfg.color};">${cfg.icon}</span>`;
  }
  if (elIconWrapper) {
    elIconWrapper.style.backgroundColor = cfg.color + "20"; // 20% opacity of the color
  }
  if (elBadge) {
    elBadge.innerHTML = (isWilayah && key === "desa") ? `5 Desa Binaan &bull; Solo Selatan` 
                      : (isWilayah && key === "kelompok") ? `27 Kelompok Binaan &bull; Solo Selatan`
                      : (key === "all") ? `Data Terpusat &bull; Solo Selatan`
                      : `${cfg.usia} &bull; Solo Selatan`;
  }
  if (elTitle) {
    elTitle.textContent = isWilayah ? (key === "desa" ? "Struktur Wilayah Desa" : "Struktur Wilayah Kelompok") 
                        : (key === "all") ? "Semua Kategori Generus" 
                        : cfg.name;
  }

  // Body Content (Summary Hero + Gender Breakdown + Distribution)
  let html = "";

  // 1. Summary Hero Card (Modern Gradient & Stats Micro-Pills)
  const totalKelompokAktif = desaSt.reduce((acc, d) => acc + (d.kelompokStats || []).length, 0);
  html += `
    <div class="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-5 sm:p-7 shadow-xs">
      <!-- Decorative ambient glows -->
      <div class="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      <div class="absolute right-12 bottom-0 w-28 h-28 rounded-full bg-blue-300/15 blur-xl pointer-events-none"></div>
      
      <div class="relative z-10">
        <div class="flex items-center justify-between mb-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-[11px] font-bold uppercase tracking-wider">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${isWilayah ? "Statistik Wilayah" : "Total Generus Terdata"}
          </span>
          <span class="text-xs text-blue-100/80 font-medium">Solo Selatan</span>
        </div>

        <div class="flex items-baseline gap-2 mb-3">
          <div class="text-4xl sm:text-5xl font-black tracking-tight">${total.toLocaleString("id-ID")}</div>
          <div class="text-sm sm:text-base font-semibold text-blue-100/90">${isWilayah ? (key === "desa" ? "Desa Binaan" : "Kelompok Binaan") : "Santri Aktif"}</div>
        </div>

        <!-- Quick Info Micro-Pills -->
        <div class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-white/15 text-xs text-blue-100/95 font-medium">
          <div class="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
            <span class="material-symbols-outlined text-[15px]">location_city</span>
            <span>${desaSt.length} Desa Binaan</span>
          </div>
          ${!isWilayah ? `
            <div class="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
              <span class="material-symbols-outlined text-[15px]">home_work</span>
              <span>${totalKelompokAktif} Kelompok</span>
            </div>
          ` : ''}
          <div class="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
            <span class="material-symbols-outlined text-[15px] text-emerald-300">verified</span>
            <span>Status Sambung</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // 2. Gender Breakdown (Putra / Putri)
  if (!isWilayah && total > 0) {
    html += `
      <div class="p-5 sm:p-6 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div class="mb-3.5">
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-brandBlue dark:text-blue-400 text-[18px]">wc</span>
            Komposisi Gender Putra & Putri
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Perbandingan jumlah santri laki-laki dan perempuan</p>
        </div>

        <!-- Dual Cards Grid -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-3.5">
          <!-- Putra Card -->
          <div class="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 transition-all hover:shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-[20px] sm:text-[22px]">male</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] sm:text-xs">
                ${lPct}%
              </span>
            </div>
            <div class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Putra (Laki-laki)</div>
            <div class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              ${lCount.toLocaleString("id-ID")} <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Santri</span>
            </div>
          </div>

          <!-- Putri Card -->
          <div class="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 transition-all hover:shadow-xs">
            <div class="flex items-center justify-between mb-2">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <span class="material-symbols-outlined text-[20px] sm:text-[22px]">female</span>
              </div>
              <span class="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] sm:text-xs">
                ${pPct}%
              </span>
            </div>
            <div class="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Putri (Perempuan)</div>
            <div class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
              ${pCount.toLocaleString("id-ID")} <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Santri</span>
            </div>
          </div>
        </div>

        <!-- Segmented Dual Ratio Bar -->
        <div class="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/60">
          <div class="flex items-center justify-between text-xs font-bold mb-1.5">
            <span class="text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span> Putra: ${lCount} (${lPct}%)
            </span>
            <span class="text-rose-500 dark:text-rose-400 flex items-center gap-1">
              Putri: ${pCount} (${pPct}%) <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            </span>
          </div>
          <div class="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div class="h-full bg-blue-600 transition-all duration-500 rounded-l-full" style="width: ${lPct}%" title="Putra: ${lPct}%"></div>
            <div class="h-full bg-rose-500 transition-all duration-500 rounded-r-full" style="width: ${pPct}%" title="Putri: ${pPct}%"></div>
          </div>
        </div>
      </div>
    `;
  } else if (!isWilayah) {
    html += `
      <div class="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <span class="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 mb-1">person_off</span>
        <p>Belum ada santri terdaftar di jenjang ini.</p>
      </div>
    `;
  }

  // 3. Sebaran Wilayah (Desa & Kelompok)
  html += `
    <div class="p-5 sm:p-6 pt-4">
      <div class="flex items-center justify-between mb-3.5">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-brandBlue dark:text-blue-400 text-[18px]">map</span>
            ${isWilayah ? "Daftar Wilayah Binaan" : "Sebaran Wilayah & Kelompok"}
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ${isWilayah ? "Struktur pembagian desa dan kelompok binaan" : "Persebaran santri aktif per desa dan kelompok"}
          </p>
        </div>
        <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          ${isWilayah ? (key === 'desa' ? '5 Desa' : '27 Kelompok') : `${desaSt.length} Desa`}
        </span>
      </div>

      <div class="space-y-3">
  `;

  if (isWilayah) {
    html += (MASTER_WILAYAH.desa || []).map(function(desa) {
      const pills = (desa.kelompok || []).map(function(k) {
        return `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/70 dark:border-slate-600/60">
            <span class="w-1.5 h-1.5 rounded-full bg-brandBlue dark:bg-blue-400"></span>
            <span>${k.nama}</span>
          </div>
        `;
      }).join("");

      return `
        <div class="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
                <span class="material-symbols-outlined text-[17px]">location_city</span>
              </div>
              <div class="font-bold text-slate-900 dark:text-white text-sm">Desa ${desa.nama}</div>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/60">
              ${(desa.kelompok || []).length} Kelompok
            </span>
          </div>
          <div class="flex flex-wrap gap-1.5 pt-1">${pills}</div>
        </div>
      `;
    }).join("");
  } else if (desaSt.length > 0) {
    html += desaSt.map(function(desa) {
      const desaL = (desa.siswa || []).filter(s => (s.jenis_kelamin || '').toUpperCase() === 'L').length;
      const desaP = (desa.siswa || []).filter(s => (s.jenis_kelamin || '').toUpperCase() === 'P').length;
      const desaPct = total > 0 ? Math.round((desa.total / total) * 100) : 0;

      const chipsHtml = desa.kelompokStats.length > 0
        ? desa.kelompokStats.map(function(k) {
            return `
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/70 dark:border-slate-600/60 transition-colors">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                <span class="truncate max-w-[140px] sm:max-w-none">${k.nama}</span>
                <span class="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-200/60 dark:border-slate-700 shadow-sm">${k.count}</span>
              </div>
            `;
          }).join("")
        : `<div class="text-xs text-slate-400 italic">Belum ada data kelompok di desa ini</div>`;

      return `
        <div class="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700/60 transition-all">
          <!-- Header Desa -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-brandBlue dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <span class="material-symbols-outlined text-[17px]">location_city</span>
              </div>
              <div class="min-w-0">
                <div class="font-bold text-slate-900 dark:text-white text-sm truncate">Desa ${desa.nama}</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="text-blue-600 dark:text-blue-400 font-semibold">${desaL} Putra</span>
                  <span class="text-slate-300 dark:text-slate-600">&bull;</span>
                  <span class="text-rose-500 dark:text-rose-400 font-semibold">${desaP} Putri</span>
                </div>
              </div>
            </div>
            
            <div class="text-right shrink-0">
              <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brandBlue dark:text-blue-300 font-extrabold text-xs border border-blue-100 dark:border-blue-800/60">
                ${desa.total} <span class="font-medium text-[10px] opacity-80">Santri</span>
              </div>
              <div class="text-[10px] text-slate-400 font-medium mt-0.5">${desaPct}% dari total</div>
            </div>
          </div>

          <!-- Progress bar proporsi desa -->
          <div class="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
            <div class="h-full bg-brandBlue dark:bg-blue-500 rounded-full" style="width: ${desaPct}%"></div>
          </div>

          <!-- Chips Kelompok -->
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kelompok Terdaftar (${desa.kelompokStats.length})</div>
            <div class="flex flex-wrap gap-1.5">
              ${chipsHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");
  } else {
    html += `
      <div class="p-6 text-center text-xs text-slate-400">
        Belum ada persebaran wilayah untuk kategori ini.
      </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  if (elBody) {
    elBody.innerHTML = html;
  }


  // Tampilkan Modal dengan animasi Tailwind halus ala bottom sheet
  modal.style.display = "flex";
  const card = document.getElementById("mjCard");
  setTimeout(() => {
    modal.classList.remove("opacity-0", "pointer-events-none");
    if (card) {
      card.classList.remove("scale-95", "max-sm:translate-y-4");
    }
  }, 10);
  document.body.style.overflow = "hidden";
}

export function tutupModal() {
  const modal = document.getElementById("modalJenjangDetail");
  if (modal) {
    const card = document.getElementById("mjCard");
    modal.classList.add("opacity-0", "pointer-events-none");
    if (card) {
      card.classList.add("scale-95", "max-sm:translate-y-4");
    }
    setTimeout(() => {
      modal.style.display = "none";
    }, 250);
  }
  document.body.style.overflow = "";
}

/* ───────────── Inisialisasi Listener ───────────── */
function initPopupListeners() {
  // Update data awal dari local cache
  updateAngka();

  // Sinkronisasi data real-time dari Supabase di background
  syncSiswaFromSupabase().then(() => {
    updateAngka();
  }).catch(e => console.warn("[popup-jenjang] Background sync siswa:", e));

  // 1. Klik pada Hero Image Badge
  const heroBadge = document.getElementById("heroImgBadge");
  if (heroBadge) {
    heroBadge.addEventListener("click", function(e) {
      e.preventDefault();
      bukaModal("all");
    });
  }

  // 2. Klik pada Level Pills di section Jenjang
  document.querySelectorAll(".level-pill[data-kategori]").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      const kat = btn.getAttribute("data-kategori");
      bukaModal(kat);
    });
  });

  // 3. Klik pada Stat Cards (Total Generus, Caberawit, GP Reguler, Remaja, Desa, Kelompok)
  document.querySelectorAll(".stat-card[data-kategori-stat]").forEach(function(card) {
    card.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      const kat = card.getAttribute("data-kategori-stat");
      bukaModal(kat);
    });
  });

  // 4. Tombol Tutup & Backdrop
  const btnClose = document.getElementById("btnCloseMj");
  const btnOk    = document.getElementById("btnOkMj");
  const modal    = document.getElementById("modalJenjangDetail");

  if (btnClose) btnClose.addEventListener("click", tutupModal);
  if (btnOk)    btnOk.addEventListener("click", tutupModal);

  if (modal) {
    modal.addEventListener("click", function(e) {
      // Jika klik di luar kartu dialog (pada area backdrop)
      if (e.target === modal) {
        tutupModal();
      }
    });
  }

  // 5. Tombol Escape keyboard
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      tutupModal();
    }
  });

  // 6. Sinkronisasi jika ada pembaruan di tab lain
  window.addEventListener("storage", function(e) {
    if (e.key === "ppg_siswa_v1" || e.key === null) {
      updateAngka();
    }
  });

  console.log("[popup-jenjang] Berhasil diinisialisasi dan terhubung ke database.");
}

// Jalankan saat DOM siap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPopupListeners);
} else {
  initPopupListeners();
}
