import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T,
    S,
    Card,
    Badge,
    Donut,
    StatCard,
    KecamatanChoroplethMap,
    CompetitorChoroplethMap,
    Bar,
    CompositionCard,
    FitBounds,
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import Swal from "sweetalert2";

export default function DashboardTab(props) {
    const {
        activityBreakdown,
        resultBreakdown,
        insights,
        filterOptions,
        filters,
        isFromSalesPerformance,
        salesPerformanceFilterOptions,
        salesPerformanceFilters,
        nonCoverSchools,
        activeNav,
        pageTitle,
        cabangName,
        areaName,
        description,
        areas,
        cabangs,
        selectedCabang,
        provinceCode,
        cabangCode,
        realStats,
        trl,
        trlJenjang,
        salesPerformance,
        rankingKecamatan,
        top10Schools,
        mapMarkers,
        schools,
        dana,
        jenjang,
        trend,
        areaCovers,
        competitors,
        leaderboard,
        salesJenjangData,
        salesJenjangTotal,
        uncovered,
        uncoveredDana,
        hideFilters,
        backUrl,
        isSalesDetail,
        timSalesPerformance,
        timSalesPerformanceWorst,
        listKecamatan,
        listSekolah,
        kegiatanSales,
        visitCoverage,
        rencanaJualCoverage,
        jenjangBreakdown,
        sumberDanaBreakdown,
        segmenBreakdown,
        siswaBreakdown,
        salesProfile,
        activeTab,
        setActiveTab,
        spFilterData,
        setSpFilterData,
        isFilterOpen,
        setIsFilterOpen,
        kpiData,
        showScoreInfo,
        setShowScoreInfo,
        sekolahPage,
        setSekolahPage,
        handleSpAreaChange,
        applySpFilter,
        sekolahPerPage,
    } = props;

    return (
        <>
            {activeTab === "dashboard" && (
                <>
                    {/* ── KPI SCORE DASHBOARD ── */}
                    {isSalesDetail &&
                        kpiData.totalScore !== undefined &&
                        ((showScoreInfo, setShowScoreInfo) => {
                            const score = kpiData.totalScore || 0;
                            const grade = kpiData.grade || "Kurang";
                            const gradeColor =
                                score >= 80
                                    ? "#10b981"
                                    : score >= 60
                                      ? "#3b82f6"
                                      : score >= 40
                                        ? "#f59e0b"
                                        : "#ef4444";
                            const gradeColorBg =
                                score >= 80
                                    ? "#ecfdf5"
                                    : score >= 60
                                      ? "#eff6ff"
                                      : score >= 40
                                        ? "#fffbeb"
                                        : "#fef2f2";
                            const components = kpiData.components || [];
                            const monthlyActivities =
                                kpiData.monthlyActivities || [];
                            const maxActivity = Math.max(
                                ...monthlyActivities.map((m) => m.count),
                                1,
                            );

                            // Gauge SVG params
                            const gaugeSize = 140;
                            const gaugeStroke = 12;
                            const gaugeR = (gaugeSize - gaugeStroke) / 2;
                            const gaugeCx = gaugeSize / 2;
                            const gaugeCy = gaugeSize / 2;
                            const gaugeCirc = 2 * Math.PI * gaugeR;
                            const gaugeFill = (score / 100) * gaugeCirc;

                            return (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {/* Row 1: New UI Dashboard */}
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-9 gap-[10px]"
                                        style={{ alignItems: "stretch" }}
                                    >
                                        {/* Card 1: Profile */}
                                        <div
                                            className="xl:col-span-2"
                                            style={{
                                                background: "#fff",
                                                borderRadius: 12,
                                                padding: "16px 20px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 16,
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                border: "1px solid #f1f5f9",
                                            }}
                                        >
                                            <div
                                                style={{ flex: 1, minWidth: 0 }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: 800,
                                                        color: "#1e293b",
                                                        marginBottom: 4,
                                                        textTransform:
                                                            "uppercase",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {salesProfile?.name ||
                                                        "NAMA SALES"}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#64748b",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        marginBottom: 2,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        Kode Sales :
                                                    </span>{" "}
                                                    {salesProfile?.code || "-"}
                                                    <span
                                                        style={{
                                                            background:
                                                                "#ecfdf5",
                                                            color: "#10b981",
                                                            padding: "2px 6px",
                                                            borderRadius: 4,
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        Aktif
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#64748b",
                                                        marginBottom: 2,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Area Utama :
                                                    </span>{" "}
                                                    {salesProfile?.cabang?.area
                                                        ?.name ||
                                                        salesProfile?.cabang
                                                            ?.nama_cabang ||
                                                        "-"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 2: Sales Score */}
                                        <div
                                            style={{
                                                background: "#1e293b",
                                                borderRadius: 12,
                                                padding: 16,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: -20,
                                                    right: -20,
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: "50%",
                                                    background:
                                                        "rgba(255,255,255,0.05)",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    marginBottom: 4,
                                                    zIndex: 999,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        color: "#94a3b8",
                                                        zIndex: 999,
                                                    }}
                                                >
                                                    SALES SCORE (AI)
                                                </div>
                                                <i
                                                    className="bi bi-info-circle-fill"
                                                    style={{
                                                        cursor: "pointer",
                                                        color: "#94a3b8",
                                                        fontSize: 12,
                                                    }}
                                                    title="Lihat detail skor"
                                                    onClick={() => {
                                                        const htmlContent =
                                                            kpiData?.components
                                                                ? `
                                                            <div style="text-align: left; font-size: 14px;">
                                                                ${kpiData.components
                                                                    .map(
                                                                        (c) => `
                                                                    <div style="margin-bottom: 12px;">
                                                                        <div style="font-weight: 600; color: #334155;">${c.label}: <span style="color: ${c.color}">${c.score}</span></div>
                                                                        <div style="font-size: 12px; color: #64748b;">${c.detail}</div>
                                                                    </div>
                                                                `,
                                                                    )
                                                                    .join("")}
                                                            </div>
                                                        `
                                                                : "Data skor tidak tersedia.";

                                                        Swal.fire({
                                                            title: "Detail Sales Score (AI)",
                                                            html: htmlContent,
                                                            icon: "info",
                                                            confirmButtonText:
                                                                "Tutup",
                                                        });
                                                    }}
                                                ></i>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "baseline",
                                                    gap: 4,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 24,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    {kpiData?.totalScore || 0}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: "#64748b",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    / 100
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 2,
                                                    margin: "6px 0",
                                                    color: "#f59e0b",
                                                    fontSize: 12,
                                                }}
                                            >
                                                <i className="bi bi-star-fill"></i>
                                                <i className="bi bi-star-fill"></i>
                                                <i className="bi bi-star-fill"></i>
                                                <i className="bi bi-star-fill"></i>
                                                <i className="bi bi-star-fill"></i>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    color: "#cbd5e1",
                                                }}
                                            >
                                                {kpiData?.grade || "-"}
                                            </div>
                                        </div>

                                        {/* Card 3: Achievement Target */}
                                        <div
                                            style={{
                                                background: "#10b981",
                                                borderRadius: 12,
                                                padding: 16,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                ACHIEVEMENT TARGET
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 24,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {insights?.totalRencanaJualTargetYear >
                                                0
                                                    ? (
                                                          (insights?.totalRealisasiTargetYear /
                                                              insights?.totalRencanaJualTargetYear) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0}
                                                %
                                            </div>
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: 1,
                                                    background:
                                                        "rgba(255,255,255,0.2)",
                                                    margin: "4px 0",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    fontSize: 9,
                                                    color: "rgba(255,255,255,0.9)",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                <span>
                                                    Realisasi{" "}
                                                    <strong>
                                                        {insights?.totalRealisasiTargetYear?.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </strong>
                                                </span>
                                                <span>
                                                    Target{" "}
                                                    <strong>
                                                        {insights?.totalRencanaJualTargetYear?.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card 4: Realisasi */}
                                        <div
                                            style={{
                                                background: "#3b82f6",
                                                borderRadius: 12,
                                                padding: 16,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                            }}
                                        >
                                            <i
                                                className="bi bi-bar-chart-fill"
                                                style={{
                                                    position: "absolute",
                                                    right: 12,
                                                    top: 12,
                                                    fontSize: 20,
                                                    color: "rgba(255,255,255,0.2)",
                                                }}
                                            ></i>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.8)",
                                                    marginBottom: 4,
                                                }}
                                            >
                                                REALISASI (Tahun{" "}
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}
                                                )
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {insights?.totalRealisasiTargetYear?.toLocaleString(
                                                    "id-ID",
                                                ) || 0}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                Eksemplar
                                            </div>
                                        </div>

                                        {/* Card 4b: Realisasi Growth */}
                                        <div
                                            style={{
                                                background: "#10b981", // Emerald green
                                                borderRadius: 12,
                                                padding: 16,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                            }}
                                        >
                                            <i
                                                className="bi bi-graph-up-arrow"
                                                style={{
                                                    position: "absolute",
                                                    right: 12,
                                                    top: 12,
                                                    fontSize: 20,
                                                    color: "rgba(255,255,255,0.2)",
                                                }}
                                            ></i>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.8)",
                                                    marginBottom: 4,
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                GAP REALISASI (
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}{" "}
                                                VS{" "}
                                                {(insights?.targetYear ||
                                                    new Date().getFullYear()) -
                                                    1}
                                                )
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {(insights?.totalRealisasiTargetYear ??
                                                    0) -
                                                    (insights?.totalRealisasiLaluTargetYear ??
                                                        0) >
                                                0
                                                    ? "+"
                                                    : ""}
                                                {(
                                                    (insights?.totalRealisasiTargetYear ??
                                                        0) -
                                                    (insights?.totalRealisasiLaluTargetYear ??
                                                        0)
                                                ).toLocaleString("id-ID")}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                Eksemplar &nbsp;&bull;&nbsp;
                                                Tahun lalu:{" "}
                                                {(
                                                    insights?.totalRealisasiLaluTargetYear ??
                                                    0
                                                ).toLocaleString("id-ID")}
                                            </div>
                                        </div>

                                        {/* Card 5: Rencana Jual */}
                                        <div
                                            style={{
                                                background: "#f59e0b",
                                                borderRadius: 12,
                                                padding: 16,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                            }}
                                        >
                                            <i
                                                className="bi bi-journal-text"
                                                style={{
                                                    position: "absolute",
                                                    right: 12,
                                                    top: 12,
                                                    fontSize: 20,
                                                    color: "rgba(255,255,255,0.2)",
                                                }}
                                            ></i>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.8)",
                                                    marginBottom: 4,
                                                }}
                                            >
                                                RENCANA JUAL (Tahun{" "}
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}
                                                )
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {insights?.totalRencanaJualTargetYear?.toLocaleString(
                                                    "id-ID",
                                                ) || 0}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                Eksemplar
                                            </div>
                                        </div>

                                        {/* Card 6: Area Cover */}
                                        <div
                                            style={{
                                                background: "#8b5cf6",
                                                borderRadius: 12,
                                                padding: 16,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                            }}
                                        >
                                            <i
                                                className="bi bi-geo-alt-fill"
                                                style={{
                                                    position: "absolute",
                                                    right: 12,
                                                    top: 12,
                                                    fontSize: 20,
                                                    color: "rgba(255,255,255,0.2)",
                                                }}
                                            ></i>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.8)",
                                                    marginBottom: 4,
                                                }}
                                            >
                                                AREA COVER (AC{" "}
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}
                                                )
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {insights?.totalAreaCover?.toLocaleString(
                                                    "id-ID",
                                                ) || 0}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                Customer
                                            </div>
                                        </div>

                                        {/* Card 7: Customer Realisasi */}
                                        <div
                                            style={{
                                                background: "#0ea5e9",
                                                borderRadius: 12,
                                                padding: 16,
                                                color: "white",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                            }}
                                        >
                                            <i
                                                className="bi bi-people-fill"
                                                style={{
                                                    position: "absolute",
                                                    right: 12,
                                                    top: 12,
                                                    fontSize: 20,
                                                    color: "rgba(255,255,255,0.2)",
                                                }}
                                            ></i>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.8)",
                                                    marginBottom: 4,
                                                }}
                                            >
                                                CUSTOMER REALISASI (Tahun{" "}
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}
                                                )
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {insights?.customerWithRealisasi?.toLocaleString(
                                                    "id-ID",
                                                ) || 0}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.8)",
                                                }}
                                            >
                                                Customer
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 2: Grafik Kunjungan & Distribusi Aktivitas */}
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[10px]"
                                        style={{
                                            marginTop: 10,
                                            alignItems: "stretch",
                                        }}
                                    >
                                        {/* Column 3: Grafik Kunjungan */}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            {monthlyActivities.length > 0 && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "center",
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 8,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    borderRadius: 6,
                                                                    background:
                                                                        "#e0e7ff",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                            >
                                                                <i
                                                                    className="bi bi-bar-chart-fill"
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: "#4f46e5",
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        color: T.text,
                                                                    }}
                                                                >
                                                                    Grafik
                                                                    Kunjungan
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 9.5,
                                                                        color: T.slate,
                                                                        marginTop: 1,
                                                                    }}
                                                                >
                                                                    Tren
                                                                    kunjungan
                                                                    (aktivitas
                                                                    sales)
                                                                    bulanan di
                                                                    tahun{" "}
                                                                    {kpiData.year ||
                                                                        new Date().getFullYear()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                color: "#4f46e5",
                                                            }}
                                                        >
                                                            Total:{" "}
                                                            {monthlyActivities.reduce(
                                                                (a, m) =>
                                                                    a + m.count,
                                                                0,
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding:
                                                                "14px 16px 10px",
                                                            display: "flex",
                                                            alignItems:
                                                                "flex-end",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        {monthlyActivities.map(
                                                            (m, i) => {
                                                                const barH =
                                                                    maxActivity >
                                                                    0
                                                                        ? Math.max(
                                                                              (m.count /
                                                                                  maxActivity) *
                                                                                  60,
                                                                              m.count >
                                                                                  0
                                                                                  ? 6
                                                                                  : 2,
                                                                          )
                                                                        : 2;
                                                                const isCurrentMonth =
                                                                    i ===
                                                                    new Date().getMonth();
                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 4,
                                                                            group: "hover",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontSize: 9.5,
                                                                                fontWeight: 800,
                                                                                color:
                                                                                    m.count >
                                                                                    0
                                                                                        ? isCurrentMonth
                                                                                            ? "#4f46e5"
                                                                                            : T.text
                                                                                        : T.slate,
                                                                            }}
                                                                        >
                                                                            {m.count >
                                                                            0
                                                                                ? m.count
                                                                                : ""}
                                                                        </span>
                                                                        <div
                                                                            style={{
                                                                                width: "100%",
                                                                                maxWidth: 28,
                                                                                height: barH,
                                                                                borderRadius:
                                                                                    "4px 4px 0 0",
                                                                                background:
                                                                                    isCurrentMonth
                                                                                        ? "linear-gradient(180deg, #4f46e5, #818cf8)"
                                                                                        : m.count >
                                                                                            0
                                                                                          ? "linear-gradient(180deg, #3b82f6, #93c5fd)"
                                                                                          : "#f1f5f9",
                                                                                transition:
                                                                                    "height 0.6s ease, filter 0.2s",
                                                                                cursor: "default",
                                                                            }}
                                                                            onMouseEnter={(
                                                                                e,
                                                                            ) =>
                                                                                (e.currentTarget.style.filter =
                                                                                    "brightness(1.1)")
                                                                            }
                                                                            onMouseLeave={(
                                                                                e,
                                                                            ) =>
                                                                                (e.currentTarget.style.filter =
                                                                                    "brightness(1)")
                                                                            }
                                                                        />
                                                                        <span
                                                                            style={{
                                                                                fontSize: 9,
                                                                                color: isCurrentMonth
                                                                                    ? "#4f46e5"
                                                                                    : T.slate,
                                                                                fontWeight:
                                                                                    isCurrentMonth
                                                                                        ? 700
                                                                                        : 500,
                                                                                paddingTop: 2,
                                                                                borderTop:
                                                                                    isCurrentMonth
                                                                                        ? "2px solid #4f46e5"
                                                                                        : "2px solid transparent",
                                                                            }}
                                                                        >
                                                                            {
                                                                                m.month
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 4: Distribusi Aktivitas */}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            {/* Distribusi Aktivitas */}
                                            {kpiData.activityDistribution !==
                                                undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#ecfdf5",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-pie-chart-fill"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#10b981",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Distribusi
                                                                Aktivitas
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Berdasarkan
                                                                jenis aktivitas
                                                                sales
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const hasData =
                                                                kpiData
                                                                    .activityDistribution
                                                                    .length > 0;
                                                            const segments =
                                                                hasData
                                                                    ? kpiData.activityDistribution
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];
                                                            const total =
                                                                hasData
                                                                    ? kpiData.activityDistribution.reduce(
                                                                          (
                                                                              a,
                                                                              c,
                                                                          ) =>
                                                                              a +
                                                                              c.value,
                                                                          0,
                                                                      )
                                                                    : 0;

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            segments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {hasData ? (
                                                                            kpiData.activityDistribution.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data
                                                                                aktivitas.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 5: Segmen Sekolah (Negeri/Swasta) */}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            {kpiData.segmenSekolah !==
                                                undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#eff6ff",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-bank"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#3b82f6",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Segmen Sekolah
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Negeri vs Swasta
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const segments =
                                                                kpiData.segmenSekolah;
                                                            const total =
                                                                segments.reduce(
                                                                    (a, c) =>
                                                                        a +
                                                                        c.value,
                                                                    0,
                                                                );
                                                            const validSegments =
                                                                total > 0
                                                                    ? segments
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            validSegments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {total >
                                                                        0 ? (
                                                                            segments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data
                                                                                sekolah.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 6: Sumber Dana (Komposisi Anggaran) */}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            {kpiData.sumberDana !==
                                                undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#fef3c7",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-wallet2"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#d97706",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Sumber Dana
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Komposisi
                                                                Anggaran
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const segments =
                                                                kpiData.sumberDana;
                                                            const total =
                                                                segments.reduce(
                                                                    (a, c) =>
                                                                        a +
                                                                        c.value,
                                                                    0,
                                                                );
                                                            const validSegments =
                                                                total > 0
                                                                    ? segments
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            validSegments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {total >
                                                                        0 ? (
                                                                            segments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data
                                                                                sekolah.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: TRLG & TRLG Per Jenjang & Customer Status & Distribusi Customer */}
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            flexWrap: "wrap",
                                            marginTop: 10,
                                        }}
                                    >
                                        {/* Column 1: Tahan - Rebut - Lepas - Gagal */}
                                        {kpiData.trlg && (
                                            <div
                                                style={{
                                                    ...S.card,
                                                    padding: "4px 6px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 6,
                                                    flex: 1.2,
                                                    minWidth: 220,
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
                                                        Tahan – Rebut – Lepas
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9.5,
                                                            color: T.slate,
                                                            marginTop: 2,
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        ({kpiData.salesName})
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(2, 1fr)",
                                                        gap: 4,
                                                        borderTop: `1px solid ${T.border}`,
                                                        paddingTop: 6,
                                                    }}
                                                >
                                                    {[
                                                        {
                                                            key: "tahan",
                                                            label: "TAHAN",
                                                            color: "#10b981",
                                                            bg: "#ecfdf5",
                                                            icon: "bi-shield-check",
                                                            data: kpiData.trlg
                                                                .tahan,
                                                        },
                                                        {
                                                            key: "rebut",
                                                            label: "REBUT",
                                                            color: "#3b82f6",
                                                            bg: "#eff6ff",
                                                            icon: "bi-arrow-repeat",
                                                            data: kpiData.trlg
                                                                .rebut,
                                                        },
                                                        {
                                                            key: "lepas",
                                                            label: "LEPAS",
                                                            color: "#f59e0b",
                                                            bg: "#fffbeb",
                                                            icon: "bi-box-arrow-right",
                                                            data: kpiData.trlg
                                                                .lepas,
                                                        },
                                                    ].map((item) => (
                                                        <div
                                                            key={item.key}
                                                            style={{
                                                                border: `1px solid ${item.bg}`,
                                                                borderRadius: 6,
                                                                padding:
                                                                    "4px 6px",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 8,
                                                                background:
                                                                    "#ffffff",
                                                            }}
                                                        >
                                                            <i
                                                                className={`bi ${item.icon}`}
                                                                style={{
                                                                    fontSize: 14,
                                                                    color: item.color,
                                                                }}
                                                            />
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 8.5,
                                                                        fontWeight: 700,
                                                                        color: item.color,
                                                                        letterSpacing:
                                                                            "0.5px",
                                                                    }}
                                                                >
                                                                    {item.label}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        fontWeight: 800,
                                                                        color: item.color,
                                                                        lineHeight: 1.1,
                                                                        marginTop: 2,
                                                                    }}
                                                                >
                                                                    {
                                                                        item
                                                                            .data
                                                                            .count
                                                                    }
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 8,
                                                                        color: item.color,
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {item.data.pct
                                                                        .toFixed(
                                                                            2,
                                                                        )
                                                                        .replace(
                                                                            ".",
                                                                            ",",
                                                                        )}
                                                                    %
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Column 2: Tahan - Rebut - Lepas - Gagal (Per Jenjang) */}
                                        {kpiData.trlgPerJenjang &&
                                            kpiData.trlgPerJenjang.length >
                                                0 && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        flex: 1.2,
                                                        minWidth: 220,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "12px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            background:
                                                                "#ffffff",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                color: T.text,
                                                            }}
                                                        >
                                                            Tahan - Rebut -
                                                            Lepas (Per Jenjang)
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            overflowX: "auto",
                                                        }}
                                                    >
                                                        <table
                                                            style={{
                                                                width: "100%",
                                                                borderCollapse:
                                                                    "collapse",
                                                                textAlign:
                                                                    "left",
                                                                fontSize: 10,
                                                            }}
                                                        >
                                                            <thead>
                                                                <tr
                                                                    style={{
                                                                        background:
                                                                            "#f8fafc",
                                                                        borderBottom: `2px solid ${T.border}`,
                                                                    }}
                                                                >
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        JENJANG
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        TAHAN
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        REBUT
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        LEPAS
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {kpiData.trlgPerJenjang.map(
                                                                    (
                                                                        row,
                                                                        idx,
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            style={{
                                                                                borderBottom: `1px solid ${T.border}`,
                                                                            }}
                                                                        >
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    fontWeight: 700,
                                                                                    color: T.text,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.jenjang
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    color: "#10b981",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.tahan
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    color: "#3b82f6",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.rebut
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    color: "#f59e0b",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.lepas
                                                                                }
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                        {/* Column 3: Customer Status (Baru vs Loss) */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                minWidth: 140,
                                            }}
                                        >
                                            {kpiData.customerStatus !==
                                                undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#fef2f2",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-people-fill"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#ef4444",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Customer Status
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Baru vs Retain
                                                                vs Loss
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const segments =
                                                                kpiData.customerStatus;
                                                            const total =
                                                                segments.reduce(
                                                                    (a, c) =>
                                                                        a +
                                                                        c.value,
                                                                    0,
                                                                );
                                                            const validSegments =
                                                                total > 0
                                                                    ? segments
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            validSegments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {total >
                                                                        0 ? (
                                                                            segments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data
                                                                                realisasi.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 4: Distribusi Customer (Jenjang) */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                minWidth: 140,
                                            }}
                                        >
                                            {jenjangBreakdown !== undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#f0fdf4",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-buildings"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#16a34a",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Distribusi
                                                                Customer
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Berdasarkan
                                                                Jenjang
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const segments =
                                                                jenjangBreakdown ||
                                                                [];
                                                            const total =
                                                                segments.reduce(
                                                                    (a, c) =>
                                                                        a +
                                                                        c.value,
                                                                    0,
                                                                );
                                                            const validSegments =
                                                                total > 0
                                                                    ? segments
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            validSegments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {total >
                                                                        0 ? (
                                                                            segments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data
                                                                                sekolah.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 5: Jumlah Siswa (Potensi Market) */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                minWidth: 140,
                                            }}
                                        >
                                            {kpiData.potensiSiswa !==
                                                undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#ffe4e6",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-people-fill"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#f43f5e",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Jumlah Siswa
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Potensi Market
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const segments =
                                                                kpiData.potensiSiswa;
                                                            const total =
                                                                segments.reduce(
                                                                    (a, c) =>
                                                                        a +
                                                                        c.value,
                                                                    0,
                                                                );
                                                            const validSegments =
                                                                total > 0
                                                                    ? segments
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            validSegments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {total >
                                                                        0 ? (
                                                                            segments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Column 7: Map Competitor (Peta Pesaing) */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                minWidth: 140,
                                            }}
                                        >
                                            {kpiData.competitorMap !==
                                                undefined && (
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "10px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            background:
                                                                "#f8fafc",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#fef2f2",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-map-fill"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#ef4444",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Competitor
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Peta Pesaing
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 12,
                                                        }}
                                                    >
                                                        {(() => {
                                                            const segments =
                                                                kpiData.competitorMap;
                                                            const total =
                                                                segments.reduce(
                                                                    (a, c) =>
                                                                        a +
                                                                        c.value,
                                                                    0,
                                                                );
                                                            const validSegments =
                                                                total > 0
                                                                    ? segments
                                                                    : [
                                                                          {
                                                                              label: "Belum Ada",
                                                                              value: 1,
                                                                              color: "#e2e8f0",
                                                                          },
                                                                      ];

                                                            return (
                                                                <>
                                                                    <Donut
                                                                        segments={
                                                                            validSegments
                                                                        }
                                                                        size={
                                                                            70
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            total
                                                                        }
                                                                        sub="Total"
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 6,
                                                                            maxHeight: 90,
                                                                            overflowY:
                                                                                "auto",
                                                                            paddingRight: 4,
                                                                        }}
                                                                    >
                                                                        {total >
                                                                        0 ? (
                                                                            segments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 6,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                width: 8,
                                                                                                height: 8,
                                                                                                borderRadius: 2,
                                                                                                background:
                                                                                                    item.color,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.text,
                                                                                                fontWeight: 500,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9.5,
                                                                                                color: T.slate,
                                                                                                marginLeft:
                                                                                                    "auto",
                                                                                                fontWeight: 700,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.value
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 10,
                                                                                    color: T.slate,
                                                                                    fontStyle:
                                                                                        "italic",
                                                                                }}
                                                                            >
                                                                                Belum
                                                                                ada
                                                                                data.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 3: Priority Schools */}
                                    {kpiData.prioritySchools &&
                                        kpiData.prioritySchools.length > 0 && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    marginTop: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        flex: 1,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "12px 14px",
                                                            borderBottom: `1px solid ${T.border}`,
                                                            background:
                                                                "#ffffff",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                background:
                                                                    "#fef3c7",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                            }}
                                                        >
                                                            <i
                                                                className="bi bi-star-fill"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: "#f59e0b",
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                Top 10 Priority
                                                                School
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                Sekolah
                                                                Prioritas
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            overflowX: "auto",
                                                        }}
                                                    >
                                                        <table
                                                            style={{
                                                                width: "100%",
                                                                borderCollapse:
                                                                    "collapse",
                                                                textAlign:
                                                                    "left",
                                                                fontSize: 10,
                                                            }}
                                                        >
                                                            <thead>
                                                                <tr
                                                                    style={{
                                                                        background:
                                                                            "#f8fafc",
                                                                        borderBottom: `2px solid ${T.border}`,
                                                                    }}
                                                                >
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                            width: 40,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        NO
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        NAMA
                                                                        SEKOLAH
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        JENJANG
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        STATUS
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                            textAlign:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        GRADE
                                                                    </th>
                                                                    <th
                                                                        style={{
                                                                            padding:
                                                                                "4px 6px",
                                                                            color: T.slate,
                                                                            fontWeight: 700,
                                                                            textAlign:
                                                                                "right",
                                                                        }}
                                                                    >
                                                                        JUMLAH
                                                                        SISWA
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {kpiData.prioritySchools.map(
                                                                    (
                                                                        row,
                                                                        idx,
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            style={{
                                                                                borderBottom: `1px solid ${T.border}`,
                                                                            }}
                                                                        >
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    color: T.slate,
                                                                                }}
                                                                            >
                                                                                {idx +
                                                                                    1}
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    fontWeight: 700,
                                                                                    color: T.text,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.name
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    color: T.slate,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.jenjang
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                }}
                                                                            >
                                                                                <span
                                                                                    style={{
                                                                                        padding:
                                                                                            "2px 6px",
                                                                                        borderRadius: 4,
                                                                                        fontSize: 9,
                                                                                        fontWeight: 600,
                                                                                        background:
                                                                                            row.status ===
                                                                                            "Customer"
                                                                                                ? "#dcfce7"
                                                                                                : "#f1f5f9",
                                                                                        color:
                                                                                            row.status ===
                                                                                            "Customer"
                                                                                                ? "#16a34a"
                                                                                                : "#64748b",
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        row.status
                                                                                    }
                                                                                </span>
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    fontWeight: 700,
                                                                                    color:
                                                                                        row.grade ===
                                                                                        "A"
                                                                                            ? "#10b981"
                                                                                            : row.grade ===
                                                                                                "B"
                                                                                              ? "#3b82f6"
                                                                                              : row.grade ===
                                                                                                  "C"
                                                                                                ? "#f59e0b"
                                                                                                : T.slate,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.grade
                                                                                }
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 700,
                                                                                    color: T.text,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    row.siswa
                                                                                }
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* Row 4: Map Competitor */}
                                    <div style={{ marginTop: 10 }}>
                                        <div
                                            style={{
                                                ...S.card,
                                                padding: 0,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: "12px 14px",
                                                    borderBottom: `1px solid ${T.border}`,
                                                    background: "#ffffff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: 6,
                                                        background: "#eff6ff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <i
                                                        className="bi bi-geo-alt-fill"
                                                        style={{
                                                            fontSize: 12,
                                                            color: "#3b82f6",
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 700,
                                                            color: T.text,
                                                        }}
                                                    >
                                                        Persebaran Kompetitor
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9.5,
                                                            color: T.slate,
                                                            marginTop: 1,
                                                        }}
                                                    >
                                                        Peta Leaflet Dominasi
                                                        Kompetitor per Kecamatan
                                                    </div>
                                                </div>
                                            </div>
                                            <CompetitorChoroplethMap
                                                salesId={
                                                    filters?.sales_id ||
                                                    spFilterData?.sales_id
                                                }
                                                cabangId={cabangCode}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })(showScoreInfo, setShowScoreInfo)}
                </>
            )}
        </>
    );
}
