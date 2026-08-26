import React, { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { T, Card, stickyTableWrapStyle, stickyTableStyle } from "./SalesPerformanceShared";

const PAGE_SIZE = 50;

function fmt(n) {
    return new Intl.NumberFormat("id-ID").format(Number(n) || 0);
}

function growthColor(v) {
    if (v > 0) return "#16a34a";
    if (v < 0) return "#dc2626";
    return T.slate;
}

export default function ListCabangAreaTab({
    listCabangArea = [],
    areaId = null,
    tahun,
}) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ key: "real_curr", dir: "desc" });

    const yearCurr =
        Number(tahun) ||
        Number(listCabangArea?.[0]?.year_curr) ||
        new Date().getFullYear();
    const yearPrev =
        Number(listCabangArea?.[0]?.year_prev) || yearCurr - 1;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let rows = [...(listCabangArea || [])];
        if (q) {
            rows = rows.filter((r) =>
                String(r.name || "")
                    .toLowerCase()
                    .includes(q),
            );
        }
        const { key, dir } = sort;
        const mul = dir === "asc" ? 1 : -1;
        rows.sort((a, b) => {
            if (key === "name") {
                return (
                    String(a.name || "").localeCompare(String(b.name || ""), "id") *
                    mul
                );
            }
            const av = Number(a[key]) || 0;
            const bv = Number(b[key]) || 0;
            if (av === bv) {
                return String(a.name || "").localeCompare(String(b.name || ""), "id");
            }
            return (av - bv) * mul;
        });
        return rows;
    }, [listCabangArea, search, sort]);

    useEffect(() => {
        setPage(1);
    }, [search, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    const toggleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: key === "name" ? "asc" : "desc" },
        );
    };
    const mark = (key) =>
        sort.key === key ? (sort.dir === "asc" ? " ↑" : " ↓") : "";

    const TH_ROW1_H = 28;
    const th = {
        padding: "7px 8px",
        fontSize: 10,
        fontWeight: 700,
        color: T.slate,
        background: "#f8fafc",
        borderBottom: `1px solid ${T.border}`,
        borderRight: `1px solid ${T.border}`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        position: "sticky",
        top: 0,
        zIndex: 5,
    };
    const thRow2 = { ...th, top: TH_ROW1_H, zIndex: 4 };
    const td = {
        padding: "7px 8px",
        fontSize: 11.5,
        color: T.text,
        borderBottom: `1px solid #f1f5f9`,
        borderRight: `1px solid ${T.border}`,
        textAlign: "right",
    };

    return (
        <Card title="Daftar Cabang" noPad>
            <div
                style={{
                    padding: "8px 12px",
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <div style={{ fontSize: 10.5, color: T.slate }}>
                    {filtered.length} cabang · klik header untuk sort · klik
                    nama untuk buka dashboard cabang
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari cabang..."
                    style={{
                        minWidth: 180,
                        padding: "5px 8px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 6,
                        fontSize: 11,
                        background: "#f8fafc",
                        outline: "none",
                    }}
                />
            </div>
            <div style={stickyTableWrapStyle}>
                <table
                    style={{
                        ...stickyTableStyle,
                        minWidth: 980,
                    }}
                >
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{ ...th, width: 40 }}>
                                No
                            </th>
                            <th
                                rowSpan={2}
                                onClick={() => toggleSort("name")}
                                style={{ ...th, textAlign: "left", minWidth: 140 }}
                            >
                                Cabang{mark("name")}
                            </th>
                            <th
                                rowSpan={2}
                                onClick={() => toggleSort("total_sekolah")}
                                style={th}
                            >
                                Total Sekolah{mark("total_sekolah")}
                            </th>
                            <th
                                rowSpan={2}
                                onClick={() => toggleSort("area_cover")}
                                style={th}
                            >
                                Total AC{mark("area_cover")}
                            </th>
                            <th colSpan={3} style={{ ...th, background: "#f1f5f9" }}>
                                {yearPrev}
                            </th>
                            <th colSpan={3} style={{ ...th, background: "#eff6ff", color: T.blue }}>
                                {yearCurr}
                            </th>
                            <th
                                rowSpan={2}
                                onClick={() => toggleSort("growth_real_pct")}
                                style={{ ...th, borderRight: "none" }}
                            >
                                Growth Real %{mark("growth_real_pct")}
                            </th>
                        </tr>
                        <tr>
                            <th
                                onClick={() => toggleSort("potensi_prev")}
                                style={thRow2}
                            >
                                Potensi{mark("potensi_prev")}
                            </th>
                            <th onClick={() => toggleSort("sp_prev")} style={thRow2}>
                                SP{mark("sp_prev")}
                            </th>
                            <th onClick={() => toggleSort("real_prev")} style={thRow2}>
                                Real{mark("real_prev")}
                            </th>
                            <th
                                onClick={() => toggleSort("potensi_curr")}
                                style={{ ...thRow2, background: "#eff6ff" }}
                            >
                                Potensi{mark("potensi_curr")}
                            </th>
                            <th
                                onClick={() => toggleSort("sp_curr")}
                                style={{ ...thRow2, background: "#eff6ff" }}
                            >
                                SP{mark("sp_curr")}
                            </th>
                            <th
                                onClick={() => toggleSort("real_curr")}
                                style={{ ...thRow2, background: "#eff6ff" }}
                            >
                                Real{mark("real_curr")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={11}
                                    style={{
                                        ...td,
                                        textAlign: "center",
                                        borderRight: "none",
                                        padding: 20,
                                        color: T.slate,
                                    }}
                                >
                                    Tidak ada data
                                </td>
                            </tr>
                        )}
                        {pageRows.map((r, i) => (
                            <tr key={r.id || i}>
                                <td style={{ ...td, textAlign: "center" }}>
                                    {start + i + 1}
                                </td>
                                <td
                                    style={{
                                        ...td,
                                        textAlign: "left",
                                        fontWeight: 700,
                                        color: T.blue,
                                        cursor: areaId ? "pointer" : "default",
                                    }}
                                    onClick={() => {
                                        if (!areaId || !r.id) return;
                                        router.get(
                                            route("monitoring.area", {
                                                id: areaId,
                                                cabang: r.id,
                                            }),
                                        );
                                    }}
                                >
                                    {r.name}
                                </td>
                                <td style={td}>{fmt(r.total_sekolah)}</td>
                                <td style={td}>{fmt(r.area_cover)}</td>
                                <td style={td}>{fmt(r.potensi_prev)}</td>
                                <td style={td}>{fmt(r.sp_prev)}</td>
                                <td style={{ ...td, fontWeight: 700 }}>
                                    {fmt(r.real_prev)}
                                </td>
                                <td style={td}>{fmt(r.potensi_curr)}</td>
                                <td style={td}>{fmt(r.sp_curr)}</td>
                                <td
                                    style={{
                                        ...td,
                                        fontWeight: 800,
                                        color: T.blue,
                                    }}
                                >
                                    {fmt(r.real_curr)}
                                </td>
                                <td
                                    style={{
                                        ...td,
                                        borderRight: "none",
                                        fontWeight: 800,
                                        color: growthColor(r.growth_real_pct),
                                    }}
                                >
                                    {r.growth_real_pct > 0 ? "+" : ""}
                                    {r.growth_real_pct}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div
                    style={{
                        padding: "8px 12px",
                        borderTop: `1px solid ${T.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <div style={{ fontSize: 10.5, color: T.slate }}>
                        Halaman {safePage} / {totalPages}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setPage(safePage - 1)}
                            style={{
                                minWidth: 32,
                                height: 28,
                                borderRadius: 6,
                                border: `1px solid ${T.border}`,
                                background: "#fff",
                                cursor: safePage <= 1 ? "not-allowed" : "pointer",
                            }}
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            disabled={safePage >= totalPages}
                            onClick={() => setPage(safePage + 1)}
                            style={{
                                minWidth: 32,
                                height: 28,
                                borderRadius: 6,
                                border: `1px solid ${T.border}`,
                                background: "#fff",
                                cursor:
                                    safePage >= totalPages
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
}
