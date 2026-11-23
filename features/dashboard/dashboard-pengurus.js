/* ═══════════════════════════════════════════════════════════════
   dashboard-pengurus.js — Struktur 14 Bidang & Kelola Pengurus PPG
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  MASTER_STRUKTUR_PERAN,
  getRolesByTingkatan,
  getAllKelompok,
  getPengurusList,
  getPengurusById,
  getPengurusDaerahList,
  approvePengurus,
  togglePengurusActive,
  updatePengurus,
  deletePengurus,
  registerNewPengurus
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  closeModal,
  showToast,
  showConfirmModal,
  modalBody,
  showDashboardView,
  showDashboardHomePage,
  renderPaginationBar
} from './dashboard-common.js';

let strukturPageSize = 9;

let appHooks = {
  renderUserProfile: () => {},
  renderKelompokGrid: () => {}
};

export function setPengurusHooks(hooks) {
  appHooks = { ...appHooks, ...hooks };
}

/* ── 1. Notification Badge & Alert for Pending Approvals ───── */
export function checkPendingApprovals() {
  const cardPending = document.getElementById('cardPendingApproval');
  const pendingCountText = document.getElementById('pendingCountText');
  const pillTop = document.getElementById('pillTopPendingApproval');
  const topPendingCountText = document.getElementById('topPendingCountText');

  if (!currentUser || (!currentUser.isSuperadmin && currentUser.tingkatan !== 'daerah')) {
    if (cardPending) cardPending.style.display = 'none';
    if (pillTop) pillTop.style.display = 'none';
    return;
  }

  const list = getPengurusList();
  const pendingList = list.filter(p => p.statusApproval === 'pending');
  const count = pendingList.length;

  if (cardPending) {
    if (count > 0) {
      cardPending.style.display = 'flex';
      if (pendingCountText) pendingCountText.textContent = `Terdapat ${count} pamong/pengurus baru yang menunggu persetujuan (approval) Anda.`;
    } else {
      cardPending.style.display = 'none';
    }
  }

  if (pillTop) {
    if (count > 0) {
      pillTop.style.display = 'inline-flex';
      if (topPendingCountText) topPendingCountText.textContent = `${count} Menunggu Persetujuan`;
    } else {
      pillTop.style.display = 'none';
    }
  }

  const notifBadge = document.getElementById('notifApprovalCount');
  if (notifBadge) {
    if (count > 0) {
      notifBadge.style.display = 'inline-flex';
      notifBadge.textContent = count;
    } else {
      notifBadge.style.display = 'none';
    }
  }
}

export function renderApprovalListModal() {
  const list = getPengurusList();
  const pendingList = list.filter(p => p.statusApproval === 'pending');

  if (pendingList.length === 0) {
    openModal('Persetujuan Pendaftaran Pengurus', 'how_to_reg', 'default');
    modalBody.innerHTML = `
      <div style="text-align:center;padding:32px 10px;">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--green-dark);margin-bottom:10px;">verified</span>
        <h4 style="font-size:16px;font-weight:800;color:var(--text);">Tidak Ada Antrean Pendaftaran</h4>
        <p style="font-size:13px;color:var(--text-muted);margin-top:6px;">Semua akun pendaftaran pengurus baru telah ditinjau dan disetujui.</p>
      </div>
    `;
    return;
  }

  const itemsHtml = pendingList.map(p => {
    const roleDisplay = p.peran === 'Pengurus Kelompok' ? 'Pengurus' : (p.peran || p.jabatan || 'Pamong');
    const asalClean = p.kelompokNama ? `${p.kelompokNama} &bull; ${p.desaNama || '-'}` : (p.desaNama || '-');

    return `
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <strong style="font-size:14px;color:var(--text);word-break:break-word;">${p.nama}</strong>
            <div style="font-size:12px;color:var(--blue);font-weight:600;margin-top:2px;">${roleDisplay}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;">
              <span style="display:inline-flex;align-items:center;gap:3px;min-width:0;word-break:break-all;">
                <span class="material-symbols-outlined" style="font-size:13px;flex-shrink:0;">mail</span>
                <span style="word-break:break-all;">${p.email}</span>
              </span>
              ${p.noWa ? `
                <span style="display:inline-flex;align-items:center;gap:3px;white-space:nowrap;flex-shrink:0;">
                  <span class="material-symbols-outlined" style="font-size:13px;flex-shrink:0;">call</span>
                  <span>${p.noWa}</span>
                </span>
              ` : ''}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;display:flex;align-items:center;gap:3px;flex-wrap:wrap;">
              <span class="material-symbols-outlined" style="font-size:13px;flex-shrink:0;">location_on</span>
              <span>Asal: <strong>${asalClean}</strong></span>
            </div>
          </div>
          <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:var(--gold-light);color:#8a6a00;white-space:nowrap;flex-shrink:0;margin-left:4px;">Pending</span>
        </div>

        <div style="display:flex;gap:8px;margin-top:2px;">
          <button type="button" class="btn-action-approve" data-id="${p.id}" data-name="${p.nama}" style="flex:1;padding:8px 12px;border:none;background:var(--green-dark);color:#fff;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">check</span> Setujui Akun
          </button>
          <button type="button" class="btn-action-reject" data-id="${p.id}" data-name="${p.nama}" style="padding:8px 12px;border:1px solid var(--border);background:var(--surface);color:#dc2626;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">close</span> Tolak
          </button>
        </div>
      </div>
    `;
  }).join('');

  openModal(`Persetujuan Pendaftaran (${pendingList.length} Menunggu)`, 'how_to_reg', 'default');
  modalBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:12px;color:var(--text-muted);">
        Berikut adalah daftar pengurus baru yang telah mendaftar mandiri dan menunggu verifikasi Superadmin:
      </p>
      ${itemsHtml}
    </div>
  `;

  modalBody.querySelectorAll('.btn-action-approve').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      const pName = btn.dataset.name;

      showConfirmModal({
        title: 'Setujui Akun Pengurus',
        message: `Apakah Anda yakin ingin menyetujui akun "${pName}"? Pengurus ini akan langsung dapat login ke sistem.`,
        icon: 'how_to_reg',
        iconBg: 'var(--green-pastel)',
        iconColor: 'var(--green-dark)',
        confirmText: 'Ya, Setujui',
        confirmBtnColor: 'var(--green-dark)',
        onConfirm: async () => {
          await approvePengurus(pId, true);
          showToast(`Akun pengurus "${pName}" berhasil disetujui!`, 'success');
          renderApprovalListModal();
          checkPendingApprovals();
        }
      });
    });
  });

  modalBody.querySelectorAll('.btn-action-reject').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      const pName = btn.dataset.name;

      showConfirmModal({
        title: 'Tolak Pendaftaran',
        message: `Apakah Anda yakin ingin menolak pendaftaran akun "${pName}"?`,
        icon: 'person_cancel',
        iconBg: 'var(--red-light)',
        iconColor: 'var(--red)',
        confirmText: 'Ya, Tolak',
        confirmBtnColor: 'var(--red)',
        onConfirm: async () => {
          await approvePengurus(pId, false);
          showToast(`Pendaftaran akun "${pName}" telah ditolak.`, 'info');
          renderApprovalListModal();
          checkPendingApprovals();
        }
      });
    });
  });
}

/* ── 2. Struktur Pengurus Daerah Solo Selatan (Clean Web & Compact Mobile) ─── */
export function renderStrukturDaerahModal(activeTab = 'all', searchQuery = '', filterDesa = 'all', isFilterOpen = false, currentPage = 1) {
  const allDaerahList = getPengurusDaerahList();
  const isSuper = currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah');

  function isBph(p) {
    const role = (p.peran || p.jabatan || '').toLowerCase();
    return role.includes('ketua') || role.includes('sekretaris') || role.includes('bendahara');
  }

  // Count per tab before search
  const totalAll = allDaerahList.length;
  const totalBph = allDaerahList.filter(isBph).length;
  const totalBidang = totalAll - totalBph;

  // Filter based on activeTab, filterDesa, and searchQuery
  let filtered = allDaerahList.filter(p => {
    if (activeTab === 'bph' && !isBph(p)) return false;
    if (activeTab === 'bidang' && isBph(p)) return false;
    if (filterDesa !== 'all' && p.desaId !== filterDesa) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (p.nama || '').toLowerCase().includes(q);
      const matchEmail = (p.email || '').toLowerCase().includes(q);
      const matchPeran = (p.peran || p.jabatan || '').toLowerCase().includes(q);
      const matchWilayah = (p.desaNama || '').toLowerCase().includes(q) || (p.kelompokNama || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPeran && !matchWilayah) return false;
    }

    return true;
  });

  const ppgOfficialRank = {
    'Ketua': 1,
    'Wakil Ketua': 2,
    'Sekretaris': 3,
    'Bendahara': 4,
    'Kurikulum': 5,
    'Tenaga Pendidik': 6,
    'Penggalang Dana': 7,
    'Sarana dan Prasarana': 8,
    'Sarana Prasarana': 8,
    'Kegiatan Muda Mudi': 9,
    'Seni dan Olahraga': 10,
    'Seni dan Olah Raga': 10,
    'Kemandirian': 11,
    'Keputrian': 12,
    'Bimbingan Konseling': 13,
    'Tahfidz': 14
  };

  filtered.sort((a, b) => {
    const roleA = (a.peran || a.jabatan || '').trim();
    const roleB = (b.peran || b.jabatan || '').trim();
    const rankA = ppgOfficialRank[roleA] || 99;
    const rankB = ppgOfficialRank[roleB] || 99;
    if (rankA !== rankB) return rankA - rankB;
    return (a.nama || '').localeCompare(b.nama || '');
  });

  // Filter Desa options
  const filterDesaOptions = `
    <option value="all" ${filterDesa === 'all' ? 'selected' : ''}>Semua Desa</option>
  ` + MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" ${filterDesa === d.id ? 'selected' : ''}>${d.nama}</option>
  `).join('');

  // Pagination parameters (8 pengurus per page: 4 baris x 2 kolom di desktop, nyaman & rapi di mobile)
  const itemsPerPage = strukturPageSize;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filtered.slice(startIndex, startIndex + itemsPerPage);

  // 1. DESKTOP CARDS HTML (2-Column Grid)
  const desktopCardsHtml = paginatedList.map((p, idx) => {
    const isP_Bph = isBph(p);
    const waClean = (p.noWa || '').replace(/[^0-9]/g, '');
    const waIntl = waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean;
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const roleName = p.peran || p.jabatan || 'Pengurus Daerah';
    const initial = (p.nama || 'P').trim().charAt(0).toUpperCase();
    const asalTxt = p.kelompokNama ? `${p.kelompokNama} &bull; ${p.desaNama || '-'}` : (p.desaNama || '-');

    return `
      <div class="struktur-card-desktop">
        <div class="struktur-card-top">
          <div class="struktur-avatar ${isP_Bph ? 'struktur-avatar-bph' : ''}">
            ${initial}
          </div>
          <div class="struktur-info-col">
            <div class="struktur-nama" title="${p.nama}">${p.nama}</div>
            <div class="struktur-badge-role ${isP_Bph ? 'badge-role-bph' : 'badge-role-bidang'}">
              <span class="material-symbols-outlined" style="font-size:13px;">${isP_Bph ? 'stars' : 'verified'}</span>
              <span>${roleName}</span>
            </div>
            <div class="struktur-asal-text" title="${p.desaNama || ''}">
              <span class="material-symbols-outlined" style="font-size:13px;color:var(--text-muted);">location_on</span>
              <span>${asalTxt}</span>
            </div>
          </div>
        </div>
        <div class="struktur-card-actions">
          ${waClean ? `
            <a href="https://wa.me/${waIntl}?text=${waMsg}" target="_blank" rel="noopener" class="btn-kontak-wa" title="Kirim WhatsApp ke ${p.nama}">
              <span class="material-symbols-outlined" style="font-size:14px;">chat</span>
              <span>WhatsApp</span>
            </a>
          ` : ''}
          ${p.email ? `
            <a href="mailto:${p.email}" target="_blank" rel="noopener noreferrer" class="btn-kontak-email" title="Kirim Email ke ${p.nama}">
              <span class="material-symbols-outlined" style="font-size:14px;">mail</span>
              <span>Email</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 2. MOBILE CARDS HTML (Compact Accordion Cards)
  const mobileCardsHtml = paginatedList.map((p, idx) => {
    const isP_Bph = isBph(p);
    const waClean = (p.noWa || '').replace(/[^0-9]/g, '');
    const waIntl = waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean;
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const roleName = p.peran || p.jabatan || 'Pengurus Daerah';
    const initial = (p.nama || 'P').trim().charAt(0).toUpperCase();
    const asalTxt = p.kelompokNama ? `${p.kelompokNama} &bull; ${p.desaNama || '-'}` : (p.desaNama || '-');

    return `
      <div class="struktur-mobile-card" data-idx="${idx}">
        <div class="struktur-mobile-header btn-toggle-struktur-card" data-idx="${idx}">
          <div class="struktur-mobile-left">
            <div class="struktur-avatar-mini ${isP_Bph ? 'struktur-avatar-mini-bph' : ''}">
              ${initial}
            </div>
            <div class="struktur-mobile-name-wrap">
              <div class="struktur-mobile-name">${p.nama}</div>
              <div class="struktur-badge-role ${isP_Bph ? 'badge-role-bph' : 'badge-role-bidang'}" style="font-size:9.5px;padding:1px 6px;margin-top:2px;">
                ${roleName}
              </div>
            </div>
          </div>
          <div class="struktur-mobile-right">
            <span class="material-symbols-outlined struktur-card-chevron">expand_more</span>
          </div>
        </div>
        <div class="struktur-mobile-detail">
          <div style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:14px;">location_on</span>
            <span>Asal: <strong>${asalTxt}</strong></span>
          </div>
          <div class="struktur-mobile-actions">
            ${waClean ? `
              <a href="https://wa.me/${waIntl}?text=${waMsg}" target="_blank" rel="noopener" class="btn-kontak-wa">
                <span class="material-symbols-outlined" style="font-size:15px;">chat</span>
                <span>WhatsApp</span>
              </a>
            ` : ''}
            ${p.email ? `
              <a href="mailto:${p.email}" target="_blank" rel="noopener noreferrer" class="btn-kontak-email">
                <span class="material-symbols-outlined" style="font-size:15px;">mail</span>
                <span>Email</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const emptyStateHtml = `
    <div style="text-align:center;padding:36px 16px;background:var(--surface-2);border-radius:12px;color:var(--text-muted);grid-column:span 2;">
      <span class="material-symbols-outlined" style="font-size:40px;color:var(--border);">person_search</span>
      <h4 style="font-size:14px;color:var(--text);font-weight:700;margin:8px 0 4px;">Tidak Ditemukan Pengurus</h4>
      <p style="font-size:12px;margin:0;">Tidak ada pengurus daerah yang cocok dengan pencarian atau filter aktif.</p>
    </div>
  `;

  const viewContainer = document.getElementById('viewStrukturPengurus');
  const innerContentHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- HEADER ACTION BAR: SUBTITLE & SUPERADMIN BUTTON (Tampil di modal jika viewContainer tidak ada) -->
      ${!viewContainer && isSuper ? `
        <div style="display:flex;justify-content:flex-end;align-items:center;margin-bottom:6px;">
          <button type="button" id="btnBukaKelolaSemua" style="padding:6px 14px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;color:var(--blue);transition:all .15s ease;">
            <span class="material-symbols-outlined" style="font-size:18px;">manage_accounts</span>
            <span>Kelola Hak Akses</span>
          </button>
        </div>
      ` : ''}

      <!-- TABS BAR -->
      <div class="struktur-tabs-nav">
        <button type="button" class="struktur-tab-btn ${activeTab === 'all' ? 'active' : ''}" data-tab="all">
          <span>Semua Pengurus</span>
          <span class="struktur-tab-count">${totalAll}</span>
        </button>
        <button type="button" class="struktur-tab-btn ${activeTab === 'bph' ? 'active' : ''}" data-tab="bph">
          <span>Pengurus Harian (BPH)</span>
          <span class="struktur-tab-count">${totalBph}</span>
        </button>
        <button type="button" class="struktur-tab-btn ${activeTab === 'bidang' ? 'active' : ''}" data-tab="bidang">
          <span>Koordinator 14 Bidang</span>
          <span class="struktur-tab-count">${totalBidang}</span>
        </button>
      </div>

      <!-- SEARCH & FILTER BAR -->
      <div class="struktur-search-wrap">
        <div class="struktur-search-input-box">
          <span class="material-symbols-outlined struktur-search-icon">search</span>
          <input type="text" id="inputSearchStruktur" class="struktur-search-input" placeholder="Cari nama, peran/bidang, asal desa..." value="${searchQuery}" />
        </div>
        <button type="button" id="btnToggleFilterWilayah" class="btn-toggle-filter-wilayah ${isFilterOpen || filterDesa !== 'all' ? 'active' : ''}" title="Filter Asal Desa">
          <span class="material-symbols-outlined" style="font-size:17px;">filter_list</span>
          <span>Wilayah</span>
        </button>
        ${(searchQuery || filterDesa !== 'all') ? `
          <button type="button" id="btnResetFilterStruktur" style="padding:6px 8px;border:none;background:transparent;color:var(--blue);font-size:11.5px;font-weight:700;cursor:pointer;text-decoration:underline;white-space:nowrap;">
            Reset
          </button>
        ` : ''}
      </div>

      <!-- EXPANDABLE FILTER STRIP -->
      <div class="struktur-wilayah-strip ${isFilterOpen || filterDesa !== 'all' ? 'open' : ''}" id="stripFilterWilayah">
        <label style="font-size:11.5px;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:15px;">location_city</span>
          Filter Asal Desa:
        </label>
        <select id="selectFilterDesa" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:12px;background:var(--surface);outline:none;cursor:pointer;">
          ${filterDesaOptions}
        </select>
      </div>

      <!-- DATA LIST CONTAINER -->
      <div>
        <!-- 1. Desktop View (2 Columns Grid) -->
        <div class="struktur-desktop-grid">
          ${totalItems > 0 ? desktopCardsHtml : emptyStateHtml}
        </div>

        <!-- 2. Mobile View (Compact Accordion Cards) -->
        <div class="struktur-mobile-list">
          ${totalItems > 0 ? mobileCardsHtml : emptyStateHtml}
        </div>
      </div>

      <!-- PAGINATION CONTROLS (Standard Reusable Architecture) -->
      <div id="strukturPaginationWrap" class="pagination-wrap" style="margin-top: 14px;"></div>

    </div>
  `;

  if (viewContainer) {
    viewContainer.innerHTML = `
      <!-- ULTRA-COMPACT HEADER BAR (HEMAT RUANG VERTIKAL) -->
      <div class="flex items-center justify-between gap-2.5 bg-white dark:bg-slate-800/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <!-- Sisi Kiri: Tombol Back + Judul + Badge Angka -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <button type="button" class="btnBackToDashboardBreadcrumb p-1.5 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0" title="Kembali ke Beranda">
            <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
              <span class="material-symbols-outlined text-[19px]">diversity_2</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">Struktur Pengurus</h1>
                <span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                  ${filtered.length} Personel <span class="hidden sm:inline font-normal text-slate-400 dark:text-slate-500">/ ${totalAll} Total</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sisi Kanan: Tombol Kelola Hak Akses (Jika Superadmin) -->
        ${isSuper ? `
          <button type="button" id="btnBukaKelolaSemua" class="shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer" title="Kelola Hak Akses">
            <span class="material-symbols-outlined text-[17px]">manage_accounts</span>
            <span>Hak Akses</span>
          </button>
        ` : ''}
      </div>

      <!-- Main Card Body -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm space-y-4">
        ${innerContentHtml}
      </div>
    `;

    viewContainer.querySelectorAll('.btnBackToDashboardBreadcrumb').forEach(b => {
      b.addEventListener('click', showDashboardHomePage);
    });
  } else {
    openModal(`Struktur Pengurus PPG Solo Selatan (${filtered.length} Pengurus)`, 'diversity_2', 'large');
    modalBody.innerHTML = innerContentHtml;
  }

  const container = viewContainer || modalBody;

  // Attach Event Listeners
  // 1. Tab buttons
  container.querySelectorAll('.struktur-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      renderStrukturDaerahModal(tab, searchQuery, filterDesa, isFilterOpen, 1);
    });
  });

  // 2. Search input (live-filter)
  const inputSearch = document.getElementById('inputSearchStruktur');
  inputSearch?.addEventListener('input', (e) => {
    const q = e.target.value;
    renderStrukturDaerahModal(activeTab, q, filterDesa, isFilterOpen, 1);
    const updatedInput = document.getElementById('inputSearchStruktur');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(q.length, q.length);
    }
  });

  // 3. Toggle filter wilayah strip
  document.getElementById('btnToggleFilterWilayah')?.addEventListener('click', () => {
    const strip = document.getElementById('stripFilterWilayah');
    const btn = document.getElementById('btnToggleFilterWilayah');
    if (strip) {
      const isOpen = strip.classList.toggle('open');
      btn.classList.toggle('active', isOpen);
    }
  });

  // 4. Select filter desa
  const selDesa = document.getElementById('selectFilterDesa');
  selDesa?.addEventListener('change', () => {
    renderStrukturDaerahModal(activeTab, searchQuery, selDesa.value, true, 1);
  });

  // 5. Reset filter
  document.getElementById('btnResetFilterStruktur')?.addEventListener('click', () => {
    renderStrukturDaerahModal('all', '', 'all', false, 1);
  });

  // 6. Mobile accordion card toggle
  container.querySelectorAll('.btn-toggle-struktur-card').forEach(header => {
    header.addEventListener('click', () => {
      const idx = header.dataset.idx;
      const card = container.querySelector(`.struktur-mobile-card[data-idx="${idx}"]`);
      if (card) {
        card.classList.toggle('open');
      }
    });
  });

  // 7. Superadmin manage all button
  if (isSuper) {
    document.getElementById('btnBukaKelolaSemua')?.addEventListener('click', () => {
      renderManagePengurusModal('daerah');
    });
  }

  // 8. Pagination Bar (Standard Reusable Architecture)
  const paginWrap = container.querySelector('#strukturPaginationWrap');
  if (paginWrap) {
    renderPaginationBar({
      container: paginWrap,
      currentPage: currentPage,
      totalItems: totalItems,
      pageSize: strukturPageSize,
      pageSizeOptions: [9, 18, 27, 36],
      itemName: 'pengurus',
      maxVisiblePages: 5,
      showPageSize: true,
      showInfo: true,
      onPageChange: (newPage) => {
        renderStrukturDaerahModal(activeTab, searchQuery, filterDesa, isFilterOpen, newPage);
        const tEl = document.getElementById('viewStrukturPengurus') || document.querySelector('.modal-box');
        if (tEl) tEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
      onPageSizeChange: (newSize) => {
        strukturPageSize = newSize;
        renderStrukturDaerahModal(activeTab, searchQuery, filterDesa, isFilterOpen, 1);
      }
    });
  }
}

/* ── 3. Kelola Pengurus & Hak Akses (Superadmin) ────────────── */
export function renderManagePengurusModal(filterLevel = 'all', searchQuery = '', currentPage = 1) {
  const allList = getPengurusList();

  let filtered = allList.filter(p => {
    if (filterLevel === 'daerah' && p.tingkatan !== 'daerah') return false;
    if (filterLevel === 'desa' && p.tingkatan !== 'desa') return false;
    if (filterLevel === 'kelompok' && p.tingkatan !== 'kelompok') return false;
    if (filterLevel === 'inactive' && p.isActive !== false) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.nama || '').toLowerCase().includes(q);
      const matchEmail = (p.email || '').toLowerCase().includes(q);
      const matchPeran = (p.peran || p.jabatan || '').toLowerCase().includes(q);
      const matchWilayah = (p.desaNama || '').toLowerCase().includes(q) || (p.kelompokNama || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPeran && !matchWilayah) return false;
    }
    return true;
  });

  const totalCount = allList.length;
  const activeCount = allList.filter(p => p.isActive !== false && p.statusApproval === 'approved').length;
  const inactiveCount = allList.filter(p => p.isActive === false).length;

  // Pagination parameters
  const itemsPerPage = 10;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filtered.slice(startIndex, startIndex + itemsPerPage);

  let pengurusCardsHtml = paginatedList.map(p => {
    const isSelf = currentUser && (p.id === currentUser.id || p.email === currentUser.email);
    const isActive = p.isActive !== false;
    const isPending = p.statusApproval === 'pending';

    let levelBadgeClass = 'bg-blue-50 dark:bg-blue-950/40 text-brandBlue dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60';
    let levelLabel = 'Daerah (Superadmin)';

    if (p.tingkatan === 'desa') {
      levelBadgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60';
      levelLabel = p.desaNama ? `Desa ${p.desaNama}` : 'Desa';
    } else if (p.tingkatan === 'kelompok') {
      levelBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/60';
      levelLabel = p.kelompokNama ? `Kel. ${p.kelompokNama}` : 'Kelompok';
    }

    let statusChip = isActive
      ? `<span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Aktif</span>`
      : `<span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Nonaktif</span>`;

    if (isPending) {
      statusChip = `<span class="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending</span>`;
    }

    let toggleBtnHtml = '';
    if (!isSelf) {
      if (isActive) {
        toggleBtnHtml = `
          <button type="button" class="btn-toggle-active px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-100/70 transition-all flex items-center gap-1 cursor-pointer shrink-0" data-id="${p.id}" data-name="${p.nama}" data-target="false" title="Nonaktifkan akun">
            <span class="material-symbols-outlined text-[15px]">block</span>
            <span class="btn-label-text">Nonaktifkan</span>
          </button>
        `;
      } else {
        toggleBtnHtml = `
          <button type="button" class="btn-toggle-active px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0" data-id="${p.id}" data-name="${p.nama}" data-target="true" title="Aktifkan akun">
            <span class="material-symbols-outlined text-[15px]">check_circle</span>
            <span class="btn-label-text">Aktifkan</span>
          </button>
        `;
      }
    } else {
      toggleBtnHtml = `<span class="text-xs text-slate-400 italic px-2 py-1 shrink-0">(Akun Anda)</span>`;
    }

    const editBtnHtml = `
      <button type="button" class="btn-edit-pengurus px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brandBlue dark:text-blue-400 text-xs font-bold hover:bg-blue-50/70 dark:hover:bg-blue-950/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0" data-id="${p.id}" title="Edit data &amp; hak akses">
        <span class="material-symbols-outlined text-[15px]">edit_note</span>
        <span class="btn-label-text">Edit &amp; Hak Akses</span>
      </button>
    `;

    // Tombol hapus — tidak muncul untuk diri sendiri
    const deleteBtnHtml = isSelf ? '' : `
      <button type="button" class="btn-hapus-pengurus w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center justify-center shrink-0" data-id="${p.id}" data-name="${p.nama}" title="Hapus akun pengurus">
        <span class="material-symbols-outlined text-[16px]">delete</span>
      </button>
    `;

    const roleDisplay = p.peran === 'Pengurus Kelompok' ? 'Pengurus' : (p.peran || p.jabatan || 'Pengurus');
    const asalTxt = p.kelompokNama ? `${p.kelompokNama} &bull; ${p.desaNama || '-'}` : (p.desaNama || '-');

    const initials = (p.nama || 'Pengurus')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('') || 'P';

    return `
      <div class="rounded-2xl p-4 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-sm transition-all flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-800 text-brandBlue dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-slate-600 shadow-2xs select-none">
              ${initials}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <strong class="font-extrabold text-sm text-slate-900 dark:text-white truncate">${p.nama}</strong>
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${levelBadgeClass} shrink-0">${levelLabel}</span>
              </div>
              <p class="text-xs font-semibold text-brandBlue dark:text-blue-400 mt-0.5 truncate">${roleDisplay}</p>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                <span class="material-symbols-outlined text-[13px] text-brandBlue shrink-0">location_on</span>
                <span>Asal: <strong>${asalTxt}</strong></span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="inline-flex items-center gap-1 min-w-0">
                  <span class="material-symbols-outlined text-[13px] text-slate-400 shrink-0">mail</span>
                  <span class="truncate">${p.email}</span>
                </span>
                ${p.noWa ? `
                  <a href="https://wa.me/${p.noWa.replace(/^0/, '62').replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium shrink-0">
                    <span class="material-symbols-outlined text-[13px] shrink-0">chat</span>
                    <span>${p.noWa}</span>
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="shrink-0">
            ${statusChip}
          </div>
        </div>

        <!-- Action Bar -->
        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/80 pt-2.5 mt-0.5 gap-2 flex-wrap">
          <span class="text-[11px] text-slate-400 font-medium">
            Tingkat: <strong class="text-slate-700 dark:text-slate-200 capitalize">${p.tingkatan}</strong>
          </span>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${editBtnHtml}
            ${toggleBtnHtml}
            ${deleteBtnHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (filtered.length === 0) {
    pengurusCardsHtml = `
      <div class="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <span class="material-symbols-outlined text-[42px] text-slate-400 mb-2 block">person_search</span>
        <h4 class="font-bold text-sm text-slate-700 dark:text-slate-200">Tidak ada pengurus ditemukan</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau tab filter tingkatan di atas.</p>
      </div>
    `;
  }

  // Pagination Builder
  let paginationHtml = '';
  if (totalItems > 0) {
    let pageButtonsHtml = '';
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      pageButtonsHtml += `
        <button type="button" class="pengurus-page-btn w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors" data-page="1">1</button>
      `;
      if (startPage > 2) {
        pageButtonsHtml += `<span class="text-slate-400 px-1">&hellip;</span>`;
      }
    }

    for (let pNum = startPage; pNum <= endPage; pNum++) {
      const isActivePage = pNum === currentPage;
      pageButtonsHtml += `
        <button type="button" class="pengurus-page-btn w-8 h-8 rounded-lg border ${isActivePage ? 'border-brandBlue bg-brandBlue text-white font-extrabold shadow-xs' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50'} text-xs cursor-pointer transition-colors" data-page="${pNum}">
          ${pNum}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtonsHtml += `<span class="text-slate-400 px-1">&hellip;</span>`;
      }
      pageButtonsHtml += `
        <button type="button" class="pengurus-page-btn w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors" data-page="${totalPages}">${totalPages}</button>
      `;
    }

    paginationHtml = `
      <div class="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap text-xs">
        <span class="text-slate-500 dark:text-slate-400">
          Menampilkan <strong>${startIndex + 1} &ndash; ${Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong>${totalItems}</strong> pengurus
        </span>
        ${totalPages > 1 ? `
        <div class="flex items-center gap-1.5">
          <button type="button" class="pengurus-page-btn btn-prev px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" title="Halaman Sebelumnya">
            <span class="material-symbols-outlined text-[16px]">chevron_left</span> <span class="btn-label-text">Prev</span>
          </button>
          ${pageButtonsHtml}
          <button type="button" class="pengurus-page-btn btn-next px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" title="Halaman Selanjutnya">
            <span class="btn-label-text">Next</span> <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
        ` : ''}
      </div>
    `;
  }

  openModal('Kelola Pengurus & Hak Akses (Superadmin)', 'manage_accounts', 'large');
  modalBody.innerHTML = `
    <div class="space-y-3.5">
      <!-- 3 KPI STAT CARDS POLISHED -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div class="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-center flex flex-col items-center justify-center shadow-2xs">
          <span class="text-[10px] sm:text-[10.5px] font-extrabold text-blue-700/80 dark:text-blue-300 uppercase tracking-wider block">Total Pengurus</span>
          <strong class="text-lg sm:text-2xl font-black text-brandBlue dark:text-blue-400 mt-0.5 leading-tight">${totalCount}</strong>
        </div>
        <div class="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-center flex flex-col items-center justify-center shadow-2xs">
          <span class="text-[10px] sm:text-[10.5px] font-extrabold text-emerald-700/80 dark:text-emerald-300 uppercase tracking-wider block">Akun Aktif</span>
          <strong class="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 leading-tight">${activeCount}</strong>
        </div>
        <div class="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-center flex flex-col items-center justify-center shadow-2xs">
          <span class="text-[10px] sm:text-[10.5px] font-extrabold text-rose-700/80 dark:text-rose-300 uppercase tracking-wider block">Dinonaktifkan</span>
          <strong class="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 leading-tight">${inactiveCount}</strong>
        </div>
      </div>

      <!-- SEARCH & FILTER TOOLBAR -->
      <div class="flex flex-col gap-2.5">
        <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div class="relative flex items-center flex-1 min-w-[200px]">
            <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px] pointer-events-none">search</span>
            <input type="text" id="inputSearchPengurus" placeholder="Cari nama, email, peran, wilayah..." value="${searchQuery}" class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs" />
          </div>
          <button type="button" id="btnTambahPengurusModal" class="px-4 py-2.5 rounded-xl bg-brandBlue hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0" title="Tambah Pengurus Baru">
            <span class="material-symbols-outlined text-[17px]">person_add</span>
            <span>Tambah Pengurus</span>
          </button>
        </div>
        
        <!-- Filter Tabs (Segmented Pills) -->
        <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1" id="filterTabsWrap">
          <button type="button" class="filter-tab-btn px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border ${filterLevel === 'all' ? 'bg-brandBlue text-white border-brandBlue shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}" data-filter="all">Semua (${totalCount})</button>
          <button type="button" class="filter-tab-btn px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border ${filterLevel === 'daerah' ? 'bg-brandBlue text-white border-brandBlue shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}" data-filter="daerah">Daerah</button>
          <button type="button" class="filter-tab-btn px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border ${filterLevel === 'desa' ? 'bg-brandBlue text-white border-brandBlue shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}" data-filter="desa">Desa</button>
          <button type="button" class="filter-tab-btn px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border ${filterLevel === 'kelompok' ? 'bg-brandBlue text-white border-brandBlue shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}" data-filter="kelompok">Kelompok</button>
          <button type="button" class="filter-tab-btn px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-all border ${filterLevel === 'inactive' ? 'bg-brandBlue text-white border-brandBlue shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}" data-filter="inactive">Nonaktif (${inactiveCount})</button>
        </div>
      </div>

      <!-- CARDS LIST -->
      <div class="space-y-3">
        ${pengurusCardsHtml}
      </div>

      ${paginationHtml}
    </div>
  `;

  modalBody.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedFilter = btn.dataset.filter;
      const currentQuery = document.getElementById('inputSearchPengurus')?.value || '';
      renderManagePengurusModal(selectedFilter, currentQuery, 1);
    });
  });

  // Listener tombol navigasi pagination
  modalBody.querySelectorAll('.pengurus-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pNum = parseInt(btn.dataset.page, 10);
      if (pNum && pNum >= 1 && pNum <= totalPages && pNum !== currentPage) {
        const currentQuery = document.getElementById('inputSearchPengurus')?.value || '';
        renderManagePengurusModal(filterLevel, currentQuery, pNum);
      }
    });
  });

  const searchInput = document.getElementById('inputSearchPengurus');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value;
    renderManagePengurusModal(filterLevel, q, 1);
    const updatedInput = document.getElementById('inputSearchPengurus');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(q.length, q.length);
    }
  });

  modalBody.querySelector('#btnTambahPengurusModal')?.addEventListener('click', () => {
    renderEditPengurusModal('new', filterLevel, 'manage', currentPage);
  });

  modalBody.querySelectorAll('.btn-edit-pengurus').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      renderEditPengurusModal(pId, filterLevel, 'manage', currentPage);
    });
  });

  modalBody.querySelectorAll('.btn-toggle-active').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      const pName = btn.dataset.name;
      const makeActive = btn.dataset.target === 'true';

      if (makeActive) {
        showConfirmModal({
          title: 'Aktifkan Kembali Akun',
          message: `Apakah Anda yakin ingin mengaktifkan kembali akun pengurus "${pName}"? Pengurus ini akan dapat login kembali.`,
          icon: 'check_circle',
          iconBg: 'var(--green-pastel)',
          iconColor: 'var(--green-dark)',
          confirmText: 'Ya, Aktifkan',
          confirmBtnColor: 'var(--green-dark)',
          onConfirm: async () => {
            await togglePengurusActive(pId, true);
            showToast(`Akun pengurus "${pName}" berhasil diaktifkan kembali.`, 'success');
            renderManagePengurusModal(filterLevel, searchQuery, currentPage);
            appHooks.renderKelompokGrid();
            appHooks.renderUserProfile();
          }
        });
      } else {
        showConfirmModal({
          title: 'Nonaktifkan Akun Pengurus',
          message: `Apakah Anda yakin ingin menonaktifkan akun "${pName}"? Pengurus ini TIDAK akan bisa mengakses aplikasi sampai diaktifkan kembali oleh Superadmin.`,
          icon: 'block',
          iconBg: 'var(--red-light)',
          iconColor: 'var(--red)',
          confirmText: 'Ya, Nonaktifkan',
          confirmBtnColor: 'var(--red)',
          onConfirm: async () => {
            await togglePengurusActive(pId, false);
            showToast(`Akun pengurus "${pName}" berhasil dinonaktifkan.`, 'warning');
            renderManagePengurusModal(filterLevel, searchQuery, currentPage);
            appHooks.renderKelompokGrid();
            appHooks.renderUserProfile();
          }
        });
      }
    });
  });

  modalBody.querySelectorAll('.btn-hapus-pengurus').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      const pName = btn.dataset.name;
      showConfirmModal({
        title: 'Hapus Akun Pengurus',
        message: `Apakah Anda yakin ingin menghapus akun "<strong>${pName}</strong>" secara permanen?<br/><br/>Tindakan ini tidak dapat dibatalkan dan akan menghapus data pengurus dari sistem.`,
        icon: 'delete_forever',
        iconBg: '#fef2f2',
        iconColor: '#dc2626',
        confirmText: 'Ya, Hapus Permanen',
        confirmBtnColor: '#dc2626',
        onConfirm: async () => {
          const res = await deletePengurus(pId);
          if (res.success) {
            showToast(res.message, 'success');
            const remaining = getPengurusList().length;
            const updatedTotalPages = Math.max(1, Math.ceil(remaining / itemsPerPage));
            const newPage = Math.min(currentPage, updatedTotalPages);
            renderManagePengurusModal(filterLevel, searchQuery, newPage);
            appHooks.renderKelompokGrid();
            appHooks.renderUserProfile();
          } else {
            showToast(res.message, 'danger');
          }
        }
      });
    });
  });
}

/* ── 4. Modal Edit Detail Pengurus & Hak Akses / Tambah Pengurus ──────────────── */
export function renderEditPengurusModal(pengurusId, returnFilter = 'all', source = 'manage', returnPage = 1) {
  const isNew = pengurusId === 'new' || !pengurusId;
  const p = isNew
    ? {
        id: null,
        nama: '',
        email: '',
        noWa: '',
        tingkatan: 'kelompok',
        peran: 'Pamong Caberawit (Paud - SD)',
        desaId: 'desa-barat',
        kelompokId: 'kel-gentan',
        isActive: true
      }
    : getPengurusById(pengurusId);

  if (!p) return;

  const currentDesaId = p.desaId || 'desa-barat';
  const currentKelId = p.kelompokId || 'kel-gentan';
  const currentTingkat = p.tingkatan || 'kelompok';
  const currentPeran = p.peran || p.jabatan || 'Pamong Caberawit (Paud - SD)';

  let desaOptions = MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" data-name="${d.nama}" ${currentDesaId === d.id ? 'selected' : ''}>${d.nama}</option>
  `).join('');

  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === currentDesaId) || MASTER_WILAYAH.desa[0];
  let kelOptions = currentDesa.kelompok.map(k => `
    <option value="${k.id}" data-name="${k.nama}" ${currentKelId === k.id ? 'selected' : ''}>${k.nama}</option>
  `).join('');

  const rolesList = getRolesByTingkatan(currentTingkat);
  let peranOptions = rolesList.map(r => `
    <option value="${r}" ${currentPeran === r ? 'selected' : ''}>${r}</option>
  `).join('');

  const modalTitleText = isNew ? 'Tambah Pengurus Baru' : `Edit Pengurus: ${p.nama}`;
  const modalIconName = isNew ? 'person_add' : 'edit_note';

  const selectChevronStyle = `appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:13px_13px] bg-[right_12px_center] bg-no-repeat`;

  openModal(modalTitleText, modalIconName, 'default');
  modalBody.innerHTML = `
    <form id="formEditPengurus" class="flex flex-col gap-3.5">
      <!-- Info Header Banner -->
      <div class="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 shadow-2xs">
        <span class="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">info</span>
        <div class="leading-relaxed">
          <strong class="font-extrabold block text-amber-900 dark:text-amber-100">${isNew ? 'Tambah Akun Pengurus Baru' : 'Kelola Hak Akses &amp; Asal Wilayah Pengurus'}</strong>
          <span class="text-[11.5px] opacity-90">${isNew ? 'Akun baru yang dibuat langsung aktif dan dapat langsung digunakan login.' : 'Setiap pengurus di tingkat Daerah, Desa, maupun Kelompok memiliki basis asal Kelompok dan Desa.'}</span>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Nama Lengkap <span class="text-rose-500">*</span></label>
        <input type="text" id="editNama" value="${p.nama}" required placeholder="Masukkan nama lengkap pengurus..." class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Email Akun <span class="text-rose-500">*</span></label>
          <input type="email" id="editEmail" value="${p.email}" required placeholder="email@contoh.org" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs" />
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Nomor WhatsApp <span class="text-rose-500">*</span></label>
          <input type="text" id="editNoWa" value="${p.noWa || ''}" required placeholder="08xxxxxxxxxx" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs" />
        </div>
      </div>

      ${isNew ? `
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Kata Sandi Awal (Password)</label>
        <input type="password" id="editPassword" placeholder="Default: 123456 (Minimal 6 karakter)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs" />
      </div>
      ` : ''}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Tingkatan Hak Akses <span class="text-rose-500">*</span></label>
          <select id="editTingkatan" class="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs cursor-pointer ${selectChevronStyle}">
            <option value="kelompok" ${currentTingkat === 'kelompok' ? 'selected' : ''}>Pamong Kelompok</option>
            <option value="desa" ${currentTingkat === 'desa' ? 'selected' : ''}>Koordinator Desa</option>
            <option value="daerah" ${currentTingkat === 'daerah' ? 'selected' : ''}>Superadmin Daerah (Pengurus PPG)</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Jabatan / Peran <span class="text-rose-500">*</span></label>
          <select id="editPeran" class="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs cursor-pointer ${selectChevronStyle}">
            ${peranOptions}
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="rowWilayahSelect">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Asal Desa <span class="text-rose-500">*</span></label>
          <select id="editDesa" class="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs cursor-pointer ${selectChevronStyle}">
            ${desaOptions}
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Asal Kelompok <span class="text-rose-500">*</span></label>
          <select id="editKelompok" class="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs cursor-pointer ${selectChevronStyle}">
            ${kelOptions}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">Status Akun</label>
        <select id="editStatusActive" class="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-brandBlue focus:ring-4 focus:ring-blue-500/10 transition-all shadow-2xs cursor-pointer ${selectChevronStyle}">
          <option value="true" ${p.isActive !== false ? 'selected' : ''}>Aktif (Dapat Login)</option>
          <option value="false" ${p.isActive === false ? 'selected' : ''}>Dinonaktifkan (Tidak Dapat Login)</option>
        </select>
      </div>

      <!-- Info Keamanan: Kata sandi bersifat privat -->
      <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5 shadow-2xs">
        <span class="material-symbols-outlined text-[19px] text-brandBlue shrink-0">lock</span>
        <span class="leading-relaxed">Kata sandi bersifat privat. Pengurus dapat memperbarui kata sandinya secara mandiri melalui menu <b>Edit Profil</b>.</span>
      </div>

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" class="btn-sticky-back btn-cancel-edit-p" title="Kembali ke Tabel">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali</span>
        </button>
        <button type="submit" class="btn-sticky-save" title="${isNew ? 'Tambah Pengurus' : 'Simpan Perubahan'}">
          <span class="material-symbols-outlined">${isNew ? 'person_add' : 'save'}</span>
          <span class="btn-text">${isNew ? 'Tambah Pengurus' : 'Simpan Perubahan'}</span>
        </button>
      </div>
    </form>
  `;

  const editTingkatan = document.getElementById('editTingkatan');
  const editPeran = document.getElementById('editPeran');
  const editDesa = document.getElementById('editDesa');
  const editKelompok = document.getElementById('editKelompok');

  editTingkatan?.addEventListener('change', () => {
    const selectedTingkat = editTingkatan.value;
    const newRoles = getRolesByTingkatan(selectedTingkat);
    editPeran.innerHTML = newRoles.map(r => `<option value="${r}">${r}</option>`).join('');
  });

  editDesa?.addEventListener('change', () => {
    const selectedDesaId = editDesa.value;
    const foundDesa = MASTER_WILAYAH.desa.find(d => d.id === selectedDesaId);
    if (foundDesa) {
      const sortedKels = [...foundDesa.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));
      editKelompok.innerHTML = sortedKels.map(k => `<option value="${k.id}" data-name="${k.nama}">${k.nama}</option>`).join('');
    }
  });

  document.querySelector('.btn-cancel-edit-p')?.addEventListener('click', () => {
    if (source === 'struktur') {
      renderStrukturDaerahModal();
    } else {
      renderManagePengurusModal(returnFilter, '', returnPage);
    }
  });

  document.getElementById('formEditPengurus')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tingkatanVal = editTingkatan.value;
    const selectedDesaOption = editDesa.options[editDesa.selectedIndex];
    const selectedKelOption = editKelompok.options[editKelompok.selectedIndex];
    const roleVal = editPeran.value;

    const updateData = {
      nama: document.getElementById('editNama').value.trim(),
      email: document.getElementById('editEmail').value.trim(),
      noWa: document.getElementById('editNoWa').value.trim(),
      tingkatan: tingkatanVal,
      peran: roleVal,
      jabatan: roleVal,
      desaId: editDesa.value,
      desaNama: selectedDesaOption?.dataset.name || 'Barat',
      kelompokId: editKelompok.value,
      kelompokNama: selectedKelOption?.dataset.name || 'Gentan',
      isActive: document.getElementById('editStatusActive').value === 'true'
    };

    const submitBtn = document.querySelector('#formEditPengurus button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> Menyimpan...`;

    let res;
    if (isNew) {
      const passVal = document.getElementById('editPassword')?.value.trim() || '123456';
      res = await registerNewPengurus({
        ...updateData,
        password: passVal,
        statusApproval: 'approved'
      });
    } else {
      res = await updatePengurus(p.id, updateData);
    }

    if (submitBtn) submitBtn.innerHTML = isNew ? 'Tambah Pengurus' : 'Simpan Perubahan';
    
    if (res.success) {
      showToast(isNew ? `Pengurus baru "${updateData.nama}" berhasil ditambahkan!` : `Data pengurus "${updateData.nama}" berhasil diperbarui!`, 'success');
      appHooks.renderKelompokGrid();
      if (source === 'struktur') {
        renderStrukturDaerahModal();
      } else {
        renderManagePengurusModal(returnFilter, '', returnPage);
      }
      appHooks.renderUserProfile();
    } else {
      showToast(res.message || 'Gagal menyimpan data pengurus.', 'danger');
    }
  });
}
