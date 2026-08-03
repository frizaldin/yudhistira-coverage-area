# Implementation Plan: Restyling & Layouting Cabang.jsx

## Overview
Melakukan perombakan tampilan (restyling) dan tata letak (layouting) secara menyeluruh pada `Cabang.jsx`. Karena file ini berskala sangat besar (~5700 baris), perombakan akan dilakukan secara bertahap menggunakan pendekatan **Vertical Slicing** agar aplikasi tetap bisa berjalan pada setiap tahap.
Panduan desain akan mengacu pada prinsip `ui-ux-pro-max`, `frontend-ui-engineering`, dan `design-taste-frontend` (Tampilan premium, tipografi modern, *glassmorphism*, *hover-states* yang stabil, dan hierarki visual yang jelas).

## Architecture Decisions
- **Desain Sistem & Token**: Tetap menggunakan *inline-styles* atau utility classes (jika Tailwind tersedia) namun dengan token warna (Palette) dan *shadow* yang diperbarui ke versi lebih modern (contoh: *slate-900* untuk teks utama, *box-shadow* yang lebih halus, sudut membulat/border-radius `16px`).
- **Pemisahan Logis**: Mengurangi *clutter* visual dengan menggunakan struktur Grid yang lebih baik dan *glassmorphism* pada elemen floating/card.
- **Konsistensi UX**: Menambahkan *cursor-pointer*, animasi transisi yang mulus (`300ms ease`), dan memperbaiki kontras teks.

## Task List

### Sprint 1: Foundation & Design Tokens
- [ ] **Task 1: Perbarui Objek `T` (Warna) dan `S` (Style Dasar)**. Ubah palet warna menjadi lebih elegan (kurangi saturasi berlebih, gunakan *slate* untuk teks).
- [ ] **Task 2: Restyling Komponen Dasar (`Card`, `Donut`, `ProgressBar`)**. Implementasikan efek *subtle shadow* (`0 4px 20px rgba(0,0,0,0.05)`), *border-radius* modern, dan *padding* yang lebih luas (whitespace).
- [ ] **Task 3: Perbaikan Header & Filter Container**. Buat bagian atas dashboard (judul dan dropdown filter) terlihat lebih menyatu, gunakan *sticky header* dengan efek *glassmorphism* (`backdrop-filter: blur(10px)`).

### Checkpoint: Foundation
- [ ] Komponen utama tidak error dan warna dasar sudah berubah ke gaya modern.

### Sprint 2: High-Level Metrics (KPI Cards & TRL)
- [ ] **Task 4: Restyling "RealStats" / "Overview KPI"**. Buat typography angka lebih besar (bold, misal: Font *Inter/Outfit*), tambahkan *micro-interactions* (hover efek angkat/scale halus).
- [ ] **Task 5: Restyling "Tahan-Rebut-Lepas-Gagal"**. Gunakan warna *background* transparan yang senada dengan warna *icon* (`color + 10% opacity`), hilangkan border tebal yang terkesan kaku.

### Checkpoint: High-Level Metrics
- [ ] Bagian atas dashboard (KPI dan ringkasan angka) sudah terlihat premium dan rapi.

### Sprint 3: Visualisasi Data (Charts & Map)
- [ ] **Task 6: Restyling Map Container (Leaflet)**. Berikan *border-radius*, *subtle inner-shadow*, dan rapikan *Popup* map agar senada dengan UI.
- [ ] **Task 7: Restyling Bar Chart & Donut Chart Layout**. Rapikan letak *legend*, pastikan tooltips pada Bar Chart terlihat premium (dark-mode tooltip style), dan *grid-lines* yang sangat tipis/halus.

### Checkpoint: Visualisasi Data
- [ ] Peta interaktif dan semua grafik sudah sesuai standar visual baru.

### Sprint 4: Data Tables & Leaderboards
- [ ] **Task 8: Restyling Tabel Ranking Sales & Sales Worst**. Hapus border kolom vertikal yang jadul, gunakan *light gray background* selang-seling atau *hover row background*, pertegas tipografi nama Sales.
- [ ] **Task 9: Restyling Tabel "Sales per Jenjang", "Potensi Eksemplar", & "Uncovered"**. Pastikan *alignment* tabel finansial/angka rata kanan, tambahkan indikator warna (titik warna) yang rapi di sebelah nama jenjang/sekolah.

### Checkpoint: Complete
- [ ] Seluruh layout dan styling di `Cabang.jsx` telah konsisten menggunakan UI standar tinggi.
- [ ] Aplikasi direview secara keseluruhan.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| File JSX terlalu besar memicu bug | High | Lakukan edit secara bertahap (per komponen Card/Bagian), jalankan `npm run dev` setiap selesai 1 task. |
| Bentrok styling lama dan baru | Medium | Ubah langsung di objek master `S` dan `T` agar mayoritas komponen otomatis mengikuti. |
| Penurunan performa karena CSS berlebih | Low | Hindari inline-style berantai jika bisa direfaktor, optimalkan penggunaan `map()`. |
