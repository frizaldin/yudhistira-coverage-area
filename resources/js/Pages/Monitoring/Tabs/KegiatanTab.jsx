import React, { useState, useEffect, useMemo } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import VisitActivityCharts from "./VisitActivityCharts";

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
    }, [kegiatanAktivitasFilter]);

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
            })
            .sort((a, b) => {
                if (b.total_akt !== a.total_akt) return b.total_akt - a.total_akt;
                return String(a.name).localeCompare(String(b.name), "id", {
                    sensitivity: "base",
                });
            });
    }, [kegiatanSales, listSekolah]);

    const sekolahAktTotalPages = Math.max(
        1,
        Math.ceil(sekolahAktivitasRows.length / sekolahAktPerPage),
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
                                        {sekolahAktivitasRows.length}
                                    </strong>{" "}
                                    sekolah Area Cover
                                </div>
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
                                                    Nama Sekolah
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Kecamatan
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Jenjang
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
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Total Akt.
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Realisasi {yearPrev}
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Realisasi {yearCurr}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sekolahAktivitasRows.length ===
                                            0 ? (
                                                <tr>
                                                    <td
                                                        colSpan="8"
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "center",
                                                            color: T.slate,
                                                            padding: "20px 0",
                                                        }}
                                                    >
                                                        Tidak ada sekolah Area
                                                        Cover
                                                    </td>
                                                </tr>
                                            ) : (
                                                sekolahAktivitasRows
                                                    .slice(
                                                        (sekolahAktPage - 1) *
                                                            sekolahAktPerPage,
                                                        sekolahAktPage *
                                                            sekolahAktPerPage,
                                                    )
                                                    .map((row, idx) => (
                                                        <tr
                                                            key={
                                                                row.customer_id ||
                                                                idx
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
                                                                {(sekolahAktPage -
                                                                    1) *
                                                                    sekolahAktPerPage +
                                                                    idx +
                                                                    1}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {row.name}
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
                                                                    color: T.slate,
                                                                }}
                                                            >
                                                                {row.kecamatan}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                {row.jenjang}
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
                                                                    {row.activityList
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
                                                                {row.total_akt}
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
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {sekolahAktivitasRows.length >
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
                                                sekolahAktivitasRows.length,
                                            )}{" "}
                                            dari {sekolahAktivitasRows.length}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSekolahAktPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={sekolahAktPage === 1}
                                                style={{
                                                    padding: "4px 12px",
                                                    fontSize: 12,
                                                    borderRadius: 4,
                                                    border: `1px solid ${T.border}`,
                                                    background:
                                                        sekolahAktPage === 1
                                                            ? "#f8fafc"
                                                            : "white",
                                                    color:
                                                        sekolahAktPage === 1
                                                            ? "#cbd5e1"
                                                            : T.text,
                                                    cursor:
                                                        sekolahAktPage === 1
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Prev
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSekolahAktPage((p) =>
                                                        Math.min(
                                                            sekolahAktTotalPages,
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    sekolahAktPage ===
                                                    sekolahAktTotalPages
                                                }
                                                style={{
                                                    padding: "4px 12px",
                                                    fontSize: 12,
                                                    borderRadius: 4,
                                                    border: `1px solid ${T.border}`,
                                                    background:
                                                        sekolahAktPage ===
                                                        sekolahAktTotalPages
                                                            ? "#f8fafc"
                                                            : "white",
                                                    color:
                                                        sekolahAktPage ===
                                                        sekolahAktTotalPages
                                                            ? "#cbd5e1"
                                                            : T.text,
                                                    cursor:
                                                        sekolahAktPage ===
                                                        sekolahAktTotalPages
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>

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
                                                <button
                                                    onClick={() =>
                                                        setKegiatanPage((p) =>
                                                            Math.max(1, p - 1),
                                                        )
                                                    }
                                                    disabled={
                                                        kegiatanPage === 1
                                                    }
                                                    style={{
                                                        padding: "4px 12px",
                                                        fontSize: 12,
                                                        borderRadius: 4,
                                                        border: `1px solid ${T.border}`,
                                                        backgroundColor:
                                                            kegiatanPage === 1
                                                                ? "#f8fafc"
                                                                : "white",
                                                        color:
                                                            kegiatanPage === 1
                                                                ? "#cbd5e1"
                                                                : T.text,
                                                        cursor:
                                                            kegiatanPage === 1
                                                                ? "not-allowed"
                                                                : "pointer",
                                                    }}
                                                >
                                                    Sebelumnya
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setKegiatanPage((p) =>
                                                            Math.min(
                                                                Math.ceil(
                                                                    filteredKegiatan.length /
                                                                        kegiatanPerPage,
                                                                ),
                                                                p + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        kegiatanPage ===
                                                        Math.ceil(
                                                            filteredKegiatan.length /
                                                                kegiatanPerPage,
                                                        )
                                                    }
                                                    style={{
                                                        padding: "4px 12px",
                                                        fontSize: 12,
                                                        borderRadius: 4,
                                                        border: `1px solid ${T.border}`,
                                                        backgroundColor:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                filteredKegiatan.length /
                                                                    kegiatanPerPage,
                                                            )
                                                                ? "#f8fafc"
                                                                : "white",
                                                        color:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                filteredKegiatan.length /
                                                                    kegiatanPerPage,
                                                            )
                                                                ? "#cbd5e1"
                                                                : T.text,
                                                        cursor:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                filteredKegiatan.length /
                                                                    kegiatanPerPage,
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
                    </div>
        )}
        </>
    );
}
