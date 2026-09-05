# Rangkuman Fitur Aplikasi PPG Solo Selatan

Dokumen ini berisi daftar lengkap fitur yang telah tersedia di dalam aplikasi web **Penggerak Pembina Generus (PPG) Solo Selatan** (versi saat ini). Anda dapat menggunakan dokumen ini sebagai acuan dasar dan menambahkan fitur baru di bawahnya seiring berjalannya proses pengembangan.

---

## 1. Antarmuka Publik (Halaman Depan / *Landing Page*)
Halaman publik yang dapat diakses oleh siapa saja tanpa perlu *login*. Berfungsi sebagai etalase informasi dan statistik PPG Solo Selatan.
- **Hero Banner & Splash Screen:** Animasi pembuka berlogo PPG dan *banner* selamat datang yang modern.
- **Statistik Cepat (Ringkasan):** Menampilkan total angka Generus, jumlah Desa (5), dan jumlah Kelompok (27) secara langsung yang terintegrasi dengan database lokal.
- **Rincian Jenjang Generus:** Menampilkan tiga tingkatan utama (Caberawit, GP Reguler, Remaja). Dilengkapi dengan tombol-tombol "Pil" untuk melihat rincian per-kelas (PAUD, 1 SD, Mahasiswa, dsb). Jika diklik, akan muncul *Modal Popup* yang berisi data penyebaran generus pada desa bersangkutan beserta rasio Laki-laki / Perempuan.
- **Etalase Program Kerja:** Menampilkan linimasa program kerja unggulan dengan dukungan *pagination* (halaman 1, 2, dll). Terhubung langsung dengan basis data agar selalu ter-update.
- **Fitur Navigasi Pintar:** Tombol "Masuk" yang akan berubah otomatis menjadi "Kelola" apabila sistem mendeteksi bahwa pengurus sudah *login* sebelumnya.

## 2. Sistem Autentikasi (Sederhana)
- **Halaman Login Khusus:** Halaman *login* dengan desain yang bersih dan responsif.
- **Sesi Pengguna (*User Session*):** Menyimpan status *login* ke dalam penyimpanan *browser* sehingga pengguna tidak perlu berulang kali melakukan *login* selama sesi masih aktif.

## 3. Dasbor Pengurus (Halaman Admin)
Halaman sentral bagi para admin dan pengurus untuk mengelola seluruh data secara interaktif tanpa perlu berpindah halaman (berbasis *Single Page Application*).

### A. Manajemen Data Generus
- **Tambah/Edit/Hapus (CRUD):** Kemampuan mengelola data individual siswa secara rinci (NIS, Nama, Kelamin, Tempat Lahir, Tanggal Lahir, Kelas/Status, Nama Orangtua, dll).
- **Penghitungan Umur Otomatis:** Sistem yang secara otomatis menghitung usia berdasarkan tanggal lahir.
- **Algoritma Kelas Remaja & Pra-Nikah Otomatis:** Apabila status keadaan (Mahasiswa/Bekerja) tidak dipilih, sistem akan otomatis menentukan kelas berdasarkan usia (19-22 Tahun masuk Pra-Nikah, > 22 Tahun masuk Kelas Remaja).
- **Filter & Pencarian Lanjutan:** Fitur pencarian instan berdasarkan Nama atau NIS, lengkap dengan filter turun menurun dari Desa ➔ Kelompok ➔ Kategori ➔ Jenjang Kelas.

### B. Manajemen KBM (Kegiatan Belajar Mengajar) & Absensi
- **Jadwal KBM:** Pengurus dapat membuat entri agenda (contoh: "Pengajian Kelompok Senin").
- **Presensi Instan:** Tombol satu kali klik untuk menandai Hadir (H), Izin (I), Sakit (S), atau Alpha (A) untuk setiap generus yang terdaftar di kelompok tersebut.
- **Rekap Kehadiran (Tabel Cetak):** Halaman khusus laporan kehadiran yang terformat rapi (seperti buku presensi fisik) yang menampilkan daftar H, I, S, A dalam rentang tanggal tertentu, dan **siap dicetak (Print)**.

### C. Manajemen Target Pembiasaan Karakter
- **Penilaian Karakter Luhur:** Fitur untuk menilai poin-poin 29 karakter luhur atau pembiasaan rutin.
- **Rekap Pembiasaan (Tabel Cetak):** Halaman pelaporan matrik nilai pembiasaan untuk dievaluasi oleh PPG. Format sudah disesuaikan agar rapi saat dicetak ke PDF/Kertas.

### D. Manajemen Program Kerja (Proker)
- **Status Proker Interaktif:** Pengurus dapat menambahkan rencana program, menugaskan PIC, menetapkan waktu & tempat, lalu mengubah statusnya menjadi "Direncanakan", "Berjalan", atau "Selesai".
- Perubahan di sini akan langsung mengubah tampilan linimasa Proker di Halaman Publik.

### E. Manajemen Pengurus PPG
- **Daftar & Peran:** Fitur untuk mendaftarkan Mubaligh, Mubalighot, Ketua Kelompok, atau Pengurus Desa, lengkap dengan status Aktif / Tidak Aktif.

---

## 4. Teknologi & Arsitektur
- **Progressive Web App (PWA):** Dapat diinstal di layar beranda *smartphone* seperti aplikasi *native* (memiliki file `manifest.json` dan `sw.js`).
- **Database Lokal Sederhana:** Menggunakan `localStorage` browser untuk menyimpan semua state secara sinkronus tanpa perlu koneksi server (*Offline First*) untuk sementara waktu.
- **Desain Adaptif:** Semua tampilan dirancang 100% *Mobile-First*, fleksibel untuk semua ukuran layar menggunakan metode CSS flexbox/grid murni tanpa tambahan *library* berat.

---

*(Silakan tambahkan draf fitur baru atau catatan lain di bawah batas ini)*

## Rencana Tambahan Fitur Selanjutnya
1. ...
2. ...
3. ...


---
<br>

<details>
<summary><b>Log Pembaruan Sebelumnya (Changelog)</b></summary>

**Pembaruan Algoritma & Perbaikan Bug**
- **Perbaikan Sintaks:** Sebelumnya terdapat sebuah kesalahan ketik struktural (*syntax error*) pada script aplikasi utama (`app.js`) yang membuat *Modal Popup Jenjang* tidak dapat diklik. Kode telah dipulihkan dan fitur popup kembali 100% berfungsi normal.
- **Revisi Algoritma Umur Remaja:** Diperbarui agar Usia 19-22 Tahun otomatis diubah menjadi "Pra-Nikah", dan usia > 22 Tahun (sebelum menikah) otomatis diubah menjadi "Kelas Remaja".
- **Sinkronisasi Tombol UI:** Seluruh daftar tombol di antarmuka publik kini sama persis dengan apa yang ada di Database tanpa indikator angka berlebih (PAUD, TK A, B, 1-6 SD, dst).
</details>
