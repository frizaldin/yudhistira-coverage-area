import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";

const T = {
    blue: "#1d4ed8",
    blueSoft: "#3b82f6",
    green: "#16a34a",
    orange: "#d97706",
    red: "#dc2626",
    teal: "#0d9488",
    purple: "#7c3aed",
    slate: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f1f5f9",
    card: "#ffffff",
};

const S = {
    card: { background: T.card, borderRadius: 12, boxShadow: "0 1px 6px rgba(15,23,42,0.06)", border: `1px solid ${T.border}` },
    th: { fontSize: 11, fontWeight: 700, color: T.slate, padding: "12px 16px", background: "#f8fafc", borderBottom: `1px solid ${T.border}`, letterSpacing: "0.3px", textTransform: "uppercase" },
    td: { fontSize: 13, color: T.text, padding: "12px 16px", borderBottom: `1px solid #f4f6f8` },
};

function Badge({ label, color, bg }) {
    return (
        <span style={{ background: bg, color: color, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.3px" }}>
            {label}
        </span>
    );
}

function FilterBar({ jenjangList, filters, onChange }) {
    return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
                type="text"
                placeholder="Cari Nama Sales..."
                value={filters.sales_name || ""}
                onChange={(e) => onChange("sales_name", e.target.value)}
                style={{
                    fontSize: 11.5,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "white",
                    color: T.text,
                    width: 200,
                }}
            />
            <select
                value={filters.jenjang || ""}
                onChange={(e) => onChange("jenjang", e.target.value)}
                style={{
                    fontSize: 11.5,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    background: "white",
                    color: T.text,
                }}
            >
                <option value="">Semua Jenjang</option>
                {jenjangList.map((j) => (
                    <option key={j} value={j}>{j}</option>
                ))}
            </select>
            {(filters.sales_name || filters.jenjang) && (
                <button
                    onClick={() => {
                        onChange("sales_name", "");
                        onChange("jenjang", "");
                    }}
                    style={{
                        fontSize: 11,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#fee2e2",
                        color: T.red,
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    Reset Filter
                </button>
            )}
        </div>
    );
}

function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;
    const current = meta.current_page;
    const last = meta.last_page;
    let pages = [];

    if (last <= 7) {
        pages = Array.from({ length: last }, (_, i) => i + 1);
    } else {
        if (current <= 4) {
            pages = [1, 2, 3, 4, 5, "...", last];
        } else if (current >= last - 3) {
            pages = [1, "...", last - 4, last - 3, last - 2, last - 1, last];
        } else {
            pages = [1, "...", current - 1, current, current + 1, "...", last];
        }
    }

    return (
        <div style={{ display: "flex", gap: 4, justifyContent: "end", padding: "12px 30px", flexWrap: "wrap" }}>
            <button
                onClick={() => onPage(current - 1)}
                disabled={current === 1}
                style={{
                    padding: "5px 11px",
                    borderRadius: 7,
                    border: `1px solid ${T.border}`,
                    background: "white",
                    color: current === 1 ? "#cbd5e1" : T.text,
                    cursor: current === 1 ? "not-allowed" : "pointer",
                    fontSize: 11.5,
                }}
            >
                &laquo;
            </button>
            {pages.map((p, idx) => (
                <button
                    key={idx}
                    onClick={() => p !== "..." && onPage(p)}
                    disabled={p === "..."}
                    style={{
                        padding: "5px 11px",
                        borderRadius: 7,
                        border: p === "..." ? "none" : `1px solid ${p === current ? T.blue : T.border}`,
                        background: p === current ? T.blue : "white",
                        color: p === current ? "white" : T.text,
                        cursor: p === "..." ? "default" : "pointer",
                        fontSize: 11.5,
                        fontWeight: p === current ? 700 : 400,
                    }}
                >
                    {p}
                </button>
            ))}
            <button
                onClick={() => onPage(current + 1)}
                disabled={current === last}
                style={{
                    padding: "5px 11px",
                    borderRadius: 7,
                    border: `1px solid ${T.border}`,
                    background: "white",
                    color: current === last ? "#cbd5e1" : T.text,
                    cursor: current === last ? "not-allowed" : "pointer",
                    fontSize: 11.5,
                }}
            >
                &raquo;
            </button>
        </div>
    );
}

const jenjangColor = { SD: '#3b82f6', SMP: '#8b5cf6', SMA: '#eab308', SMK: '#f97316', DLL: '#10b981' };

export default function SalesJenjangDetail({ activeNav, scopeName, backUrl, rows, jenjangList, aggregateData = [], filters = {} }) {
    const applyFilter = (key, val) => {
        const newFilters = { ...filters, [key]: val || undefined };
        router.get(window.location.pathname, newFilters, { preserveState: true, preserveScroll: true, replace: true });
    };

    const goPage = (p) => {
        router.get(window.location.pathname, { ...filters, page: p }, { preserveState: true, preserveScroll: true });
    };

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Detail Sales per Jenjang - ${scopeName}`} />
            
            <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Link href={backUrl} style={{ color: T.blue, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                <i className="bi bi-arrow-left"></i> Kembali
                            </Link>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                            <i className="bi bi-person-lines-fill" style={{ color: T.blue }}></i>
                            Detail Sales per Jenjang - {scopeName}
                        </h1>
                        <p style={{ fontSize: 13, color: T.slate, margin: "4px 0 0 0" }}>Distribusi Sales yang memegang masing-masing jenjang (dari Target/Cover Area)</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "flex", gap: 16, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
                    {aggregateData.map(agg => (
                        <div key={agg.jenjang} onClick={() => applyFilter('jenjang', filters.jenjang === agg.jenjang ? "" : agg.jenjang)}
                             style={{ ...S.card, padding: 16, flex: "1", minWidth: 150, cursor: "pointer", border: filters.jenjang === agg.jenjang ? `2px solid ${T.blue}` : S.card.border, transition: 'all 0.2s' }}>
                            <div style={{ fontSize: 13, color: T.slate, fontWeight: 600 }}>{agg.jenjang}</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: T.text, marginTop: 4 }}>{agg.count} <span style={{fontSize: 12, fontWeight: 400, color: T.slate}}>Sales</span></div>
                            <div style={{ fontSize: 12, color: T.slate, marginTop: 4 }}>Target: {agg.target.toLocaleString('id-ID')} Sekolah</div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ ...S.card, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <FilterBar jenjangList={jenjangList} filters={filters} onChange={applyFilter} />
                    <div style={{ fontSize: 11, color: T.slate }}>
                        Menampilkan {rows.from || 0}–{rows.to || 0} dari {rows.total || 0} sales
                    </div>
                </div>

                {/* Main Table */}
                <div style={{ ...S.card, overflow: "hidden" }}>
                    <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Daftar Sales</h2>
                    </div>
                    
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={S.th}>No</th>
                                    <th style={{ ...S.th, textAlign: "left" }}>Nama Sales</th>
                                    <th style={{ ...S.th, textAlign: "left" }}>Cabang</th>
                                    <th style={{ ...S.th, textAlign: "center" }}>Jenjang</th>
                                    <th style={{ ...S.th, textAlign: "right" }}>Target Customer</th>
                                    <th style={{ ...S.th, textAlign: "right" }}>Target Eksemplar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.data?.length > 0 ? (
                                    rows.data.map((r, i) => (
                                        <tr key={r.id}>
                                            <td style={{ ...S.td, textAlign: "center", color: T.slate }}>{(rows.from || 1) + i}</td>
                                            <td style={{ ...S.td, fontWeight: 600 }}>{r.sales_name}</td>
                                            <td style={S.td}>{r.cabang}</td>
                                            <td style={{ ...S.td, textAlign: "center" }}>
                                                <Badge label={r.jenjang} color={jenjangColor[r.jenjang] || T.slate} bg={`${jenjangColor[r.jenjang] || T.slate}18`} />
                                            </td>
                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{r.target_customer.toLocaleString('id-ID')}</td>
                                            <td style={{ ...S.td, textAlign: "right", color: T.slate }}>{r.target_exemplar.toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ ...S.td, textAlign: "center", padding: "32px 0", color: T.slate }}>
                                            Tidak ada data sales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <Pagination meta={rows} onPage={goPage} />
                </div>
                
            </div>
        </MonitoringLayout>
    );
}
