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
  autoPromoteAllSiswa,
  calculateMassPromotionPreview,
  getAcademicYearInfo
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  closeModal,
  showToast,
  showConfirmModal,
  modalBody,
  renderPaginationBar,
  showDashboardView,
  showDashboardHomePage
} from './dashboard-common.js';

/* ═══════════════════════════════════════════════════════════════════════════
   DATABASE GENERUS MODULE (SISWA)
   ═══════════════════════════════════════════════════════════════════════════ */

export const JENJANG_CONFIG = {
  caberawit: {
    id: 'caberawit',
    label: 'Caberawit (Usia Dini / PAUD - SD)',
    badge: 'Caberawit',
    color: '#d97706',
    bg: '#fef3c7',
    kelas: ['PAUD', 'TK A', 'TK B', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD']
  },
  gp_reguler: {
    id: 'gp_reguler',
    label: 'GP Reguler (Remaja Awal / SMP - SMA)',
    badge: 'GP Reguler',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    kelas: ['1 SMP', '2 SMP', '3 SMP', '1 SMA', '2 SMA', '3 SMA']
  },
  pra_nikah: {
    id: 'pra_nikah',
    label: 'Pra Nikah (19-22 Th)',
    badge: 'Pra-Nikah',
    color: '#ec4899',
    bg: '#fce7f3',
    kelas: ['19-22 Tahun', 'Pra-Nikah']
  },
  remaja: {
    id: 'remaja',
    label: 'Remaja & Dewasa (Muda-Mudi & Pra-Nikah)',
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

  const cabList = activeSiswa.filter(s => (s.kategori_usia || '').toLowerCase() === 'caberawit');
  const gpList = activeSiswa.filter(s => (s.kategori_usia || '').toLowerCase() === 'gp_reguler');
  const remList = activeSiswa.filter(s => (s.kategori_usia || '').toLowerCase() === 'remaja');

  const catMeta = {
    all: {
      key: 'all',
      title: 'Semua Kategori Generus',
      badge: 'Data Terpusat • Solo Selatan',
      icon: 'groups',
      color: '#1a56c4',
      list: activeSiswa
    },
    caberawit: {
      key: 'caberawit',
      title: 'Kategori Caberawit (PAUD – SD)',
      badge: 'PAUD, TK & SD (3–12 Thn) • Solo Selatan',
      icon: 'child_care',
      color: '#d97706',
      list: cabList
    },
    gp_reguler: {
      key: 'gp_reguler',
      title: 'Kategori GP Reguler (SMP – SMA)',
      badge: '1 SMP – 3 SMA (13–18 Thn) • Solo Selatan',
      icon: 'school',
      color: '#1a56c4',
      list: gpList
    },
    remaja: {
      key: 'remaja',
      title: 'Kategori Usia Remaja & Pra-Nikah',
      badge: '19 – 22+ Tahun • Solo Selatan',
      icon: 'diversity_3',
      color: '#7c3aed',
      list: remList
    }
  };

  const currentCfg = catMeta[activeKat] || catMeta.all;
  const currentList = currentCfg.list;
  const total = currentList.length;
  const lCount = currentList.filter(s => (s.jenis_kelamin || '').toUpperCase() === 'L').length;
  const pCount = currentList.filter(s => (s.jenis_kelamin || '').toUpperCase() === 'P').length;
  const lPct = total > 0 ? Math.round((lCount / total) * 100) : 0;
  const pPct = total > 0 ? 100 - lPct : 0;

  // Sebaran Desa & Kelompok
  const desaStats = (MASTER_WILAYAH.desa || []).map(desa => {
    const inDesa = currentList.filter(s => s.desa_id === desa.id || (s.desa_nama && desa.nama && s.desa_nama.toLowerCase() === desa.nama.toLowerCase()));
    const kelompokStats = (desa.kelompok || []).map(kel => {
      const siswaKel = inDesa.filter(s => s.kelompok_id === kel.id || (s.kelompok_nama && kel.nama && s.kelompok_nama.toLowerCase() === kel.nama.toLowerCase()));
      return {
        id: kel.id,
        nama: kel.nama,
        count: siswaKel.length
      };
    }).filter(k => k.count > 0);

    return {
      id: desa.id,
      nama: desa.nama,
      total: inDesa.length,
      kelompokStats: kelompokStats
    };
  }).filter(d => d.total > 0 || activeKat === 'all');

  // Tabs switcher
  const navTabsHtml = `
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      ${[
        { key: 'all', label: 'Semua Generus', count: activeSiswa.length, icon: 'groups' },
        { key: 'caberawit', label: 'Caberawit', count: cabList.length, icon: 'child_care' },
        { key: 'gp_reguler', label: 'GP Reguler', count: gpList.length, icon: 'school' },
        { key: 'remaja', label: 'Remaja', count: remList.length, icon: 'diversity_3' }
      ].map(tab => `
        <button type="button" class="btn-tab-ringkasan px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${tab.key === activeKat ? 'bg-brandBlue text-white border-brandBlue shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}" data-cat="${tab.key}">
          <span class="material-symbols-outlined text-[16px]">${tab.icon}</span>
          <span>${tab.label}</span>
          <span class="text-[11px] opacity-80 font-normal">(${tab.count})</span>
        </button>
      `).join('')}
    </div>
  `;

  // Landing Page Layout (Solid Blue Hero, Gender Breakdown, Divide-y Desa/Kelompok List)
  const modalHtml = `
    <div class="space-y-4">
      ${navTabsHtml}

      <!-- 1. Summary Block (Solid Blue) -->
      <div class="bg-brandBlue dark:bg-brandDarkBlue text-white p-6 pb-7 text-center relative overflow-hidden rounded-2xl shadow-sm">
        <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div class="relative z-10">
          <h4 class="font-semibold text-xs tracking-wider uppercase opacity-90 mb-1">Ringkasan</h4>
          <div class="text-4xl md:text-5xl font-extrabold mb-1 tracking-tight">${total.toLocaleString('id-ID')}</div>
          <div class="text-xs md:text-sm opacity-80 font-medium">Total Generus Aktif</div>
        </div>
      </div>

      <!-- 2. Gender Breakdown (Google Material Symbols) -->
      <div class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h4 class="text-sm font-bold text-slate-800 dark:text-white mb-3">Rincian Generus</h4>
        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <!-- Putra -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <span class="material-symbols-outlined text-2xl">male</span>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Putra</div>
                <div class="font-bold text-slate-800 dark:text-white text-sm">${lCount} Putra</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-2 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full" style="width: ${lPct}%"></div>
              </div>
              <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400 w-7 text-right">${lPct}%</span>
            </div>
          </div>

          <!-- Putri -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center shrink-0 text-pink-600 dark:text-pink-400">
                <span class="material-symbols-outlined text-2xl">female</span>
              </div>
              <div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Putri</div>
                <div class="font-bold text-slate-800 dark:text-white text-sm">${pCount} Putri</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-2 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-pink-500 rounded-full" style="width: ${pPct}%"></div>
              </div>
              <span class="text-[11px] font-bold text-pink-600 dark:text-pink-400 w-7 text-right">${pPct}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Sebaran Desa / Kelompok (Divide-y List) -->
      <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-700/60">
        ${desaStats.length > 0 ? desaStats.map(desa => {
          const kDisplay = desa.kelompokStats.length > 0
            ? desa.kelompokStats.map(k => `<span class="text-[11.5px] text-slate-600 dark:text-slate-400 mr-2 mb-1 inline-block">&bull; ${k.nama} <span class="opacity-60">(${k.count})</span></span>`).join('')
            : '<span class="text-[11px] text-slate-400 italic">Belum ada data</span>';

          return `
            <div class="p-3.5 md:p-4 bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
              <div class="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm flex items-center justify-between mb-2">
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[16px] text-brandBlue dark:text-blue-400">location_city</span>
                  Desa ${desa.nama}
                </span>
                <span class="font-normal text-slate-500 text-xs">(${desa.total} Generus)</span>
              </div>
              <div class="pl-6 ml-2">${kDisplay}</div>
            </div>
          `;
        }).join('') : '<div class="p-6 text-center text-xs text-slate-400">Belum ada data generus</div>'}
      </div>

      <!-- Footer Buttons -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <button type="button" class="btn-cancel-modal w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
          Tutup
        </button>
        <button type="button" id="btnBukaSeluruhDatabase" class="w-full sm:w-auto px-5 py-2.5 bg-brandBlue hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[16px]">database</span>
          <span>Buka Database Generus Lengkap</span>
        </button>
      </div>
    </div>
  `;

  openModal(`Rincian Ringkasan: ${currentCfg.title}`, currentCfg.icon, modalHtml, 'large');

  // Event Listeners
  document.querySelectorAll('.btn-tab-ringkasan').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      renderDetailRingkasanModal(cat);
    });
  });

  document.getElementById('btnBukaSeluruhDatabase')?.addEventListener('click', () => {
    currentSiswaFilter.jenjang = activeKat === 'all' ? 'all' : activeKat;
    currentSiswaFilter.kelas = 'all';
    currentSiswaFilter.desa = 'all';
    currentSiswaFilter.kelompok = 'all';
    currentSiswaFilter.search = '';
    siswaCurrentPage = 1;
    applyUserRegionFilter(true);
    renderSiswaModal();
  });

  document.querySelector('.btn-cancel-modal')?.addEventListener('click', closeModal);
}

let currentSiswaFilter = { 
  search: '', 
  desa: 'all', 
  kelompok: 'all', 
  jenjang: 'all', 
  kelas: 'all', 
  status: 'all', 
  gender: 'all', 
  domisili: 'all' 
};

/**
 * Otomatis sesuaikan filter wilayah jika pamong kelompok atau koordinator desa (seperti pada fitur pembiasaan)
 */
export function applyUserRegionFilter(force = false) {
  const isSuperadminOrDaerah = currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah');

  if (!isSuperadminOrDaerah && currentUser) {
    if (currentUser.tingkatan === 'desa' && currentUser.desaId) {
      if (force || currentSiswaFilter.desa === 'all') {
        currentSiswaFilter.desa = currentUser.desaId;
      }
    } else if (currentUser.tingkatan === 'kelompok') {
      if (force || currentSiswaFilter.desa === 'all') {
        if (currentUser.desaId) currentSiswaFilter.desa = currentUser.desaId;
      }
      if (force || currentSiswaFilter.kelompok === 'all') {
        if (currentUser.kelompokId) currentSiswaFilter.kelompok = currentUser.kelompokId;
      }
    }
  }
}

// Inisialisasi awal wilayah pengguna saat modul dimuat
applyUserRegionFilter(true);

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

/* ═══════════════════════════════════════════════════════════════════════════
   MULTI-LEVEL UI FILTER HELPER FUNCTIONS (UNIVERSAL TEMPLATE)
   ═══════════════════════════════════════════════════════════════════════════ */

export function countActiveSiswaFilters() {
  let count = 0;
  if (currentSiswaFilter.jenjang && currentSiswaFilter.jenjang !== 'all') count++;
  if (currentSiswaFilter.kelas && currentSiswaFilter.kelas !== 'all') {
    if (Array.isArray(currentSiswaFilter.kelas)) {
      if (currentSiswaFilter.kelas.length > 0) count++;
    } else {
      count++;
    }
  }
  if (currentSiswaFilter.desa && currentSiswaFilter.desa !== 'all') count++;
  if (currentSiswaFilter.kelompok && currentSiswaFilter.kelompok !== 'all') count++;
  if (currentSiswaFilter.status && currentSiswaFilter.status !== 'all') count++;
  if (currentSiswaFilter.gender && currentSiswaFilter.gender !== 'all') count++;
  if (currentSiswaFilter.domisili && currentSiswaFilter.domisili !== 'all') count++;
  return count;
}

export function buildSiswaDrawerContentHtml(prefix = 'dt') {
  const isDesa = currentUser && currentUser.tingkatan === 'desa';
  const isKelompok = currentUser && currentUser.tingkatan === 'kelompok';

  const jenjangGroups = [
    {
      id: 'caberawit',
      label: 'Caberawit',
      sub: 'Usia Dini / PAUD - SD',
      badge: 'PAUD - SD',
      color: 'amber',
      classes: ['PAUD', 'TK A', 'TK B', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD']
    },
    {
      id: 'gp_reguler',
      label: 'GP (Pra-remaja)',
      sub: 'Remaja Awal / SMP',
      badge: 'SMP',
      color: 'blue',
      classes: ['1 SMP', '2 SMP', '3 SMP']
    },
    {
      id: 'pra_nikah',
      label: 'Pra Nikah',
      sub: 'Remaja Usia 19 - 22 Tahun',
      badge: '19 - 22 Th',
      color: 'pink',
      classes: ['19-22 Tahun', 'Pra-Nikah']
    },
    {
      id: 'remaja',
      label: 'Remaja & Dewasa',
      sub: 'SMA, Mahasiswa, Usia Mandiri',
      badge: 'Remaja',
      color: 'purple',
      classes: ['1 SMA', '2 SMA', '3 SMA', 'Mahasiswa', 'Bekerja', 'Kelas Remaja', 'Usia Mandiri', 'Lainnya']
    }
  ];

  const desaList = MASTER_WILAYAH.desa || [];
  let availableKelompok = getAllKelompok();
  if (currentSiswaFilter.desa !== 'all') {
    availableKelompok = availableKelompok.filter(k => k.desaId === currentSiswaFilter.desa);
  }

  const selectedClasses = Array.isArray(currentSiswaFilter.kelas)
    ? currentSiswaFilter.kelas
    : (currentSiswaFilter.kelas === 'all' ? [] : [currentSiswaFilter.kelas]);

  return `
    <div class="p-4 space-y-4 text-xs">
      
      <!-- 1. KATEGORI JENJANG & KELAS -->
      <div class="filter-accordion-item open" id="accordionJenjang_${prefix}">
        <button type="button" class="filter-accordion-header" data-toggle-accordion>
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">school</span>
            <span>1. Kategori Jenjang &amp; Kelas</span>
          </span>
          <span class="material-symbols-outlined text-[18px] text-slate-400 arrow-icon">expand_more</span>
        </button>
        <div class="filter-accordion-content space-y-2">
          <!-- Option: Semua Jenjang -->
          <label class="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${currentSiswaFilter.jenjang === 'all' ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-400 font-bold' : ''}">
            <input type="radio" name="jenjangRadio_${prefix}" value="all" ${currentSiswaFilter.jenjang === 'all' ? 'checked' : ''} class="w-4 h-4 text-blue-600 cursor-pointer" />
            <span class="text-slate-800 dark:text-slate-200">Semua Jenjang Generus</span>
          </label>

          <!-- 4 Jenjang Cards -->
          ${jenjangGroups.map(j => {
            const isSelected = currentSiswaFilter.jenjang === j.id;
            return `
              <div class="rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40'} overflow-hidden transition-all">
                <label class="flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors">
                  <div class="flex items-center gap-2.5">
                    <input type="radio" name="jenjangRadio_${prefix}" value="${j.id}" ${isSelected ? 'checked' : ''} class="w-4 h-4 text-blue-600 cursor-pointer" />
                    <div>
                      <div class="font-bold text-slate-800 dark:text-white">${j.label}</div>
                      <div class="text-[10.5px] text-slate-500 dark:text-slate-400">${j.sub}</div>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${j.badge}</span>
                </label>

                <!-- Sub-classes (shown when selected) -->
                <div class="p-2.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 sub-kelas-wrap" style="${isSelected ? '' : 'display:none;'}">
                  <div class="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Pilih Tingkat / Kelas:</div>
                  <div class="grid grid-cols-2 gap-1.5">
                    ${j.classes.map(k => {
                      const isChecked = selectedClasses.includes(k);
                      return `
                        <label class="flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${isChecked ? 'bg-blue-100/70 dark:bg-blue-900/40 border-blue-400 font-bold text-blue-900 dark:text-blue-200' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}">
                          <input type="checkbox" name="kelasCheck_${prefix}" value="${k}" ${isChecked ? 'checked' : ''} class="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer" />
                          <span class="truncate">${k}</span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 2. WILAYAH TERITORIAL (DESA & KELOMPOK) -->
      <div class="filter-accordion-item open" id="accordionWilayah_${prefix}">
        <button type="button" class="filter-accordion-header" data-toggle-accordion>
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">location_on</span>
            <span>2. Wilayah Teritorial</span>
          </span>
          <span class="material-symbols-outlined text-[18px] text-slate-400 arrow-icon">expand_more</span>
        </button>
        <div class="filter-accordion-content space-y-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Desa:</label>
            <select id="selectDesa_${prefix}" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none" ${isKelompok || (isDesa && currentUser.desaId) ? 'disabled' : ''}>
              <option value="all">-- Semua Desa --</option>
              ${desaList.map(d => `<option value="${d.id}" ${currentSiswaFilter.desa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Kelompok:</label>
            <select id="selectKelompok_${prefix}" class="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none" ${isKelompok && currentUser.kelompokId ? 'disabled' : ''}>
              <option value="all">-- Semua Kelompok --</option>
              ${availableKelompok.map(k => `<option value="${k.id}" ${currentSiswaFilter.kelompok === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- 3. STATUS SAMBUNG -->
      <div class="filter-accordion-item open" id="accordionStatus_${prefix}">
        <button type="button" class="filter-accordion-header" data-toggle-accordion>
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-purple-600 dark:text-purple-400">verified</span>
            <span>3. Status Sambung</span>
          </span>
          <span class="material-symbols-outlined text-[18px] text-slate-400 arrow-icon">expand_more</span>
        </button>
        <div class="filter-accordion-content">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.status === 'all' ? 'selected' : ''}" data-status-val="all">Semua Status</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.status === 'Sambung' ? 'selected' : ''}" data-status-val="Sambung">Sambung</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.status === 'Pindah Sambung' ? 'selected' : ''}" data-status-val="Pindah Sambung">Pindah Sambung</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.status === 'Menikah' ? 'selected' : ''}" data-status-val="Menikah">Menikah</button>
          </div>
        </div>
      </div>

      <!-- 4. JENIS KELAMIN -->
      <div class="filter-accordion-item" id="accordionGender_${prefix}">
        <button type="button" class="filter-accordion-header" data-toggle-accordion>
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-pink-600 dark:text-pink-400">wc</span>
            <span>4. Jenis Kelamin (Gender)</span>
          </span>
          <span class="material-symbols-outlined text-[18px] text-slate-400 arrow-icon">expand_more</span>
        </button>
        <div class="filter-accordion-content">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.gender === 'all' ? 'selected' : ''}" data-gender-val="all">Semua</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.gender === 'L' ? 'selected' : ''}" data-gender-val="L">Laki-laki (Putra)</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.gender === 'P' ? 'selected' : ''}" data-gender-val="P">Perempuan (Putri)</button>
          </div>
        </div>
      </div>

      <!-- 5. STATUS DOMISILI -->
      <div class="filter-accordion-item" id="accordionDomisili_${prefix}">
        <button type="button" class="filter-accordion-header" data-toggle-accordion>
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">home_pin</span>
            <span>5. Status Domisili</span>
          </span>
          <span class="material-symbols-outlined text-[18px] text-slate-400 arrow-icon">expand_more</span>
        </button>
        <div class="filter-accordion-content">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.domisili === 'all' ? 'selected' : ''}" data-domisili-val="all">Semua Domisili</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.domisili === 'Pribumi' ? 'selected' : ''}" data-domisili-val="Pribumi">Pribumi</button>
            <button type="button" class="filter-radio-pill ${currentSiswaFilter.domisili === 'Pendatang' ? 'selected' : ''}" data-domisili-val="Pendatang">Pendatang</button>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function bindSiswaDrawerEvents(prefix = 'dt') {
  const container = document.getElementById(prefix === 'dt' ? 'desktopDrawerBody' : 'mobileSheetBody');
  if (!container) return;

  // Accordion toggles
  container.querySelectorAll('[data-toggle-accordion]').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.filter-accordion-item');
      if (parent) parent.classList.toggle('open');
    });
  });

  // Jenjang radio change -> show/hide nested sub-classes
  container.querySelectorAll(`input[name="jenjangRadio_${prefix}"]`).forEach(radio => {
    radio.addEventListener('change', () => {
      const chosen = radio.value;
      container.querySelectorAll('.sub-kelas-wrap').forEach(w => w.style.display = 'none');
      if (chosen !== 'all') {
        const wrap = radio.closest('div.rounded-xl')?.querySelector('.sub-kelas-wrap');
        if (wrap) wrap.style.display = 'block';
      }
    });
  });

  // Desa change -> reload Kelompok
  const selectDesa = container.querySelector(`#selectDesa_${prefix}`);
  const selectKel = container.querySelector(`#selectKelompok_${prefix}`);
  if (selectDesa && selectKel) {
    selectDesa.addEventListener('change', () => {
      const dId = selectDesa.value;
      let kels = getAllKelompok();
      if (dId !== 'all') {
        kels = kels.filter(k => k.desaId === dId);
      }
      selectKel.innerHTML = '<option value="all">-- Semua Kelompok --</option>' +
        kels.map(k => `<option value="${k.id}">Kel. ${k.nama}</option>`).join('');
    });
  }

  // Radio pills for Status
  container.querySelectorAll('[data-status-val]').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelectorAll('[data-status-val]').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  // Radio pills for Gender
  container.querySelectorAll('[data-gender-val]').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelectorAll('[data-gender-val]').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });

  // Radio pills for Domisili
  container.querySelectorAll('[data-domisili-val]').forEach(pill => {
    pill.addEventListener('click', () => {
      container.querySelectorAll('[data-domisili-val]').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
    });
  });
}

export function syncBothSiswaDrawers() {
  const dtBody = document.getElementById('desktopDrawerBody');
  if (dtBody) {
    dtBody.innerHTML = buildSiswaDrawerContentHtml('dt');
    bindSiswaDrawerEvents('dt');
  }
  const mbBody = document.getElementById('mobileSheetBody');
  if (mbBody) {
    mbBody.innerHTML = buildSiswaDrawerContentHtml('mb');
    bindSiswaDrawerEvents('mb');
  }
}

export function toggleSiswaFilterDrawer(isOpen) {
  const backdrop = document.getElementById('filterOverlayBackdrop');
  const desktopDrawer = document.getElementById('filterDesktopDrawer');
  const mobileSheet = document.getElementById('filterMobileBottomSheet');
  if (!backdrop) return;

  if (isOpen) {
    backdrop.classList.add('active');
    if (window.innerWidth >= 768) {
      if (desktopDrawer) desktopDrawer.classList.add('active');
    } else {
      if (mobileSheet) mobileSheet.classList.add('active');
    }
  } else {
    backdrop.classList.remove('active');
    if (desktopDrawer) desktopDrawer.classList.remove('active');
    if (mobileSheet) mobileSheet.classList.remove('active');
  }
}

export function applySiswaDrawerFilters() {
  const isDesktop = window.innerWidth >= 768;
  const prefix = isDesktop ? 'dt' : 'mb';
  const container = document.getElementById(prefix === 'dt' ? 'desktopDrawerBody' : 'mobileSheetBody');
  if (!container) return;

  // 1. Jenjang
  const checkedJenjang = container.querySelector(`input[name="jenjangRadio_${prefix}"]:checked`);
  currentSiswaFilter.jenjang = checkedJenjang ? checkedJenjang.value : 'all';

  // 2. Kelas
  const checkedClasses = Array.from(container.querySelectorAll(`input[name="kelasCheck_${prefix}"]:checked`)).map(c => c.value);
  if (currentSiswaFilter.jenjang === 'all' || checkedClasses.length === 0) {
    currentSiswaFilter.kelas = 'all';
  } else {
    currentSiswaFilter.kelas = checkedClasses;
  }

  // 3. Desa & Kelompok
  const selectDesa = container.querySelector(`#selectDesa_${prefix}`);
  if (selectDesa) currentSiswaFilter.desa = selectDesa.value;

  const selectKel = container.querySelector(`#selectKelompok_${prefix}`);
  if (selectKel) currentSiswaFilter.kelompok = selectKel.value;

  // 4. Status
  const selectedStatus = container.querySelector('[data-status-val].selected');
  if (selectedStatus) currentSiswaFilter.status = selectedStatus.dataset.statusVal;

  // 5. Gender
  const selectedGender = container.querySelector('[data-gender-val].selected');
  if (selectedGender) currentSiswaFilter.gender = selectedGender.dataset.genderVal;

  // 6. Domisili
  const selectedDomisili = container.querySelector('[data-domisili-val].selected');
  if (selectedDomisili) currentSiswaFilter.domisili = selectedDomisili.dataset.domisiliVal;

  toggleSiswaFilterDrawer(false);
  siswaCurrentPage = 1;
  syncBothSiswaDrawers();
  updateSiswaFilterUI();
  renderSiswaTableRows();
}

export function renderActiveSiswaFilterChips() {
  const container = document.getElementById('filterActiveChipsContainer');
  if (!container) return;
  const chips = [];

  // Jenjang Chip
  if (currentSiswaFilter.jenjang && currentSiswaFilter.jenjang !== 'all') {
    let jName = currentSiswaFilter.jenjang;
    if (jName === 'caberawit') jName = 'Caberawit';
    else if (jName === 'gp_reguler') jName = 'GP (Pra-remaja)';
    else if (jName === 'pra_nikah') jName = 'Pra Nikah (19-22 Th)';
    else if (jName === 'remaja') jName = 'Remaja/Dewasa';
    chips.push(`
      <span class="filter-active-chip">
        <span>Jenjang: <strong>${jName}</strong></span>
        <button type="button" data-remove-filter="jenjang" title="Hapus filter jenjang">
          <span class="material-symbols-outlined text-[13px]">close</span>
        </button>
      </span>
    `);
  }

  // Kelas Chips
  if (currentSiswaFilter.kelas && currentSiswaFilter.kelas !== 'all') {
    if (Array.isArray(currentSiswaFilter.kelas)) {
      currentSiswaFilter.kelas.forEach(k => {
        chips.push(`
          <span class="filter-active-chip">
            <span>Kelas: <strong>${k}</strong></span>
            <button type="button" data-remove-kelas="${k}" title="Hapus filter kelas ${k}">
              <span class="material-symbols-outlined text-[13px]">close</span>
            </button>
          </span>
        `);
      });
    } else {
      chips.push(`
        <span class="filter-active-chip">
          <span>Kelas: <strong>${currentSiswaFilter.kelas}</strong></span>
          <button type="button" data-remove-filter="kelas" title="Hapus filter kelas">
            <span class="material-symbols-outlined text-[13px]">close</span>
          </button>
        </span>
      `);
    }
  }

  // Desa Chip
  if (currentSiswaFilter.desa && currentSiswaFilter.desa !== 'all') {
    const d = (MASTER_WILAYAH.desa || []).find(item => item.id === currentSiswaFilter.desa);
    const dName = d ? d.nama : currentSiswaFilter.desa;
    chips.push(`
      <span class="filter-active-chip">
        <span>Desa: <strong>${dName}</strong></span>
        <button type="button" data-remove-filter="desa" title="Hapus filter desa">
          <span class="material-symbols-outlined text-[13px]">close</span>
        </button>
      </span>
    `);
  }

  // Kelompok Chip
  if (currentSiswaFilter.kelompok && currentSiswaFilter.kelompok !== 'all') {
    const allKel = getAllKelompok();
    const k = allKel.find(item => item.id === currentSiswaFilter.kelompok);
    const kName = k ? k.nama : currentSiswaFilter.kelompok;
    chips.push(`
      <span class="filter-active-chip">
        <span>Kelompok: <strong>${kName}</strong></span>
        <button type="button" data-remove-filter="kelompok" title="Hapus filter kelompok">
          <span class="material-symbols-outlined text-[13px]">close</span>
        </button>
      </span>
    `);
  }

  // Status Chip
  if (currentSiswaFilter.status && currentSiswaFilter.status !== 'all') {
    chips.push(`
      <span class="filter-active-chip">
        <span>Status: <strong>${currentSiswaFilter.status}</strong></span>
        <button type="button" data-remove-filter="status" title="Hapus filter status">
          <span class="material-symbols-outlined text-[13px]">close</span>
        </button>
      </span>
    `);
  }

  // Gender Chip
  if (currentSiswaFilter.gender && currentSiswaFilter.gender !== 'all') {
    const gLabel = currentSiswaFilter.gender === 'L' ? 'Putra (L)' : 'Putri (P)';
    chips.push(`
      <span class="filter-active-chip">
        <span>Gender: <strong>${gLabel}</strong></span>
        <button type="button" data-remove-filter="gender" title="Hapus filter gender">
          <span class="material-symbols-outlined text-[13px]">close</span>
        </button>
      </span>
    `);
  }

  // Domisili Chip
  if (currentSiswaFilter.domisili && currentSiswaFilter.domisili !== 'all') {
    chips.push(`
      <span class="filter-active-chip">
        <span>Domisili: <strong>${currentSiswaFilter.domisili}</strong></span>
        <button type="button" data-remove-filter="domisili" title="Hapus filter domisili">
          <span class="material-symbols-outlined text-[13px]">close</span>
        </button>
      </span>
    `);
  }

  if (chips.length > 0) {
    container.innerHTML = `
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">Filter Aktif:</span>
        ${chips.join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <span class="text-[11px] text-slate-400 dark:text-slate-500 italic">Tidak ada filter aktif (menampilkan seluruh data sesuai hak akses wilayah).</span>
    `;
  }

  // Attach chip remove listeners
  container.querySelectorAll('[data-remove-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fKey = btn.dataset.removeFilter;
      if (fKey === 'jenjang') {
        currentSiswaFilter.jenjang = 'all';
        currentSiswaFilter.kelas = 'all';
      } else if (fKey === 'desa') {
        currentSiswaFilter.desa = 'all';
        currentSiswaFilter.kelompok = 'all';
      } else if (fKey in currentSiswaFilter) {
        currentSiswaFilter[fKey] = 'all';
      }
      applyUserRegionFilter();
      siswaCurrentPage = 1;
      syncBothSiswaDrawers();
      updateSiswaFilterUI();
      renderSiswaTableRows();
    });
  });

  container.querySelectorAll('[data-remove-kelas]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const kVal = btn.dataset.removeKelas;
      if (Array.isArray(currentSiswaFilter.kelas)) {
        currentSiswaFilter.kelas = currentSiswaFilter.kelas.filter(k => k !== kVal);
        if (currentSiswaFilter.kelas.length === 0) currentSiswaFilter.kelas = 'all';
      } else {
        currentSiswaFilter.kelas = 'all';
      }
      siswaCurrentPage = 1;
      syncBothSiswaDrawers();
      updateSiswaFilterUI();
      renderSiswaTableRows();
    });
  });
}

export function updateSiswaFilterUI() {
  const activeCount = countActiveSiswaFilters();

  // Badges
  const filterActiveBadge = document.getElementById('filterActiveBadge');
  if (filterActiveBadge) {
    filterActiveBadge.textContent = activeCount;
    if (activeCount > 0) {
      filterActiveBadge.classList.remove('hidden');
    } else {
      filterActiveBadge.classList.add('hidden');
    }
  }

  const floatingFilterBadge = document.getElementById('floatingFilterBadge');
  if (floatingFilterBadge) {
    floatingFilterBadge.textContent = activeCount;
    if (activeCount > 0) {
      floatingFilterBadge.classList.remove('hidden');
    } else {
      floatingFilterBadge.classList.add('hidden');
    }
  }

  // Terapkan label counts
  document.querySelectorAll('.labelApplyCount').forEach(el => {
    el.textContent = activeCount > 0 ? `Terapkan Filter (${activeCount})` : 'Terapkan Filter';
  });

  // Quick Chips in Top Bar
  const chipJenjang = document.getElementById('quickChipJenjang');
  const chipWilayah = document.getElementById('quickChipWilayah');
  const chipStatus = document.getElementById('quickChipStatus');
  const chipGender = document.getElementById('quickChipGender');

  if (chipJenjang) {
    let jText = 'Semua';
    if (currentSiswaFilter.jenjang === 'caberawit') jText = 'Caberawit';
    else if (currentSiswaFilter.jenjang === 'gp_reguler') jText = 'GP';
    else if (currentSiswaFilter.jenjang === 'pra_nikah') jText = 'Pra Nikah';
    else if (currentSiswaFilter.jenjang === 'remaja') jText = 'Remaja';
    if (currentSiswaFilter.kelas && currentSiswaFilter.kelas !== 'all') {
      const kStr = Array.isArray(currentSiswaFilter.kelas) ? currentSiswaFilter.kelas.join(', ') : currentSiswaFilter.kelas;
      jText += ` (${kStr})`;
    }
    chipJenjang.textContent = jText;
    chipJenjang.closest('.filter-quick-chip')?.classList.toggle('active', currentSiswaFilter.jenjang !== 'all' || currentSiswaFilter.kelas !== 'all');
  }

  if (chipWilayah) {
    let wText = 'Semua';
    if (currentSiswaFilter.desa !== 'all') {
      const d = (MASTER_WILAYAH.desa || []).find(item => item.id === currentSiswaFilter.desa);
      wText = d ? d.nama : currentSiswaFilter.desa;
      if (currentSiswaFilter.kelompok !== 'all') {
        const k = getAllKelompok().find(item => item.id === currentSiswaFilter.kelompok);
        if (k) wText += ` / ${k.nama}`;
      }
    }
    chipWilayah.textContent = wText;
    chipWilayah.closest('.filter-quick-chip')?.classList.toggle('active', currentSiswaFilter.desa !== 'all' || currentSiswaFilter.kelompok !== 'all');
  }

  if (chipStatus) {
    chipStatus.textContent = currentSiswaFilter.status === 'all' ? 'Semua' : currentSiswaFilter.status;
    chipStatus.closest('.filter-quick-chip')?.classList.toggle('active', currentSiswaFilter.status !== 'all');
  }

  if (chipGender) {
    let gText = 'Semua';
    if (currentSiswaFilter.gender === 'L') gText = 'Putra (L)';
    else if (currentSiswaFilter.gender === 'P') gText = 'Putri (P)';
    chipGender.textContent = gText;
    chipGender.closest('.filter-quick-chip')?.classList.toggle('active', currentSiswaFilter.gender !== 'all');
  }

  renderActiveSiswaFilterChips();
}

export function renderSiswaModal() {
  updateDashboardStats();
  applyUserRegionFilter();
  const allList = getSiswaList();
  const activeCount = allList.filter(isSiswaAktif).length;
  const totalCount = allList.length;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- BARIS 1: PENCARIAN & AKSI CEPAT (TAMBAH, EXPORT, IMPORT, KENAIKAN) -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <!-- Search bar -->
        <div class="relative flex-1 max-w-md">
          <input type="text" id="inputSiswaSearch" class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-xs" value="${currentSiswaFilter.search}" placeholder="Cari nama, NIS, atau kelompok..." />
          <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <button type="button" id="btnTambahSiswaBaru" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer" title="Tambah Data Generus Baru">
            <span class="material-symbols-outlined text-[17px]">person_add</span>
            <span>Tambah Generus</span>
          </button>
          
          <button type="button" id="btnExportPdfGenerus" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 dark:bg-slate-800 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer" title="Export PDF">
            <span class="material-symbols-outlined text-[17px] text-amber-600">picture_as_pdf</span>
            <span class="hidden sm:inline">PDF</span>
          </button>

          <button type="button" id="btnExportExcelGenerus" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer" title="Export Excel">
            <span class="material-symbols-outlined text-[17px] text-emerald-600">table_view</span>
            <span class="hidden sm:inline">Excel</span>
          </button>

          <button type="button" id="btnImportWizardGenerus" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer" title="Import Data">
            <span class="material-symbols-outlined text-[17px] text-blue-600">upload_file</span>
            <span class="hidden sm:inline">Import</span>
          </button>

          <button type="button" id="btnAutoPromoteJenjang" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 dark:bg-slate-800 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer" title="Kenaikan Jenjang">
            <span class="material-symbols-outlined text-[17px] text-purple-600">auto_mode</span>
            <span class="hidden sm:inline">Kenaikan</span>
          </button>

          <!-- Hidden legacy buttons for backward compatibility -->
          <button type="button" id="btnExportCsvGenerus" style="display:none;" aria-hidden="true"></button>
          <input type="file" id="inputImportCsvGenerus" accept=".csv,.xlsx,.xls" style="display:none;" />
          <button type="button" id="btnImportCsvGenerus" style="display:none;" aria-hidden="true"></button>
        </div>
      </div>

      <!-- BULK ACTION BAR -->
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

      <!-- MULTI-LEVEL FILTER BAR TEMPLATE -->
      <div class="filter-bar-shell">
        <!-- Top row: Primary filter button + Quick chips + Reset -->
        <div class="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">Filter:</span>
            
            <!-- Primary Filter Pill -->
            <button type="button" id="btnOpenFilterDrawer" class="filter-main-btn" title="Buka Panel Filter Lengkap">
              <span class="material-symbols-outlined text-[17px]">tune</span>
              <span>Filter</span>
              <span id="filterActiveBadge" class="filter-badge hidden">0</span>
            </button>

            <!-- Quick Filter Chips -->
            <button type="button" class="filter-quick-chip" data-quick-filter="jenjang" title="Pilih Jenjang">
              <span>Jenjang: <strong id="quickChipJenjang">Semua</strong></span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            <button type="button" class="filter-quick-chip" data-quick-filter="wilayah" title="Pilih Wilayah">
              <span>Wilayah: <strong id="quickChipWilayah">Semua</strong></span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            <button type="button" class="filter-quick-chip" data-quick-filter="status" title="Pilih Status">
              <span>Status: <strong id="quickChipStatus">Semua</strong></span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            <button type="button" class="filter-quick-chip" data-quick-filter="gender" title="Pilih Gender">
              <span>Gender: <strong id="quickChipGender">Semua</strong></span>
              <span class="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>

          <!-- Reset All -->
          <button type="button" id="btnResetAllFilters" class="filter-reset-link" title="Reset Semua Kriteria Filter">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset Filter</span>
          </button>
        </div>

        <!-- Active Filter Tags / Chips -->
        <div id="filterActiveChipsContainer" class="pt-1 border-t border-slate-200/70 dark:border-slate-700/70 min-h-[26px]">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <!-- OVERLAY BACKDROP -->
      <div id="filterOverlayBackdrop" class="filter-overlay-backdrop"></div>

      <!-- DESKTOP OVERLAY DRAWER (MD UP) -->
      <aside id="filterDesktopDrawer" class="filter-drawer-desktop hidden md:flex">
        <!-- Header -->
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">tune</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800 dark:text-white">Filter Generus</h3>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">Pilih kriteria untuk menyaring data</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" class="btnApplyFilterDrawer px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer">
              Terapkan
            </button>
            <button type="button" class="btnCloseFilterDrawer p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" title="Tutup Filter">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <!-- Body: Scrollable Accordion Content -->
        <div id="desktopDrawerBody" class="flex-1 overflow-y-auto">
          <!-- Populated dynamically -->
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <button type="button" class="btnResetFilterDrawer filter-reset-link">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset Semua</span>
          </button>
          <button type="button" class="btnApplyFilterDrawer flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">check</span>
            <span class="labelApplyCount">Terapkan Filter</span>
          </button>
        </div>
      </aside>

      <!-- MOBILE BOTTOM SHEET (MAX-MD) -->
      <div id="filterMobileBottomSheet" class="filter-bottom-sheet-mobile md:hidden">
        <!-- Drag Handle -->
        <div class="pt-3 pb-1 flex justify-center">
          <div class="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        </div>

        <!-- Header -->
        <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button type="button" class="btnCloseFilterDrawer text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1">
            <span class="material-symbols-outlined text-[18px]">close</span>
            <span>Tutup</span>
          </button>
          <div class="text-sm font-bold text-slate-800 dark:text-white">Filter Generus</div>
          <button type="button" class="btnApplyFilterDrawer px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
            Terapkan
          </button>
        </div>

        <!-- Body -->
        <div id="mobileSheetBody" class="flex-1 overflow-y-auto">
          <!-- Populated dynamically -->
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3 pb-safe">
          <button type="button" class="btnResetFilterDrawer filter-reset-link">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset</span>
          </button>
          <button type="button" class="btnApplyFilterDrawer flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">check</span>
            <span class="labelApplyCount">Terapkan Filter</span>
          </button>
        </div>
      </div>

      <!-- MOBILE FLOATING ACTION PILL -->
      <button type="button" id="btnFloatingFilterMobile" class="filter-floating-pill md:hidden" title="Buka Filter Generus">
        <span class="material-symbols-outlined text-[18px]">tune</span>
        <span>Filter Generus</span>
        <span id="floatingFilterBadge" class="filter-badge hidden">0</span>
      </button>

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
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('nama_lengkap')">
                <span class="inline-flex items-center gap-1">Nama Lengkap <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('tempat_lahir')">
                <span class="inline-flex items-center gap-1">Tempat Lahir <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('tanggal_lahir')">
                <span class="inline-flex items-center gap-1">Tgl Lahir <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('desa_id')">
                <span class="inline-flex items-center gap-1">Desa <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('kelompok_id')">
                <span class="inline-flex items-center gap-1">Kelompok <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('usia')">
                <span class="inline-flex items-center gap-1">Usia <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('jenis_kelamin')">
                <span class="inline-flex items-center gap-1">L/P <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('kategori_usia')">
                <span class="inline-flex items-center gap-1">Jenjang &amp; Kelas <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
              <th style="padding:10px 12px;text-align:left;white-space:nowrap;">No. HP</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;">Domisili</th>
              <th style="padding:10px 12px;text-align:center;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('status_sambung')">
                <span class="inline-flex items-center gap-1">Status <span class="material-symbols-outlined text-[14px] opacity-70">unfold_more</span></span>
              </th>
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

  const viewContainer = document.getElementById('viewDatabaseGenerus');
  if (viewContainer) {
    viewContainer.innerHTML = `
      <!-- Top Bar: Breadcrumb -->
      <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">
          <button type="button" class="btnBackToDashboardBreadcrumb hover:text-brandBlue dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors">
            <span class="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Dashboard</span>
          </button>
          <span class="text-slate-300 dark:text-slate-600">/</span>
          <span class="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
            <span class="material-symbols-outlined text-purple-600 text-[18px]">database</span>
            Database Generus
          </span>
        </div>
      </div>

      <!-- Header Hero Banner with Statistics -->
      <div class="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 rounded-2xl p-4 md:p-5 text-white shadow-md relative overflow-hidden">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold border border-white/30 mb-1.5">
              <span class="material-symbols-outlined text-[14px]">groups</span>
              <span>Pusat Data Generus Solo Selatan</span>
            </div>
            <h1 class="text-lg md:text-xl font-extrabold tracking-tight">Database Generus</h1>
            <p class="text-xs text-purple-100 mt-0.5 leading-relaxed">
              Data profil santri, jenjang pembinaan, mutasi sambung, dan monitoring usia generasi penerus se-Daerah Solo Selatan.
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/15 text-xs font-bold">
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/80 text-white font-extrabold">${activeCount} Aktif</span>
            <span class="text-purple-100">&bull;</span>
            <span class="text-white">${totalCount} Total Generus</span>
          </div>
        </div>
      </div>

      <!-- Main Card Body -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm space-y-4">
        ${modalHtml}
      </div>
    `;

    viewContainer.querySelectorAll('.btnBackToDashboardBreadcrumb').forEach(b => {
      b.addEventListener('click', showDashboardHomePage);
    });
  } else {
    openModal(`Database Generus (${activeCount} Aktif / ${totalCount} Total)`, 'database', modalHtml, 'wide');
  }

  // Populate Drawers & Sync UI
  syncBothSiswaDrawers();
  updateSiswaFilterUI();

  // Search Input Listener
  document.getElementById('inputSiswaSearch')?.addEventListener('input', (e) => {
    currentSiswaFilter.search = e.target.value;
    siswaCurrentPage = 1;
    renderSiswaTableRows();
  });

  // Open Drawer Buttons
  document.getElementById('btnOpenFilterDrawer')?.addEventListener('click', () => {
    toggleSiswaFilterDrawer(true);
  });
  document.getElementById('btnFloatingFilterMobile')?.addEventListener('click', () => {
    toggleSiswaFilterDrawer(true);
  });

  // Close Drawer Buttons
  document.querySelectorAll('.btnCloseFilterDrawer').forEach(btn => {
    btn.addEventListener('click', () => toggleSiswaFilterDrawer(false));
  });
  document.getElementById('filterOverlayBackdrop')?.addEventListener('click', () => {
    toggleSiswaFilterDrawer(false);
  });

  // Apply Buttons
  document.querySelectorAll('.btnApplyFilterDrawer').forEach(btn => {
    btn.addEventListener('click', applySiswaDrawerFilters);
  });

  // Reset Buttons
  function handleResetFilters() {
    currentSiswaFilter.desa = 'all';
    currentSiswaFilter.kelompok = 'all';
    currentSiswaFilter.jenjang = 'all';
    currentSiswaFilter.kelas = 'all';
    currentSiswaFilter.status = 'all';
    currentSiswaFilter.gender = 'all';
    currentSiswaFilter.domisili = 'all';
    applyUserRegionFilter(true);
    siswaCurrentPage = 1;
    syncBothSiswaDrawers();
    updateSiswaFilterUI();
    renderSiswaTableRows();
  }

  document.getElementById('btnResetAllFilters')?.addEventListener('click', handleResetFilters);
  document.querySelectorAll('.btnResetFilterDrawer').forEach(btn => {
    btn.addEventListener('click', handleResetFilters);
  });

  // Quick Filter Chips (opens drawer and opens target section)
  document.querySelectorAll('[data-quick-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.quickFilter;
      toggleSiswaFilterDrawer(true);
      const isDesktop = window.innerWidth >= 768;
      const prefix = isDesktop ? 'dt' : 'mb';
      let secId = '';
      if (target === 'jenjang') secId = `accordionJenjang_${prefix}`;
      else if (target === 'wilayah') secId = `accordionWilayah_${prefix}`;
      else if (target === 'status') secId = `accordionStatus_${prefix}`;
      else if (target === 'gender') secId = `accordionGender_${prefix}`;

      if (secId) {
        const sec = document.getElementById(secId);
        if (sec) {
          sec.classList.add('open');
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Action Buttons
  document.getElementById('btnAutoPromoteJenjang')?.addEventListener('click', () => {
    renderAutoPromoteModal();
  });

  document.getElementById('btnTambahSiswaBaru')?.addEventListener('click', () => {
    renderSiswaFormModal(null);
  });

  // Export & Import Listeners
  document.getElementById('btnExportPdfGenerus')?.addEventListener('click', () => {
    exportGenerusToPdf();
  });

  document.getElementById('btnExportExcelGenerus')?.addEventListener('click', () => {
    exportGenerusToExcel(false);
  });

  document.getElementById('btnExportCsvGenerus')?.addEventListener('click', () => {
    exportGenerusToExcel(false);
  });

  document.getElementById('btnImportWizardGenerus')?.addEventListener('click', () => {
    openImportWizardModal();
  });

  const fileInput = document.getElementById('inputImportCsvGenerus');
  document.getElementById('btnImportCsvGenerus')?.addEventListener('click', () => {
    openImportWizardModal();
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      openImportWizardModal();
      handleWizardFileSelected(e.target.files[0]);
    }
  });

  // Initial render of rows
  renderSiswaTableRows();
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT & SMART IMPORT WIZARD FUNCTIONS (EXCEL & CSV)
   ═══════════════════════════════════════════════════════════════════════════ */

let _parsedImportData = [];

/**
 * Ekspor Data Generus ke Laporan PDF Resmi (A4 Landscape)
 */
export function exportGenerusToPdf() {
  applyUserRegionFilter();
  try {
    sessionStorage.setItem('ppg_export_filter', JSON.stringify(currentSiswaFilter));
  } catch (e) {
    console.warn('Gagal menyimpan filter ekspor:', e);
  }
  showToast('Membuka pratinjau cetak PDF Data Generus...', 'info');
  window.open('../laporan/laporan-generus.html', '_blank');
}

/**
 * Ekspor Data Generus Lengkap ke Format Excel (.xlsx) atau CSV
 */
export function exportGenerusToExcel(filteredOnly = false) {
  const isSuperadminOrDaerah = currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah');
  applyUserRegionFilter();
  const allSiswa = getSiswaList();
  const shouldFilter = filteredOnly || !isSuperadminOrDaerah;
  const targetList = shouldFilter
    ? allSiswa.filter(s => {
      if (currentSiswaFilter.status !== 'all' && s.status_sambung !== currentSiswaFilter.status) return false;
      if (currentSiswaFilter.desa !== 'all' && s.desa_id !== currentSiswaFilter.desa) return false;
      if (currentSiswaFilter.kelompok !== 'all' && s.kelompok_id !== currentSiswaFilter.kelompok) return false;
      if (currentSiswaFilter.jenjang !== 'all') {
        if (currentSiswaFilter.jenjang === 'pra_nikah') {
          const u = calculateUmur(s.tanggal_lahir);
          const isPraNikahAge = u >= 19 && u <= 22;
          const isPraNikahClass = s.jenjang_kelas === 'Pra-Nikah' || s.jenjang_kelas === '19-22 Tahun';
          const isPraNikahKat = s.kategori_usia === 'pra_nikah';
          if (!isPraNikahAge && !isPraNikahClass && !isPraNikahKat) return false;
        } else if (s.kategori_usia !== currentSiswaFilter.jenjang) {
          return false;
        }
      }
      if (currentSiswaFilter.kelas && currentSiswaFilter.kelas !== 'all') {
        if (Array.isArray(currentSiswaFilter.kelas)) {
          if (currentSiswaFilter.kelas.length > 0 && !currentSiswaFilter.kelas.includes(s.jenjang_kelas)) return false;
        } else if (s.jenjang_kelas !== currentSiswaFilter.kelas) {
          return false;
        }
      }
      if (currentSiswaFilter.gender && currentSiswaFilter.gender !== 'all') {
        const g = (s.jenis_kelamin || '').toUpperCase();
        if (currentSiswaFilter.gender === 'L' && g !== 'L') return false;
        if (currentSiswaFilter.gender === 'P' && g !== 'P') return false;
      }
      if (currentSiswaFilter.domisili && currentSiswaFilter.domisili !== 'all') {
        const dom = (s.domisili || 'Pribumi').toLowerCase();
        if (dom !== currentSiswaFilter.domisili.toLowerCase()) return false;
      }
      return true;
    })
    : allSiswa;

  if (targetList.length === 0) {
    showToast('Tidak ada data generus untuk diekspor!', 'warning');
    return;
  }

  // Jika SheetJS (XLSX) tersedia, ekspor native .xlsx
  if (typeof XLSX !== 'undefined') {
    const rows = [
      [
        'NO',
        'NAMA LENGKAP',
        'JENIS KELAMIN (L/P)',
        'TEMPAT LAHIR',
        'TANGGAL LAHIR (YYYY-MM-DD)',
        'USIA',
        'KATEGORI USIA',
        'JENJANG / KELAS',
        'DESA',
        'KELOMPOK',
        'NAMA AYAH',
        'NAMA IBU',
        'NO HP / WHATSAPP',
        'DOMISILI',
        'STATUS SAMBUNG'
      ]
    ];

    targetList.forEach((s, idx) => {
      const usia = s.tanggal_lahir ? calculateUmur(s.tanggal_lahir) : '';
      rows.push([
        idx + 1,
        s.nama_lengkap || '',
        s.jenis_kelamin || 'L',
        s.tempat_lahir || '',
        s.tanggal_lahir || '',
        usia,
        s.kategori_usia || '',
        s.jenjang_kelas || '',
        s.desa_nama || '',
        s.kelompok_nama || '',
        s.nama_ayah || '',
        s.nama_ibu || '',
        s.no_hp || '',
        s.domisili || 'Pribumi',
        s.status_sambung || 'Sambung'
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 28 }, // Nama
      { wch: 10 }, // Gender
      { wch: 18 }, // Tempat
      { wch: 16 }, // Tgl Lahir
      { wch: 6 },  // Usia
      { wch: 16 }, // Kategori
      { wch: 16 }, // Kelas
      { wch: 14 }, // Desa
      { wch: 18 }, // Kelompok
      { wch: 18 }, // Ayah
      { wch: 18 }, // Ibu
      { wch: 16 }, // HP
      { wch: 12 }, // Domisili
      { wch: 14 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data Generus');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Data_Generus_PPG_Solo_Selatan_${dateStr}.xlsx`);
    showToast(`Berhasil mengekspor ${targetList.length} data ke Excel (.xlsx)!`, 'success');
  } else {
    // Fallback CSV (UTF-8 BOM)
    let csvContent = "\uFEFF";
    csvContent += "NO;NAMA_LENGKAP;JENIS_KELAMIN;TEMPAT_LAHIR;TANGGAL_LAHIR;USIA;KATEGORI_USIA;JENJANG_KELAS;DESA;KELOMPOK;NAMA_AYAH;NAMA_IBU;NO_HP;DOMISILI;STATUS_SAMBUNG\n";
    targetList.forEach((s, idx) => {
      const clean = (str) => '"' + (str || '').toString().replace(/"/g, '""') + '"';
      const usia = s.tanggal_lahir ? calculateUmur(s.tanggal_lahir) : '';
      csvContent += `${idx + 1};${clean(s.nama_lengkap)};${clean(s.jenis_kelamin)};${clean(s.tempat_lahir)};${clean(s.tanggal_lahir)};${usia};${clean(s.kategori_usia)};${clean(s.jenjang_kelas)};${clean(s.desa_nama)};${clean(s.kelompok_nama)};${clean(s.nama_ayah)};${clean(s.nama_ibu)};${clean(s.no_hp)};${clean(s.domisili)};${clean(s.status_sambung)}\n`;
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
    showToast(`Berhasil mengekspor ${targetList.length} data ke CSV!`, 'success');
  }
}

/**
 * Unduh Template Resmi Excel (.xlsx) untuk Import Generus
 */
export function downloadTemplateImportGenerus() {
  if (typeof XLSX === 'undefined') {
    alert('Pustaka Excel sedang dimuat, silakan coba sesaat lagi.');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: DATA SANTRI (Template Utama)
  const header = [
    'NAMA LENGKAP *',
    'JENIS KELAMIN (L/P) *',
    'TEMPAT LAHIR',
    'TANGGAL LAHIR (YYYY-MM-DD)',
    'KATEGORI USIA',
    'JENJANG / KELAS',
    'DESA *',
    'KELOMPOK *',
    'NAMA AYAH',
    'NAMA IBU',
    'NO HP / WA',
    'DOMISILI',
    'STATUS SAMBUNG'
  ];

  const sampleRows = [
    [
      'Muhammad Faiz Pratama',
      'L',
      'Surakarta',
      '2017-04-12',
      'caberawit',
      '2 SD',
      'Barat',
      'Gentan',
      'Bpk. Joko Susilo',
      'Ibu Siti Aminah',
      '081234567890',
      'Pribumi',
      'Sambung'
    ],
    [
      'Aisyah Nur Azizah',
      'P',
      'Sukoharjo',
      '2012-08-25',
      'gp_reguler',
      '1 SMP',
      'Selatan',
      'Solo Baru',
      'Bpk. Ahmad Fauzi',
      'Ibu Fatimah',
      '089876543210',
      'Pribumi',
      'Sambung'
    ],
    [
      'Rizky Pratama Yudha',
      'L',
      'Surakarta',
      '2004-11-15',
      'remaja',
      'Mahasiswa',
      'Tengah',
      'Baluwarti',
      'Bpk. Hendro',
      'Ibu Lestari',
      '085678901234',
      'Pribumi',
      'Sambung'
    ]
  ];

  const wsData = XLSX.utils.aoa_to_sheet([header, ...sampleRows]);
  wsData['!cols'] = [
    { wch: 28 }, // Nama
    { wch: 14 }, // Gender
    { wch: 18 }, // Tempat
    { wch: 20 }, // Tgl Lahir
    { wch: 16 }, // Kategori
    { wch: 16 }, // Kelas
    { wch: 14 }, // Desa
    { wch: 18 }, // Kelompok
    { wch: 20 }, // Ayah
    { wch: 20 }, // Ibu
    { wch: 16 }, // HP
    { wch: 14 }, // Domisili
    { wch: 16 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, wsData, 'DATA_SANTRI');

  // Sheet 2: PANDUAN & DAFTAR WILAYAH
  const allK = getAllKelompok();
  const guideRows = [
    ['PANDUAN PENGISIAN TEMPLATE EXCEL DATA GENERUS PPG SOLO SELATAN'],
    ['1. Kolom bertanda (*) WAJIB diisi (Nama Lengkap, Gender, Desa, Kelompok).'],
    ['2. Format Tanggal Lahir: YYYY-MM-DD (Contoh: 2015-05-20) atau DD/MM/YYYY.'],
    ['3. Jenis Kelamin: L (Laki-laki) atau P (Perempuan).'],
    ['4. Kategori Usia: caberawit, gp_reguler, atau remaja.'],
    ['5. Status Sambung: Sambung, Pindah Sambung, atau Menikah (Default: Sambung).'],
    [''],
    ['DAFTAR 5 DESA RESMI:', 'DAFTAR 27 KELOMPOK RESMI:']
  ];

  MASTER_WILAYAH.desa.forEach((d, idx) => {
    guideRows.push([`Desa ${d.nama}`, '']);
  });

  allK.forEach(k => {
    guideRows.push(['', `${k.nama} (Desa ${k.desaNama})`]);
  });

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [{ wch: 25 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PANDUAN_WILAYAH');

  XLSX.writeFile(wb, 'Template_Import_Generus_PPGSoloSelatan.xlsx');
  showToast('Template Excel berhasil diunduh!', 'success');
}

/**
 * Modal Wizard Import Cerdas (Excel & CSV)
 */
export function openImportWizardModal() {
  _parsedImportData = [];

  const modalHtml = `
    <div class="import-wizard-wrapper" style="padding:4px 0;">
      <!-- TOP BANNER -->
      <div class="import-wizard-banner">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span class="material-symbols-outlined" style="font-size:28px;color:#2563eb;flex-shrink:0;">lightbulb</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:800;color:var(--text);">Import Cerdas &amp; Fleksibel</div>
            <p style="font-size:11.5px;color:var(--text-muted);margin-top:2px;line-height:1.4;">
              Unggah berkas <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> yang Anda miliki. Sistem cerdas otomatis mengenali nama kolom dan menormalkan nama Desa serta Kelompok.
            </p>
          </div>
          <button type="button" id="btnDownloadTemplateInWizard" class="btn-download-template" title="Download Template Excel Resmi">
            <span class="material-symbols-outlined" style="font-size:16px;">download</span>
            <span>Unduh Template (.xlsx)</span>
          </button>
        </div>
      </div>

      <!-- DROPZONE AREA -->
      <div id="importDropZone" class="import-dropzone">
        <input type="file" id="inputWizardFile" accept=".xlsx,.xls,.csv" style="display:none;" />
        <span class="material-symbols-outlined" style="font-size:44px;color:#3b82f6;margin-bottom:6px;">cloud_upload</span>
        <div style="font-size:14px;font-weight:800;color:var(--text);">Pilih atau Tarik Berkas Excel / CSV ke Sini</div>
        <p style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">Mendukung berkas Microsoft Excel (.xlsx, .xls) dan CSV terdelimitasi</p>
        <button type="button" id="btnBrowseFile" class="btn-browse-file">
          <span class="material-symbols-outlined" style="font-size:16px;">folder_open</span>
          <span>Pilih Berkas Komputer</span>
        </button>
      </div>

      <!-- CONTAINER HASIL BACA & PRATINJAU -->
      <div id="importPreviewContainer" style="display:none;margin-top:16px;">
        <!-- STATS CARDS -->
        <div class="import-stat-grid">
          <div class="import-stat-card">
            <span class="lbl">Total Terbaca</span>
            <span id="statTotalRead" class="val" style="color:#0284c7;">0</span>
          </div>
          <div class="import-stat-card">
            <span class="lbl">Data Baru (Siap Tambah)</span>
            <span id="statTotalNew" class="val" style="color:#10b981;">0</span>
          </div>
          <div class="import-stat-card">
            <span class="lbl">Duplikat Terdeteksi</span>
            <span id="statTotalDup" class="val" style="color:#f59e0b;">0</span>
          </div>
          <div class="import-stat-card">
            <span class="lbl">Perlu Diperbaiki</span>
            <span id="statTotalInvalid" class="val" style="color:#ef4444;">0</span>
          </div>
        </div>

        <!-- TOGGLE SETTINGS -->
        <div class="import-options-box">
          <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;font-weight:700;color:var(--text);">
            <input type="checkbox" id="checkUpdateDuplicates" checked style="width:16px;height:16px;accent-color:#2563eb;" />
            <span>Perbarui data jika ditemukan nama &amp; tgl lahir/kelompok yang sama (Update/Overwrite)</span>
          </label>
          <span style="font-size:11px;color:var(--text-muted);display:block;margin-left:24px;margin-top:2px;">
            Jika dimatikan, data yang sudah ada di database akan dilewati (Skip) dan hanya data santri baru yang ditambahkan.
          </span>
        </div>

        <!-- PREVIEW TABLE WRAPPER -->
        <div class="import-table-wrap">
          <table class="import-preview-table">
            <thead>
              <tr>
                <th style="width:38px;text-align:center;">No</th>
                <th style="width:85px;text-align:center;">Status</th>
                <th style="width:160px;">Nama Lengkap</th>
                <th style="width:40px;text-align:center;">L/P</th>
                <th style="width:120px;">Tgl Lahir / Usia</th>
                <th style="width:110px;">Jenjang / Kelas</th>
                <th style="width:90px;">Desa</th>
                <th style="width:100px;">Kelompok</th>
                <th style="width:100px;">No. HP</th>
              </tr>
            </thead>
            <tbody id="importPreviewTbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <!-- ACTIONS FOOTER -->
        <div class="import-modal-footer">
          <button type="button" id="btnCancelImport" class="btn-cancel-import">
            <span>Batal</span>
          </button>
          <button type="button" id="btnSubmitBatchImport" class="btn-submit-import">
            <span class="material-symbols-outlined" style="font-size:18px;">save</span>
            <span id="txtBtnSubmitImport">Simpan ke Database</span>
          </button>
        </div>
      </div>
    </div>
  `;

  openModal('Import Data Generus (Excel / CSV)', 'upload_file', modalHtml, 'wide');

  // Attach handlers in wizard
  document.getElementById('btnDownloadTemplateInWizard')?.addEventListener('click', () => {
    downloadTemplateImportGenerus();
  });

  const fileInput = document.getElementById('inputWizardFile');
  const dropZone = document.getElementById('importDropZone');

  document.getElementById('btnBrowseFile')?.addEventListener('click', () => {
    fileInput?.click();
  });

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-active');
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleWizardFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleWizardFileSelected(e.target.files[0]);
    }
  });

  document.getElementById('btnCancelImport')?.addEventListener('click', () => {
    closeModal();
  });

  document.getElementById('btnSubmitBatchImport')?.addEventListener('click', () => {
    confirmAndExecuteBatchImport();
  });
}

function handleWizardFileSelected(file) {
  if (!file) return;

  const fileName = file.name || 'Berkas';
  showToast(`Membaca berkas: ${fileName}...`, 'info');

  const reader = new FileReader();
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (isExcel) {
    if (typeof XLSX === 'undefined') {
      alert('Pustaka pembaca Excel sedang dimuat. Silakan tunggu beberapa detik dan coba lagi.');
      return;
    }
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        let sheetName = workbook.SheetNames[0];
        const match = workbook.SheetNames.find(n =>
          n.toUpperCase().includes('DATA') || n.toUpperCase().includes('SANTRI') || n.toUpperCase().includes('SISWA')
        );
        if (match) sheetName = match;

        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
        processRawSheetRows(rawJson, fileName);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        alert('Gagal membaca berkas Excel. Pastikan berkas tidak rusak atau terproteksi password.');
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    // CSV Text
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          alert('Berkas CSV kosong atau tidak memiliki baris data.');
          return;
        }
        const firstLine = lines[0];
        const delimiter = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
        const rawJson = lines.map(line => {
          const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
          const row = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
            row.push((val || '').trim());
          }
          return row;
        });
        processRawSheetRows(rawJson, fileName);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        alert('Gagal membaca berkas CSV.');
      }
    };
    reader.readAsText(file);
  }
}

function processRawSheetRows(rawRows, fileName) {
  if (!rawRows || rawRows.length < 2) {
    alert('Berkas tidak memiliki cukup baris data (minimal 1 baris header dan 1 baris data).');
    return;
  }

  // Cari baris header dalam 5 baris pertama
  let headerIndex = 0;
  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const rowStr = (rawRows[r] || []).join(' ').toLowerCase();
    if (rowStr.includes('nama') || rowStr.includes('name') || rowStr.includes('santri')) {
      headerIndex = r;
      break;
    }
  }

  const rawHeaders = (rawRows[headerIndex] || []).map(h => (h || '').toString().trim());
  const colMap = smartMapHeaders(rawHeaders);

  if (colMap.nama_lengkap === undefined) {
    alert('Kolom "Nama Lengkap" tidak terdeteksi pada berkas. Pastikan ada kolom yang memuat nama santri.');
    return;
  }

  const allExistingSiswa = getSiswaList();
  const allKelompok = getAllKelompok();
  const parsedItems = [];

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const getVal = (field) => {
      const idx = colMap[field];
      if (idx === undefined || idx >= row.length) return '';
      return (row[idx] || '').toString().trim();
    };

    const namaLengkap = getVal('nama_lengkap');
    if (!namaLengkap) continue; // Lewati baris kosong tanpa nama

    const tempatLahir = getVal('tempat_lahir');
    let tanggalLahir = getVal('tanggal_lahir');
    tanggalLahir = normalizeDateString(tanggalLahir);

    let jk = getVal('jenis_kelamin').toUpperCase();
    if (jk.includes('P') || jk.includes('WANITA') || jk.includes('PEREMPUAN')) jk = 'P';
    else jk = 'L';

    // Normalisasi Desa & Kelompok
    const rawDesa = getVal('desa');
    const rawKelompok = getVal('kelompok');
    const resolvedWilayah = resolveDesaKelompok(rawDesa, rawKelompok, allKelompok);

    let usia = tanggalLahir ? calculateUmur(tanggalLahir) : null;

    // Normalisasi Kategori & Jenjang
    let rawKategori = getVal('kategori_usia').toLowerCase();
    let rawKelas = getVal('jenjang_kelas');

    let kategoriUsia = 'caberawit';
    if (rawKategori.includes('gp') || rawKategori.includes('reguler') || rawKategori.includes('smp')) {
      kategoriUsia = 'gp_reguler';
    } else if (rawKategori.includes('remaja') || rawKategori.includes('mandiri') || rawKategori.includes('nikah')) {
      kategoriUsia = 'remaja';
    } else if (rawKategori.includes('caberawit') || rawKategori.includes('paud') || rawKategori.includes('sd')) {
      kategoriUsia = 'caberawit';
    } else if (usia !== null) {
      kategoriUsia = determineJenjangByAge(usia);
    }

    let jenjangKelas = rawKelas;
    if (!jenjangKelas && usia !== null) {
      if (usia < 5) jenjangKelas = 'PAUD';
      else if (usia === 5) jenjangKelas = 'TK A';
      else if (usia === 6) jenjangKelas = 'TK B';
      else if (usia >= 7 && usia <= 12) jenjangKelas = `${usia - 6} SD`;
      else if (usia >= 13 && usia <= 15) jenjangKelas = `${usia - 12} SMP`;
      else if (usia >= 16 && usia <= 18) jenjangKelas = `${usia - 15} SMA`;
      else if (usia > 18 && usia <= 22) jenjangKelas = 'Pra-Nikah';
      else jenjangKelas = 'Kelas Remaja';
    }

    const namaAyah = getVal('nama_ayah');
    const namaIbu = getVal('nama_ibu');
    const noHp = getVal('no_hp');
    let domisili = getVal('domisili') || 'Pribumi';
    let statusSambung = getVal('status_sambung') || 'Sambung';

    // Cek Duplikasi
    const existing = allExistingSiswa.find(s => {
      const matchName = (s.nama_lengkap || '').trim().toLowerCase() === namaLengkap.toLowerCase();
      if (!matchName) return false;
      if (tanggalLahir && s.tanggal_lahir) {
        return tanggalLahir === s.tanggal_lahir;
      }
      if (resolvedWilayah.kelompokId && s.kelompok_id) {
        return resolvedWilayah.kelompokId === s.kelompok_id;
      }
      return true;
    });

    const isDuplicate = !!existing;
    const existingId = existing ? existing.id : null;

    parsedItems.push({
      status: isDuplicate ? 'DUPLICATE' : 'NEW',
      existingId: existingId,
      data: {
        nama_lengkap: namaLengkap,
        tempat_lahir: tempatLahir || '-',
        tanggal_lahir: tanggalLahir || '',
        jenis_kelamin: jk,
        kategori_usia: kategoriUsia,
        jenjang_kelas: jenjangKelas || '-',
        desa_id: resolvedWilayah.desaId,
        desa_nama: resolvedWilayah.desaNama,
        kelompok_id: resolvedWilayah.kelompokId,
        kelompok_nama: resolvedWilayah.kelompokNama,
        nama_ayah: namaAyah || '-',
        nama_ibu: namaIbu || '-',
        no_hp: noHp || '-',
        domisili: domisili,
        status_sambung: statusSambung
      }
    });
  }

  _parsedImportData = parsedItems;
  renderImportPreviewResults(parsedItems, fileName);
}

function smartMapHeaders(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return;

    if (clean.includes('namalengkap') || clean.includes('namasiswa') || clean.includes('namasantri') || clean === 'nama' || clean === 'fullname') {
      if (map.nama_lengkap === undefined) map.nama_lengkap = idx;
    } else if (clean.includes('tempatlahir') || clean.includes('tmplahir') || clean.includes('kotalahir') || clean === 'tempat') {
      if (map.tempat_lahir === undefined) map.tempat_lahir = idx;
    } else if (clean.includes('tanggallahir') || clean.includes('tgllahir') || clean === 'tgl' || clean === 'ttl' || clean === 'dob' || clean.includes('birth')) {
      if (map.tanggal_lahir === undefined) map.tanggal_lahir = idx;
    } else if (clean.includes('jeniskelamin') || clean.includes('kelamin') || clean === 'gender' || clean === 'lp' || clean === 'jk' || clean === 'sex') {
      if (map.jenis_kelamin === undefined) map.jenis_kelamin = idx;
    } else if (clean.includes('kategori') || clean.includes('jenjangusia')) {
      if (map.kategori_usia === undefined) map.kategori_usia = idx;
    } else if (clean.includes('kelas') || clean.includes('tingkat') || clean.includes('jenjangkelas') || clean === 'jenjang') {
      if (map.jenjang_kelas === undefined) map.jenjang_kelas = idx;
    } else if (clean.includes('desa') || clean.includes('wilayahdesa')) {
      if (map.desa === undefined) map.desa = idx;
    } else if (clean.includes('kelompok') || clean.includes('daerahsambung')) {
      if (map.kelompok === undefined) map.kelompok = idx;
    } else if (clean.includes('ayah') || clean.includes('bapak') || clean.includes('namaayah')) {
      if (map.nama_ayah === undefined) map.nama_ayah = idx;
    } else if (clean.includes('ibu') || clean.includes('namaibu')) {
      if (map.nama_ibu === undefined) map.nama_ibu = idx;
    } else if (clean.includes('hp') || clean.includes('wa') || clean.includes('telepon') || clean.includes('kontak') || clean.includes('whatsapp')) {
      if (map.no_hp === undefined) map.no_hp = idx;
    } else if (clean.includes('domisili') || clean.includes('asal')) {
      if (map.domisili === undefined) map.domisili = idx;
    } else if (clean.includes('statussambung') || clean === 'status' || clean.includes('sambung')) {
      if (map.status_sambung === undefined) map.status_sambung = idx;
    }
  });
  return map;
}

function resolveDesaKelompok(rawDesa, rawKelompok, allKelompok) {
  let matchedKel = null;
  let cleanK = (rawKelompok || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanK) {
    matchedKel = allKelompok.find(k => {
      const kClean = k.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
      return kClean === cleanK || cleanK.includes(kClean) || kClean.includes(cleanK);
    });
  }

  if (matchedKel) {
    return {
      desaId: matchedKel.desaId,
      desaNama: matchedKel.desaNama,
      kelompokId: matchedKel.id,
      kelompokNama: matchedKel.nama
    };
  }

  // Jika kelompok belum cocok, coba cocokkan nama desa
  let cleanD = (rawDesa || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  let matchedDesa = null;
  if (cleanD) {
    matchedDesa = MASTER_WILAYAH.desa.find(d => {
      const dClean = d.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
      return dClean === cleanD || cleanD.includes(dClean) || dClean.includes(cleanD);
    });
  }

  if (matchedDesa) {
    return {
      desaId: matchedDesa.id,
      desaNama: matchedDesa.nama,
      kelompokId: null,
      kelompokNama: '-'
    };
  }

  // Fallback ke filter dashboard yang sedang aktif
  let fbDesaId = currentSiswaFilter.desa !== 'all' ? currentSiswaFilter.desa : null;
  let fbDesaNama = null;
  let fbKelId = currentSiswaFilter.kelompok !== 'all' ? currentSiswaFilter.kelompok : null;
  let fbKelNama = null;

  if (fbDesaId) {
    const d = MASTER_WILAYAH.desa.find(x => x.id === fbDesaId);
    if (d) fbDesaNama = d.nama;
  }
  if (fbKelId) {
    const k = allKelompok.find(x => x.id === fbKelId);
    if (k) {
      fbKelNama = k.nama;
      fbDesaId = k.desaId;
      fbDesaNama = k.desaNama;
    }
  }

  return {
    desaId: fbDesaId,
    desaNama: fbDesaNama,
    kelompokId: fbKelId,
    kelompokNama: fbKelNama
  };
}

function normalizeDateString(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().slice(0, 10);
  }
  const str = val.toString().trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const parts = str.split('-');
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const parts = str.split('/');
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  const num = Number(str);
  if (!isNaN(num) && num > 20000 && num < 60000) {
    const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(dateObj)) {
      return dateObj.toISOString().slice(0, 10);
    }
  }
  return str;
}

function renderImportPreviewResults(parsedItems, fileName) {
  const container = document.getElementById('importPreviewContainer');
  if (!container) return;

  const total = parsedItems.length;
  const newItems = parsedItems.filter(i => i.status === 'NEW').length;
  const dupItems = parsedItems.filter(i => i.status === 'DUPLICATE').length;
  const invalidItems = parsedItems.filter(i => !i.data.nama_lengkap).length;

  document.getElementById('statTotalRead').textContent = total;
  document.getElementById('statTotalNew').textContent = newItems;
  document.getElementById('statTotalDup').textContent = dupItems;
  document.getElementById('statTotalInvalid').textContent = invalidItems;

  const tbody = document.getElementById('importPreviewTbody');
  if (tbody) {
    let rowsHtml = '';
    parsedItems.slice(0, 100).forEach((item, idx) => {
      const s = item.data;
      const statusBadge = item.status === 'DUPLICATE'
        ? '<span class="import-badge badge-dup">Duplikat</span>'
        : '<span class="import-badge badge-new">Baru</span>';

      const ttl = [s.tempat_lahir !== '-' ? s.tempat_lahir : '', s.tanggal_lahir].filter(Boolean).join(', ') || '-';
      const usiaStr = s.tanggal_lahir ? ` (${calculateUmur(s.tanggal_lahir)} th)` : '';

      rowsHtml += `
        <tr>
          <td style="text-align:center;font-weight:700;">${idx + 1}</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td style="font-weight:700;color:var(--text);">${s.nama_lengkap}</td>
          <td style="text-align:center;font-weight:700;color:${s.jenis_kelamin === 'P' ? '#ec4899' : '#3b82f6'};">${s.jenis_kelamin}</td>
          <td>${ttl}${usiaStr}</td>
          <td><span class="badge-tag" style="background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${s.jenjang_kelas || s.kategori_usia}</span></td>
          <td>${s.desa_nama || '-'}</td>
          <td style="font-weight:600;">${s.kelompok_nama || '-'}</td>
          <td>${s.no_hp || '-'}</td>
        </tr>
      `;
    });

    if (parsedItems.length > 100) {
      rowsHtml += `
        <tr>
          <td colspan="9" style="text-align:center;padding:8px;font-weight:700;color:var(--text-muted);background:var(--bg);">
            ... Dan ${parsedItems.length - 100} data lainnya ...
          </td>
        </tr>
      `;
    }

    tbody.innerHTML = rowsHtml;
  }

  const btnSubmit = document.getElementById('txtBtnSubmitImport');
  if (btnSubmit) {
    btnSubmit.textContent = `Simpan (${total}) Data ke Database`;
  }

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function confirmAndExecuteBatchImport() {
  if (!_parsedImportData || _parsedImportData.length === 0) {
    alert('Tidak ada data yang siap diimpor.');
    return;
  }

  const checkUpdate = document.getElementById('checkUpdateDuplicates');
  const updateDuplicates = checkUpdate ? checkUpdate.checked : true;

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  _parsedImportData.forEach(item => {
    if (!item.data.nama_lengkap) return;

    if (item.status === 'DUPLICATE') {
      if (updateDuplicates && item.existingId) {
        updateSiswa(item.existingId, item.data);
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      addSiswa(item.data);
      addedCount++;
    }
  });

  closeModal();

  let msg = `Berhasil mengimpor data generus: ${addedCount} data baru ditambahkan`;
  if (updatedCount > 0) msg += `, ${updatedCount} data lama diperbarui`;
  if (skippedCount > 0) msg += `, ${skippedCount} data duplikat dilewati`;
  msg += '!';

  showToast(msg, 'success');
  renderSiswaModal();
}

/**
 * Modal Interaktif untuk Kenaikan Jenjang Massal Otomatis
 * Aturan:
 * - Seluruh generus aktif naik 1 tingkat ke jenjang selanjutnya setelah bulan Agustus.
 * - Data yang baru diinput setelah bulan Agustus pada tahun ajaran berjalan TIDAK BERTAMBAH.
 * - Siswa yang tinggal kelas dapat disesuaikan manual oleh pamong/pengurus via tombol Edit.
 */
export function renderAutoPromoteModal() {
  const preview = calculateMassPromotionPreview();
  const { academicInfo, eligible, skipped } = preview;

  const countEligible = eligible.length;
  const countAfterAugust = skipped.filter(s => s.reason === "Input Setelah Agustus").length;
  const countMaxJenjang = skipped.filter(s => s.reason === "Jenjang Maksimal/Khusus").length;
  const countAlreadyPromoted = skipped.filter(s => s.reason === "Sudah Dinaikkan").length;

  let activeTab = 'eligible'; // 'eligible' or 'skipped'
  let searchFilter = '';

  function renderContent() {
    let filteredEligible = eligible;
    let filteredSkipped = skipped;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filteredEligible = eligible.filter(item =>
        (item.siswa.nama_lengkap || '').toLowerCase().includes(q) ||
        (item.siswa.desa_nama || '').toLowerCase().includes(q) ||
        (item.siswa.kelompok_nama || '').toLowerCase().includes(q)
      );
      filteredSkipped = skipped.filter(item =>
        (item.siswa.nama_lengkap || '').toLowerCase().includes(q) ||
        (item.siswa.desa_nama || '').toLowerCase().includes(q) ||
        (item.siswa.kelompok_nama || '').toLowerCase().includes(q)
      );
    }

    const contentHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
        
        <!-- BANNER ATURAN TAHUN AJARAN SETELAH AGUSTUS -->
        <div style="background:#eff6ff;border:1.5px solid #3b82f6;border-radius:12px;padding:14px 16px;color:#1e3a8a;">
          <div style="font-weight:800;font-size:13.5px;display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span class="material-symbols-outlined" style="font-size:20px;color:#2563eb;">auto_mode</span>
            Kenaikan Jenjang Massal Otomatis (Tahun Ajaran ${academicInfo.academicYearLabel})
          </div>
          <div style="font-size:12px;color:#1e40af;line-height:1.5;">
            Seluruh generus aktif naik <strong>1 tingkat ke jenjang berikutnya</strong> setelah bulan Agustus. Generus yang baru diinput setelah bulan Agustus tidak bertambah (tetap pada kelas saat diinput).<br/>
            <em>*Catatan: Bagi generus yang tinggal kelas, pamong/pengurus dapat memperbarui kelas secara manual melalui tombol Edit Generus.</em>
          </div>
        </div>

        <!-- STAT STRIP / INFORMASI CEPAT -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 12px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#15803d;">SIAP NAIK KELAS</div>
            <div style="font-size:20px;font-weight:900;color:#166534;margin-top:2px;">${countEligible}</div>
            <div style="font-size:10px;color:#15803d;">+1 Tingkat Baru</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:10px 12px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#a16207;">INPUT SETELAH AGU</div>
            <div style="font-size:20px;font-weight:900;color:#854d0e;margin-top:2px;">${countAfterAugust}</div>
            <div style="font-size:10px;color:#a16207;">Tidak Bertambah</div>
          </div>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#475569;">JENJANG MAKSIMAL</div>
            <div style="font-size:20px;font-weight:900;color:#334155;margin-top:2px;">${countMaxJenjang}</div>
            <div style="font-size:10px;color:#475569;">Mahasiswa/Remaja/Dll</div>
          </div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px;text-align:center;">
            <div style="font-size:11px;font-weight:700;color:#1d4ed8;">SUDAH PERNAH NAIK</div>
            <div style="font-size:20px;font-weight:900;color:#1e40af;margin-top:2px;">${countAlreadyPromoted}</div>
            <div style="font-size:10px;color:#1d4ed8;">Periode T.A. Ini</div>
          </div>
        </div>

        <!-- SEARCH & TAB SELECTOR -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:#f1f5f9;padding:2px;">
            <button type="button" id="tabShowEligible" style="padding:6px 14px;font-size:12px;font-weight:700;border:none;cursor:pointer;border-radius:6px;background:${activeTab === 'eligible' ? '#ffffff' : 'transparent'};color:${activeTab === 'eligible' ? '#2563eb' : 'var(--text-muted)'};box-shadow:${activeTab === 'eligible' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
              Siap Naik (${filteredEligible.length})
            </button>
            <button type="button" id="tabShowSkipped" style="padding:6px 14px;font-size:12px;font-weight:700;border:none;cursor:pointer;border-radius:6px;background:${activeTab === 'skipped' ? '#ffffff' : 'transparent'};color:${activeTab === 'skipped' ? '#2563eb' : 'var(--text-muted)'};box-shadow:${activeTab === 'skipped' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
              Tidak Bertambah (${filteredSkipped.length})
            </button>
          </div>
          <div style="flex:1;max-width:260px;min-width:180px;">
            <input type="text" id="searchPromoteSiswa" value="${searchFilter}" placeholder="Cari nama / desa..." style="width:100%;padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:8px;outline:none;" />
          </div>
        </div>

        <!-- TABEL PRATINJAU -->
        <div style="border:1.5px solid var(--border);border-radius:10px;overflow:hidden;background:#fff;">
          <div style="max-height:280px;overflow-y:auto;font-size:11.5px;">
            ${activeTab === 'eligible' ? (
        filteredEligible.length === 0 ? `
                <div style="padding:36px;text-align:center;color:var(--text-muted);">
                  <span class="material-symbols-outlined" style="font-size:36px;color:#10b981;display:block;margin-bottom:6px;">check_circle</span>
                  <strong style="color:var(--text);">Tidak ada generus yang perlu dinaikkan saat ini</strong>
                  <p style="margin:4px 0 0;font-size:11px;">Semua data generus sudah mutakhir untuk Tahun Ajaran ${academicInfo.academicYearLabel}.</p>
                </div>
              ` : `
                <table style="width:100%;border-collapse:collapse;text-align:left;">
                  <thead style="background:#f8fafc;position:sticky;top:0;font-size:11px;color:#475569;z-index:2;">
                    <tr>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;width:40px;">No</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Nama Generus</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Desa / Kelompok</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">Kelas Asal</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">
                        <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">arrow_forward</span>
                      </th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;">Kelas Baru</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredEligible.map((item, idx) => `
                      <tr style="border-bottom:1px solid #f1f5f9;background:${idx % 2 === 0 ? '#fff' : '#fafafa'};">
                        <td style="padding:8px 10px;text-align:center;color:var(--text-muted);">${idx + 1}</td>
                        <td style="padding:8px 10px;font-weight:700;color:var(--text);">${item.siswa.nama_lengkap}</td>
                        <td style="padding:8px 10px;color:var(--text-muted);font-size:11px;">Desa ${item.siswa.desa_nama || '-'} (${item.siswa.kelompok_nama || '-'})</td>
                        <td style="padding:8px 10px;text-align:center;"><span style="background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">${item.fromKelas}</span></td>
                        <td style="padding:8px 10px;text-align:center;color:#64748b;font-weight:900;">
                          <span class="material-symbols-outlined" style="font-size:14px;vertical-align:middle;">arrow_forward</span>
                        </td>
                        <td style="padding:8px 10px;text-align:center;"><span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">${item.toKelas}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
      ) : (
        filteredSkipped.length === 0 ? `
                <div style="padding:32px;text-align:center;color:var(--text-muted);">Tidak ada data yang dilewati.</div>
              ` : `
                <table style="width:100%;border-collapse:collapse;text-align:left;">
                  <thead style="background:#f8fafc;position:sticky;top:0;font-size:11px;color:#475569;z-index:2;">
                    <tr>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;text-align:center;width:40px;">No</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Nama Generus</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Kelas Saat Ini</th>
                      <th style="padding:8px 10px;border-bottom:1px solid #cbd5e1;">Alasan Tidak Bertambah</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredSkipped.map((item, idx) => `
                      <tr style="border-bottom:1px solid #f1f5f9;background:${idx % 2 === 0 ? '#fff' : '#fafafa'};">
                        <td style="padding:8px 10px;text-align:center;color:var(--text-muted);">${idx + 1}</td>
                        <td style="padding:8px 10px;font-weight:700;color:var(--text);">${item.siswa.nama_lengkap}</td>
                        <td style="padding:8px 10px;"><span style="background:#f1f5f9;color:#475569;padding:2px 6px;border-radius:4px;font-size:10.5px;font-weight:700;">${item.siswa.jenjang_kelas || '-'}</span></td>
                        <td style="padding:8px 10px;color:#b45309;font-size:11px;font-weight:600;">
                          <span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#fef3c7;color:#92400e;margin-right:4px;">${item.reason}</span>
                          ${item.detail}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `
      )}
          </div>
        </div>

        <!-- MODAL STICKY FOOTER (STANDARISASI NAVIGASI TEMA) -->
        <div class="modal-sticky-footer">
          <button type="button" id="btnCancelAutoPromote" class="btn-sticky-back" title="Kembali ke Database">
            <span class="material-symbols-outlined">arrow_back</span>
            <span class="btn-text">Kembali ke Database</span>
          </button>
          <button type="button" id="btnExecuteAutoPromote" class="btn-sticky-save" title="Terapkan Kenaikan 1 Tingkat" ${countEligible === 0 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">upgrade</span>
            <span class="btn-text">Terapkan Kenaikan 1 Tingkat (${countEligible} Generus)</span>
          </button>
        </div>

      </div>
    `;

    openModal(`Kenaikan Jenjang Massal (T.A. ${academicInfo.academicYearLabel})`, 'auto_mode', contentHtml, 'medium');

    // Attach listeners
    document.getElementById('tabShowEligible')?.addEventListener('click', () => {
      activeTab = 'eligible';
      renderContent();
    });
    document.getElementById('tabShowSkipped')?.addEventListener('click', () => {
      activeTab = 'skipped';
      renderContent();
    });
    document.getElementById('searchPromoteSiswa')?.addEventListener('input', (e) => {
      searchFilter = e.target.value;
      renderContent();
      const el = document.getElementById('searchPromoteSiswa');
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });

    document.getElementById('btnCancelAutoPromote')?.addEventListener('click', renderSiswaModal);

    document.getElementById('btnExecuteAutoPromote')?.addEventListener('click', () => {
      if (countEligible === 0) return;
      showConfirmModal(
        'Konfirmasi Kenaikan Jenjang Massal',
        `Apakah Anda yakin ingin menaikkan <strong>${countEligible} generus aktif</strong> ke 1 tingkat kelas berikutnya untuk Tahun Ajaran <strong>${academicInfo.academicYearLabel}</strong>?<br/><br/><small style="color:var(--text-muted);">*Data yang diinput setelah Agustus tidak akan bertambah. Siswa yang tinggal kelas dapat Anda sesuaikan manual via menu Edit Generus.</small>`,
        () => {
          const res = autoPromoteAllSiswa();
          if (res.success) {
            showToast(`Berhasil menaikkan ${res.countChanged} generus ke 1 tingkat selanjutnya!`, 'success');
            renderSiswaModal();
          } else {
            showToast('Gagal memproses kenaikan jenjang.', 'danger');
          }
        }
      );
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
    // Status Sambung
    if (currentSiswaFilter.status !== 'all' && s.status_sambung !== currentSiswaFilter.status) return false;
    
    // Wilayah Teritorial (Desa & Kelompok)
    if (currentSiswaFilter.desa !== 'all' && s.desa_id !== currentSiswaFilter.desa) return false;
    if (currentSiswaFilter.kelompok !== 'all' && s.kelompok_id !== currentSiswaFilter.kelompok) return false;
    
    // Kategori Jenjang Usia (Termasuk Pra Nikah)
    if (currentSiswaFilter.jenjang !== 'all') {
      if (currentSiswaFilter.jenjang === 'pra_nikah') {
        const u = calculateUmur(s.tanggal_lahir);
        const isPraNikahAge = u >= 19 && u <= 22;
        const isPraNikahClass = s.jenjang_kelas === 'Pra-Nikah' || s.jenjang_kelas === '19-22 Tahun';
        const isPraNikahKat = s.kategori_usia === 'pra_nikah';
        if (!isPraNikahAge && !isPraNikahClass && !isPraNikahKat) return false;
      } else if (s.kategori_usia !== currentSiswaFilter.jenjang) {
        return false;
      }
    }

    // Tingkat / Kelas Terpilih
    if (currentSiswaFilter.kelas && currentSiswaFilter.kelas !== 'all') {
      if (Array.isArray(currentSiswaFilter.kelas)) {
        if (currentSiswaFilter.kelas.length > 0 && !currentSiswaFilter.kelas.includes(s.jenjang_kelas)) return false;
      } else if (s.jenjang_kelas !== currentSiswaFilter.kelas) {
        return false;
      }
    }

    // Jenis Kelamin (Gender)
    if (currentSiswaFilter.gender && currentSiswaFilter.gender !== 'all') {
      const g = (s.jenis_kelamin || '').toUpperCase();
      if (currentSiswaFilter.gender === 'L' && g !== 'L') return false;
      if (currentSiswaFilter.gender === 'P' && g !== 'P') return false;
    }

    // Domisili
    if (currentSiswaFilter.domisili && currentSiswaFilter.domisili !== 'all') {
      const dom = (s.domisili || 'Pribumi').toLowerCase();
      if (dom !== currentSiswaFilter.domisili.toLowerCase()) return false;
    }

    // Search query
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
        statusBadge = `<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><span class="material-symbols-outlined" style="font-size:12px;">favorite</span> Menikah</span>`;
      } else if (s.status_sambung === 'Pindah Sambung') {
        statusBadge = `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><span class="material-symbols-outlined" style="font-size:12px;">local_shipping</span> Pindah</span>`;
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
        statusBadge = `<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><span class="material-symbols-outlined" style="font-size:12px;">favorite</span> Menikah</span>`;
      } else if (s.status_sambung === 'Pindah Sambung') {
        statusBadge = `<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><span class="material-symbols-outlined" style="font-size:12px;">local_shipping</span> Pindah</span>`;
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

  // Render Pagination Bar (Standard Reusable Architecture)
  if (paginWrap) {
    renderPaginationBar({
      container: paginWrap,
      currentPage: siswaCurrentPage,
      totalItems: totalFiltered,
      pageSize: siswaPageSize,
      pageSizeOptions: [25, 50, 100],
      itemName: 'generus',
      maxVisiblePages: 5,
      showPageSize: true,
      showInfo: true,
      onPageChange: (newPage) => {
        siswaCurrentPage = newPage;
        renderSiswaTableRows();
      },
      onPageSizeChange: (newSize) => {
        siswaPageSize = newSize;
        siswaCurrentPage = 1;
        renderSiswaTableRows();
      }
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
  const isSuper = currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah');
  const currentDesaId = existingData
    ? (existingData.desa_id || '')
    : (!isSuper && currentUser?.desaId ? currentUser.desaId : '');
  const currentKelId = existingData
    ? (existingData.kelompok_id || '')
    : (!isSuper && currentUser?.tingkatan === 'kelompok' && currentUser?.kelompokId ? currentUser.kelompokId : '');

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
              <option value="caberawit" ${currentKat === 'caberawit' ? 'selected' : ''}>Caberawit (PAUD - SD)</option>
              <option value="gp_reguler" ${currentKat === 'gp_reguler' ? 'selected' : ''}>GP Reguler (SMP - SMA)</option>
              <option value="remaja" ${currentKat === 'remaja' ? 'selected' : ''}>Remaja &amp; Dewasa</option>
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

      <!-- Domisili & Status Sambung -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Domisili</label>
          <select id="sDomisili" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="Pribumi" ${existingData && existingData.domisili === 'Pribumi' ? 'selected' : ''}>Pribumi</option>
            <option value="Pendatang" ${existingData && existingData.domisili === 'Pendatang' ? 'selected' : ''}>Pendatang</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Status Sambung</label>
          <select id="sMutasi" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="Sambung" ${existingData && existingData.status_sambung === 'Sambung' ? 'selected' : ''}>Sambung (Aktif)</option>
            <option value="Pindah Sambung" ${existingData && existingData.status_sambung === 'Pindah Sambung' ? 'selected' : ''}>Pindah Sambung</option>
            <option value="Menikah" ${existingData && existingData.status_sambung === 'Menikah' ? 'selected' : ''}>Menikah</option>
          </select>
        </div>
      </div>

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        ${isEdit ? `
          <button type="button" id="btnDeleteSiswa" class="btn-sticky-delete btn-delete-siswa" title="Hapus Data Generus">
            <span class="material-symbols-outlined">delete</span>
            <span class="btn-text">Hapus Data</span>
          </button>
        ` : ''}
        <button type="button" class="btn-sticky-back btn-cancel-siswa" title="Kembali ke Tabel">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Tabel</span>
        </button>
        <button type="submit" class="btn-sticky-save btn-submit-siswa" title="${isEdit ? 'Simpan Perubahan' : 'Simpan Data'}">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">${isEdit ? 'Simpan Perubahan' : 'Simpan Data'}</span>
        </button>
      </div>
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
