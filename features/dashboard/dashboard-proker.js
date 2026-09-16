/* ═══════════════════════════════════════════════════════════════
   dashboard-proker.js — Program Kerja Tahunan PPG Solo Selatan
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  getProkerList,
  addProker,
  updateProker,
  deleteProker,
  getProkerStats
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js';

let appHooks = {
  renderUserProfile: () => {}
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
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "NO;KEGIATAN;WAKTU;SASARAN/PESERTA;TUJUAN KEGIATAN;RINCIAN BIAYA;EST. BIAYA (RP);TEMPAT PELAKSANAAN;STATUS;PENANGGUNG JAWAB (PIC)\n";

  // Group by PIC
  const grouped = prokerList.reduce((acc, curr) => {
    const pic = curr.penanggungJawab || 'Tanpa Bidang';
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  Object.keys(grouped).sort().forEach(pic => {
    // Add Header Row for PIC
    csvContent += `\n"--- BIDANG: ${pic.toUpperCase()} ---";;;;;;;;;\n`;
    grouped[pic].forEach((p, idx) => {
      const no = p.no || (idx + 1);
      const kegiatan = `"${(p.kegiatan || '').replace(/"/g, '""')}"`;
      const waktu = `"${(p.waktu || '').replace(/"/g, '""')}"`;
      const sasaran = `"${(p.sasaran || '').replace(/"/g, '""')}"`;
      const tujuan = `"${(p.tujuan || '').replace(/"/g, '""')}"`;
      const rincianBiaya = `"${(p.rincianBiaya || '').replace(/"/g, '""')}"`;
      const estBiaya = p.estBiaya || 0;
      const tempat = `"${(p.tempat || '').replace(/"/g, '""')}"`;
      const status = p.status || 'planned';
      const picField = `"${(p.penanggungJawab || '').replace(/"/g, '""')}"`;

      csvContent += `${no};${kegiatan};${waktu};${sasaran};${tujuan};${rincianBiaya};${estBiaya};${tempat};${status};${picField}\n`;
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Program_Kerja_Tahunan_PPG_Solo_Selatan_2026_${new Date().toISOString().slice(0, 10)}.csv`);
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

  let rowsHtml = '';
  Object.keys(grouped).sort().forEach(pic => {
    rowsHtml += `
      <tr style="background:#e2e8f0;">
        <td colspan="9" style="padding:10px 8px;border:1px solid var(--border);font-weight:bold;font-size:12px;color:var(--text);">
          BIDANG: ${pic.toUpperCase()}
        </td>
      </tr>
    `;
    grouped[pic].forEach((p, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;padding:8px;border:1px solid var(--border);font-weight:bold;">${p.no || (idx + 1)}</td>
          <td style="padding:8px;border:1px solid var(--border);"><strong>${p.kegiatan}</strong></td>
          <td style="padding:8px;border:1px solid var(--border);white-space:nowrap;">${p.waktu}</td>
          <td style="padding:8px;border:1px solid var(--border);">${p.sasaran}</td>
          <td style="padding:8px;border:1px solid var(--border);font-size:11px;">${p.tujuan}</td>
          <td style="padding:8px;border:1px solid var(--border);font-size:10.5px;font-style:italic;">${p.rincianBiaya || '-'}</td>
          <td style="padding:8px;border:1px solid var(--border);text-align:right;font-weight:bold;color:var(--green-dark);">Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}</td>
          <td style="padding:8px;border:1px solid var(--border);">${p.tempat}</td>
          <td style="padding:8px;border:1px solid var(--border);text-align:center;font-weight:bold;font-size:10px;">${(p.status || '').toUpperCase()}</td>
        </tr>
      `;
    });
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Program Kerja Tahunan PPG Solo Selatan 2026</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color:var(--text); }
        h2 { margin: 0 0 4px 0; color: #1a56c4; font-size: 18px; }
        p { margin: 2px 0 16px 0; font-size: 12px; color:var(--text-muted); }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
        th { background: #f1f5f9; padding: 8px; border:1px solid var(--border); text-align: left; font-size: 10px; text-transform: uppercase; }
        .summary-box { display: flex; gap: 20px; font-size: 12px; padding: 10px 14px; background:var(--bg); border:1px solid var(--border); border-radius: 8px; margin-bottom: 12px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h2>PROGRAM KERJA TAHUNAN PPG SOLO SELATAN</h2>
      <p>Tahun Anggaran 2026 &bull; Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <div class="summary-box">
        <div><strong>Total Agenda:</strong> ${stats.total} Program</div>
        <div><strong>Total Est. Anggaran:</strong> Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</div>
        <div><strong>Sedang Berjalan:</strong> ${stats.ongoing} Program</div>
        <div><strong>Selesai:</strong> ${stats.done} Program</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;text-align:center;">NO</th>
            <th>KEGIATAN</th>
            <th>WAKTU</th>
            <th>SASARAN/ PESERTA</th>
            <th>TUJUAN KEGIATAN</th>
            <th>RINCIAN BIAYA</th>
            <th>EST. BIAYA</th>
            <th>TEMPAT PELAKSANAAN</th>
            <th>STATUS</th>
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

export async function renderProkerModal(filterBidang = 'all', filterStatus = 'all', searchQuery = '', activeTab = 'timeline') {
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
      <div style="background:linear-gradient(135deg, #fef8e7 0%, #fff3cd 100%);padding:14px 18px;border-radius:12px;border:1.5px solid #fde68a;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:13px;font-weight:800;color:var(--gold-dark);">🌟 Wewenang Superadmin Daerah</div>
          <div style="font-size:12px;color:var(--gold-dark);margin-top:2px;">Tombol fungsi ini hanya tampil pada halaman Superadmin, desa kelompok hanya dapat melihat 👁️.</div>
        </div>
        <button type="button" id="btnTambahProkerBaru" style="padding:9px 16px;background:linear-gradient(135deg, var(--gold), #d49b10);color:#1a1d2e;border:none;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(212,160,23,.25);">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span> Tambah Program Kerja
        </button>
      </div>
    `;
  } else {
    bannerNoticeHtml = `
      <div style="background:var(--green-pastel);padding:12px 16px;border-radius:12px;border:1px solid var(--border);font-size:12.5px;color:var(--green-dark);line-height:1.5;">
        <strong>👁️ Mode Koordinasi Wilayah (${currentUser.tingkatan === 'desa' ? 'Tingkat Desa ' + (currentUser.desaNama || '') : 'Pamong Kelompok ' + (currentUser.kelompokNama || '')}):</strong><br/>
        Berikut adalah agenda resmi Program Kerja PPG Solo Selatan beserta rincian sasaran, tujuan, waktu, dan tempat pelaksanaan kegiatan.
      </div>
    `;
  }

  // Summary Stat Strip (2 Baris Rapi)
  const growthBadge = stats.percentGrowth > 0
    ? `<span class="proker-growth-pill up">▲ +${stats.percentGrowth}% Naik</span>`
    : (stats.percentGrowth < 0
      ? `<span class="proker-growth-pill down">▼ ${stats.percentGrowth}% Turun</span>`
      : `<span class="proker-growth-pill equal">▬ 0% Tetap</span>`);

  const statsHtml = `
    <div class="proker-stats-container">
      <div class="proker-stats-row-1">
        <div class="proker-stat-box">
          <span class="stat-label">Total Agenda</span>
          <span class="stat-num">${stats.total} Program</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Sedang Berjalan</span>
          <span class="stat-num" style="color:var(--green);">${stats.ongoing} Program</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Selesai / Terlaksana</span>
          <span class="stat-num" style="color:var(--text-muted);">${stats.done} Program</span>
        </div>
      </div>
      <div class="proker-stats-row-2">
        <div class="proker-stat-box">
          <span class="stat-label">Total Est. Anggaran Tahun Ini</span>
          <span class="stat-num" style="color:var(--blue);">Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Est. Anggaran Tahun Sebelumnya</span>
          <span class="stat-num" style="color:var(--text-muted);">Rp ${stats.anggaranTahunLalu.toLocaleString('id-ID')}</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Pertumbuhan Anggaran</span>
          <div class="stat-num">${growthBadge}</div>
        </div>
      </div>
    </div>
  `;

  // Filter Bar (Hanya Status & Bidang Penanggung Jawab PIC)
  const bidangOptions = DAFTAR_BIDANG_PPG.map(b =>
    `<option value="${b}" ${filterBidang === b ? 'selected' : ''}>Bidang ${b}</option>`
  ).join('');

  const filterHtml = `
    <div class="proker-filter-bar">
      <div style="flex:1;min-width:180px;position:relative;">
        <input type="text" id="inputProkerSearch" value="${searchQuery}" placeholder="Cari kegiatan, tempat, tujuan..." style="width:100%;padding:8px 12px 8px 32px;border:1px solid var(--border);border-radius:8px;font-size:12px;outline:none;" />
        <span class="material-symbols-outlined" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-muted);">search</span>
      </div>

      <select id="selectFilterStatus" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:var(--surface);outline:none;cursor:pointer;">
        <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
        <option value="ongoing" ${filterStatus === 'ongoing' ? 'selected' : ''}>🟢 Sedang Berlangsung</option>
        <option value="upcoming" ${filterStatus === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
        <option value="planned" ${filterStatus === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
        <option value="done" ${filterStatus === 'done' ? 'selected' : ''}>⚪ Selesai</option>
      </select>

      <select id="selectFilterBidang" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:var(--surface);outline:none;cursor:pointer;">
        <option value="all" ${filterBidang === 'all' ? 'selected' : ''}>Semua Bidang (14 Bidang)</option>
        ${bidangOptions}
      </select>

      <div style="display:inline-flex;gap:6px;">
        <button type="button" id="btnExportCsv" title="Download data dalam format Excel CSV" style="padding:7px 12px;background:var(--surface)fff;border:1px solid var(--border);border-radius:8px;font-size:11.5px;font-weight:700;color:var(--text);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;color:var(--green);">file_download</span> CSV
        </button>
        <button type="button" id="btnPrintTable" title="Cetak dokumen resmi" style="padding:7px 12px;background:var(--surface)fff;border:1px solid var(--border);border-radius:8px;font-size:11.5px;font-weight:700;color:var(--text);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;color:var(--blue);">print</span> Cetak
        </button>
      </div>

      <div style="display:inline-flex;background:#e2e8f0;padding:2px;border-radius:8px;">
        <button type="button" id="tabViewTimeline" style="padding:6px 12px;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;background:${activeTab === 'timeline' ? '#ffffff' : 'transparent'};color:${activeTab === 'timeline' ? 'var(--blue)' : 'var(--text-muted)'};box-shadow:${activeTab === 'timeline' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:14px;">view_timeline</span> Timeline Kegiatan
        </button>
        <button type="button" id="tabViewTable" style="padding:6px 12px;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;background:${activeTab === 'table' ? '#ffffff' : 'transparent'};color:${activeTab === 'table' ? 'var(--blue)' : 'var(--text-muted)'};box-shadow:${activeTab === 'table' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:14px;">table_chart</span> Tabel Resmi
        </button>
      </div>
    </div>
  `;

  // Content rendering based on activeTab
  let contentHtml = '';

  if (activeTab === 'table') {
    let rowsHtml = filtered.map((p, idx) => {
      let statusClass = p.status || 'planned';

      let quickStatusSelect = isSuper ? `
        <select class="proker-quick-select proker-quick-status-change" data-id="${p.id}" style="font-size:11px;padding:4px 6px;">
          <option value="planned" ${statusClass === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
          <option value="upcoming" ${statusClass === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
          <option value="ongoing" ${statusClass === 'ongoing' ? 'selected' : ''}>🟢 Berlangsung</option>
          <option value="done" ${statusClass === 'done' ? 'selected' : ''}>⚪ Selesai</option>
        </select>
      ` : `
        <span class="proker-badge-status ${statusClass}">
          <span class="dot ${statusClass}"></span>
          <span>${statusClass === 'done' ? 'Selesai' : (statusClass === 'ongoing' ? 'Berlangsung' : (statusClass === 'upcoming' ? 'Akan Datang' : 'Direncanakan'))}</span>
        </span>
      `;

      let actionsCell = '';
      if (isSuper) {
        actionsCell = `
          <td style="white-space:nowrap;text-align:right;">
            <div style="display:inline-flex;gap:4px;">
              <button type="button" class="btn-proker-edit" data-id="${p.id}" title="Edit Program Kerja" style="padding:5px 8px;border:1px solid var(--border);background:var(--surface);color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                <span class="material-symbols-outlined" style="font-size:14px;">edit</span> Edit
              </button>
              <button type="button" class="btn-proker-del" data-id="${p.id}" data-title="${p.kegiatan}" title="Hapus Program" style="padding:5px 8px;border:1px solid var(--border);background:var(--surface);color:var(--red);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
              </button>
            </div>
          </td>
        `;
      }

      return `
        <tr>
          <td style="font-weight:800;text-align:center;color:var(--blue);">${p.no || (idx + 1)}
          </td>
          <td>
            <div style="font-weight:800;font-size:13px;color:var(--text);">${p.kegiatan}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">PIC: <strong style="color:var(--blue-dark);">${p.penanggungJawab || 'Pengurus PPG'}</strong></div>
          </td>
          <td style="white-space:nowrap;">
            <div style="font-weight:700;color:var(--text);display:flex;align-items:center;gap:4px;">
              <span class="material-symbols-outlined" style="font-size:14px;color:var(--blue);">calendar_today</span>
              ${p.waktu}
            </div>
          </td>
          <td>
            <div style="font-weight:700;color:var(--blue-dark);display:flex;align-items:center;gap:4px;font-size:11.5px;">
              <span class="material-symbols-outlined" style="font-size:14px;">group</span>
              ${p.sasaran}
            </div>
          </td>
          <td>
            <div style="font-size:11.5px;color:var(--text);max-width:200px;line-height:1.4;">${p.tujuan}</div>
          </td>
          <td>
            <div style="font-size:11px;color:var(--text-muted);font-style:italic;max-width:180px;line-height:1.4;">${p.rincianBiaya || '-'}</div>
          </td>
          <td style="white-space:nowrap;">
            <strong style="color:var(--green-dark);font-size:12.5px;">Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}</strong>
          </td>
          <td>
            <div style="font-weight:700;color:var(--blue-dark);display:flex;align-items:center;gap:4px;font-size:11.5px;">
              <span class="material-symbols-outlined" style="font-size:14px;">location_on</span>
              ${p.tempat}
            </div>
          </td>
          <td>
            ${quickStatusSelect}
          </td>
          ${actionsCell}
        </tr>
      `;
    }).join('');

    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="${isSuper ? 10 : 9}" style="text-align:center;padding:32px;color:var(--text-muted);">
            <span class="material-symbols-outlined" style="font-size:36px;color:var(--border);margin-bottom:6px;">event_busy</span>
            <div style="font-weight:700;font-size:13px;color:var(--text);">Tidak Ada Program Kerja Sesuai Filter</div>
            <div style="font-size:12px;margin-top:2px;">Silakan sesuaikan kata kunci pencarian atau pilihan bidang.</div>
          </td>
        </tr>
      `;
    }

    contentHtml = `
      <div style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span>👈 Geser tabel ke kanan dan ke kiri untuk melihat seluruh 8 kolom program kerja 👉</span>
        <span>Menampilkan <strong>${filtered.length}</strong> program</span>
      </div>
      <div class="proker-table-wrap">
        <table class="proker-table">
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">NO</th>
              <th>KEGIATAN</th>
              <th>WAKTU</th>
              <th>SASARAN/ PESERTA</th>
              <th>TUJUAN KEGIATAN</th>
              <th>RINCIAN BIAYA</th>
              <th>EST. BIAYA</th>
              <th>TEMPAT PELAKSANAAN</th>
              <th>STATUS</th>
              ${isSuper ? '<th style="text-align:right;">AKSI</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  } else {
    // Timeline / Semester View (Pinned by Default)
    contentHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--blue);">view_timeline</span>
            Timeline kronologis ${filtered.length} agenda kegiatan program kerja tahunan 2026.
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${filtered.map(p => {
      let statusClass = p.status || 'planned';

      let quickStatusTimeline = isSuper ? `
              <select class="proker-quick-select proker-quick-status-change" data-id="${p.id}">
                <option value="planned" ${statusClass === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
                <option value="upcoming" ${statusClass === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
                <option value="ongoing" ${statusClass === 'ongoing' ? 'selected' : ''}>🟢 Berlangsung</option>
                <option value="done" ${statusClass === 'done' ? 'selected' : ''}>⚪ Selesai</option>
              </select>
            ` : `
              <span class="proker-badge-status ${statusClass}">
                <span class="dot ${statusClass}"></span>
                <span>${statusClass === 'done' ? 'Selesai' : (statusClass === 'ongoing' ? 'Sedang Berlangsung' : (statusClass === 'upcoming' ? 'Akan Datang' : 'Direncanakan'))}</span>
              </span>
            `;

      let superButtons = isSuper ? `
              <div style="display:inline-flex;gap:6px;align-items:center;">
                <button type="button" class="btn-proker-edit" data-id="${p.id}" title="Edit Program" style="padding:5px 10px;border:1px solid var(--border);background:var(--surface);color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">edit</span> Edit
                </button>
                <button type="button" class="btn-proker-del" data-id="${p.id}" data-title="${p.kegiatan}" title="Hapus Program" style="padding:5px 10px;border:1px solid var(--border);background:var(--surface);color:var(--red);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
                </button>
              </div>
            ` : '';

      return `
              <div style="border:1px solid var(--border);border-radius:12px;padding:14px;background:var(--surface)fff;box-shadow:0 2px 6px rgba(0,0,0,0.02);display:flex;gap:14px;align-items:flex-start;">
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                    <div>
                      <strong style="font-size:14px;color:var(--text);">${p.no}</strong>
                      <strong style="font-size:14px;color:var(--text);"> . </strong>
                      <strong style="font-size:14px;color:var(--text);">${p.kegiatan}</strong>
                      </br>
                      <span style="font-size:11px;color:var(--blue);font-weight:700;background:var(--blue-light);padding:2px 6px;border-radius:4px;margin-left:6px;">PIC: ${p.penanggungJawab || 'Pengurus PPG'}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${quickStatusTimeline}
                      ${superButtons}
                    </div>
                  </div>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);margin:6px 0;">
                    <span style="display:flex;align-items:center;gap:4px;">
                      <span class="material-symbols-outlined ms-proker-ic">calendar_today</span> ${p.waktu}
                    </span>
                    <span>&bull;</span>
                    <span style="display:flex;align-items:center;gap:4px;color:var(--blue-dark);font-weight:600;">
                      <span class="material-symbols-outlined ms-proker-ic">location_on</span> ${p.tempat}
                    </span>
                    <span>&bull;</span>
                    <span style="display:flex;align-items:center;gap:4px;color:var(--blue-dark);font-weight:600;">
                      <span class="material-symbols-outlined ms-proker-ic">group</span> ${p.sasaran}
                    </span>
                  </div>
                  <div style="background:var(--surface-2);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--text);margin-bottom:6px;border-left:3px solid var(--blue);">
                    <strong>Tujuan:</strong> ${p.tujuan}
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--text-muted);border-top:1px dashed var(--border);padding-top:6px;flex-wrap:wrap;gap:6px;">
                    <div>Rincian Biaya: <em>${p.rincianBiaya || '-'}</em></div>
                    <strong style="color:var(--green-dark);font-size:12.5px;">Est. Biaya: Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  // Open Modal with Proker UI
  openModal('Program Kerja Tahunan PPG Solo Selatan', 'event_note', `
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${bannerNoticeHtml}
      ${statsHtml}
      ${filterHtml}
      ${contentHtml}
    </div>
  `, 'wide');

  // Event Listeners inside Modal
  document.getElementById('inputProkerSearch')?.addEventListener('input', (e) => {
    renderProkerModal(filterBidang, filterStatus, e.target.value, activeTab);
  });

  document.getElementById('selectFilterStatus')?.addEventListener('change', (e) => {
    renderProkerModal(filterBidang, e.target.value, searchQuery, activeTab);
  });

  document.getElementById('selectFilterBidang')?.addEventListener('change', (e) => {
    renderProkerModal(e.target.value, filterStatus, searchQuery, activeTab);
  });

  document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    exportProkerCsv();
  });

  document.getElementById('btnPrintTable')?.addEventListener('click', () => {
    printProkerTable();
  });

  document.getElementById('tabViewTable')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'table');
  });

  document.getElementById('tabViewTimeline')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'timeline');
  });

  document.getElementById('btnTambahProkerBaru')?.addEventListener('click', () => {
    renderAddEditProkerForm(null);
  });

  // Aksi Cepat Pergantian Status Program Kerja Langsung Tersimpan
  modalBody.querySelectorAll('.proker-quick-status-change').forEach(select => {
    select.addEventListener('change', async (e) => {
      const pId = select.dataset.id;
      const newStatus = select.value;
      await updateProker(pId, { status: newStatus });
      showToast(`Status program berhasil diubah menjadi: "${newStatus}"`, 'info');
      renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab);
      appHooks.renderUserProfile();
    });
  });

  modalBody.querySelectorAll('.btn-proker-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pId = btn.dataset.id;
      const prokerItem = prokerList.find(p => p.id === pId);
      if (prokerItem) renderAddEditProkerForm(prokerItem);
    });
  });

  modalBody.querySelectorAll('.btn-proker-del').forEach(btn => {
    btn.addEventListener('click', async () => {
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
          renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab);
          appHooks.renderUserProfile();
        }
      });
    });
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
      <button type="button" id="btnDownloadFormatExcel" style="padding:6px 12px;background:var(--surface)fff;border:1px solid var(--border);color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
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
        <select id="prokerInputPic" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-weight:700;background:var(--surface)fff;color:var(--text);outline:none;">
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
            <option value="planned" ${isEdit && p.status === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
            <option value="upcoming" ${isEdit && p.status === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
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

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;border-top:1px solid var(--border);padding-top:14px;">
        <button type="button" class="btn-cancel-proker-form" style="padding:10px 18px;border:1px solid var(--border);background:var(--surface);border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">
          Kembali ke Tabel
        </button>
        <button type="submit" style="padding:10px 22px;border:none;background:linear-gradient(135deg, var(--blue), var(--blue-dark));color:#fff;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(26,86,196,.3);">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span> ${isEdit ? 'Simpan Perubahan' : 'Posting Program'}
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
      targetWilayah: 'Daerah Solo Selatan'
    };

    if (isEdit) {
      await updateProker(p.id, prokerDataPayload);
      showToast(`Program Kerja "${prokerDataPayload.kegiatan}" berhasil diperbarui!`, 'success');
    } else {
      await addProker(prokerDataPayload);
      showToast(`Program Kerja "${prokerDataPayload.kegiatan}" berhasil ditambahkan!`, 'success');
    }

    renderProkerModal();
    appHooks.renderUserProfile();
  });
}