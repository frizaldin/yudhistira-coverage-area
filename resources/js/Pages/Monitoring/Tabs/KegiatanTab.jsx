import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";

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
        sekolahPerPage
    } = props;

    const [kegiatanPage, setKegiatanPage] = useState(1);
    const kegiatanPerPage = 10;
    const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(num);

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
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            {/* Coverage Kunjungan */}
                            <Card
                                title="Coverage Kunjungan Sekolah"
                                style={{ flex: 1, minWidth: 280 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                    }}
                                >
                                    <Donut
                                        segments={visitCoverage}
                                        label={`${visitCoverage.reduce((a, c) => a + c.value, 0) > 0 ? Math.round(((visitCoverage.find((s) => s.label === "Dikunjungi")?.value || 0) / visitCoverage.reduce((a, c) => a + c.value, 0)) * 100) : 0}%`}
                                        sub="Terkunjungi"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {visitCoverage.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: T.text,
                                                    }}
                                                >
                                                    {s.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                            {/* Distribusi Aktivitas */}
                            <Card
                                title="Distribusi Aktivitas"
                                style={{ flex: 1, minWidth: 280 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                    }}
                                >
                                    <Donut
                                        segments={activityBreakdown}
                                        label={activityBreakdown.reduce(
                                            (a, c) => a + c.value,
                                            0,
                                        )}
                                        sub="Total Aktv"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {activityBreakdown.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: T.text,
                                                    }}
                                                >
                                                    {s.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                            {/* Hasil Kunjungan */}
                            <Card
                                title="Hasil Kunjungan"
                                style={{ flex: 1, minWidth: 280 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                    }}
                                >
                                    <Donut
                                        segments={resultBreakdown}
                                        label={resultBreakdown.reduce(
                                            (a, c) => a + c.value,
                                            0,
                                        )}
                                        sub="Aktivitas"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {resultBreakdown.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: T.text,
                                                    }}
                                                >
                                                    {s.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                            {kegiatanSales &&
                                            kegiatanSales.length > 0 ? (
                                                kegiatanSales
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
                                {kegiatanSales &&
                                    kegiatanSales.length > kegiatanPerPage && (
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
                                                    kegiatanSales.length,
                                                )}{" "}
                                                dari {kegiatanSales.length}
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
                                                                    kegiatanSales.length /
                                                                        kegiatanPerPage,
                                                                ),
                                                                p + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        kegiatanPage ===
                                                        Math.ceil(
                                                            kegiatanSales.length /
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
                                                                kegiatanSales.length /
                                                                    kegiatanPerPage,
                                                            )
                                                                ? "#f8fafc"
                                                                : "white",
                                                        color:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                kegiatanSales.length /
                                                                    kegiatanPerPage,
                                                            )
                                                                ? "#cbd5e1"
                                                                : T.text,
                                                        cursor:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                kegiatanSales.length /
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
