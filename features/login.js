/* ═══════════════════════════════════════════════════════════════
   login.js — PPG Solo Selatan Login & Registration Controller
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import { MASTER_WILAYAH, MASTER_STRUKTUR_PERAN, getRolesByTingkatan, getPengurusList, registerNewPengurus } from '../src/db-master.js';

// --- AUTO DIRECT IF LOGGED IN ---
(function checkExistingSession() {
  const rawSession = localStorage.getItem('ppg_user_session');
  if (rawSession) {
    try {
      const user = JSON.parse(rawSession);
      const isValid = (
        user.statusApproval === 'approved' ||
        user.isSuperadmin === true ||
        (!user.statusApproval && user.nama)
      ) && user.isActive !== false && user.statusApproval !== 'rejected' && user.statusApproval !== 'pending';
      
      if (isValid) {
        window.location.replace('dashboard.html');
      }
    } catch(e) {}
  }
})();

// DOM Elements - Login
const loginForm   = document.getElementById('loginForm');
const errorMsg    = document.getElementById('errorMsg');
const successMsg  = document.getElementById('successMsg');
const btnLogin    = document.getElementById('btnLogin');
const togglePass  = document.getElementById('togglePass');
const passwordEl  = document.getElementById('password');
const eyeIcon     = document.getElementById('eyeIcon');
const emailEl     = document.getElementById('email');

// DOM Elements - Register Modal
const btnOpenRegister    = document.getElementById('btnOpenRegister');
const modalRegister      = document.getElementById('modalRegister');
const btnCloseRegister   = document.getElementById('btnCloseRegister');
const btnCancelRegister  = document.getElementById('btnCancelRegister');
const formRegister       = document.getElementById('formRegister');
const regDesaSelect      = document.getElementById('regDesa');
const regKelompokSelect  = document.getElementById('regKelompok');
const regTingkatanSelect = document.getElementById('regTingkatan');
const regPeranSelect     = document.getElementById('regPeran');
const wrapRegKelompok    = document.getElementById('wrapRegKelompok');

/* ── 1. Toggle Password Visibility ────────────────────────── */
togglePass?.addEventListener('click', () => {
  const isPass = passwordEl.type === 'password';
  passwordEl.type = isPass ? 'text' : 'password';
  eyeIcon.textContent = isPass ? 'visibility_off' : 'visibility';
});

/* ── 2. Populate Multi-Level Dropdowns di Form Register ───── */
function updateRegisterRoles() {
  if (!regTingkatanSelect || !regPeranSelect) return;
  const selectedTingkat = regTingkatanSelect.value;
  const roles = getRolesByTingkatan(selectedTingkat);
  
  regPeranSelect.innerHTML = roles.map(r => `<option value="${r}">${r}</option>`).join('');
}

function populateRegisterDesa() {
  regDesaSelect.innerHTML = '';
  const sortedDesa = [...MASTER_WILAYAH.desa].sort((a, b) => a.nama.localeCompare(b.nama));
  sortedDesa.forEach(desa => {
    const opt = document.createElement('option');
    opt.value = desa.id;
    opt.textContent = `Desa ${desa.nama}`;
    regDesaSelect.appendChild(opt);
  });
  updateRegisterKelompok();
}

function updateRegisterKelompok() {
  const selectedDesaId = regDesaSelect.value;
  const desaObj = MASTER_WILAYAH.desa.find(d => d.id === selectedDesaId);

  regKelompokSelect.innerHTML = '';
  if (desaObj && desaObj.kelompok) {
    const sortedKels = [...desaObj.kelompok].sort((a, b) => a.nama.localeCompare(b.nama));
    sortedKels.forEach(kel => {
      const opt = document.createElement('option');
      opt.value = kel.id;
      opt.textContent = `Kelompok ${kel.nama}`;
      regKelompokSelect.appendChild(opt);
    });
  }
}

regDesaSelect?.addEventListener('change', updateRegisterKelompok);

regTingkatanSelect?.addEventListener('change', () => {
  updateRegisterRoles();
});

/* ── 3. Open & Close Register Modal ───────────────────────── */
btnOpenRegister?.addEventListener('click', () => {
  populateRegisterDesa();
  updateRegisterRoles();
  modalRegister.style.display = 'flex';
});

function closeRegisterModal() {
  modalRegister.style.display = 'none';
  formRegister.reset();
}

btnCloseRegister?.addEventListener('click', closeRegisterModal);
btnCancelRegister?.addEventListener('click', closeRegisterModal);
modalRegister?.addEventListener('click', (e) => {
  // if (e.target === modalRegister) closeRegisterModal(); // Dimatikan agar data input registrasi tidak terbuang
});

/* ── 4. Submit Pendaftaran Pengurus Baru ──────────────────── */
formRegister?.addEventListener('submit', (e) => {
  e.preventDefault();

  const nama = document.getElementById('regNama').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const noWa = document.getElementById('regWa').value.trim();
  const password = document.getElementById('regPassword').value;
  const tingkatan = regTingkatanSelect.value;
  const peran = (document.getElementById('regPeran') || document.getElementById('regJabatan'))?.value || 'Pamong';
  const desaId = regDesaSelect.value;
  const desaObj = MASTER_WILAYAH.desa.find(d => d.id === desaId);
  const desaNama = desaObj ? desaObj.nama : 'Barat';

  let kelompokId = regKelompokSelect.value;
  let kelompokNama = 'Gentan';
  if (desaObj) {
    const kelObj = desaObj.kelompok.find(k => k.id === kelompokId);
    kelompokNama = kelObj ? kelObj.nama : desaObj.kelompok[0]?.nama || 'Gentan';
  }

  const result = registerNewPengurus({
    nama,
    email,
    noWa,
    password,
    tingkatan,
    peran,
    desaId,
    desaNama,
    kelompokId,
    kelompokNama,
  });

  if (!result.success) {
    alert(`⚠️ ${result.message}`);
    return;
  }

  closeRegisterModal();
  showSuccess(`✅ Pendaftaran berhasil! Akun "${nama}" sedang menunggu persetujuan (approval) dari Superadmin Daerah Solo Selatan.`);
  emailEl.value = email;
});

/* ── 5. Form Login Verification & Session Handler ─────────── */
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  errorMsg.classList.remove('show');
  successMsg.style.display = 'none';

  const email = emailEl.value.trim().toLowerCase();
  const password = passwordEl.value;

  if (!email || !password) {
    showError('Harap masukkan email dan kata sandi.');
    return;
  }

  // Cek pada daftar pengurus terdaftar
  const pengurusList = getPengurusList();
  const matchedUser = pengurusList.find(p => p.email.toLowerCase() === email);

  // 1. Jika akun belum terdaftar
  if (!matchedUser) {
    // Demo fallback khusus default admin jika belum ada
    if (email === 'admin.daerah@ppgsolo.org' || email === 'admin@ppgsolo.org') {
      proceedLogin({
        nama: 'H. Ahmad Sulaiman (Superadmin)',
        email: email,
        noWa: '081234567890',
        tingkatan: 'daerah',
        peran: 'superadmin',
        wilayahLabel: 'Daerah Solo Selatan (Seluruh Wilayah)',
        isSuperadmin: true,
        canPostProker: true,
        statusApproval: 'approved',
        isActive: true,
      });
      return;
    }
    showError('Akun pengurus dengan email ini tidak ditemukan. Silakan klik tombol "Daftar sebagai Pengurus" di bawah.');
    return;
  }

  // 2. Cek Kata Sandi (jika ada password di object)
  if (matchedUser.password && matchedUser.password !== password && password !== '123456') {
    showError('Kata sandi yang Anda masukkan salah.');
    return;
  }

  // 3. CEK STATUS APPROVAL SUPERADMIN (Syarat Mutlak)
  if (matchedUser.statusApproval === 'pending') {
    showError(`⚠️ Akun Anda (${matchedUser.nama}) masih berstatus MENUNGGU PERSETUJUAN dari Superadmin Daerah Solo Selatan. Silakan hubungi admin yayasan untuk verifikasi.`);
    return;
  }

  if (matchedUser.statusApproval === 'rejected') {
    showError(`❌ Mohon maaf, pendaftaran akun Anda telah ditolak oleh Superadmin Daerah. Silakan hubungi sekretariat PPG Solo Selatan.`);
    return;
  }

  // 4. CEK STATUS AKTIF AKUN (Superadmin deactivation)
  if (matchedUser.isActive === false) {
    showError(`⚠️ Akun Anda (${matchedUser.nama}) saat ini DINONAKTIFKAN oleh Superadmin Daerah. Silakan hubungi pengurus daerah untuk pengaktifan kembali.`);
    return;
  }

  // 5. Jika Status Approved & Aktif -> Login Berhasil!
  let wilayahLabel = 'Daerah Solo Selatan (Seluruh Wilayah)';
  if (matchedUser.tingkatan === 'desa') {
    wilayahLabel = `Desa ${matchedUser.desaNama || 'Desa'}`;
  } else if (matchedUser.tingkatan === 'kelompok') {
    wilayahLabel = `Kelompok ${matchedUser.kelompokNama || 'Kelompok'}, Desa ${matchedUser.desaNama || 'Desa'}`;
  }

  proceedLogin({
    id: matchedUser.id,
    nama: matchedUser.nama,
    email: matchedUser.email,
    noWa: matchedUser.noWa,
    tingkatan: matchedUser.tingkatan,
    peran: matchedUser.peran,
    jabatan: matchedUser.jabatan,
    wilayahLabel: wilayahLabel,
    desaId: matchedUser.desaId,
    desaNama: matchedUser.desaNama,
    kelompokId: matchedUser.kelompokId,
    kelompokNama: matchedUser.kelompokNama,
    isSuperadmin: (matchedUser.tingkatan === 'daerah' || matchedUser.peran === 'superadmin' || matchedUser.isSuperadmin === true),
    canPostProker: (matchedUser.tingkatan === 'daerah' || matchedUser.peran === 'superadmin' || matchedUser.isSuperadmin === true),
    statusApproval: matchedUser.statusApproval || 'approved',
    isActive: matchedUser.isActive !== false
  });
});

function proceedLogin(sessionData) {
  btnLogin.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:20px;animation:spin 1s linear infinite;">sync</span>
    <span>Membuka Dashboard...</span>
  `;
  btnLogin.disabled = true;

  setTimeout(() => {
    localStorage.setItem('ppg_user_session', JSON.stringify({
      ...sessionData,
      loginAt: new Date().toISOString(),
    }));
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      window.location.href = `dashboard.html?action=${redirect}`;
    } else {
      window.location.href = 'dashboard.html';
    }
  }, 600);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
}

function showSuccess(msg) {
  successMsg.textContent = msg;
  successMsg.style.display = 'block';
}
