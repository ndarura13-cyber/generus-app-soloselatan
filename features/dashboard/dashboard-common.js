/* ═══════════════════════════════════════════════════════════════
   dashboard-common.js — Shared Utilities, Session, Toast & Modal Core
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getPengurusList,
  getPengurusById
} from '../../src/db-master.js';

/* ── 1. Initial User Session & Strict Security Verification ── */
export let currentUser = null;

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
  window.location.replace('../login/login.html');
  throw new Error('Akses ditolak: Anda harus login terlebih dahulu.');
}

// Verifikasi silang akun dengan database pengurus
const activePengurusList = getPengurusList();
const existingAccount = activePengurusList.find(
  p => (p.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) || p.id === currentUser.id
);

if (existingAccount) {
  if (existingAccount.isActive === false || existingAccount.statusApproval !== 'approved') {
    localStorage.removeItem('ppg_user_session');
    window.location.replace('../login/login.html');
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

export function setCurrentUser(updated) {
  currentUser = updated;
}

/* ── 2. Top Toast Notification System ───────────────────────── */
export function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('topToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'topToastContainer';
    container.className = 'top-toast-container';
    document.body.appendChild(container);
  }

  const lowerMsg = (message || '').toLowerCase();
  let toastType = type;
  if (toastType === 'info') {
    if (lowerMsg.includes('berhasil') || lowerMsg.includes('sukses') || lowerMsg.includes('tersimpan')) {
      toastType = 'success';
    } else if (lowerMsg.includes('gagal') || lowerMsg.includes('ditolak') || lowerMsg.includes('error')) {
      toastType = 'danger';
    } else if (lowerMsg.includes('wajib') || lowerMsg.includes('peringatan') || lowerMsg.includes('perhatian') || lowerMsg.includes('silakan')) {
      toastType = 'warning';
    }
  }

  const iconMap = {
    success: 'check_circle',
    danger: 'cancel',
    error: 'cancel',
    warning: 'warning',
    info: 'info'
  };

  const iconName = iconMap[toastType] || 'info';

  const toastEl = document.createElement('div');
  toastEl.className = `top-toast toast-${toastType}`;
  toastEl.innerHTML = `
    <div class="top-toast-icon-wrap">
      <span class="material-symbols-outlined">${iconName}</span>
    </div>
    <span class="top-toast-msg">${message}</span>
    <button type="button" class="top-toast-close" title="Tutup">
      <span class="material-symbols-outlined" style="font-size:16px;">close</span>
    </button>
  `;

  const removeToast = () => {
    if (toastEl.classList.contains('toast-exit')) return;
    toastEl.classList.add('toast-exit');
    setTimeout(() => {
      if (toastEl.parentNode) toastEl.remove();
    }, 260);
  };

  toastEl.querySelector('.top-toast-close').addEventListener('click', (e) => {
    e.stopPropagation();
    removeToast();
  });

  container.appendChild(toastEl);

  const timer = setTimeout(removeToast, duration);
  toastEl.addEventListener('mouseenter', () => clearTimeout(timer));
  toastEl.addEventListener('mouseleave', () => setTimeout(removeToast, 1200));

  return toastEl;
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

/* ── 3. General Modal Dialog Helpers ───────────────────────── */
export const modalBackdrop = document.getElementById('modalBackdrop');
export const modalTitle = document.getElementById('modalTitle');
export const modalIcon = document.getElementById('modalIcon');
export const modalBody = document.getElementById('modalBody');
export const btnCloseModal = document.getElementById('btnCloseModal');

export function openModal(title, icon = 'info', contentOrSize = 'default', maybeSize = 'default') {
  if (modalTitle) modalTitle.textContent = title;
  if (modalIcon) modalIcon.textContent = icon;

  let finalSize = 'default';

  if (typeof contentOrSize === 'string') {
    const isSizeKeyword = ['default', 'wide', 'large', 'medium', 'small'].includes(contentOrSize);
    if (isSizeKeyword && maybeSize === 'default') {
      // Called with 3 arguments: openModal(title, icon, size)
      finalSize = contentOrSize;
    } else {
      // Called with 4 arguments: openModal(title, icon, htmlContent, size)
      // Or 3rd argument is HTML content string
      if (modalBody) modalBody.innerHTML = contentOrSize;
      finalSize = maybeSize;
    }
  } else if (contentOrSize && typeof contentOrSize === 'object') {
    if (modalBody) {
      modalBody.innerHTML = '';
      modalBody.appendChild(contentOrSize);
    }
    finalSize = maybeSize;
  }

  const modalBox = document.querySelector('.modal-box');
  if (modalBox) {
    modalBox.classList.remove('modal-wide', 'modal-large', 'modal-medium');
    if (finalSize === 'wide') modalBox.classList.add('modal-wide');
    else if (finalSize === 'large') modalBox.classList.add('modal-large');
    else if (finalSize === 'medium') modalBox.classList.add('modal-medium');
    modalBox.scrollTop = 0;
  }
  if (modalBackdrop) {
    modalBackdrop.style.display = 'flex';
    setTimeout(() => modalBackdrop.classList.add('show'), 10);
  }
}


export function closeModal() {
  if (modalBackdrop) {
    modalBackdrop.classList.remove('show');
    setTimeout(() => { modalBackdrop.style.display = 'none'; }, 300);
  }
}

btnCloseModal?.addEventListener('click', closeModal);

/* ── 4. Reusable Confirmation Modal (Yes / No Question) ────── */
export const confirmModalBackdrop = document.getElementById('confirmModalBackdrop');
export const confirmIconBox = document.getElementById('confirmIconBox');
export const confirmIcon = document.getElementById('confirmIcon');
export const confirmTitle = document.getElementById('confirmTitle');
export const confirmMessage = document.getElementById('confirmMessage');
export const btnConfirmOk = document.getElementById('btnConfirmOk');
export const btnConfirmCancel = document.getElementById('btnConfirmCancel');

let currentConfirmCallback = null;

export function showConfirmModal(opts) {
  confirmTitle.textContent = opts.title || 'Konfirmasi';
  confirmMessage.textContent = opts.message || 'Apakah Anda yakin ingin melanjutkan?';

  if (opts.icon) confirmIcon.textContent = opts.icon;
  if (opts.iconBg) confirmIconBox.style.background = opts.iconBg;
  if (opts.iconColor) confirmIcon.style.color = opts.iconColor;

  btnConfirmOk.textContent = opts.confirmText || 'Ya, Lanjutkan';
  if (opts.confirmBtnColor) {
    btnConfirmOk.style.background = opts.confirmBtnColor;
  } else {
    btnConfirmOk.style.background = 'var(--blue)';
  }

  if (opts.cancelText === '') {
    btnConfirmCancel.style.display = 'none';
  } else {
    btnConfirmCancel.style.display = 'block';
    btnConfirmCancel.textContent = opts.cancelText || 'Batal';
  }

  currentConfirmCallback = opts.onConfirm || null;
  if (confirmModalBackdrop) {
    confirmModalBackdrop.style.display = 'flex';
    setTimeout(() => confirmModalBackdrop.classList.add('show'), 10);
  }
}

btnConfirmCancel?.addEventListener('click', () => {
  if (confirmModalBackdrop) {
    confirmModalBackdrop.classList.remove('show');
    setTimeout(() => { confirmModalBackdrop.style.display = 'none'; }, 300);
  }
  currentConfirmCallback = null;
});

btnConfirmOk?.addEventListener('click', () => {
  if (confirmModalBackdrop) {
    confirmModalBackdrop.classList.remove('show');
    setTimeout(() => { confirmModalBackdrop.style.display = 'none'; }, 300);
  }
  if (typeof currentConfirmCallback === 'function') {
    currentConfirmCallback();
  }
  currentConfirmCallback = null;
});

/* ── 5. Pop-up Kontak Pengurus Wilayah (Multi-Person) ──────── */
export function renderKontakModal(desaId, kelompokId = null) {
  const allPengurus = getPengurusList();
  const desa = MASTER_WILAYAH.desa.find(d => d.id === desaId);
  const desaNama = desa ? desa.nama : 'Wilayah';

  let filtered = allPengurus.filter(p => p.desaId === desaId && p.isActive !== false);

  let title = `Kontak Pengurus Desa ${desaNama}`;
  let subLabel = `Desa ${desaNama}`;
  if (kelompokId && desa) {
    const kel = desa.kelompok.find(k => k.id === kelompokId);
    if (kel) {
      title = `Kontak Pengurus Kel. ${kel.nama} (Desa ${desaNama})`;
      subLabel = `Kelompok ${kel.nama}, Desa ${desaNama}`;
      filtered = filtered.filter(p => p.kelompokId === kelompokId);
    }
  }

  if (filtered.length === 0) {
    openModal(title, 'contact_phone', `
      <div class="kontak-empty-box">
        <span class="material-symbols-outlined">person_off</span>
        <h4 style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:4px;">Belum Ada Pengurus Terdaftar</h4>
        <p style="font-size:12.5px;color:var(--text-muted);">Wilayah ini belum memiliki pamong atau pengurus aktif dalam database.</p>
      </div>
    `, 'medium');
    return;
  }

  const listHtml = filtered.map(p => {
    const waClean = (p.noWa || '').replace(/[^0-9]/g, '');
    const waIntl = waClean ? (waClean.startsWith('0') ? '62' + waClean.substring(1) : waClean) : '';
    const waMsg = encodeURIComponent(`Assalamu'alaikum ${p.nama}, terkait koordinasi PPG Solo Selatan...`);
    const asalTxt = `Kel. ${p.kelompokNama || '-'} &bull; Desa ${p.desaNama || '-'}`;

    return `
      <div class="kontak-card">
        <div class="kontak-card-top">
          <div class="kontak-card-main">
            <div class="kontak-avatar">
              ${(p.nama || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="kontak-name">${p.nama}</div>
              <div class="kontak-role">${p.peran || p.jabatan || 'Pamong'}</div>
              <div class="kontak-asal">📍 Asal: <strong>${asalTxt}</strong></div>
            </div>
          </div>
          <span class="kontak-status-pill">🟢 Aktif</span>
        </div>

        <div class="kontak-actions">
          ${waIntl ? `
            <a href="https://wa.me/${waIntl}?text=${waMsg}" target="_blank" rel="noopener" class="btn-kontak-wa">
              <span class="material-symbols-outlined" style="font-size:16px;">chat</span> Chat WhatsApp
            </a>
          ` : `
            <span class="btn-kontak-disabled">
              <span class="material-symbols-outlined" style="font-size:16px;">phone_disabled</span> No WA (-)
            </span>
          `}
          ${p.email ? `
            <a href="mailto:${p.email}" class="btn-kontak-email">
              <span class="material-symbols-outlined" style="font-size:16px;">mail</span> Kirim Email
            </a>
          ` : `
            <span class="btn-kontak-disabled">
              <span class="material-symbols-outlined" style="font-size:16px;">mail_lock</span> Email (-)
            </span>
          `}
        </div>
      </div>
    `;
  }).join('');

  openModal(`${title} (${filtered.length} Pengurus)`, 'contacts', `
    <div class="kontak-modal-wrap">
      <div class="kontak-header-desc">
        Daftar kontak pengurus &amp; pamong yang bertanggung jawab di wilayah <strong>${subLabel}</strong>:
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${listHtml}
      </div>
    </div>
  `, 'medium');
}

