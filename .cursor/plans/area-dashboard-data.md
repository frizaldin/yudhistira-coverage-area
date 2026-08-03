# Plan: Improvisasi Data Dashboard Area

**Status:** Selesai diimplementasi (2026-08-03)  
**Context:** Bandingkan `/monitoring/sales-performance?area_id=8&cabang_id=52&sales_id=3` vs `/monitoring/area/8`  
**Tanggal:** 2026-08-03

---

## Peran halaman

| Halaman | Fokus |
|---------|--------|
| Sales Performance detail | Performa **1 sales** |
| Area `/monitoring/area/{id}` | **Rangkuman semua sales** di area + banding cabang |

---

## Yang sudah diimplementasi

### Backend (`MonitoringController::area`)
1. Fondasi diganti ke `buildUniversalDashboardData('AREA', $id)` → isi `rankingKecamatan`, `timSalesPerformance`, `trlJenjang`, `jenjang` AC, `mapMarkers`, dll.
2. **Ranking Cabang** (`ranking`) + jumlah sales per cabang
3. **Uncovered per cabang** (`uncovered`)
4. **Area Governance** (`gov`) dari distribusi coverage kecamatan
5. **KPI strip agregat** (`insights` object): Achievement, Realisasi, Gap YoY, Rencana Jual, Area Cover, Customer Realisasi + activity count
6. **Komposisi:** `segmenBreakdown`, `customerStatusBreakdown` (Baru/Retain/Loss dari realisasi plan)

### Frontend (`Area.jsx`)
1. Ranking kiri = Ranking Cabang (fallback kecamatan)
2. KPI strip 6 kartu berwarna
3. Area Governance + Segmen + Customer Status
4. Sekolah Belum Cover per Cabang (ganti placeholder Pra Area Cover)
5. Nama sales → link ke sales-performance detail
6. Judul memakai `areaName`

### Tidak ikut (sesuai plan)
- Sales Score individu / profil 1 sales
- Tab Kegiatan / non-cover per orang

---

## Catatan teknis

- `area($id)` + `?cabang=` → tetap ke halaman Cabang via universal builder.
- `buildDashboardData` masih dipakai Nasional.
- File: `MonitoringController.php` · `Area.jsx`
