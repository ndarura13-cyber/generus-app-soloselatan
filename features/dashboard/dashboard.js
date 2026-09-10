/* ═══════════════════════════════════════════════════════════════
   dashboard.js — PPG Solo Selatan Dashboard Main Orchestrator
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getPengurusList,
  getPengurusDaerahList,
  updateCurrentProfile,
  getProkerStats,
  syncPembiasaanFromSupabase,
  syncPengurusFromSupabase,
  syncKbmFromSupabase,
  syncSiswaFromSupabase
} from '../../src/db-master.js';

import { isSupabaseConfigured } from '../../src/supabase.js';

import {
  currentUser,
  setCurrentUser,
  showToast,
  openModal,
  closeModal,
  showConfirmModal,
  renderKontakModal,
  modalBody
} from './dashboard-common.js';

import {
  updateSupabaseStatusUI,
  renderSupabaseModal
} from './dashboard-supabase.js';

import {
  checkPendingApprovals,
  renderApprovalListModal,
  renderStrukturDaerahModal,
  renderManagePengurusModal,
  setPengurusHooks
} from './dashboard-pengurus.js';

import {
  renderProkerModal,
  setProkerHooks
} from './dashboard-proker.js';

import {
  renderEventPembiasaanModal
} from './dashboard-pembiasaan.js';

import {
  updateDashboardStats,
  renderSiswaModal,
  renderDetailRingkasanModal
} from './dashboard-generus.js';

import {
  renderCetakAbsensiModal,
  renderFormRekapKehadiranModal
} from './dashboard-kbm.js';

// DOM Elements
const userNameEl = document.getElementById('userName');
const headingUserNameEl = document.getElementById('headingUserName');
const userBadgeEl = document.getElementById('userBadge');
const scopeTextEl = document.getElementById('scopeText');
const btnEditProfile = document.getElementById('btnEditProfile');
const btnLogout = document.getElementById('btnLogout');

const desaTabsContainer = document.getElementById('desaTabs');
const kelompokGridContainer = document.getElementById('kelompokGrid');
const btnKontakDesa = document.getElementById('btnKontakDesa');
const btnKontakDesaText = document.getElementById('btnKontakDesaText');

// Action Cards & Menu Modals
const btnMenuSiswa = document.getElementById('btnMenuSiswa');
const btnMenuProker = document.getElementById('btnMenuProker');
const btnMenuPembiasaan = document.getElementById('btnMenuPembiasaan');
const btnMenuAbsensi = document.getElementById('btnMenuAbsensi');
const btnMenuStrukturDaerah = document.getElementById('btnMenuStrukturDaerah');
const btnMenuPengurus = document.getElementById('btnMenuPengurus');
const btnApprovalList = document.getElementById('btnApprovalList');

/* ── 1. Render Header Profile & Role Indicators ───────────── */
export function renderUserProfile() {
  if (userNameEl) userNameEl.textContent = currentUser.nama;
  if (headingUserNameEl) headingUserNameEl.textContent = currentUser.nama;
  updateDashboardStats();

  const prokerCardDesc = document.getElementById('prokerCardDesc');
  const prokerActionText = document.getElementById('prokerActionText');
  const badgeProkerStatus = document.getElementById('badgeProkerStatus');

  const strukturPpgDesc = document.getElementById('strukturPpgDesc');
  if (strukturPpgDesc) {
    const totalPpgDaerah = getPengurusDaerahList().length;
    strukturPpgDesc.textContent = `Susunan 14 Bidang & ${totalPpgDaerah} Pengurus PPG Daerah Solo Selatan.`;
  }

  if (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah') {
    userBadgeEl.textContent = '🌟 Superadmin Daerah';
    userBadgeEl.style.background = 'linear-gradient(135deg, var(--gold), #d49b10)';
    userBadgeEl.style.color = '#1a1d2e';

    const asalInfo = (currentUser.desaNama && currentUser.kelompokNama)
      ? ` &bull; Asal: Kel. ${currentUser.kelompokNama}, Desa ${currentUser.desaNama}`
      : '';
    scopeTextEl.innerHTML = `<strong>Tingkat:</strong> Pengurus PPG Daerah Solo Selatan${asalInfo}`;

    if (btnMenuPengurus) btnMenuPengurus.style.display = 'flex';
    checkPendingApprovals();

    const pStats = getProkerStats();
    if (prokerCardDesc) {
      prokerCardDesc.textContent = `${pStats.total} Agenda Program Kerja (${pStats.ongoing} Berlangsung, Total Est. Rp ${pStats.totalAnggaran.toLocaleString('id-ID')}).`;
    }
    if (prokerActionText) prokerActionText.textContent = 'Kelola Program';
    if (badgeProkerStatus) {
      badgeProkerStatus.textContent = 'Kelola Daerah';
      badgeProkerStatus.className = 'action-badge-top gold';
    }

    const pembiasaanActionText = document.getElementById('pembiasaanActionText');
    const badgePembiasaanStatus = document.getElementById('badgePembiasaanStatus');
    const pembiasaanCardDesc = document.getElementById('pembiasaanCardDesc');
    if (pembiasaanActionText) pembiasaanActionText.textContent = 'Kelola Pembiasaan';
    if (badgePembiasaanStatus) {
      badgePembiasaanStatus.textContent = 'Kelola Daerah';
      badgePembiasaanStatus.className = 'action-badge-top gold';
    }
    if (pembiasaanCardDesc) pembiasaanCardDesc.textContent = 'Kelola periode, target pembiasaan karakter, dan rekam nilai generus caberawit.';

  } else if (currentUser.tingkatan === 'desa') {
    userBadgeEl.textContent = `🏛️ Koordinator Desa ${currentUser.desaNama || ''}`;
    userBadgeEl.style.background = 'var(--gold-light)';
    userBadgeEl.style.color = '#715700';

    scopeTextEl.innerHTML = `<strong>Wilayah Koordinasi:</strong> Desa ${currentUser.desaNama || 'Barat'} &bull; Asal Kel. ${currentUser.kelompokNama || '-'}`;
    if (btnMenuPengurus) btnMenuPengurus.style.display = 'none';
    if (btnApprovalList) btnApprovalList.style.display = 'none';

    const pStats = getProkerStats();
    if (prokerCardDesc) {
      prokerCardDesc.textContent = `${pStats.total} Agenda Program Daerah (${pStats.ongoing} Berjalan, ${pStats.upcoming} Akan Datang).`;
    }
    if (prokerActionText) prokerActionText.textContent = 'Lihat Program';
    if (badgeProkerStatus) {
      badgeProkerStatus.textContent = 'Agenda Aktif';
      badgeProkerStatus.className = 'action-badge-top default';
    }

  } else {
    userBadgeEl.textContent = `👥 Pamong Kel. ${currentUser.kelompokNama || ''}`;
    userBadgeEl.style.background = 'var(--blue-light)';
    userBadgeEl.style.color = 'var(--blue-dark)';

    scopeTextEl.innerHTML = `<strong>Kelompok Binaan:</strong> Kelompok ${currentUser.kelompokNama || 'Gentan'} (Desa ${currentUser.desaNama || 'Barat'})`;
    if (btnMenuPengurus) btnMenuPengurus.style.display = 'none';
    if (btnApprovalList) btnApprovalList.style.display = 'none';

    const pStats = getProkerStats();
    if (prokerCardDesc) {
      prokerCardDesc.textContent = `Ikuti & pantau ${pStats.total} program kerja pembinaan generasi penerus PPG.`;
    }
    if (prokerActionText) prokerActionText.textContent = 'Lihat Program';
    if (badgeProkerStatus) {
      badgeProkerStatus.textContent = 'Program Kerja';
      badgeProkerStatus.className = 'action-badge-top default';
    }
  }
}

// Connect inter-module hooks
setPengurusHooks({
  renderUserProfile,
  renderKelompokGrid
});

setProkerHooks({
  renderUserProfile
});

/* ── 2. Edit Profil Pengurus Sedang Bertugas ───────────────── */
export function renderSelfProfileModal() {
  const currentDesaId = currentUser.desaId || 'desa-barat';
  const currentKelId = currentUser.kelompokId || 'kel-gentan';

  let desaOptions = MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" data-name="${d.nama}" ${currentDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>
  `).join('');

  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === currentDesaId) || MASTER_WILAYAH.desa[0];
  const sortedKelompok = [...currentDesa.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));
  let kelOptions = sortedKelompok.map(k => `
    <option value="${k.id}" data-name="${k.nama}" ${currentKelId === k.id ? 'selected' : ''}>Kelompok ${k.nama}</option>
  `).join('');

  const formHtml = `
    <form id="formSelfProfile" style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:var(--blue-light);padding:12px 16px;border-radius:10px;border-left:4px solid var(--blue);font-size:12.5px;color:var(--blue-dark);line-height:1.5;">
        <strong>Perbarui Profil &amp; Asal Wilayah Anda:</strong><br/>
        Data peran dan asal kelompok Anda akan langsung disesuaikan ke seluruh sistem pembinaan.
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Nama Lengkap <span style="color:red;">*</span></label>
        <input type="text" id="profNama" value="${currentUser.nama}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Email Akun <span style="color:red;">*</span></label>
          <input type="email" id="profEmail" value="${currentUser.email}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Nomor WhatsApp <span style="color:red;">*</span></label>
          <input type="text" id="profNoWa" value="${currentUser.noWa || ''}" required placeholder="08xxxxxxxxxx" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Tingkatan Akses <span style="color:red;">*</span></label>
          <select id="profTingkatan" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;font-weight:700;">
            <option value="kelompok" ${currentUser.tingkatan === 'kelompok' ? 'selected' : ''}>Pamong Kelompok</option>
            <option value="desa" ${currentUser.tingkatan === 'desa' ? 'selected' : ''}>Koordinator Desa</option>
            <option value="daerah" ${currentUser.tingkatan === 'daerah' ? 'selected' : ''}>🌟 Superadmin Daerah (Pengurus PPG)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Jabatan / Peran <span style="color:red;">*</span></label>
          <input type="text" id="profPeran" value="${currentUser.peran || currentUser.jabatan || 'Pamong'}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="wrapWilayahProf">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Asal Desa <span style="color:red;">*</span></label>
          <select id="profDesa" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;">
            ${desaOptions}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Asal Kelompok <span style="color:red;">*</span></label>
          <select id="profKelompok" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;">
            ${kelOptions}
          </select>
        </div>
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Ubah Kata Sandi (Opsional)</label>
        <input type="password" id="profPassword" placeholder="Kosongkan jika tidak ingin mengubah password" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
      </div>

      <div style="display:flex;gap:10px;margin-top:10px;">
        <button type="button" class="btn-cancel-prof" style="flex:1;padding:12px;border:1px solid var(--border);background:#fff;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">Batal</button>
        <button type="submit" style="flex:2;padding:12px;border:none;background:linear-gradient(135deg, var(--blue), var(--blue-dark));color:#fff;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span> Simpan Perubahan
        </button>
      </div>
    </form>
  `;

  openModal('Pengaturan Profil & Asal Wilayah', 'account_circle', 'default');
  modalBody.innerHTML = formHtml;

  const profDesa = document.getElementById('profDesa');
  const profKelompok = document.getElementById('profKelompok');
  const profTingkatan = document.getElementById('profTingkatan');
  const profPeran = document.getElementById('profPeran');

  document.querySelector('.btn-cancel-prof')?.addEventListener('click', closeModal);

  profDesa?.addEventListener('change', () => {
    const selectedDesaId = profDesa.value;
    const foundDesa = MASTER_WILAYAH.desa.find(d => d.id === selectedDesaId);
    if (foundDesa) {
      const sortedKels = [...foundDesa.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));
      profKelompok.innerHTML = sortedKels.map(k => `<option value="${k.id}" data-name="${k.nama}">Kelompok ${k.nama}</option>`).join('');
    }
  });

  document.getElementById('formSelfProfile')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newNama = document.getElementById('profNama').value.trim();
    const newEmail = document.getElementById('profEmail').value.trim();
    const newNoWa = document.getElementById('profNoWa').value.trim();
    const newTingkatan = profTingkatan.value;
    const newPeran = profPeran.value;
    const selectedDesaOption = profDesa.options[profDesa.selectedIndex];
    const selectedKelOption = profKelompok.options[profKelompok.selectedIndex];
    const newPassword = document.getElementById('profPassword').value;

    const res = updateCurrentProfile(currentUser.id, {
      email: newEmail,
      nama: newNama,
      noWa: newNoWa,
      tingkatan: newTingkatan,
      peran: newPeran,
      jabatan: newPeran,
      desaId: profDesa.value,
      desaNama: selectedDesaOption?.dataset.name || 'Barat',
      kelompokId: profKelompok.value,
      kelompokNama: selectedKelOption?.dataset.name || 'Gentan',
      password: newPassword || undefined
    });

    if (res.success) {
      const updated = {
        ...currentUser,
        nama: newNama,
        email: newEmail,
        noWa: newNoWa,
        tingkatan: newTingkatan,
        peran: newPeran,
        jabatan: newPeran,
        desaId: profDesa.value,
        desaNama: selectedDesaOption?.dataset.name || 'Barat',
        kelompokId: profKelompok.value,
        kelompokNama: selectedKelOption?.dataset.name || 'Gentan',
        isSuperadmin: newTingkatan === 'daerah' ? true : currentUser.isSuperadmin
      };
      setCurrentUser(updated);

      renderUserProfile();
      renderKelompokGrid();
      closeModal();
      showToast(`Profil "${newNama}" berhasil disimpan & diperbarui!`, 'success');
    }
  });
}

btnEditProfile?.addEventListener('click', renderSelfProfileModal);

/* ── 3. Logout Confirmation ────────────────────────────────── */
btnLogout?.addEventListener('click', () => {
  showConfirmModal({
    title: 'Konfirmasi Keluar Akun',
    message: 'Apakah Anda yakin ingin keluar dari sesi Dashboard PPG Solo Selatan?',
    icon: 'logout',
    iconBg: 'var(--red-light)',
    iconColor: 'var(--red)',
    confirmText: 'Ya, Keluar Akun',
    confirmBtnColor: 'var(--red)',
    onConfirm: () => {
      localStorage.removeItem('ppg_user_session');
      window.location.href = '../login/login.html';
    }
  });
});

/* ── 4. Render 5 Desa Tabs & 27 Kelompok (Database Linked) ──── */
let activeDesaId = 'desa-barat';

if (currentUser.tingkatan === 'desa' && currentUser.desaId) {
  activeDesaId = currentUser.desaId;
} else if (currentUser.tingkatan === 'kelompok' && currentUser.desaId) {
  activeDesaId = currentUser.desaId;
}

export function renderDesaTabs() {
  if (!desaTabsContainer) return;
  desaTabsContainer.innerHTML = '';

  MASTER_WILAYAH.desa.forEach((desa) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `desa-tab-btn ${desa.id === activeDesaId ? 'active' : ''}`;
    btn.dataset.desa = desa.id;
    btn.innerHTML = `
      <span>Desa ${desa.nama}</span>
      <span class="desa-count-badge">${desa.kelompok.length} Kel.</span>
    `;

    btn.addEventListener('click', () => {
      activeDesaId = desa.id;
      document.querySelectorAll('.desa-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderKelompokGrid();
    });

    desaTabsContainer.appendChild(btn);
  });
}

export function renderKelompokGrid() {
  if (!kelompokGridContainer) return;
  kelompokGridContainer.innerHTML = '';

  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === activeDesaId);
  if (!currentDesa) return;

  if (btnKontakDesaText) {
    btnKontakDesaText.textContent = `Kontak Koordinator Desa ${currentDesa.nama}`;
  }

  const allPengurus = getPengurusList();
  const sortedKelompok = [...currentDesa.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));

  sortedKelompok.forEach((kel) => {
    const card = document.createElement('div');
    const pengurusKelompok = allPengurus.filter(
      p => p.kelompokId === kel.id && p.isActive !== false
    );
    const hasPengurus = pengurusKelompok.length > 0;
    card.className = `kelompok-card ${hasPengurus ? 'active-kelompok' : 'disabled-kelompok'}`;

    const leader = pengurusKelompok[0] || null;
    const leaderName = leader ? leader.nama : 'Belum Terdata';
    const leaderPeran = leader ? (leader.peran || leader.jabatan || 'Pamong') : 'Pamong Kelompok';

    card.innerHTML = `
      <div class="kel-info">
        <div class="kel-icon">
          <span class="material-symbols-outlined">diversity_3</span>
        </div>
        <div>
          <div class="kel-name">${kel.nama}</div>
          <div class="kel-pamong">${leaderPeran}: <strong>${leaderName}</strong></div>
          <div>
            ${hasPengurus
              ? `<span class="badge-pengurus-count">🟢 ${pengurusKelompok.length} Pengurus</span>`
              : `<span class="badge-pengurus-empty">⚪ Belum Ada Pengurus</span>`
            }
          </div>
        </div>
      </div>

      <div>
        ${hasPengurus
          ? `<button type="button" class="btn-view-kontak-kel" data-desa="${currentDesa.id}" data-kelompok="${kel.id}" title="Lihat kontak pengurus & pamong ${kel.nama}">
              <span class="material-symbols-outlined" style="font-size:15px;">contacts</span>
              <span>Kontak (${pengurusKelompok.length})</span>
             </button>`
          : `<button type="button" class="btn-view-kontak-empty" disabled title="Belum ada pengurus terdaftar di kelompok ${kel.nama}">
              <span>Kosong</span>
             </button>`
        }
      </div>
    `;

    card.querySelector('.btn-view-kontak-kel')?.addEventListener('click', (e) => {
      e.stopPropagation();
      renderKontakModal(currentDesa.id, kel.id);
    });

    kelompokGridContainer.appendChild(card);
  });
}


btnKontakDesa?.addEventListener('click', () => {
  renderKontakModal(activeDesaId, null);
});

/* ── 5. Action Cards Listeners ─────────────────────────────────────────────────── */
btnMenuSiswa?.addEventListener('click', async () => {
  showToast("Mengambil data terbaru dari server...");
  if (isSupabaseConfigured()) await syncSiswaFromSupabase();
  renderSiswaModal();
});
btnMenuProker?.addEventListener('click', () => renderProkerModal());
btnMenuPembiasaan?.addEventListener('click', async () => {
  showToast("Mengambil data terbaru dari server...");
  if (isSupabaseConfigured()) await syncPembiasaanFromSupabase();
  renderEventPembiasaanModal();
});
btnMenuAbsensi?.addEventListener('click', async () => {
  showToast("Mengambil data terbaru dari server...");
  if (isSupabaseConfigured()) await syncKbmFromSupabase();
  renderCetakAbsensiModal();
});
btnMenuStrukturDaerah?.addEventListener('click', () => renderStrukturDaerahModal());
btnMenuPengurus?.addEventListener('click', async () => {
  showToast("Mengambil data terbaru dari server...");
  if (isSupabaseConfigured()) await syncPengurusFromSupabase();
  renderManagePengurusModal('all');
});
btnApprovalList?.addEventListener('click', () => renderApprovalListModal());
document.getElementById('btnOpenApprovalModal')?.addEventListener('click', () => renderApprovalListModal());
document.getElementById('btnSupabaseStatus')?.addEventListener('click', () => renderSupabaseModal(updateDashboardStats));

// Overview Stat Cards Shortcuts
document.getElementById('cardStatTotal')?.addEventListener('click', () => renderDetailRingkasanModal('all'));
document.getElementById('cardStatCaberawit')?.addEventListener('click', () => renderDetailRingkasanModal('caberawit'));
document.getElementById('cardStatGp')?.addEventListener('click', () => renderDetailRingkasanModal('gp_reguler'));
document.getElementById('cardStatRemaja')?.addEventListener('click', () => renderDetailRingkasanModal('remaja'));

/* ── 6. Mobile Dashboard Drawer (Hamburger Menu) ──────────── */
(function setupMobileDrawer() {
  const hamburgerBtn = document.getElementById('dashHamburger') || document.getElementById('dashHamburgerBtn');
  const drawerOverlay = document.getElementById('dashDrawerOverlay') || document.getElementById('dashDrawerBackdrop');
  const drawerPanel = document.getElementById('dashDrawer') || document.getElementById('dashDrawerPanel');
  const drawerCloseBtn = document.getElementById('dashDrawerClose') || document.getElementById('dashDrawerCloseBtn');

  if (!hamburgerBtn || !drawerOverlay || !drawerPanel) return;

  function openDrawer() {
    drawerOverlay.classList.add('visible');
    drawerPanel.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Populate drawer profile
    const drawerUserName = document.getElementById('drawerUserName');
    const drawerUserBadge = document.getElementById('drawerUserBadge');

    if (drawerUserName) drawerUserName.textContent = currentUser.nama || 'Pengurus';
    if (drawerUserBadge) {
      drawerUserBadge.textContent = currentUser.isSuperadmin ? '🌟 Superadmin Daerah' : (currentUser.tingkatan === 'desa' ? '🏛️ Koordinator Desa' : '👥 Pamong Kelompok');
    }

    const drawerPengurusItem = document.getElementById('drawerBtnStruktur');
    if (drawerPengurusItem) {
      drawerPengurusItem.style.display = (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah') ? 'flex' : 'none';
    }
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('visible');
    drawerPanel.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', openDrawer);
  drawerCloseBtn?.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  document.getElementById('drawerBtnSiswa')?.addEventListener('click', () => { closeDrawer(); renderSiswaModal(); });
  document.getElementById('drawerBtnProker')?.addEventListener('click', () => { closeDrawer(); renderProkerModal(); });
  document.getElementById('drawerBtnPembiasaan')?.addEventListener('click', () => { closeDrawer(); renderEventPembiasaanModal(); });
  document.getElementById('drawerBtnAbsensi')?.addEventListener('click', () => { closeDrawer(); renderCetakAbsensiModal(); });
  document.getElementById('drawerBtnStruktur')?.addEventListener('click', () => { closeDrawer(); renderStrukturDaerahModal(); });
  document.getElementById('drawerBtnProfil')?.addEventListener('click', () => { closeDrawer(); renderSelfProfileModal(); });
  document.getElementById('drawerBtnSupabase')?.addEventListener('click', () => { closeDrawer(); renderSupabaseModal(updateDashboardStats); });
  document.getElementById('drawerBtnLogout')?.addEventListener('click', () => {
    closeDrawer();
    btnLogout?.click();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
})();

/* ── 7. Initial Application Boot & Rendering ──────────────── */
try {
  renderUserProfile();
  renderDesaTabs();
  renderKelompokGrid();
  checkPendingApprovals();
  updateSupabaseStatusUI();
  syncPembiasaanFromSupabase().catch(err => console.warn('Background sync pembiasaan failed:', err));
  syncPengurusFromSupabase().catch(err => console.warn('Background sync pengurus failed:', err));
  syncKbmFromSupabase().catch(err => console.warn('Background sync KBM failed:', err));
  console.log('PPG Dashboard initialized successfully.');
} catch (err) {
  console.error('Fatal error initializing PPG Dashboard:', err);
}

// Auto-open modal based on URL query param
try {
  const urlParams = new URLSearchParams(window.location.search);
  const actionParam = urlParams.get('action') || urlParams.get('modal');
  const eventIdParam = urlParams.get('eventId');

  if (actionParam === 'pembiasaan') {
    renderEventPembiasaanModal();
  } else if (actionParam === 'absensi' || actionParam === 'kbm') {
    renderCetakAbsensiModal('event_list');
  } else if (actionParam === 'edit_rekap' && eventIdParam) {
    renderFormRekapKehadiranModal(eventIdParam);
  } else if (actionParam === 'proker') {
    renderProkerModal();
  } else if (actionParam === 'siswa' || actionParam === 'generus') {
    renderSiswaModal();
  } else if (actionParam === 'struktur') {
    renderStrukturDaerahModal();
  } else if (actionParam === 'pengurus') {
    renderManagePengurusModal('all');
  } else if (actionParam === 'supabase') {
    renderSupabaseModal(updateDashboardStats);
  }
} catch (e) {
  console.warn('URL auto-action parsing skipped:', e);
}

