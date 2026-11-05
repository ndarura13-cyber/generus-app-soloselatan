/* ═══════════════════════════════════════════════════════════════
   dashboard-proker.js — Program Kerja Tahunan PPG Solo Selatan
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  getProkerList,
  addProker,
  updateProker,
  updateRealisasiProker,
  deleteProker,
  getProkerStats,
  syncProkerFromSupabase
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js';

let appHooks = {
  renderUserProfile: () => { }
};

export function setProkerHooks(hooks) {
  appHooks = { ...appHooks, ...hooks };
}

export const DAFTAR_BIDANG_PPG = [
  'Ketua',
  'Wakil Ketua',
  'Sekretaris',
  'Bendahara',
  'Kurikulum',
  'Tenaga Pendidik',
  'Penggalang Dana',
  'Sarana dan Prasarana',
  'Kegiatan Muda Mudi',
  'Seni dan Olahraga',
  'Kemandirian',
  'Keputrian',
  'Bimbingan Konseling',
  'Tahfidz'
];



export async function exportProkerCsv() {
  const prokerList = getProkerList();
  const stats = getProkerStats();
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "NO;KEGIATAN;WAKTU;SASARAN/ PESERTA;TUJUAN KEGIATAN;RINCIAN BIAYA;EST. BIAYA;TEMPAT PELAKSANAAN;REALISASI PROKER;DESKRIPSI REALISASI PROKER;REALISASI PENGGUNAAN DANA\n";

  // Group by PIC
  const grouped = prokerList.reduce((acc, curr) => {
    const pic = curr.penanggungJawab || 'Tanpa Bidang';
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterIdx = 0;

  Object.keys(grouped).sort().forEach(pic => {
    const letter = alphabet[letterIdx % alphabet.length] || '';
    letterIdx++;
    let subtotalEst = 0;
    let subtotalReal = 0;

    // Section Header row matching Excel format (e.g. A. BENDAHARA)
    csvContent += `\n"${letter}.";"${pic.toUpperCase()}";;;;;;;;;\n`;

    grouped[pic].forEach((p, idx) => {
      const no = p.no || (idx + 1);
      const kegiatan = `"${(p.kegiatan || '').replace(/"/g, '""')}"`;
      const waktu = `"${(p.waktu || '').replace(/"/g, '""')}"`;
      const sasaran = `"${(p.sasaran || '').replace(/"/g, '""')}"`;
      const tujuan = `"${(p.tujuan || '').replace(/"/g, '""')}"`;
      const rincianBiaya = `"${(p.rincianBiaya || '').replace(/"/g, '""')}"`;
      const estBiaya = p.estBiaya || 0;
      const tempat = `"${(p.tempat || '').replace(/"/g, '""')}"`;
      const realisasiStatus = p.realisasiStatus === 'terlaksana' ? 'Terlaksana' : 'Belum Terlaksana';
      const deskripsiRealisasi = `"${(p.deskripsiRealisasi || '').replace(/"/g, '""')}"`;
      const realisasiBiaya = p.realisasiBiaya || 0;

      subtotalEst += estBiaya;
      subtotalReal += realisasiBiaya;

      csvContent += `${no};${kegiatan};${waktu};${sasaran};${tujuan};${rincianBiaya};${estBiaya};${tempat};${realisasiStatus};${deskripsiRealisasi};${realisasiBiaya}\n`;
    });

    // Subtotal row per bidang matching spreadsheet format
    csvContent += `;"SUB TOTAL ${pic.toUpperCase()}";;;;;${subtotalEst};;;;${subtotalReal}\n`;
  });

  // Grand Total row at the bottom
  csvContent += `\n;"TOTAL KESELURUHAN (SEMUA BIDANG)";;;;;${stats.totalAnggaran};;;;${stats.totalRealisasiDana}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Realisasi_RAB_PPG_Solo_Selatan_2026_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function printProkerTable() {
  const prokerList = getProkerList();
  const stats = getProkerStats();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Group by PIC
  const grouped = prokerList.reduce((acc, curr) => {
    const pic = curr.penanggungJawab || 'Tanpa Bidang';
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterIdx = 0;
  let rowsHtml = '';

  Object.keys(grouped).sort().forEach(pic => {
    const letter = alphabet[letterIdx % alphabet.length] || '';
    letterIdx++;
    let subtotalEst = 0;
    let subtotalReal = 0;

    // Section Header row matching Excel format (e.g. A. BENDAHARA)
    rowsHtml += `
      <tr style="background:#cfe2f3;">
        <td style="text-align:center;padding:7px 5px;border:1px solid #94a3b8;font-weight:900;font-size:12px;color:#0b386b;">${letter}.</td>
        <td colspan="10" style="padding:7px 8px;border:1px solid #94a3b8;font-weight:900;font-size:12px;color:#0b386b;letter-spacing:0.5px;">
          ${pic.toUpperCase()}
        </td>
      </tr>
    `;

    grouped[pic].forEach((p, idx) => {
      const isTerlaksana = p.realisasiStatus === 'terlaksana';
      const est = p.estBiaya || 0;
      const real = p.realisasiBiaya || 0;
      subtotalEst += est;
      subtotalReal += real;

      const estText = est > 0 ? `Rp ${est.toLocaleString('id-ID')}` : 'Rp -';
      const realText = real > 0 ? `Rp ${real.toLocaleString('id-ID')}` : (isTerlaksana ? 'Rp -' : '');

      rowsHtml += `
        <tr>
          <td style="text-align:center;padding:6px 4px;border:1px solid #cbd5e1;font-weight:bold;font-size:11px;">${p.no || (idx + 1)}</td>
          <td style="padding:6px 8px;border:1px solid #cbd5e1;font-size:11px;font-weight:600;">${p.kegiatan}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;font-size:10.5px;white-space:nowrap;">${p.waktu || ''}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;font-size:10.5px;">${p.sasaran || ''}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;font-size:10.5px;line-height:1.3;">${p.tujuan || ''}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;font-size:10px;font-style:italic;line-height:1.3;">${p.rincianBiaya || '-'}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;text-align:right;font-size:11px;font-weight:bold;color:#0e7039;white-space:nowrap;">${estText}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;font-size:10.5px;">${p.tempat || ''}</td>
          <td style="padding:6px 4px;border:1px solid #cbd5e1;text-align:center;">
            <span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:9.5px;font-weight:bold;color:#ffffff;background:${isTerlaksana ? '#0e7039' : '#991b1b'};white-space:nowrap;">
              ${isTerlaksana ? 'Terlaksana' : 'Belum Terlaksana'}
            </span>
          </td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;font-size:10px;line-height:1.3;">${p.deskripsiRealisasi || ''}</td>
          <td style="padding:6px 6px;border:1px solid #cbd5e1;text-align:right;font-size:11px;font-weight:bold;color:#1e40af;white-space:nowrap;">${realText}</td>
        </tr>
      `;
    });

    // Subtotal row matching screenshot
    rowsHtml += `
      <tr style="background:#f8fafc;font-weight:bold;border-top:1.5px solid #64748b;border-bottom:1.5px solid #64748b;">
        <td colspan="6" style="text-align:right;padding:6px 8px;border:1px solid #cbd5e1;font-size:10.5px;font-weight:900;">
          SUB TOTAL ${pic.toUpperCase()}
        </td>
        <td style="text-align:right;padding:6px 6px;border:1px solid #cbd5e1;font-size:11px;font-weight:900;color:#0e7039;white-space:nowrap;">
          Rp ${subtotalEst.toLocaleString('id-ID')}
        </td>
        <td colspan="3" style="border:1px solid #cbd5e1;"></td>
        <td style="text-align:right;padding:6px 6px;border:1px solid #cbd5e1;font-size:11px;font-weight:900;color:#1e40af;white-space:nowrap;">
          Rp ${subtotalReal.toLocaleString('id-ID')}
        </td>
      </tr>
    `;
  });

  // Grand Total row
  rowsHtml += `
    <tr style="background:#cfe2f3;font-weight:900;border-top:2px solid #0b386b;border-bottom:2px solid #0b386b;">
      <td colspan="6" style="text-align:right;padding:8px 8px;border:1px solid #94a3b8;font-size:11.5px;color:#0b386b;">
        TOTAL KESELURUHAN (SEMUA BIDANG)
      </td>
      <td style="text-align:right;padding:8px 6px;border:1px solid #94a3b8;font-size:12px;color:#0e7039;white-space:nowrap;">
        Rp ${stats.totalAnggaran.toLocaleString('id-ID')}
      </td>
      <td colspan="3" style="border:1px solid #94a3b8;"></td>
      <td style="text-align:right;padding:8px 6px;border:1px solid #94a3b8;font-size:12px;color:#1e40af;white-space:nowrap;">
        Rp ${stats.totalRealisasiDana.toLocaleString('id-ID')}
      </td>
    </tr>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Program Kerja & Realisasi RAB PPG Solo Selatan 2026</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 16px; color:#1e293b; }
        h2 { margin: 0 0 2px 0; color: #0b386b; font-size: 16px; font-weight: 800; }
        p { margin: 2px 0 12px 0; font-size: 11px; color:#64748b; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 10px; }
        th { background: #f1f5f9; padding: 7px 5px; border:1px solid #94a3b8; text-align: left; font-size: 9.5px; font-weight: 800; color:#334155; }
        .summary-box { display: flex; gap: 16px; font-size: 11px; padding: 8px 12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius: 6px; margin-bottom: 10px; flex-wrap: wrap; }
        @media print {
          button { display: none; }
          body { margin: 8px; }
          @page { size: landscape; margin: 8mm; }
        }
      </style>
    </head>
    <body>
      <h2>PROGRAM KERJA & LAPORAN REALISASI ANGGARAN PPG SOLO SELATAN</h2>
      <p>Tahun Anggaran 2026 &bull; Format Resmi LPJ &bull; Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <div class="summary-box">
        <div><strong>Total Program:</strong> ${stats.total}</div>
        <div><strong>Est. Anggaran (RAB):</strong> Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</div>
        <div><strong>Realisasi Dana:</strong> Rp ${stats.totalRealisasiDana.toLocaleString('id-ID')}</div>
        <div><strong>Penyerapan:</strong> ${stats.persenRealisasiDana}%</div>
        <div><strong>Ketercapaian:</strong> ${stats.totalTerlaksana} Terlaksana &bull; ${stats.totalBelumTerlaksana} Belum</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:25px;text-align:center;">NO</th>
            <th style="min-width:180px;">KEGIATAN</th>
            <th style="min-width:90px;">WAKTU</th>
            <th style="min-width:110px;">SASARAN/ PESERTA</th>
            <th style="min-width:150px;">TUJUAN KEGIATAN</th>
            <th style="min-width:140px;">RINCIAN BIAYA</th>
            <th style="min-width:95px;text-align:right;">EST. BIAYA</th>
            <th style="min-width:90px;">TEMPAT PELAKSANAAN</th>
            <th style="min-width:110px;text-align:center;">REALISASI PROKER<br/>(TERLAKSANA/BELUM)</th>
            <th style="min-width:140px;">DESKRIPSI REALISASI PROKER</th>
            <th style="min-width:95px;text-align:right;">REALISASI PENGGUNAAN</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr && !endDateStr) return '';
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  if (startDateStr && !endDateStr) {
    const s = new Date(startDateStr);
    return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
  }

  if (!startDateStr && endDateStr) {
    const e = new Date(endDateStr);
    return `${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
  }

  const s = new Date(startDateStr);
  const e = new Date(endDateStr);

  const isSameDay = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
  if (isSameDay) {
    return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
  }

  const isSameMonthAndYear = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  if (isSameMonthAndYear) {
    const lastDayOfMonth = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
    if (s.getDate() === 1 && e.getDate() === lastDayOfMonth) {
      return `${monthNames[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} – ${e.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
  }

  const isSameYear = s.getFullYear() === e.getFullYear();
  if (isSameYear) {
    return `${s.getDate()} ${monthNames[s.getMonth()]} – ${e.getDate()} ${monthNames[e.getMonth()]} ${s.getFullYear()}`;
  }

  return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
}

export async function renderProkerModal(filterBidang = 'all', filterStatus = 'all', searchQuery = '', activeTab = 'timeline', currentPage = 1, shouldSync = true) {
  // Synchronize with Supabase if requested (e.g. on initial modal open)
  if (shouldSync) {
    try {
      await syncProkerFromSupabase();
    } catch (err) {
      console.warn('Sync Supabase Proker warning:', err);
    }
  }

  const isSuper = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';
  const prokerList = getProkerList();
  const stats = getProkerStats();

  // Filter proker data: Status, Bidang Penanggung Jawab (PIC), Search
  let filtered = prokerList.filter(p => {
    if (filterBidang !== 'all') {
      const picText = (p.penanggungJawab || '').toLowerCase();
      if (!picText.includes(filterBidang.toLowerCase())) return false;
    }
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKegiatan = (p.kegiatan || '').toLowerCase().includes(q);
      const matchTempat = (p.tempat || '').toLowerCase().includes(q);
      const matchTujuan = (p.tujuan || '').toLowerCase().includes(q);
      const matchSasaran = (p.sasaran || '').toLowerCase().includes(q);
      const matchPic = (p.penanggungJawab || '').toLowerCase().includes(q);
      if (!matchKegiatan && !matchTempat && !matchTujuan && !matchSasaran && !matchPic) return false;
    }
    return true;
  });

  // Sort by 'no' ascending
  filtered.sort((a, b) => (a.no || 0) - (b.no || 0));

  // Role Header Banner
  let bannerNoticeHtml = '';
  if (isSuper) {
    bannerNoticeHtml = `
      <div class="proker-banner-gold">
        <div class="proker-banner-gold-content">
          <div class="proker-banner-gold-title">Wewenang Superadmin Daerah</div>
          <div class="proker-banner-gold-sub">Tombol fungsi ini hanya tampil pada halaman Superadmin, desa kelompok hanya dapat melihat 👁️ .</div>
        </div>
        <button type="button" id="btnTambahProkerBaru" class="btn-proker-banner-gold">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span> Tambah Program Kerja
        </button>
      </div>
    `;
  } else {
    bannerNoticeHtml = `
      <div class="proker-banner-wilayah">
        <strong>Mode Koordinasi Wilayah (${currentUser.tingkatan === 'desa' ? 'Tingkat Desa ' + (currentUser.desaNama || '') : 'Pamong Kelompok ' + (currentUser.kelompokNama || '')}):</strong><br/>
        Berikut adalah agenda resmi Program Kerja PPG Solo Selatan beserta rincian sasaran, tujuan, waktu, dan tempat pelaksanaan kegiatan.
      </div>
    `;
  }

  // Summary Stat Strip (Realisasi & LPJ Integrated)
  const statsHtml = `
    <div class="proker-stats-container">
      <!-- BARIS 1: INFORMASI KETERCAPAIAN & STATUS -->
      <div class="proker-stats-row-1">
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon">inventory_2</span>
          <div class="proker-stat-info">
            <span class="stat-label">TOTAL PROGRAM</span>
            <span class="stat-num">${stats.total} <span class="stat-unit">Prog</span></span>
          </div>
        </div>
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon" style="color:#057a55;">check_circle</span>
          <div class="proker-stat-info">
            <span class="stat-label">TERLAKSANA (LPJ)</span>
            <span class="stat-num" style="color:#057a55;">${stats.totalTerlaksana} <span class="stat-unit">Prog</span></span>
          </div>
        </div>
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon" style="color:#c81e1e;">pending_actions</span>
          <div class="proker-stat-info">
            <span class="stat-label">BELUM TERLAKSANA</span>
            <span class="stat-num" style="color:#c81e1e;">${stats.totalBelumTerlaksana} <span class="stat-unit">Prog</span></span>
          </div>
        </div>
      </div>

      <!-- BARIS 2 ANGGARAN DESKTOP (3 KOLOM) -->
      <div class="proker-stats-row-2 proker-stats-row-2-desktop">
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon">payments</span>
          <div class="proker-stat-info">
            <span class="stat-label">EST. BIAYA (RAB AWAL)</span>
            <span class="stat-num">Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</span>
            <span class="stat-sub">Rencana Anggaran Belanja</span>
          </div>
        </div>
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon" style="color:#0e7039;">account_balance_wallet</span>
          <div class="proker-stat-info">
            <span class="stat-label">REALISASI DANA (LPJ)</span>
            <span class="stat-num" style="color:#0e7039;">Rp ${stats.totalRealisasiDana.toLocaleString('id-ID')}</span>
            <span class="stat-sub">Aktual Pengeluaran LPJ</span>
          </div>
        </div>
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon" style="color:#2563eb;">pie_chart</span>
          <div class="proker-stat-info">
            <span class="stat-label">PENYERAPAN DANA (${stats.persenRealisasiDana}%)</span>
            <span class="stat-num" style="color:${stats.selisihDana >= 0 ? '#057a55' : '#c81e1e'};">
              ${stats.selisihDana >= 0 ? 'Sisa Rp ' + stats.selisihDana.toLocaleString('id-ID') : 'Over Rp ' + Math.abs(stats.selisihDana).toLocaleString('id-ID')}
            </span>
            <span class="stat-sub">${stats.selisihDana >= 0 ? 'Efisiensi Anggaran' : 'Melebihi Estimasi RAB'}</span>
          </div>
        </div>
      </div>

      <!-- BARIS 2 ANGGARAN MOBILE -->
      <div class="proker-stats-anggaran-mobile">
        <div class="proker-anggaran-line-1">
          <div class="anggaran-line-label">
            <span class="material-symbols-outlined" style="font-size:15px;color:#2563eb;">payments</span>
            <span>RAB: Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</span>
          </div>
          <strong style="color:#0e7039;">Realisasi: Rp ${stats.totalRealisasiDana.toLocaleString('id-ID')}</strong>
        </div>
        <div class="proker-anggaran-line-2">
          <div class="anggaran-line-prev">
            <span>Penyerapan: <strong>${stats.persenRealisasiDana}%</strong> &bull; </span>
            <span style="font-weight:700;color:${stats.selisihDana >= 0 ? '#057a55' : '#c81e1e'};">
              ${stats.selisihDana >= 0 ? 'Sisa Rp ' + stats.selisihDana.toLocaleString('id-ID') : 'Over Rp ' + Math.abs(stats.selisihDana).toLocaleString('id-ID')}
            </span>
          </div>
          <div class="proker-growth-pill ${stats.percentGrowth >= 0 ? 'up' : 'down'}">
            <span>${stats.percentGrowth > 0 ? '+' : ''}${stats.percentGrowth}%</span>
            <span class="material-symbols-outlined" style="font-size:13px;">${stats.percentGrowth >= 0 ? 'trending_up' : 'trending_down'}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Filter Bar
  const bidangOptions = DAFTAR_BIDANG_PPG.map(b =>
    `<option value="${b}" ${filterBidang === b ? 'selected' : ''}>Bidang ${b}</option>`
  ).join('');

  const filterHtml = `
    <div class="proker-filter-bar">
      <!-- BARIS 1: PENCARIAN (FULL WIDTH) -->
      <div class="proker-filter-row-1">
        <div class="proker-search-wrap">
          <input type="text" id="inputProkerSearch" value="${searchQuery}" placeholder="Cari kegiatan, tempat, tujuan..." class="proker-input" />
          <span class="material-symbols-outlined proker-search-icon">search</span>
        </div>
      </div>

      <!-- BARIS 2: FILTER STATUS DAN BIDANG (BERDAMPINGAN) -->
      <div class="proker-filter-row-2">
        <div class="proker-filter-col">
          <select id="selectFilterStatus" class="proker-select">
            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
            <option value="ongoing" ${filterStatus === 'ongoing' ? 'selected' : ''}>🟢 Berlangsung</option>
            <option value="upcoming" ${filterStatus === 'upcoming' ? 'selected' : ''}>🟡 Akan Datang</option>
            <option value="planned" ${filterStatus === 'planned' ? 'selected' : ''}>🔵 Direncanakan</option>
            <option value="done" ${filterStatus === 'done' ? 'selected' : ''}>⚪ Selesai</option>
          </select>
        </div>

        <div class="proker-filter-col">
          <select id="selectFilterBidang" class="proker-select">
            <option value="all" ${filterBidang === 'all' ? 'selected' : ''}>Semua Bidang</option>
            ${bidangOptions}
          </select>
        </div>
      </div>

      <!-- BARIS 3: AKSI EKSPOR & TABS TAMPILAN -->
      <div class="proker-filter-row-3">
        <div class="proker-export-btns">
          <button type="button" id="btnExportCsv" class="proker-btn-csv" title="Download data dalam format Excel CSV">
            <span class="material-symbols-outlined" style="font-size:16px;">file_download</span> CSV
          </button>
          <button type="button" id="btnPrintTable" class="proker-btn-print" title="Cetak dokumen resmi">
            <span class="material-symbols-outlined" style="font-size:16px;">print</span> Cetak
          </button>
        </div>

        <div class="proker-tabs-wrap">
          <button type="button" id="tabViewTimeline" class="proker-tab-pill ${activeTab === 'timeline' ? 'active' : ''}">
            <span class="material-symbols-outlined" style="font-size:15px;">view_timeline</span> Timeline
          </button>
          <button type="button" id="tabViewTable" class="proker-tab-pill ${activeTab === 'table' ? 'active' : ''}">
            <span class="material-symbols-outlined" style="font-size:15px;">table_chart</span> Tabel
          </button>
        </div>
      </div>
    </div>
  `;

  // Pagination Calculation
  const itemsPerPage = 5;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Pagination HTML Builder
  let paginationHtml = '';
  if (totalItems > 0) {
    let pageButtonsHtml = '';
    for (let pNum = 1; pNum <= totalPages; pNum++) {
      pageButtonsHtml += `
        <button type="button" class="proker-page-btn ${pNum === currentPage ? 'active' : ''}" data-page="${pNum}">
          ${pNum}
        </button>
      `;
    }

    paginationHtml = `
      <div class="proker-pagination">
        <div class="proker-pagination-info">
          Menampilkan <strong>${startIndex + 1} – ${Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong>${totalItems}</strong> program
        </div>
        <div class="proker-pagination-btns">
          <button type="button" class="proker-page-btn btn-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <span class="material-symbols-outlined" style="font-size:16px;">chevron_left</span> Sebelumnya
          </button>
          ${pageButtonsHtml}
          <button type="button" class="proker-page-btn btn-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            Selanjutnya <span class="material-symbols-outlined" style="font-size:16px;">chevron_right</span>
          </button>
        </div>
      </div>
    `;
  }

  // Content rendering based on activeTab
  let contentHtml = '';

  if (activeTab === 'table') {
    let rowsHtml = paginatedItems.map((p, idx) => {
      const isTerlaksana = p.realisasiStatus === 'terlaksana';
      const estVal = p.estBiaya || 0;
      const realVal = p.realisasiBiaya || 0;
      const diffVal = estVal - realVal;

      let realisasiSelectOrBadge = isSuper ? `
        <select class="proker-realisasi-quick-select ${isTerlaksana ? 'terlaksana' : 'belum_terlaksana'}" data-id="${p.id}" title="Klik untuk cepat ubah status realisasi LPJ">
          <option value="terlaksana" ${isTerlaksana ? 'selected' : ''}>Terlaksana</option>
          <option value="belum_terlaksana" ${!isTerlaksana ? 'selected' : ''}>Belum Terlaksana</option>
        </select>
      ` : `
        <span class="proker-realisasi-badge ${isTerlaksana ? 'terlaksana' : 'belum_terlaksana'}">
          ${isTerlaksana ? 'Terlaksana' : 'Belum Terlaksana'}
        </span>
      `;

      let actionsCell = '';
      if (isSuper) {
        actionsCell = `
          <td style="white-space:nowrap;text-align:right;">
            <div style="display:inline-flex;gap:4px;align-items:center;">
              <button type="button" class="btn-proker-lpj" data-id="${p.id}" title="Lapor LPJ & Realisasi Penggunaan Dana">
                <span class="material-symbols-outlined" style="font-size:14px;">assignment_turned_in</span> LPJ
              </button>
              <button type="button" class="btn-proker-edit" data-id="${p.id}" title="Edit Program Kerja" style="padding:5px 7px;border:1px solid var(--border);background:var(--surface);color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;">
                <span class="material-symbols-outlined" style="font-size:14px;">edit</span>
              </button>
              <button type="button" class="btn-proker-del" data-id="${p.id}" data-title="${p.kegiatan}" title="Hapus Program" style="padding:5px 7px;border:1px solid var(--border);background:var(--surface);color:var(--red);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
              </button>
            </div>
          </td>
        `;
      }

      return `
        <tr>
          <td style="font-weight:800;text-align:center;color:var(--blue);">${p.no || (startIndex + idx + 1)}</td>
          <td>
            <div style="font-weight:800;font-size:13px;color:var(--text);">${p.kegiatan}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
              <span style="background:rgba(37,99,235,0.08);color:#1d4ed8;padding:2px 7px;border-radius:4px;font-weight:700;font-size:10.5px;">
                ${p.penanggungJawab || 'Pengurus PPG'}
              </span>
            </div>
          </td>
          <td style="white-space:nowrap;">
            <div style="font-weight:700;color:var(--text);display:flex;align-items:center;gap:4px;font-size:11.5px;">
              <span class="material-symbols-outlined" style="font-size:14px;color:var(--blue);">calendar_today</span>
              ${p.waktu || '-'}
            </div>
          </td>
          <td>
            <div style="font-weight:600;color:var(--blue-dark);display:flex;align-items:center;gap:4px;font-size:11px;">
              <span class="material-symbols-outlined" style="font-size:14px;">group</span>
              ${p.sasaran || '-'}
            </div>
          </td>
          <td>
            <div style="font-size:11px;color:var(--text);max-width:180px;line-height:1.4;">${p.tujuan || '-'}</div>
          </td>
          <td>
            <div style="font-size:10.5px;color:var(--text-muted);font-style:italic;max-width:160px;line-height:1.3;">${p.rincianBiaya || '-'}</div>
          </td>
          <td style="white-space:nowrap;text-align:right;">
            <strong style="color:var(--green-dark);font-size:12px;">Rp ${estVal.toLocaleString('id-ID')}</strong>
          </td>
          <td>
            <div style="font-weight:600;color:var(--text);display:flex;align-items:center;gap:4px;font-size:11px;">
              <span class="material-symbols-outlined" style="font-size:14px;color:var(--blue);">location_on</span>
              ${p.tempat || '-'}
            </div>
          </td>
          <td style="text-align:center;">
            ${realisasiSelectOrBadge}
          </td>
          <td>
            ${p.deskripsiRealisasi ? `<div style="font-size:11px;color:var(--text);max-width:180px;line-height:1.35;">${p.deskripsiRealisasi}</div>` : '<span style="color:var(--text-muted);font-style:italic;font-size:10.5px;">-</span>'}
          </td>
          <td style="white-space:nowrap;text-align:right;">
            <strong style="color:#1e40af;font-size:12px;">Rp ${realVal.toLocaleString('id-ID')}</strong>
            ${realVal > 0 ? `
              <div style="font-size:10px;margin-top:2px;font-weight:700;color:${diffVal >= 0 ? '#057a55' : '#c81e1e'};">
                ${diffVal >= 0 ? `+Rp ${diffVal.toLocaleString('id-ID')} (Hemat)` : `-Rp ${Math.abs(diffVal).toLocaleString('id-ID')} (Lebih)`}
              </div>
            ` : ''}
          </td>
          ${actionsCell}
        </tr>
      `;
    }).join('');

    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="${isSuper ? 12 : 11}" style="text-align:center;padding:32px;color:var(--text-muted);">
            <span class="material-symbols-outlined" style="font-size:36px;color:var(--border);margin-bottom:6px;">event_busy</span>
            <div style="font-weight:700;font-size:13px;color:var(--text);">Tidak Ada Program Kerja Sesuai Filter</div>
            <div style="font-size:12px;margin-top:2px;">Silakan sesuaikan kata kunci pencarian atau pilihan bidang.</div>
          </td>
        </tr>
      `;
    }

    const pageSubtotalEst = paginatedItems.reduce((acc, c) => acc + (c.estBiaya || 0), 0);
    const pageSubtotalReal = paginatedItems.reduce((acc, c) => acc + (c.realisasiBiaya || 0), 0);
    const totalEstAll = filtered.reduce((acc, c) => acc + (c.estBiaya || 0), 0);
    const totalRealAll = filtered.reduce((acc, c) => acc + (c.realisasiBiaya || 0), 0);

    contentHtml = `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--text-muted);">
          <span>👉 Geser tabel ke samping untuk melihat seluruh 11 kolom format resmi pelaporan LPJ & realisasi RAB 👈</span>
          <span style="font-weight:700;">Halaman ${currentPage} dari ${totalPages} (${totalItems} Total Program)</span>
        </div>
        <div class="proker-table-wrap">
          <table class="proker-table">
            <thead>
              <tr>
                <th style="width:35px;text-align:center;">NO</th>
                <th style="min-width:200px;">KEGIATAN</th>
                <th style="min-width:115px;">WAKTU</th>
                <th style="min-width:130px;">SASARAN/ PESERTA</th>
                <th style="min-width:170px;">TUJUAN KEGIATAN</th>
                <th style="min-width:160px;">RINCIAN BIAYA</th>
                <th style="min-width:115px;text-align:right;">EST. BIAYA</th>
                <th style="min-width:120px;">TEMPAT</th>
                <th style="min-width:140px;text-align:center;">REALISASI PROKER<br/>(TERLAKSANA/BELUM)</th>
                <th style="min-width:170px;">DESKRIPSI REALISASI PROKER</th>
                <th style="min-width:125px;text-align:right;">REALISASI PENGGUNAAN</th>
                ${isSuper ? '<th style="width:115px;text-align:right;">AKSI</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="proker-subtotal-row">
                <td colspan="6" style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text);font-weight:800;">
                  SUB TOTAL (HALAMAN INI):
                </td>
                <td style="text-align:right;padding:8px 10px;color:var(--green-dark);font-size:12px;white-space:nowrap;font-weight:800;">
                  Rp ${pageSubtotalEst.toLocaleString('id-ID')}
                </td>
                <td colspan="3" style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text-muted);font-weight:700;">
                  Realisasi Halaman Ini:
                </td>
                <td style="text-align:right;padding:8px 10px;color:#1e40af;font-size:12px;white-space:nowrap;font-weight:800;">
                  Rp ${pageSubtotalReal.toLocaleString('id-ID')}
                </td>
                ${isSuper ? '<td></td>' : ''}
              </tr>
              <tr style="background:#e0f2fe;font-weight:900;border-top:2px solid #0284c7;">
                <td colspan="6" style="text-align:right;padding:9px 10px;font-size:11.5px;color:#0369a1;">
                  TOTAL KESELURUHAN (${filtered.length} PROGRAM):
                </td>
                <td style="text-align:right;padding:9px 10px;color:#057a55;font-size:12.5px;white-space:nowrap;">
                  Rp ${totalEstAll.toLocaleString('id-ID')}
                </td>
                <td colspan="3" style="text-align:right;padding:9px 10px;font-size:11.5px;color:#0369a1;">
                  Total Realisasi LPJ:
                </td>
                <td style="text-align:right;padding:9px 10px;color:#1e40af;font-size:12.5px;white-space:nowrap;">
                  Rp ${totalRealAll.toLocaleString('id-ID')}
                </td>
                ${isSuper ? '<td></td>' : ''}
              </tr>
            </tfoot>
          </table>
        </div>
        ${paginationHtml}
      </div>
    `;
  } else {
    // Timeline / Semester View (Pinned by Default)
    contentHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="font-size:12.5px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-outlined" style="font-size:17px;color:var(--blue);">view_timeline</span>
            Timeline kronologis agenda kegiatan program kerja tahunan 2026.
          </div>
          <span style="font-size:12px;font-weight:700;color:var(--text-muted);">
            Halaman ${currentPage} dari ${totalPages} (${totalItems} Total)
          </span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${paginatedItems.map((p, idx) => {
      let statusClass = p.status || 'planned';
      let statusLabel = 'Direncanakan';
      if (statusClass === 'done') statusLabel = 'Selesai';
      else if (statusClass === 'ongoing') statusLabel = 'Berlangsung';
      else if (statusClass === 'upcoming') statusLabel = 'Akan Datang';

      const isTerlaksana = p.realisasiStatus === 'terlaksana';
      let realisasiBadge = isTerlaksana ? `
        <span class="proker-realisasi-badge terlaksana" style="font-size:10px;padding:2px 8px;">
          <span class="material-symbols-outlined" style="font-size:12px;">check_circle</span> Terlaksana
        </span>
      ` : `
        <span class="proker-realisasi-badge belum_terlaksana" style="font-size:10px;padding:2px 8px;">
          <span class="material-symbols-outlined" style="font-size:12px;">cancel</span> Belum Terlaksana
        </span>
      `;

      let superButtons = isSuper ? `
              <button type="button" class="btn-proker-lpj" data-id="${p.id}" title="Lapor LPJ & Realisasi Dana">
                <span class="material-symbols-outlined" style="font-size:14px;">assignment_turned_in</span> LPJ
              </button>
              <button type="button" class="btn-proker-edit" data-id="${p.id}" title="Edit Program">
                <span class="material-symbols-outlined" style="font-size:14px;">edit</span> Edit
              </button>
              <button type="button" class="btn-proker-del" data-id="${p.id}" data-title="${p.kegiatan}" title="Hapus Program">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span> Hapus
              </button>
            ` : '';

      return `
              <div class="proker-card-item" data-id="${p.id}">
                <!-- HEADER: NOMOR, PROGRAM, STATUS, DAN CHEVRON TOGGLE -->
                <div class="proker-card-header" role="button" tabindex="0" aria-expanded="false" title="Klik untuk menampilkan / menyembunyikan detail program">
                  <div class="proker-card-title-wrap">
                    <span class="proker-card-num">${p.no || (startIndex + idx + 1)}.</span>
                    <strong class="proker-card-title">${p.kegiatan}</strong>
                  </div>
                  <div class="proker-card-actions">
                    ${realisasiBadge}
                    <button type="button" class="btn-toggle-proker-detail" aria-label="Toggle Detail Program" title="Tampilkan/Sembunyikan Detail">
                      <span class="material-symbols-outlined proker-chevron-icon">expand_more</span>
                    </button>
                  </div>
                </div>

                <!-- DETAIL PANEL: TERSEMBUNYI SECARA DEFAULT DI MOBILE VIEW -->
                <div class="proker-card-detail-panel">
                  <div class="proker-card-meta">
                    <span class="proker-pic-pill">PIC: ${p.penanggungJawab || 'Pengurus PPG'}</span>
                    <span class="proker-meta-item">
                      <span class="material-symbols-outlined" style="font-size:15px;color:#94a3b8;">calendar_today</span>
                      ${p.waktu}
                    </span>
                    <span class="proker-meta-bullet">&bull;</span>
                    <span class="proker-meta-item">
                      <span class="material-symbols-outlined loc-icon" style="font-size:15px;">location_on</span>
                      ${p.tempat}
                    </span>
                    <span class="proker-meta-bullet">&bull;</span>
                    <span class="proker-meta-item">
                      <span class="material-symbols-outlined group-icon" style="font-size:15px;">group</span>
                      ${p.sasaran}
                    </span>
                  </div>

                  <div class="proker-tujuan-box">
                    <strong>Tujuan:</strong> ${p.tujuan}
                  </div>

                  ${p.deskripsiRealisasi ? `
                    <div style="background:#f0fdf4;border-left:3px solid #057a55;padding:8px 12px;font-size:11.5px;color:#065f46;border-radius:4px;margin-top:6px;">
                      <strong>Catatan LPJ:</strong> ${p.deskripsiRealisasi}
                    </div>
                  ` : ''}

                  <div class="proker-card-footer">
                    <div class="proker-rincian">Rincian: <em>${p.rincianBiaya || '-'}</em></div>
                    <div class="proker-footer-right">
                      <div class="proker-est-biaya">
                        Est. RAB: Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}
                        ${p.realisasiBiaya ? ` &bull; <span style="color:#1e40af;">Realisasi: Rp ${(p.realisasiBiaya || 0).toLocaleString('id-ID')}</span>` : ''}
                      </div>
                      ${superButtons ? `<div class="proker-admin-actions">${superButtons}</div>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
        ${paginationHtml}
      </div>
    `;
  }

  openModal('Program Kerja Tahunan PPG Solo Selatan', 'event_note', `
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${bannerNoticeHtml}
      ${statsHtml}
      ${filterHtml}
      ${contentHtml}
    </div>
  `, 'wide');

  // Event Listeners
  const searchInput = document.getElementById('inputProkerSearch');
  if (searchInput) {
    searchInput.focus();
    const val = searchInput.value;
    searchInput.value = '';
    searchInput.value = val;
    searchInput.addEventListener('input', (e) => {
      renderProkerModal(filterBidang, filterStatus, e.target.value, activeTab, 1, false);
    });
  }

  document.getElementById('selectFilterStatus')?.addEventListener('change', (e) => {
    renderProkerModal(filterBidang, e.target.value, searchQuery, activeTab, 1, false);
  });

  document.getElementById('selectFilterBidang')?.addEventListener('change', (e) => {
    renderProkerModal(e.target.value, filterStatus, searchQuery, activeTab, 1, false);
  });

  document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    exportProkerCsv();
  });

  document.getElementById('btnPrintTable')?.addEventListener('click', () => {
    printProkerTable();
  });

  document.getElementById('tabViewTable')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'table', currentPage, false);
  });

  document.getElementById('tabViewTimeline')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'timeline', currentPage, false);
  });

  // Pagination click listeners
  modalBody.querySelectorAll('.proker-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pNum = parseInt(btn.dataset.page);
      if (pNum && pNum >= 1 && pNum <= totalPages && pNum !== currentPage) {
        renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab, pNum, false);
      }
    });
  });

  document.getElementById('btnTambahProkerBaru')?.addEventListener('click', () => {
    renderAddEditProkerForm(null);
  });

  // Aksi Cepat Pergantian Realisasi Proker (Terlaksana / Belum Terlaksana) Langsung Tersimpan
  modalBody.querySelectorAll('.proker-realisasi-quick-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const pId = select.dataset.id;
      const newStatus = select.value;
      await updateRealisasiProker(pId, { realisasiStatus: newStatus });
      showToast(`Realisasi program diubah menjadi "${newStatus === 'terlaksana' ? 'Terlaksana' : 'Belum Terlaksana'}"`, 'info');
      renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab, currentPage, false);
      renderInlineProkerWidget();
      appHooks.renderUserProfile();
    });
  });

  // Tombol Pelaporan LPJ & Realisasi Dana Khusus
  modalBody.querySelectorAll('.btn-proker-lpj').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pId = btn.dataset.id;
      const prokerItem = prokerList.find(p => p.id === pId);
      if (prokerItem) renderLaporRealisasiModal(prokerItem);
    });
  });

  // Accordion Dropdown: Tampilkan / Sembunyikan Detil Program Kerja
  modalBody.querySelectorAll('.proker-card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      // Abaikan jika user mengklik tombol edit, hapus, atau LPJ
      if (e.target.closest('.btn-proker-edit') || e.target.closest('.btn-proker-del') || e.target.closest('.btn-proker-lpj')) {
        return;
      }
      const card = header.closest('.proker-card-item');
      if (!card) return;

      if (window.innerWidth <= 768) {
        card.classList.toggle('is-expanded');
        const isExp = card.classList.contains('is-expanded');
        header.setAttribute('aria-expanded', isExp ? 'true' : 'false');
      } else {
        card.classList.toggle('is-collapsed');
        const isCol = card.classList.contains('is-collapsed');
        header.setAttribute('aria-expanded', isCol ? 'false' : 'true');
      }
    });

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });

  modalBody.querySelectorAll('.btn-proker-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pId = btn.dataset.id;
      const prokerItem = prokerList.find(p => p.id === pId);
      if (prokerItem) renderAddEditProkerForm(prokerItem);
    });
  });

  modalBody.querySelectorAll('.btn-proker-del').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pId = btn.dataset.id;
      const pTitle = btn.dataset.title;

      showConfirmModal({
        title: 'Hapus Program Kerja',
        message: `Apakah Anda yakin ingin menghapus program "${pTitle}" dari agenda tahunan?`,
        icon: 'delete_forever',
        iconBg: 'var(--red-light)',
        iconColor: 'var(--red)',
        confirmText: 'Ya, Hapus',
        confirmBtnColor: 'var(--red)',
        onConfirm: async () => {
          await deleteProker(pId);
          showToast(`Program kerja "${pTitle}" berhasil dihapus`, 'success');
          renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab, currentPage, false);
          renderInlineProkerWidget();
          appHooks.renderUserProfile();
        }
      });
    });
  });
}

export function renderLaporRealisasiModal(p) {
  if (!p) return;
  const isTerlaksana = p.realisasiStatus === 'terlaksana';
  const estBiaya = p.estBiaya || 0;
  const initialRealBiaya = p.realisasiBiaya !== undefined && p.realisasiBiaya !== null ? p.realisasiBiaya : (isTerlaksana ? estBiaya : 0);
  const initialTgl = p.tglRealisasi || new Date().toISOString().slice(0, 10);
  const deskripsi = p.deskripsiRealisasi || '';

  openModal(`Pelaporan Realisasi & LPJ: ${p.kegiatan}`, 'assignment_turned_in', `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <!-- Ringkasan Info Proker -->
      <div style="background:var(--bg);padding:14px;border:1px solid var(--border);border-radius:10px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-size:11px;font-weight:700;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:4px;">
              BIDANG: ${(p.penanggungJawab || 'Pengurus PPG').toUpperCase()}
            </span>
            <h4 style="margin:6px 0 2px;font-size:15px;color:var(--text);font-weight:800;">${p.kegiatan}</h4>
          </div>
          <div style="text-align:right;">
            <span style="font-size:11px;color:var(--text-muted);display:block;">Estimasi Biaya (RAB):</span>
            <strong style="font-size:15px;color:var(--green-dark);">Rp ${estBiaya.toLocaleString('id-ID')}</strong>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:8px;margin-top:4px;">
          <span>📅 Waktu: <strong style="color:var(--text);">${p.waktu || '-'}</strong></span>
          <span>📍 Tempat: <strong style="color:var(--text);">${p.tempat || '-'}</strong></span>
          <span>👥 Sasaran: <strong style="color:var(--text);">${p.sasaran || '-'}</strong></span>
        </div>
      </div>

      <form id="formLaporLpj" style="display:flex;flex-direction:column;gap:14px;">
        <!-- Status Realisasi Proker -->
        <div style="background:var(--surface);padding:14px;border:1.5px solid var(--border);border-radius:10px;">
          <label style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px;display:block;">
            STATUS REALISASI KEGIATAN *
          </label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;border:1.5px solid ${isTerlaksana ? '#057a55' : 'var(--border)'};background:${isTerlaksana ? '#f0fdf4' : 'var(--bg)'};cursor:pointer;font-weight:700;font-size:13px;color:${isTerlaksana ? '#057a55' : 'var(--text)'};">
              <input type="radio" name="radioStatusRealisasi" value="terlaksana" ${isTerlaksana ? 'checked' : ''} style="accent-color:#057a55;" />
              <span class="material-symbols-outlined" style="font-size:18px;">check_circle</span>
              Terlaksana
            </label>
            <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;border:1.5px solid ${!isTerlaksana ? '#c81e1e' : 'var(--border)'};background:${!isTerlaksana ? '#fef2f2' : 'var(--bg)'};cursor:pointer;font-weight:700;font-size:13px;color:${!isTerlaksana ? '#c81e1e' : 'var(--text)'};">
              <input type="radio" name="radioStatusRealisasi" value="belum_terlaksana" ${!isTerlaksana ? 'checked' : ''} style="accent-color:#c81e1e;" />
              <span class="material-symbols-outlined" style="font-size:18px;">cancel</span>
              Belum Terlaksana
            </label>
          </div>
        </div>

        <!-- Realisasi Penggunaan Dana & Tanggal Pelaksanaan -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">
              REALISASI PENGGUNAAN DANA (RP) *
            </label>
            <input type="number" id="lpjInputBiaya" value="${initialRealBiaya}" min="0" step="1000" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;font-weight:800;color:var(--blue-dark);background:var(--surface);" />
            <div id="lpjDiffCalc" style="font-size:11.5px;margin-top:4px;font-weight:700;"></div>
          </div>
          <div class="form-group">
            <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">
              TANGGAL REALISASI / PELAPORAN *
            </label>
            <input type="date" id="lpjInputTanggal" value="${initialTgl}" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);" />
          </div>
        </div>

        <!-- Deskripsi Realisasi Proker / Ringkasan LPJ -->
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">
            DESKRIPSI REALISASI PROKER & RINGKASAN LPJ
          </label>
          <textarea id="lpjInputDeskripsi" rows="4" placeholder="Uraikan laporan hasil pelaksanaan kegiatan, jumlah peserta hadir, evaluasi/kendala, atau catatan pertanggungjawaban dana..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.5;resize:vertical;">${deskripsi}</textarea>
        </div>

        <!-- Sticky Footer -->
        <div class="modal-sticky-footer">
          <button type="button" class="btn-sticky-back btn-back-to-proker-modal" title="Kembali ke Daftar Program">
            <span class="material-symbols-outlined">arrow_back</span>
            <span class="btn-text">Kembali</span>
          </button>
          <button type="submit" class="btn-sticky-save" title="Simpan Laporan LPJ">
            <span class="material-symbols-outlined">save</span>
            <span class="btn-text">Simpan Laporan LPJ</span>
          </button>
        </div>
      </form>
    </div>
  `);

  // Diff calculator logic
  const lpjInputBiaya = document.getElementById('lpjInputBiaya');
  const lpjDiffCalc = document.getElementById('lpjDiffCalc');

  function updateDiff() {
    const val = parseFloat(lpjInputBiaya?.value) || 0;
    const selisih = estBiaya - val;
    if (lpjDiffCalc) {
      if (val === 0 && estBiaya === 0) {
        lpjDiffCalc.innerHTML = '<span style="color:var(--text-muted);">Sesuai Estimasi Rp 0</span>';
      } else if (selisih > 0) {
        lpjDiffCalc.innerHTML = `<span style="color:#057a55;">✓ Hemat Rp ${selisih.toLocaleString('id-ID')} dari RAB Awal</span>`;
      } else if (selisih < 0) {
        lpjDiffCalc.innerHTML = `<span style="color:#c81e1e;">⚠ Over Budget Rp ${Math.abs(selisih).toLocaleString('id-ID')} dari RAB Awal</span>`;
      } else {
        lpjDiffCalc.innerHTML = `<span style="color:#2563eb;">✓ Tepat 100% Sesuai Estimasi RAB</span>`;
      }
    }
  }

  lpjInputBiaya?.addEventListener('input', updateDiff);
  updateDiff();

  // Radio button color change
  const radioLabels = modalBody.querySelectorAll('input[name="radioStatusRealisasi"]');
  radioLabels.forEach(r => {
    r.addEventListener('change', () => {
      const selected = document.querySelector('input[name="radioStatusRealisasi"]:checked')?.value;
      if (selected === 'terlaksana' && parseFloat(lpjInputBiaya.value) === 0 && estBiaya > 0) {
        lpjInputBiaya.value = estBiaya;
        updateDiff();
      }
    });
  });

  document.querySelector('.btn-back-to-proker-modal')?.addEventListener('click', () => {
    renderProkerModal();
  });

  document.getElementById('formLaporLpj')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const realStatus = document.querySelector('input[name="radioStatusRealisasi"]:checked')?.value || 'belum_terlaksana';
    const realBiaya = parseFloat(document.getElementById('lpjInputBiaya')?.value) || 0;
    const tgl = document.getElementById('lpjInputTanggal')?.value;
    const deskripsiText = document.getElementById('lpjInputDeskripsi')?.value.trim();

    await updateRealisasiProker(p.id, {
      realisasiStatus: realStatus,
      realisasiBiaya: realBiaya,
      tglRealisasi: tgl,
      deskripsiRealisasi: deskripsiText
    });

    showToast(`Laporan Realisasi & LPJ "${p.kegiatan}" berhasil disimpan!`, 'success');
    renderProkerModal();
    renderInlineProkerWidget();
    appHooks.renderUserProfile();
  });
}

export async function renderAddEditProkerForm(p = null) {
  const isEdit = !!p;
  const modalTitleText = isEdit ? `Edit Program Kerja: ${p.kegiatan}` : 'Tambah Program Kerja Baru';
  const prokerList = getProkerList();
  const autoNo = isEdit ? p.no : (prokerList.length > 0 ? Math.max(...prokerList.map(item => item.no || 0)) + 1 : 1);

  // Opsi Bidang PIC
  const picOptions = DAFTAR_BIDANG_PPG.map(b => {
    const isSelected = isEdit ? (p.penanggungJawab === b || (p.penanggungJawab && p.penanggungJawab.includes(b))) : false;
    return `<option value="${b}" ${isSelected ? 'selected' : ''}>Bidang ${b}</option>`;
  }).join('');

  openModal(modalTitleText, isEdit ? 'edit_note' : 'add_task', `
    ${!isEdit ? `
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px;background:var(--bg);padding:10px;border-radius:8px;border:1px dashed var(--border);">
      <span style="font-size:11px;color:var(--text-muted);margin-right:auto;display:flex;align-items:center;">Punya banyak data? Gunakan format Excel (CSV).</span>
      <button type="button" id="btnDownloadFormatExcel" style="padding:6px 12px;background:var(--surface);border:1px solid var(--border);color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:14px;">download</span> Unduh Format
      </button>
      <input type="file" id="inputImportCsv" accept=".csv" style="display:none;" />
      <button type="button" id="btnTriggerImport" style="padding:6px 12px;background:var(--green-pastel);border:1px solid var(--green);color:var(--green-dark);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:14px;">upload</span> Import Data
      </button>
    </div>
    ` : ''}
    <form id="formAddEditProker" style="display:flex;flex-direction:column;gap:14px;">
      <input type="hidden" id="prokerInputNo" value="${autoNo}" />

      <!-- 1. PIC Bidang Penanggung Jawab di Atas -->
      <div style="background:var(--bg);padding:12px 14px;border:1px solid var(--border);border-radius:10px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--blue-dark);margin-bottom:6px;display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">badge</span>
          BIDANG PENANGGUNG JAWAB (PIC) *
        </label>
        <select id="prokerInputPic" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-weight:700;background:var(--surface);color:var(--text);outline:none;">
          <option value="">-- Pilih Salah Satu dari 14 Bidang Pengurus PPG --</option>
          ${picOptions}
        </select>
      </div>

      <!-- 2. Nama / Judul Kegiatan -->
      <div class="form-group">
        <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">NAMA / JUDUL KEGIATAN *</label>
        <input type="text" id="prokerInputKegiatan" value="${isEdit ? p.kegiatan : ''}" placeholder="Contoh: Halaqah Akbar & Pembekalan Remaja" required style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;" />
      </div>

      <!-- 3. Fitur Date Range Picker Booking Style -->
      <div style="background:#f0f9ff;padding:14px;border:1.5px solid #bae6fd;border-radius:10px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--blue-dark);margin-bottom:6px;display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">date_range</span>
          WAKTU PELAKSANAAN (PILIH TANGGAL / RENTANG WAKTU) *
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
          <div>
            <span style="font-size:11px;font-weight:700;color:var(--blue);display:block;margin-bottom:2px;">Tanggal Mulai</span>
            <input type="date" id="prokerPickerStart" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12.5px;background:var(--surface);" />
          </div>
          <div>
            <span style="font-size:11px;font-weight:700;color:var(--blue);display:block;margin-bottom:2px;">Tanggal Selesai</span>
            <input type="date" id="prokerPickerEnd" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12.5px;background:var(--surface);" />
          </div>
        </div>
        <div>
          <span style="font-size:11px;font-weight:700;color:var(--blue-dark);display:block;margin-bottom:2px;">Format Teks Waktu (Otomatis Terisi & Bisa Diedit):</span>
          <input type="text" id="prokerInputWaktu" value="${isEdit ? p.waktu : ''}" placeholder="Contoh: September 2026 atau 15 – 16 Oktober 2026" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;font-weight:700;color:var(--blue-dark);background:var(--surface);" />
        </div>
      </div>

      <!-- 4. Tempat Pelaksanaan & Sasaran -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">TEMPAT PELAKSANAAN *</label>
          <input type="text" id="prokerInputTempat" value="${isEdit ? p.tempat : ''}" placeholder="Contoh: Aula Gedung PPG Solo Selatan" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;" />
        </div>
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">SASARAN / PESERTA *</label>
          <input type="text" id="prokerInputSasaran" value="${isEdit ? p.sasaran : ''}" placeholder="Contoh: Generus Remaja & Pra-Nikah" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;" />
        </div>
      </div>

      <!-- 5. Status & Estimasi Anggaran -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">STATUS KEGIATAN</label>
          <select id="prokerInputStatus" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);">
            <option value="planned" ${isEdit && p.status === 'planned' ? 'selected' : ''}>🔵 Direncanakan</option>
            <option value="upcoming" ${isEdit && p.status === 'upcoming' ? 'selected' : ''}>🟡 Akan Datang</option>
            <option value="ongoing" ${isEdit && p.status === 'ongoing' ? 'selected' : ''}>🟢 Sedang Berlangsung</option>
            <option value="done" ${isEdit && p.status === 'done' ? 'selected' : ''}>⚪ Selesai</option>
          </select>
        </div>
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">EST. TOTAL BIAYA (RP) *</label>
          <input type="number" id="prokerInputEstBiaya" value="${isEdit ? (p.estBiaya || 0) : ''}" placeholder="0" min="0" step="50000" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-weight:800;color:var(--green-dark);" />
        </div>
      </div>

      <!-- 6. Kotak Isian Lebih Besar: Tujuan Kegiatan -->
      <div class="form-group">
        <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">TUJUAN KEGIATAN *</label>
        <textarea id="prokerInputTujuan" rows="3" placeholder="Uraikan maksud, tujuan, dan target ketercapaian kegiatan secara jelas..." required style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.5;resize:vertical;">${isEdit ? p.tujuan : ''}</textarea>
      </div>

      <!-- 7. Kotak Isian Lebih Besar: Rincian Biaya -->
      <div class="form-group">
        <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">RINCIAN KOMPONEN BIAYA</label>
        <textarea id="prokerInputRincianBiaya" rows="3" placeholder="Contoh: Konsumsi (100 org x Rp 25.000): Rp 2.500.000, Sewa Aula & Sound System: Rp 1.500.000, Modul & Hadiah: Rp 1.000.000" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.5;resize:vertical;">${isEdit ? (p.rincianBiaya || '') : ''}</textarea>
      </div>

      <!-- 8. Realisasi Proker & Pelaporan Penggunaan Dana (LPJ) -->
      <div style="background:#f8fafc;padding:14px;border:1.5px solid #cbd5e1;border-radius:10px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--blue-dark);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;color:#0e7039;">assignment_turned_in</span>
          REALISASI PROGRAM KERJA & PENGGUNAAN DANA (LPJ)
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;">
          <div class="form-group">
            <label style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:3px;display:block;">STATUS REALISASI</label>
            <select id="prokerInputRealisasiStatus" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface);font-weight:700;">
              <option value="belum_terlaksana" ${isEdit && p.realisasiStatus === 'belum_terlaksana' ? 'selected' : ''}>🔴 Belum Terlaksana</option>
              <option value="terlaksana" ${isEdit && p.realisasiStatus === 'terlaksana' ? 'selected' : ''}>🟢 Terlaksana</option>
            </select>
          </div>
          <div class="form-group">
            <label style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:3px;display:block;">REALISASI PENGGUNAAN DANA (RP)</label>
            <input type="number" id="prokerInputRealisasiBiaya" value="${isEdit && p.realisasiBiaya !== undefined ? p.realisasiBiaya : ''}" placeholder="0" min="0" step="1000" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-weight:800;color:#0e7039;background:var(--surface);" />
          </div>
        </div>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:3px;display:block;">TANGGAL REALISASI / SELESAI</label>
          <input type="date" id="prokerInputTglRealisasi" value="${isEdit && p.tglRealisasi ? p.tglRealisasi : ''}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:12.5px;background:var(--surface);" />
        </div>
        <div class="form-group">
          <label style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:3px;display:block;">DESKRIPSI REALISASI PROKER (CATATAN LPJ)</label>
          <textarea id="prokerInputDeskripsiRealisasi" rows="3" placeholder="Catatan evaluasi keterlaksanaan, hasil kegiatan, kendala, atau pertanggungjawaban dana..." style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.5;resize:vertical;">${isEdit ? (p.deskripsiRealisasi || '') : ''}</textarea>
        </div>
      </div>

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" class="btn-sticky-back btn-cancel-proker-form" title="Kembali ke Tabel">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Tabel</span>
        </button>
        <button type="submit" class="btn-sticky-save" title="${isEdit ? 'Simpan Perubahan' : 'Simpan Program'}">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">${isEdit ? 'Simpan Perubahan' : 'Simpan Program'}</span>
        </button>
      </div>
    </form>
  `);

  // Auto Format Date Picker
  const pStart = document.getElementById('prokerPickerStart');
  const pEnd = document.getElementById('prokerPickerEnd');
  const pWaktu = document.getElementById('prokerInputWaktu');

  function syncDateRangeText() {
    if (pStart.value || pEnd.value) {
      // If only start selected, default end to same date
      const sVal = pStart.value;
      const eVal = pEnd.value || sVal;
      const formatted = formatDateRange(sVal, eVal);
      if (formatted) pWaktu.value = formatted;
    }
  }

  pStart?.addEventListener('change', () => {
    if (!pEnd.value && pStart.value) {
      pEnd.value = pStart.value;
    }
    syncDateRangeText();
  });

  pEnd?.addEventListener('change', () => {
    if (!pStart.value && pEnd.value) {
      pStart.value = pEnd.value;
    }
    syncDateRangeText();
  });

  document.querySelector('.btn-cancel-proker-form')?.addEventListener('click', () => {
    renderProkerModal();
  });

  if (!isEdit) {
    document.getElementById('btnDownloadFormatExcel')?.addEventListener('click', () => {
      const csvHeader = 'KEGIATAN;WAKTU;SASARAN/PESERTA;TUJUAN KEGIATAN;RINCIAN BIAYA;EST. BIAYA (RP);TEMPAT PELAKSANAAN;PENANGGUNG JAWAB (PIC)\n';
      const sampleRow = '"Rapat Tahunan";"Agustus 2026";"Pengurus";"Konsolidasi";"Konsumsi dll";150000;"Aula PPG";"Ketua"\n';
      const blob = new Blob(['\uFEFF' + csvHeader + sampleRow], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Format_Import_Program_Kerja.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    const fileInput = document.getElementById('inputImportCsv');
    document.getElementById('btnTriggerImport')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 1) {
          let count = 0;
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(';');
            if (cols.length >= 8) {
              const clean = (str) => str ? str.replace(/(^"|"$)/g, '').trim() : '';
              await addProker({
                kegiatan: clean(cols[0]),
                waktu: clean(cols[1]),
                sasaran: clean(cols[2]),
                tujuan: clean(cols[3]),
                rincianBiaya: clean(cols[4]),
                estBiaya: parseInt(clean(cols[5])) || 0,
                tempat: clean(cols[6]),
                penanggungJawab: clean(cols[7]),
                status: 'planned',
                targetWilayah: 'Daerah Solo Selatan'
              });
              count++;
            }
          }
          alert('Berhasil mengimpor ' + count + ' program kerja!');
          renderProkerModal();
          appHooks.renderUserProfile();
        } else {
          alert('Format CSV kosong atau tidak valid.');
        }
      };
      reader.readAsText(file);
    });
  }

  document.getElementById('formAddEditProker')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prokerDataPayload = {
      no: document.getElementById('prokerInputNo').value,
      kegiatan: document.getElementById('prokerInputKegiatan').value.trim(),
      waktu: document.getElementById('prokerInputWaktu').value.trim(),
      tempat: document.getElementById('prokerInputTempat').value.trim(),
      sasaran: document.getElementById('prokerInputSasaran').value.trim(),
      tujuan: document.getElementById('prokerInputTujuan').value.trim(),
      rincianBiaya: document.getElementById('prokerInputRincianBiaya').value.trim(),
      estBiaya: document.getElementById('prokerInputEstBiaya').value,
      status: document.getElementById('prokerInputStatus').value,
      penanggungJawab: document.getElementById('prokerInputPic').value.trim(),
      targetWilayah: 'Daerah Solo Selatan',
      realisasiStatus: document.getElementById('prokerInputRealisasiStatus')?.value || 'belum_terlaksana',
      realisasiBiaya: parseFloat(document.getElementById('prokerInputRealisasiBiaya')?.value) || 0,
      tglRealisasi: document.getElementById('prokerInputTglRealisasi')?.value || '',
      deskripsiRealisasi: document.getElementById('prokerInputDeskripsiRealisasi')?.value.trim() || ''
    };

    if (isEdit) {
      await updateProker(p.id, prokerDataPayload);
      showToast(`Program Kerja "${prokerDataPayload.kegiatan}" berhasil diperbarui!`, 'success');
    } else {
      await addProker(prokerDataPayload);
      showToast(`Program Kerja "${prokerDataPayload.kegiatan}" berhasil ditambahkan!`, 'success');
    }

    renderProkerModal();
    renderInlineProkerWidget();
    appHooks.renderUserProfile();
  });
}

/* ═══════════════════════════════════════════════════════════════
   INLINE PROGRAM KERJA WIDGET (DASHBOARD)
   Komponen agenda bulanan di dashboard admin serupa landing page
   ═══════════════════════════════════════════════════════════════ */

let currentDashProkerFilter = 'ongoing'; // Default: Program Kerja Berjalan
let currentDashProkerPage = 1;
const dashProkerItemsPerPage = 5;

const dashShortMonthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const dashFullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getProkerStatusLabel(status) {
  if (status === 'done' || status === 'selesai') return 'Selesai';
  if (status === 'ongoing' || status === 'berjalan' || status === 'sedang_berlangsung') return 'Berjalan';
  if (status === 'upcoming' || status === 'akan_datang') return 'Akan Datang';
  if (status === 'planned' || status === 'direncanakan') return 'Direncanakan';
  return 'Direncanakan';
}

function getProkerStatusClass(status) {
  if (status === 'done' || status === 'selesai') return 'done';
  if (status === 'ongoing' || status === 'berjalan' || status === 'sedang_berlangsung') return 'ongoing';
  if (status === 'upcoming' || status === 'akan_datang') return 'upcoming';
  if (status === 'planned' || status === 'direncanakan') return 'planned';
  return 'planned';
}

export function renderInlineProkerWidget() {
  const listEl = document.getElementById('dashProkerList');
  if (!listEl) return;

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYearVal = now.getFullYear();

  const monthEl = document.getElementById('dashProkerMonth');
  const yearEl = document.getElementById('dashProkerYear');
  const headerTitleEl = document.getElementById('dashProkerHeaderTitle');
  const paginationContainer = document.getElementById('dashProkerPagination');

  if (monthEl) monthEl.textContent = dashShortMonthNames[currentMonthIdx];
  if (yearEl) yearEl.textContent = currentYearVal;
  if (headerTitleEl) headerTitleEl.textContent = `${dashFullMonthNames[currentMonthIdx]} ${currentYearVal}`;

  // Update visual state tombol filter
  const filterBtns = document.querySelectorAll('.dash-proker-filter-btn');
  filterBtns.forEach(btn => {
    const f = btn.dataset.filter;
    if (f === currentDashProkerFilter) {
      if (f === 'ongoing') {
        btn.className = 'dash-proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-emerald-300 bg-emerald-500 text-white font-bold shadow-md ring-2 ring-emerald-300/40 cursor-pointer transition-all duration-200';
      } else if (f === 'upcoming') {
        btn.className = 'dash-proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-amber-300 bg-amber-500 text-white font-bold shadow-md ring-2 ring-amber-300/40 cursor-pointer transition-all duration-200';
      } else if (f === 'planned') {
        btn.className = 'dash-proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-blue-300 bg-blue-500 text-white font-bold shadow-md ring-2 ring-blue-300/40 cursor-pointer transition-all duration-200';
      } else if (f === 'done') {
        btn.className = 'dash-proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-300 bg-slate-500 text-white font-bold shadow-md ring-2 ring-slate-300/40 cursor-pointer transition-all duration-200';
      } else {
        btn.className = 'dash-proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-white bg-white text-brandBlue font-bold shadow-md ring-2 ring-white/40 cursor-pointer transition-all duration-200';
      }
    } else {
      btn.className = 'dash-proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white/90 font-medium cursor-pointer transition-all duration-200';
    }
  });

  const allProker = getProkerList();
  let filteredData = allProker;
  if (currentDashProkerFilter === 'ongoing') {
    filteredData = allProker.filter(p => p.status === 'ongoing' || p.status === 'berjalan' || p.status === 'sedang_berlangsung');
  } else if (currentDashProkerFilter === 'upcoming') {
    filteredData = allProker.filter(p => p.status === 'upcoming' || p.status === 'akan_datang');
  } else if (currentDashProkerFilter === 'planned') {
    filteredData = allProker.filter(p => p.status === 'planned' || p.status === 'direncanakan');
  } else if (currentDashProkerFilter === 'done') {
    filteredData = allProker.filter(p => p.status === 'done' || p.status === 'selesai');
  }

  if (filteredData.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-12 text-slate-500 dark:text-slate-400">
        <span class="material-symbols-outlined text-4xl mb-2 text-slate-400">event_busy</span>
        <p class="font-medium text-sm">Tidak ada program kerja dengan status ini.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(filteredData.length / dashProkerItemsPerPage);
  if (currentDashProkerPage > totalPages) currentDashProkerPage = totalPages;
  if (currentDashProkerPage < 1) currentDashProkerPage = 1;

  const startIndex = (currentDashProkerPage - 1) * dashProkerItemsPerPage;
  const endIndex = startIndex + dashProkerItemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  listEl.innerHTML = currentData.map((item, index) => {
    const globalIndex = startIndex + index + 1;
    const rawStatus = item.status || 'planned';
    const statusClass = getProkerStatusClass(rawStatus);
    const statusLabel = getProkerStatusLabel(rawStatus);
    const isTerlaksana = item.realisasiStatus === 'terlaksana';
    const realisasiBadge = isTerlaksana ? `
      <span class="proker-realisasi-badge terlaksana" style="font-size:10px;padding:2px 7px;">
        Terlaksana
      </span>
    ` : '';
    const tempatHtml = item.tempat ? `
      <span class="proker-meta-sep">&bull;</span>
      <span class="proker-meta-item">
        <span class="material-symbols-outlined ms-proker-ic">location_on</span>
        <span>${item.tempat}</span>
      </span>
    ` : '';
    const tujuanHtml = item.tujuan ? `
      <div class="proker-tujuan-box">
        <strong>Tujuan:</strong> ${item.tujuan}
      </div>
    ` : '';

    return `
      <div class="proker-item group/proker" data-expanded="false">
        <div class="proker-dot ${statusClass}"></div>
        <div class="proker-content">
          <div class="proker-row-header cursor-pointer md:cursor-default flex items-center justify-between" onclick="if(window.innerWidth < 768) { this.closest('.proker-item').dataset.expanded = this.closest('.proker-item').dataset.expanded === 'true' ? 'false' : 'true'; }">
            <div class="proker-title flex-1 pr-2">
              <span class="proker-num">${item.no || globalIndex}.</span> ${item.kegiatan}
            </div>
            <div class="flex items-center gap-2">
              ${realisasiBadge}
              <span class="proker-status-badge ${statusClass}">
                <span class="dot ${statusClass}"></span>
                <span>${statusLabel}</span>
              </span>
              <span class="material-symbols-outlined text-slate-400 md:hidden transition-transform duration-200 chevron-icon" style="font-size: 20px;">
                chevron_right
              </span>
            </div>
          </div>
          <div class="proker-details hidden md:block mt-2.5">
            <div class="proker-meta">
              <span class="proker-meta-item">
                <span class="material-symbols-outlined ms-proker-ic">calendar_today</span>
                <span>${item.waktu}</span>
              </span>
              ${tempatHtml}
              <span class="proker-meta-sep">&bull;</span>
              <span class="proker-meta-item">
                <span class="material-symbols-outlined ms-proker-ic">group</span>
                <span>${item.sasaran}</span>
              </span>
              ${(item.estBiaya || 0) > 0 ? `
                <span class="proker-meta-sep">&bull;</span>
                <span class="proker-meta-item" style="color:#057a55;font-weight:700;">
                  <span class="material-symbols-outlined ms-proker-ic" style="color:#057a55;">payments</span>
                  <span>RAB: Rp ${(item.estBiaya || 0).toLocaleString('id-ID')}</span>
                </span>
              ` : ''}
            </div>
            ${tujuanHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (paginationContainer) {
    if (totalPages > 1) {
      let dotsHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        dotsHtml += `<button type="button" class="px-3 py-1 text-xs font-bold rounded-lg transition-all dash-page-dot ${i === currentDashProkerPage ? 'bg-brandBlue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}" data-page="${i}" aria-label="Halaman ${i}">${i}</button>`;
      }
      paginationContainer.innerHTML = `
        <button type="button" class="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center dash-page-nav prev" ${currentDashProkerPage === 1 ? 'disabled' : ''} aria-label="Sebelumnya"><span class="material-symbols-outlined">chevron_left</span></button>
        <div class="page-dots flex items-center gap-1.5">${dotsHtml}</div>
        <button type="button" class="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center dash-page-nav next" ${currentDashProkerPage === totalPages ? 'disabled' : ''} aria-label="Berikutnya"><span class="material-symbols-outlined">chevron_right</span></button>
      `;

      paginationContainer.querySelectorAll('.dash-page-dot').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentDashProkerPage = parseInt(e.target.dataset.page);
          renderInlineProkerWidget();
        });
      });
      const prevBtn = paginationContainer.querySelector('.prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentDashProkerPage > 1) {
            currentDashProkerPage--;
            renderInlineProkerWidget();
          }
        });
      }
      const nextBtn = paginationContainer.querySelector('.next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentDashProkerPage < totalPages) {
            currentDashProkerPage++;
            renderInlineProkerWidget();
          }
        });
      }
    } else {
      paginationContainer.innerHTML = '';
    }
  }
}

export function initInlineProkerWidget() {
  const filterBar = document.getElementById('dashProkerFilterBar');
  if (filterBar && !filterBar.dataset.bound) {
    filterBar.dataset.bound = 'true';
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.dash-proker-filter-btn');
      if (!btn) return;
      const filterVal = btn.dataset.filter;
      currentDashProkerFilter = (currentDashProkerFilter === filterVal) ? 'all' : filterVal;
      currentDashProkerPage = 1;
      renderInlineProkerWidget();
    });
  }

  const btnKelola = document.getElementById('btnKelolaProkerDashboard');
  if (btnKelola && !btnKelola.dataset.bound) {
    btnKelola.dataset.bound = 'true';
    btnKelola.addEventListener('click', () => {
      renderProkerModal();
    });
  }

  renderInlineProkerWidget();
}