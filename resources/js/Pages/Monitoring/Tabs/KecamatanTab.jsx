import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";

export default function KecamatanTab(props) {

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

    const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(num || 0);

    return (
        <>
                {activeTab === "kecamatan" && isSalesDetail && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title="Daftar Kecamatan"
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
                                                Kecamatan
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Total Sekolah
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Area Cover
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Potensi Siswa
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listKecamatan.length > 0 ? (
                                            Object.entries(
                                                listKecamatan.reduce(
                                                    (acc, curr) => {
                                                        const kecName =
                                                            curr.kecamatan_name ||
                                                            curr.kecamatan ||
                                                            "";
                                                        const parts =
                                                            kecName.split(",");
                                                        const kotaKab =
                                                            parts.length > 1
                                                                ? parts[1].trim()
                                                                : "Tanpa Kota/Kab";
                                                        if (!acc[kotaKab])
                                                            acc[kotaKab] = [];
                                                        acc[kotaKab].push(curr);
                                                        return acc;
                                                    },
                                                    {},
                                                ),
                                            ).map(([kotaKabName, items]) => (
                                                <React.Fragment
                                                    key={kotaKabName}
                                                >
                                                    <tr
                                                        style={{
                                                            backgroundColor: `${T.blueSoft}10`,
                                                        }}
                                                    >
                                                        <td
                                                            colSpan="5"
                                                            style={{
                                                                ...S.td,
                                                                fontWeight: 700,
                                                                color: T.blue,
                                                                paddingLeft: 16,
                                                            }}
                                                        >
                                                            {kotaKabName}
                                                        </td>
                                                    </tr>
                                                    {items.map((k, i) => (
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
                                                                {i + 1}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {k.kecamatan_name ||
                                                                    "- (Tidak Ada Data Kecamatan)"}
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
                                                                    k.total_sekolah,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.green,
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    k.sekolah_aktif,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    fontWeight: 800,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    k.potensi_siswa,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "center",
                                                        color: T.slate,
                                                        padding: "20px 0",
                                                    }}
                                                >
                                                    Tidak ada data kecamatan
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
        )}
        </>
    );
}
