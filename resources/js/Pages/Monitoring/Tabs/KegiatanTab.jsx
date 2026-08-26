import React, { useState, useEffect, useMemo } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds, PrioritySchoolsCard
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import VisitActivityCharts from "./VisitActivityCharts";

function getPageNumbers(current, last) {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }
    if (current <= 4) {
        return [1, 2, 3, 4, 5, "...", last];
    }
    if (current >= last - 3) {
        return [1, "...", last - 4, last - 3, last - 2, last - 1, last];
    }
    return [1, "...", current - 1, current, current + 1, "...", last];
}

function NumberedPagination({ current, last, onPage }) {
    if (last <= 1) return null;
    const pages = getPageNumbers(current, last);
    const btnBase = {
        padding: "4px 10px",
        fontSize: 12,
        borderRadius: 6,
        minWidth: 32,
        textAlign: "center",
    };

    return (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <button
                type="button"
                onClick={() => onPage(current - 1)}
                disabled={current === 1}
                style={{
                    ...btnBase,
                    border: `1px solid ${T.border}`,
                    background: "white",
                    color: current === 1 ? "#cbd5e1" : T.text,
                    cursor: current === 1 ? "not-allowed" : "pointer",
                }}
            >
                ‹
            </button>
            {pages.map((p, idx) => (
                <button
                    key={`${p}-${idx}`}
                    type="button"
                    onClick={() => p !== "..." && onPage(p)}
                    disabled={p === "..."}
                    style={{
                        ...btnBase,
                        border:
                            p === "..."
                                ? "none"
                                : `1px solid ${p === current ? T.blue : T.border}`,
                        background: p === current ? T.blue : "white",
                        color: p === current ? "white" : T.text,
                        cursor: p === "..." ? "default" : "pointer",
                        fontWeight: p === current ? 700 : 400,
                    }}
                >
                    {p}
                </button>
            ))}
            <button
                type="button"
                onClick={() => onPage(current + 1)}
                disabled={current === last}
                style={{
                    ...btnBase,
                    border: `1px solid ${T.border}`,
                    background: "white",
                    color: current === last ? "#cbd5e1" : T.text,
                    cursor: current === last ? "not-allowed" : "pointer",
                }}
            >
                ›
            </button>
        </div>
    );
}

export default function KegiatanTab(props) {

    const {
        activityBreakdown, resultBreakdown, insights, filterOptions, filters, isFromSalesPerformance, salesPerformanceFilterOptions, salesPerformanceFilters, nonCoverSchools,
        activeNav, pageTitle, cabangName, areaName, description, areas, cabangs, selectedCabang, provinceCode, cabangCode,
        realStats, trl, trlJenjang, salesPerformance, rankingKecamatan, top10Schools, mapMarkers, schools, dana, jenjang, trend, areaCovers, competitors, leaderboard, salesJenjangData, salesJenjangTotal, uncovered, uncoveredDana, hideFilters, backUrl, isSalesDetail, timSalesPerformance, timSalesPerformanceWorst, listKecamatan, listSekolah, kegiatanSales, visitCoverage, rencanaJualCoverage, jenjangBreakdown, sumberDanaBreakdown, segmenBreakdown, siswaBreakdown,
        activeTab, setActiveTab,
        spFilterData, setSpFilterData,
        isFilterOpen, setIsFilterOpen,
        kpiData,
        showScoreInfo, setShowScoreInfo,
        sekolahPage, setSekolahPage,
        handleSpAreaChange, applySpFilter,
        sekolahPerPage,
        kegiatanAktivitasFilter, setKegiatanAktivitasFilter,
        openKegiatanFromChart,
    } = props;

    const [kegiatanPage, setKegiatanPage] = useState(1);
    const [sekolahAktPage, setSekolahAktPage] = useState(1);
    const [sekolahAktSort, setSekolahAktSort] = useState({
        key: "kecamatan",
        dir: "asc",
    });
    const kegiatanPerPage = 10;
    const sekolahAktPerPage = 10;
    const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(num);

    const yearCurr =
        Number(insights?.targetYear) ||
        Number(filters?.tahun) ||
        new Date().getFullYear();
    const yearPrev = yearCurr - 1;

    useEffect(() => {
        setKegiatanPage(1);
        setSekolahAktPage(1);
    }, [kegiatanAktivitasFilter]);

    useEffect(() => {
        setSekolahAktPage(1);
    }, [sekolahAktSort]);

    const toggleSekolahAktSort = (key) => {
        setSekolahAktSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : {
                      key,
                      dir:
                          key === "name" || key === "kecamatan"
                              ? "asc"
                              : "desc",
                  },
        );
    };

    const sortMark = (key) => {
        if (sekolahAktSort.key !== key) return "";
        return sekolahAktSort.dir === "asc" ? " ↑" : " ↓";
    };

    const sortableTh = (label, key, align = "right") => (
        <th
            onClick={() => toggleSekolahAktSort(key)}
            title="Klik untuk sortir"
            style={{
                ...S.th,
                textAlign: align,
                cursor: "pointer",
                userSelect: "none",
                color: sekolahAktSort.key === key ? T.blue : T.slate,
            }}
        >
            {label}
            {sortMark(key)}
        </th>
    );

    const parseKegiatanDate = (raw) => {
        if (!raw) return 0;
        const s = String(raw).trim();
        try {
            if (s.includes("-")) {
                const d = new Date(s);
                return Number.isNaN(d.getTime()) ? 0 : d.getTime();
            }
            const parts = s.split("/");
            if (parts.length === 3) {
                const [a, b, c] = parts.map((p) => parseInt(p, 10));
                const dayFirst = a > 12 ? true : a <= 12 && b > 12 ? false : true;
                const d = dayFirst
                    ? new Date(c, b - 1, a)
                    : new Date(c, a - 1, b);
                return Number.isNaN(d.getTime()) ? 0 : d.getTime();
            }
            const d = new Date(s);
            return Number.isNaN(d.getTime()) ? 0 : d.getTime();
        } catch {
            return 0;
        }
    };

    const filteredKegiatan = (kegiatanSales || [])
        .filter((k) => {
            if (!kegiatanAktivitasFilter) return true;
            const akt = String(k.aktivitas || "").trim() || "Tidak Diketahui";
            return (
                akt.toLowerCase() ===
                String(kegiatanAktivitasFilter).trim().toLowerCase()
            );
        })
        .slice()
        .sort(
            (a, b) =>
                parseKegiatanDate(b.tanggal) - parseKegiatanDate(a.tanggal),
        );

    const normalizeSchoolName = (name) =>
        String(name || "")
            .toUpperCase()
            .replace(/\s+/g, " ")
            .trim();

    const sekolahAktivitasRows = useMemo(() => {
        // Basis baris = Area Cover (is_active), bukan hanya sekolah yang punya kegiatan
        const acSchools = (listSekolah || []).filter((s) => !!s.is_active);
        const rowsById = {};
        const nameToId = {};

        acSchools.forEach((s) => {
            rowsById[s.id] = {
                customer_id: s.id,
                name: s.name || "-",
                kecamatan: s.kecamatan_name || "-",
                jenjang: s.jenjang || "-",
                total_siswa: Number(s.total_student) || 0,
                is_active: 1,
                activities: {},
                total_akt: 0,
                real_prev: Number(s.real_exemplar_previous) || 0,
                real_curr: Number(s.real_exemplar_current) || 0,
            };
            const n = normalizeSchoolName(s.name);
            if (n && nameToId[n] == null) nameToId[n] = s.id;
        });

        (kegiatanSales || []).forEach((k) => {
            let schoolId = null;
            const cid = k.customer_id;
            if (cid && rowsById[cid]) {
                schoolId = cid;
            } else {
                const n = normalizeSchoolName(k.customer_name);
                if (n && nameToId[n] != null) schoolId = nameToId[n];
            }
            if (!schoolId) return;

            const akt =
                String(k.aktivitas || "").trim() || "Tidak Diketahui";
            rowsById[schoolId].activities[akt] =
                (rowsById[schoolId].activities[akt] || 0) + 1;
            rowsById[schoolId].total_akt += 1;
        });

        return Object.values(rowsById)
            .map((row) => {
                const activityList = Object.entries(row.activities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([label, count]) => ({ label, count }));
                return {
                    ...row,
                    activityList,
                    activity_summary: activityList
                        .map((a) => `${a.label}: ${a.count}`)
                        .join(", "),
                };
            });
    }, [kegiatanSales, listSekolah]);

    const filteredSekolahAktivitasRows = useMemo(() => {
        const filterAkt = String(kegiatanAktivitasFilter || "")
            .trim()
            .toLowerCase();
        let rows = sekolahAktivitasRows;
        if (filterAkt) {
            rows = rows.filter((row) =>
                (row.activityList || []).some(
                    (a) =>
                        String(a.label || "")
                            .trim()
                            .toLowerCase() === filterAkt,
                ),
            );
        }

        const dir = sekolahAktSort.dir === "asc" ? 1 : -1;
        const key = sekolahAktSort.key;
        const sorted = [...rows].sort((a, b) => {
            if (key === "name") {
                return (
                    String(a.name || "").localeCompare(
                        String(b.name || ""),
                        "id",
                        { sensitivity: "base" },
                    ) * dir
                );
            }
            if (key === "kecamatan") {
                const kecA = String(a.kecamatan || "")
                    .split(",")[0]
                    .trim()
                    .toUpperCase();
                const kecB = String(b.kecamatan || "")
                    .split(",")[0]
                    .trim()
                    .toUpperCase();
                if (kecA !== kecB) {
                    return kecA.localeCompare(kecB, "id") * dir;
                }
                return String(a.name || "").localeCompare(
                    String(b.name || ""),
                    "id",
                );
            }
            if (key === "aktivitas") {
                const av = Number(a.total_akt) || 0;
                const bv = Number(b.total_akt) || 0;
                if (av !== bv) return (av - bv) * dir;
                return String(a.activity_summary || "").localeCompare(
                    String(b.activity_summary || ""),
                    "id",
                );
            }
            const av = Number(a[key]) || 0;
            const bv = Number(b[key]) || 0;
            if (av === bv) {
                return String(a.name || "").localeCompare(
                    String(b.name || ""),
                    "id",
                );
            }
            return (av - bv) * dir;
        });
        return sorted;
    }, [sekolahAktivitasRows, kegiatanAktivitasFilter, sekolahAktSort]);

    const sekolahAktTotalPages = Math.max(
        1,
        Math.ceil(filteredSekolahAktivitasRows.length / sekolahAktPerPage),
    );
    const kegiatanTotalPages = Math.max(
        1,
        Math.ceil(filteredKegiatan.length / kegiatanPerPage),
    );

    return (
        <>
                {activeTab === "kegiatan" && isSalesDetail && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <VisitActivityCharts
                            kpiData={kpiData}
                            insights={insights}
                            openKegiatanFromChart={openKegiatanFromChart}
                            resultBreakdown={resultBreakdown}
                            listSekolah={listSekolah}
                            kegiatanSales={kegiatanSales}
                            activeAktivitasFilter={kegiatanAktivitasFilter}
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            <Card
                                title={`Sekolah & Aktivitas · Realisasi ${yearPrev}–${yearCurr}`}
                                style={{ flex: 1, minWidth: 300 }}
                                noPad
                            >
                                <div
                                    id="sekolah-aktivitas-table"
                                    style={{
                                        padding: "8px 16px",
                                        borderBottom: `1px solid ${T.border}`,
                                        fontSize: 11,
                                        color: T.slate,
                                        background: "#f8fafc",
                                    }}
                                >
                                    Ringkasan Area Cover + aktivitas &
                                    realisasi eksemplar 2 tahun ({yearPrev} &{" "}
                                    {yearCurr}). Total:{" "}
                                    <strong style={{ color: T.text }}>
                                        {filteredSekolahAktivitasRows.length}
                                    </strong>
                                    {kegiatanAktivitasFilter
                                        ? ` sekolah dengan aktivitas ${kegiatanAktivitasFilter}`
                                        : " sekolah Area Cover"}
                                    {" · "}
                                    <span style={{ color: "#94a3b8" }}>
                                        Klik header kolom untuk sortir
                                    </span>
                                </div>
                                {kegiatanAktivitasFilter && (
                                    <div
                                                style={{
                                            padding: "8px 16px",
                                            borderBottom: `1px solid ${T.border}`,
                                            background: "#eff6ff",
                                                    display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <span
                                                    style={{
                                                fontSize: 11,
                                                color: "#1e40af",
                                                fontWeight: 600,
                                            }}
                                        >
                                            Filter aktivitas:{" "}
                                            <strong>
                                                {kegiatanAktivitasFilter}
                                            </strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setKegiatanAktivitasFilter?.(
                                                    "",
                                                )
                                            }
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#1d4ed8",
                                                background: "white",
                                                border: "1px solid #bfdbfe",
                                                borderRadius: 6,
                                                padding: "2px 8px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Hapus filter
                                        </button>
                                    </div>
                                )}
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
                                                        width: 40,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    No
                                                </th>
                                                {sortableTh(
                                                    "Nama Sekolah",
                                                    "name",
                                                    "left",
                                                )}
                                                {sortableTh("Siswa", "total_siswa")}
                                                {sortableTh(
                                                    "Aktivitas",
                                                    "aktivitas",
                                                    "left",
                                                )}
                                                {sortableTh(
                                                    "Total Akt.",
                                                    "total_akt",
                                                    "center",
                                                )}
                                                {sortableTh(
                                                    `Realisasi ${yearPrev}`,
                                                    "real_prev",
                                                )}
                                                {sortableTh(
                                                    `Realisasi ${yearCurr}`,
                                                    "real_curr",
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                if (
                                                    filteredSekolahAktivitasRows.length ===
                                                    0
                                                ) {
                                                    return (
                                                        <tr>
                                                            <td
                                                                colSpan="7"
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "center",
                                                        color: T.slate,
                                                                    padding:
                                                                        "20px 0",
                                                                }}
                                                            >
                                                                {kegiatanAktivitasFilter
                                                                    ? `Tidak ada sekolah Area Cover dengan aktivitas ${kegiatanAktivitasFilter}`
                                                                    : "Tidak ada sekolah Area Cover"}
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                const pageItems =
                                                    filteredSekolahAktivitasRows.slice(
                                                        (sekolahAktPage - 1) *
                                                            sekolahAktPerPage,
                                                        sekolahAktPage *
                                                            sekolahAktPerPage,
                                                    );

                                                const jenjangOrder = {
                                                    SD: 1,
                                                    SMP: 2,
                                                    SMA: 3,
                                                    SMK: 4,
                                                    DLL: 5,
                                                    Lainnya: 6,
                                                };

                                                const byKecamatan = {};
                                                pageItems.forEach((row) => {
                                                    const raw =
                                                        String(
                                                            row.kecamatan || "",
                                                        ).trim() ||
                                                        "Tanpa Kecamatan";
                                                    const parts = raw
                                                        .split(",")
                                                        .map((p) => p.trim())
                                                        .filter(Boolean);
                                                    const kecKey = (
                                                        parts[0] || raw
                                                    ).toUpperCase();
                                                    const kotaKab =
                                                        parts.length > 1
                                                            ? parts
                                                                  .slice(1)
                                                                  .join(", ")
                                                                  .toUpperCase()
                                                            : null;
                                                    const j =
                                                        row.jenjang ||
                                                        "Lainnya";

                                                    if (!byKecamatan[kecKey]) {
                                                        byKecamatan[kecKey] = {
                                                            label: kecKey,
                                                            kotaKab,
                                                            jenjang: {},
                                                        };
                                                    }
                                                    if (
                                                        kotaKab &&
                                                        !byKecamatan[kecKey]
                                                            .kotaKab
                                                    ) {
                                                        byKecamatan[
                                                            kecKey
                                                        ].kotaKab = kotaKab;
                                                    }
                                                    if (
                                                        !byKecamatan[kecKey]
                                                            .jenjang[j]
                                                    ) {
                                                        byKecamatan[
                                                            kecKey
                                                        ].jenjang[j] = [];
                                                    }
                                                    byKecamatan[kecKey].jenjang[
                                                        j
                                                    ].push(row);
                                                });

                                                const sortedKec = Object.keys(
                                                    byKecamatan,
                                                ).sort((a, b) =>
                                                    a.localeCompare(b, "id", {
                                                        sensitivity: "base",
                                                    }),
                                                );

                                                let globalIndex =
                                                    (sekolahAktPage - 1) *
                                                    sekolahAktPerPage;

                                                return sortedKec.map(
                                                    (kecKey) => {
                                                        const kec =
                                                            byKecamatan[
                                                                kecKey
                                                            ];
                                                        const jenjangKeys =
                                                            Object.keys(
                                                                kec.jenjang,
                                                            ).sort(
                                                                (a, b) =>
                                                                    (jenjangOrder[
                                                                        a
                                                                    ] || 99) -
                                                                    (jenjangOrder[
                                                                        b
                                                                    ] || 99),
                                                            );
                                                        const displayKec =
                                                            kec.kotaKab
                                                                ? `${kec.label}, ${kec.kotaKab}`
                                                                : kec.label;
                                                        const allKecSchools =
                                                            jenjangKeys.flatMap(
                                                                (jk) =>
                                                                    kec.jenjang[
                                                                        jk
                                                                    ],
                                                            );
                                                        const kecTotal = {
                                                            count: allKecSchools.length,
                                                            siswa: allKecSchools.reduce(
                                                                (a, r) =>
                                                                    a +
                                                                    (Number(
                                                                        r.total_siswa,
                                                                    ) || 0),
                                                                0,
                                                            ),
                                                            akt: allKecSchools.reduce(
                                                                (a, r) =>
                                                                    a +
                                                                    (Number(
                                                                        r.total_akt,
                                                                    ) || 0),
                                                                0,
                                                            ),
                                                            realPrev:
                                                                allKecSchools.reduce(
                                                                    (a, r) =>
                                                                        a +
                                                                        (Number(
                                                                            r.real_prev,
                                                                        ) || 0),
                                                                    0,
                                                                ),
                                                            realCurr:
                                                                allKecSchools.reduce(
                                                                    (a, r) =>
                                                                        a +
                                                                        (Number(
                                                                            r.real_curr,
                                                                        ) || 0),
                                                                    0,
                                                                ),
                                                        };

                                                        return (
                                                            <React.Fragment
                                                                key={kecKey}
                                                            >
                                                                <tr>
                                                                    <td
                                                                        colSpan="2"
                                                        style={{
                                                                            ...S.td,
                                                                            fontWeight: 800,
                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                            color: "#1e40af",
                                                                            textAlign:
                                                                                "left",
                                                                        }}
                                                                    >
                                                                        Kecamatan:{" "}
                                                                        {
                                                                            displayKec
                                                                        }
                                                                        <span
                                                                            style={{
                                                                                marginLeft: 8,
                                                                                fontWeight: 600,
                                                                                fontSize: 11,
                                                                                color: "#1d4ed8",
                                                                            }}
                                                                        >
                                                                            (
                                                                            {
                                                                                kecTotal.count
                                                                            }{" "}
                                                                            sekolah)
                                                                        </span>
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: 800,
                                                                            color: "#1e40af",
                                                                        }}
                                                                    >
                                                                        {formatNumber(
                                                                            kecTotal.siswa,
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                        }}
                                                                    />
                                                                    <td
                                                    style={{
                                                                            ...S.td,
                                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                            textAlign:
                                                                                "center",
                                                                            fontWeight: 800,
                                                                            color: "#1e40af",
                                                                        }}
                                                                    >
                                                                        {
                                                                            kecTotal.akt
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: 800,
                                                                            color: "#1e40af",
                                                                        }}
                                                                    >
                                                                        {formatNumber(
                                                                            kecTotal.realPrev,
                                                                        )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            backgroundColor:
                                                                                "#dbeafe",
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: 800,
                                                                            color: "#1e40af",
                                                                        }}
                                                                    >
                                                                        {formatNumber(
                                                                            kecTotal.realCurr,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                                {allKecSchools.map(
                                                                    (row, idx) => {
                                                                        globalIndex++;
                                                                        return (
                                                                            <tr
                                                                                key={
                                                                                    row.customer_id ||
                                                                                    `${kecKey}-${idx}`
                                                                                }
                                                                                className="table-row-hover"
                                                                            >
                                                                                <td
                                                                                    style={{
                                                                                        ...S.td,
                                                                                        textAlign:
                                                                                            "center",
                                                                                        color: T.slate,
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        globalIndex
                                                                                    }
                                                                                </td>
                                                                                <td
                                                                                    style={{
                                                                                        ...S.td,
                                                        fontWeight: 700,
                                                                                        paddingLeft: 20,
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        row.name
                                                                                    }
                                                                                    {row.is_active ? (
                                                                                        <span
                                                                                            style={{
                                                                                                marginLeft: 6,
                                                                                                fontSize: 9,
                                                                                                fontWeight: 700,
                                                                                                color: "#059669",
                                                                                                background:
                                                                                                    "#ecfdf5",
                                                                                                border: "1px solid #a7f3d0",
                                                                                                borderRadius: 4,
                                                                                                padding:
                                                                                                    "1px 5px",
                                                                                            }}
                                                                                        >
                                                                                            AC
                                                                                        </span>
                                                                                    ) : null}
                                                                                </td>
                                                                                <td
                                    style={{
                                                                                        ...S.td,
                                                                                        textAlign:
                                                                                            "right",
                                                                                        fontWeight: 600,
                                                                                    }}
                                                                                >
                                                                                    {formatNumber(
                                                                                        row.total_siswa ||
                                                                                            0,
                                                                                    )}
                                                                                </td>
                                                                                <td
                                                style={{
                                                                                        ...S.td,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            flexWrap:
                                                                                                "wrap",
                                                                                            gap: 4,
                                                                                        }}
                                                                                    >
                                                                                        {row
                                                                                            .activityList
                                                                                            .length ===
                                                                                        0 ? (
                                                                                            <span
                                                                                                style={{
                                                        color: T.slate,
                                                                                                    fontSize: 11,
                                                                                                }}
                                                                                            >
                                                                                                —
                                                                                            </span>
                                                                                        ) : (
                                                                                            row.activityList.map(
                                                                                                (
                                                                                                    a,
                                                                                                ) => (
                                                                                                    <span
                                                                                                        key={
                                                                                                            a.label
                                                                                                        }
                                                        style={{
                                                                                                            display:
                                                                                                                "inline-flex",
                                                                                                            alignItems:
                                                                                                                "center",
                                                                                                            gap: 4,
                                                                                                            fontSize: 10,
                                                                                                            fontWeight: 600,
                                                                                                            color: "#334155",
                                                                                                            background:
                                                                                                                "#f1f5f9",
                                                                                                            border: `1px solid ${T.border}`,
                                                                                                            borderRadius: 99,
                                                                                                            padding:
                                                                                                                "2px 8px",
                                                                                                        }}
                                                                                                    >
                                                                                                        {
                                                                                                            a.label
                                                                                                        }
                                                                                                        <strong
                                                    style={{
                                                                                                                color: T.blue,
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                a.count
                                                                                                            }
                                                                                                        </strong>
                                                                                                    </span>
                                                                                                ),
                                                                                            )
                                                                                        )}
                                                </div>
                                                                                </td>
                                                                                <td
                                                                                    style={{
                                                                                        ...S.td,
                                                                                        textAlign:
                                                                                            "center",
                                                                                        fontWeight: 800,
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        row.total_akt
                                                                                    }
                                                                                </td>
                                                                                <td
                                    style={{
                                                                                        ...S.td,
                                                                                        textAlign:
                                                                                            "right",
                                                                                        fontWeight: 700,
                                                                                        color:
                                                                                            row.real_prev >
                                                                                            0
                                                                                                ? T.text
                                                                                                : T.slate,
                                                                                    }}
                                                                                >
                                                                                    {formatNumber(
                                                                                        row.real_prev,
                                                                                    )}
                                                                                </td>
                                                                                <td
                                                style={{
                                                                                        ...S.td,
                                                                                        textAlign:
                                                                                            "right",
                                                                                        fontWeight: 700,
                                                                                        color:
                                                                                            row.real_curr >
                                                                                            0
                                                                                                ? "#059669"
                                                                                                : T.slate,
                                                                                    }}
                                                                                >
                                                                                    {formatNumber(
                                                                                        row.real_curr,
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    },
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    },
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredSekolahAktivitasRows.length >
                                    sekolahAktPerPage && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                            justifyContent: "space-between",
                                                        alignItems: "center",
                                            padding: "10px 16px",
                                            borderTop: `1px solid ${T.border}`,
                                            gap: 10,
                                            flexWrap: "wrap",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                fontSize: 11,
                                                color: T.slate,
                                            }}
                                        >
                                            {(sekolahAktPage - 1) *
                                                sekolahAktPerPage +
                                                1}
                                            –
                                            {Math.min(
                                                sekolahAktPage *
                                                    sekolahAktPerPage,
                                                filteredSekolahAktivitasRows.length,
                                            )}{" "}
                                            dari {filteredSekolahAktivitasRows.length}
                                                </div>
                                                <div
                                                    style={{
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            <NumberedPagination
                                                current={sekolahAktPage}
                                                last={sekolahAktTotalPages}
                                                onPage={setSekolahAktPage}
                                            />
                                                </div>
                                            </div>
                                )}
                            </Card>
                        </div>

                        <PrioritySchoolsCard
                            schools={kpiData?.prioritySchools || []}
                            year={kpiData?.year || yearCurr}
                            showAktivitas
                            kegiatanSales={kegiatanSales}
                        />

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            <Card
                                title="Riwayat Kegiatan Sales"
                                style={{ flex: 1, minWidth: 300 }}
                                noPad
                            >
                                {kegiatanAktivitasFilter && (
                                    <div
                                        style={{
                                            padding: "10px 16px",
                                            borderBottom: `1px solid ${T.border}`,
                                            background: "#f0fdf4",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 6,
                                                padding: "4px 10px",
                                                borderRadius: 99,
                                                background: "#ecfdf5",
                                                border: "1px solid #a7f3d0",
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#047857",
                                            }}
                                        >
                                            <i className="bi bi-funnel-fill" style={{ fontSize: 10 }} />
                                            Aktivitas: {kegiatanAktivitasFilter}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setKegiatanAktivitasFilter?.("");
                                                    setKegiatanPage(1);
                                                }}
                                                style={{
                                                    border: "none",
                                                    background: "transparent",
                                                    color: "#047857",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    fontSize: 14,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ×
                                            </button>
                                        </span>
                                        <span style={{ fontSize: 11, color: T.slate }}>
                                            {filteredKegiatan.length} kegiatan
                                        </span>
                                    </div>
                                )}
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
                                                        width: 40,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    No
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Tanggal
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Customer
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Aktivitas
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Hasil
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Real. Lalu
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Renc. Jual
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredKegiatan &&
                                            filteredKegiatan.length > 0 ? (
                                                filteredKegiatan
                                                    .slice(
                                                        (kegiatanPage - 1) *
                                                            kegiatanPerPage,
                                                        kegiatanPage *
                                                            kegiatanPerPage,
                                                    )
                                                    .map((k, i) => (
                                                        <tr
                                                            key={i}
                                                            className="table-row-hover"
                                                        >
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "center",
                                                                    color: T.slate,
                                                                }}
                                                            >
                                                                {(kegiatanPage -
                                                                    1) *
                                                                    kegiatanPerPage +
                                                                    i +
                                                                    1}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {k.tanggal ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {k.customer_name ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                }}
                                                            >
                                                                {k.aktivitas ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    color: T.blue,
                                                                }}
                                                            >
                                                                {k.hasil || "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    k.real_lalu ||
                                                                        0,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    k.rencana_jual ||
                                                                        0,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="7"
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "center",
                                                            color: T.slate,
                                                            padding: "20px 0",
                                                        }}
                                                    >
                                                        Tidak ada data kegiatan
                                                        sales
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                {filteredKegiatan &&
                                    filteredKegiatan.length > kegiatanPerPage && (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "12px 16px",
                                                borderTop: `1px solid ${T.border}`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: T.slate,
                                                }}
                                            >
                                                Menampilkan{" "}
                                                {(kegiatanPage - 1) *
                                                    kegiatanPerPage +
                                                    1}{" "}
                                                -{" "}
                                                {Math.min(
                                                    kegiatanPage *
                                                        kegiatanPerPage,
                                                    filteredKegiatan.length,
                                                )}{" "}
                                                dari {filteredKegiatan.length}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                }}
                                            >
                                                <NumberedPagination
                                                    current={kegiatanPage}
                                                    last={kegiatanTotalPages}
                                                    onPage={setKegiatanPage}
                                                />
                                            </div>
                                        </div>
                                    )}
                            </Card>
                        </div>
                    </div>
        )}
        </>
    );
}
