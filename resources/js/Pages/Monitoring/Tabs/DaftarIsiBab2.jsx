import React, { useState } from "react";
import { DASHBOARD_PAGES } from "./DaftarIsiDashboards";

const T = {
    blue: "#2563eb",
    green: "#10b981",
    orange: "#f59e0b",
    red: "#ef4444",
    purple: "#8b5cf6",
    slate: "#475569",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

/** Accordion item — nested levels supported */
function Accordion({
    id,
    title,
    badge,
    subtitle,
    open,
    onToggle,
    children,
    level = 1,
}) {
    const isL1 = level === 1;
    const isL2 = level === 2;
    return (
        <div
            style={{
                border: `1px solid ${T.border}`,
                borderRadius: isL1 ? 10 : 8,
                overflow: "hidden",
                background: isL1 ? "#fff" : isL2 ? T.bg : "#fff",
                marginBottom: isL1 ? 8 : 6,
            }}
        >
            <button
                type="button"
                onClick={() => onToggle(id)}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: isL1 ? "12px 14px" : "9px 12px",
                    border: "none",
                    background: open
                        ? isL1
                            ? "#eff6ff"
                            : "#f1f5f9"
                        : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                }}
            >
                <i
                    className={`bi bi-chevron-${open ? "down" : "right"}`}
                    style={{
                        fontSize: isL1 ? 12 : 10,
                        color: T.blue,
                        marginTop: 3,
                        flexShrink: 0,
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <span
                            style={{
                                fontSize: isL1 ? 13.5 : isL2 ? 12 : 11.5,
                                fontWeight: 800,
                                color: T.text,
                            }}
                        >
                            {title}
                        </span>
                        {badge && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: T.blue,
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 999,
                                    padding: "1px 7px",
                                }}
                            >
                                {badge}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                fontSize: 11,
                                color: T.slate,
                                marginTop: 3,
                                lineHeight: 1.4,
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
            </button>
            {open && (
                <div
                    style={{
                        padding: isL1 ? "4px 14px 14px 36px" : "2px 12px 10px 28px",
                        borderTop: `1px solid ${T.border}`,
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

function Comp({ name, desc, note, interact, rumus }) {
    return (
        <div
            style={{
                padding: "8px 0",
                borderBottom: "1px dashed #e2e8f0",
            }}
        >
            <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>
                {name}
            </div>
            <div
                style={{
                    fontSize: 11.5,
                    color: T.slate,
                    lineHeight: 1.5,
                    marginTop: 3,
                }}
            >
                {desc}
            </div>
            {rumus && (
                <div
                    style={{
                        fontSize: 11,
                        color: "#1e40af",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: 6,
                        padding: "6px 8px",
                        marginTop: 5,
                        lineHeight: 1.45,
                        fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    }}
                >
                    <span style={{ fontWeight: 800, fontFamily: "inherit" }}>
                        Rumus:{" "}
                    </span>
                    {rumus}
                </div>
            )}
            {interact && (
                <div
                    style={{
                        fontSize: 11,
                        color: T.blue,
                        marginTop: 4,
                        lineHeight: 1.4,
                    }}
                >
                    <i className="bi bi-hand-index-thumb" style={{ marginRight: 4 }} />
                    Interaksi: {interact}
                </div>
            )}
            {note && (
                <div
                    style={{
                        fontSize: 11,
                        color: "#92400e",
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: 6,
                        padding: "5px 8px",
                        marginTop: 5,
                        lineHeight: 1.4,
                    }}
                >
                    {note}
                </div>
            )}
        </div>
    );
}

function Bullet({ children }) {
    return (
        <li style={{ marginBottom: 4, lineHeight: 1.45 }}>{children}</li>
    );
}

const PAGES = [
    ...DASHBOARD_PAGES,
    {
        id: "peta",
        title: "Peta Coverage",
        badge: "Semua level",
        subtitle: "Visualisasi geografis coverage sekolah di peta.",
        intro: (
            <>
                Halaman full-map berbasis Leaflet (basemap Carto Voyager). Marker
                di-plot dari data sekolah/customer yang punya koordinat.
            </>
        ),
        sections: [
            {
                id: "peta-map",
                title: "Komponen Peta",
                comps: [
                    {
                        name: "MapContainer + TileLayer",
                        desc: "Peta interaktif full screen (dalam layout). Mendukung zoom, pan, dan fit bounds otomatis ke seluruh marker.",
                        interact: "Scroll untuk zoom, drag untuk pan.",
                    },
                    {
                        name: "Marker sekolah",
                        desc: "Setiap marker mewakili lokasi sekolah/coverage. Warna/ikon dapat mencerminkan status coverage.",
                        interact: "Klik marker untuk melihat popup informasi (nama/status) jika tersedia.",
                    },
                    {
                        name: "FitBounds",
                        desc: "Otomatis menyesuaikan viewport agar semua marker terlihat saat data dimuat.",
                    },
                ],
            },
        ],
    },
    {
        id: "sekolah",
        title: "Data Sekolah",
        badge: "Semua level",
        subtitle: "Direktori master customer sekolah dengan filter dan statistik.",
        intro: (
            <>
                Halaman untuk mencari dan meninjau daftar sekolah (customer)
                dalam scope akses user.
            </>
        ),
        sections: [
            {
                id: "sek-stats",
                title: "Kartu Statistik",
                comps: [
                    {
                        name: "Sekolah Negeri",
                        desc: "Jumlah sekolah negeri + % terhadap total hasil filter.",
                    },
                    {
                        name: "Sekolah Swasta",
                        desc: "Jumlah sekolah swasta + % terhadap total hasil filter.",
                    },
                ],
            },
            {
                id: "sek-filter",
                title: "Panel Filter",
                comps: [
                    {
                        name: "Pencarian nama sekolah",
                        desc: "Input teks (debounce/auto-apply) untuk mencari berdasarkan nama.",
                        interact: "Ketik nama → daftar terfilter otomatis.",
                    },
                    {
                        name: "Filter Area / Cabang / Jenis",
                        desc: "Dropdown Area, Cabang (bergantung Area), dan Jenis (Negeri/Swasta atau jenis lain). Cabang di-filter mengikuti Area terpilih.",
                        interact: "Ubah dropdown → query URL & data diperbarui.",
                    },
                ],
            },
            {
                id: "sek-table",
                title: "Tabel Daftar Sekolah",
                comps: [
                    {
                        name: "Baris sekolah",
                        desc: "Menampilkan identitas sekolah (nama, wilayah, jenjang, status, dll.) sesuai kolom halaman. Pagination jika data banyak.",
                        interact: "Klik baris/aksi Detail → halaman detail sekolah (/monitoring/sekolah/{id}/detail).",
                    },
                ],
            },
        ],
    },
    {
        id: "import",
        title: "Data Import",
        badge: "Nasional",
        subtitle: "Upload master CSV dan laporan Excel ke sistem.",
        intro: (
            <>
                Hanya level Nasional. Terdiri dari master geografis CSV dan
                bagian Import Laporan Excel (per file atau bulk folder). Detail
                tiap file ada di <strong>Bab 1</strong>.
            </>
        ),
        sections: [
            {
                id: "imp-csv",
                title: "Master Geografis (CSV)",
                comps: [
                    {
                        name: "Kartu Import Provinsi / Kota / Kecamatan",
                        desc: "Upload drag-drop atau pilih file. Progress bar saat upload. Upsert berdasarkan kode.",
                        interact: "Pilih file → Proses Import. Urutan disarankan: Provinsi → Kota → Kecamatan.",
                    },
                ],
            },
            {
                id: "imp-xls",
                title: "Import Laporan Excel",
                comps: [
                    {
                        name: "Bulk Folder Upload",
                        desc: "Pilih seluruh folder berisi banyak file Excel; sistem memproses sesuai jenis file yang dikenali.",
                        interact: "Pilih folder / drag-drop → Proses Import Semua File.",
                    },
                    {
                        name: "Kartu per jenis laporan",
                        desc: "Rekap Kota, Rekap AC, RJS, RJS2, TAR, Marketshare Kota/Kec, Data Cabang, Aktivitas Sales, Data Customer Cabang — masing-masing kartu upload sendiri.",
                        interact: "Upload file .xls/.xlsx sesuai jenis → Proses Import.",
                    },
                    {
                        name: "Reset Data Laporan",
                        desc: "Tombol berbahaya untuk mengosongkan data laporan sebelum re-import bersih.",
                        note: "Gunakan hati-hati — menghapus data operasional yang sudah masuk.",
                        interact: "Konfirmasi sebelum reset dijalankan.",
                    },
                ],
            },
        ],
    },
    {
        id: "report",
        title: "Report Sales Score",
        badge: "Semua level",
        subtitle: "Laporan skor AI per sales: ringkasan grade, filter, tabel, export.",
        intro: (
            <>
                Menampilkan ranking Sales Score untuk tahun terpilih, dengan
                filter Area/Cabang/Search dan export Excel.
            </>
        ),
        sections: [
            {
                id: "rep-summary",
                title: "Summary Cards",
                comps: [
                    {
                        name: "Total Sales / Rata-rata Score",
                        desc: "Jumlah sales dalam hasil filter dan rata-rata skor mereka.",
                    },
                    {
                        name: "Distribusi Grade",
                        desc: "Kartu hitungan: Sangat Baik, Baik, Cukup, Kurang, Buruk — sesuai threshold Bab 3.",
                    },
                ],
            },
            {
                id: "rep-filter",
                title: "Filter & Export",
                comps: [
                    {
                        name: "Search / Area / Cabang / Tahun",
                        desc: "Filter daftar sales. Cabang bergantung Area. Tahun menentukan periode skor.",
                        interact: "Ubah filter → data reload. Sort kolom dengan klik header.",
                    },
                    {
                        name: "Tombol Export Excel",
                        desc: "Mengunduh laporan sesuai filter & sort aktif (route report.export).",
                        interact: "Klik Export → file Excel terunduh.",
                    },
                ],
            },
            {
                id: "rep-table",
                title: "Tabel Ranking Score",
                comps: [
                    {
                        name: "Kolom identitas & skor",
                        desc: "Nama sales, cabang, area, total score, grade (warna), dan breakdown komponen KPI (Realisasi YoY, SP vs AC, Achievement, Tahan, Rebut, Lepas).",
                        interact: "Sort by total_score / nama / cabang / area / grade.",
                    },
                    {
                        name: "Score bar per komponen",
                        desc: "Visual progress kecil untuk tiap indikator skor agar cepat membandingkan kekuatan/kelemahan sales.",
                    },
                ],
            },
        ],
    },
    {
        id: "setting",
        title: "Pengaturan",
        badge: "Profil semua · Bobot Nasional",
        subtitle: "Profil akun, ganti password, dan konfigurasi bobot scoring.",
        intro: (
            <>
                Halaman akun pengguna. Bagian bobot Sales Score hanya dapat diedit
                oleh level <strong>Nasional</strong>.
            </>
        ),
        sections: [
            {
                id: "set-profile",
                title: "Informasi Profil & Password",
                comps: [
                    {
                        name: "Form Profil",
                        desc: "Update nama dan email akun yang login.",
                        interact: "Ubah field → Simpan.",
                    },
                    {
                        name: "Form Ganti Password",
                        desc: "Password lama, password baru, konfirmasi.",
                        interact: "Isi lengkap → Simpan password.",
                    },
                ],
            },
            {
                id: "set-weights",
                title: "Bobot Sales / Cabang / Area Score",
                comps: [
                    {
                        name: "Input bobot 5 indikator positif",
                        desc: "Realisasi YoY, Customer Realisasi vs AC, Achievement, Tahan vs AC, Rebut vs AC. Jumlah harus ~100%.",
                        interact: "Edit angka → Simpan. Tombol reset ke default tersedia.",
                        note: "User non-nasional hanya bisa melihat, tidak mengedit.",
                    },
                    {
                        name: "Bobot Lepas (pengurang eksternal)",
                        desc: "Tidak termasuk dalam 100% positif. Menentukan seberapa besar potongan skor dari rasio Lepas vs AC.",
                    },
                ],
            },
        ],
    },
    {
        id: "daftar-isi",
        title: "Daftar Isi (halaman ini)",
        badge: "Panduan",
        subtitle: "Dokumentasi internal sistem untuk onboarding & referensi.",
        intro: (
            <>
                Halaman panduan tiga bab. Navigasi kiri untuk loncat antar bab.
                Bab 2 (ini) memakai accordion berlapis per halaman → tab/section →
                komponen.
            </>
        ),
        sections: [
            {
                id: "di-nav",
                title: "Komponen halaman",
                comps: [
                    {
                        name: "Side TOC",
                        desc: "Navigasi Bab 1–3, highlight mengikuti posisi scroll.",
                        interact: "Klik item → smooth scroll ke bab.",
                    },
                    {
                        name: "Accordion Bab 2",
                        desc: "Expand halaman → expand section → baca penjelasan tiap komponen termasuk interaksi & catatan.",
                        interact: "Klik header accordion untuk buka/tutup. Tombol Expand All / Collapse All di atas daftar.",
                    },
                ],
            },
        ],
    },
];

export default function DaftarIsiBab2() {
    const [openPage, setOpenPage] = useState("dash-sales");
    const [openSection, setOpenSection] = useState({
        "dash-sales:sales-kpi": true,
    });

    const togglePage = (id) => {
        setOpenPage((prev) => (prev === id ? null : id));
    };

    const toggleSection = (pageId, sectionId) => {
        const key = `${pageId}:${sectionId}`;
        setOpenSection((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        setOpenPage("__all__");
        const next = {};
        PAGES.forEach((p) => {
            p.sections.forEach((s) => {
                next[`${p.id}:${s.id}`] = true;
            });
        });
        setOpenSection(next);
    };

    const collapseAll = () => {
        setOpenPage(null);
        setOpenSection({});
    };

    const isPageOpen = (id) => openPage === id || openPage === "__all__";

    return (
        <div>
            <p
                style={{
                    fontSize: 12,
                    color: T.slate,
                    lineHeight: 1.55,
                    margin: "0 0 10px",
                }}
            >
                Penjelasan <strong>per halaman → per tab/section → per komponen</strong>,
                termasuk rumus bila ada. Empat dashboard inti ada di bagian atas:
                Sales, Area, Cabang, dan Dana BOS.
                Buka accordion untuk detail. Sidebar kiri sistem menampilkan menu
                sesuai level user (beberapa menu disembunyikan untuk Area/Cabang/Sales).
            </p>

            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 10,
                    flexWrap: "wrap",
                }}
            >
                <button
                    type="button"
                    onClick={expandAll}
                    style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: `1px solid ${T.border}`,
                        background: "#fff",
                        cursor: "pointer",
                        color: T.slate,
                    }}
                >
                    Expand Semua
                </button>
                <button
                    type="button"
                    onClick={collapseAll}
                    style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: `1px solid ${T.border}`,
                        background: "#fff",
                        cursor: "pointer",
                        color: T.slate,
                    }}
                >
                    Collapse Semua
                </button>
            </div>

            {PAGES.map((page) => (
                <Accordion
                    key={page.id}
                    id={page.id}
                    title={page.title}
                    badge={page.badge}
                    subtitle={page.subtitle}
                    open={isPageOpen(page.id)}
                    onToggle={togglePage}
                    level={1}
                >
                    <div
                        style={{
                            fontSize: 12,
                            color: T.slate,
                            lineHeight: 1.55,
                            marginBottom: 10,
                        }}
                    >
                        {page.intro}
                    </div>

                    {page.sections.map((sec) => {
                        const key = `${page.id}:${sec.id}`;
                        return (
                            <Accordion
                                key={sec.id}
                                id={key}
                                title={sec.title}
                                open={!!openSection[key]}
                                onToggle={() => toggleSection(page.id, sec.id)}
                                level={2}
                            >
                                {sec.comps.map((c) => (
                                    <Comp
                                        key={c.name}
                                        name={c.name}
                                        desc={c.desc}
                                        rumus={c.rumus}
                                        interact={c.interact}
                                        note={c.note}
                                    />
                                ))}
                            </Accordion>
                        );
                    })}
                </Accordion>
            ))}

            <div
                style={{
                    marginTop: 8,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 11.5,
                    color: "#1e3a8a",
                    lineHeight: 1.5,
                }}
            >
                <strong>Tip navigasi sistem:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <Bullet>
                        Banyak angka KPI di dashboard Area/Cabang/Sales bersifat{" "}
                        <em>klikable</em> dan mengarah ke halaman detail
                        (sekolah, coverage, opportunity, TRL, target eksemplar, dll.).
                    </Bullet>
                    <Bullet>
                        Filter Tahun di header mengikuti <em>target_year</em> /
                        <em>prev_year</em> di Configuration kecuali diganti manual.
                    </Bullet>
                    <Bullet>
                        Untuk penjelasan file sumber data, lihat Bab 1. Untuk rumus
                        skor, lihat Bab 3.
                    </Bullet>
                </ul>
            </div>
        </div>
    );
}
