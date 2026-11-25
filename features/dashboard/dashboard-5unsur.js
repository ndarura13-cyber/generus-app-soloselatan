/**
 * ════════════════════════════════════════════════════════════════════════════
 * MODUL LAPORAN MUSYAWAROH 5 UNSUR (LUPG) — CLOUD SUPABASE & CETAK PDF
 * ════════════════════════════════════════════════════════════════════════════
 * Fitur:
 * 1. Daftar Riwayat Laporan Musyawarah 5 Unsur (Sinkron langsung ke Supabase Cloud)
 * 2. Filter multi-dropdown (Desa -> Kelompok) untuk Superadmin, Desa, & Kelompok
 * 3. Form isian lengkap sesuai format resmi PPG Daerah Solo Selatan
 * 4. Output Preview & Cetak / Simpan PDF A4 formal sesuai template PDF resmi
 */

'use strict';

import {
  MASTER_WILAYAH,
  getAllKelompok
} from '../../src/db-master.js';

import {
  fetchMusyawarah5UnsurFromSupabase,
  upsertMusyawarah5UnsurToSupabase,
  deleteMusyawarah5UnsurFromSupabase
} from '../../src/supabase.js';

import {
  currentUser,
  openModal,
  showToast,
  showConfirmModal
} from './dashboard-common.js';

const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SQL_CREATE_TABLE_5_UNSUR = `CREATE TABLE IF NOT EXISTS public.musyawarah_5_unsur (
  id TEXT PRIMARY KEY,
  tanggal DATE NOT NULL,
  hari_tanggal_text TEXT NOT NULL,
  desa_id TEXT,
  desa_nama TEXT,
  kelompok_id TEXT NOT NULL,
  kelompok_nama TEXT NOT NULL,
  wajib_hadir INTEGER DEFAULT 0,
  hadir_laki INTEGER DEFAULT 0,
  hadir_perempuan INTEGER DEFAULT 0,
  total_hadir INTEGER DEFAULT 0,
  ijin INTEGER DEFAULT 0,
  tanpa_keterangan INTEGER DEFAULT 0,
  agenda_ppg TEXT DEFAULT '',
  rangkuman_hasil TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.musyawarah_5_unsur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access musyawarah_5_unsur" ON public.musyawarah_5_unsur
  FOR ALL USING (true) WITH CHECK (true);`;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatHariTanggalIndonesia(isoDate) {
  if (!isoDate) return '';
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return isoDate;
  const hari = HARI_ID[d.getDay()];
  const tgl = d.getDate();
  const bulan = BULAN_ID[d.getMonth()];
  const tahun = d.getFullYear();
  return `${hari}, ${tgl} ${bulan} ${tahun}`;
}

function getTodayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Buka Modal Utama Daftar & Riwayat Laporan Musyawarah 5 Unsur
 */
export async function openMusyawarah5UnsurModal(options = {}) {
  const modalHtml = `
    <div id="musyawarah5UnsurContainer" class="p-0.5 space-y-3">
      <div class="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
        Memuat data laporan dari Supabase Cloud...
      </div>
    </div>
  `;

  openModal(
    'Laporan Musyawaroh 5 Unsur (LUPG)',
    'handshake',
    modalHtml,
    'wide'
  );

  const container = document.getElementById('musyawarah5UnsurContainer');
  if (container) {
    await renderMusyawarah5UnsurList(container, options);
  }
}

/**
 * Render Daftar Riwayat Laporan dari Supabase Cloud
 */
async function renderMusyawarah5UnsurList(container, options = {}) {
  if (!container) return;

  const isDaerah = currentUser?.tingkatan === 'daerah' || currentUser?.isSuperadmin === true;
  const isDesa = currentUser?.tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;

  const currentDesaId = currentUser?.desaId || 'desa-timur-1';
  const currentKelId = currentUser?.kelompokId || 'kel-gunung-wijil-1';

  const selectedDesa = options.desaId || (isDaerah ? 'all' : currentDesaId);
  const selectedKel = options.kelompokId || (isKelompok ? currentKelId : 'all');
  const selectedMonth = options.bulan || 'all'; // 'all' atau 'YYYY-MM'

  const allKels = getAllKelompok();
  const desaList = MASTER_WILAYAH.desa;

  const selectChevronStyle = `appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:13px_13px] bg-[right_10px_center] bg-no-repeat`;

  let selDesaHtml = '';
  let selKelompokHtml = '';

  if (isDaerah) {
    const filteredKels = selectedDesa === 'all' ? allKels : allKels.filter(k => k.desaId === selectedDesa);
    selDesaHtml = `
      <select id="sel5UnsurDesa" class="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs outline-none cursor-pointer ${selectChevronStyle}">
        <option value="all" ${selectedDesa === 'all' ? 'selected' : ''}>Semua Desa</option>
        ${desaList.map(d => `<option value="${d.id}" ${selectedDesa === d.id ? 'selected' : ''}>Desa ${escapeHtml(d.nama)}</option>`).join('')}
      </select>
    `;
    selKelompokHtml = `
      <select id="sel5UnsurKelompok" class="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs outline-none cursor-pointer ${selectChevronStyle}">
        <option value="all" ${selectedKel === 'all' ? 'selected' : ''}>Semua Kelompok</option>
        ${filteredKels.map(k => `<option value="${k.id}" ${selectedKel === k.id ? 'selected' : ''}>Kel. ${escapeHtml(k.nama)}</option>`).join('')}
      </select>
    `;
  } else if (isDesa) {
    const desaObj = desaList.find(d => d.id === currentDesaId) || desaList[0];
    const filteredKels = allKels.filter(k => k.desaId === currentDesaId);
    selDesaHtml = `
      <div class="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center justify-between">
        <span class="truncate">Desa ${escapeHtml(desaObj?.nama || 'Desa')}</span>
        <span class="material-symbols-outlined text-[15px] opacity-60">lock</span>
      </div>
    `;
    selKelompokHtml = `
      <select id="sel5UnsurKelompok" class="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs outline-none cursor-pointer ${selectChevronStyle}">
        <option value="all" ${selectedKel === 'all' ? 'selected' : ''}>Semua Kelompok</option>
        ${filteredKels.map(k => `<option value="${k.id}" ${selectedKel === k.id ? 'selected' : ''}>Kel. ${escapeHtml(k.nama)}</option>`).join('')}
      </select>
    `;
  } else {
    const kelObj = allKels.find(k => k.id === currentKelId);
    const desaObj = desaList.find(d => d.id === currentDesaId) || desaList[0];
    selDesaHtml = `
      <div class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs truncate">
        Desa ${escapeHtml(desaObj?.nama || '-')}
      </div>
    `;
    selKelompokHtml = `
      <div class="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-between">
        <span class="truncate">Kel. ${escapeHtml(kelObj?.nama || 'Kelompok Saya')}</span>
        <span class="material-symbols-outlined text-[15px] opacity-60">lock</span>
      </div>
    `;
  }

  // Ambil data langsung dari Supabase Cloud
  const cloudRes = await fetchMusyawarah5UnsurFromSupabase({
    desaId: selectedDesa,
    kelompokId: selectedKel
  });

  const allItems = cloudRes.success ? cloudRes.data : [];
  const filteredItems = selectedMonth === 'all'
    ? allItems
    : allItems.filter(it => String(it.tanggal || '').startsWith(selectedMonth));

  // Opsi bulan dari data yang ada + bulan berjalan
  const monthSet = new Set();
  monthSet.add(getTodayIsoDate().slice(0, 7));
  allItems.forEach(it => {
    if (it.tanggal && it.tanggal.length >= 7) monthSet.add(it.tanggal.slice(0, 7));
  });
  const monthOptions = Array.from(monthSet).sort().reverse();

  let listContentHtml = '';

  if (cloudRes.tableMissing) {
    listContentHtml = `
      <div class="p-4 sm:p-5 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 space-y-3">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-amber-600 text-2xl shrink-0">database</span>
          <div class="min-w-0 space-y-1">
            <h4 class="text-sm font-extrabold text-amber-900 dark:text-amber-200">Tabel Supabase Belum Tersedia</h4>
            <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Karena penyimpanan terpusat di Supabase Cloud, silakan buat tabel <code>musyawarah_5_unsur</code> di SQL Editor Supabase Anda terlebih dahulu menggunakan skrip berikut:
            </p>
          </div>
        </div>
        <pre class="p-3 rounded-xl bg-slate-900 text-slate-100 text-[10.5px] overflow-x-auto leading-relaxed">${escapeHtml(SQL_CREATE_TABLE_5_UNSUR)}</pre>
        <div class="flex justify-end">
          <button type="button" id="btnCopySql5Unsur" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-[15px]">content_copy</span>
            <span>Salin SQL Tabel</span>
          </button>
        </div>
      </div>
    `;
  } else if (!cloudRes.success) {
    listContentHtml = `
      <div class="p-6 text-center rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs">
        Gagal memuat data dari Supabase: ${escapeHtml(cloudRes.error || 'Koneksi bermasalah')}
      </div>
    `;
  } else if (filteredItems.length === 0) {
    listContentHtml = `
      <div class="py-10 px-4 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
        <span class="material-symbols-outlined text-4xl text-slate-400">description</span>
        <div class="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Laporan Musyawaroh 5 Unsur</div>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Klik tombol <strong>"Buat Laporan 5 Unsur"</strong> di atas untuk mengisi form dan mencetak PDF resmi.
        </p>
      </div>
    `;
  } else {
    listContentHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${filteredItems.map(doc => `
          <div class="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 transition-all flex flex-col justify-between gap-3">
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 mb-1">
                    <span class="material-symbols-outlined text-[12px]">calendar_today</span>
                    ${escapeHtml(doc.hariTanggalText || formatHariTanggalIndonesia(doc.tanggal))}
                  </span>
                  <h4 class="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    Kel. ${escapeHtml(doc.kelompokNama)}
                  </h4>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    Desa ${escapeHtml(doc.desaNama || '-')}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-base font-black text-emerald-600 dark:text-emerald-400">${doc.totalHadir}/${doc.wajibHadir}</div>
                  <div class="text-[10px] font-bold text-slate-400 uppercase">Hadir / Wajib</div>
                </div>
              </div>

              <div class="grid grid-cols-4 gap-1.5 text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/60 text-[11px]">
                <div>
                  <div class="font-extrabold text-slate-800 dark:text-slate-100">${doc.hadirLaki}</div>
                  <div class="text-[9.5px] text-slate-500">Laki-laki</div>
                </div>
                <div>
                  <div class="font-extrabold text-slate-800 dark:text-slate-100">${doc.hadirPerempuan}</div>
                  <div class="text-[9.5px] text-slate-500">Perempuan</div>
                </div>
                <div>
                  <div class="font-extrabold text-amber-600">${doc.ijin}</div>
                  <div class="text-[9.5px] text-slate-500">Ijin</div>
                </div>
                <div>
                  <div class="font-extrabold text-rose-600">${doc.tanpaKeterangan}</div>
                  <div class="text-[9.5px] text-slate-500">Alpha</div>
                </div>
              </div>

              ${doc.rangkumanHasil ? `
                <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  <strong>Hasil:</strong> ${escapeHtml(doc.rangkumanHasil)}
                </p>
              ` : ''}
            </div>

            <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-wrap">
              <button type="button" class="btn-edit-5unsur inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer whitespace-nowrap" data-id="${escapeHtml(doc.id)}">
                <span class="material-symbols-outlined text-[15px]">edit</span>
                <span>Edit</span>
              </button>
              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" class="btn-print-5unsur inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-2xs whitespace-nowrap" data-id="${escapeHtml(doc.id)}">
                  <span class="material-symbols-outlined text-[15px]">print</span>
                  <span>Cetak / PDF</span>
                </button>
                <button type="button" class="btn-del-5unsur p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0" data-id="${escapeHtml(doc.id)}" title="Hapus Laporan">
                  <span class="material-symbols-outlined text-[17px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <!-- Filter & Action Toolbar -->
    <div class="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:max-w-xl">
          ${selDesaHtml}
          ${selKelompokHtml}
          <select id="sel5UnsurBulan" class="w-full px-3 py-2 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs outline-none cursor-pointer ${selectChevronStyle}">
            <option value="all" ${selectedMonth === 'all' ? 'selected' : ''}>Semua Bulan</option>
            ${monthOptions.map(ym => {
              const [y, m] = ym.split('-');
              const label = `${BULAN_ID[Number(m) - 1] || m} ${y}`;
              return `<option value="${ym}" ${selectedMonth === ym ? 'selected' : ''}>${label}</option>`;
            }).join('')}
          </select>
        </div>

        <button type="button" id="btnBuatLaporan5Unsur" class="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm cursor-pointer shrink-0">
          <span class="material-symbols-outlined text-[17px]">add_circle</span>
          <span>Buat Laporan 5 Unsur</span>
        </button>
      </div>
    </div>

    <!-- List Riwayat -->
    ${listContentHtml}
  `;

  // Listeners
  document.getElementById('sel5UnsurDesa')?.addEventListener('change', (e) => {
    renderMusyawarah5UnsurList(container, { ...options, desaId: e.target.value, kelompokId: 'all' });
  });
  document.getElementById('sel5UnsurKelompok')?.addEventListener('change', (e) => {
    renderMusyawarah5UnsurList(container, { ...options, desaId: selectedDesa, kelompokId: e.target.value });
  });
  document.getElementById('sel5UnsurBulan')?.addEventListener('change', (e) => {
    renderMusyawarah5UnsurList(container, { ...options, desaId: selectedDesa, kelompokId: selectedKel, bulan: e.target.value });
  });

  document.getElementById('btnBuatLaporan5Unsur')?.addEventListener('click', () => {
    openFormMusyawarah5UnsurModal({
      desaId: selectedDesa !== 'all' ? selectedDesa : undefined,
      kelompokId: selectedKel !== 'all' ? selectedKel : undefined
    });
  });

  document.getElementById('btnCopySql5Unsur')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SQL_CREATE_TABLE_5_UNSUR);
      showToast('SQL berhasil disalin ke clipboard!', 'success');
    } catch {
      showToast('Gagal menyalin otomatis, silakan salin manual dari kotak kode.', 'warning');
    }
  });

  document.querySelectorAll('.btn-edit-5unsur').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = filteredItems.find(x => x.id === btn.dataset.id);
      if (doc) openFormMusyawarah5UnsurModal(doc);
    });
  });

  document.querySelectorAll('.btn-print-5unsur').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = filteredItems.find(x => x.id === btn.dataset.id);
      if (doc) printMusyawarah5UnsurPdf(doc);
    });
  });

  document.querySelectorAll('.btn-del-5unsur').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const doc = filteredItems.find(x => x.id === id);
      showConfirmModal(
        'Hapus Laporan 5 Unsur?',
        `Laporan Musyawaroh Kel. ${doc?.kelompokNama || ''} (${doc?.hariTanggalText || ''}) akan dihapus permanen dari Supabase Cloud.`,
        async () => {
          try {
            await deleteMusyawarah5UnsurFromSupabase(id);
            showToast('Laporan berhasil dihapus dari Cloud.', 'success');
            await renderMusyawarah5UnsurList(container, { desaId: selectedDesa, kelompokId: selectedKel, bulan: selectedMonth });
          } catch (err) {
            showToast(`Gagal menghapus: ${err.message}`, 'error');
          }
        }
      );
    });
  });
}

/**
 * Form Isian Laporan Musyawarah 5 Unsur
 */
export function openFormMusyawarah5UnsurModal(initialData = {}) {
  const isDaerah = currentUser?.tingkatan === 'daerah' || currentUser?.isSuperadmin === true;
  const isDesa = currentUser?.tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;

  const allKels = getAllKelompok();
  const desaList = MASTER_WILAYAH.desa;

  const defaultKelId = initialData.kelompokId || (isKelompok ? (currentUser?.kelompokId || allKels[0].id) : allKels[0].id);
  let kelObj = allKels.find(k => k.id === defaultKelId) || allKels[0];
  let desaObj = desaList.find(d => d.id === (initialData.desaId || kelObj.desaId)) || desaList[0];
  if (isDesa && !initialData.id) {
    desaObj = desaList.find(d => d.id === currentUser.desaId) || desaObj;
    const kelsInDesa = allKels.filter(k => k.desaId === desaObj.id);
    if (!kelsInDesa.some(k => k.id === kelObj.id) && kelsInDesa.length > 0) {
      kelObj = kelsInDesa[0];
    }
  }

  const tanggalVal = initialData.tanggal || getTodayIsoDate();
  const hariTanggalPreview = initialData.hariTanggalText || formatHariTanggalIndonesia(tanggalVal);

  const wajibHadirVal = initialData.wajibHadir ?? '';
  const lakiVal = initialData.hadirLaki ?? '';
  const perempuanVal = initialData.hadirPerempuan ?? '';
  const totalVal = (Number(lakiVal) || 0) + (Number(perempuanVal) || 0);
  const ijinVal = initialData.ijin ?? '';
  const alphaVal = initialData.tanpaKeterangan ?? '';

  const buildWilayahSelectorHtml = () => {
    if (!initialData.id && isDaerah) {
      const filteredKels = allKels.filter(k => k.desaId === desaObj.id);
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Pilih Desa</label>
            <select id="f5Desa" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer">
              ${desaList.map(d => `<option value="${d.id}" ${d.id === desaObj.id ? 'selected' : ''}>Desa ${escapeHtml(d.nama)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Kelompok</label>
            <select id="f5Kelompok" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer">
              ${filteredKels.map(k => `<option value="${k.id}" ${k.id === kelObj.id ? 'selected' : ''}>${escapeHtml(k.nama)}</option>`).join('')}
            </select>
          </div>
        </div>
      `;
    }
    if (!initialData.id && isDesa) {
      const filteredKels = allKels.filter(k => k.desaId === desaObj.id);
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Desa</label>
            <input type="text" value="Desa ${escapeHtml(desaObj.nama)}" disabled class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-xs font-bold text-slate-500" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Kelompok</label>
            <select id="f5Kelompok" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer">
              ${filteredKels.map(k => `<option value="${k.id}" ${k.id === kelObj.id ? 'selected' : ''}>${escapeHtml(k.nama)}</option>`).join('')}
            </select>
          </div>
        </div>
      `;
    }
    return `
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
        Kelompok: <span class="text-blue-600 dark:text-blue-400">${escapeHtml(kelObj.nama)}</span> &bull; Desa ${escapeHtml(desaObj.nama)}
      </div>
    `;
  };

  const formHtml = `
    <form id="form5Unsur" class="space-y-4 text-xs">
      <!-- Kop Info -->
      <div class="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-3">
        <img src="../../src/image/Logo-PPG.png" alt="Logo PPG" class="w-10 h-10 object-contain shrink-0" />
        <div class="min-w-0">
          <div class="font-extrabold text-slate-900 dark:text-white text-sm">FORMAT LAPORAN MUSYAWAROH 5 UNSUR</div>
          <div class="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">PPG DAERAH SOLO SELATAN</div>
        </div>
      </div>

      <!-- Wilayah -->
      ${buildWilayahSelectorHtml()}

      <!-- Hari & Tanggal -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tanggal Musyawaroh</label>
          <input type="date" id="f5Tanggal" value="${escapeHtml(tanggalVal)}" required class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Teks Hari &amp; Tanggal (di PDF)</label>
          <input type="text" id="f5HariTanggalText" value="${escapeHtml(hariTanggalPreview)}" required placeholder="Contoh: Rabu, 25 November 2026" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none" />
        </div>
      </div>

      <!-- Kehadiran Peserta -->
      <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
        <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Data Kehadiran Peserta</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Wajib Hadir (orang)</label>
            <input type="number" min="0" id="f5WajibHadir" value="${wajibHadirVal}" placeholder="0" required class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Hadir Laki-laki</label>
            <input type="number" min="0" id="f5Laki" value="${lakiVal}" placeholder="0" required class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Hadir Perempuan</label>
            <input type="number" min="0" id="f5Perempuan" value="${perempuanVal}" placeholder="0" required class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">Total Hadir (Otomatis)</label>
            <input type="number" id="f5Total" value="${totalVal}" readonly class="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-black text-emerald-700 dark:text-emerald-300 outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Ijin (orang)</label>
            <input type="number" min="0" id="f5Ijin" value="${ijinVal}" placeholder="0" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tanpa Keterangan (orang)</label>
            <input type="number" min="0" id="f5Alpha" value="${alphaVal}" placeholder="0" class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none" />
          </div>
        </div>
      </div>

      <!-- Agenda & Rangkuman -->
      <div class="space-y-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">Agenda dari PPG Daerah / Pokja :</label>
          <textarea id="f5Agenda" rows="4" placeholder="Tuliskan poin-poin agenda dari PPG Daerah / Pokja..." class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed outline-none">${escapeHtml(initialData.agendaPpg || '')}</textarea>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">Rangkuman Hasil Musyawaroh :</label>
          <textarea id="f5Rangkuman" rows="5" placeholder="Tuliskan rangkuman hasil musyawaroh 5 unsur..." class="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed outline-none">${escapeHtml(initialData.rangkumanHasil || '')}</textarea>
        </div>
      </div>

      <!-- Info Susunan Acara -->
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
        <strong>Catatan Output PDF:</strong> Bagian <em>Susunan Musyawaroh LUPG (1–9)</em> dan <em>Catatan</em> akan otomatis disertakan pada cetakan PDF persis sesuai format resmi PPG Daerah Solo Selatan.
      </div>

      <!-- Sticky Footer -->
      <div class="modal-sticky-footer">
        <button type="button" id="btnBatal5Unsur" class="btn-sticky-back" title="Kembali">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali</span>
        </button>
        <button type="button" id="btnSimpanCetak5Unsur" class="btn-sticky-print" title="Simpan &amp; Cetak PDF">
          <span class="material-symbols-outlined">print</span>
          <span class="btn-text">Simpan &amp; Cetak PDF</span>
        </button>
        <button type="submit" id="btnSimpan5Unsur" class="btn-sticky-save" title="Simpan ke Cloud">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">Simpan Cloud</span>
        </button>
      </div>
    </form>
  `;

  openModal(
    initialData.id ? 'Edit Laporan Musyawaroh 5 Unsur' : 'Isi Form Musyawaroh 5 Unsur',
    'edit_document',
    formHtml,
    'wide'
  );

  // Auto-update kelompok saat desa berubah (Superadmin)
  document.getElementById('f5Desa')?.addEventListener('change', (e) => {
    const newDesaId = e.target.value;
    desaObj = desaList.find(d => d.id === newDesaId) || desaList[0];
    const filteredKels = allKels.filter(k => k.desaId === desaObj.id);
    const selKel = document.getElementById('f5Kelompok');
    if (selKel) {
      selKel.innerHTML = filteredKels.map(k => `<option value="${k.id}">${escapeHtml(k.nama)}</option>`).join('');
      kelObj = filteredKels[0] || kelObj;
    }
  });

  document.getElementById('f5Kelompok')?.addEventListener('change', (e) => {
    kelObj = allKels.find(k => k.id === e.target.value) || kelObj;
    desaObj = desaList.find(d => d.id === kelObj.desaId) || desaObj;
  });

  // Auto-format Hari & Tanggal Indonesia saat tanggal berubah
  document.getElementById('f5Tanggal')?.addEventListener('change', (e) => {
    const teksEl = document.getElementById('f5HariTanggalText');
    if (teksEl) teksEl.value = formatHariTanggalIndonesia(e.target.value);
  });

  // Auto-hitung Total Hadir = Laki-laki + Perempuan
  const recalcTotal = () => {
    const l = Number(document.getElementById('f5Laki')?.value) || 0;
    const p = Number(document.getElementById('f5Perempuan')?.value) || 0;
    const totEl = document.getElementById('f5Total');
    if (totEl) totEl.value = l + p;
  };
  document.getElementById('f5Laki')?.addEventListener('input', recalcTotal);
  document.getElementById('f5Perempuan')?.addEventListener('input', recalcTotal);

  document.getElementById('btnBatal5Unsur')?.addEventListener('click', () => {
    openMusyawarah5UnsurModal({ desaId: desaObj.id, kelompokId: kelObj.id });
  });

  const handleSave = async (shouldPrint = false) => {
    const tanggal = document.getElementById('f5Tanggal')?.value || getTodayIsoDate();
    const hariTanggalText = document.getElementById('f5HariTanggalText')?.value.trim() || formatHariTanggalIndonesia(tanggal);
    const wajibHadir = Number(document.getElementById('f5WajibHadir')?.value) || 0;
    const hadirLaki = Number(document.getElementById('f5Laki')?.value) || 0;
    const hadirPerempuan = Number(document.getElementById('f5Perempuan')?.value) || 0;
    const ijin = Number(document.getElementById('f5Ijin')?.value) || 0;
    const tanpaKeterangan = Number(document.getElementById('f5Alpha')?.value) || 0;
    const agendaPpg = document.getElementById('f5Agenda')?.value || '';
    const rangkumanHasil = document.getElementById('f5Rangkuman')?.value || '';

    const docId = initialData.id || `m5u-${tanggal}-${kelObj.id}-${Date.now()}`;

    const payload = {
      id: docId,
      tanggal,
      hariTanggalText,
      desaId: desaObj.id,
      desaNama: desaObj.nama,
      kelompokId: kelObj.id,
      kelompokNama: kelObj.nama,
      wajibHadir,
      hadirLaki,
      hadirPerempuan,
      totalHadir: hadirLaki + hadirPerempuan,
      ijin,
      tanpaKeterangan,
      agendaPpg,
      rangkumanHasil,
      createdBy: currentUser?.nama || currentUser?.username || 'Pengurus'
    };

    const btnSave = document.getElementById('btnSimpan5Unsur');
    const btnSavePrint = document.getElementById('btnSimpanCetak5Unsur');
    if (btnSave) btnSave.disabled = true;
    if (btnSavePrint) btnSavePrint.disabled = true;

    try {
      showToast('Menyimpan laporan ke Supabase Cloud...', 'info');
      await upsertMusyawarah5UnsurToSupabase(payload);
      showToast('Laporan Musyawaroh 5 Unsur berhasil disimpan!', 'success');

      if (shouldPrint) {
        printMusyawarah5UnsurPdf(payload);
      }
      openMusyawarah5UnsurModal({ desaId: desaObj.id, kelompokId: kelObj.id });
    } catch (err) {
      console.error('Error saving 5 unsur:', err);
      showToast(`Gagal menyimpan ke Supabase: ${err.message}`, 'error');
      if (btnSave) btnSave.disabled = false;
      if (btnSavePrint) btnSavePrint.disabled = false;
    }
  };

  document.getElementById('form5Unsur')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSave(false);
  });

  document.getElementById('btnSimpanCetak5Unsur')?.addEventListener('click', () => {
    handleSave(true);
  });
}

/**
 * Render Jendela Cetak / Save PDF A4 Persis Format PDF Resmi
 */
export function printMusyawarah5UnsurPdf(doc) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Popup diblokir browser. Izinkan popup untuk mencetak PDF.', 'warning');
    return;
  }

  const logoUrl = `${window.location.origin}/src/image/Logo-PPG.png`;
  const hariTanggal = escapeHtml(doc.hariTanggalText || formatHariTanggalIndonesia(doc.tanggal));
  const kelompokNama = escapeHtml(doc.kelompokNama || '');

  const formatParagraphLines = (text, minEmptyLines = 4) => {
    const raw = String(text || '').trim();
    if (!raw) {
      return Array.from({ length: minEmptyLines })
        .map(() => `<div class="dotted-line">&nbsp;</div>`)
        .join('');
    }
    return `<div class="text-content-box">${escapeHtml(raw).replace(/\n/g, '<br/>')}</div>`;
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Musyawaroh 5 Unsur - ${kelompokNama}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: "Times New Roman", Times, serif;
      color: #000000;
      background: #f1f5f9;
      margin: 0;
      padding: 0;
      font-size: 11.5pt;
      line-height: 1.42;
    }
    .toolbar-no-print {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .btn-print-now {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12.5px;
    }
    .btn-print-now:hover { background: #1d4ed8; }
    .page-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background: #ffffff;
      padding: 14mm 16mm;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
    }
    @media print {
      body { background: #ffffff; }
      .toolbar-no-print { display: none !important; }
      .page-sheet {
        width: 100%;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
    @media screen and (max-width: 820px) {
      .page-sheet {
        width: 100%;
        min-height: auto;
        margin: 0;
        padding: 16px 14px;
        box-shadow: none;
      }
      .kop-logo { width: 48px !important; height: 48px !important; }
      .kop-text { padding-right: 0 !important; }
      .kop-title { font-size: 11pt !important; }
      .kop-sub { font-size: 10pt !important; }
      .kop-addr { font-size: 8pt !important; }
      .meta-row { padding-left: 0 !important; font-size: 10pt !important; }
      .meta-table { font-size: 10pt !important; }
      .col-label { width: auto !important; padding-left: 0 !important; }
      .col-sub { padding-left: 14px !important; }
      .col-val { width: auto !important; }
      .dot-val { min-width: 48px !important; }
      .dot-val-wide { min-width: 140px !important; max-width: 100%; }
      .susunan-list { width: 100% !important; font-size: 9.5pt !important; }
    }

    /* Kop Surat */
    .kop-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    .kop-logo {
      width: 68px;
      height: 68px;
      object-fit: contain;
    }
    .kop-text {
      text-align: center;
      padding-right: 45px;
    }
    .kop-title {
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin: 0;
    }
    .kop-sub {
      font-size: 13pt;
      font-weight: 700;
      text-transform: uppercase;
      margin: 1px 0 2px;
    }
    .kop-addr {
      font-size: 9.5pt;
      margin: 0;
    }
    .kop-line-thick {
      border-top: 3px solid #000000;
      margin-top: 4px;
    }
    .kop-line-thin {
      border-top: 1px solid #000000;
      margin-top: 2px;
      margin-bottom: 14px;
    }

    /* Tabel Isian Atas */
    .meta-row {
      margin-bottom: 12px;
      text-align: left;
      padding-left: 55px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11.5pt;
    }
    .meta-table td {
      padding: 2.5px 4px;
      vertical-align: bottom;
    }
    .col-label {
      width: 240px;
      padding-left: 20px !important;
    }
    .col-sub {
      padding-left: 42px !important;
    }
    .col-colon {
      width: 14px;
      text-align: center;
    }
    .col-val {
      width: 155px;
    }
    .dot-val {
      display: inline-block;
      min-width: 105px;
      border-bottom: 1px dotted #000000;
      text-align: center;
      font-weight: 700;
      padding: 0 6px;
    }
    .dot-val-wide {
      display: inline-block;
      min-width: 240px;
      border-bottom: 1px dotted #000000;
      font-weight: 700;
      padding: 0 6px;
    }

    /* Blok Teks Panjang */
    .section-label {
      font-size: 11.5pt;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    .dotted-line {
      border-bottom: 1px dotted #000000;
      height: 24px;
      margin-bottom: 2px;
    }
    .text-content-box {
      border: 1px solid #cbd5e1;
      border-left: 3px solid #000000;
      padding: 8px 10px;
      min-height: 76px;
      font-size: 11pt;
      line-height: 1.45;
      white-space: normal;
      word-wrap: break-word;
      margin-bottom: 8px;
    }

    /* Susunan Acara */
    .susunan-wrap {
      margin-top: 22px;
      margin-bottom: 18px;
    }
    .susunan-title {
      text-align: center;
      font-weight: 700;
      font-size: 11pt;
      line-height: 1.35;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .susunan-list {
      width: 78%;
      margin: 0 auto;
      padding-left: 18px;
      font-size: 10.5pt;
      line-height: 1.42;
    }
    .susunan-list li {
      margin-bottom: 2px;
    }

    /* Catatan */
    .catatan-wrap {
      margin-top: 18px;
      font-size: 10pt;
      line-height: 1.4;
    }
    .catatan-title {
      margin-bottom: 3px;
    }
    .catatan-list {
      margin: 0;
      padding-left: 22px;
    }
  </style>
</head>
<body>
  <div class="toolbar-no-print">
    <span>Pratinjau Cetak / Simpan PDF — Laporan Musyawaroh 5 Unsur</span>
    <button type="button" class="btn-print-now" onclick="window.print()">Cetak / Simpan PDF</button>
  </div>

  <div class="page-sheet">
    <!-- KOP SURAT -->
    <table class="kop-table">
      <tr>
        <td style="width:76px;vertical-align:middle;">
          <img src="${logoUrl}" alt="Logo PPG" class="kop-logo" onerror="this.style.display='none'" />
        </td>
        <td class="kop-text">
          <div class="kop-title">FORMAT LAPORAN MUSYAWAROH 5 UNSUR</div>
          <div class="kop-sub">PPG DAERAH SOLO SELATAN</div>
          <div class="kop-addr">Sekretariat : Jl. Porong, Pucang Sawit, Rt 03/III, Jebres, Telp. (0271)669269</div>
        </td>
      </tr>
    </table>
    <div class="kop-line-thick"></div>
    <div class="kop-line-thin"></div>

    <!-- HARI TANGGAL -->
    <div class="meta-row">
      Hari tanggal : <span class="dot-val-wide">${hariTanggal}</span>
    </div>

    <!-- IDENTITAS & KEHADIRAN -->
    <table class="meta-table">
      <tr>
        <td class="col-label">Kelompok</td>
        <td class="col-colon">:</td>
        <td colspan="4"><span class="dot-val-wide" style="min-width:210px;">${kelompokNama}</span></td>
      </tr>
      <tr>
        <td class="col-label">Jumlah Peserta yang wajib hadir</td>
        <td class="col-colon">:</td>
        <td class="col-val"><span class="dot-val">${Number(doc.wajibHadir) || 0}</span> orang</td>
        <td colspan="3"></td>
      </tr>
      <tr>
        <td class="col-label col-sub">Laki – laki</td>
        <td class="col-colon">:</td>
        <td class="col-val"><span class="dot-val">${Number(doc.hadirLaki) || 0}</span> orang</td>
        <td style="width:55px;padding-left:18px;">Total</td>
        <td class="col-colon">:</td>
        <td><span class="dot-val" style="min-width:85px;">${Number(doc.totalHadir) || 0}</span> orang</td>
      </tr>
      <tr>
        <td class="col-label col-sub">Perempuan</td>
        <td class="col-colon">:</td>
        <td class="col-val"><span class="dot-val">${Number(doc.hadirPerempuan) || 0}</span> orang</td>
        <td colspan="3"></td>
      </tr>
      <tr>
        <td class="col-label col-sub">Ijin</td>
        <td class="col-colon">:</td>
        <td class="col-val"><span class="dot-val">${Number(doc.ijin) || 0}</span> orang</td>
        <td colspan="3"></td>
      </tr>
      <tr>
        <td class="col-label col-sub">Tanpa keterangan</td>
        <td class="col-colon">:</td>
        <td class="col-val"><span class="dot-val">${Number(doc.tanpaKeterangan) || 0}</span> orang</td>
        <td colspan="3"></td>
      </tr>
    </table>

    <!-- AGENDA PPG -->
    <div class="section-label">Agenda dari PPG Daerah / Pokja :</div>
    ${formatParagraphLines(doc.agendaPpg, 5)}

    <!-- RANGKUMAN HASIL -->
    <div class="section-label" style="margin-top:16px;">Rangkuman Hasil Musyawaroh :</div>
    ${formatParagraphLines(doc.rangkumanHasil, 7)}

    <!-- SUSUNAN ACARA LUPG -->
    <div class="susunan-wrap">
      <div class="susunan-title">
        SUSUNAN MUSYAWAROH LUPG ( LIMA UNSUR PEMBINA GENERUS)<br/>
        DAERAH SOLO SELATAN
      </div>
      <ol class="susunan-list">
        <li>Pembukaan dari keimaman kelompok.</li>
        <li>Evaluasi hasil musyawaroh 5 unsur bulan lalu.</li>
        <li>Pembahasan agenda dari PPG Daerah/Pokja.</li>
        <li>Monitoring &amp; Evaluasi Dana dan Koin PPG</li>
        <li>Monitoring &amp; Evaluasi KBM Caberawit ( Pembiasaan karakter, materi tambahan kelas 5 dan 6 SD )</li>
        <li>Monitoring &amp; Evaluasi KBM Tahfidz</li>
        <li>Monitoring &amp; Evaluasi KBM GP &amp; kegiatan remaja.</li>
        <li>Usulan Spontanitas.</li>
        <li>Penutup &amp; Doa dari keimaman.</li>
      </ol>
    </div>

    <!-- CATATAN -->
    <div class="catatan-wrap">
      <div class="catatan-title">Catatan:</div>
      <ul class="catatan-list">
        <li>Agenda dari PPG/Pokja akan disampaikan melalui Whatsapp atau hasil musyawarah.</li>
        <li>Form ini amal soleh dilaporkan melalui Whatsapp PJ kelompok.</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
