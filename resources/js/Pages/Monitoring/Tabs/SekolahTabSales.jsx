import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds,
    stickyTableWrapStyle, stickyTableStyle,
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";

export default function SekolahTabSales(props) {

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
        showSalesColumn = false,
        sekolahTitle = "Daftar Sekolah Area Cover",
        hideStatusFilter = true,
    } = props;

    const colCount = showSalesColumn ? 9 : 8;
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

                                            // Group: Kecamatan → Jenjang → sekolah
                                            const byKecamatan = {};
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
                                                const kotaKab =
                                                    parts.length > 1
                                                        ? parts
                                                              .slice(1)
                                                              .join(", ")
                                                              .toUpperCase()
                                                        : null;
                                                const j =
                                                    s.jenjang || "Lainnya";

                                                if (!byKecamatan[kecKey]) {
                                                    byKecamatan[kecKey] = {
                                                        label: kecKey,
                                                        kotaKab,
                                                        jenjang: {},
                                                    };
                                                }
                                                if (
                                                    kotaKab &&
                                                    !byKecamatan[kecKey].kotaKab
                                                ) {
                                                    byKecamatan[kecKey].kotaKab =
                                                        kotaKab;
                                                }
                                                if (
                                                    !byKecamatan[kecKey]
                                                        .jenjang[j]
                                                ) {
                                                    byKecamatan[kecKey].jenjang[
                                                        j
                                                    ] = [];
                                                }
                                                byKecamatan[kecKey].jenjang[
                                                    j
                                                ].push(s);
                                            });

                                            const sortedKec = Object.keys(
                                                byKecamatan,
                                            ).sort((a, b) =>
                                                a.localeCompare(b, "id", {
                                                    sensitivity: "base",
                                                }),
                                            );

                                            let globalIndex =
                                                (sekolahPage - 1) *
                                                sekolahPerPage;

                                            return sortedKec.map((kecKey) => {
                                                const kec =
                                                    byKecamatan[kecKey];
                                                const jenjangKeys =
                                                    Object.keys(
                                                        kec.jenjang,
                                                    ).sort(
                                                        (a, b) =>
                                                            (jenjangOrder[a] ||
                                                                99) -
                                                            (jenjangOrder[b] ||
                                                                99),
                                                    );
                                                const displayKec = kec.kotaKab
                                                    ? `${kec.label}, ${kec.kotaKab}`
                                                    : kec.label;

                                                const allKecSchools =
                                                    jenjangKeys.flatMap(
                                                        (jk) =>
                                                            kec.jenjang[jk],
                                                    );
                                                const kecTotal = {
                                                    count: allKecSchools.length,
                                                    ac: allKecSchools.filter(
                                                        (s) =>
                                                            isAreaCoverSchool(s),
                                                    ).length,
                                                    siswa: allKecSchools.reduce(
                                                        (a, s) =>
                                                            a +
                                                            (Number(
                                                                s.total_student,
                                                            ) || 0),
                                                        0,
                                                    ),
                                                    realisasi:
                                                        allKecSchools.reduce(
                                                            (a, s) =>
                                                                a +
                                                                (Number(
                                                                    s.real_exemplar_current,
                                                                ) || 0),
                                                            0,
                                                        ),
                                                    sp: allKecSchools.reduce(
                                                        (a, s) =>
                                                            a +
                                                            (Number(
                                                                s.sp_exemplar_current,
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
                                                                colSpan={nameGroupColSpan}
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
                                                                }}
                                                            >
                                                                Kecamatan:{" "}
                                                                {displayKec}
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
                                                                colSpan="2"
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
                                                                        "right",
                                                                    fontWeight: 800,
                                                                    color: "#7c3aed",
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    kecTotal.sp,
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
                                                                    kecTotal.realisasi,
                                                                )}
                                                                        </td>
                                                        </tr>
                                                        {jenjangKeys.map(
                                                            (jenjangKey) => {
                                                                const schools =
                                                                    kec
                                                                        .jenjang[
                                                                        jenjangKey
                                                                    ];
                                                                const jTotal = {
                                                                    count: schools.length,
                                                                    ac: schools.filter(
                                                                        (s) =>
                                                                            isAreaCoverSchool(
                                                                                s,
                                                                            ),
                                                                    ).length,
                                                                    siswa: schools.reduce(
                                                                        (
                                                                            a,
                                                                            s,
                                                                        ) =>
                                                                            a +
                                                                            (Number(
                                                                                s.total_student,
                                                                            ) ||
                                                                                0),
                                                                        0,
                                                                    ),
                                                                    realisasi:
                                                                        schools.reduce(
                                                                            (
                                                                                a,
                                                                                s,
                                                                            ) =>
                                                                                a +
                                                                                (Number(
                                                                                    s.real_exemplar_current,
                                                                                ) ||
                                                                                    0),
                                                                            0,
                                                                        ),
                                                                    sp: schools.reduce(
                                                                        (
                                                                            a,
                                                                            s,
                                                                        ) =>
                                                                            a +
                                                                            (Number(
                                                                                s.sp_exemplar_current,
                                                                            ) ||
                                                                                0),
                                                                        0,
                                                                    ),
                                                                };

                                                                return (
                                                                <React.Fragment
                                                                    key={`${kecKey}-${jenjangKey}`}
                                                                >
                                                                    <tr>
                                                                        <td
                                                                            colSpan={nameGroupColSpan}
                                                                            style={{
                                                                                ...S.td,
                                                                                fontWeight: 700,
                                                                                backgroundColor:
                                                                                    "#f1f5f9",
                                                                                color: T.slate,
                                                                                textAlign:
                                                                                    "left",
                                                                                paddingLeft: 20,
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
                                                                                sekolah)
                                                                            </span>
                                                                        </td>
                                                                        <td
                                                                            colSpan="2"
                                                                            style={{
                                                                                ...S.td,
                                                                                backgroundColor:
                                                                                    "#f1f5f9",
                                                                            }}
                                                                        />
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                backgroundColor:
                                                                                    "#f1f5f9",
                                                                                textAlign:
                                                                                    "right",
                                                                                fontWeight: 800,
                                                                                color: T.text,
                                                                            }}
                                                                        >
                                                                            {formatNumber(
                                                                                jTotal.siswa,
                                                                            )}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                backgroundColor:
                                                                                    "#f1f5f9",
                                                                            }}
                                                                        />
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                backgroundColor:
                                                                                    "#f1f5f9",
                                                                                textAlign:
                                                                                    "right",
                                                                                fontWeight: 800,
                                                                                color: "#7c3aed",
                                                                            }}
                                                                        >
                                                                            {formatNumber(
                                                                                jTotal.sp,
                                                                            )}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                backgroundColor:
                                                                                    "#f1f5f9",
                                                                                textAlign:
                                                                                    "right",
                                                                                fontWeight: 800,
                                                                                color: "#2563eb",
                                                                            }}
                                                                        >
                                                                            {formatNumber(
                                                                                jTotal.realisasi,
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                    {schools.map(
                                                                        (
                                                                            s,
                                                                            idx,
                                                                        ) => {
                                                                            globalIndex++;
                                                                            return (
                                                                                <tr
                                                                                    key={`${kecKey}-${jenjangKey}-${idx}`}
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
