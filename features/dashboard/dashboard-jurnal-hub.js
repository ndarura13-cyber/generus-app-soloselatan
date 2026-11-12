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
  showToast
} from './dashboard-common.js';

import {
  renderCetakAbsensiModal,
  renderFormRekapKehadiranModal
} from './dashboard-kbm.js';

import {
  renderEventPembiasaanModal
} from './dashboard-pembiasaan.js';

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
    nama: 'Pra-Remaja (GP)',
    sub: 'Remaja Awal / SMP (Kelas 1 s/d 3 SMP)',
    badge: 'SMP / GP',
    icon: 'school',
    color: '#2563eb',
    borderClass: 'border-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300'
  },
  remaja: {
    id: 'remaja',
    nama: 'Remaja & Dewasa',
    sub: 'Muda-Mudi / SMA - Usia Nikah',
    badge: 'SMA - Usia Nikah',
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

  const viewHome = document.getElementById('viewDashboardHome');
  const viewKbm = document.getElementById('viewJurnalKbm');

  if (viewHome && viewKbm) {
    viewHome.classList.add('hidden');
    viewKbm.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderJurnalKbmPageView();
}

/**
 * Kembali ke Tampilan Dashboard Utama
 */
export function showDashboardHomePage() {
  const viewHome = document.getElementById('viewDashboardHome');
  const viewKbm = document.getElementById('viewJurnalKbm');

  if (viewHome && viewKbm) {
    viewKbm.classList.add('hidden');
    viewHome.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

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
        <option value="all" ${selectedDesaId === 'all' ? 'selected' : ''}>🌍 Semua Desa (${MASTER_WILAYAH.desa.length} Desa)</option>
        ${MASTER_WILAYAH.desa.map(d => `<option value="${d.id}" ${selectedDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`).join('')}
      </select>
    `;

    const activeDesaObj = MASTER_WILAYAH.desa.find(d => d.id === selectedDesaId);
    const kelompokList = activeDesaObj ? activeDesaObj.kelompok : MASTER_WILAYAH.desa.flatMap(d => d.kelompok);

    kelompokDropdownHtml = `
      <select id="hubSelKelompok" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer">
        <option value="all" ${selectedKelompokId === 'all' ? 'selected' : ''}>Semua Kelompok</option>
        ${kelompokList.map(k => `<option value="${k.id}" ${selectedKelompokId === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('')}
      </select>
    `;
  } else if (isDesa) {
    const desaObj = MASTER_WILAYAH.desa.find(d => d.id === currentUser.desaId) || MASTER_WILAYAH.desa[0];
    desaDropdownHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-brandBlue dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        <span class="material-symbols-outlined text-[15px]">location_city</span>
        Desa ${desaObj?.nama || currentUser.desaNama}
      </span>
    `;

    kelompokDropdownHtml = `
      <select id="hubSelKelompok" class="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer">
        <option value="all" ${selectedKelompokId === 'all' ? 'selected' : ''}>Semua Kelompok di Desa Ini</option>
        ${(desaObj?.kelompok || []).map(k => `<option value="${k.id}" ${selectedKelompokId === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('')}
      </select>
    `;
  } else {
    // Kelompok (Terkunci)
    desaDropdownHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span class="material-symbols-outlined text-[15px]">location_on</span>
        ${currentUser.kelompokNama || 'Kelompok'} (${currentUser.desaNama || 'Desa'})
      </span>
    `;
    kelompokDropdownHtml = '';
  }

  const meta = JENJANG_METADATA[activeJenjang];

  container.innerHTML = `
    <!-- Top Bar: Breadcrumb & Back Button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">
        <button type="button" id="btnBackToDashboardBreadcrumb" class="hover:text-brandBlue dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors">
          <span class="material-symbols-outlined text-[18px]">dashboard</span>
          <span>Dashboard</span>
        </button>
        <span class="text-slate-300 dark:text-slate-600">/</span>
        <span class="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-emerald-600 text-[18px]">menu_book</span>
          Jurnal KBM &amp; Pembinaan Generus
        </span>
      </div>

      <button type="button" id="btnBackToDashboardMain" class="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold shadow-sm cursor-pointer transition-all">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Kembali ke Beranda</span>
      </button>
    </div>

    <!-- Header Hero Banner with Auto-Tingkatan Indicator -->
    <div class="bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800 rounded-3xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
      <div class="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
        <span class="material-symbols-outlined text-[200px]">auto_stories</span>
      </div>
      <div class="relative z-10 space-y-2.5">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30">
          <span class="material-symbols-outlined text-[15px]">verified_user</span>
          <span>${tingkatanLabel}</span>
        </div>
        <h1 class="text-xl md:text-2xl font-extrabold tracking-tight">Jurnal KBM &amp; Pembinaan Generus</h1>
        <p class="text-xs text-emerald-100 max-w-2xl leading-relaxed">
          Presensi santri, jurnal materi KBM, dan lembar pembiasaan karakter.
        </p>

        <!-- Bar Filter Wilayah -->
        <div class="pt-1 flex items-center flex-wrap gap-2">
          <span class="text-xs font-bold text-emerald-100 flex items-center gap-1">
            <span class="material-symbols-outlined text-[15px]">filter_alt</span> Wilayah:
          </span>
          ${desaDropdownHtml}
          ${kelompokDropdownHtml}
        </div>
      </div>
    </div>

    <!-- BAGIAN 1: JENJANG GENERUS (ABSENSI & JURNAL KBM) -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">Pilih Jenjang</h2>
      </div>

      <!-- 3 Kartu Pilihan Jenjang di Awal (Grid 3 Kolom) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- 1. Caberawit -->
        <div class="btn-select-jenjang p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${activeJenjang === 'caberawit' ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm ring-2 ring-amber-400/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300'}" data-jenjang="caberawit">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-xl">child_care</span>
              </div>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeJenjang === 'caberawit' ? 'bg-amber-500 text-white' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}">PAUD - SD</span>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-0.5">🌱 Caberawit</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Usia dini &amp; sekolah dasar (PAUD - SD).</p>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-amber-600">
            <span>${activeJenjang === 'caberawit' ? '● Terpilih' : 'Pilih'}</span>
            <span class="material-symbols-outlined text-base">${activeJenjang === 'caberawit' ? 'check_circle' : 'radio_button_unchecked'}</span>
          </div>
        </div>

        <!-- 2. Pra-Remaja (GP) -->
        <div class="btn-select-jenjang p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${activeJenjang === 'gp_reguler' ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-400/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}" data-jenjang="gp_reguler">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-brandBlue flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-xl">school</span>
              </div>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeJenjang === 'gp_reguler' ? 'bg-brandBlue text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'}">SMP</span>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-0.5">📚 Pra-Remaja (GP)</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Generus pendampingan reguler (SMP).</p>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-brandBlue">
            <span>${activeJenjang === 'gp_reguler' ? '● Terpilih' : 'Pilih'}</span>
            <span class="material-symbols-outlined text-base">${activeJenjang === 'gp_reguler' ? 'check_circle' : 'radio_button_unchecked'}</span>
          </div>
        </div>

        <!-- 3. Remaja & Muda-Mudi -->
        <div class="btn-select-jenjang p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${activeJenjang === 'remaja' ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-400/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300'}" data-jenjang="remaja">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-xl">diversity_3</span>
              </div>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeJenjang === 'remaja' ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}">SMA - Nikah</span>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-0.5">🎓 Remaja &amp; Dewasa</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Muda-mudi &amp; usia pra-nikah.</p>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-purple-600">
            <span>${activeJenjang === 'remaja' ? '● Terpilih' : 'Pilih'}</span>
            <span class="material-symbols-outlined text-base">${activeJenjang === 'remaja' ? 'check_circle' : 'radio_button_unchecked'}</span>
          </div>
        </div>
      </div>

      <!-- 2 Kartu Aksi Modul Sesuai Jenjang Terpilih -->
      <div class="bg-slate-100/70 dark:bg-slate-800/50 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full" style="background:${meta.color};"></span>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            Layanan KBM: <span style="color:${meta.color};">${meta.nama}</span>
          </h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Modul 1: Absensi KBM -->
          <div id="btnCardHubAbsensi" class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2.5">
                <span class="material-symbols-outlined text-xl">co_present</span>
              </div>
              <h4 class="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">
                Absensi KBM
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Cetak lembar fisik A4 &amp; input kehadiran santri.
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Buka Presensi</span>
              <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          <!-- Modul 2: Jurnal KBM -->
          <div id="btnCardHubJurnal" class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-brandBlue flex items-center justify-center group-hover:bg-brandBlue group-hover:text-white transition-colors mb-2.5">
                <span class="material-symbols-outlined text-xl">edit_note</span>
              </div>
              <h4 class="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brandBlue transition-colors">
                Jurnal KBM
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Kurikulum materi, hafalan, &amp; evaluasi belajar.
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-brandBlue dark:text-blue-400">
              <span>Buka Jurnal</span>
              <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- BAGIAN 2: PEMBIASAAN CABERAWIT -->
    <section class="space-y-3">
      <h2 class="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">Pembiasaan Caberawit</h2>

      <div id="btnCardHubPembiasaan" class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <span class="material-symbols-outlined text-2xl">checklist</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <h3 class="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Lembar Pembiasaan 29 Karakter Luhur
              </h3>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">Caberawit</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Target ibadah harian &amp; evaluasi karakter santri.
            </p>
          </div>
        </div>
        <button type="button" class="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer">
          <span>Buka Pembiasaan</span>
          <span class="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </section>

    <!-- BAGIAN 3: LAPORAN MUSYAWARAH 5 UNSUR -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">Musyawarah 5 Unsur</h2>
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
          <span class="material-symbols-outlined text-[13px]">schedule</span> Tahap Selanjutnya
        </span>
      </div>

      <div id="btnCardHubMusyawarah" class="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3.5">
          <div class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <span class="material-symbols-outlined text-2xl">handshake</span>
          </div>
          <div>
            <h3 class="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-0.5">
              Sinergi 5 Unsur Desa &amp; Kelompok
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Koordinasi PPG, Muballigh, Pinisepuh, Orang Tua, &amp; KMM.
            </p>
          </div>
        </div>
        <button type="button" class="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer">
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
  document.getElementById('btnBackToDashboardMain')?.addEventListener('click', showDashboardHomePage);

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

  // Aksi 1: Absensi KBM
  document.getElementById('btnCardHubAbsensi')?.addEventListener('click', () => {
    openPresensiOpsiModal(activeJenjang, selectedDesaId, selectedKelompokId);
  });

  // Aksi 2: Jurnal KBM
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
 * Dialog Interaktif Opsi Presensi KBM (Pilih Bulan, Tanggal & Cetak Lembar Presensi A4)
 */
export function openPresensiOpsiModal(jenjang = 'caberawit', desaId = 'all', kelompokId = 'all') {
  const meta = JENJANG_METADATA[jenjang] || JENJANG_METADATA.caberawit;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Tentukan opsi desa
  const tingkatan = currentUser?.tingkatan || (currentUser?.isSuperadmin ? 'daerah' : 'kelompok');
  let effectiveDesa = desaId;
  let effectiveKel = kelompokId;

  if (tingkatan === 'desa' && currentUser?.desaId) effectiveDesa = currentUser.desaId;
  if (tingkatan === 'kelompok' && currentUser?.desaId) {
    effectiveDesa = currentUser.desaId;
    effectiveKel = currentUser.kelompokId;
  }

  const modalHtml = `
    <div class="space-y-5">
      <!-- Info Header -->
      <div class="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
        <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
          <span class="material-symbols-outlined text-xl">co_present</span>
        </div>
        <div class="text-xs">
          <div class="font-bold text-sm">Opsi Cetak &amp; Presensi: ${meta.nama}</div>
          <div class="opacity-90">Format resmi dokumen fisik A4 (4 pertemuan/bulan) &amp; input kehadiran digital.</div>
        </div>
      </div>

      <!-- Parameter Form -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Jenjang Generus</label>
          <input type="text" value="${meta.nama} (${meta.badge})" readonly class="w-full px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 cursor-not-allowed">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Bulan &amp; Tahun Pelaksanaan</label>
          <div class="grid grid-cols-2 gap-2">
            <select id="modalPresensiBulan" class="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
              ${[
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
              ].map((m, idx) => `<option value="${idx + 1}" ${idx + 1 === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <input type="number" id="modalPresensiTahun" value="${currentYear}" class="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Wilayah Desa</label>
          <select id="modalPresensiDesa" ${tingkatan !== 'daerah' && !currentUser?.isSuperadmin ? 'disabled' : ''} class="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
            <option value="all">Semua Desa</option>
            ${MASTER_WILAYAH.desa.map(d => `<option value="${d.id}" ${effectiveDesa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kelompok Sambung</label>
          <select id="modalPresensiKelompok" ${tingkatan === 'kelompok' ? 'disabled' : ''} class="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100">
            <option value="all">Semua Kelompok</option>
            ${MASTER_WILAYAH.desa.flatMap(d => d.kelompok).map(k => `<option value="${k.id}" ${effectiveKel === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
        <button type="button" id="btnBukaMatrixPresensiCepat" class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]">edit_calendar</span>
          <span>Buka Matrix Kehadiran Cepat</span>
        </button>

        <button type="button" id="btnCetakLembarPresensiA4" class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">print</span>
          <span>Cetak Lembar Presensi A4</span>
        </button>
      </div>
    </div>
  `;

  openModal(`Opsi Presensi KBM: ${meta.nama}`, 'co_present', modalHtml, 'medium');

  // Listeners di dalam modal opsi presensi
  document.getElementById('btnCetakLembarPresensiA4')?.addEventListener('click', () => {
    const b = document.getElementById('modalPresensiBulan')?.value || currentMonth;
    const t = document.getElementById('modalPresensiTahun')?.value || currentYear;
    const d = document.getElementById('modalPresensiDesa')?.value || effectiveDesa;
    const k = document.getElementById('modalPresensiKelompok')?.value || effectiveKel;

    const printUrl = `../laporan/cetak-absensi.html?jenjang=${encodeURIComponent(jenjang)}&bulan=${encodeURIComponent(b)}&tahun=${encodeURIComponent(t)}&desa=${encodeURIComponent(d)}&kelompok=${encodeURIComponent(k)}`;
    window.open(printUrl, '_blank');
    closeModal();
  });

  document.getElementById('btnBukaMatrixPresensiCepat')?.addEventListener('click', () => {
    closeModal();
    renderCetakAbsensiModal('agenda');
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
    filterKel: kId
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

