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
  syncProkerFromSupabase,
  DAFTAR_SUB_BIDANG_KMM
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  showToast,
  showConfirmModal,
  modalBody,
  showDatabaseLoading,
  hideDatabaseLoading
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

export { DAFTAR_SUB_BIDANG_KMM };

// State aktif kategori tab: 'PPG' | 'KMM'
export let currentActiveKategori = 'PPG';

export function setCurrentActiveKategori(cat) {
  currentActiveKategori = cat === 'KMM' ? 'KMM' : 'PPG';
}

export async function exportProkerCsv(kategori = currentActiveKategori) {
  const isKmm = (kategori || currentActiveKategori) === 'KMM';
  const prokerList = getProkerList().filter(p => isKmm ? p.kategori === 'KMM' : (p.kategori || 'PPG') === 'PPG');
  const stats = getProkerStats(isKmm ? 'KMM' : 'PPG');
  let csvContent = "\uFEFF"; // UTF-8 BOM

  if (isKmm) {
    csvContent += "LAPORAN REALISASI & RAB BIDANG KEGIATAN MUDA-MUDI (KMM) - 9 SUB-BIDANG\n";
  } else {
    csvContent += "LAPORAN REALISASI & RAB TAHUNAN PROGRAM KERJA PPG SOLO SELATAN\n";
  }
  csvContent += "NO;KEGIATAN;WAKTU;SASARAN/ PESERTA;TUJUAN KEGIATAN;RINCIAN BIAYA;EST. BIAYA;TEMPAT PELAKSANAAN;REALISASI PROKER;DESKRIPSI REALISASI PROKER;REALISASI PENGGUNAAN DANA\n";

  // Group by PIC or Sub-Bidang
  const grouped = prokerList.reduce((acc, curr) => {
    let pic = isKmm
      ? (curr.subBidang ? `DIVISI ${curr.subBidang.toUpperCase()}` : (curr.penanggungJawab || 'DIVISI UMUM'))
      : (curr.penanggungJawab || 'Tanpa Bidang');
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterIdx = 0;

  const sortedKeys = isKmm
    ? Object.keys(grouped).sort((a, b) => {
      const idxA = DAFTAR_SUB_BIDANG_KMM.findIndex(sb => a.includes(sb.toUpperCase()));
      const idxB = DAFTAR_SUB_BIDANG_KMM.findIndex(sb => b.includes(sb.toUpperCase()));
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    })
    : Object.keys(grouped).sort();

  sortedKeys.forEach(pic => {
    const letter = alphabet[letterIdx % alphabet.length] || '';
    letterIdx++;
    let subtotalEst = 0;
    let subtotalReal = 0;

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

    csvContent += `;"SUB TOTAL ${pic.toUpperCase()}";;;;;${subtotalEst};;;;${subtotalReal}\n`;
  });

  const totalLabel = isKmm ? "TOTAL KESELURUHAN BIDANG KMM" : "TOTAL KESELURUHAN (PPG KONSOLIDASI)";
  csvContent += `\n;"${totalLabel}";;;;;${stats.totalAnggaran};;;;${stats.totalRealisasiDana}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filePrefix = isKmm ? 'Laporan_RAB_LPJ_KMM_Solo_Selatan_2026_' : 'Laporan_Realisasi_RAB_PPG_Solo_Selatan_2026_';
  link.setAttribute('download', `${filePrefix}${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── TABEL REKAPAN UMUM BIDANG KMM (9 DIVISI) SESUAI FORMAT RESMI EXCEL (GAMBAR 2) ──
export function generateKmmRekapanUmumTableHtml(kmmItems = []) {
  const SUB_BIDANG_MAP = [
    { key: 'Umum', label: 'UMUM' },
    { key: 'Sekretaris', label: 'SEKRETARIS' },
    { key: 'Bendahara', label: 'BENDAHARA' },
    { key: 'Keilmuan', label: 'SIE KEILMUAN' },
    { key: 'Kemandirian', label: 'KEMANDIRIAN' },
    { key: 'Keputrian', label: 'SIE KEPUTRIAN' },
    { key: 'Olahraga', label: 'SIE OLAHRAGA' },
    { key: 'Kemahasiswaan', label: 'KEMAHASISWAAN' },
    { key: 'Taman Media', label: 'TAMAN MEDIA' }
  ];

  let totalKmmEst = 0;

  const rows = SUB_BIDANG_MAP.map((item, idx) => {
    const matchingProker = kmmItems.filter(p => {
      const sub = (p.subBidang || '').toLowerCase();
      const pj = (p.penanggungJawab || '').toLowerCase();
      const k = item.key.toLowerCase();
      return sub === k || pj.includes(k);
    });

    const estSum = matchingProker.reduce((sum, p) => sum + (Number(p.estBiaya) || 0), 0);
    totalKmmEst += estSum;

    const formattedEst = estSum > 0 ? `Rp ${estSum.toLocaleString('id-ID')}` : 'Rp -';

    // Rincian Biaya: Terlampir with rowspan=9 on the first row
    const rincianCell = (idx === 0)
      ? `<td rowspan="9" style="text-align:center;vertical-align:middle;padding:10px 6px;border:1px solid #000;font-weight:bold;color:#0066cc;font-size:12px;letter-spacing:0.3px;">Terlampir</td>`
      : '';

    return `
      <tr style="height:26px;">
        <td style="text-align:center;padding:5px 4px;border:1px solid #000;font-weight:bold;font-size:11px;">${idx + 1}</td>
        <td style="padding:5px 8px;border:1px solid #000;font-weight:bold;font-size:11px;letter-spacing:0.3px;">${item.label}</td>
        <td style="border:1px solid #000;width:80px;"></td>
        <td style="border:1px solid #000;width:110px;"></td>
        <td style="border:1px solid #000;width:140px;"></td>
        ${rincianCell}
        <td style="text-align:right;padding:5px 8px;border:1px solid #000;font-weight:bold;font-size:11px;white-space:nowrap;">
          ${formattedEst}
        </td>
        <td style="text-align:center;padding:5px 6px;border:1px solid #000;font-size:11px;font-weight:600;">Daerah</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="kmm-rekapan-section" style="margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:11px;border:1.5px solid #000;margin-top:6px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="width:35px;text-align:center;border:1px solid #000;padding:6px 4px;font-weight:800;font-size:10px;">NO</th>
            <th style="min-width:180px;text-align:center;border:1px solid #000;padding:6px 8px;font-weight:800;font-size:10px;">KEGIATAN</th>
            <th style="width:80px;text-align:center;border:1px solid #000;padding:6px 4px;font-weight:800;font-size:10px;">WAKTU</th>
            <th style="width:110px;text-align:center;border:1px solid #000;padding:6px 4px;font-weight:800;font-size:10px;">SASARAN/<br/>PESERTA</th>
            <th style="width:140px;text-align:center;border:1px solid #000;padding:6px 4px;font-weight:800;font-size:10px;">TUJUAN KEGIATAN</th>
            <th style="width:110px;text-align:center;border:1px solid #000;padding:6px 4px;font-weight:800;font-size:10px;">RINCIAN BIAYA</th>
            <th style="width:125px;text-align:center;border:1px solid #000;padding:6px 8px;font-weight:800;font-size:10px;">EST. BIAYA</th>
            <th style="width:100px;text-align:center;border:1px solid #000;padding:6px 6px;font-weight:800;font-size:10px;">TEMPAT<br/>PELAKSANAAN</th>
          </tr>
          <tr style="background:#8b0000;color:#ffffff;">
            <td colspan="8" style="padding:8px 10px;border:1px solid #000;font-weight:900;font-size:13px;letter-spacing:0.5px;">
              G. KEGIATAN MUDA MUDI (2026)
            </td>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr style="background:#ffffff;font-weight:bold;border-top:2px solid #000;border-bottom:2px solid #000;height:28px;">
            <td colspan="6" style="text-align:right;padding:7px 10px;border:1px solid #000;font-weight:900;font-size:11.5px;letter-spacing:0.5px;">
              SUB TOTAL
            </td>
            <td style="text-align:right;padding:7px 8px;border:1px solid #000;font-weight:900;font-size:12px;white-space:nowrap;">
              Rp ${totalKmmEst.toLocaleString('id-ID')}
            </td>
            <td style="border:1px solid #000;"></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function generatePrintRows(items, isKmm) {
  const grouped = items.reduce((acc, curr) => {
    let pic = isKmm
      ? (curr.subBidang ? `DIVISI ${curr.subBidang.toUpperCase()}` : (curr.penanggungJawab || 'DIVISI UMUM'))
      : (curr.penanggungJawab || 'Tanpa Bidang');
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let letterIdx = 0;
  let rowsHtml = '';
  let catTotalEst = 0;
  let catTotalReal = 0;

  const sortedKeys = isKmm
    ? Object.keys(grouped).sort((a, b) => {
      const idxA = DAFTAR_SUB_BIDANG_KMM.findIndex(sb => a.includes(sb.toUpperCase()));
      const idxB = DAFTAR_SUB_BIDANG_KMM.findIndex(sb => b.includes(sb.toUpperCase()));
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    })
    : Object.keys(grouped).sort();

  sortedKeys.forEach(pic => {
    const letter = alphabet[letterIdx % alphabet.length] || '';
    letterIdx++;
    let subtotalEst = 0;
    let subtotalReal = 0;

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
      catTotalEst += est;
      catTotalReal += real;

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

  return { rowsHtml, catTotalEst, catTotalReal };
}

export async function printProkerTable(kategori = currentActiveKategori) {
  const isKmm = (kategori || currentActiveKategori) === 'KMM';
  const prokerList = getProkerList().filter(p => isKmm ? p.kategori === 'KMM' : (p.kategori || 'PPG') === 'PPG');
  const stats = getProkerStats(isKmm ? 'KMM' : 'PPG');
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const { rowsHtml, catTotalEst, catTotalReal } = generatePrintRows(prokerList, isKmm);
  const rekapanUmumHtml = isKmm ? generateKmmRekapanUmumTableHtml(prokerList) : '';

  const titleText = isKmm
    ? 'PROGRAM KERJA & LAPORAN REALISASI ANGGARAN BIDANG KEGIATAN MUDA-MUDI (KMM)'
    : 'PROGRAM KERJA & LAPORAN REALISASI ANGGARAN PPG SOLO SELATAN';
  const subtitleText = isKmm
    ? '9 Sub-Bidang / Divisi Resmi KMM &bull; Tahun Anggaran 2026 &bull; Format Resmi LPJ'
    : 'Bidang-Bidang Pengurus Daerah &bull; Tahun Anggaran 2026 &bull; Format Resmi LPJ';
  const totalLabel = isKmm ? 'TOTAL KESELURUHAN BIDANG KMM' : 'TOTAL KESELURUHAN (SEMUA BIDANG)';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titleText} 2026</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 16px; color:#1e293b; }
        h2 { margin: 0 0 2px 0; color: #0b386b; font-size: 16px; font-weight: 800; }
        h3 { margin: 16px 0 6px 0; color: #1e40af; font-size: 13px; font-weight: 800; border-bottom: 1.5px solid #94a3b8; padding-bottom: 4px; }
        p { margin: 2px 0 12px 0; font-size: 11px; color:#64748b; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 10px; }
        th { background: #f1f5f9; padding: 7px 5px; border:1px solid #94a3b8; text-align: left; font-size: 9.5px; font-weight: 800; color:#334155; }
        .summary-box { display: flex; gap: 16px; font-size: 11px; padding: 8px 12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius: 6px; margin-bottom: 10px; flex-wrap: wrap; }
        @media print {
          button { display: none; }
          body { margin: 8px; }
          @page { size: landscape; margin: 8mm; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <h2>${titleText}</h2>
      <p>${subtitleText} &bull; Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <div class="summary-box">
        <div><strong>Total Program:</strong> ${stats.total}</div>
        <div><strong>Est. Anggaran (RAB):</strong> Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</div>
        <div><strong>Realisasi Dana:</strong> Rp ${stats.totalRealisasiDana.toLocaleString('id-ID')}</div>
        <div><strong>Penyerapan:</strong> ${stats.persenRealisasiDana}%</div>
        <div><strong>Ketercapaian:</strong> ${stats.totalTerlaksana} Terlaksana &bull; ${stats.totalBelumTerlaksana} Belum</div>
      </div>

      ${isKmm ? `
        <h3 style="margin:16px 0 6px 0; color:#8b0000; font-size:13.5px; font-weight:900;">I. REKAPAN UMUM BIDANG KEGIATAN MUDA MUDI (9 SUB-BIDANG)</h3>
        ${rekapanUmumHtml}
        <h3 style="margin:22px 0 6px 0; color:#0b386b; font-size:13px; font-weight:800;">II. LAMPIRAN: RINCIAN PROGRAM KERJA &amp; REALISASI LPJ KMM PER SUB-BIDANG</h3>
      ` : ''}

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
          <tr style="background:#cfe2f3;font-weight:900;border-top:2px solid #0b386b;border-bottom:2px solid #0b386b;">
            <td colspan="6" style="text-align:right;padding:8px 8px;border:1px solid #94a3b8;font-size:11.5px;color:#0b386b;">
              ${totalLabel}
            </td>
            <td style="text-align:right;padding:8px 6px;border:1px solid #94a3b8;font-size:12px;color:#0e7039;white-space:nowrap;">
              Rp ${catTotalEst.toLocaleString('id-ID')}
            </td>
            <td colspan="3" style="border:1px solid #94a3b8;"></td>
            <td style="text-align:right;padding:8px 6px;border:1px solid #94a3b8;font-size:12px;color:#1e40af;white-space:nowrap;">
              Rp ${catTotalReal.toLocaleString('id-ID')}
            </td>
          </tr>
        </tbody>
      </table>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

export async function printProkerBukuPlenoLengkap() {
  const allProker = getProkerList();
  const ppgList = allProker.filter(p => (p.kategori || 'PPG') === 'PPG');
  const kmmList = allProker.filter(p => p.kategori === 'KMM');
  const statsConsolidated = getProkerStats('ALL');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const ppgSection = generatePrintRows(ppgList, false);
  const kmmSection = generatePrintRows(kmmList, true);

  const grandEst = ppgSection.catTotalEst + kmmSection.catTotalEst;
  const grandReal = ppgSection.catTotalReal + kmmSection.catTotalReal;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Buku Pleno Lengkap Program Kerja & LPJ PPG Solo Selatan 2026</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 16px; color:#1e293b; }
        h2 { margin: 0 0 2px 0; color: #0b386b; font-size: 17px; font-weight: 900; }
        h3 { margin: 20px 0 6px 0; color: #1e40af; font-size: 13.5px; font-weight: 800; border-bottom: 2px solid #93c5fd; padding-bottom: 4px; }
        p { margin: 2px 0 12px 0; font-size: 11px; color:#64748b; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 8px; margin-bottom: 16px; }
        th { background: #f1f5f9; padding: 7px 5px; border:1px solid #94a3b8; text-align: left; font-size: 9.5px; font-weight: 800; color:#334155; }
        .summary-box { display: flex; gap: 16px; font-size: 11px; padding: 8px 12px; background:#f0f9ff; border:1.5px solid #bae6fd; border-radius: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        @media print {
          button { display: none; }
          body { margin: 8px; }
          @page { size: landscape; margin: 8mm; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <h2>BUKU PLENO GABUNGAN: PROGRAM KERJA &amp; LAPORAN REALISASI DANA (LPJ)</h2>
      <p>PENGURUS DAERAH PPG SOLO SELATAN &amp; BIDANG KEGIATAN MUDA-MUDI (KMM) &bull; TAHUN ANGGARAN 2026 &bull; Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>

      <div class="summary-box">
        <div><strong>Total Program Se-Daerah:</strong> ${allProker.length} Program (${ppgList.length} PPG + ${kmmList.length} KMM)</div>
        <div><strong>Total Anggaran RAB Konsolidasi:</strong> Rp ${grandEst.toLocaleString('id-ID')}</div>
        <div><strong>Total Realisasi Dana LPJ:</strong> Rp ${grandReal.toLocaleString('id-ID')}</div>
        <div><strong>Rasio Penyerapan:</strong> ${statsConsolidated.persenRealisasiDana}%</div>
        <div><strong>Ketercapaian:</strong> ${statsConsolidated.totalTerlaksana} Terlaksana &bull; ${statsConsolidated.totalBelumTerlaksana} Belum</div>
      </div>

      <h3>BAGIAN I: PROGRAM KERJA BIDANG-BIDANG PENGURUS PPG DAERAH</h3>
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
          ${ppgSection.rowsHtml}
          <tr style="background:#e2e8f0;font-weight:900;">
            <td colspan="6" style="text-align:right;padding:8px;border:1px solid #94a3b8;font-size:11px;color:#1e293b;">
              SUB TOTAL BAGIAN I (BIDANG PPG)
            </td>
            <td style="text-align:right;padding:8px 6px;border:1px solid #94a3b8;font-size:11.5px;color:#0e7039;white-space:nowrap;">
              Rp ${ppgSection.catTotalEst.toLocaleString('id-ID')}
            </td>
            <td colspan="3" style="border:1px solid #94a3b8;"></td>
            <td style="text-align:right;padding:8px 6px;border:1px solid #94a3b8;font-size:11.5px;color:#1e40af;white-space:nowrap;">
              Rp ${ppgSection.catTotalReal.toLocaleString('id-ID')}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="page-break"></div>

      <h3>BAGIAN II: PROGRAM KERJA 9 DIVISI BIDANG KEGIATAN MUDA-MUDI (KMM)</h3>
      <h4 style="margin:12px 0 6px 0; color:#8b0000; font-size:12.5px; font-weight:800;">A. REKAPAN UMUM BIDANG KMM (9 DIVISI)</h4>
      ${generateKmmRekapanUmumTableHtml(kmmList)}

      <h4 style="margin:20px 0 6px 0; color:#0b386b; font-size:12.5px; font-weight:800;">B. LAMPIRAN: RINCIAN PROGRAM KERJA &amp; REALISASI LPJ KMM PER SUB-BIDANG</h4>
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
          ${kmmSection.rowsHtml}
          <tr style="background:#fce7f3;font-weight:900;">
            <td colspan="6" style="text-align:right;padding:8px;border:1px solid #f472b6;font-size:11px;color:#831843;">
              SUB TOTAL BAGIAN II (9 DIVISI KMM)
            </td>
            <td style="text-align:right;padding:8px 6px;border:1px solid #f472b6;font-size:11.5px;color:#0e7039;white-space:nowrap;">
              Rp ${kmmSection.catTotalEst.toLocaleString('id-ID')}
            </td>
            <td colspan="3" style="border:1px solid #f472b6;"></td>
            <td style="text-align:right;padding:8px 6px;border:1px solid #f472b6;font-size:11.5px;color:#1e40af;white-space:nowrap;">
              Rp ${kmmSection.catTotalReal.toLocaleString('id-ID')}
            </td>
          </tr>
          <tr style="background:#cfe2f3;font-weight:900;border-top:2.5px solid #0b386b;border-bottom:2.5px solid #0b386b;">
            <td colspan="6" style="text-align:right;padding:9px;border:1.5px solid #0b386b;font-size:12px;color:#0b386b;">
              GRAND TOTAL KONSOLIDASI DAERAH (PPG + KMM)
            </td>
            <td style="text-align:right;padding:9px 6px;border:1.5px solid #0b386b;font-size:12.5px;color:#0e7039;white-space:nowrap;">
              Rp ${grandEst.toLocaleString('id-ID')}
            </td>
            <td colspan="3" style="border:1.5px solid #0b386b;"></td>
            <td style="text-align:right;padding:9px 6px;border:1.5px solid #0b386b;font-size:12.5px;color:#1e40af;white-space:nowrap;">
              Rp ${grandReal.toLocaleString('id-ID')}
            </td>
          </tr>
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

export async function renderProkerModal(filterBidang = 'all', filterStatus = 'all', searchQuery = '', activeTab = 'timeline', currentPage = 1, shouldSync = true, activeKategori = currentActiveKategori) {
  // Update state kategori aktif
  currentActiveKategori = activeKategori === 'KMM' ? 'KMM' : 'PPG';
  const isKmmActive = currentActiveKategori === 'KMM';

  // Synchronize with Supabase if requested (e.g. on initial modal open)
  if (shouldSync) {
    showDatabaseLoading('Loading Database', 'Mengambil data program kerja...');
    try {
      await syncProkerFromSupabase();
    } catch (err) {
      console.warn('Sync Supabase Proker warning:', err);
    } finally {
      hideDatabaseLoading();
    }
  }

  const isSuper = Boolean(currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah'));
  const prokerList = getProkerList();
  const stats = getProkerStats(currentActiveKategori);

  const ppgCount = prokerList.filter(p => (p.kategori || 'PPG') === 'PPG').length;
  const kmmCount = prokerList.filter(p => p.kategori === 'KMM').length;

  // Filter proker berdasarkan kategori aktif (PPG vs KMM)
  const categoryItems = prokerList.filter(p => isKmmActive ? p.kategori === 'KMM' : (p.kategori || 'PPG') === 'PPG');

  // Filter proker data: Status, Bidang Penanggung Jawab / Sub-bidang, Search
  let filtered = categoryItems.filter(p => {
    if (filterBidang !== 'all') {
      if (isKmmActive) {
        const sub = (p.subBidang || '').toLowerCase();
        const pic = (p.penanggungJawab || '').toLowerCase();
        const fb = filterBidang.toLowerCase();
        if (sub !== fb && !pic.includes(fb)) return false;
      } else {
        const picText = (p.penanggungJawab || '').toLowerCase();
        if (!picText.includes(filterBidang.toLowerCase())) return false;
      }
    }
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKegiatan = (p.kegiatan || '').toLowerCase().includes(q);
      const matchTempat = (p.tempat || '').toLowerCase().includes(q);
      const matchTujuan = (p.tujuan || '').toLowerCase().includes(q);
      const matchSasaran = (p.sasaran || '').toLowerCase().includes(q);
      const matchPic = (p.penanggungJawab || '').toLowerCase().includes(q);
      const matchSub = (p.subBidang || '').toLowerCase().includes(q);
      if (!matchKegiatan && !matchTempat && !matchTujuan && !matchSasaran && !matchPic && !matchSub) return false;
    }
    return true;
  });

  // Sort by 'no' ascending
  filtered.sort((a, b) => (a.no || 0) - (b.no || 0));

  // Category Tab Switcher
  const categoryTabsHtml = `
    <div class="proker-category-nav-wrap">
      <div class="proker-category-tabs">
        <button type="button" class="proker-cat-btn ${!isKmmActive ? 'active' : ''}" id="catTabPpg" data-cat="PPG">
          <span class="material-symbols-outlined proker-cat-icon">assignment</span>
          <div class="proker-cat-text">
            <span class="proker-cat-title">Program Kerja PPG</span>
            <span class="proker-cat-subtitle">14 Bidang Pengurus Daerah</span>
          </div>
          <span class="proker-cat-badge">${ppgCount} Prog</span>
        </button>
        <button type="button" class="proker-cat-btn ${isKmmActive ? 'active' : ''}" id="catTabKmm" data-cat="KMM">
          <span class="material-symbols-outlined proker-cat-icon">diversity_3</span>
          <div class="proker-cat-text">
            <span class="proker-cat-title">Bidang KMM (Muda-Mudi)</span>
            <span class="proker-cat-subtitle">9 Sub-Bidang / Divisi</span>
          </div>
          <span class="proker-cat-badge kmm">${kmmCount} Prog</span>
        </button>
      </div>
    </div>
  `;

  // Role Header Banner (Model Banner Action Frame Sesuai Generus)
  let bannerNoticeHtml = '';
  if (isSuper) {
    const btnAddText = isKmmActive ? 'Tambah Program Kerja (KMM)' : 'Tambah Program Kerja';
    bannerNoticeHtml = `
      <div class="banner-action-frame proker-banner-gold">
        <button type="button" id="btnTambahProkerBaru" class="btn-banner-action-blue btn-proker-banner-gold" title="${btnAddText}">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>
          <span>${btnAddText}</span>
        </button>
      </div>
    `;
  } else {
    bannerNoticeHtml = '';
  }

  // Summary Stat Strip (Realisasi & LPJ Integrated)
  const statsHtml = `
    <div class="proker-stats-container">
      <!-- BARIS 1: INFORMASI KETERCAPAIAN & STATUS -->
      <div class="proker-stats-row-1">
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon">inventory_2</span>
          <div class="proker-stat-info">
            <span class="stat-label">TOTAL PROGRAM ${isKmmActive ? 'KMM' : 'PPG'}</span>
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
            <span class="stat-label">EST. BIAYA (${isKmmActive ? 'RAB KMM' : 'RAB KONSOLIDASI'})</span>
            <span class="stat-num">Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</span>
            <span class="stat-sub">${isKmmActive ? 'Rencana Anggaran 9 Divisi KMM' : `Termasuk alokasi KMM Rp ${(stats.kmmAnggaran || 0).toLocaleString('id-ID')}`}</span>
          </div>
        </div>
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon" style="color:#0e7039;">account_balance_wallet</span>
          <div class="proker-stat-info">
            <span class="stat-label">REALISASI DANA (${isKmmActive ? 'LPJ KMM' : 'KONSOLIDASI'})</span>
            <span class="stat-num" style="color:#0e7039;">Rp ${stats.totalRealisasiDana.toLocaleString('id-ID')}</span>
            <span class="stat-sub">${isKmmActive ? 'Aktual Pengeluaran KMM' : `PPG Rp ${(stats.ppgRealisasi || 0).toLocaleString('id-ID')} + KMM Rp ${(stats.kmmRealisasi || 0).toLocaleString('id-ID')}`}</span>
          </div>
        </div>
        <div class="proker-stat-box">
          <span class="material-symbols-outlined proker-stat-icon" style="color:${stats.selisihDana < 0 ? '#c81e1e' : '#2563eb'};">pie_chart</span>
          <div class="proker-stat-info">
            <span class="stat-label">PENYERAPAN DANA (${stats.persenRealisasiDana}%)</span>
            <span class="stat-num" style="color:${stats.selisihDana < 0 ? '#c81e1e' : '#057a55'};">
              ${stats.selisihDana < 0 ? 'Over Rp ' + Math.abs(stats.selisihDana).toLocaleString('id-ID') : (stats.selisihDana > 0 ? 'Sisa Rp ' + stats.selisihDana.toLocaleString('id-ID') : 'Rp 0')}
            </span>
            <span class="stat-sub">${stats.selisihDana > 0 ? 'Sisa Pagu Anggaran' : (stats.selisihDana < 0 ? 'Melebihi Estimasi RAB' : 'Tepat 100% Sesuai RAB')}</span>
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
            <span style="font-weight:700;color:${stats.selisihDana < 0 ? '#c81e1e' : '#057a55'};">
              ${stats.selisihDana < 0 ? 'Over Rp ' + Math.abs(stats.selisihDana).toLocaleString('id-ID') : (stats.selisihDana > 0 ? 'Sisa Rp ' + stats.selisihDana.toLocaleString('id-ID') : 'Rp 0')}
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
  const bidangOptions = isKmmActive
    ? DAFTAR_SUB_BIDANG_KMM.map(sb =>
      `<option value="${sb}" ${filterBidang === sb ? 'selected' : ''}>Divisi ${sb}</option>`
    ).join('')
    : DAFTAR_BIDANG_PPG.map(b =>
      `<option value="${b}" ${filterBidang === b ? 'selected' : ''}>Bidang ${b}</option>`
    ).join('');

  const bidangAllLabel = isKmmActive ? 'Semua Sub-Bidang KMM (9 Divisi)' : 'Semua Bidang PPG (14 Bidang)';

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
            <option value="all" ${filterBidang === 'all' ? 'selected' : ''}>${bidangAllLabel}</option>
            ${bidangOptions}
          </select>
        </div>
      </div>

      <!-- BARIS 3: AKSI EKSPOR & TABS TAMPILAN -->
      <div class="proker-filter-row-3">
        <div class="proker-export-btns">
          <button type="button" id="btnExportCsv" class="proker-btn-csv" title="Download data dalam format Excel CSV">
            <span class="material-symbols-outlined" style="font-size:16px;">file_download</span> CSV ${isKmmActive ? 'KMM' : 'PPG'}
          </button>
          <button type="button" id="btnPrintTable" class="proker-btn-print" title="Cetak dokumen resmi tab ini">
            <span class="material-symbols-outlined" style="font-size:16px;">print</span> Cetak
          </button>
          <button type="button" id="btnPrintPlenoGabungan" class="proker-btn-gabungan" title="Cetak Buku Pleno Komprehensif Gabungan (PPG + 9 Divisi KMM)">
            <span class="material-symbols-outlined" style="font-size:16px;">menu_book</span> Buku Gabungan
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

      let actionsCell = `
        <td style="white-space:nowrap;text-align:right;">
          <div style="display:inline-flex;gap:5px;align-items:center;justify-content:flex-end;">
            <button type="button" class="btn-proker-preview" data-id="${p.id}" title="Tampilkan Mode Presentasi / Pleno">
              <span class="material-symbols-outlined" style="font-size:15px;color:var(--blue);">visibility</span>
              <span>Pleno</span>
            </button>
            ${isSuper ? `
              <button type="button" class="btn-proker-lpj" data-id="${p.id}" title="Lapor LPJ & Realisasi Penggunaan Dana">
                <span class="material-symbols-outlined" style="font-size:14px;">assignment_turned_in</span> LPJ
              </button>
            ` : ''}
          </div>
        </td>
      `;

      return `
        <tr>
          <td style="font-weight:800;text-align:center;color:var(--blue);">${p.no || (startIndex + idx + 1)}</td>
          <td>
            <div style="font-weight:800;font-size:13px;color:var(--text);">${p.kegiatan}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
              ${p.kategori === 'KMM' ? `
                <span class="proker-sub-badge-kmm">
                  <span class="material-symbols-outlined" style="font-size:12px;">diversity_3</span>
                  Divisi ${p.subBidang || 'Umum'}
                </span>
              ` : `
                <span style="background:rgba(37,99,235,0.08);color:#1d4ed8;padding:2px 7px;border-radius:4px;font-weight:700;font-size:10.5px;">
                  ${p.penanggungJawab || 'Pengurus PPG'}
                </span>
              `}
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
          <td colspan="12" style="text-align:center;padding:32px;color:var(--text-muted);">
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
                <th style="width:130px;text-align:right;">AKSI</th>
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
                <td></td>
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
                <td></td>
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

      let cardActions = `
        <div style="display:inline-flex;gap:5px;align-items:center;">
          <button type="button" class="btn-proker-preview" data-id="${p.id}" title="Mode Presentasi / Pleno">
            <span class="material-symbols-outlined" style="font-size:15px;color:var(--blue);">visibility</span> Pleno
          </button>
          ${isSuper ? `
            <button type="button" class="btn-proker-lpj" data-id="${p.id}" title="Lapor LPJ & Realisasi Dana">
              <span class="material-symbols-outlined" style="font-size:14px;">assignment_turned_in</span> LPJ
            </button>
          ` : ''}
        </div>
      `;

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
                    ${p.kategori === 'KMM' ? `
                      <span class="proker-sub-badge-kmm" style="font-size:11px;padding:2px 8px;">
                        <span class="material-symbols-outlined" style="font-size:13px;">diversity_3</span>
                        Divisi: ${p.subBidang || 'Umum'}
                      </span>
                    ` : `
                      <span class="proker-pic-pill">PIC: ${p.penanggungJawab || 'Pengurus PPG'}</span>
                    `}
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
                      <div class="proker-admin-actions">${cardActions}</div>
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
      ${categoryTabsHtml}
      ${bannerNoticeHtml}
      ${statsHtml}
      ${filterHtml}
      ${contentHtml}
    </div>
  `, 'wide');

  // Event Listeners
  // 1. Kategori Switcher (PPG vs KMM)
  document.getElementById('catTabPpg')?.addEventListener('click', () => {
    currentActiveKategori = 'PPG';
    renderProkerModal('all', 'all', '', activeTab, 1, false, 'PPG');
  });

  document.getElementById('catTabKmm')?.addEventListener('click', () => {
    currentActiveKategori = 'KMM';
    renderProkerModal('all', 'all', '', activeTab, 1, false, 'KMM');
  });

  // 2. Pencarian & Filter
  const searchInput = document.getElementById('inputProkerSearch');
  if (searchInput) {
    searchInput.focus();
    const val = searchInput.value;
    searchInput.value = '';
    searchInput.value = val;
    searchInput.addEventListener('input', (e) => {
      renderProkerModal(filterBidang, filterStatus, e.target.value, activeTab, 1, false, currentActiveKategori);
    });
  }

  document.getElementById('selectFilterStatus')?.addEventListener('change', (e) => {
    renderProkerModal(filterBidang, e.target.value, searchQuery, activeTab, 1, false, currentActiveKategori);
  });

  document.getElementById('selectFilterBidang')?.addEventListener('change', (e) => {
    renderProkerModal(e.target.value, filterStatus, searchQuery, activeTab, 1, false, currentActiveKategori);
  });

  // 3. Tombol Ekspor CSV & Cetak Dokumen
  document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    exportProkerCsv(currentActiveKategori);
  });

  document.getElementById('btnPrintTable')?.addEventListener('click', () => {
    printProkerTable(currentActiveKategori);
  });

  document.getElementById('btnPrintPlenoGabungan')?.addEventListener('click', () => {
    printProkerBukuPlenoLengkap();
  });

  // 4. View Switcher (Tabel vs Timeline)
  document.getElementById('tabViewTable')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'table', currentPage, false, currentActiveKategori);
  });

  document.getElementById('tabViewTimeline')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'timeline', currentPage, false, currentActiveKategori);
  });

  // 5. Pagination
  modalBody.querySelectorAll('.proker-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pNum = parseInt(btn.dataset.page);
      if (pNum && pNum >= 1 && pNum <= totalPages && pNum !== currentPage) {
        renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab, pNum, false, currentActiveKategori);
      }
    });
  });

  // 6. Tambah Program Kerja Baru
  document.getElementById('btnTambahProkerBaru')?.addEventListener('click', () => {
    renderAddEditProkerForm(null, currentActiveKategori);
  });

  // Aksi Cepat Pergantian Realisasi Proker (Terlaksana / Belum Terlaksana) Langsung Tersimpan
  modalBody.querySelectorAll('.proker-realisasi-quick-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const pId = select.dataset.id;
      const newStatus = select.value;
      await updateRealisasiProker(pId, { realisasiStatus: newStatus });
      showToast(`Realisasi program diubah menjadi "${newStatus === 'terlaksana' ? 'Terlaksana' : 'Belum Terlaksana'}"`, 'info');
      renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab, currentPage, false, currentActiveKategori);
      renderInlineProkerWidget();
      appHooks.renderUserProfile();
    });
  });

  // Tombol Mode Pleno (Menayangkan Agenda Terpilih)
  modalBody.querySelectorAll('.btn-proker-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pId = btn.dataset.id;
      renderProkerPresentationModal(pId, filtered);
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
      if (e.target.closest('.btn-proker-edit') || e.target.closest('.btn-proker-del') || e.target.closest('.btn-proker-lpj') || e.target.closest('.btn-proker-preview')) {
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
      if (prokerItem) renderAddEditProkerForm(prokerItem, currentActiveKategori);
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
          renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab, currentPage, false, currentActiveKategori);
          renderInlineProkerWidget();
          appHooks.renderUserProfile();
        }
      });
    });
  });
}


export function renderProkerPresentationModal(prokerId, contextList = null) {
  let list = contextList && contextList.length > 0 ? contextList : getProkerList();
  list = [...list].sort((a, b) => (a.no || 0) - (b.no || 0));
  if (list.length === 0) return;

  const currIdx = list.findIndex(item => String(item.id) === String(prokerId));
  const currentIndex = currIdx !== -1 ? currIdx : 0;
  const currentItem = list[currentIndex];
  if (!currentItem) return;

  const prevItem = currentIndex > 0 ? list[currentIndex - 1] : null;
  const nextItem = currentIndex < list.length - 1 ? list[currentIndex + 1] : null;

  const isSuper = Boolean(currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah'));
  const isTerlaksana = currentItem.realisasiStatus === 'terlaksana';
  const estVal = currentItem.estBiaya || 0;
  const realVal = currentItem.realisasiBiaya || 0;
  const diffVal = estVal - realVal;

  let efficiencyHtml = '';
  if (realVal === 0 && !isTerlaksana) {
    efficiencyHtml = `<span style="color:var(--text-muted);font-weight:700;">Belum Terealisasi</span>`;
  } else if (diffVal > 0) {
    const pct = estVal > 0 ? Math.round((diffVal / estVal) * 100) : 0;
    efficiencyHtml = `<span style="color:#057a55;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><span class="material-symbols-outlined" style="font-size:16px;">trending_down</span> +Rp ${diffVal.toLocaleString('id-ID')} (Hemat ${pct}%)</span>`;
  } else if (diffVal < 0) {
    const pct = estVal > 0 ? Math.round((Math.abs(diffVal) / estVal) * 100) : 0;
    efficiencyHtml = `<span style="color:#c81e1e;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><span class="material-symbols-outlined" style="font-size:16px;">trending_up</span> -Rp ${Math.abs(diffVal).toLocaleString('id-ID')} (Lebih ${pct}%)</span>`;
  } else if (diffVal === 0 && realVal > 0) {
    efficiencyHtml = `<span style="color:#0284c7;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><span class="material-symbols-outlined" style="font-size:16px;">check_circle</span> Tepat 100% Sesuai RAB</span>`;
  } else {
    efficiencyHtml = `<span style="color:var(--text-muted);font-weight:700;">Tanpa Anggaran (Rp 0)</span>`;
  }

  let statusClass = currentItem.status || 'planned';
  let statusLabel = 'Direncanakan';
  if (statusClass === 'done') statusLabel = 'Selesai';
  else if (statusClass === 'ongoing') statusLabel = 'Berlangsung';
  else if (statusClass === 'upcoming') statusLabel = 'Akan Datang';

  let overlay = document.getElementById('prokerPresentationOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'prokerPresentationOverlay';
    overlay.className = 'proker-presentation-backdrop';
    document.body.appendChild(overlay);
  }

  function closePlenoPresentation() {
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay && overlay.parentNode && !overlay.classList.contains('show')) {
          overlay.innerHTML = '';
        }
      }, 250);
    }
    if (window._plenoKeyHandler) {
      window.removeEventListener('keydown', window._plenoKeyHandler);
      window._plenoKeyHandler = null;
    }
  }

  overlay.innerHTML = `
    <div class="proker-presentation-modal" role="dialog" aria-modal="true" aria-label="Mode Presentasi Program Kerja">
      <!-- HEADER PLENO TOOLBAR (Gambar 3: Mode Pleno Pill & Tombol Tutup) -->
      <div class="proker-presentation-header">
        <span class="proker-pleno-pill-mode">
          <span class="material-symbols-outlined" style="font-size:16px;">visibility</span>
          <span>MODE PLENO</span>
        </span>
        <button type="button" class="btn-pleno-close" id="btnPlenoClose" aria-label="Tutup Pleno" title="Tutup Mode Presentasi (Esc)">
          <span class="material-symbols-outlined" style="font-size:20px;">close</span>
        </button>
      </div>

      <!-- BODY PRESENTASI PROKER -->
      <div class="proker-presentation-body">
        <!-- BARIS TOMBOL AKSI TIGA KOLOM (LPJ Realisasi, Edit, Hapus - Sesuai Gambar 3) -->
        <div class="proker-pleno-actions-bar">
          <button type="button" class="btn-pleno-action btn-pleno-lpj" id="btnPlenoLpj" title="Lapor LPJ & Realisasi Dana">
            <span class="material-symbols-outlined" style="font-size:16px;">assignment_turned_in</span>
            <span>LPJ Realisasi</span>
          </button>
          <button type="button" class="btn-pleno-action btn-pleno-edit" id="btnPlenoEdit" ${!isSuper ? 'disabled title="Hanya Superadmin"' : 'title="Edit Program Kerja"'}>
            <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
            <span>Edit</span>
          </button>
          <button type="button" class="btn-pleno-action btn-pleno-del" id="btnPlenoDel" ${!isSuper ? 'disabled title="Hanya Superadmin"' : 'title="Hapus Program Kerja"'}>
            <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
            <span>Hapus</span>
          </button>
        </div>

        <!-- HERO STATUS & JUDUL AGENDA -->
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span class="proker-pleno-badge-terlaksana ${isTerlaksana ? 'is-yes' : 'is-no'}">
              <span class="material-symbols-outlined" style="font-size:15px;">${isTerlaksana ? 'check_circle' : 'pending_actions'}</span>
              <span>${isTerlaksana ? 'TERLAKSANA' : 'BELUM TERLAKSANA'}</span>
            </span>
            <span class="proker-pleno-badge-substatus">
              ${statusLabel.toUpperCase()}
            </span>
            ${currentItem.kategori === 'KMM' ? `
              <span class="proker-sub-badge-kmm" style="font-size:11px;padding:3px 10px;">
                <span class="material-symbols-outlined" style="font-size:14px;">diversity_3</span>
                KMM &bull; Divisi ${currentItem.subBidang || 'Umum'}
              </span>
            ` : ''}
          </div>

          <h2 style="margin:4px 0 2px;font-size:20px;font-weight:900;color:var(--text);line-height:1.35;">
            #${currentItem.no || (currentIndex + 1)}. ${currentItem.kegiatan}
          </h2>

          <div style="font-size:12.5px;color:var(--text-muted);font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span>Tingkat Pelaksanaan: <strong style="color:var(--text);">Daerah Solo Selatan</strong></span>
            <span>&bull;</span>
            ${currentItem.kategori === 'KMM' ? `
              <span>Divisi: <strong style="color:#7c3aed;">Divisi ${currentItem.subBidang || 'Umum'}</strong></span>
            ` : `
              <span>Penanggung Jawab: <strong style="color:#1d4ed8;">${currentItem.penanggungJawab || 'Sekretaris & Ketua'}</strong></span>
            `}
          </div>

          <div style="border-bottom:1.5px dashed var(--border);margin:8px 0 12px;"></div>
        </div>

        <!-- CARD 1: MAKSUD & TUJUAN KEGIATAN -->
        <div class="proker-pleno-box">
          <div class="proker-pleno-box-header">
            <span class="material-symbols-outlined" style="font-size:18px;">track_changes</span>
            <span>MAKSUD &amp; TUJUAN KEGIATAN</span>
          </div>
          <div class="proker-pleno-box-body">
            ${currentItem.tujuan || '<span style="color:var(--text-muted);font-style:italic;">Belum ada deskripsi maksud dan tujuan kegiatan.</span>'}
          </div>
        </div>

        <!-- CARD 2: WAKTU, TEMPAT & SASARAN -->
        <div class="proker-pleno-box">
          <div class="proker-pleno-box-header">
            <span class="material-symbols-outlined" style="font-size:18px;">schedule</span>
            <span>WAKTU, TEMPAT &amp; SASARAN</span>
          </div>
          <div class="proker-pleno-box-list">
            <div class="list-item">
              <span class="material-symbols-outlined">calendar_today</span>
              <span><strong>Waktu:</strong> ${currentItem.waktu || '-'}</span>
            </div>
            <div class="list-item">
              <span class="material-symbols-outlined">location_on</span>
              <span><strong>Tempat:</strong> ${currentItem.tempat || '-'}</span>
            </div>
            <div class="list-item">
              <span class="material-symbols-outlined">group</span>
              <span><strong>Sasaran:</strong> ${currentItem.sasaran || '-'}</span>
            </div>
          </div>
        </div>

        <!-- CARD 3: RENCANA ANGGARAN BIAYA (RAB) & REALISASI KEUANGAN -->
        <div class="proker-pleno-box">
          <div class="proker-pleno-box-header">
            <span class="material-symbols-outlined" style="font-size:18px;color:#057a55;">payments</span>
            <span>RENCANA ANGGARAN BIAYA (RAB) &amp; REALISASI KEUANGAN</span>
          </div>
          <div class="proker-pleno-rab-grid">
            <div class="proker-pleno-rab-item">
              <span class="rab-lbl">ESTIMASI BIAYA (RAB)</span>
              <strong class="rab-val est">Rp ${estVal.toLocaleString('id-ID')}</strong>
            </div>
            <div class="proker-pleno-rab-item">
              <span class="rab-lbl">REALISASI PENGGUNAAN DANA</span>
              <strong class="rab-val real">Rp ${realVal.toLocaleString('id-ID')}</strong>
            </div>
            <div class="proker-pleno-rab-item">
              <span class="rab-lbl">STATUS EFISIENSI DANA</span>
              <div class="rab-val status" style="font-size:12px;margin-top:2px;">${efficiencyHtml}</div>
            </div>
          </div>
          ${currentItem.rincianBiaya ? `
            <div style="font-size:12px;color:var(--text);border-top:1px dashed var(--border);padding-top:8px;margin-top:4px;">
              <strong style="color:var(--text-muted);font-size:10.5px;text-transform:uppercase;display:block;margin-bottom:2px;">Rincian Komponen Biaya:</strong>
              <div style="font-style:italic;color:var(--text);">${currentItem.rincianBiaya}</div>
            </div>
          ` : ''}
        </div>

        <!-- CARD 4: CATATAN EVALUASI & REALISASI LPJ (HASIL FORUM) -->
        ${currentItem.deskripsiRealisasi ? `
          <div class="proker-pleno-box" style="background:#f0fdf4;border-color:#86efac;">
            <div class="proker-pleno-box-header" style="color:#166534;">
              <span class="material-symbols-outlined" style="font-size:18px;color:#166534;">rate_review</span>
              <span>CATATAN EVALUASI &amp; REALISASI LPJ (HASIL FORUM)</span>
            </div>
            <div class="proker-pleno-box-body" style="color:#065f46;">
              ${currentItem.deskripsiRealisasi}
            </div>
            ${currentItem.tglRealisasi ? `
              <div style="font-size:11px;color:#047857;font-weight:700;margin-top:4px;">
                📅 Tanggal Pelaporan LPJ: ${currentItem.tglRealisasi}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- FOOTER SLIDE NAVIGATION (Gambar 3: Sebelumnya, Counter, Selanjutnya) -->
      <div class="proker-presentation-footer">
        <button type="button" class="btn-pleno-prev-clean" id="btnPlenoPrev" ${!prevItem ? 'disabled' : ''} title="Agenda Sebelumnya (Tombol Panah Kiri ←)">
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_back</span>
          <span>Sebelumnya</span>
        </button>

        <div class="proker-pleno-counter-pill">
          <span class="counter-icon-box">
            <span class="material-symbols-outlined" style="font-size:15px;">slideshow</span>
          </span>
          <span>Agenda <strong>${currentIndex + 1}</strong> dari ${list.length}</span>
        </div>

        <button type="button" class="btn-pleno-next-clean" id="btnPlenoNext" ${!nextItem ? 'disabled' : ''} title="Agenda Selanjutnya (Tombol Panah Kanan →)">
          <span>Selanjutnya</span>
          <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span>
        </button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    overlay.classList.add('show');
  });

  // Attach event handlers
  document.getElementById('btnPlenoClose')?.addEventListener('click', closePlenoPresentation);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      closePlenoPresentation();
    }
  };

  document.getElementById('btnPlenoPrev')?.addEventListener('click', () => {
    if (prevItem) {
      renderProkerPresentationModal(prevItem.id, list);
    }
  });

  document.getElementById('btnPlenoNext')?.addEventListener('click', () => {
    if (nextItem) {
      renderProkerPresentationModal(nextItem.id, list);
    }
  });

  document.getElementById('btnPlenoLpj')?.addEventListener('click', () => {
    closePlenoPresentation();
    renderLaporRealisasiModal(currentItem);
  });

  if (isSuper) {
    document.getElementById('btnPlenoEdit')?.addEventListener('click', () => {
      closePlenoPresentation();
      renderAddEditProkerForm(currentItem, currentItem.kategori || currentActiveKategori);
    });

    document.getElementById('btnPlenoDel')?.addEventListener('click', () => {
      showConfirmModal({
        title: 'Hapus Program Kerja',
        message: `Apakah Anda yakin ingin menghapus program "${currentItem.kegiatan}" dari agenda tahunan?`,
        icon: 'delete_forever',
        iconBg: 'var(--red-light)',
        iconColor: 'var(--red)',
        confirmText: 'Ya, Hapus',
        confirmBtnColor: 'var(--red)',
        onConfirm: async () => {
          await deleteProker(currentItem.id);
          closePlenoPresentation();
          showToast(`Program kerja "${currentItem.kegiatan}" berhasil dihapus`, 'success');
          renderProkerModal('all', 'all', '', 'timeline', 1, false, currentItem.kategori || currentActiveKategori);
          renderInlineProkerWidget();
          appHooks.renderUserProfile();
        }
      });
    });
  }

  // Keyboard navigation
  if (window._plenoKeyHandler) {
    window.removeEventListener('keydown', window._plenoKeyHandler);
  }
  window._plenoKeyHandler = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    if (e.key === 'ArrowLeft' && prevItem) {
      e.preventDefault();
      renderProkerPresentationModal(prevItem.id, list);
    } else if (e.key === 'ArrowRight' && nextItem) {
      e.preventDefault();
      renderProkerPresentationModal(nextItem.id, list);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePlenoPresentation();
    }
  };
  window.addEventListener('keydown', window._plenoKeyHandler);
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
            <span style="font-size:11px;font-weight:700;background:${p.kategori === 'KMM' ? '#f3e8ff' : '#dbeafe'};color:${p.kategori === 'KMM' ? '#7e22ce' : '#1e40af'};padding:2px 8px;border-radius:4px;">
              ${p.kategori === 'KMM' ? `KMM - DIVISI ${(p.subBidang || 'Umum').toUpperCase()}` : `BIDANG: ${(p.penanggungJawab || 'Pengurus PPG').toUpperCase()}`}
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
    renderProkerModal('all', 'all', '', 'timeline', 1, false, p.kategori || currentActiveKategori);
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
    renderProkerModal('all', 'all', '', 'timeline', 1, false, p.kategori || currentActiveKategori);
    renderInlineProkerWidget();
    appHooks.renderUserProfile();
  });
}

export async function renderAddEditProkerForm(p = null, defaultKategori = currentActiveKategori) {
  const isEdit = !!p;
  let formKategori = p?.kategori || defaultKategori || currentActiveKategori || 'PPG';
  const prokerList = getProkerList();

  const getNextNoForCat = (cat) => {
    const catList = prokerList.filter(item => (item.kategori || 'PPG') === cat);
    return catList.length > 0 ? Math.max(...catList.map(item => item.no || 0)) + 1 : 1;
  };

  let autoNo = isEdit ? p.no : getNextNoForCat(formKategori);

  const modalTitleText = isEdit
    ? `Edit Program Kerja ${formKategori === 'KMM' ? 'Bidang KMM' : 'PPG'}: ${p.kegiatan}`
    : `Tambah Program Kerja Baru (${formKategori === 'KMM' ? 'Bidang KMM' : 'PPG Daerah'})`;

  // Helper untuk generate opsi PIC dropdown
  function getPicOptionsHtml(cat, selectedVal = '') {
    if (cat === 'KMM') {
      const matchSub = p?.subBidang || selectedVal;
      return `
        <option value="">-- Pilih Salah Satu dari 9 Divisi KMM --</option>
        ${DAFTAR_SUB_BIDANG_KMM.map(sb => {
        const isSel = (matchSub === sb || (selectedVal && selectedVal.includes(sb)));
        return `<option value="${sb}" ${isSel ? 'selected' : ''}>Divisi ${sb}</option>`;
      }).join('')}
      `;
    } else {
      const matchPj = p?.penanggungJawab || selectedVal;
      return `
        <option value="">-- Pilih Salah Satu dari 14 Bidang Pengurus PPG --</option>
        ${DAFTAR_BIDANG_PPG.map(b => {
        const isSel = (matchPj === b || (matchPj && matchPj.includes(b)));
        return `<option value="${b}" ${isSel ? 'selected' : ''}>Bidang ${b}</option>`;
      }).join('')}
      `;
    }
  }

  const initialPicOptions = getPicOptionsHtml(formKategori, p?.subBidang || p?.penanggungJawab || '');

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

      <!-- 0. Kategori Switcher (PPG vs KMM) -->
      <div style="background:var(--surface-2);padding:12px 14px;border:1.5px solid var(--border);border-radius:10px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--text);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:17px;color:var(--blue);">category</span>
          KATEGORI PROGRAM KERJA *
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <label style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;border:1.5px solid ${formKategori === 'PPG' ? '#2563eb' : 'var(--border)'};background:${formKategori === 'PPG' ? '#eff6ff' : 'var(--surface)'};cursor:pointer;font-weight:700;font-size:12.5px;color:${formKategori === 'PPG' ? '#1d4ed8' : 'var(--text)'};">
            <input type="radio" name="prokerInputKategori" value="PPG" ${formKategori === 'PPG' ? 'checked' : ''} style="accent-color:#2563eb;" />
            <span class="material-symbols-outlined" style="font-size:17px;">assignment</span>
            Program PPG (14 Bidang)
          </label>
          <label style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;border:1.5px solid ${formKategori === 'KMM' ? '#db2777' : 'var(--border)'};background:${formKategori === 'KMM' ? '#fdf2f8' : 'var(--surface)'};cursor:pointer;font-weight:700;font-size:12.5px;color:${formKategori === 'KMM' ? '#be185d' : 'var(--text)'};">
            <input type="radio" name="prokerInputKategori" value="KMM" ${formKategori === 'KMM' ? 'checked' : ''} style="accent-color:#db2777;" />
            <span class="material-symbols-outlined" style="font-size:17px;">diversity_3</span>
            Bidang KMM (9 Divisi)
          </label>
        </div>
      </div>

      <!-- 1. PIC Bidang Penanggung Jawab di Atas -->
      <div style="background:var(--bg);padding:12px 14px;border:1px solid var(--border);border-radius:10px;">
        <label id="lblProkerPicText" style="font-size:11.5px;font-weight:800;color:var(--blue-dark);margin-bottom:6px;display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">badge</span>
          ${formKategori === 'KMM' ? 'SUB-BIDANG / DIVISI KMM *' : 'BIDANG PENANGGUNG JAWAB (PIC) *'}
        </label>
        <select id="prokerInputPic" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-weight:700;background:var(--surface);color:var(--text);outline:none;">
          ${initialPicOptions}
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

  // Dinamis: Ketika user mengubah kategori PPG / KMM di form modal
  const catRadios = modalBody.querySelectorAll('input[name="prokerInputKategori"]');
  catRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const selectedCat = e.target.value;
      const selectPic = document.getElementById('prokerInputPic');
      const lblPic = document.getElementById('lblProkerPicText');
      const inputNo = document.getElementById('prokerInputNo');

      if (selectPic && lblPic) {
        lblPic.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">badge</span> ${selectedCat === 'KMM' ? 'SUB-BIDANG / DIVISI KMM *' : 'BIDANG PENANGGUNG JAWAB (PIC) *'}`;
        selectPic.innerHTML = getPicOptionsHtml(selectedCat);
      }

      if (!isEdit && inputNo) {
        inputNo.value = getNextNoForCat(selectedCat);
      }
    });
  });

  // Auto Format Date Picker
  const pStart = document.getElementById('prokerPickerStart');
  const pEnd = document.getElementById('prokerPickerEnd');
  const pWaktu = document.getElementById('prokerInputWaktu');

  function syncDateRangeText() {
    if (pStart.value || pEnd.value) {
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
    renderProkerModal('all', 'all', '', 'timeline', 1, false, currentActiveKategori);
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
              const picVal = clean(cols[7]);
              const isKmmRow = DAFTAR_SUB_BIDANG_KMM.some(sb => picVal.toLowerCase().includes(sb.toLowerCase())) || picVal.toLowerCase().includes('kmm');
              const subB = isKmmRow ? (DAFTAR_SUB_BIDANG_KMM.find(sb => picVal.toLowerCase().includes(sb.toLowerCase())) || 'Umum') : '';

              await addProker({
                kegiatan: clean(cols[0]),
                waktu: clean(cols[1]),
                sasaran: clean(cols[2]),
                tujuan: clean(cols[3]),
                rincianBiaya: clean(cols[4]),
                estBiaya: parseInt(clean(cols[5])) || 0,
                tempat: clean(cols[6]),
                penanggungJawab: isKmmRow ? `KMM - ${subB}` : picVal,
                kategori: isKmmRow ? 'KMM' : 'PPG',
                subBidang: subB,
                status: 'planned',
                targetWilayah: 'Daerah Solo Selatan'
              });
              count++;
            }
          }
          alert('Berhasil mengimpor ' + count + ' program kerja!');
          renderProkerModal('all', 'all', '', 'timeline', 1, false, currentActiveKategori);
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

    const selectedKategori = document.querySelector('input[name="prokerInputKategori"]:checked')?.value || formKategori;
    const rawPic = document.getElementById('prokerInputPic').value.trim();
    let subBidang = '';
    let penanggungJawab = rawPic;

    if (selectedKategori === 'KMM') {
      subBidang = rawPic;
      penanggungJawab = `KMM - ${rawPic}`;
    }

    const prokerDataPayload = {
      no: document.getElementById('prokerInputNo').value,
      kategori: selectedKategori,
      subBidang,
      penanggungJawab,
      kegiatan: document.getElementById('prokerInputKegiatan').value.trim(),
      waktu: document.getElementById('prokerInputWaktu').value.trim(),
      tempat: document.getElementById('prokerInputTempat').value.trim(),
      sasaran: document.getElementById('prokerInputSasaran').value.trim(),
      tujuan: document.getElementById('prokerInputTujuan').value.trim(),
      rincianBiaya: document.getElementById('prokerInputRincianBiaya').value.trim(),
      estBiaya: document.getElementById('prokerInputEstBiaya').value,
      status: document.getElementById('prokerInputStatus').value,
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

    currentActiveKategori = selectedKategori;
    renderProkerModal('all', 'all', '', 'timeline', 1, false, selectedKategori);
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
              ${item.kategori === 'KMM' ? `
                <span class="proker-sub-badge-kmm" style="font-size:10px;padding:2px 7px;">
                  <span class="material-symbols-outlined" style="font-size:12px;">diversity_3</span>
                  Divisi ${item.subBidang || 'Umum'}
                </span>
                <span class="proker-meta-sep">&bull;</span>
              ` : `
                <span class="proker-pic-pill" style="font-size:10px;padding:2px 7px;">
                  ${item.penanggungJawab || 'PPG'}
                </span>
                <span class="proker-meta-sep">&bull;</span>
              `}
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