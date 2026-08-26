import React from "react";

/**
 * Dokumentasi Bab 2 — 4 dashboard inti (Sales / Area / Cabang / Dana BOS).
 * Dipakai oleh DaftarIsiBab2.jsx
 */
export const DASHBOARD_PAGES = [
    {
        id: "dash-sales",
        title: "1. Dashboard Sales",
        badge: "Sales Detail",
        subtitle:
            "URL contoh: /sales-performance?area_id=8&cabang_id=52&sales_id=3&tahun= — scope satu sales person.",
        intro: (
            <>
                Dashboard operasional untuk <strong>satu sales</strong>. Layout
                memakai komponen yang sama dengan Cabang/Area (
                <code>DashboardTab</code>), tapi scope data = sekolah &
                aktivitas milik <code>sales_id</code> terpilih.
                <br />
                Tab:{" "}
                <strong>
                    Dashboard Utama · Kecamatan · Sekolah · Kegiatan Sales
                </strong>
                .
            </>
        ),
        sections: [
            {
                id: "sales-tabs",
                title: "Navigasi Tab",
                comps: [
                    {
                        name: "Dashboard Utama",
                        desc: "KPI score, Area Cover, Realisasi, Achievement, komposisi jenjang/sumber dana, TRL, aktivitas, priority school, dan peta kompetitor per kecamatan.",
                    },
                    {
                        name: "Kecamatan",
                        desc: "Daftar kecamatan dalam coverage sales: total sekolah, area cover, potensi siswa, dll.",
                    },
                    {
                        name: "Sekolah",
                        desc: "List sekolah (customer) milik sales dengan filter/search dan metrik Potensi / SP / Real.",
                    },
                    {
                        name: "Kegiatan Sales",
                        desc: "Ringkasan & daftar aktivitas sales (Pendekatan, Promosi, SP, Faktur, Penagihan, Gagal) beserta distribusi bulanan.",
                    },
                ],
            },
            {
                id: "sales-kpi",
                title: "Dashboard Utama — Kartu KPI atas",
                comps: [
                    {
                        name: "Profil Sales",
                        desc: "Identitas sales: nama, kode, cabang, dan area. Menjadi konteks scope halaman.",
                    },
                    {
                        name: "Sales Score (AI)",
                        desc: "Skor 0–100 + grade (Sangat Baik / Baik / Cukup / Kurang / Buruk). Klik ikon info untuk detail tiap indikator berbobot.",
                        interact: "Klik info → popup komponen skor.",
                        rumus: "Total = Σ (skor_indikator × bobot) untuk 5 indikator positif (total bobot 100%), lalu dikurangi penalti Lepas. Detail bobot di Bab 3 & Pengaturan.",
                        note: "Indikator: Realisasi YoY, Customer Realisasi vs AC, Achievement Target, Tahan vs AC, Rebut vs AC; penalti: Lepas vs AC.",
                    },
                    {
                        name: "Area Cover & Potensi",
                        desc: "Kiri: jumlah sekolah Area Cover (AC) tahun berjalan. Kanan: potensi/rencana jual eksemplar (agregat target/potential dari Customer Plan).",
                        rumus: "AC = jumlah sekolah dengan is_ac = 1 (tahun target). Potensi eksemplar = Σ potential/target_exemplar plan tahun berjalan.",
                    },
                    {
                        name: "Realisasi Sekolah + Eksemplar",
                        desc: "Jumlah sekolah yang sudah terealisasi (real_exemplar > 0) dan total eksemplar terealisasi tahun berjalan.",
                        rumus: "Sekolah realisasi = count(real_exemplar > 0). Real eksemplar = Σ real_exemplar tahun target.",
                    },
                    {
                        name: "Achievement Target",
                        desc: "Persentase capaian realisasi terhadap target/potensi, serta rasio customer realisasi vs Area Cover.",
                        rumus: "Ach eksemplar = (Real eksemplar ÷ Target/Potensi) × 100 (cap 100 untuk skor). Ach AC = (Customer realisasi ÷ AC) × 100.",
                    },
                ],
            },
            {
                id: "sales-mid",
                title: "Dashboard Utama — Komposisi & Status",
                comps: [
                    {
                        name: "Identifikasi Jenjang / Segmen",
                        desc: "Donut/breakdown jumlah sekolah AC per jenjang (SD/SMP/SMA/SMK) beserta realisasi & SP.",
                    },
                    {
                        name: "Sumber Dana",
                        desc: "Komposisi sekolah AC berdasarkan sumber dana (BOS, SWA, dll.).",
                    },
                    {
                        name: "Distribusi Potensi Siswa",
                        desc: "Bucket jumlah siswa: <100, 100–300, 301–500, >500 — dihitung dari sekolah AC.",
                    },
                    {
                        name: "Kompetitor (Penerbit)",
                        desc: "Distribusi penerbit/kompetitor pada sekolah AC.",
                    },
                    {
                        name: "Status Customer (Baru / Retain / Loss)",
                        desc: "Baru = Rebut, Retain = Tahan, Loss = Lepas — berdasarkan realisasi tahun lalu vs tahun ini pada sekolah AC.",
                        rumus: "Tahan = ada realisasi tahun lalu DAN tahun ini. Rebut = tidak ada realisasi tahun lalu, ada tahun ini. Lepas = selain itu (termasuk belum terealisasi).",
                    },
                    {
                        name: "Aktivitas Sales (fixed order)",
                        desc: "Breakdown aktivitas: Pendekatan → Promosi → SP → Faktur → Penagihan → Gagal (kategori kosong tetap tampil = 0).",
                    },
                ],
            },
            {
                id: "sales-bottom",
                title: "Dashboard Utama — Priority & Peta",
                comps: [
                    {
                        name: "Top 10 Priority School",
                        desc: "10 sekolah AC dengan jumlah siswa terbesar. Kolom: nama, jenjang, siswa, potensi SWA/BOS, status Tahan/Rebut, SP, Real.",
                    },
                    {
                        name: "Peta Map Area Cover",
                        desc: "Choropleth per kecamatan: dominasi penerbit + shading area coverage sales.",
                        note: "Mode sales = level kecamatan (butuh sales_id).",
                    },
                ],
            },
            {
                id: "sales-score-rumus",
                title: "Rumus skor (ringkas)",
                comps: [
                    {
                        name: "Realisasi YoY",
                        desc: "Membandingkan realisasi eksemplar tahun ini vs tahun lalu.",
                        rumus: "Jika curr ≥ prev → 100. Jika turun → (curr/prev)×100. Jika prev = 0 → 100 bila curr > 0, else 0.",
                    },
                    {
                        name: "Customer Realisasi vs AC",
                        rumus: "min(100, (jumlah sekolah realisasi ÷ AC) × 100).",
                    },
                    {
                        name: "Achievement Target",
                        rumus: "min(100, (real eksemplar ÷ target eksemplar) × 100).",
                    },
                    {
                        name: "Tahan / Rebut / Lepas vs AC",
                        rumus: "Tahan% = (Tahan÷AC)×100; Rebut% = (Rebut÷AC)×100; Lepas% = (Lepas÷AC)×100 — Lepas dipakai sebagai penalti (mengurangi skor).",
                    },
                ],
            },
        ],
    },

    {
        id: "dash-area",
        title: "2. Dashboard Area",
        badge: "Area",
        subtitle:
            "URL contoh: /monitoring/area/8 — agregat seluruh cabang di area tersebut (tanpa ?cabang=).",
        intro: (
            <>
                Scope = <strong>semua cabang</strong> dalam satu area. UI
                dashboard utama sama seperti Cabang/Sales (
                <code>DashboardTab</code>), tanpa drill-down sales.
                <br />
                Tab:{" "}
                <strong>
                    Dashboard Utama · Cabang · Jenjang · Marketshare
                </strong>
                .
            </>
        ),
        sections: [
            {
                id: "area-tabs",
                title: "Navigasi Tab",
                comps: [
                    {
                        name: "Dashboard Utama",
                        desc: "KPI Area Score, Area Cover, Realisasi, Achievement, komposisi, Top Kecamatan, peta kota/kab seluruh area.",
                    },
                    {
                        name: "Cabang",
                        desc: "Tabel list semua cabang di area: Total Sekolah, Total AC, Potensi/SP/Real tahun lalu & tahun ini, Growth Real %.",
                        rumus: "Growth Real % = ((Real tahun ini − Real tahun lalu) ÷ Real tahun lalu) × 100. Jika tahun lalu = 0 → 100% bila ada realisasi, else 0%.",
                        interact:
                            "Klik nama cabang → buka dashboard cabang (/monitoring/area/{id}?cabang=…).",
                    },
                    {
                        name: "Jenjang",
                        desc: "Tabel Area Cover ala AnalisisTab: grouping Cabang → Kota/Kab → Kecamatan → Jenjang → Sekolah, kolom Real Y−3/Y−2 + Potensi/SP/Real tahun lalu & tahun ini.",
                    },
                    {
                        name: "Marketshare",
                        desc: "Tabel market share: grouping per Cabang, baris = Kota/Kab. Kolom Total Sekolah (Dapodik), AC, Real, SP, Market Share %.",
                        rumus: "Market Share % = (Area Cover ÷ Total Sekolah Dapodik) × 100.",
                    },
                ],
            },
            {
                id: "area-kpi",
                title: "Dashboard Utama — Kartu KPI",
                comps: [
                    {
                        name: "Profil Area",
                        desc: "Menampilkan nama/kode area sebagai konteks scope.",
                    },
                    {
                        name: "Area Score (AI)",
                        desc: "Skor agregat area — rumus sama dengan Sales Score, dihitung dari seluruh sekolah AC di area.",
                        rumus: "Sama seperti Sales Score (lihat dashboard Sales / Bab 3). Scope = area_id.",
                        note: "Detail komponen & bobot: klik info pada kartu skor.",
                    },
                    {
                        name: "Total Sekolah (opsional)",
                        desc: "Jika tersedia dari master kecamatan/Dapodik cabang: total universe sekolah di area + jumlah kecamatan.",
                    },
                    {
                        name: "Area Cover & Potensi",
                        desc: "AC seluruh cabang di area + potensi/rencana jual eksemplar agregat.",
                        rumus: "AC = count sekolah is_ac=1 di area. Potensi = Σ potential/target plan tahun target.",
                    },
                    {
                        name: "Realisasi & Achievement",
                        desc: "Sama konsep dengan dashboard Sales, dihitung agregat area.",
                        rumus: "Ach = (Real ÷ Target) × 100; Customer vs AC = (sekolah realisasi ÷ AC) × 100.",
                    },
                ],
            },
            {
                id: "area-lain",
                title: "Dashboard Utama — Konten lain",
                comps: [
                    {
                        name: "TRL (Tahan / Rebut / Lepas)",
                        desc: "Status customer pada sekolah AC area, plus breakdown per jenjang.",
                        rumus: "Tahan / Rebut / Lepas — definisi sama seperti dashboard Sales.",
                    },
                    {
                        name: "Top 10 Kecamatan",
                        desc: "10 kecamatan (dari sekolah AC) dengan siswa terbanyak: siswa, potensi, SP, realisasi.",
                    },
                    {
                        name: "Peta Map Area Cover",
                        desc: "Choropleth per kota/kab untuk seluruh area (level=kota + area_id).",
                        note: "Tanpa map sales_id; polygon dari boundary kabupaten/kota.",
                    },
                ],
            },
        ],
    },

    {
        id: "dash-cabang",
        title: "3. Dashboard Cabang",
        badge: "Cabang",
        subtitle:
            "URL contoh: /monitoring/area/8?cabang=52 — scope satu cabang.",
        intro: (
            <>
                Scope = <strong>satu cabang</strong>. Dashboard utama sama
                seperti Sales/Area, dengan peta kota/kab milik cabang.
                <br />
                Tab:{" "}
                <strong>
                    Dashboard Utama · Sales · Kecamatan · Jenjang · Kompetitor &
                    Market Share
                </strong>
                .
            </>
        ),
        sections: [
            {
                id: "cab-tabs",
                title: "Navigasi Tab",
                comps: [
                    {
                        name: "Dashboard Utama",
                        desc: "KPI Cabang Score, Area Cover, Realisasi, Achievement, komposisi, Top Kecamatan, peta kota/kab cabang.",
                    },
                    {
                        name: "Sales",
                        desc: "Daftar seluruh sales di cabang beserta metrik performa; klik baris → Dashboard Sales Detail.",
                    },
                    {
                        name: "Kecamatan",
                        desc: "List kecamatan cabang dengan metrik coverage/sekolah.",
                    },
                    {
                        name: "Jenjang",
                        desc: "Tabel Area Cover (AnalisisTab): grouping Kota/Kab → Kecamatan → Jenjang → Sekolah. Kolom Real Y−3/Y−2 + Potensi/SP/Real 2 tahun.",
                        interact:
                            "Filter Kota/Kab, sort header, expand/collapse group, pagination 100 baris.",
                    },
                    {
                        name: "Kompetitor & Market Share",
                        desc: "Tabel market share per kecamatan digroup Kota/Kab: Total Sekolah (Dapodik), AC, Real, SP, Market Share %.",
                        rumus: "Market Share % = (AC ÷ Total Sekolah Dapodik) × 100.",
                    },
                ],
            },
            {
                id: "cab-kpi",
                title: "Dashboard Utama — Kartu KPI",
                comps: [
                    {
                        name: "Profil Cabang",
                        desc: "Nama cabang + area induk.",
                    },
                    {
                        name: "Cabang Score (AI)",
                        desc: "Skor agregat cabang — rumus identik Sales/Area Score pada scope cabang_id.",
                        rumus: "Lihat rumus skor di Dashboard Sales / Bab 3.",
                    },
                    {
                        name: "Total Sekolah",
                        desc: "Universe sekolah cabang dari master kecamatan (Σ dapodik_customer) + jumlah kecamatan master.",
                    },
                    {
                        name: "Area Cover & Potensi",
                        desc: "AC cabang + potensi/rencana jual eksemplar tahun target.",
                        rumus: "AC = count is_ac=1. Potensi = Σ potential/target plan.",
                    },
                    {
                        name: "Realisasi & Achievement",
                        desc: "Sekolah terealisasi, total eksemplar, % achievement target, % customer vs AC.",
                        rumus: "Ach = Real ÷ Target × 100; vs AC = Customer realisasi ÷ AC × 100.",
                    },
                ],
            },
            {
                id: "cab-lain",
                title: "Dashboard Utama — Konten lain",
                comps: [
                    {
                        name: "TRL + breakdown jenjang",
                        desc: "Status Tahan/Rebut/Lepas pada sekolah AC cabang.",
                        rumus: "Definisi Tahan/Rebut/Lepas sama dengan dashboard Sales.",
                    },
                    {
                        name: "Top 10 Kecamatan",
                        desc: "Prioritas kecamatan di cabang berdasarkan jumlah siswa (AC).",
                    },
                    {
                        name: "Peta Map Area Cover",
                        desc: "Choropleth per kota/kab dalam cabang (level=kota + cabang_id).",
                    },
                ],
            },
        ],
    },

    {
        id: "dana-bos",
        title: "4. Dashboard Dana BOS",
        badge: "BOS",
        subtitle:
            "URL: /monitoring/dana-bos — monitoring khusus sekolah sumber dana BOS (filter Tahun / Area / Cabang).",
        intro: (
            <>
                Data di-filter{" "}
                <strong>sumber dana mengandung &quot;BOS&quot;</strong>.
                Overview memakai layout <code>DashboardTab</code> seperti Area,
                tetapi <strong>tanpa peta</strong> dan{" "}
                <strong>tanpa skor/penilaian</strong>.
                <br />
                Tab: <strong>Overview · Tabel Segmen</strong>.
                <br />
                <strong>Khusus Dana BOS:</strong> rumus potensi = total siswa ×
                1,5 (tidak memakai potential_exemplar dari plan).
            </>
        ),
        sections: [
            {
                id: "bos-tabs",
                title: "Navigasi Tab",
                comps: [
                    {
                        name: "Overview",
                        desc: "Dashboard KPI BOS: Total Sekolah BOS, Area Cover, Realisasi, Achievement, komposisi, Top Cabang (bukan kecamatan).",
                    },
                    {
                        name: "Tabel Segmen",
                        desc: "Hierarki Area → Cabang → Kota/Kab → Kecamatan (leaf = agregat kecamatan AC BOS).",
                    },
                ],
            },
            {
                id: "bos-kpi",
                title: "Overview — Kartu KPI",
                comps: [
                    {
                        name: "Profil Dana BOS",
                        desc: "Konteks halaman (bukan sales person). Tidak menampilkan Sales/Area Score.",
                        note: "Kartu skor disembunyikan (hideScore).",
                    },
                    {
                        name: "Total Sekolah BOS",
                        desc: "Jumlah seluruh sekolah ber-sumber dana BOS di scope filter. Sub: total siswa + potensi (siswa × 1,5).",
                        rumus: "Total sekolah = count(customer sumber_dana LIKE %BOS%). Potensi = Σ siswa × 1,5.",
                    },
                    {
                        name: "Area Cover & Potensi",
                        desc: "Kiri: jumlah sekolah BOS yang AC. Kanan: potensi eksemplar dari siswa sekolah AC saja.",
                        rumus: "Potensi AC (Dana BOS) = (Σ total_student sekolah AC) × 1,5. Rumus ini hanya di halaman Dana BOS.",
                    },
                    {
                        name: "Realisasi Sekolah + Eksemplar",
                        desc: "Jumlah sekolah BOS terealisasi + total realisasi eksemplar tahun target (dari plan BOS).",
                    },
                    {
                        name: "Achievement Target",
                        desc: "% capaian realisasi vs target/potensi plan, dan rasio customer realisasi vs AC.",
                        rumus: "Ach = Real ÷ Target × 100 (mengikuti field target plan). Catatan: potensi kartu AC memakai rumus siswa×1,5, berbeda dari target plan bila ada.",
                    },
                ],
            },
            {
                id: "bos-lain",
                title: "Overview — Konten lain",
                comps: [
                    {
                        name: "Komposisi Jenjang / Sumber Dana / Siswa / Kompetitor / Status",
                        desc: "Sama pola DashboardTab, dihitung hanya dari sekolah BOS (AC untuk sebagian chart).",
                    },
                    {
                        name: "Top 10 Cabang",
                        desc: "Menggantikan Top Kecamatan. 10 cabang dengan siswa AC BOS terbanyak: siswa, potensi, SP, realisasi.",
                    },
                    {
                        name: "Tanpa peta",
                        desc: "Bag Map Area Cover tidak ditampilkan di Dana BOS.",
                    },
                ],
            },
            {
                id: "bos-segmen",
                title: "Tab Tabel Segmen — Kolom & Rumus",
                comps: [
                    {
                        name: "Hierarki",
                        desc: "Area → Cabang → Kota/Kab → Kecamatan. Leaf = agregat kecamatan (bukan sekolah per sekolah). Filter Area/Cabang/Kota + search nama.",
                        interact:
                            "Expand/collapse tiap level; sort header; pagination 100 baris.",
                    },
                    {
                        name: "Kolom dasar",
                        desc: "No, Kecamatan, Siswa, Potensi.",
                        rumus: "Potensi = Siswa × 1,5.",
                    },
                    {
                        name: "Kolom historis Real",
                        desc: "Kolom terpisah: Real tahun (Y−3) dan Real tahun (Y−2), mis. 2023 Real & 2024 Real jika tahun target 2026.",
                    },
                    {
                        name: "Kolom tahun lalu (Y−1) & tahun ini",
                        desc: "Masing-masing: SP, Real, Real vs Potensi %.",
                        rumus: "Real vs Potensi % = (Real ÷ (Siswa × 1,5)) × 100.",
                        note: "Warna %: hijau ≥70, kuning ≥40, merah >0, abu = 0.",
                    },
                ],
            },
        ],
    },
];
