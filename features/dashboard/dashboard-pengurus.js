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
  updatePengurus
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
        <button type="button" class="btn-action-reject" data-id="${p.id}" data-name="${p.nama}" style="padding:8px 12px;border:1px solid var(--border);background:#fff;color:#dc2626;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px;">
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
        onConfirm: () => {
          approvePengurus(pId, true);
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
        onConfirm: () => {
          approvePengurus(pId, false);
          showToast(`Pendaftaran akun "${pName}" telah ditolak.`, 'info');
          renderApprovalListModal();
          checkPendingApprovals();
        }
      });
    });
  });
}

/* ── 2. Struktur Pengurus Daerah Solo Selatan (14 Bidang) ─── */
export function renderStrukturDaerahModal(filterDesa = 'all', filterKelompok = 'all', filterPeran = 'all', searchQuery = '') {
  const allDaerahList = getPengurusDaerahList();
  const isSuper = currentUser && (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah');

  let filtered = allDaerahList.filter(p => {
    if (filterDesa !== 'all' && p.desaId !== filterDesa) return false;
    if (filterKelompok !== 'all' && p.kelompokId !== filterKelompok) return false;

    if (filterPeran !== 'all') {
      const pRole = (p.peran || p.jabatan || '').toLowerCase();
      if (!pRole.includes(filterPeran.toLowerCase())) return false;
    }

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

  let bannerNoticeHtml = '';
  if (isSuper) {
    bannerNoticeHtml = `
      <div style="background:linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);padding:14px 18px;border-radius:12px;border:1.5px solid #c7d2fe;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:13px;font-weight:800;color:#3730a3;">🌟 Mode Pengelolaan Superadmin</div>
          <div style="font-size:12px;color:#4f46e5;margin-top:2px;">Anda memiliki hak akses penuh untuk mengubah susunan struktur, peran, dan menaikkan hak akses pengurus daerah.</div>
        </div>
        <button type="button" id="btnBukaKelolaSemua" style="padding:8px 14px;background:#4338ca;color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">manage_accounts</span> Kelola Semua Pengurus
        </button>
      </div>
    `;
  } else {
    bannerNoticeHtml = `
      <div style="background:#f0f9ff;padding:12px 16px;border-radius:12px;border:1px solid #bae6fd;font-size:12.5px;color:#0369a1;line-height:1.5;">
        <strong>👁️ Mode Pelihat (Read-Only):</strong><br/>
        Berikut adalah jajaran Struktur Pengurus PPG Daerah Solo Selatan. Hubungi Superadmin Daerah jika membutuhkan penyesuaian susunan pengurus.
      </div>
    `;
  }

  let filterDesaOptions = `
    <option value="all" ${filterDesa === 'all' ? 'selected' : ''}>Semua Desa</option>
  ` + MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" ${filterDesa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>
  `).join('');

  let availableKelompok = [];
  if (filterDesa !== 'all') {
    const selectedDesaObj = MASTER_WILAYAH.desa.find(d => d.id === filterDesa);
    if (selectedDesaObj) availableKelompok = selectedDesaObj.kelompok;
  } else {
    availableKelompok = getAllKelompok();
  }

  let filterKelOptions = `
    <option value="all" ${filterKelompok === 'all' ? 'selected' : ''}>Semua Kelompok</option>
  ` + availableKelompok.map(k => `
    <option value="${k.id}" ${filterKelompok === k.id ? 'selected' : ''}>Kelompok ${k.nama}</option>
  `).join('');

  let listHtml = filtered.map(p => {
    const waClean = (p.noWa || '081234567890').replace(/[^0-9]/g, '');
    const waIntl = waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean;
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const asalTxt = `Kelompok ${p.kelompokNama || '-'} &bull; Desa ${p.desaNama || '-'}`;

    let editBtnHtml = '';
    if (isSuper) {
      editBtnHtml = `
        <button type="button" class="btn-edit-struktur-p" data-id="${p.id}" style="padding:7px 12px;border-radius:8px;border:1.5px solid var(--border);background:#fff;color:var(--blue);font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:15px;">edit_note</span> Ubah Peran
        </button>
      `;
    }

    return `
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg, #4338ca, #312e81);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;flex-shrink:0;box-shadow:0 3px 8px rgba(67,56,202,.25);">
              ${(p.nama || 'P').charAt(0)}
            </div>
            <div>
              <div style="font-size:14px;font-weight:800;color:var(--text);">${p.nama}</div>
              <div style="font-size:12.5px;color:#4338ca;font-weight:700;margin-top:1px;">${p.peran || p.jabatan || 'Pengurus Daerah'}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">📍 Asal: <strong>${asalTxt}</strong></div>
            </div>
          </div>
          <span style="font-size:10px;font-weight:800;padding:3px 8px;border-radius:20px;background:#e0e7ff;color:#3730a3;white-space:nowrap;">Daerah</span>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border);padding-top:10px;margin-top:2px;">
          <div style="display:flex;gap:8px;">
            <a href="https://wa.me/${waIntl}?text=${waMsg}" target="_blank" rel="noopener" style="padding:7px 12px;border-radius:8px;background:#25d366;color:#fff;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:4px;text-decoration:none;">
              <span class="material-symbols-outlined" style="font-size:15px;">chat</span> WhatsApp
            </a>
            <a href="mailto:${p.email}" style="padding:7px 12px;border-radius:8px;background:#ffffff;border:1px solid var(--border);color:var(--text);font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:4px;text-decoration:none;">
              <span class="material-symbols-outlined" style="font-size:15px;">mail</span> Email
            </a>
          </div>
          ${editBtnHtml}
        </div>
      </div>
    `;
  }).join('');

  if (filtered.length === 0) {
    listHtml = `
      <div style="text-align:center;padding:32px 10px;color:var(--text-muted);">
        <span class="material-symbols-outlined" style="font-size:40px;color:var(--border);margin-bottom:6px;">person_search</span>
        <h4 style="font-size:14px;color:var(--text);font-weight:700;">Tidak Ditemukan Pengurus</h4>
        <p style="font-size:12px;margin-top:4px;">Tidak ada pengurus daerah yang cocok dengan kriteria filter atau pencarian Anda.</p>
      </div>
    `;
  }

  openModal(`Struktur Pengurus PPG Solo Selatan (${filtered.length} Pengurus)`, 'diversity_2', 'large');
  modalBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${bannerNoticeHtml}

      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--blue);">tune</span>
            Filtrasi Susunan Pengurus PPG (${filtered.length} dari ${allDaerahList.length})
          </span>
          ${(filterDesa !== 'all' || filterKelompok !== 'all' || filterPeran !== 'all' || searchQuery) ? `
            <button type="button" id="btnResetFilterStruktur" style="border:none;background:transparent;color:var(--blue);font-size:11px;font-weight:700;cursor:pointer;text-decoration:underline;">Reset Filter</button>
          ` : ''}
        </div>

        <input type="text" id="inputSearchStruktur" placeholder="Cari nama pengurus, peran, desa, atau kelompok..." value="${searchQuery}" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12.5px;font-family:inherit;" />

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px;">
          <div>
            <label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:3px;">Filter Asal Desa</label>
            <select id="selectFilterDesa" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff;font-family:inherit;">
              ${filterDesaOptions}
            </select>
          </div>

          <div>
            <label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:3px;">Filter Asal Kelompok</label>
            <select id="selectFilterKelompok" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff;font-family:inherit;">
              ${filterKelOptions}
            </select>
          </div>

          <div>
            <label style="display:block;font-size:11px;font-weight:700;color:var(--text-muted);margin-bottom:3px;">Filter Peran</label>
            <select id="selectFilterPeran" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff;font-family:inherit;">
              <option value="all" ${filterPeran === 'all' ? 'selected' : ''}>Semua Peran (${MASTER_STRUKTUR_PERAN.daerah.roles.length})</option>
              ${MASTER_STRUKTUR_PERAN.daerah.roles.map(r => `
                <option value="${r}" ${filterPeran === r ? 'selected' : ''}>${r}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;max-height:48vh;overflow-y:auto;padding-right:4px;">
        ${listHtml}
      </div>
    </div>
  `;

  const inputSearch = document.getElementById('inputSearchStruktur');
  const selDesa = document.getElementById('selectFilterDesa');
  const selKel = document.getElementById('selectFilterKelompok');
  const selPeran = document.getElementById('selectFilterPeran');
  const btnReset = document.getElementById('btnResetFilterStruktur');

  selDesa?.addEventListener('change', () => {
    renderStrukturDaerahModal(selDesa.value, 'all', selPeran.value, inputSearch.value);
  });

  selKel?.addEventListener('change', () => {
    renderStrukturDaerahModal(selDesa.value, selKel.value, selPeran.value, inputSearch.value);
  });

  selPeran?.addEventListener('change', () => {
    renderStrukturDaerahModal(selDesa.value, selKel.value, selPeran.value, inputSearch.value);
  });

  inputSearch?.addEventListener('input', (e) => {
    const q = e.target.value;
    renderStrukturDaerahModal(selDesa.value, selKel.value, selPeran.value, q);
    const updatedInput = document.getElementById('inputSearchStruktur');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(q.length, q.length);
    }
  });

  btnReset?.addEventListener('click', () => {
    renderStrukturDaerahModal('all', 'all', 'all', '');
  });

  if (isSuper) {
    document.getElementById('btnBukaKelolaSemua')?.addEventListener('click', () => {
      renderManagePengurusModal('daerah');
    });

    modalBody.querySelectorAll('.btn-edit-struktur-p').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = btn.dataset.id;
        renderEditPengurusModal(pId, 'daerah', 'struktur');
      });
    });
  }
}

/* ── 3. Kelola Pengurus & Hak Akses (Superadmin) ────────────── */
export function renderManagePengurusModal(filterLevel = 'all', searchQuery = '') {
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

  let pengurusCardsHtml = filtered.map(p => {
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
          <button type="button" class="btn-toggle-active" data-id="${p.id}" data-name="${p.nama}" data-target="false" style="padding:6px 12px;border-radius:8px;border:1px solid #fca5a5;background:#fff;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">block</span>
            Nonaktifkan
          </button>
        `;
      } else {
        toggleBtnHtml = `
          <button type="button" class="btn-toggle-active" data-id="${p.id}" data-name="${p.nama}" data-target="true" style="padding:6px 12px;border-radius:8px;border:none;background:var(--green-dark);color:#fff;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">check_circle</span>
            Aktifkan
          </button>
        `;
      }
    } else {
      toggleBtnHtml = `<span style="font-size:11px;color:var(--text-muted);font-style:italic;">(Akun Anda)</span>`;
    }

    const editBtnHtml = `
      <button type="button" class="btn-edit-pengurus" data-id="${p.id}" style="padding:6px 12px;border-radius:8px;border:1.5px solid var(--border);background:#fff;color:var(--blue);font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:15px;">edit_note</span>
        Edit &amp; Hak Akses
      </button>
    `;

    const asalTxt = `Kelompok ${p.kelompokNama || '-'} &bull; Desa ${p.desaNama || '-'}`;

    return `
      <div style="background:var(--surface-2);border:1px solid ${isActive ? 'var(--border)' : '#fca5a5'};border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;transition:var(--transition);">
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

  openModal('Kelola Pengurus & Hak Akses (Superadmin)', 'manage_accounts', 'large');
  modalBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">
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
      renderManagePengurusModal(selectedFilter, currentQuery);
    });
  });

  const searchInput = document.getElementById('inputSearchPengurus');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value;
    renderManagePengurusModal(filterLevel, q);
    const updatedInput = document.getElementById('inputSearchPengurus');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(q.length, q.length);
    }
  });

  modalBody.querySelectorAll('.btn-edit-pengurus').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      renderEditPengurusModal(pId, filterLevel);
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
          onConfirm: () => {
            togglePengurusActive(pId, true);
            showToast(`Akun pengurus "${pName}" berhasil diaktifkan kembali.`, 'success');
            renderManagePengurusModal(filterLevel, searchQuery);
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
          onConfirm: () => {
            togglePengurusActive(pId, false);
            showToast(`Akun pengurus "${pName}" berhasil dinonaktifkan.`, 'warning');
            renderManagePengurusModal(filterLevel, searchQuery);
            appHooks.renderKelompokGrid();
            appHooks.renderUserProfile();
          }
        });
      }
    });
  });
}

/* ── 4. Modal Edit Detail Pengurus & Hak Akses ──────────────── */
export function renderEditPengurusModal(pengurusId, returnFilter = 'all', source = 'manage') {
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
          <select id="editTingkatan" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;font-weight:700;">
            <option value="kelompok" ${currentTingkat === 'kelompok' ? 'selected' : ''}>Pamong Kelompok</option>
            <option value="desa" ${currentTingkat === 'desa' ? 'selected' : ''}>Koordinator Desa</option>
            <option value="daerah" ${currentTingkat === 'daerah' ? 'selected' : ''}>🌟 Superadmin Daerah (Pengurus PPG)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Jabatan / Peran <span style="color:red;">*</span></label>
          <select id="editPeran" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;">
            ${peranOptions}
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="rowWilayahSelect">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Asal Desa <span style="color:red;">*</span></label>
          <select id="editDesa" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;">
            ${desaOptions}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Asal Kelompok <span style="color:red;">*</span></label>
          <select id="editKelompok" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;">
            ${kelOptions}
          </select>
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Status Akun</label>
        <select id="editStatusActive" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;">
          <option value="true" ${p.isActive !== false ? 'selected' : ''}>🟢 Aktif (Dapat Login)</option>
          <option value="false" ${p.isActive === false ? 'selected' : ''}>🔴 Dinonaktifkan (Tidak Dapat Login)</option>
        </select>
      </div>

      <div style="display:flex;gap:10px;margin-top:10px;">
        <button type="button" class="btn-cancel-edit-p" style="flex:1;padding:12px;border:1px solid var(--border);background:#fff;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">← Kembali</button>
        <button type="submit" style="flex:2;padding:12px;border:none;background:linear-gradient(135deg, var(--blue), var(--blue-dark));color:#fff;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span> Simpan Perubahan
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
      editKelompok.innerHTML = sortedKels.map(k => `<option value="${k.id}" data-name="${k.nama}">Kelompok ${k.nama}</option>`).join('');
    }
  });

  document.querySelector('.btn-cancel-edit-p')?.addEventListener('click', () => {
    if (source === 'struktur') {
      renderStrukturDaerahModal();
    } else {
      renderManagePengurusModal(returnFilter);
    }
  });

  document.getElementById('formEditPengurus')?.addEventListener('submit', (e) => {
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

    const res = updatePengurus(p.id, updateData);
    if (res.success) {
      showToast(`Data pengurus "${updateData.nama}" berhasil diperbarui!`, 'success');
      appHooks.renderKelompokGrid();
      if (source === 'struktur') {
        renderStrukturDaerahModal();
      } else {
        renderManagePengurusModal(returnFilter);
      }
      appHooks.renderUserProfile();
    } else {
      showToast(res.message || 'Gagal memperbarui data pengurus.', 'danger');
    }
  });
}
