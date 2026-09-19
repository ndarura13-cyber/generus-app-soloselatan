/* ═══════════════════════════════════════════════════════════════
   dashboard-supabase.js — Supabase Cloud Integration & Modal
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
  fetchSiswaFromSupabase,
  upsertSiswaToSupabase
} from '../../src/supabase.js';

import { getSiswaList } from '../../src/db-master.js';
import { openModal, closeModal, showToast, modalBody } from './dashboard-common.js';

export function updateSupabaseStatusUI() {
  const dot = document.getElementById('supabaseStatusDot');
  const txt = document.getElementById('supabaseStatusText');
  const btn = document.getElementById('btnSupabaseStatus');
  if (!txt) return;

  if (isSupabaseConfigured()) {
    txt.textContent = 'Supabase Aktif';
    if (btn) {
      btn.classList.remove('status-disconnected');
      btn.classList.add('status-connected');
      btn.removeAttribute('style');
    }
  } else {
    txt.textContent = 'Supabase Off';
    if (btn) {
      btn.classList.remove('status-connected');
      btn.classList.add('status-disconnected');
      btn.removeAttribute('style');
    }
  }
}

export function renderSupabaseModal(onDataSynced = null) {
  const cfg = getSupabaseConfig();
  const isConfigured = isSupabaseConfigured();

  openModal('Integrasi Supabase Cloud Database', 'cloud_sync', 'default');

  modalBody.innerHTML = `
    <div class="sb-modal-body">
      <div class="sb-status-banner ${isConfigured ? 'configured' : 'not-configured'}">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-outlined" style="font-size:20px;">${isConfigured ? 'cloud_done' : 'cloud_off'}</span>
          <span class="sb-banner-title">Status: ${isConfigured ? 'Kredensial Supabase Terpasang' : 'Belum Terhubung ke Supabase Cloud (Menggunakan Database Lokal)'}</span>
        </div>
        <p class="sb-banner-desc">
          ${isConfigured
      ? 'Aplikasi telah memiliki konfigurasi Supabase. Anda dapat menguji koneksi dan melakukan sinkronisasi data generus kapan saja.'
      : 'Untuk menghubungkan skema database ke Supabase, buat project di <a href="https://supabase.com" target="_blank" style="font-weight:800;text-decoration:underline;">supabase.com</a>, jalankan script database_schema.sql di SQL Editor, lalu masukkan Project URL dan Anon Key di bawah ini.'}
        </p>
      </div>

      <form id="formSupabaseConfig" style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label class="sb-field-label">Project URL Supabase <span style="color:red">*</span></label>
          <input type="url" id="sbProjectUrl" class="sb-field-input" value="${cfg.url || ''}" placeholder="https://xyzcompany.supabase.co" required />
          <div class="sb-field-hint">Ditemukan di dashboard Supabase: Project Settings ➔ API ➔ Project URL</div>
        </div>

        <div>
          <label class="sb-field-label">Project API Anon Key (Public Key) <span style="color:red">*</span></label>
          <textarea id="sbAnonKey" class="sb-field-input" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." required style="font-family:monospace;font-size:11.5px;">${cfg.anonKey || ''}</textarea>
          <div class="sb-field-hint">Ditemukan di dashboard Supabase: Project Settings ➔ API ➔ Project API Keys (anon public)</div>
        </div>

        <div id="sbTestResult" class="sb-test-alert" style="display:none;"></div>

        <!-- Tombol Aksi -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">
          <button type="button" id="btnTestSupabaseConn" class="sb-btn-test">
            <span class="material-symbols-outlined" style="font-size:18px;">network_check</span>
            Uji Koneksi
          </button>
          <button type="submit" class="sb-btn-save">
            <span class="material-symbols-outlined" style="font-size:18px;">save</span>
            Simpan Kredensial
          </button>
        </div>
      </form>

      ${isConfigured ? `
        <div class="sb-sync-section">
          <div class="sb-sync-title">
            <span class="material-symbols-outlined" style="font-size:18px;">sync</span>
            Sinkronisasi Data Generus
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <button type="button" id="btnUploadSiswaToCloud" class="sb-btn-upload">
              <span class="material-symbols-outlined" style="font-size:16px;">cloud_upload</span>
              Unggah Lokal ke Cloud
            </button>
            <button type="button" id="btnDownloadSiswaFromCloud" class="sb-btn-download">
              <span class="material-symbols-outlined" style="font-size:16px;">cloud_download</span>
              Tarik Data Cloud ke Lokal
            </button>
          </div>
        </div>
      ` : ''}

      <div class="sb-tips-box">
        💡 <strong>Tips Skema:</strong> File script SQL lengkap siap pakai tersimpan di <code class="sb-tips-code">src/database_schema.sql</code>. Anda hanya perlu menyalin dan menempelkannya di menu <strong>SQL Editor</strong> Supabase lalu klik tombol <strong>Run</strong>.
      </div>
    </div>
  `;

  // Listeners inside modal
  const form = document.getElementById('formSupabaseConfig');
  const btnTest = document.getElementById('btnTestSupabaseConn');
  const testRes = document.getElementById('sbTestResult');

  btnTest?.addEventListener('click', async () => {
    const url = document.getElementById('sbProjectUrl').value.trim();
    const anonKey = document.getElementById('sbAnonKey').value.trim();
    if (!url || !anonKey) {
      testRes.style.display = 'block';
      testRes.className = 'sb-test-alert alert-error';
      testRes.textContent = 'Silakan isi Project URL dan Anon Key terlebih dahulu!';
      return;
    }

    saveSupabaseConfig({ url, anonKey });
    testRes.style.display = 'block';
    testRes.className = 'sb-test-alert alert-info';
    testRes.textContent = 'Sedang menguji koneksi ke Supabase...';

    const res = await testSupabaseConnection();
    if (res.success) {
      testRes.className = 'sb-test-alert alert-success';
      testRes.textContent = `✅ ${res.message}`;
      showToast('Koneksi Supabase Berhasil!', 'success');
      updateSupabaseStatusUI();
    } else {
      testRes.className = 'sb-test-alert alert-error';
      testRes.textContent = `❌ ${res.message}`;
      showToast('Gagal menghubungi Supabase.', 'danger');
    }
  });


  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('sbProjectUrl').value.trim();
    const anonKey = document.getElementById('sbAnonKey').value.trim();

    const res = saveSupabaseConfig({ url, anonKey });
    if (res.success) {
      showToast('Kredensial Supabase berhasil disimpan & dihubungkan!', 'success');
      updateSupabaseStatusUI();
      closeModal();
    } else {
      showToast('Gagal menyimpan kredensial Supabase.', 'danger');
    }
  });

  document.getElementById('btnUploadSiswaToCloud')?.addEventListener('click', async () => {
    const list = getSiswaList();
    if (list.length === 0) return showToast('Belum ada data generus lokal untuk diunggah.', 'warning');

    showToast(`Mengunggah ${list.length} generus ke Supabase...`, 'info');
    const res = await upsertSiswaToSupabase(list);
    if (res.success) {
      showToast(`Berhasil mengunggah ${list.length} data generus ke Supabase Cloud!`, 'success');
    } else {
      showToast(`Gagal mengunggah ke Supabase: ${res.error}`, 'danger');
    }
  });

  document.getElementById('btnDownloadSiswaFromCloud')?.addEventListener('click', async () => {
    showToast('Mengambil data dari Supabase...', 'info');
    const res = await fetchSiswaFromSupabase();
    if (res.success) {
      if (res.data.length > 0) {
        localStorage.setItem('ppg_siswa_list_v1', JSON.stringify(res.data));
        showToast(`Berhasil menyinkronkan ${res.data.length} data generus dari Cloud!`, 'success');
        if (typeof onDataSynced === 'function') onDataSynced();
      } else {
        showToast('Data di tabel siswa Supabase masih kosong.', 'info');
      }
    } else {
      showToast(`Gagal mengambil data dari Supabase: ${res.error}`, 'danger');
    }
  });
}
