const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../features/dashboard/dashboard-generus.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add currentSiswaSort
if (!code.includes('let currentSiswaSort')) {
  code = code.replace(
    /let currentSiswaFilter = \{.*?\};/,
    `$&
let currentSiswaSort = { key: 'nama_lengkap', dir: 'asc' };
if (typeof window !== 'undefined') window.sortSiswa = (key) => {
  if (currentSiswaSort.key === key) {
    currentSiswaSort.dir = currentSiswaSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSiswaSort.key = key;
    currentSiswaSort.dir = 'asc';
  }
  import('./dashboard-generus.js').then(m => m.renderSiswaTableRows());
};`
  );
}

// 2. Simplify getKelasFilterOptions
code = code.replace(
  /let defaultLabel = 'Semua Tingkat Caberawit \(PAUD - SD\)';/g,
  `let defaultLabel = 'Caberawit (PAUD-SD)';`
);
code = code.replace(
  /let defaultLabel = 'Semua Kelas GP \(SMP - SMA\)';/g,
  `let defaultLabel = 'GP (SMP-SMA)';`
);
code = code.replace(
  /let defaultLabel = 'Semua Status Remaja \/ Dewasa';/g,
  `let defaultLabel = 'Remaja / Dewasa';`
);

// 3. Simplify UI filter strings in renderSiswaModal
code = code.replace(
  /<option value="all">🌟 Semua Kategori Jenjang \(Seluruh Usia\)<\/option>/g,
  `<option value="all">🌟 Semua Jenjang Usia</option>`
);
code = code.replace(
  /<option value="caberawit" (.*?)>🌱 Caberawit \(PAUD - SD\)<\/option>/g,
  `<option value="caberawit" $1>🌱 Caberawit</option>`
);
code = code.replace(
  /<option value="gp_reguler" (.*?)>📚 GP Reguler \(SMP - SMA\)<\/option>/g,
  `<option value="gp_reguler" $1>📚 GP Reguler</option>`
);
code = code.replace(
  /<option value="remaja" (.*?)>🎓 Remaja &amp; Dewasa \(Muda-mudi &amp; Pra-Nikah\)<\/option>/g,
  `<option value="remaja" $1>🎓 Remaja &amp; Dewasa</option>`
);

// 4. Compact the filter row
code = code.replace(
  /<div style="display:grid;grid-template-columns:repeat\(auto-fit, minmax\(160px, 1fr\)\);gap:10px;(.*?)">/g,
  `<div style="display:flex;flex-wrap:wrap;gap:8px;$1">`
);
// Make the selects flex-grow so they fill the row nicely, remove width:100% wrapper if possible, but let's just make the divs flex: 1 1 160px
code = code.replace(
  /<div style="position:relative;">/g,
  `<div style="position:relative;flex:1 1 160px;min-width:160px;">`
);
code = code.replace(
  /<div>\s*<select id="filterSiswa(Desa|Kelompok|Status)"/g,
  `<div style="flex:1 1 140px;min-width:140px;">\n          <select id="filterSiswa$1"`
);

// Remove the grid-column:1 / -1 from buttons
code = code.replace(
  /<div style="display:flex;gap:8px;grid-column:1 \/ -1;justify-content:flex-end;flex-wrap:wrap;margin-top:2px;">/g,
  `<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;flex:1 1 100%;">`
);

// 5. Sorting headers in the table and move Aksi to left
// Original THs
const oldThead = `
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #cbd5e1;width:38px;">
                <input type="checkbox" id="checkAllSiswa" title="Pilih Semua di Halaman Ini" style="cursor:pointer;width:15px;height:15px;" />
              </th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">No</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Nama Lengkap</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Tempat Lahir</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Tgl Lahir</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Desa</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Kelompok</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Usia</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">L/P</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Jenjang &amp; Kelas</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">No. HP</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Domisili</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Status</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Aksi</th>
`;

const newThead = `
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #cbd5e1;width:38px;">
                <input type="checkbox" id="checkAllSiswa" title="Pilih Semua di Halaman Ini" style="cursor:pointer;width:15px;height:15px;" />
              </th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Aksi</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">No</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('nama_lengkap')">Nama Lengkap ↕️</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('tempat_lahir')">Tempat Lahir ↕️</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('tanggal_lahir')">Tgl Lahir ↕️</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('desa_id')">Desa ↕️</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('kelompok_id')">Kelompok ↕️</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('usia')">Usia ↕️</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('jenis_kelamin')">L/P ↕️</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('kategori_usia')">Jenjang &amp; Kelas ↕️</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1;white-space:nowrap;">No. HP</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;">Domisili</th>
              <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #cbd5e1;white-space:nowrap;cursor:pointer;" onclick="sortSiswa('status_sambung')">Status ↕️</th>
`;

code = code.replace(oldThead.trim(), newThead.trim());

// 6. Implement sorting logic in renderSiswaTableRows
const sortLogic = `
  const filtered = rawList.filter(s => {
    if (currentSiswaFilter.status !== 'all' && s.status_sambung !== currentSiswaFilter.status) return false;
    if (currentSiswaFilter.desa !== 'all' && s.desa_id !== currentSiswaFilter.desa) return false;
    if (currentSiswaFilter.kelompok !== 'all' && s.kelompok_id !== currentSiswaFilter.kelompok) return false;
    if (currentSiswaFilter.jenjang !== 'all' && s.kategori_usia !== currentSiswaFilter.jenjang) return false;
    if (currentSiswaFilter.kelas !== 'all' && s.jenjang_kelas !== currentSiswaFilter.kelas) return false;
    if (currentSiswaFilter.search) {
      const q = currentSiswaFilter.search.toLowerCase();
      if (!(s.nama_lengkap.toLowerCase().includes(q) || (s.nis || '').includes(q))) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    let valA = a[currentSiswaSort.key] || '';
    let valB = b[currentSiswaSort.key] || '';
    if (currentSiswaSort.key === 'usia') {
      valA = calculateUmur(a.tanggal_lahir);
      valB = calculateUmur(b.tanggal_lahir);
    }
    if (valA < valB) return currentSiswaSort.dir === 'asc' ? -1 : 1;
    if (valA > valB) return currentSiswaSort.dir === 'asc' ? 1 : -1;
    return 0;
  });
`;

code = code.replace(
  /const filtered = rawList\.filter\(s => \{[\s\S]*?return true;\s*\}\);/,
  sortLogic.trim()
);

// 7. Move "Aksi" column in table rows
// Currently it is the LAST td in the map function
code = code.replace(
  /(<td style="padding:10px 8px;text-align:center;border-bottom:1px solid #e2e8f0;">\s*<input type="checkbox"[^>]+>\s*<\/td>)([\s\S]*?)(<td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e2e8f0;white-space:nowrap;">\s*<button type="button" class="btn-edit-siswa"[\s\S]*?<\/td>)/g,
  `$1\n            $3$2`
);


fs.writeFileSync(filePath, code);
console.log('Successfully updated dashboard-generus.js');
