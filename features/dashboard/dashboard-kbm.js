/* ═══════════════════════════════════════════════════════════════
   dashboard-kbm.js — Kegiatan Belajar Mengajar & Rekap Kehadiran
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  MASTER_WILAYAH,
  getAllKelompok,
  getKbmEvents,
  getKbmEventById,
  saveKbmEvent,
  deleteKbmEvent,
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
      window.open(`../laporan/cetak-absensi.html?eventId=${encodeURIComponent(evId)}`, '_blank');
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
      window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(evId)}`, '_blank');
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

      const targetUrl = `../laporan/cetak-absensi.html?jenjang=${encodeURIComponent(jenjangVal)}&desa=${encodeURIComponent(desaVal)}&kelompok=${encodeURIComponent(kelVal)}&gender=${encodeURIComponent(genderVal)}&judul=${encodeURIComponent(judulVal)}&bulan=${encodeURIComponent(bulanVal)}&tahun=${encodeURIComponent(tahunVal)}&urutan=${encodeURIComponent(urutanVal)}&baris=${encodeURIComponent(barisVal)}`;
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
      const targetUrl = `../laporan/cetak-absensi.html?eventId=${encodeURIComponent(newEvent.id)}&jenjang=${encodeURIComponent(jenjangVal)}&desa=${encodeURIComponent(desaVal)}&kelompok=${encodeURIComponent(kelVal)}&gender=${encodeURIComponent(genderVal)}&judul=${encodeURIComponent(judulVal)}&bulan=${encodeURIComponent(bulanVal)}&tahun=${encodeURIComponent(tahunVal)}&urutan=${encodeURIComponent(urutanVal)}&baris=${encodeURIComponent(barisVal)}`;
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
    window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(event.id)}`, '_blank');
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
    window.open(`../laporan/laporan-kehadiran.html?eventId=${encodeURIComponent(saved.id)}`, '_blank');
    renderCetakAbsensiModal('event_list');
  });
}

