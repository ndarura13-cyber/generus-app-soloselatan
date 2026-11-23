/**
 * ════════════════════════════════════════════════════════════════════════════
 * MODUL JURNAL KBM & PEMBINAAN GENERUS (FULL PAGE HUB VIEW)
 * ════════════════════════════════════════════════════════════════════════════
 * Terintegrasi berjenjang (Caberawit, Pra-Remaja, Remaja) dan terfilter
 * otomatis berdasarkan tingkatan login pengguna:
 * 1. Daerah (Superadmin): Semua Desa & Kelompok
 * 2. Desa: Se-Desa user login
 * 3. Kelompok: Khusus Kelompok user login
 */

import {
  currentUser,
  MASTER_WILAYAH,
  openModal,
  closeModal,
  showToast,
  showDashboardView,
  showDashboardHomePage
} from './dashboard-common.js';

import {
  renderCetakAbsensiModal,
  renderFormRekapKehadiranModal
} from './dashboard-kbm.js';

import {
  renderEventPembiasaanModal
} from './dashboard-pembiasaan.js';

import {
  openRekapAbsensiBulananModal
} from './dashboard-absensi-bulanan.js';

// State Halaman Jurnal KBM
let activeJenjang = 'caberawit'; // 'caberawit', 'gp_reguler', 'remaja'
let selectedDesaId = 'all';
let selectedKelompokId = 'all';

const JENJANG_METADATA = {
  caberawit: {
    id: 'caberawit',
    nama: 'Caberawit',
    sub: 'Usia Dini & SD (PAUD s/d Kelas 6 SD)',
    badge: 'PAUD - SD',
    icon: 'child_care',
    color: '#d97706',
    borderClass: 'border-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300'
  },
  gp_reguler: {
    id: 'gp_reguler',
    nama: 'GP (Pra-remaja)',
    sub: 'Remaja Awal / SMP (Kelas 1 s/d 3 SMP)',
    badge: 'SMP / GP',
    icon: 'school',
    color: '#2563eb',
    borderClass: 'border-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300'
  },
  pra_nikah: {
    id: 'pra_nikah',
    nama: 'Pra Nikah',
    sub: 'Remaja Usia 19 s/d 22 Tahun',
    badge: '19 - 22 Th',
    icon: 'favorite',
    color: '#ec4899',
    borderClass: 'border-pink-400',
    bgLight: 'bg-pink-50 dark:bg-pink-950/40',
    textClass: 'text-pink-700 dark:text-pink-300'
  },
  remaja: {
    id: 'remaja',
    nama: 'Remaja/Dewasa',
    sub: 'Muda-Mudi & Usia Nikah (SMA - Dewasa)',
    badge: 'SMA - Dewasa',
    icon: 'diversity_3',
    color: '#7c3aed',
    borderClass: 'border-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300'
  }
};

/**
 * Inisialisasi default filter wilayah berdasarkan hak akses pengguna
 */
function initWilayahFilters() {
  if (!currentUser) return;
  const tingkatan = currentUser.tingkatan || (currentUser.isSuperadmin ? 'daerah' : 'kelompok');

  if (tingkatan === 'kelompok') {
    selectedDesaId = currentUser.desaId || 'all';
    selectedKelompokId = currentUser.kelompokId || 'all';
  } else if (tingkatan === 'desa') {
    selectedDesaId = currentUser.desaId || (MASTER_WILAYAH.desa[0]?.id || 'all');
    selectedKelompokId = 'all';
  } else {
    // Daerah / Superadmin
    selectedDesaId = 'all';
    selectedKelompokId = 'all';
  }
}

/**
 * Tampilkan Halaman Jurnal KBM (Full Page View dalam Dashboard)
 */
export function showJurnalKbmPage(preferredJenjang = null) {
  if (preferredJenjang && JENJANG_METADATA[preferredJenjang]) {
    activeJenjang = preferredJenjang;
  }

  initWilayahFilters();
  showDashboardView('viewJurnalKbm');
  renderJurnalKbmPageView();
}

export { showDashboardHomePage };

/**
 * Render elemen dinamis pada Halaman Jurnal KBM
 */
export function renderJurnalKbmPageView() {
  const container = document.getElementById('viewJurnalKbm');
  if (!container) return;

  const tingkatan = currentUser?.tingkatan || (currentUser?.isSuperadmin ? 'daerah' : 'kelompok');
  const isDaerah = tingkatan === 'daerah' || Boolean(currentUser?.isSuperadmin);
  const isDesa = tingkatan === 'desa';
  const isKelompok = tingkatan === 'kelompok';

  // Label Wilayah User
  let tingkatanLabel = 'Pengurus Daerah PPG (Akses Se-Solo Selatan)';
  if (isDesa) {
    tingkatanLabel = `Tingkat Desa: ${currentUser.desaNama || 'Desa'}`;
  } else if (isKelompok) {
    tingkatanLabel = `Tingkat Kelompok: ${currentUser.kelompokNama || 'Kelompok'} (${currentUser.desaNama || 'Desa'})`;
  }

  // Generate Dropdown Wilayah sesuai Level
  let desaDropdownHtml = '';
  let kelompokDropdownHtml = '';

  if (isDaerah) {
    desaDropdownHtml = `
      <select id="hubSelDesa" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer">
        <option value="all" ${selectedDesaId === 'all' ? 'selected' : ''}>Semua Desa</option>
        ${MASTER_WILAYAH.desa.map(d => `<option value="${d.id}" ${selectedDesaId === d.id ? 'selected' : ''}>${d.nama}</option>`).join('')}
      </select>
    `;

    const activeDesaObj = MASTER_WILAYAH.desa.find(d => d.id === selectedDesaId);
    const kelompokList = activeDesaObj ? activeDesaObj.kelompok : MASTER_WILAYAH.desa.flatMap(d => d.kelompok);

    kelompokDropdownHtml = `
      <select id="hubSelKelompok" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer">
        <option value="all" ${selectedKelompokId === 'all' ? 'selected' : ''}>Semua Kelompok</option>
        ${kelompokList.map(k => `<option value="${k.id}" ${selectedKelompokId === k.id ? 'selected' : ''}>${k.nama}</option>`).join('')}
      </select>
    `;
  } else if (isDesa) {
    const desaObj = MASTER_WILAYAH.desa.find(d => d.id === currentUser.desaId) || MASTER_WILAYAH.desa[0];
    desaDropdownHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-brandBlue dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        <span class="material-symbols-outlined text-[15px]">location_city</span>
        ${desaObj?.nama || currentUser.desaNama}
      </span>
    `;

    kelompokDropdownHtml = `
      <select id="hubSelKelompok" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer">
        <option value="all" ${selectedKelompokId === 'all' ? 'selected' : ''}>Semua Kelompok</option>
        ${(desaObj?.kelompok || []).map(k => `<option value="${k.id}" ${selectedKelompokId === k.id ? 'selected' : ''}>${k.nama}</option>`).join('')}
      </select>
    `;
  } else {
    // Kelompok (Terkunci)
    desaDropdownHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span class="material-symbols-outlined text-[15px]">location_on</span>
        ${currentUser.kelompokNama || ''} (${currentUser.desaNama || ''})
      </span>
    `;
    kelompokDropdownHtml = '';
  }

  const meta = JENJANG_METADATA[activeJenjang];

  container.innerHTML = `
    <!-- HEADER BAR JURNAL KBM DENGAN TEMA BIRU ELEGAN & RESPONSIF -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs backdrop-blur-xs">
      <!-- Sisi Kiri: Tombol Back + Judul + Tingkatan Badge -->
      <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button type="button" class="btnBackToDashboardBreadcrumb p-2 -ml-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer shrink-0" title="Kembali ke Dashboard">
          <span class="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
            <span class="material-symbols-outlined text-[20px]">menu_book</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">Jurnal KBM</h1>
              <span class="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/80 dark:border-blue-800/60 shrink-0 truncate max-w-[220px] sm:max-w-none" title="${tingkatanLabel}">
                ${isDaerah ? 'Pengurus Daerah' : (isDesa ? `Desa ${currentUser.desaNama || ''}` : `Kel. ${currentUser.kelompokNama || ''}`)}
              </span>
            </div>
            <p class="text-[11.5px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              Pusat monitoring kegiatan belajar mengajar, presensi bulanan, &amp; pembinaan generus
            </p>
          </div>
        </div>
      </div>

      <!-- Sisi Kanan: Wilayah Filter Dropdowns -->
      <div class="flex items-center flex-wrap gap-2 shrink-0">
        ${desaDropdownHtml}
        ${kelompokDropdownHtml}
      </div>
    </div>

    <!-- BAGIAN 1: PILIH JENJANG & 2 KARTU MODUL (BORDERED & MODERN COMPACT) -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-4">
      <!-- Title & Jenjang Selector Header -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base text-blue-600">category</span>
            <span>Pilih Jenjang Generus</span>
          </h2>
          <span class="text-xs font-extrabold px-3 py-1 rounded-full border border-slate-200/70 dark:border-slate-700 shadow-2xs" style="background:${meta.bgLight};color:${meta.color};">
            ${meta.nama} &bull; ${meta.badge}
          </span>
        </div>

        <!-- 4 Pilihan Jenjang: Compact (Icon, Usia, Checkbox) & Mobile Horizontal Scroll Tab -->
        <div class="flex lg:grid lg:grid-cols-4 gap-2.5 overflow-x-auto no-scrollbar pb-1">
          <!-- 1. Caberawit -->
          <div class="btn-select-jenjang shrink-0 min-w-[170px] lg:min-w-0 flex-1 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${activeJenjang === 'caberawit' ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400/30 shadow-xs' : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:border-amber-300 hover:bg-amber-50/40'}" data-jenjang="caberawit">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <span class="material-symbols-outlined text-lg">child_care</span>
              </div>
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">Caberawit</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400">PAUD - SD</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-lg ${activeJenjang === 'caberawit' ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'} shrink-0">
              ${activeJenjang === 'caberawit' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>

          <!-- 2. GP (Pra-remaja) -->
          <div class="btn-select-jenjang shrink-0 min-w-[170px] lg:min-w-0 flex-1 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${activeJenjang === 'gp_reguler' ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-400/30 shadow-xs' : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:border-blue-300 hover:bg-blue-50/40'}" data-jenjang="gp_reguler">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <span class="material-symbols-outlined text-lg">school</span>
              </div>
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">GP (Pra-remaja)</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400">SMP / GP</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-lg ${activeJenjang === 'gp_reguler' ? 'text-blue-600' : 'text-slate-300 dark:text-slate-600'} shrink-0">
              ${activeJenjang === 'gp_reguler' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>

          <!-- 3. Pra Nikah -->
          <div class="btn-select-jenjang shrink-0 min-w-[170px] lg:min-w-0 flex-1 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${activeJenjang === 'pra_nikah' ? 'border-pink-500 bg-pink-50/80 dark:bg-pink-950/40 ring-2 ring-pink-400/30 shadow-xs' : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:border-pink-300 hover:bg-pink-50/40'}" data-jenjang="pra_nikah">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center shrink-0 shadow-2xs">
                <span class="material-symbols-outlined text-lg">favorite</span>
              </div>
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">Pra Nikah</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400">19 - 22 Th</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-lg ${activeJenjang === 'pra_nikah' ? 'text-pink-600' : 'text-slate-300 dark:text-slate-600'} shrink-0">
              ${activeJenjang === 'pra_nikah' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>

          <!-- 4. Remaja/Dewasa -->
          <div class="btn-select-jenjang shrink-0 min-w-[170px] lg:min-w-0 flex-1 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${activeJenjang === 'remaja' ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 ring-2 ring-purple-400/30 shadow-xs' : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 hover:border-purple-300 hover:bg-purple-50/40'}" data-jenjang="remaja">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <span class="material-symbols-outlined text-lg">diversity_3</span>
              </div>
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">Remaja/Dewasa</div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400">SMA &amp; Dewasa</div>
              </div>
            </div>
            <span class="material-symbols-outlined text-lg ${activeJenjang === 'remaja' ? 'text-purple-600' : 'text-slate-300 dark:text-slate-600'} shrink-0">
              ${activeJenjang === 'remaja' ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </div>
        </div>
      </div>

      <!-- 2 Kartu Aksi Modul Sesuai Jenjang Terpilih -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-700/60">
        <!-- Modul 1: Presensi Kehadiran Bulanan -->
        <div id="btnCardHubAbsensi" class="p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-850 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
              <span class="material-symbols-outlined text-2xl">co_present</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Presensi &amp; Rekap Bulanan
                </span>
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Cloud Sync
                </span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cetak lembar fisik &amp; input rekap checklist bulanan
              </div>
            </div>
          </div>
          <span class="material-symbols-outlined text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0">arrow_forward</span>
        </div>

        <!-- Modul 2: Materi & Kurikulum KBM -->
        <div id="btnCardHubJurnal" class="p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-850 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-3">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
              <span class="material-symbols-outlined text-2xl">menu_book</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Materi &amp; Kurikulum KBM
                </span>
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  Silabus
                </span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target kurikulum pengajaran &amp; agenda event KBM
              </div>
            </div>
          </div>
          <span class="material-symbols-outlined text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0">arrow_forward</span>
        </div>
      </div>
    </div>

    <!-- BAGIAN 2: PEMBIASAAN 29 KARAKTER LUHUR -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-amber-500 text-lg">verified_user</span>
          <span>Pembiasaan Karakter Luhur</span>
        </h2>
        <span class="text-xs text-slate-500 dark:text-slate-400">Evaluasi Ibadah Harian</span>
      </div>

      <div id="btnCardHubPembiasaan" class="bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-700 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs">
            <span class="material-symbols-outlined text-2xl">checklist</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Lembar Pembiasaan 29 Karakter Luhur
              </h3>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">Caberawit</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Pencatatan ibadah sholat 5 waktu, tahfidz, birrul walidain, &amp; kemandirian santri.
            </p>
          </div>
        </div>
        <button type="button" class="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer">
          <span>Buka Pembiasaan</span>
          <span class="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </section>

    <!-- BAGIAN 3: SINERGI 5 UNSUR -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-indigo-500 text-lg">diversity_2</span>
          <span>Musyawarah 5 Unsur</span>
        </h2>
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
          <span class="material-symbols-outlined text-[13px]">schedule</span> Tahap Selanjutnya
        </span>
      </div>

      <div id="btnCardHubMusyawarah" class="bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-700 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
            <span class="material-symbols-outlined text-2xl">handshake</span>
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-0.5">
              Sinergi 5 Unsur Desa &amp; Kelompok
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Koordinasi terpadu PPG, Muballigh, Pinisepuh, Orang Tua Santri, &amp; Pengurus Muda-Mudi.
            </p>
          </div>
        </div>
        <button type="button" class="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">visibility</span>
          <span>Pratinjau</span>
        </button>
      </div>
    </section>
  `;

  // Attach Event Handlers
  attachJurnalKbmHubListeners();
}

/**
 * Event Listeners untuk Halaman Jurnal KBM
 */
function attachJurnalKbmHubListeners() {
  // Tombol Kembali
  document.getElementById('btnBackToDashboardBreadcrumb')?.addEventListener('click', showDashboardHomePage);

  // Filter Dropdown Wilayah
  const selDesa = document.getElementById('hubSelDesa');
  const selKel = document.getElementById('hubSelKelompok');

  selDesa?.addEventListener('change', (e) => {
    selectedDesaId = e.target.value;
    selectedKelompokId = 'all';
    renderJurnalKbmPageView();
  });

  selKel?.addEventListener('change', (e) => {
    selectedKelompokId = e.target.value;
  });

  // Pemilihan Jenjang (3 Kartu di Atas)
  document.querySelectorAll('.btn-select-jenjang').forEach(btn => {
    btn.addEventListener('click', () => {
      const j = btn.dataset.jenjang;
      if (j && JENJANG_METADATA[j]) {
        activeJenjang = j;
        renderJurnalKbmPageView();
      }
    });
  });

  // Aksi 1: Presensi Kehadiran -> Buka Modal Laporan & Rekap Absensi Bulanan Per Jenjang
  document.getElementById('btnCardHubAbsensi')?.addEventListener('click', () => {
    openRekapAbsensiBulananModal({
      jenjang: activeJenjang,
      desaId: selectedDesaId,
      kelompokId: selectedKelompokId
    });
  });

  // Aksi 2: Materi & Kurikulum -> Jurnal & Agenda KBM
  document.getElementById('btnCardHubJurnal')?.addEventListener('click', () => {
    openJurnalKbmDialog(activeJenjang, selectedDesaId, selectedKelompokId);
  });

  // Aksi 3: Pembiasaan Caberawit
  document.getElementById('btnCardHubPembiasaan')?.addEventListener('click', () => {
    renderEventPembiasaanModal();
  });

  // Aksi 4: Musyawarah 5 Unsur
  document.getElementById('btnCardHubMusyawarah')?.addEventListener('click', () => {
    openMusyawarah5UnsurModal();
  });
}

/**
 * Dialog Interaktif Opsi Presensi KBM (Mengarahkan ke Rekap Absensi Bulanan Per Jenjang)
 */
export function openPresensiOpsiModal(jenjang = 'caberawit', desaId = 'all', kelompokId = 'all') {
  openRekapAbsensiBulananModal({
    jenjang,
    desaId,
    kelompokId
  });
}

/**
 * Buka Formulir / Monitoring Jurnal KBM
 */
export function openJurnalKbmDialog(jenjang = 'caberawit', desaId = 'all', kelompokId = 'all') {
  const tingkatan = currentUser?.tingkatan || (currentUser?.isSuperadmin ? 'daerah' : 'kelompok');
  const dId = (tingkatan === 'desa' || tingkatan === 'kelompok') ? (currentUser?.desaId || desaId) : desaId;
  const kId = (tingkatan === 'kelompok') ? (currentUser?.kelompokId || kelompokId) : kelompokId;

  renderCetakAbsensiModal('agenda', {
    filterDesa: dId,
    filterKel: kId,
    filterFormat: jenjang
  });
}

/**
 * Modal Penjelasan Musyawarah 5 Unsur (Persiapan Tahap Selanjutnya)
 */
export function openMusyawarah5UnsurModal() {
  const modalHtml = `
    <div class="space-y-4">
      <div class="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <span class="material-symbols-outlined text-2xl">handshake</span>
          </div>
          <div>
            <h4 class="font-extrabold text-base">Modul Musyawarah 5 Unsur Desa &amp; Kelompok</h4>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
              Tahap Selanjutnya &bull; Dalam Perancangan
            </span>
          </div>
        </div>
        <p class="text-xs leading-relaxed opacity-95">
          Modul ini disiapkan untuk mendokumentasikan koordinasi sinergi berkala 5 Unsur Pembina Generasi Penerus di tingkat Desa dan Kelompok se-Daerah Solo Selatan.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div class="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-brandBlue text-base">verified</span>
            1. Pengurus PPG (Pendidik)
          </div>
          <div class="text-slate-500 dark:text-slate-400">Monitoring kurikulum, evaluasi pengajar, dan ketercapaian target generus.</div>
        </div>

        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div class="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-emerald-600 text-base">menu_book</span>
            2. Muballigh &amp; Muballighot
          </div>
          <div class="text-slate-500 dark:text-slate-400">Penanaman ilmu agama Al-Qur'an &amp; Hadist serta pembiasaan ibadah harian.</div>
        </div>

        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div class="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-amber-600 text-base">elderly</span>
            3. Tokoh Sepuh / Pinisepuh
          </div>
          <div class="text-slate-500 dark:text-slate-400">Nasihat pembinaan, keteladanan akhlak, dan restu kelancaran kegiatan generus.</div>
        </div>

        <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div class="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-rose-600 text-base">family_restroom</span>
            4. Orang Tua Santri
          </div>
          <div class="text-slate-500 dark:text-slate-400">Pendampingan di rumah, pengawasan akhlakul karimah, dan dukungan orang tua.</div>
        </div>

        <div class="sm:col-span-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div class="font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-purple-600 text-base">diversity_3</span>
            5. Pengurus Muda-Mudi (KMM)
          </div>
          <div class="text-slate-500 dark:text-slate-400">Penggerak kegiatan muda-mudi, pendampingan adik-adik caberawit &amp; pra-remaja.</div>
        </div>
      </div>

      <div class="pt-2 flex justify-end">
        <button type="button" id="btnCloseMusyawarahInfo" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer">
          Mengerti
        </button>
      </div>
    </div>
  `;

  openModal('Musyawarah 5 Unsur Pembina Generus', 'handshake', modalHtml, 'medium');

  document.getElementById('btnCloseMusyawarahInfo')?.addEventListener('click', closeModal);
}

