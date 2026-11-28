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

import {
  openRekapAbsensiBulananModal,
  renderAbsensiBulananTab
} from './dashboard-absensi-bulanan.js';

/* ═══════════════════════════════════════════════════════════════════════════
   MODUL EVENT KBM & REKAP KEHADIRAN (MULTI-JENJANG & CETAK DOKUMEN FISIK)
   ═══════════════════════════════════════════════════════════════════════════ */

let lastAgendaOptions = {};

function getEventScopeLevel(ev) {
  if (ev.kelompok_id && ev.kelompok_id !== 'all') return 'kelompok_only';
  if (ev.desa_id && ev.desa_id !== 'all') return 'desa_all';
  return 'daerah_only';
}

export function renderCetakAbsensiModal(activeTab = 'agenda', options = {}) {
  // Jika tab rekap bulanan yang diminta, buka langsung modal khusus Laporan & Rekap Absensi Bulanan
  if (activeTab === 'rekap_bulanan') {
    openRekapAbsensiBulananModal(options);
    return;
  }
  // ── Hak Akses 3 Tingkatan ──
  const isDaerah = currentUser.tingkatan === 'daerah' || currentUser.isSuperadmin === true;
  const isDesa = currentUser.tingkatan === 'desa';
  const isKelompok = !isDaerah && !isDesa;

  const currentDesaId = currentUser.desaId || 'desa-timur-1';
  const currentKelId = currentUser.kelompokId || 'kel-gunung-wijil-1';

  // Normalisasi tab lama jika ada
  if (activeTab === 'event_list' || activeTab === 'jurnal') activeTab = 'agenda';

  const allEvents = getKbmEvents();

  // State Filter & Pagination
  const filterDesa = options.filterDesa || (isDaerah ? 'all' : currentDesaId);
  const filterKel = options.filterKel || (isKelompok ? currentKelId : 'all');
  const filterFormat = options.filterFormat || 'all';
  const isRemajaContext = Boolean(options.isRemaja) || filterFormat === 'remaja';
  const scopeMode = options.scopeMode || (isRemajaContext ? (isDaerah ? 'daerah_only' : (isDesa ? 'desa_all' : 'kelompok_only')) : (isKelompok ? 'kelompok_only' : 'all'));
  const isViewOnlyContext = Boolean(options.readOnly) || (isKelompok && scopeMode !== 'kelompok_only') || (isDesa && scopeMode === 'daerah_only');
  const requestedPage = parseInt(options.page) || 1;

  if (activeTab === 'agenda') {
    lastAgendaOptions = { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, readOnly: isViewOnlyContext, page: requestedPage };
  }

  // ── Saring Event Sesuai Hak Akses, Tingkat Kegiatan & Filter ──
  const filteredEvents = allEvents.filter(ev => {
    // Filter Format KBM
    if (filterFormat !== 'all' && ev.format_kbm !== filterFormat) {
      return false;
    }

    // Filter ketat berdasarkan Tingkat Kegiatan (Kelompok / Desa / Daerah) pada Kegiatan Remaja
    if (isRemajaContext && (scopeMode === 'kelompok_only' || scopeMode === 'desa_all' || scopeMode === 'daerah_only')) {
      const evLevel = getEventScopeLevel(ev);
      if (evLevel !== scopeMode) return false;

      if (scopeMode === 'kelompok_only') {
        if (isKelompok) return ev.kelompok_id === currentKelId;
        if (isDesa) {
          if (ev.desa_id !== currentDesaId) return false;
          if (filterKel !== 'all' && ev.kelompok_id !== filterKel) return false;
          return true;
        }
        // Daerah
        if (filterDesa !== 'all' && ev.desa_id !== filterDesa) return false;
        if (filterKel !== 'all' && ev.kelompok_id !== filterKel) return false;
        return true;
      }

      if (scopeMode === 'desa_all') {
        if (isKelompok || isDesa) return ev.desa_id === currentDesaId;
        if (filterDesa !== 'all' && ev.desa_id !== filterDesa) return false;
        return true;
      }

      // scopeMode === 'daerah_only' -> semua login bisa melihat kegiatan tingkat daerah
      return true;
    }

    // Filter Hak Akses Wilayah (Non-Remaja / Umum)
    if (isKelompok) {
      const inDesa = (ev.desa_id === 'all' || ev.desa_id === currentDesaId);
      if (!inDesa) return false;

      if (scopeMode === 'kelompok_only') {
        const isOwn = (ev.kelompok_id === currentKelId) || (ev.kelompok_id === 'all');
        if (!isOwn) return false;
      }
    } else if (isDesa) {
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

  // ══════════════════════════════════════════════════════════════
  // VIEW 1: AGENDA & CETAK ABSENSI (DENGAN PAGINATION & EDIT)
  // ══════════════════════════════════════════════════════════════
  let agendaContentHtml = '';

  const scopeLabelMap = {
    kelompok_only: 'Tingkat Kelompok',
    desa_all: 'Tingkat Desa',
    daerah_only: 'Tingkat Daerah'
  };
  const activeScopeLabel = scopeLabelMap[scopeMode] || 'Semua Tingkat';
  const createBtnLabel = isRemajaContext ? `Buat Kegiatan Remaja (${activeScopeLabel})` : 'Buat Event (KBM)';

  // ── Action Banner Buat Event / Info Hak Akses ──
  const bannerActionKbmHtml = isViewOnlyContext ? `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:12px;">
      <span class="material-symbols-outlined" style="font-size:18px;flex-shrink:0;">visibility</span>
      <span><strong>Mode Lihat &amp; Isi Jurnal:</strong> Agenda ${activeScopeLabel} dikelola pengurus ${scopeMode === 'daerah_only' ? 'Daerah' : 'Desa'}. Anda dapat mengisi jurnal serta melihat/mencetak laporan.</span>
    </div>
  ` : `
    <div class="banner-action-frame">
      <button type="button" id="btnBukaCreateEvent" class="btn-banner-action-blue" title="${createBtnLabel}">
        <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>
        <span>${createBtnLabel}</span>
      </button>
    </div>
  `;

  // Toolbar Filter
  let filterBarHtml = '';
  if (isRemajaContext) {
    const tingkatSelectHtml = `
      <select id="kbmFilterTingkat" class="kbm-select" title="Filter Tingkat Kegiatan">
        <option value="kelompok_only" ${scopeMode === 'kelompok_only' ? 'selected' : ''}>Tingkat Kelompok</option>
        <option value="desa_all" ${scopeMode === 'desa_all' ? 'selected' : ''}>Tingkat Desa</option>
        <option value="daerah_only" ${scopeMode === 'daerah_only' ? 'selected' : ''}>Tingkat Daerah</option>
      </select>
    `;
    const desaFilterHtml = (isDaerah && scopeMode !== 'daerah_only') ? `
      <select id="kbmFilterDesa" class="kbm-select" title="Filter Desa">
        ${buildDesaOptions(filterDesa)}
      </select>
    ` : (isDesa && scopeMode !== 'daerah_only' ? `
      <span style="font-size:12px;font-weight:700;background:var(--blue-light);color:var(--blue-dark);padding:6px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:16px;">domain</span>
        Desa ${desaObj.nama}
      </span>
    ` : '');
    const kelFilterHtml = ((isDaerah || isDesa) && scopeMode === 'kelompok_only') ? `
      <select id="kbmFilterKelompok" class="kbm-select" title="Filter Kelompok">
        ${buildKelOptions(isDaerah ? filterDesa : currentDesaId, filterKel)}
      </select>
    ` : (isKelompok && scopeMode === 'kelompok_only' ? `
      <span style="font-size:11.5px;font-weight:700;background:var(--green-light);color:var(--green-dark);padding:6px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:15px;">location_on</span>
        Kel. ${currentKelObj ? currentKelObj.nama : 'Kelompok Saya'}
      </span>
    ` : '');
    const daerahBadgeHtml = scopeMode === 'daerah_only' ? `
      <span style="font-size:12px;font-weight:700;background:#f3e8ff;color:#6d28d9;padding:6px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:16px;">public</span>
        Daerah Solo Selatan
      </span>
    ` : '';

    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group" style="width:100%;">
          ${tingkatSelectHtml}
          ${desaFilterHtml}
          ${kelFilterHtml}
          ${daerahBadgeHtml}
        </div>
      </div>
    `;
  } else if (isDaerah) {
    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group" style="width:100%;">
          <select id="kbmFilterDesa" class="kbm-select" title="Filter Desa">
            ${buildDesaOptions(filterDesa)}
          </select>
          <select id="kbmFilterKelompok" class="kbm-select" title="Filter Kelompok">
            ${buildKelOptions(filterDesa, filterKel)}
          </select>
          <select id="kbmFilterFormat" class="kbm-select" title="Filter Format KBM">
            <option value="all" ${filterFormat === 'all' ? 'selected' : ''}>Semua Format KBM</option>
            <option value="caberawit" ${filterFormat === 'caberawit' ? 'selected' : ''}>Caberawit</option>
            <option value="gp_reguler" ${filterFormat === 'gp_reguler' ? 'selected' : ''}>GP (Pra-remaja)</option>
            <option value="pra_nikah" ${filterFormat === 'pra_nikah' ? 'selected' : ''}>Pra Nikah (19-22 Th)</option>
            <option value="remaja" ${filterFormat === 'remaja' ? 'selected' : ''}>Remaja/Dewasa</option>
          </select>
        </div>
      </div>
    `;
  } else if (isDesa) {
    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group" style="width:100%;">
          <span style="font-size:12px;font-weight:700;background:var(--blue-light);color:var(--blue-dark);padding:4px 10px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">domain</span>
            Desa ${desaObj.nama}
          </span>
          <select id="kbmFilterKelompok" class="kbm-select" title="Filter Kelompok">
            ${buildKelOptions(currentDesaId, filterKel)}
          </select>
          <select id="kbmFilterFormat" class="kbm-select" title="Filter Format KBM">
            <option value="all" ${filterFormat === 'all' ? 'selected' : ''}>Semua Format KBM</option>
            <option value="caberawit" ${filterFormat === 'caberawit' ? 'selected' : ''}>Caberawit</option>
            <option value="gp_reguler" ${filterFormat === 'gp_reguler' ? 'selected' : ''}>GP (Pra-remaja)</option>
            <option value="pra_nikah" ${filterFormat === 'pra_nikah' ? 'selected' : ''}>Pra Nikah (19-22 Th)</option>
            <option value="remaja" ${filterFormat === 'remaja' ? 'selected' : ''}>Remaja/Dewasa</option>
          </select>
        </div>
      </div>
    `;
  } else {
    // Pamong Kelompok
    filterBarHtml = `
      <div class="kbm-filter-bar">
        <div class="kbm-filter-group" style="width:100%;">
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
            <option value="caberawit" ${filterFormat === 'caberawit' ? 'selected' : ''}>Caberawit</option>
            <option value="gp_reguler" ${filterFormat === 'gp_reguler' ? 'selected' : ''}>GP (Pra-remaja)</option>
            <option value="pra_nikah" ${filterFormat === 'pra_nikah' ? 'selected' : ''}>Pra Nikah (19-22 Th)</option>
            <option value="remaja" ${filterFormat === 'remaja' ? 'selected' : ''}>Remaja/Dewasa</option>
          </select>
        </div>
      </div>
    `;
  }

  // ── Perhitungan Pagination ──
  const totalEvents = filteredEvents.length;
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(totalEvents / pageSize));
  let currentPage = requestedPage;
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const paginatedEvents = filteredEvents.slice(startIdx, startIdx + pageSize);

  if (totalEvents === 0) {
    agendaContentHtml = `
      ${bannerActionKbmHtml}
      ${filterBarHtml}
      <div style="text-align:center;padding:40px 20px;background:var(--bg);border-radius:12px;border:1.5px dashed var(--border);">
        <span class="material-symbols-outlined" style="font-size:48px;color:#94a3b8;margin-bottom:8px;">event_busy</span>
        <h4 style="margin:0;font-size:14px;color:var(--text);font-weight:800;">${isRemajaContext ? `Belum Ada Kegiatan Remaja (${activeScopeLabel})` : 'Tidak Ada Event KBM yang Cocok'}</h4>
        <p style="margin:4px 0 16px;font-size:12px;color:var(--text-muted);">
          Belum ada kegiatan pada filter ini.
        </p>
        ${!isViewOnlyContext ? `
          <button type="button" id="btnEmptyCreateEvent" class="btn-banner-action-blue" style="max-width:280px;margin:0 auto;" title="${createBtnLabel}">
            <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>
            <span>${createBtnLabel}</span>
          </button>
        ` : ''}
      </div>
    `;
  } else {
    // ── Render Desktop Table & Mobile Cards ──
    const rowsDesktopHtml = paginatedEvents.map((ev, idx) => {
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
          totalHadir += (parseInt(k.hadir) || 0);
        });
        hasRekap = totAll > 0;
      }

      let formatBadge = 'badge-primary';
      let formatName = 'Remaja/Dewasa';
      let formatStyle = 'background:#f3e8ff;color:#7c3aed;';
      if (ev.format_kbm === 'caberawit') {
        formatBadge = 'badge-amber';
        formatName = 'Caberawit';
        formatStyle = 'background:#fef3c7;color:#b45309;';
      } else if (ev.format_kbm === 'gp_reguler') {
        formatBadge = 'badge-info';
        formatName = 'GP (Pra-remaja)';
        formatStyle = 'background:#dbeafe;color:#1d4ed8;';
      } else if (ev.format_kbm === 'pra_nikah') {
        formatBadge = 'badge-pink';
        formatName = 'Pra Nikah (19-22 Th)';
        formatStyle = 'background:#fce7f3;color:#be185d;';
      }

      let wilayahLabel = 'Solo Selatan';
      if (ev.kelompok_id && ev.kelompok_id !== 'all') {
        const foundKel = allKels.find(k => k.id === ev.kelompok_id);
        wilayahLabel = foundKel ? `Kel. ${foundKel.nama}` : 'Kelompok';
      } else if (ev.desa_id && ev.desa_id !== 'all') {
        const foundDesa = desaList.find(d => d.id === ev.desa_id);
        wilayahLabel = foundDesa ? `Desa ${foundDesa.nama}` : 'Desa';
      }

      let canManage = !isViewOnlyContext;
      let isReadOnly = isViewOnlyContext;
      if (isKelompok && ev.kelompok_id !== currentKelId) {
        canManage = false;
        isReadOnly = true;
      } else if (isDesa && ev.desa_id === 'all') {
        canManage = false;
        isReadOnly = true;
      }

      return `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:10px 8px;text-align:center;font-weight:700;color:var(--text-muted);">${startIdx + idx + 1}</td>
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
            <div style="display:inline-flex;gap:6px;align-items:center;justify-content:center;">
              <button type="button" class="btn-action-isi-jurnal" data-ev-id="${ev.id}" title="Isi / Lihat Jurnal Kegiatan" style="display:inline-flex;align-items:center;gap:5px;padding:6px 11px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;white-space:nowrap;">
                <span class="material-symbols-outlined" style="font-size:16px;">edit_note</span>
                <span>Isi Jurnal</span>
              </button>
              <button type="button" class="btn-kbm-action-menu" data-ev-id="${ev.id}" data-can-manage="${canManage ? '1' : '0'}" data-judul="${(ev.judul || 'Kegiatan').replace(/"/g, '&quot;')}" title="Cetak Absen, Laporan &amp; Opsi Lainnya" style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;background:var(--surface);color:var(--text);border:1px solid var(--border);white-space:nowrap;">
                <span class="material-symbols-outlined" style="font-size:16px;color:#be185d;">description</span>
                <span>Laporan &amp; Opsi</span>
                <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-muted);">expand_more</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Cards View for Mobile
    const cardsMobileHtml = paginatedEvents.map(ev => {
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
      let formatName = 'Remaja/Dewasa';
      let formatStyle = 'background:#f3e8ff;color:#7c3aed;';
      if (ev.format_kbm === 'caberawit') {
        formatBadge = 'badge-amber';
        formatName = 'Caberawit';
        formatStyle = 'background:#fef3c7;color:#b45309;';
      } else if (ev.format_kbm === 'gp_reguler') {
        formatBadge = 'badge-info';
        formatName = 'GP (Pra-remaja)';
        formatStyle = 'background:#dbeafe;color:#1d4ed8;';
      } else if (ev.format_kbm === 'pra_nikah') {
        formatBadge = 'badge-pink';
        formatName = 'Pra Nikah (19-22 Th)';
        formatStyle = 'background:#fce7f3;color:#be185d;';
      }

      let wilayahLabel = 'Solo Selatan';
      if (ev.kelompok_id && ev.kelompok_id !== 'all') {
        const foundKel = allKels.find(k => k.id === ev.kelompok_id);
        wilayahLabel = foundKel ? `Kel. ${foundKel.nama}` : 'Kelompok';
      } else if (ev.desa_id && ev.desa_id !== 'all') {
        const foundDesa = desaList.find(d => d.id === ev.desa_id);
        wilayahLabel = foundDesa ? `Desa ${foundDesa.nama}` : 'Desa';
      }

      let canManage = !isViewOnlyContext;
      let isReadOnly = isViewOnlyContext;
      if (isKelompok && ev.kelompok_id !== currentKelId) {
        canManage = false;
        isReadOnly = true;
      } else if (isDesa && ev.desa_id === 'all') {
        canManage = false;
        isReadOnly = true;
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

          <div class="kbm-event-card-actions" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:10px;">
            <button type="button" class="btn-action-isi-jurnal" data-ev-id="${ev.id}" title="Isi / Lihat Jurnal Kegiatan" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:8px 10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;">
              <span class="material-symbols-outlined" style="font-size:16px;">edit_note</span>
              <span>Isi Jurnal</span>
            </button>
            <button type="button" class="btn-kbm-action-menu" data-ev-id="${ev.id}" data-can-manage="${canManage ? '1' : '0'}" data-judul="${(ev.judul || 'Kegiatan').replace(/"/g, '&quot;')}" title="Cetak Absen, Laporan &amp; Opsi Lainnya" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:8px 10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;background:var(--surface);color:var(--text);border:1px solid var(--border);">
              <span class="material-symbols-outlined" style="font-size:16px;color:#be185d;">description</span>
              <span>Laporan &amp; Opsi</span>
              <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-muted);">expand_more</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    agendaContentHtml = `
      ${bannerActionKbmHtml}
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

      <!-- FOOTER PAGINATION & TUTUP -->
      <div class="kbm-footer-pagination" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <span style="font-size:12px;font-weight:600;color:var(--text-muted);">
          Menampilkan <strong>${totalEvents > 0 ? startIdx + 1 : 0}–${Math.min(startIdx + pageSize, totalEvents)}</strong> dari <strong>${totalEvents}</strong> agenda KBM.
        </span>

        ${totalPages > 1 ? `
          <div class="kbm-pagination" style="display:flex;align-items:center;gap:4px;">
            <button type="button" class="kbm-page-btn btn-page-nav" data-page="1" ${currentPage <= 1 ? 'disabled' : ''} title="Halaman Pertama">
              «
            </button>
            <button type="button" class="kbm-page-btn btn-page-nav" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''} title="Halaman Sebelumnya">
              ‹
            </button>
            ${(() => {
          const maxV = 5;
          let sP = Math.max(1, currentPage - Math.floor(maxV / 2));
          let eP = Math.min(totalPages, sP + maxV - 1);
          if (eP - sP < maxV - 1) sP = Math.max(1, eP - maxV + 1);
          let h = '';
          for (let p = sP; p <= eP; p++) {
            h += `<button type="button" class="kbm-page-btn btn-page-nav ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
          }
          return h;
        })()}
            <button type="button" class="kbm-page-btn btn-page-nav" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''} title="Halaman Selanjutnya">
              ›
            </button>
            <button type="button" class="kbm-page-btn btn-page-nav" data-page="${totalPages}" ${currentPage >= totalPages ? 'disabled' : ''} title="Halaman Terakhir">
              »
            </button>
          </div>
        ` : ''}

        <button type="button" class="btn-cancel-modal px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          Tutup
        </button>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════
  // VIEW 2: FORM BUAT / EDIT EVENT KBM
  // ══════════════════════════════════════════════════════════════
  const isEdit = (activeTab === 'edit_event');
  const editingEvent = isEdit ? getKbmEventById(options.editEventId) : null;
  const formTitle = isEdit ? 'Edit Data Event KBM' : 'Buat Event KBM & Siapkan Lembar Absensi Cetak';
  const formDesc = isEdit ? 'Perbarui judul, jadwal waktu pelaksanaan, format, atau wilayah event. Data rekapitulasi presensi yang sudah tersimpan akan tetap aman terjaga.' : 'Event akan tersimpan di agenda, siap dicetak kapan saja menggunakan data generus aktif, dan dapat langsung diisi jurnalnya pasca KBM.';
  const formIcon = isEdit ? 'edit_calendar' : 'print';

  const defaultJudul = isEdit ? (editingEvent?.judul || '') : (isKelompok ? `PENGAJIAN REMAJA KELOMPOK ${currentKelObj ? currentKelObj.nama.toUpperCase() : ''}` : (isDesa ? `PENGAJIAN REMAJA DESA ${desaObj.nama.toUpperCase()}` : 'PENGAJIAN REMAJA DAERAH SOLO SELATAN'));
  const defaultFormat = isEdit ? (editingEvent?.format_kbm || 'remaja') : 'remaja';
  const defaultHariTgl = isEdit ? (editingEvent?.hari_tanggal || '') : 'Selasa, 20 Januari 2026';
  const defaultJam = isEdit ? (editingEvent?.jam || '') : '19.30 – 21.00 WIB';
  const defaultDesa = isEdit ? (editingEvent?.desa_id || 'all') : (isDaerah ? 'all' : currentDesaId);
  const defaultKel = isEdit ? (editingEvent?.kelompok_id || 'all') : (isKelompok ? currentKelId : 'all');
  const defaultGender = isEdit ? (editingEvent?.gender || 'pisah') : 'pisah';
  const defaultBaris = isEdit ? (editingEvent?.baris_kosong || 'fill30') : 'fill30';
  const defaultBulan = isEdit ? (editingEvent?.bulan || 'SEPTEMBER') : 'SEPTEMBER';
  const defaultTahun = isEdit ? (editingEvent?.tahun || '2026') : '2026';

  const eventFormHtml = `
    <!-- HIGHLIGHT INFO -->
    <div style="background:linear-gradient(135deg, ${isEdit ? '#fef3c7 0%, #fef9c3 100%' : '#f0fdf4 0%, #dcfce7 100%'});border:1.5px solid ${isEdit ? '#fde68a' : '#86efac'};border-radius:10px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
      <span class="material-symbols-outlined" style="font-size:24px;color:${isEdit ? '#d97706' : '#16a34a'};flex-shrink:0;">${formIcon}</span>
      <div>
        <h4 style="margin:0;font-size:13px;font-weight:800;color:${isEdit ? '#92400e' : 'var(--green-dark)'};">${formTitle}</h4>
        <p style="margin:2px 0 0;font-size:11.5px;color:${isEdit ? '#b45309' : '#15803d'};line-height:1.4;">
          ${formDesc}
        </p>
      </div>
    </div>

    <!-- FORM PENGATURAN CETAK / EDIT -->
    <form id="formCetakAbsensi" style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
      
      <!-- Pilihan Format KBM -->
      <div>
        <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">
          Format KBM <span style="color:red">*</span>
        </label>
        <select id="modalSelJenisKbm" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:700;color:#1e3a8a;font-size:12.5px;box-sizing:border-box;">
          <option value="caberawit" ${defaultFormat === 'caberawit' ? 'selected' : ''}>Caberawit (PAUD - SD)</option>
          <option value="gp_reguler" ${defaultFormat === 'gp_reguler' ? 'selected' : ''}>GP (Pra-remaja) (SMP)</option>
          <option value="pra_nikah" ${defaultFormat === 'pra_nikah' ? 'selected' : ''}>Pra Nikah (19 - 22 Th)</option>
          <option value="remaja" ${defaultFormat === 'remaja' ? 'selected' : ''}>Remaja/Dewasa (SMA &amp; Dewasa)</option>
        </select>
      </div>

      <!-- Baris 1: Kolom Isian Judul Event 1 Baris Penuh -->
      <div>
        <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">
          Judul Event / Kegiatan <span style="color:red">*</span>
        </label>
        <input type="text" id="modalIptCustomJudul" value="${defaultJudul}" placeholder="Contoh: PENGAJIAN REMAJA KELOMPOK" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:700;color:var(--text);font-size:12.5px;box-sizing:border-box;" required />
      </div>

      <!-- Baris 2: Hari, Tanggal Pelaksanaan & Jam Pelaksanaan (Sejajar) -->
      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px;">
        <div style="min-width:0;">
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            Hari, Tanggal Pelaksanaan
          </label>
          <div style="position:relative;display:flex;align-items:center;width:100%;">
            <input type="text" id="modalIptHariTanggal" placeholder="Contoh: Selasa, 20 Januari 2026" value="${defaultHariTgl}" style="width:100%;padding:9px 36px 9px 10px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-size:12px;box-sizing:border-box;font-weight:600;color:var(--text);" />
            <input type="date" id="modalIptDatePicker" style="position:absolute;right:0;top:0;width:36px;height:100%;opacity:0;cursor:pointer;z-index:2;color:transparent;background:transparent;border:none;-webkit-appearance:none;" title="Pilih Tanggal dari Kalender" />
            <div id="btnOpenDatePicker" style="position:absolute;right:8px;color:var(--primary);cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:1;" title="Pilih Tanggal">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
          </div>
        </div>
        <div style="min-width:0;">
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            Jam Pelaksanaan
          </label>
          <input type="text" id="modalIptJam" placeholder="Contoh: 19.30 – 21.00 WIB" value="${defaultJam}" style="width:100%;padding:9px 10px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-size:12px;box-sizing:border-box;font-weight:600;color:var(--text);" />
        </div>
      </div>

      <!-- Baris 3: Desa & Kelompok (Sejajar) -->
      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px;">
        <div style="min-width:0;">
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Desa</label>
          <select id="modalSelDesa" style="width:100%;padding:9px 10px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12px;box-sizing:border-box;">
            ${buildDesaOptions(defaultDesa)}
          </select>
        </div>
        <div style="min-width:0;">
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Kelompok</label>
          <select id="modalSelKelompok" style="width:100%;padding:9px 10px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12px;box-sizing:border-box;">
            ${buildKelOptions(defaultDesa, defaultKel)}
          </select>
        </div>
      </div>

      <!-- Baris 4: Format Penulisan Absensi (Pemisahan Gender & Baris Kosong Sejajar) -->
      <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:10px;">
        <div style="min-width:0;">
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Pemisahan Gender</label>
          <select id="modalSelGender" style="width:100%;padding:9px 10px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-weight:600;font-size:12px;box-sizing:border-box;">
            <option value="pisah" ${defaultGender === 'pisah' ? 'selected' : ''}>Pisah Lembar (Pa &amp; Pi)</option>
            <option value="L" ${defaultGender === 'L' ? 'selected' : ''}>Khusus Putra Saja</option>
            <option value="P" ${defaultGender === 'P' ? 'selected' : ''}>Khusus Putri Saja</option>
            <option value="gabung" ${defaultGender === 'gabung' ? 'selected' : ''}>Gabung (Pa &amp; Pi)</option>
          </select>
        </div>
        <div style="min-width:0;">
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Format Baris Kosong</label>
          <select id="modalSelBarisKosong" style="width:100%;padding:9px 10px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:var(--surface);font-size:12px;box-sizing:border-box;">
            <option value="fill30" ${defaultBaris === 'fill30' ? 'selected' : ''}>Penuhi (Maks 30)</option>
            <option value="0" ${defaultBaris === '0' ? 'selected' : ''}>0 (Pas Generus)</option>
            <option value="3" ${defaultBaris === '3' ? 'selected' : ''}>+3 Baris Kosong</option>
            <option value="5" ${defaultBaris === '5' ? 'selected' : ''}>+5 Baris Kosong</option>
            <option value="10" ${defaultBaris === '10' ? 'selected' : ''}>+10 Baris Kosong</option>
          </select>
        </div>
      </div>

      <input type="hidden" id="modalSelUrutan" value="official" />

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" id="btnBatalKeAgenda" class="btn-sticky-back" title="Kembali ke Agenda">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Agenda</span>
        </button>
        ${!isEdit ? `
          <button type="button" id="btnCetakLangsungTanpaSimpan" class="btn-sticky-print" title="Cetak Saja">
            <span class="material-symbols-outlined">print</span>
            <span class="btn-text">Cetak Saja</span>
          </button>
        ` : ''}
        <button type="submit" id="btnSubmitEventKbm" class="btn-sticky-save" title="${isEdit ? 'Simpan Perubahan' : 'Simpan Event KBM'}">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">${isEdit ? 'Simpan Perubahan' : 'Simpan Event KBM'}</span>
        </button>
      </div>
    </form>
  `;

  // ── RENDER CONTAINER MODAL ──
  const isFormView = (activeTab === 'create_event' || activeTab === 'edit_event');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div id="tabContentContainer">
        ${isFormView ? eventFormHtml : agendaContentHtml}
      </div>
    </div>
  `;

  const modalSize = isFormView ? 'medium' : 'wide';
  const modalTitle = isRemajaContext
    ? (isFormView ? (activeTab === 'create_event' ? 'Buat Kegiatan Remaja' : 'Edit Kegiatan Remaja') : `Kegiatan Remaja — ${activeScopeLabel}`)
    : (isFormView ? (activeTab === 'create_event' ? 'Buat Agenda KBM Baru' : 'Edit Agenda KBM') : 'Agenda & Penyampaian KBM');
  openModal(
    modalTitle,
    isFormView ? 'edit_calendar' : (isRemajaContext ? 'groups' : 'menu_book'),
    modalHtml,
    modalSize
  );

  // ══════════════════════════════════════════════════════════════
  // EVENT LISTENERS & LOGIC BINDINGS
  // ══════════════════════════════════════════════════════════════
  const removeFloatingMenu = () => {
    document.getElementById('kbmFloatingActionMenu')?.remove();
  };
  removeFloatingMenu();

  // 1. Open Create Event Form
  document.getElementById('btnBukaCreateEvent')?.addEventListener('click', () => {
    removeFloatingMenu();
    renderCetakAbsensiModal('create_event', { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, page: currentPage });
  });
  document.getElementById('btnEmptyCreateEvent')?.addEventListener('click', () => {
    removeFloatingMenu();
    renderCetakAbsensiModal('create_event', { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, page: 1 });
  });

  // 2. Agenda View Listeners
  if (activeTab === 'agenda') {
    document.getElementById('kbmFilterTingkat')?.addEventListener('change', (e) => {
      removeFloatingMenu();
      const nextScope = e.target.value;
      const nextDesa = nextScope === 'daerah_only' ? 'all' : (isDaerah ? filterDesa : currentDesaId);
      const nextKel = nextScope === 'kelompok_only' ? (isKelompok ? currentKelId : 'all') : 'all';
      renderCetakAbsensiModal('agenda', {
        filterDesa: nextDesa,
        filterKel: nextKel,
        filterFormat,
        scopeMode: nextScope,
        isRemaja: isRemajaContext,
        page: 1
      });
    });

    document.getElementById('kbmFilterDesa')?.addEventListener('change', (e) => {
      removeFloatingMenu();
      renderCetakAbsensiModal('agenda', {
        filterDesa: e.target.value,
        filterKel: 'all',
        filterFormat,
        scopeMode,
        isRemaja: isRemajaContext,
        page: 1
      });
    });

    document.getElementById('kbmFilterKelompok')?.addEventListener('change', (e) => {
      removeFloatingMenu();
      renderCetakAbsensiModal('agenda', {
        filterDesa,
        filterKel: e.target.value,
        filterFormat,
        scopeMode,
        isRemaja: isRemajaContext,
        page: 1
      });
    });

    document.getElementById('kbmFilterFormat')?.addEventListener('change', (e) => {
      removeFloatingMenu();
      renderCetakAbsensiModal('agenda', {
        filterDesa,
        filterKel,
        filterFormat: e.target.value,
        scopeMode,
        isRemaja: isRemajaContext,
        page: 1
      });
    });

    document.getElementById('btnScopeKelompok')?.addEventListener('click', () => {
      removeFloatingMenu();
      renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode: 'kelompok_only', isRemaja: isRemajaContext, page: 1 });
    });

    document.getElementById('btnScopeDesa')?.addEventListener('click', () => {
      removeFloatingMenu();
      renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode: 'desa_all', isRemaja: isRemajaContext, page: 1 });
    });

    // Pagination Listeners
    document.querySelectorAll('.btn-page-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFloatingMenu();
        const targetPage = parseInt(btn.getAttribute('data-page'));
        if (targetPage && targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
          renderCetakAbsensiModal('agenda', {
            filterDesa,
            filterKel,
            filterFormat,
            scopeMode,
            isRemaja: isRemajaContext,
            page: targetPage
          });
        }
      });
    });

    // Action: Isi Jurnal (Direct Scope)
    document.querySelectorAll('.btn-action-isi-jurnal').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFloatingMenu();
        const evId = btn.getAttribute('data-ev-id');
        const ev = getKbmEventById(evId);
        if (!ev) return;

        // Jika event tingkat Kelompok -> Langsung buka form khusus kelompok tersebut
        if (ev.kelompok_id && ev.kelompok_id !== 'all') {
          renderSingleKelompokEditModal(ev, ev.kelompok_id);
        } else if (isKelompok) {
          // Pamong kelompok mengisi kelompoknya sendiri
          renderSingleKelompokEditModal(ev, currentKelId);
        } else {
          // Tingkat Desa atau Daerah -> Buka matrix terfilter sesuai wilayah event
          renderFormRekapKehadiranModal(ev.id);
        }
      });
    });

    // Action: Dropdown Menu (Cetak Absen, Lihat/Cetak Laporan, Edit, Hapus)
    const triggerDeleteEvent = (evId, judul) => {
      showConfirmModal({
        title: isRemajaContext ? 'Hapus Kegiatan Remaja' : 'Hapus Event KBM',
        message: `Apakah Anda yakin ingin menghapus "${judul}" dari daftar event tersimpan?`,
        icon: 'delete',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        confirmText: 'Ya, Hapus',
        confirmBtnColor: 'var(--red)',
        onConfirm: async () => {
          await deleteKbmEvent(evId);
          showToast('Kegiatan berhasil dihapus', 'success');
          renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, page: currentPage });
        }
      });
    };

    document.querySelectorAll('.btn-kbm-action-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const evId = btn.getAttribute('data-ev-id');
        const canManageEv = btn.getAttribute('data-can-manage') === '1';
        const judul = btn.getAttribute('data-judul') || 'Kegiatan';
        const existing = document.getElementById('kbmFloatingActionMenu');
        if (existing && existing.getAttribute('data-ev-id') === evId) {
          removeFloatingMenu();
          return;
        }
        removeFloatingMenu();

        const menu = document.createElement('div');
        menu.id = 'kbmFloatingActionMenu';
        menu.setAttribute('data-ev-id', evId);
        menu.style.cssText = 'position:fixed;z-index:99999;min-width:205px;background:var(--surface,#fff);border:1px solid var(--border,#cbd5e1);border-radius:10px;box-shadow:0 10px 25px rgba(15,23,42,0.16);padding:6px;display:flex;flex-direction:column;gap:2px;';

        const itemStyle = 'display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:none;background:transparent;border-radius:7px;font-size:12px;font-weight:600;color:var(--text,#0f172a);cursor:pointer;text-align:left;';
        menu.innerHTML = `
          <button type="button" data-menu-act="cetak_absen" style="${itemStyle}">
            <span class="material-symbols-outlined" style="font-size:17px;color:#15803d;">print</span>
            <span>Cetak Lembar Absensi</span>
          </button>
          <button type="button" data-menu-act="cetak_laporan" style="${itemStyle}">
            <span class="material-symbols-outlined" style="font-size:17px;color:#be185d;">description</span>
            <span>Lihat / Cetak Laporan</span>
          </button>
          ${canManageEv ? `
            <div style="height:1px;background:var(--border,#e2e8f0);margin:3px 0;"></div>
            <button type="button" data-menu-act="edit" style="${itemStyle}">
              <span class="material-symbols-outlined" style="font-size:17px;color:#b45309;">edit</span>
              <span>Edit Kegiatan</span>
            </button>
            <button type="button" data-menu-act="hapus" style="${itemStyle}color:#dc2626;">
              <span class="material-symbols-outlined" style="font-size:17px;color:#dc2626;">delete</span>
              <span>Hapus Kegiatan</span>
            </button>
          ` : ''}
        `;

        document.body.appendChild(menu);
        const rect = btn.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const top = (rect.bottom + menuRect.height + 8 > window.innerHeight)
          ? Math.max(8, rect.top - menuRect.height - 6)
          : rect.bottom + 6;
        const left = Math.min(window.innerWidth - menuRect.width - 8, Math.max(8, rect.right - menuRect.width));
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;

        menu.querySelectorAll('button').forEach(item => {
          item.addEventListener('mouseenter', () => { item.style.background = 'var(--bg,#f1f5f9)'; });
          item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
          item.addEventListener('click', () => {
            const act = item.getAttribute('data-menu-act');
            removeFloatingMenu();
            if (act === 'cetak_absen') {
              window.open(`../laporan/cetak-absensi.html?eventId=${encodeURIComponent(evId)}`, '_blank');
            } else if (act === 'cetak_laporan') {
              window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(evId)}`, '_blank');
            } else if (act === 'edit') {
              renderCetakAbsensiModal('edit_event', {
                filterDesa,
                filterKel,
                filterFormat,
                scopeMode,
                isRemaja: isRemajaContext,
                page: currentPage,
                editEventId: evId
              });
            } else if (act === 'hapus') {
              triggerDeleteEvent(evId, judul);
            }
          });
        });

        const closeOnOutside = (evOutside) => {
          if (!menu.contains(evOutside.target) && !btn.contains(evOutside.target)) {
            removeFloatingMenu();
            document.removeEventListener('click', closeOnOutside);
          }
        };
        setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
      });
    });
  }

  // 3. Create / Edit Event Form Listeners
  if (isFormView) {
    const selDesaEl = document.getElementById('modalSelDesa');
    const selKelEl = document.getElementById('modalSelKelompok');
    selDesaEl?.addEventListener('change', () => {
      selKelEl.innerHTML = buildKelOptions(selDesaEl.value, 'all');
    });

    // Setup Date Picker sync with Hari, Tanggal Pelaksanaan
    const datePickerEl = document.getElementById('modalIptDatePicker');
    const hariTglEl = document.getElementById('modalIptHariTanggal');
    if (datePickerEl && hariTglEl) {
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const blnMap = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
        'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
        'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
      };

      const dMatch = hariTglEl.value.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
      if (dMatch) {
        const dd = dMatch[1].padStart(2, '0');
        const mm = blnMap[dMatch[2].toLowerCase()] || '01';
        const yyyy = dMatch[3];
        datePickerEl.value = `${yyyy}-${mm}-${dd}`;
      }

      datePickerEl.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        const [y, m, d] = val.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const dayName = days[dt.getDay()];
        const monthName = months[m - 1];
        hariTglEl.value = `${dayName}, ${d} ${monthName} ${y}`;
      });
    }

    function deriveBulanTahun(hariTgl) {
      let b = 'JANUARI';
      let t = new Date().getFullYear().toString();
      const m = (hariTgl || '').match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
      if (m) {
        b = m[2].toUpperCase();
        t = m[3];
      }
      return { bulan: b, tahun: t };
    }

    document.getElementById('btnBatalKeAgenda')?.addEventListener('click', () => {
      renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, page: currentPage });
    });

    document.getElementById('btnCetakLangsungTanpaSimpan')?.addEventListener('click', () => {
      const jenjangVal = document.getElementById('modalSelJenisKbm').value;
      const desaVal = document.getElementById('modalSelDesa').value;
      const kelVal = document.getElementById('modalSelKelompok').value;
      const genderVal = document.getElementById('modalSelGender').value;
      const judulVal = document.getElementById('modalIptCustomJudul').value.trim();
      const hariTglVal = document.getElementById('modalIptHariTanggal').value.trim() || 'Selasa, 20 Januari 2026';
      const { bulan: bulanVal, tahun: tahunVal } = deriveBulanTahun(hariTglVal);
      const urutanVal = document.getElementById('modalSelUrutan')?.value || 'official';
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
        btnSubmit.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span> Menyimpan...`;
      }

      const jenjangVal = document.getElementById('modalSelJenisKbm').value;
      const desaVal = document.getElementById('modalSelDesa').value;
      const kelVal = document.getElementById('modalSelKelompok').value;
      const genderVal = document.getElementById('modalSelGender').value;
      const judulVal = document.getElementById('modalIptCustomJudul').value.trim() || 'REKAP KEHADIRAN PENGAJIAN REMAJA';
      const hariTglVal = document.getElementById('modalIptHariTanggal').value.trim() || 'Selasa, 20 Januari 2026';
      const jamVal = document.getElementById('modalIptJam').value.trim() || '19.30 – 21.00 WIB';
      const { bulan: bulanVal, tahun: tahunVal } = deriveBulanTahun(hariTglVal);
      const urutanVal = document.getElementById('modalSelUrutan')?.value || 'official';
      const barisVal = document.getElementById('modalSelBarisKosong').value;

      if (isEdit && editingEvent) {
        // Mode Edit: Simpan perubahan pada event yang sudah ada
        await saveKbmEvent({
          ...editingEvent,
          judul: judulVal,
          format_kbm: jenjangVal,
          desa_id: desaVal,
          kelompok_id: kelVal,
          gender: genderVal,
          hari_tanggal: hariTglVal,
          jam: jamVal,
          bulan: bulanVal,
          tahun: tahunVal,
          baris_kosong: barisVal
        });

        showToast('Perubahan event KBM berhasil disimpan!', 'success');
        setTimeout(() => {
          isSavingEventKbm = false;
          renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, page: currentPage });
        }, 250);
      } else {
        // Mode Buat Baru
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
          baris_kosong: barisVal,
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
          renderCetakAbsensiModal('agenda', { filterDesa, filterKel, filterFormat, scopeMode, isRemaja: isRemajaContext, page: 1 });
        }, 250);
      }
    });
  }

  document.querySelector('.btn-cancel-modal')?.addEventListener('click', closeModal);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM ISIAN REKAPITULASI KEHADIRAN KBM (MATRIX DESA / DAERAH)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderFormRekapKehadiranModal(eventId, targetKelId = null) {
  const event = getKbmEventById(eventId);
  if (!event) {
    showToast('Event KBM tidak ditemukan', 'error');
    renderCetakAbsensiModal('agenda', lastAgendaOptions);
    return;
  }

  // Jika targetKelId diberikan atau event adalah event tingkat kelompok tunggal:
  if (targetKelId) {
    renderSingleKelompokEditModal(event, targetKelId);
    return;
  }
  if (event.kelompok_id && event.kelompok_id !== 'all') {
    renderSingleKelompokEditModal(event, event.kelompok_id);
    return;
  }

  // Sesi Kelas
  let currentSesiList = (event.sesi_kelas && event.sesi_kelas.length > 0)
    ? JSON.parse(JSON.stringify(event.sesi_kelas))
    : [{ kelas: '1 SMP - DEWASA', tempat: 'Masjid Lt. 1', materi: '', penasehat: '' }];

  // Wilayah scoping for rekap table
  let scopedDesa = MASTER_WILAYAH.desa;
  let wilayahRekapLabel = 'Solo Selatan';

  // PRIORITAS: Periksa scope wilayah event terlebih dahulu!
  if (event.desa_id && event.desa_id !== 'all') {
    scopedDesa = MASTER_WILAYAH.desa.filter(d => d.id === event.desa_id);
    if (scopedDesa[0]) {
      wilayahRekapLabel = `Desa ${scopedDesa[0].nama}`;
    }
  } else if (currentUser.tingkatan === 'desa') {
    scopedDesa = MASTER_WILAYAH.desa.filter(d => d.id === currentUser.desaId);
    wilayahRekapLabel = `Desa ${scopedDesa[0]?.nama || ''}`;
  } else {
    wilayahRekapLabel = '27 Kelompok Solo Selatan';
  }

  const currentRekap = event.rekap_kehadiran ? JSON.parse(JSON.stringify(event.rekap_kehadiran)) : {};

  function buildSesiRowsHtml(list) {
    return list.map((s, idx) => `
      <tr data-sesi-idx="${idx}">
        <td style="padding:6px;"><input type="text" class="ipt-sesi-kelas" value="${s.kelas || ''}" placeholder="misal: 1 SMP - 3 SMP" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-tempat" value="${s.tempat || ''}" placeholder="misal: Masjid Lt. 1" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-materi" value="${s.materi || ''}" placeholder="misal: Surat Al-Baqarah" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-penasehat" value="${s.penasehat || ''}" placeholder="misal: Ust. Ahmad" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;" /></td>
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
        <button type="button" id="btnBackToJurnalTab" class="btn-sticky-back" title="Kembali ke Agenda">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Agenda</span>
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
    renderCetakAbsensiModal('agenda', lastAgendaOptions);
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
          alfa: parseInt(iptA?.value) || 0,
          materi: (collectedSesi[0]?.materi) || collectedRekap[kel.id]?.materi || '',
          pengajar: (collectedSesi[0]?.penasehat) || collectedRekap[kel.id]?.pengajar || ''
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
    if (btnSimpan) btnSimpan.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">save</span> Simpan Laporan`;
    showToast('Rekapitulasi kehadiran KBM berhasil disimpan!', 'success');
    renderCetakAbsensiModal('agenda', lastAgendaOptions);
  });

  document.getElementById('btnSimpanDanCetakLaporan')?.addEventListener('click', async () => {
    const btnSimpanCetak = document.getElementById('btnSimpanDanCetakLaporan');
    if (btnSimpanCetak) btnSimpanCetak.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span>`;
    const saved = await saveCurrentRekapData();
    if (btnSimpanCetak) btnSimpanCetak.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">print</span> Simpan & Cetak`;
    showToast('Rekapitulasi disimpan! Membuka laporan PDF...', 'success');
    window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(saved.id)}`, '_blank');
    renderCetakAbsensiModal('agenda', lastAgendaOptions);
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL ISIAN JURNAL FOKUS SATU KELOMPOK
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderSingleKelompokEditModal(event, kelId) {
  const allKels = getAllKelompok();
  const kelObj = allKels.find(k => k.id === kelId);
  const kelNama = kelObj ? kelObj.nama : 'Kelompok';

  const rekap = (event.rekap_kehadiran && event.rekap_kehadiran[kelId]) || {};
  const hVal = parseInt(rekap.hadir) || 0;
  const iVal = parseInt(rekap.ijin) || 0;
  const aVal = parseInt(rekap.alfa) || 0;
  const totVal = hVal + iVal + aVal;
  const pctAlfa = totVal > 0 ? ((aVal / totVal) * 100).toFixed(1) : '0.0';

  const defaultMateri = (event.sesi_kelas && event.sesi_kelas[0] ? event.sesi_kelas[0].materi : '') || '';
  const defaultPengajar = (event.sesi_kelas && event.sesi_kelas[0] ? event.sesi_kelas[0].penasehat : '') || '';
  const materiVal = rekap.materi || (defaultMateri === 'Seminar Senkom Kota' ? '' : defaultMateri);
  const pengajarVal = rekap.pengajar || (defaultPengajar.includes('Abdul Aziz') ? '' : defaultPengajar);
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
          <span style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-top:3px;">
            <span class="material-symbols-outlined" style="font-size:14px;">lightbulb</span>
            <em>Materi Alqur'an dan Khadist ataupun Tema Nasehat Bisa di catat disini</em>
          </span>
        </div>

        <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
        <div class="modal-sticky-footer">
          <button type="button" id="btnBackToJurnalMonitoring" class="btn-sticky-back" title="Kembali ke Agenda">
            <span class="material-symbols-outlined">arrow_back</span>
            <span class="btn-text">Kembali ke Agenda</span>
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
    renderCetakAbsensiModal('agenda', lastAgendaOptions);
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

    // Sinkronkan ke sesi_kelas juga
    const updatedSesi = (event.sesi_kelas && event.sesi_kelas.length > 0)
      ? JSON.parse(JSON.stringify(event.sesi_kelas))
      : [{ kelas: '1 SMP - DEWASA', tempat: 'Masjid Lt. 1' }];
    if (!updatedSesi[0]) updatedSesi[0] = { kelas: '1 SMP - DEWASA', tempat: 'Masjid Lt. 1' };
    if (materi) updatedSesi[0].materi = materi;
    if (pengajar) updatedSesi[0].penasehat = pengajar;

    await saveKbmEvent({
      ...event,
      sesi_kelas: updatedSesi,
      rekap_kehadiran: rekapMap
    });

    showToast(`Jurnal Kel. ${kelNama} berhasil disimpan!`, 'success');
    setTimeout(() => {
      renderCetakAbsensiModal('agenda', lastAgendaOptions);
    }, 250);
  });
}
