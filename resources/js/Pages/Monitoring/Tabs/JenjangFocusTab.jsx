import React, { useMemo, useState } from "react";

const T = {
    blue: "#2563eb",
    blueSoft: "#60a5fa",
    green: "#10b981",
    orange: "#f59e0b",
    red: "#ef4444",
    slate: "#475569",
    text: "#0f172a",
    border: "#e2e8f0",
};

const S = {
    th: {
        fontSize: 10,
        fontWeight: 700,
        color: T.slate,
        padding: "8px 10px",
        background: "#f8fafc",
        borderBottom: `1px solid ${T.border}`,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    },
    td: {
        fontSize: 11.5,
        color: T.text,
        padding: "7px 10px",
        borderBottom: `1px solid #f4f6f8`,
    },
    card: {
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
        border: `1px solid ${T.border}`,
        overflow: "hidden",
    },
};

const JENJANG_COLOR = {
    SD: "#1d4ed8",
    SMP: "#60a5fa",
    SMA: "#fbbf24",
    SMK: "#fb923c",
    DLL: "#10b981",
};

function fmt(n) {
    return new Intl.NumberFormat("id-ID").format(Number(n) || 0);
}

function growthColor(v) {
    if (v > 0) return T.green;
    if (v < 0) return T.red;
    return T.slate;
}

function MetricCard({ label, value, sub, color }) {
    return (
        <div
            style={{
                ...S.card,
                padding: "12px 14px",
                flex: 1,
                minWidth: 140,
            }}
        >
            <div
                style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: T.slate,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    marginBottom: 6,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: color || T.text,
                    lineHeight: 1.1,
                }}
            >
                {value}
            </div>
            {sub ? (
                <div style={{ fontSize: 10.5, color: T.slate, marginTop: 4 }}>
                    {sub}
                </div>
            ) : null}
        </div>
    );
}

function MetricsTable({ rows, showJenjang = true, totals }) {
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        {showJenjang && (
                            <th style={{ ...S.th, textAlign: "left" }}>
                                Jenjang
                            </th>
                        )}
                        <th style={{ ...S.th, textAlign: "right" }}>
                            AC Prev
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            AC Curr
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Growth AC
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Eks Prev
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Eks Curr
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Cust Prev
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Cust Curr
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Sekolah Baru
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Siswa
                        </th>
                        <th style={{ ...S.th, textAlign: "right" }}>
                            Potensi
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.jenjang}>
                            {showJenjang && (
                                <td style={{ ...S.td, fontWeight: 700 }}>
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 2,
                                                background:
                                                    JENJANG_COLOR[r.jenjang] ||
                                                    T.slate,
                                            }}
                                        />
                                        {r.jenjang}
                                    </span>
                                </td>
                            )}
                            <td style={{ ...S.td, textAlign: "right" }}>
                                {fmt(r.ac_prev)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 700,
                                }}
                            >
                                {fmt(r.ac_curr)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: growthColor(r.ac_growth),
                                }}
                            >
                                {r.ac_growth > 0 ? "+" : ""}
                                {r.ac_growth}%
                            </td>
                            <td style={{ ...S.td, textAlign: "right" }}>
                                {fmt(r.real_eks_prev)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 700,
                                    color: T.blue,
                                }}
                            >
                                {fmt(r.real_eks_curr)}
                            </td>
                            <td style={{ ...S.td, textAlign: "right" }}>
                                {fmt(r.real_cust_prev)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 700,
                                }}
                            >
                                {fmt(r.real_cust_curr)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: T.orange,
                                }}
                            >
                                {fmt(r.sekolah_baru)}
                            </td>
                            <td style={{ ...S.td, textAlign: "right" }}>
                                {fmt(r.siswa)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: "#7c3aed",
                                }}
                            >
                                {fmt(r.potensi)}
                            </td>
                        </tr>
                    ))}
                    {totals && (
                        <tr style={{ background: "#f8fafc" }}>
                            {showJenjang && (
                                <td
                                    style={{
                                        ...S.td,
                                        fontWeight: 800,
                                        borderTop: `2px solid ${T.border}`,
                                    }}
                                >
                                    Total
                                </td>
                            )}
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.ac_prev)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.ac_curr)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: growthColor(totals.ac_growth),
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {totals.ac_growth > 0 ? "+" : ""}
                                {totals.ac_growth}%
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.real_eks_prev)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: T.blue,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.real_eks_curr)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.real_cust_prev)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.real_cust_curr)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: T.orange,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.sekolah_baru)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.siswa)}
                            </td>
                            <td
                                style={{
                                    ...S.td,
                                    textAlign: "right",
                                    fontWeight: 800,
                                    color: "#7c3aed",
                                    borderTop: `2px solid ${T.border}`,
                                }}
                            >
                                {fmt(totals.potensi)}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default function JenjangFocusTab({ jenjangFocus = {} }) {
    const [groupMode, setGroupMode] = useState("kota"); // kota | kecamatan
    const [search, setSearch] = useState("");
    const [openGroups, setOpenGroups] = useState({});

    const year = jenjangFocus.year || new Date().getFullYear();
    const prevYear = jenjangFocus.prev_year || year - 1;
    const summary = jenjangFocus.summary || [];
    const groups =
        groupMode === "kota"
            ? jenjangFocus.by_kota || []
            : jenjangFocus.by_kecamatan || [];

    const summaryTotals = useMemo(() => {
        const t = {
            ac_prev: 0,
            ac_curr: 0,
            real_eks_prev: 0,
            real_eks_curr: 0,
            real_cust_prev: 0,
            real_cust_curr: 0,
            sekolah_baru: 0,
            potensi: 0,
            siswa: 0,
        };
        summary.forEach((r) => {
            Object.keys(t).forEach((k) => {
                t[k] += Number(r[k]) || 0;
            });
        });
        t.ac_growth =
            t.ac_prev > 0
                ? Math.round(((t.ac_curr - t.ac_prev) / t.ac_prev) * 1000) / 10
                : t.ac_curr > 0
                  ? 100
                  : 0;
        return t;
    }, [summary]);

    const filteredGroups = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter((g) =>
            String(g.group || "")
                .toLowerCase()
                .includes(q),
        );
    }, [groups, search]);

    const toggleGroup = (name) => {
        setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
                style={{
                    ...S.card,
                    padding: "12px 16px",
                    background:
                        "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: T.text,
                        marginBottom: 4,
                    }}
                >
                    Fokus Jenjang · Realisasi & Area Cover {prevYear}–{year}
                </div>
                <div style={{ fontSize: 10.5, color: T.slate, lineHeight: 1.45 }}>
                    Ringkasan per jenjang: Area Cover YoY + growth, realisasi
                    eksemplar & customer, sekolah baru, serta potensi (BOS =
                    siswa × 1,5). Dikelompokkan per Kota/Kab atau Kecamatan.
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                }}
            >
                <MetricCard
                    label={`Area Cover ${year}`}
                    value={fmt(summaryTotals.ac_curr)}
                    sub={`Prev ${prevYear}: ${fmt(summaryTotals.ac_prev)}`}
                    color={T.blue}
                />
                <MetricCard
                    label="Growth Area Cover"
                    value={`${summaryTotals.ac_growth > 0 ? "+" : ""}${summaryTotals.ac_growth}%`}
                    sub="vs tahun lalu"
                    color={growthColor(summaryTotals.ac_growth)}
                />
                <MetricCard
                    label={`Realisasi Eksemplar ${year}`}
                    value={fmt(summaryTotals.real_eks_curr)}
                    sub={`Prev: ${fmt(summaryTotals.real_eks_prev)}`}
                    color={T.blue}
                />
                <MetricCard
                    label={`Realisasi Customer ${year}`}
                    value={fmt(summaryTotals.real_cust_curr)}
                    sub={`Prev: ${fmt(summaryTotals.real_cust_prev)}`}
                />
                <MetricCard
                    label="Sekolah Baru"
                    value={fmt(summaryTotals.sekolah_baru)}
                    sub="Pertama kali dipegang (AC)"
                    color={T.orange}
                />
                <MetricCard
                    label="Jumlah Siswa"
                    value={fmt(summaryTotals.siswa)}
                    sub="Total siswa di portofolio"
                />
                <MetricCard
                    label="Potensi Eksemplar"
                    value={fmt(summaryTotals.potensi)}
                    sub="BOS: siswa × 1,5"
                    color="#7c3aed"
                />
            </div>

            <div style={S.card}>
                <div
                    style={{
                        padding: "12px 16px",
                        borderBottom: `1px solid ${T.border}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.text,
                    }}
                >
                    Ringkasan per Jenjang
                </div>
                <MetricsTable rows={summary} totals={summaryTotals} />
            </div>

            <div style={S.card}>
                <div
                    style={{
                        padding: "12px 16px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: T.text,
                            }}
                        >
                            Detail Grouping
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: T.slate,
                                marginTop: 2,
                            }}
                        >
                            {filteredGroups.length} grup · klik baris untuk
                            expand jenjang
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 4,
                                background: "#f1f5f9",
                                padding: 3,
                                borderRadius: 6,
                            }}
                        >
                            {[
                                { id: "kota", label: "Kota/Kab" },
                                { id: "kecamatan", label: "Kecamatan" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setGroupMode(tab.id);
                                        setOpenGroups({});
                                    }}
                                    style={{
                                        padding: "4px 10px",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        border: "none",
                                        borderRadius: 4,
                                        cursor: "pointer",
                                        background:
                                            groupMode === tab.id
                                                ? "#fff"
                                                : "transparent",
                                        color:
                                            groupMode === tab.id
                                                ? T.blue
                                                : T.slate,
                                        boxShadow:
                                            groupMode === tab.id
                                                ? "0 1px 2px rgba(0,0,0,0.05)"
                                                : "none",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Cari ${groupMode === "kota" ? "kota/kab" : "kecamatan"}...`}
                            style={{
                                fontSize: 11,
                                padding: "6px 10px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                outline: "none",
                                minWidth: 180,
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                        <thead>
                            <tr>
                                <th style={{ ...S.th, textAlign: "left" }}>
                                    {groupMode === "kota"
                                        ? "Kota/Kab"
                                        : "Kecamatan"}
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    AC {prevYear}
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    AC {year}
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    Growth
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    Eks {year}
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    Cust {year}
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    Baru
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    Siswa
                                </th>
                                <th style={{ ...S.th, textAlign: "right" }}>
                                    Potensi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGroups.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="9"
                                        style={{
                                            ...S.td,
                                            textAlign: "center",
                                            color: T.slate,
                                            padding: 20,
                                        }}
                                    >
                                        Tidak ada data
                                    </td>
                                </tr>
                            )}
                            {filteredGroups.map((g) => {
                                const open = !!openGroups[g.group];
                                const t = g.totals || {};
                                return (
                                    <React.Fragment key={g.group}>
                                        <tr
                                            onClick={() => toggleGroup(g.group)}
                                            style={{
                                                cursor: "pointer",
                                                background: open
                                                    ? "#eff6ff"
                                                    : "transparent",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!open)
                                                    e.currentTarget.style.background =
                                                        "#f8fafc";
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!open)
                                                    e.currentTarget.style.background =
                                                        "transparent";
                                            }}
                                        >
                                            <td
                                                style={{
                                                    ...S.td,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <i
                                                        className={`bi bi-chevron-${open ? "down" : "right"}`}
                                                        style={{
                                                            fontSize: 10,
                                                            color: T.slate,
                                                        }}
                                                    />
                                                    {g.group}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {fmt(t.ac_prev)}
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {fmt(t.ac_curr)}
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                    fontWeight: 800,
                                                    color: growthColor(
                                                        t.ac_growth,
                                                    ),
                                                }}
                                            >
                                                {t.ac_growth > 0 ? "+" : ""}
                                                {t.ac_growth}%
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                    fontWeight: 700,
                                                    color: T.blue,
                                                }}
                                            >
                                                {fmt(t.real_eks_curr)}
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {fmt(t.real_cust_curr)}
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                    fontWeight: 800,
                                                    color: T.orange,
                                                }}
                                            >
                                                {fmt(t.sekolah_baru)}
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {fmt(t.siswa)}
                                            </td>
                                            <td
                                                style={{
                                                    ...S.td,
                                                    textAlign: "right",
                                                    fontWeight: 800,
                                                    color: "#7c3aed",
                                                }}
                                            >
                                                {fmt(t.potensi)}
                                            </td>
                                        </tr>
                                        {open && (
                                            <tr>
                                                <td
                                                    colSpan="9"
                                                    style={{
                                                        padding: 0,
                                                        background: "#fafbfc",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "8px 12px 12px 28px",
                                                        }}
                                                    >
                                                        <MetricsTable
                                                            rows={g.rows || []}
                                                            totals={t}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
