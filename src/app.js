/* ═══════════════════════════════════════════════════════════════
   app.js — PPG Solo Selatan Landing Page
   ═══════════════════════════════════════════════════════════════ */

'use strict';

import { getProkerList, syncProkerFromSupabase } from './db-master.js';

/* ── 0. SPLASH LOADING SCREEN ─────────────────────────────── */
(function setupLoadingScreen() {
  const splash = document.createElement('div');
  splash.className = 'loading-screen';
  splash.id = 'loadingScreen';
  splash.innerHTML = `
    <div class="loading-logo-box">
      <img src="src/image/icon-192.png" alt="Logo PPG Solo Selatan" />
    </div>
    <div class="loading-title">PPG Solo Selatan</div>
    <div class="loading-sub">Mewujudkan Generasi Penerus yang Faham Agama dan Memiliki 29 Karakter Luhur</div>
    <div class="loading-bar"><div class="loading-fill"></div></div>
  `;
  document.body.prepend(splash);

  const hideSplash = () => {
    splash.style.pointerEvents = 'none';
    splash.classList.add('hidden');
    setTimeout(() => {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 600);
  };

  // Tampilkan splash screen secara elegan selama 1.5 detik agar animasi logo dan progress bar selesai dengan sempurna
  setTimeout(hideSplash, 1500);
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
setTimeout(() => {
  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
      el.classList.add('visible');
    }
  });
}, 600);

/* ── 6. ANIMATED STATS COUNTER ────────────────────────────── */
const counters = document.querySelectorAll('.stat-num[data-target]');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

function animateCounter(el) {
  const target = parseInt(el.dataset.target) || 0;
  const isPlus = el.id === 'heroGenerusCount';
  const duration = 1400;
  const start = performance.now();

  function update(ts) {
    const elapsed = ts - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(eased * target);
    el.textContent = val.toLocaleString('id-ID') + (isPlus ? '+' : '');
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString('id-ID') + (isPlus ? '+' : '');
    }
  }
  requestAnimationFrame(update);
}

counters.forEach(el => countObserver.observe(el));
const heroCounter = document.getElementById('heroGenerusCount');
if (heroCounter) countObserver.observe(heroCounter);

/* ── 7. PROGRAM KERJA DATA & RENDER (TERINTEGRASI DATABASE) ── */
const shortMonthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT', 'SEP', 'OKT', 'NOV', 'DES'];
const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const now = new Date();
const currentMonthIdx = now.getMonth();
const currentYearVal = now.getFullYear();

const currentMonthEl = document.getElementById('currentMonth');
const currentYearEl = document.getElementById('currentYear');
const prokerHeaderTitleEl = document.getElementById('prokerHeaderTitle');

if (currentMonthEl) currentMonthEl.textContent = shortMonthNames[currentMonthIdx];
if (currentYearEl) currentYearEl.textContent = currentYearVal;
if (prokerHeaderTitleEl) {
  prokerHeaderTitleEl.textContent = `${fullMonthNames[currentMonthIdx]} ${currentYearVal}`;
}

function getStatusLabel(status) {
  if (status === 'done' || status === 'selesai') return 'Selesai';
  if (status === 'ongoing' || status === 'berjalan' || status === 'sedang_berlangsung') return 'Berjalan';
  if (status === 'upcoming' || status === 'akan_datang') return 'Akan Datang';
  if (status === 'planned' || status === 'direncanakan') return 'Direncanakan';
  return 'Direncanakan';
}

function getStatusClass(status) {
  if (status === 'done' || status === 'selesai') return 'done';
  if (status === 'ongoing' || status === 'berjalan' || status === 'sedang_berlangsung') return 'ongoing';
  if (status === 'upcoming' || status === 'akan_datang') return 'upcoming';
  if (status === 'planned' || status === 'direncanakan') return 'planned';
  return 'planned';
}

function isProkerRoutine(item) {
  if (!item) return false;
  const waktu = String(item.waktu || item.waktuPelaksanaan || '').toLowerCase();
  const kegiatan = String(item.kegiatan || item.judulProgram || '').toLowerCase();
  const routinePatterns = [
    'tiap bulan', 'setiap bulan', '1x / bulan', '1x/bulan', '1x /bln',
    '1 bulan 1 kali', '1 bln 1 kali', 'per bulan', 'perbulan', 'bulanan',
    'tiap kegiatan', 'setiap kegiatan', 'rutin', 'tiap minggu', 'setiap minggu'
  ];
  return routinePatterns.some(pattern => waktu.includes(pattern) || kegiatan.includes(pattern));
}

const DASH_MONTH_KEYWORDS = [
  ['jan', 'januari'],
  ['feb', 'februari'],
  ['mar', 'maret', 'romadhon', 'ramadhan'],
  ['apr', 'april', 'romadhon', 'ramadhan'],
  ['mei', 'may'],
  ['jun', 'juni'],
  ['jul', 'juli'],
  ['agu', 'agust', 'agustus'],
  ['sep', 'sept', 'september'],
  ['okt', 'oktober'],
  ['nov', 'november'],
  ['des', 'desember']
];

function isProkerMatchingMonth(item, monthIdx) {
  if (!item) return false;
  const waktu = String(item.waktu || item.waktuPelaksanaan || '').toLowerCase();
  const keywords = DASH_MONTH_KEYWORDS[monthIdx] || [];
  return keywords.some(kw => waktu.includes(kw));
}

function isProkerMatchingCurrentMonth(item, monthIdx, yearVal) {
  if (!item) return false;
  if (isProkerRoutine(item)) return true;
  return isProkerMatchingMonth(item, monthIdx);
}

let currentProkerFilter = 'ongoing'; // Default filter: Berjalan
let currentProkerSegment = 'event'; // 'event' (Agenda Utama) atau 'routine' (Rutin Bulanan)
let currentProkerPage = 1;
const prokerItemsPerPage = 5;

function updateFilterButtonsUI() {
  const filterBtns = document.querySelectorAll('.proker-filter-btn');
  filterBtns.forEach(btn => {
    const f = btn.dataset.filter;
    btn.classList.remove('active-ongoing', 'active-upcoming', 'active-planned', 'active-done', 'active-all');
    if (f === currentProkerFilter) {
      btn.classList.add(`active-${f}`);
    }
  });

  const segmentBtns = document.querySelectorAll('.proker-segment-btn');
  segmentBtns.forEach(btn => {
    const s = btn.dataset.segment;
    if (s === currentProkerSegment) {
      btn.className = 'proker-segment-btn w-full flex items-center justify-center text-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg transition-all active bg-white dark:bg-slate-800 text-brandBlue dark:text-blue-400 shadow-sm font-bold cursor-pointer';
    } else {
      btn.className = 'proker-segment-btn w-full flex items-center justify-center text-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium cursor-pointer';
    }
  });

  const segmentDescEl = document.getElementById('prokerSegmentDesc');
  if (segmentDescEl) {
    segmentDescEl.textContent = currentProkerSegment === 'event'
      ? 'Menampilkan agenda event & milestone terjadwal'
      : 'Menampilkan kegiatan berkala bulanan (musyawarah, operasional pokja, shadaqoh)';
  }
}

function renderProker() {
  const list = document.getElementById('prokerList');
  const paginationContainer = document.getElementById('prokerPagination');
  if (!list) return;

  updateFilterButtonsUI();

  const allProker = getProkerList();
  const routineList = allProker.filter(isProkerRoutine);
  const eventList = allProker.filter(p => !isProkerRoutine(p));

  const routineCountEl = document.getElementById('prokerRoutineCount');
  if (routineCountEl) routineCountEl.textContent = routineList.length;

  const baseList = currentProkerSegment === 'routine' ? routineList : eventList;

  // Otomatis aktifkan status Berjalan (bulan kalender saat ini) atau Akan Datang (1 bulan di depannya)
  const nextMonthIdx = (currentMonthIdx + 1) % 12;

  const enrichedList = baseList.map(item => {
    const isDone = item.status === 'done' || item.status === 'selesai' || item.realisasiStatus === 'terlaksana';
    const isMatchedMonth = isProkerMatchingCurrentMonth(item, currentMonthIdx, currentYearVal);
    const isNextMonth = !isMatchedMonth && isProkerMatchingMonth(item, nextMonthIdx);
    let effectiveStatus = item.status || 'planned';

    if (isDone) {
      effectiveStatus = 'done';
    } else if (isMatchedMonth || item.status === 'ongoing' || item.status === 'berjalan' || item.status === 'sedang_berlangsung') {
      effectiveStatus = 'ongoing';
    } else if (isNextMonth || item.status === 'upcoming' || item.status === 'akan_datang') {
      effectiveStatus = 'upcoming';
    } else {
      effectiveStatus = 'planned';
    }

    return {
      ...item,
      effectiveStatus,
      isAutoCurrentMonth: !isDone && isMatchedMonth,
      isAutoNextMonth: !isDone && !isMatchedMonth && isNextMonth
    };
  });

  let filteredData = enrichedList;
  if (currentProkerFilter === 'ongoing') {
    filteredData = enrichedList.filter(p => p.effectiveStatus === 'ongoing');
  } else if (currentProkerFilter === 'upcoming') {
    filteredData = enrichedList.filter(p => p.effectiveStatus === 'upcoming');
  } else if (currentProkerFilter === 'planned') {
    filteredData = enrichedList.filter(p => p.effectiveStatus === 'planned');
  } else if (currentProkerFilter === 'done') {
    filteredData = enrichedList.filter(p => p.effectiveStatus === 'done');
  }

  if (filteredData.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 text-slate-500 dark:text-slate-400">
        <span class="material-symbols-outlined text-4xl mb-2 text-slate-400">event_busy</span>
        <p class="font-medium text-sm">Tidak ada program kerja pada kategori/status ini.</p>
      </div>
    `;
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(filteredData.length / prokerItemsPerPage);
  if (currentProkerPage > totalPages) currentProkerPage = totalPages;
  if (currentProkerPage < 1) currentProkerPage = 1;

  const startIndex = (currentProkerPage - 1) * prokerItemsPerPage;
  const endIndex = startIndex + prokerItemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  list.innerHTML = currentData.map((item, index) => {
    const rawStatus = item.effectiveStatus || item.status || 'planned';
    const statusClass = getStatusClass(rawStatus);
    const statusLabel = getStatusLabel(rawStatus);
    const isTerlaksana = item.realisasiStatus === 'terlaksana';
    const realisasiBadge = isTerlaksana ? `
      <span class="proker-realisasi-badge terlaksana" style="font-size:10px;padding:2px 7px;background:#dcfce7;color:#15803d;border-radius:4px;font-weight:700;">
        Terlaksana
      </span>
    ` : '';
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

    const isRoutine = isProkerRoutine(item);
    const routinePill = isRoutine ? `
      <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" title="Kegiatan Rutin Bulanan">
        <span class="material-symbols-outlined text-[13px]">autorenew</span> Rutin
      </span>
      <span class="proker-meta-sep">&bull;</span>
    ` : (item.isAutoCurrentMonth ? `
      <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Terjadwal di Bulan Berjalan">
        <span class="material-symbols-outlined text-[13px]">alarm</span> Bulan Ini
      </span>
      <span class="proker-meta-sep">&bull;</span>
    ` : (item.isAutoNextMonth ? `
      <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Terjadwal di 1 Bulan Mendatang">
        <span class="material-symbols-outlined text-[13px]">upcoming</span> Bulan Depan
      </span>
      <span class="proker-meta-sep">&bull;</span>
    ` : ''));

    return `
      <div class="proker-item group/proker" data-expanded="false">
        <div class="proker-dot-badge ${statusClass}">
          <div class="proker-dot-inner ${statusClass}"></div>
        </div>
        <div class="proker-content">
          <div class="proker-row-header cursor-pointer md:cursor-default flex items-center justify-between" onclick="if(window.innerWidth < 768) { this.closest('.proker-item').dataset.expanded = this.closest('.proker-item').dataset.expanded === 'true' ? 'false' : 'true'; }">
            <div class="proker-title flex-1 min-w-0 pr-2">
              ${item.kegiatan}
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <!-- Desktop Header Badges -->
              <div class="hidden md:inline-flex items-center gap-2">
                ${realisasiBadge}
                <span class="proker-status-badge ${statusClass}">
                  <span class="dot ${statusClass}"></span>
                  <span>${statusLabel}</span>
                </span>
              </div>
              <!-- Chevron arrow for mobile accordion (Preview Bersih) -->
              <span class="material-symbols-outlined text-slate-400 md:hidden transition-transform duration-200 chevron-icon" style="font-size: 22px;">
                chevron_right
              </span>
            </div>
          </div>
          <!-- Details (hidden on mobile unless expanded) -->
          <div class="proker-details hidden md:block mt-2.5">
            <!-- Mobile Status Row Inside Dropdown -->
            <div class="flex md:hidden items-center flex-wrap gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span class="proker-status-badge ${statusClass}">
                <span class="dot ${statusClass}"></span>
                <span>${statusLabel}</span>
              </span>
              ${isTerlaksana ? `
                <span class="proker-realisasi-badge terlaksana" style="font-size:10px;padding:2px 8px;background:#dcfce7;color:#15803d;border-radius:4px;font-weight:700;">
                  <span class="material-symbols-outlined" style="font-size:12px;">check_circle</span> Terlaksana
                </span>
              ` : `
                <span class="proker-realisasi-badge belum_terlaksana" style="font-size:10px;padding:2px 8px;background:#fef3c7;color:#b45309;border-radius:4px;font-weight:700;">
                  <span class="material-symbols-outlined" style="font-size:12px;">schedule</span> Belum Terlaksana
                </span>
              `}
            </div>
            <div class="proker-meta">
              ${routinePill}
              ${item.kategori === 'KMM' ? `
                <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <span class="material-symbols-outlined text-[12px]">diversity_3</span>
                  Divisi ${item.subBidang || 'Umum'}
                </span>
                <span class="proker-meta-sep">&bull;</span>
              ` : `
                <span class="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  ${item.penanggungJawab || 'PPG'}
                </span>
                <span class="proker-meta-sep">&bull;</span>
              `}
              <span class="proker-meta-item">
                <span class="material-symbols-outlined ms-proker-ic">calendar_today</span>
                <span>${item.waktu}</span>
              </span>
              ${tempatHtml}
              <span class="proker-meta-sep">&bull;</span>
              <span class="proker-meta-item">
                <span class="material-symbols-outlined ms-proker-ic">group</span>
                <span>${item.sasaran || '-'}</span>
              </span>
              ${(item.estBiaya || 0) > 0 ? `
                <span class="proker-meta-sep">&bull;</span>
                <span class="proker-meta-item" style="color:#057a55;font-weight:700;">
                  <span class="material-symbols-outlined ms-proker-ic" style="color:#057a55;">payments</span>
                  <span>RAB: Rp ${(item.estBiaya || 0).toLocaleString('id-ID')}</span>
                </span>
              ` : ''}
            </div>
            ${tujuanHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (paginationContainer) {
    if (totalPages > 1) {
      let dotsHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        dotsHtml += `<button class="px-3 py-1 text-xs font-bold rounded-lg transition-all page-dot ${i === currentProkerPage ? 'bg-brandBlue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}" data-page="${i}" aria-label="Page ${i}">${i}</button>`;
      }
      paginationContainer.innerHTML = `
        <button class="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center page-nav prev" ${currentProkerPage === 1 ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_left</span></button>
        <div class="page-dots flex items-center gap-1.5">${dotsHtml}</div>
        <button class="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center page-nav next" ${currentProkerPage === totalPages ? 'disabled' : ''}><span class="material-symbols-outlined">chevron_right</span></button>
      `;

      // Bind events
      paginationContainer.querySelectorAll('.page-dot').forEach(btn => {
        btn.addEventListener('click', (e) => {
          currentProkerPage = parseInt(e.target.dataset.page);
          renderProker();
        });
      });
      const prevBtn = paginationContainer.querySelector('.prev');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (currentProkerPage > 1) {
            currentProkerPage--;
            renderProker();
          }
        });
      }
      const nextBtn = paginationContainer.querySelector('.next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (currentProkerPage < totalPages) {
            currentProkerPage++;
            renderProker();
          }
        });
      }
    } else {
      paginationContainer.innerHTML = '';
    }
  }
}

// Bind event listener filter status proker
const filterBarContainer = document.getElementById('prokerStatusFilterBar');
if (filterBarContainer) {
  filterBarContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.proker-filter-btn');
    if (!btn) return;
    const filterVal = btn.dataset.filter;
    currentProkerFilter = (currentProkerFilter === filterVal) ? 'all' : filterVal;
    currentProkerPage = 1;
    renderProker();
  });
}

// Bind event listener sub-tab segment proker (Event vs Rutin)
const segmentBarContainer = document.getElementById('prokerSegmentBar');
if (segmentBarContainer) {
  segmentBarContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.proker-segment-btn');
    if (!btn) return;
    const seg = btn.dataset.segment;
    if (seg && seg !== currentProkerSegment) {
      currentProkerSegment = seg;
      currentProkerPage = 1;
      renderProker();
    }
  });
}

renderProker();

// Sinkronisasi data Program Kerja live dari Supabase di background
syncProkerFromSupabase().then(() => {
  renderProker();
}).catch(e => console.warn('[app.js] Background sync proker error:', e));






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
      btnSignIn.href = 'features/dashboard/dashboard.html';
      btnSignIn.innerHTML = `
        <span>Kelola</span>
        <span class="material-symbols-outlined" style="font-size:18px;">tune</span>
      `;
      btnSignIn.title = `Sedang masuk: ${session.nama} (${session.peran || 'Pengurus'}) - Klik untuk membuka Dashboard`;
      btnSignIn.classList.add('btn-nav-active-session');
    }

    if (footerSignIn) {
      footerSignIn.href = 'features/dashboard/dashboard.html';
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
        console.warn('[App] Root SW registration failed:', err);
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

/* ── 12. SAFE MAILTO PROTOCOL HANDLER ──────────────────────── */
// Prevent mailto clicks on desktop from navigating the current tab to a 404 page
(function setupSafeMailtoHandler() {
  function dispatchSafeMailto(mailUrl) {
    if (!mailUrl || !mailUrl.startsWith('mailto:')) return;
    let iframe = document.getElementById('_ppg_mailto_dispatcher');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = '_ppg_mailto_dispatcher';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.opacity = '0';
      iframe.style.border = 'none';
      iframe.style.pointerEvents = 'none';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);
    }
    iframe.src = mailUrl;
  }

  window.addEventListener('click', function (e) {
    const mailLink = e.target.closest('a[href^="mailto:"]');
    if (mailLink) {
      e.preventDefault();
      e.stopPropagation();
      const href = mailLink.getAttribute('href');
      if (href) {
        dispatchSafeMailto(href);
      }
    }
  }, true);
})();

