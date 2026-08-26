import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import DaftarIsiBab2 from "@/Pages/Monitoring/Tabs/DaftarIsiBab2";

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
    card: "#ffffff",
};

const card = {
    background: T.card,
    borderRadius: 10,
    boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
    border: `1px solid ${T.border}`,
};

const CHAPTERS = [
    { id: "bab-1", label: "Bab 1", title: "File Excel & Kegunaannya" },
    { id: "bab-2", label: "Bab 2", title: "Menu, Tab & Komponen" },
    { id: "bab-3", label: "Bab 3", title: "Penjelasan Scoring" },
];

const EXCEL_FILES = [
    {
        group: "Master Geografis (CSV)",
        color: T.blue,
        items: [
            {
                name: "Provinsi",
                file: "Export_m_province.csv",
                use: "Master data provinsi (province_code, province_name). Fondasi hierarki wilayah.",
            },
            {
                name: "Kota / Kabupaten",
                file: "Export_m_city.csv",
                use: "Master kota/kabupaten yang terhubung ke provinsi (city_code, city_name, province_code).",
            },
            {
                name: "Kecamatan",
                file: "Export_m_kecamatan.csv",
                use: "Master kecamatan (camat_code, city_code, camat_name). Dipakai untuk grouping coverage & ranking.",
            },
        ],
    },
    {
        group: "Laporan Excel (XLS / XLSX)",
        color: T.orange,
        items: [
            {
                name: "Rekap Kota (Tahunan)",
                file: "Rekap Kota & Kab Renc Jual",
                use: "Membentuk struktur Area & Sales Plan tahunan (rencana jual per wilayah).",
            },
            {
                name: "Rekap Area Cover (Tahunan)",
                file: "Rekap Area Cover & Renc Jual",
                use: "Mengupdate Area Cover (AC) pada Sales Plan — basis coverage sekolah per sales.",
            },
            {
                name: "RJS (Bulanan)",
                file: "RJS – Rencana Jual Sales",
                use: "Membentuk / memperbarui Customer & Customer Plan (realisasi eksemplar, AC, sumber dana).",
            },
            {
                name: "RJS 2 (Bulanan)",
                file: "RJS 2 – Rencana Jual Sales",
                use: "Format RJS terbaru untuk Customer & Plan tahun berjalan (mis. 2026).",
            },
            {
                name: "TAR (Bulanan)",
                file: "TAR – Rekap AC Sales",
                use: "Mengupdate progress Area Cover & Sales Plan (status Tahan / Rebut / Lepas / SP).",
            },
            {
                name: "Marketshare Kota",
                file: "Marketshare Kota & Kab",
                use: "Data Dapodik & market share tingkat kota/kabupaten — untuk penetasi vs universe sekolah.",
            },
            {
                name: "Marketshare Kecamatan",
                file: "Marketshare Kecamatan",
                use: "Data Dapodik & market share tingkat kecamatan — analisis coverage lebih detail.",
            },
            {
                name: "Data Cabang",
                file: "Data Cabang",
                use: "Membentuk struktur Cabang (relasi ke Area) di sistem.",
            },
            {
                name: "Aktivitas Sales Per Customer",
                file: "Aktivitas Sales",
                use: "Mengupdate data aktivitas / kunjungan sales per customer sekolah.",
            },
            {
                name: "Data Customer Cabang",
                file: "Data Customer Cabang",
                use: "Mengupdate atribut customer per cabang (mapping & data pendukung).",
            },
        ],
    },
];

const SCORE_COMPONENTS = [
    {
        key: "realisasi_yoy",
        label: "Realisasi YoY",
        weight: "20%",
        how: "Membandingkan realisasi eksemplar tahun ini vs tahun lalu. Jika naik/sama → skor 100. Jika turun → skor = (curr/prev)×100. Tanpa baseline tahun lalu: 100 jika ada realisasi, 0 jika tidak.",
    },
    {
        key: "sp_vs_ac",
        label: "Customer Realisasi vs Area Cover",
        weight: "20%",
        how: "Persentase customer yang sudah terealisasi (eksemplar > 0) dibanding Area Cover. Skor = min(100, %).",
    },
    {
        key: "achievement",
        label: "Achievement Target",
        weight: "20%",
        how: "Realisasi eksemplar ÷ target eksemplar (fallback potensi). Skor = min(100, %).",
    },
    {
        key: "tahan_vs_ac",
        label: "Tahan vs Area Cover",
        weight: "20%",
        how: "Jumlah customer Tahan ÷ Area Cover. Skor = min(100, %).",
    },
    {
        key: "rebut_vs_ac",
        label: "Rebut vs Area Cover",
        weight: "20%",
        how: "Jumlah customer Rebut ÷ Area Cover. Skor = min(100, %).",
    },
    {
        key: "lepas_vs_ac",
        label: "Lepas vs Area Cover",
        weight: "15% (pengurang)",
        how: "Indikator PENALTI di luar 100%. Semakin tinggi rasio Lepas vs AC, semakin besar potongan skor (maksimal sebesar bobot).",
        penalty: true,
    },
];

function SectionTitle({ id, bab, title, icon }) {
    return (
        <div id={id} style={{ scrollMarginTop: 72, marginBottom: 12 }}>
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    padding: "4px 10px",
                    marginBottom: 6,
                }}
            >
                <i className={`bi ${icon}`} style={{ color: T.blue, fontSize: 12 }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: T.blue, letterSpacing: "0.4px" }}>
                    {bab}
                </span>
            </div>
            <h2
                style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: T.text,
                    letterSpacing: "-0.3px",
                }}
            >
                {title}
            </h2>
        </div>
    );
}

export default function DaftarIsi() {
    const [active, setActive] = useState("bab-1");

    useEffect(() => {
        const onScroll = () => {
            let current = "bab-1";
            for (const c of CHAPTERS) {
                const el = document.getElementById(c.id);
                if (el && el.getBoundingClientRect().top <= 100) {
                    current = c.id;
                }
            }
            setActive(current);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const jump = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <MonitoringLayout activeNav="daftar-isi">
            <Head title="Daftar Isi" />

            <div style={{ minHeight: "100vh", background: T.bg }}>
                <div
                    style={{
                        background: "white",
                        padding: "8px 14px",
                        borderBottom: `1px solid ${T.border}`,
                        position: "sticky",
                        top: 0,
                        zIndex: 40,
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.slate,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        Panduan Sistem
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: T.text,
                            letterSpacing: "-0.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <i className="bi bi-journal-bookmark-fill" style={{ color: T.blue }} />
                        Daftar Isi
                    </div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                        Penjelasan file Excel, menu/tab halaman (Sales · Area · Cabang · Dana BOS), dan rumus scoring

                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "200px minmax(0, 1fr)",
                        gap: 12,
                        padding: "10px 12px",
                        alignItems: "start",
                    }}
                >
                    {/* Side TOC — sticky saat scroll */}
                    <aside
                        style={{
                            ...card,
                            padding: 8,
                            position: "sticky",
                            top: 78,
                            alignSelf: "start",
                            zIndex: 30,
                            maxHeight: "calc(100vh - 90px)",
                            overflowY: "auto",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 9,
                                fontWeight: 800,
                                color: T.slate,
                                textTransform: "uppercase",
                                letterSpacing: "0.4px",
                                padding: "4px 6px 8px",
                            }}
                        >
                            Navigasi
                        </div>
                        {CHAPTERS.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => jump(c.id)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    border: "none",
                                    background: active === c.id ? "#eff6ff" : "transparent",
                                    borderRadius: 7,
                                    padding: "8px 8px",
                                    cursor: "pointer",
                                    marginBottom: 2,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 9,
                                        fontWeight: 800,
                                        color: active === c.id ? T.blue : T.slate,
                                    }}
                                >
                                    {c.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: active === c.id ? T.text : T.slate,
                                        lineHeight: 1.3,
                                        marginTop: 2,
                                    }}
                                >
                                    {c.title}
                                </div>
                            </button>
                        ))}
                    </aside>

                    {/* Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* BAB 1 */}
                        <div style={{ ...card, padding: "14px 16px" }}>
                            <SectionTitle
                                id="bab-1"
                                bab="BAB 1"
                                title="File Excel yang Dipakai & Kegunaannya"
                                icon="bi-file-earmark-excel-fill"
                            />
                            <p style={{ fontSize: 12, color: T.slate, lineHeight: 1.55, margin: "0 0 12px" }}>
                                Sistem Yudhistira Monitoring mengolah data dari file master geografis (CSV)
                                dan laporan operasional (Excel). Import dilakukan lewat menu{" "}
                                <strong>Data Import</strong>. Urutan disarankan: Provinsi → Kota → Kecamatan,
                                lalu laporan Excel (Data Cabang, Rekap, RJS/TAR, Marketshare).
                            </p>

                            {EXCEL_FILES.map((g) => (
                                <div key={g.group} style={{ marginBottom: 14 }}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 800,
                                            color: g.color,
                                            marginBottom: 8,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 2,
                                                background: g.color,
                                            }}
                                        />
                                        {g.group}
                                    </div>
                                    <div style={{ overflowX: "auto" }}>
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "collapse",
                                                fontSize: 11,
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th
                                                        style={{
                                                            textAlign: "left",
                                                            padding: "6px 8px",
                                                            background: T.bg,
                                                            borderBottom: `1px solid ${T.border}`,
                                                            fontSize: 9,
                                                            color: T.slate,
                                                            textTransform: "uppercase",
                                                        }}
                                                    >
                                                        Jenis
                                                    </th>
                                                    <th
                                                        style={{
                                                            textAlign: "left",
                                                            padding: "6px 8px",
                                                            background: T.bg,
                                                            borderBottom: `1px solid ${T.border}`,
                                                            fontSize: 9,
                                                            color: T.slate,
                                                            textTransform: "uppercase",
                                                        }}
                                                    >
                                                        Nama File
                                                    </th>
                                                    <th
                                                        style={{
                                                            textAlign: "left",
                                                            padding: "6px 8px",
                                                            background: T.bg,
                                                            borderBottom: `1px solid ${T.border}`,
                                                            fontSize: 9,
                                                            color: T.slate,
                                                            textTransform: "uppercase",
                                                        }}
                                                    >
                                                        Kegunaan
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {g.items.map((it) => (
                                                    <tr key={it.name}>
                                                        <td
                                                            style={{
                                                                padding: "7px 8px",
                                                                borderBottom: "1px solid #f1f5f9",
                                                                fontWeight: 700,
                                                                color: T.text,
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {it.name}
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding: "7px 8px",
                                                                borderBottom: "1px solid #f1f5f9",
                                                                color: T.blue,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {it.file}
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding: "7px 8px",
                                                                borderBottom: "1px solid #f1f5f9",
                                                                color: T.slate,
                                                                lineHeight: 1.4,
                                                            }}
                                                        >
                                                            {it.use}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}

                            <div
                                style={{
                                    background: "#fffbeb",
                                    border: "1px solid #fde68a",
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    fontSize: 11.5,
                                    color: "#92400e",
                                    lineHeight: 1.5,
                                }}
                            >
                                <strong>Catatan:</strong> Import laporan mendukung upload per file atau{" "}
                                <em>bulk folder</em>. Data di-upsert berdasarkan kode/kunci unik — data lama
                                ditimpa, data baru ditambahkan. Gunakan tombol Reset Data Laporan hanya jika
                                ingin membersihkan data laporan sebelum re-import.
                            </div>
                        </div>

                        {/* BAB 2 */}
                        <div style={{ ...card, padding: "14px 16px" }}>
                            <SectionTitle
                                id="bab-2"
                                bab="BAB 2"
                                title="Menu, Tab & Komponen Setiap Halaman"
                                icon="bi-layout-sidebar-inset"
                            />
                            <DaftarIsiBab2 />
                        </div>

                        {/* BAB 3 */}
                        <div style={{ ...card, padding: "14px 16px" }}>
                            <SectionTitle
                                id="bab-3"
                                bab="BAB 3"
                                title="Penjelasan Scoring — Sales, Cabang & Area"
                                icon="bi-stars"
                            />

                            <p style={{ fontSize: 12, color: T.slate, lineHeight: 1.55, margin: "0 0 12px" }}>
                                <strong>Sales Score</strong>, <strong>Cabang Score (AI)</strong>, dan{" "}
                                <strong>Area Score (AI)</strong> memakai rumus yang sama: rata-rata berbobot
                                dari 5 indikator positif (total bobot 100%), dikurangi penalti Lepas
                                (bobot eksternal). Skor akhir dibatasi 0–100.
                            </p>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                    gap: 8,
                                    marginBottom: 14,
                                }}
                            >
                                {[
                                    {
                                        title: "Sales Score",
                                        desc: "Dihitung per individu sales. Tampil di dashboard Sales Detail & Report Sales Score.",
                                        color: "#1d4ed8",
                                    },
                                    {
                                        title: "Cabang Score",
                                        desc: "Agregat sales di cabang (tanpa entri kantor). Tampil di dashboard Cabang.",
                                        color: "#7c3aed",
                                    },
                                    {
                                        title: "Area Score",
                                        desc: "Agregat seluruh sales di area. Tampil di dashboard Area (tanpa filter cabang).",
                                        color: "#0f766e",
                                    },
                                ].map((b) => (
                                    <div
                                        key={b.title}
                                        style={{
                                            borderRadius: 8,
                                            padding: "10px 12px",
                                            background: b.color,
                                            color: "#fff",
                                        }}
                                    >
                                        <div style={{ fontSize: 12, fontWeight: 800 }}>{b.title}</div>
                                        <div
                                            style={{
                                                fontSize: 10.5,
                                                opacity: 0.9,
                                                marginTop: 4,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {b.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: T.text,
                                    marginBottom: 8,
                                }}
                            >
                                Komponen & Bobot Default
                            </div>

                            <div style={{ overflowX: "auto", marginBottom: 12 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            {["Indikator", "Bobot", "Cara Hitung"].map((h) => (
                                                <th
                                                    key={h}
                                                    style={{
                                                        textAlign: "left",
                                                        padding: "6px 8px",
                                                        background: T.bg,
                                                        borderBottom: `1px solid ${T.border}`,
                                                        fontSize: 9,
                                                        color: T.slate,
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SCORE_COMPONENTS.map((c) => (
                                            <tr key={c.key}>
                                                <td
                                                    style={{
                                                        padding: "8px",
                                                        borderBottom: "1px solid #f1f5f9",
                                                        fontWeight: 700,
                                                        fontSize: 11.5,
                                                        color: c.penalty ? T.red : T.text,
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {c.label}
                                                    {c.penalty ? " ✦" : ""}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "8px",
                                                        borderBottom: "1px solid #f1f5f9",
                                                        fontSize: 11.5,
                                                        fontWeight: 800,
                                                        color: c.penalty ? T.red : T.blue,
                                                    }}
                                                >
                                                    {c.weight}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "8px",
                                                        borderBottom: "1px solid #f1f5f9",
                                                        fontSize: 11.5,
                                                        color: T.slate,
                                                        lineHeight: 1.45,
                                                    }}
                                                >
                                                    {c.how}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div
                                style={{
                                    background: "#f8fafc",
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    marginBottom: 12,
                                    fontSize: 12,
                                    color: T.text,
                                    lineHeight: 1.55,
                                }}
                            >
                                <div style={{ fontWeight: 800, marginBottom: 4 }}>Rumus ringkas</div>
                                <code style={{ fontSize: 11.5, color: T.blue }}>
                                    Total = (Σ skor_positif × bobot) / Σ bobot_positif − penalti_lepas
                                </code>
                                <div style={{ fontSize: 11.5, color: T.slate, marginTop: 6 }}>
                                    Contoh: jika 5 indikator positif rata-rata 80 dan Lepas vs AC = 40% dengan
                                    bobot penalti 15 → potongan = 0.4 × 15 = 6 poin → Total ≈ 74.
                                </div>
                            </div>

                            <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: T.text,
                                    marginBottom: 8,
                                }}
                            >
                                Grade
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                                    gap: 6,
                                    marginBottom: 12,
                                }}
                            >
                                {[
                                    { g: "Sangat Baik", r: "≥ 80", c: "#059669" },
                                    { g: "Baik", r: "≥ 60", c: "#2563eb" },
                                    { g: "Cukup", r: "≥ 40", c: "#d97706" },
                                    { g: "Kurang", r: "≥ 20", c: "#ea580c" },
                                    { g: "Buruk", r: "< 20", c: "#dc2626" },
                                ].map((x) => (
                                    <div
                                        key={x.g}
                                        style={{
                                            borderRadius: 8,
                                            padding: "8px 6px",
                                            textAlign: "center",
                                            background: x.c,
                                            color: "#fff",
                                        }}
                                    >
                                        <div style={{ fontSize: 11, fontWeight: 800 }}>{x.g}</div>
                                        <div style={{ fontSize: 10, opacity: 0.9, marginTop: 2 }}>{x.r}</div>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    fontSize: 11.5,
                                    color: "#1e3a8a",
                                    lineHeight: 1.5,
                                }}
                            >
                                <strong>Pengaturan bobot:</strong> Level Nasional dapat mengubah bobot tiap
                                indikator di menu <em>Pengaturan</em>. Jumlah bobot 5 indikator positif harus
                                mendekati 100%. Bobot Lepas bersifat eksternal (pengurang) dan tidak termasuk
                                dalam 100% tersebut.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MonitoringLayout>
    );
}
