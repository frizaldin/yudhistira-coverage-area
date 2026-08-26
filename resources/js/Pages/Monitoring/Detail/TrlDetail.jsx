import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";

const T = {
    blue: "#1d4ed8", blueSoft: "#3b82f6", green: "#10b981",
    orange: "#f59e0b", red: "#ef4444", purple: "#7c3aed",
    slate: "#64748b", text: "#0f172a", border: "#e2e8f0",
    bg: "#f1f5f9", card: "#ffffff",
};

const TRL_META = {
    tahan: { label: "TAHAN", color: "#10b981", bg: "#d1fae5", icon: "bi-shield-check",   desc: "Aktif tahun lalu & tahun ini" },
    rebut: { label: "REBUT", color: "#3b82f6", bg: "#dbeafe", icon: "bi-arrow-repeat",    desc: "Baru masuk tahun ini" },
    lepas: { label: "LEPAS", color: "#f59e0b", bg: "#fef3c7", icon: "bi-box-arrow-right", desc: "Ada tahun lalu, tidak tahun ini" },
    gagal: { label: "GAGAL", color: "#ef4444", bg: "#fee2e2", icon: "bi-x-circle",        desc: "Tidak aktif dua tahun berturut" },
};

const JENJANG_COLOR = { SD: "#3b82f6", SMP: "#8b5cf6", SMA: "#eab308", SMK: "#f97316", DLL: "#10b981" };

const S = {
    card: { background: T.card, borderRadius: 12, boxShadow: "0 1px 6px rgba(15,23,42,0.06)", border: `1px solid ${T.border}` },
    th: { fontSize: 10.5, fontWeight: 700, color: T.slate, padding: "9px 12px", background: "#f8fafc", borderBottom: `1px solid ${T.border}`, letterSpacing: "0.4px", textTransform: "uppercase", whiteSpace: "nowrap" },
    td: { fontSize: 12.5, color: T.text, padding: "9px 12px", borderBottom: `1px solid #f4f6f8`, verticalAlign: "middle" },
};

function Badge({ label, color, bg, size = 11 }) {
    return (
        <span style={{ background: bg, color, padding: "3px 8px", borderRadius: 6, fontSize: size, fontWeight: 700, letterSpacing: "0.3px", display: "inline-block" }}>
            {label}
        </span>
    );
}

function TrlBadge({ status }) {
    const m = TRL_META[status] || { label: status, color: T.slate, bg: "#f1f5f9" };
    return <Badge label={m.label} color={m.color} bg={m.bg} />;
}

function SummaryCard({ status, value, active, onClick }) {
    const m = TRL_META[status];
    return (
        <div onClick={onClick} style={{ ...S.card, flex: 1, minWidth: 130, padding: "12px 14px", cursor: "pointer", border: active ? `2px solid ${m.color}` : `1px solid ${T.border}`, background: active ? m.bg : T.card, transition: "all 0.18s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: 14 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: m.color, letterSpacing: "0.6px", textTransform: "uppercase" }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1.1 }}>{Number(value || 0).toLocaleString("id-ID")}</div>
            <div style={{ fontSize: 9.5, color: T.slate, marginTop: 3 }}>{m.desc}</div>
        </div>
    );
}

function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;
    const current = meta.current_page, last = meta.last_page;
    let pages = last <= 7 ? Array.from({ length: last }, (_, i) => i + 1)
        : current <= 4 ? [1, 2, 3, 4, 5, "…", last]
        : current >= last - 3 ? [1, "…", last - 4, last - 3, last - 2, last - 1, last]
        : [1, "…", current - 1, current, current + 1, "…", last];

    return (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", padding: "12px 16px", flexWrap: "wrap" }}>
            {[["‹", current - 1, current === 1], ...pages.map(p => [p, p, p === "…"]), ["›", current + 1, current === last]].map(([label, page, disabled], i) => (
                <button key={i} onClick={() => !disabled && page !== "…" && onPage(page)} disabled={!!disabled}
                    style={{ padding: "5px 11px", borderRadius: 7, border: page === current ? "none" : `1px solid ${T.border}`, background: page === current ? T.blue : "white", color: disabled ? "#cbd5e1" : page === current ? "white" : T.text, cursor: disabled || page === "…" ? "default" : "pointer", fontSize: 11.5, fontWeight: page === current ? 700 : 400 }}>
                    {label}
                </button>
            ))}
        </div>
    );
}

export default function TrlDetail({
    activeNav,
    cabangName,
    cabangCode,
    backUrl,
    targetYear,
    prevYear,
    summary = {},
    trlBySales = [],
    trlByCabang = [],
    sekolah = {},
    salesList = [],
    jenjangList = [],
    filters = {},
    isAreaDashboard = false,
    areaId = null,
}) {
    const [activeTab, setActiveTab] = useState(
        isAreaDashboard ? "trl-cabang" : "trl-sales",
    );
    const fmt = (n) => Number(n || 0).toLocaleString("id-ID");

    const apply = (key, val) => {
        router.get(
            window.location.pathname,
            { ...filters, [key]: val || undefined, page: undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };
    const goPage = (p) =>
        router.get(
            window.location.pathname,
            { ...filters, page: p },
            { preserveState: true, preserveScroll: true },
        );
    const resetFilters = () =>
        router.get(window.location.pathname, {}, { replace: true });
    const hasFilter = filters.sales_id || filters.jenjang || filters.trl_status;

    const goToCabang = (cabangId) => {
        if (!cabangId || !areaId) return;
        router.get(route("monitoring.area", areaId), { cabang: cabangId });
    };

    const salesGroups = trlBySales.reduce((acc, row) => {
        if (!acc[row.sales_id])
            acc[row.sales_id] = {
                sales_id: row.sales_id,
                sales_name: row.sales_name,
                rows: [],
            };
        acc[row.sales_id].rows.push(row);
        return acc;
    }, {});

    const tabs = isAreaDashboard
        ? [
              {
                  id: "trl-cabang",
                  label: `TRL per Cabang (${trlByCabang.length})`,
                  icon: "bi-building",
              },
              {
                  id: "sekolah",
                  label: `List Sekolah (${sekolah?.total ?? 0})`,
                  icon: "bi-mortarboard",
              },
          ]
        : [
              {
                  id: "trl-sales",
                  label: "TRL per Sales per Segmen",
                  icon: "bi-person-lines-fill",
              },
              {
                  id: "sekolah",
                  label: `List Sekolah (${sekolah?.total ?? 0})`,
                  icon: "bi-building",
              },
          ];

    const summaryKeys = isAreaDashboard
        ? ["tahan", "rebut", "lepas"]
        : ["tahan", "rebut", "lepas", "gagal"];

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head
                title={`TRL Detail – ${isAreaDashboard ? "Area" : "Cabang"} ${cabangName}`}
            />
            <div
                style={{
                    padding: "20px 24px",
                    maxWidth: 1320,
                    margin: "0 auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 20,
                        flexWrap: "wrap",
                        gap: 12,
                    }}
                >
                    <div>
                        <Link
                            href={backUrl}
                            style={{
                                color: T.blue,
                                textDecoration: "none",
                                fontSize: 12.5,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                marginBottom: 6,
                            }}
                        >
                            <i className="bi bi-arrow-left" /> Kembali ke
                            Dashboard
                        </Link>
                        <h1
                            style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: T.text,
                                margin: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <span
                                style={{
                                    background:
                                        "linear-gradient(135deg,#1d4ed8,#7c3aed)",
                                    padding: "4px 10px",
                                    borderRadius: 8,
                                    display: "inline-flex",
                                }}
                            >
                                <i
                                    className="bi bi-shield-shaded"
                                    style={{ color: "white", fontSize: 16 }}
                                />
                            </span>
                            TRL Detail — {cabangName}
                        </h1>
                        <p
                            style={{
                                fontSize: 12,
                                color: T.slate,
                                margin: "5px 0 0 0",
                            }}
                        >
                            {isAreaDashboard
                                ? `Tahan · Rebut · Lepas per Cabang · Realisasi ${targetYear}`
                                : `Tahan · Rebut · Lepas · Gagal per Sales per Segmen & List Sekolah`}
                            &nbsp;·&nbsp; {prevYear} → {targetYear}
                            {filters.jenjang ? ` · Jenjang ${filters.jenjang}` : ""}
                        </p>
                    </div>
                    {hasFilter && (
                        <div
                            style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            {filters.trl_status && (
                                <span
                                    style={{
                                        background:
                                            TRL_META[filters.trl_status]?.bg,
                                        color: TRL_META[filters.trl_status]
                                            ?.color,
                                        padding: "4px 10px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {TRL_META[filters.trl_status]?.label}
                                    <button
                                        onClick={() => apply("trl_status", "")}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            color: "inherit",
                                            marginLeft: 4,
                                            fontSize: 13,
                                            padding: 0,
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            {filters.jenjang && (
                                <span
                                    style={{
                                        background: `${JENJANG_COLOR[filters.jenjang] || T.slate}18`,
                                        color:
                                            JENJANG_COLOR[filters.jenjang] ||
                                            T.slate,
                                        padding: "4px 10px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {filters.jenjang}
                                    <button
                                        onClick={() => apply("jenjang", "")}
                                        style={{
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            color: "inherit",
                                            marginLeft: 4,
                                            fontSize: 13,
                                            padding: 0,
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 20,
                                    border: "1px solid #fca5a5",
                                    background: "#fee2e2",
                                    color: T.red,
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Reset Semua
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 16,
                        flexWrap: "wrap",
                    }}
                >
                    {summaryKeys.map((s) => (
                        <SummaryCard
                            key={s}
                            status={s}
                            value={summary[s] ?? 0}
                            active={filters.trl_status === s}
                            onClick={() => {
                                apply(
                                    "trl_status",
                                    filters.trl_status === s ? "" : s,
                                );
                                setActiveTab("sekolah");
                            }}
                        />
                    ))}
                </div>

                {/* Filter Bar */}
                <div
                    style={{
                        ...S.card,
                        padding: "10px 14px",
                        marginBottom: 12,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    {!isAreaDashboard && (
                        <select
                            value={filters.sales_id || ""}
                            onChange={(e) => apply("sales_id", e.target.value)}
                            style={{
                                fontSize: 12,
                                padding: "5px 10px",
                                borderRadius: 7,
                                border: `1px solid ${T.border}`,
                                background: "white",
                                minWidth: 160,
                            }}
                        >
                        <option value="">Semua Sales</option>
                            {salesList.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                    </select>
                    )}
                    <select
                        value={filters.jenjang || ""}
                        onChange={(e) => apply("jenjang", e.target.value)}
                        style={{
                            fontSize: 12,
                            padding: "5px 10px",
                            borderRadius: 7,
                            border: `1px solid ${T.border}`,
                            background: "white",
                        }}
                    >
                        <option value="">Semua Jenjang</option>
                        {jenjangList.map((j) => (
                            <option key={j} value={j}>
                                {j}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.trl_status || ""}
                        onChange={(e) => apply("trl_status", e.target.value)}
                        style={{
                            fontSize: 12,
                            padding: "5px 10px",
                            borderRadius: 7,
                            border: `1px solid ${T.border}`,
                            background: "white",
                        }}
                    >
                        <option value="">Semua Status TRL</option>
                        {summaryKeys.map((s) => (
                            <option key={s} value={s}>
                                {TRL_META[s].label}
                            </option>
                        ))}
                    </select>
                    <div
                        style={{
                            marginLeft: "auto",
                            fontSize: 11,
                            color: T.slate,
                        }}
                    >
                        <i
                            className="bi bi-funnel"
                            style={{ marginRight: 4 }}
                        />
                        {hasFilter ? "Filter aktif" : "Tidak ada filter"}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div
                    style={{
                        display: "flex",
                        gap: 2,
                        marginBottom: 12,
                        background: "#f1f5f9",
                        padding: 4,
                        borderRadius: 10,
                        width: "fit-content",
                    }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "7px 14px",
                                borderRadius: 7,
                                border: "none",
                                background:
                                    activeTab === tab.id ? "white" : "transparent",
                                color:
                                    activeTab === tab.id ? T.text : T.slate,
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: 12,
                                cursor: "pointer",
                                boxShadow:
                                    activeTab === tab.id
                                        ? "0 1px 4px rgba(15,23,42,0.08)"
                                        : "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <i className={`bi ${tab.icon}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB: TRL per Cabang (Area) */}
                {activeTab === "trl-cabang" && isAreaDashboard && (
                    <div style={{ ...S.card, overflow: "hidden" }}>
                        <div
                            style={{
                                padding: "12px 16px",
                                borderBottom: `1px solid ${T.border}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        margin: 0,
                                    }}
                                >
                                    TRL per Cabang
                                    {filters.jenjang
                                        ? ` · ${filters.jenjang}`
                                        : ""}
                                </h2>
                                <p
                                    style={{
                                        fontSize: 11,
                                        color: T.slate,
                                        margin: "2px 0 0 0",
                                    }}
                                >
                                    Klik baris untuk membuka dashboard cabang ·
                                    Realisasi {targetYear}
                                </p>
                            </div>
                            <span style={{ fontSize: 11, color: T.slate }}>
                                {trlByCabang.length} cabang
                            </span>
                        </div>

                        {trlByCabang.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "48px 0",
                                    color: T.slate,
                                }}
                            >
                                <i
                                    className="bi bi-inbox"
                                    style={{
                                        fontSize: 32,
                                        display: "block",
                                        marginBottom: 8,
                                        opacity: 0.4,
                                    }}
                                />
                                Belum ada data TRL cabang untuk filter ini.
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    paddingLeft: 16,
                                                    width: 40,
                                                }}
                                            >
                                                No
                                            </th>
                                            <th style={{ ...S.th, textAlign: "left" }}>
                                                Nama Cabang
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    color: "#10b981",
                                                }}
                                            >
                                                Tahan
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    color: "#3b82f6",
                                                }}
                                            >
                                                Rebut
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    color: "#f59e0b",
                                                }}
                                            >
                                                Lepas
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Realisasi Customer ({targetYear})
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    paddingRight: 16,
                                                }}
                                            >
                                                Realisasi Eksemplar ({targetYear})
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trlByCabang.map((r) => (
                                            <tr
                                                key={r.id}
                                                onClick={() => goToCabang(r.id)}
                                                title={`Buka dashboard ${r.nama_cabang}`}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background =
                                                        "#f1f5f9")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background =
                                                        "transparent")
                                                }
                                                style={{
                                                    cursor: "pointer",
                                                    transition:
                                                        "background 0.15s",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        paddingLeft: 16,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    {r.no}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {r.nama_cabang}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                        color: "#10b981",
                                                    }}
                                                >
                                                    {fmt(r.tahan)}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                        color: "#3b82f6",
                                                    }}
                                                >
                                                    {fmt(r.rebut)}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                        color: "#f59e0b",
                                                    }}
                                                >
                                                    {fmt(r.lepas)}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                        color: T.blue,
                                                    }}
                                                >
                                                    {fmt(r.realisasi_customer)}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        fontWeight: 800,
                                                        color: "#059669",
                                                        paddingRight: 16,
                                                    }}
                                                >
                                                    {fmt(r.realisasi_eksemplar)}
                                                </td>
                                            </tr>
                                        ))}
                                        {trlByCabang.length > 1 &&
                                            (() => {
                                                const tot = trlByCabang.reduce(
                                                    (a, r) => ({
                                                        tahan:
                                                            a.tahan +
                                                            (r.tahan || 0),
                                                        rebut:
                                                            a.rebut +
                                                            (r.rebut || 0),
                                                        lepas:
                                                            a.lepas +
                                                            (r.lepas || 0),
                                                        realisasi_customer:
                                                            a.realisasi_customer +
                                                            (r.realisasi_customer ||
                                                                0),
                                                        realisasi_eksemplar:
                                                            a.realisasi_eksemplar +
                                                            (r.realisasi_eksemplar ||
                                                                0),
                                                    }),
                                                    {
                                                        tahan: 0,
                                                        rebut: 0,
                                                        lepas: 0,
                                                        realisasi_customer: 0,
                                                        realisasi_eksemplar: 0,
                                                    },
                                                );
                                                return (
                                                    <tr
                                                        style={{
                                                            background:
                                                                "#f8fafc",
                                                            borderTop: `2px solid ${T.border}`,
                                                        }}
                                                    >
                                                        <td
                                                            colSpan={2}
                                                            style={{
                                                                ...S.td,
                                                                paddingLeft: 16,
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            TOTAL
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 800,
                                                                color: "#10b981",
                                                            }}
                                                        >
                                                            {fmt(tot.tahan)}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 800,
                                                                color: "#3b82f6",
                                                            }}
                                                        >
                                                            {fmt(tot.rebut)}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 800,
                                                                color: "#f59e0b",
                                                            }}
                                                        >
                                                            {fmt(tot.lepas)}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 800,
                                                                color: T.blue,
                                                            }}
                                                        >
                                                            {fmt(
                                                                tot.realisasi_customer,
                                                            )}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 800,
                                                                color: "#059669",
                                                                paddingRight: 16,
                                                            }}
                                                        >
                                                            {fmt(
                                                                tot.realisasi_eksemplar,
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: TRL per Sales per Segmen (Cabang mode) */}
                {activeTab === "trl-sales" && !isAreaDashboard && (
                    <div style={{ ...S.card, overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>TRL per Sales per Segmen</h2>
                                <p style={{ fontSize: 11, color: T.slate, margin: "2px 0 0 0" }}>Data dari SalesPlan · {targetYear}</p>
                            </div>
                            <span style={{ fontSize: 11, color: T.slate }}>{trlBySales.length} baris</span>
                        </div>

                        {trlBySales.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "48px 0", color: T.slate }}>
                                <i className="bi bi-inbox" style={{ fontSize: 32, display: "block", marginBottom: 8, opacity: 0.4 }} />
                                Belum ada data TRL untuk filter yang dipilih.
                            </div>
                        ) : (
                            Object.values(salesGroups).map((group) => (
                                <div key={group.sales_id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <div style={{ padding: "8px 16px", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${T.border}` }}>
                                        <i className="bi bi-person-circle" style={{ color: T.blue, fontSize: 13 }} />
                                        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{group.sales_name}</span>
                                        <span style={{ fontSize: 10.5, color: T.slate }}>{group.rows.length} segmen</span>
                                    </div>
                                    <div style={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...S.th, paddingLeft: 24, width: 90 }}>Jenjang</th>
                                                    <th style={{ ...S.th, textAlign: "right", color: "#10b981" }}><i className="bi bi-shield-check" /> Tahan</th>
                                                    <th style={{ ...S.th, textAlign: "right", color: "#3b82f6" }}><i className="bi bi-arrow-repeat" /> Rebut</th>
                                                    <th style={{ ...S.th, textAlign: "right", color: "#f59e0b" }}><i className="bi bi-box-arrow-right" /> Lepas</th>
                                                    <th style={{ ...S.th, textAlign: "right", color: "#ef4444" }}><i className="bi bi-x-circle" /> Gagal</th>
                                                    <th style={{ ...S.th, textAlign: "right" }}>Total</th>
                                                    <th style={{ ...S.th, textAlign: "center", paddingRight: 16 }}>Retensi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.rows.map((row) => {
                                                    const ret = row.total > 0 ? Math.round((row.tahan / row.total) * 100) : 0;
                                                    return (
                                                        <tr key={`${row.sales_id}-${row.jenjang}`}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                            style={{ transition: "background 0.15s" }}>
                                                            <td style={{ ...S.td, paddingLeft: 24 }}>
                                                                <Badge label={row.jenjang} color={JENJANG_COLOR[row.jenjang] || T.slate} bg={`${JENJANG_COLOR[row.jenjang] || T.slate}18`} />
                                                            </td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#10b981" }}>{fmt(row.tahan)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#3b82f6" }}>{fmt(row.rebut)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>{fmt(row.lepas)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: "#ef4444" }}>{fmt(row.gagal)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 600, color: T.slate }}>{fmt(row.total)}</td>
                                                            <td style={{ ...S.td, textAlign: "center", paddingRight: 16 }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                                                                    <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 4, maxWidth: 70 }}>
                                                                        <div style={{ width: `${ret}%`, height: "100%", background: ret >= 60 ? "#10b981" : ret >= 30 ? "#f59e0b" : "#ef4444", borderRadius: 4, transition: "width 0.4s" }} />
                                                                    </div>
                                                                    <span style={{ fontSize: 11, fontWeight: 700, color: ret >= 60 ? "#10b981" : ret >= 30 ? "#f59e0b" : "#ef4444", minWidth: 32 }}>{ret}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {group.rows.length > 1 && (() => {
                                                    const tot = group.rows.reduce((a, r) => ({ tahan: a.tahan + r.tahan, rebut: a.rebut + r.rebut, lepas: a.lepas + r.lepas, gagal: a.gagal + r.gagal, total: a.total + r.total }), { tahan: 0, rebut: 0, lepas: 0, gagal: 0, total: 0 });
                                                    const ret = tot.total > 0 ? Math.round((tot.tahan / tot.total) * 100) : 0;
                                                    return (
                                                        <tr style={{ background: "#fafafa", borderTop: `1px dashed ${T.border}` }}>
                                                            <td style={{ ...S.td, paddingLeft: 24, fontSize: 11, fontWeight: 700, color: T.slate }}>TOTAL</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#10b981" }}>{fmt(tot.tahan)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#3b82f6" }}>{fmt(tot.rebut)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#f59e0b" }}>{fmt(tot.lepas)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 800, color: "#ef4444" }}>{fmt(tot.gagal)}</td>
                                                            <td style={{ ...S.td, textAlign: "right", fontWeight: 800 }}>{fmt(tot.total)}</td>
                                                            <td style={{ ...S.td, textAlign: "center", paddingRight: 16, fontWeight: 800, color: ret >= 60 ? "#10b981" : ret >= 30 ? "#f59e0b" : "#ef4444" }}>{ret}%</td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* TAB: List Sekolah */}
                {activeTab === "sekolah" && (
                    <div style={{ ...S.card, overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>List Sekolah</h2>
                                <p style={{ fontSize: 11, color: T.slate, margin: "2px 0 0 0" }}>Klasifikasi TRL berdasarkan realisasi {prevYear} → {targetYear}</p>
                            </div>
                            <span style={{ fontSize: 11, color: T.slate }}>{sekolah?.from ?? 0}–{sekolah?.to ?? 0} dari {sekolah?.total ?? 0} sekolah</span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        <th style={{ ...S.th, paddingLeft: 16, width: 36 }}>No</th>
                                        <th style={S.th}>Nama Sekolah</th>
                                        <th style={S.th}>Kecamatan / Kab</th>
                                        <th style={{ ...S.th, textAlign: "center" }}>Jenjang</th>
                                        {isAreaDashboard && (
                                            <th style={S.th}>Cabang</th>
                                        )}
                                        <th style={{ ...S.th, textAlign: "center" }}>Sumber Dana</th>
                                        <th style={{ ...S.th, textAlign: "center" }}>Status TRL</th>
                                        {!isAreaDashboard && <th style={S.th}>Sales</th>}
                                        <th style={{ ...S.th, textAlign: "right", paddingRight: 16 }}>Siswa</th>
                                        <th style={{ ...S.th, textAlign: "center" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sekolah?.data?.length > 0 ? sekolah.data.map((s, i) => (
                                        <tr key={s.id}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            style={{ transition: "background 0.15s" }}>
                                            <td style={{ ...S.td, paddingLeft: 16, color: T.slate, fontSize: 11 }}>{(sekolah.from ?? 1) + i}</td>
                                            <td style={{ ...S.td, fontWeight: 600, maxWidth: 220 }}>
                                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nama_sekolah}</div>
                                            </td>
                                            <td style={S.td}>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.kecamatan}</div>
                                                {s.kabupaten && <div style={{ fontSize: 10, color: T.slate }}>{s.kabupaten}</div>}
                                            </td>
                                            <td style={{ ...S.td, textAlign: "center" }}>
                                                <Badge label={s.jenjang || "-"} color={JENJANG_COLOR[s.jenjang] || T.slate} bg={`${JENJANG_COLOR[s.jenjang] || T.slate}18`} />
                                            </td>
                                            {isAreaDashboard && (
                                                <td style={{ ...S.td, fontWeight: 600 }}>{s.cabang_name || "-"}</td>
                                            )}
                                            <td style={{ ...S.td, textAlign: "center" }}>
                                                <span style={{ fontSize: 11, color: T.slate, fontWeight: 600 }}>{s.sumber_dana || "-"}</span>
                                            </td>
                                            <td style={{ ...S.td, textAlign: "center" }}><TrlBadge status={s.trl_status} /></td>
                                            {!isAreaDashboard && (
                                            <td style={S.td}>
                                                <span style={{ fontSize: 12, cursor: "pointer", color: T.blue, textDecoration: "underline", textUnderlineOffset: 2 }}
                                                    onClick={() => apply("sales_id", filters.sales_id === String(s.sales_id) ? "" : String(s.sales_id))}>
                                                    {s.sales_name}
                                                </span>
                                            </td>
                                            )}
                                            <td style={{ ...S.td, textAlign: "right", paddingRight: 16, fontWeight: 600 }}>{fmt(s.total_student)}</td>
                                            <td style={{ ...S.td, textAlign: "center" }}>
                                                <a href={route("monitoring.sekolah.show", s.id)} target="_blank" rel="noreferrer"
                                                    style={{ color: T.blue, fontSize: 11, fontWeight: 600, textDecoration: "none", padding: "3px 8px", background: "#dbeafe", borderRadius: 5 }}>
                                                    Detail
                                                </a>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={isAreaDashboard ? 9 : 9} style={{ ...S.td, textAlign: "center", padding: "40px 0", color: T.slate }}>
                                                <i className="bi bi-inbox" style={{ fontSize: 28, display: "block", marginBottom: 6, opacity: 0.4 }} />
                                                Tidak ada sekolah untuk filter yang dipilih.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination meta={sekolah} onPage={goPage} />
                    </div>
                )}

            </div>
        </MonitoringLayout>
    );
}
