import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds,
    stickyTableWrapStyle, stickyTableStyle,
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";

export default function NonAreaCoverTab(props) {

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
        sekolahSearch, setSekolahSearch,
        sekolahJenjang, setSekolahJenjang,
        sekolahStatus, setSekolahStatus,
        sekolahGrade, setSekolahGrade,
        sekolahSort, setSekolahSort,
        sekolahChartFilter,
        clearSekolahChartFilter,
        filteredListSekolah,
        showSalesColumn = true,
        sekolahTitle = "Non Area Cover",
        hideStatusFilter = true,
    } = props;

    const colCount = showSalesColumn ? 10 : 9;
    const nameGroupColSpan = showSalesColumn ? 3 : 2;
    const formatNumber = (num) =>
        new Intl.NumberFormat("id-ID").format(num || 0);

    const isAreaCoverSchool = (s) => {
        const v = s?.is_active;
        return v === true || v === 1 || v === "1";
    };

    const gradeColors = {
        "A+": "#7c3aed",
        A: "#059669",
        B: "#2563eb",
        C: "#d97706",
        D: "#e11d48",
    };

    const renderGradeBadge = (grade) => {
        const g = String(grade || "").trim() || "-";
        const color = gradeColors[g] || "#64748b";
        return (
            <span
                style={{
                    display: "inline-block",
                    minWidth: 28,
                    padding: "2px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    textAlign: "center",
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}44`,
                }}
            >
                {g}
            </span>
        );
    };

    return (
        <>
                {activeTab === "sekolah" && isSalesDetail && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title={sekolahTitle}
                            style={{ flex: 1, minWidth: 300 }}
                            noPad
                        >
                            {/* Filter Bar */}
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderBottom: `1px solid ${T.border}`,
                                    display: "flex",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    backgroundColor: "#f8fafc",
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Cari nama sekolah / kecamatan / sales..."
                                    value={sekolahSearch}
                                    onChange={(e) =>
                                        setSekolahSearch(e.target.value)
                                    }
                                    style={{
                                        flex: 1,
                                        minWidth: 200,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${T.border}`,
                                        outline: "none",
                                    }}
                                />
                                <select
                                    value={sekolahJenjang}
                                    onChange={(e) =>
                                        setSekolahJenjang(e.target.value)
                                    }
                                    style={{
                                        width: 120,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${T.border}`,
                                        outline: "none",
                                    }}
                                >
                                    <option value="">Semua Jenjang</option>
                                    <option value="SD">SD</option>
                                    <option value="MI">MI</option>
                                    <option value="SMP">SMP</option>
                                    <option value="MTS">MTS</option>
                                    <option value="SMA">SMA</option>
                                    <option value="MA">MA</option>
                                    <option value="SMK">SMK</option>
                                    <option value="DLL">DLL</option>
                                </select>
                                {!hideStatusFilter && (
                                <select
                                    value={sekolahStatus}
                                    onChange={(e) =>
                                        setSekolahStatus(e.target.value)
                                    }
                                    title="Filter status Area Cover"
                                    style={{
                                        minWidth: 160,
                                        width: 170,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${
                                            sekolahStatus !== ""
                                                ? "#93c5fd"
                                                : T.border
                                        }`,
                                        background:
                                            sekolahStatus !== ""
                                                ? "#eff6ff"
                                                : "#fff",
                                        outline: "none",
                                        fontWeight:
                                            sekolahStatus !== "" ? 700 : 500,
                                        color:
                                            sekolahStatus !== ""
                                                ? "#1d4ed8"
                                                : T.slate,
                                    }}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="1">Area Cover</option>
                                    <option value="0">Non Area Cover</option>
                                </select>
                                )}
                                <select
                                    value={sekolahGrade || ""}
                                    onChange={(e) =>
                                        setSekolahGrade?.(e.target.value)
                                    }
                                    style={{
                                        width: 120,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${T.border}`,
                                        outline: "none",
                                    }}
                                >
                                    <option value="">Semua Grade</option>
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                                {sekolahChartFilter && (
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "5px 10px",
                                            borderRadius: 99,
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#1d4ed8",
                                        }}
                                    >
                                        <i className="bi bi-funnel-fill" style={{ fontSize: 10 }} />
                                        {sekolahChartFilter.label || "Filter chart"}
                                        <button
                                            type="button"
                                            onClick={() => clearSekolahChartFilter?.()}
                                            title="Hapus filter"
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "#1d4ed8",
                                                cursor: "pointer",
                                                padding: 0,
                                                lineHeight: 1,
                                                fontSize: 14,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={stickyTableWrapStyle}>
                                <table
                                    style={stickyTableStyle}
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
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "name",
                                                        dir:
                                                            s.key === "name" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Nama Sekolah{" "}
                                                {sekolahSort.key === "name"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            {showSalesColumn && (
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                            key: "sales_name",
                                                        dir:
                                                            s.key ===
                                                                    "sales_name" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                    Sales{" "}
                                                {sekolahSort.key ===
                                                    "sales_name"
                                                        ? sekolahSort.dir ===
                                                          "asc"
                                                            ? "↑"
                                                            : "↓"
                                                        : ""}
                                                </th>
                                            )}
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "is_active",
                                                        dir:
                                                            s.key ===
                                                                "is_active" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Status{" "}
                                                {sekolahSort.key === "is_active"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "sumber_dana",
                                                        dir:
                                                            s.key ===
                                                                "sumber_dana" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Sumber Dana{" "}
                                                {sekolahSort.key ===
                                                "sumber_dana"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "penerbit",
                                                        dir:
                                                            s.key ===
                                                                "penerbit" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Penerbit{" "}
                                                {sekolahSort.key === "penerbit"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "total_student",
                                                        dir:
                                                            s.key ===
                                                                "total_student" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Total Siswa{" "}
                                                {sekolahSort.key ===
                                                "total_student"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "school_grade",
                                                        dir:
                                                            s.key ===
                                                                "school_grade" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Grade{" "}
                                                {sekolahSort.key ===
                                                "school_grade"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "sp_exemplar_current",
                                                        dir:
                                                            s.key ===
                                                                "sp_exemplar_current" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                SP{" "}
                                                {insights?.targetYear ||
                                                    filters?.tahun ||
                                                    new Date().getFullYear()}{" "}
                                                {sekolahSort.key ===
                                                "sp_exemplar_current"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "real_exemplar_current",
                                                        dir:
                                                            s.key ===
                                                                "real_exemplar_current" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Realisasi{" "}
                                                {insights?.targetYear ||
                                                    filters?.tahun ||
                                                    new Date().getFullYear()}{" "}
                                                {sekolahSort.key ===
                                                "real_exemplar_current"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            if (
                                                !filteredListSekolah ||
                                                filteredListSekolah.length === 0
                                            ) {
                                                return (
                                                    <tr>
                                                        <td
                                                            colSpan={colCount}
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "center",
                                                                color: T.slate,
                                                                padding:
                                                                    "20px 0",
                                                            }}
                                                        >
                                                            Tidak ada data
                                                            sekolah
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            const pageItems =
                                                filteredListSekolah.slice(
                                                    (sekolahPage - 1) *
                                                        sekolahPerPage,
                                                    sekolahPage *
                                                        sekolahPerPage,
                                                );

                                            const jenjangOrder = {
                                                SD: 1,
                                                SMP: 2,
                                                SMA: 3,
                                                SMK: 4,
                                                DLL: 5,
                                                Lainnya: 6,
                                            };

                                            // Group: Kota/Kab → Kecamatan → Jenjang → sekolah
                                            const byKota = {};
                                            pageItems.forEach((s) => {
                                                const raw =
                                                    String(
                                                        s.kecamatan_name || "",
                                                    ).trim() ||
                                                    "Tanpa Kecamatan";
                                                const parts = raw
                                                    .split(",")
                                                    .map((p) => p.trim())
                                                    .filter(Boolean);
                                                const kecKey = (
                                                    parts[0] || raw
                                                ).toUpperCase();
                                                const kotaKey =
                                                    parts.length > 1
                                                        ? parts
                                                              .slice(1)
                                                              .join(", ")
                                                              .toUpperCase()
                                                        : "TANPA KOTA/KAB";
                                                const j =
                                                    s.jenjang || "Lainnya";

                                                if (!byKota[kotaKey]) {
                                                    byKota[kotaKey] = {
                                                        label: kotaKey,
                                                        kecamatan: {},
                                                    };
                                                }
                                                if (
                                                    !byKota[kotaKey].kecamatan[
                                                        kecKey
                                                    ]
                                                ) {
                                                    byKota[kotaKey].kecamatan[
                                                        kecKey
                                                    ] = {
                                                        label: kecKey,
                                                        jenjang: {},
                                                    };
                                                }
                                                const kecNode =
                                                    byKota[kotaKey].kecamatan[
                                                        kecKey
                                                    ];
                                                if (!kecNode.jenjang[j]) {
                                                    kecNode.jenjang[j] = [];
                                                }
                                                kecNode.jenjang[j].push(s);
                                            });

                                            const sumMetrics = (schools) => ({
                                                count: schools.length,
                                                ac: schools.filter((s) =>
                                                    isAreaCoverSchool(s),
                                                ).length,
                                                siswa: schools.reduce(
                                                    (a, s) =>
                                                        a +
                                                        (Number(
                                                            s.total_student,
                                                        ) || 0),
                                                    0,
                                                ),
                                                realisasi: schools.reduce(
                                                    (a, s) =>
                                                        a +
                                                        (Number(
                                                            s.real_exemplar_current,
                                                        ) || 0),
                                                    0,
                                                ),
                                                sp: schools.reduce(
                                                    (a, s) =>
                                                        a +
                                                        (Number(
                                                            s.sp_exemplar_current,
                                                        ) || 0),
                                                    0,
                                                ),
                                            });

                                            const renderMetricCells = (
                                                total,
                                                bg,
                                                accent,
                                            ) => (
                                                <>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "center",
                                                            fontWeight: 800,
                                                            color: accent,
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        AC {total.ac}
                                                    </td>
                                                    <td
                                                        colSpan="2"
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                        }}
                                                    />
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "right",
                                                            fontWeight: 800,
                                                            color: accent,
                                                        }}
                                                    >
                                                        {formatNumber(
                                                            total.siswa,
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                        }}
                                                    />
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "right",
                                                            fontWeight: 800,
                                                            color:
                                                                bg === "#1e3a8a"
                                                                    ? "#e9d5ff"
                                                                    : "#7c3aed",
                                                        }}
                                                    >
                                                        {formatNumber(total.sp)}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            backgroundColor: bg,
                                                            textAlign: "right",
                                                            fontWeight: 800,
                                                            color:
                                                                bg === "#f1f5f9"
                                                                    ? "#2563eb"
                                                                    : accent,
                                                        }}
                                                    >
                                                        {formatNumber(
                                                            total.realisasi,
                                                        )}
                                                    </td>
                                                </>
                                            );

                                            const sortedKota = Object.keys(
                                                byKota,
                                            ).sort((a, b) =>
                                                a.localeCompare(b, "id", {
                                                    sensitivity: "base",
                                                }),
                                            );

                                            let globalIndex =
                                                (sekolahPage - 1) *
                                                sekolahPerPage;

                                            return sortedKota.map((kotaKey) => {
                                                const kota = byKota[kotaKey];
                                                const sortedKec = Object.keys(
                                                    kota.kecamatan,
                                                ).sort((a, b) =>
                                                    a.localeCompare(b, "id", {
                                                        sensitivity: "base",
                                                    }),
                                                );
                                                const allKotaSchools =
                                                    sortedKec.flatMap(
                                                        (kecKey) =>
                                                            Object.values(
                                                                kota.kecamatan[
                                                                    kecKey
                                                                ].jenjang,
                                                            ).flat(),
                                                    );
                                                const kotaTotal =
                                                    sumMetrics(allKotaSchools);
                                                const kotaLabel =
                                                    kotaKey === "TANPA KOTA/KAB"
                                                        ? "Tanpa Kota/Kab"
                                                        : kota.label;

                                                return (
                                                    <React.Fragment
                                                        key={kotaKey}
                                                    >
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    nameGroupColSpan
                                                                }
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 800,
                                                                    backgroundColor:
                                                                        "#1e3a8a",
                                                                    color: "#fff",
                                                                    textAlign:
                                                                        "left",
                                                                    letterSpacing:
                                                                        "0.02em",
                                                                }}
                                                            >
                                                                Kota/Kab:{" "}
                                                                {kotaLabel}
                                                                <span
                                                                    style={{
                                                                        marginLeft: 8,
                                                                        fontWeight: 600,
                                                                        fontSize: 11,
                                                                        color: "#bfdbfe",
                                                                    }}
                                                                >
                                                                    (
                                                                    {
                                                                        kotaTotal.count
                                                                    }{" "}
                                                                    sekolah · AC{" "}
                                                                    {
                                                                        kotaTotal.ac
                                                                    }
                                                                    )
                                                                </span>
                                                            </td>
                                                            {renderMetricCells(
                                                                kotaTotal,
                                                                "#1e3a8a",
                                                                "#fff",
                                                            )}
                                                        </tr>
                                                        {sortedKec.map(
                                                            (kecKey) => {
                                                                const kec =
                                                                    kota
                                                                        .kecamatan[
                                                                        kecKey
                                                                    ];
                                                                const jenjangKeys =
                                                                    Object.keys(
                                                                        kec.jenjang,
                                                                    ).sort(
                                                                        (
                                                                            a,
                                                                            b,
                                                                        ) =>
                                                                            (jenjangOrder[
                                                                                a
                                                                            ] ||
                                                                                99) -
                                                                            (jenjangOrder[
                                                                                b
                                                                            ] ||
                                                                                99),
                                                                    );
                                                                const allKecSchools =
                                                                    jenjangKeys.flatMap(
                                                                        (jk) =>
                                                                            kec
                                                                                .jenjang[
                                                                                jk
                                                                            ],
                                                                    );
                                                                const kecTotal =
                                                                    sumMetrics(
                                                                        allKecSchools,
                                                                    );

                                                                return (
                                                                    <React.Fragment
                                                                        key={`${kotaKey}-${kecKey}`}
                                                                    >
                                                                        <tr>
                                                                            <td
                                                                                colSpan={
                                                                                    nameGroupColSpan
                                                                                }
                                                                                style={{
                                                                                    ...S.td,
                                                                                    fontWeight: 800,
                                                                                    backgroundColor:
                                                                                        "#dbeafe",
                                                                                    color: "#1e40af",
                                                                                    textAlign:
                                                                                        "left",
                                                                                    letterSpacing:
                                                                                        "0.02em",
                                                                                    paddingLeft: 16,
                                                                                }}
                                                                            >
                                                                                Kecamatan:{" "}
                                                                                {
                                                                                    kec.label
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
                                                                                    sekolah · AC{" "}
                                                                                    {
                                                                                        kecTotal.ac
                                                                                    }
                                                                                    )
                                                                                </span>
                                                                            </td>
                                                                            {renderMetricCells(
                                                                                kecTotal,
                                                                                "#dbeafe",
                                                                                "#1e40af",
                                                                            )}
                                                                        </tr>
                                                                        {jenjangKeys.map(
                                                                            (
                                                                                jenjangKey,
                                                                            ) => {
                                                                                const schools =
                                                                                    kec
                                                                                        .jenjang[
                                                                                        jenjangKey
                                                                                    ];
                                                                                const jTotal =
                                                                                    sumMetrics(
                                                                                        schools,
                                                                                    );

                                                                                return (
                                                                                    <React.Fragment
                                                                                        key={`${kotaKey}-${kecKey}-${jenjangKey}`}
                                                                                    >
                                                                                        <tr>
                                                                                            <td
                                                                                                colSpan={
                                                                                                    nameGroupColSpan
                                                                                                }
                                                                                                style={{
                                                                                                    ...S.td,
                                                                                                    fontWeight: 700,
                                                                                                    backgroundColor:
                                                                                                        "#f1f5f9",
                                                                                                    color: T.slate,
                                                                                                    textAlign:
                                                                                                        "left",
                                                                                                    paddingLeft: 28,
                                                                                                }}
                                                                                            >
                                                                                                Jenjang:{" "}
                                                                                                <span
                                                                                                    style={{
                                                                                                        color: T.blue,
                                                                                                    }}
                                                                                                >
                                                                                                    {
                                                                                                        jenjangKey
                                                                                                    }
                                                                                                </span>
                                                                                                <span
                                                                                                    style={{
                                                                                                        marginLeft: 8,
                                                                                                        fontWeight: 600,
                                                                                                        fontSize: 11,
                                                                                                        color: T.slate,
                                                                                                    }}
                                                                                                >
                                                                                                    (
                                                                                                    {
                                                                                                        jTotal.count
                                                                                                    }{" "}
                                                                                                    sekolah · AC{" "}
                                                                                                    {
                                                                                                        jTotal.ac
                                                                                                    }
                                                                                                    )
                                                                                                </span>
                                                                                            </td>
                                                                                            {renderMetricCells(
                                                                                                jTotal,
                                                                                                "#f1f5f9",
                                                                                                T.slate,
                                                                                            )}
                                                                                        </tr>
                                                                                        {schools.map(
                                                                                            (
                                                                                                s,
                                                                                                idx,
                                                                                            ) => {
                                                                                                globalIndex++;
                                                                                                return (
                                                                                                    <tr
                                                                                                        key={`${kotaKey}-${kecKey}-${jenjangKey}-${idx}`}
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
                                                                                                                paddingLeft: 28,
                                                                                                            }}
                                                                                                        >
                                                                                                            {
                                                                                                                s.name
                                                                                                            }
                                                                                                        </td>
                                                                                                        {showSalesColumn && (
                                                                                                            <td
                                                                                                                style={{
                                                                                                                    ...S.td,
                                                                                                                    fontWeight: 600,
                                                                                                                    color: T.blue,
                                                                                                                    whiteSpace:
                                                                                                                        "nowrap",
                                                                                                                }}
                                                                                                            >
                                                                                                                {s.sales_name ||
                                                                                                                    "Tanpa Sales"}
                                                                                                            </td>
                                                                                                        )}
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "center",
                                                                                                                whiteSpace:
                                                                                                                    "nowrap",
                                                                                                            }}
                                                                                                        >
                                                                                                            {isAreaCoverSchool(
                                                                                                                s,
                                                                                                            ) ? (
                                                                                                                <span
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            "inline-block",
                                                                                                                        padding:
                                                                                                                            "2px 8px",
                                                                                                                        borderRadius: 6,
                                                                                                                        fontSize: 10,
                                                                                                                        fontWeight: 800,
                                                                                                                        color: "#059669",
                                                                                                                        background:
                                                                                                                            "#05966918",
                                                                                                                        border: "1px solid #05966944",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Area Cover
                                                                                                                </span>
                                                                                                            ) : (
                                                                                                                <span
                                                                                                                    style={{
                                                                                                                        display:
                                                                                                                            "inline-block",
                                                                                                                        padding:
                                                                                                                            "2px 8px",
                                                                                                                        borderRadius: 6,
                                                                                                                        fontSize: 10,
                                                                                                                        fontWeight: 800,
                                                                                                                        color: "#e11d48",
                                                                                                                        background:
                                                                                                                            "#e11d4818",
                                                                                                                        border: "1px solid #e11d4844",
                                                                                                                    }}
                                                                                                                >
                                                                                                                    Non Area Cover
                                                                                                                </span>
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                            }}
                                                                                                        >
                                                                                                            {s.sumber_dana ||
                                                                                                                "-"}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                            }}
                                                                                                        >
                                                                                                            {s.penerbit ||
                                                                                                                "-"}
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
                                                                                                                s.total_student,
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "center",
                                                                                                            }}
                                                                                                        >
                                                                                                            {renderGradeBadge(
                                                                                                                s.school_grade,
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "right",
                                                                                                                fontWeight: 700,
                                                                                                                color: "#7c3aed",
                                                                                                            }}
                                                                                                        >
                                                                                                            {formatNumber(
                                                                                                                s.sp_exemplar_current ??
                                                                                                                    0,
                                                                                                            )}
                                                                                                        </td>
                                                                                                        <td
                                                                                                            style={{
                                                                                                                ...S.td,
                                                                                                                textAlign:
                                                                                                                    "right",
                                                                                                                fontWeight: 700,
                                                                                                                color:
                                                                                                                    (Number(
                                                                                                                        s.real_exemplar_current,
                                                                                                                    ) ||
                                                                                                                        0) >
                                                                                                                    0
                                                                                                                        ? T.green
                                                                                                                        : T.slate,
                                                                                                            }}
                                                                                                        >
                                                                                                            {formatNumber(
                                                                                                                s.real_exemplar_current ??
                                                                                                                    0,
                                                                                                            )}
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                );
                                                                                            },
                                                                                        )}
                                                                                    </React.Fragment>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </React.Fragment>
                                                                );
                                                            },
                                                        )}
                                                    </React.Fragment>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {filteredListSekolah &&
                                filteredListSekolah.length > sekolahPerPage && (
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
                                            {(sekolahPage - 1) *
                                                sekolahPerPage +
                                                1}{" "}
                                            -{" "}
                                            {Math.min(
                                                sekolahPage * sekolahPerPage,
                                                filteredListSekolah.length,
                                            )}{" "}
                                            dari {filteredListSekolah.length}
                                        </div>
                                        <div
                                            style={{ display: "flex", gap: 6 }}
                                        >
                                            <button
                                                onClick={() =>
                                                    setSekolahPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={sekolahPage === 1}
                                                style={{
                                                    padding: "4px 12px",
                                                    fontSize: 12,
                                                    borderRadius: 4,
                                                    border: `1px solid ${T.border}`,
                                                    backgroundColor:
                                                        sekolahPage === 1
                                                            ? "#f8fafc"
                                                            : "white",
                                                    color:
                                                        sekolahPage === 1
                                                            ? "#cbd5e1"
                                                            : T.text,
                                                    cursor:
                                                        sekolahPage === 1
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Sebelumnya
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setSekolahPage((p) =>
                                                        Math.min(
                                                            Math.ceil(
                                                                filteredListSekolah.length /
                                                                    sekolahPerPage,
                                                            ),
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    sekolahPage ===
                                                    Math.ceil(
                                                        filteredListSekolah.length /
                                                            sekolahPerPage,
                                                    )
                                                }
                                                style={{
                                                    padding: "4px 12px",
                                                    fontSize: 12,
                                                    borderRadius: 4,
                                                    border: `1px solid ${T.border}`,
                                                    backgroundColor:
                                                        sekolahPage ===
                                                        Math.ceil(
                                                            filteredListSekolah.length /
                                                                sekolahPerPage,
                                                        )
                                                            ? "#f8fafc"
                                                            : "white",
                                                    color:
                                                        sekolahPage ===
                                                        Math.ceil(
                                                            filteredListSekolah.length /
                                                                sekolahPerPage,
                                                        )
                                                            ? "#cbd5e1"
                                                            : T.text,
                                                    cursor:
                                                        sekolahPage ===
                                                        Math.ceil(
                                                            filteredListSekolah.length /
                                                                sekolahPerPage,
                                                        )
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Selanjutnya
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </Card>
                    </div>
        )}
        </>
    );
}
