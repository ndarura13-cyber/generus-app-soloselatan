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
      filtered = siswaList.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === key.toLowerCase(); });
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
  const remCount = filtered.filter(function(s) { return (s.kategori_usia || "").toLowerCase() === "remaja"; }).length;

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

  // Body Content (Summary + Distribution)
  let html = "";

  // 1. Summary Block (Solid Blue)
  html += `
    <div class="bg-brandBlue dark:bg-brandDarkBlue text-white p-6 pb-8 text-center relative overflow-hidden">
      <!-- Subtle Background Detail -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
      
      <div class="relative z-10">
        <h4 class="font-semibold text-sm opacity-90 mb-1">Ringkasan</h4>
        <div class="text-5xl font-extrabold mb-1 tracking-tight">${total.toLocaleString("id-ID")}</div>
        <div class="text-sm opacity-80 font-medium">${isWilayah ? "Total Wilayah" : "Total Generus"}</div>
      </div>
    </div>
  `;

  // 2. Gender Breakdown (if not wilayah and total > 0)
  if (!isWilayah && total > 0) {
    html += `
      <div class="p-6 pb-2">
        <h4 class="text-base font-bold text-slate-800 dark:text-white mb-4">Rincian Generus</h4>
        <div class="grid grid-cols-2 gap-4">
          <!-- Putra -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                <span class="text-xl">&#128102;</span>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Putra</div>
                <div class="font-bold text-slate-800 dark:text-white text-sm">${lCount} Putra</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full" style="width: ${lPct}%"></div>
              </div>
              <span class="text-[10px] font-bold text-blue-600 dark:text-blue-400 w-6">${lPct}%</span>
            </div>
          </div>
          <!-- Putri -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center shrink-0">
                <span class="text-xl">&#128103;</span>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Putri</div>
                <div class="font-bold text-slate-800 dark:text-white text-sm">${pCount} Putri</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-1.5 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-pink-500 rounded-full" style="width: ${pPct}%"></div>
              </div>
              <span class="text-[10px] font-bold text-pink-600 dark:text-pink-400 w-6">${pPct}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (!isWilayah) {
    html += `
      <div class="p-6 pb-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Belum ada data terdaftar di jenjang ini.
      </div>
    `;
  }

  // 3. Desa / Kelompok Distribution Grid
  html += `<div class="p-6 pt-4">`;
  
  // Memulai satu kesatuan kartu dengan garis pemisah (divide-y)
  html += `<div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 rounded-xl overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-700/60">`;

  if (isWilayah) {
    html += (MASTER_WILAYAH.desa || []).map(function(desa) {
      const pills = (desa.kelompok || []).map(function(k) {
        return `<span class="inline-block bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 mr-1.5 mb-1.5">&bull; ${k.nama}</span>`;
      }).join("");

      return `
        <div class="p-4 bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
          <div class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-[16px] text-brandBlue dark:text-blue-400">location_city</span>
            Desa ${desa.nama} <span class="font-normal text-slate-500 text-xs">(${desa.kelompok.length} Kelompok)</span>
          </div>
          <div>${pills}</div>
        </div>
      `;
    }).join("");
  } else if (desaSt.length > 0) {
    html += desaSt.map(function(desa) {
      const kDisplay = desa.kelompokStats.length > 0
        ? desa.kelompokStats.map(function(k) {
            return `<span class="text-[11.5px] text-slate-600 dark:text-slate-400 mr-2 mb-1 inline-block">&bull; ${k.nama} <span class="opacity-60">(${k.count})</span></span>`;
          }).join("")
        : `<span class="text-[11px] text-slate-400 italic">Belum ada data</span>`;

      return `
        <div class="p-4 bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
          <div class="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 mb-2">
            <span class="material-symbols-outlined text-[16px] text-brandBlue dark:text-blue-400">location_city</span>
            Desa ${desa.nama} <span class="font-normal text-slate-500 text-xs">(${desa.total} Generus)</span>
          </div>
          <div class="pl-6 ml-2">${kDisplay}</div>
        </div>
      `;
    }).join("");
  }

  html += `</div>`; // akhir dari satu kesatuan kartu
  html += `</div>`; // akhir padding wrapper
  
  if (elBody) {
    elBody.innerHTML = html;
  }


  // Tampilkan Modal dengan animasi Tailwind halus
  modal.style.display = "flex";
  const card = document.getElementById("mjCard");
  setTimeout(() => {
    modal.classList.remove("opacity-0", "pointer-events-none");
    if (card) card.classList.remove("scale-95");
  }, 10);
  document.body.style.overflow = "hidden";
}

export function tutupModal() {
  const modal = document.getElementById("modalJenjangDetail");
  if (modal) {
    const card = document.getElementById("mjCard");
    modal.classList.add("opacity-0", "pointer-events-none");
    if (card) card.classList.add("scale-95");
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
