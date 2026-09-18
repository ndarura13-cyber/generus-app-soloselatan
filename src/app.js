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
  return 'Berlangsung';
}

function getStatusClass(status) {
  if (status === 'done' || status === 'selesai') return 'done';
  if (status === 'ongoing' || status === 'berjalan' || status === 'sedang_berlangsung') return 'ongoing';
  return 'upcoming';
}

let currentProkerFilter = 'ongoing'; // Default filter: Berjalan (yang sedang berjalan di bulan tersebut)
let currentProkerPage = 1;
const prokerItemsPerPage = 5;

function updateFilterButtonsUI() {
  const filterBtns = document.querySelectorAll('.proker-filter-btn');
  filterBtns.forEach(btn => {
    const f = btn.dataset.filter;
    if (f === currentProkerFilter) {
      if (f === 'ongoing') {
        btn.className = 'proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-emerald-300 bg-emerald-500 text-white font-bold shadow-md ring-2 ring-emerald-300/40 cursor-pointer transition-all duration-200';
      } else if (f === 'berlangsung') {
        btn.className = 'proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-amber-300 bg-amber-500 text-white font-bold shadow-md ring-2 ring-amber-300/40 cursor-pointer transition-all duration-200';
      } else if (f === 'done') {
        btn.className = 'proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-slate-300 bg-slate-500 text-white font-bold shadow-md ring-2 ring-slate-300/40 cursor-pointer transition-all duration-200';
      } else {
        btn.className = 'proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-white bg-white text-brandBlue font-bold shadow-md ring-2 ring-white/40 cursor-pointer transition-all duration-200';
      }
    } else {
      btn.className = 'proker-filter-btn flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white/90 font-medium cursor-pointer transition-all duration-200';
    }
  });
}

function renderProker() {
  const list = document.getElementById('prokerList');
  const paginationContainer = document.getElementById('prokerPagination');
  if (!list) return;

  updateFilterButtonsUI();

  const allProker = getProkerList();

  // Filter program kerja sesuai status
  let filteredData = allProker;
  if (currentProkerFilter === 'ongoing') {
    filteredData = allProker.filter(p => p.status === 'ongoing' || p.status === 'berjalan' || p.status === 'sedang_berlangsung');
  } else if (currentProkerFilter === 'berlangsung') {
    filteredData = allProker.filter(p => p.status === 'upcoming' || p.status === 'planned' || p.status === 'akan_datang' || p.status === 'direncanakan' || p.status === 'berlangsung');
  } else if (currentProkerFilter === 'done') {
    filteredData = allProker.filter(p => p.status === 'done' || p.status === 'selesai');
  }

  if (filteredData.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 text-slate-500 dark:text-slate-400">
        <span class="material-symbols-outlined text-4xl mb-2 text-slate-400">event_busy</span>
        <p class="font-medium text-sm">Tidak ada program kerja dengan status ini.</p>
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
    const globalIndex = startIndex + index + 1;
    const rawStatus = item.status || 'planned';
    const statusClass = getStatusClass(rawStatus);
    const statusLabel = getStatusLabel(rawStatus);
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
      <div class="proker-item group/proker" data-expanded="false">
        <div class="proker-dot ${statusClass}"></div>
        <div class="proker-content">
          <div class="proker-row-header cursor-pointer md:cursor-default flex items-center justify-between" onclick="if(window.innerWidth < 768) { this.closest('.proker-item').dataset.expanded = this.closest('.proker-item').dataset.expanded === 'true' ? 'false' : 'true'; }">
            <div class="proker-title flex-1 pr-2">
              <span style="color:var(--blue);margin-right:4px;">${item.no || globalIndex}.</span> ${item.kegiatan}
            </div>
            <div class="flex items-center gap-2">
              <span class="proker-status-badge ${statusClass}">
                <span class="dot ${statusClass}"></span>
                <span>${statusLabel}</span>
              </span>
              <!-- Chevron arrow for mobile accordion -->
              <span class="material-symbols-outlined text-slate-400 md:hidden transition-transform duration-200 chevron-icon" style="font-size: 20px;">
                chevron_right
              </span>
            </div>
          </div>
          <!-- Details (hidden on mobile unless expanded) -->
          <div class="proker-details hidden md:block mt-3 md:mt-0">
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

