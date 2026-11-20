/* ═══════════════════════════════════════════════════════════════════════════
   dashboard-absensi-bulanan.js — Rekap Absensi Bulanan Per Jenjang
   Fokus: Caberawit (Sen-Jum, 5 hari) & GP / Pra-Remaja (Sen, Kam, Jum, 3 hari)
   Fitur:
   1. Checklist Tanggal Pertemuan Bulanan (Default H, toggle S/I/A)
   2. Cetak Lembar Presensi Kosong & Cetak Hasil Rekap (Format PDF Resmi A4 Landscape)
   3. Ekspor Excel (.xlsx) Lengkap dengan Persentase
   4. Grafik & Analisis Tren Kehadiran Tahunan Multi-Level
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getAllKelompok,
  getSiswaList,
  getDefaultMeetingDates,
  getAbsensiBulananList,
  getAbsensiBulananById,
  saveAbsensiBulanan,
  deleteAbsensiBulanan,
  syncAbsensiBulananFromSupabase,
  isSupabaseConfigured
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  closeModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js';

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Mendapatkan daftar siswa yang relevan dengan jenjang tertentu
 */
function getSiswaByJenjangAndKelompok(jenjang, kelId) {
  const allSiswa = getSiswaList();
  return allSiswa.filter(s => {
    // Saring kelompok jika ditentukan
    if (kelId && kelId !== 'all') {
      if (s.kelompok_id !== kelId && s.kelompok !== kelId) return false;
    }

    const jenjangStr = (s.jenjang_kelas || s.jenjang || '').toLowerCase();

    if (jenjang === 'caberawit') {
      // PAUD, TK, SD, Caberawit
      return jenjangStr.includes('caberawit') ||
             jenjangStr.includes('paud') ||
             jenjangStr.includes('tk') ||
             jenjangStr.includes('sd') ||
             ['1', '2', '3', '4', '5', '6'].some(k => jenjangStr === k || jenjangStr === `kelas ${k}`);
    } else {
      // GP (SMP - SMA / Pra-Remaja)
      return jenjangStr.includes('gp') ||
             jenjangStr.includes('pra-remaja') ||
             jenjangStr.includes('pra remaja') ||
             jenjangStr.includes('smp') ||
             jenjangStr.includes('sma') ||
             ['7', '8', '9', '10', '11', '12'].some(k => jenjangStr === k || jenjangStr === `kelas ${k}`);
    }
  });
}

/**
 * Modal Terpadu Laporan & Rekap Absensi Bulanan Per Jenjang
 */
export function openRekapAbsensiBulananModal(options = {}) {
  const jenjang = options.jenjang || 'caberawit';
  const jenjangLabel = jenjang === 'caberawit' ? 'Caberawit' : (jenjang === 'gp_reguler' ? 'GP (SMP - SMA)' : jenjang);

  const modalHtml = `
    <div id="absensiBulananModalContainer" class="p-0.5 space-y-3"></div>
  `;

  openModal(
    `Laporan & Rekap Absensi Bulanan (${jenjangLabel})`,
    'fact_check',
    modalHtml,
    'wide'
  );

  const container = document.getElementById('absensiBulananModalContainer');
  if (container) {
    renderAbsensiBulananTab(container, options);
  }
}

/**
 * Render Tampilan Utama Tab Rekap Absensi Bulanan di Jurnal KBM Hub
 */
export function renderAbsensiBulananTab(container, options = {}) {
  if (!container) return;

  const isDaerah = currentUser.tingkatan === 'daerah' || currentUser.isSuperadmin === true;
  const isDesa = currentUser.tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;

  const currentDesaId = currentUser.desaId || 'desa-timur-1';
  const currentKelId = currentUser.kelompokId || 'kel-gunung-wijil-1';

  // Default state filter
  const today = new Date();
  const currentYear = options.tahun || today.getFullYear();
  const currentMonthIdx = options.bulanIndex || (today.getMonth() + 1); // 1-12
  const selectedJenjang = options.jenjang || 'caberawit';
  const selectedDesa = options.desaId || (isDaerah ? 'all' : currentDesaId);
  const selectedKel = options.kelompokId || (isKelompok ? currentKelId : 'all');

  // Sinkronisasi otomatis data terbaru dari Supabase Cloud saat pertama kali tab dibuka
  if (isSupabaseConfigured() && !container._hasAutoSynced) {
    container._hasAutoSynced = true;
    syncAbsensiBulananFromSupabase().then(res => {
      if (res && res.success && res.count > 0) {
        renderAbsensiBulananTab(container, options);
      }
    });
  }

  const allKels = getAllKelompok();
  const desaList = MASTER_WILAYAH.desa;

  // Filter rekap yang tersimpan
  const savedRekapList = getAbsensiBulananList({
    tahun: currentYear,
    bulanIndex: currentMonthIdx,
    jenjang: selectedJenjang,
    desaId: selectedDesa,
    kelompokId: selectedKel
  });

  // ── Multi-level Dropdown Wilayah (Desa & Kelompok) ──
  let wilayahFilterHtml = '';
  if (isDaerah) {
    // Admin / Superadmin: Dropdown Desa + Dropdown Kelompok (otomatis disaring sesuai desa)
    let filteredKels = allKels;
    if (selectedDesa !== 'all') {
      filteredKels = allKels.filter(k => k.desaId === selectedDesa);
    }
    wilayahFilterHtml = `
      <select id="selDesaAbsensi" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer max-w-[165px]" title="Pilih Desa">
        <option value="all" ${selectedDesa === 'all' ? 'selected' : ''}>Semua Desa</option>
        ${desaList.map(d => `<option value="${d.id}" ${selectedDesa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`).join('')}
      </select>

      <select id="selKelompokAbsensi" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none cursor-pointer max-w-[165px]" title="Pilih Kelompok">
        <option value="all" ${selectedKel === 'all' ? 'selected' : ''}>${selectedDesa === 'all' ? 'Semua Kelompok' : 'Semua Kelompok di Desa Ini'}</option>
        ${filteredKels.map(k => `<option value="${k.id}" ${selectedKel === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('')}
      </select>
    `;
  } else if (isDesa) {
    // Pengurus Desa: Desa terkunci, Kelompok bisa dipilih
    const desaObj = desaList.find(d => d.id === currentDesaId) || desaList[0];
    const filteredKels = allKels.filter(k => k.desaId === currentDesaId);
    wilayahFilterHtml = `
      <span class="px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1 shrink-0">
        <span class="material-symbols-outlined text-[15px]">domain</span>
        <span>Desa ${desaObj ? desaObj.nama : 'Desa'}</span>
      </span>

      <select id="selKelompokAbsensi" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium outline-none cursor-pointer max-w-[165px]" title="Pilih Kelompok">
        <option value="all" ${selectedKel === 'all' ? 'selected' : ''}>Semua Kelompok</option>
        ${filteredKels.map(k => `<option value="${k.id}" ${selectedKel === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('')}
      </select>
    `;
  } else {
    // Pengurus Kelompok: Terkunci pada kelompoknya
    const currentKelObj = allKels.find(k => k.id === currentKelId);
    wilayahFilterHtml = `
      <span class="px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 shrink-0">
        <span class="material-symbols-outlined text-[15px]">location_on</span>
        <span>Kel. ${currentKelObj ? currentKelObj.nama : 'Kelompok'}</span>
      </span>
    `;
  }

  // ── Susun Filter Bar HTML yang Kompak & Luas ──
  const filterBarHtml = `
    <div class="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
      <!-- Sisi Kiri: Filter Terpadu (Jenjang Otomatis, Multi-level Wilayah, Periode) -->
      <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        <!-- Pilihan Jenjang Kompak (Otomatis Sesuai Checkbox KBM) -->
        <select id="selJenjangAbsensi" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer text-xs" title="Filter Jenjang">
          <option value="caberawit" ${selectedJenjang === 'caberawit' ? 'selected' : ''}>👶 Caberawit (Sen-Jum)</option>
          <option value="gp_reguler" ${selectedJenjang === 'gp_reguler' ? 'selected' : ''}>🎓 GP / SMP-SMA (Sen, Kam, Jum)</option>
        </select>

        ${wilayahFilterHtml}

        <!-- Pilihan Bulan & Tahun -->
        <select id="selBulanAbsensi" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer text-xs" title="Pilih Bulan">
          ${BULAN_NAMES.map((bName, i) => `<option value="${i + 1}" ${currentMonthIdx === (i + 1) ? 'selected' : ''}>${bName}</option>`).join('')}
        </select>

        <select id="selTahunAbsensi" class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer text-xs" title="Pilih Tahun">
          <option value="${currentYear - 1}">${currentYear - 1}</option>
          <option value="${currentYear}" selected>${currentYear}</option>
          <option value="${currentYear + 1}">${currentYear + 1}</option>
        </select>
      </div>

      <!-- Sisi Kanan: Aksi (Grafik Tahunan & Input Absensi Baru) -->
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" id="btnBukaGrafikTahunan" class="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1.5 transition-all hover:bg-blue-100 cursor-pointer text-xs" title="Lihat Grafik Kehadiran Tahunan">
          <span class="material-symbols-outlined text-[17px]">analytics</span>
          <span>Grafik Tahunan</span>
        </button>
        <button type="button" id="btnInputAbsensiBaru" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer text-xs">
          <span class="material-symbols-outlined text-[17px]">add_task</span>
          <span>Input Absensi Bulanan</span>
        </button>
      </div>
    </div>
  `;

  // Daftar Rekap Tersimpan
  let cardsHtml = '';
  if (savedRekapList.length === 0) {
    cardsHtml = `
      <div class="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <span class="material-symbols-outlined text-[48px] text-slate-400 mb-2 block">assignment_late</span>
        <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200">Belum Ada Rekap Absensi Terdaftar</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          Pamong belum mengisi checklist presensi untuk jenjang <strong>${selectedJenjang === 'caberawit' ? 'Caberawit' : 'GP Reguler'}</strong> pada bulan <strong>${BULAN_NAMES[currentMonthIdx - 1]} ${currentYear}</strong>.
        </p>
        <div class="mt-4 flex items-center justify-center gap-2.5">
          <button type="button" class="btn-quick-create-rekap px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Mulai Isi Absensi Bulan Ini</span>
          </button>
          <button type="button" class="btn-quick-print-empty px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-50">
            <span class="material-symbols-outlined text-[16px]">print</span>
            <span>Cetak Lembar Presensi Kosong (Fisik)</span>
          </button>
        </div>
      </div>
    `;
  } else {
    cardsHtml = `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        ${savedRekapList.map(rekap => {
          const totalSiswa = rekap.records ? rekap.records.length : 0;
          const totalPertemuan = rekap.totalPertemuan || (rekap.tanggalPertemuan ? rekap.tanggalPertemuan.length : 0);
          const avgPercent = rekap.summary ? rekap.summary.rataRataKehadiran : 0;
          const jenjangLabel = rekap.jenjang === 'caberawit' ? 'Caberawit (SD)' : 'GP (SMP - SMA)';
          const badgeBg = rekap.jenjang === 'caberawit' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200';

          return `
            <div class="rounded-2xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badgeBg}">
                      ${jenjangLabel}
                    </span>
                    <h4 class="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-1.5">
                      Kelompok ${rekap.kelompokNama || '-'}
                    </h4>
                    <p class="text-[11.5px] text-slate-500 dark:text-slate-400">
                      Periode: <strong>${rekap.bulan} ${rekap.tahun}</strong> &bull; ${rekap.desaNama ? `Desa ${rekap.desaNama}` : ''}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="text-xl font-black ${avgPercent >= 85 ? 'text-emerald-600 dark:text-emerald-400' : (avgPercent >= 70 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400')}">
                      ${avgPercent}%
                    </span>
                    <span class="block text-[10px] text-slate-400 font-bold uppercase">Rerata Hadir</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span class="text-[10.5px] text-slate-400 block">Total Santri</span>
                    <strong class="text-sm font-bold text-slate-800 dark:text-slate-100">${totalSiswa} Siswa</strong>
                  </div>
                  <div>
                    <span class="text-[10.5px] text-slate-400 block">Pertemuan</span>
                    <strong class="text-sm font-bold text-slate-800 dark:text-slate-100">${totalPertemuan} Sesi</strong>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" class="btn-edit-rekap px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 flex items-center gap-1 cursor-pointer" data-id="${rekap.id}">
                  <span class="material-symbols-outlined text-[15px] text-blue-600">edit_note</span>
                  <span>Isi / Edit</span>
                </button>
                <div class="flex items-center gap-1">
                  <button type="button" class="btn-print-rekap px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer" data-id="${rekap.id}" title="Cetak Lembar Presensi Lengkap (PDF A4 Landscape)">
                    <span class="material-symbols-outlined text-[15px]">print</span>
                    <span>Cetak</span>
                  </button>
                  <button type="button" class="btn-excel-rekap px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer" data-id="${rekap.id}" title="Ekspor Lembar Excel">
                    <span class="material-symbols-outlined text-[15px]">table_view</span>
                  </button>
                  <button type="button" class="btn-delete-rekap p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer" data-id="${rekap.id}" title="Hapus Dokumen Rekap">
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Render ke container
  container.innerHTML = `
    <div class="space-y-3.5">
      ${filterBarHtml}
      ${cardsHtml}
    </div>
  `;

  // ── Bind Listeners ──
  container.querySelector('#selJenjangAbsensi')?.addEventListener('change', (e) => {
    renderAbsensiBulananTab(container, {
      tahun: currentYear,
      bulanIndex: currentMonthIdx,
      jenjang: e.target.value,
      desaId: selectedDesa,
      kelompokId: selectedKel
    });
  });

  container.querySelector('#selDesaAbsensi')?.addEventListener('change', (e) => {
    renderAbsensiBulananTab(container, {
      tahun: currentYear,
      bulanIndex: currentMonthIdx,
      jenjang: selectedJenjang,
      desaId: e.target.value,
      kelompokId: 'all'
    });
  });

  container.querySelector('#selKelompokAbsensi')?.addEventListener('change', (e) => {
    renderAbsensiBulananTab(container, {
      tahun: currentYear,
      bulanIndex: currentMonthIdx,
      jenjang: selectedJenjang,
      desaId: selectedDesa,
      kelompokId: e.target.value
    });
  });

  container.querySelector('#selBulanAbsensi')?.addEventListener('change', (e) => {
    renderAbsensiBulananTab(container, {
      tahun: currentYear,
      bulanIndex: Number(e.target.value),
      jenjang: selectedJenjang,
      desaId: selectedDesa,
      kelompokId: selectedKel
    });
  });

  container.querySelector('#selTahunAbsensi')?.addEventListener('change', (e) => {
    renderAbsensiBulananTab(container, {
      tahun: Number(e.target.value),
      bulanIndex: currentMonthIdx,
      jenjang: selectedJenjang,
      desaId: selectedDesa,
      kelompokId: selectedKel
    });
  });

  // Action Buka Form Input
  const triggerInput = (rekapItem = null) => {
    let inputPayload;
    if (rekapItem) {
      inputPayload = rekapItem;
    } else {
      let defaultKel = (selectedKel !== 'all' ? selectedKel : (isKelompok ? currentKelId : allKels[0]?.id));
      if (selectedDesa !== 'all' && selectedKel === 'all') {
        const kelInDesa = allKels.find(k => k.desaId === selectedDesa);
        if (kelInDesa) defaultKel = kelInDesa.id;
      }
      inputPayload = {
        tahun: currentYear,
        bulanIndex: currentMonthIdx,
        jenjang: selectedJenjang,
        kelompokId: defaultKel
      };
    }

    openFormAbsensiBulananModal(
      inputPayload,
      () => {
        // Callback onSaved: Kembali ke tab rekap absensi bulanan
        openRekapAbsensiBulananModal({
          tahun: currentYear,
          bulanIndex: currentMonthIdx,
          jenjang: selectedJenjang,
          desaId: selectedDesa,
          kelompokId: selectedKel
        });
      },
      () => {
        // Callback onCancel: Kembali ke tab rekap absensi bulanan
        openRekapAbsensiBulananModal({
          tahun: currentYear,
          bulanIndex: currentMonthIdx,
          jenjang: selectedJenjang,
          desaId: selectedDesa,
          kelompokId: selectedKel
        });
      }
    );
  };

  container.querySelector('#btnInputAbsensiBaru')?.addEventListener('click', () => triggerInput(null));
  container.querySelector('.btn-quick-create-rekap')?.addEventListener('click', () => triggerInput(null));

  // Quick Print Kosong
  container.querySelector('.btn-quick-print-empty')?.addEventListener('click', () => {
    let defaultKel = (selectedKel !== 'all' ? selectedKel : (isKelompok ? currentKelId : allKels[0]?.id));
    if (selectedDesa !== 'all' && selectedKel === 'all') {
      const kelInDesa = allKels.find(k => k.desaId === selectedDesa);
      if (kelInDesa) defaultKel = kelInDesa.id;
    }
    printLembarPresensiDoc(null, {
      tahun: currentYear,
      bulanIndex: currentMonthIdx,
      jenjang: selectedJenjang,
      kelompokId: defaultKel,
      mode: 'empty'
    });
  });

  // Action Edit Rekap
  container.querySelectorAll('.btn-edit-rekap').forEach(btn => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-id');
      const rekap = getAbsensiBulananById(rId);
      if (rekap) {
        triggerInput(rekap);
      }
    });
  });

  // Action Cetak Rekap Lengkap
  container.querySelectorAll('.btn-print-rekap').forEach(btn => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-id');
      const rekap = getAbsensiBulananById(rId);
      if (rekap) {
        printLembarPresensiDoc(rekap, { mode: 'filled' });
      }
    });
  });

  // Action Export Excel
  container.querySelectorAll('.btn-excel-rekap').forEach(btn => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-id');
      const rekap = getAbsensiBulananById(rId);
      if (rekap) {
        exportAbsensiToExcel(rekap);
      }
    });
  });

  // Action Delete Rekap
  container.querySelectorAll('.btn-delete-rekap').forEach(btn => {
    btn.addEventListener('click', () => {
      const rId = btn.getAttribute('data-id');
      showConfirmModal({
        title: 'Hapus Rekap Absensi',
        message: 'Apakah Anda yakin ingin menghapus lembar rekap absensi bulanan ini?',
        icon: 'delete',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        confirmText: 'Ya, Hapus',
        confirmBtnColor: 'var(--red)',
        onConfirm: async () => {
          await deleteAbsensiBulanan(rId);
          showToast('Rekap absensi berhasil dihapus', 'success');
          renderAbsensiBulananTab(container, { tahun: currentYear, bulanIndex: currentMonthIdx, jenjang: selectedJenjang, desaId: selectedDesa, kelompokId: selectedKel });
        }
      });
    });
  });

  // Action Buka Grafik Tahunan
  container.querySelector('#btnBukaGrafikTahunan')?.addEventListener('click', () => {
    openGrafikKehadiranTahunanModal({
      tahun: currentYear,
      jenjang: selectedJenjang,
      desaId: selectedDesa,
      kelompokId: selectedKel
    });
  });
}

/**
 * Modal Interaktif untuk Pengisian / Input Checklist Presensi Bulanan
 */
export function openFormAbsensiBulananModal(initialData = {}, onSavedCallback = null, onCancelCallback = null) {
  const isDaerah = currentUser.tingkatan === 'daerah' || currentUser.isSuperadmin === true;
  const isDesa = currentUser.tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;

  const currentKelId = currentUser.kelompokId || 'kel-gunung-wijil-1';
  const allKels = getAllKelompok();
  const desaList = MASTER_WILAYAH.desa;

  const tahun = initialData.tahun || new Date().getFullYear();
  const bulanIndex = initialData.bulanIndex || (new Date().getMonth() + 1);
  const bulanName = BULAN_NAMES[bulanIndex - 1].toUpperCase();
  const jenjang = initialData.jenjang || 'caberawit';
  let kelompokId = initialData.kelompokId || (isKelompok ? currentKelId : allKels[0].id);

  let kelObj = allKels.find(k => k.id === kelompokId) || allKels[0];
  let desaObj = desaList.find(d => d.id === kelObj.desaId) || desaList[0];

  // Ambil daftar tanggal pertemuan
  let meetingDates = initialData.tanggalPertemuan;
  if (!meetingDates || !Array.isArray(meetingDates) || meetingDates.length === 0) {
    meetingDates = getDefaultMeetingDates(tahun, bulanIndex, jenjang);
  }

  // Ambil santri di kelompok dan jenjang ini
  const siswaList = getSiswaByJenjangAndKelompok(jenjang, kelompokId);

  // Siapkan data records presensi per siswa
  let records = initialData.records ? [...initialData.records] : [];

  // Sinkronkan siswa database ke records
  siswaList.forEach(s => {
    const existing = records.find(r => r.siswaId === s.id);
    if (!existing) {
      // Default: semua pertemuan H (Hadir) sesuai kesepakatan
      const kehadiranMap = {};
      meetingDates.forEach(d => {
        kehadiranMap[String(d)] = 'H';
      });
      records.push({
        siswaId: s.id,
        nama: s.nama_lengkap || s.nama,
        kelompok: kelObj.nama,
        kelas: s.jenjang_kelas || s.jenjang || '-',
        kehadiran: kehadiranMap,
        totalH: meetingDates.length,
        totalS: 0,
        totalI: 0,
        totalA: 0,
        persenHadir: 100
      });
    }
  });

  // Hitung ulang kalkulasi santri
  function recalculateRecord(rec, activeDates) {
    let h = 0, s = 0, i = 0, a = 0;
    activeDates.forEach(d => {
      const st = rec.kehadiran[String(d)] || 'H';
      if (st === 'H') h++;
      else if (st === 'S') s++;
      else if (st === 'I') i++;
      else if (st === 'A') a++;
    });
    rec.totalH = h;
    rec.totalS = s;
    rec.totalI = i;
    rec.totalA = a;
    rec.persenHadir = activeDates.length > 0 ? Number(((h / activeDates.length) * 100).toFixed(1)) : 0;
  }

  // Render modal isi absensi
  function renderInnerContent() {
    // Bangun header tanggal
    const datesHeaderHtml = meetingDates.map(d => `
      <th style="padding:6px 4px;text-align:center;width:28px;min-width:28px;border:1px solid var(--border);font-size:11px;background:var(--surface-2);color:var(--text);">${d}</th>
    `).join('');

    // Bangun baris santri
    const rowsHtml = records.map((rec, rIdx) => {
      recalculateRecord(rec, meetingDates);

      const cellsHtml = meetingDates.map(d => {
        const val = rec.kehadiran[String(d)] || 'H';
        let colorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
        if (val === 'S') colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
        else if (val === 'I') colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
        else if (val === 'A') colorClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';

        return `
          <td style="padding:4px 2px;text-align:center;border:1px solid var(--border);">
            <button type="button" class="btn-toggle-absen cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded font-black text-[10.5px] border ${colorClass} transition-all active:scale-90" data-row="${rIdx}" data-date="${d}" title="Klik untuk mengubah (H -> S -> I -> A)">
              ${val}
            </button>
          </td>
        `;
      }).join('');

      return `
        <tr style="border-bottom:1px solid var(--border);" class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
          <td style="padding:6px;text-align:center;border:1px solid var(--border);color:var(--text-muted);font-size:11.5px;">${rIdx + 1}</td>
          <td style="padding:6px 10px;border:1px solid var(--border);font-weight:700;color:var(--text);font-size:12px;white-space:nowrap;">${rec.nama}</td>
          <td style="padding:6px 8px;border:1px solid var(--border);color:var(--text-muted);font-size:11px;text-align:center;">${rec.kelompok}</td>
          <td style="padding:6px 8px;border:1px solid var(--border);color:var(--blue);font-weight:700;font-size:11px;text-align:center;">${rec.kelas}</td>
          ${cellsHtml}
          <td style="padding:6px 4px;text-align:center;border:1px solid var(--border);font-weight:800;color:#16a34a;font-size:11px;" id="valH_${rIdx}">${rec.totalH}</td>
          <td style="padding:6px 4px;text-align:center;border:1px solid var(--border);font-weight:700;color:#d97706;font-size:11px;" id="valS_${rIdx}">${rec.totalS}</td>
          <td style="padding:6px 4px;text-align:center;border:1px solid var(--border);font-weight:700;color:#2563eb;font-size:11px;" id="valI_${rIdx}">${rec.totalI}</td>
          <td style="padding:6px 4px;text-align:center;border:1px solid var(--border);font-weight:700;color:#dc2626;font-size:11px;" id="valA_${rIdx}">${rec.totalA}</td>
          <td style="padding:6px 8px;text-align:center;border:1px solid var(--border);font-weight:900;font-size:12px;color:${rec.persenHadir >= 80 ? '#16a34a' : '#d97706'};" id="valPct_${rIdx}">
            ${rec.persenHadir}%
          </td>
        </tr>
      `;
    }).join('');

    // Modal Content
    const contentHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:12px;">
        
        <!-- Header Info Bar -->
        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                ${jenjang === 'caberawit' ? 'Caberawit' : 'GP Reguler'}
              </span>
              <h3 class="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Absensi Bulan ${bulanName} ${tahun}
              </h3>
            </div>
            ${!initialData.id && (isDaerah || isDesa) ? `
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <span class="text-xs text-slate-600 dark:text-slate-300 font-bold">Pilih Kelompok:</span>
                <select id="selFormKelompok" class="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer">
                  ${(isDaerah ? allKels : allKels.filter(k => k.desaId === currentUser.desaId)).map(k => `
                    <option value="${k.id}" ${k.id === kelompokId ? 'selected' : ''}>Kel. ${k.nama} (Desa ${(desaList.find(d => d.id === k.desaId) || {}).nama || '-'})</option>
                  `).join('')}
                </select>
                <span class="text-xs text-slate-500">&bull; Total <strong>${records.length} Santri</strong></span>
              </div>
            ` : `
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kelompok <strong>${kelObj.nama}</strong> &bull; Desa ${desaObj.nama} &bull; Total <strong>${records.length} Santri</strong>
              </p>
            `}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" id="btnAturTanggalPertemuan" class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-slate-50">
              <span class="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
              <span>Atur Tanggal (${meetingDates.length} Sesi)</span>
            </button>
            <button type="button" id="btnSetSemuaHadir" class="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-emerald-100">
              <span class="material-symbols-outlined text-[16px]">done_all</span>
              <span>Set Semua Hadir (H)</span>
            </button>
          </div>
        </div>

        <!-- PETUNJUK CEPAT STATUS -->
        <div class="flex items-center gap-4 px-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span class="font-bold text-slate-700 dark:text-slate-300">Keterangan:</span>
          <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center justify-center font-bold text-[10px]">H</span> Hadir</span>
          <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center justify-center font-bold text-[10px]">S</span> Sakit</span>
          <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 inline-flex items-center justify-center font-bold text-[10px]">I</span> Izin</span>
          <span class="flex items-center gap-1"><span class="w-4 h-4 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 inline-flex items-center justify-center font-bold text-[10px]">A</span> Alpa</span>
          <span class="italic text-[10.5px] ml-auto">*Klik pada kotak huruf tanggal untuk mengganti status santri secara langsung.</span>
        </div>

        <!-- TABEL MATRIX SESUAI PDF RESMI -->
        <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs bg-white dark:bg-slate-900 max-h-[55vh]">
          <table style="width:100%;border-collapse:collapse;min-width:760px;font-size:12px;">
            <thead>
              <tr style="background:#0b386b;color:#ffffff;font-size:11px;font-weight:800;text-transform:uppercase;">
                <th style="padding:8px 6px;text-align:center;width:34px;border:1px solid #1e4b85;" rowspan="2">No</th>
                <th style="padding:8px 10px;text-align:left;min-width:140px;border:1px solid #1e4b85;" rowspan="2">Nama Santri</th>
                <th style="padding:8px 6px;text-align:center;width:80px;border:1px solid #1e4b85;" rowspan="2">Kelompok</th>
                <th style="padding:8px 6px;text-align:center;width:55px;border:1px solid #1e4b85;" rowspan="2">Kelas</th>
                <th style="padding:6px;text-align:center;background:#082a52;border:1px solid #1e4b85;" colspan="${meetingDates.length}">
                  BULAN: ${bulanName}
                </th>
                <th style="padding:6px;text-align:center;background:#062344;border:1px solid #1e4b85;" colspan="4">REKAP</th>
                <th style="padding:8px 8px;text-align:center;width:65px;background:#051d38;border:1px solid #1e4b85;" rowspan="2">% HADIR</th>
              </tr>
              <tr style="background:var(--surface-2);color:var(--text);font-size:11px;font-weight:800;">
                ${datesHeaderHtml}
                <th style="padding:4px;text-align:center;width:24px;border:1px solid var(--border);color:#16a34a;">H</th>
                <th style="padding:4px;text-align:center;width:24px;border:1px solid var(--border);color:#d97706;">S</th>
                <th style="padding:4px;text-align:center;width:24px;border:1px solid var(--border);color:#2563eb;">I</th>
                <th style="padding:4px;text-align:center;width:24px;border:1px solid var(--border);color:#dc2626;">A</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Sticky Footer Modal -->
        <div class="modal-sticky-footer">
          <button type="button" id="btnCancelFormAbsensi" class="btn-sticky-back" title="Kembali">
            <span class="material-symbols-outlined">arrow_back</span>
            <span class="btn-text">Batal</span>
          </button>
          <div class="flex items-center gap-2">
            <button type="button" id="btnCetakLangsungForm" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-[17px]">print</span>
              <span>Cetak Hasil</span>
            </button>
            <button type="button" id="btnSimpanRekapAbsensi" class="btn-sticky-save" title="Simpan Rekapitulasi Absensi">
              <span class="material-symbols-outlined">save</span>
              <span class="btn-text">Simpan Rekapitulasi</span>
            </button>
          </div>
        </div>

      </div>
    `;

    openModal(`Input Rekap Absensi Bulanan (${jenjang === 'caberawit' ? 'Caberawit' : 'GP'})`, 'fact_check', contentHtml, 'wide');

    // ── Attach Listeners ──
    // Tombol Batal: Kembali ke tab rekap absensi bulanan (bukan menutup modal)
    document.getElementById('btnCancelFormAbsensi')?.addEventListener('click', () => {
      if (typeof onCancelCallback === 'function') {
        onCancelCallback();
      } else {
        openRekapAbsensiBulananModal({
          tahun,
          bulanIndex,
          jenjang,
          desaId: desaObj.id,
          kelompokId
        });
      }
    });

    // Listener ganti kelompok (jika admin input baru)
    document.getElementById('selFormKelompok')?.addEventListener('change', (e) => {
      kelompokId = e.target.value;
      kelObj = allKels.find(k => k.id === kelompokId) || allKels[0];
      desaObj = desaList.find(d => d.id === kelObj.desaId) || desaList[0];
      const newSiswaList = getSiswaByJenjangAndKelompok(jenjang, kelompokId);
      records = newSiswaList.map(s => {
        const kehadiranMap = {};
        meetingDates.forEach(d => {
          kehadiranMap[String(d)] = 'H';
        });
        return {
          siswaId: s.id,
          nama: s.nama_lengkap || s.nama,
          kelompok: kelObj.nama,
          kelas: s.jenjang_kelas || s.jenjang || '-',
          kehadiran: kehadiranMap,
          totalH: meetingDates.length,
          totalS: 0,
          totalI: 0,
          totalA: 0,
          persenHadir: 100
        };
      });
      renderInnerContent();
    });

    // Toggle status presensi saat tombol diklik
    document.querySelectorAll('.btn-toggle-absen').forEach(btn => {
      btn.addEventListener('click', () => {
        const rIdx = Number(btn.getAttribute('data-row'));
        const dateKey = btn.getAttribute('data-date');
        const currentVal = records[rIdx].kehadiran[dateKey] || 'H';

        // Siklus status: H -> S -> I -> A -> H
        let nextVal = 'H';
        if (currentVal === 'H') nextVal = 'S';
        else if (currentVal === 'S') nextVal = 'I';
        else if (currentVal === 'I') nextVal = 'A';
        else if (currentVal === 'A') nextVal = 'H';

        records[rIdx].kehadiran[dateKey] = nextVal;
        btn.textContent = nextVal;

        // Update styling
        btn.className = `btn-toggle-absen cursor-pointer inline-flex items-center justify-center w-6 h-6 rounded font-black text-[10.5px] border transition-all active:scale-90 ${
          nextVal === 'H' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' :
          nextVal === 'S' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' :
          nextVal === 'I' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' :
          'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300'
        }`;

        // Recalculate baris ini
        recalculateRecord(records[rIdx], meetingDates);
        document.getElementById(`valH_${rIdx}`).textContent = records[rIdx].totalH;
        document.getElementById(`valS_${rIdx}`).textContent = records[rIdx].totalS;
        document.getElementById(`valI_${rIdx}`).textContent = records[rIdx].totalI;
        document.getElementById(`valA_${rIdx}`).textContent = records[rIdx].totalA;
        document.getElementById(`valPct_${rIdx}`).textContent = `${records[rIdx].persenHadir}%`;
      });
    });

    // Set Semua Hadir
    document.getElementById('btnSetSemuaHadir')?.addEventListener('click', () => {
      records.forEach(rec => {
        meetingDates.forEach(d => {
          rec.kehadiran[String(d)] = 'H';
        });
      });
      renderInnerContent();
      showToast('Semua santri diatur Hadir (H)', 'info');
    });

    // Atur Tanggal Pertemuan
    document.getElementById('btnAturTanggalPertemuan')?.addEventListener('click', () => {
      openAturTanggalPertemuanModal(tahun, bulanIndex, jenjang, meetingDates, (newDates) => {
        meetingDates = newDates;
        // Hitung ulang semua santri
        records.forEach(rec => {
          recalculateRecord(rec, meetingDates);
        });
        renderInnerContent();
      });
    });

    // Simpan Rekap
    document.getElementById('btnSimpanRekapAbsensi')?.addEventListener('click', async () => {
      let totalHadirAll = 0;
      records.forEach(r => {
        recalculateRecord(r, meetingDates);
        totalHadirAll += r.persenHadir;
      });
      const avgKehadiran = records.length > 0 ? Number((totalHadirAll / records.length).toFixed(1)) : 0;

      const payload = {
        id: initialData.id || `abs-bln-${tahun}-${String(bulanIndex).padStart(2, '0')}-${kelompokId}-${jenjang}`,
        tahun,
        bulan: bulanName,
        bulanIndex,
        tahunAjaran: `${tahun}/${tahun + 1}`,
        jenjang,
        desaId: kelObj.desaId,
        desaNama: desaObj.nama,
        kelompokId,
        kelompokNama: kelObj.nama,
        tanggalPertemuan: meetingDates,
        totalPertemuan: meetingDates.length,
        records,
        summary: {
          totalSiswa: records.length,
          rataRataKehadiran: avgKehadiran,
          pamongNama: currentUser.nama || 'Pamong Kelompok'
        }
      };

      const btnSave = document.getElementById('btnSimpanRekapAbsensi');
      if (btnSave) {
        btnSave.disabled = true;
        btnSave.classList.add('opacity-70');
      }

      showToast('Menyimpan & menyinkronkan ke Supabase Cloud...', 'info');
      await saveAbsensiBulanan(payload);
      showToast('Rekap absensi bulanan berhasil disimpan dan disinkronkan!', 'success');

      if (typeof onSavedCallback === 'function') {
        onSavedCallback(payload);
      } else {
        openRekapAbsensiBulananModal({
          tahun,
          bulanIndex,
          jenjang,
          desaId: desaObj.id,
          kelompokId
        });
      }
    });

    // Cetak Langsung Form
    document.getElementById('btnCetakLangsungForm')?.addEventListener('click', () => {
      const tempDoc = {
        tahun,
        bulan: bulanName,
        bulanIndex,
        jenjang,
        desaNama: desaObj.nama,
        kelompokNama: kelObj.nama,
        tanggalPertemuan: meetingDates,
        records
      };
      printLembarPresensiDoc(tempDoc, { mode: 'filled' });
    });
  }

  renderInnerContent();
}

/**
 * Modal untuk Memilih / Menandai Tanggal Pertemuan Efektif dalam Sebulan
 */
function openAturTanggalPertemuanModal(year, monthIndex, jenjang, currentSelectedDates, onSaved) {
  const totalDays = new Date(year, monthIndex, 0).getDate();
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  let selectedSet = new Set(currentSelectedDates);

  let daysGridHtml = '';
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(year, monthIndex - 1, d);
    const dayOfWeek = dt.getDay();
    const isSelected = selectedSet.has(d);
    const isSunday = (dayOfWeek === 0);

    daysGridHtml += `
      <label class="flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}">
        <input type="checkbox" class="chk-date-item sr-only" value="${d}" ${isSelected ? 'checked' : ''} />
        <span class="text-[10px] font-bold ${isSelected ? 'text-blue-100' : (isSunday ? 'text-red-500' : 'text-slate-400')} uppercase">${dayNames[dayOfWeek]}</span>
        <span class="text-sm font-black mt-0.5">${d}</span>
      </label>
    `;
  }

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;font-size:12.5px;">
      <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
        <div class="font-extrabold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px]">info</span>
          <span>Atur Tanggal Pertemuan ${BULAN_NAMES[monthIndex - 1]} ${year}</span>
        </div>
        <p class="text-[11.5px] text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">
          Pilih tanggal pengajian aktif di kelompok Anda. Secara default, <strong>${jenjang === 'caberawit' ? 'Caberawit' : 'GP Reguler'}</strong> diadakan pada hari <strong>${jenjang === 'caberawit' ? 'Senin - Jumat' : 'Senin, Kamis, & Jum\'at'}</strong>. Anda dapat menghilangkan centang pada tanggal merah atau hari libur bersama.
        </p>
      </div>

      <div class="grid grid-cols-7 gap-1.5 max-h-[300px] overflow-y-auto p-1">
        ${daysGridHtml}
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
        <button type="button" id="btnResetDefaultDates" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
          Kembalikan ke Jadwal Default
        </button>
        <button type="button" id="btnSimpanTanggalPilihan" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer">
          Terapkan Tanggal
        </button>
      </div>
    </div>
  `;

  // Render modal kecil
  openModal('Tentukan Tanggal Pertemuan Pengajian', 'date_range', modalHtml, 'medium');

  document.querySelectorAll('.chk-date-item').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const val = Number(e.target.value);
      const parentLabel = e.target.closest('label');
      if (e.target.checked) {
        selectedSet.add(val);
        parentLabel.className = 'flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all bg-blue-600 text-white border-blue-600 shadow-xs';
      } else {
        selectedSet.delete(val);
        parentLabel.className = 'flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50';
      }
    });
  });

  document.getElementById('btnResetDefaultDates')?.addEventListener('click', () => {
    const defDates = getDefaultMeetingDates(year, monthIndex, jenjang);
    selectedSet = new Set(defDates);
    openAturTanggalPertemuanModal(year, monthIndex, jenjang, defDates, onSaved);
  });

  document.getElementById('btnSimpanTanggalPilihan')?.addEventListener('click', () => {
    const sorted = Array.from(selectedSet).sort((a, b) => a - b);
    if (sorted.length === 0) {
      showToast('Pilih minimal 1 tanggal pertemuan dalam sebulan!', 'warning');
      return;
    }
    closeModal();
    if (typeof onSaved === 'function') {
      onSaved(sorted);
    }
  });
}

/**
 * Membuka Window Print untuk Mencetak Lembar Presensi (Kosong atau Hasil Rekap)
 * Dioptimalkan untuk kertas A4 Landscape persis sesuai contoh PDF
 */
export function printLembarPresensiDoc(rekapData = null, options = {}) {
  const isFilled = (options.mode === 'filled' && rekapData);
  const tahun = rekapData ? rekapData.tahun : options.tahun;
  const bulanIndex = rekapData ? rekapData.bulanIndex : options.bulanIndex;
  const bulanName = rekapData ? rekapData.bulan : BULAN_NAMES[bulanIndex - 1].toUpperCase();
  const jenjang = rekapData ? rekapData.jenjang : options.jenjang;
  const kelompokNama = rekapData ? rekapData.kelompokNama : '.........................';
  const desaNama = rekapData ? (rekapData.desaNama || '-') : '.........................';

  let dates = rekapData ? rekapData.tanggalPertemuan : null;
  if (!dates || dates.length === 0) {
    dates = getDefaultMeetingDates(tahun, bulanIndex, jenjang);
  }

  let siswaList = [];
  if (isFilled && rekapData.records) {
    siswaList = rekapData.records;
  } else {
    // Ambil daftar siswa untuk lembar kosong
    const rawSiswa = getSiswaByJenjangAndKelompok(jenjang, options.kelompokId);
    siswaList = rawSiswa.map(s => ({
      nama: s.nama_lengkap || s.nama,
      kelompok: kelompokNama,
      kelas: s.jenjang_kelas || s.jenjang || '-',
      kehadiran: {},
      totalH: '',
      totalS: '',
      totalI: '',
      totalA: '',
      persenHadir: ''
    }));

    // Tambah 5 baris kosong cadangan
    for (let b = 1; b <= 5; b++) {
      siswaList.push({
        nama: '',
        kelompok: kelompokNama,
        kelas: '',
        kehadiran: {},
        totalH: '',
        totalS: '',
        totalI: '',
        totalA: '',
        persenHadir: ''
      });
    }
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Izinkan jendela pop-up untuk mencetak lembar presensi.', 'warning');
    return;
  }

  const datesColHeader = dates.map(d => `<th style="width:24px;border:1px solid #000;text-align:center;font-size:10px;">${d}</th>`).join('');

  const rowsHtml = siswaList.map((s, idx) => {
    const dateCells = dates.map(d => {
      const val = isFilled ? (s.kehadiran[String(d)] || '') : '';
      let styleVal = 'border:1px solid #000;text-align:center;font-size:10px;font-weight:bold;';
      if (val === 'H') styleVal += 'color:#0e7039;';
      else if (val === 'S') styleVal += 'color:#b45309;';
      else if (val === 'I') styleVal += 'color:#1d4ed8;';
      else if (val === 'A') styleVal += 'color:#dc2626;';

      return `<td style="${styleVal}">${val}</td>`;
    }).join('');

    return `
      <tr>
        <td style="border:1px solid #000;text-align:center;font-size:10.5px;padding:4px 2px;">${idx + 1}</td>
        <td style="border:1px solid #000;padding:4px 6px;font-size:11px;font-weight:600;white-space:nowrap;">${s.nama}</td>
        <td style="border:1px solid #000;text-align:center;font-size:10.5px;padding:4px 4px;">${s.kelompok}</td>
        <td style="border:1px solid #000;text-align:center;font-size:10.5px;padding:4px 4px;font-weight:bold;">${s.kelas}</td>
        ${dateCells}
        <td style="border:1px solid #000;text-align:center;font-size:10px;font-weight:bold;color:#0e7039;">${isFilled ? s.totalH : ''}</td>
        <td style="border:1px solid #000;text-align:center;font-size:10px;">${isFilled ? s.totalS : ''}</td>
        <td style="border:1px solid #000;text-align:center;font-size:10px;">${isFilled ? s.totalI : ''}</td>
        <td style="border:1px solid #000;text-align:center;font-size:10px;color:#dc2626;">${isFilled ? s.totalA : ''}</td>
        <td style="border:1px solid #000;text-align:center;font-size:10.5px;font-weight:bold;">${isFilled ? s.persenHadir + '%' : ''}</td>
      </tr>
    `;
  }).join('');

  const docHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Presensi ${jenjang === 'caberawit' ? 'Caberawit' : 'GP'} - ${bulanName} ${tahun} - ${kelompokNama}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm 10mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; background: #fff; }
        .header-box { text-align: center; margin-bottom: 8px; }
        .header-title { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; }
        .header-sub { font-size: 10pt; color: #333; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th { background: #d9e1f2; color: #000; font-weight: bold; }
        .ttd-box { margin-top: 16px; display: flex; justify-content: flex-end; }
        .ttd-block { text-align: center; width: 220px; font-size: 10pt; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background:#eff6ff;padding:8px 14px;border-bottom:1px solid #bfdbfe;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;font-weight:bold;color:#1e3a8a;">Lembar Presensi Siap Cetak (A4 Landscape)</span>
        <button onclick="window.print()" style="padding:6px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:bold;font-size:12px;cursor:pointer;">
          Cetak Dokumen
        </button>
      </div>

      <div class="header-box">
        <h1 class="header-title">LEMBAR PRESENSI PENGAJIAN ${jenjang === 'caberawit' ? 'CABERAWIT' : 'GENERASI PENERUS (GP)'}</h1>
        <div class="header-sub">KELOMPOK ${kelompokNama.toUpperCase()} &bull; DESA ${desaNama.toUpperCase()} &bull; BULAN ${bulanName} ${tahun}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="2" style="border:1px solid #000;width:32px;padding:4px;font-size:10px;">NO</th>
            <th rowspan="2" style="border:1px solid #000;padding:4px 8px;font-size:10.5px;">NAMA LENGKAP</th>
            <th rowspan="2" style="border:1px solid #000;width:80px;font-size:10px;">KELOMPOK</th>
            <th rowspan="2" style="border:1px solid #000;width:50px;font-size:10px;">KELAS</th>
            <th colspan="${dates.length}" style="border:1px solid #000;padding:3px;font-size:10.5px;background:#fff2cc;">BULAN : ${bulanName}</th>
            <th colspan="4" style="border:1px solid #000;padding:3px;font-size:9.5px;background:#e2efda;">REKAP</th>
            <th rowspan="2" style="border:1px solid #000;width:60px;font-size:10px;background:#e2efda;">% HADIR</th>
          </tr>
          <tr>
            ${datesColHeader}
            <th style="border:1px solid #000;width:22px;font-size:9.5px;">H</th>
            <th style="border:1px solid #000;width:22px;font-size:9.5px;">S</th>
            <th style="border:1px solid #000;width:22px;font-size:9.5px;">I</th>
            <th style="border:1px solid #000;width:22px;font-size:9.5px;">A</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="ttd-box">
        <div class="ttd-block">
          <div>Solo Selatan, ............................. ${tahun}</div>
          <div style="margin-top:4px;">Pamong Pengajian,</div>
          <div style="height:55px;"></div>
          <div style="font-weight:bold;text-decoration:underline;">( .................................................... )</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          // Auto print jika dipanggil langsung
        };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(docHtml);
  printWindow.document.close();
}

/**
 * Ekspor Data Presensi Bulanan ke Format Excel (.xlsx) Menggunakan SheetJS
 */
export function exportAbsensiToExcel(rekapData) {
  if (typeof XLSX === 'undefined') {
    showToast('Pustaka Excel belum dimuat, silakan muat ulang halaman.', 'warning');
    return;
  }

  const { tahun, bulan, jenjang, kelompokNama, tanggalPertemuan, records } = rekapData;
  const sheetData = [];

  // Title Row
  sheetData.push([`LEMBAR PRESENSI PENGAJIAN ${jenjang === 'caberawit' ? 'CABERAWIT' : 'GP'} - KELOMPOK ${kelompokNama.toUpperCase()}`]);
  sheetData.push([`Bulan: ${bulan} ${tahun}`]);
  sheetData.push([]); // Empty row

  // Header 1
  const headerRow1 = ['NO', 'NAMA', 'KELOMPOK', 'KELAS'];
  tanggalPertemuan.forEach(d => headerRow1.push(d));
  headerRow1.push('H', 'S', 'I', 'A', '% HADIR');
  sheetData.push(headerRow1);

  // Rows Data
  records.forEach((r, idx) => {
    const row = [idx + 1, r.nama, r.kelompok, r.kelas];
    tanggalPertemuan.forEach(d => {
      row.push(r.kehadiran[String(d)] || '');
    });
    row.push(r.totalH, r.totalS, r.totalI, r.totalA, `${r.persenHadir}%`);
    sheetData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Presensi_${bulan}`);

  const fileName = `Presensi_${jenjang}_${kelompokNama}_${bulan}_${tahun}.xlsx`;
  XLSX.writeFile(wb, fileName);
  showToast(`File Excel "${fileName}" berhasil diunduh!`, 'success');
}

/**
 * Modal Grafik & Analisis Tren Tingkat Kehadiran Tahunan Multi-Level
 */
export function openGrafikKehadiranTahunanModal(filterOptions = {}) {
  const list = getAbsensiBulananList();
  const tahun = filterOptions.tahun || new Date().getFullYear();
  const jenjang = filterOptions.jenjang || 'caberawit';

  // Susun data 12 bulan (Jan - Des)
  const monthStats = BULAN_NAMES.map((name, idx) => {
    const bNum = idx + 1;
    const matchItems = list.filter(item =>
      String(item.tahun) === String(tahun) &&
      Number(item.bulanIndex) === bNum &&
      item.jenjang === jenjang
    );

    let totalSiswa = 0;
    let sumPercent = 0;
    matchItems.forEach(it => {
      if (it.summary && it.summary.rataRataKehadiran) {
        sumPercent += it.summary.rataRataKehadiran;
      }
      totalSiswa += (it.summary ? it.summary.totalSiswa : 0);
    });

    const avg = matchItems.length > 0 ? Number((sumPercent / matchItems.length).toFixed(1)) : 0;
    return {
      bulanName: name,
      avgPercent: avg,
      hasData: matchItems.length > 0,
      totalSiswa
    };
  });

  // Bangun visualisasi bar chart CSS interaktif
  const chartBarsHtml = monthStats.map(m => {
    const barHeight = Math.max(m.avgPercent, 4); // Minimal bar
    let barColor = 'bg-emerald-500';
    if (m.avgPercent < 70 && m.hasData) barColor = 'bg-amber-500';
    if (!m.hasData) barColor = 'bg-slate-200 dark:bg-slate-700';

    return `
      <div class="flex flex-col items-center flex-1 min-w-[28px] group relative cursor-pointer" title="${m.bulanName}: ${m.hasData ? m.avgPercent + '%' : 'Belum ada data'}">
        <span class="text-[10px] font-black ${m.hasData ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'} mb-1">
          ${m.hasData ? m.avgPercent + '%' : '-'}
        </span>
        <div class="w-full h-40 bg-slate-100 dark:bg-slate-800/80 rounded-t-lg flex items-end justify-center p-1">
          <div class="w-full ${barColor} rounded-t transition-all group-hover:opacity-80" style="height:${m.hasData ? barHeight : 4}%;"></div>
        </div>
        <span class="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mt-1.5 truncate max-w-full">
          ${m.bulanName.substring(0, 3)}
        </span>
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;font-size:12.5px;">
      
      <!-- Top Summary Card -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100">
            Analisis Tahunan &bull; ${jenjang === 'caberawit' ? 'Caberawit' : 'GP Reguler'}
          </span>
          <h3 class="text-lg font-black mt-1">Grafik Tingkat Kehadiran Tahun ${tahun}</h3>
          <p class="text-xs text-blue-200 mt-0.5">
            Tren rata-rata kehadiran santri se-Daerah Solo Selatan per bulan kalender.
          </p>
        </div>
        <div class="text-right bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
          <span class="text-2xl font-black block">
            ${(monthStats.filter(m => m.hasData).reduce((acc, m) => acc + m.avgPercent, 0) / Math.max(1, monthStats.filter(m => m.hasData).length)).toFixed(1)}%
          </span>
          <span class="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Rerata Tahunan</span>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <h4 class="font-extrabold text-xs text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[17px] text-blue-600">bar_chart</span>
          <span>Tingkat Partisipasi Santri (Januari – Desember ${tahun})</span>
        </h4>
        <div class="flex items-end justify-between gap-1.5 pt-2">
          ${chartBarsHtml}
        </div>
      </div>

      <!-- Action Footer -->
      <div class="modal-sticky-footer">
        <button type="button" id="btnCloseGrafikModal" class="btn-sticky-back" title="Tutup">
          <span class="material-symbols-outlined">close</span>
          <span class="btn-text">Tutup</span>
        </button>
      </div>

    </div>
  `;

  openModal(`Grafik Kehadiran Tahunan (${jenjang === 'caberawit' ? 'Caberawit' : 'GP'})`, 'monitoring', modalHtml, 'large');
  document.getElementById('btnCloseGrafikModal')?.addEventListener('click', closeModal);
}
