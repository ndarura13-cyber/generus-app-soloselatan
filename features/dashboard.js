/* ═══════════════════════════════════════════════════════════════
   dashboard.js — PPG Solo Selatan Dashboard Controller
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  MASTER_STRUKTUR_PERAN,
  getRolesByTingkatan,
  getAllKelompok,
  MASTER_JENJANG,
  getPengurusList,
  getPengurusById,
  getPengurusDaerahList,
  getPengurusByWilayah,
  approvePengurus,
  togglePengurusActive,
  updatePengurus,
  updateCurrentProfile,
  getProkerList,
  addProker,
  updateProker,
  deleteProker,
  getProkerStats,
  getSiswaList,
  addSiswa,
  updateSiswa,
  deleteSiswa,
  calculateUmur,
  getEventPembiasaanList,
  saveEventPembiasaanList,
  addEventPembiasaan,
  updateEventPembiasaan,
  closeEventPembiasaan,
  deleteEventPembiasaan,
  getNilaiPembiasaanList,
  saveNilaiPembiasaan,
  getKbmEvents,
  getKbmEventById,
  saveKbmEvent,
  deleteKbmEvent
} from '../src/db-master.js';

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

// Modal Dialogs
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalIcon = document.getElementById('modalIcon');
const modalBody = document.getElementById('modalBody');
const btnCloseModal = document.getElementById('btnCloseModal');

// Reusable Confirmation Modal
const confirmModalBackdrop = document.getElementById('confirmModalBackdrop');
const confirmIconBox = document.getElementById('confirmIconBox');
const confirmIcon = document.getElementById('confirmIcon');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const btnConfirmOk = document.getElementById('btnConfirmOk');
const btnConfirmCancel = document.getElementById('btnConfirmCancel');

// Action Cards & Menu Modals
const btnMenuSiswa = document.getElementById('btnMenuSiswa');
const btnMenuProker = document.getElementById('btnMenuProker');
const btnMenuPembiasaan = document.getElementById('btnMenuPembiasaan');
const btnMenuAbsensi = document.getElementById('btnMenuAbsensi');
const btnMenuStrukturDaerah = document.getElementById('btnMenuStrukturDaerah');
const btnMenuPengurus = document.getElementById('btnMenuPengurus');
const btnApprovalList = document.getElementById('btnApprovalList');

/* ── 1. Initial User Session & Strict Security Verification ── */
let currentUser = null;
try {
  const sessionRaw = localStorage.getItem('ppg_user_session');
  if (sessionRaw) {
    currentUser = JSON.parse(sessionRaw);
  }
} catch (e) {
  console.error('Failed to parse user session:', e);
}

// Proteksi Keamanan: Blokir total akses langsung tanpa login
if (!currentUser || !currentUser.email) {
  localStorage.removeItem('ppg_user_session');
  window.location.replace('login.html');
  throw new Error('Akses ditolak: Anda harus login terlebih dahulu.');
}

// Verifikasi silang akun dengan database pengurus
const activePengurusList = getPengurusList();
const existingAccount = activePengurusList.find(p => p.email.toLowerCase() === currentUser.email.toLowerCase() || p.id === currentUser.id);

if (existingAccount) {
  if (existingAccount.isActive === false || existingAccount.statusApproval !== 'approved') {
    localStorage.removeItem('ppg_user_session');
    window.location.replace('login.html');
    throw new Error('Akses ditolak: Akun dinonaktifkan atau belum disetujui.');
  }
  // Sinkronkan data sesi terbaru
  currentUser = {
    ...currentUser,
    nama: existingAccount.nama,
    peran: existingAccount.peran,
    jabatan: existingAccount.jabatan,
    tingkatan: existingAccount.tingkatan,
    desaId: existingAccount.desaId,
    desaNama: existingAccount.desaNama,
    kelompokId: existingAccount.kelompokId,
    kelompokNama: existingAccount.kelompokNama,
    isSuperadmin: (existingAccount.tingkatan === 'daerah' || existingAccount.isSuperadmin === true),
  };
}

/* ── 2. Render Header Profile & Role Indicators ───────────── */
function renderUserProfile() {
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

    btnMenuPengurus.style.display = 'flex';
    checkPendingApprovals();

    const pStats = getProkerStats();
    if (prokerCardDesc) {
      prokerCardDesc.textContent = `${pStats.total} Agenda Program Kerja (${pStats.ongoing} Berlangsung, Total Est. Rp ${pStats.totalAnggaran.toLocaleString('id-ID')}).`;
    }
    prokerActionText.textContent = 'Kelola Program';
    badgeProkerStatus.textContent = 'Kelola Daerah';
    badgeProkerStatus.className = 'action-badge-top gold';

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
    btnMenuPengurus.style.display = 'none';
    if (btnApprovalList) btnApprovalList.style.display = 'none';

    const pStats = getProkerStats();
    if (prokerCardDesc) {
      prokerCardDesc.textContent = `${pStats.total} Agenda Program Daerah (${pStats.ongoing} Berjalan, ${pStats.upcoming} Akan Datang).`;
    }
    prokerActionText.textContent = 'Lihat Program';
    badgeProkerStatus.textContent = 'Agenda Aktif';
    badgeProkerStatus.className = 'action-badge-top green';

    const pembiasaanActionText = document.getElementById('pembiasaanActionText');
    const badgePembiasaanStatus = document.getElementById('badgePembiasaanStatus');
    const pembiasaanCardDesc = document.getElementById('pembiasaanCardDesc');
    if (pembiasaanActionText) pembiasaanActionText.textContent = 'Isi Nilai Pembiasaan';
    if (badgePembiasaanStatus) {
      badgePembiasaanStatus.textContent = 'Isi Nilai';
      badgePembiasaanStatus.className = 'action-badge-top green';
    }
    if (pembiasaanCardDesc) pembiasaanCardDesc.textContent = `Input nilai pembiasaan sholat 5 waktu, mengaji, dan akhlak caberawit se-Desa ${currentUser.desaNama || ''}.`;

  } else {
    userBadgeEl.textContent = `👥 Pamong Kelompok ${currentUser.kelompokNama || ''}`;
    userBadgeEl.style.background = 'var(--green-pastel)';
    userBadgeEl.style.color = 'var(--green-dark)';

    const pStats = getProkerStats();
    if (prokerCardDesc) {
      prokerCardDesc.textContent = `${pStats.total} Agenda Program Daerah (${pStats.ongoing} Berjalan, ${pStats.upcoming} Akan Datang).`;
    }
    prokerActionText.textContent = 'Lihat Program';
    badgeProkerStatus.textContent = 'Agenda Aktif';
    badgeProkerStatus.className = 'action-badge-top green';

    const pembiasaanActionText = document.getElementById('pembiasaanActionText');
    const badgePembiasaanStatus = document.getElementById('badgePembiasaanStatus');
    const pembiasaanCardDesc = document.getElementById('pembiasaanCardDesc');
    if (pembiasaanActionText) pembiasaanActionText.textContent = 'Isi Nilai Pembiasaan';
    if (badgePembiasaanStatus) {
      badgePembiasaanStatus.textContent = 'Isi Nilai';
      badgePembiasaanStatus.className = 'action-badge-top green';
    }
    if (pembiasaanCardDesc) pembiasaanCardDesc.textContent = `Input nilai pembiasaan sholat 5 waktu, mengaji, dan akhlak caberawit Kel. ${currentUser.kelompokNama || ''}.`;

    scopeTextEl.innerHTML = `<strong>Penugasan:</strong> Kelompok ${currentUser.kelompokNama || 'Gentan'} (Desa ${currentUser.desaNama || 'Barat'})`;
    btnMenuPengurus.style.display = 'none';
    if (btnApprovalList) btnApprovalList.style.display = 'none';
  }
}

/* ── 3. Notification Badge & Alert for Pending Approvals ───── */
function checkPendingApprovals() {
  const cardPending = document.getElementById('cardPendingApproval');
  const pendingCountText = document.getElementById('pendingCountText');

  if (!currentUser.isSuperadmin && currentUser.tingkatan !== 'daerah') {
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

document.getElementById('btnOpenApprovalModal')?.addEventListener('click', () => {
  renderApprovalListModal();
});

btnApprovalList?.addEventListener('click', () => {
  renderApprovalListModal();
});

function renderApprovalListModal() {
  const list = getPengurusList();
  const pendingList = list.filter(p => p.statusApproval === 'pending');

  if (pendingList.length === 0) {
    openModal('Persetujuan Pendaftaran Pengurus', 'how_to_reg', `
      <div style="text-align:center;padding:32px 10px;">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--green-dark);margin-bottom:10px;">verified</span>
        <h4 style="font-size:16px;font-weight:800;color:var(--text);">Tidak Ada Antrean Pendaftaran</h4>
        <p style="font-size:13px;color:var(--text-muted);margin-top:6px;">Semua akun pendaftaran pengurus baru telah ditinjau dan disetujui.</p>
      </div>
    `);
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

  openModal(`Persetujuan Pendaftaran (${pendingList.length} Menunggu)`, 'how_to_reg', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:12px;color:var(--text-muted);">
        Berikut adalah daftar pengurus baru yang telah mendaftar mandiri dan menunggu verifikasi Superadmin:
      </p>
      ${itemsHtml}
    </div>
  `);

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
          renderApprovalListModal();
          checkPendingApprovals();
        }
      });
    });
  });
}

/* ── 4. Reusable Confirmation Modal ────────────────────────── */
let currentConfirmCallback = null;

function showConfirmModal(opts) {
  confirmTitle.textContent = opts.title || 'Konfirmasi';
  confirmMessage.textContent = opts.message || 'Apakah Anda yakin ingin melanjutkan?';

  if (opts.icon) confirmIcon.textContent = opts.icon;
  if (opts.iconBg) confirmIconBox.style.background = opts.iconBg;
  if (opts.iconColor) confirmIconBox.style.color = opts.iconColor;

  btnConfirmOk.textContent = opts.confirmText || 'Ya';
  btnConfirmOk.style.background = opts.confirmBtnColor || 'var(--blue)';

  if (opts.cancelText === '') {
    btnConfirmCancel.style.display = 'none';
  } else {
    btnConfirmCancel.style.display = 'block';
    btnConfirmCancel.textContent = opts.cancelText || 'Batal';
  }

  currentConfirmCallback = opts.onConfirm;
  confirmModalBackdrop.style.display = 'flex';
}

btnConfirmCancel?.addEventListener('click', () => {
  confirmModalBackdrop.style.display = 'none';
  currentConfirmCallback = null;
});

btnConfirmOk?.addEventListener('click', () => {
  confirmModalBackdrop.style.display = 'none';
  if (currentConfirmCallback) currentConfirmCallback();
  currentConfirmCallback = null;
});

confirmModalBackdrop?.addEventListener('click', (e) => {
  if (e.target === confirmModalBackdrop) {
    confirmModalBackdrop.style.display = 'none';
    currentConfirmCallback = null;
  }
});

/* ── 5. Edit Profil Pengurus Sedang Bertugas (Multi-Level Dropdown) ─── */
btnEditProfile?.addEventListener('click', () => {
  renderSelfProfileModal();
});

function renderSelfProfileModal() {
  const currentDesaId = currentUser.desaId || 'desa-barat';
  const currentKelId = currentUser.kelompokId || 'kel-gentan';
  const currentTingkat = currentUser.tingkatan || 'kelompok';
  const currentPeran = currentUser.peran || currentUser.jabatan || 'Pamong Caberawit (Paud - SD)';

  let desaOptions = MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" data-name="${d.nama}" ${currentDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>
  `).join('');

  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === currentDesaId) || MASTER_WILAYAH.desa[0];
  let kelOptions = currentDesa.kelompok.map(k => `
    <option value="${k.id}" data-name="${k.nama}" ${currentKelId === k.id ? 'selected' : ''}>Kelompok ${k.nama}</option>
  `).join('');

  // Initial roles options for user's level
  const rolesList = getRolesByTingkatan(currentTingkat);
  let peranOptions = rolesList.map(r => `
    <option value="${r}" ${currentPeran === r ? 'selected' : ''}>${r}</option>
  `).join('');

  const formHtml = `
    <form id="formSelfProfile" style="display:flex;flex-direction:column;gap:14px;">
      <div style="background:var(--blue-light);padding:12px 16px;border-radius:10px;border-left:4px solid var(--blue);font-size:12px;color:var(--text);line-height:1.5;">
        <strong>Informasi Profil Pengurus:</strong><br/>
        Perubahan data diri, peran, dan asal wilayah Anda akan langsung disinkronkan ke seluruh sistem dan database PPG.
      </div>

      <div>
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Nama Lengkap <span style="color:red;">*</span></label>
        <input type="text" id="profNama" value="${currentUser.nama || ''}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Email <span style="color:red;">*</span></label>
          <input type="email" id="profEmail" value="${currentUser.email || ''}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Nomor WhatsApp <span style="color:red;">*</span></label>
          <input type="text" id="profNoWa" value="${currentUser.noWa || '081234567890'}" required style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Tingkatan Pengurus <span style="color:red;">*</span></label>
          <select id="profTingkatan" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;font-weight:700;">
            <option value="kelompok" ${currentTingkat === 'kelompok' ? 'selected' : ''}>Pamong Kelompok</option>
            <option value="desa" ${currentTingkat === 'desa' ? 'selected' : ''}>Koordinator Desa</option>
            <option value="daerah" ${currentTingkat === 'daerah' ? 'selected' : ''}>Pengurus PPG (Daerah)</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Peran / Tanggung Jawab <span style="color:red;">*</span></label>
          <select id="profPeran" style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;background:#fff;font-weight:600;">
            ${peranOptions}
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="rowProfWilayah">
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

      <div style="border-top:1px dashed var(--border);padding-top:10px;">
        <label style="display:block;font-size:12px;font-weight:700;margin-bottom:4px;color:var(--text);">Ganti Password (Opsional)</label>
        <input type="password" id="profPassword" placeholder="Kosongkan jika tidak ingin mengubah password..." style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;" />
      </div>

      <div style="display:flex;gap:10px;margin-top:10px;">
        <button type="button" class="btn-cancel-modal" onclick="document.getElementById('modalBackdrop').style.display='none'" style="flex:1;padding:12px;border:1px solid var(--border);background:#fff;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">Batal</button>
        <button type="submit" style="flex:2;padding:12px;border:none;background:linear-gradient(135deg, var(--blue), var(--blue-dark));color:#fff;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span> Simpan Perubahan
        </button>
      </div>
    </form>
  `;

  openModal('Edit Profil Pengurus', 'account_circle', formHtml);

  const profTingkatan = document.getElementById('profTingkatan');
  const profPeran = document.getElementById('profPeran');
  const profDesa = document.getElementById('profDesa');
  const profKelompok = document.getElementById('profKelompok');

  // Multi-level dropdown: Tingkatan -> Peran
  profTingkatan?.addEventListener('change', () => {
    const selectedTingkat = profTingkatan.value;
    const newRoles = getRolesByTingkatan(selectedTingkat);
    profPeran.innerHTML = newRoles.map(r => `<option value="${r}">${r}</option>`).join('');
  });

  // Multi-level dropdown: Desa -> Kelompok (Sorted A-Z)
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
      currentUser.nama = newNama;
      currentUser.email = newEmail;
      currentUser.noWa = newNoWa;
      currentUser.tingkatan = newTingkatan;
      currentUser.peran = newPeran;
      currentUser.jabatan = newPeran;
      currentUser.desaId = profDesa.value;
      currentUser.desaNama = selectedDesaOption?.dataset.name || 'Barat';
      currentUser.kelompokId = profKelompok.value;
      currentUser.kelompokNama = selectedKelOption?.dataset.name || 'Gentan';
      if (newTingkatan === 'daerah') {
        currentUser.isSuperadmin = true;
      }

      renderUserProfile();
      renderKelompokGrid();
      closeModal();
      showConfirmModal({
        title: 'Profil Berhasil Diperbarui',
        message: `Profil "${newNama}" telah berhasil disimpan sebagai ${newPeran}. Peran dan asal wilayah Anda telah disesuaikan secara real-time.`,
        icon: 'check_circle',
        iconBg: 'var(--green-pastel)',
        iconColor: 'var(--green-dark)',
        confirmText: 'Tutup',
        cancelText: '',
        confirmBtnColor: 'var(--green-dark)',
        onConfirm: () => { }
      });
    }
  });
}

/* ── 6. Logout Confirmation via Reusable Modal ────────────── */
btnLogout?.addEventListener('click', () => {
  showConfirmModal({
    title: 'Konfirmasi Keluar Akun',
    message: 'Apakah Anda yakin ingin keluar dari sesi Dashboard PPG Solo Selatan?',
    icon: 'logout',
    iconBg: 'var(--red-light)',
    iconColor: 'var(--red)',
    confirmText: 'Ya, Keluar',
    cancelText: 'Tetap di Sini',
    confirmBtnColor: 'var(--red)',
    onConfirm: () => {
      localStorage.removeItem('ppg_user_session');
      window.location.href = 'login.html';
    }
  });
});

/* ── 7. Render 5 Desa Tabs & 27 Kelompok (Database Linked) ──── */
let activeDesaId = currentUser.desaId || 'desa-barat';

function renderDesaTabs() {
  desaTabsContainer.innerHTML = '';

  MASTER_WILAYAH.desa.forEach((desa) => {
    const btn = document.createElement('button');
    btn.className = `desa-tab-btn ${desa.id === activeDesaId ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:16px;">location_city</span>
      <span>Desa ${desa.nama}</span>
      <span class="desa-count-badge">${desa.kelompok.length}</span>
    `;

    btn.addEventListener('click', () => {
      activeDesaId = desa.id;
      renderDesaTabs();
      renderKelompokGrid();
    });

    desaTabsContainer.appendChild(btn);
  });
}

function renderKelompokGrid() {
  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === activeDesaId) || MASTER_WILAYAH.desa[0];
  kelompokGridContainer.innerHTML = '';

  if (btnKontakDesaText) {
    btnKontakDesaText.textContent = `Kontak Pengurus Desa ${currentDesa.nama}`;
  }

  currentDesa.kelompok.forEach((kel, idx) => {
    const pengurusList = getPengurusByWilayah(currentDesa.id, kel.id);
    const hasPengurus = pengurusList.length > 0;

    const card = document.createElement('div');
    card.className = `kelompok-card ${hasPengurus ? 'active-kelompok' : 'disabled-kelompok'}`;

    let badgeHtml = '';
    let actionBtnHtml = '';

    if (hasPengurus) {
      badgeHtml = `<div class="badge-pengurus-count"><span class="dot ongoing" style="width:5px;height:5px;"></span> ${pengurusList.length} Pengurus Aktif</div>`;
      actionBtnHtml = `
        <button type="button" class="btn-view-kontak-kel" data-kel-id="${kel.id}" data-kel-name="${kel.nama}" title="Lihat kontak pengurus">
          <span class="material-symbols-outlined" style="font-size:16px;">contacts</span>
          <span>Kontak (${pengurusList.length})</span>
        </button>
      `;
    } else {
      badgeHtml = `<div class="badge-pengurus-empty"><span class="dot done" style="width:5px;height:5px;background:#94a3b8;"></span> Belum Ada Pengurus</div>`;
      actionBtnHtml = `
        <button type="button" class="btn-view-kontak-empty" disabled title="Belum ada pengurus di kelompok ini">
          <span class="material-symbols-outlined" style="font-size:16px;">person_off</span>
        </button>
      `;
    }

    card.innerHTML = `
      <div class="kel-info">
        <div class="kel-icon">
          <span class="material-symbols-outlined">home_work</span>
        </div>
        <div>
          <div class="kel-name">Kelompok ${kel.nama}</div>
          <div class="kel-pamong">Desa ${currentDesa.nama} &bull; Urutan ${idx + 1}</div>
          ${badgeHtml}
        </div>
      </div>
      ${actionBtnHtml}
    `;

    if (hasPengurus) {
      card.querySelector('.btn-view-kontak-kel')?.addEventListener('click', (e) => {
        e.stopPropagation();
        renderKontakModal(`Kelompok ${kel.nama} (Desa ${currentDesa.nama})`, pengurusList);
      });
      card.addEventListener('click', () => {
        renderKontakModal(`Kelompok ${kel.nama} (Desa ${currentDesa.nama})`, pengurusList);
      });
    }

    kelompokGridContainer.appendChild(card);
  });
}

btnKontakDesa?.addEventListener('click', () => {
  const currentDesa = MASTER_WILAYAH.desa.find(d => d.id === activeDesaId) || MASTER_WILAYAH.desa[0];
  const allDesaPengurus = getPengurusByWilayah(currentDesa.id, null);
  renderKontakModal(`Seluruh Pengurus Desa ${currentDesa.nama}`, allDesaPengurus);
});

/* ── 8. Pop-up Kontak Pengurus Wilayah (Multi-Person) ──────── */
function renderKontakModal(wilayahTitle, pengurusList) {
  if (!pengurusList || pengurusList.length === 0) {
    openModal(`Kontak Pengurus - ${wilayahTitle}`, 'contact_phone', `
      <div style="text-align:center;padding:28px 10px;">
        <span class="material-symbols-outlined" style="font-size:44px;color:#94a3b8;margin-bottom:8px;">person_off</span>
        <h4 style="font-size:15px;font-weight:800;color:var(--text);">Belum Ada Pengurus Terdaftar</h4>
        <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">Wilayah ini belum memiliki pamong/pengurus aktif dalam database.</p>
      </div>
    `);
    return;
  }

  const listHtml = pengurusList.map(p => {
    const waClean = (p.noWa || '081234567890').replace(/[^0-9]/g, '');
    const waIntl = waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean;
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const asalTxt = `Kelompok ${p.kelompokNama || '-'} &bull; Desa ${p.desaNama || '-'}`;

    return `
      <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:50%;background:var(--blue-light);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;">
              ${(p.nama || 'P').charAt(0)}
            </div>
            <div>
              <div style="font-size:14px;font-weight:800;color:var(--text);">${p.nama}</div>
              <div style="font-size:12px;color:var(--blue);font-weight:600;">${p.peran || p.jabatan || 'Pamong'}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">📍 Asal: ${asalTxt}</div>
            </div>
          </div>
          <span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:20px;background:#e8f7ee;color:#166534;white-space:nowrap;">🟢 Aktif</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
          <a href="https://wa.me/${waIntl}?text=${waMsg}" target="_blank" rel="noopener" style="padding:9px 12px;border-radius:8px;background:#25d366;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;box-shadow:0 2px 6px rgba(37,211,102,.25);">
            <span class="material-symbols-outlined" style="font-size:16px;">chat</span> Chat WhatsApp
          </a>
          <a href="mailto:${p.email}" style="padding:9px 12px;border-radius:8px;background:#ffffff;border:1px solid var(--border);color:var(--text);font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;">
            <span class="material-symbols-outlined" style="font-size:16px;">mail</span> Kirim Email
          </a>
        </div>
      </div>
    `;
  }).join('');

  openModal(`Kontak Pengurus - ${wilayahTitle} (${pengurusList.length} Pengurus)`, 'contacts', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:12px;color:var(--text-muted);">
        Berikut adalah daftar kontak pengurus &amp; pamong yang bertanggung jawab di wilayah <strong>${wilayahTitle}</strong>:
      </p>
      ${listHtml}
    </div>
  `);
}

renderDesaTabs();
renderKelompokGrid();

/* ── 9. General Modal Dialog Helpers ───────────────────────── */
function openModal(title, iconName, bodyHtml, size = 'default') {
  modalTitle.textContent = title;
  modalIcon.textContent = iconName;
  modalBody.innerHTML = bodyHtml;

  // Trigger smooth content fade animation on every view transition
  modalBody.classList.remove('modal-content-fade');
  void modalBody.offsetWidth; // force reflow
  modalBody.classList.add('modal-content-fade');

  const modalBox = document.getElementById('modalBox');
  if (modalBox) {
    modalBox.classList.remove('modal-wide', 'modal-large', 'modal-medium');
    if (size === 'wide') modalBox.classList.add('modal-wide');
    else if (size === 'large') modalBox.classList.add('modal-large');
    else if (size === 'medium') modalBox.classList.add('modal-medium');

    // Reset scroll smoothly to top
    modalBox.scrollTop = 0;
  }
  modalBackdrop.style.display = 'flex';
}

function closeModal() {
  modalBackdrop.style.display = 'none';
}

btnCloseModal?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', (e) => {
  // if (e.target === modalBackdrop) closeModal(); // Dimatikan agar data input tidak hilang saat tidak sengaja klik di luar
});

/* ── 10. Action Cards Click Handlers ───────────────────────── */

// Menu 1: Database & Input Generus
btnMenuSiswa?.addEventListener('click', () => {
  renderSiswaModal();
});

// Menu 3: Lembar Pembiasaan (Caberawit)
btnMenuPembiasaan?.addEventListener('click', () => {
  renderEventPembiasaanModal();
});

// Shortcut dari 4 Stat Card Overview (Rincian Cepat Kategori & Kelas)
document.getElementById('cardStatTotal')?.addEventListener('click', () => {
  renderDetailRingkasanModal('all');
});
document.getElementById('cardStatCaberawit')?.addEventListener('click', () => {
  renderDetailRingkasanModal('caberawit');
});
document.getElementById('cardStatGp')?.addEventListener('click', () => {
  renderDetailRingkasanModal('gp_reguler');
});
document.getElementById('cardStatRemaja')?.addEventListener('click', () => {
  renderDetailRingkasanModal('remaja');
});

// Menu 4: Absensi KBM (Cetak Presensi)
btnMenuAbsensi?.addEventListener('click', () => {
  renderCetakAbsensiModal();
});

// ═══════════════════════════════════════════════════════════════════════════
// MENU 2: PROGRAM KERJA TAHUNAN (MODUL LENGKAP 8 KOLOM & CRUD REALTIME)
// ═══════════════════════════════════════════════════════════════════════════

const DAFTAR_BIDANG_PPG = [
  'Ketua',
  'Wakil Ketua',
  'Sekretaris',
  'Bendahara',
  'Kurikulum',
  'Tenaga Pendidik',
  'Penggalang Dana',
  'Sarana dan Prasarana',
  'Kegiatan Muda Mudi',
  'Seni dan Olahraga',
  'Kemandirian',
  'Keputrian',
  'Bimbingan Konseling',
  'Tahfidz'
];

btnMenuProker?.addEventListener('click', () => {
  renderProkerModal();
});

function exportProkerCsv() {
  const prokerList = getProkerList();
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "NO;KEGIATAN;WAKTU;SASARAN/PESERTA;TUJUAN KEGIATAN;RINCIAN BIAYA;EST. BIAYA (RP);TEMPAT PELAKSANAAN;STATUS;PENANGGUNG JAWAB (PIC)\n";

  // Group by PIC
  const grouped = prokerList.reduce((acc, curr) => {
    const pic = curr.penanggungJawab || 'Tanpa Bidang';
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  Object.keys(grouped).sort().forEach(pic => {
    // Add Header Row for PIC
    csvContent += `\n"--- BIDANG: ${pic.toUpperCase()} ---";;;;;;;;;\n`;
    grouped[pic].forEach((p, idx) => {
      const no = p.no || (idx + 1);
      const kegiatan = `"${(p.kegiatan || '').replace(/"/g, '""')}"`;
      const waktu = `"${(p.waktu || '').replace(/"/g, '""')}"`;
      const sasaran = `"${(p.sasaran || '').replace(/"/g, '""')}"`;
      const tujuan = `"${(p.tujuan || '').replace(/"/g, '""')}"`;
      const rincianBiaya = `"${(p.rincianBiaya || '').replace(/"/g, '""')}"`;
      const estBiaya = p.estBiaya || 0;
      const tempat = `"${(p.tempat || '').replace(/"/g, '""')}"`;
      const status = p.status || 'planned';
      const picField = `"${(p.penanggungJawab || '').replace(/"/g, '""')}"`;

      csvContent += `${no};${kegiatan};${waktu};${sasaran};${tujuan};${rincianBiaya};${estBiaya};${tempat};${status};${picField}\n`;
    });
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Program_Kerja_Tahunan_PPG_Solo_Selatan_2026_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function printProkerTable() {
  const prokerList = getProkerList();
  const stats = getProkerStats();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Group by PIC
  const grouped = prokerList.reduce((acc, curr) => {
    const pic = curr.penanggungJawab || 'Tanpa Bidang';
    if (!acc[pic]) acc[pic] = [];
    acc[pic].push(curr);
    return acc;
  }, {});

  let rowsHtml = '';
  Object.keys(grouped).sort().forEach(pic => {
    rowsHtml += `
      <tr style="background:#e2e8f0;">
        <td colspan="9" style="padding:10px 8px;border:1px solid #cbd5e1;font-weight:bold;font-size:12px;color:#1e293b;">
          BIDANG: ${pic.toUpperCase()}
        </td>
      </tr>
    `;
    grouped[pic].forEach((p, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align:center;padding:8px;border:1px solid #cbd5e1;font-weight:bold;">${p.no || (idx + 1)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;"><strong>${p.kegiatan}</strong></td>
          <td style="padding:8px;border:1px solid #cbd5e1;white-space:nowrap;">${p.waktu}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${p.sasaran}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;font-size:11px;">${p.tujuan}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;font-size:10.5px;font-style:italic;">${p.rincianBiaya || '-'}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:#065f46;">Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${p.tempat}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;font-size:10px;">${(p.status || '').toUpperCase()}</td>
        </tr>
      `;
    });
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Program Kerja Tahunan PPG Solo Selatan 2026</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #1e293b; }
        h2 { margin: 0 0 4px 0; color: #1a56c4; font-size: 18px; }
        p { margin: 2px 0 16px 0; font-size: 12px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
        th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 10px; text-transform: uppercase; }
        .summary-box { display: flex; gap: 20px; font-size: 12px; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h2>PROGRAM KERJA TAHUNAN PPG SOLO SELATAN</h2>
      <p>Tahun Anggaran 2026 &bull; Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
      <div class="summary-box">
        <div><strong>Total Agenda:</strong> ${stats.total} Program</div>
        <div><strong>Total Est. Anggaran:</strong> Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</div>
        <div><strong>Sedang Berjalan:</strong> ${stats.ongoing} Program</div>
        <div><strong>Selesai:</strong> ${stats.done} Program</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:30px;text-align:center;">NO</th>
            <th>KEGIATAN</th>
            <th>WAKTU</th>
            <th>SASARAN/ PESERTA</th>
            <th>TUJUAN KEGIATAN</th>
            <th>RINCIAN BIAYA</th>
            <th>EST. BIAYA</th>
            <th>TEMPAT PELAKSANAAN</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr && !endDateStr) return '';
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  if (startDateStr && !endDateStr) {
    const s = new Date(startDateStr);
    return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
  }

  if (!startDateStr && endDateStr) {
    const e = new Date(endDateStr);
    return `${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
  }

  const s = new Date(startDateStr);
  const e = new Date(endDateStr);

  const isSameDay = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate();
  if (isSameDay) {
    return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
  }

  const isSameMonthAndYear = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  if (isSameMonthAndYear) {
    const lastDayOfMonth = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate();
    if (s.getDate() === 1 && e.getDate() === lastDayOfMonth) {
      return `${monthNames[s.getMonth()]} ${s.getFullYear()}`;
    }
    return `${s.getDate()} – ${e.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()}`;
  }

  const isSameYear = s.getFullYear() === e.getFullYear();
  if (isSameYear) {
    return `${s.getDate()} ${monthNames[s.getMonth()]} – ${e.getDate()} ${monthNames[e.getMonth()]} ${s.getFullYear()}`;
  }

  return `${s.getDate()} ${monthNames[s.getMonth()]} ${s.getFullYear()} – ${e.getDate()} ${monthNames[e.getMonth()]} ${e.getFullYear()}`;
}

function renderProkerModal(filterBidang = 'all', filterStatus = 'all', searchQuery = '', activeTab = 'timeline') {
  const isSuper = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';
  const prokerList = getProkerList();
  const stats = getProkerStats();

  // Filter proker data: Status, Bidang Penanggung Jawab (PIC), Search
  let filtered = prokerList.filter(p => {
    if (filterBidang !== 'all') {
      const picText = (p.penanggungJawab || '').toLowerCase();
      if (!picText.includes(filterBidang.toLowerCase())) return false;
    }
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchKegiatan = (p.kegiatan || '').toLowerCase().includes(q);
      const matchTempat = (p.tempat || '').toLowerCase().includes(q);
      const matchTujuan = (p.tujuan || '').toLowerCase().includes(q);
      const matchSasaran = (p.sasaran || '').toLowerCase().includes(q);
      const matchPic = (p.penanggungJawab || '').toLowerCase().includes(q);
      if (!matchKegiatan && !matchTempat && !matchTujuan && !matchSasaran && !matchPic) return false;
    }
    return true;
  });

  // Sort by 'no' ascending
  filtered.sort((a, b) => (a.no || 0) - (b.no || 0));

  // Role Header Banner
  let bannerNoticeHtml = '';
  if (isSuper) {
    bannerNoticeHtml = `
      <div style="background:linear-gradient(135deg, #fef8e7 0%, #fff3cd 100%);padding:14px 18px;border-radius:12px;border:1.5px solid #fde68a;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-size:13px;font-weight:800;color:#92400e;">🌟 Wewenang Superadmin Daerah</div>
          <div style="font-size:12px;color:#a16207;margin-top:2px;">Tombol fungsi ini hanya tampil pada halaman Superadmin, desa kelompok hanya dapat melihat 👁️.</div>
        </div>
        <button type="button" id="btnTambahProkerBaru" style="padding:9px 16px;background:linear-gradient(135deg, var(--gold), #d49b10);color:#1a1d2e;border:none;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(212,160,23,.25);">
          <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span> Tambah Program Kerja
        </button>
      </div>
    `;
  } else {
    bannerNoticeHtml = `
      <div style="background:#f0fdf4;padding:12px 16px;border-radius:12px;border:1px solid #bbf7d0;font-size:12.5px;color:#166534;line-height:1.5;">
        <strong>👁️ Mode Koordinasi Wilayah (${currentUser.tingkatan === 'desa' ? 'Tingkat Desa ' + (currentUser.desaNama || '') : 'Pamong Kelompok ' + (currentUser.kelompokNama || '')}):</strong><br/>
        Berikut adalah agenda resmi Program Kerja PPG Solo Selatan beserta rincian sasaran, tujuan, waktu, dan tempat pelaksanaan kegiatan.
      </div>
    `;
  }

  // Summary Stat Strip (2 Baris Rapi)
  const growthBadge = stats.percentGrowth > 0
    ? `<span class="proker-growth-pill up">▲ +${stats.percentGrowth}% Naik</span>`
    : (stats.percentGrowth < 0
      ? `<span class="proker-growth-pill down">▼ ${stats.percentGrowth}% Turun</span>`
      : `<span class="proker-growth-pill equal">▬ 0% Tetap</span>`);

  const statsHtml = `
    <div class="proker-stats-container">
      <div class="proker-stats-row-1">
        <div class="proker-stat-box">
          <span class="stat-label">Total Agenda</span>
          <span class="stat-num">${stats.total} Program</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Sedang Berjalan</span>
          <span class="stat-num" style="color:var(--green);">${stats.ongoing} Program</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Selesai / Terlaksana</span>
          <span class="stat-num" style="color:#64748b;">${stats.done} Program</span>
        </div>
      </div>
      <div class="proker-stats-row-2">
        <div class="proker-stat-box">
          <span class="stat-label">Total Est. Anggaran Tahun Ini</span>
          <span class="stat-num" style="color:var(--blue);">Rp ${stats.totalAnggaran.toLocaleString('id-ID')}</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Est. Anggaran Tahun Sebelumnya</span>
          <span class="stat-num" style="color:var(--text-muted);">Rp ${stats.anggaranTahunLalu.toLocaleString('id-ID')}</span>
        </div>
        <div class="proker-stat-box">
          <span class="stat-label">Pertumbuhan Anggaran</span>
          <div class="stat-num">${growthBadge}</div>
        </div>
      </div>
    </div>
  `;

  // Filter Bar (Hanya Status & Bidang Penanggung Jawab PIC)
  const bidangOptions = DAFTAR_BIDANG_PPG.map(b =>
    `<option value="${b}" ${filterBidang === b ? 'selected' : ''}>Bidang ${b}</option>`
  ).join('');

  const filterHtml = `
    <div class="proker-filter-bar">
      <div style="flex:1;min-width:180px;position:relative;">
        <input type="text" id="inputProkerSearch" value="${searchQuery}" placeholder="Cari kegiatan, tempat, tujuan..." style="width:100%;padding:8px 12px 8px 32px;border:1px solid var(--border);border-radius:8px;font-size:12px;outline:none;" />
        <span class="material-symbols-outlined" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-muted);">search</span>
      </div>

      <select id="selectFilterStatus" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff;outline:none;cursor:pointer;">
        <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
        <option value="ongoing" ${filterStatus === 'ongoing' ? 'selected' : ''}>🟢 Sedang Berlangsung</option>
        <option value="upcoming" ${filterStatus === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
        <option value="planned" ${filterStatus === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
        <option value="done" ${filterStatus === 'done' ? 'selected' : ''}>⚪ Selesai</option>
      </select>

      <select id="selectFilterBidang" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;background:#fff;outline:none;cursor:pointer;">
        <option value="all" ${filterBidang === 'all' ? 'selected' : ''}>Semua Bidang (14 Bidang)</option>
        ${bidangOptions}
      </select>

      <div style="display:inline-flex;gap:6px;">
        <button type="button" id="btnExportCsv" title="Download data dalam format Excel CSV" style="padding:7px 12px;background:#ffffff;border:1px solid var(--border);border-radius:8px;font-size:11.5px;font-weight:700;color:var(--text);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;color:var(--green);">file_download</span> CSV
        </button>
        <button type="button" id="btnPrintTable" title="Cetak dokumen resmi" style="padding:7px 12px;background:#ffffff;border:1px solid var(--border);border-radius:8px;font-size:11.5px;font-weight:700;color:var(--text);cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;color:var(--blue);">print</span> Cetak
        </button>
      </div>

      <div style="display:inline-flex;background:#e2e8f0;padding:2px;border-radius:8px;">
        <button type="button" id="tabViewTimeline" style="padding:6px 12px;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;background:${activeTab === 'timeline' ? '#ffffff' : 'transparent'};color:${activeTab === 'timeline' ? 'var(--blue)' : 'var(--text-muted)'};box-shadow:${activeTab === 'timeline' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:14px;">view_timeline</span> Timeline Kegiatan
        </button>
        <button type="button" id="tabViewTable" style="padding:6px 12px;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;background:${activeTab === 'table' ? '#ffffff' : 'transparent'};color:${activeTab === 'table' ? 'var(--blue)' : 'var(--text-muted)'};box-shadow:${activeTab === 'table' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'};display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:14px;">table_chart</span> Tabel Resmi
        </button>
      </div>
    </div>
  `;

  // Content rendering based on activeTab
  let contentHtml = '';

  if (activeTab === 'table') {
    let rowsHtml = filtered.map((p, idx) => {
      let statusClass = p.status || 'planned';

      let quickStatusSelect = isSuper ? `
        <select class="proker-quick-select proker-quick-status-change" data-id="${p.id}" style="font-size:11px;padding:4px 6px;">
          <option value="planned" ${statusClass === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
          <option value="upcoming" ${statusClass === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
          <option value="ongoing" ${statusClass === 'ongoing' ? 'selected' : ''}>🟢 Berlangsung</option>
          <option value="done" ${statusClass === 'done' ? 'selected' : ''}>⚪ Selesai</option>
        </select>
      ` : `
        <span class="proker-badge-status ${statusClass}">
          <span class="dot ${statusClass}"></span>
          <span>${statusClass === 'done' ? 'Selesai' : (statusClass === 'ongoing' ? 'Berlangsung' : (statusClass === 'upcoming' ? 'Akan Datang' : 'Direncanakan'))}</span>
        </span>
      `;

      let actionsCell = '';
      if (isSuper) {
        actionsCell = `
          <td style="white-space:nowrap;text-align:right;">
            <div style="display:inline-flex;gap:4px;">
              <button type="button" class="btn-proker-edit" data-id="${p.id}" title="Edit Program Kerja" style="padding:5px 8px;border:1px solid var(--border);background:#fff;color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                <span class="material-symbols-outlined" style="font-size:14px;">edit</span> Edit
              </button>
              <button type="button" class="btn-proker-del" data-id="${p.id}" data-title="${p.kegiatan}" title="Hapus Program" style="padding:5px 8px;border:1px solid #fee2e2;background:#fff;color:var(--red);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
              </button>
            </div>
          </td>
        `;
      }

      return `
        <tr>
          <td style="font-weight:800;text-align:center;color:var(--blue);">${p.no || (idx + 1)}
          </td>
          <td>
            <div style="font-weight:800;font-size:13px;color:var(--text);">${p.kegiatan}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">PIC: <strong style="color:#1e40af;">${p.penanggungJawab || 'Pengurus PPG'}</strong></div>
          </td>
          <td style="white-space:nowrap;">
            <div style="font-weight:700;color:var(--text);display:flex;align-items:center;gap:4px;">
              <span class="material-symbols-outlined" style="font-size:14px;color:var(--blue);">calendar_today</span>
              ${p.waktu}
            </div>
          </td>
          <td>
            <div style="font-weight:700;color:#1e40af;display:flex;align-items:center;gap:4px;font-size:11.5px;">
              <span class="material-symbols-outlined" style="font-size:14px;">group</span>
              ${p.sasaran}
            </div>
          </td>
          <td>
            <div style="font-size:11.5px;color:var(--text);max-width:200px;line-height:1.4;">${p.tujuan}</div>
          </td>
          <td>
            <div style="font-size:11px;color:var(--text-muted);font-style:italic;max-width:180px;line-height:1.4;">${p.rincianBiaya || '-'}</div>
          </td>
          <td style="white-space:nowrap;">
            <strong style="color:var(--green-dark);font-size:12.5px;">Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}</strong>
          </td>
          <td>
            <div style="font-weight:700;color:#3730a3;display:flex;align-items:center;gap:4px;font-size:11.5px;">
              <span class="material-symbols-outlined" style="font-size:14px;">location_on</span>
              ${p.tempat}
            </div>
          </td>
          <td>
            ${quickStatusSelect}
          </td>
          ${actionsCell}
        </tr>
      `;
    }).join('');

    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="${isSuper ? 10 : 9}" style="text-align:center;padding:32px;color:var(--text-muted);">
            <span class="material-symbols-outlined" style="font-size:36px;color:var(--border);margin-bottom:6px;">event_busy</span>
            <div style="font-weight:700;font-size:13px;color:var(--text);">Tidak Ada Program Kerja Sesuai Filter</div>
            <div style="font-size:12px;margin-top:2px;">Silakan sesuaikan kata kunci pencarian atau pilihan bidang.</div>
          </td>
        </tr>
      `;
    }

    contentHtml = `
      <div style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span>👈 Geser tabel ke kanan dan ke kiri untuk melihat seluruh 8 kolom program kerja 👉</span>
        <span>Menampilkan <strong>${filtered.length}</strong> program</span>
      </div>
      <div class="proker-table-wrap">
        <table class="proker-table">
          <thead>
            <tr>
              <th style="width:36px;text-align:center;">NO</th>
              <th>KEGIATAN</th>
              <th>WAKTU</th>
              <th>SASARAN/ PESERTA</th>
              <th>TUJUAN KEGIATAN</th>
              <th>RINCIAN BIAYA</th>
              <th>EST. BIAYA</th>
              <th>TEMPAT PELAKSANAAN</th>
              <th>STATUS</th>
              ${isSuper ? '<th style="text-align:right;">AKSI</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  } else {
    // Timeline / Semester View (Pinned by Default)
    contentHtml = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-outlined" style="font-size:16px;color:var(--blue);">view_timeline</span>
            Timeline kronologis ${filtered.length} agenda kegiatan program kerja tahunan 2026.
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${filtered.map(p => {
      let statusClass = p.status || 'planned';

      let quickStatusTimeline = isSuper ? `
              <select class="proker-quick-select proker-quick-status-change" data-id="${p.id}">
                <option value="planned" ${statusClass === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
                <option value="upcoming" ${statusClass === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
                <option value="ongoing" ${statusClass === 'ongoing' ? 'selected' : ''}>🟢 Berlangsung</option>
                <option value="done" ${statusClass === 'done' ? 'selected' : ''}>⚪ Selesai</option>
              </select>
            ` : `
              <span class="proker-badge-status ${statusClass}">
                <span class="dot ${statusClass}"></span>
                <span>${statusClass === 'done' ? 'Selesai' : (statusClass === 'ongoing' ? 'Sedang Berlangsung' : (statusClass === 'upcoming' ? 'Akan Datang' : 'Direncanakan'))}</span>
              </span>
            `;

      let superButtons = isSuper ? `
              <div style="display:inline-flex;gap:6px;align-items:center;">
                <button type="button" class="btn-proker-edit" data-id="${p.id}" title="Edit Program" style="padding:5px 10px;border:1px solid var(--border);background:#fff;color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">edit</span> Edit
                </button>
                <button type="button" class="btn-proker-del" data-id="${p.id}" data-title="${p.kegiatan}" title="Hapus Program" style="padding:5px 10px;border:1px solid #fee2e2;background:#fff;color:var(--red);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:2px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
                </button>
              </div>
            ` : '';

      return `
              <div style="border:1px solid var(--border);border-radius:12px;padding:14px;background:#ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.02);display:flex;gap:14px;align-items:flex-start;">
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                    <div>
                      <strong style="font-size:14px;color:var(--text);">${p.no}</strong>
                      <strong style="font-size:14px;color:var(--text);"> . </strong>
                      <strong style="font-size:14px;color:var(--text);">${p.kegiatan}</strong>
                      </br>
                      <span style="font-size:11px;color:var(--blue);font-weight:700;background:var(--blue-light);padding:2px 6px;border-radius:4px;margin-left:6px;">PIC: ${p.penanggungJawab || 'Pengurus PPG'}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${quickStatusTimeline}
                      ${superButtons}
                    </div>
                  </div>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);margin:6px 0;">
                    <span style="display:flex;align-items:center;gap:4px;">
                      <span class="material-symbols-outlined ms-proker-ic">calendar_today</span> ${p.waktu}
                    </span>
                    <span>&bull;</span>
                    <span style="display:flex;align-items:center;gap:4px;color:#3730a3;font-weight:600;">
                      <span class="material-symbols-outlined ms-proker-ic">location_on</span> ${p.tempat}
                    </span>
                    <span>&bull;</span>
                    <span style="display:flex;align-items:center;gap:4px;color:#1e40af;font-weight:600;">
                      <span class="material-symbols-outlined ms-proker-ic">group</span> ${p.sasaran}
                    </span>
                  </div>
                  <div style="background:var(--surface-2);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--text);margin-bottom:6px;border-left:3px solid var(--blue);">
                    <strong>Tujuan:</strong> ${p.tujuan}
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--text-muted);border-top:1px dashed var(--border);padding-top:6px;flex-wrap:wrap;gap:6px;">
                    <div>Rincian Biaya: <em>${p.rincianBiaya || '-'}</em></div>
                    <strong style="color:var(--green-dark);font-size:12.5px;">Est. Biaya: Rp ${(p.estBiaya || 0).toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  // Open Modal with Proker UI
  openModal('Program Kerja Tahunan PPG Solo Selatan', 'event_note', `
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${bannerNoticeHtml}
      ${statsHtml}
      ${filterHtml}
      ${contentHtml}
    </div>
  `, 'wide');

  // Event Listeners inside Modal
  document.getElementById('inputProkerSearch')?.addEventListener('input', (e) => {
    renderProkerModal(filterBidang, filterStatus, e.target.value, activeTab);
  });

  document.getElementById('selectFilterStatus')?.addEventListener('change', (e) => {
    renderProkerModal(filterBidang, e.target.value, searchQuery, activeTab);
  });

  document.getElementById('selectFilterBidang')?.addEventListener('change', (e) => {
    renderProkerModal(e.target.value, filterStatus, searchQuery, activeTab);
  });

  document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    exportProkerCsv();
  });

  document.getElementById('btnPrintTable')?.addEventListener('click', () => {
    printProkerTable();
  });

  document.getElementById('tabViewTable')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'table');
  });

  document.getElementById('tabViewTimeline')?.addEventListener('click', () => {
    renderProkerModal(filterBidang, filterStatus, searchQuery, 'timeline');
  });

  document.getElementById('btnTambahProkerBaru')?.addEventListener('click', () => {
    renderAddEditProkerForm(null);
  });

  // Aksi Cepat Pergantian Status Program Kerja Langsung Tersimpan
  modalBody.querySelectorAll('.proker-quick-status-change').forEach(select => {
    select.addEventListener('change', (e) => {
      const pId = select.dataset.id;
      const newStatus = select.value;
      updateProker(pId, { status: newStatus });
      renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab);
      renderUserProfile();
    });
  });

  modalBody.querySelectorAll('.btn-proker-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      const prokerItem = prokerList.find(p => p.id === pId);
      if (prokerItem) renderAddEditProkerForm(prokerItem);
    });
  });

  modalBody.querySelectorAll('.btn-proker-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      const pTitle = btn.dataset.title;

      showConfirmModal({
        title: 'Hapus Program Kerja',
        message: `Apakah Anda yakin ingin menghapus program "${pTitle}" dari agenda tahunan?`,
        icon: 'delete_forever',
        iconBg: 'var(--red-light)',
        iconColor: 'var(--red)',
        confirmText: 'Ya, Hapus',
        confirmBtnColor: 'var(--red)',
        onConfirm: () => {
          deleteProker(pId);
          renderProkerModal(filterBidang, filterStatus, searchQuery, activeTab);
          renderUserProfile();
        }
      });
    });
  });
}

function renderAddEditProkerForm(p = null) {
  const isEdit = !!p;
  const modalTitleText = isEdit ? `Edit Program Kerja: ${p.kegiatan}` : 'Tambah Program Kerja Baru';
  const prokerList = getProkerList();
  const autoNo = isEdit ? p.no : (prokerList.length > 0 ? Math.max(...prokerList.map(item => item.no || 0)) + 1 : 1);

  // Opsi Bidang PIC
  const picOptions = DAFTAR_BIDANG_PPG.map(b => {
    const isSelected = isEdit ? (p.penanggungJawab === b || (p.penanggungJawab && p.penanggungJawab.includes(b))) : false;
    return `<option value="${b}" ${isSelected ? 'selected' : ''}>Bidang ${b}</option>`;
  }).join('');

  openModal(modalTitleText, isEdit ? 'edit_note' : 'add_task', `
    ${!isEdit ? `
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:14px;background:#f8fafc;padding:10px;border-radius:8px;border:1px dashed var(--border);">
      <span style="font-size:11px;color:var(--text-muted);margin-right:auto;display:flex;align-items:center;">Punya banyak data? Gunakan format Excel (CSV).</span>
      <button type="button" id="btnDownloadFormatExcel" style="padding:6px 12px;background:#ffffff;border:1px solid var(--border);color:var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:14px;">download</span> Unduh Format
      </button>
      <input type="file" id="inputImportCsv" accept=".csv" style="display:none;" />
      <button type="button" id="btnTriggerImport" style="padding:6px 12px;background:var(--green-pastel);border:1px solid var(--green);color:var(--green-dark);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
        <span class="material-symbols-outlined" style="font-size:14px;">upload</span> Import Data
      </button>
    </div>
    ` : ''}
    <form id="formAddEditProker" style="display:flex;flex-direction:column;gap:14px;">
      <input type="hidden" id="prokerInputNo" value="${autoNo}" />

      <!-- 1. PIC Bidang Penanggung Jawab di Atas -->
      <div style="background:#f8fafc;padding:12px 14px;border:1px solid var(--border);border-radius:10px;">
        <label style="font-size:11.5px;font-weight:800;color:#1e40af;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">badge</span>
          BIDANG PENANGGUNG JAWAB (PIC) *
        </label>
        <select id="prokerInputPic" required style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-weight:700;background:#ffffff;color:var(--text);outline:none;">
          <option value="">-- Pilih Salah Satu dari 14 Bidang Pengurus PPG --</option>
          ${picOptions}
        </select>
      </div>

      <!-- 2. Nama / Judul Kegiatan -->
      <div class="form-group">
        <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">NAMA / JUDUL KEGIATAN *</label>
        <input type="text" id="prokerInputKegiatan" value="${isEdit ? p.kegiatan : ''}" placeholder="Contoh: Halaqah Akbar & Pembekalan Remaja" required style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;" />
      </div>

      <!-- 3. Fitur Date Range Picker Booking Style -->
      <div style="background:#f0f9ff;padding:14px;border:1.5px solid #bae6fd;border-radius:10px;">
        <label style="font-size:11.5px;font-weight:800;color:#0369a1;margin-bottom:6px;display:flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">date_range</span>
          WAKTU PELAKSANAAN (PILIH TANGGAL / RENTANG WAKTU) *
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
          <div>
            <span style="font-size:11px;font-weight:700;color:#0284c7;display:block;margin-bottom:2px;">Tanggal Mulai</span>
            <input type="date" id="prokerPickerStart" style="width:100%;padding:8px 10px;border:1px solid #7dd3fc;border-radius:6px;font-size:12.5px;background:#fff;" />
          </div>
          <div>
            <span style="font-size:11px;font-weight:700;color:#0284c7;display:block;margin-bottom:2px;">Tanggal Selesai</span>
            <input type="date" id="prokerPickerEnd" style="width:100%;padding:8px 10px;border:1px solid #7dd3fc;border-radius:6px;font-size:12.5px;background:#fff;" />
          </div>
        </div>
        <div>
          <span style="font-size:11px;font-weight:700;color:#0369a1;display:block;margin-bottom:2px;">Format Teks Waktu (Otomatis Terisi & Bisa Diedit):</span>
          <input type="text" id="prokerInputWaktu" value="${isEdit ? p.waktu : ''}" placeholder="Contoh: September 2026 atau 15 – 16 Oktober 2026" required style="width:100%;padding:9px 12px;border:1px solid #7dd3fc;border-radius:6px;font-size:13px;font-weight:700;color:#0369a1;background:#fff;" />
        </div>
      </div>

      <!-- 4. Tempat Pelaksanaan & Sasaran -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">TEMPAT PELAKSANAAN *</label>
          <input type="text" id="prokerInputTempat" value="${isEdit ? p.tempat : ''}" placeholder="Contoh: Aula Gedung PPG Solo Selatan" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;" />
        </div>
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">SASARAN / PESERTA *</label>
          <input type="text" id="prokerInputSasaran" value="${isEdit ? p.sasaran : ''}" placeholder="Contoh: Generus Remaja & Pra-Nikah" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;" />
        </div>
      </div>

      <!-- 5. Status & Estimasi Anggaran -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">STATUS KEGIATAN</label>
          <select id="prokerInputStatus" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:#fff;">
            <option value="planned" ${isEdit && p.status === 'planned' ? 'selected' : ''}>🟡 Direncanakan</option>
            <option value="upcoming" ${isEdit && p.status === 'upcoming' ? 'selected' : ''}>🔵 Akan Datang</option>
            <option value="ongoing" ${isEdit && p.status === 'ongoing' ? 'selected' : ''}>🟢 Sedang Berlangsung</option>
            <option value="done" ${isEdit && p.status === 'done' ? 'selected' : ''}>⚪ Selesai</option>
          </select>
        </div>
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">EST. TOTAL BIAYA (RP) *</label>
          <input type="number" id="prokerInputEstBiaya" value="${isEdit ? (p.estBiaya || 0) : ''}" placeholder="0" min="0" step="50000" required style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-weight:800;color:var(--green-dark);" />
        </div>
      </div>

      <!-- 6. Kotak Isian Lebih Besar: Tujuan Kegiatan -->
      <div class="form-group">
        <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">TUJUAN KEGIATAN *</label>
        <textarea id="prokerInputTujuan" rows="3" placeholder="Uraikan maksud, tujuan, dan target ketercapaian kegiatan secara jelas..." required style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.5;resize:vertical;">${isEdit ? p.tujuan : ''}</textarea>
      </div>

      <!-- 7. Kotak Isian Lebih Besar: Rincian Biaya -->
      <div class="form-group">
        <label style="font-size:11.5px;font-weight:700;color:var(--text);margin-bottom:4px;display:block;">RINCIAN KOMPONEN BIAYA</label>
        <textarea id="prokerInputRincianBiaya" rows="3" placeholder="Contoh: Konsumsi (100 org x Rp 25.000): Rp 2.500.000, Sewa Aula & Sound System: Rp 1.500.000, Modul & Hadiah: Rp 1.000.000" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;line-height:1.5;resize:vertical;">${isEdit ? (p.rincianBiaya || '') : ''}</textarea>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;border-top:1px solid var(--border);padding-top:14px;">
        <button type="button" class="btn-cancel-proker-form" style="padding:10px 18px;border:1px solid var(--border);background:#fff;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">
          Kembali ke Tabel
        </button>
        <button type="submit" style="padding:10px 22px;border:none;background:linear-gradient(135deg, var(--blue), var(--blue-dark));color:#fff;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(26,86,196,.3);">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span> ${isEdit ? 'Simpan Perubahan' : 'Posting Program'}
        </button>
      </div>
    </form>
  `);

  // Auto Format Date Picker
  const pStart = document.getElementById('prokerPickerStart');
  const pEnd = document.getElementById('prokerPickerEnd');
  const pWaktu = document.getElementById('prokerInputWaktu');

  function syncDateRangeText() {
    if (pStart.value || pEnd.value) {
      // If only start selected, default end to same date
      const sVal = pStart.value;
      const eVal = pEnd.value || sVal;
      const formatted = formatDateRange(sVal, eVal);
      if (formatted) pWaktu.value = formatted;
    }
  }

  pStart?.addEventListener('change', () => {
    if (!pEnd.value && pStart.value) {
      pEnd.value = pStart.value;
    }
    syncDateRangeText();
  });

  pEnd?.addEventListener('change', () => {
    if (!pStart.value && pEnd.value) {
      pStart.value = pEnd.value;
    }
    syncDateRangeText();
  });

  document.querySelector('.btn-cancel-proker-form')?.addEventListener('click', () => {
    renderProkerModal();
  });

  if (!isEdit) {
    document.getElementById('btnDownloadFormatExcel')?.addEventListener('click', () => {
      const csvHeader = 'KEGIATAN;WAKTU;SASARAN/PESERTA;TUJUAN KEGIATAN;RINCIAN BIAYA;EST. BIAYA (RP);TEMPAT PELAKSANAAN;PENANGGUNG JAWAB (PIC)\n';
      const sampleRow = '"Rapat Tahunan";"Agustus 2026";"Pengurus";"Konsolidasi";"Konsumsi dll";150000;"Aula PPG";"Ketua"\n';
      const blob = new Blob(['\uFEFF' + csvHeader + sampleRow], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Format_Import_Program_Kerja.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    const fileInput = document.getElementById('inputImportCsv');
    document.getElementById('btnTriggerImport')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 1) {
          let count = 0;
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(';');
            if (cols.length >= 8) {
              const clean = (str) => str ? str.replace(/(^"|"$)/g, '').trim() : '';
              addProker({
                kegiatan: clean(cols[0]),
                waktu: clean(cols[1]),
                sasaran: clean(cols[2]),
                tujuan: clean(cols[3]),
                rincianBiaya: clean(cols[4]),
                estBiaya: parseInt(clean(cols[5])) || 0,
                tempat: clean(cols[6]),
                penanggungJawab: clean(cols[7]),
                status: 'planned',
                targetWilayah: 'Daerah Solo Selatan'
              });
              count++;
            }
          }
          alert('Berhasil mengimpor ' + count + ' program kerja!');
          renderProkerModal();
          renderUserProfile();
        } else {
          alert('Format CSV kosong atau tidak valid.');
        }
      };
      reader.readAsText(file);
    });
  }

  document.getElementById('formAddEditProker')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const prokerDataPayload = {
      no: document.getElementById('prokerInputNo').value,
      kegiatan: document.getElementById('prokerInputKegiatan').value.trim(),
      waktu: document.getElementById('prokerInputWaktu').value.trim(),
      tempat: document.getElementById('prokerInputTempat').value.trim(),
      sasaran: document.getElementById('prokerInputSasaran').value.trim(),
      tujuan: document.getElementById('prokerInputTujuan').value.trim(),
      rincianBiaya: document.getElementById('prokerInputRincianBiaya').value.trim(),
      estBiaya: document.getElementById('prokerInputEstBiaya').value,
      status: document.getElementById('prokerInputStatus').value,
      penanggungJawab: document.getElementById('prokerInputPic').value.trim(),
      targetWilayah: 'Daerah Solo Selatan'
    };

    if (isEdit) {
      updateProker(p.id, prokerDataPayload);
    } else {
      addProker(prokerDataPayload);
    }

    renderProkerModal();
    renderUserProfile();
  });
}

// Menu 3: Lembar Pembiasaan
// Menu 3: Lembar Pembiasaan
btnMenuPembiasaan?.addEventListener('click', () => {
  renderEventPembiasaanModal();
});

// Menu 4: Absensi KBM (Cetak Presensi)
btnMenuAbsensi?.addEventListener('click', () => {
  renderCetakAbsensiModal();
});

// Menu 5: Struktur Pengurus PPG Solo Selatan (Dengan Fitur Filtrasi Multi-Parameter)
btnMenuStrukturDaerah?.addEventListener('click', () => {
  renderStrukturDaerahModal();
});

function renderStrukturDaerahModal(filterDesa = 'all', filterKelompok = 'all', filterPeran = 'all', searchQuery = '') {
  const allDaerahList = getPengurusDaerahList();
  const isSuper = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';

  // Apply filters
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

  // Urutkan pengurus daerah sesuai susunan struktural resmi PPG:
  // Ketua > Wakil Ketua > Sekretaris > Bendahara > Kurikulum > Tenaga Pendidik >
  // Penggalang Dana > Sarana Prasarana > Kegiatan Muda Mudi > Seni dan Olah Raga >
  // Kemandirian > Keputrian > Bimbingan Konseling > Tahfidz
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

  // Desa options for filter dropdown
  let filterDesaOptions = `
    <option value="all" ${filterDesa === 'all' ? 'selected' : ''}>Semua Desa</option>
  ` + MASTER_WILAYAH.desa.map(d => `
    <option value="${d.id}" ${filterDesa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>
  `).join('');

  // Kelompok options for filter dropdown (filtered by selected desa if any)
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

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${bannerNoticeHtml}

      <!-- MULTI-PARAMETER FILTER BOX -->
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

      <!-- DIRECTORY CARDS LIST -->
      <div style="display:flex;flex-direction:column;gap:10px;max-height:48vh;overflow-y:auto;padding-right:4px;">
        ${listHtml}
      </div>
    </div>
  `;

  openModal(`Struktur Pengurus PPG Solo Selatan (${filtered.length} Pengurus)`, 'diversity_2', modalHtml, 'large');

  // Bind filter events
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

// Menu 6: Kelola Pengurus & Hak Akses (Khusus Superadmin Daerah)
btnMenuPengurus?.addEventListener('click', () => {
  renderManagePengurusModal('all');
});

function renderManagePengurusModal(filterLevel = 'all', searchQuery = '') {
  const allList = getPengurusList();

  // Filter list
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
    const isSelf = p.id === currentUser.id || p.email === currentUser.email;
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

  const modalContent = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <!-- Stats Ringkas -->
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

      <!-- Search & Filters -->
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

      <!-- Cards Grid -->
      <div style="display:flex;flex-direction:column;gap:10px;max-height:50vh;overflow-y:auto;padding-right:4px;">
        ${pengurusCardsHtml}
      </div>
    </div>
  `;

  openModal('Kelola Pengurus & Hak Akses (Superadmin)', 'manage_accounts', modalContent, 'large');

  // Styling tab filter dinamis
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

  // Search input handler
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

  // Edit Pengurus Buttons
  modalBody.querySelectorAll('.btn-edit-pengurus').forEach(btn => {
    btn.addEventListener('click', () => {
      const pId = btn.dataset.id;
      renderEditPengurusModal(pId, filterLevel);
    });
  });

  // Action buttons (Toggle Active/Inactive)
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
            renderManagePengurusModal(filterLevel, searchQuery);
            renderKelompokGrid();
            renderUserProfile();
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
            renderManagePengurusModal(filterLevel, searchQuery);
            renderKelompokGrid();
            renderUserProfile();
          }
        });
      }
    });
  });
}

/* ── 11. Modal Edit Detail Pengurus & Hak Akses (Superadmin) ─── */
function renderEditPengurusModal(pengurusId, returnFilter = 'all', source = 'manage') {
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

  // Initial roles options for pengurus level
  const rolesList = getRolesByTingkatan(currentTingkat);
  let peranOptions = rolesList.map(r => `
    <option value="${r}" ${currentPeran === r ? 'selected' : ''}>${r}</option>
  `).join('');

  const formHtml = `
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

  openModal(`Edit Pengurus: ${p.nama}`, 'edit_note', formHtml, 'default');

  const editTingkatan = document.getElementById('editTingkatan');
  const editPeran = document.getElementById('editPeran');
  const editDesa = document.getElementById('editDesa');
  const editKelompok = document.getElementById('editKelompok');

  // Multi-level dropdown: Tingkatan -> Peran
  editTingkatan?.addEventListener('change', () => {
    const selectedTingkat = editTingkatan.value;
    const newRoles = getRolesByTingkatan(selectedTingkat);
    editPeran.innerHTML = newRoles.map(r => `<option value="${r}">${r}</option>`).join('');
  });

  // Multi-level dropdown: Desa -> Kelompok (Sorted A-Z)
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
      renderKelompokGrid();
      if (source === 'struktur') {
        renderStrukturDaerahModal();
      } else {
        renderManagePengurusModal(returnFilter);
      }
      renderUserProfile();
    }
  });
}

/* ── 12. Initial Application Boot & Rendering ──────────────── */
renderUserProfile();
renderDesaTabs();
renderKelompokGrid();
checkPendingApprovals();

// Auto-open modal based on URL query param (e.g. from Landing Page cards or direct links)
try {
  const urlParams = new URLSearchParams(window.location.search);
  const actionParam = urlParams.get('action');
  if (actionParam === 'pembiasaan') {
    setTimeout(() => renderEventPembiasaanModal(), 200);
  } else if (actionParam === 'siswa') {
    setTimeout(() => renderSiswaModal(), 200);
  } else if (actionParam === 'proker') {
    setTimeout(() => renderProkerModal(), 200);
  } else if (actionParam === 'absensi') {
    const tabParam = urlParams.get('tab') || 'event_list';
    setTimeout(() => renderCetakAbsensiModal(tabParam), 200);
  } else if (actionParam === 'edit_rekap') {
    const evId = urlParams.get('eventId');
    setTimeout(() => renderFormRekapKehadiranModal(evId), 200);
  }
} catch (e) {
  console.warn('Auto-open modal error:', e);
}

/* ── 13. Mobile Dashboard Drawer (Hamburger Menu) ──────────── */
(function initDashDrawer() {
  const hamburger = document.getElementById('dashHamburger');
  const drawer = document.getElementById('dashDrawer');
  const overlay = document.getElementById('dashDrawerOverlay');
  const closeBtn = document.getElementById('dashDrawerClose');

  if (!hamburger || !drawer || !overlay) return;

  // Sync user info into drawer
  const drawerUserName = document.getElementById('drawerUserName');
  const drawerUserBadge = document.getElementById('drawerUserBadge');
  if (drawerUserName) drawerUserName.textContent = currentUser.nama || 'Pengurus';
  if (drawerUserBadge) drawerUserBadge.textContent = currentUser.peran || currentUser.jabatan || 'Pengurus';

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('visible');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  closeBtn?.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Drawer menu item actions (delegate to existing handlers)
  document.getElementById('drawerBtnProker')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnMenuProker?.click(), 150);
  });
  document.getElementById('drawerBtnStruktur')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnMenuStrukturDaerah?.click(), 150);
  });
  document.getElementById('drawerBtnSiswa')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnMenuSiswa?.click(), 150);
  });
  document.getElementById('drawerBtnPembiasaan')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnMenuPembiasaan?.click(), 150);
  });
  document.getElementById('drawerBtnAbsensi')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnMenuAbsensi?.click(), 150);
  });
  document.getElementById('drawerBtnProfil')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnEditProfile?.click(), 150);
  });
  document.getElementById('drawerBtnLogout')?.addEventListener('click', () => {
    closeDrawer();
    setTimeout(() => btnLogout?.click(), 150);
  });

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT PEMBIASAAN MODULE
   ═══════════════════════════════════════════════════════════════════════════ */

let currentEventId = null;

function renderEventPembiasaanModal() {
  const events = getEventPembiasaanList();
  const isSuperadminOrDaerah = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';

  const eventRows = events.map((e, idx) => `
    <tr style="border-bottom:1px solid var(--border);">
      <td style="padding:10px;">${idx + 1}</td>
      <td style="padding:10px;font-weight:700;">${e.judul_periode}</td>
      <td style="padding:10px;">
        <span style="background:${e.status === 'berjalan' ? 'var(--green-pastel)' : '#e2e8f0'};color:${e.status === 'berjalan' ? 'var(--green-dark)' : '#475569'};padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">
          ${e.status === 'berjalan' ? '🟢 BERJALAN' : '🔒 SELESAI'}
        </span>
      </td>
      <td style="padding:10px;">
        ${e.habits.map((h, i) => `<div style="font-size:11px;color:var(--text-muted);">H${i + 1}: ${h}</div>`).join('')}
      </td>
      <td style="padding:10px;text-align:right;">
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          ${(isSuperadminOrDaerah && e.status === 'berjalan') ? `<button class="btn-edit-event" data-id="${e.id}" style="padding:6px 10px;background:#f0f9ff;color:var(--blue);border:1px solid #bae6fd;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">✏ Edit</button>` : ''}
          <button class="btn-open-event" data-id="${e.id}" style="padding:6px 12px;background:var(--blue);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:15px;">edit_square</span> Isi Nilai
          </button>
          ${isSuperadminOrDaerah ? `<button class="btn-delete-event" data-id="${e.id}" title="Hapus Event" style="padding:6px 10px;background:#fef2f2;color:var(--red);border:1px solid #fca5a5;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">🗑</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="margin:0;font-size:14px;color:var(--text-main);">Daftar Periode Lembar Pembiasaan</h3>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted);">
            ${isSuperadminOrDaerah
      ? 'Kelola periode, target pembiasaan karakter, dan pantau nilai generus caberawit.'
      : 'Pilih periode pembiasaan yang sedang berjalan untuk mengisikan nilai harian generus caberawit di wilayah Anda.'}
          </p>
        </div>
        ${isSuperadminOrDaerah ? `
          <button id="btnCreateEvent" style="padding:8px 12px;background:var(--gold);color:#1a1d2e;border:none;border-radius:8px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:12px;">
            <span class="material-symbols-outlined" style="font-size:16px;">add_circle</span> Buat Event Baru
          </button>
        ` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
        <thead style="background:var(--surface-2);">
          <tr>
            <th style="padding:10px;border-bottom:2px solid var(--border);">No</th>
            <th style="padding:10px;border-bottom:2px solid var(--border);">Judul Periode</th>
            <th style="padding:10px;border-bottom:2px solid var(--border);">Status</th>
            <th style="padding:10px;border-bottom:2px solid var(--border);">Daftar Pembiasaan</th>
            <th style="padding:10px;border-bottom:2px solid var(--border);text-align:right;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${events.length ? eventRows : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">Belum ada event pembiasaan.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  openModal(isSuperadminOrDaerah ? 'Kelola Lembar Pembiasaan' : 'Isi Nilai Lembar Pembiasaan', 'checklist', modalHtml, 'medium');

  if (isSuperadminOrDaerah) {
    document.getElementById('btnCreateEvent')?.addEventListener('click', () => {
      renderCreateEventForm();
    });

    document.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const ev = getEventPembiasaanList().find(x => x.id === id);
        if (ev) renderCreateEventForm(ev);
      });
    });

    document.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const ev = getEventPembiasaanList().find(x => x.id === id);
        if (!ev) return;
        showConfirmModal({
          title: 'Hapus Event Pembiasaan',
          message: `Hapus event "${ev.judul_periode}"? Semua data nilai di dalamnya akan ikut terhapus.`,
          icon: 'delete_forever',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          confirmText: 'Ya, Hapus Event',
          confirmBtnColor: 'var(--red)',
          onConfirm: () => {
            deleteEventPembiasaan(id);
            showToast(`Event "${ev.judul_periode}" berhasil dihapus`, 'success');
            renderEventPembiasaanModal();
          }
        });
      });
    });
  }

  document.querySelectorAll('.btn-open-event').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      openEditableGridEvent(id);
    });
  });
}

function renderCreateEventForm(editEvent = null) {
  const isSuperadminOrDaerah = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';
  if (!isSuperadminOrDaerah) {
    showToast('Akses Ditolak: Fitur buat dan edit lembar pembiasaan hanya dapat diakses oleh Superadmin Daerah.', 'warning');
    return;
  }

  const isEdit = !!editEvent;
  const DEFAULT_HABITS = [
    "Tertib & Tenang Saat Pengajian",
    "Membaca PR no. 3",
    "Mencuci Piring",
    "Menjaga Adab Dalam Kamar Mandi"
  ];
  let currentHabits = isEdit ? [...editEvent.habits] : [...DEFAULT_HABITS];
  if (currentHabits.length === 0) currentHabits = ["Tertib & Tenang Saat Pengajian"];

  function buildHabitsInputs(hList) {
    return hList.map((h, i) => `
      <div class="habit-item-row" style="display:flex;gap:8px;align-items:center;">
        <span style="background:var(--blue);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${i + 1}</span>
        <input type="text" class="habit-input" value="${(h || '').replace(/"/g, '&quot;')}" placeholder="Nama Pembiasaan (contoh: Sholat Subuh berjamaah)" required style="flex:1;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;" />
        ${hList.length > 1 ? `
          <button type="button" class="btn-remove-habit" data-idx="${i}" title="Hapus pembiasaan ini" style="padding:8px;background:#fef2f2;color:var(--red);border:1px solid #fecaca;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
          </button>
        ` : ''}
      </div>
    `).join('');
  }

  const PRESETS = [
    "Tertib & Tenang Saat Pengajian",
    "Membaca PR no. 3",
    "Mencuci Piring",
    "Menjaga Adab Dalam Kamar Mandi",
    "Sholat 5 Waktu Berjamaah",
    "Membantu Orang Tua",
    "Hafalan Doa Sehari-hari",
    "Adab Berbicara Santun"
  ];

  const presetsHtml = PRESETS.map(p => `
    <button type="button" class="habit-preset-chip" data-text="${p}">
      <span class="material-symbols-outlined" style="font-size:14px;">add</span> ${p}
    </button>
  `).join('');

  const formHtml = `
    <form id="formCreateEvent" style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
      <div style="background:var(--gold-light);padding:10px 14px;border-radius:8px;border-left:3px solid var(--gold);font-size:12px;">
        <strong>Informasi Superadmin:</strong> Tentukan periode dan hingga 4 target pembiasaan karakter yang akan dinilai oleh para pamong di kelompok masing-masing.
      </div>

      <div>
        <label style="font-weight:700;display:block;margin-bottom:4px;">Judul Periode <span style="color:red">*</span></label>
        <input type="text" id="evtJudul" value="${isEdit ? editEvent.judul_periode : ''}" required placeholder="Contoh: Periode Mei - Juni 2026" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
      </div>

      ${isEdit ? `
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Status Periode</label>
          <select id="evtStatus" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="berjalan" ${editEvent.status === 'berjalan' ? 'selected' : ''}>🟢 Berjalan (Pamong dapat mengisi nilai)</option>
            <option value="selesai" ${editEvent.status === 'selesai' ? 'selected' : ''}>🔒 Selesai (Diarsipkan / Nilai dikunci)</option>
          </select>
        </div>
      ` : ''}

      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <label style="font-weight:700;">Daftar Pembiasaan (<span id="habitCountText">${currentHabits.length}</span> / 4)</label>
          <button type="button" id="btnAddHabitRow" style="padding:5px 10px;background:var(--blue-light);color:var(--blue);border:1px solid var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:15px;">add</span> Tambah Baris
          </button>
        </div>

        <div id="habitInputsContainer" style="display:flex;flex-direction:column;gap:8px;">
          ${buildHabitsInputs(currentHabits)}
        </div>
      </div>

      <div>
        <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:6px;">💡 Rekomendasi Pembiasaan (Klik untuk gunakan):</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${presetsHtml}
        </div>
      </div>

      <div class="modal-sticky-footer">
        <button type="button" id="btnCancelCreateEvent" style="flex:1;padding:12px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;cursor:pointer;">← Batal</button>
        <button type="submit" style="flex:2;padding:12px;background:var(--gold);color:#1a1d2e;border:none;border-radius:8px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span> ${isEdit ? 'Simpan Perubahan' : 'Buat Event Pembiasaan'}
        </button>
      </div>
    </form>
  `;

  openModal(isEdit ? 'Edit Event Pembiasaan' : 'Buat Event Pembiasaan Baru', 'add_task', formHtml, 'default');

  const container = document.getElementById('habitInputsContainer');
  const countText = document.getElementById('habitCountText');

  function attachHabitRowEvents() {
    container.querySelectorAll('.btn-remove-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        const inputs = container.querySelectorAll('.habit-input');
        currentHabits = Array.from(inputs).map(inp => inp.value);
        currentHabits.splice(idx, 1);
        if (currentHabits.length === 0) currentHabits = [''];
        container.innerHTML = buildHabitsInputs(currentHabits);
        countText.textContent = currentHabits.length;
        attachHabitRowEvents();
      });
    });
  }
  attachHabitRowEvents();

  document.getElementById('btnAddHabitRow')?.addEventListener('click', () => {
    const inputs = container.querySelectorAll('.habit-input');
    if (inputs.length >= 4) {
      showToast('Maksimal 4 daftar pembiasaan per periode!', 'warning');
      return;
    }
    currentHabits = Array.from(inputs).map(inp => inp.value);
    currentHabits.push('');
    container.innerHTML = buildHabitsInputs(currentHabits);
    countText.textContent = currentHabits.length;
    attachHabitRowEvents();
    const newInputs = container.querySelectorAll('.habit-input');
    newInputs[newInputs.length - 1].focus();
  });

  document.querySelectorAll('.habit-preset-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const txt = e.currentTarget.dataset.text;
      const inputs = container.querySelectorAll('.habit-input');
      let filled = false;
      for (let inp of inputs) {
        if (!inp.value.trim()) {
          inp.value = txt;
          filled = true;
          break;
        }
      }
      if (!filled) {
        if (inputs.length < 4) {
          currentHabits = Array.from(inputs).map(inp => inp.value);
          currentHabits.push(txt);
          container.innerHTML = buildHabitsInputs(currentHabits);
          countText.textContent = currentHabits.length;
          attachHabitRowEvents();
        } else {
          showToast('Slot pembiasaan sudah penuh (4 item). Hapus atau edit salah satu item di atas.', 'warning');
        }
      }
    });
  });

  document.getElementById('btnCancelCreateEvent').addEventListener('click', renderEventPembiasaanModal);

  document.getElementById('formCreateEvent').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const judul = document.getElementById('evtJudul').value.trim();
    const habitInputEls = document.querySelectorAll('.habit-input');
    const newHabits = Array.from(habitInputEls).map(el => el.value.trim()).filter(v => v.length > 0);

    if (!judul) return showToast('Judul periode wajib diisi!', 'warning');
    if (newHabits.length === 0) return showToast('Minimal satu pembiasaan harus diisi!', 'warning');

    if (isEdit) {
      const newStatus = document.getElementById('evtStatus')?.value || editEvent.status;
      updateEventPembiasaan(editEvent.id, {
        judul_periode: judul,
        status: newStatus,
        habits: newHabits
      });
    } else {
      addEventPembiasaan({
        judul_periode: judul,
        status: 'berjalan',
        habits: newHabits
      });
    }
    renderEventPembiasaanModal();
  });
}

// Global Filter for Grid
let gridFilter = { desa: 'all', kelompok: 'all', search: '', kategori: 'caberawit' };

function openEditableGridEvent(eventId) {
  currentEventId = eventId;
  const event = getEventPembiasaanList().find(x => x.id === eventId);
  if (!event) return;

  const isSuperadminOrDaerah = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';

  // Otomatis sesuaikan filter wilayah jika pamong kelompok atau koordinator desa
  if (!isSuperadminOrDaerah) {
    if (currentUser.tingkatan === 'desa' && currentUser.desaId) {
      if (gridFilter.desa === 'all') gridFilter.desa = currentUser.desaId;
    } else if (currentUser.tingkatan === 'kelompok') {
      if (currentUser.desaId && gridFilter.desa === 'all') gridFilter.desa = currentUser.desaId;
      if (currentUser.kelompokId && gridFilter.kelompok === 'all') gridFilter.kelompok = currentUser.kelompokId;
    }
  }

  const desaOptions = MASTER_WILAYAH.desa.map(d =>
    `<option value="${d.id}" ${gridFilter.desa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`
  ).join('');

  let kels = getAllKelompok();
  if (gridFilter.desa !== 'all') {
    kels = kels.filter(k => k.desaId === gridFilter.desa);
  }
  const kelOptions = kels.map(k =>
    `<option value="${k.id}" ${gridFilter.kelompok === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`
  ).join('');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      
      <!-- TOP ACTION & STATUS BAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface-2);padding:12px 14px;border-radius:10px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text-main);">${event.judul_periode}</h4>
            <span style="background:${event.status === 'berjalan' ? '#dcfce7;color:#166534' : '#e2e8f0;color:#475569'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:800;">
              ${event.status === 'berjalan' ? '🟢 BERJALAN' : '🔒 TERKUNCI / SELESAI'}
            </span>
          </div>
          <span style="font-size:12px;color:var(--text-muted);display:block;margin-top:2px;">Khusus Generus Caberawit (PAUD &ndash; SD)</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a href="laporan-pembiasaan.html?event=${eventId}" target="_blank" style="text-decoration:none;padding:8px 12px;background:var(--blue-light);color:var(--blue);border:none;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">public</span> Laporan Publik
          </a>
          ${(isSuperadminOrDaerah && event.status === 'berjalan') ? `
            <button id="btnCloseEvent" style="padding:8px 12px;background:#fef2f2;color:var(--red);border:1px solid #fca5a5;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              <span class="material-symbols-outlined" style="font-size:16px;">lock</span> Kunci &amp; Arsipkan
            </button>
          ` : ''}
          <button id="btnBackToEventList" style="padding:8px 12px;background:#fff;border:1px solid var(--border);border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">← Kembali</button>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;background:#f8fafc;padding:12px;border-radius:10px;border:1px solid var(--border);">
        <input type="text" id="gridFilterSearch" value="${gridFilter.search || ''}" placeholder="🔍 Cari nama anak..." style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;" />
        <select id="gridFilterDesa" style="padding:8px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;">
          <option value="all">-- Semua Desa --</option>
          ${desaOptions}
        </select>
        <select id="gridFilterKelompok" style="padding:8px;border:1px solid var(--border);border-radius:6px;font-size:12px;outline:none;">
          <option value="all">-- Semua Kelompok --</option>
          ${kelOptions}
        </select>
        <div id="gridSaveIndicator" style="display:flex;align-items:center;justify-content:flex-end;font-size:11px;font-weight:700;color:var(--green-dark);">
          <span class="material-symbols-outlined" style="font-size:15px;margin-right:3px;">cloud_done</span> Auto-save Aktif
        </div>
      </div>

      <!-- GRID CONTAINER DENGAN PINNED / STICKY NAMA GENERUS -->
      <div style="overflow:auto;border:1px solid var(--border);border-radius:8px;background:#fff;max-height:55vh;-webkit-overflow-scrolling:touch;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:540px;">
          <thead style="background:var(--surface-2);position:sticky;top:0;z-index:20;">
            <tr>
              <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:36px;position:sticky;top:0;background:var(--surface-2);z-index:21;">No</th>
              <th style="padding:10px 12px;border:1px solid var(--border);text-align:left;min-width:160px;position:sticky;top:0;left:0;background:var(--surface-2);z-index:22;box-shadow:2px 0 4px rgba(0,0,0,0.03);">Nama Generus</th>
              <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:70px;position:sticky;top:0;background:var(--surface-2);z-index:21;">Kelas</th>
              ${event.habits.map((h, i) => `
                <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:65px;position:sticky;top:0;background:var(--surface-2);z-index:21;" title="${h}">
                  H${i + 1}<br/>
                  <span style="font-size:9px;font-weight:400;color:var(--text-muted);white-space:nowrap;">(0-100)</span>
                </th>
              `).join('')}
              <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:60px;position:sticky;top:0;background:var(--surface-2);z-index:21;">Total</th>
            </tr>
          </thead>
          <tbody id="gridTbody">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
      <div style="font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
        <div>${event.habits.map((h, i) => `<span style="display:inline-block;margin-right:10px;"><strong>H${i + 1}:</strong> ${h}</span>`).join('')}</div>
        <div>*Nilai otomatis tersimpan saat angka diubah.</div>
      </div>
    </div>
  `;

  openModal(`Nilai Pembiasaan: ${event.judul_periode}`, 'edit_document', modalHtml, 'wide');

  document.getElementById('btnBackToEventList').addEventListener('click', renderEventPembiasaanModal);
  if (isSuperadminOrDaerah && event.status === 'berjalan') {
    document.getElementById('btnCloseEvent')?.addEventListener('click', () => {
      showConfirmModal({
        title: 'Tutup & Arsipkan Event',
        message: `Yakin menutup event "${event.judul_periode}"? Data akan diarsipkan permanen dan tidak bisa diubah lagi.`,
        icon: 'lock',
        iconBg: '#fef3c7',
        iconColor: '#b45309',
        confirmText: 'Ya, Tutup & Arsipkan',
        confirmBtnColor: 'var(--gold)',
        onConfirm: () => {
          closeEventPembiasaan(eventId);
          openEditableGridEvent(eventId);
          showToast('Event berhasil diarsipkan', 'success');
        }
      });
    });
  }

  document.getElementById('gridFilterSearch').addEventListener('input', (e) => {
    gridFilter.search = e.target.value.toLowerCase();
    renderGridRows(event);
  });
  document.getElementById('gridFilterDesa').addEventListener('change', (e) => {
    gridFilter.desa = e.target.value;
    gridFilter.kelompok = 'all';
    openEditableGridEvent(eventId);
  });
  document.getElementById('gridFilterKelompok').addEventListener('change', (e) => {
    gridFilter.kelompok = e.target.value;
    renderGridRows(event);
  });

  renderGridRows(event);
}

function renderGridRows(event) {
  const tbody = document.getElementById('gridTbody');
  if (!tbody) return;

  const allSiswa = getSiswaList();
  const allNilai = getNilaiPembiasaanList().filter(n => n.event_id === event.id);
  const isReadOnly = event.status === 'selesai';

  const filtered = allSiswa.filter(s => {
    if (s.kategori_usia !== 'caberawit') return false;
    if (gridFilter.desa !== 'all' && s.desa_id !== gridFilter.desa) return false;
    if (gridFilter.kelompok !== 'all' && s.kelompok_id !== gridFilter.kelompok) return false;
    if (gridFilter.search && !s.nama_lengkap.toLowerCase().includes(gridFilter.search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${4 + event.habits.length}" style="text-align:center;padding:24px;color:var(--text-muted);">Tidak ada siswa Caberawit yang sesuai filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((s, idx) => {
    const nilaiObj = allNilai.find(n => n.siswa_id === s.id);
    const nilais = nilaiObj ? nilaiObj.nilai : new Array(event.habits.length).fill(0);
    const total = nilais.reduce((a, b) => a + parseInt(b || 0), 0);

    let habitsHtml = '';
    for (let i = 0; i < event.habits.length; i++) {
      habitsHtml += `
        <td style="padding:4px;border:1px solid var(--border);text-align:center;">
          <input type="number" class="grid-input" data-siswa="${s.id}" data-index="${i}" min="0" max="100" inputmode="numeric" pattern="[0-9]*" value="${nilais[i] || 0}" ${isReadOnly ? 'disabled' : ''} style="width:100%;text-align:center;padding:7px 4px;border:1px solid transparent;border-radius:6px;outline:none;background:${isReadOnly ? 'transparent' : '#f8fafc'};font-weight:600;font-size:12px;box-sizing:border-box;" onfocus="this.select();this.style.border='1.5px solid var(--blue)';this.style.background='#fff';" onblur="this.style.border='1px solid transparent';this.style.background='${isReadOnly ? 'transparent' : '#f8fafc'}';">
        </td>
      `;
    }

    return `
      <tr>
        <td style="padding:8px;border:1px solid var(--border);text-align:center;color:var(--text-muted);font-size:11px;">${idx + 1}</td>
        <td style="padding:8px 12px;border:1px solid var(--border);font-weight:600;position:sticky;left:0;background:#fff;z-index:10;box-shadow:2px 0 4px rgba(0,0,0,0.04);white-space:nowrap;">
          ${s.nama_lengkap}
          <span style="display:block;font-size:10px;color:var(--text-muted);font-weight:400;">Kel. ${s.kelompok_nama || '-'}</span>
        </td>
        <td style="padding:8px;border:1px solid var(--border);text-align:center;font-size:11px;">${s.jenjang_kelas}</td>
        ${habitsHtml}
        <td style="padding:8px;border:1px solid var(--border);text-align:center;font-weight:800;color:var(--blue);font-size:13px;" id="total-${s.id}">${total}</td>
      </tr>
    `;
  }).join('');

  // Attach change event for Auto-Save
  if (!isReadOnly) {
    document.querySelectorAll('.grid-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const siswaId = e.target.dataset.siswa;

        // Gather all inputs for this siswa
        const rowInputs = document.querySelectorAll(`.grid-input[data-siswa="${siswaId}"]`);
        const newNilais = Array.from(rowInputs).map(x => {
          let val = parseInt(x.value) || 0;
          if (val < 0) val = 0;
          if (val > 100) val = 100;
          x.value = val;
          return val;
        });

        // Save
        saveNilaiPembiasaan(event.id, siswaId, newNilais);

        // Update Total cell
        const total = newNilais.reduce((a, b) => a + b, 0);
        const totalCell = document.getElementById(`total-${siswaId}`);
        if (totalCell) totalCell.innerText = total;

        // Visual flash indicator
        e.target.style.background = '#dcfce7';
        setTimeout(() => {
          e.target.style.background = '#f8fafc';
        }, 800);

        const indicator = document.getElementById('gridSaveIndicator');
        if (indicator) {
          indicator.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;margin-right:3px;color:var(--green-dark);">check_circle</span> <span style="color:var(--green-dark);">Tersimpan!</span>';
          setTimeout(() => {
            indicator.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;margin-right:3px;">cloud_done</span> Auto-save Aktif';
          }, 1500);
        }
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DATABASE GENERUS MODULE (SISWA)
   ═══════════════════════════════════════════════════════════════════════════ */

export const JENJANG_CONFIG = {
  caberawit: {
    id: 'caberawit',
    label: '🌱 Caberawit (Usia Dini / PAUD - SD)',
    badge: 'Caberawit',
    color: '#d97706',
    bg: '#fef3c7',
    kelas: ['PAUD', 'TK A', 'TK B', '1 SD', '2 SD', '3 SD', '4 SD', '5 SD', '6 SD']
  },
  gp_reguler: {
    id: 'gp_reguler',
    label: '📚 GP Reguler (Remaja Awal / SMP - SMA)',
    badge: 'GP Reguler',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    kelas: ['1 SMP', '2 SMP', '3 SMP', '1 SMA', '2 SMA', '3 SMA']
  },
  remaja: {
    id: 'remaja',
    label: '🎓 Remaja & Dewasa (Muda-Mudi & Pra-Nikah)',
    badge: 'Remaja',
    color: '#7c3aed',
    bg: '#f3e8ff',
    kelas: ['Mahasiswa', 'Bekerja', 'Kelas Remaja', 'Pra-Nikah', 'Lainnya']
  }
};

function getKelasFilterOptions(selectedJenjang, selectedKelas = 'all') {
  let classes = [];
  let defaultLabel = 'Semua Kelas / Status';
  if (selectedJenjang === 'caberawit') {
    classes = JENJANG_CONFIG.caberawit.kelas;
    defaultLabel = 'Semua Tingkat Caberawit (PAUD - SD)';
  } else if (selectedJenjang === 'gp_reguler') {
    classes = JENJANG_CONFIG.gp_reguler.kelas;
    defaultLabel = 'Semua Kelas GP (SMP - SMA)';
  } else if (selectedJenjang === 'remaja') {
    classes = JENJANG_CONFIG.remaja.kelas;
    defaultLabel = 'Semua Status Remaja / Dewasa';
  } else {
    classes = [
      ...JENJANG_CONFIG.caberawit.kelas,
      ...JENJANG_CONFIG.gp_reguler.kelas,
      ...JENJANG_CONFIG.remaja.kelas
    ];
    classes = [...new Set(classes)];
  }

  return `<option value="all">-- ${defaultLabel} --</option>` +
    classes.map(k => `<option value="${k}" ${selectedKelas === k ? 'selected' : ''}>${k}</option>`).join('');
}

export function updateDashboardStats() {
  const list = getSiswaList();
  const total = list.length;
  const caberawitCount = list.filter(s => s.kategori_usia === 'caberawit').length;
  const gpCount = list.filter(s => s.kategori_usia === 'gp_reguler').length;
  const remajaCount = list.filter(s => s.kategori_usia === 'remaja').length;

  const elTotal = document.getElementById('statTotal');
  const elCaberawit = document.getElementById('statCaberawit');
  const elGp = document.getElementById('statGp');
  const elRemaja = document.getElementById('statRemaja');

  if (elTotal) elTotal.textContent = total.toLocaleString('id-ID');
  if (elCaberawit) elCaberawit.textContent = caberawitCount.toLocaleString('id-ID');
  if (elGp) elGp.textContent = gpCount.toLocaleString('id-ID');
  if (elRemaja) elRemaja.textContent = remajaCount.toLocaleString('id-ID');
}

export function renderDetailRingkasanModal(activeKat = 'all') {
  const allSiswa = getSiswaList();
  const caberawitSiswa = allSiswa.filter(s => s.kategori_usia === 'caberawit');
  const gpSiswa = allSiswa.filter(s => s.kategori_usia === 'gp_reguler');
  const remajaSiswa = allSiswa.filter(s => s.kategori_usia === 'remaja');

  function getStatsForList(list) {
    const total = list.length;
    const l = list.filter(s => s.jenis_kelamin === 'L').length;
    const p = list.filter(s => s.jenis_kelamin === 'P').length;
    return { total, l, p };
  }

  // Categories config
  const categories = [
    {
      key: 'all',
      title: 'Semua Kategori Generus',
      icon: 'groups',
      color: '#1a56c4',
      bg: '#e8f0fd',
      list: allSiswa,
      desc: 'Ringkasan komprehensif seluruh generasi penerus PPG Solo Selatan'
    },
    {
      key: 'caberawit',
      title: 'Caberawit (PAUD - SD)',
      icon: 'child_care',
      color: '#d97706',
      bg: '#fef3c7',
      list: caberawitSiswa,
      classes: JENJANG_CONFIG.caberawit.kelas,
      desc: 'Pembiasaan karakter ibadah sejak usia dini'
    },
    {
      key: 'gp_reguler',
      title: 'GP Reguler (SMP - SMA)',
      icon: 'school',
      color: '#1a56c4',
      bg: '#e8f0fd',
      list: gpSiswa,
      classes: JENJANG_CONFIG.gp_reguler.kelas,
      desc: 'Generasi penerus usia sekolah menengah & pembentukan karakter mandiri'
    },
    {
      key: 'remaja',
      title: 'Remaja & Pra-Nikah',
      icon: 'diversity_3',
      color: '#7c3aed',
      bg: '#f3e8ff',
      list: remajaSiswa,
      classes: JENJANG_CONFIG.remaja.kelas,
      desc: 'Muda-mudi mandiri, mahasiswa, pekerja, dan pembekalan pra-nikah'
    }
  ];

  const currentCat = categories.find(c => c.key === activeKat) || categories[0];
  const catStats = getStatsForList(currentCat.list);

  // Nav tabs inside modal
  const navTabsHtml = `
    <div style="display:flex;gap:6px;overflow-x:auto;border-bottom:2px solid var(--border);padding-bottom:10px;margin-bottom:14px;">
      ${categories.map(c => `
        <button type="button" class="btn-tab-ringkasan" data-cat="${c.key}" style="padding:8px 14px;border-radius:8px;border:1.5px solid ${c.key === activeKat ? c.color : 'transparent'};background:${c.key === activeKat ? c.bg : '#f8fafc'};color:${c.key === activeKat ? c.color : 'var(--text-muted)'};font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;transition:all 0.15s;">
          <span class="material-symbols-outlined" style="font-size:16px;">${c.icon}</span>
          ${c.title.split('(')[0].trim()} (${c.list.length})
        </button>
      `).join('')}
    </div>
  `;

  // Overview banner
  const overviewBannerHtml = `
    <div style="background:linear-gradient(135deg, ${currentCat.bg} 0%, #ffffff 100%);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
      <div>
        <div style="font-size:11px;font-weight:800;color:${currentCat.color};text-transform:uppercase;letter-spacing:0.5px;">Ringkasan Data Terverifikasi</div>
        <h3 style="margin:2px 0 4px;font-size:16px;font-weight:800;color:var(--text);">${currentCat.title}</h3>
        <p style="margin:0;font-size:11.5px;color:var(--text-muted);">${currentCat.desc}</p>
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:900;color:${currentCat.color};">${catStats.total} <span style="font-size:13px;font-weight:600;color:var(--text-muted);">Generus</span></div>
          <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);">
            <span style="color:#1d4ed8;">👦 ${catStats.l} Putra</span> &bull; <span style="color:#be185d;">👧 ${catStats.p} Putri</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Detailed breakdowns
  let detailContentHtml = '';

  if (activeKat === 'all') {
    // Show 3 Category Breakdown Cards
    detailContentHtml = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;">
        ${categories.filter(c => c.key !== 'all').map(c => {
          const s = getStatsForList(c.list);
          const pct = allSiswa.length > 0 ? ((c.list.length / allSiswa.length) * 100).toFixed(1) : 0;
          return `
            <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="background:${c.bg};color:${c.color};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
                    <span class="material-symbols-outlined" style="font-size:14px;">${c.icon}</span> ${c.title.split('(')[0]}
                  </span>
                  <span style="font-size:12px;font-weight:800;color:${c.color};">${pct}%</span>
                </div>
                <div style="font-size:20px;font-weight:900;color:var(--text);">${s.total} Generus</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">👦 ${s.l} Putra &bull; 👧 ${s.p} Putri</div>
                <div style="margin-top:8px;font-size:11px;color:var(--text);display:flex;flex-wrap:wrap;gap:4px;">
                  ${c.classes.map(cls => {
                    const cnt = c.list.filter(item => item.jenjang_kelas === cls).length;
                    return `<span style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-weight:600;">${cls}: <strong>${cnt}</strong></span>`;
                  }).join('')}
                </div>
              </div>
              <button type="button" class="btn-drildown-kat" data-cat="${c.key}" style="padding:6px 12px;background:${c.bg};color:${c.color};border:1px solid ${c.color};border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                Lihat Rincian Lengkap Kelas
                <span class="material-symbols-outlined" style="font-size:15px;">arrow_forward</span>
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    // Show Classes Breakdown for specific Category
    const classes = currentCat.classes || [];
    detailContentHtml = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);">Rincian Data Berdasarkan Jenjang / Kelas (${classes.length} Tingkat)</h4>
          <span style="font-size:11px;color:var(--text-muted);">Klik tombol pada tiap kelas untuk melihat data di database</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
          ${classes.map(cls => {
            const inClass = currentCat.list.filter(s => s.jenjang_kelas === cls);
            const inL = inClass.filter(s => s.jenis_kelamin === 'L').length;
            const inP = inClass.filter(s => s.jenis_kelamin === 'P').length;

            // Sebaran Desa
            const desaCounts = MASTER_WILAYAH.desa.map(d => ({
              nama: d.nama,
              count: inClass.filter(s => s.desa_id === d.id).length
            })).filter(x => x.count > 0);

            return `
              <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:8px;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:800;font-size:13px;color:var(--text);">${cls}</span>
                    <span style="font-size:13px;font-weight:900;color:${currentCat.color};">${inClass.length} Generus</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted);margin:2px 0 6px;">
                    <span style="color:#1d4ed8;">👦 ${inL} L</span> &bull; <span style="color:#be185d;">👧 ${inP} P</span>
                  </div>
                  <div style="font-size:10.5px;color:var(--text-muted);background:#f8fafc;padding:6px 8px;border-radius:6px;border:1px solid #f1f5f9;">
                    <span style="font-weight:700;display:block;margin-bottom:2px;">Sebaran Desa:</span>
                    ${desaCounts.length > 0 ? desaCounts.map(dc => `${dc.nama}: <strong>${dc.count}</strong>`).join(', ') : 'Belum ada data'}
                  </div>
                </div>
                <button type="button" class="btn-filter-ke-database" data-jenjang="${currentCat.key}" data-kelas="${cls}" style="padding:6px 10px;background:#f8fafc;color:var(--blue);border:1px solid #cbd5e1;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
                  <span class="material-symbols-outlined" style="font-size:14px;">filter_alt</span>
                  Buka Data di Database
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Distribution across 5 Desas
  const desaDistHtml = `
    <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;">
      <h4 style="margin:0 0 8px;font-size:12.5px;font-weight:800;color:var(--text);">
        Sebaran Generus di 5 Desa Solo Selatan (${currentCat.title.split('(')[0]})
      </h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:8px;">
        ${MASTER_WILAYAH.desa.map(d => {
          const inDesa = currentCat.list.filter(s => s.desa_id === d.id);
          return `
            <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:8px 10px;">
              <div style="font-size:11px;color:var(--text-muted);font-weight:600;">Desa ${d.nama}</div>
              <div style="font-size:15px;font-weight:900;color:var(--text);margin:2px 0;">${inDesa.length} <span style="font-size:10px;font-weight:600;color:var(--text-muted);">Generus</span></div>
              <div style="font-size:10px;color:var(--text-muted);">${d.kelompok.length} Kelompok</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${navTabsHtml}
      ${overviewBannerHtml}
      ${detailContentHtml}
      ${desaDistHtml}
      <div class="modal-sticky-footer" style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
        <button type="button" class="btn-cancel-modal" style="padding:9px 18px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">
          Tutup
        </button>
        <button type="button" id="btnBukaSeluruhDatabase" style="padding:9px 18px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-weight:800;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(26,86,196,0.25);">
          <span class="material-symbols-outlined" style="font-size:16px;">database</span>
          Buka Database Generus Lengkap
        </button>
      </div>
    </div>
  `;

  openModal(`Rincian Ringkasan: ${currentCat.title.split('(')[0]}`, currentCat.icon, modalHtml, 'large');

  // Tab switchers
  document.querySelectorAll('.btn-tab-ringkasan').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      renderDetailRingkasanModal(cat);
    });
  });

  // Drilldown from all tab
  document.querySelectorAll('.btn-drildown-kat').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      renderDetailRingkasanModal(cat);
    });
  });

  // Filter ke database from class button
  document.querySelectorAll('.btn-filter-ke-database').forEach(btn => {
    btn.addEventListener('click', () => {
      const jenjang = btn.dataset.jenjang;
      const kelas = btn.dataset.kelas;
      currentSiswaFilter.jenjang = jenjang;
      currentSiswaFilter.kelas = kelas;
      currentSiswaFilter.desa = 'all';
      currentSiswaFilter.kelompok = 'all';
      currentSiswaFilter.search = '';
      siswaCurrentPage = 1;
      renderSiswaModal();
    });
  });

  // Buka seluruh database
  document.getElementById('btnBukaSeluruhDatabase')?.addEventListener('click', () => {
    currentSiswaFilter.jenjang = activeKat === 'all' ? 'all' : activeKat;
    currentSiswaFilter.kelas = 'all';
    currentSiswaFilter.desa = 'all';
    currentSiswaFilter.kelompok = 'all';
    currentSiswaFilter.search = '';
    siswaCurrentPage = 1;
    renderSiswaModal();
  });

  document.querySelector('.btn-cancel-modal')?.addEventListener('click', closeModal);
}

let currentSiswaFilter = { search: '', desa: 'all', kelompok: 'all', jenjang: 'all', kelas: 'all' };

function renderSiswaModal() {
  updateDashboardStats();
  const siswaList = getSiswaList();

  // Desa Options
  const desaOptions = MASTER_WILAYAH.desa.map(d =>
    `<option value="${d.id}" ${currentSiswaFilter.desa === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`
  ).join('');

  // Kelompok Options (Filtered by Desa if selected)
  let kels = getAllKelompok();
  if (currentSiswaFilter.desa !== 'all') {
    kels = kels.filter(k => k.desaId === currentSiswaFilter.desa);
  }
  const kelOptions = kels.map(k =>
    `<option value="${k.id}" ${currentSiswaFilter.kelompok === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`
  ).join('');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;">

      <!-- HIGHLIGHT KHUSUS: FILTER MULTI-LEVEL JENJANG GENERUS -->
      <div class="filter-jenjang-card-highlight" style="background:linear-gradient(135deg, #f0f7ff 0%, #e0edfe 100%);border:2px solid #3b82f6;border-radius:12px;padding: 10px 8px;box-shadow:0 4px 14px rgba(37,99,235,0.08);">
        <div style="display:flex;justify-content:center;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:4px;">
          <div id="badgeJenjangFilterStatus" style="font-size:11px;font-weight:700;padding:4px 8px;border-radius:20px;background:#dbeafe;color:#1d4ed8;display:none;align-items:center;gap:2px;">
            <span class="material-symbols-outlined" style="font-size:14px;">filter_alt</span> <span id="textJenjangFilterStatus">Semua Jenjang</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:800;color:#1e40af;margin-bottom:4px;display:block;">
              1. Kategori Jenjang Usia:
            </label>
            <select id="filterSiswaJenjang" style="width:100%;padding:9px 12px;border:1.5px solid #93c5fd;border-radius:8px;font-size:12px;background:#fff;font-weight:700;color:#1e3a8a;outline:none;box-shadow:0 1px 2px rgba(0,0,0,0.04);cursor:pointer;">
              <option value="all">🌟 Semua Kategori Jenjang (Seluruh Usia)</option>
              <option value="caberawit" ${currentSiswaFilter.jenjang === 'caberawit' ? 'selected' : ''}>🌱 Caberawit (PAUD - SD)</option>
              <option value="gp_reguler" ${currentSiswaFilter.jenjang === 'gp_reguler' ? 'selected' : ''}>📚 GP Reguler (SMP - SMA)</option>
              <option value="remaja" ${currentSiswaFilter.jenjang === 'remaja' ? 'selected' : ''}>🎓 Remaja &amp; Dewasa (Muda-mudi &amp; Pra-Nikah)</option>
            </select>
          </div>

          <div>
            <label style="font-size:11px;font-weight:800;color:#1e40af;margin-bottom:4px;display:block;">
              2. Tingkat / Kelas Terpilih:
            </label>
            <select id="filterSiswaKelas" style="width:100%;padding:9px 12px;border:1.5px solid #93c5fd;border-radius:8px;font-size:12px;background:#fff;font-weight:600;color:#1e293b;outline:none;box-shadow:0 1px 2px rgba(0,0,0,0.04);cursor:pointer;">
              ${getKelasFilterOptions(currentSiswaFilter.jenjang, currentSiswaFilter.kelas)}
            </select>
          </div>
        </div>
      </div>

      <!-- BAR AKSI HAPUS CEPAT CHECKLIST -->
      <div id="bulkActionSiswaBar" style="display:none;background:#fef2f2;border:1.5px solid #fecaca;padding:10px 16px;border-radius:10px;margin-bottom:12px;align-items:center;justify-content:space-between;box-shadow:0 2px 8px rgba(220,38,38,0.1);">
        <div style="display:flex;align-items:center;gap:8px;color:#991b1b;font-weight:700;font-size:12.5px;">
          <span class="material-symbols-outlined" style="font-size:20px;color:#dc2626;">checklist</span>
          <span id="selectedSiswaCountText">0 generus terpilih</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" id="btnBatalPilihSiswa" style="background:#fff;border:1px solid #cbd5e1;padding:6px 14px;border-radius:6px;font-size:11.5px;font-weight:700;color:#475569;cursor:pointer;">
            Batal Pilih
          </button>
          <button type="button" id="btnBulkHapusSiswa" style="background:#dc2626;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-size:11.5px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(220,38,38,0.3);">
            <span class="material-symbols-outlined" style="font-size:16px;">delete_sweep</span>
            Hapus Cepat Data Terpilih
          </button>
        </div>
      </div>

      <!-- FILTER PENCARIAN & WILAYAH (DESA / KELOMPOK) -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;background:#fff;padding:12px 14px;border-radius:10px;border:1px solid var(--border);align-items:center;">
        <div style="position:relative;">
          <input type="text" id="inputSiswaSearch" value="${currentSiswaFilter.search}" placeholder="🔍 Cari lewat nama generus" style="width:100%;padding:9px 12px 9px 32px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;outline:none;box-sizing:border-box;" />
          <span class="material-symbols-outlined" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:16px;color:var(--text-muted);">search</span>
        </div>
        <div>
          <select id="filterSiswaDesa" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;background:#fff;outline:none;box-sizing:border-box;font-weight:600;">
            <option value="all">Semua Desa (5 Desa)</option>
            ${desaOptions}
          </select>
        </div>
        <div>
          <select id="filterSiswaKelompok" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12px;background:#fff;outline:none;box-sizing:border-box;font-weight:600;">
            <option value="all">Semua Kelompok (27 Kelompok)</option>
            ${kelOptions}
          </select>
        </div>
        <div>
          <button type="button" id="btnTambahSiswaBaru" style="width:100%;padding:10px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 6px rgba(26,86,196,0.25);">
            <span class="material-symbols-outlined" style="font-size:18px;">person_add</span> Tambah Generus
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="proker-table-wrap">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead style="background:#f8fafc;position:sticky;top:0;z-index:10;">
            <tr>
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #cbd5e1;width:38px;">
                <input type="checkbox" id="checkAllSiswa" title="Pilih Semua di Halaman Ini" style="cursor:pointer;width:15px;height:15px;" />
              </th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">No</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Nama Lengkap</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Tempat Lahir</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Tgl Lahir</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Desa</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Kelompok</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Usia</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">L/P</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Jenjang &amp; Kelas</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">No. HP</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Domisili</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Status</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Aksi</th>
            </tr>
          </thead>
          <tbody id="siswaTableBody">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>

      <!-- PAGINATION BAR -->
      <div id="siswaPaginationWrap" class="pagination-wrap"></div>
    </div>
  `;

  openModal(`Database Generus (${siswaList.length})`, 'database', modalHtml, 'wide');

  // Attach Filter Listeners
  document.getElementById('inputSiswaSearch').addEventListener('input', (e) => {
    currentSiswaFilter.search = e.target.value;
    siswaCurrentPage = 1;
    renderSiswaTableRows();
  });
  document.getElementById('filterSiswaDesa').addEventListener('change', (e) => {
    currentSiswaFilter.desa = e.target.value;
    currentSiswaFilter.kelompok = 'all'; // Reset kelompok when desa changes
    siswaCurrentPage = 1;
    renderSiswaModal(); // Re-render to update kelompok dropdown
  });
  document.getElementById('filterSiswaKelompok').addEventListener('change', (e) => {
    currentSiswaFilter.kelompok = e.target.value;
    siswaCurrentPage = 1;
    renderSiswaTableRows();
  });

  const filterJenjangEl = document.getElementById('filterSiswaJenjang');
  const filterKelasEl = document.getElementById('filterSiswaKelas');
  const badgeStatusEl = document.getElementById('badgeJenjangFilterStatus');
  const textStatusEl = document.getElementById('textJenjangFilterStatus');

  function updateBadgeJenjangStatus() {
    if (!badgeStatusEl || !textStatusEl) return;
    if (currentSiswaFilter.jenjang === 'all' && currentSiswaFilter.kelas === 'all') {
      badgeStatusEl.style.display = 'none';
    } else {
      badgeStatusEl.style.display = 'inline-flex';
      let label = 'Semua Jenjang';
      if (currentSiswaFilter.jenjang === 'caberawit') label = 'Caberawit';
      else if (currentSiswaFilter.jenjang === 'gp_reguler') label = 'GP Reguler';
      else if (currentSiswaFilter.jenjang === 'remaja') label = 'Remaja';

      if (currentSiswaFilter.kelas !== 'all') {
        label += ` (${currentSiswaFilter.kelas})`;
      }
      textStatusEl.textContent = label;
    }
  }

  filterJenjangEl?.addEventListener('change', (e) => {
    currentSiswaFilter.jenjang = e.target.value;
    currentSiswaFilter.kelas = 'all';
    siswaCurrentPage = 1;
    if (filterKelasEl) {
      filterKelasEl.innerHTML = getKelasFilterOptions(currentSiswaFilter.jenjang, 'all');
    }
    updateBadgeJenjangStatus();
    renderSiswaTableRows();
  });

  filterKelasEl?.addEventListener('change', (e) => {
    currentSiswaFilter.kelas = e.target.value;
    siswaCurrentPage = 1;
    updateBadgeJenjangStatus();
    renderSiswaTableRows();
  });

  updateBadgeJenjangStatus();

  document.getElementById('btnTambahSiswaBaru').addEventListener('click', () => {
    renderSiswaFormModal(null);
  });

  // Initial render of rows
  renderSiswaTableRows();
}

let selectedSiswaIds = new Set();
let siswaCurrentPage = 1;
let siswaPageSize = 50;

function renderSiswaTableRows() {
  const tbody = document.getElementById('siswaTableBody');
  const paginWrap = document.getElementById('siswaPaginationWrap');
  const bulkBar = document.getElementById('bulkActionSiswaBar');
  const countText = document.getElementById('selectedSiswaCountText');
  const checkAllEl = document.getElementById('checkAllSiswa');
  if (!tbody) return;

  const rawList = getSiswaList();

  const filtered = rawList.filter(s => {
    if (currentSiswaFilter.desa !== 'all' && s.desa_id !== currentSiswaFilter.desa) return false;
    if (currentSiswaFilter.kelompok !== 'all' && s.kelompok_id !== currentSiswaFilter.kelompok) return false;
    if (currentSiswaFilter.jenjang !== 'all' && s.kategori_usia !== currentSiswaFilter.jenjang) return false;
    if (currentSiswaFilter.kelas !== 'all' && s.jenjang_kelas !== currentSiswaFilter.kelas) return false;
    if (currentSiswaFilter.search) {
      const q = currentSiswaFilter.search.toLowerCase();
      if (!(s.nama_lengkap.toLowerCase().includes(q) || (s.nis || '').includes(q))) return false;
    }
    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / siswaPageSize));
  if (siswaCurrentPage > totalPages) siswaCurrentPage = 1;

  if (totalFiltered === 0) {
    tbody.innerHTML = `<tr><td colspan="14" style="padding:28px;text-align:center;color:var(--text-muted);font-size:13px;">Tidak ada data generus yang sesuai filter pencarian / jenjang.</td></tr>`;
    if (paginWrap) paginWrap.innerHTML = '';
    if (checkAllEl) checkAllEl.checked = false;
    return;
  }

  const startIndex = (siswaCurrentPage - 1) * siswaPageSize;
  const endIndex = Math.min(startIndex + siswaPageSize, totalFiltered);
  const pagedItems = filtered.slice(startIndex, endIndex);

  // Update check all state for current page
  const allPagedChecked = pagedItems.length > 0 && pagedItems.every(s => selectedSiswaIds.has(s.id));
  if (checkAllEl) checkAllEl.checked = allPagedChecked;

  tbody.innerHTML = pagedItems.map((s, idx) => {
    const isChecked = selectedSiswaIds.has(s.id);
    const cfg = JENJANG_CONFIG[s.kategori_usia] || { badge: 'Remaja', bg: '#f3e8ff', color: '#7c3aed' };
    const statusColor = s.status_sambung === 'Sambung' ? 'var(--green-pastel);color:var(--green-dark)' : '#fef2f2;color:var(--red)';
    const tglFormatted = s.tanggal_lahir ? new Date(s.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    return `
      <tr class="${isChecked ? 'row-selected' : ''}" style="border-bottom:1px solid var(--border);transition:background 0.15s;">
        <td style="padding:8px 8px;text-align:center;">
          <input type="checkbox" class="check-siswa-row" data-id="${s.id}" style="cursor:pointer;width:15px;height:15px;" ${isChecked ? 'checked' : ''} />
        </td>
        <td style="padding:8px 12px;text-align:center;font-size:11px;color:var(--text-muted);font-weight:700;">${startIndex + idx + 1}</td>
        <td style="padding:8px 12px;font-weight:700;min-width:160px;color:var(--text);">${s.nama_lengkap}</td>
        <td style="padding:8px 12px;">${s.tempat_lahir || '-'}</td>
        <td style="padding:8px 12px;white-space:nowrap;font-size:11px;">${tglFormatted}</td>
        <td style="padding:8px 12px;">Desa ${s.desa_nama || '-'}</td>
        <td style="padding:8px 12px;">Kel. ${s.kelompok_nama || '-'}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;">${calculateUmur(s.tanggal_lahir)} th</td>
        <td style="padding:8px 12px;text-align:center;font-weight:700;color:${s.jenis_kelamin === 'L' ? '#1d4ed8' : '#be185d'};">${s.jenis_kelamin}</td>
        <td style="padding:8px 12px;">
          <span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800;display:inline-block;">${cfg.badge}</span>
          <span style="display:block;font-size:11px;font-weight:600;margin-top:2px;color:#334155;">${s.jenjang_kelas}</span>
        </td>
        <td style="padding:8px 12px;font-size:11px;">${s.no_hp || '-'}</td>
        <td style="padding:8px 12px;text-align:center;font-size:11px;">${s.domisili || '-'}</td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${statusColor};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${s.status_sambung}</span>
        </td>
        <td style="padding:8px 12px;text-align:center;white-space:nowrap;">
          <div style="display:inline-flex;gap:4px;align-items:center;">
            <button type="button" class="btn-edit-siswa" data-id="${s.id}" title="Edit Data" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;padding:4px 7px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;">
              <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
            </button>
            <button type="button" class="btn-delete-siswa-table" data-id="${s.id}" data-nama="${s.nama_lengkap}" title="Hapus Data Generus" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:4px 7px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;">
              <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Render Pagination HTML
  if (paginWrap) {
    let pagesHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, siswaCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      pagesHtml += `
        <button type="button" class="pagination-btn ${p === siswaCurrentPage ? 'active' : ''}" data-page="${p}">${p}</button>
      `;
    }

    paginWrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;color:var(--text-muted);">
        <span>Menampilkan <strong>${startIndex + 1} - ${endIndex}</strong> dari <strong>${totalFiltered}</strong> generus</span>
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;">
          Per halaman:
          <select id="selSiswaPageSize" style="padding:3px 8px;border:1px solid var(--border);border-radius:6px;background:#fff;font-size:11.5px;font-weight:700;">
            <option value="25" ${siswaPageSize === 25 ? 'selected' : ''}>25</option>
            <option value="50" ${siswaPageSize === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${siswaPageSize === 100 ? 'selected' : ''}>100</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button type="button" class="pagination-btn" id="btnPageFirst" ${siswaCurrentPage === 1 ? 'disabled' : ''} title="Halaman Pertama">«</button>
        <button type="button" class="pagination-btn" id="btnPagePrev" ${siswaCurrentPage === 1 ? 'disabled' : ''} title="Sebelumnya">‹</button>
        ${pagesHtml}
        <button type="button" class="pagination-btn" id="btnPageNext" ${siswaCurrentPage === totalPages ? 'disabled' : ''} title="Berikutnya">›</button>
        <button type="button" class="pagination-btn" id="btnPageLast" ${siswaCurrentPage === totalPages ? 'disabled' : ''} title="Halaman Terakhir">»</button>
      </div>
    `;

    document.getElementById('selSiswaPageSize')?.addEventListener('change', (e) => {
      siswaPageSize = parseInt(e.target.value) || 50;
      siswaCurrentPage = 1;
      renderSiswaTableRows();
    });
    document.getElementById('btnPageFirst')?.addEventListener('click', () => {
      siswaCurrentPage = 1;
      renderSiswaTableRows();
    });
    document.getElementById('btnPagePrev')?.addEventListener('click', () => {
      if (siswaCurrentPage > 1) {
        siswaCurrentPage--;
        renderSiswaTableRows();
      }
    });
    document.getElementById('btnPageNext')?.addEventListener('click', () => {
      if (siswaCurrentPage < totalPages) {
        siswaCurrentPage++;
        renderSiswaTableRows();
      }
    });
    document.getElementById('btnPageLast')?.addEventListener('click', () => {
      siswaCurrentPage = totalPages;
      renderSiswaTableRows();
    });
    paginWrap.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        siswaCurrentPage = parseInt(btn.dataset.page);
        renderSiswaTableRows();
      });
    });
  }

  // Update Bulk Action Bar
  function updateBulkBar() {
    if (bulkBar && countText) {
      if (selectedSiswaIds.size > 0) {
        bulkBar.style.display = 'flex';
        countText.textContent = `${selectedSiswaIds.size} generus terpilih`;
      } else {
        bulkBar.style.display = 'none';
      }
    }
  }
  updateBulkBar();

  // Checkbox row listeners
  tbody.querySelectorAll('.check-siswa-row').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (e.target.checked) {
        selectedSiswaIds.add(id);
      } else {
        selectedSiswaIds.delete(id);
      }
      updateBulkBar();
      const allChecked = pagedItems.every(s => selectedSiswaIds.has(s.id));
      if (checkAllEl) checkAllEl.checked = allChecked;
      const tr = e.target.closest('tr');
      if (tr) tr.classList.toggle('row-selected', e.target.checked);
    });
  });

  // Check all in current page listener
  if (checkAllEl) {
    checkAllEl.onchange = (e) => {
      const checked = e.target.checked;
      pagedItems.forEach(s => {
        if (checked) selectedSiswaIds.add(s.id);
        else selectedSiswaIds.delete(s.id);
      });
      renderSiswaTableRows();
    };
  }

  // Batal pilih listener
  document.getElementById('btnBatalPilihSiswa')?.addEventListener('click', () => {
    selectedSiswaIds.clear();
    renderSiswaTableRows();
  });

  // Bulk Hapus Listener
  document.getElementById('btnBulkHapusSiswa')?.addEventListener('click', () => {
    const count = selectedSiswaIds.size;
    if (count === 0) return;
    showConfirmModal({
      title: 'Hapus Cepat Data Generus',
      message: `Apakah Anda yakin ingin menghapus ${count} data generus terpilih sekaligus? Tindakan ini akan menghapus data secara permanen.`,
      icon: 'delete_sweep',
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      confirmText: `Ya, Hapus ${count} Data`,
      confirmBtnColor: 'var(--red)',
      onConfirm: () => {
        selectedSiswaIds.forEach(id => deleteSiswa(id));
        selectedSiswaIds.clear();
        showToast(`${count} data generus berhasil dihapus!`, 'success');
        renderSiswaModal();
      }
    });
  });

  // Single Edit Listener
  tbody.querySelectorAll('.btn-edit-siswa').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const data = getSiswaList().find(x => x.id === id);
      if (data) renderSiswaFormModal(data);
    });
  });

  // Single Delete Listener (di tabel aksi)
  tbody.querySelectorAll('.btn-delete-siswa-table').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const nama = e.currentTarget.dataset.nama || 'generus';
      showConfirmModal({
        title: 'Hapus Data Generus',
        message: `Apakah Anda yakin ingin menghapus data "${nama}"? Tindakan ini tidak bisa dibatalkan.`,
        icon: 'delete',
        iconBg: '#fee2e2',
        iconColor: '#ef4444',
        confirmText: 'Ya, Hapus Data',
        confirmBtnColor: 'var(--red)',
        onConfirm: () => {
          deleteSiswa(id);
          selectedSiswaIds.delete(id);
          showToast(`Data "${nama}" berhasil dihapus`, 'success');
          renderSiswaModal();
        }
      });
    });
  });
}

function renderSiswaFormModal(existingData = null) {
  const isEdit = !!existingData;
  const title = isEdit ? `Edit Generus: ${existingData.nama_lengkap}` : "Tambah Generus Baru";

  // Multi-level 1: Desa & Kelompok
  const currentDesaId = existingData ? (existingData.desa_id || '') : '';
  const currentKelId = existingData ? (existingData.kelompok_id || '') : '';

  const desaOptions = MASTER_WILAYAH.desa.map(d =>
    `<option value="${d.id}" data-name="${d.nama}" ${currentDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`
  ).join('');

  function getKelompokOptionsForDesa(desaId, selectedKelId = '') {
    if (!desaId) return '<option value="">-- Pilih Desa Terlebih Dahulu --</option>';
    const foundDesa = MASTER_WILAYAH.desa.find(d => d.id === desaId);
    if (!foundDesa || !foundDesa.kelompok) return '<option value="">-- Tidak Ada Kelompok --</option>';
    const sorted = [...foundDesa.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));
    return '<option value="">-- Pilih Kelompok --</option>' + sorted.map(k =>
      `<option value="${k.id}" data-name="${k.nama}" ${selectedKelId === k.id ? 'selected' : ''}>Kelompok ${k.nama}</option>`
    ).join('');
  }

  const initialKelOptions = currentDesaId
    ? getKelompokOptionsForDesa(currentDesaId, currentKelId)
    : '<option value="">-- Pilih Desa Terlebih Dahulu --</option>';

  // Multi-level 2: Kategori Jenjang & Kelas/Tingkat
  let currentKat = existingData ? (existingData.kategori_usia || '') : '';
  let currentKelas = existingData ? (existingData.jenjang_kelas || '') : '';

  // Fallback inferensi kategori jika data lama belum ada kategori_usia
  if (!currentKat && currentKelas) {
    if (JENJANG_CONFIG.caberawit.kelas.includes(currentKelas) || currentKelas.includes('SD') || currentKelas.includes('TK') || currentKelas.includes('PAUD')) {
      currentKat = 'caberawit';
    } else if (JENJANG_CONFIG.gp_reguler.kelas.includes(currentKelas) || currentKelas.includes('SMP') || currentKelas.includes('SMA')) {
      currentKat = 'gp_reguler';
    } else {
      currentKat = 'remaja';
    }
  }

  function getKelasOptionsForJenjang(katId, selectedKelas = '') {
    if (!katId || !JENJANG_CONFIG[katId]) return '<option value="">-- Pilih Kategori Jenjang Terlebih Dahulu --</option>';
    const list = JENJANG_CONFIG[katId].kelas;
    return '<option value="">-- Pilih Kelas / Tingkat --</option>' +
      list.map(k => `<option value="${k}" ${selectedKelas === k ? 'selected' : ''}>${k}</option>`).join('');
  }

  const initialKelasOptions = currentKat
    ? getKelasOptionsForJenjang(currentKat, currentKelas)
    : '<option value="">-- Pilih Kategori Jenjang Terlebih Dahulu --</option>';

  const formHtml = `
    <form id="formSiswa" style="display:flex;flex-direction:column;gap:12px;font-size:13px;max-height:70vh;overflow-y:auto;padding-right:4px;">

      <!-- Nama Lengkap -->
      <div>
        <label style="font-weight:700;display:block;margin-bottom:4px;">Nama Lengkap <span style="color:red">*</span></label>
        <input type="text" id="sNama" value="${existingData ? (existingData.nama_lengkap || '') : ''}" required placeholder="Nama lengkap generus" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
      </div>

      <!-- Tempat & Tgl Lahir -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Tempat Lahir</label>
          <input type="text" id="sTempatLahir" value="${existingData ? (existingData.tempat_lahir || '') : ''}" placeholder="Kota/Kab. kelahiran" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Tanggal Lahir <span style="color:red">*</span></label>
          <input type="date" id="sTglLahir" value="${existingData ? (existingData.tanggal_lahir || '') : ''}" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
        </div>
      </div>

      <!-- Usia (auto/manual) -->
      <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-weight:700;font-size:12px;">Usia</label>
          <label style="font-size:11px;color:var(--text-muted);cursor:pointer;">
            <input type="checkbox" id="usiaManualToggle" style="margin-right:4px;" ${existingData && existingData.usia_manual ? 'checked' : ''}>
            Isi manual
          </label>
        </div>
        <div id="usiaAutoDisplay" style="padding:8px 12px;background:#e2e8f0;border-radius:6px;font-size:13px;color:var(--text-muted);">Otomatis dari tanggal lahir</div>
        <input type="number" id="sUsiaManual" value="${existingData && existingData.usia_manual ? existingData.usia_manual : ''}" placeholder="Isi usia (tahun)" style="display:none;width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
      </div>

      <!-- Wilayah: Multi-Level Dropdown (Desa -> Kelompok) -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Desa <span style="color:red">*</span></label>
          <select id="sDesa" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;background:#fff;font-weight:600;">
            <option value="">-- Pilih Desa --</option>
            ${desaOptions}
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Kelompok <span style="color:red">*</span></label>
          <select id="sKelompok" required style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;background:#fff;font-weight:600;">
            ${initialKelOptions}
          </select>
        </div>
      </div>

      <!-- Jenjang Generus: Multi-Level Dropdown (Kategori Jenjang -> Kelas/Tingkat) -->
      <div style="background:linear-gradient(135deg, #f0f7ff 0%, #e0edfe 100%);border:1.5px solid #93c5fd;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:18px;color:#2563eb;">school</span>
          <span style="font-size:12px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:0.3px;">Jenjang Generus</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-weight:700;display:block;margin-bottom:4px;color:#1e3a8a;">Kategori Jenjang <span style="color:red">*</span></label>
            <select id="sKategoriJenjang" required style="width:100%;padding:10px;border:1.5px solid #93c5fd;border-radius:8px;outline:none;box-sizing:border-box;background:#fff;font-weight:700;color:#1e3a8a;">
              <option value="">-- Pilih Kategori Jenjang --</option>
              <option value="caberawit" ${currentKat === 'caberawit' ? 'selected' : ''}>🌱 Caberawit (PAUD - SD)</option>
              <option value="gp_reguler" ${currentKat === 'gp_reguler' ? 'selected' : ''}>📚 GP Reguler (SMP - SMA)</option>
              <option value="remaja" ${currentKat === 'remaja' ? 'selected' : ''}>🎓 Remaja &amp; Dewasa</option>
            </select>
          </div>
          <div>
            <label style="font-weight:700;display:block;margin-bottom:4px;color:#1e3a8a;">Kelas / Tingkat <span style="color:red">*</span></label>
            <select id="sKelas" required style="width:100%;padding:10px;border:1.5px solid #93c5fd;border-radius:8px;outline:none;box-sizing:border-box;background:#fff;font-weight:600;color:#334155;">
              ${initialKelasOptions}
            </select>
          </div>
        </div>
      </div>

      <!-- Gender & No HP -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Jenis Kelamin</label>
          <select id="sGender" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="L" ${existingData && existingData.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki (L)</option>
            <option value="P" ${existingData && existingData.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan (P)</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Nomor HP / WA</label>
          <input type="tel" id="sNoHp" value="${existingData ? (existingData.no_hp || '') : ''}" placeholder="08xxxxxxxxxx" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;" />
        </div>
      </div>

      <!-- Domisili & Status Mutasi -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Domisili</label>
          <select id="sDomisili" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="Pribumi" ${existingData && existingData.domisili === 'Pribumi' ? 'selected' : ''}>Pribumi</option>
            <option value="Pendatang" ${existingData && existingData.domisili === 'Pendatang' ? 'selected' : ''}>Pendatang</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;">Status Mutasi</label>
          <select id="sMutasi" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;outline:none;box-sizing:border-box;">
            <option value="Sambung" ${existingData && existingData.status_sambung === 'Sambung' ? 'selected' : ''}>Sambung (Aktif)</option>
            <option value="Pindah Sambung" ${existingData && existingData.status_sambung === 'Pindah Sambung' ? 'selected' : ''}>Pindah Sambung</option>
            <option value="Menikah" ${existingData && existingData.status_sambung === 'Menikah' ? 'selected' : ''}>Menikah</option>
          </select>
        </div>
      </div>

      <!-- Sticky Actions Footer -->
      <div class="modal-sticky-footer">
        <button type="button" class="btn-cancel-siswa" style="flex:1;padding:12px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;cursor:pointer;">← Kembali</button>
        <button type="submit" style="flex:2;padding:12px;background:var(--blue);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">💾 Simpan Data</button>
      </div>
      ${isEdit ? `
        <button type="button" id="btnDeleteSiswa" style="padding:10px;background:#fef2f2;color:var(--red);border:1px solid #fca5a5;border-radius:8px;font-weight:700;cursor:pointer;margin-top:4px;">🗑 Hapus Data Generus Ini</button>
      ` : ''}
    </form>
  `;

  openModal(title, isEdit ? 'edit_note' : 'person_add', formHtml, 'default');

  // Multi-level Dropdown listener 1: Desa -> Kelompok
  const sDesaEl = document.getElementById('sDesa');
  const sKelompokEl = document.getElementById('sKelompok');

  sDesaEl?.addEventListener('change', () => {
    const selectedDesaId = sDesaEl.value;
    sKelompokEl.innerHTML = getKelompokOptionsForDesa(selectedDesaId);
  });

  // Multi-level Dropdown listener 2: Kategori Jenjang -> Kelas/Tingkat
  const sKatJenjangEl = document.getElementById('sKategoriJenjang');
  const sKelasEl = document.getElementById('sKelas');

  sKatJenjangEl?.addEventListener('change', () => {
    const selectedKat = sKatJenjangEl.value;
    sKelasEl.innerHTML = getKelasOptionsForJenjang(selectedKat);
  });

  // Toggle usia manual/auto
  const tglInput = document.getElementById('sTglLahir');
  const usiaManualToggle = document.getElementById('usiaManualToggle');
  const usiaAutoDisplay = document.getElementById('usiaAutoDisplay');
  const sUsiaManual = document.getElementById('sUsiaManual');

  function updateUsiaDisplay() {
    if (usiaManualToggle.checked) {
      usiaAutoDisplay.style.display = 'none';
      sUsiaManual.style.display = 'block';
    } else {
      sUsiaManual.style.display = 'none';
      usiaAutoDisplay.style.display = 'block';
      if (tglInput.value) {
        usiaAutoDisplay.textContent = calculateUmur(tglInput.value);
        usiaAutoDisplay.style.color = 'var(--text-main)';
      } else {
        usiaAutoDisplay.textContent = 'Otomatis dari tanggal lahir';
        usiaAutoDisplay.style.color = 'var(--text-muted)';
      }
    }
  }

  usiaManualToggle.addEventListener('change', updateUsiaDisplay);
  tglInput.addEventListener('change', updateUsiaDisplay);
  updateUsiaDisplay();

  document.querySelector('.btn-cancel-siswa').addEventListener('click', renderSiswaModal);

  document.getElementById('formSiswa').addEventListener('submit', (e) => {
    e.preventDefault();
    const selDesa = document.getElementById('sDesa');
    const selKel = document.getElementById('sKelompok');
    const optDesa = selDesa.options[selDesa.selectedIndex];
    const optKel = selKel.options[selKel.selectedIndex];
    const katJenjang = document.getElementById('sKategoriJenjang').value;
    const kelasStr = document.getElementById('sKelas').value;

    if (!selDesa.value) return showToast('Silakan pilih Desa terlebih dahulu!', 'warning');
    if (!selKel.value) return showToast('Silakan pilih Kelompok terlebih dahulu!', 'warning');
    if (!katJenjang) return showToast('Silakan pilih Kategori Jenjang terlebih dahulu!', 'warning');
    if (!kelasStr) return showToast('Silakan pilih Kelas / Tingkat terlebih dahulu!', 'warning');

    const isManualUsia = document.getElementById('usiaManualToggle').checked;

    const dataObj = {
      nama_lengkap: document.getElementById('sNama').value.trim(),
      tempat_lahir: document.getElementById('sTempatLahir').value.trim(),
      jenis_kelamin: document.getElementById('sGender').value,
      tanggal_lahir: document.getElementById('sTglLahir').value,
      usia_manual: isManualUsia ? parseInt(document.getElementById('sUsiaManual').value) || null : null,
      jenjang_kelas: kelasStr,
      kategori_usia: katJenjang,
      desa_id: selDesa.value,
      desa_nama: optDesa?.dataset?.name || optDesa?.textContent.replace('Desa ', ''),
      kelompok_id: selKel.value,
      kelompok_nama: optKel?.dataset?.name || optKel?.textContent.replace('Kelompok ', '').replace('Kel. ', ''),
      no_hp: document.getElementById('sNoHp').value.trim(),
      domisili: document.getElementById('sDomisili').value,
      status_sambung: document.getElementById('sMutasi').value
    };

    if (isEdit) {
      updateSiswa(existingData.id, dataObj);
      showToast('Data generus berhasil diperbarui', 'success');
    } else {
      addSiswa(dataObj);
      showToast('Data generus berhasil ditambahkan', 'success');
    }
    renderSiswaModal();
  });

  if (isEdit) {
    document.getElementById('btnDeleteSiswa').addEventListener('click', () => {
      showConfirmModal({
        title: 'Hapus Data Generus',
        message: `Yakin ingin menghapus data "${existingData.nama_lengkap}"? Tindakan ini tidak bisa dibatalkan.`,
        icon: 'delete',
        iconBg: '#fee2e2',
        iconColor: '#ef4444',
        confirmText: 'Ya, Hapus Data',
        confirmBtnColor: 'var(--red)',
        onConfirm: () => {
          deleteSiswa(existingData.id);
          showToast(`Data "${existingData.nama_lengkap}" berhasil dihapus`, 'success');
          renderSiswaModal();
        }
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODUL EVENT KBM & REKAP KEHADIRAN (MULTI-JENJANG & CETAK DOKUMEN FISIK)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderCetakAbsensiModal(activeTab = 'event_list') {
  const currentDesaId = currentUser.desaId || 'desa-timur-1';
  const currentKelId = currentUser.kelompokId || 'kel-gunung-wijil-1';

  const events = getKbmEvents();

  // Desa Options
  const desaOptions = `<option value="all">Semua Desa (Solo Selatan)</option>` +
    MASTER_WILAYAH.desa.map(d =>
      `<option value="${d.id}" ${currentDesaId === d.id ? 'selected' : ''}>Desa ${d.nama}</option>`
    ).join('');

  // Kelompok helper
  function getKelOptions(desaId, selectedKel = 'all') {
    let kels = getAllKelompok();
    if (desaId !== 'all') {
      kels = kels.filter(k => k.desaId === desaId);
    }
    return `<option value="all" ${selectedKel === 'all' ? 'selected' : ''}>Semua Kelompok (Cetak Terpisah Per Halaman)</option>` +
      kels.map(k => `<option value="${k.id}" ${selectedKel === k.id ? 'selected' : ''}>Kel. ${k.nama}</option>`).join('');
  }

  const initialKelOptions = getKelOptions(currentDesaId, currentKelId);

  // Tab Header HTML
  const tabHeaderHtml = `
    <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:16px;gap:8px;">
      <button type="button" id="tabBtnEventList" style="flex:1;padding:10px 14px;border:none;background:${activeTab === 'event_list' ? 'var(--green-light)' : 'transparent'};border-bottom:3px solid ${activeTab === 'event_list' ? 'var(--green-dark)' : 'transparent'};font-weight:800;font-size:13px;color:${activeTab === 'event_list' ? 'var(--green-dark)' : 'var(--text-muted)'};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:6px 6px 0 0;">
        <span class="material-symbols-outlined" style="font-size:18px;">event_note</span>
        Daftar Event Tersimpan (${events.length})
      </button>
      <button type="button" id="tabBtnCreateEvent" style="flex:1;padding:10px 14px;border:none;background:${activeTab === 'create_event' ? 'var(--green-light)' : 'transparent'};border-bottom:3px solid ${activeTab === 'create_event' ? 'var(--green-dark)' : 'transparent'};font-weight:800;font-size:13px;color:${activeTab === 'create_event' ? 'var(--green-dark)' : 'var(--text-muted)'};cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:6px 6px 0 0;">
        <span class="material-symbols-outlined" style="font-size:18px;">add_circle</span>
        Buat Event &amp; Cetak Absensi
      </button>
    </div>
  `;

  // Tab 1: Event List HTML
  let eventListHtml = '';
  if (events.length === 0) {
    eventListHtml = `
      <div style="text-align:center;padding:36px 20px;background:#f8fafc;border-radius:12px;border:1.5px dashed var(--border);">
        <span class="material-symbols-outlined" style="font-size:42px;color:#94a3b8;margin-bottom:8px;">event_busy</span>
        <h4 style="margin:0;font-size:14px;color:var(--text);font-weight:700;">Belum Ada Event KBM Tersimpan</h4>
        <p style="margin:4px 0 16px;font-size:12px;color:var(--text-muted);">
          Buat event KBM baru untuk mencetak lembar absensi dan menginput rekap kehadiran pengajian.
        </p>
        <button type="button" id="btnGoCreateEvent" style="padding:8px 16px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">add</span>
          Buat Event KBM Baru
        </button>
      </div>
    `;
  } else {
    eventListHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:12px;font-weight:700;color:var(--text-muted);">Total <strong>${events.length}</strong> Event KBM Tersimpan</span>
        <button type="button" id="btnTabTambahEventBaru" style="padding:6px 14px;background:var(--green-dark);color:#fff;border:none;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(34,197,94,0.25);">
          <span class="material-symbols-outlined" style="font-size:16px;">add</span> Buat Event KBM Baru
        </button>
      </div>

      <div class="proker-table-wrap" style="max-height:440px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead style="background:#f8fafc;position:sticky;top:0;z-index:5;border-bottom:2px solid #cbd5e1;">
            <tr>
              <th style="padding:8px 10px;text-align:center;width:36px;">No</th>
              <th style="padding:8px 12px;text-align:left;">Nama Event / Kegiatan KBM</th>
              <th style="padding:8px 12px;text-align:left;">Format KBM</th>
              <th style="padding:8px 12px;text-align:left;">Tanggal &amp; Waktu</th>
              <th style="padding:8px 12px;text-align:left;">Cakupan Wilayah</th>
              <th style="padding:8px 12px;text-align:center;">Status Rekap</th>
              <th style="padding:8px 12px;text-align:center;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${events.map((ev, idx) => {
              const rekap = ev.rekap_kehadiran || {};
              let totalHadir = 0, totalIjin = 0, totalAlfa = 0;
              Object.values(rekap).forEach(k => {
                totalHadir += (parseInt(k.hadir) || 0);
                totalIjin += (parseInt(k.ijin) || 0);
                totalAlfa += (parseInt(k.alfa) || 0);
              });
              const hasRekap = (totalHadir + totalIjin + totalAlfa) > 0;

              let formatBadge = 'badge-primary';
              let formatName = 'KBM Remaja';
              if (ev.format_kbm === 'caberawit') {
                formatBadge = 'badge-amber';
                formatName = 'Caberawit';
              } else if (ev.format_kbm === 'gp_reguler') {
                formatBadge = 'badge-info';
                formatName = 'GP Reguler';
              }

              let wilayahLabel = 'Se-Daerah (Solo Selatan)';
              if (ev.kelompok_id && ev.kelompok_id !== 'all') {
                const foundKel = getAllKelompok().find(k => k.id === ev.kelompok_id);
                wilayahLabel = foundKel ? `Kel. ${foundKel.nama}` : 'Kelompok Tertentu';
              } else if (ev.desa_id && ev.desa_id !== 'all') {
                const foundDesa = MASTER_WILAYAH.desa.find(d => d.id === ev.desa_id);
                wilayahLabel = foundDesa ? `Desa ${foundDesa.nama}` : 'Desa Tertentu';
              }

              return `
                <tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:8px 10px;text-align:center;font-weight:700;color:var(--text-muted);">${idx + 1}</td>
                  <td style="padding:8px 12px;font-weight:700;color:var(--text);">${ev.judul || 'Event KBM'}</td>
                  <td style="padding:8px 12px;">
                    <span class="badge ${formatBadge}" style="font-size:11px;padding:2px 8px;">${formatName}</span>
                  </td>
                  <td style="padding:8px 12px;white-space:nowrap;">
                    <div style="font-weight:600;color:#1e293b;">${ev.hari_tanggal || '-'}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${ev.jam || ''}</div>
                  </td>
                  <td style="padding:8px 12px;white-space:nowrap;">
                    <span style="font-size:11px;font-weight:700;background:#eff6ff;color:#1e40af;padding:2px 8px;border-radius:4px;display:inline-block;">
                      ${wilayahLabel}
                    </span>
                  </td>
                  <td style="padding:8px 12px;text-align:center;white-space:nowrap;">
                    ${hasRekap ? `
                      <span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:13px;">check_circle</span>
                        H:${totalHadir} I:${totalIjin} A:${totalAlfa}
                      </span>
                    ` : `
                      <span style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                        <span class="material-symbols-outlined" style="font-size:13px;">pending</span>
                        Belum Diisi
                      </span>
                    `}
                  </td>
                  <td style="padding:8px 12px;text-align:center;white-space:nowrap;">
                    <div style="display:inline-flex;gap:4px;align-items:center;">
                      <button type="button" class="btn-action-cetak-absensi" data-ev-id="${ev.id}" title="Cetak Lembar Presensi" style="padding:4px 8px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;">
                        <span class="material-symbols-outlined" style="font-size:15px;">print</span> Cetak
                      </button>
                      <button type="button" class="btn-action-edit-rekap" data-ev-id="${ev.id}" title="Form Isian Rekapitulasi" style="padding:4px 8px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;">
                        <span class="material-symbols-outlined" style="font-size:15px;">edit_note</span> Rekap
                      </button>
                      <button type="button" class="btn-action-cetak-laporan" data-ev-id="${ev.id}" title="Cetak Laporan PDF" style="padding:4px 8px;background:#fdf2f8;color:#db2777;border:1px solid #fbcfe8;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:3px;">
                        <span class="material-symbols-outlined" style="font-size:15px;">description</span> Laporan
                      </button>
                      <button type="button" class="btn-action-hapus-event" data-ev-id="${ev.id}" data-judul="${ev.judul || 'Event KBM'}" title="Hapus Event" style="padding:4px 6px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;font-size:11.5px;cursor:pointer;display:inline-flex;align-items:center;">
                        <span class="material-symbols-outlined" style="font-size:15px;">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top:12px;display:flex;justify-content:flex-end;">
        <button type="button" class="btn-cancel-modal" style="padding:8px 18px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">
          Tutup
        </button>
      </div>
    `;
  }

  // Tab 2: Create Event Form HTML
  const createFormHtml = `
    <!-- HIGHLIGHT INFO -->
    <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);border:1.5px solid #86efac;border-radius:10px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
      <span class="material-symbols-outlined" style="font-size:24px;color:#16a34a;flex-shrink:0;">print</span>
      <div>
        <h4 style="margin:0;font-size:13px;font-weight:800;color:#166534;">Buat Event KBM &amp; Konversi ke Lembar Presensi Siap Cetak</h4>
        <p style="margin:2px 0 0;font-size:11.5px;color:#15803d;line-height:1.4;">
          Event akan otomatis tersimpan di sistem, siap dicetak kapan saja, dan dapat langsung diisi rekap laporannya setelah KBM selesai.
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
          <input type="text" id="modalIptCustomJudul" value="PENGAJIAN REMAJA DAERAH SOLO SELATAN" placeholder="Contoh: PENGAJIAN REMAJA DAERAH SOLO SELATAN" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:700;color:#1e293b;font-size:12.5px;" required />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">
            Format KBM <span style="color:red">*</span>
          </label>
          <select id="modalSelJenisKbm" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:700;color:#1e3a8a;font-size:12.5px;">
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
          <input type="text" id="modalIptHariTanggal" placeholder="Contoh: Selasa, 20 Januari 2026" value="Selasa, 20 Januari 2026" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-size:12px;" />
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Waktu / Jam KBM</label>
          <input type="text" id="modalIptJam" placeholder="Contoh: 19.30 – 21.00 WIB" value="19.30 – 21.00 WIB" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-size:12px;" />
        </div>
      </div>

      <!-- Wilayah: Desa & Kelompok -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Desa</label>
          <select id="modalSelDesa" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:600;font-size:12.5px;">
            ${desaOptions}
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Kelompok</label>
          <select id="modalSelKelompok" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:600;font-size:12.5px;">
            ${initialKelOptions}
          </select>
        </div>
      </div>

      <!-- Pemisahan Gender & Baris Kosong -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Pemisahan Gender</label>
          <select id="modalSelGender" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:600;font-size:12.5px;">
            <option value="pisah" selected>🚻 Pisah Lembar (Putra &amp; Putri)</option>
            <option value="L">👦 Khusus Putra Saja</option>
            <option value="P">👧 Khusus Putri Saja</option>
            <option value="gabung">👥 Gabung (Putra &amp; Putri)</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Format Baris Kosong</label>
          <select id="modalSelBarisKosong" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-size:12.5px;">
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
          <select id="modalSelBulan" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:600;font-size:12.5px;">
            <option value="JANUARI" selected>JANUARI</option>
            <option value="FEBRUARI">FEBRUARI</option>
            <option value="MARET">MARET</option>
            <option value="APRIL">APRIL</option>
            <option value="MEI">MEI</option>
            <option value="JUNI">JUNI</option>
            <option value="JULI">JULI</option>
            <option value="AGUSTUS">AGUSTUS</option>
            <option value="SEPTEMBER">SEPTEMBER</option>
            <option value="OKTOBER">OKTOBER</option>
            <option value="NOVEMBER">NOVEMBER</option>
            <option value="DESEMBER">DESEMBER</option>
          </select>
        </div>
        <div>
          <label style="font-weight:700;display:block;margin-bottom:4px;color:var(--text);">Tahun</label>
          <input type="text" id="modalIptTahun" value="2026" style="width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;outline:none;background:#fff;font-weight:600;font-size:12.5px;" />
        </div>
      </div>

      <!-- Urutan Data Hidden/Default -->
      <input type="hidden" id="modalSelUrutan" value="official" />

      <!-- ACTIONS -->
      <div class="modal-sticky-footer" style="margin-top:8px;display:flex;gap:8px;">
        <button type="button" id="btnBatalKeEventList" style="flex:1;padding:11px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span>
          Kembali
        </button>
        <button type="button" id="btnCetakLangsungTanpaSimpan" style="flex:1.5;padding:11px;background:#f8fafc;color:#334155;border:1.5px solid #cbd5e1;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:17px;">print</span>
          Cetak Saja
        </button>
        <button type="submit" id="btnSubmitEventKbm" style="flex:2;padding:11px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:800;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 8px rgba(34,197,94,0.35);">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span>
          Simpan Event &amp; Buka Cetak
        </button>
      </div>
    </form>
  `;

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${tabHeaderHtml}
      <div id="tabContentContainer">
        ${activeTab === 'event_list' ? eventListHtml : createFormHtml}
      </div>
    </div>
  `;

  const modalSize = (activeTab === 'event_list') ? 'wide' : 'medium';
  openModal('Manajemen Event KBM & Presensi Cepat', 'event_available', modalHtml, modalSize);

  // Tab Switcher Listeners
  document.getElementById('tabBtnEventList')?.addEventListener('click', () => {
    renderCetakAbsensiModal('event_list');
  });
  document.getElementById('tabBtnCreateEvent')?.addEventListener('click', () => {
    renderCetakAbsensiModal('create_event');
  });
  document.getElementById('btnGoCreateEvent')?.addEventListener('click', () => {
    renderCetakAbsensiModal('create_event');
  });
  document.getElementById('btnTabTambahEventBaru')?.addEventListener('click', () => {
    renderCetakAbsensiModal('create_event');
  });

  // Action Buttons inside Event List
  document.querySelectorAll('.btn-action-cetak-absensi').forEach(btn => {
    btn.addEventListener('click', () => {
      const evId = btn.getAttribute('data-ev-id');
      window.open(`cetak-absensi.html?eventId=${encodeURIComponent(evId)}`, '_blank');
    });
  });

  document.querySelectorAll('.btn-action-edit-rekap').forEach(btn => {
    btn.addEventListener('click', () => {
      const evId = btn.getAttribute('data-ev-id');
      renderFormRekapKehadiranModal(evId);
    });
  });

  document.querySelectorAll('.btn-action-cetak-laporan').forEach(btn => {
    btn.addEventListener('click', () => {
      const evId = btn.getAttribute('data-ev-id');
      window.open(`laporan-kehadiran.html?eventId=${encodeURIComponent(evId)}`, '_blank');
    });
  });

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
        onConfirm: () => {
          deleteKbmEvent(evId);
          showToast('Event berhasil dihapus', 'success');
          renderCetakAbsensiModal('event_list');
        }
      });
    });
  });

  // Listener for Create Event Tab
  if (activeTab === 'create_event') {
    const selDesaEl = document.getElementById('modalSelDesa');
    const selKelEl = document.getElementById('modalSelKelompok');
    selDesaEl?.addEventListener('change', () => {
      selKelEl.innerHTML = getKelOptions(selDesaEl.value);
    });

    // Return button to event list
    document.getElementById('btnBatalKeEventList')?.addEventListener('click', () => {
      renderCetakAbsensiModal('event_list');
    });

    // Directly print without saving
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

      const targetUrl = `cetak-absensi.html?jenjang=${encodeURIComponent(jenjangVal)}&desa=${encodeURIComponent(desaVal)}&kelompok=${encodeURIComponent(kelVal)}&gender=${encodeURIComponent(genderVal)}&judul=${encodeURIComponent(judulVal)}&bulan=${encodeURIComponent(bulanVal)}&tahun=${encodeURIComponent(tahunVal)}&urutan=${encodeURIComponent(urutanVal)}&baris=${encodeURIComponent(barisVal)}`;
      window.open(targetUrl, '_blank');
    });

    // Save event & open print with Debounce & Loading Spinner to prevent spam
    let isSavingEventKbm = false;
    document.getElementById('formCetakAbsensi')?.addEventListener('submit', (e) => {
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

      // Create new event
      const newEvent = saveKbmEvent({
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

      // Open print sheet with eventId
      const targetUrl = `cetak-absensi.html?eventId=${encodeURIComponent(newEvent.id)}&jenjang=${encodeURIComponent(jenjangVal)}&desa=${encodeURIComponent(desaVal)}&kelompok=${encodeURIComponent(kelVal)}&gender=${encodeURIComponent(genderVal)}&judul=${encodeURIComponent(judulVal)}&bulan=${encodeURIComponent(bulanVal)}&tahun=${encodeURIComponent(tahunVal)}&urutan=${encodeURIComponent(urutanVal)}&baris=${encodeURIComponent(barisVal)}`;
      window.open(targetUrl, '_blank');

      // Refresh to event list after slight delay
      setTimeout(() => {
        isSavingEventKbm = false;
        renderCetakAbsensiModal('event_list');
      }, 300);
    });
  }

  document.querySelector('.btn-cancel-modal')?.addEventListener('click', closeModal);
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM ISIAN REKAPITULASI KEHADIRAN KBM (SESUAI DOKUMEN FISIK PDF)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderFormRekapKehadiranModal(eventId) {
  const event = getKbmEventById(eventId);
  if (!event) {
    showToast('Event KBM tidak ditemukan', 'error');
    renderCetakAbsensiModal('event_list');
    return;
  }

  // Initial Sesi Kelas
  let currentSesiList = (event.sesi_kelas && event.sesi_kelas.length > 0)
    ? JSON.parse(JSON.stringify(event.sesi_kelas))
    : [{ kelas: '1 SMP - DEWASA', tempat: 'Masjid Lt. 1', materi: 'Seminar Senkom Kota', penasehat: 'Bp. Abdul Aziz , S.Kom., M.Cs.' }];

  // Wilayah scoping for rekap table
  let scopedDesa = MASTER_WILAYAH.desa;
  let wilayahRekapLabel = '27 Kelompok Solo Selatan';

  if (event.kelompok_id && event.kelompok_id !== 'all') {
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

  // Current Rekap Data
  const currentRekap = event.rekap_kehadiran ? JSON.parse(JSON.stringify(event.rekap_kehadiran)) : {};

  function buildSesiRowsHtml(list) {
    return list.map((s, idx) => `
      <tr data-sesi-idx="${idx}">
        <td style="padding:6px;"><input type="text" class="ipt-sesi-kelas" value="${s.kelas || ''}" placeholder="misal: 1 SMP - 3 SMP" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-tempat" value="${s.tempat || ''}" placeholder="misal: Masjid Lt. 1" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-materi" value="${s.materi || ''}" placeholder="misal: Seminar Senkom" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;" /></td>
        <td style="padding:6px;"><input type="text" class="ipt-sesi-penasehat" value="${s.penasehat || ''}" placeholder="misal: Bp. Abdul Aziz" style="width:100%;padding:6px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:600;" /></td>
        <td style="padding:6px;text-align:center;">
          <button type="button" class="btn-hapus-sesi" data-idx="${idx}" title="Hapus Baris Kelas" style="background:#fee2e2;color:#ef4444;border:none;border-radius:6px;padding:5px 8px;cursor:pointer;">
            <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
      
      <!-- HEADER INFO -->
      <div style="background:#f8fafc;border:1.5px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <span style="font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;">Form Rekapitulasi Kehadiran (${wilayahRekapLabel})</span>
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

      <!-- TABEL SESI KELAS & MATERI (TAMBAH BARIS DINAMIS) -->
      <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);">Pembagian Kelas, Tempat, Materi &amp; Penasehat</h4>
            <span style="font-size:11px;color:var(--text-muted);">Tambah baris jika ada pembagian kelas (contoh: SMP, SMA, dan Dewasa).</span>
          </div>
          <button type="button" id="btnTambahBarisSesi" style="padding:6px 12px;background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
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
      <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--text);">Input Angka Hadir, Ijin &amp; Alfa (${wilayahRekapLabel})</h4>
            <span style="font-size:11px;color:var(--text-muted);">
              Total &amp; Prosentase terhitung otomatis secara real-time. Kolom Alfa &ge; 13% otomatis berwarna kuning.
            </span>
          </div>
        </div>

        <div style="max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;" id="tableInputRekap">
            <thead>
              <tr style="background:#f8fafc;position:sticky;top:0;z-index:2;border-bottom:2px solid var(--border);">
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
                    <td colspan="8" style="padding:5px 8px;color:#1e293b;">Desa ${d.nama}</td>
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
                      <td class="cell-tot" id="tot_${kel.id}" style="padding:4px;text-align:center;font-weight:800;background:#f8fafc;">${tot}</td>
                      <td class="cell-pct-h" id="pct_h_${kel.id}" style="padding:4px;text-align:center;font-size:11px;">${pH}%</td>
                      <td class="cell-pct-i" id="pct_i_${kel.id}" style="padding:4px;text-align:center;font-size:11px;">${pI}%</td>
                      <td class="cell-pct-a" id="pct_a_${kel.id}" style="padding:4px;text-align:center;font-size:11px;${isHigh ? 'background:#fef08a;font-weight:800;' : ''}">${pA}%</td>
                    </tr>
                  `;
                });

                // Desa Subtotal Row Placeholder
                desaRows += `
                  <tr class="subtotal-desa-row" id="subtotal_row_${d.id}" style="background:#fffbeb;font-weight:800;border-bottom:1.5px solid #cbd5e1;">
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

              <!-- GRAND TOTAL ROW -->
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

      <!-- ACTIONS -->
      <div class="modal-sticky-footer" style="margin-top:6px;display:flex;gap:8px;">
        <button type="button" id="btnBackToEventList" style="flex:1;padding:12px;background:#fff;border:1px solid var(--border);border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">
          ← Kembali ke Event
        </button>
        <button type="button" id="btnSimpanDanCetakLaporan" style="flex:1.5;padding:12px;background:#fdf2f8;color:#db2777;border:1.5px solid #fbcfe8;border-radius:8px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;">
          <span class="material-symbols-outlined" style="font-size:17px;">print</span>
          Simpan &amp; Cetak PDF
        </button>
        <button type="button" id="btnSimpanRekap" style="flex:2;padding:12px;background:var(--green-dark);color:#fff;border:none;border-radius:8px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;box-shadow:0 3px 8px rgba(34,197,94,0.35);">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span>
          Simpan Laporan Kehadiran
        </button>
      </div>

    </div>
  `;

  openModal('Isi Laporan Kehadiran KBM', 'edit_calendar', modalHtml, 'wide');

  // Back to Event List
  document.getElementById('btnBackToEventList')?.addEventListener('click', () => {
    renderCetakAbsensiModal('event_list');
  });

  // Direct Preview
  document.getElementById('btnBukaCetakLaporanLangsung')?.addEventListener('click', () => {
    window.open(`laporan-kehadiran.html?eventId=${encodeURIComponent(event.id)}`, '_blank');
  });

  // Sesi Kelas Dynamic Table Logic
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

  // Real-time calculation for Hadir, Ijin, Alfa
  function recalculateAllRekap() {
    let grandHadir = 0;
    let grandIjin = 0;
    let grandAlfa = 0;
    let grandTotal = 0;

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

      // Update Subtotal Desa
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

    // Update Grand Total
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

  // Bind input change listeners
  document.querySelectorAll('.ipt-hadir, .ipt-ijin, .ipt-alfa').forEach(ipt => {
    ipt.addEventListener('input', recalculateAllRekap);
  });

  // Initial calculation run
  recalculateAllRekap();

  // Save Rekap Function
  function saveCurrentRekapData() {
    // Collect Sesi List
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

    // Collect Rekap Kehadiran (Scoped to active groups)
    const collectedRekap = { ...(event.rekap_kehadiran || {}) };
    scopedDesa.forEach(d => {
      d.kelompok.forEach(kel => {
        const iptH = document.querySelector(`.ipt-hadir[data-kel="${kel.id}"]`);
        const iptI = document.querySelector(`.ipt-ijin[data-kel="${kel.id}"]`);
        const iptA = document.querySelector(`.ipt-alfa[data-kel="${kel.id}"]`);

        collectedRekap[kel.id] = {
          hadir: parseInt(iptH?.value) || 0,
          ijin: parseInt(iptI?.value) || 0,
          alfa: parseInt(iptA?.value) || 0
        };
      });
    });

    const hariTglVal = document.getElementById('iptRekapHariTgl')?.value.trim() || event.hari_tanggal;
    const jamVal = document.getElementById('iptRekapJam')?.value.trim() || event.jam;

    const updated = saveKbmEvent({
      ...event,
      hari_tanggal: hariTglVal,
      jam: jamVal,
      sesi_kelas: collectedSesi.length > 0 ? collectedSesi : event.sesi_kelas,
      rekap_kehadiran: collectedRekap
    });

    return updated;
  }

  // Save Rekap Button
  document.getElementById('btnSimpanRekap')?.addEventListener('click', () => {
    saveCurrentRekapData();
    showToast('Rekapitulasi kehadiran KBM berhasil disimpan!', 'success');
    renderCetakAbsensiModal('event_list');
  });

  // Save & Open PDF
  document.getElementById('btnSimpanDanCetakLaporan')?.addEventListener('click', () => {
    const saved = saveCurrentRekapData();
    showToast('Rekapitulasi disimpan! Membuka laporan PDF...', 'success');
    window.open(`laporan-kehadiran.html?eventId=${encodeURIComponent(saved.id)}`, '_blank');
    renderCetakAbsensiModal('event_list');
  });
}

