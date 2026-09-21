/* ═══════════════════════════════════════════════════════════════
   dashboard-pembiasaan.js — Lembar Target Pembiasaan Karakter
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getAllKelompok,
  getEventPembiasaanList,
  saveEventPembiasaanList,
  addEventPembiasaan,
  updateEventPembiasaan,
  closeEventPembiasaan,
  deleteEventPembiasaan,
  getNilaiPembiasaanList,
  saveNilaiPembiasaan,
  getSiswaList,
  isSupabaseConfigured,
  syncPembiasaanFromSupabase
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  closeModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js?v=5.8';

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT PEMBIASAAN MODULE
   ═══════════════════════════════════════════════════════════════════════════ */

let currentEventId = null;

// Helper: ambil habit_max dengan default 30 untuk 2 habit pertama dan 10 untuk habit tambahan
export function getEventHabitMax(event) {
  if (!event || !Array.isArray(event.habits)) return [];
  if (Array.isArray(event.habit_max) && event.habit_max.length === event.habits.length) {
    return event.habit_max.map(v => parseInt(v) || 10);
  }
  return event.habits.map((_, i) => (i < 2 ? 30 : 10));
}

// Helper pagination builder reusable across Pembiasaan modals
function buildPaginationHtml(currentPage, totalPages, prevBtnId, nextBtnId, pageBtnClass) {
  if (totalPages <= 1) return '';
  let pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  const buttonsHtml = pages.map(p => {
    if (p === '...') {
      return `<span style="padding:0 4px;color:var(--text-muted);font-size:12px;">...</span>`;
    }
    return `<button type="button" class="pembiasaan-page-btn ${pageBtnClass} ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }).join('');

  return `
    <div class="pembiasaan-pagination-nav">
      <button type="button" class="pembiasaan-page-btn" id="${prevBtnId}" ${currentPage === 1 ? 'disabled' : ''} title="Halaman Sebelumnya">
        <span class="material-symbols-outlined" style="font-size:16px;">chevron_left</span>
      </button>
      ${buttonsHtml}
      <button type="button" class="pembiasaan-page-btn" id="${nextBtnId}" ${currentPage === totalPages ? 'disabled' : ''} title="Halaman Berikutnya">
        <span class="material-symbols-outlined" style="font-size:16px;">chevron_right</span>
      </button>
    </div>
  `;
}

let currentEventPage = 1;
const eventItemsPerPage = 5;

export async function renderEventPembiasaanModal(skipSync = false, targetPage = 1) {
  if (!skipSync && isSupabaseConfigured()) {
    try {
      await syncPembiasaanFromSupabase();
    } catch (err) {
      console.warn('Gagal sinkron pembiasaan dari Supabase:', err);
    }
  }
  const events = getEventPembiasaanList();
  const isSuperadminOrDaerah = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';

  const totalPages = Math.ceil(events.length / eventItemsPerPage) || 1;
  currentEventPage = Math.max(1, Math.min(targetPage, totalPages));

  const startIdx = (currentEventPage - 1) * eventItemsPerPage;
  const pagedEvents = events.slice(startIdx, startIdx + eventItemsPerPage);

  // 1. DESKTOP ROWS
  const eventRows = pagedEvents.map((e, idx) => {
    const globalIdx = startIdx + idx;
    const habitMax = getEventHabitMax(e);
    const totalMax = habitMax.reduce((a, b) => a + b, 0);

    const habitsBadges = e.habits.map((h, i) => {
      const maxP = habitMax[i] || (i < 2 ? 30 : 10);
      const isPenting = maxP >= 30;
      return `
        <div style="font-size:11.5px;color:var(--text);margin-bottom:3px;display:flex;align-items:center;gap:6px;">
          <span class="habit-badge-pill ${isPenting ? 'habit-badge-penting' : 'habit-badge-additional'}">${isPenting ? 'Penting' : 'Add.'} (${maxP}p)</span>
          <span style="font-weight:600;">H${i + 1}:</span> <span style="color:var(--text-muted);">${h}</span>
        </div>
      `;
    }).join('');

    return `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:10px;text-align:center;">${globalIdx + 1}</td>
        <td style="padding:10px;">
          <div style="font-weight:800;font-size:13px;color:var(--text);">${e.judul_periode}</div>
          <div style="font-size:11px;color:var(--blue);font-weight:700;margin-top:2px;">
            Total Bobot: ${totalMax} Poin (${e.habits.length} Pembiasaan)
          </div>
        </td>
        <td style="padding:10px;">
          <span style="background:${e.status === 'berjalan' ? 'var(--green-pastel)' : '#e2e8f0'};color:${e.status === 'berjalan' ? 'var(--green-dark)' : '#475569'};padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap;">
            ${e.status === 'berjalan' ? '🟢 BERJALAN' : '🔒 SELESAI'}
          </span>
        </td>
        <td style="padding:10px;">
          ${habitsBadges}
        </td>
        <td style="padding:10px;text-align:right;">
          <div style="display:flex;gap:6px;justify-content:flex-end;align-items:center;">
            ${(isSuperadminOrDaerah && e.status === 'berjalan') ? `<button class="btn-edit-event" data-id="${e.id}" style="padding:6px 10px;background:#f0f9ff;color:var(--blue);border:1px solid #bae6fd;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">✏ Edit</button>` : ''}
            <button class="btn-open-event" data-id="${e.id}" style="padding:6px 12px;background:var(--blue);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              <span class="material-symbols-outlined" style="font-size:15px;">edit_square</span> Isi Nilai
            </button>
            ${isSuperadminOrDaerah ? `<button class="btn-delete-event" data-id="${e.id}" title="Hapus Event" style="padding:6px 10px;background:#fef2f2;color:var(--red);border:1px solid #fca5a5;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">🗑</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // 2. MOBILE ACCORDION CARDS (Hanya No, Nama, tombol aksi icon-only, dan dropdown chevron)
  const eventMobileCards = pagedEvents.map((e, idx) => {
    const globalIdx = startIdx + idx;
    const habitMax = getEventHabitMax(e);
    const totalMax = habitMax.reduce((a, b) => a + b, 0);

    const habitsBadges = e.habits.map((h, i) => {
      const maxP = habitMax[i] || (i < 2 ? 30 : 10);
      const isPenting = maxP >= 30;
      return `
        <div style="font-size:11.5px;color:var(--text);margin-bottom:3px;display:flex;align-items:center;gap:6px;">
          <span class="habit-badge-pill ${isPenting ? 'habit-badge-penting' : 'habit-badge-additional'}">${isPenting ? 'Penting' : 'Add.'} (${maxP}p)</span>
          <span style="font-weight:600;">H${i + 1}:</span> <span style="color:var(--text-muted);">${h}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="event-mobile-card" data-id="${e.id}">
        <div class="event-mobile-header">
          <div class="event-mobile-title-wrap btn-toggle-event-detail" data-id="${e.id}">
            <span class="event-mobile-num">${globalIdx + 1}</span>
            <span class="event-mobile-title" title="${e.judul_periode}">${e.judul_periode}</span>
          </div>
          <div class="event-mobile-actions">
            ${(isSuperadminOrDaerah && e.status === 'berjalan') ? `
              <button type="button" class="btn-event-icon-only btn-event-icon-edit btn-edit-event" data-id="${e.id}" title="Edit Periode">
                <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
              </button>
            ` : ''}
            <button type="button" class="btn-event-icon-only btn-event-icon-open btn-open-event" data-id="${e.id}" title="Isi Nilai Siswa">
              <span class="material-symbols-outlined" style="font-size:16px;">edit_square</span>
            </button>
            ${isSuperadminOrDaerah ? `
              <button type="button" class="btn-event-icon-only btn-event-icon-delete btn-delete-event" data-id="${e.id}" title="Hapus Periode">
                <span class="material-symbols-outlined" style="font-size:16px;">delete</span>
              </button>
            ` : ''}
            <button type="button" class="event-mobile-toggle-btn btn-toggle-event-detail" data-id="${e.id}" title="Rincian Periode">
              <span class="material-symbols-outlined event-mobile-chevron">expand_more</span>
            </button>
          </div>
        </div>
        <div class="event-mobile-detail">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <span style="background:${e.status === 'berjalan' ? 'var(--green-pastel)' : '#e2e8f0'};color:${e.status === 'berjalan' ? 'var(--green-dark)' : '#475569'};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800;">
              ${e.status === 'berjalan' ? '🟢 BERJALAN' : '🔒 SELESAI'}
            </span>
            <span style="font-size:11px;color:var(--blue);font-weight:700;">
              Total: ${totalMax} Poin (${e.habits.length} Pembiasaan)
            </span>
          </div>
          <div style="margin-top:4px;">
            ${habitsBadges}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h3 style="margin:0;font-size:14px;color:var(--text-main);">Daftar Periode Lembar Pembiasaan</h3>
          <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted);">
            ${isSuperadminOrDaerah
              ? 'Kelola target pembiasaan karakter dengan bobot nilai: Penting (maks 30 poin) dan Additional (maks 10 poin).'
              : 'Pilih periode pembiasaan yang sedang berjalan untuk mengisikan nilai harian generus caberawit di wilayah Anda.'}
          </p>
        </div>
        ${isSuperadminOrDaerah ? `
          <button id="btnCreateEvent" style="padding:8px 12px;background:var(--gold);color:#1a1d2e;border:none;border-radius:8px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;font-size:12px;">
            <span class="material-symbols-outlined" style="font-size:16px;">add_circle</span> Buat Event Baru
          </button>
        ` : ''}
      </div>

      <!-- 1. DESKTOP VIEW (Table) -->
      <div class="event-desktop-view" style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;min-width:600px;">
          <thead style="background:var(--surface-2);">
            <tr>
              <th style="padding:10px;border-bottom:2px solid var(--border);width:36px;text-align:center;">No</th>
              <th style="padding:10px;border-bottom:2px solid var(--border);">Judul Periode</th>
              <th style="padding:10px;border-bottom:2px solid var(--border);">Status</th>
              <th style="padding:10px;border-bottom:2px solid var(--border);">Target Pembiasaan &amp; Bobot</th>
              <th style="padding:10px;border-bottom:2px solid var(--border);text-align:right;">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${events.length ? eventRows : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted);">Belum ada event pembiasaan.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- 2. MOBILE VIEW (Accordion Cards) -->
      <div class="event-mobile-view">
        ${events.length ? eventMobileCards : `
          <div style="text-align:center;padding:24px 16px;background:var(--surface-2);border-radius:12px;color:var(--text-muted);">
            <p style="margin:0;font-size:13px;">Belum ada event pembiasaan.</p>
          </div>
        `}
      </div>

      <!-- 3. PAGINATION BAR -->
      <div class="pembiasaan-pagination">
        <div class="pembiasaan-page-info">
          Menampilkan ${events.length === 0 ? 0 : startIdx + 1} &ndash; ${Math.min(startIdx + eventItemsPerPage, events.length)} dari ${events.length} periode
        </div>
        ${buildPaginationHtml(currentEventPage, totalPages, 'btnPrevEventPage', 'btnNextEventPage', 'btn-event-page-num')}
      </div>
    </div>
  `;

  openModal(isSuperadminOrDaerah ? 'Kelola Lembar Pembiasaan' : 'Isi Nilai Lembar Pembiasaan', 'checklist', modalHtml, 'large');

  // Accordion toggle click listener for mobile
  document.querySelectorAll('.btn-toggle-event-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const card = document.querySelector(`.event-mobile-card[data-id="${id}"]`);
      if (card) card.classList.toggle('open');
    });
  });

  // Pagination navigation listeners
  document.getElementById('btnPrevEventPage')?.addEventListener('click', () => {
    if (currentEventPage > 1) renderEventPembiasaanModal(true, currentEventPage - 1);
  });
  document.getElementById('btnNextEventPage')?.addEventListener('click', () => {
    if (currentEventPage < totalPages) renderEventPembiasaanModal(true, currentEventPage + 1);
  });
  document.querySelectorAll('.btn-event-page-num').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = parseInt(e.currentTarget.dataset.page);
      if (p && p !== currentEventPage) renderEventPembiasaanModal(true, p);
    });
  });

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
          onConfirm: async () => {
            const res = await deleteEventPembiasaan(id);
            if (res.success) {
              showToast(`Event "${ev.judul_periode}" berhasil dihapus`, 'success');
              renderEventPembiasaanModal();
            } else {
              showToast(`Gagal: ${res.message || res.error}`, 'error');
            }
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


export function renderCreateEventForm(editEvent = null) {
  const isSuperadminOrDaerah = currentUser.isSuperadmin || currentUser.tingkatan === 'daerah';
  if (!isSuperadminOrDaerah) {
    showToast('Akses Ditolak: Fitur buat dan edit lembar pembiasaan hanya dapat diakses oleh Superadmin Daerah.', 'warning');
    return;
  }

  const isEdit = !!editEvent;
  const DEFAULT_ITEMS = [
    { name: "Tertib & Tenang Saat Pengajian", maxPoints: 30, type: 'penting' },
    { name: "Membaca PR no. 3", maxPoints: 30, type: 'penting' },
    { name: "Mencuci Piring", maxPoints: 10, type: 'additional' },
    { name: "Menjaga Adab Dalam Kamar Mandi", maxPoints: 10, type: 'additional' }
  ];

  let currentHabits = [];
  if (isEdit && Array.isArray(editEvent.habits) && editEvent.habits.length > 0) {
    const habitMax = getEventHabitMax(editEvent);
    currentHabits = editEvent.habits.map((h, i) => {
      const maxP = habitMax[i] || (i < 2 ? 30 : 10);
      let t = 'custom';
      if (maxP === 30) t = 'penting';
      else if (maxP === 10) t = 'additional';
      return { name: h, maxPoints: maxP, type: t };
    });
  } else {
    currentHabits = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
  }

  function calculateTotalMax() {
    return currentHabits.reduce((sum, h) => sum + (parseInt(h.maxPoints) || 0), 0);
  }

  function buildHabitsInputs(hList) {
    return hList.map((h, i) => `
      <div class="habit-item-row" data-row-idx="${i}" style="display:flex;flex-direction:column;gap:8px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:10px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="background:var(--blue);color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">${i + 1}</span>
          <input type="text" class="habit-input" data-idx="${i}" value="${(h.name || '').replace(/"/g, '&quot;')}" placeholder="Nama Pembiasaan (contoh: Sholat 5 Waktu berjamaah)" required style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:12.5px;outline:none;box-sizing:border-box;background:var(--surface);" />
          ${hList.length > 1 ? `
            <button type="button" class="btn-remove-habit" data-idx="${i}" title="Hapus pembiasaan ini" style="padding:6px 8px;background:#fef2f2;color:var(--red);border:1px solid #fecaca;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
            </button>
          ` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding-left:32px;flex-wrap:wrap;">
          <label style="font-size:11.5px;font-weight:700;color:var(--text-muted);">Jenis Bobot:</label>
          <select class="habit-type-select" data-idx="${i}" style="padding:5px 8px;border-radius:6px;border:1px solid var(--border);font-size:11.5px;font-weight:700;background:var(--surface);outline:none;cursor:pointer;">
            <option value="penting" ${h.type === 'penting' ? 'selected' : ''}>⭐ Penting (Maks 30 Poin)</option>
            <option value="additional" ${h.type === 'additional' ? 'selected' : ''}>➕ Additional (Maks 10 Poin)</option>
            <option value="custom" ${h.type === 'custom' ? 'selected' : ''}>⚙️ Kustom Angka...</option>
          </select>
          <div style="display:inline-flex;align-items:center;gap:4px;">
            <span style="font-size:11px;color:var(--text-muted);">Poin Maks:</span>
            <input type="number" min="1" max="100" class="habit-max-input" data-idx="${i}" value="${h.maxPoints || 30}" style="width:55px;padding:4px 6px;text-align:center;font-weight:800;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--surface);outline:none;" />
          </div>
        </div>
      </div>
    `).join('');
  }

  const PRESETS = [
    { name: "Tertib & Tenang Saat Pengajian", max: 30, type: 'penting' },
    { name: "Membaca PR no. 3", max: 30, type: 'penting' },
    { name: "Sholat 5 Waktu Berjamaah", max: 30, type: 'penting' },
    { name: "Hafalan Doa Sehari-hari", max: 30, type: 'penting' },
    { name: "Mencuci Piring", max: 10, type: 'additional' },
    { name: "Menjaga Adab Dalam Kamar Mandi", max: 10, type: 'additional' },
    { name: "Membantu Orang Tua", max: 10, type: 'additional' },
    { name: "Adab Berbicara Santun", max: 10, type: 'additional' }
  ];

  const presetsHtml = PRESETS.map(p => `
    <button type="button" class="habit-preset-chip" data-text="${p.name}" data-max="${p.max}" data-type="${p.type}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font-size:11px;cursor:pointer;">
      <span class="material-symbols-outlined" style="font-size:13px;color:var(--blue);">add</span>
      <span>${p.name}</span>
      <span class="habit-badge-pill ${p.type === 'penting' ? 'habit-badge-penting' : 'habit-badge-additional'}" style="font-size:8.5px;">${p.max}p</span>
    </button>
  `).join('');

  const formHtml = `
    <form id="formCreateEvent" style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
      <div style="background:var(--gold-light);padding:10px 14px;border-radius:8px;border-left:3px solid var(--gold);font-size:12px;line-height:1.5;">
        <strong>Aturan Penilaian Caberawit:</strong> Setiap pembiasaan memiliki bobot:
        <span class="habit-badge-pill habit-badge-penting">Penting (Maks 30)</span> dan 
        <span class="habit-badge-pill habit-badge-additional">Additional (Maks 10)</span>. 
        Poin maksimal ini ditentukan di sini dan otomatis menjadi batas skor saat pamong menginput nilai.
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-weight:700;">Daftar Pembiasaan (<span id="habitCountText">${currentHabits.length}</span> / 4)</label>
            <span id="eventTotalMaxBadge" style="font-size:11px;font-weight:800;background:var(--blue-light);color:var(--blue);padding:2px 8px;border-radius:12px;">
              Total Maks: ${calculateTotalMax()} Poin
            </span>
          </div>
          <button type="button" id="btnAddHabitRow" style="padding:5px 10px;background:var(--blue-light);color:var(--blue);border:1px solid var(--blue);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:15px;">add</span> Tambah Baris
          </button>
        </div>

        <div id="habitInputsContainer" style="display:flex;flex-direction:column;gap:10px;">
          ${buildHabitsInputs(currentHabits)}
        </div>
      </div>

      <div>
        <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:6px;">💡 Rekomendasi Target Pembiasaan (Klik untuk memasukkan):</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${presetsHtml}
        </div>
      </div>

      <!-- Sticky Actions Footer (Fixed docked at modal bottom) -->
      <div class="modal-sticky-footer">
        <button type="button" id="btnCancelCreateEvent" class="btn-sticky-back" title="Kembali ke Tabel">
          <span class="material-symbols-outlined">arrow_back</span>
          <span class="btn-text">Kembali ke Tabel</span>
        </button>
        <button type="submit" class="btn-sticky-save" title="${isEdit ? 'Simpan Perubahan' : 'Buat Event Pembiasaan'}">
          <span class="material-symbols-outlined">save</span>
          <span class="btn-text">${isEdit ? 'Simpan Perubahan' : 'Buat Event Pembiasaan'}</span>
        </button>
      </div>
    </form>
  `;

  openModal(isEdit ? 'Edit Event Pembiasaan' : 'Buat Event Pembiasaan Baru', 'add_task', formHtml, 'default');

  const container = document.getElementById('habitInputsContainer');
  const countText = document.getElementById('habitCountText');
  const totalMaxBadge = document.getElementById('eventTotalMaxBadge');

  function updateFormState() {
    if (countText) countText.textContent = currentHabits.length;
    if (totalMaxBadge) totalMaxBadge.textContent = `Total Maks: ${calculateTotalMax()} Poin`;
  }

  function attachHabitRowEvents() {
    container.querySelectorAll('.habit-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (currentHabits[idx]) currentHabits[idx].name = e.target.value;
      });
    });

    container.querySelectorAll('.habit-type-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const type = e.target.value;
        const maxInp = container.querySelector(`.habit-max-input[data-idx="${idx}"]`);
        if (type === 'penting') {
          currentHabits[idx].maxPoints = 30;
          currentHabits[idx].type = 'penting';
          if (maxInp) maxInp.value = 30;
        } else if (type === 'additional') {
          currentHabits[idx].maxPoints = 10;
          currentHabits[idx].type = 'additional';
          if (maxInp) maxInp.value = 10;
        } else {
          currentHabits[idx].type = 'custom';
        }
        updateFormState();
      });
    });

    container.querySelectorAll('.habit-max-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const val = parseInt(e.target.value) || 0;
        currentHabits[idx].maxPoints = val;
        const typeSel = container.querySelector(`.habit-type-select[data-idx="${idx}"]`);
        if (typeSel) {
          if (val === 30) typeSel.value = 'penting';
          else if (val === 10) typeSel.value = 'additional';
          else typeSel.value = 'custom';
        }
        updateFormState();
      });
    });

    container.querySelectorAll('.btn-remove-habit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        currentHabits.splice(idx, 1);
        if (currentHabits.length === 0) {
          currentHabits = [{ name: '', maxPoints: 30, type: 'penting' }];
        }
        container.innerHTML = buildHabitsInputs(currentHabits);
        updateFormState();
        attachHabitRowEvents();
      });
    });
  }

  attachHabitRowEvents();

  document.getElementById('btnAddHabitRow')?.addEventListener('click', () => {
    if (currentHabits.length >= 4) {
      showToast('Maksimal 4 daftar pembiasaan per periode!', 'warning');
      return;
    }
    const isNextPenting = currentHabits.length < 2;
    currentHabits.push({
      name: '',
      maxPoints: isNextPenting ? 30 : 10,
      type: isNextPenting ? 'penting' : 'additional'
    });
    container.innerHTML = buildHabitsInputs(currentHabits);
    updateFormState();
    attachHabitRowEvents();
    const newInputs = container.querySelectorAll('.habit-input');
    newInputs[newInputs.length - 1].focus();
  });

  document.querySelectorAll('.habit-preset-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const txt = e.currentTarget.dataset.text;
      const maxVal = parseInt(e.currentTarget.dataset.max) || 30;
      const typeVal = e.currentTarget.dataset.type || 'penting';

      let filled = false;
      for (let i = 0; i < currentHabits.length; i++) {
        if (!currentHabits[i].name.trim()) {
          currentHabits[i].name = txt;
          currentHabits[i].maxPoints = maxVal;
          currentHabits[i].type = typeVal;
          filled = true;
          break;
        }
      }

      if (!filled) {
        if (currentHabits.length < 4) {
          currentHabits.push({ name: txt, maxPoints: maxVal, type: typeVal });
        } else {
          showToast('Slot pembiasaan sudah penuh (4 item). Hapus atau edit salah satu item.', 'warning');
          return;
        }
      }

      container.innerHTML = buildHabitsInputs(currentHabits);
      updateFormState();
      attachHabitRowEvents();
    });
  });

  document.getElementById('btnCancelCreateEvent').addEventListener('click', renderEventPembiasaanModal);

  document.getElementById('formCreateEvent').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const judul = document.getElementById('evtJudul').value.trim();
    const validHabits = currentHabits.filter(h => h.name && h.name.trim().length > 0);

    if (!judul) return showToast('Judul periode wajib diisi!', 'warning');
    if (validHabits.length === 0) return showToast('Minimal satu pembiasaan harus diisi!', 'warning');

    const habitNames = validHabits.map(h => h.name.trim());
    const habitMaxes = validHabits.map(h => parseInt(h.maxPoints) || 10);

    const btnSubmit = ev.currentTarget.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size:18px;">sync</span> Menyimpan...';
    }

    if (isEdit) {
      const newStatus = document.getElementById('evtStatus')?.value || editEvent.status;
      const res = await updateEventPembiasaan(editEvent.id, {
        judul_periode: judul,
        status: newStatus,
        habits: habitNames,
        habit_max: habitMaxes
      });
      if (res.success) {
        showToast(`Periode pembiasaan "${judul}" berhasil diperbarui!`, 'success');
        renderEventPembiasaanModal();
      } else {
        showToast(`Gagal: ${res.error || res.message}`, 'error');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span> Simpan Perubahan';
        }
      }
    } else {
      const res = await addEventPembiasaan({
        judul_periode: judul,
        status: 'berjalan',
        habits: habitNames,
        habit_max: habitMaxes
      });
      if (res.success) {
        showToast(`Periode pembiasaan "${judul}" berhasil dibuat!`, 'success');
        renderEventPembiasaanModal();
      } else {
        showToast(`Gagal: ${res.error || res.message}`, 'error');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span> Buat Event Pembiasaan';
        }
      }
    }
  });
}

// Global Filter for Grid
let gridFilter = { desa: 'all', kelompok: 'all', search: '', kategori: 'caberawit' };

export async function openEditableGridEvent(eventId, skipSync = false) {
  if (!skipSync && isSupabaseConfigured()) {
    try {
      await syncPembiasaanFromSupabase();
    } catch (err) {
      console.warn('Gagal sinkron grid pembiasaan dari Supabase:', err);
    }
  }
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

  const habitMax = getEventHabitMax(event);
  const totalMaxScore = habitMax.reduce((a, b) => a + b, 0);

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
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <h4 style="margin:0;font-size:15px;font-weight:800;color:var(--text-main);">${event.judul_periode}</h4>
            <span style="background:${event.status === 'berjalan' ? '#dcfce7' : '#e2e8f0'};color:${event.status === 'berjalan' ? 'var(--green-dark)' : '#475569'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:800;">
              ${event.status === 'berjalan' ? '🟢 BERJALAN' : '🔒 SELESAI'}
            </span>
            <span style="font-size:11px;font-weight:800;background:var(--blue-light);color:var(--blue);padding:2px 8px;border-radius:12px;">
              Total Bobot: ${totalMaxScore} Poin
            </span>
          </div>
          <span style="font-size:12px;color:var(--text-muted);display:block;margin-top:2px;">Khusus Generus Caberawit (PAUD &ndash; SD)</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a href="../laporan/laporan-pembiasaan.html?event=${eventId}" target="_blank" style="text-decoration:none;padding:8px 12px;background:var(--blue-light);color:var(--blue);border:none;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:16px;">public</span> Laporan Publik
          </a>
          ${(isSuperadminOrDaerah && event.status === 'berjalan') ? `
            <button id="btnCloseEvent" style="padding:8px 12px;background:#fef2f2;color:var(--red);border:1px solid #fca5a5;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
              <span class="material-symbols-outlined" style="font-size:16px;">lock</span> Kunci &amp; Arsipkan
            </button>
          ` : ''}
          <button id="btnBackToEventList" style="padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">← Kembali</button>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;background:var(--bg);padding:12px;border-radius:10px;border:1px solid var(--border);">
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

      <!-- 1. DESKTOP SPREADSHEET TABLE VIEW (Layar Komputer / Tablet Lebar) -->
      <div class="pembiasaan-desktop-view" style="overflow:auto;border:1px solid var(--border);border-radius:10px;background:var(--surface);max-height:55vh;-webkit-overflow-scrolling:touch;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:620px;">
          <thead style="background:var(--surface-2);position:sticky;top:0;z-index:20;">
            <tr>
              <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:36px;">No</th>
              <th style="padding:10px 12px;border:1px solid var(--border);text-align:left;min-width:170px;position:sticky;left:0;background:var(--surface-2);z-index:22;box-shadow:2px 0 4px rgba(0,0,0,0.03);">Nama Generus</th>
              <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:65px;">Kelas</th>
              ${event.habits.map((h, i) => {
                const hMax = habitMax[i] || (i < 2 ? 30 : 10);
                const isPenting = hMax >= 30;
                return `
                  <th style="padding:8px 6px;border:1px solid var(--border);text-align:center;width:80px;" title="${h}">
                    <div style="font-weight:700;">H${i + 1}</div>
                    <span class="habit-badge-pill ${isPenting ? 'habit-badge-penting' : 'habit-badge-additional'}" style="margin-top:2px;">Maks ${hMax}</span>
                  </th>
                `;
              }).join('')}
              <th style="padding:10px 8px;border:1px solid var(--border);text-align:center;width:105px;">Total Capaian</th>
            </tr>
          </thead>
          <tbody id="gridTbody">
            <!-- Rendered by JS -->
          </tbody>
          <tfoot id="gridTfoot" class="pembiasaan-avg-row">
            <!-- Rendered by JS -->
          </tfoot>
        </table>
      </div>

      <!-- 2. MOBILE CARD VIEW (Khusus Layar Smartphone <= 768px) -->
      <div class="pembiasaan-mobile-view" id="mobileCardsContainer" style="max-height:60vh;overflow-y:auto;padding-right:2px;">
        <!-- Rendered by JS -->
      </div>

      <!-- 3. PAGINATION BAR FOR GRID / MOBILE CARDS -->
      <div id="gridPaginationContainer"></div>

      <!-- BOTTOM LEGEND & NOTE -->
      <div style="font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
        <div style="display:flex;flex-wrap:gap:8px;">
          ${event.habits.map((h, i) => {
            const hMax = habitMax[i] || (i < 2 ? 30 : 10);
            const isPenting = hMax >= 30;
            return `
              <span style="display:inline-flex;align-items:center;gap:3px;">
                <span class="habit-badge-pill ${isPenting ? 'habit-badge-penting' : 'habit-badge-additional'}">${isPenting ? 'Penting' : 'Add.'} (Maks ${hMax})</span>
                <strong>H${i + 1}:</strong> ${h}
              </span>
            `;
          }).join('')}
        </div>
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
    currentGridPage = 1;
    renderGridRows(event);
  });
  document.getElementById('gridFilterDesa').addEventListener('change', (e) => {
    gridFilter.desa = e.target.value;
    gridFilter.kelompok = 'all';
    currentGridPage = 1;
    openEditableGridEvent(eventId, true);
  });
  document.getElementById('gridFilterKelompok').addEventListener('change', (e) => {
    gridFilter.kelompok = e.target.value;
    currentGridPage = 1;
    renderGridRows(event);
  });

  renderGridRows(event);
}

let currentGridPage = 1;
const gridItemsPerPage = 10;

export function renderGridRows(event) {
  const tbody = document.getElementById('gridTbody');
  const tfoot = document.getElementById('gridTfoot');
  const mobContainer = document.getElementById('mobileCardsContainer');
  const pagContainer = document.getElementById('gridPaginationContainer');
  if (!tbody && !mobContainer) return;

  const allSiswa = getSiswaList();
  const allNilai = getNilaiPembiasaanList().filter(n => n.event_id === event.id);
  const isReadOnly = event.status === 'selesai';

  const habitMax = getEventHabitMax(event);
  const totalMaxScore = habitMax.reduce((a, b) => a + b, 0);

  const filtered = allSiswa.filter(s => {
    if (s.kategori_usia !== 'caberawit') return false;
    if (gridFilter.desa !== 'all' && s.desa_id !== gridFilter.desa) return false;
    if (gridFilter.kelompok !== 'all' && s.kelompok_id !== gridFilter.kelompok) return false;
    if (gridFilter.search && !s.nama_lengkap.toLowerCase().includes(gridFilter.search)) return false;
    return true;
  });

  if (filtered.length === 0) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="${4 + event.habits.length}" style="text-align:center;padding:24px;color:var(--text-muted);">Tidak ada siswa Caberawit yang sesuai filter.</td></tr>`;
    }
    if (tfoot) tfoot.innerHTML = '';
    if (mobContainer) {
      mobContainer.innerHTML = `
        <div style="text-align:center;padding:32px 16px;background:var(--surface-2);border-radius:12px;color:var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size:36px;color:var(--border);">person_search</span>
          <p style="font-size:13px;margin-top:6px;">Tidak ada siswa Caberawit yang sesuai filter.</p>
        </div>
      `;
    }
    if (pagContainer) pagContainer.innerHTML = '';
    return;
  }

  // Pagination calculation
  const gridTotalPages = Math.ceil(filtered.length / gridItemsPerPage) || 1;
  currentGridPage = Math.max(1, Math.min(currentGridPage, gridTotalPages));
  const startIdx = (currentGridPage - 1) * gridItemsPerPage;
  const pageSiswa = filtered.slice(startIdx, startIdx + gridItemsPerPage);

  // 1. RENDER DESKTOP ROWS
  if (tbody) {
    tbody.innerHTML = pageSiswa.map((s, idx) => {
      const globalIdx = startIdx + idx;
      const nilaiObj = allNilai.find(n => n.siswa_id === s.id);
      const nilais = nilaiObj ? nilaiObj.nilai : new Array(event.habits.length).fill(0);
      const total = nilais.reduce((a, b) => a + parseInt(b || 0), 0);
      const pct = totalMaxScore > 0 ? Math.round((total / totalMaxScore) * 1000) / 10 : 0;
      const pctColor = pct >= 75 ? 'var(--green-dark)' : (pct >= 50 ? '#d97706' : '#dc2626');

      let habitsHtml = '';
      for (let i = 0; i < event.habits.length; i++) {
        const hMax = habitMax[i] || (i < 2 ? 30 : 10);
        habitsHtml += `
          <td style="padding:4px;border:1px solid var(--border);text-align:center;">
            <input type="number" class="grid-input" data-siswa="${s.id}" data-index="${i}" min="0" max="${hMax}" inputmode="numeric" pattern="[0-9]*" value="${nilais[i] || 0}" ${isReadOnly ? 'disabled' : ''} style="width:100%;text-align:center;padding:7px 4px;border:1px solid transparent;border-radius:6px;outline:none;background:${isReadOnly ? 'transparent' : '#f8fafc'};font-weight:700;font-size:13px;box-sizing:border-box;" onfocus="this.select();this.style.border='1.5px solid var(--blue)';this.style.background='#fff';" onblur="this.style.border='1px solid transparent';this.style.background='${isReadOnly ? 'transparent' : '#f8fafc'}';" title="Maksimal ${hMax} poin">
          </td>
        `;
      }

      return `
        <tr>
          <td style="padding:8px;border:1px solid var(--border);text-align:center;color:var(--text-muted);font-size:11px;">${globalIdx + 1}</td>
          <td style="padding:8px 12px;border:1px solid var(--border);font-weight:600;position:sticky;left:0;background:var(--surface);z-index:10;box-shadow:2px 0 4px rgba(0,0,0,0.04);white-space:nowrap;">
            ${s.nama_lengkap}
            <span style="display:block;font-size:10px;color:var(--text-muted);font-weight:400;">Kel. ${s.kelompok_nama || '-'}</span>
          </td>
          <td style="padding:8px;border:1px solid var(--border);text-align:center;font-size:11px;">${s.jenjang_kelas}</td>
          ${habitsHtml}
          <td style="padding:8px;border:1px solid var(--border);text-align:center;" id="dt-total-${s.id}">
            <strong style="font-size:13px;color:var(--blue);">${total}</strong>
            <span style="font-size:10.5px;color:var(--text-muted);">/ ${totalMaxScore}</span>
            <div style="font-size:10.5px;font-weight:800;color:${pctColor};line-height:1.2;">${pct}%</div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. RENDER MOBILE CARDS (Hanya No, Nama, dan Tombol Dropdown yang memunculkan inputan nilai)
  if (mobContainer) {
    mobContainer.innerHTML = `
      <div id="mobSummaryBanner"></div>
      ${pageSiswa.map((s, idx) => {
        const globalIdx = startIdx + idx;
        const nilaiObj = allNilai.find(n => n.siswa_id === s.id);
        const nilais = nilaiObj ? nilaiObj.nilai : new Array(event.habits.length).fill(0);
        const total = nilais.reduce((a, b) => a + parseInt(b || 0), 0);
        const pct = totalMaxScore > 0 ? Math.round((total / totalMaxScore) * 1000) / 10 : 0;
        const pctClass = pct >= 75 ? 'badge-pct-good' : (pct >= 50 ? 'badge-pct-fair' : 'badge-pct-poor');

        const habitsMobileInputs = event.habits.map((h, i) => {
          const hMax = habitMax[i] || (i < 2 ? 30 : 10);
          const isPenting = hMax >= 30;
          return `
            <div class="pembiasaan-habit-input-cell">
              <div class="pembiasaan-habit-label-wrap">
                <span class="pembiasaan-habit-name" title="${h}">H${i + 1}: ${h}</span>
                <span class="habit-badge-pill ${isPenting ? 'habit-badge-penting' : 'habit-badge-additional'}">${isPenting ? 'Penting' : 'Add.'} (${hMax})</span>
              </div>
              <input type="number" class="pembiasaan-mobile-num-input grid-input" data-siswa="${s.id}" data-index="${i}" min="0" max="${hMax}" value="${nilais[i] || 0}" ${isReadOnly ? 'disabled' : ''} inputmode="numeric" />
            </div>
          `;
        }).join('');

        return `
          <div class="pembiasaan-student-card" data-siswa="${s.id}">
            <div class="pembiasaan-card-header btn-toggle-student-card" data-siswa="${s.id}">
              <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">
                <span class="event-mobile-num">${globalIdx + 1}</span>
                <div style="min-width:0;">
                  <div class="pembiasaan-card-title">${s.nama_lengkap}</div>
                  <div class="pembiasaan-card-sub">${s.jenjang_kelas} &bull; Kel. ${s.kelompok_nama || '-'}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <div class="pembiasaan-card-score-badge">
                  <div class="pembiasaan-card-total-val" id="mob-total-${s.id}">${total} / ${totalMaxScore}</div>
                  <span class="pembiasaan-card-pct-badge ${pctClass}" id="mob-pct-${s.id}">${pct}%</span>
                </div>
                <button type="button" class="event-mobile-toggle-btn" title="Buka/Tutup Input Nilai">
                  <span class="material-symbols-outlined pembiasaan-card-chevron">expand_more</span>
                </button>
              </div>
            </div>
            <div class="pembiasaan-card-habits-grid">
              ${habitsMobileInputs}
            </div>
          </div>
        `;
      }).join('')}
    `;

    // Dropdown toggle listener for student cards
    document.querySelectorAll('.btn-toggle-student-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sId = e.currentTarget.dataset.siswa;
        const card = document.querySelector(`.pembiasaan-student-card[data-siswa="${sId}"]`);
        if (card) card.classList.toggle('open');
      });
    });
  }

  // 3. RENDER PAGINATION
  if (pagContainer) {
    pagContainer.innerHTML = `
      <div class="pembiasaan-pagination">
        <div class="pembiasaan-page-info">
          Menampilkan ${filtered.length === 0 ? 0 : startIdx + 1} &ndash; ${Math.min(startIdx + gridItemsPerPage, filtered.length)} dari ${filtered.length} generus caberawit
        </div>
        ${buildPaginationHtml(currentGridPage, gridTotalPages, 'btnPrevGridPage', 'btnNextGridPage', 'btn-grid-page-num')}
      </div>
    `;

    document.getElementById('btnPrevGridPage')?.addEventListener('click', () => {
      if (currentGridPage > 1) {
        currentGridPage--;
        renderGridRows(event);
      }
    });
    document.getElementById('btnNextGridPage')?.addEventListener('click', () => {
      if (currentGridPage < gridTotalPages) {
        currentGridPage++;
        renderGridRows(event);
      }
    });
    document.querySelectorAll('.btn-grid-page-num').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const p = parseInt(e.currentTarget.dataset.page);
        if (p && p !== currentGridPage) {
          currentGridPage = p;
          renderGridRows(event);
        }
      });
    });
  }

  // 4. KALKULASI RATA-RATA FOOTER & MOBILE SUMMARY (Berdasarkan SEMUA filtered students)
  updateGroupAverages(event, habitMax, totalMaxScore, filtered);

  // 5. ATTACH REAL-TIME SYNC & AUTO-SAVE LISTENERS
  if (!isReadOnly) {
    document.querySelectorAll('.grid-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const siswaId = e.target.dataset.siswa;
        const habitIdx = parseInt(e.target.dataset.index);
        const maxVal = habitMax[habitIdx] || 100;

        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0;
        if (val > maxVal) val = maxVal;
        e.target.value = val;

        // Sinkronkan input pada tampilan desktop dan mobile jika sama-sama terpasang
        document.querySelectorAll(`.grid-input[data-siswa="${siswaId}"][data-index="${habitIdx}"]`).forEach(sibling => {
          if (sibling !== e.target) sibling.value = val;
        });

        // Kumpulkan nilai keseluruhan untuk siswa ini
        const studentNilais = new Array(event.habits.length).fill(0);
        for (let i = 0; i < event.habits.length; i++) {
          const matchInp = document.querySelector(`.grid-input[data-siswa="${siswaId}"][data-index="${i}"]`);
          studentNilais[i] = matchInp ? (parseInt(matchInp.value) || 0) : 0;
        }

        // Simpan ke memori & Supabase
        saveNilaiPembiasaan(event.id, siswaId, studentNilais);

        // Perbarui tampilan total & persentase siswa
        const total = studentNilais.reduce((a, b) => a + b, 0);
        const pct = totalMaxScore > 0 ? Math.round((total / totalMaxScore) * 1000) / 10 : 0;
        const pctColor = pct >= 75 ? 'var(--green-dark)' : (pct >= 50 ? '#d97706' : '#dc2626');
        const pctClass = pct >= 75 ? 'badge-pct-good' : (pct >= 50 ? 'badge-pct-fair' : 'badge-pct-poor');

        // Update Desktop
        const dtTotal = document.getElementById(`dt-total-${siswaId}`);
        if (dtTotal) {
          dtTotal.innerHTML = `
            <strong style="font-size:13px;color:var(--blue);">${total}</strong>
            <span style="font-size:10.5px;color:var(--text-muted);">/ ${totalMaxScore}</span>
            <div style="font-size:10.5px;font-weight:800;color:${pctColor};line-height:1.2;">${pct}%</div>
          `;
        }

        // Update Mobile
        const mobTotal = document.getElementById(`mob-total-${siswaId}`);
        if (mobTotal) mobTotal.textContent = `${total} / ${totalMaxScore}`;
        const mobPct = document.getElementById(`mob-pct-${siswaId}`);
        if (mobPct) {
          mobPct.textContent = `${pct}%`;
          mobPct.className = `pembiasaan-card-pct-badge ${pctClass}`;
        }

        // Visual flash feedback
        e.target.style.borderColor = 'var(--green-dark)';
        setTimeout(() => {
          e.target.style.borderColor = '';
        }, 800);

        const indicator = document.getElementById('gridSaveIndicator');
        if (indicator) {
          indicator.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;margin-right:3px;color:var(--green-dark);">check_circle</span> <span style="color:var(--green-dark);">Tersimpan!</span>';
          setTimeout(() => {
            indicator.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;margin-right:3px;">cloud_done</span> Auto-save Aktif';
          }, 1400);
        }

        // Perbarui rata-rata kelompok
        updateGroupAverages(event, habitMax, totalMaxScore, filtered);
      });
    });
  }
}

function updateGroupAverages(event, habitMax, totalMaxScore, filteredStudents = null) {
  const allSiswa = filteredStudents || getSiswaList().filter(s => {
    if (s.kategori_usia !== 'caberawit') return false;
    if (gridFilter.desa !== 'all' && s.desa_id !== gridFilter.desa) return false;
    if (gridFilter.kelompok !== 'all' && s.kelompok_id !== gridFilter.kelompok) return false;
    if (gridFilter.search && !s.nama_lengkap.toLowerCase().includes(gridFilter.search)) return false;
    return true;
  });

  const count = allSiswa.length;
  if (count === 0) return;

  const allNilai = getNilaiPembiasaanList().filter(n => n.event_id === event.id);
  const habitSums = new Array(event.habits.length).fill(0);
  let grandTotal = 0;

  allSiswa.forEach(s => {
    const nilaiObj = allNilai.find(n => n.siswa_id === s.id);
    const nilais = nilaiObj ? nilaiObj.nilai : [];
    for (let i = 0; i < event.habits.length; i++) {
      const inp = document.querySelector(`.grid-input[data-siswa="${s.id}"][data-index="${i}"]`);
      const val = inp ? (parseInt(inp.value) || 0) : (parseInt(nilais[i] || 0));
      habitSums[i] += val;
      grandTotal += val;
    }
  });

  const habitAverages = habitSums.map(sum => (sum / count).toFixed(1));
  const avgTotal = (grandTotal / count).toFixed(1);
  const avgPct = totalMaxScore > 0 ? ((grandTotal / (count * totalMaxScore)) * 100).toFixed(1) : 0;
  const avgPctColor = avgPct >= 75 ? 'var(--green-dark)' : (avgPct >= 50 ? '#d97706' : '#dc2626');

  // 1. Update Desktop Footer
  const tfoot = document.getElementById('gridTfoot');
  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td colspan="3" style="padding:10px 12px;border:1px solid var(--border);text-align:left;font-weight:800;">
          Rata-rata Kelompok (${count} Siswa)
        </td>
        ${habitAverages.map((avg, i) => `
          <td style="padding:8px 6px;border:1px solid var(--border);text-align:center;font-weight:800;color:var(--text);">
            <div>${avg}</div>
            <span style="font-size:9.5px;color:var(--text-muted);font-weight:600;">/ ${habitMax[i]}</span>
          </td>
        `).join('')}
        <td style="padding:8px;border:1px solid var(--border);text-align:center;">
          <div style="font-weight:800;color:var(--blue);font-size:13px;">${avgTotal} <span style="font-size:10px;color:var(--text-muted);font-weight:600;">/ ${totalMaxScore}</span></div>
          <div style="font-size:11px;font-weight:800;color:${avgPctColor};">${avgPct}%</div>
        </td>
      </tr>
    `;
  }

  // 2. Update Mobile Summary Banner
  const mobSummary = document.getElementById('mobSummaryBanner');
  if (mobSummary) {
    mobSummary.innerHTML = `
      <div class="pembiasaan-mobile-summary-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:800;letter-spacing:0.3px;opacity:0.9;">📊 RATA-RATA KELOMPOK (${count} SISWA)</span>
          <span style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:800;">
            ${avgPct}% Capaian
          </span>
        </div>
        <div style="font-size:18px;font-weight:800;">
          ${avgTotal} <span style="font-size:13px;opacity:0.8;">/ ${totalMaxScore} Poin</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:11px;opacity:0.9;border-top:1px solid rgba(255,255,255,0.2);padding-top:6px;margin-top:2px;">
          ${habitAverages.map((avg, i) => `
            <span>H${i + 1}: <strong>${avg}</strong>/${habitMax[i]}</span>
          `).join('&bull; ')}
        </div>
      </div>
    `;
  }
}
