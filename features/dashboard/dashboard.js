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
  syncSiswaFromSupabase,
  syncProkerFromSupabase
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
    document.getElementById('sideBtnKelolaPengurus')?.style.setProperty('display', 'block');
    document.getElementById('drawerBtnKelolaPengurus')?.style.setProperty('display', 'block');
    document.getElementById('mobBtnKelolaPengurus')?.style.setProperty('display', 'flex');
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
    document.getElementById('sideBtnKelolaPengurus')?.style.setProperty('display', 'none');
    document.getElementById('drawerBtnKelolaPengurus')?.style.setProperty('display', 'none');
    document.getElementById('mobBtnKelolaPengurus')?.style.setProperty('display', 'none');
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
    document.getElementById('sideBtnKelolaPengurus')?.style.setProperty('display', 'none');
    document.getElementById('drawerBtnKelolaPengurus')?.style.setProperty('display', 'none');
    document.getElementById('mobBtnKelolaPengurus')?.style.setProperty('display', 'none');
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
    <form id="formSelfProfile" class="flex flex-col gap-3.5">
      <div class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl border-l-4 border-brandBlue text-xs text-blue-900 dark:text-blue-200">
        <strong>Perbarui Profil &amp; Asal Wilayah Anda:</strong><br/>
        Data peran dan asal kelompok Anda akan langsung disesuaikan ke seluruh sistem pembinaan.
      </div>

      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Nama Lengkap <span class="text-red-500">*</span></label>
        <input type="text" id="profNama" value="${currentUser.nama}" required class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Email Akun <span class="text-red-500">*</span></label>
          <input type="email" id="profEmail" value="${currentUser.email}" required class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue" />
        </div>
        <div>
          <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Nomor WhatsApp <span class="text-red-500">*</span></label>
          <input type="text" id="profNoWa" value="${currentUser.noWa || ''}" required placeholder="08xxxxxxxxxx" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Tingkatan Akses <span class="text-red-500">*</span></label>
          <select id="profTingkatan" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue font-bold">
            <option value="kelompok" ${currentUser.tingkatan === 'kelompok' ? 'selected' : ''}>Pamong Kelompok</option>
            <option value="desa" ${currentUser.tingkatan === 'desa' ? 'selected' : ''}>Koordinator Desa</option>
            <option value="daerah" ${currentUser.tingkatan === 'daerah' ? 'selected' : ''}>🌟 Superadmin Daerah (Pengurus PPG)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Jabatan / Peran <span class="text-red-500">*</span></label>
          <input type="text" id="profPeran" value="${currentUser.peran || currentUser.jabatan || 'Pamong'}" required class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="wrapWilayahProf">
        <div>
          <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Asal Desa <span class="text-red-500">*</span></label>
          <select id="profDesa" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue">
            ${desaOptions}
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Asal Kelompok <span class="text-red-500">*</span></label>
          <select id="profKelompok" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue">
            ${kelOptions}
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">Ubah Kata Sandi (Opsional)</label>
        <input type="password" id="profPassword" placeholder="Kosongkan jika tidak ingin mengubah password" class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-brandBlue" />
      </div>

      <div class="flex gap-2.5 mt-2">
        <button type="button" class="btn-cancel-prof flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Batal</button>
        <button type="submit" class="flex-[2] py-3 px-4 bg-brandBlue hover:bg-brandDarkBlue text-white rounded-xl font-extrabold text-[13px] flex items-center justify-center gap-2 transition-colors">
          <span class="material-symbols-outlined text-[18px]">save</span> Simpan Perubahan
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

  document.getElementById('formSelfProfile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newNama = document.getElementById('profNama').value.trim();
    const newEmail = document.getElementById('profEmail').value.trim();
    const newNoWa = document.getElementById('profNoWa').value.trim();
    const newTingkatan = profTingkatan.value;
    const newPeran = profPeran.value;
    const selectedDesaOption = profDesa.options[profDesa.selectedIndex];
    const selectedKelOption = profKelompok.options[profKelompok.selectedIndex];
    const newPassword = document.getElementById('profPassword').value;

    const res = await updateCurrentProfile(currentUser.id, {
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

document.getElementById('btnEditProfileDesktop')?.addEventListener('click', renderSelfProfileModal);
btnEditProfile?.addEventListener('click', renderSelfProfileModal);

/* ── 3. Logout Confirmation ────────────────────────────────── */
function doLogout() {
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
}

// Daftarkan ke semua tombol logout yang mungkin ada di DOM
btnLogout?.addEventListener('click', doLogout);

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
    const namaBagian = (desa.nama || '').replace(/^Desa\s+/i, '');
    btn.innerHTML = `
      <span>${namaBagian}</span>
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
    card.className = `kelompok-card !p-3 ${hasPengurus ? 'active-kelompok' : 'disabled-kelompok'}`;

    const leader = pengurusKelompok[0] || null;
    const leaderName = leader ? leader.nama : 'Belum Terdata';
    const leaderPeran = leader ? (leader.peran || leader.jabatan || 'Pamong') : 'Pamong Kelompok';

    card.innerHTML = `
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-brandBlue dark:text-blue-400 flex flex-shrink-0 items-center justify-center">
          <span class="material-symbols-outlined text-sm">diversity_3</span>
        </div>
        <div class="flex flex-col min-w-0">
          <div class="font-bold text-xs text-slate-800 dark:text-slate-100 truncate w-full">${kel.nama}</div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400">
            ${hasPengurus ? `<span class="text-green-600 dark:text-green-400 font-semibold">${pengurusKelompok.length} Org</span>` : '0 Org'}
          </div>
        </div>
      </div>
      <div>
        ${hasPengurus
          ? `<button type="button" class="btn-view-kontak-kel flex items-center justify-center p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-brandBlue dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors" data-desa="${currentDesa.id}" data-kelompok="${kel.id}" title="Lihat kontak">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
             </button>`
          : `<button type="button" class="btn-view-kontak-empty flex items-center justify-center p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" disabled>
              <span class="material-symbols-outlined text-[16px]">visibility_off</span>
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

    const drawerKelolaItem = document.getElementById('drawerBtnKelolaPengurus');
    if (drawerKelolaItem) {
      drawerKelolaItem.style.display = (currentUser.isSuperadmin || currentUser.tingkatan === 'daerah') ? 'block' : 'none';
    }
    const drawerStrukturItem = document.getElementById('drawerBtnStruktur');
    if (drawerStrukturItem) {
      drawerStrukturItem.style.display = 'block';
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
  document.getElementById('drawerBtnPengurusDaerah')?.addEventListener('click', () => { closeDrawer(); renderStrukturDaerahModal(); });
  document.getElementById('drawerBtnLogout')?.addEventListener('click', () => {
    closeDrawer();
    doLogout();
  });

  // Desktop Sidebar Listeners
  document.getElementById('sideBtnLogout')?.addEventListener('click', doLogout);
  
  document.getElementById('sideBtnProker')?.addEventListener('click', () => { renderProkerModal(); });
  document.getElementById('sideBtnStruktur')?.addEventListener('click', () => { renderStrukturDaerahModal(); });
  document.getElementById('sideBtnSiswa')?.addEventListener('click', () => { renderSiswaModal(); });
  document.getElementById('sideBtnPembiasaan')?.addEventListener('click', () => { renderEventPembiasaanModal(); });
  document.getElementById('sideBtnAbsensi')?.addEventListener('click', () => { renderCetakAbsensiModal(); });
  document.getElementById('sideBtnPengurus')?.addEventListener('click', () => { renderManagePengurusModal(); });
  document.getElementById('sideBtnProfil')?.addEventListener('click', () => { renderSelfProfileModal(); });

  // Mobile Bottom Nav Listeners
  const mobNavHome = document.getElementById('mobNavHome');
  const mobNavPengurus = document.getElementById('mobNavPengurus');
  const mobNavFitur = document.getElementById('mobNavFitur');
  const mobNavFiturIcon = document.getElementById('mobNavFiturIcon');
  const mobDropUpMenu = document.getElementById('mobDropUpMenu');
  const mobDropUpBackdrop = document.getElementById('mobDropUpBackdrop');
  const mobNavProfil = document.getElementById('mobNavProfil');
  const mobNavLogout = document.getElementById('mobNavLogout');

  // Kelola Hak Akses Pengurus Handler (Superadmin Only)
  const handleOpenKelolaPengurus = async () => {
    showToast("Mengambil data pengurus terbaru dari server...");
    if (isSupabaseConfigured()) await syncPengurusFromSupabase();
    renderManagePengurusModal('all');
  };

  document.getElementById('sideBtnKelolaPengurus')?.addEventListener('click', handleOpenKelolaPengurus);
  document.getElementById('drawerBtnKelolaPengurus')?.addEventListener('click', () => {
    closeDrawer();
    handleOpenKelolaPengurus();
  });
  document.getElementById('mobBtnKelolaPengurus')?.addEventListener('click', () => {
    toggleDropUp();
    handleOpenKelolaPengurus();
  });

  mobNavHome?.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  mobNavPengurus?.addEventListener('click', () => { renderStrukturDaerahModal(); });
  mobNavProfil?.addEventListener('click', () => { renderSelfProfileModal(); });
  mobNavLogout?.addEventListener('click', doLogout);

  const toggleDropUp = () => {
    const isActive = mobDropUpMenu.classList.contains('active');
    if (isActive) {
      mobDropUpMenu.classList.remove('active');
      mobDropUpBackdrop.classList.remove('active');
      mobNavFiturIcon.classList.remove('rotate-180');
    } else {
      mobDropUpMenu.classList.add('active');
      mobDropUpBackdrop.classList.add('active');
      mobNavFiturIcon.classList.add('rotate-180');
    }
  };

  mobNavFitur?.addEventListener('click', toggleDropUp);
  mobDropUpBackdrop?.addEventListener('click', toggleDropUp);

  document.getElementById('mobBtnProker')?.addEventListener('click', () => { toggleDropUp(); renderProkerModal(); });
  document.getElementById('mobBtnStruktur')?.addEventListener('click', () => { toggleDropUp(); renderStrukturDaerahModal(); });
  document.getElementById('mobBtnSiswa')?.addEventListener('click', () => { toggleDropUp(); renderSiswaModal(); });
  document.getElementById('mobBtnPembiasaan')?.addEventListener('click', () => { toggleDropUp(); renderEventPembiasaanModal(); });
  document.getElementById('mobBtnAbsensi')?.addEventListener('click', () => { toggleDropUp(); renderCetakAbsensiModal(); });

  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
})();

/* ── 7. Initial Application Boot & Rendering ──────────────── */
(async function initDashboard() {
  try {
    // Optimistic render using minimal localStorage cache
    renderUserProfile();
    renderDesaTabs();
    renderKelompokGrid();
    updateSupabaseStatusUI();

    // Fetch live data from Supabase (minimizing reliance on localStorage)
    console.log('Fetching live data from Supabase...');
    await Promise.allSettled([
      syncPengurusFromSupabase(),
      syncPembiasaanFromSupabase(),
      syncKbmFromSupabase(),
      syncSiswaFromSupabase(),
      syncProkerFromSupabase()
    ]);

    // Cross-check session against live data and update UI
    const livePengurus = getPengurusList();
    const liveAccount = livePengurus.find(p => p.id === currentUser.id || p.email === currentUser.email);
    
    if (liveAccount) {
      setCurrentUser({ ...currentUser, ...liveAccount });
    }
    
    // Re-render UI with freshly synced live data from Supabase
    renderUserProfile();
    renderDesaTabs();
    renderKelompokGrid();
    checkPendingApprovals();
    console.log('PPG Dashboard initialized successfully with live data.');
  } catch (err) {
    console.error('Fatal error initializing PPG Dashboard:', err);
  }
})();
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

