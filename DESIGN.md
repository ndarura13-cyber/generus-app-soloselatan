# Design System: PPG Solo Selatan - Generus App
**Project ID:** 17286285228241563161

## 1. Visual Theme & Atmosphere
Desain PPG Solo Selatan mengusung filosofi **Modern, Bersih, Bersemangat, dan Berkarakter Luhur** dengan sentuhan estetika minimalis kontemporer (mengadopsi prinsip desain **shadcn/ui** New York style yang dipadukan dengan aksen warna khas yayasan).
- **Mood**: Terpercaya (*Trustworthy*), Rapi (*Organized*), Hangat & Bersahabat (*Welcoming*).
- **Elevation & Depth**: Lapisan permukaan putih bersih dengan bayangan halus (*whisper-soft diffused shadows* `0 6px 24px rgba(26, 86, 196, 0.08)`) dan border tipis 1px (`#e2e8f0`) yang tegas dan presisi.

---

## 2. Color Palette & Roles

| Warna | Hex Code | Peran Fungsional |
|---|---|---|
| **Royal Deep Blue** | `#1a56c4` | Warna Primer (Aksi utama, brand navbar, icon aktif, header banner) |
| **Midnight Navy** | `#0a1f52` | Latar Belakang Gelap (Hero gradient, footer, modal overlay) |
| **Luminous Soft Blue** | `#e8f0fd` | Tint Latar Primer (Badge peran, hover button, container icon) |
| **Noble Warm Gold** | `#d4a017` | Aksen Sekunder & Unggulan (Caberawit, peringatan, approval banner) |
| **Pastel Cream Gold** | `#fdf3d0` | Tint Latar Emas (Badge Caberawit, notifikasi penting) |
| **Emerald Soft Green** | `#2e8b57` | Warna Sukses & Presensi (KBM, status selesai, tombol approve) |
| **Mint Pastel Green** | `#d8f3e5` | Tint Latar Hijau (Badge presensi hadir, Remaja) |
| **Coral Crimson** | `#e55c5c` | Status Bahaya / Destruktif (Tombol logout, tolak approval, status alpa) |
| **Clean Crisp Surface** | `#ffffff` | Latar Belakang Kartu & Konten Utama |
| **Slate Canvas Background** | `#f4f7fc` | Latar Belakang Halaman Dashboard & Aplikasi |
| **Charcoal Deep Text** | `#1a1d2e` | Teks Judul & Konten Utama (Keterbacaan Tinggi) |
| **Muted Slate Gray** | `#64748b` | Teks Sekunder, Deskripsi, & Placeholder |
| **Subtle Slate Border** | `#e2e8f0` | Pembatas Kartu, Tabel, & Input Field |

---

## 3. Typography Rules
- **Font Utama (Interface & Body)**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`
  - Body Text: `400` (Regular) / `500` (Medium), line-height: `1.6`
  - Subheadings & Labels: `600` (Semi-bold) / `700` (Bold)
  - Page Titles & Numerals: `800` (Extra-bold)
- **Font Serif Klasik (Khusus Judul Landing Page)**: `'Playfair Display', serif` (Memberikan kesan elegan dan resmi pada header yayasan).
- **Sistem Ikon**: Google **Material Symbols Outlined** (Flat, 1-warna, konsisten dengan ukuran 18px–28px).

---

## 4. Component Stylings (shadcn/ui Inspired)

### A. Buttons (`btn-*`)
- **Default (Primary)**: Latar Royal Blue (`#1a56c4`), teks putih, rounded-full / rounded-md (10px–50px), shadow lembut `0 4px 14px rgba(26,86,196,0.3)`.
- **Secondary**: Latar Soft Blue (`#e8f0fd`), teks Royal Blue (`#1a56c4`), border transparan.
- **Outline**: Latar putih, border 1.5px `#e2e8f0`, teks `#1a1d2e`, hover latar `#f0f4fb`.
- **Destructive**: Latar Coral Red (`#e55c5c`), teks putih, shadow `0 4px 14px rgba(229,92,92,0.3)`.
- **Ghost**: Tanpa latar & border, teks `#64748b`, hover teks `#1a1d2e` & latar `#f0f4fb`.

### B. Cards & Containers (`card`, `section-container`)
- Sudut melengkung halus (*Generously rounded corners* `16px`–`22px`).
- Border tipis presisi `1px solid #e2e8f0`.
- Efek Hover: Transform `translateY(-3px)` dan bayangan lembut elevasi tingkat 2.

### C. Inputs, Selects & Forms
- Border 1.5px `#e2e8f0`, latar `#f4f7fc`, padding `11px 14px`, rounded `10px`–`14px`.
- Fokus State: Border berubah menjadi Royal Blue (`#1a56c4`) dengan ring halus `box-shadow: 0 0 0 3px rgba(26,86,196,0.12)`.
- Label: Font size 12px, font-weight 700, teks `#1a1d2e`.

### D. Badges & Chips
- Bentuk pill (`rounded-full`), padding `3px 10px`, font-size `10px`–`12px`, font-weight `700`.
- Warna latar berbasis tint transparan `10%`–`15%` dari warna peran.

### E. Dialog & Modal Popups
- Overlay backdrop gelap `rgba(10, 25, 60, 0.65)` dengan efek blur `backdrop-filter: blur(8px)`.
- Modal Card di tengah layar dengan animasi scale-in lembut `scale(0.95) -> scale(1.0)`.

---

## 5. Layout Principles
- **Grid Responsif**:
  - Desktop: 3–4 kolom pada statistik, 2 kolom pada form/monitoring.
  - Tablet: 2 kolom.
  - Mobile (<640px): 1 kolom modular vertikal dengan touch-friendly targets (minimal 44px tinggi tombol).
- **Whitespace & Padding**: Spacing konsisten kelipatan 4px/8px (`8px`, `12px`, `16px`, `24px`, `32px`, `48px`).
