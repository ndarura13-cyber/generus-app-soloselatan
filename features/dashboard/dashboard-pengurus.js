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
  deletePengurus
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js';

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

  if (!currentUser || (!currentUser.isSuperadmin && currentUser.tingkatan !== 'daerah')) {
    if (cardPending) cardPending.style.display = 'none';
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

  const itemsHtml = pendingList.map(p => `
    <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <strong style="font-size:14px;color:var(--text);">${p.nama}</strong>
          <div style="font-size:12px;color:var(--blue);font-weight:600;margin-top:2px;">${p.peran || p.jabatan || 'Pamong'}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
            📧 ${p.email} &bull; 📱 ${p.noWa || '-'}
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
            📍 Asal: Kelompok <strong>${p.kelompokNama || '-'}</strong>, Desa <strong>${p.desaNama || '-'}</strong>
          </div>
        </div>
        <span style="font-size:10px;font-weight:800;padding:3px 8px;border-radius:20px;background:var(--gold-light);color:#8a6a00;">Pending</span>
      </div>

      <div style="display:flex;gap:8px;margin-top:4px;">
        <button type="button" class="btn-action-approve" data-id="${p.id}" data-name="${p.nama}" style="flex:1;padding:8px 12px;border:none;background:var(--green-dark);color:#fff;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">check</span> Setujui Akun
        </button>
        <button type="button" class="btn-action-reject" data-id="${p.id}" data-name="${p.nama}" style="padding:8px 12px;border:1px solid var(--border);background:var(--surface);color:#dc2626;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">close</span> Tolak
        </button>
      </div>
    </div>
  `).join('');

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
export function renderStrukturDaerahModal(activeTab = 'all', searchQuery = '', filterDesa = 'all', isFilterOpen = false) {
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
    <option value="${d.id}" ${filterDesa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>
  `).join('');

  // 1. DESKTOP CARDS HTML (2-Column Grid)
  const desktopCardsHtml = filtered.map((p, idx) => {
    const isP_Bph = isBph(p);
    const waClean = (p.noWa || '').replace(/[^0-9]/g, '');
    const waIntl = waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean;
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const roleName = p.peran || p.jabatan || 'Pengurus Daerah';
    const initial = (p.nama || 'P').trim().charAt(0).toUpperCase();
    const asalTxt = `${p.kelompokNama ? 'Kel. ' + p.kelompokNama + ' &bull; ' : ''}Desa ${p.desaNama || '-'}`;

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
            <a href="mailto:${p.email}" class="btn-kontak-email" title="Kirim Email ke ${p.nama}">
              <span class="material-symbols-outlined" style="font-size:14px;">mail</span>
              <span>Email</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // 2. MOBILE CARDS HTML (Compact Accordion Cards)
  const mobileCardsHtml = filtered.map((p, idx) => {
    const isP_Bph = isBph(p);
    const waClean = (p.noWa || '').replace(/[^0-9]/g, '');
    const waIntl = waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean;
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const roleName = p.peran || p.jabatan || 'Pengurus Daerah';
    const initial = (p.nama || 'P').trim().charAt(0).toUpperCase();
    const asalTxt = `${p.kelompokNama ? 'Kel. ' + p.kelompokNama + ' &bull; ' : ''}Desa ${p.desaNama || '-'}`;

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
              <a href="mailto:${p.email}" class="btn-kontak-email">
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

  openModal(`Struktur Pengurus PPG Solo Selatan (${filtered.length} Pengurus)`, 'diversity_2', 'large');
  modalBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">

      <!-- HEADER ACTION BAR: SUBTITLE & SUPERADMIN BUTTON -->
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
          <p style="margin:0;font-size:12px;color:var(--text-muted);">
            Jajaran Pengurus PPG Daerah Solo Selatan &bull; Masa Bakti Berjalan
          </p>
        </div>
        ${isSuper ? `
          <button type="button" id="btnBukaKelolaSemua" style="padding:6px 12px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;color:var(--blue);transition:all .15s ease;">
            <span class="material-symbols-outlined" style="font-size:16px;">manage_accounts</span>
            <span>Kelola Hak Akses</span>
          </button>
        ` : ''}
      </div>

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

      <!-- DATA LIST CONTAINER (SMOOTH SCROLL AREA) -->
      <div style="max-height:48vh;overflow-y:auto;padding-right:2px;" class="custom-scrollbar">
        <!-- 1. Desktop View (2 Columns Grid) -->
        <div class="struktur-desktop-grid">
          ${filtered.length > 0 ? desktopCardsHtml : emptyStateHtml}
        </div>

        <!-- 2. Mobile View (Compact Accordion Cards) -->
        <div class="struktur-mobile-list">
          ${filtered.length > 0 ? mobileCardsHtml : emptyStateHtml}
        </div>
      </div>

      <!-- STICKY FOOTER NAVIGATION -->
      <div class="modal-sticky-footer">
        <button type="button" class="btn-sticky-back" id="btnCloseStrukturModal" title="Tutup Modal">
          <span class="material-symbols-outlined">close</span>
          <span class="btn-text">Tutup</span>
        </button>
      </div>

    </div>
  `;

  // Attach Event Listeners
  // 1. Tab buttons
  document.querySelectorAll('.struktur-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      renderStrukturDaerahModal(tab, searchQuery, filterDesa, isFilterOpen);
    });
  });

  // 2. Search input (live-filter)
  const inputSearch = document.getElementById('inputSearchStruktur');
  inputSearch?.addEventListener('input', (e) => {
    const q = e.target.value;
    renderStrukturDaerahModal(activeTab, q, filterDesa, isFilterOpen);
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
    renderStrukturDaerahModal(activeTab, searchQuery, selDesa.value, true);
  });

  // 5. Reset filter
  document.getElementById('btnResetFilterStruktur')?.addEventListener('click', () => {
    renderStrukturDaerahModal('all', '', 'all', false);
  });

  // 6. Mobile accordion card toggle
  document.querySelectorAll('.btn-toggle-struktur-card').forEach(header => {
    header.addEventListener('click', () => {
      const idx = header.dataset.idx;
      const card = document.querySelector(`.struktur-mobile-card[data-idx="${idx}"]`);
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

  // 8. Close button in sticky footer
  document.getElementById('btnCloseStrukturModal')?.addEventListener('click', () => {
    closeModal();
  });
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

    let levelBadgeBg = 'var(--blue-light)';
    let levelBadgeColor = 'var(--blue-dark)';
    let levelLabel = 'Daerah (Superadmin)';

    if (p.tingkatan === 'desa') {
      levelBadgeBg = 'var(--gold-light)';
      levelBadgeColor = '#8a6a00';
      levelLabel = `Desa ${p.desaNama || '-'}`;
    } else if (p.tingkatan === 'kelompok') {
      levelBadgeBg = 'var(--green-pastel)';
      levelBadgeColor = 'var(--green-dark)';
      levelLabel = `Kelompok ${p.kelompokNama || '-'} (${p.desaNama || '-'})`;
    }

    let statusChip = isActive
      ? `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:#e8f7ee;color:#2e8b57;display:inline-flex;align-items:center;gap:4px;"><span class="dot ongoing" style="width:6px;height:6px;"></span> Aktif</span>`
      : `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;gap:4px;"><span class="dot done" style="width:6px;height:6px;background:#dc2626;"></span> Nonaktif</span>`;

    if (isPending) {
      statusChip = `<span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;background:var(--gold-light);color:#8a6a00;">Pending</span>`;
    }

    let toggleBtnHtml = '';
    if (!isSelf) {
      if (isActive) {
        toggleBtnHtml = `
          <button type="button" class="btn-toggle-active" data-id="${p.id}" data-name="${p.nama}" data-target="false" style="padding:6px 12px;border-radius:8px;border:1px solid #fca5a5;background:var(--surface);color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Nonaktifkan akun">
            <span class="material-symbols-outlined" style="font-size:16px;">block</span>
            <span class="btn-label-text">Nonaktifkan</span>
          </button>
        `;
      } else {
        toggleBtnHtml = `
          <button type="button" class="btn-toggle-active" data-id="${p.id}" data-name="${p.nama}" data-target="true" style="padding:6px 12px;border-radius:8px;border:none;background:var(--green-dark);color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Aktifkan akun">
            <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span>
            <span class="btn-label-text">Aktifkan</span>
          </button>
        `;
      }
    } else {
      toggleBtnHtml = `<span style="font-size:11px;color:var(--text-muted);font-style:italic;">(Akun Anda)</span>`;
    }

    const editBtnHtml = `
      <button type="button" class="btn-edit-pengurus" data-id="${p.id}" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface);color:var(--blue);font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Edit data &amp; hak akses">
        <span class="material-symbols-outlined" style="font-size:16px;">edit_note</span>
        <span class="btn-label-text">Edit &amp; Hak Akses</span>
      </button>
    `;

    // Tombol hapus — tidak muncul untuk diri sendiri & hanya 1 superadmin
    const deleteBtnHtml = isSelf ? '' : `
      <button type="button" class="btn-hapus-pengurus" data-id="${p.id}" data-name="${p.nama}" style="padding:6px 10px;border-radius:8px;border:1.5px solid #fca5a5;background:var(--surface);color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Hapus akun pengurus">
        <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
        <span class="btn-label-text">Hapus</span>
      </button>
    `;

    const asalTxt = `Kelompok ${p.kelompokNama || '-'} &bull; Desa ${p.desaNama || '-'}`;

    return `
      <div style="background:var(--surface-2);border:1px solid ${isActive ? 'var(--border)' : '#fca5a5'};border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;transition:var(--transition);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong style="font-size:14px;color:var(--text);">${p.nama}</strong>
              <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:${levelBadgeBg};color:${levelBadgeColor};">${levelLabel}</span>
            </div>
            <div style="font-size:12px;color:var(--blue);font-weight:600;margin-top:2px;">${p.peran || p.jabatan || 'Pengurus'}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">📍 Asal: <strong>${asalTxt}</strong></div>
            <div style="font-size:11px;color:var(--text-muted);">📧 ${p.email} &bull; 📱 ${p.noWa || '-'}</div>
          </div>
          <div style="text-align:right;">
            ${statusChip}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border);padding-top:10px;margin-top:2px;">
          <span style="font-size:11px;color:var(--text-muted);">
            Tingkat: <strong style="text-transform:capitalize;">${p.tingkatan}</strong>
          </span>
          <div style="display:flex;gap:6px;align-items:center;">
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
      <div style="text-align:center;padding:32px 10px;color:var(--text-muted);">
        <span class="material-symbols-outlined" style="font-size:40px;color:var(--border);margin-bottom:6px;">person_search</span>
        <p style="font-size:13px;">Tidak ada data pengurus yang sesuai filter.</p>
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
        <button type="button" class="pengurus-page-btn" data-page="1" style="min-width:32px;height:32px;padding:0 6px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;cursor:pointer;">1</button>
      `;
      if (startPage > 2) {
        pageButtonsHtml += `<span style="color:var(--text-muted);padding:0 2px;">&hellip;</span>`;
      }
    }

    for (let pNum = startPage; pNum <= endPage; pNum++) {
      const isActivePage = pNum === currentPage;
      pageButtonsHtml += `
        <button type="button" class="pengurus-page-btn ${isActivePage ? 'active' : ''}" data-page="${pNum}" style="min-width:32px;height:32px;padding:0 6px;border-radius:8px;border:1px solid ${isActivePage ? 'var(--blue)' : 'var(--border)'};background:${isActivePage ? 'var(--blue)' : 'var(--surface)'};color:${isActivePage ? '#ffffff' : 'var(--text)'};font-size:12px;font-weight:800;cursor:pointer;">
          ${pNum}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtonsHtml += `<span style="color:var(--text-muted);padding:0 2px;">&hellip;</span>`;
      }
      pageButtonsHtml += `
        <button type="button" class="pengurus-page-btn" data-page="${totalPages}" style="min-width:32px;height:32px;padding:0 6px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;cursor:pointer;">${totalPages}</button>
      `;
    }

    paginationHtml = `
      <div class="pengurus-pagination-bar" style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid var(--border);flex-wrap:wrap;margin-top:4px;">
        <span style="font-size:12px;color:var(--text-muted);">
          Menampilkan <strong>${startIndex + 1} &ndash; ${Math.min(startIndex + itemsPerPage, totalItems)}</strong> dari <strong>${totalItems}</strong> pengurus
        </span>
        ${totalPages > 1 ? `
        <div style="display:flex;align-items:center;gap:4px;">
          <button type="button" class="pengurus-page-btn btn-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:11.5px;font-weight:700;cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'};opacity:${currentPage === 1 ? '0.4' : '1'};display:inline-flex;align-items:center;gap:3px;" title="Halaman Sebelumnya">
            <span class="material-symbols-outlined" style="font-size:16px;">chevron_left</span> <span class="btn-label-text">Prev</span>
          </button>
          ${pageButtonsHtml}
          <button type="button" class="pengurus-page-btn btn-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:11.5px;font-weight:700;cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'};opacity:${currentPage === totalPages ? '0.4' : '1'};display:inline-flex;align-items:center;gap:3px;" title="Halaman Selanjutnya">
            <span class="btn-label-text">Next</span> <span class="material-symbols-outlined" style="font-size:16px;">chevron_right</span>
          </button>
        </div>
        ` : ''}
      </div>
    `;
  }

  openModal('Kelola Pengurus & Hak Akses (Superadmin)', 'manage_accounts', 'large');
  modalBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;background:var(--surface-2);padding:12px 16px;border-radius:12px;border:1px solid var(--border);">
        <div style="text-align:center;">
          <span style="font-size:11px;color:var(--text-muted);display:block;">Total Terdaftar</span>
          <strong style="font-size:18px;color:var(--blue);">${totalCount}</strong>
        </div>
        <div style="text-align:center;border-left:1px solid var(--border);border-right:1px solid var(--border);">
          <span style="font-size:11px;color:var(--text-muted);display:block;">Akun Aktif</span>
          <strong style="font-size:18px;color:var(--green-dark);">${activeCount}</strong>
        </div>
        <div style="text-align:center;">
          <span style="font-size:11px;color:var(--text-muted);display:block;">Dinonaktifkan</span>
          <strong style="font-size:18px;color:#dc2626;">${inactiveCount}</strong>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <input type="text" id="inputSearchPengurus" placeholder="Cari nama, email, peran, atau wilayah asal pengurus..." value="${searchQuery}" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;" id="filterTabsWrap">
          <button type="button" class="filter-tab-btn ${filterLevel === 'all' ? 'active-tab' : ''}" data-filter="all">Semua (${totalCount})</button>
          <button type="button" class="filter-tab-btn ${filterLevel === 'daerah' ? 'active-tab' : ''}" data-filter="daerah">Daerah</button>
          <button type="button" class="filter-tab-btn ${filterLevel === 'desa' ? 'active-tab' : ''}" data-filter="desa">Desa</button>
          <button type="button" class="filter-tab-btn ${filterLevel === 'kelompok' ? 'active-tab' : ''}" data-filter="kelompok">Kelompok</button>
          <button type="button" class="filter-tab-btn ${filterLevel === 'inactive' ? 'active-tab' : ''}" data-filter="inactive">Nonaktif (${inactiveCount})</button>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;max-height:50vh;overflow-y:auto;padding-right:4px;">
        ${pengurusCardsHtml}
      </div>

      ${paginationHtml}
    </div>
  `;

  modalBody.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.style.padding = '6px 12px';
    btn.style.borderRadius = '50px';
    btn.style.border = '1px solid var(--border)';
    btn.style.fontSize = '11px';
    btn.style.fontWeight = '700';
    btn.style.cursor = 'pointer';
    btn.style.whiteSpace = 'nowrap';

    if (btn.classList.contains('active-tab')) {
      btn.style.background = 'var(--blue)';
      btn.style.color = '#ffffff';
      btn.style.borderColor = 'var(--blue)';
    } else {
      btn.style.background = 'var(--surface-2)';
      btn.style.color = 'var(--text-muted)';
    }

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

/* ── 4. Modal Edit Detail Pengurus & Hak Akses ──────────────── */
export function renderEditPengurusModal(pengurusId, returnFilter = 'all', source = 'manage', returnPage = 1) {
  const p = getPengurusById(pengurusId);
  if (!p) return;

  const currentDesaId = p.desaId || 'desa-barat';
  const currentKelId = p.kelompokId || 'kel-gentan';
  const currentTingkat = p.tingkatan || 'kelompok';
  const currentPeran = p.peran || p.jabatan || 'Pamong Caberawit (Paud - SD)';

  let desaOptions = MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" data-name="${d.nama}" ${currentDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>
  `).join('');

  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === currentDesaId) || MASTER_WILAYAH.desa[0];
  let kelOptions = currentDesa.kelompok.map(k => `
    <option value="${k.id}" data-name="${k.nama}" ${currentKelId === k.id ? 'selected' : ''}>Kelompok ${k.nama}</option>
  `).join('');

  const rolesList = getRolesByTingkatan(currentTingkat);
  let peranOptions = rolesList.map(r => `
    <option value="${r}" ${currentPeran === r ? 'selected' : ''}>${r}</option>
  `).join('');

  openModal(`Edit Pengurus: ${p.nama}`, 'edit_note', 'default');
  modalBody.innerHTML = `
    <form id="formEditPengurus" style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:var(--gold-light);padding:12px 16px;border-radius:10px;border-left:4px solid var(--gold);font-size:12px;color:#715700;line-height:1.5;">
        <strong>Kelola Hak Akses &amp; Asal Wilayah Pengurus:</strong><br/>
        Setiap pengurus di tingkat Daerah, Desa, maupun Kelompok memiliki basis asal Kelompok dan Desa.
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Nama Lengkap <span style="color:red;">*</span></label>
        <input type="text" id="editNama" value="${p.nama}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Email Akun <span style="color:red;">*</span></label>
          <input type="email" id="editEmail" value="${p.email}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Nomor WhatsApp <span style="color:red;">*</span></label>
          <input type="text" id="editNoWa" value="${p.noWa || ''}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Tingkatan Hak Akses <span style="color:red;">*</span></label>
          <select id="editTingkatan" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);font-weight:700;">
            <option value="kelompok" ${currentTingkat === 'kelompok' ? 'selected' : ''}>Pamong Kelompok</option>
            <option value="desa" ${currentTingkat === 'desa' ? 'selected' : ''}>Koordinator Desa</option>
            <option value="daerah" ${currentTingkat === 'daerah' ? 'selected' : ''}>🌟 Superadmin Daerah (Pengurus PPG)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Jabatan / Peran <span style="color:red;">*</span></label>
          <select id="editPeran" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);">
            ${peranOptions}
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="rowWilayahSelect">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Asal Desa <span style="color:red;">*</span></label>
          <select id="editDesa" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);">
            ${desaOptions}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Asal Kelompok <span style="color:red;">*</span></label>
          <select id="editKelompok" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);">
            ${kelOptions}
          </select>
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Status Akun</label>
        <select id="editStatusActive" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);">
          <option value="true" ${p.isActive !== false ? 'selected' : ''}>🟢 Aktif (Dapat Login)</option>
          <option value="false" ${p.isActive === false ? 'selected' : ''}>🔴 Dinonaktifkan (Tidak Dapat Login)</option>
        </select>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Reset Kata Sandi Akun (Opsional)</label>
        <div style="position:relative;display:flex;align-items:center;">
          <input type="password" id="editPassword" placeholder="Kosongkan jika tidak ingin mereset password" style="width:100%;padding:10px 42px 10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:var(--surface);" />
          <button type="button" id="btnToggleEditPass" class="btn-toggle-password" style="position:absolute;right:8px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:4px;" title="Lihat / Sembunyikan Kata Sandi">
            <span class="material-symbols-outlined" style="font-size:20px;pointer-events:none;">visibility</span>
          </button>
        </div>
        <span style="font-size:11px;color:var(--text-muted);margin-top:3px;display:block;">Gunakan ini jika pengurus bersangkutan lupa password akunnya.</span>
      </div>

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" class="btn-sticky-back btn-cancel-edit-p" title="Kembali ke Tabel">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Tabel</span>
        </button>
        <button type="submit" class="btn-sticky-save" title="Simpan Perubahan">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">Simpan Perubahan</span>
        </button>
      </div>
    </form>
  `;

  // Toggle visibility password
  const btnToggleEditPass = document.getElementById('btnToggleEditPass');
  const editPasswordInput = document.getElementById('editPassword');
  btnToggleEditPass?.addEventListener('click', () => {
    const isPass = editPasswordInput.type === 'password';
    editPasswordInput.type = isPass ? 'text' : 'password';
    const icon = btnToggleEditPass.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isPass ? 'visibility_off' : 'visibility';
  });

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
      editKelompok.innerHTML = sortedKels.map(k => `<option value="${k.id}" data-name="${k.nama}">Kelompok ${k.nama}</option>`).join('');
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
    const newPass = document.getElementById('editPassword')?.value;

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

    if (newPass) {
      if (newPass.length < 6) {
        showToast('Password baru minimal 6 karakter.', 'error');
        document.getElementById('editPassword')?.focus();
        return;
      }
      updateData.password = newPass;
    }

    const submitBtn = document.querySelector('#formEditPengurus button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> Menyimpan...`;

    const res = await updatePengurus(p.id, updateData);
    if (submitBtn) submitBtn.innerHTML = `Simpan Perubahan`;
    
    if (res.success) {
      showToast(`Data pengurus "${updateData.nama}" berhasil diperbarui!`, 'success');
      appHooks.renderKelompokGrid();
      if (source === 'struktur') {
        renderStrukturDaerahModal();
      } else {
        renderManagePengurusModal(returnFilter, '', returnPage);
      }
      appHooks.renderUserProfile();
    } else {
      showToast(res.message || 'Gagal memperbarui data pengurus.', 'danger');
    }
  });
}
