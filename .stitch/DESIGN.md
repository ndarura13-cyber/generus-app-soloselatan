---
name: PPG Solo Selatan - Generus App Design System
colors:
  # Base Surface & Background (Light Mode)
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737785'
  outline-variant: '#c3c6d5'
  surface-tint: '#1d58c6'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'

  # Core Brand Primary & Supporting
  primary: '#003f9d'
  on-primary: '#ffffff'
  primary-container: '#1a56c4'
  on-primary-container: '#c8d5ff'
  inverse-primary: '#b2c5ff'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc641'
  on-secondary-container: '#715300'
  tertiary: '#00502c'
  on-tertiary: '#ffffff'
  tertiary-container: '#006b3c'
  on-tertiary-container: '#8ee9ac'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'

  # Custom Semantic Brand Colors
  midnight-navy: '#0a1f52'
  royal-blue: '#1a56c4'
  soft-blue-tint: '#e8f0fd'
  pastel-gold-tint: '#fdf3d0'
  noble-gold: '#d4a017'
  mint-green-tint: '#d8f3e5'
  emerald-green: '#2e8b57'
  coral-crimson: '#e55c5c'
  crisp-surface: '#ffffff'
  slate-canvas: '#f4f7fc'
  charcoal-text: '#1a1d2e'
  subtle-border: '#e2e8f0'

  # Universal Obsidian Dark Mode Palette
  dark-bg: '#090e1a'
  dark-surface: '#0b1329'
  dark-surface-elevated: '#111d38'
  dark-border: '#223554'
  dark-border-subtle: '#2b426b'
  dark-text-main: '#f8fafc'
  dark-text-muted: '#94a3b8'
  dark-code-bg: '#06202a'
  dark-code-text: '#38bdf8'

  # Program Kerja (Proker) & Supabase Schema Status Indicators
  status-ongoing: '#10b981'
  status-ongoing-bg: '#d1fae5'
  status-ongoing-dark-bg: '#064e3b'
  status-upcoming: '#f59e0b'
  status-upcoming-bg: '#fef3c7'
  status-upcoming-dark-bg: '#78350f'
  status-planned: '#3b82f6'
  status-planned-bg: '#dbeafe'
  status-planned-dark-bg: '#1e3a8a'
  status-done: '#94a3b8'
  status-done-bg: '#f1f5f9'
  status-done-dark-bg: '#1e293b'

typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  2xl: 1.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

# Design System: PPG Solo Selatan - Generus App
**Project ID:** 17286285228241563161  
**Architecture:** Dual Theme (Clean Light & Obsidian Dark Mode)  
**Target Platform:** Responsive Web & Mobile Dashboard (PWA-Ready)

---

## 1. Visual Theme & Atmosphere
Desain aplikasi PPG Solo Selatan memadukan nuansa **Modern, Bersih, Bersemangat, dan Berkarakter Luhur** dengan sentuhan estetika kontemporer terinspirasi oleh **shadcn/ui (New York style)** yang dipadukan dengan aksen warna yayasan:
- **Mood**: Terpercaya (*Trustworthy*), Rapi (*Organized*), Hangat & Bersahabat (*Welcoming*), Presisi (*High Contrast & Legible*).
- **Elevation & Depth**:
  - **Light Mode**: Permukaan putih murni (`#ffffff`) dengan bayangan halus terdifusi (*whisper-soft diffused shadows* `0 6px 24px rgba(26, 86, 196, 0.08)`) serta batas garis tipis presisi 1px (`#e2e8f0`).
  - **Obsidian Dark Mode**: Latar kanvas pekat Obsidian (`#090e1a`), kontainer slate malam (`#0b1329`), kartu elevasi (`#111d38`), dan batas luminous indigo-slate (`#223554`) dengan aksen glow emerald (`rgba(16, 185, 129, 0.2)`).

---

## 2. Color Palette & Roles

### A. Palet Brand Utama
| Token | Hex Code | Peran Fungsional |
|---|---|---|
| **Royal Deep Blue** | `#1a56c4` | Aksi utama, brand navbar, tab aktif, header banner |
| **Midnight Navy** | `#0a1f52` | Hero gradient, header pill, dark container |
| **Noble Warm Gold** | `#d4a017` | Aksen jenjang Caberawit, status penting, badge unggulan |
| **Emerald Soft Green** | `#2e8b57` | Aksen Remaja, status sukses, indikator sinkronisasi |
| **Coral Crimson** | `#e55c5c` | Tombol destruktif, peringatan kritis, status alpa |

### B. Palet Universal Obsidian Dark Mode
| Token | Hex Code | Peran Fungsional |
|---|---|---|
| **Dark Void Background** | `#090e1a` | Latar utama aplikasi pada mode gelap |
| **Dark Slate Surface** | `#0b1329` | Permukaan kontainer dan sidebar |
| **Elevated Surface 2** | `#111d38` | Kartu konten, card jenjang, dan dialog popup |
| **Luminous Dark Border** | `#223554` | Pembatas kontainer pada mode gelap |
| **Subtle Border 2** | `#2b426b` | Border aktif / fokus input dan tombol |
| **Dark Main Text** | `#f8fafc` | Teks judul & konten utama mode gelap (kontras 100%) |
| **Dark Muted Text** | `#94a3b8` | Teks sekunder, label, dan keterangan waktu |
| **Code Box Slate** | `#06202a` | Latar blok kode SQL skema Supabase |
| **Code Cyan Text** | `#38bdf8` | Teks monospace kode dengan keterbacaan tajam |

### C. Indikator Status Program Kerja (Database Sync)
Warna indikator status yang disinkronkan secara presisi dengan schema database Supabase (`proker.status`):
| Status | Hex Accent | Light Tint (Bg/Border) | Dark Tint (Bg/Border) | Perilaku & Animasi |
|---|---|---|---|---|
| **Berjalan (`ongoing`)** | `#10b981` (Emerald) | `#d1fae5` / `#a7f3d0` | `#064e3b` / `#059669` | Pulsating glowing green dot |
| **Akan Datang (`upcoming`)** | `#f59e0b` (Amber) | `#fef3c7` / `#fde68a` | `#78350f` / `#d97706` | Static amber pill badge |
| **Direncanakan (`planned`)** | `#3b82f6` (Blue) | `#dbeafe` / `#bfdbfe` | `#1e3a8a` / `#2563eb` | Static blue pill badge |
| **Selesai (`done`)** | `#94a3b8` (Slate Muted) | `#f1f5f9` / `#e2e8f0` | `#1e293b` / `#475569` | Soft muted gray badge |

---

## 3. Typography & Hierarchy
- **Font Antarmuka & Body**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
  - Body Text: `400` (Regular) & `500` (Medium), `line-height: 1.6`
  - Label & Subtitle: `600` (Semi-bold) & `700` (Bold)
  - Judul Bagian & Angka Metrik: `800` (Extra-bold)
- **Font Serif Klasik**: `'Playfair Display', serif` (Digunakan secara selektif pada header sambutan / brand resmi yayasan).
- **Font Monospace**: `'JetBrains Mono', 'Fira Code', monospace` (Untuk SQL helper skema Supabase).
- **Ikonografi**: Google **Material Symbols Outlined** (Flat, konsisten, 18px–24px).

---

## 4. Spesifikasi Komponen Inti

### A. Program Kerja (Proker) Tahunan
1. **Header Bulan Otomatis**: Mendeteksi bulan & tahun aktif saat ini secara dinamis (contoh: "September 2026").
2. **Interactive Status Filter Pills**:
   - Filter pills memungkinkan filtering instan: `Semua`, `Berjalan`, `Akan Datang`, `Direncanakan`, `Selesai`.
   - Active State: Navy murni / White badge dengan elevasi halus.
   - Default State: Slate soft container (`#f1f5f9` light / `#111d38` dark).
3. **Proker Card Layout**:
   - Time Pill: Chip tanggal/periode dengan latar semi-transparan.
   - Hierarchy: Judul proker font-bold 14px, deskripsi/penanggung jawab font-medium 12px text-slate-500.
   - Animated Pulse Dot: Khusus status `Berjalan`, dilengkapi titik hijau berkedip (*infinite subtle pulse*).
   - Border Pembatas: Garis pemisah horizontal tipis `border-b border-slate-100 dark:border-slate-800` antar item.

### B. Ringkasan Cepat Generus (Quick Analytics)
1. **Kategori Multi-Jenjang**:
   - Caberawit (PAUD, TK, SD 1-6)
   - Pra-Remaja / Generus Reguler (SMP / Kelas 7-9)
   - Remaja & Usia Mandiri (SMA, Mahasiswa, Usia Kerja)
2. **Segmented Category Tabs**: Tab berbentuk kapsul (pill) dengan counter badge jumlah santri aktif.
3. **Banner Ringkasan Metrik**:
   - Kartu total santri terdaftar.
   - Rasio gender interaktif: Badges Laki-laki (`#3b82f6`) dan Perempuan (`#ec4899`).
4. **Grid Kartu Jenjang / Kelas**: Kartu responsif 2–4 kolom dengan status aktif dan target capaian kurikulum.
5. **Sebaran Desa**: Daftar distribusi santri per desa (Baki, Sukoharjo, Grogol, dsb.) dengan rasio visual dan tag desa.
6. **Pop-up Detail Kontras Tinggi**: Modal dengan backdrop blur dan dukungan penuh Obsidian Dark Mode tanpa masalah keterbacaan teks putih di atas latar terang.

### C. Live Supabase Cloud Indicator & Modal
1. **Navbar Cloud Status Pill (`#btnSupabaseStatus`)**:
   - Glassmorphic pill container (`rounded-full`, border halus).
   - Live Glowing Dot: Lingkaran hijau zamrud `#10b981` dengan shadow `0 0 10px rgba(16, 185, 129, 0.5)`.
   - Hover Feedback: Micro-scaling `scale(1.02)` dan pendaran cahaya border.
2. **Modal Integrasi Supabase Cloud**:
   - Input fields: Latar gelap pekat `#090e1a`, border `#223554`, fokus cincin `#1a56c4`.
   - Tombol "Uji Koneksi": Latar biru indigo dengan kontras tinggi teks putih.
   - Tombol "Tarik Data": Latar emerald solid `#10b981` dengan efek hover mendalam.
   - Helper Skema SQL: Monospace cyan `#38bdf8` dalam kotak gelap `#06202a` dengan border presisi `#0e4a5d`.

### D. Buttons & Interactive Controls
- **Primary Action**: Latar Royal Blue (`#1a56c4`), teks putih, rounded-full atau rounded-lg, shadow `0 4px 14px rgba(26,86,196,0.3)`.
- **Secondary Action**: Latar Soft Blue (`#e8f0fd`), teks Royal Blue (`#1a56c4`).
- **Ghost Action**: Tanpa background, transisi hover latar `#f0f4fb` (light) atau `#111d38` (dark).
- **Theme Switcher**: Tombol cepat ikon Sun/Moon dengan rotasi animasi lembut saat transisi mode gelap.

---

## 5. Layout & Responsive Principles
- **Grid Strategy**:
  - Desktop (>1024px): Sidebar navigasi kiri tetap, area konten 12-kolom grid (3–4 kolom kartu analitik).
  - Tablet (768px–1024px): 2 kolom adaptif.
  - Mobile (<768px): 1 kolom modular vertikal, touch targets minimal 44px tinggi tombol, bottom-sheet popups.
- **Spacing Scale**: Berbasis unit 4px (`8px`, `12px`, `16px`, `24px`, `32px`, `48px`).
- **Accessibility & Contrast**: Memenuhi standar rasio kontras WCAG AAA pada mode terang dan mode gelap.
