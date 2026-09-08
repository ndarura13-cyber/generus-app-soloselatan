/**
 * popup-jenjang.js
 * Mengelola semua popup & modal ringkasan cepat dan rincian jenjang generus
 * di halaman landing (index.html) serta integrasi data real-time dengan database (db-master.js).
 */
"use strict";

import { getSiswaList, MASTER_WILAYAH, getAllKelompok, isSiswaAktif } from "./db-master.js";

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
  const elTotal = document.getElementById("mjTotalCount");
  const elSum = document.getElementById("mjSummary");
  const elGrid = document.getElementById("mjDesaGrid");

  // Icon & Header
  if (elIcon) {
    elIcon.innerHTML = `<span class="material-symbols-outlined" style="font-size:28px;color:${cfg.color};">${cfg.icon}</span>`;
  }
  if (elBadge) {
    elBadge.innerHTML = `${cfg.tier} &bull; ${cfg.usia}`;
    elBadge.style.color = cfg.color;
  }
  if (elTitle) {
    elTitle.textContent = cfg.name;
  }
  if (elTotal) {
    elTotal.textContent = isWilayah
      ? (key === "desa" ? "5 Desa Binaan" : "27 Kelompok Binaan")
      : `${total.toLocaleString("id-ID")} Generus Terdaftar`;
    elTotal.style.color = cfg.color;
  }

  // Summary Section
  if (elSum) {
    if (isWilayah) {
      elSum.innerHTML = `
        <div class="mj-sum-item">
          <span class="mj-sum-label">Struktur Wilayah PPG Solo Selatan</span>
          <span class="mj-sum-val" style="color:${cfg.color};">${key === "desa" ? "5 Desa Binaan" : "27 Kelompok Binaan"}</span>
          <span style="font-size:12px;color:var(--text-muted);margin-top:4px;">Terintegrasi dengan basis data generus &amp; absensi KBM</span>
        </div>
        <div class="mj-sum-badge">Wilayah Resmi Solo Selatan</div>
      `;
    } else if (key === "all") {
      // Ringkasan Cepat Seluruh Kategori
      elSum.innerHTML = `
        <div style="width:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
            <div>
              <span class="mj-sum-label">Total Generus Terdata di Database</span>
              <span class="mj-sum-val" style="color:${cfg.color};">${total.toLocaleString("id-ID")} Generus</span>
            </div>
            <div class="mj-sum-badge">Real-time Database PPG Solo Selatan</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:10px;margin-bottom:12px;">
            <div style="background:#fff;border:1px solid #fed7aa;border-radius:10px;padding:8px 12px;">
              <div style="font-size:11px;font-weight:700;color:#c2410c;">Caberawit (PAUD-SD)</div>
              <div style="font-size:18px;font-weight:800;color:#ea580c;">${stat.cabCount} <span style="font-size:11px;font-weight:600;color:#78716c;">(${total > 0 ? Math.round(stat.cabCount / total * 100) : 0}%)</span></div>
            </div>
            <div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:8px 12px;">
              <div style="font-size:11px;font-weight:700;color:#1d4ed8;">GP Reguler (SMP-SMA)</div>
              <div style="font-size:18px;font-weight:800;color:#2563eb;">${stat.gpCount} <span style="font-size:11px;font-weight:600;color:#78716c;">(${total > 0 ? Math.round(stat.gpCount / total * 100) : 0}%)</span></div>
            </div>
            <div style="background:#fff;border:1px solid #bbf7d0;border-radius:10px;padding:8px 12px;">
              <div style="font-size:11px;font-weight:700;color:#15803d;">Remaja &amp; Pra-Nikah</div>
              <div style="font-size:18px;font-weight:800;color:#16a34a;">${stat.remCount} <span style="font-size:11px;font-weight:600;color:#78716c;">(${total > 0 ? Math.round(stat.remCount / total * 100) : 0}%)</span></div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:12px;">
            <span style="min-width:68px;color:#1d4ed8;font-weight:700;">&#128102; ${lCount} Putra</span>
            <div style="flex:1;height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden;display:flex;">
              <div style="width:${lPct}%;background:#3b82f6;" title="Putra: ${lPct}%"></div>
              <div style="width:${pPct}%;background:#ec4899;" title="Putri: ${pPct}%"></div>
            </div>
            <span style="min-width:68px;color:#be185d;font-weight:700;text-align:right;">&#128103; ${pCount} Putri</span>
          </div>
        </div>
      `;
    } else {
      // Kategori atau Jenjang Spesifik
      let genderBar = "";
      if (total > 0) {
        genderBar = `
          <div style="margin-top:8px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:4px;">
              <span style="min-width:64px;color:#1d4ed8;font-weight:700;">&#128102; ${lCount} Putra</span>
              <div style="flex:1;height:7px;background:#e8efff;border-radius:99px;overflow:hidden;">
                <div style="width:${lPct}%;height:100%;background:#3b82f6;border-radius:99px;"></div>
              </div>
              <span style="font-size:11px;color:var(--text-muted);">${lPct}%</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
              <span style="min-width:64px;color:#be185d;font-weight:700;">&#128103; ${pCount} Putri</span>
              <div style="flex:1;height:7px;background:#fce7f3;border-radius:99px;overflow:hidden;">
                <div style="width:${pPct}%;height:100%;background:#ec4899;border-radius:99px;"></div>
              </div>
              <span style="font-size:11px;color:var(--text-muted);">${pPct}%</span>
            </div>
          </div>
        `;
      } else {
        genderBar = `<p style="font-size:12px;color:var(--text-muted);margin:4px 0 0;">Belum ada generus terdaftar di jenjang ini.</p>`;
      }

      elSum.innerHTML = `
        <div class="mj-sum-item">
          <span class="mj-sum-label">Total Generus di Kategori Ini</span>
          <span class="mj-sum-val" style="color:${cfg.color};">${total.toLocaleString("id-ID")} Generus</span>
          ${genderBar}
        </div>
        <div class="mj-sum-badge">Solo Selatan &bull; 5 Desa &bull; 27 Kelompok</div>
      `;
    }
  }

  // Grid Distribusi Desa & Kelompok
  if (elGrid) {
    if (isWilayah) {
      elGrid.innerHTML = (MASTER_WILAYAH.desa || []).map(function(desa) {
        const pills = (desa.kelompok || []).map(function(k) {
          return `<span class="mj-kel-pill">${k.nama}</span>`;
        }).join("");

        return `
          <div class="mj-desa-card">
            <div class="mj-desa-header">
              <div class="mj-desa-name">
                <span class="material-symbols-outlined" style="font-size:16px;color:${cfg.color};">location_city</span>
                <span>Desa ${desa.nama}</span>
              </div>
              <div class="mj-desa-count" style="color:${cfg.color};">${desa.kelompok.length} Kelompok</div>
            </div>
            <div class="mj-kelompok-list">${pills}</div>
          </div>
        `;
      }).join("");

    } else if (desaSt.length === 0) {
      elGrid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px 16px;background:var(--surface-2);border-radius:12px;border:1px dashed var(--border);">
          <span class="material-symbols-outlined" style="font-size:32px;color:var(--text-muted);display:block;margin-bottom:6px;">folder_open</span>
          <strong>Belum Ada Data Terdaftar</strong>
          <p style="font-size:12px;margin:4px 0 0;">Generus pada jenjang/kategori ini belum ditambahkan ke database.</p>
        </div>
      `;
    } else {
      const maxCount = Math.max.apply(null, desaSt.map(function(d) { return d.total; })) || 1;

      elGrid.innerHTML = desaSt.map(function(desa) {
        const barPct = Math.round((desa.total / maxCount) * 100);
        const kDisplay = desa.kelompokStats.length > 0
          ? desa.kelompokStats.map(function(k) {
              return `<span class="mj-kel-pill"><strong>${k.nama}</strong> (${k.count})</span>`;
            }).join("")
          : `<span style="font-size:10.5px;color:var(--text-muted);font-style:italic;">Belum ada data terdaftar</span>`;

        // Daftar nama generus ringkas (maks 6 nama) jika jenjang spesifik
        let namaPreview = "";
        if (!KATEGORI_UTAMA.includes(key) && desa.siswa.length > 0) {
          const names = desa.siswa.slice(0, 5).map(function(s) {
            return `<span style="font-size:11px;background:#fff;border:1px solid #e2e8f0;padding:2px 6px;border-radius:4px;color:#334155;">${s.nama_lengkap} (${s.jenis_kelamin})</span>`;
          }).join(" ");
          const moreText = desa.siswa.length > 5 ? `<span style="font-size:11px;color:var(--blue);font-weight:600;">+${desa.siswa.length - 5} lainnya</span>` : "";
          namaPreview = `
            <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #e2e8f0;">
              <div style="font-size:10px;font-weight:700;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;">Daftar Generus:</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">${names} ${moreText}</div>
            </div>
          `;
        }

        return `
          <div class="mj-desa-card">
            <div class="mj-desa-header">
              <div class="mj-desa-name">
                <span class="material-symbols-outlined" style="font-size:16px;color:${cfg.color};">location_city</span>
                <span>Desa ${desa.nama}</span>
              </div>
              <div class="mj-desa-count" style="color:${cfg.color};">${desa.total} Generus</div>
            </div>
            <div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin:4px 0;">
              <div style="width:${barPct}%;height:100%;background:${cfg.color};border-radius:99px;"></div>
            </div>
            <div class="mj-kelompok-list">${kDisplay}</div>
            ${namaPreview}
          </div>
        `;
      }).join("");
    }
  }

  // Tampilkan Modal
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

export function tutupModal() {
  const modal = document.getElementById("modalJenjangDetail");
  if (modal) {
    modal.style.display = "none";
  }
  document.body.style.overflow = "";
}

/* ───────────── Inisialisasi Listener ───────────── */
function initPopupListeners() {
  // Update data awal
  updateAngka();

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
