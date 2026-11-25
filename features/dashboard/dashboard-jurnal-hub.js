/**
 * ════════════════════════════════════════════════════════════════════════════
 * MODUL LAPORAN KEGIATAN & PEMBINAAN GENERUS (FULL PAGE HUB VIEW)
 * ════════════════════════════════════════════════════════════════════════════
 * Struktur 4 Menu Utama & Sub-Menu:
 * - Laporan Harian Individu (Caberawit, GP, Pra Nikah)
 * - Laporan Jurnal Penyampaian (Kelas) (Caberawit, GP)
 * - Kegiatan Remaja (Kelompok, Desa, Daerah)
 * - Laporan Musyawaroh 5 Unsur
 */

import {
  currentUser,
  MASTER_WILAYAH,
  showDashboardView,
  showDashboardHomePage
} from './dashboard-common.js';

import {
  renderCetakAbsensiModal
} from './dashboard-kbm.js';

import {
  renderEventPembiasaanModal
} from './dashboard-pembiasaan.js';

import {
  openRekapAbsensiBulananModal
} from './dashboard-absensi-bulanan.js';

import {
  openMusyawarah5UnsurModal as openForm5UnsurModule
} from './dashboard-5unsur.js';

// State Halaman Laporan Kegiatan
let activeSection = 'home'; // 'home' | 'individu' | 'penyampaian' | 'kegiatan_remaja'
let selectedDesaId = 'all';
let selectedKelompokId = 'all';

const NOT_FOUND_URL = '/404.html?from=dashboard';

const SECTION_TITLES = {
  home: 'Laporan Kegiatan',
  individu: 'Laporan Harian Individu',
  penyampaian: 'Jurnal Penyampaian (Kelas)',
  kegiatan_remaja: 'Kegiatan Remaja'
};

function getUserAccessRole() {
  const tingkatan = currentUser?.tingkatan || (currentUser?.isSuperadmin ? 'daerah' : 'kelompok');
  const isDaerah = tingkatan === 'daerah' || Boolean(currentUser?.isSuperadmin);
  const isDesa = !isDaerah && tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;
  return { tingkatan, isDaerah, isDesa, isKelompok };
}

/**
 * Inisialisasi default filter wilayah berdasarkan hak akses pengguna
 */
function initWilayahFilters() {
  if (!currentUser) return;
  const { isKelompok, isDesa } = getUserAccessRole();

  if (isKelompok) {
    selectedDesaId = currentUser.desaId || 'all';
    selectedKelompokId = currentUser.kelompokId || 'all';
  } else if (isDesa) {
    selectedDesaId = currentUser.desaId || (MASTER_WILAYAH.desa[0]?.id || 'all');
    selectedKelompokId = 'all';
  } else {
    selectedDesaId = 'all';
    selectedKelompokId = 'all';
  }
}

/**
 * Tampilkan Halaman Laporan Kegiatan (Full Page View dalam Dashboard)
 */
export function showJurnalKbmPage(preferredSection = 'home') {
  activeSection = SECTION_TITLES[preferredSection] ? preferredSection : 'home';
  initWilayahFilters();
  showDashboardView('viewJurnalKbm');
  renderJurnalKbmPageView();
}

export { showDashboardHomePage };

/**
 * Helper render satu baris sub-menu aksi di dalam kartu jenjang
 * Tanpa pil "Aktif" yang redundan; hanya tampilkan badge status bila "Segera Hadir" atau "Lihat Saja"
 */
function renderSubActionItem({ action, href = null, icon, label, available = true, readOnly = false, iconColorClass = 'text-blue-600' }) {
  let badgeHtml = '';
  if (!available) {
    badgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600/60 shrink-0">Segera Hadir</span>`;
  } else if (readOnly) {
    badgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600/60 shrink-0">Lihat Saja</span>`;
  }

  const innerContent = `
    <div class="flex items-center gap-2.5 min-w-0">
      <span class="material-symbols-outlined text-[18px] ${available ? iconColorClass : 'text-slate-400'} shrink-0">${icon}</span>
      <span class="text-xs sm:text-[13px] font-bold ${available ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'} truncate">${label}</span>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      ${badgeHtml}
      <span class="material-symbols-outlined text-[16px] text-slate-400 group-hover/item:translate-x-0.5 transition-transform">chevron_right</span>
    </div>
  `;

  if (href) {
    return `
      <a href="${href}" class="group/item w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all no-underline">
        ${innerContent}
      </a>
    `;
  }

  return `
    <button type="button" data-action="${action}" class="btn-hub-subaction group/item w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800/90 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all cursor-pointer text-left">
      ${innerContent}
    </button>
  `;
}

/**
 * Render View Home: 4 Kartu Menu Utama (Tanpa penomoran & tanpa kalimat mendikte)
 */
function renderHomeMenuHtml() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- LAPORAN HARIAN INDIVIDU -->
      <div data-goto="individu" class="btn-hub-main-card group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3.5">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-[22px]">person_check</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
              3 Jenjang
            </span>
          </div>

          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Laporan Harian Individu
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Presensi harian, penguasaan materi, &amp; lembar pembiasaan
            </p>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">Caberawit</span>
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">GP (Pra-Remaja)</span>
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/50">Pra Nikah</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
          <span>Lihat Jenjang</span>
          <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>

      <!-- LAPORAN JURNAL PENYAMPAIAN (KELAS) -->
      <div data-goto="penyampaian" class="btn-hub-main-card group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3.5">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-[22px]">menu_book</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
              2 Jenjang
            </span>
          </div>

          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Laporan Jurnal Penyampaian (Kelas)
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Catatan materi &amp; silabus pengajaran kelas
            </p>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">Caberawit</span>
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">GP (Pra-Remaja)</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
          <span>Lihat Jenjang</span>
          <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>

      <!-- KEGIATAN REMAJA -->
      <div data-goto="kegiatan_remaja" class="btn-hub-main-card group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3.5">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-[22px]">diversity_3</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
              3 Tingkatan
            </span>
          </div>

          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Kegiatan Remaja
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Jurnal acara, lembar absensi, &amp; rekap kehadiran
            </p>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">Kelompok</span>
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">Desa</span>
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">Daerah</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <span>Lihat Tingkatan</span>
          <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>

      <!-- LAPORAN MUSYAWAROH 5 UNSUR -->
      <div data-action="musyawarah_5_unsur" class="btn-hub-subaction group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3.5">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
              LUPG
            </span>
          </div>

          <div>
            <h2 class="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Laporan Musyawaroh 5 Unsur
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Notulen musyawarah LUPG &amp; cetak format daerah
            </p>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">Form Isian</span>
            <span class="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">Cetak PDF</span>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <span>Buka Formulir</span>
          <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Sub-Halaman: Laporan Harian Individu (Tanpa huruf a/b/c dan tanpa pil "Aktif")
 */
function renderIndividuSectionHtml() {
  const { isKelompok } = getUserAccessRole();

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- CABERAWIT -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-xl">child_care</span>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Caberawit</h3>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">PAUD &ndash; Kelas 6 SD</span>
          </div>
        </div>
        <div class="space-y-2">
          ${renderSubActionItem({ action: 'presensi_caberawit', icon: 'co_present', label: 'Presensi Harian', available: true, iconColorClass: 'text-amber-600' })}
          ${renderSubActionItem({ href: NOT_FOUND_URL, icon: 'psychology', label: 'Penguasaan Materi', available: false })}
          ${renderSubActionItem({ action: 'pembiasaan_caberawit', icon: 'checklist', label: 'Lembar Pembiasaan', available: true, iconColorClass: 'text-amber-600' })}
        </div>
      </div>

      <!-- GP (PRA REMAJA) -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-xl">school</span>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">GP (Pra-Remaja)</h3>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">Kelas 1 &ndash; 3 SMP</span>
          </div>
        </div>
        <div class="space-y-2">
          ${renderSubActionItem({ action: 'presensi_gp', icon: 'co_present', label: 'Presensi Harian', available: true, readOnly: isKelompok, iconColorClass: 'text-blue-600' })}
          ${renderSubActionItem({ href: NOT_FOUND_URL, icon: 'psychology', label: 'Penguasaan Materi', available: false })}
          ${renderSubActionItem({ action: 'pembiasaan_gp', icon: 'checklist', label: 'Lembar Pembiasaan', available: true, readOnly: isKelompok, iconColorClass: 'text-blue-600' })}
        </div>
      </div>

      <!-- PRA NIKAH -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div class="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div class="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-xl">favorite</span>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Pra Nikah</h3>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">Usia 19 &ndash; 22 Tahun</span>
          </div>
        </div>
        <div class="space-y-2">
          ${renderSubActionItem({ href: NOT_FOUND_URL, icon: 'co_present', label: 'Presensi Harian', available: false })}
          ${renderSubActionItem({ href: NOT_FOUND_URL, icon: 'psychology', label: 'Penguasaan Materi', available: false })}
          ${renderSubActionItem({ href: NOT_FOUND_URL, icon: 'checklist', label: 'Lembar Pembiasaan', available: false })}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Sub-Halaman: Laporan Jurnal Penyampaian (Kelas)
 */
function renderPenyampaianSectionHtml() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <a href="${NOT_FOUND_URL}" class="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between gap-4 no-underline">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">child_care</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">Caberawit</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Segera Hadir</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kelas PAUD &ndash; SD</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform shrink-0">arrow_forward</span>
      </a>

      <a href="${NOT_FOUND_URL}" class="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between gap-4 no-underline">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">school</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">GP (Pra-Remaja)</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Segera Hadir</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Kelas SMP / GP</p>
          </div>
        </div>
        <span class="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform shrink-0">arrow_forward</span>
      </a>
    </div>
  `;
}

/**
 * Render Sub-Halaman: Kegiatan Remaja (Kelompok, Desa, Daerah)
 */
function renderKegiatanRemajaSectionHtml() {
  const { isKelompok, isDesa } = getUserAccessRole();
  const desaReadOnly = isKelompok;
  const daerahReadOnly = isKelompok || isDesa;

  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- TINGKAT KELOMPOK -->
      <button type="button" data-action="remaja_kelompok" class="btn-hub-subaction group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer text-left flex flex-col justify-between gap-3.5">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-xl">location_on</span>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              Tingkat Kelompok
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jurnal &amp; absensi lingkup kelompok</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-xs font-bold text-emerald-600 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
          <span>Buka</span>
          <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </button>

      <!-- TINGKAT DESA -->
      <button type="button" data-action="remaja_desa" class="btn-hub-subaction group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer text-left flex flex-col justify-between gap-3.5">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-xl">location_city</span>
            </div>
            ${desaReadOnly ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">Lihat Saja</span>` : ''}
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
              Tingkat Desa
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jurnal &amp; absensi gabungan se-desa</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-xs font-bold text-blue-600 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
          <span>${desaReadOnly ? 'Lihat' : 'Buka'}</span>
          <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </button>

      <!-- TINGKAT DAERAH -->
      <button type="button" data-action="remaja_daerah" class="btn-hub-subaction group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-4 sm:p-5 shadow-xs hover:border-purple-500 hover:shadow-md transition-all cursor-pointer text-left flex flex-col justify-between gap-3.5">
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <span class="material-symbols-outlined text-xl">public</span>
            </div>
            ${daerahReadOnly ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">Lihat Saja</span>` : ''}
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              Tingkat Daerah
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jurnal &amp; absensi Daerah Solo Selatan</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-xs font-bold text-purple-600 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
          <span>${daerahReadOnly ? 'Lihat' : 'Buka'}</span>
          <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </button>
    </div>
  `;
}

/**
 * Render elemen dinamis pada Halaman Laporan Kegiatan
 */
export function renderJurnalKbmPageView() {
  const container = document.getElementById('viewJurnalKbm');
  if (!container) return;

  const { isDaerah, isDesa } = getUserAccessRole();

  let tingkatanLabel = 'Pengurus Daerah PPG';
  if (isDesa) tingkatanLabel = `Desa ${currentUser.desaNama || ''}`;
  else if (!isDaerah) tingkatanLabel = `Kel. ${currentUser.kelompokNama || ''}`;

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
    desaDropdownHtml = `
      <span class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span class="material-symbols-outlined text-[15px]">location_on</span>
        ${currentUser.kelompokNama || ''} (${currentUser.desaNama || ''})
      </span>
    `;
  }

  let bodyHtml = '';
  if (activeSection === 'individu') bodyHtml = renderIndividuSectionHtml();
  else if (activeSection === 'penyampaian') bodyHtml = renderPenyampaianSectionHtml();
  else if (activeSection === 'kegiatan_remaja') bodyHtml = renderKegiatanRemajaSectionHtml();
  else bodyHtml = renderHomeMenuHtml();

  const isSubView = activeSection !== 'home';

  container.innerHTML = `
    <!-- HEADER BAR LAPORAN KEGIATAN -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs backdrop-blur-xs">
      <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button type="button" id="btnJurnalHubBack" class="${isSubView ? '' : 'btnBackToDashboardBreadcrumb'} p-2 -ml-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer shrink-0" title="${isSubView ? 'Kembali ke Laporan Kegiatan' : 'Kembali ke Dashboard'}">
          <span class="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
            <span class="material-symbols-outlined text-[20px]">menu_book</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                ${isSubView ? SECTION_TITLES[activeSection] : 'Laporan Kegiatan'}
              </h1>
              <span class="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200/80 dark:border-blue-800/60 shrink-0 truncate max-w-[220px] sm:max-w-none" title="${tingkatanLabel}">
                ${isDaerah ? 'Daerah' : (isDesa ? `Desa ${currentUser.desaNama || ''}` : `Kel. ${currentUser.kelompokNama || ''}`)}
              </span>
            </div>
            ${isSubView ? `
              <div class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                <button type="button" id="btnBreadcrumbJurnalHome" class="hover:text-blue-600 cursor-pointer font-semibold">Laporan Kegiatan</button>
                <span>/</span>
                <span class="text-slate-600 dark:text-slate-300 font-semibold">${SECTION_TITLES[activeSection]}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div class="flex items-center flex-wrap gap-2 shrink-0">
        ${desaDropdownHtml}
        ${kelompokDropdownHtml}
      </div>
    </div>

    ${bodyHtml}
  `;

  attachJurnalKbmHubListeners();
}

/**
 * Event Listeners untuk Halaman Laporan Kegiatan
 */
function attachJurnalKbmHubListeners() {
  document.getElementById('btnJurnalHubBack')?.addEventListener('click', () => {
    if (activeSection !== 'home') {
      activeSection = 'home';
      renderJurnalKbmPageView();
    } else {
      showDashboardHomePage();
    }
  });

  document.getElementById('btnBreadcrumbJurnalHome')?.addEventListener('click', () => {
    activeSection = 'home';
    renderJurnalKbmPageView();
  });

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

  document.querySelectorAll('.btn-hub-main-card').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.goto;
      if (target && SECTION_TITLES[target]) {
        activeSection = target;
        renderJurnalKbmPageView();
      }
    });
  });

  const { isKelompok } = getUserAccessRole();

  document.querySelectorAll('.btn-hub-subaction').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'presensi_caberawit') {
        openRekapAbsensiBulananModal({
          jenjang: 'caberawit',
          desaId: selectedDesaId,
          kelompokId: selectedKelompokId,
          readOnly: false
        });
      } else if (action === 'presensi_gp') {
        openRekapAbsensiBulananModal({
          jenjang: 'gp_reguler',
          desaId: selectedDesaId,
          kelompokId: selectedKelompokId,
          readOnly: isKelompok
        });
      } else if (action === 'pembiasaan_caberawit') {
        renderEventPembiasaanModal(false, 1, 'caberawit');
      } else if (action === 'pembiasaan_gp') {
        renderEventPembiasaanModal(false, 1, 'gp_reguler');
      } else if (action === 'remaja_kelompok') {
        openKegiatanRemajaModal('kelompok_only');
      } else if (action === 'remaja_desa') {
        openKegiatanRemajaModal('desa_all');
      } else if (action === 'remaja_daerah') {
        openKegiatanRemajaModal('all');
      } else if (action === 'musyawarah_5_unsur') {
        openForm5UnsurModule({
          desaId: selectedDesaId,
          kelompokId: selectedKelompokId
        });
      }
    });
  });
}

/**
 * Buka Modul Event & Absen KBM untuk Kegiatan Remaja per Tingkatan
 */
function openKegiatanRemajaModal(scopeMode) {
  const { isDaerah, isDesa, isKelompok } = getUserAccessRole();
  let filterDesa = (isDesa || isKelompok) ? (currentUser?.desaId || selectedDesaId) : selectedDesaId;
  let filterKel = isKelompok ? (currentUser?.kelompokId || selectedKelompokId) : selectedKelompokId;

  if (scopeMode === 'all') {
    if (isDaerah) {
      filterDesa = 'all';
      filterKel = 'all';
    } else if (isDesa) {
      filterDesa = currentUser?.desaId || selectedDesaId;
      filterKel = 'all';
    }
  } else if (scopeMode === 'desa_all') {
    filterKel = 'all';
  }

  // Enforce hak akses:
  // - Kelompok: hanya bisa edit/buat di kelompok_only; desa_all & all -> readOnly
  // - Desa: terbuka di kelompok_only & desa_all; all (Daerah) -> readOnly
  // - Daerah: terbuka semua
  const readOnlyMode = (isKelompok && scopeMode !== 'kelompok_only') || (isDesa && scopeMode === 'all');

  renderCetakAbsensiModal('agenda', {
    filterDesa,
    filterKel,
    filterFormat: 'remaja',
    scopeMode,
    readOnly: readOnlyMode
  });
}

/**
 * Kompatibilitas ekspor lama
 */
export function openPresensiOpsiModal(jenjang = 'caberawit', desaId = 'all', kelompokId = 'all') {
  const { isKelompok } = getUserAccessRole();
  openRekapAbsensiBulananModal({
    jenjang,
    desaId,
    kelompokId,
    readOnly: isKelompok && jenjang !== 'caberawit'
  });
}

export function openJurnalKbmDialog(jenjang = 'caberawit', desaId = 'all', kelompokId = 'all') {
  const { isDesa, isKelompok } = getUserAccessRole();
  const dId = (isDesa || isKelompok) ? (currentUser?.desaId || desaId) : desaId;
  const kId = isKelompok ? (currentUser?.kelompokId || kelompokId) : kelompokId;

  renderCetakAbsensiModal('agenda', {
    filterDesa: dId,
    filterKel: kId,
    filterFormat: jenjang
  });
}

export function openMusyawarah5UnsurModal(options = {}) {
  return openForm5UnsurModule(options);
}
