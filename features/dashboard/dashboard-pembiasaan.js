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
  getSiswaList
} from '../../src/db-master.js';

import {
  currentUser,
  openModal,
  closeModal,
  showToast,
  showConfirmModal,
  modalBody
} from './dashboard-common.js';

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT PEMBIASAAN MODULE
   ═══════════════════════════════════════════════════════════════════════════ */

let currentEventId = null;

export function renderEventPembiasaanModal() {
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
        <button type="button" id="btnCancelCreateEvent" style="flex:1;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-weight:700;cursor:pointer;">← Batal</button>
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

  document.getElementById('formCreateEvent').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const judul = document.getElementById('evtJudul').value.trim();
    const habitInputEls = document.querySelectorAll('.habit-input');
    const newHabits = Array.from(habitInputEls).map(el => el.value.trim()).filter(v => v.length > 0);

    if (!judul) return showToast('Judul periode wajib diisi!', 'warning');
    if (newHabits.length === 0) return showToast('Minimal satu pembiasaan harus diisi!', 'warning');

    const btnSubmit = ev.currentTarget.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> Menyimpan...';

    if (isEdit) {
      const newStatus = document.getElementById('evtStatus')?.value || editEvent.status;
      const res = await updateEventPembiasaan(editEvent.id, {
        judul_periode: judul,
        status: newStatus,
        habits: newHabits
      });
      if (res.success) {
        showToast(`Periode pembiasaan "${judul}" berhasil diperbarui!`, 'success');
        renderEventPembiasaanModal();
      } else {
        showToast(`Gagal: ${res.error || res.message}`, 'error');
        if (btnSubmit) btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span> Simpan Perubahan';
      }
    } else {
      const res = await addEventPembiasaan({
        judul_periode: judul,
        status: 'berjalan',
        habits: newHabits
      });
      if (res.success) {
        showToast(`Periode pembiasaan "${judul}" berhasil dibuat!`, 'success');
        renderEventPembiasaanModal();
      } else {
        showToast(`Gagal: ${res.error || res.message}`, 'error');
        if (btnSubmit) btnSubmit.innerHTML = '<span class="material-symbols-outlined">save</span> Buat Event Pembiasaan';
      }
    }
  });
}

// Global Filter for Grid
let gridFilter = { desa: 'all', kelompok: 'all', search: '', kategori: 'caberawit' };

export function openEditableGridEvent(eventId) {
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
            <span style="background:${event.status === 'berjalan' ? '#dcfce7;color:var(--green-dark)' : '#e2e8f0;color:var(--text-muted)'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:800;">
              ${event.status === 'berjalan' ? '🟢 BERJALAN' : '🔒 TERKUNCI / SELESAI'}
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

      <!-- GRID CONTAINER DENGAN PINNED / STICKY NAMA GENERUS -->
      <div style="overflow:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface);max-height:55vh;-webkit-overflow-scrolling:touch;">
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

export function renderGridRows(event) {
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
        <td style="padding:8px 12px;border:1px solid var(--border);font-weight:600;position:sticky;left:0;background:var(--surface);z-index:10;box-shadow:2px 0 4px rgba(0,0,0,0.04);white-space:nowrap;">
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

        // Save asynchronously
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
