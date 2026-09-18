/* ═══════════════════════════════════════════════════════════════
   dashboard-generus.js — Database Generus, Rincian Jenjang & Kenaikan
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getAllKelompok,
  getSiswaList,
  addSiswa,
  updateSiswa,
  deleteSiswa,
  calculateUmur,
  isSiswaAktif,
  determineJenjangByAge,
  naikkanJenjangSatuTingkat,
  autoPromoteAllSiswa
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  closeModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js';

/* ═══════════════════════════════════════════════════════════════════════════
   DATABASE GENERUS MODULE (SISWA)
   ═══════════════════════════════════════════════════════════════════════════ */

export const JENJANG_CONFIG = {
  caberawit: {
    id: 'caberawit',
    label: '🌱 Caberawit (Usia Dini / PAUD - SD)',
    badge: 'Caberawit',
    color: '#d97706',
    bg: '#fef3c7',
    kelas: ['PAUD', 'TK A', 'TK B', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD']
  },
  gp_reguler: {
    id: 'gp_reguler',
    label: '📚 GP Reguler (Remaja Awal / SMP - SMA)',
    badge: 'GP Reguler',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    kelas: ['1 SMP', '2 SMP', '3 SMP', '1 SMA', '2 SMA', '3 SMA']
  },
  remaja: {
    id: 'remaja',
    label: '🎓 Remaja & Dewasa (Muda-Mudi & Pra-Nikah)',
    badge: 'Remaja',
    color: '#7c3aed',
    bg: '#f3e8ff',
    kelas: ['Mahasiswa', 'Bekerja', 'Kelas Remaja', 'Pra-Nikah', 'Lainnya']
  }
};

export function getKelasFilterOptions(selectedJenjang, selectedKelas = 'all') {
  let classes = [];
  let defaultLabel = 'Semua Kelas / Status';
  if (selectedJenjang === 'caberawit') {
    classes = JENJANG_CONFIG.caberawit.kelas;
    defaultLabel = 'Caberawit (PAUD - SD)';
  } else if (selectedJenjang === 'gp_reguler') {
    classes = JENJANG_CONFIG.gp_reguler.kelas;
    defaultLabel = 'GP (SMP - SMA)';
  } else if (selectedJenjang === 'remaja') {
    classes = JENJANG_CONFIG.remaja.kelas;
    defaultLabel = 'Remaja / Dewasa';
  } else {
    classes = [
      ...JENJANG_CONFIG.caberawit.kelas,
      ...JENJANG_CONFIG.gp_reguler.kelas,
      ...JENJANG_CONFIG.remaja.kelas
    ];
    classes = [...new Set(classes)];
  }

  return `<option value="all">-- ${defaultLabel} --</option>` +
    classes.map(k => `<option value="${k}" ${selectedKelas === k ? 'selected' : ''}>${k}</option>`).join('');
}

export function updateDashboardStats() {
  const allList = getSiswaList();
  // Hanya generus dengan status 'Sambung' yang dihitung aktif
  const list = allList.filter(isSiswaAktif);
  const total = list.length;
  const caberawitCount = list.filter(s => s.kategori_usia === 'caberawit').length;
  const gpCount = list.filter(s => s.kategori_usia === 'gp_reguler').length;
  const remajaCount = list.filter(s => s.kategori_usia === 'remaja').length;

  const elTotal = document.getElementById('statTotal');
  const elCaberawit = document.getElementById('statCaberawit');
  const elGp = document.getElementById('statGp');
  const elRemaja = document.getElementById('statRemaja');

  if (elTotal) elTotal.textContent = total.toLocaleString('id-ID');
  if (elCaberawit) elCaberawit.textContent = caberawitCount.toLocaleString('id-ID');
  if (elGp) elGp.textContent = gpCount.toLocaleString('id-ID');
  if (elRemaja) elRemaja.textContent = remajaCount.toLocaleString('id-ID');
}

export function renderDetailRingkasanModal(activeKat = 'all') {
  const allSiswa = getSiswaList();

  const activeSiswa = allSiswa.filter(isSiswaAktif);
  const nonAktifCount = allSiswa.length - activeSiswa.length;
  const caberawitSiswa = activeSiswa.filter(s => s.kategori_usia === 'caberawit');
  const gpSiswa = activeSiswa.filter(s => s.kategori_usia === 'gp_reguler');
  const remajaSiswa = activeSiswa.filter(s => s.kategori_usia === 'remaja');

  function getStatsForList(list) {
    const total = list.length;
    const l = list.filter(s => s.jenis_kelamin === 'L').length;
    const p = list.filter(s => s.jenis_kelamin === 'P').length;
    return { total, l, p };
  }

  // Categories config
  const categories = [
    {
      key: 'all',
      title: 'Semua Kategori Generus',
      icon: 'groups',
      color: '#1a56c4',
      bg: '#e8f0fd',
      list: activeSiswa,
      desc: 'Ringkasan komprehensif seluruh generasi penerus aktif (status Sambung) PPG Solo Selatan'
    },
    {
      key: 'caberawit',
      title: 'Caberawit (PAUD - SD)',
      icon: 'child_care',
      color: '#d97706',
      bg: '#fef3c7',
      list: caberawitSiswa,
      classes: JENJANG_CONFIG.caberawit.kelas,
      desc: 'Pembiasaan karakter ibadah sejak usia dini'
    },
    {
      key: 'gp_reguler',
      title: 'GP Reguler (SMP - SMA)',
      icon: 'school',
      color: '#1a56c4',
      bg: '#e8f0fd',
      list: gpSiswa,
      classes: JENJANG_CONFIG.gp_reguler.kelas,
      desc: 'Generasi penerus usia sekolah menengah & pembentukan karakter mandiri'
    },
    {
      key: 'remaja',
      title: 'Remaja & Pra-Nikah',
      icon: 'diversity_3',
      color: '#7c3aed',
      bg: '#f3e8ff',
      list: remajaSiswa,
      classes: JENJANG_CONFIG.remaja.kelas,
      desc: 'Muda-mudi mandiri, mahasiswa, pekerja, dan pembekalan pra-nikah'
    }
  ];

  const currentCat = categories.find(c => c.key === activeKat) || categories[0];
  const catStats = getStatsForList(currentCat.list);

  // Nav tabs inside modal
  const navTabsHtml = `
    <div style="display:flex;gap:6px;overflow-x:auto;border-bottom:2px solid var(--border);padding-bottom:10px;margin-bottom:14px;">
      ${categories.map(c => `
        <button type="button" class="btn-tab-ringkasan" data-cat="${c.key}" style="padding:8px 14px;border-radius:8px;border:1.5px solid ${c.key === activeKat ? c.color : 'transparent'};background:${c.key === activeKat ? c.bg : '#f8fafc'};color:${c.key === activeKat ? c.color : 'var(--text-muted)'};font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s;">
          <span class="material-symbols-outlined" style="font-size:16px;">${c.icon}</span>
          ${c.title.split('(')[0].trim()} (${c.list.length})
        </button>
      `).join('')}
    </div>
  `;

  // Overview banner
  const overviewBannerHtml = `
    <div style="background:linear-gradient(135deg, ${currentCat.bg} 0%, #ffffff 100%);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
      <div>
        <div style="font-size:11px;font-weight:800;color:${currentCat.color};text-transform:uppercase;letter-spacing:0.5px;">Ringkasan Data Generus Aktif (Sambung)</div>
        <h3 style="margin:2px 0 4px;font-size:16px;font-weight:800;color:var(--text);">${currentCat.title}</h3>
        <p style="margin:0;font-size:11.5px;color:var(--text-muted);">${currentCat.desc}</p>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:900;color:${currentCat.color};">${catStats.total} <span style="font-size:13px;font-weight:600;color:var(--text-muted);">Generus Aktif</span></div>
          <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);">
            <span style="color:#1d4ed8;">👦 ${catStats.l} Putra</span> &bull; <span style="color:#be185d;">👧 ${catStats.p} Putri</span>
          </div>
          ${nonAktifCount > 0 && activeKat === 'all' ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px;">(Tersimpan ${nonAktifCount} non-aktif: Pindah/Menikah)</div>` : ''}
        </div>
      </div>
    </div>
  `;

  // Detailed breakdowns
  let detailContentHtml = '';

  if (activeKat === 'all') {
    // Show 3 Category Breakdown Cards
    detailContentHtml = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;">
        ${categories.filter(c => c.key !== 'all').map(c => {
      const s = getStatsForList(c.list);
      const pct = activeSiswa.length > 0 ? ((c.list.length / activeSiswa.length) * 100).toFixed(1) : 0;
      return `
            <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="background:${c.bg};color:${c.color};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
                    <span class="material-symbols-outlined" style="font-size:14px;">${c.icon}</span> ${c.title.split('(')[0]}
                  </span>
                  <span style="font-size:12px;font-weight:800;color:${c.color};">${pct}%</span>
                </div>
                <div style="font-size:20px;font-weight:900;color:var(--text);">${s.total} Generus</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">👦 ${s.l} Putra &bull; 👧 ${s.p} Putri</div>
                <div style="margin-top:8px;font-size:11px;color:var(--text);display:flex;flex-wrap:wrap;gap:4px;">
                  ${c.classes.map(cls => {
        const cnt = c.list.filter(item => item.jenjang_kelas === cls).length;
        return `<span style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-weight:600;">${cls}: <strong>${cnt}</strong></span>`;
      }).join('')}
                </div>
              </div>
              <button type="button" class="btn-drildown-kat" data-cat="${c.key}" style="padding:6px 12px;background:${c.bg};color:${c.color};border:1px solid ${c.color};border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                Lihat Rincian Lengkap Kelas
                <span class="material-symbols-outlined" style="font-size:15px;">arrow_forward</span>
              </button>
            </div>
          `;
    }).join('')}
      </div>
    `;
  } else {
    // Show Classes Breakdown for specific Category
    const classes = currentCat.classes || [];
    detailContentHtml = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);">Rincian Data Berdasarkan Jenjang / Kelas (${classes.length} Tingkat)</h4>
          <span style="font-size:11px;color:var(--text-muted);">Klik tombol pada tiap kelas untuk melihat data di database</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
          ${classes.map(cls => {
      const inClass = currentCat.list.filter(s => s.jenjang_kelas === cls);
      const inL = inClass.filter(s => s.jenis_kelamin === 'L').length;
      const inP = inClass.filter(s => s.jenis_kelamin === 'P').length;

      // Sebaran Desa
      const desaCounts = MASTER_WILAYAH.desa.map(d => ({
        nama: d.nama,
        count: inClass.filter(s => s.desa_id === d.id).length
      })).filter(x => x.count > 0);

      return `
              <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:800;font-size:13px;color:var(--text);">${cls}</span>
                    <span style="font-size:13px;font-weight:900;color:${currentCat.color};">${inClass.length} Generus</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);margin:2px 0 6px;">
                    <span style="color:#1d4ed8;">👦 ${inL} L</span> &bull; <span style="color:#be185d;">👧 ${inP} P</span>
                  </div>
                  <div style="font-size:10.5px;color:var(--text-muted);background:#f8fafc;padding:6px 8px;border-radius:6px;border:1px solid #f1f5f9;">
                    <span style="font-weight:700;display:block;margin-bottom:2px;">Sebaran Desa:</span>
                    ${desaCounts.length > 0 ? desaCounts.map(dc => `${dc.nama}: <strong>${dc.count}</strong>`).join(', ') : 'Belum ada data'}
                  </div>
                </div>
                <button type="button" class="btn-filter-ke-database" data-jenjang="${currentCat.key}" data-kelas="${cls}" style="padding:6px 10px;background:#f8fafc;color:var(--blue);border:1px solid #cbd5e1;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">filter_alt</span>
                  Buka Data di Database
                </button>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  // Distribution across 5 Desas
  const desaDistHtml = `
    <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;">
      <h4 style="margin:0 0 8px;font-size:12.5px;font-weight:800;color:var(--text);">
        Sebaran Generus di 5 Desa Solo Selatan (${currentCat.title.split('(')[0].trim()})
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px;">
        ${MASTER_WILAYAH.desa.map(d => {
    const inDesa = currentCat.list.filter(s => s.desa_id === d.id || (s.desa_nama && d.nama && s.desa_nama.toLowerCase() === d.nama.toLowerCase()));
    return `
            <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:8px 10px;">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;">Desa ${d.nama}</div>
              <div style="font-size:15px;font-weight:900;color:var(--text);margin:2px 0;">${inDesa.length} <span style="font-size:10px;font-weight:600;color:var(--text-muted);">Generus</span></div>
              <div style="font-size:10px;color:var(--text-muted);">${d.kelompok.length} Kelompok</div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${navTabsHtml}
      ${overviewBannerHtml}
      ${detailContentHtml}
      ${desaDistHtml}
      <div class="modal-sticky-footer" style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
        <button type="button" class="btn-cancel-modal px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          Tutup
        </button>
        <button type="button" id="btnBukaSeluruhDatabase" style="padding:9px 18px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(26,86,196,0.25);">
          <span class="material-symbols-outlined" style="font-size:16px;">database</span>
          Buka Database Generus Lengkap
        </button>
      </div>
    </div>
  `;

  openModal(`Rincian Ringkasan: ${currentCat.title.split('(')[0]}`, currentCat.icon, modalHtml, 'large');

  // Tab switchers
  document.querySelectorAll('.btn-tab-ringkasan').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      renderDetailRingkasanModal(cat);
    });
  });

  // Drilldown from all tab
  document.querySelectorAll('.btn-drildown-kat').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      renderDetailRingkasanModal(cat);
    });
  });

  // Filter ke database from class button
  document.querySelectorAll('.btn-filter-ke-database').forEach(btn => {
    btn.addEventListener('click', () => {
      const jenjang = btn.dataset.jenjang;
      const kelas = btn.dataset.kelas;
      currentSiswaFilter.jenjang = jenjang;
      currentSiswaFilter.kelas = kelas;
      currentSiswaFilter.desa = 'all';
      currentSiswaFilter.kelompok = 'all';
      currentSiswaFilter.search = '';
      siswaCurrentPage = 1;
      renderSiswaModal();
    });
  });

  // Buka seluruh database
  document.getElementById('btnBukaSeluruhDatabase')?.addEventListener('click', () => {
    currentSiswaFilter.jenjang = activeKat === 'all' ? 'all' : activeKat;
    currentSiswaFilter.kelas = 'all';
    currentSiswaFilter.desa = 'all';
    currentSiswaFilter.kelompok = 'all';
    currentSiswaFilter.search = '';
    siswaCurrentPage = 1;
    renderSiswaModal();
  });

  document.querySelector('.btn-cancel-modal')?.addEventListener('click', closeModal);
}

let currentSiswaFilter = { search: '', desa: 'all', kelompok: 'all', jenjang: 'all', kelas: 'all', status: 'all' };
let currentSiswaSort = { key: 'nama_lengkap', dir: 'asc' };
if (typeof window !== 'undefined') window.sortSiswa = (key) => {
  if (currentSiswaSort.key === key) {
    currentSiswaSort.dir = currentSiswaSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSiswaSort.key = key;
    currentSiswaSort.dir = 'asc';
  }
  import('./dashboard-generus.js').then(m => m.renderSiswaTableRows());
};

export function renderSiswaModal() {
  updateDashboardStats();
  const allList = getSiswaList();
  const activeCount = allList.filter(isSiswaAktif).length;
  const nonAktifCount = allList.length - activeCount;
  const pindahCount = allList.filter(s => s.status_sambung === 'Pindah Sambung').length;
  const nikahCount = allList.filter(s => s.status_sambung === 'Menikah').length;
  const totalCount = allList.length;

  // Desa Options
  const desaOptions = MASTER_WILAYAH.desa.map(d =>
    `<option value="${d.id}" ${currentSiswaFilter.desa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`
  ).join('');

  // Kelompok Options (Filtered by Desa if selected)
  let kels = getAllKelompok();
  if (currentSiswaFilter.desa !== 'all') {
    kels = kels.filter(k => k.desaId === currentSiswaFilter.desa);
  }
  const kelOptions = kels.map(k =>
    `<option value="${k.id}" ${currentSiswaFilter.kelompok === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`
  ).join('');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- HIGHLIGHT KHUSUS: FILTER MULTI-LEVEL JENJANG GENERUS -->
      <div class="filter-jenjang-card-highlight">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <div class="filter-jenjang-title">
            <span class="material-symbols-outlined" style="font-size:16px;">filter_alt</span>
            Filter Kategori Jenjang &amp; Kelas
          </div>
          <div id="badgeJenjangFilterStatus" style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;background:#dbeafe;color:#1d4ed8;display:none;align-items:center;gap:2px;">
            <span class="material-symbols-outlined" style="font-size:13px;">check</span> <span id="textJenjangFilterStatus">Semua Jenjang</span>
          </div>
        </div>

        <div class="filter-jenjang-grid">
          <div>
            <label class="filter-jenjang-label">
              1. Kategori Jenjang Usia:
            </label>
            <select id="filterSiswaJenjang" class="filter-jenjang-select">
              <option value="all">🌟 Jenjang Usia</option>
              <option value="caberawit" ${currentSiswaFilter.jenjang === 'caberawit' ? 'selected' : ''}>🌱 Caberawit</option>
              <option value="gp_reguler" ${currentSiswaFilter.jenjang === 'gp_reguler' ? 'selected' : ''}>📚 GP Reguler</option>
              <option value="remaja" ${currentSiswaFilter.jenjang === 'remaja' ? 'selected' : ''}>🎓 Remaja &amp; Dewasa</option>
            </select>
          </div>

          <div>
            <label class="filter-jenjang-label">
              2. Tingkat / Kelas Terpilih:
            </label>
            <select id="filterSiswaKelas" class="filter-jenjang-select">
              ${getKelasFilterOptions(currentSiswaFilter.jenjang, currentSiswaFilter.kelas)}
            </select>
          </div>
        </div>
      </div>

      <!-- BAR AKSI HAPUS CEPAT CHECKLIST -->
      <div id="bulkActionSiswaBar" class="bulk-action-bar" style="display:none;">
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:12.5px;">
          <span class="material-symbols-outlined" style="font-size:20px;color:#dc2626;">checklist</span>
          <span id="selectedSiswaCountText">0 generus terpilih</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" id="btnBatalPilihSiswa" class="btn-batal-pilih" style="padding:6px 14px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;">
            Batal Pilih
          </button>
          <button type="button" id="btnBulkHapusSiswa" style="background:#dc2626;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-size:11.5px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(220,38,38,0.3);">
            <span class="material-symbols-outlined" style="font-size:16px;">delete_sweep</span>
            Hapus Terpilih
          </button>
        </div>
      </div>

      <!-- FILTER PENCARIAN & WILAYAH (DESA / KELOMPOK / STATUS SAMBUNG) -->
      <div class="filter-wilayah-box">
        <!-- BARIS 1: SEARCH BAR -->
        <div class="filter-wilayah-row-1">
          <input type="text" id="inputSiswaSearch" class="filter-wilayah-input" value="${currentSiswaFilter.search}" placeholder="🔍 Cari nama / NIS..." />
          <span class="material-symbols-outlined filter-search-icon">search</span>
        </div>

        <!-- BARIS 2: 3 FILTER (DESA, KELOMPOK, STATUS) -->
        <div class="filter-wilayah-row-2">
          <div class="filter-wilayah-col">
            <select id="filterSiswaDesa" class="filter-wilayah-select">
              <option value="all">Desa</option>
              ${desaOptions}
            </select>
          </div>
          <div class="filter-wilayah-col">
            <select id="filterSiswaKelompok" class="filter-wilayah-select">
              <option value="all">Kelompok</option>
              ${kelOptions}
            </select>
          </div>
          <div class="filter-wilayah-col">
            <select id="filterSiswaStatus" class="filter-wilayah-select">
              <option value="all" ${currentSiswaFilter.status === 'all' ? 'selected' : ''}>Status (${totalCount})</option>
              <option value="Sambung" ${currentSiswaFilter.status === 'Sambung' ? 'selected' : ''}>🟢 Sambung (${activeCount})</option>
              <option value="Pindah Sambung" ${currentSiswaFilter.status === 'Pindah Sambung' ? 'selected' : ''}>🚚 Pindah (${pindahCount})</option>
              <option value="Menikah" ${currentSiswaFilter.status === 'Menikah' ? 'selected' : ''}>💍 Menikah (${nikahCount})</option>
            </select>
          </div>
        </div>

        <!-- BARIS 3: ICON TOMBOL SESUAI PERUBAHAN MOBILE -->
        <div class="filter-wilayah-row-3">
          <button type="button" id="btnExportCsvGenerus" class="btn-export-csv" title="Download data dalam format Excel CSV">
            <span class="material-symbols-outlined" style="font-size:18px;color:var(--green, #10b981);">file_download</span>
            <span class="btn-label-text">Export CSV</span>
          </button>
          <input type="file" id="inputImportCsvGenerus" accept=".csv" style="display:none;" />
          <button type="button" id="btnImportCsvGenerus" class="btn-import-csv" title="Import data dari format Excel CSV">
            <span class="material-symbols-outlined" style="font-size:18px;">upload</span>
            <span class="btn-label-text">Import CSV</span>
          </button>

          <button type="button" id="btnAutoPromoteJenjang" class="btn-auto-promote" title="Kenaikan Jenjang Otomatis Sesuai Usia atau Pergantian Tahun Ajaran">
            <span class="material-symbols-outlined" style="font-size:18px;">auto_mode</span>
            <span class="btn-label-text">Kenaikan Jenjang</span>
          </button>
          <button type="button" id="btnTambahSiswaBaru" class="btn-tambah-siswa" title="Tambah Data Generus Baru">
            <span class="material-symbols-outlined" style="font-size:18px;">person_add</span>
            <span>Tambah Generus</span>
          </button>
        </div>
      </div>

      <!-- DESKTOP TABLE VIEW (MD UP) -->
      <div class="siswa-desktop-table proker-table-wrap">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead class="siswa-table-head" style="position:sticky;top:0;z-index:10;">
            <tr>
              <th style="padding:10px 8px;text-align:center;width:38px;">
                <input type="checkbox" id="checkAllSiswa" title="Pilih Semua di Halaman Ini" style="cursor:pointer;width:15px;height:15px;accent-color:#2563eb;" />
              </th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;">Aksi</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;">No</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('nama_lengkap')">Nama Lengkap ↕️</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('tempat_lahir')">Tempat Lahir ↕️</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('tanggal_lahir')">Tgl Lahir ↕️</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('desa_id')">Desa ↕️</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('kelompok_id')">Kelompok ↕️</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('usia')">Usia ↕️</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('jenis_kelamin')">L/P ↕️</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('kategori_usia')">Jenjang &amp; Kelas ↕️</th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;">No. HP</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;">Domisili</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('status_sambung')">Status ↕️</th>
            </tr>
          </thead>
          <tbody id="siswaTableBody">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>

      <!-- MOBILE ACCORDION CARD VIEW (SMARTPHONES) -->
      <div class="siswa-mobile-container">
        <div class="siswa-mobile-select-all-bar">
          <label style="display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;cursor:pointer;">
            <input type="checkbox" id="checkAllSiswaMobile" style="width:17px;height:17px;cursor:pointer;accent-color:#2563eb;" />
            <span>Pilih Semua di Halaman Ini</span>
          </label>
          <span id="mobilePagingIndicator" style="font-size:11px;font-weight:700;color:var(--text-muted);"></span>
        </div>
        <div id="siswaMobileList">
          <!-- Rendered via JS -->
        </div>
      </div>

      <!-- PAGINATION BAR -->
      <div id="siswaPaginationWrap" class="pagination-wrap"></div>
    </div>
  `;

  openModal(`Database Generus (${activeCount} Aktif / ${totalCount} Total)`, 'database', modalHtml, 'wide');

  // Attach Filter Listeners
  document.getElementById('inputSiswaSearch').addEventListener('input', (e) => {
    currentSiswaFilter.search = e.target.value;
    siswaCurrentPage = 1;
    renderSiswaTableRows();
  });
  document.getElementById('filterSiswaDesa').addEventListener('change', (e) => {
    currentSiswaFilter.desa = e.target.value;
    currentSiswaFilter.kelompok = 'all'; // Reset kelompok when desa changes
    siswaCurrentPage = 1;
    renderSiswaModal(); // Re-render to update kelompok dropdown
  });
  document.getElementById('filterSiswaKelompok').addEventListener('change', (e) => {
    currentSiswaFilter.kelompok = e.target.value;
    siswaCurrentPage = 1;
    renderSiswaTableRows();
  });
  document.getElementById('filterSiswaStatus')?.addEventListener('change', (e) => {
    currentSiswaFilter.status = e.target.value;
    siswaCurrentPage = 1;
    renderSiswaTableRows();
  });

  const filterJenjangEl = document.getElementById('filterSiswaJenjang');
  const filterKelasEl = document.getElementById('filterSiswaKelas');
  const badgeStatusEl = document.getElementById('badgeJenjangFilterStatus');
  const textStatusEl = document.getElementById('textJenjangFilterStatus');

  function updateBadgeJenjangStatus() {
    if (!badgeStatusEl || !textStatusEl) return;
    if (currentSiswaFilter.jenjang === 'all' && currentSiswaFilter.kelas === 'all') {
      badgeStatusEl.style.display = 'none';
    } else {
      badgeStatusEl.style.display = 'inline-flex';
      let label = 'Semua Jenjang';
      if (currentSiswaFilter.jenjang === 'caberawit') label = 'Caberawit';
      else if (currentSiswaFilter.jenjang === 'gp_reguler') label = 'GP Reguler';
      else if (currentSiswaFilter.jenjang === 'remaja') label = 'Remaja';

      if (currentSiswaFilter.kelas !== 'all') {
        label += ` (${currentSiswaFilter.kelas})`;
      }
      textStatusEl.textContent = label;
    }
  }

  filterJenjangEl?.addEventListener('change', (e) => {
    currentSiswaFilter.jenjang = e.target.value;
    currentSiswaFilter.kelas = 'all';
    siswaCurrentPage = 1;
    if (filterKelasEl) {
      filterKelasEl.innerHTML = getKelasFilterOptions(currentSiswaFilter.jenjang, 'all');
    }
    updateBadgeJenjangStatus();
    renderSiswaTableRows();
  });

  filterKelasEl?.addEventListener('change', (e) => {
    currentSiswaFilter.kelas = e.target.value;
    siswaCurrentPage = 1;
    updateBadgeJenjangStatus();
    renderSiswaTableRows();
  });

  updateBadgeJenjangStatus();

  document.getElementById('btnAutoPromoteJenjang')?.addEventListener('click', () => {
    renderAutoPromoteModal();
  });

  document.getElementById('btnTambahSiswaBaru').addEventListener('click', () => {
    renderSiswaFormModal(null);
  });

  // CSV Export & Import Logic
  document.getElementById('btnExportCsvGenerus')?.addEventListener('click', () => {
    const allSiswa = getSiswaList();
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "NAMA_LENGKAP;TEMPAT_LAHIR;TANGGAL_LAHIR;JENIS_KELAMIN;KATEGORI_USIA;JENJANG_KELAS;NAMA_AYAH;NAMA_IBU;NO_HP;DOMISILI;STATUS_SAMBUNG\n";

    allSiswa.forEach(s => {
      const clean = (str) => '"' + (str || '').toString().replace(/"/g, '""') + '"';
      csvContent += `${clean(s.nama_lengkap)};${clean(s.tempat_lahir)};${clean(s.tanggal_lahir)};${clean(s.jenis_kelamin)};${clean(s.kategori_usia)};${clean(s.jenjang_kelas)};${clean(s.nama_ayah)};${clean(s.nama_ibu)};${clean(s.no_hp)};${clean(s.domisili)};${clean(s.status_sambung)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Generus_PPG_Solo_Selatan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  const fileInput = document.getElementById('inputImportCsvGenerus');
  document.getElementById('btnImportCsvGenerus')?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 1) {
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(';');
          if (cols.length >= 11) {
            const clean = (str) => str ? str.replace(/(^"|"$)/g, '').trim() : '';
            if (clean(cols[0])) {
              addSiswa({
                nama_lengkap: clean(cols[0]),
                tempat_lahir: clean(cols[1]),
                tanggal_lahir: clean(cols[2]),
                jenis_kelamin: clean(cols[3]) || 'L',
                kategori_usia: clean(cols[4]),
                jenjang_kelas: clean(cols[5]),
                nama_ayah: clean(cols[6]),
                nama_ibu: clean(cols[7]),
                no_hp: clean(cols[8]),
                domisili: clean(cols[9]),
                status_sambung: clean(cols[10]) || 'Sambung',
                desa_id: currentSiswaFilter.desa !== 'all' ? currentSiswaFilter.desa : null,
                kelompok_id: currentSiswaFilter.kelompok !== 'all' ? currentSiswaFilter.kelompok : null
              });
              count++;
            }
          }
        }
        alert('Berhasil mengimpor ' + count + ' data generus!');
        renderSiswaModal();
      } else {
        alert('Format CSV kosong atau tidak valid.');
      }
    };
    reader.readAsText(file);
  });

  // Initial render of rows
  renderSiswaTableRows();
}

/**
 * Modal Interaktif untuk Kenaikan Jenjang Otomatis
 * Mode 1: Berdasarkan Usia Terkini (Real-time Age dari Tanggal Lahir)
 * Mode 2: Kenaikan Kelas Tahunan (Tahun Ajaran Baru / +1 Tingkat)
 */
export function renderAutoPromoteModal() {
  const allList = getSiswaList();
  const activeSiswa = allList.filter(isSiswaAktif);
  let selectedMode = 'age'; // 'age' or 'annual_step'

  function calculatePreview(mode) {
    const changes = [];
    activeSiswa.forEach(s => {
      let targetKat = s.kategori_usia;
      let targetKelas = s.jenjang_kelas;

      if (mode === 'age') {
        if (s.tanggal_lahir) {
          const res = determineJenjangByAge(s.tanggal_lahir, s.jenjang_kelas);
          targetKat = res.kategori_usia;
          targetKelas = res.jenjang_kelas;
        }
      } else if (mode === 'annual_step') {
        const res = naikkanJenjangSatuTingkat(s.jenjang_kelas);
        if (res.berubah) {
          targetKat = res.kategori_usia;
          targetKelas = res.jenjang_kelas;
        }
      }

      if (targetKat !== s.kategori_usia || targetKelas !== s.jenjang_kelas) {
        changes.push({
          siswa: s,
          umur: getUmurNumber(s.tanggal_lahir),
          fromKat: s.kategori_usia,
          fromKelas: s.jenjang_kelas,
          toKat: targetKat,
          toKelas: targetKelas
        });
      }
    });
    return changes;
  }

  function renderContent() {
    const changes = calculatePreview(selectedMode);
    const contentHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
        <div style="background:#f0f7ff;border:1.5px solid #3b82f6;border-radius:10px;padding:12px 14px;color:#1e3a8a;">
          <div style="font-weight:800;font-size:13px;display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="material-symbols-outlined" style="font-size:18px;">auto_mode</span>
            Otomatisasi Penyesuaian Jenjang Generus
          </div>
          <div style="font-size:11.5px;color:#1e40af;line-height:1.5;">
            Fitur ini secara cerdas hanya memproses <strong>${activeSiswa.length} generus aktif</strong> (status Sambung). Generus yang berstatus <em>Menikah</em> atau <em>Pindah Sambung</em> tetap tersimpan utuh dan tidak akan diubah jenjangnya.
          </div>
        </div>

        <!-- PILIHAN MODE OTOMATISASI -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <label style="border:2px solid ${selectedMode === 'age' ? '#2563eb' : 'var(--border)'};background:${selectedMode === 'age' ? '#eff6ff' : '#fff'};padding:12px;border-radius:10px;cursor:pointer;display:flex;flex-direction:column;gap:4px;transition:all 0.15s;">
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="radio" name="optPromoteMode" value="age" ${selectedMode === 'age' ? 'checked' : ''} style="cursor:pointer;" />
              <strong style="color:#1e293b;font-size:12.5px;">1. Berdasarkan Usia Terkini</strong>
            </div>
            <div style="font-size:11px;color:var(--text-muted);padding-left:22px;line-height:1.4;">
              Otomatis menghitung tanggal lahir generus secara real-time dan menyelaraskan ke jenjang PAUD, TK A/B, SD (1–6), SMP (1–3), SMA (1–3), atau Pra-Nikah.
            </div>
          </label>

          <label style="border:2px solid ${selectedMode === 'annual_step' ? '#2563eb' : 'var(--border)'};background:${selectedMode === 'annual_step' ? '#eff6ff' : '#fff'};padding:12px;border-radius:10px;cursor:pointer;display:flex;flex-direction:column;gap:4px;transition:all 0.15s;">
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="radio" name="optPromoteMode" value="annual_step" ${selectedMode === 'annual_step' ? 'checked' : ''} style="cursor:pointer;" />
              <strong style="color:#1e293b;font-size:12.5px;">2. Kenaikan Kelas Tahunan</strong>
            </div>
            <div style="font-size:11px;color:var(--text-muted);padding-left:22px;line-height:1.4;">
              Menaikkan seluruh siswa sekolah 1 tingkat ke atas (+1 kelas / Tahun Ajaran Baru), dari PAUD ➔ TK A ➔ TK B ➔ 1–6 SD ➔ 1–3 SMP ➔ 1–3 SMA ➔ Pra-Nikah.
            </div>
          </label>
        </div>

        <!-- PRATINJAU PERUBAHAN -->
        <div style="border:1.5px solid var(--border);border-radius:10px;overflow:hidden;background:#fff;">
          <div style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:800;font-size:12px;color:var(--text);">
              Pratinjau Kenaikan: <span style="color:#2563eb;font-weight:900;">${changes.length}</span> Generus Mengalami Perubahan
            </div>
            <div style="font-size:11px;color:var(--text-muted);">
              ${changes.length === 0 ? 'Semua data sudah selaras' : 'Data di bawah ini akan disesuaikan'}
            </div>
          </div>

          <div style="max-height:260px;overflow-y:auto;font-size:11.5px;">
            ${changes.length === 0 ? `
              <div style="padding:32px;text-align:center;color:var(--green-dark);">
                <span class="material-symbols-outlined" style="font-size:36px;color:#16a34a;display:block;margin-bottom:6px;">check_circle</span>
                <strong>Semua jenjang generus aktif sudah mutakhir!</strong>
                <p style="margin:4px 0 0;font-size:11px;color:var(--text-muted);">Tidak ada generus yang perlu disesuaikan untuk mode ini saat ini.</p>
              </div>
            ` : `
              <table style="width:100%;border-collapse:collapse;text-align:left;">
                <thead style="background:#f1f5f9;position:sticky;top:0;font-size:11px;color:#475569;">
                  <tr>
                    <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Nama Generus</th>
                    <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">Usia</th>
                    <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Desa / Kelompok</th>
                    <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">Jenjang Asal</th>
                    <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">➔</th>
                    <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">Jenjang Baru</th>
                  </tr>
                </thead>
                <tbody>
                  ${changes.map((c, i) => `
                    <tr style="border-bottom:1px solid #f1f5f9;background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
                      <td style="padding:8px 10px;font-weight:700;color:var(--text);">${c.siswa.nama_lengkap}</td>
                      <td style="padding:8px 10px;text-align:center;font-weight:600;">${c.umur} th</td>
                      <td style="padding:8px 10px;color:var(--text-muted);font-size:11px;">Desa ${c.siswa.desa_nama || '-'} (${c.siswa.kelompok_nama || '-'})</td>
                      <td style="padding:8px 10px;text-align:center;"><span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">${c.fromKelas}</span></td>
                      <td style="padding:8px 10px;text-align:center;color:#64748b;font-weight:900;">➔</td>
                      <td style="padding:8px 10px;text-align:center;"><span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">${c.toKelas}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;gap:10px;">
          <button type="button" id="btnCancelAutoPromote" style="padding:10px 18px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;cursor:pointer;">
            Batal
          </button>
          <button type="button" id="btnExecuteAutoPromote" ${changes.length === 0 ? 'disabled' : ''} style="padding:10px 20px;background:${changes.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'};color:#fff;border:none;border-radius:8px;font-weight:800;cursor:${changes.length === 0 ? 'not-allowed' : 'pointer'};display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(37,99,235,0.3);">
            <span class="material-symbols-outlined" style="font-size:18px;">check_circle</span>
            Terapkan Perubahan (${changes.length} Generus)
          </button>
        </div>
      </div>
    `;

    openModal('Kenaikan & Penyesuaian Jenjang Otomatis', 'auto_mode', contentHtml, 'medium');

    // Radios
    document.querySelectorAll('input[name="optPromoteMode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedMode = e.target.value;
        renderContent();
      });
    });

    document.getElementById('btnCancelAutoPromote')?.addEventListener('click', renderSiswaModal);

    document.getElementById('btnExecuteAutoPromote')?.addEventListener('click', () => {
      const res = autoPromoteAllSiswa({ mode: selectedMode });
      if (res.success) {
        showToast(`Berhasil menyesuaikan jenjang untuk ${res.countChanged} generus aktif!`, 'success');
        updateDashboardStats();
        renderSiswaModal();
      } else {
        showToast('Gagal memproses penyesuaian jenjang.', 'danger');
      }
    });
  }

  renderContent();
}

let selectedSiswaIds = new Set();
let siswaCurrentPage = 1;
let siswaPageSize = 50;

export function renderSiswaTableRows() {
  const tbody = document.getElementById('siswaTableBody');
  const mobileListEl = document.getElementById('siswaMobileList');
  const paginWrap = document.getElementById('siswaPaginationWrap');
  const bulkBar = document.getElementById('bulkActionSiswaBar');
  const countText = document.getElementById('selectedSiswaCountText');
  const checkAllEl = document.getElementById('checkAllSiswa');
  const checkAllMobileEl = document.getElementById('checkAllSiswaMobile');
  const mobilePagingInd = document.getElementById('mobilePagingIndicator');
  if (!tbody && !mobileListEl) return;

  const rawList = getSiswaList();

  const filtered = rawList.filter(s => {
    if (currentSiswaFilter.status !== 'all' && s.status_sambung !== currentSiswaFilter.status) return false;
    if (currentSiswaFilter.desa !== 'all' && s.desa_id !== currentSiswaFilter.desa) return false;
    if (currentSiswaFilter.kelompok !== 'all' && s.kelompok_id !== currentSiswaFilter.kelompok) return false;
    if (currentSiswaFilter.jenjang !== 'all' && s.kategori_usia !== currentSiswaFilter.jenjang) return false;
    if (currentSiswaFilter.kelas !== 'all' && s.jenjang_kelas !== currentSiswaFilter.kelas) return false;
    if (currentSiswaFilter.search) {
      const q = currentSiswaFilter.search.toLowerCase();
      if (!(s.nama_lengkap.toLowerCase().includes(q) || (s.nis || '').includes(q))) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    let valA = a[currentSiswaSort.key] || '';
    let valB = b[currentSiswaSort.key] || '';
    if (currentSiswaSort.key === 'usia') {
      valA = calculateUmur(a.tanggal_lahir);
      valB = calculateUmur(b.tanggal_lahir);
    }
    if (valA < valB) return currentSiswaSort.dir === 'asc' ? -1 : 1;
    if (valA > valB) return currentSiswaSort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / siswaPageSize));
  if (siswaCurrentPage > totalPages) siswaCurrentPage = 1;

  if (mobilePagingInd) {
    mobilePagingInd.textContent = `Hal. ${siswaCurrentPage} / ${totalPages} (${totalFiltered} total)`;
  }

  if (totalFiltered === 0) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="14" style="padding:28px;text-align:center;color:var(--text-muted);font-size:13px;">Tidak ada data generus yang sesuai filter pencarian / jenjang / status.</td></tr>`;
    }
    if (mobileListEl) {
      mobileListEl.innerHTML = `<div style="padding:32px 16px;text-align:center;color:var(--text-muted);font-size:13px;">Tidak ada data generus yang sesuai filter pencarian / jenjang / status.</div>`;
    }
    if (paginWrap) paginWrap.innerHTML = '';
    if (checkAllEl) checkAllEl.checked = false;
    if (checkAllMobileEl) checkAllMobileEl.checked = false;
    return;
  }

  const startIndex = (siswaCurrentPage - 1) * siswaPageSize;
  const endIndex = Math.min(startIndex + siswaPageSize, totalFiltered);
  const pagedItems = filtered.slice(startIndex, endIndex);

  // Update check all state for current page
  const allPagedChecked = pagedItems.length > 0 && pagedItems.every(s => selectedSiswaIds.has(s.id));
  if (checkAllEl) checkAllEl.checked = allPagedChecked;
  if (checkAllMobileEl) checkAllMobileEl.checked = allPagedChecked;

  // 1. Render Desktop Table View
  if (tbody) {
    tbody.innerHTML = pagedItems.map((s, idx) => {
      const isChecked = selectedSiswaIds.has(s.id);
      const cfg = JENJANG_CONFIG[s.kategori_usia] || { badge: 'Remaja', bg: '#f3e8ff', color: '#7c3aed' };

      let statusBadge = `<span style="background:var(--green-pastel);color:var(--green-dark);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#16a34a;"></span> Sambung</span>`;
      if (s.status_sambung === 'Menikah') {
        statusBadge = `<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;">💍 Menikah</span>`;
      } else if (s.status_sambung === 'Pindah Sambung') {
        statusBadge = `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;">🚚 Pindah</span>`;
      }

      const tglFormatted = s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      return `
        <tr class="${isChecked ? 'row-selected' : ''}" style="border-bottom:1px solid var(--border);transition:background 0.15s;">
          <td style="padding:8px 8px;text-align:center;">
            <input type="checkbox" class="check-siswa-row" data-id="${s.id}" style="cursor:pointer;width:15px;height:15px;accent-color:#2563eb;" ${isChecked ? 'checked' : ''} />
          </td>
          <td style="padding:8px 12px;text-align:center;white-space:nowrap;">
            <div style="display:inline-flex;gap:4px;align-items:center;">
              <button type="button" class="btn-edit-siswa btn-edit-siswa-action" data-id="${s.id}" title="Edit Data" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;padding:4px 7px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;">
                <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
              </button>
              <button type="button" class="btn-delete-siswa-table btn-delete-siswa-action" data-id="${s.id}" data-nama="${s.nama_lengkap}" title="Hapus Data Generus" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:4px 7px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
              </button>
            </div>
          </td>
          <td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text-muted);font-weight:700;">${startIndex + idx + 1}</td>
          <td style="padding:8px 12px;font-weight:700;min-width:160px;color:var(--text);">${s.nama_lengkap}</td>
          <td style="padding:8px 12px;">${s.tempat_lahir || '-'}</td>
          <td style="padding:8px 12px;white-space:nowrap;font-size:11px;">${tglFormatted}</td>
          <td style="padding:8px 12px;">Desa ${s.desa_nama || '-'}</td>
          <td style="padding:8px 12px;">Kel. ${s.kelompok_nama || '-'}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;">${calculateUmur(s.tanggal_lahir)}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${s.jenis_kelamin === 'L' ? '#1d4ed8' : '#be185d'};">${s.jenis_kelamin}</td>
          <td style="padding:8px 12px;">
            <span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;display:inline-block;">${cfg.badge}</span>
            <span style="display:block;font-size:11px;font-weight:600;margin-top:2px;color:var(--text-muted);">${s.jenjang_kelas}</span>
          </td>
          <td style="padding:8px 12px;font-size:11px;">${s.no_hp || '-'}</td>
          <td style="padding:8px 12px;text-align:center;font-size:11px;">${s.domisili || '-'}</td>
          <td style="padding:8px 12px;text-align:center;">
            ${statusBadge}
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Accordion Cards View
  if (mobileListEl) {
    mobileListEl.innerHTML = pagedItems.map((s) => {
      const isChecked = selectedSiswaIds.has(s.id);
      const cfg = JENJANG_CONFIG[s.kategori_usia] || { badge: 'Remaja', bg: '#f3e8ff', color: '#7c3aed' };

      let statusBadge = `<span style="background:var(--green-pastel);color:var(--green-dark);padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#16a34a;"></span> Sambung</span>`;
      if (s.status_sambung === 'Menikah') {
        statusBadge = `<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;">💍 Menikah</span>`;
      } else if (s.status_sambung === 'Pindah Sambung') {
        statusBadge = `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;">🚚 Pindah</span>`;
      }

      const tglFormatted = s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

      return `
        <div class="siswa-mobile-card ${isChecked ? 'card-selected' : ''}" data-id="${s.id}">
          <!-- Header Bar: Checklist, Nama Generus, Kelompok & Desa, Tombol Dropdown -->
          <div class="siswa-mobile-header">
            <div class="siswa-mobile-info-wrap">
              <input type="checkbox" class="check-siswa-row" data-id="${s.id}" style="cursor:pointer;width:18px;height:18px;accent-color:#2563eb;flex-shrink:0;" ${isChecked ? 'checked' : ''} />
              
              <div class="siswa-mobile-names">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span class="siswa-mobile-name-text">${s.nama_lengkap}</span>
                  <span style="font-size:10px;font-weight:800;padding:1px 6px;border-radius:4px;${s.jenis_kelamin === 'L' ? 'background:#dbeafe;color:#1e40af;' : 'background:#fce7f3;color:#be185d;'}">${s.jenis_kelamin}</span>
                </div>
                <div class="siswa-mobile-sub-text">
                  <span class="material-symbols-outlined" style="font-size:13px;color:var(--blue);">location_on</span>
                  <span>Kel. ${s.kelompok_nama || '-'}</span>
                  <span>•</span>
                  <span>Desa ${s.desa_nama || '-'}</span>
                </div>
              </div>
            </div>

            <!-- Tombol dropdown pada samping nama -->
            <button type="button" class="btn-toggle-siswa-detail" title="Lihat Rincian & Aksi" data-id="${s.id}">
              <span class="material-symbols-outlined" style="font-size:20px;transition:transform 0.2s ease;">expand_more</span>
            </button>
          </div>

          <!-- Rincian Lainnya & Tombol Aksi (Muncul saat dropdown diklik) -->
          <div class="siswa-mobile-detail-panel">
            <div class="siswa-mobile-grid-details">
              <div class="siswa-mobile-detail-item">
                <span class="label">Jenjang &amp; Kelas</span>
                <div class="val" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:2px;">
                  <span style="background:${cfg.bg};color:${cfg.color};padding:1px 6px;border-radius:4px;font-size:9.5px;font-weight:800;">${cfg.badge}</span>
                  <span style="font-size:11px;">${s.jenjang_kelas}</span>
                </div>
              </div>
              <div class="siswa-mobile-detail-item">
                <span class="label">Usia</span>
                <div class="val">${calculateUmur(s.tanggal_lahir)} Tahun</div>
              </div>
              <div class="siswa-mobile-detail-item">
                <span class="label">Tempat &amp; Tgl Lahir</span>
                <div class="val">${s.tempat_lahir || '-'}, ${tglFormatted}</div>
              </div>
              <div class="siswa-mobile-detail-item">
                <span class="label">Status Sambung</span>
                <div class="val">${statusBadge}</div>
              </div>
              <div class="siswa-mobile-detail-item">
                <span class="label">No. HP / WhatsApp</span>
                <div class="val">${s.no_hp ? `<a href="tel:${s.no_hp}" style="color:var(--blue);text-decoration:none;">${s.no_hp}</a>` : '-'}</div>
              </div>
              <div class="siswa-mobile-detail-item">
                <span class="label">Domisili</span>
                <div class="val">${s.domisili || '-'}</div>
              </div>
              ${(s.nama_ayah || s.nama_ibu) ? `
              <div class="siswa-mobile-detail-item" style="grid-column: span 2;">
                <span class="label">Orang Tua</span>
                <div class="val">${[s.nama_ayah ? 'Bpk. ' + s.nama_ayah : '', s.nama_ibu ? 'Ibu ' + s.nama_ibu : ''].filter(Boolean).join(' / ')}</div>
              </div>` : ''}
            </div>

            <!-- Tombol Aksi Mobile -->
            <div class="siswa-mobile-actions-bar">
              <button type="button" class="btn-edit-siswa btn-edit-siswa-action" data-id="${s.id}" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;padding:8px 12px;">
                <span class="material-symbols-outlined" style="font-size:16px;">edit</span> Edit Data
              </button>
              <button type="button" class="btn-delete-siswa-table btn-delete-siswa-action" data-id="${s.id}" data-nama="${s.nama_lengkap}" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:8px 12px;">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span> Hapus
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Pagination HTML
  if (paginWrap) {
    let pagesHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, siswaCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pagesHtml += `
        <button type="button" class="pagination-btn ${p === siswaCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button>
      `;
    }

    paginWrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;color:var(--text-muted);flex-wrap:wrap;">
        <span>Menampilkan <strong>${startIndex + 1} - ${endIndex}</strong> dari <strong>${totalFiltered}</strong> generus</span>
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;">
          Per halaman:
          <select id="selSiswaPageSize" style="padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font-size:11.5px;font-weight:700;">
            <option value="25" ${siswaPageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${siswaPageSize === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${siswaPageSize === 100 ? 'selected' : ''}>100</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button type="button" class="pagination-btn" id="btnPageFirst" ${siswaCurrentPage === 1 ? 'disabled' : ''} title="Halaman Pertama">«</button>
        <button type="button" class="pagination-btn" id="btnPagePrev" ${siswaCurrentPage === 1 ? 'disabled' : ''} title="Sebelumnya">‹</button>
        ${pagesHtml}
        <button type="button" class="pagination-btn" id="btnPageNext" ${siswaCurrentPage === totalPages ? 'disabled' : ''} title="Berikutnya">›</button>
        <button type="button" class="pagination-btn" id="btnPageLast" ${siswaCurrentPage === totalPages ? 'disabled' : ''} title="Halaman Terakhir">»</button>
      </div>
    `;

    document.getElementById('selSiswaPageSize')?.addEventListener('change', (e) => {
      siswaPageSize = parseInt(e.target.value) || 50;
      siswaCurrentPage = 1;
      renderSiswaTableRows();
    });
    document.getElementById('btnPageFirst')?.addEventListener('click', () => {
      siswaCurrentPage = 1;
      renderSiswaTableRows();
    });
    document.getElementById('btnPagePrev')?.addEventListener('click', () => {
      if (siswaCurrentPage > 1) {
        siswaCurrentPage--;
        renderSiswaTableRows();
      }
    });
    document.getElementById('btnPageNext')?.addEventListener('click', () => {
      if (siswaCurrentPage < totalPages) {
        siswaCurrentPage++;
        renderSiswaTableRows();
      }
    });
    document.getElementById('btnPageLast')?.addEventListener('click', () => {
      siswaCurrentPage = totalPages;
      renderSiswaTableRows();
    });
    paginWrap.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        siswaCurrentPage = parseInt(btn.dataset.page);
        renderSiswaTableRows();
      });
    });
  }

  // Update Bulk Action Bar
  function updateBulkBar() {
    if (bulkBar && countText) {
      if (selectedSiswaIds.size > 0) {
        bulkBar.style.display = 'flex';
        countText.textContent = `${selectedSiswaIds.size} generus terpilih`;
      } else {
        bulkBar.style.display = 'none';
      }
    }
  }
  updateBulkBar();

  // Checkbox row listeners (Both Desktop & Mobile)
  document.querySelectorAll('.check-siswa-row').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        selectedSiswaIds.add(id);
      } else {
        selectedSiswaIds.delete(id);
      }
      updateBulkBar();
      const allChecked = pagedItems.every(s => selectedSiswaIds.has(s.id));
      if (checkAllEl) checkAllEl.checked = allChecked;
      if (checkAllMobileEl) checkAllMobileEl.checked = allChecked;

      // Sync all checkboxes for this id
      document.querySelectorAll(`.check-siswa-row[data-id="${id}"]`).forEach(c => {
        c.checked = e.target.checked;
      });

      const tr = e.target.closest('tr');
      if (tr) tr.classList.toggle('row-selected', e.target.checked);
      const card = e.target.closest('.siswa-mobile-card');
      if (card) card.classList.toggle('card-selected', e.target.checked);
    });
  });

  // Check all in current page listener (Desktop)
  if (checkAllEl) {
    checkAllEl.onchange = (e) => {
      const checked = e.target.checked;
      pagedItems.forEach(s => {
        if (checked) selectedSiswaIds.add(s.id);
        else selectedSiswaIds.delete(s.id);
      });
      renderSiswaTableRows();
    };
  }

  // Check all in current page listener (Mobile)
  if (checkAllMobileEl) {
    checkAllMobileEl.onchange = (e) => {
      const checked = e.target.checked;
      pagedItems.forEach(s => {
        if (checked) selectedSiswaIds.add(s.id);
        else selectedSiswaIds.delete(s.id);
      });
      renderSiswaTableRows();
    };
  }

  // Mobile Dropdown Accordion Toggle
  document.querySelectorAll('.btn-toggle-siswa-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.siswa-mobile-card');
      const panel = card?.querySelector('.siswa-mobile-detail-panel');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (panel) {
        const isShown = panel.classList.contains('show');
        panel.classList.toggle('show', !isShown);
        if (icon) {
          icon.style.transform = isShown ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      }
    });
  });

  // Tap mobile header row (outside checkbox & toggle button) to toggle dropdown
  document.querySelectorAll('.siswa-mobile-header').forEach(hdr => {
    hdr.addEventListener('click', (e) => {
      if (e.target.closest('.check-siswa-row') || e.target.closest('.btn-toggle-siswa-detail')) return;
      const toggleBtn = hdr.querySelector('.btn-toggle-siswa-detail');
      toggleBtn?.click();
    });
  });

  // Batal pilih listener
  document.getElementById('btnBatalPilihSiswa')?.addEventListener('click', () => {
    selectedSiswaIds.clear();
    renderSiswaTableRows();
  });

  // Bulk Hapus Listener
  document.getElementById('btnBulkHapusSiswa')?.addEventListener('click', () => {
    const count = selectedSiswaIds.size;
    if (count === 0) return;
    showConfirmModal({
      title: 'Hapus Cepat Data Generus',
      message: `Apakah Anda yakin ingin menghapus ${count} data generus terpilih sekaligus? Tindakan ini akan menghapus data secara permanen.`,
      icon: 'delete_sweep',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      confirmText: `Ya, Hapus ${count} Data`,
      confirmBtnColor: 'var(--red)',
      onConfirm: () => {
        selectedSiswaIds.forEach(id => deleteSiswa(id));
        selectedSiswaIds.clear();
        showToast(`${count} data generus berhasil dihapus!`, 'success');
        renderSiswaModal();
      }
    });
  });

  // Single Edit Listener (Desktop & Mobile)
  document.querySelectorAll('.btn-edit-siswa').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      const data = getSiswaList().find(x => x.id === id);
      if (data) renderSiswaFormModal(data);
    });
  });

  // Single Delete Listener (Desktop & Mobile)
  document.querySelectorAll('.btn-delete-siswa-table').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      const nama = e.currentTarget.dataset.nama || 'generus';
      showConfirmModal({
        title: 'Hapus Data Generus',
        message: `Apakah Anda yakin ingin menghapus data "${nama}"? Tindakan ini tidak bisa dibatalkan.`,
        icon: 'delete',
        iconBg: '#fee2e2',
        iconColor: '#ef4444',
        confirmText: 'Ya, Hapus Data',
        confirmBtnColor: 'var(--red)',
        onConfirm: () => {
          deleteSiswa(id);
          selectedSiswaIds.delete(id);
          showToast(`Data "${nama}" berhasil dihapus`, 'success');
          renderSiswaModal();
        }
      });
    });
  });
}

export function renderSiswaFormModal(existingData = null) {
  const isEdit = !!existingData;
  const title = isEdit ? `Edit Generus: ${existingData.nama_lengkap}` : "Tambah Generus Baru";

  // Multi-level 1: Desa & Kelompok
  const currentDesaId = existingData ? (existingData.desa_id || '') : '';
  const currentKelId = existingData ? (existingData.kelompok_id || '') : '';

  const desaOptions = MASTER_WILAYAH.desa.map(d =>
    `<option value="${d.id}" data-name="${d.nama}" ${currentDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`
  ).join('');

  function getKelompokOptionsForDesa(desaId, selectedKelId = '') {
    if (!desaId) return '<option value="">-- Pilih Desa Terlebih Dahulu --</option>';
    const foundDesa = MASTER_WILAYAH.desa.find(d => d.id === desaId);
    if (!foundDesa || !foundDesa.kelompok) return '<option value="">-- Tidak Ada Kelompok --</option>';
    const sorted = [...foundDesa.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));
    return '<option value="">-- Pilih Kelompok --</option>' + sorted.map(k =>
      `<option value="${k.id}" data-name="${k.nama}" ${selectedKelId === k.id ? 'selected' : ''}>Kelompok ${k.nama}</option>`
    ).join('');
  }

  const initialKelOptions = currentDesaId
    ? getKelompokOptionsForDesa(currentDesaId, currentKelId)
    : '<option value="">-- Pilih Desa Terlebih Dahulu --</option>';

  // Multi-level 2: Kategori Jenjang & Kelas/Tingkat
  let currentKat = existingData ? (existingData.kategori_usia || '') : '';
  let currentKelas = existingData ? (existingData.jenjang_kelas || '') : '';

  // Fallback inferensi kategori jika data lama belum ada kategori_usia
  if (!currentKat && currentKelas) {
    if (JENJANG_CONFIG.caberawit.kelas.includes(currentKelas) || currentKelas.includes('SD') || currentKelas.includes('TK') || currentKelas.includes('PAUD')) {
      currentKat = 'caberawit';
    } else if (JENJANG_CONFIG.gp_reguler.kelas.includes(currentKelas) || currentKelas.includes('SMP') || currentKelas.includes('SMA')) {
      currentKat = 'gp_reguler';
    } else {
      currentKat = 'remaja';
    }
  }

  function getKelasOptionsForJenjang(katId, selectedKelas = '') {
    if (!katId || !JENJANG_CONFIG[katId]) return '<option value="">-- Pilih Kategori Jenjang Terlebih Dahulu --</option>';
    const list = JENJANG_CONFIG[katId].kelas;
    return '<option value="">-- Pilih Kelas / Tingkat --</option>' +
      list.map(k => `<option value="${k}" ${selectedKelas === k ? 'selected' : ''}>${k}</option>`).join('');
  }

  const initialKelasOptions = currentKat
    ? getKelasOptionsForJenjang(currentKat, currentKelas)
    : '<option value="">-- Pilih Kategori Jenjang Terlebih Dahulu --</option>';

  const formHtml = `
    <form id="formSiswa" style="display:flex;flex-direction:column;gap:12px;font-size:13px;max-height:70vh;overflow-y:auto;padding-right:4px;">

      <!-- Nama Lengkap -->
      <div>
        <label style="font-weight:700;display:block;margin-bottom:4px;">Nama Lengkap <span style="color:red">*</span></label>
        <input type="text" id="sNama" value="${existingData ? (existingData.nama_lengkap || '') : ''}" required placeholder="Nama lengkap generus" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
      </div>

      <!-- Tempat & Tgl Lahir -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Tempat Lahir</label>
          <input type="text" id="sTempatLahir" value="${existingData ? (existingData.tempat_lahir || '') : ''}" placeholder="Kota/Kab. kelahiran" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Tanggal Lahir <span style="color:red">*</span></label>
          <input type="date" id="sTglLahir" value="${existingData ? (existingData.tanggal_lahir || '') : ''}" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
        </div>
      </div>

      <!-- Usia (auto/manual) -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-weight:700;font-size:12px;">Usia</label>
          <label style="font-size:11px;color:var(--text-muted);cursor:pointer;">
            <input type="checkbox" id="usiaManualToggle" style="margin-right:4px;" ${existingData && existingData.usia_manual ? 'checked' : ''}>
            Isi manual
          </label>
        </div>
        <div id="usiaAutoDisplay" style="padding:8px 12px;background:var(--surface-hover);border-radius:6px;font-size:13px;color:var(--text-muted);">Otomatis dari tanggal lahir</div>
        <input type="number" id="sUsiaManual" value="${existingData && existingData.usia_manual ? existingData.usia_manual : ''}" placeholder="Isi usia (tahun)" style="display:none;width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;background:var(--surface);color:var(--text);" />
      </div>

      <!-- Wilayah: Multi-Level Dropdown (Desa -> Kelompok) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Desa <span style="color:red">*</span></label>
          <select id="sDesa" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;background:var(--surface);color:var(--text);font-weight:600;">
            <option value="">-- Pilih Desa --</option>
            ${desaOptions}
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Kelompok <span style="color:red">*</span></label>
          <select id="sKelompok" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;background:var(--surface);color:var(--text);font-weight:600;">
            ${initialKelOptions}
          </select>
        </div>
      </div>

      <!-- Jenjang Generus: Multi-Level Dropdown (Kategori Jenjang -> Kelas/Tingkat) -->
      <div class="filter-jenjang-card-highlight" style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;color:#2563eb;">school</span>
          <span class="filter-jenjang-title" style="font-size:12px;text-transform:uppercase;letter-spacing:0.3px;">Jenjang Generus</span>
        </div>
        <div class="filter-jenjang-grid">
          <div>
            <label class="filter-jenjang-label">Kategori Jenjang <span style="color:red">*</span></label>
            <select id="sKategoriJenjang" required class="filter-jenjang-select">
              <option value="">-- Pilih Kategori Jenjang --</option>
              <option value="caberawit" ${currentKat === 'caberawit' ? 'selected' : ''}>🌱 Caberawit (PAUD - SD)</option>
              <option value="gp_reguler" ${currentKat === 'gp_reguler' ? 'selected' : ''}>📚 GP Reguler (SMP - SMA)</option>
              <option value="remaja" ${currentKat === 'remaja' ? 'selected' : ''}>🎓 Remaja &amp; Dewasa</option>
            </select>
          </div>
          <div>
            <label class="filter-jenjang-label">Kelas / Tingkat <span style="color:red">*</span></label>
            <select id="sKelas" required class="filter-jenjang-select">
              ${initialKelasOptions}
            </select>
          </div>
        </div>
      </div>

      <!-- Gender & No HP -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Jenis Kelamin</label>
          <select id="sGender" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="L" ${existingData && existingData.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki (L)</option>
            <option value="P" ${existingData && existingData.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan (P)</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Nomor HP / WA</label>
          <input type="tel" id="sNoHp" value="${existingData ? (existingData.no_hp || '') : ''}" placeholder="08xxxxxxxxxx" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
        </div>
      </div>

      <!-- Domisili & Status Mutasi -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Domisili</label>
          <select id="sDomisili" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="Pribumi" ${existingData && existingData.domisili === 'Pribumi' ? 'selected' : ''}>Pribumi</option>
            <option value="Pendatang" ${existingData && existingData.domisili === 'Pendatang' ? 'selected' : ''}>Pendatang</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Status Mutasi</label>
          <select id="sMutasi" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="Sambung" ${existingData && existingData.status_sambung === 'Sambung' ? 'selected' : ''}>Sambung (Aktif)</option>
            <option value="Pindah Sambung" ${existingData && existingData.status_sambung === 'Pindah Sambung' ? 'selected' : ''}>Pindah Sambung</option>
            <option value="Menikah" ${existingData && existingData.status_sambung === 'Menikah' ? 'selected' : ''}>Menikah</option>
          </select>
        </div>
      </div>

      <!-- Sticky Actions Footer -->
      <div class="modal-sticky-footer">
        <button type="button" class="btn-cancel-siswa">← Kembali</button>
        <button type="submit" class="btn-submit-siswa">💾 Simpan Data</button>
      </div>
      ${isEdit ? `
        <button type="button" id="btnDeleteSiswa" class="btn-delete-siswa">🗑 Hapus Data Generus Ini</button>
      ` : ''}
    </form>
  `;

  openModal(title, isEdit ? 'edit_note' : 'person_add', formHtml, 'default');

  // Multi-level Dropdown listener 1: Desa -> Kelompok
  const sDesaEl = document.getElementById('sDesa');
  const sKelompokEl = document.getElementById('sKelompok');

  sDesaEl?.addEventListener('change', () => {
    const selectedDesaId = sDesaEl.value;
    sKelompokEl.innerHTML = getKelompokOptionsForDesa(selectedDesaId);
  });

  // Multi-level Dropdown listener 2: Kategori Jenjang -> Kelas/Tingkat
  const sKatJenjangEl = document.getElementById('sKategoriJenjang');
  const sKelasEl = document.getElementById('sKelas');

  sKatJenjangEl?.addEventListener('change', () => {
    const selectedKat = sKatJenjangEl.value;
    sKelasEl.innerHTML = getKelasOptionsForJenjang(selectedKat);
  });

  // Toggle usia manual/auto
  const tglInput = document.getElementById('sTglLahir');
  const usiaManualToggle = document.getElementById('usiaManualToggle');
  const usiaAutoDisplay = document.getElementById('usiaAutoDisplay');
  const sUsiaManual = document.getElementById('sUsiaManual');

  function updateUsiaDisplay() {
    if (usiaManualToggle.checked) {
      usiaAutoDisplay.style.display = 'none';
      sUsiaManual.style.display = 'block';
    } else {
      sUsiaManual.style.display = 'none';
      usiaAutoDisplay.style.display = 'block';
      if (tglInput.value) {
        usiaAutoDisplay.textContent = calculateUmur(tglInput.value);
        usiaAutoDisplay.style.color = 'var(--text-main)';
      } else {
        usiaAutoDisplay.textContent = 'Otomatis dari tanggal lahir';
        usiaAutoDisplay.style.color = 'var(--text-muted)';
      }
    }
  }

  usiaManualToggle.addEventListener('change', updateUsiaDisplay);
  tglInput.addEventListener('change', updateUsiaDisplay);
  updateUsiaDisplay();

  document.querySelector('.btn-cancel-siswa').addEventListener('click', renderSiswaModal);

  document.getElementById('formSiswa').addEventListener('submit', (e) => {
    e.preventDefault();
    const selDesa = document.getElementById('sDesa');
    const selKel = document.getElementById('sKelompok');
    const optDesa = selDesa.options[selDesa.selectedIndex];
    const optKel = selKel.options[selKel.selectedIndex];
    const katJenjang = document.getElementById('sKategoriJenjang').value;
    const kelasStr = document.getElementById('sKelas').value;

    if (!selDesa.value) return showToast('Silakan pilih Desa terlebih dahulu!', 'warning');
    if (!selKel.value) return showToast('Silakan pilih Kelompok terlebih dahulu!', 'warning');
    if (!katJenjang) return showToast('Silakan pilih Kategori Jenjang terlebih dahulu!', 'warning');
    if (!kelasStr) return showToast('Silakan pilih Kelas / Tingkat terlebih dahulu!', 'warning');

    const isManualUsia = document.getElementById('usiaManualToggle').checked;

    const dataObj = {
      nama_lengkap: document.getElementById('sNama').value.trim(),
      tempat_lahir: document.getElementById('sTempatLahir').value.trim(),
      jenis_kelamin: document.getElementById('sGender').value,
      tanggal_lahir: document.getElementById('sTglLahir').value,
      usia_manual: isManualUsia ? parseInt(document.getElementById('sUsiaManual').value) || null : null,
      jenjang_kelas: kelasStr,
      kategori_usia: katJenjang,
      desa_id: selDesa.value,
      desa_nama: optDesa?.dataset?.name || optDesa?.textContent.replace('Desa ', ''),
      kelompok_id: selKel.value,
      kelompok_nama: optKel?.dataset?.name || optKel?.textContent.replace('Kelompok ', '').replace('Kel. ', ''),
      no_hp: document.getElementById('sNoHp').value.trim(),
      domisili: document.getElementById('sDomisili').value,
      status_sambung: document.getElementById('sMutasi').value
    };

    if (isEdit) {
      updateSiswa(existingData.id, dataObj);
      showToast(`Data generus "${dataObj.nama_lengkap}" berhasil diperbarui!`, 'success');
    } else {
      addSiswa(dataObj);
      showToast(`Data generus "${dataObj.nama_lengkap}" berhasil disimpan & disinkronkan!`, 'success');
    }
    renderSiswaModal();
  });

  if (isEdit) {
    document.getElementById('btnDeleteSiswa').addEventListener('click', () => {
      showConfirmModal({
        title: 'Hapus Data Generus',
        message: `Yakin ingin menghapus data "${existingData.nama_lengkap}"? Tindakan ini tidak bisa dibatalkan.`,
        icon: 'delete',
        iconBg: '#fee2e2',
        iconColor: '#ef4444',
        confirmText: 'Ya, Hapus Data',
        confirmBtnColor: 'var(--red)',
        onConfirm: () => {
          deleteSiswa(existingData.id);
          showToast(`Data "${existingData.nama_lengkap}" berhasil dihapus`, 'success');
          renderSiswaModal();
        }
      });
    });
  }
}
