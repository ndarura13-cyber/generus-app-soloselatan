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
  p => p.email.toLowerCase() === currentUser.email.toLowerCase() || p.id === currentUser.id
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
  if (modalBackdrop) modalBackdrop.style.display = 'flex';
}


export function closeModal() {
  modalBackdrop.style.display = 'none';
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
  confirmModalBackdrop.style.display = 'flex';
}

btnConfirmCancel?.addEventListener('click', () => {
  confirmModalBackdrop.style.display = 'none';
  currentConfirmCallback = null;
});

btnConfirmOk?.addEventListener('click', () => {
  confirmModalBackdrop.style.display = 'none';
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
  if (kelompokId && desa) {
    const kel = desa.kelompok.find(k => k.id === kelompokId);
    if (kel) {
      title = `Kontak Pengurus Kel. ${kel.nama} (Desa ${desaNama})`;
      filtered = filtered.filter(p => p.kelompokId === kelompokId);
    }
  }

  openModal(title, 'contacts', 'medium');

  if (filtered.length === 0) {
    modalBody.innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--text-muted);">
        <span class="material-symbols-outlined" style="font-size:40px;opacity:0.5;">person_off</span>
        <p style="margin-top:10px;font-size:14px;">Belum ada pengurus terdaftar di wilayah ini.</p>
      </div>
    `;
    return;
  }

  modalBody.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${filtered.map(p => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--text);">${p.nama}</div>
            <div style="font-size:12px;color:var(--text-muted);display:flex;gap:6px;align-items:center;margin-top:2px;">
              <span style="background:#e0f2fe;color:#0369a1;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600;">${p.peran || p.jabatan || 'Pengurus'}</span>
              <span>&bull;</span>
              <span>${p.desaNama || ''} ${p.kelompokNama ? '- Kel. ' + p.kelompokNama : ''}</span>
            </div>
          </div>
          ${p.noWa ? `
            <a href="https://wa.me/${p.noWa.replace(/^0/, '62').replace(/[^0-9]/g, '')}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;background:#25D366;color:#fff;text-decoration:none;border-radius:8px;font-size:12px;font-weight:700;">
              <span>WhatsApp</span>
            </a>
          ` : '<span style="font-size:11px;color:#94a3b8;">No HP (-)</span>'}
        </div>
      `).join('')}
    </div>
  `;
}
