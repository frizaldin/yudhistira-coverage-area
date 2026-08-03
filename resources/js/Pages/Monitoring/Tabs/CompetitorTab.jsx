import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";

export default function CompetitorTab(props) {

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
                {activeTab === "competitor" && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title="Kompetitor & Market Share"
                            footer="Lihat Detail"
                            onFooterClick={() =>
                                router.visit(
                                    route(
                                        "monitoring.cabang.kompetitor",
                                        cabangCode,
                                    ),
                                )
                            }
                            style={{ flex: 1, minWidth: 300 }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                }}
                            >
                                {competitors.map((c, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 2,
                                                    background: c.color,
                                                }}
                                            />
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: T.text,
                                                }}
                                            >
                                                {c.label}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: T.slate,
                                            }}
                                        >
                                            {formatNumber(c.value)} sekolah
                                        </div>
                                    </div>
                                ))}
                                {competitors.length === 0 && (
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: T.slate,
                                            textAlign: "center",
                                            padding: "20px 0",
                                        }}
                                    >
                                        Tidak ada data kompetitor
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
        )}
        </>
    );
}
