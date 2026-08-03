import React, { useState, useEffect, useCallback } from "react";
import MonitoringLayout from "../../Layouts/MonitoringLayout";
import { Head, Link, router } from "@inertiajs/react";

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function gradeColor(score) {
    if (score >= 80) return { fg: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
    if (score >= 60) return { fg: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
    if (score >= 40) return { fg: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    return { fg: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
}

function ScoreBar({ score, color }) {
    return (
        <div
            style={{
                width: "100%",
                height: 6,
                background: "#f1f5f9",
                borderRadius: 99,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: `${Math.min(100, Math.max(0, score))}%`,
                    height: "100%",
                    background: color,
                    borderRadius: 99,
                    transition: "width 0.3s ease",
                }}
            />
        </div>
    );
}

export default function Report({
    reportData,
    summary,
    filterOptions = { areas: [], cabangs: [], years: [] },
    filters = {},
    tahun,
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const [areaId, setAreaId] = useState(filters?.area_id || "");
    const [cabangId, setCabangId] = useState(filters?.cabang_id || "");
    const [tahunFilter, setTahunFilter] = useState(
        filters?.tahun || tahun || "",
    );

    const applyFilters = useCallback(
        debounce((next) => {
            const query = {};
            if (next.search) query.search = next.search;
            if (next.area_id) query.area_id = next.area_id;
            if (next.cabang_id) query.cabang_id = next.cabang_id;
            if (next.tahun) query.tahun = next.tahun;
            if (next.sort) query.sort = next.sort;
            if (next.dir) query.dir = next.dir;

            router.get(route("monitoring.report"), query, {
                preserveState: true,
                replace: true,
            });
        }, 400),
        [],
    );

    useEffect(() => {
        applyFilters({
            search,
            area_id: areaId,
            cabang_id: cabangId,
            tahun: tahunFilter,
            sort: filters?.sort,
            dir: filters?.dir,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, areaId, cabangId, tahunFilter]);

    const availableCabangs = areaId
        ? (filterOptions.cabangs || []).filter((c) => c.area_id == areaId)
        : filterOptions.cabangs || [];

    const handleSort = (column) => {
        const currentSort = filters?.sort || "total_score";
        const currentDir = filters?.dir || "desc";
        const newDir =
            currentSort === column && currentDir === "desc" ? "asc" : "desc";

        router.get(
            route("monitoring.report"),
            {
                search: search || undefined,
                area_id: areaId || undefined,
                cabang_id: cabangId || undefined,
                tahun: tahunFilter || undefined,
                sort: column,
                dir: newDir,
            },
            { preserveState: true, replace: true },
        );
    };

    const SortIcon = ({ column }) => {
        const active = (filters?.sort || "total_score") === column;
        const dir = filters?.dir || "desc";
        return (
            <i
                className={`bi bi-caret-${active && dir === "asc" ? "up" : "down"}-fill`}
                style={{
                    fontSize: 10,
                    marginLeft: 4,
                    opacity: active ? 1 : 0.35,
                    color: active ? "#2563eb" : "#94a3b8",
                }}
            />
        );
    };

    const summaryCards = [
        {
            label: "Total Sales",
            value: summary?.total_sales ?? 0,
            icon: "bi-people-fill",
            color: "#1d4ed8",
            bg: "#eff6ff",
        },
        {
            label: "Rata-rata Score",
            value: summary?.avg_score ?? 0,
            icon: "bi-speedometer2",
            color: "#0d9488",
            bg: "#f0fdfa",
        },
        {
            label: "Sangat Baik",
            value: summary?.sangat_baik ?? 0,
            icon: "bi-trophy-fill",
            color: "#059669",
            bg: "#ecfdf5",
        },
        {
            label: "Kurang",
            value: summary?.kurang ?? 0,
            icon: "bi-exclamation-triangle-fill",
            color: "#dc2626",
            bg: "#fef2f2",
        },
    ];

    return (
        <MonitoringLayout activeNav="report">
            <Head title="Report Sales Score" />
            <div
                style={{
                    padding: "28px 30px",
                    maxWidth: 1280,
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        marginBottom: 22,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: 26,
                                fontWeight: 800,
                                color: "#0f172a",
                                letterSpacing: "-0.4px",
                                margin: 0,
                            }}
                        >
                            Report Sales Score
                        </h1>
                        <p
                            style={{
                                color: "#64748b",
                                marginTop: 4,
                                fontSize: 14,
                            }}
                        >
                            Performa sales berdasarkan rata-rata 6 indikator
                            penilaian
                            {tahunFilter ? ` · Tahun ${tahunFilter}` : ""}.
                        </p>
                    </div>
                    <a
                        href={route("monitoring.report.export", {
                            search: search || undefined,
                            area_id: areaId || undefined,
                            cabang_id: cabangId || undefined,
                            tahun: tahunFilter || undefined,
                            sort: filters?.sort || undefined,
                            dir: filters?.dir || undefined,
                        })}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 16px",
                            borderRadius: 10,
                            background: "#059669",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            textDecoration: "none",
                            border: "1px solid #047857",
                            boxShadow: "0 1px 3px rgba(5,150,105,0.25)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <i className="bi bi-file-earmark-excel-fill" />
                        Export Excel
                    </a>
                </div>

                {/* Summary */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                        marginBottom: 20,
                    }}
                >
                    {summaryCards.map((card) => (
                        <div
                            key={card.label}
                            style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: "16px 18px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: card.bg,
                                    color: card.color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    flexShrink: 0,
                                }}
                            >
                                <i className={`bi ${card.icon}`} />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#64748b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.4px",
                                    }}
                                >
                                    {card.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 800,
                                        color: "#0f172a",
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {card.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: 20,
                        marginBottom: 20,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                        display: "flex",
                        gap: 14,
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                    }}
                >
                    <div style={{ flex: "1 1 220px" }}>
                        <label style={labelStyle}>Pencarian Sales</label>
                        <div style={{ position: "relative" }}>
                            <i
                                className="bi bi-search"
                                style={{
                                    position: "absolute",
                                    left: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                    fontSize: 13,
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Ketik nama sales..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ ...inputStyle, paddingLeft: 36 }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: "1 1 160px" }}>
                        <label style={labelStyle}>Area</label>
                        <select
                            value={areaId}
                            onChange={(e) => {
                                setAreaId(e.target.value);
                                setCabangId("");
                            }}
                            style={inputStyle}
                        >
                            <option value="">Semua Area</option>
                            {(filterOptions.areas || []).map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: "1 1 160px" }}>
                        <label style={labelStyle}>Cabang</label>
                        <select
                            value={cabangId}
                            onChange={(e) => setCabangId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">Semua Cabang</option>
                            {availableCabangs.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nama_cabang}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: "0 1 120px" }}>
                        <label style={labelStyle}>Tahun</label>
                        <select
                            value={tahunFilter}
                            onChange={(e) => setTahunFilter(e.target.value)}
                            style={inputStyle}
                        >
                            {(filterOptions.years || []).map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 13,
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background: "#f8fafc",
                                        borderBottom: "1px solid #e2e8f0",
                                    }}
                                >
                                    <th style={{ ...thStyle, width: 48 }}>
                                        #
                                    </th>
                                    <th
                                        style={{ ...thStyle, cursor: "pointer" }}
                                        onClick={() => handleSort("sales_name")}
                                    >
                                        Nama Sales
                                        <SortIcon column="sales_name" />
                                    </th>
                                    <th
                                        style={{ ...thStyle, cursor: "pointer" }}
                                        onClick={() => handleSort("area_name")}
                                    >
                                        Area / Cabang
                                        <SortIcon column="area_name" />
                                    </th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            handleSort("total_score")
                                        }
                                    >
                                        Score
                                        <SortIcon column="total_score" />
                                    </th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            minWidth: 220,
                                        }}
                                    >
                                        Komponen KPI
                                    </th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            textAlign: "center",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleSort("grade")}
                                    >
                                        Grade
                                        <SortIcon column="grade" />
                                    </th>
                                    <th
                                        style={{
                                            ...thStyle,
                                            textAlign: "center",
                                            width: 90,
                                        }}
                                    >
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(reportData?.data || []).length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            style={{
                                                padding: "48px 24px",
                                                textAlign: "center",
                                                color: "#94a3b8",
                                            }}
                                        >
                                            <i
                                                className="bi bi-inbox"
                                                style={{
                                                    fontSize: 28,
                                                    display: "block",
                                                    marginBottom: 8,
                                                }}
                                            />
                                            Tidak ada data sales untuk filter
                                            ini.
                                        </td>
                                    </tr>
                                )}
                                {(reportData?.data || []).map((row, index) => {
                                    const colors = gradeColor(row.total_score);
                                    const page =
                                        reportData.current_page || 1;
                                    const perPage = reportData.per_page || 20;
                                    const no =
                                        (page - 1) * perPage + index + 1;
                                    const c = row.components || {};

                                    return (
                                        <tr
                                            key={row.sales_id}
                                            style={{
                                                borderBottom: "1px solid #f1f5f9",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.background =
                                                    "#f8fafc")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.background =
                                                    "transparent")
                                            }
                                        >
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    color: "#94a3b8",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {no}
                                            </td>
                                            <td style={tdStyle}>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    {row.sales_name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#94a3b8",
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {row.total_sekolah} sekolah
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "#334155",
                                                    }}
                                                >
                                                    {row.area_name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#94a3b8",
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {row.cabang_name}
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    textAlign: "center",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 22,
                                                        fontWeight: 800,
                                                        color: colors.fg,
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    {row.total_score}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        color: "#94a3b8",
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    / 100
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, minWidth: 220 }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 7,
                                                    }}
                                                >
                                                    <KpiMini
                                                        label="Realisasi YoY"
                                                        score={c.realisasi_yoy_score}
                                                        color="#3b82f6"
                                                        tip={`Real ${tahun - 1}: ${Number(c.real_prev ?? 0).toLocaleString("id-ID")} → ${tahun}: ${Number(c.real_curr ?? 0).toLocaleString("id-ID")}`}
                                                    />
                                                    <KpiMini
                                                        label="Realisasi vs AC"
                                                        score={c.sp_vs_ac_score}
                                                        color="#f59e0b"
                                                        tip={`Customer Realisasi ${c.sp_count ?? 0} vs AC ${c.ac_curr ?? 0}`}
                                                    />
                                                    <KpiMini
                                                        label="Achievement"
                                                        score={c.achievement_score}
                                                        color="#10b981"
                                                        tip={`${Number(c.real_curr ?? 0).toLocaleString("id-ID")} / ${Number(c.target_curr ?? 0).toLocaleString("id-ID")} (${c.achievement_pct ?? 0}%)`}
                                                    />
                                                    <KpiMini
                                                        label="Tahan vs AC"
                                                        score={c.tahan_vs_ac_score}
                                                        color="#059669"
                                                        tip={`Tahan ${c.tahan_count ?? 0} vs AC ${c.ac_curr ?? 0}`}
                                                    />
                                                    <KpiMini
                                                        label="Rebut vs AC"
                                                        score={c.rebut_vs_ac_score}
                                                        color="#2563eb"
                                                        tip={`Rebut ${c.rebut_count ?? 0} vs AC ${c.ac_curr ?? 0}`}
                                                    />
                                                    <KpiMini
                                                        label="Lepas vs AC (−)"
                                                        score={c.lepas_vs_ac_score}
                                                        color="#ef4444"
                                                        tip={`Lepas ${c.lepas_count ?? 0} vs AC ${c.ac_curr ?? 0} — mengurangi skor`}
                                                    />
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    textAlign: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "4px 10px",
                                                        borderRadius: 99,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: colors.fg,
                                                        background: colors.bg,
                                                        border: `1px solid ${colors.border}`,
                                                    }}
                                                >
                                                    {row.grade}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    textAlign: "center",
                                                }}
                                            >
                                                <Link
                                                    href={route(
                                                        "monitoring.sales-performance",
                                                        {
                                                            area_id:
                                                                row.area_id ||
                                                                undefined,
                                                            cabang_id:
                                                                row.cabang_id ||
                                                                undefined,
                                                            sales_id:
                                                                row.sales_id,
                                                            tahun:
                                                                tahunFilter ||
                                                                undefined,
                                                        },
                                                    )}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                        background: "#eff6ff",
                                                        color: "#1d4ed8",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textDecoration: "none",
                                                        border: "1px solid #bfdbfe",
                                                    }}
                                                >
                                                    Detail
                                                    <i className="bi bi-arrow-right" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {reportData?.last_page > 1 && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 20px",
                                borderTop: "1px solid #e2e8f0",
                                background: "#f8fafc",
                            }}
                        >
                            <span style={{ fontSize: 12, color: "#64748b" }}>
                                Menampilkan {reportData.from}–{reportData.to}{" "}
                                dari {reportData.total} sales
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                                {(reportData.links || [])
                                    .filter(
                                        (l) =>
                                            l.label === "&laquo; Previous" ||
                                            l.label === "Next &raquo;" ||
                                            !isNaN(Number(l.label)),
                                    )
                                    .map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.get(link.url, {}, {
                                                    preserveState: true,
                                                })
                                            }
                                            style={{
                                                minWidth: 32,
                                                height: 32,
                                                padding: "0 8px",
                                                borderRadius: 8,
                                                border: link.active
                                                    ? "1px solid #2563eb"
                                                    : "1px solid #e2e8f0",
                                                background: link.active
                                                    ? "#2563eb"
                                                    : "#fff",
                                                color: link.active
                                                    ? "#fff"
                                                    : "#475569",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: link.url
                                                    ? "pointer"
                                                    : "not-allowed",
                                                opacity: link.url ? 1 : 0.4,
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    link.label ===
                                                    "&laquo; Previous"
                                                        ? "‹"
                                                        : link.label ===
                                                            "Next &raquo;"
                                                          ? "›"
                                                          : link.label,
                                            }}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MonitoringLayout>
    );
}

function KpiMini({ label, score = 0, color, tip }) {
    return (
        <div title={tip}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 2,
                }}
            >
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>
                    {label}
                </span>
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#0f172a",
                    }}
                >
                    {score}
                </span>
            </div>
            <ScoreBar score={score} color={color} />
        </div>
    );
}

const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
};

const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#0f172a",
    fontSize: 13,
    outline: "none",
};

const thStyle = {
    padding: "12px 16px",
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: "0.5px",
    textAlign: "left",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "14px 16px",
    verticalAlign: "middle",
};
