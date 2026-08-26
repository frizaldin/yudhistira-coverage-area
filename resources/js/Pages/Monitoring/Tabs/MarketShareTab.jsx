import React, { useEffect, useMemo, useState } from "react";
import { T, Card, stickyTableWrapStyle, stickyTableStyle } from "./SalesPerformanceShared";

const PAGE_SIZE = 100;

function fmt(n) {
    return new Intl.NumberFormat("id-ID").format(Number(n) || 0);
}

function pctColor(pct) {
    if (pct >= 70) return "#16a34a";
    if (pct >= 40) return "#ca8a04";
    if (pct > 0) return "#dc2626";
    return T.slate;
}

function sharePct(num, den) {
    const n = Number(num) || 0;
    const d = Number(den) || 0;
    if (d <= 0) return 0;
    return Math.round((n / d) * 1000) / 10;
}

const GRADE_ORDER = ["A+", "A", "B", "C", "D"];
const GRADE_COLORS = {
    "A+": "#7c3aed",
    A: "#059669",
    B: "#2563eb",
    C: "#d97706",
    D: "#e11d48",
};

function mergeGrades(lists) {
    const set = new Set();
    (lists || []).forEach((list) => {
        (list || []).forEach((g) => {
            const v = String(g || "").trim();
            if (v) set.add(v);
        });
    });
    const ordered = GRADE_ORDER.filter((g) => set.has(g));
    const extra = [...set].filter((g) => !GRADE_ORDER.includes(g)).sort();
    return [...ordered, ...extra];
}

function mergeSalesmanIds(lists) {
    const set = new Set();
    (lists || []).forEach((list) => {
        (list || []).forEach((id) => {
            const n = Number(id);
            if (n > 0) set.add(n);
        });
    });
    return [...set];
}

export default function MarketShareTab({
    marketShareKecamatan = [],
    tahun,
    groupLabel = "Kota/Kab",
    rowLabel = "Kecamatan",
    titlePrefix = null,
    onRowClick,
}) {
    const cardTitle =
        titlePrefix || `Market Share ${rowLabel}`;
    const year = Number(tahun) || new Date().getFullYear();
    const [kotaFilter, setKotaFilter] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ key: "kecamatan", dir: "asc" });
    const [expandedKota, setExpandedKota] = useState(() => new Set());

    const kotaOptions = useMemo(() => {
        const set = new Set();
        (marketShareKecamatan || []).forEach((r) => {
            if (r.kota_kab) set.add(r.kota_kab);
        });
        return [...set].sort((a, b) => a.localeCompare(b, "id"));
    }, [marketShareKecamatan]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (marketShareKecamatan || []).filter((r) => {
            if (kotaFilter && r.kota_kab !== kotaFilter) return false;
            if (!q) return true;
            return (
                String(r.kecamatan || "")
                    .toLowerCase()
                    .includes(q) ||
                String(r.kota_kab || "")
                    .toLowerCase()
                    .includes(q)
            );
        });
    }, [marketShareKecamatan, kotaFilter, search]);

    useEffect(() => {
        setPage(1);
        setExpandedKota(new Set());
    }, [kotaFilter, search, sort]);

    const compareRows = (a, b, key, dir) => {
        const mul = dir === "asc" ? 1 : -1;
        if (key === "kecamatan" || key === "kota_kab") {
            return (
                String(a[key] || "").localeCompare(String(b[key] || ""), "id", {
                    sensitivity: "base",
                }) * mul
            );
        }
        const av = Number(a[key]) || 0;
        const bv = Number(b[key]) || 0;
        if (av === bv) {
            return String(a.kecamatan || "").localeCompare(
                String(b.kecamatan || ""),
                "id",
            );
        }
        return (av - bv) * mul;
    };

    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach((r) => {
            const kota = r.kota_kab || `Tanpa ${groupLabel}`;
            if (!map[kota]) {
                map[kota] = {
                    key: kota,
                    display: kota,
                    rows: [],
                    totals: {
                        total_sekolah: 0,
                        jumlah_siswa: 0,
                        area_cover: 0,
                        jumlah_salesman: 0,
                        salesman_ids: [],
                        sekolah_realisasi: 0,
                        sp_customer: 0,
                        real_exemplar: 0,
                        sp_exemplar: 0,
                        grades_realisasi: [],
                    },
                };
            }
            map[kota].rows.push(r);
            map[kota].totals.total_sekolah += Number(r.total_sekolah) || 0;
            map[kota].totals.jumlah_siswa += Number(r.jumlah_siswa) || 0;
            map[kota].totals.area_cover += Number(r.area_cover) || 0;
            map[kota].totals.sekolah_realisasi +=
                Number(r.sekolah_realisasi) || 0;
            map[kota].totals.sp_customer += Number(r.sp_customer) || 0;
            map[kota].totals.real_exemplar += Number(r.real_exemplar) || 0;
            map[kota].totals.sp_exemplar += Number(r.sp_exemplar) || 0;
            map[kota].totals.grades_realisasi = mergeGrades([
                map[kota].totals.grades_realisasi,
                r.grades_realisasi,
            ]);
            map[kota].totals.salesman_ids = mergeSalesmanIds([
                map[kota].totals.salesman_ids,
                r.salesman_ids,
            ]);
            map[kota].totals.jumlah_salesman =
                map[kota].totals.salesman_ids.length;
        });

        const { key, dir } = sort;

        return Object.values(map)
            .map((g) => {
                g.rows = [...g.rows].sort((a, b) => compareRows(a, b, key, dir));
                g.totals.marketshare_ac_pct = sharePct(
                    g.totals.area_cover,
                    g.totals.total_sekolah,
                );
                g.totals.marketshare_real_pct = sharePct(
                    g.totals.sekolah_realisasi,
                    g.totals.total_sekolah,
                );
                // backward-compat sort key
                g.totals.marketshare_pct = g.totals.marketshare_ac_pct;
                return g;
            })
            .sort((a, b) => {
                if (key === "kecamatan") {
                    return a.display.localeCompare(b.display, "id") * (dir === "asc" ? 1 : -1);
                }
                const left = { ...a.totals, kecamatan: a.display, kota_kab: a.display };
                const right = { ...b.totals, kecamatan: b.display, kota_kab: b.display };
                return compareRows(left, right, key, dir);
            });
    }, [filtered, sort, groupLabel]);

    // Flatten for pagination by kecamatan rows, keep group headers for visible page
    const flatRows = useMemo(() => {
        const out = [];
        grouped.forEach((g) => {
            g.rows.forEach((r) => out.push({ ...r, _kota: g.key }));
        });
        return out;
    }, [grouped]);

    const totalItems = flatRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE) || 1);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const pageStart = (safePage - 1) * PAGE_SIZE;
    const pageEnd = Math.min(pageStart + PAGE_SIZE, totalItems);
    const pageFlat = flatRows.slice(pageStart, pageEnd);

    const pageGrouped = useMemo(() => {
        const map = {};
        const order = [];
        pageFlat.forEach((r) => {
            const kota = r._kota || `Tanpa ${groupLabel}`;
            if (!map[kota]) {
                const full = grouped.find((g) => g.key === kota);
                map[kota] = {
                    key: kota,
                    display: kota,
                    rows: [],
                    totals: full?.totals || {
                        total_sekolah: 0,
                        jumlah_siswa: 0,
                        area_cover: 0,
                        jumlah_salesman: 0,
                        salesman_ids: [],
                        sekolah_realisasi: 0,
                        sp_customer: 0,
                        real_exemplar: 0,
                        sp_exemplar: 0,
                        grades_realisasi: [],
                        marketshare_ac_pct: 0,
                        marketshare_real_pct: 0,
                        marketshare_pct: 0,
                    },
                };
                order.push(kota);
            }
            map[kota].rows.push(r);
        });
        return order.map((k) => map[k]);
    }, [pageFlat, grouped, groupLabel]);

    const pageNumbers = (() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = new Set([1, totalPages, safePage]);
        for (let p = safePage - 1; p <= safePage + 1; p++) {
            if (p >= 1 && p <= totalPages) pages.add(p);
        }
        const sorted = [...pages].sort((a, b) => a - b);
        const withDots = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) withDots.push("…");
            withDots.push(sorted[i]);
        }
        return withDots;
    })();

    const grand = useMemo(() => {
        const t = {
            total_sekolah: 0,
            jumlah_siswa: 0,
            area_cover: 0,
            jumlah_salesman: 0,
            salesman_ids: [],
            sekolah_realisasi: 0,
            sp_customer: 0,
            real_exemplar: 0,
            sp_exemplar: 0,
            grades_realisasi: [],
        };
        filtered.forEach((r) => {
            t.total_sekolah += Number(r.total_sekolah) || 0;
            t.jumlah_siswa += Number(r.jumlah_siswa) || 0;
            t.area_cover += Number(r.area_cover) || 0;
            t.sekolah_realisasi += Number(r.sekolah_realisasi) || 0;
            t.sp_customer += Number(r.sp_customer) || 0;
            t.real_exemplar += Number(r.real_exemplar) || 0;
            t.sp_exemplar += Number(r.sp_exemplar) || 0;
            t.grades_realisasi = mergeGrades([
                t.grades_realisasi,
                r.grades_realisasi,
            ]);
            t.salesman_ids = mergeSalesmanIds([t.salesman_ids, r.salesman_ids]);
        });
        t.jumlah_salesman = t.salesman_ids.length;
        t.marketshare_ac_pct = sharePct(t.area_cover, t.total_sekolah);
        t.marketshare_real_pct = sharePct(t.sekolah_realisasi, t.total_sekolah);
        t.marketshare_pct = t.marketshare_ac_pct;
        return t;
    }, [filtered]);

    const renderGradeBadges = (grades) => {
        const list = Array.isArray(grades) ? grades : [];
        if (list.length === 0) {
            return <span style={{ color: T.slate }}>—</span>;
        }
        return (
            <span
                style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    gap: 4,
                    justifyContent: "flex-start",
                }}
            >
                {list.map((g) => {
                    const color = GRADE_COLORS[g] || T.slate;
                    return (
                        <span
                            key={g}
                            style={{
                                display: "inline-block",
                                minWidth: 24,
                                padding: "1px 6px",
                                borderRadius: 5,
                                fontSize: 10,
                                fontWeight: 800,
                                textAlign: "center",
                                color,
                                background: `${color}18`,
                                border: `1px solid ${color}55`,
                            }}
                        >
                            {g}
                        </span>
                    );
                })}
            </span>
        );
    };

    const toggleKota = (key) => {
        setExpandedKota((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const th = {
        padding: "8px 10px",
        fontSize: 10,
        fontWeight: 700,
        color: T.slate,
        background: "#f8fafc",
        borderBottom: `1px solid ${T.border}`,
        borderRight: `1px solid ${T.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
        textAlign: "right",
        userSelect: "none",
        position: "sticky",
        top: 0,
        zIndex: 5,
    };
    const TH_ROW1_H = 28;
    const thRow2 = { ...th, top: TH_ROW1_H, zIndex: 4 };
    const td = {
        padding: "7px 10px",
        fontSize: 11.5,
        color: T.text,
        borderBottom: `1px solid #f1f5f9`,
        borderRight: `1px solid ${T.border}`,
        textAlign: "right",
    };

    const toggleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: key === "kecamatan" ? "asc" : "desc" },
        );
    };

    const sortMark = (key) => {
        if (sort.key !== key) return "";
        return sort.dir === "asc" ? " ↑" : " ↓";
    };

    const sortableTh = (label, key, align = "right") => (
        <th
            onClick={() => toggleSort(key)}
            title="Klik untuk sortir"
            style={{
                ...thRow2,
                textAlign: align,
                cursor: "pointer",
                color: sort.key === key ? T.blue : T.slate,
            }}
        >
            {label}
            {sortMark(key)}
        </th>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Card
                title={`${cardTitle} · ${year}`}
                sub={
                    onRowClick
                        ? `Klik baris ${rowLabel.toLowerCase()} untuk buka tab Jenjang`
                        : undefined
                }
                noPad
            >
                <div
                    style={{
                        padding: "8px 12px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        background: "#fff",
                    }}
                >
                    <div style={{ fontSize: 10.5, color: T.slate }}>
                        Menampilkan{" "}
                        <strong style={{ color: T.text }}>
                            {totalItems === 0
                                ? 0
                                : `${pageStart + 1}–${pageEnd}`}
                        </strong>{" "}
                        dari {totalItems} {rowLabel.toLowerCase()} ·{" "}
                        {year}: Real Cust / Real Eks · Grade = grade sekolah
                        ber-realisasi · Marketshare Real = Real sekolah / Total ·
                        MS AC = Area Cover / Total
                        {onRowClick
                            ? ` · klik ${rowLabel.toLowerCase()} untuk buka tab Jenjang`
                            : ` · klik ${groupLabel} untuk hide-show`}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <select
                            value={kotaFilter}
                            onChange={(e) => setKotaFilter(e.target.value)}
                            style={{
                                minWidth: 160,
                                maxWidth: 220,
                                padding: "5px 8px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                fontSize: 11,
                                outline: "none",
                                color: T.text,
                                background: "#f8fafc",
                                cursor: "pointer",
                            }}
                        >
                            <option value="">Semua {groupLabel}</option>
                            {kotaOptions.map((kota) => (
                                <option key={kota} value={kota}>
                                    {kota}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Cari ${rowLabel.toLowerCase()}...`}
                            style={{
                                minWidth: 160,
                                padding: "5px 8px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                fontSize: 11,
                                outline: "none",
                                color: T.text,
                                background: "#f8fafc",
                            }}
                        />
                    </div>
                </div>

                <div style={stickyTableWrapStyle}>
                    <table
                        style={{
                            ...stickyTableStyle,
                            minWidth: 1180,
                        }}
                    >
                        <thead>
                            <tr>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("kecamatan")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...th,
                                        textAlign: "left",
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                        color:
                                            sort.key === "kecamatan"
                                                ? T.blue
                                                : T.slate,
                                    }}
                                >
                                    {rowLabel}
                                    {sortMark("kecamatan")}
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("jumlah_siswa")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...th,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                        color:
                                            sort.key === "jumlah_siswa"
                                                ? T.blue
                                                : T.slate,
                                    }}
                                >
                                    Jumlah Siswa
                                    {sortMark("jumlah_siswa")}
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("total_sekolah")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...th,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                        color:
                                            sort.key === "total_sekolah"
                                                ? T.blue
                                                : T.slate,
                                    }}
                                >
                                    Jumlah Sekolah
                                    {sortMark("total_sekolah")}
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("area_cover")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...th,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                        color:
                                            sort.key === "area_cover"
                                                ? T.blue
                                                : T.slate,
                                    }}
                                >
                                    Area Cover
                                    {sortMark("area_cover")}
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("jumlah_salesman")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...th,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                        color:
                                            sort.key === "jumlah_salesman"
                                                ? T.blue
                                                : T.slate,
                                    }}
                                >
                                    Jumlah Salesman
                                    {sortMark("jumlah_salesman")}
                                </th>
                                <th
                                    colSpan={2}
                                    style={{
                                        ...th,
                                        textAlign: "center",
                                        background: "#eff6ff",
                                        color: T.blue,
                                    }}
                                >
                                    {year}
                                </th>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...th,
                                        verticalAlign: "middle",
                                        textAlign: "left",
                                        minWidth: 90,
                                    }}
                                    title="Grade sekolah yang mendapat realisasi"
                                >
                                    Grade
                                </th>
                                <th
                                    colSpan={2}
                                    style={{
                                        ...th,
                                        textAlign: "center",
                                        background: "#ecfdf5",
                                        color: "#047857",
                                    }}
                                >
                                    Marketshare
                                </th>
                            </tr>
                            <tr>
                                {sortableTh("Real Cust", "sekolah_realisasi")}
                                {sortableTh("Real Eks", "real_exemplar")}
                                {sortableTh("Real", "marketshare_real_pct")}
                                {sortableTh("Area Cover", "marketshare_ac_pct")}
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ background: "#eff6ff" }}>
                                <td
                                    style={{
                                        ...td,
                                        textAlign: "left",
                                        fontWeight: 800,
                                        color: T.blue,
                                    }}
                                >
                                    Total ({fmt(totalItems)} {rowLabel.toLowerCase()})
                                </td>
                                <td style={{ ...td, fontWeight: 800 }}>
                                    {fmt(grand.jumlah_siswa)}
                                </td>
                                <td style={{ ...td, fontWeight: 800 }}>
                                    {fmt(grand.total_sekolah)}
                                </td>
                                <td style={{ ...td, fontWeight: 800 }}>
                                    {fmt(grand.area_cover)}
                                </td>
                                <td style={{ ...td, fontWeight: 800 }}>
                                    {fmt(grand.jumlah_salesman)}
                                </td>
                                <td style={{ ...td, fontWeight: 800 }}>
                                    {fmt(grand.sekolah_realisasi)}
                                </td>
                                <td
                                    style={{
                                        ...td,
                                        fontWeight: 800,
                                        color: T.blue,
                                    }}
                                >
                                    {fmt(grand.real_exemplar)}
                                </td>
                                <td
                                    style={{
                                        ...td,
                                        textAlign: "left",
                                        fontWeight: 700,
                                    }}
                                >
                                    {renderGradeBadges(grand.grades_realisasi)}
                                </td>
                                <td
                                    style={{
                                        ...td,
                                        fontWeight: 800,
                                        color: pctColor(grand.marketshare_real_pct),
                                    }}
                                >
                                    {grand.marketshare_real_pct}%
                                </td>
                                <td
                                    style={{
                                        ...td,
                                        fontWeight: 800,
                                        color: pctColor(grand.marketshare_ac_pct),
                                    }}
                                >
                                    {grand.marketshare_ac_pct}%
                                </td>
                            </tr>

                            {pageGrouped.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={10}
                                        style={{
                                            ...td,
                                            textAlign: "center",
                                            color: T.slate,
                                            padding: 20,
                                        }}
                                    >
                                        Tidak ada data
                                    </td>
                                </tr>
                            )}

                            {pageGrouped.map((kota) => {
                                const open = expandedKota.has(kota.key);
                                const msReal = kota.totals.marketshare_real_pct || 0;
                                const msAc = kota.totals.marketshare_ac_pct || 0;
                                return (
                                    <React.Fragment key={kota.key}>
                                        <tr
                                            onClick={() => toggleKota(kota.key)}
                                            style={{
                                                cursor: "pointer",
                                                background: open
                                                    ? "#dbeafe"
                                                    : "#eff6ff",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    ...td,
                                                    textAlign: "left",
                                                    fontWeight: 800,
                                                    color: "#1e40af",
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
                                                        style={{ fontSize: 10 }}
                                                    />
                                                    <i
                                                        className="bi bi-building"
                                                        style={{ fontSize: 11 }}
                                                    />
                                                    {kota.display}
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                            color: T.slate,
                                                            fontSize: 10,
                                                        }}
                                                    >
                                                        ({kota.rows.length}{" "}
                                                        {rowLabel.toLowerCase()})
                                                    </span>
                                                </span>
                                            </td>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                {fmt(kota.totals.jumlah_siswa)}
                                            </td>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                {fmt(kota.totals.total_sekolah)}
                                            </td>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                {fmt(kota.totals.area_cover)}
                                            </td>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                {fmt(kota.totals.jumlah_salesman)}
                                            </td>
                                            <td style={{ ...td, fontWeight: 700 }}>
                                                {fmt(kota.totals.sekolah_realisasi)}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    fontWeight: 700,
                                                    color: T.blue,
                                                }}
                                            >
                                                {fmt(kota.totals.real_exemplar)}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    textAlign: "left",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {renderGradeBadges(
                                                    kota.totals.grades_realisasi,
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    fontWeight: 800,
                                                    color: pctColor(msReal),
                                                }}
                                            >
                                                {msReal}%
                                            </td>
                                            <td
                                                style={{
                                                    ...td,
                                                    fontWeight: 800,
                                                    color: pctColor(msAc),
                                                }}
                                            >
                                                {msAc}%
                                            </td>
                                        </tr>

                                        {open &&
                                            kota.rows.map((r, idx) => (
                                                <tr
                                                    key={`${kota.key}-${r.kecamatan}-${idx}`}
                                                    onClick={
                                                        onRowClick
                                                            ? (e) => {
                                                                  e.stopPropagation();
                                                                  onRowClick(r);
                                                              }
                                                            : undefined
                                                    }
                                                    title={
                                                        onRowClick
                                                            ? `Buka tab Jenjang: ${r.kecamatan}`
                                                            : undefined
                                                    }
                                                    style={{
                                                        background: "#fff",
                                                        cursor: onRowClick
                                                            ? "pointer"
                                                            : "default",
                                                    }}
                                                    className={
                                                        onRowClick
                                                            ? "table-row-hover"
                                                            : undefined
                                                    }
                                                >
                                                    <td
                                                        style={{
                                                            ...td,
                                                            textAlign: "left",
                                                            paddingLeft: 28,
                                                            fontWeight: 700,
                                                            color: onRowClick
                                                                ? "#1d4ed8"
                                                                : T.text,
                                                            textDecoration:
                                                                onRowClick
                                                                    ? "underline"
                                                                    : "none",
                                                            textUnderlineOffset: 2,
                                                        }}
                                                    >
                                                        {r.kecamatan}
                                                    </td>
                                                    <td style={td}>
                                                        {fmt(r.jumlah_siswa)}
                                                    </td>
                                                    <td style={td}>
                                                        {fmt(r.total_sekolah)}
                                                    </td>
                                                    <td style={td}>
                                                        {fmt(r.area_cover)}
                                                    </td>
                                                    <td style={td}>
                                                        {fmt(r.jumlah_salesman)}
                                                    </td>
                                                    <td style={td}>
                                                        {fmt(r.sekolah_realisasi)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...td,
                                                            color: T.blue,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {fmt(r.real_exemplar)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...td,
                                                            textAlign: "left",
                                                        }}
                                                    >
                                                        {renderGradeBadges(
                                                            r.grades_realisasi,
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...td,
                                                            fontWeight: 800,
                                                            color: pctColor(
                                                                sharePct(
                                                                    r.sekolah_realisasi,
                                                                    r.total_sekolah,
                                                                ),
                                                            ),
                                                        }}
                                                    >
                                                        {sharePct(
                                                            r.sekolah_realisasi,
                                                            r.total_sekolah,
                                                        )}
                                                        %
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...td,
                                                            fontWeight: 800,
                                                            color: pctColor(
                                                                sharePct(
                                                                    r.area_cover,
                                                                    r.total_sekolah,
                                                                ),
                                                            ),
                                                        }}
                                                    >
                                                        {sharePct(
                                                            r.area_cover,
                                                            r.total_sekolah,
                                                        )}
                                                        %
                                                    </td>
                                                </tr>
                                            ))}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div
                        style={{
                            padding: "8px 12px",
                            borderTop: `1px solid ${T.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ fontSize: 10.5, color: T.slate }}>
                            Halaman{" "}
                            <strong style={{ color: T.text }}>{safePage}</strong>{" "}
                            dari {totalPages}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setPage(safePage - 1)}
                                style={{
                                    minWidth: 32,
                                    height: 28,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    background: "#fff",
                                    cursor:
                                        safePage <= 1
                                            ? "not-allowed"
                                            : "pointer",
                                    color: safePage <= 1 ? "#94a3b8" : T.text,
                                    fontWeight: 600,
                                }}
                            >
                                ‹
                            </button>
                            {pageNumbers.map((item, idx) =>
                                item === "…" ? (
                                    <span
                                        key={`d-${idx}`}
                                        style={{
                                            minWidth: 24,
                                            textAlign: "center",
                                            color: T.slate,
                                        }}
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setPage(item)}
                                        style={{
                                            minWidth: 32,
                                            height: 28,
                                            border: `1px solid ${
                                                item === safePage
                                                    ? T.blue
                                                    : T.border
                                            }`,
                                            borderRadius: 6,
                                            background:
                                                item === safePage
                                                    ? "#eff6ff"
                                                    : "#fff",
                                            color:
                                                item === safePage
                                                    ? T.blue
                                                    : T.text,
                                            fontWeight:
                                                item === safePage ? 800 : 600,
                                            cursor: "pointer",
                                            fontSize: 11,
                                        }}
                                    >
                                        {item}
                                    </button>
                                ),
                            )}
                            <button
                                type="button"
                                disabled={safePage >= totalPages}
                                onClick={() => setPage(safePage + 1)}
                                style={{
                                    minWidth: 32,
                                    height: 28,
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    background: "#fff",
                                    cursor:
                                        safePage >= totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                    color:
                                        safePage >= totalPages
                                            ? "#94a3b8"
                                            : T.text,
                                    fontWeight: 600,
                                }}
                            >
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
