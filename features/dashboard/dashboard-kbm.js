/* ═══════════════════════════════════════════════════════════════
   dashboard-kbm.js — Kegiatan Belajar Mengajar & Rekap Kehadiran
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getAllKelompok,
  getKbmEvents,
  getKbmEventById,
  saveKbmEvent,
  deleteKbmEvent,
  getSiswaList
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
   MODUL EVENT KBM & REKAP KEHADIRAN (MULTI-JENJANG & CETAK DOKUMEN FISIK)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderCetakAbsensiModal(activeTab = 'agenda', options = {}) {
  // ── Hak Akses 3 Tingkatan ──
  const isDaerah = currentUser.tingkatan === 'daerah' || currentUser.isSuperadmin === true;
  const isDesa = currentUser.tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;

  const currentDesaId = currentUser.desaId || 'desa-timur-1';
  const currentKelId = currentUser.kelompokId || 'kel-gunung-wijil-1';

  // Normalisasi tab dari pemanggil lama
  if (activeTab === 'event_list') activeTab = 'agenda';

  const allEvents = getKbmEvents();

  // State Filter
  const filterDesa = options.filterDesa || (isDaerah ? 'all' : currentDesaId);
  const filterKel = options.filterKel || (isKelompok ? currentKelId : (options.filterKel || 'all'));
  const filterFormat = options.filterFormat || 'all';
  const scopeMode = options.scopeMode || (isKelompok ? 'kelompok_only' : 'all'); // 'kelompok_only' | 'desa_all'
  const selectedEventId = options.selectedEventId || (allEvents[0]?.id || null);

  // ── Saring Event Sesuai Hak Akses & Filter ──
  const filteredEvents = allEvents.filter(ev => {
    // Filter Hak Akses Wilayah
    if (isKelompok) {
      // Pamong kelompok hanya melihat event di desanya atau event tingkat daerah (desa_id === 'all')
      const inDesa = (ev.desa_id === 'all' || ev.desa_id === currentDesaId);
      if (!inDesa) return false;

      if (scopeMode === 'kelompok_only') {
        const isOwn = (ev.kelompok_id === currentKelId) || (ev.kelompok_id === 'all');
        if (!isOwn) return false;
      }
    } else if (isDesa) {
      // Pengurus desa melihat event di desanya atau tingkat daerah
      const inDesa = (ev.desa_id === 'all' || ev.desa_id === currentDesaId);
      if (!inDesa) return false;

      if (filterKel !== 'all') {
        if (ev.kelompok_id !== 'all' && ev.kelompok_id !== filterKel) return false;
      }
    } else {
      // Pengurus Daerah
      if (filterDesa !== 'all') {
        if (ev.desa_id !== 'all' && ev.desa_id !== filterDesa) return false;
      }
      if (filterKel !== 'all') {
        if (ev.kelompok_id !== 'all' && ev.kelompok_id !== filterKel) return false;
      }
    }

    // Filter Format KBM
    if (filterFormat !== 'all' && ev.format_kbm !== filterFormat) {
      return false;
    }

    return true;
  });

  // ── Helper Helper Opsi Dropdown ──
  const desaList = MASTER_WILAYAH.desa;
  const desaObj = desaList.find(d => d.id === currentDesaId) || desaList[0];
  const allKels = getAllKelompok();
  const currentKelObj = allKels.find(k => k.id === currentKelId);

  function buildDesaOptions(selectedId) {
    if (isDaerah) {
      return `<option value="all" ${selectedId === 'all' ? 'selected' : ''}>Semua Desa (Solo Selatan)</option>` +
        desaList.map(d => `<option value="${d.id}" ${selectedId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`).join('');
    } else {
      return `<option value="${desaObj.id}" selected>Desa ${desaObj.nama}</option>`;
    }
  }

  function buildKelOptions(desaId, selectedId) {
    let kels = allKels;
    if (desaId !== 'all') {
      kels = kels.filter(k => k.desaId === desaId);
    }
    if (isKelompok) {
      return `<option value="${currentKelId}" selected>Kel. ${currentKelObj ? currentKelObj.nama : 'Kelompok Saya'}</option>`;
    }
    return `<option value="all" ${selectedId === 'all' ? 'selected' : ''}>Semua Kelompok</option>` +
      kels.map(k => `<option value="${k.id}" ${selectedId === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('');
  }

  // ── Tab Bar Navigation Header ──
  const tabHeaderHtml = `
    <div class="kbm-tab-bar">
      <button type="button" class="kbm-tab-btn ${activeTab === 'agenda' ? 'active' : ''}" id="tabBtnAgenda">
        <span class="material-symbols-outlined">calendar_month</span>
        <span>Agenda &amp; Cetak Absensi (${allEvents.length})</span>
      </button>
      <button type="button" class="kbm-tab-btn ${activeTab === 'jurnal' ? 'active' : ''}" id="tabBtnJurnal">
        <span class="material-symbols-outlined">menu_book</span>
        <span>Jurnal Kegiatan KBM</span>
      </button>
    </div>
  `;

  // ══════════════════════════════════════════════════════════════
  // TAB 1: AGENDA & CETAK ABSENSI
  // ══════════════════════════════════════════════════════════════
  let agendaContentHtml = '';

  // Toolbar Filter & Buat Event Baru
  let filterBarHtml = '';
  if (isDaerah) {
    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group">
          <select id="kbmFilterDesa" class="kbm-select" title="Filter Desa">
            ${buildDesaOptions(filterDesa)}
          </select>
          <select id="kbmFilterKelompok" class="kbm-select" title="Filter Kelompok">
            ${buildKelOptions(filterDesa, filterKel)}
          </select>
          <select id="kbmFilterFormat" class="kbm-select" title="Filter Format KBM">
            <option value="all" ${filterFormat === 'all' ? 'selected' : ''}>Semua Format KBM</option>
            <option value="remaja" ${filterFormat === 'remaja' ? 'selected' : ''}>Remaja</option>
            <option value="caberawit" ${filterFormat === 'caberawit' ? 'selected' : ''}>Caberawit</option>
            <option value="gp_reguler" ${filterFormat === 'gp_reguler' ? 'selected' : ''}>GP Reguler</option>
          </select>
        </div>
        <button type="button" id="btnBukaCreateEvent" style="padding:7px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(34,197,94,0.25);">
          <span class="material-symbols-outlined" style="font-size:17px;">add</span>
          <span>Buat Event KBM</span>
        </button>
      </div>
    `;
  } else if (isDesa) {
    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group">
          <span style="font-size:12px;font-weight:700;background:var(--blue-light);color:var(--blue-dark);padding:4px 10px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">domain</span>
            Desa ${desaObj.nama}
          </span>
          <select id="kbmFilterKelompok" class="kbm-select" title="Filter Kelompok">
            ${buildKelOptions(currentDesaId, filterKel)}
          </select>
          <select id="kbmFilterFormat" class="kbm-select" title="Filter Format KBM">
            <option value="all" ${filterFormat === 'all' ? 'selected' : ''}>Semua Format KBM</option>
            <option value="remaja" ${filterFormat === 'remaja' ? 'selected' : ''}>Remaja</option>
            <option value="caberawit" ${filterFormat === 'caberawit' ? 'selected' : ''}>Caberawit</option>
            <option value="gp_reguler" ${filterFormat === 'gp_reguler' ? 'selected' : ''}>GP Reguler</option>
          </select>
        </div>
        <button type="button" id="btnBukaCreateEvent" style="padding:7px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(34,197,94,0.25);">
          <span class="material-symbols-outlined" style="font-size:17px;">add</span>
          <span>Buat Event KBM</span>
        </button>
      </div>
    `;
  } else {
    // Pamong Kelompok
    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group">
          <span style="font-size:11.5px;font-weight:700;background:var(--green-light);color:var(--green-dark);padding:4px 10px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:15px;">location_on</span>
            Kel. ${currentKelObj ? currentKelObj.nama : 'Kelompok Saya'}
          </span>
          <div style="display:inline-flex;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:2px;">
            <button type="button" id="btnScopeKelompok" style="padding:4px 9px;border:none;border-radius:5px;font-size:11.5px;font-weight:700;cursor:pointer;background:${scopeMode === 'kelompok_only' ? 'var(--primary)' : 'transparent'};color:${scopeMode === 'kelompok_only' ? '#fff' : 'var(--text-muted)'};">
              Kelompok Saya
            </button>
            <button type="button" id="btnScopeDesa" style="padding:4px 9px;border:none;border-radius:5px;font-size:11.5px;font-weight:700;cursor:pointer;background:${scopeMode === 'desa_all' ? 'var(--primary)' : 'transparent'};color:${scopeMode === 'desa_all' ? '#fff' : 'var(--text-muted)'};">
              Se-Desa (Lihat)
            </button>
          </div>
          <select id="kbmFilterFormat" class="kbm-select" title="Filter Format KBM" style="padding:5px 9px;">
            <option value="all" ${filterFormat === 'all' ? 'selected' : ''}>Semua Format</option>
            <option value="remaja" ${filterFormat === 'remaja' ? 'selected' : ''}>Remaja</option>
            <option value="caberawit" ${filterFormat === 'caberawit' ? 'selected' : ''}>Caberawit</option>
            <option value="gp_reguler" ${filterFormat === 'gp_reguler' ? 'selected' : ''}>GP Reguler</option>
          </select>
        </div>
        <button type="button" id="btnBukaCreateEvent" style="padding:6px 12px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(34,197,94,0.25);">
          <span class="material-symbols-outlined" style="font-size:16px;">add</span>
          <span>Buat Event</span>
        </button>
      </div>
    `;
  }

  if (filteredEvents.length === 0) {
    agendaContentHtml = `
      ${filterBarHtml}
      <div style="text-align:center;padding:40px 20px;background:var(--bg);border-radius:12px;border:1.5px dashed var(--border);">
        <span class="material-symbols-outlined" style="font-size:48px;color:#94a3b8;margin-bottom:8px;">event_busy</span>
        <h4 style="margin:0;font-size:14px;color:var(--text);font-weight:800;">Tidak Ada Event KBM yang Cocok</h4>
        <p style="margin:4px 0 16px;font-size:12px;color:var(--text-muted);">
          Silakan sesuaikan filter wilayah di atas atau buat event KBM baru untuk mencetak lembar absensi.
        </p>
        <button type="button" id="btnEmptyCreateEvent" style="padding:8px 16px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">add</span> Buat Event KBM Baru
        </button>
      </div>
    `;
  } else {
    // ── Render Desktop Table & Mobile Cards ──
    const rowsDesktopHtml = filteredEvents.map((ev, idx) => {
      // Periksa status rekap sesuai wilayah aktif
      const rekap = ev.rekap_kehadiran || {};
      let hasRekap = false;
      let totalHadir = 0, totalIjin = 0, totalAlfa = 0;

      if (isKelompok) {
        const kRekap = rekap[currentKelId];
        if (kRekap && ((kRekap.hadir || 0) + (kRekap.ijin || 0) + (kRekap.alfa || 0)) > 0) {
          hasRekap = true;
          totalHadir = kRekap.hadir || 0;
          totalIjin = kRekap.ijin || 0;
          totalAlfa = kRekap.alfa || 0;
        }
      } else {
        Object.values(rekap).forEach(k => {
          totalHadir += (parseInt(k.hadir) || 0);
          totalIjin += (parseInt(k.ijin) || 0);
          totalAlfa += (parseInt(k.alfa) || 0);
        });
        hasRekap = (totalHadir + totalIjin + totalAlfa) > 0;
      }

      // Format Pill
      let formatBadge = 'badge-primary';
      let formatName = 'Remaja';
      if (ev.format_kbm === 'caberawit') {
        formatBadge = 'badge-amber';
        formatName = 'Caberawit';
      } else if (ev.format_kbm === 'gp_reguler') {
        formatBadge = 'badge-info';
        formatName = 'GP Reguler';
      }

      // Wilayah Label
      let wilayahLabel = 'Solo Selatan';
      if (ev.kelompok_id && ev.kelompok_id !== 'all') {
        const foundKel = allKels.find(k => k.id === ev.kelompok_id);
        wilayahLabel = foundKel ? `Kel. ${foundKel.nama}` : 'Kelompok';
      } else if (ev.desa_id && ev.desa_id !== 'all') {
        const foundDesa = desaList.find(d => d.id === ev.desa_id);
        wilayahLabel = foundDesa ? `Desa ${foundDesa.nama}` : 'Desa';
      }

      // Hak Edit & Hapus
      let canManage = true;
      let isReadOnly = false;
      if (isKelompok) {
        if (ev.kelompok_id && ev.kelompok_id !== 'all' && ev.kelompok_id !== currentKelId) {
          canManage = false;
          isReadOnly = true;
        }
      }

      return `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 8px;text-align:center;font-weight:700;color:var(--text-muted);">${idx + 1}</td>
          <td style="padding:10px 12px;">
            <div style="font-weight:800;color:var(--text);font-size:13px;margin-bottom:4px;">${ev.judul || 'Event KBM'}</div>
            <div style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <span class="badge ${formatBadge}" style="font-size:11px;padding:2px 7px;">${formatName}</span>
              <span style="font-size:11px;font-weight:700;background:var(--blue-light);color:var(--blue-dark);padding:2px 7px;border-radius:4px;">
                ${wilayahLabel}
              </span>
              ${isReadOnly ? `<span style="font-size:10.5px;font-weight:700;background:#f1f5f9;color:#64748b;padding:2px 6px;border-radius:4px;">Hanya Lihat</span>` : ''}
            </div>
          </td>
          <td style="padding:10px 12px;white-space:nowrap;">
            <div style="font-weight:700;color:var(--text);font-size:12px;">${ev.hari_tanggal || '-'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${ev.jam || ''}</div>
          </td>
          <td style="padding:10px 12px;text-align:center;white-space:nowrap;">
            <div style="margin-bottom:6px;">
              ${hasRekap ? `
                <span class="kbm-badge-status-done">
                  <span class="material-symbols-outlined" style="font-size:13px;">check_circle</span>
                  Jurnal Terisi ${isKelompok ? `(H:${totalHadir})` : ''}
                </span>
              ` : `
                <span class="kbm-badge-status-pending">
                  <span class="material-symbols-outlined" style="font-size:13px;">pending</span>
                  Belum Ada Jurnal
                </span>
              `}
            </div>
            <div style="display:inline-flex;gap:5px;align-items:center;">
              <button type="button" class="kbm-action-btn kbm-action-btn-print btn-action-cetak-absensi" data-ev-id="${ev.id}" title="Cetak Lembar Presensi Santri">
                <span class="material-symbols-outlined">print</span>
                <span class="btn-text">Cetak Absen</span>
              </button>
              <button type="button" class="kbm-action-btn kbm-action-btn-journal btn-action-isi-jurnal" data-ev-id="${ev.id}" title="${isReadOnly ? 'Lihat Rekapitulasi' : 'Input Jurnal KBM'}">
                <span class="material-symbols-outlined">edit_note</span>
                <span class="btn-text">${isReadOnly ? 'Lihat' : 'Isi Jurnal'}</span>
              </button>
              <button type="button" class="kbm-action-btn kbm-action-btn-report btn-action-cetak-laporan" data-ev-id="${ev.id}" title="Laporan PDF Kehadiran Resmi">
                <span class="material-symbols-outlined">description</span>
                <span class="btn-text">Laporan</span>
              </button>
              ${canManage ? `
                <button type="button" class="kbm-action-btn kbm-action-btn-delete btn-action-hapus-event" data-ev-id="${ev.id}" data-judul="${ev.judul || 'Event KBM'}" title="Hapus Event">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Cards View for Mobile
    const cardsMobileHtml = filteredEvents.map(ev => {
      const rekap = ev.rekap_kehadiran || {};
      let hasRekap = false;
      let totalHadir = 0;

      if (isKelompok) {
        const kRekap = rekap[currentKelId];
        if (kRekap && ((kRekap.hadir || 0) + (kRekap.ijin || 0) + (kRekap.alfa || 0)) > 0) {
          hasRekap = true;
          totalHadir = kRekap.hadir || 0;
        }
      } else {
        let totAll = 0;
        Object.values(rekap).forEach(k => {
          totAll += (parseInt(k.hadir) || 0) + (parseInt(k.ijin) || 0) + (parseInt(k.alfa) || 0);
        });
        hasRekap = totAll > 0;
      }

      let formatBadge = 'badge-primary';
      let formatName = 'Remaja';
      if (ev.format_kbm === 'caberawit') {
        formatBadge = 'badge-amber';
        formatName = 'Caberawit';
      } else if (ev.format_kbm === 'gp_reguler') {
        formatBadge = 'badge-info';
        formatName = 'GP Reguler';
      }

      let wilayahLabel = 'Solo Selatan';
      if (ev.kelompok_id && ev.kelompok_id !== 'all') {
        const foundKel = allKels.find(k => k.id === ev.kelompok_id);
        wilayahLabel = foundKel ? `Kel. ${foundKel.nama}` : 'Kelompok';
      } else if (ev.desa_id && ev.desa_id !== 'all') {
        const foundDesa = desaList.find(d => d.id === ev.desa_id);
        wilayahLabel = foundDesa ? `Desa ${foundDesa.nama}` : 'Desa';
      }

      let canManage = true;
      let isReadOnly = false;
      if (isKelompok) {
        if (ev.kelompok_id && ev.kelompok_id !== 'all' && ev.kelompok_id !== currentKelId) {
          canManage = false;
          isReadOnly = true;
        }
      }

      return `
        <div class="kbm-event-card">
          <div class="kbm-event-card-header">
            <div class="kbm-event-card-title">${ev.judul || 'Event KBM'}</div>
            <div>
              ${hasRekap ? `
                <span class="kbm-badge-status-done">
                  <span class="material-symbols-outlined" style="font-size:13px;">check_circle</span>
                  ${isKelompok ? `H:${totalHadir}` : 'Terisi'}
                </span>
              ` : `
                <span class="kbm-badge-status-pending">
                  <span class="material-symbols-outlined" style="font-size:13px;">pending</span>
                  Belum
                </span>
              `}
            </div>
          </div>

          <div class="kbm-event-card-meta">
            <span class="badge ${formatBadge}" style="font-size:11px;padding:2px 7px;">${formatName}</span>
            <span style="font-size:11px;font-weight:700;background:var(--blue-light);color:var(--blue-dark);padding:2px 7px;border-radius:4px;">
              ${wilayahLabel}
            </span>
            ${isReadOnly ? `<span style="font-size:10px;font-weight:700;background:#f1f5f9;color:#64748b;padding:2px 6px;border-radius:4px;">Lihat Saja</span>` : ''}
            <span style="font-size:11.5px;color:var(--text-muted);margin-left:auto;">
              ${ev.hari_tanggal || ''}
            </span>
          </div>

          <div class="kbm-event-card-actions">
            <button type="button" class="kbm-action-btn kbm-action-btn-print btn-action-cetak-absensi" data-ev-id="${ev.id}" title="Cetak Lembar Presensi">
              <span class="material-symbols-outlined">print</span>
              <span class="btn-text">Cetak</span>
            </button>
            <button type="button" class="kbm-action-btn kbm-action-btn-journal btn-action-isi-jurnal" data-ev-id="${ev.id}" title="${isReadOnly ? 'Lihat Rekapitulasi' : 'Input Jurnal KBM'}">
              <span class="material-symbols-outlined">edit_note</span>
              <span class="btn-text">${isReadOnly ? 'Lihat' : 'Isi Jurnal'}</span>
            </button>
            <button type="button" class="kbm-action-btn kbm-action-btn-report btn-action-cetak-laporan" data-ev-id="${ev.id}" title="Laporan PDF">
              <span class="material-symbols-outlined">description</span>
              <span class="btn-text">Laporan</span>
            </button>
            ${canManage ? `
              <button type="button" class="kbm-action-btn kbm-action-btn-delete btn-action-hapus-event" data-ev-id="${ev.id}" data-judul="${ev.judul || 'Event KBM'}" title="Hapus Event">
                <span class="material-symbols-outlined">delete</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    agendaContentHtml = `
      ${filterBarHtml}

      <!-- TAMPILAN DESKTOP TABLE -->
      <div class="kbm-desktop-table-wrap" style="max-height:420px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead style="background:var(--bg);position:sticky;top:0;z-index:5;border-bottom:2px solid #cbd5e1;">
            <tr>
              <th style="padding:10px 8px;text-align:center;width:36px;">No</th>
              <th style="padding:10px 12px;text-align:left;">Kegiatan KBM &amp; Format</th>
              <th style="padding:10px 12px;text-align:left;">Waktu Pelaksanaan</th>
              <th style="padding:10px 12px;text-align:center;">Status &amp; Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${rowsDesktopHtml}
          </tbody>
        </table>
      </div>

      <!-- TAMPILAN MOBILE CARDS -->
      <div class="kbm-event-cards-view">
        ${cardsMobileHtml}
      </div>

      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;font-weight:600;color:var(--text-muted);">
          Menampilkan <strong>${filteredEvents.length}</strong> dari <strong>${allEvents.length}</strong> total agenda KBM.
        </span>
        <button type="button" class="btn-cancel-modal px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          Tutup
        </button>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════
  // TAB 2: JURNAL KEGIATAN KBM
  // ══════════════════════════════════════════════════════════════
  let jurnalContentHtml = '';
  const currentEvent = getKbmEventById(selectedEventId) || filteredEvents[0] || allEvents[0];

  if (!currentEvent) {
    jurnalContentHtml = `
      <div style="text-align:center;padding:40px 20px;background:var(--bg);border-radius:12px;border:1.5px dashed var(--border);">
        <span class="material-symbols-outlined" style="font-size:42px;color:#94a3b8;margin-bottom:8px;">menu_book</span>
        <h4 style="margin:0;font-size:14px;color:var(--text);font-weight:800;">Belum Ada Event untuk Diisi Jurnal</h4>
        <p style="margin:4px 0 16px;font-size:12px;color:var(--text-muted);">
          Buat event KBM terlebih dahulu pada tab Agenda &amp; Cetak Absensi.
        </p>
        <button type="button" id="btnJurnalToAgenda" style="padding:8px 16px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">
          Ke Tab Agenda
        </button>
      </div>
    `;
  } else {
    // Dropdown Pemilihan Event
    const eventSelectorHtml = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:260px;">
          <span class="material-symbols-outlined" style="color:var(--primary);font-size:20px;">event</span>
          <label style="font-size:12px;font-weight:800;color:var(--text);white-space:nowrap;">Pilih Event KBM:</label>
          <select id="selJurnalEventId" class="kbm-select" style="flex:1;font-weight:700;">
            ${allEvents.map(ev => `
              <option value="${ev.id}" ${ev.id === currentEvent.id ? 'selected' : ''}>
                ${ev.judul} (${ev.hari_tanggal || '-'})
              </option>
            `).join('')}
          </select>
        </div>
        <button type="button" id="btnJurnalPreviewPdf" style="padding:6px 12px;background:#fdf2f8;color:#db2777;border:1px solid #fbcfe8;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">print</span>
          Preview Laporan PDF
        </button>
      </div>
    `;

    if (isKelompok) {
      // ── FORM JURNAL PAMONG KELOMPOK ──
      const rekapKel = (currentEvent.rekap_kehadiran && currentEvent.rekap_kehadiran[currentKelId]) || {};
      const hVal = parseInt(rekapKel.hadir) || 0;
      const iVal = parseInt(rekapKel.ijin) || 0;
      const aVal = parseInt(rekapKel.alfa) || 0;
      const totVal = hVal + iVal + aVal;
      const pctAlfa = totVal > 0 ? ((aVal / totVal) * 100).toFixed(1) : '0.0';
      const materiVal = rekapKel.materi || '';
      const pengajarVal = rekapKel.pengajar || '';
      const catatanVal = rekapKel.catatan || '';

      jurnalContentHtml = `
        ${eventSelectorHtml}

        <!-- Header Info Kelompok -->
        <div style="background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);border:1.5px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <span style="font-size:11px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">Jurnal KBM Kelompok</span>
              <h3 style="margin:2px 0 0;font-size:14px;font-weight:800;color:#1e3a8a;">Kel. ${currentKelObj ? currentKelObj.nama : 'Kelompok Saya'} — Desa ${desaObj.nama}</h3>
              <div style="font-size:11.5px;color:#3b82f6;margin-top:2px;">
                ${currentEvent.judul} • ${currentEvent.hari_tanggal || '-'} (${currentEvent.jam || ''})
              </div>
            </div>
            <div>
              ${totVal > 0 ? `
                <span class="kbm-badge-status-done" style="font-size:11.5px;padding:4px 10px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span>
                  Sudah Diisi (Total: ${totVal})
                </span>
              ` : `
                <span class="kbm-badge-status-pending" style="font-size:11.5px;padding:4px 10px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">pending</span>
                  Belum Ada Rekap
                </span>
              `}
            </div>
          </div>
        </div>

        <form id="formJurnalKelompok" style="display:flex;flex-direction:column;gap:14px;">
          <!-- Section 1: Rekap Angka Fisik Kehadiran -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;">
            <div style="margin-bottom:10px;">
              <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined" style="color:var(--green);font-size:18px;">fact_check</span>
                1. Rekapitulasi Presensi Fisik Santri
              </h4>
              <p style="margin:2px 0 0;font-size:11px;color:var(--text-muted);">
                Isi total angka hasil perhitungan dari lembar kertas absensi fisik yang telah diisi saat pengajian.
              </p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1.2fr;gap:10px;align-items:center;">
              <div>
                <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:#166534;">Hadir</label>
                <input type="number" min="0" id="iptJurnalHadir" value="${hVal}" style="width:100%;padding:8px;border:1.5px solid #86efac;border-radius:8px;text-align:center;font-weight:800;font-size:14px;background:#f0fdf4;" required />
              </div>
              <div>
                <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:#1e40af;">Ijin</label>
                <input type="number" min="0" id="iptJurnalIjin" value="${iVal}" style="width:100%;padding:8px;border:1.5px solid #bfdbfe;border-radius:8px;text-align:center;font-weight:800;font-size:14px;background:#eff6ff;" required />
              </div>
              <div>
                <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:#991b1b;">Alfa</label>
                <input type="number" min="0" id="iptJurnalAlfa" value="${aVal}" style="width:100%;padding:8px;border:1.5px solid #fecaca;border-radius:8px;text-align:center;font-weight:800;font-size:14px;background:#fef2f2;" required />
              </div>
              <div style="background:var(--bg);padding:8px 10px;border-radius:8px;border:1px solid var(--border);text-align:center;">
                <div style="font-size:11px;color:var(--text-muted);font-weight:600;">Total &amp; % Alfa</div>
                <div style="font-size:14px;font-weight:800;color:var(--text);margin-top:2px;">
                  <span id="txtJurnalTotal">${totVal}</span> Santri 
                  <span id="txtJurnalPctAlfa" style="font-size:12px;padding:2px 6px;border-radius:4px;margin-left:4px;${parseFloat(pctAlfa) >= 13.0 ? 'background:#fef08a;color:#854d0e;font-weight:800;' : 'color:var(--text-muted);'}">(${pctAlfa}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Jurnal Pembelajaran -->
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;">
            <div style="margin-bottom:10px;">
              <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined" style="color:var(--primary);font-size:18px;">auto_stories</span>
                2. Jurnal Pembelajaran &amp; Pengajar
              </h4>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:var(--text);">
                  Materi yang Disampaikan <span style="color:red">*</span>
                </label>
                <input type="text" id="iptJurnalMateri" value="${materiVal}" placeholder="Contoh: Surat Al-Baqarah ayat 1-20" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12.5px;" required />
              </div>
              <div>
                <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:var(--text);">
                  Pengajar / Pamong Pengisi <span style="color:red">*</span>
                </label>
                <input type="text" id="iptJurnalPengajar" value="${pengajarVal}" placeholder="Contoh: Bp. H. Ahmad / Pamong Kelompok" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12.5px;" required />
              </div>
            </div>

            <div>
              <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:var(--text);">
                Catatan / Evaluasi Kegiatan
              </label>
              <textarea id="iptJurnalCatatan" rows="3" placeholder="Materi Alqur'an dan Khadist ataupun Tema Nasehat Bisa di catat disini" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;resize:vertical;">${catatanVal}</textarea>
              <span style="font-size:11px;color:var(--text-muted);display:block;margin-top:3px;">
                💡 <em>Materi Alqur'an dan Khadist ataupun Tema Nasehat Bisa di catat disini</em>
              </span>
            </div>
          </div>

          <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
          <div class="modal-sticky-footer">
            <button type="button" id="btnJurnalKembaliAgenda" class="btn-sticky-back" title="Kembali ke Agenda">
              <span class="material-symbols-outlined">arrow_back</span>
              <span class="btn-text">Kembali ke Agenda</span>
            </button>
            <button type="submit" id="btnSubmitJurnalKelompok" class="btn-sticky-save" title="Simpan Jurnal KBM">
              <span class="material-symbols-outlined">save</span>
              <span class="btn-text">Simpan Jurnal KBM</span>
            </button>
          </div>
        </form>
      `;
    } else {
      // ── MONITORING JURNAL PENGURUS DAERAH & DESA ──
      const targetDesaList = isDesa
        ? desaList.filter(d => d.id === currentDesaId)
        : (filterDesa === 'all' ? desaList : desaList.filter(d => d.id === filterDesa));

      const rekapMap = currentEvent.rekap_kehadiran || {};

      let totalKelompokInScope = 0;
      let submittedKelompokCount = 0;
      let grandHadir = 0, grandIjin = 0, grandAlfa = 0;

      targetDesaList.forEach(d => {
        d.kelompok.forEach(kel => {
          totalKelompokInScope++;
          const kVal = rekapMap[kel.id] || {};
          const h = parseInt(kVal.hadir) || 0;
          const i = parseInt(kVal.ijin) || 0;
          const a = parseInt(kVal.alfa) || 0;
          const tot = h + i + a;
          if (tot > 0) {
            submittedKelompokCount++;
            grandHadir += h;
            grandIjin += i;
            grandAlfa += a;
          }
        });
      });

      const grandTotal = grandHadir + grandIjin + grandAlfa;
      const grandPctAlfa = grandTotal > 0 ? ((grandAlfa / grandTotal) * 100).toFixed(1) : '0.0';
      const pctProgress = totalKelompokInScope > 0 ? Math.round((submittedKelompokCount / totalKelompokInScope) * 100) : 0;

      jurnalContentHtml = `
        ${eventSelectorHtml}

        <!-- Progress Monitoring Card -->
        <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <div>
              <span style="font-size:11px;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;">
                ${isDesa ? `Pemantauan Jurnal Desa ${desaObj.nama}` : 'Pemantauan Jurnal Daerah Solo Selatan'}
              </span>
              <h4 style="margin:2px 0 0;font-size:14px;font-weight:800;color:var(--text);">
                Progres Pengisian: <strong>${submittedKelompokCount}</strong> dari <strong>${totalKelompokInScope}</strong> Kelompok (${pctProgress}%)
              </h4>
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" id="btnBukaMatrixLengkap" style="padding:6px 12px;background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                <span class="material-symbols-outlined" style="font-size:16px;">table_chart</span>
                Input Matrix Semua Kelompok
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="width:100%;height:8px;background:var(--bg);border-radius:4px;overflow:hidden;border:1px solid var(--border);">
            <div style="width:${pctProgress}%;height:100%;background:${pctProgress >= 80 ? '#22c55e' : (pctProgress >= 40 ? '#3b82f6' : '#f59e0b')};border-radius:4px;transition:width 0.3s;"></div>
          </div>

          <div style="display:flex;gap:14px;margin-top:8px;font-size:11.5px;color:var(--text-muted);font-weight:600;">
            <span>Total Hadir: <strong style="color:var(--text);">${grandHadir}</strong></span>
            <span>Ijin: <strong style="color:var(--text);">${grandIjin}</strong></span>
            <span>Alfa: <strong style="color:var(--text);">${grandAlfa} (${grandPctAlfa}%)</strong></span>
          </div>
        </div>

        <!-- Tabel Ringkasan Monitoring Per Kelompok -->
        <div style="max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead style="background:var(--bg);position:sticky;top:0;z-index:5;border-bottom:2px solid #cbd5e1;">
              <tr>
                <th style="padding:8px 10px;text-align:left;">Desa &amp; Kelompok</th>
                <th style="padding:8px 10px;text-align:center;">Status Jurnal</th>
                <th style="padding:8px 10px;text-align:center;">H / I / A</th>
                <th style="padding:8px 10px;text-align:left;">Materi &amp; Pengajar</th>
                <th style="padding:8px 10px;text-align:center;width:80px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${targetDesaList.map(d => {
                let dRows = `
                  <tr style="background:#e2e8f0;font-weight:800;">
                    <td colspan="5" style="padding:6px 10px;color:var(--text);">Desa ${d.nama}</td>
                  </tr>
                `;
                d.kelompok.forEach(kel => {
                  const kVal = rekapMap[kel.id] || {};
                  const h = parseInt(kVal.hadir) || 0;
                  const i = parseInt(kVal.ijin) || 0;
                  const a = parseInt(kVal.alfa) || 0;
                  const tot = h + i + a;
                  const isSubmitted = tot > 0;

                  dRows += `
                    <tr style="border-bottom:1px solid var(--border);">
                      <td style="padding:8px 10px;font-weight:700;">Kel. ${kel.nama}</td>
                      <td style="padding:8px 10px;text-align:center;white-space:nowrap;">
                        ${isSubmitted ? `
                          <span class="kbm-badge-status-done">
                            <span class="material-symbols-outlined" style="font-size:12px;">check_circle</span>
                            Sudah
                          </span>
                        ` : `
                          <span class="kbm-badge-status-pending">
                            <span class="material-symbols-outlined" style="font-size:12px;">pending</span>
                            Belum
                          </span>
                        `}
                      </td>
                      <td style="padding:8px 10px;text-align:center;font-weight:700;white-space:nowrap;">
                        ${isSubmitted ? `${h} / ${i} / ${a}` : '-'}
                      </td>
                      <td style="padding:8px 10px;">
                        ${isSubmitted ? `
                          <div style="font-weight:700;color:var(--text);">${kVal.materi || 'Materi KBM'}</div>
                          <div style="font-size:11px;color:var(--text-muted);">${kVal.pengajar || '-'}</div>
                        ` : '<span style="color:#94a3b8;font-style:italic;">Belum ada jurnal</span>'}
                      </td>
                      <td style="padding:8px 10px;text-align:center;">
                        <button type="button" class="btn-edit-jurnal-single" data-ev-id="${currentEvent.id}" data-kel-id="${kel.id}" title="Input/Edit Jurnal Kelompok Ini" style="padding:4px 8px;background:var(--blue-light);color:var(--blue);border:1px solid #bfdbfe;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;">
                          <span class="material-symbols-outlined" style="font-size:14px;">edit_note</span>
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  `;
                });
                return dRows;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <button type="button" id="btnJurnalKembaliAgenda2" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Kembali ke Agenda
          </button>
        </div>
      `;
    }
  }

  // ══════════════════════════════════════════════════════════════
  // TAB 3 (SUB-VIEW): FORM BUAT EVENT BARU
  // ══════════════════════════════════════════════════════════════
  const createFormHtml = `
    <!-- HIGHLIGHT INFO -->
    <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);border:1.5px solid #86efac;border-radius:10px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
      <span class="material-symbols-outlined" style="font-size:24px;color:#16a34a;flex-shrink:0;">print</span>
      <div>
        <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--green-dark);">Buat Event KBM &amp; Siapkan Lembar Absensi Cetak</h4>
        <p style="margin:2px 0 0;font-size:11.5px;color:#15803d;line-height:1.4;">
          Event akan tersimpan di agenda, siap dicetak kapan saja menggunakan data generus aktif, dan dapat langsung diisi jurnalnya pasca KBM.
        </p>
      </div>
    </div>

    <!-- FORM PENGATURAN CETAK -->
    <form id="formCetakAbsensi" style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
      
      <!-- Judul Event & Format KBM -->
      <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">
            Judul Event / Kegiatan <span style="color:red">*</span>
          </label>
          <input type="text" id="modalIptCustomJudul" value="${isKelompok ? `PENGAJIAN REMAJA KELOMPOK ${currentKelObj ? currentKelObj.nama.toUpperCase() : ''}` : (isDesa ? `PENGAJIAN REMAJA DESA ${desaObj.nama.toUpperCase()}` : 'PENGAJIAN REMAJA DAERAH SOLO SELATAN')}" placeholder="Contoh: PENGAJIAN REMAJA" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:700;color:var(--text);font-size:12.5px;" required />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">
            Format KBM <span style="color:red">*</span>
          </label>
          <select id="modalSelJenisKbm" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:700;color:#1e3a8a;font-size:12.5px;">
            <option value="remaja" selected>🎓 Remaja (SMP - Dewasa)</option>
            <option value="gp_reguler">📚 GP Reguler (SMP - SMA)</option>
            <option value="caberawit">🌱 Caberawit (PAUD - SD)</option>
          </select>
        </div>
      </div>

      <!-- Hari, Tanggal & Jam Pelaksanaan -->
      <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Hari, Tanggal Pelaksanaan</label>
          <input type="text" id="modalIptHariTanggal" placeholder="Contoh: Selasa, 20 Januari 2026" value="Selasa, 20 Januari 2026" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-size:12px;" />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Waktu / Jam KBM</label>
          <input type="text" id="modalIptJam" placeholder="Contoh: 19.30 – 21.00 WIB" value="19.30 – 21.00 WIB" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-size:12px;" />
        </div>
      </div>

      <!-- Wilayah: Desa & Kelompok -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Desa</label>
          <select id="modalSelDesa" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12.5px;">
            ${buildDesaOptions(isDaerah ? 'all' : currentDesaId)}
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Kelompok</label>
          <select id="modalSelKelompok" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12.5px;">
            ${buildKelOptions(isDaerah ? 'all' : currentDesaId, isKelompok ? currentKelId : 'all')}
          </select>
        </div>
      </div>

      <!-- Pemisahan Gender & Baris Kosong -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Pemisahan Gender</label>
          <select id="modalSelGender" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12.5px;">
            <option value="pisah" selected>🚻 Pisah Lembar (Putra &amp; Putri)</option>
            <option value="L">👦 Khusus Putra Saja</option>
            <option value="P">👧 Khusus Putri Saja</option>
            <option value="gabung">👥 Gabung (Putra &amp; Putri)</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Format Baris Kosong</label>
          <select id="modalSelBarisKosong" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-size:12.5px;">
            <option value="fill30" selected>Penuhi Halaman (Maks. 30 Baris)</option>
            <option value="0">0 (Pas Jumlah Generus)</option>
            <option value="3">+3 Baris Kosong</option>
            <option value="5">+5 Baris Kosong</option>
            <option value="10">+10 Baris Kosong</option>
          </select>
        </div>
      </div>

      <!-- Bulan & Tahun Presensi -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Bulan Presensi</label>
          <select id="modalSelBulan" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12.5px;">
            <option value="JANUARI">JANUARI</option>
            <option value="FEBRUARI">FEBRUARI</option>
            <option value="MARET">MARET</option>
            <option value="APRIL">APRIL</option>
            <option value="MEI">MEI</option>
            <option value="JUNI">JUNI</option>
            <option value="JULI">JULI</option>
            <option value="AGUSTUS">AGUSTUS</option>
            <option value="SEPTEMBER" selected>SEPTEMBER</option>
            <option value="OKTOBER">OKTOBER</option>
            <option value="NOVEMBER">NOVEMBER</option>
            <option value="DESEMBER">DESEMBER</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Tahun</label>
          <input type="text" id="modalIptTahun" value="2026" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12.5px;" />
        </div>
      </div>

      <input type="hidden" id="modalSelUrutan" value="official" />

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" id="btnBatalKeAgenda" class="btn-sticky-back" title="Kembali ke Agenda">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Agenda</span>
        </button>
        <button type="button" id="btnCetakLangsungTanpaSimpan" class="btn-sticky-print" title="Cetak Saja">
          <span class="material-symbols-outlined">print</span>
          <span class="btn-text">Cetak Saja</span>
        </button>
        <button type="submit" id="btnSubmitEventKbm" class="btn-sticky-save" title="Simpan Event KBM">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">Simpan Event KBM</span>
        </button>
      </div>
    </form>
  `;

  // ── RENDER CONTAINER MODAL ──
  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${activeTab !== 'create_event' ? tabHeaderHtml : ''}
      <div id="tabContentContainer">
        ${activeTab === 'agenda' ? agendaContentHtml : (activeTab === 'jurnal' ? jurnalContentHtml : createFormHtml)}
      </div>
    </div>
  `;

  const modalSize = (activeTab === 'create_event') ? 'medium' : 'wide';
  openModal('Manajemen Event KBM & Presensi Cepat', 'event_available', modalHtml, modalSize);

  // ══════════════════════════════════════════════════════════════
  // EVENT LISTENERS & LOGIC BINDINGS
  // ══════════════════════════════════════════════════════════════

  // 1. Tab Switching
  document.getElementById('tabBtnAgenda')?.addEventListener('click', () => {
    renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode });
  });
  document.getElementById('tabBtnJurnal')?.addEventListener('click', () => {
    renderCetakAbsensiModal('jurnal', { filterDesa, filterKel, filterFormat, selectedEventId });
  });

  // 2. Open Create Event Form
  document.getElementById('btnBukaCreateEvent')?.addEventListener('click', () => {
    renderCetakAbsensiModal('create_event', { filterDesa, filterKel, filterFormat });
  });
  document.getElementById('btnEmptyCreateEvent')?.addEventListener('click', () => {
    renderCetakAbsensiModal('create_event', { filterDesa, filterKel, filterFormat });
  });
  document.getElementById('btnJurnalToAgenda')?.addEventListener('click', () => {
    renderCetakAbsensiModal('agenda');
  });

  // 3. Tab 1 Filter Listeners
  if (activeTab === 'agenda') {
    document.getElementById('kbmFilterDesa')?.addEventListener('change', (e) => {
      renderCetakAbsensiModal('agenda', {
        filterDesa: e.target.value,
        filterKel: 'all',
        filterFormat,
        scopeMode
      });
    });

    document.getElementById('kbmFilterKelompok')?.addEventListener('change', (e) => {
      renderCetakAbsensiModal('agenda', {
        filterDesa,
        filterKel: e.target.value,
        filterFormat,
        scopeMode
      });
    });

    document.getElementById('kbmFilterFormat')?.addEventListener('change', (e) => {
      renderCetakAbsensiModal('agenda', {
        filterDesa,
        filterKel,
        filterFormat: e.target.value,
        scopeMode
      });
    });

    document.getElementById('btnScopeKelompok')?.addEventListener('click', () => {
      renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode: 'kelompok_only' });
    });

    document.getElementById('btnScopeDesa')?.addEventListener('click', () => {
      renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode: 'desa_all' });
    });

    // Action: Cetak Lembar Presensi
    document.querySelectorAll('.btn-action-cetak-absensi').forEach(btn => {
      btn.addEventListener('click', () => {
        const evId = btn.getAttribute('data-ev-id');
        window.open(`../laporan/cetak-absensi.html?eventId=${encodeURIComponent(evId)}`, '_blank');
      });
    });

    // Action: Isi Jurnal
    document.querySelectorAll('.btn-action-isi-jurnal').forEach(btn => {
      btn.addEventListener('click', () => {
        const evId = btn.getAttribute('data-ev-id');
        renderCetakAbsensiModal('jurnal', { selectedEventId: evId });
      });
    });

    // Action: Cetak Laporan PDF
    document.querySelectorAll('.btn-action-cetak-laporan').forEach(btn => {
      btn.addEventListener('click', () => {
        const evId = btn.getAttribute('data-ev-id');
        window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(evId)}`, '_blank');
      });
    });

    // Action: Hapus Event
    document.querySelectorAll('.btn-action-hapus-event').forEach(btn => {
      btn.addEventListener('click', () => {
        const evId = btn.getAttribute('data-ev-id');
        const judul = btn.getAttribute('data-judul') || 'Event KBM';
        showConfirmModal({
          title: 'Hapus Event KBM',
          message: `Apakah Anda yakin ingin menghapus "${judul}" dari daftar event tersimpan?`,
          icon: 'delete',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          confirmText: 'Ya, Hapus',
          confirmBtnColor: 'var(--red)',
          onConfirm: async () => {
            await deleteKbmEvent(evId);
            showToast('Event berhasil dihapus', 'success');
            renderCetakAbsensiModal('agenda');
          }
        });
      });
    });
  }

  // 4. Tab 2 Jurnal Listeners
  if (activeTab === 'jurnal' && currentEvent) {
    // Dropdown change event
    document.getElementById('selJurnalEventId')?.addEventListener('change', (e) => {
      renderCetakAbsensiModal('jurnal', { selectedEventId: e.target.value });
    });

    document.getElementById('btnJurnalPreviewPdf')?.addEventListener('click', () => {
      window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(currentEvent.id)}`, '_blank');
    });

    document.getElementById('btnJurnalKembaliAgenda')?.addEventListener('click', () => {
      renderCetakAbsensiModal('agenda');
    });
    document.getElementById('btnJurnalKembaliAgenda2')?.addEventListener('click', () => {
      renderCetakAbsensiModal('agenda');
    });

    // Pamong Kelompok Form
    if (isKelompok) {
      const iptH = document.getElementById('iptJurnalHadir');
      const iptI = document.getElementById('iptJurnalIjin');
      const iptA = document.getElementById('iptJurnalAlfa');
      const txtTot = document.getElementById('txtJurnalTotal');
      const txtPctA = document.getElementById('txtJurnalPctAlfa');

      function updateJurnalSummary() {
        const h = parseInt(iptH?.value) || 0;
        const i = parseInt(iptI?.value) || 0;
        const a = parseInt(iptA?.value) || 0;
        const tot = h + i + a;
        const pctA = tot > 0 ? ((a / tot) * 100).toFixed(1) : '0.0';
        if (txtTot) txtTot.textContent = tot;
        if (txtPctA) {
          txtPctA.textContent = `(${pctA}%)`;
          if (parseFloat(pctA) >= 13.0) {
            txtPctA.style.background = '#fef08a';
            txtPctA.style.color = '#854d0e';
            txtPctA.style.fontWeight = '800';
          } else {
            txtPctA.style.background = 'transparent';
            txtPctA.style.color = 'var(--text-muted)';
            txtPctA.style.fontWeight = 'normal';
          }
        }
      }

      iptH?.addEventListener('input', updateJurnalSummary);
      iptI?.addEventListener('input', updateJurnalSummary);
      iptA?.addEventListener('input', updateJurnalSummary);

      let isSavingJurnal = false;
      document.getElementById('formJurnalKelompok')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSavingJurnal) return;
        isSavingJurnal = true;

        const btnSubmit = document.getElementById('btnSubmitJurnalKelompok');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span> Menyimpan Jurnal...`;
        }

        const h = parseInt(iptH?.value) || 0;
        const i = parseInt(iptI?.value) || 0;
        const a = parseInt(iptA?.value) || 0;
        const materi = document.getElementById('iptJurnalMateri')?.value.trim() || '';
        const pengajar = document.getElementById('iptJurnalPengajar')?.value.trim() || '';
        const catatan = document.getElementById('iptJurnalCatatan')?.value.trim() || '';

        const rekap = { ...(currentEvent.rekap_kehadiran || {}) };
        rekap[currentKelId] = {
          hadir: h,
          ijin: i,
          alfa: a,
          materi,
          pengajar,
          catatan,
          updated_at: new Date().toISOString()
        };

        await saveKbmEvent({
          ...currentEvent,
          rekap_kehadiran: rekap
        });

        showToast('Jurnal kegiatan KBM berhasil disimpan!', 'success');
        setTimeout(() => {
          isSavingJurnal = false;
          renderCetakAbsensiModal('jurnal', { selectedEventId: currentEvent.id });
        }, 300);
      });
    } else {
      // Pengurus Daerah / Desa
      document.querySelectorAll('.btn-edit-jurnal-single').forEach(btn => {
        btn.addEventListener('click', () => {
          const evId = btn.getAttribute('data-ev-id');
          const kelId = btn.getAttribute('data-kel-id');
          renderFormRekapKehadiranModal(evId, kelId);
        });
      });

      document.getElementById('btnBukaMatrixLengkap')?.addEventListener('click', () => {
        renderFormRekapKehadiranModal(currentEvent.id);
      });
    }
  }

  // 5. Create Event Subview Listeners
  if (activeTab === 'create_event') {
    const selDesaEl = document.getElementById('modalSelDesa');
    const selKelEl = document.getElementById('modalSelKelompok');
    selDesaEl?.addEventListener('change', () => {
      selKelEl.innerHTML = buildKelOptions(selDesaEl.value, 'all');
    });

    document.getElementById('btnBatalKeAgenda')?.addEventListener('click', () => {
      renderCetakAbsensiModal('agenda');
    });

    document.getElementById('btnCetakLangsungTanpaSimpan')?.addEventListener('click', () => {
      const jenjangVal = document.getElementById('modalSelJenisKbm').value;
      const desaVal = document.getElementById('modalSelDesa').value;
      const kelVal = document.getElementById('modalSelKelompok').value;
      const genderVal = document.getElementById('modalSelGender').value;
      const judulVal = document.getElementById('modalIptCustomJudul').value.trim();
      const bulanVal = document.getElementById('modalSelBulan').value;
      const tahunVal = document.getElementById('modalIptTahun').value.trim() || '2026';
      const urutanVal = document.getElementById('modalSelUrutan').value;
      const barisVal = document.getElementById('modalSelBarisKosong').value;

      const targetUrl = `../laporan/cetak-absensi.html?jenjang=${encodeURIComponent(jenjangVal)}&desa=${encodeURIComponent(desaVal)}&kelompok=${encodeURIComponent(kelVal)}&gender=${encodeURIComponent(genderVal)}&judul=${encodeURIComponent(judulVal)}&bulan=${encodeURIComponent(bulanVal)}&tahun=${encodeURIComponent(tahunVal)}&urutan=${encodeURIComponent(urutanVal)}&baris=${encodeURIComponent(barisVal)}`;
      window.open(targetUrl, '_blank');
    });

    let isSavingEventKbm = false;
    document.getElementById('formCetakAbsensi')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSavingEventKbm) return;
      isSavingEventKbm = true;

      const btnSubmit = document.getElementById('btnSubmitEventKbm');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span> Menyimpan Event...`;
      }

      const jenjangVal = document.getElementById('modalSelJenisKbm').value;
      const desaVal = document.getElementById('modalSelDesa').value;
      const kelVal = document.getElementById('modalSelKelompok').value;
      const genderVal = document.getElementById('modalSelGender').value;
      const judulVal = document.getElementById('modalIptCustomJudul').value.trim() || 'REKAP KEHADIRAN PENGAJIAN REMAJA';
      const hariTglVal = document.getElementById('modalIptHariTanggal').value.trim() || 'Selasa, 20 Januari 2026';
      const jamVal = document.getElementById('modalIptJam').value.trim() || '19.30 – 21.00 WIB';
      const bulanVal = document.getElementById('modalSelBulan').value;
      const tahunVal = document.getElementById('modalIptTahun').value.trim() || '2026';
      const urutanVal = document.getElementById('modalSelUrutan').value;
      const barisVal = document.getElementById('modalSelBarisKosong').value;

      const newEvent = await saveKbmEvent({
        judul: judulVal,
        subjudul: 'KEPENGURUSAN REMAJA DAERAH SOLO SELATAN',
        format_kbm: jenjangVal,
        desa_id: desaVal,
        kelompok_id: kelVal,
        gender: genderVal,
        hari_tanggal: hariTglVal,
        jam: jamVal,
        bulan: bulanVal,
        tahun: tahunVal,
        sesi_kelas: [
          {
            kelas: '1 SMP - DEWASA',
            tempat: 'Masjid Lt. 1',
            materi: 'Materi KBM Pengajian',
            penasehat: 'Penasehat KBM'
          }
        ],
        rekap_kehadiran: {}
      });

      showToast('Event KBM berhasil disimpan!', 'success');

      // Buka Cetak Lembar Presensi
      const targetUrl = `../laporan/cetak-absensi.html?eventId=${encodeURIComponent(newEvent.id)}&jenjang=${encodeURIComponent(jenjangVal)}&desa=${encodeURIComponent(desaVal)}&kelompok=${encodeURIComponent(kelVal)}&gender=${encodeURIComponent(genderVal)}&judul=${encodeURIComponent(judulVal)}&bulan=${encodeURIComponent(bulanVal)}&tahun=${encodeURIComponent(tahunVal)}&urutan=${encodeURIComponent(urutanVal)}&baris=${encodeURIComponent(barisVal)}`;
      window.open(targetUrl, '_blank');

      setTimeout(() => {
        isSavingEventKbm = false;
        renderCetakAbsensiModal('agenda');
      }, 300);
    });
  }

  document.querySelector('.btn-cancel-modal')?.addEventListener('click', closeModal);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM ISIAN REKAPITULASI KEHADIRAN KBM (MATRIX MULTI-KELOMPOK / SINGLE)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderFormRekapKehadiranModal(eventId, targetKelId = null) {
  const event = getKbmEventById(eventId);
  if (!event) {
    showToast('Event KBM tidak ditemukan', 'error');
    renderCetakAbsensiModal('agenda');
    return;
  }

  // Jika targetKelId diberikan, buka form jurnal fokus kelompok tersebut
  if (targetKelId) {
    renderSingleKelompokEditModal(event, targetKelId);
    return;
  }

  // Sesi Kelas
  let currentSesiList = (event.sesi_kelas && event.sesi_kelas.length > 0)
    ? JSON.parse(JSON.stringify(event.sesi_kelas))
    : [{ kelas: '1 SMP - DEWASA', tempat: 'Masjid Lt. 1', materi: 'Seminar Senkom Kota', penasehat: 'Bp. Abdul Aziz , S.Kom., M.Cs.' }];

  // Wilayah scoping for rekap table
  let scopedDesa = MASTER_WILAYAH.desa;
  let wilayahRekapLabel = '27 Kelompok Solo Selatan';

  if (currentUser.tingkatan === 'desa') {
    scopedDesa = MASTER_WILAYAH.desa.filter(d => d.id === currentUser.desaId);
    wilayahRekapLabel = `Desa ${scopedDesa[0]?.nama || ''}`;
  } else if (event.kelompok_id && event.kelompok_id !== 'all') {
    scopedDesa = MASTER_WILAYAH.desa
      .map(d => ({
        ...d,
        kelompok: d.kelompok.filter(k => k.id === event.kelompok_id)
      }))
      .filter(d => d.kelompok.length > 0);
    const kelObj = scopedDesa[0]?.kelompok[0];
    if (kelObj) {
      wilayahRekapLabel = `Kelompok ${kelObj.nama} (Desa ${scopedDesa[0].nama})`;
    }
  } else if (event.desa_id && event.desa_id !== 'all') {
    scopedDesa = MASTER_WILAYAH.desa.filter(d => d.id === event.desa_id);
    if (scopedDesa[0]) {
      wilayahRekapLabel = `Desa ${scopedDesa[0].nama}`;
    }
  }

  const currentRekap = event.rekap_kehadiran ? JSON.parse(JSON.stringify(event.rekap_kehadiran)) : {};

  function buildSesiRowsHtml(list) {
    return list.map((s, idx) => `
      <tr data-sesi-idx="${idx}">
        <td style="padding:6px;"><input type="text" class="ipt-sesi-kelas" value="${s.kelas || ''}" placeholder="misal: 1 SMP - 3 SMP" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-tempat" value="${s.tempat || ''}" placeholder="misal: Masjid Lt. 1" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-materi" value="${s.materi || ''}" placeholder="misal: Seminar Senkom" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-penasehat" value="${s.penasehat || ''}" placeholder="misal: Bp. Abdul Aziz" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;" /></td>
        <td style="padding:6px;text-align:center;">
          <button type="button" class="btn-hapus-sesi" data-idx="${idx}" title="Hapus Baris Kelas" style="background:var(--red-light);color:#ef4444;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">
            <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
      
      <!-- HEADER INFO -->
      <div style="background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <span style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;">Matrix Isian Rekapitulasi Kehadiran (${wilayahRekapLabel})</span>
          <h3 style="margin:2px 0 0;font-size:15px;color:var(--text);font-weight:800;">${event.judul || 'Rekap Kehadiran'}</h3>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" id="btnBukaCetakLaporanLangsung" style="padding:7px 12px;background:#fdf2f8;color:#db2777;border:1.5px solid #fbcfe8;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">print</span>
            Preview Laporan PDF
          </button>
        </div>
      </div>

      <!-- FORM SESI & WAKTU -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Hari, Tanggal</label>
          <input type="text" id="iptRekapHariTgl" value="${event.hari_tanggal || 'Selasa, 20 Januari 2026'}" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12.5px;font-weight:600;" />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Waktu / Jam KBM</label>
          <input type="text" id="iptRekapJam" value="${event.jam || '19.30 – 21.00 WIB'}" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12.5px;font-weight:600;" />
        </div>
      </div>

      <!-- TABEL SESI KELAS & MATERI -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);">Pembagian Kelas, Tempat, Materi &amp; Penasehat</h4>
          </div>
          <button type="button" id="btnTambahBarisSesi" style="padding:6px 12px;background:#e0f2fe;color:var(--blue);border:1px solid #bae6fd;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:15px;">add</span>
            Tambah Baris Kelas
          </button>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f1f5f9;border-bottom:1.5px solid var(--border);">
                <th style="padding:6px 8px;text-align:left;width:24%;">Kelas</th>
                <th style="padding:6px 8px;text-align:left;width:22%;">Tempat</th>
                <th style="padding:6px 8px;text-align:left;width:24%;">Materi</th>
                <th style="padding:6px 8px;text-align:left;width:24%;">Penasehat / Pengisi</th>
                <th style="padding:6px 8px;text-align:center;width:6%;">Aksi</th>
              </tr>
            </thead>
            <tbody id="tbodyFormSesi">
              ${buildSesiRowsHtml(currentSesiList)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TABEL REKAP KEHADIRAN SESUAI WILAYAH -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;">
        <div style="margin-bottom:8px;">
          <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);">Input Angka Hadir, Ijin &amp; Alfa (${wilayahRekapLabel})</h4>
          <span style="font-size:11px;color:var(--text-muted);">
            Total &amp; Prosentase terhitung otomatis secara real-time. Kolom Alfa &ge; 13% otomatis berwarna kuning.
          </span>
        </div>

        <div style="max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;" id="tableInputRekap">
            <thead>
              <tr style="background:var(--bg);position:sticky;top:0;z-index:2;border-bottom:2px solid var(--border);">
                <th style="padding:6px 8px;text-align:left;width:22%;">Kelompok</th>
                <th style="padding:6px 4px;text-align:center;width:11%;">Hadir</th>
                <th style="padding:6px 4px;text-align:center;width:11%;">Ijin</th>
                <th style="padding:6px 4px;text-align:center;width:11%;">Alfa</th>
                <th style="padding:6px 4px;text-align:center;width:11%;background:#f1f5f9;">Total</th>
                <th style="padding:6px 4px;text-align:center;width:11%;">% Hadir</th>
                <th style="padding:6px 4px;text-align:center;width:11%;">% Ijin</th>
                <th style="padding:6px 4px;text-align:center;width:12%;">% Alfa</th>
              </tr>
            </thead>
            <tbody>
              ${scopedDesa.map(d => {
                let desaRows = `
                  <tr style="background:#e2e8f0;font-weight:800;">
                    <td colspan="8" style="padding:5px 8px;color:var(--text);">Desa ${d.nama}</td>
                  </tr>
                `;
                d.kelompok.forEach(kel => {
                  const kVal = currentRekap[kel.id] || { hadir: 0, ijin: 0, alfa: 0 };
                  const h = parseInt(kVal.hadir) || 0;
                  const i = parseInt(kVal.ijin) || 0;
                  const a = parseInt(kVal.alfa) || 0;
                  const tot = h + i + a;
                  const pH = tot > 0 ? ((h / tot) * 100).toFixed(2) : '0.00';
                  const pI = tot > 0 ? ((i / tot) * 100).toFixed(2) : '0.00';
                  const pA = tot > 0 ? ((a / tot) * 100).toFixed(2) : '0.00';
                  const isHigh = parseFloat(pA) >= 13.0;

                  desaRows += `
                    <tr class="row-kelompok-input" data-kel-id="${kel.id}" data-desa-id="${d.id}" style="border-bottom:1px solid #f1f5f9;">
                      <td style="padding:4px 8px;font-weight:600;">${kel.nama}</td>
                      <td style="padding:2px 4px;text-align:center;">
                        <input type="number" min="0" class="ipt-hadir" data-kel="${kel.id}" value="${h}" style="width:100%;max-width:60px;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:12px;font-weight:700;" />
                      </td>
                      <td style="padding:2px 4px;text-align:center;">
                        <input type="number" min="0" class="ipt-ijin" data-kel="${kel.id}" value="${i}" style="width:100%;max-width:60px;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:12px;font-weight:700;" />
                      </td>
                      <td style="padding:2px 4px;text-align:center;">
                        <input type="number" min="0" class="ipt-alfa" data-kel="${kel.id}" value="${a}" style="width:100%;max-width:60px;padding:4px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:12px;font-weight:700;" />
                      </td>
                      <td class="cell-tot" id="tot_${kel.id}" style="padding:4px;text-align:center;font-weight:800;background:var(--bg);">${tot}</td>
                      <td class="cell-pct-h" id="pct_h_${kel.id}" style="padding:4px;text-align:center;font-size:11px;">${pH}%</td>
                      <td class="cell-pct-i" id="pct_i_${kel.id}" style="padding:4px;text-align:center;font-size:11px;">${pI}%</td>
                      <td class="cell-pct-a" id="pct_a_${kel.id}" style="padding:4px;text-align:center;font-size:11px;${isHigh ? 'background:#fef08a;font-weight:800;' : ''}">${pA}%</td>
                    </tr>
                  `;
                });

                desaRows += `
                  <tr class="subtotal-desa-row" id="subtotal_row_${d.id}" style="background:var(--surface)beb;font-weight:800;border-bottom:1.5px solid #cbd5e1;">
                    <td style="padding:5px 8px;">Subtotal Desa ${d.nama}</td>
                    <td style="text-align:center;" id="sub_h_${d.id}">0</td>
                    <td style="text-align:center;" id="sub_i_${d.id}">0</td>
                    <td style="text-align:center;" id="sub_a_${d.id}">0</td>
                    <td style="text-align:center;" id="sub_tot_${d.id}">0</td>
                    <td style="text-align:center;font-size:11px;" id="sub_pct_h_${d.id}">0.00%</td>
                    <td style="text-align:center;font-size:11px;" id="sub_pct_i_${d.id}">0.00%</td>
                    <td style="text-align:center;font-size:11px;" id="sub_pct_a_${d.id}">0.00%</td>
                  </tr>
                `;

                return desaRows;
              }).join('')}

              <tr id="grandTotalRow" style="background:#fef08a;font-weight:900;position:sticky;bottom:0;border-top:2px solid #000;font-size:12.5px;">
                <td style="padding:7px 8px;">TOTAL (${wilayahRekapLabel.toUpperCase()})</td>
                <td style="text-align:center;" id="grand_h">0</td>
                <td style="text-align:center;" id="grand_i">0</td>
                <td style="text-align:center;" id="grand_a">0</td>
                <td style="text-align:center;" id="grand_tot">0</td>
                <td style="text-align:center;" id="grand_pct_h">0.00%</td>
                <td style="text-align:center;" id="grand_pct_i">0.00%</td>
                <td style="text-align:center;" id="grand_pct_a">0.00%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" id="btnBackToJurnalTab" class="btn-sticky-back" title="Kembali ke Jurnal">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Jurnal</span>
        </button>
        <button type="button" id="btnSimpanDanCetakLaporan" class="btn-sticky-print" title="Simpan &amp; Cetak PDF">
          <span class="material-symbols-outlined">print</span>
          <span class="btn-text">Simpan &amp; Cetak PDF</span>
        </button>
        <button type="button" id="btnSimpanRekap" class="btn-sticky-save" title="Simpan Laporan Kehadiran">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">Simpan Laporan</span>
        </button>
      </div>
    </div>
  `;

  openModal('Matrix Isian Rekapitulasi Kehadiran', 'edit_calendar', modalHtml, 'wide');

  document.getElementById('btnBackToJurnalTab')?.addEventListener('click', () => {
    renderCetakAbsensiModal('jurnal', { selectedEventId: event.id });
  });

  document.getElementById('btnBukaCetakLaporanLangsung')?.addEventListener('click', () => {
    window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(event.id)}`, '_blank');
  });

  const tbodySesi = document.getElementById('tbodyFormSesi');
  function bindSesiEvents() {
    document.querySelectorAll('.btn-hapus-sesi').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        currentSesiList.splice(idx, 1);
        tbodySesi.innerHTML = buildSesiRowsHtml(currentSesiList);
        bindSesiEvents();
      };
    });
  }
  bindSesiEvents();

  document.getElementById('btnTambahBarisSesi')?.addEventListener('click', () => {
    currentSesiList.push({ kelas: '', tempat: '', materi: '', penasehat: '' });
    tbodySesi.innerHTML = buildSesiRowsHtml(currentSesiList);
    bindSesiEvents();
  });

  function recalculateAllRekap() {
    let grandHadir = 0, grandIjin = 0, grandAlfa = 0, grandTotal = 0;

    scopedDesa.forEach(desa => {
      let subH = 0, subI = 0, subA = 0, subTot = 0;

      desa.kelompok.forEach(kel => {
        const iptH = document.querySelector(`.ipt-hadir[data-kel="${kel.id}"]`);
        const iptI = document.querySelector(`.ipt-ijin[data-kel="${kel.id}"]`);
        const iptA = document.querySelector(`.ipt-alfa[data-kel="${kel.id}"]`);

        const h = parseInt(iptH?.value) || 0;
        const i = parseInt(iptI?.value) || 0;
        const a = parseInt(iptA?.value) || 0;
        const tot = h + i + a;

        subH += h;
        subI += i;
        subA += a;
        subTot += tot;

        const cellTot = document.getElementById(`tot_${kel.id}`);
        const cellPctH = document.getElementById(`pct_h_${kel.id}`);
        const cellPctI = document.getElementById(`pct_i_${kel.id}`);
        const cellPctA = document.getElementById(`pct_a_${kel.id}`);

        if (cellTot) cellTot.textContent = tot;
        const pctH = tot > 0 ? ((h / tot) * 100).toFixed(2) : '0.00';
        const pctI = tot > 0 ? ((i / tot) * 100).toFixed(2) : '0.00';
        const pctA = tot > 0 ? ((a / tot) * 100).toFixed(2) : '0.00';

        if (cellPctH) cellPctH.textContent = `${pctH}%`;
        if (cellPctI) cellPctI.textContent = `${pctI}%`;
        if (cellPctA) {
          cellPctA.textContent = `${pctA}%`;
          if (parseFloat(pctA) >= 13.0) {
            cellPctA.style.background = '#fef08a';
            cellPctA.style.fontWeight = '800';
          } else {
            cellPctA.style.background = 'transparent';
            cellPctA.style.fontWeight = 'normal';
          }
        }
      });

      const subTotH = document.getElementById(`sub_h_${desa.id}`);
      const subTotI = document.getElementById(`sub_i_${desa.id}`);
      const subTotA = document.getElementById(`sub_a_${desa.id}`);
      const subTotCell = document.getElementById(`sub_tot_${desa.id}`);
      const subPctHCell = document.getElementById(`sub_pct_h_${desa.id}`);
      const subPctICell = document.getElementById(`sub_pct_i_${desa.id}`);
      const subPctACell = document.getElementById(`sub_pct_a_${desa.id}`);

      if (subTotH) subTotH.textContent = subH;
      if (subTotI) subTotI.textContent = subI;
      if (subTotA) subTotA.textContent = subA;
      if (subTotCell) subTotCell.textContent = subTot;

      const subPctH = subTot > 0 ? ((subH / subTot) * 100).toFixed(2) : '0.00';
      const subPctI = subTot > 0 ? ((subI / subTot) * 100).toFixed(2) : '0.00';
      const subPctA = subTot > 0 ? ((subA / subTot) * 100).toFixed(2) : '0.00';

      if (subPctHCell) subPctHCell.textContent = `${subPctH}%`;
      if (subPctICell) subPctICell.textContent = `${subPctI}%`;
      if (subPctACell) {
        subPctACell.textContent = `${subPctA}%`;
        if (parseFloat(subPctA) >= 13.0) {
          subPctACell.style.background = '#fef08a';
          subPctACell.style.fontWeight = '800';
        } else {
          subPctACell.style.background = 'transparent';
          subPctACell.style.fontWeight = 'bold';
        }
      }

      grandHadir += subH;
      grandIjin += subI;
      grandAlfa += subA;
      grandTotal += subTot;
    });

    const gH = document.getElementById('grand_h');
    const gI = document.getElementById('grand_i');
    const gA = document.getElementById('grand_a');
    const gTot = document.getElementById('grand_tot');
    const gPctH = document.getElementById('grand_pct_h');
    const gPctI = document.getElementById('grand_pct_i');
    const gPctA = document.getElementById('grand_pct_a');

    if (gH) gH.textContent = grandHadir;
    if (gI) gI.textContent = grandIjin;
    if (gA) gA.textContent = grandAlfa;
    if (gTot) gTot.textContent = grandTotal;

    const grandPctH = grandTotal > 0 ? ((grandHadir / grandTotal) * 100).toFixed(2) : '0.00';
    const grandPctI = grandTotal > 0 ? ((grandIjin / grandTotal) * 100).toFixed(2) : '0.00';
    const grandPctA = grandTotal > 0 ? ((grandAlfa / grandTotal) * 100).toFixed(2) : '0.00';

    if (gPctH) gPctH.textContent = `${grandPctH}%`;
    if (gPctI) gPctI.textContent = `${grandPctI}%`;
    if (gPctA) gPctA.textContent = `${grandPctA}%`;
  }

  document.querySelectorAll('.ipt-hadir, .ipt-ijin, .ipt-alfa').forEach(ipt => {
    ipt.addEventListener('input', recalculateAllRekap);
  });
  recalculateAllRekap();

  async function saveCurrentRekapData() {
    const collectedSesi = [];
    document.querySelectorAll('#tbodyFormSesi tr').forEach(tr => {
      const k = tr.querySelector('.ipt-sesi-kelas')?.value.trim() || '';
      const t = tr.querySelector('.ipt-sesi-tempat')?.value.trim() || '';
      const m = tr.querySelector('.ipt-sesi-materi')?.value.trim() || '';
      const p = tr.querySelector('.ipt-sesi-penasehat')?.value.trim() || '';
      if (k || m || p) {
        collectedSesi.push({ kelas: k, tempat: t, materi: m, penasehat: p });
      }
    });

    const collectedRekap = { ...(event.rekap_kehadiran || {}) };
    scopedDesa.forEach(d => {
      d.kelompok.forEach(kel => {
        const iptH = document.querySelector(`.ipt-hadir[data-kel="${kel.id}"]`);
        const iptI = document.querySelector(`.ipt-ijin[data-kel="${kel.id}"]`);
        const iptA = document.querySelector(`.ipt-alfa[data-kel="${kel.id}"]`);

        collectedRekap[kel.id] = {
          ...(collectedRekap[kel.id] || {}),
          hadir: parseInt(iptH?.value) || 0,
          ijin: parseInt(iptI?.value) || 0,
          alfa: parseInt(iptA?.value) || 0
        };
      });
    });

    const hariTglVal = document.getElementById('iptRekapHariTgl')?.value.trim() || event.hari_tanggal;
    const jamVal = document.getElementById('iptRekapJam')?.value.trim() || event.jam;

    const updated = await saveKbmEvent({
      ...event,
      hari_tanggal: hariTglVal,
      jam: jamVal,
      sesi_kelas: collectedSesi.length > 0 ? collectedSesi : event.sesi_kelas,
      rekap_kehadiran: collectedRekap
    });

    return updated;
  }

  document.getElementById('btnSimpanRekap')?.addEventListener('click', async () => {
    const btnSimpan = document.getElementById('btnSimpanRekap');
    if (btnSimpan) btnSimpan.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span>`;
    await saveCurrentRekapData();
    if (btnSimpan) btnSimpan.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">save</span> Simpan Rekap`;
    showToast('Rekapitulasi kehadiran KBM berhasil disimpan!', 'success');
    renderCetakAbsensiModal('jurnal', { selectedEventId: event.id });
  });

  document.getElementById('btnSimpanDanCetakLaporan')?.addEventListener('click', async () => {
    const btnSimpanCetak = document.getElementById('btnSimpanDanCetakLaporan');
    if (btnSimpanCetak) btnSimpanCetak.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span>`;
    const saved = await saveCurrentRekapData();
    if (btnSimpanCetak) btnSimpanCetak.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">print</span> Simpan & Cetak`;
    showToast('Rekapitulasi disimpan! Membuka laporan PDF...', 'success');
    window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(saved.id)}`, '_blank');
    renderCetakAbsensiModal('jurnal', { selectedEventId: saved.id });
  });
}

/* ── MODAL ISIAN JURNAL FOKUS SATU KELOMPOK (UNTUK DAERAH / DESA) ── */
function renderSingleKelompokEditModal(event, kelId) {
  const allKels = getAllKelompok();
  const kelObj = allKels.find(k => k.id === kelId);
  const kelNama = kelObj ? kelObj.nama : 'Kelompok';

  const rekap = (event.rekap_kehadiran && event.rekap_kehadiran[kelId]) || {};
  const hVal = parseInt(rekap.hadir) || 0;
  const iVal = parseInt(rekap.ijin) || 0;
  const aVal = parseInt(rekap.alfa) || 0;
  const totVal = hVal + iVal + aVal;
  const pctAlfa = totVal > 0 ? ((aVal / totVal) * 100).toFixed(1) : '0.0';
  const materiVal = rekap.materi || '';
  const pengajarVal = rekap.pengajar || '';
  const catatanVal = rekap.catatan || '';

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px 14px;">
        <span style="font-size:11px;font-weight:800;color:var(--primary);text-transform:uppercase;">Input Jurnal Kelompok</span>
        <h3 style="margin:2px 0 0;font-size:15px;color:var(--text);font-weight:800;">Kel. ${kelNama}</h3>
        <p style="margin:2px 0 0;font-size:11.5px;color:var(--text-muted);">
          ${event.judul} • ${event.hari_tanggal || '-'} (${event.jam || ''})
        </p>
      </div>

      <form id="formSingleKelompok" style="display:flex;flex-direction:column;gap:12px;">
        <!-- Rekap Angka -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1.2fr;gap:10px;align-items:center;">
          <div>
            <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:#166534;">Hadir</label>
            <input type="number" min="0" id="iptSingleHadir" value="${hVal}" style="width:100%;padding:8px;border:1.5px solid #86efac;border-radius:8px;text-align:center;font-weight:800;font-size:14px;background:#f0fdf4;" required />
          </div>
          <div>
            <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:#1e40af;">Ijin</label>
            <input type="number" min="0" id="iptSingleIjin" value="${iVal}" style="width:100%;padding:8px;border:1.5px solid #bfdbfe;border-radius:8px;text-align:center;font-weight:800;font-size:14px;background:#eff6ff;" required />
          </div>
          <div>
            <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:#991b1b;">Alfa</label>
            <input type="number" min="0" id="iptSingleAlfa" value="${aVal}" style="width:100%;padding:8px;border:1.5px solid #fecaca;border-radius:8px;text-align:center;font-weight:800;font-size:14px;background:#fef2f2;" required />
          </div>
          <div style="background:var(--bg);padding:8px 10px;border-radius:8px;border:1px solid var(--border);text-align:center;">
            <div style="font-size:11px;color:var(--text-muted);font-weight:600;">Total &amp; % Alfa</div>
            <div style="font-size:14px;font-weight:800;color:var(--text);margin-top:2px;">
              <span id="txtSingleTotal">${totVal}</span> Santri 
              <span id="txtSinglePctAlfa" style="font-size:12px;padding:2px 6px;border-radius:4px;margin-left:4px;${parseFloat(pctAlfa) >= 13.0 ? 'background:#fef08a;color:#854d0e;font-weight:800;' : 'color:var(--text-muted);'}">(${pctAlfa}%)</span>
            </div>
          </div>
        </div>

        <!-- Materi & Pengajar -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:var(--text);">Materi yang Disampaikan</label>
            <input type="text" id="iptSingleMateri" value="${materiVal}" placeholder="Materi KBM" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;" />
          </div>
          <div>
            <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:var(--text);">Pengajar / Pamong Pengisi</label>
            <input type="text" id="iptSinglePengajar" value="${pengajarVal}" placeholder="Nama Pengajar / Ustadz" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;" />
          </div>
        </div>

        <div>
          <label style="font-weight:700;font-size:12px;display:block;margin-bottom:4px;color:var(--text);">Catatan / Evaluasi</label>
          <textarea id="iptSingleCatatan" rows="3" placeholder="Materi Alqur'an dan Khadist ataupun Tema Nasehat Bisa di catat disini" style="width:100%;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;resize:vertical;">${catatanVal}</textarea>
          <span style="font-size:11px;color:var(--text-muted);display:block;margin-top:3px;">
            💡 <em>Materi Alqur'an dan Khadist ataupun Tema Nasehat Bisa di catat disini</em>
          </span>
        </div>

        <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
        <div class="modal-sticky-footer">
          <button type="button" id="btnBackToJurnalMonitoring" class="btn-sticky-back" title="Batal &amp; Kembali">
            <span class="material-symbols-outlined">arrow_back</span>
            <span class="btn-text">Batal &amp; Kembali</span>
          </button>
          <button type="submit" id="btnSaveSingleKelompok" class="btn-sticky-save" title="Simpan Jurnal">
            <span class="material-symbols-outlined">save</span>
            <span class="btn-text">Simpan Jurnal</span>
          </button>
        </div>
      </form>
    </div>
  `;

  openModal(`Jurnal KBM Kel. ${kelNama}`, 'edit_note', modalHtml, 'medium');

  document.getElementById('btnBackToJurnalMonitoring')?.addEventListener('click', () => {
    renderCetakAbsensiModal('jurnal', { selectedEventId: event.id });
  });

  const iptH = document.getElementById('iptSingleHadir');
  const iptI = document.getElementById('iptSingleIjin');
  const iptA = document.getElementById('iptSingleAlfa');
  const txtTot = document.getElementById('txtSingleTotal');
  const txtPctA = document.getElementById('txtSinglePctAlfa');

  function updateSingleSummary() {
    const h = parseInt(iptH?.value) || 0;
    const i = parseInt(iptI?.value) || 0;
    const a = parseInt(iptA?.value) || 0;
    const tot = h + i + a;
    const pctA = tot > 0 ? ((a / tot) * 100).toFixed(1) : '0.0';
    if (txtTot) txtTot.textContent = tot;
    if (txtPctA) {
      txtPctA.textContent = `(${pctA}%)`;
      if (parseFloat(pctA) >= 13.0) {
        txtPctA.style.background = '#fef08a';
        txtPctA.style.color = '#854d0e';
        txtPctA.style.fontWeight = '800';
      } else {
        txtPctA.style.background = 'transparent';
        txtPctA.style.color = 'var(--text-muted)';
        txtPctA.style.fontWeight = 'normal';
      }
    }
  }

  iptH?.addEventListener('input', updateSingleSummary);
  iptI?.addEventListener('input', updateSingleSummary);
  iptA?.addEventListener('input', updateSingleSummary);

  document.getElementById('formSingleKelompok')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveSingleKelompok');
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span>`;
    }

    const h = parseInt(iptH?.value) || 0;
    const i = parseInt(iptI?.value) || 0;
    const a = parseInt(iptA?.value) || 0;
    const materi = document.getElementById('iptSingleMateri')?.value.trim() || '';
    const pengajar = document.getElementById('iptSinglePengajar')?.value.trim() || '';
    const catatan = document.getElementById('iptSingleCatatan')?.value.trim() || '';

    const rekapMap = { ...(event.rekap_kehadiran || {}) };
    rekapMap[kelId] = {
      hadir: h,
      ijin: i,
      alfa: a,
      materi,
      pengajar,
      catatan,
      updated_at: new Date().toISOString()
    };

    await saveKbmEvent({
      ...event,
      rekap_kehadiran: rekapMap
    });

    showToast(`Jurnal Kel. ${kelNama} berhasil diperbarui!`, 'success');
    setTimeout(() => {
      renderCetakAbsensiModal('jurnal', { selectedEventId: event.id });
    }, 250);
  });
}
