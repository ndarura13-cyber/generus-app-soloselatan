/* ═══════════════════════════════════════════════════════════════
   report-viewer.js — Utilitas Kontrol PDF Viewer (Zoom, Fit-Width, Pinch)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

export class ReportViewer {
  constructor(options = {}) {
    this.scalerSelector = options.scalerSelector || '.report-sheet-scaler';
    this.viewportSelector = options.viewportSelector || '.report-canvas-viewport';
    this.sheetSelector = options.sheetSelector || '.report-paper-sheet';
    this.zoomValSelector = options.zoomValSelector || '#reportZoomVal';
    this.btnZoomInSelector = options.btnZoomInSelector || '#btnReportZoomIn';
    this.btnZoomOutSelector = options.btnZoomOutSelector || '#btnReportZoomOut';
    this.btnZoomFitSelector = options.btnZoomFitSelector || '#btnReportZoomFit';
    this.btnPrintSelector = options.btnPrintSelector || '#btnReportPrint';

    this.minScale = options.minScale || 0.35;
    this.maxScale = options.maxScale || 2.5;
    this.scaleStep = options.scaleStep || 0.15;

    this.currentScale = 1.0;
    this.init();
  }

  init() {
    this.scaler = document.querySelector(this.scalerSelector);
    this.viewport = document.querySelector(this.viewportSelector);
    this.zoomValEl = document.querySelector(this.zoomValSelector);

    if (!this.scaler || !this.viewport) return;

    // 1. Bind Toolbar Buttons
    document.querySelector(this.btnZoomInSelector)?.addEventListener('click', () => this.zoomIn());
    document.querySelector(this.btnZoomOutSelector)?.addEventListener('click', () => this.zoomOut());
    document.querySelector(this.btnZoomFitSelector)?.addEventListener('click', () => this.fitToWidth());
    this.zoomValEl?.addEventListener('click', () => this.fitToWidth());

    document.querySelector(this.btnPrintSelector)?.addEventListener('click', () => {
      window.print();
    });

    // 2. Pinch-to-Zoom Touch Gestures for Mobile
    this.initPinchToZoom();

    // 3. Keyboard Shortcuts (Ctrl + +, Ctrl + -, Ctrl + 0)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          this.zoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          this.zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          this.fitToWidth();
        }
      }
    });

    // 4. Initial Scale: If on Mobile (< 768px), Auto Fit to Width!
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768 && this.currentScale < 0.9) {
        this.fitToWidth(false);
      }
    });

    setTimeout(() => {
      if (window.innerWidth < 768) {
        this.fitToWidth(false);
      } else {
        this.setZoom(1.0);
      }
    }, 150);

    // 5. Smart Back Button session check
    this.initSmartBackButton();
  }

  setZoom(scale, smooth = true) {
    this.currentScale = Math.min(Math.max(scale, this.minScale), this.maxScale);

    if (this.scaler) {
      this.scaler.style.transform = `scale(${this.currentScale})`;
      // Update wrapper dimensions so viewport scrollbars match the scaled sheet
      const firstSheet = document.querySelector(this.sheetSelector);
      if (firstSheet) {
        const unscaledWidth = firstSheet.offsetWidth || 794;
        const unscaledHeight = firstSheet.offsetHeight || 1123;
        const scaledWidth = unscaledWidth * this.currentScale;
        const scaledHeight = unscaledHeight * this.currentScale;
        
        this.scaler.style.width = `${unscaledWidth}px`;
        if (this.currentScale < 1.0) {
          const marginHoriz = (scaledWidth - unscaledWidth) / 2;
          this.scaler.style.marginLeft = `${marginHoriz}px`;
          this.scaler.style.marginRight = `${marginHoriz}px`;
          this.scaler.style.marginBottom = `${Math.max(20, scaledHeight - unscaledHeight + 30)}px`;
        } else {
          this.scaler.style.marginLeft = '0px';
          this.scaler.style.marginRight = '0px';
          this.scaler.style.marginBottom = `${Math.max(40, scaledHeight - unscaledHeight + 40)}px`;
        }
      }
    }

    if (this.zoomValEl) {
      this.zoomValEl.textContent = `${Math.round(this.currentScale * 100)}%`;
    }
  }

  zoomIn() {
    this.setZoom(this.currentScale + this.scaleStep);
  }

  zoomOut() {
    this.setZoom(this.currentScale - this.scaleStep);
  }

  fitToWidth(userAction = true) {
    const firstSheet = document.querySelector(this.sheetSelector);
    if (!firstSheet || !this.viewport) return;

    const pad = (window.innerWidth < 768 ? 12 : 36);
    const viewportWidth = this.viewport.clientWidth - pad;
    const sheetWidth = firstSheet.offsetWidth || 794;

    if (sheetWidth > 0 && viewportWidth > 0) {
      let idealScale = viewportWidth / sheetWidth;
      // Cap at 1.0x so desktop doesn't blow up too large
      if (window.innerWidth >= 768) {
        idealScale = Math.min(idealScale, 1.0);
      }
      this.setZoom(idealScale);
      if (userAction && this.viewport) {
        this.viewport.scrollTop = 0;
      }
    }
  }

  initPinchToZoom() {
    let initialDist = 0;
    let initialScale = 1.0;

    this.viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = this.currentScale;
      }
    }, { passive: true });

    this.viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = currentDist / initialDist;
        this.setZoom(initialScale * factor, false);
      }
    }, { passive: true });

    this.viewport.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialDist = 0;
      }
    }, { passive: true });
  }

  initSmartBackButton() {
    const btnBack = document.querySelector('.report-btn-back');
    if (!btnBack) return;

    try {
      const rawSession = localStorage.getItem('ppg_user_session');
      let isLoggedIn = false;
      if (rawSession) {
        const user = JSON.parse(rawSession);
        if (user && user.email) isLoggedIn = true;
      }

      if (isLoggedIn) {
        btnBack.href = '../dashboard/dashboard.html';
        btnBack.title = 'Kembali ke Dashboard Admin';
      } else {
        btnBack.href = '../../index.html';
        btnBack.title = 'Kembali ke Beranda';
      }
    } catch (e) {
      console.warn('Session check error in report viewer', e);
    }
  }
}

// Auto instantiate if data-auto-init is present
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.report-canvas-viewport')) {
    window.activeReportViewer = new ReportViewer();
  }
});
