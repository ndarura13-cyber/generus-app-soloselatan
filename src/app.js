/* ═══════════════════════════════════════════════════════════════
   app.js — PPG Solo Selatan Landing Page
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import { getProkerList, getSiswaList, MASTER_WILAYAH } from './db-master.js';

/* ── 0. SPLASH LOADING SCREEN ─────────────────────────────── */
(function setupLoadingScreen() {
  const splash = document.createElement('div');
  splash.className = 'loading-screen';
  splash.id = 'loadingScreen';
  splash.innerHTML = `
    <div class="loading-logo-box">
      <img src="image/icon-192.png" alt="Logo PPG Solo Selatan" />
    </div>
    <div class="loading-title">PPG Solo Selatan</div>
    <div class="loading-sub">Mewujudkan Generasi Penerus yang Faham Agama dan Memiliki 29 Karakter Luhur</div>
    <div class="loading-bar"><div class="loading-fill"></div></div>
  `;
  document.body.prepend(splash);

  const hideSplash = () => {
    setTimeout(() => {
      splash.classList.add('hidden');
      setTimeout(() => {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 600);
    }, 1100);
  };

  if (document.readyState === 'complete') {
    hideSplash();
  } else {
    window.addEventListener('load', hideSplash);
    setTimeout(hideSplash, 1800);
  }
})();

/* ── 1. NAVBAR SCROLL EFFECT ──────────────────────────────── */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  highlightActiveNav();
}, { passive: true });

/* ── 2. SMOOTH NAV HIGHLIGHT ──────────────────────────────── */
const sections = document.querySelectorAll('section[id]');

function highlightActiveNav() {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) current = section.id;
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}` || link.dataset.section === current) {
      link.classList.add('active');
    }
  });
}

/* ── (Hamburger and Session logic moved directly to index.html for instant load) ── */

/* ── 5. SCROLL REVEAL (IntersectionObserver) ──────────────── */
const revealEls = document.querySelectorAll('.reveal, .reveal-right');

if ('IntersectionObserver' in window) {
  document.body.classList.add('js-ready');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay ? parseInt(entry.target.dataset.delay) : 0;
          setTimeout(() => entry.target.classList.add('visible'), delay);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.04, rootMargin: '0px 0px 40px 0px' }
  );

  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Fallback instan untuk elemen yang sudah ada di viewport saat load
requestAnimationFrame(() => {
  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('visible');
    }
  });
});

/* ── 6. ANIMATED STATS COUNTER ────────────────────────────── */
const counters = document.querySelectorAll('.stat-num[data-target]');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1600;
  const start = performance.now();

  function update(ts) {
    const elapsed = ts - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('id-ID');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

counters.forEach(el => countObserver.observe(el));

/* ── 7. PROGRAM KERJA DATA & RENDER (TERINTEGRASI DATABASE) ── */
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT', 'SEP', 'OKT', 'NOV', 'DES'];
const now = new Date();

const currentMonthEl = document.getElementById('currentMonth');
const currentYearEl = document.getElementById('currentYear');

if (currentMonthEl) currentMonthEl.textContent = months[now.getMonth()];
if (currentYearEl) currentYearEl.textContent = now.getFullYear();

function getStatusLabel(status) {
  switch (status) {
    case 'done': return 'Selesai';
    case 'ongoing': return 'Sedang Berlangsung';
    case 'upcoming': return 'Akan Datang';
    case 'planned':
    default: return 'Direncanakan';
  }
}

let currentProkerPage = 1;
const prokerItemsPerPage = 5;

function renderProker() {
  const list = document.getElementById('prokerList');
  const paginationContainer = document.getElementById('prokerPagination');
  if (!list) return;

  const prokerData = getProkerList();
  const totalPages = Math.ceil(prokerData.length / prokerItemsPerPage);
  
  // Ensure current page is valid
  if (currentProkerPage > totalPages) currentProkerPage = totalPages;
  if (currentProkerPage < 1) currentProkerPage = 1;

  const startIndex = (currentProkerPage - 1) * prokerItemsPerPage;
  const endIndex = startIndex + prokerItemsPerPage;
  const currentData = prokerData.slice(startIndex, endIndex);

  list.innerHTML = currentData.map((item, index) => {
    const globalIndex = startIndex + index + 1;
    const statusClass = item.status || 'planned';
    const statusLabel = getStatusLabel(statusClass);
    const tempatHtml = item.tempat ? `
      <span class="proker-meta-sep">&bull;</span>
      <span class="proker-meta-item">
        <span class="material-symbols-outlined ms-proker-ic">location_on</span>
        <span>${item.tempat}</span>
      </span>
    ` : '';
    const tujuanHtml = item.tujuan ? `
      <div class="proker-tujuan-box">
        <strong>Tujuan:</strong> ${item.tujuan}
      </div>
    ` : '';

    return `
      <div class="proker-item">
        <div class="proker-dot ${statusClass}"></div>
        <div class="proker-content">
          <div class="proker-row-header">
            <div class="proker-title">
              <span style="color:var(--blue);margin-right:4px;">${item.no || globalIndex}.</span> ${item.kegiatan}
            </div>
            <span class="proker-status-badge ${statusClass}">
              <span class="dot ${statusClass}"></span>
              <span>${statusLabel}</span>
            </span>
          </div>
          <div class="proker-meta">
            <span class="proker-meta-item">
              <span class="material-symbols-outlined ms-proker-ic">calendar_today</span>
              <span>${item.waktu}</span>
            </span>
            ${tempatHtml}
            <span class="proker-meta-sep">&bull;</span>
            <span class="proker-meta-item">
              <span class="material-symbols-outlined ms-proker-ic">group</span>
              <span>${item.sasaran}</span>
            </span>
          </div>
          ${tujuanHtml}
        </div>
      </div>
    `;
  }).join('');

  if (paginationContainer) {
    if (totalPages > 1) {
      let dotsHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        dotsHtml += `<button class="page-dot ${i === currentProkerPage ? 'active' : ''}" data-page="${i}" aria-label="Page ${i}"></button>`;
      }
      paginationContainer.innerHTML = `
        <button class="page-nav prev" ${currentProkerPage === 1 ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_left</span></button>
        <div class="page-dots">${dotsHtml}</div>
        <button class="page-nav next" ${currentProkerPage === totalPages ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_right</span></button>
      `;

      // Bind events
      paginationContainer.querySelectorAll('.page-dot').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentProkerPage = parseInt(e.target.dataset.page);
          renderProker();
        });
      });
      paginationContainer.querySelector('.prev').addEventListener('click', () => {
        if (currentProkerPage > 1) {
          currentProkerPage--;
          renderProker();
        }
      });
      paginationContainer.querySelector('.next').addEventListener('click', () => {
        if (currentProkerPage < totalPages) {
          currentProkerPage++;
          renderProker();
        }
      });
    } else {
      paginationContainer.innerHTML = '';
    }
  }
}

renderProker();

/* ── 7. POPUP DETAIL JENJANG GENERUS PER DESA (A-Z) ───────── */
let KATEGORI_GENERUS_DATA = {};

function normalizeKelas(cls) {
  if (!cls) return null;
  const c = cls.trim();
  // Karena sekarang setiap jenjang punya pil spesifik, kita return apa adanya asalkan ada di map
  return c;
}

function initGenerusStats() {
  const siswaList = getSiswaList();
  
  KATEGORI_GENERUS_DATA = {
    'PAUD': { name: 'PAUD (Pendidikan Anak Usia Dini)', tier: 'Caberawit', icon: 'toys', color: '#d4a017', total: 0, usia: '3 – 4 Tahun', desa: [] },
    'TK A': { name: 'Taman Kanak-Kanak A', tier: 'Caberawit', icon: 'palette', color: '#d4a017', total: 0, usia: '5 Tahun', desa: [] },
    'TK B': { name: 'Taman Kanak-Kanak B', tier: 'Caberawit', icon: 'palette', color: '#d4a017', total: 0, usia: '6 Tahun', desa: [] },
    '1 SD': { name: 'Kelas 1 SD', tier: 'Caberawit', icon: 'menu_book', color: '#d4a017', total: 0, usia: '7 Tahun', desa: [] },
    '2 SD': { name: 'Kelas 2 SD', tier: 'Caberawit', icon: 'menu_book', color: '#d4a017', total: 0, usia: '8 Tahun', desa: [] },
    '3 SD': { name: 'Kelas 3 SD', tier: 'Caberawit', icon: 'menu_book', color: '#d4a017', total: 0, usia: '9 Tahun', desa: [] },
    '4 SD': { name: 'Kelas 4 SD', tier: 'Caberawit', icon: 'menu_book', color: '#d4a017', total: 0, usia: '10 Tahun', desa: [] },
    '5 SD': { name: 'Kelas 5 SD', tier: 'Caberawit', icon: 'menu_book', color: '#d4a017', total: 0, usia: '11 Tahun', desa: [] },
    '6 SD': { name: 'Kelas 6 SD', tier: 'Caberawit', icon: 'menu_book', color: '#d4a017', total: 0, usia: '12 Tahun', desa: [] },
    '1 SMP': { name: 'Kelas 1 SMP / Kelas 7', tier: 'GP Reguler', icon: 'school', color: '#1a56c4', total: 0, usia: '13 Tahun', desa: [] },
    '2 SMP': { name: 'Kelas 2 SMP / Kelas 8', tier: 'GP Reguler', icon: 'school', color: '#1a56c4', total: 0, usia: '14 Tahun', desa: [] },
    '3 SMP': { name: 'Kelas 3 SMP / Kelas 9', tier: 'GP Reguler', icon: 'school', color: '#1a56c4', total: 0, usia: '15 Tahun', desa: [] },
    '1 SMA': { name: 'Kelas 1 SMA / Kelas 10', tier: 'GP Reguler', icon: 'history_edu', color: '#1a56c4', total: 0, usia: '16 Tahun', desa: [] },
    '2 SMA': { name: 'Kelas 2 SMA / Kelas 11', tier: 'GP Reguler', icon: 'history_edu', color: '#1a56c4', total: 0, usia: '17 Tahun', desa: [] },
    '3 SMA': { name: 'Kelas 3 SMA / Kelas 12', tier: 'GP Reguler', icon: 'history_edu', color: '#1a56c4', total: 0, usia: '18 Tahun', desa: [] },
    'Pra-Nikah': { name: 'Bimbingan Pra-Nikah', tier: 'Remaja', icon: 'favorite', color: '#2e8b57', total: 0, usia: '19 – 22 Tahun', desa: [] },
    'Kelas Remaja': { name: 'Kelas Remaja', tier: 'Remaja & Mandiri', icon: 'groups', color: '#2e8b57', total: 0, usia: '> 22 Tahun', desa: [] },
    'Mahasiswa': { name: 'Status Mahasiswa', tier: 'Remaja / Pra-Nikah', icon: 'school', color: '#2e8b57', total: 0, usia: '19+ Tahun', desa: [] },
    'Bekerja': { name: 'Status Bekerja', tier: 'Remaja / Pra-Nikah', icon: 'work', color: '#2e8b57', total: 0, usia: '19+ Tahun', desa: [] },
    'Lainnya': { name: 'Status Lainnya', tier: 'Remaja / Pra-Nikah', icon: 'more_horiz', color: '#2e8b57', total: 0, usia: '19+ Tahun', desa: [] },
    'caberawit': { name: 'Kategori Caberawit (PAUD - SD)', tier: 'Jenjang Usia Dini', icon: 'child_care', color: '#d4a017', total: 0, usia: 'PAUD, TK & SD (3 – 12 Tahun)', desa: [] },
    'gp_reguler': { name: 'Kategori GP Reguler (SMP - SMA)', tier: 'Jenjang Usia Sekolah', icon: 'school', color: '#1a56c4', total: 0, usia: 'Kelas 1–3 SMP & 1–3 SMA (13 – 18 Tahun)', desa: [] },
    'remaja': { name: 'Kategori Remaja & Pra-Nikah', tier: 'Jenjang Pra-Nikah & Mandiri', icon: 'diversity_3', color: '#2e8b57', total: 0, usia: '19 – 22+ Tahun', desa: [] },
    'all': { name: 'Ringkasan Generus Solo Selatan', tier: 'Semua Jenjang & Kategori', icon: 'groups', color: '#1a56c4', total: 0, usia: '3 – 25+ Tahun', desa: [] }
  };

  // Init desa array for each key
  Object.keys(KATEGORI_GENERUS_DATA).forEach(key => {
    MASTER_WILAYAH.desa.forEach(d => {
      KATEGORI_GENERUS_DATA[key].desa.push({ id: d.id, nama: d.nama, total: 0, kelompokRaw: {} });
    });
  });

  const addCount = (k, desa, kel) => {
    if (!k || !KATEGORI_GENERUS_DATA[k]) return;
    KATEGORI_GENERUS_DATA[k].total++;
    const dObj = KATEGORI_GENERUS_DATA[k].desa.find(d => d.id === desa);
    if (dObj) {
      dObj.total++;
      dObj.kelompokRaw[kel] = (dObj.kelompokRaw[kel] || 0) + 1;
    }
  };

  siswaList.forEach(s => {
    const normKls = normalizeKelas(s.jenjang_kelas);
    const cat = s.kategori_usia;
    const desa = s.desa_id;
    const kel = s.kelompok_id;

    addCount(normKls, desa, kel);  // per-kelas slot (PAUD/TK/SD/1 SMP/etc)
    addCount(cat, desa, kel);       // per-kategori (caberawit/gp_reguler/remaja)
    addCount('all', desa, kel);     // grand total
  });

  // Build kelompok display labels from raw counts
  Object.keys(KATEGORI_GENERUS_DATA).forEach(key => {
    KATEGORI_GENERUS_DATA[key].desa.forEach(dObj => {
      dObj.kelompok = Object.keys(dObj.kelompokRaw).map(kId => {
        let kName = kId;
        const desaMeta = MASTER_WILAYAH.desa.find(d => d.id === dObj.id);
        if (desaMeta) {
          const kelMeta = desaMeta.kelompok.find(k => k.id === kId);
          if (kelMeta) kName = kelMeta.nama;
        }
        return `${kName} (${dObj.kelompokRaw[kId]})`;
      });
    });
  });

  // Update stat-card counter targets
  const cAll = document.querySelector('.stat-card[data-kategori-stat="all"] .stat-num');
  const cCb  = document.querySelector('.stat-card[data-kategori-stat="caberawit"] .stat-num');
  const cGp  = document.querySelector('.stat-card[data-kategori-stat="gp_reguler"] .stat-num');
  const cRm  = document.querySelector('.stat-card[data-kategori-stat="remaja"] .stat-num');

  const setCounter = (el, val) => {
    if (!el) return;
    el.dataset.target = val;
    el.textContent = val.toLocaleString('id-ID');
  };
  setCounter(cAll, KATEGORI_GENERUS_DATA['all'].total);
  setCounter(cCb,  KATEGORI_GENERUS_DATA['caberawit'].total);
  setCounter(cGp,  KATEGORI_GENERUS_DATA['gp_reguler'].total);
  setCounter(cRm,  KATEGORI_GENERUS_DATA['remaja'].total);

  // Update badge text inside jenjang cards (hero numbers)
  const cbBadge = document.getElementById('badgeCaberawit');
  const gpBadge = document.getElementById('badgeGP');
  const rmBadge = document.getElementById('badgeRemaja');
  if (cbBadge) cbBadge.textContent = `Usia Dini (${KATEGORI_GENERUS_DATA['caberawit'].total} Generus)`;
  if (gpBadge) gpBadge.textContent = `Usia Sekolah (${KATEGORI_GENERUS_DATA['gp_reguler'].total} Generus)`;
  if (rmBadge) rmBadge.textContent = `Remaja & Pra-Nikah (${KATEGORI_GENERUS_DATA['remaja'].total} Generus)`;

  // Update hero badge in stats section
  const heroBadge = document.getElementById('heroGenerusCount');
  if (heroBadge) heroBadge.textContent = KATEGORI_GENERUS_DATA['all'].total.toLocaleString('id-ID') + '+';
}

initGenerusStats();

const modalJenjang = document.getElementById('modalJenjangDetail');
const mjIcon = document.getElementById('mjIcon');
const mjBadge = document.getElementById('mjBadge');
const mjTitle = document.getElementById('mjTitle');
const mjTotalCount = document.getElementById('mjTotalCount');
const mjDesaGrid = document.getElementById('mjDesaGrid');
const btnCloseMj = document.getElementById('btnCloseMj');
const btnOkMj = document.getElementById('btnOkMj');

function openJenjangModal(kategoriKey) {
  const data = KATEGORI_GENERUS_DATA[kategoriKey];
  if (!data || !modalJenjang) return;

  mjTitle.textContent = data.name;
  mjBadge.innerHTML = `${data.tier} &bull; ${data.usia}`;
  mjIcon.innerHTML = `<span class="material-symbols-outlined" style="font-size:28px;color:${data.color};">${data.icon}</span>`;

  // Hitung L/P dari siswaList langsung
  const siswaList = getSiswaList();
  let lCount = 0, pCount = 0;
  const isKategori = ['caberawit','gp_reguler','remaja','all'].includes(kategoriKey);

  siswaList.forEach(s => {
    const match = isKategori
      ? (kategoriKey === 'all' || s.kategori_usia === kategoriKey)
      : normalizeKelas(s.jenjang_kelas) === kategoriKey;
    if (match) {
      if (s.jenis_kelamin === 'L') lCount++;
      else pCount++;
    }
  });
  const total = lCount + pCount;

  mjTotalCount.textContent = `${total} Generus`;

  // Summary gender bar
  const lPct = total > 0 ? Math.round((lCount / total) * 100) : 0;
  const pPct = 100 - lPct;

  const genderHtml = `
    <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
        <span style="min-width:56px;color:#1d4ed8;font-weight:700;">&#128102; ${lCount} L</span>
        <div style="flex:1;height:7px;background:#e8efff;border-radius:99px;overflow:hidden;">
          <div style="width:${lPct}%;height:100%;background:#3b82f6;border-radius:99px;"></div>
        </div>
        <span style="min-width:32px;font-size:11px;color:var(--text-muted);">${lPct}%</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
        <span style="min-width:56px;color:#be185d;font-weight:700;">&#128103; ${pCount} P</span>
        <div style="flex:1;height:7px;background:#fce7f3;border-radius:99px;overflow:hidden;">
          <div style="width:${pPct}%;height:100%;background:#ec4899;border-radius:99px;"></div>
        </div>
        <span style="min-width:32px;font-size:11px;color:var(--text-muted);">${pPct}%</span>
      </div>
    </div>
  `;

  // Update summary section
  const mjSummary = document.getElementById('mjSummary');
  if (mjSummary) {
    mjSummary.innerHTML = `
      <div class="mj-sum-item">
        <span class="mj-sum-label">Total ${data.tier}</span>
        <span class="mj-sum-val" style="color:${data.color};">${total.toLocaleString('id-ID')} Generus</span>
        ${genderHtml}
      </div>
      <div class="mj-sum-badge">Solo Selatan &bull; 5 Desa &bull; 27 Kelompok</div>
    `;
  }

  // Update section title
  const mjSecTitle = document.querySelector('.mj-section-title');
  if (mjSecTitle) {
    mjSecTitle.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;color:${data.color};">location_city</span> Distribusi di 5 Desa Solo Selatan`;
  }

  // Filter only desa that have data (total > 0)
  const desaDenganData = data.desa.filter(d => d.total > 0);
  const maxDesa = desaDenganData.length > 0 ? Math.max(...desaDenganData.map(d => d.total)) : 1;

  if (desaDenganData.length === 0) {
    mjDesaGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:24px 0;font-size:13px;">Belum ada data generus di kategori ini.</div>`;
  } else {
    mjDesaGrid.innerHTML = desaDenganData.map(d => {
      const barPct = Math.round((d.total / maxDesa) * 100);
      const kelDisplay = (d.kelompok || []).length > 0
        ? (d.kelompok || []).slice(0, 6).map(k => `<span class="mj-kel-pill">${k}</span>`).join('')
          + ((d.kelompok || []).length > 6 ? `<span class="mj-kel-pill" style="background:#e0e7ff;color:var(--blue);">+${d.kelompok.length - 6} lainnya</span>` : '')
        : '<span style="font-size:11px;color:var(--text-muted);">Belum ada data</span>';
      return `
      <div class="mj-desa-card">
        <div class="mj-desa-header">
          <div class="mj-desa-name">
            <span class="material-symbols-outlined" style="font-size:16px;color:${data.color};">location_city</span>
            <span>Desa ${d.nama}</span>
          </div>
          <div class="mj-desa-count" style="border-color:${data.color}20;color:${data.color};">${d.total} Generus</div>
        </div>
        <div style="height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;margin:2px 0;">
          <div style="width:${barPct}%;height:100%;background:${data.color};border-radius:99px;transition:width .5s ease;"></div>
        </div>
        <div class="mj-kelompok-list">${kelDisplay}</div>
      </div>`;
    }).join('');
  }

  modalJenjang.style.display = 'flex';
}

function closeJenjangModal() {
  if (modalJenjang) modalJenjang.style.display = 'none';
}

document.querySelectorAll('.level-pill[data-kategori]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const kat = btn.dataset.kategori;
    openJenjangModal(kat);
  });
});

document.querySelectorAll('.stat-card[data-kategori-stat]').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const kat = card.dataset.kategoriStat;
    openJenjangModal(kat);
  });
});

btnCloseMj?.addEventListener('click', closeJenjangModal);
btnOkMj?.addEventListener('click', closeJenjangModal);
modalJenjang?.addEventListener('click', (e) => {
  if (e.target === modalJenjang) closeJenjangModal();
});

/* ── 7. SMOOTH SCROLL FOR ANCHOR LINKS ───────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ── 8. LOADING SCREEN ────────────────────────────────────── */
(function setupLoadingScreen() {
  // Create loading screen dynamically
  const loading = document.createElement('div');
  loading.className = 'loading-screen';
  loading.id = 'loadingScreen';
  loading.innerHTML = `
    <div class="loading-logo">
      <img src="image/icon-192.png" alt="Logo PPG" style="width:64px;height:64px;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,0.3);margin-bottom:12px;object-fit:cover;" />
    </div>
    <div class="loading-title">PPG Solo Selatan</div>
    <div class="loading-sub">Building Generation with Noble Character</div>
    <div class="loading-bar"><div class="loading-fill"></div></div>
  `;
  document.body.prepend(loading);

  // Hide after fonts + content loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      loading.classList.add('hidden');
      setTimeout(() => loading.remove(), 600);
    }, 1800);
  });
})();

/* ── 9. SCROLL TO TOP BUTTON ──────────────────────────────── */
(function setupScrollTop() {
  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.id = 'scrollTopBtn';
  btn.setAttribute('aria-label', 'Kembali ke atas');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ── 10. TOAST NOTIFICATION HELPER ───────────────────────── */
function showToast(message, duration = 3500) {
  let toast = document.getElementById('mainToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'mainToast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── 11. ACTIVE SESSION DETECTION (Navbar & Footer -> "Kelola") ─ */
function checkLandingSession() {
  try {
    const raw = localStorage.getItem('ppg_user_session');
    if (!raw) return;
    const session = JSON.parse(raw);
    if (!session || !session.nama) return;

    const btnSignIn = document.getElementById('btnSignIn');
    const footerSignIn = document.getElementById('footerSignIn');

    if (btnSignIn) {
      btnSignIn.href = 'features/dashboard.html';
      btnSignIn.innerHTML = `
        <span>Kelola</span>
        <span class="material-symbols-outlined" style="font-size:18px;">tune</span>
      `;
      btnSignIn.title = `Sedang masuk: ${session.nama} (${session.peran || 'Pengurus'}) - Klik untuk membuka Dashboard`;
      btnSignIn.classList.add('btn-nav-active-session');
    }

    if (footerSignIn) {
      footerSignIn.href = 'features/dashboard.html';
      footerSignIn.textContent = 'Kelola Dashboard';
      footerSignIn.style.color = '#f9e27d';
      footerSignIn.style.fontWeight = '700';
    }
  } catch (e) {
    console.debug('Session check error', e);
  }
}

checkLandingSession();

/* ── 12. SERVICE WORKER REGISTRATION (Root Scope: /) ──────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: '/' })
      .then(reg => {
        console.log('[App] Service Worker registered on root scope:', reg.scope);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('🔄 Versi baru tersedia! Refresh untuk memperbarui.');
            }
          });
        });
      })
      .catch(err => {
        console.warn('[App] Root SW registration failed, trying fallback:', err);
        navigator.serviceWorker.register('./src/sw.js').catch(e => console.warn('[App] Fallback SW failed:', e));
      });
  });
}

/* ── 12. PWA INSTALL PROMPT ───────────────────────────────── */
let deferredInstallPrompt = null;
let pwaDismissed = false;
const pwaBar = document.getElementById('pwaInstallBar');
const pwaBtn = document.getElementById('pwaInstallBtn');
const pwaClose = document.getElementById('pwaDismissBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

window.addEventListener('scroll', () => {
  // Selalu tampilkan saat di-scroll ke bawah (walaupun tidak ada prompt instalasi) agar UI terlihat
  if (!pwaDismissed && window.scrollY > 500) {
    pwaBar?.classList.add('visible');
  } else {
    pwaBar?.classList.remove('visible'); // Hide when scrolled back up
  }
}, { passive: true });

pwaBtn?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) {
    showToast('Pemasangan otomatis tidak didukung, gunakan menu "Add to Home Screen" di browser.');
    return;
  }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('✅ Aplikasi berhasil diinstall! Cek layar utama HP Anda.');
  }
  deferredInstallPrompt = null;
  pwaBar?.classList.remove('visible');
});

pwaClose?.addEventListener('click', () => {
  pwaDismissed = true;
  pwaBar?.classList.remove('visible');
});

// Show after app installed
window.addEventListener('appinstalled', () => {
  showToast('🎉 PPG berhasil diinstall sebagai aplikasi!');
  pwaBar?.classList.remove('visible');
});

