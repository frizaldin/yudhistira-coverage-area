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
    PrioritySchoolsCard,
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import Swal from "sweetalert2";

function gradeRangeDescription(item) {
    const grade = item?.label || "-";
    const range = item?.range || "-";
    if (grade === "A+") {
        return `Grade A+ untuk sekolah dengan total siswa ${range} (melebihi max Grade A).`;
    }
    return `Grade ${grade} untuk sekolah dengan total siswa ${range} siswa.`;
}

function GradeBarRow({ item, onClick }) {
    const [hover, setHover] = useState(false);
    const pctAc = Math.min(100, Math.max(0, Number(item.pct) || 0));
    const pctTotal = Math.min(
        100,
        Math.max(0, Number(item.pct_total ?? item.pct) || 0),
    );
    const ticks = [0, 20, 40, 60, 80, 100];
    const bars = [
        {
            key: "ac",
            label: "Real vs AC",
            pct: pctAc,
            color: "#10b981",
            den: Number(item.area_cover || 0),
            denLabel: "AC",
        },
        {
            key: "total",
            label: "Real vs Total",
            pct: pctTotal,
            color: "#ef4444",
            den: Number(item.total_sekolah || item.area_cover || 0),
            denLabel: "Total",
        },
    ];

    return (
        <div
            onClick={() => onClick?.(item)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                display: "grid",
                gridTemplateColumns: "40px minmax(0, 1fr)",
                gap: 8,
                alignItems: "center",
                cursor: "pointer",
                position: "relative",
                borderRadius: 6,
                padding: "4px 0",
                background: hover ? "#f8fafc" : "transparent",
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                    paddingRight: 2,
                }}
            >
                {item.label}
            </div>
            <div style={{ position: "relative", minWidth: 0 }}>
                {ticks.map((t) => (
                    <div
                        key={t}
                        style={{
                            position: "absolute",
                            left: `${t}%`,
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: t === 0 ? "#cbd5e1" : "#e2e8f0",
                            transform: "translateX(-0.5px)",
                            pointerEvents: "none",
                        }}
                    />
                ))}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        padding: "2px 0",
                    }}
                >
                    {bars.map((b) => (
                        <div
                            key={b.key}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                height: 12,
                            }}
                        >
                            <div
                                style={{
                                    width: `${b.pct}%`,
                                    height: 10,
                                    background: b.color,
                                    borderRadius: "2px 3px 3px 2px",
                                    transition: "width 0.35s ease",
                                    flexShrink: 0,
                                    minWidth: b.pct > 0 ? 3 : 0,
                                    backgroundImage:
                                        "repeating-linear-gradient(135deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 5px)",
                                }}
                            />
                            <span
                                style={{
                                    marginLeft: 6,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: "#0f172a",
                                    fontVariantNumeric: "tabular-nums",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {b.pct.toLocaleString("id-ID", {
                                    maximumFractionDigits: 1,
                                })}
                                %
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {hover && (
                <div
                    style={{
                        position: "absolute",
                        left: 44,
                        bottom: "calc(100% + 4px)",
                        zIndex: 30,
                        minWidth: 220,
                        maxWidth: 300,
                        padding: "8px 10px",
                        background: "#0f172a",
                        color: "#f8fafc",
                        borderRadius: 8,
                        boxShadow: "0 8px 20px rgba(15,23,42,0.25)",
                        fontSize: 11,
                        lineHeight: 1.4,
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ fontWeight: 800, marginBottom: 3 }}>
                        Grade {item.label}
                    </div>
                    <div style={{ color: "#cbd5e1" }}>
                        {gradeRangeDescription(item)}
                    </div>
                    <div
                        style={{
                            marginTop: 6,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                            fontSize: 10,
                            color: "#94a3b8",
                        }}
                    >
                        <div>
                            Terealisasi{" "}
                            {Number(item.value || 0).toLocaleString("id-ID")}
                        </div>
                        {bars.map((b) => (
                            <div
                                key={b.key}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: b.color,
                                        flexShrink: 0,
                                    }}
                                />
                                <span>
                                    {b.label}:{" "}
                                    {b.pct.toLocaleString("id-ID", {
                                        maximumFractionDigits: 1,
                                    })}
                                    % (
                                    {Number(item.value || 0).toLocaleString(
                                        "id-ID",
                                    )}{" "}
                                    / {b.den.toLocaleString("id-ID")}{" "}
                                    {b.denLabel})
                                </span>
                            </div>
                        ))}
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            left: 12,
                            bottom: -5,
                            width: 10,
                            height: 10,
                            background: "#0f172a",
                            transform: "rotate(45deg)",
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default function DashboardTabArea(props) {
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
        gradeRealisasiBreakdown,
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
        openSekolahFromChart,
        openSekolahFromKecamatanJenjang,
        openSalesByComponent,
        openKecamatanByComponent,
        hideMap = false,
        hideScore = false,
        hideTrlGrade = false,
    } = props;

    const handleSegmenClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        const label = String(item.label).toLowerCase();
        if (label.includes("negeri") || label === "bos") {
            openSekolahFromChart?.({
                type: "segmen",
                value: "negeri",
                label: "Segmen: Negeri (BOS)",
            });
        } else if (label.includes("swasta")) {
            openSekolahFromChart?.({
                type: "segmen",
                value: "swasta",
                label: "Segmen: Swasta",
            });
        }
    };

    const handleSumberDanaClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        openSekolahFromChart?.({
            type: "sumber_dana",
            value: item.label,
            label: `Sumber Dana: ${item.label}`,
        });
    };

    const handleCustomerStatusClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        const label = String(item.label).toLowerCase();
        let value = "";
        if (label.includes("baru") || label.includes("rebut")) value = "baru";
        else if (label.includes("retain") || label.includes("tahan"))
            value = "retain";
        else if (
            label.includes("loss") ||
            label.includes("lepas") ||
            label.includes("belum terealisasi")
        )
            value = "loss";
        if (!value) return;
        openSekolahFromChart?.({
            type: "customer_status",
            value,
            label: `Customer Status: ${item.label}`,
        });
    };

    const handleJenjangClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        openSekolahFromChart?.({
            type: "jenjang",
            value: item.label,
            label: `Jenjang: ${item.label}`,
        });
    };

    const handleGradeRealisasiClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        openSekolahFromChart?.({
            type: "grade_realisasi",
            value: item.label,
            label: `Realisasi Grade ${item.label}`,
        });
    };

    const handlePotensiSiswaClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        openSekolahFromChart?.({
            type: "potensi_siswa",
            value: item.label,
            label: `Jumlah Siswa: ${item.label}`,
        });
    };

    const handlePenerbitClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        openSekolahFromChart?.({
            type: "penerbit",
            value: item.label,
            label: `Competitor: ${item.label}`,
        });
    };

    const clickableLegendProps = (onClick, item) => ({
        onClick: () => onClick(item),
        title: "Klik untuk lihat daftar sekolah",
        style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            borderRadius: 4,
            padding: "1px 2px",
        },
        onMouseEnter: (e) => {
            e.currentTarget.style.background = "#f1f5f9";
        },
        onMouseLeave: (e) => {
            e.currentTarget.style.background = "transparent";
        },
    });

    return (
        <>
            {activeTab === "dashboard" && (
                <>
                    {/* ── KPI SCORE DASHBOARD ── */}
                    {isSalesDetail &&
                        kpiData.totalScore !== undefined &&
                        ((showScoreInfo, setShowScoreInfo) => {
                            const score = kpiData.totalScore || 0;
                            const grade = kpiData.grade || "Buruk";
                            const gradeColor =
                                score >= 80
                                    ? "#10b981"
                                    : score >= 60
                                      ? "#3b82f6"
                                      : score >= 40
                                        ? "#f59e0b"
                                        : score >= 20
                                          ? "#ea580c"
                                          : "#ef4444";
                            const gradeColorBg =
                                score >= 80
                                    ? "#ecfdf5"
                                    : score >= 60
                                      ? "#eff6ff"
                                      : score >= 40
                                        ? "#fffbeb"
                                        : score >= 20
                                          ? "#fff7ed"
                                          : "#fef2f2";
                            const components = kpiData.components || [];

                            const showProduktivitas =
                                Number(salesProfile?.total_sales) > 0;
                            const kpiCardCols =
                                (hideScore ? 4 : 5) +
                                (kpiData?.totalSekolahCabang !== undefined
                                    ? 1
                                    : 0) +
                                (kpiData?.totalSekolahBos !== undefined
                                    ? 1
                                    : 0) +
                                (showProduktivitas ? 1 : 0);

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
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: `repeat(${kpiCardCols}, minmax(0, 1fr))`,
                                            gap: 10,
                                            alignItems: "stretch",
                                        }}
                                    >
                                        {/* Card 1: Profile */}
                                        <div
                                            style={{
                                                background: "#fff",
                                                borderRadius: 12,
                                                padding: "12px 16px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 14,
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                border: "1px solid #f1f5f9",
                                            }}
                                        >
                                            {salesProfile?.profile_type !==
                                                "cabang" &&
                                                salesProfile?.profile_type !==
                                                    "area" && (
                                                <div
                                                    style={{
                                                        width: 72,
                                                        height: 88,
                                                        borderRadius: 10,
                                                        background: "#e2e8f0",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        flexShrink: 0,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {salesProfile?.photo ||
                                                    salesProfile?.foto ? (
                                                        <img
                                                            src={
                                                                salesProfile.photo ||
                                                                salesProfile.foto
                                                            }
                                                            alt={
                                                                salesProfile?.name ||
                                                                "Sales"
                                                            }
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    ) : (
                                                        <i
                                                            className="bi bi-person-fill"
                                                            style={{
                                                                fontSize: 42,
                                                                color: "#94a3b8",
                                                                lineHeight: 1,
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
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
                                                {salesProfile?.profile_type ===
                                                "area" ? (
                                                    <>
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                color: "#64748b",
                                                                marginBottom: 2,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Jumlah Sales :
                                                            </span>{" "}
                                                            {Number(
                                                                salesProfile?.total_sales ||
                                                                    0,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                color: "#64748b",
                                                                marginBottom: 2,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Jumlah Cabang :
                                                            </span>{" "}
                                                            {Number(
                                                                salesProfile?.total_cabang ||
                                                                    0,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div
                                                            style={{
                                                                fontSize: 11,
                                                                color: "#64748b",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
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
                                                                {salesProfile?.profile_type ===
                                                                "cabang"
                                                                    ? "Total Sales :"
                                                                    : "Kode Sales :"}
                                                            </span>{" "}
                                                            {salesProfile?.profile_type ===
                                                            "cabang"
                                                                ? Number(
                                                                      salesProfile?.total_sales ||
                                                                          0,
                                                                  ).toLocaleString(
                                                                      "id-ID",
                                                                  )
                                                                : salesProfile?.code ||
                                                                  "-"}
                                                            <span
                                                                style={{
                                                                    background:
                                                                        "#ecfdf5",
                                                                    color: "#059669",
                                                                    padding:
                                                                        "2px 8px",
                                                                    borderRadius: 999,
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
                                                                whiteSpace:
                                                                    "nowrap",
                                                                overflow:
                                                                    "hidden",
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
                                                            {salesProfile?.cabang
                                                                ?.area?.name ||
                                                                salesProfile
                                                                    ?.cabang
                                                                    ?.nama_cabang ||
                                                                "-"}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card 2: Sales Score */}
                                        {!hideScore && (
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
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            color: "#94a3b8",
                                                            zIndex: 999,
                                                            letterSpacing:
                                                                "0.02em",
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
                                                            const renderItem = (
                                                                c,
                                                            ) => {
                                                                const isPenalty =
                                                                    !!c.is_penalty;
                                                                const scoreLabel =
                                                                    isPenalty
                                                                        ? `−${c.score}`
                                                                        : `${c.score}`;
                                                                const badge =
                                                                    isPenalty
                                                                        ? `<span style="margin-left:6px;font-size:9px;font-weight:700;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 5px;">PENGURANG</span>`
                                                                        : "";
                                                                return `
                                                            <div style="padding: 10px 12px; background: ${isPenalty ? "#fef2f2" : "#f8fafc"}; border: 1px solid ${isPenalty ? "#fecaca" : "#e2e8f0"}; border-radius: 10px;">
                                                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                                                                    <div style="font-weight: 700; color: #334155; font-size: 12px;">${c.label} <span style="color:#64748b; font-weight:600; font-size:11px;">(${Number(c.weight ?? 0).toFixed(2)}%)</span>${badge}</div>
                                                                    <div style="font-weight: 800; color: ${c.color || "#334155"}; font-size: 15px;">${scoreLabel}</div>
                                                                </div>
                                                                <div style="height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-bottom: 6px;">
                                                                    <div style="height: 100%; width: ${Math.min(100, Math.max(0, Number(c.score) || 0))}%; background: ${c.color || "#3b82f6"}; border-radius: 99px;"></div>
                                                                </div>
                                                                <div style="font-size: 11px; color: #64748b; line-height: 1.35;">${c.detail || ""}</div>
                                                            </div>
                                                        `;
                                                            };

                                                            const main = (
                                                                kpiData?.components ||
                                                                []
                                                            )
                                                                .map(renderItem)
                                                                .join("");

                                                            const comps =
                                                                kpiData?.components ||
                                                                [];
                                                            const weightSum =
                                                                comps
                                                                    .filter(
                                                                        (c) =>
                                                                            !c.is_penalty,
                                                                    )
                                                                    .reduce(
                                                                        (
                                                                            a,
                                                                            c,
                                                                        ) =>
                                                                            a +
                                                                            (Number(
                                                                                c.weight,
                                                                            ) ||
                                                                                0),
                                                                        0,
                                                                    );
                                                            const lepasWeight =
                                                                comps
                                                                    .filter(
                                                                        (c) =>
                                                                            !!c.is_penalty,
                                                                    )
                                                                    .reduce(
                                                                        (
                                                                            a,
                                                                            c,
                                                                        ) =>
                                                                            a +
                                                                            (Number(
                                                                                c.weight,
                                                                            ) ||
                                                                                0),
                                                                        0,
                                                                    );
                                                            const formulaParts =
                                                                comps
                                                                    .map((c) =>
                                                                        c.is_penalty
                                                                            ? `−(${c.score}×${Number(c.weight || 0).toFixed(2)}%÷100)`
                                                                            : `(${c.score}×${Number(c.weight || 0).toFixed(2)}%)`,
                                                                    )
                                                                    .join(" ");

                                                            const htmlContent =
                                                                main
                                                                    ? `
                                                            <div style="text-align: left;">
                                                                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom: 8px;">
                                                                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;">Indikator Penilaian (bobot custom)</div>
                                                                    <div style="font-size: 10px; color: #64748b; text-align:right;">5 positif: ${weightSum.toFixed(2)}%<br/><span style="color:#b91c1c;">Lepas eksternal: ${lepasWeight.toFixed(2)}%</span></div>
                                                                    </div>
                                                                <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px;">
                                                                    ${main}
                                                                </div>
                                                                <div style="padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; font-size: 12px; color: #1e3a8a;">
                                                                    <strong>Total Score:</strong> ${kpiData?.totalScore ?? 0} / 100 · <strong>${kpiData?.grade ?? "-"}</strong>
                                                                    <span style="display:block; margin-top: 4px; color:#334155; font-size: 11.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
                                                                        Rata-rata berbobot 5 indikator (100%), lalu dikurangi Lepas eksternal · = ${kpiData?.totalScore ?? 0}
                                                                    </span>
                                                                    <span style="display:block; margin-top: 2px; color:#64748b; font-size: 10.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
                                                                        ${formulaParts || "—"}
                                                                    </span>
                                                                    <span style="display:block; margin-top: 3px; color:#64748b; font-size: 11px;">Bobot 5 indikator + Lepas eksternal bisa diubah di menu Pengaturan (level nasional).</span>
                                                                </div>
                                                            </div>
                                                        `
                                                                    : "Data skor tidak tersedia.";

                                                            Swal.fire({
                                                                title: "Detail Sales Score (AI)",
                                                                html: htmlContent,
                                                                icon: "info",
                                                                width: 900,
                                                                showCancelButton: true,
                                                                confirmButtonText:
                                                                    "Tutup",
                                                                cancelButtonText:
                                                                    "Atur Bobot",
                                                                reverseButtons: true,
                                                            }).then(
                                                                (result) => {
                                                                    if (
                                                                        result.dismiss ===
                                                                        Swal
                                                                            .DismissReason
                                                                            .cancel
                                                                    ) {
                                                                        router.visit(
                                                                            route(
                                                                                "monitoring.pengaturan",
                                                                            ),
                                                                        );
                                                                    }
                                                                },
                                                            );
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
                                                            fontSize: 17,
                                                            fontWeight: 800,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                            lineHeight: 1.15,
                                                        }}
                                                    >
                                                        {kpiData?.totalScore ||
                                                            0}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 9,
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
                                                        margin: "4px 0",
                                                        color: "#f59e0b",
                                                        fontSize: 10,
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
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        color: "#cbd5e1",
                                                    }}
                                                >
                                                    {kpiData?.grade || "-"}
                                                </div>
                                            </div>
                                        )}

                                        {/* Card 2b: Total Sekolah (Cabang — dari master kecamatan) */}
                                        {kpiData?.totalSekolahCabang !==
                                            undefined && (
                                            <div
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                                                    borderRadius: 12,
                                                    padding: "12px 14px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    boxShadow:
                                                        "0 1px 3px rgba(0,0,0,0.05)",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                    gap: 6,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: -16,
                                                        right: -16,
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: "50%",
                                                        background:
                                                            "rgba(255,255,255,0.08)",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: "rgba(255,255,255,0.85)",
                                                        letterSpacing: "0.02em",
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    TOTAL SEKOLAH
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 17,
                                                        fontWeight: 800,
                                                        lineHeight: 1.15,
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {(
                                                        kpiData.totalSekolahCabang ||
                                                        0
                                                    ).toLocaleString("id-ID")}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        color: "rgba(255,255,255,0.85)",
                                                    }}
                                                >
                                                    dari{" "}
                                                    {(
                                                        kpiData.totalKecamatanCabang ||
                                                        0
                                                    ).toLocaleString(
                                                        "id-ID",
                                                    )}{" "}
                                                    kecamatan
                                                </div>
                                            </div>
                                        )}

                                        {/* Card 2c: Total Sekolah BOS */}
                                        {kpiData?.totalSekolahBos !==
                                            undefined && (
                                            <div
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                                                    borderRadius: 12,
                                                    padding: "12px 14px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                    color: "#fff",
                                                    boxShadow:
                                                        "0 1px 3px rgba(0,0,0,0.05)",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                    gap: 6,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: -16,
                                                        right: -16,
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: "50%",
                                                        background:
                                                            "rgba(255,255,255,0.08)",
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: "rgba(255,255,255,0.85)",
                                                        letterSpacing: "0.02em",
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    TOTAL SEKOLAH BOS
                                                </div>
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "1fr 1fr",
                                                        gap: 10,
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 17,
                                                                    fontWeight: 800,
                                                                    lineHeight: 1.15,
                                                                    fontVariantNumeric:
                                                                        "tabular-nums",
                                                                }}
                                                            >
                                                                {(
                                                                    kpiData.totalSekolahBos ||
                                                                    0
                                                                ).toLocaleString(
                                                                    "id-ID",
                                                                )}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9,
                                                                    color: "rgba(255,255,255,0.85)",
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                Sekolah
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 17,
                                                                    fontWeight: 800,
                                                                    lineHeight: 1.15,
                                                                    fontVariantNumeric:
                                                                        "tabular-nums",
                                                                }}
                                                            >
                                                                {(
                                                                    kpiData.totalSiswaBos ||
                                                                    0
                                                                ).toLocaleString(
                                                                    "id-ID",
                                                                )}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9,
                                                                    color: "rgba(255,255,255,0.85)",
                                                                    marginTop: 2,
                                                                }}
                                                            >
                                                                Siswa
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            borderLeft:
                                                                "1px solid rgba(255,255,255,0.25)",
                                                            paddingLeft: 10,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 17,
                                                                fontWeight: 800,
                                                                lineHeight: 1.15,
                                                                fontVariantNumeric:
                                                                    "tabular-nums",
                                                            }}
                                                        >
                                                            {(
                                                                kpiData.potensiBos ||
                                                                0
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 9,
                                                                color: "rgba(255,255,255,0.85)",
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            Potensi (×1.5)
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Card 3: Area Cover + Rencana Jual (tanpa Potensi di Sales Performance) */}
                                        <div
                                            onClick={() =>
                                                openSekolahFromChart?.({
                                                    type: "area_cover",
                                                    value: "1",
                                                    label: `Area Cover ${insights?.targetYear || new Date().getFullYear()}`,
                                                })
                                            }
                                            title="Klik untuk lihat daftar sekolah Area Cover"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 55%, #f59e0b 160%)",
                                                borderRadius: 12,
                                                padding: "10px 12px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                                gap: 6,
                                                cursor: "pointer",
                                                transition:
                                                    "transform 0.15s ease, box-shadow 0.15s ease",
                                                minWidth: 0,
                                                overflow: "hidden",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform =
                                                    "translateY(-1px)";
                                                e.currentTarget.style.boxShadow =
                                                    "0 4px 12px rgba(124,58,237,0.35)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform =
                                                    "none";
                                                e.currentTarget.style.boxShadow =
                                                    "0 1px 3px rgba(0,0,0,0.05)";
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.85)",
                                                    letterSpacing: "0.02em",
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                AREA COVER & POTENSI · AC{" "}
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                }}
                                            >
                                                {[
                                                    {
                                                        label: "Customer AC",
                                                        value:
                                                            insights?.totalAreaCover ||
                                                            0,
                                                    },
                                                    {
                                                        label:
                                                            kpiData?.potensiAcBos !==
                                                            undefined
                                                                ? "Potensi (×1.5)"
                                                                : "Potensi",
                                                        value:
                                                            kpiData?.potensiAcBos !==
                                                            undefined
                                                                ? kpiData.potensiAcBos
                                                                : insights?.totalPotensiEksemplar ||
                                                                  0,
                                                    },
                                                    {
                                                        label: "Rencana Jual",
                                                        value:
                                                            insights?.totalRencanaJualTargetYear ||
                                                            0,
                                                    },
                                                ].map((row, idx) => (
                                                    <div
                                                        key={row.label}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "baseline",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: 8,
                                                            paddingTop:
                                                                idx === 0
                                                                    ? 0
                                                                    : 4,
                                                            borderTop:
                                                                idx === 0
                                                                    ? "none"
                                                                    : "1px solid rgba(255,255,255,0.18)",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 9,
                                                                fontWeight: 600,
                                                                color: "rgba(255,255,255,0.85)",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {row.label}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 14,
                                                                fontWeight: 800,
                                                                lineHeight: 1.1,
                                                                fontVariantNumeric:
                                                                    "tabular-nums",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                letterSpacing:
                                                                    "-0.02em",
                                                            }}
                                                        >
                                                            {Number(
                                                                row.value || 0,
                                                            ).toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Card 4: Realisasi Sekolah + Eksemplar */}
                                        <div
                                            onClick={() =>
                                                openSekolahFromChart?.({
                                                    type: "realisasi",
                                                    value: "current",
                                                    label: `Realisasi ${insights?.targetYear || new Date().getFullYear()}`,
                                                })
                                            }
                                            title="Klik untuk lihat sekolah yang sudah terealisasi"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #3b82f6 160%)",
                                                borderRadius: 12,
                                                padding: "12px 14px",
                                                color: "white",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                position: "relative",
                                                gap: 6,
                                                cursor: "pointer",
                                                transition:
                                                    "transform 0.15s ease, box-shadow 0.15s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform =
                                                    "translateY(-1px)";
                                                e.currentTarget.style.boxShadow =
                                                    "0 4px 12px rgba(14,165,233,0.35)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform =
                                                    "none";
                                                e.currentTarget.style.boxShadow =
                                                    "0 1px 3px rgba(0,0,0,0.05)";
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.85)",
                                                    letterSpacing: "0.02em",
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                REALISASI · Tahun{" "}
                                                {insights?.targetYear ||
                                                    new Date().getFullYear()}
                                            </div>
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1fr 1fr",
                                                    gap: 10,
                                                    alignItems: "end",
                                                }}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 17,
                                                            fontWeight: 800,
                                                            lineHeight: 1.15,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {insights?.customerWithRealisasi?.toLocaleString(
                                                            "id-ID",
                                                        ) || 0}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            color: "rgba(255,255,255,0.85)",
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        Sekolah
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 8,
                                                            marginTop: 3,
                                                            lineHeight: 1.3,
                                                            visibility:
                                                                "hidden",
                                                        }}
                                                    >
                                                        —
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        borderLeft:
                                                            "1px solid rgba(255,255,255,0.25)",
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 17,
                                                            fontWeight: 800,
                                                            lineHeight: 1.15,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {insights?.totalRealisasiTargetYear?.toLocaleString(
                                                            "id-ID",
                                                        ) || 0}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            color: "rgba(255,255,255,0.85)",
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        Eksemplar
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 8,
                                                            marginTop: 3,
                                                            lineHeight: 1.3,
                                                            visibility:
                                                                "hidden",
                                                        }}
                                                    >
                                                        —
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 5: Achievement Eksemplar + Area Cover */}
                                        <div
                                            onClick={() =>
                                                openSekolahFromChart?.({
                                                    type: "realisasi",
                                                    value: "current",
                                                    label: `Realisasi ${insights?.targetYear || new Date().getFullYear()} (Achievement)`,
                                                })
                                            }
                                            title="Klik untuk lihat sekolah yang sudah terealisasi"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #059669 0%, #10b981 55%, #34d399 160%)",
                                                borderRadius: 12,
                                                padding: "12px 14px",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                color: "#fff",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                gap: 6,
                                                cursor: "pointer",
                                                transition:
                                                    "transform 0.15s ease, box-shadow 0.15s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform =
                                                    "translateY(-1px)";
                                                e.currentTarget.style.boxShadow =
                                                    "0 4px 12px rgba(16,185,129,0.35)";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform =
                                                    "none";
                                                e.currentTarget.style.boxShadow =
                                                    "0 1px 3px rgba(0,0,0,0.05)";
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    color: "rgba(255,255,255,0.85)",
                                                    letterSpacing: "0.02em",
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                ACHIEVEMENT TARGET
                                            </div>
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                        "1fr 1fr",
                                                    gap: 10,
                                                    alignItems: "end",
                                                }}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 17,
                                                            fontWeight: 800,
                                                            lineHeight: 1.15,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
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
                                                            fontSize: 9,
                                                            color: "rgba(255,255,255,0.85)",
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        Eksemplar
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 8,
                                                            color: "rgba(255,255,255,0.75)",
                                                            marginTop: 3,
                                                            lineHeight: 1.3,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {(
                                                            insights?.totalRealisasiTargetYear ||
                                                            0
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}{" "}
                                                        /{" "}
                                                        {(
                                                            insights?.totalRencanaJualTargetYear ||
                                                            0
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        borderLeft:
                                                            "1px solid rgba(255,255,255,0.25)",
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 17,
                                                            fontWeight: 800,
                                                            lineHeight: 1.15,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {insights?.totalAreaCover >
                                                        0
                                                            ? (
                                                                  ((insights?.customerWithRealisasi ||
                                                                      0) /
                                                                      insights?.totalAreaCover) *
                                                                  100
                                                              ).toFixed(1)
                                                            : 0}
                                                        %
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            color: "rgba(255,255,255,0.85)",
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        Area Cover
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 8,
                                                            color: "rgba(255,255,255,0.75)",
                                                            marginTop: 3,
                                                            lineHeight: 1.3,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {(
                                                            insights?.customerWithRealisasi ||
                                                            0
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}{" "}
                                                        /{" "}
                                                        {(
                                                            insights?.totalAreaCover ||
                                                            0
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}{" "}
                                                        AC
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 6: Produktivitas Sales */}
                                        {showProduktivitas &&
                                            (() => {
                                                const salesCount = Number(
                                                    salesProfile.total_sales,
                                                );
                                                const realisasi = Number(
                                                    insights?.totalRealisasiTargetYear ||
                                                        0,
                                                );
                                                const produktivitas = Math.ceil(
                                                    realisasi / salesCount,
                                                );
                                                return (
                                                    <div
                                                        title="Produktivitas Sales = Total Realisasi ÷ Total Sales"
                                                        style={{
                                                            background:
                                                                "linear-gradient(135deg, #047857 0%, #059669 55%, #34d399 160%)",
                                                            borderRadius: 12,
                                                            padding:
                                                                "12px 14px",
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            justifyContent:
                                                                "center",
                                                            color: "#fff",
                                                            boxShadow:
                                                                "0 1px 3px rgba(0,0,0,0.05)",
                                                            gap: 6,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 9,
                                                                fontWeight: 700,
                                                                color: "rgba(255,255,255,0.85)",
                                                                letterSpacing:
                                                                    "0.02em",
                                                                lineHeight: 1.2,
                                                            }}
                                                        >
                                                            PRODUKTIVITAS SALES
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 17,
                                                                fontWeight: 800,
                                                                lineHeight: 1.15,
                                                                fontVariantNumeric:
                                                                    "tabular-nums",
                                                            }}
                                                        >
                                                            {produktivitas.toLocaleString(
                                                                "id-ID",
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 9,
                                                                color: "rgba(255,255,255,0.85)",
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            Realisasi ÷{" "}
                                                            {salesCount.toLocaleString(
                                                                "id-ID",
                                                            )}{" "}
                                                            sales
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                    </div>

                                    {/* Row 1b: Ringkasan Dana BOS */}
                                    {kpiData?.bosRingkasan && (
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "repeat(5, minmax(0, 1fr))",
                                                gap: 10,
                                                alignItems: "stretch",
                                            }}
                                        >
                                            {[
                                                {
                                                    key: "sumber_dana",
                                                    label: "Sumber Dana",
                                                    value: kpiData.bosRingkasan
                                                        .sumber_dana,
                                                    sub:
                                                        Array.isArray(
                                                            kpiData.bosRingkasan
                                                                .sumber_dana_labels,
                                                        ) &&
                                                        kpiData.bosRingkasan
                                                            .sumber_dana_labels
                                                            .length > 0
                                                            ? kpiData.bosRingkasan.sumber_dana_labels
                                                                  .slice(0, 3)
                                                                  .join(", ")
                                                            : "Jenis sumber dana",
                                                    bg: "linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)",
                                                },
                                                {
                                                    key: "salesman",
                                                    label: "Salesman",
                                                    value: kpiData.bosRingkasan
                                                        .salesman,
                                                    sub: "Sales aktif terhubung",
                                                    bg: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                                                },
                                                {
                                                    key: "jenjang",
                                                    label: "Jenjang",
                                                    value: kpiData.bosRingkasan
                                                        .jenjang,
                                                    sub: "Jenjang sekolah",
                                                    bg: "linear-gradient(135deg, #c2410c 0%, #f59e0b 100%)",
                                                },
                                                {
                                                    key: "kecamatan",
                                                    label: "Kecamatan",
                                                    value: kpiData.bosRingkasan
                                                        .kecamatan,
                                                    sub: "Wilayah kecamatan",
                                                    bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                                                },
                                                {
                                                    key: "jumlah_sekolah",
                                                    label: "Jumlah Sekolah",
                                                    value: kpiData.bosRingkasan
                                                        .jumlah_sekolah,
                                                    sub: "Sekolah sumber dana BOS",
                                                    bg: "linear-gradient(135deg, #047857 0%, #10b981 100%)",
                                                },
                                            ].map((card) => (
                                                <div
                                                    key={card.key}
                                                    style={{
                                                        background: card.bg,
                                                        borderRadius: 12,
                                                        padding: "12px 14px",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent:
                                                            "center",
                                                        color: "#fff",
                                                        boxShadow:
                                                            "0 1px 3px rgba(0,0,0,0.05)",
                                                        gap: 4,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            color: "rgba(255,255,255,0.85)",
                                                            letterSpacing:
                                                                "0.02em",
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        {card.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 17,
                                                            fontWeight: 800,
                                                            lineHeight: 1.15,
                                                            fontVariantNumeric:
                                                                "tabular-nums",
                                                        }}
                                                    >
                                                        {Number(
                                                            card.value || 0,
                                                        ).toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            color: "rgba(255,255,255,0.85)",
                                                            whiteSpace:
                                                                "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                        }}
                                                        title={card.sub}
                                                    >
                                                        {card.sub}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Row 2: Insight cards — 2 kolom × 2 baris */}
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 gap-[10px]"
                                        style={{
                                            marginTop: 10,
                                            alignItems: "stretch",
                                        }}
                                    >
                                        {(() => {
                                            const cardShell = {
                                                background: "#fff",
                                                borderRadius: 10,
                                                padding: "10px 12px",
                                                boxShadow:
                                                    "0 1px 3px rgba(0,0,0,0.05)",
                                                border: "1px solid #f1f5f9",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                                minHeight: 0,
                                                height: "100%",
                                            };
                                            const titleStyle = {
                                                fontSize: 9,
                                                fontWeight: 700,
                                                color: "#64748b",
                                                letterSpacing: "0.04em",
                                                textTransform: "uppercase",
                                            };
                                            const subStyle = {
                                                fontSize: 9,
                                                color: "#94a3b8",
                                                marginTop: 1,
                                            };
                                            const thStyle = {
                                                fontSize: 8,
                                                fontWeight: 700,
                                                color: "#94a3b8",
                                                padding: "2px 3px",
                                                textAlign: "right",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.02em",
                                                whiteSpace: "nowrap",
                                            };
                                            const tdStyle = {
                                                padding: "3px 3px",
                                                borderTop: "1px solid #f1f5f9",
                                                fontSize: 9.5,
                                            };
                                            const fmtN = (n) =>
                                                Number(n || 0).toLocaleString(
                                                    "id-ID",
                                                );
                                            const metricHead = (
                                                spLabel,
                                                realLabel,
                                                terLabel = "Terealisasi",
                                            ) => (
                                                <>
                                                    <th style={thStyle}>AC</th>
                                                    <th style={thStyle}>
                                                        Sales
                                                    </th>
                                                    <th style={thStyle}>Kec</th>
                                                    <th style={thStyle}>
                                                        {terLabel}
                                                    </th>
                                                    <th style={thStyle}>
                                                        {spLabel}
                                                    </th>
                                                    <th style={thStyle}>
                                                        {realLabel}
                                                    </th>
                                                </>
                                            );
                                            const metricCells = (
                                                item,
                                                {
                                                    acKey = "value",
                                                    terKey = "sekolah_realisasi",
                                                    spKey = "sp",
                                                    realKey = "realisasi",
                                                    componentType = "jenjang",
                                                    componentValueKey = "label",
                                                    componentLabelPrefix = "",
                                                } = {},
                                            ) => {
                                                const compValue =
                                                    item[componentValueKey] ||
                                                    item.label ||
                                                    item.jenjang;
                                                const compFilter = {
                                                    type: componentType,
                                                    value: compValue,
                                                    label: `${componentLabelPrefix || componentType}: ${compValue}`,
                                                };
                                                const clickableTd = (
                                                    value,
                                                    onClick,
                                                    title,
                                                    color = T.blue,
                                                ) => (
                                                    <td
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onClick?.(
                                                                compFilter,
                                                            );
                                                        }}
                                                        title={title}
                                                        style={{
                                                            ...tdStyle,
                                                            textAlign: "right",
                                                            fontWeight: 700,
                                                            color,
                                                            cursor: "pointer",
                                                            textDecoration:
                                                                "underline",
                                                            textUnderlineOffset: 2,
                                                        }}
                                                    >
                                                        {fmtN(value)}
                                                    </td>
                                                );
                                                const openTerealisasiSekolah =
                                                    () => {
                                                        if (
                                                            componentType ===
                                                            "grade"
                                                        ) {
                                                            openSekolahFromChart?.(
                                                                {
                                                                    type: "grade_realisasi",
                                                                    value: compValue,
                                                                    label: `Realisasi Grade ${compValue}`,
                                                                },
                                                            );
                                                            return;
                                                        }
                                                        if (
                                                            componentType ===
                                                            "jenjang"
                                                        ) {
                                                            openSekolahFromChart?.(
                                                                {
                                                                    type: "jenjang",
                                                                    value: compValue,
                                                                    label: `Jenjang: ${compValue}`,
                                                                },
                                                            );
                                                            return;
                                                        }
                                                        if (
                                                            componentType ===
                                                            "sumber_dana"
                                                        ) {
                                                            openSekolahFromChart?.(
                                                                {
                                                                    type: "sumber_dana",
                                                                    value: compValue,
                                                                    label: `Sumber Dana: ${compValue}`,
                                                                },
                                                            );
                                                        }
                                                    };
                                                return (
                                                    <>
                                                        <td
                                                            style={{
                                                                ...tdStyle,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 700,
                                                                color: "#0f172a",
                                                            }}
                                                        >
                                                            {fmtN(item[acKey])}
                                                        </td>
                                                        {clickableTd(
                                                            item.sales_count,
                                                            openSalesByComponent,
                                                            `Lihat sales untuk ${compFilter.label}`,
                                                        )}
                                                        {clickableTd(
                                                            item.kecamatan_count,
                                                            openKecamatanByComponent,
                                                            `Lihat kecamatan untuk ${compFilter.label}`,
                                                        )}
                                                        {openSekolahFromChart ? (
                                                            clickableTd(
                                                                item[terKey],
                                                                openTerealisasiSekolah,
                                                                `Lihat sekolah terealisasi untuk ${compFilter.label}`,
                                                                "#059669",
                                                            )
                                                        ) : (
                                                            <td
                                                                style={{
                                                                    ...tdStyle,
                                                                    textAlign:
                                                                        "right",
                                                                    fontWeight: 700,
                                                                    color: "#059669",
                                                                }}
                                                            >
                                                                {fmtN(
                                                                    item[
                                                                        terKey
                                                                    ],
                                                                )}
                                                            </td>
                                                        )}
                                                        <td
                                                            style={{
                                                                ...tdStyle,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 700,
                                                                color: "#d97706",
                                                            }}
                                                        >
                                                            {fmtN(item[spKey])}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...tdStyle,
                                                                textAlign:
                                                                    "right",
                                                                fontWeight: 700,
                                                                color: "#2563eb",
                                                            }}
                                                        >
                                                            {fmtN(
                                                                item[realKey],
                                                            )}
                                                        </td>
                                                    </>
                                                );
                                            };

                                            const jenjangSegments =
                                                kpiData.identifikasiJenjang ||
                                                kpiData.segmenSekolah ||
                                                [];
                                            const jenjangYear =
                                                kpiData.year ||
                                                salesPerformanceFilters?.tahun ||
                                                filters?.tahun ||
                                                new Date().getFullYear();
                                            const jenjangTotal =
                                                jenjangSegments.reduce(
                                                    (a, c) =>
                                                        a +
                                                        (Number(c.value) || 0),
                                                    0,
                                                );
                                            const jenjangReal =
                                                jenjangSegments.reduce(
                                                    (a, c) =>
                                                        a +
                                                        (Number(c.realisasi) ||
                                                            0),
                                                    0,
                                                );

                                            const sumberSegments =
                                                kpiData.sumberDana || [];
                                            const sumberTotal =
                                                sumberSegments.reduce(
                                                    (a, c) =>
                                                        a +
                                                        (Number(c.value) || 0),
                                                    0,
                                                );

                                            const gradeSegments =
                                                gradeRealisasiBreakdown?.length
                                                    ? gradeRealisasiBreakdown
                                                    : kpiData.gradeRealisasi ||
                                                      [];
                                            const gradeAcTotal =
                                                gradeSegments.reduce(
                                                    (a, c) =>
                                                        a +
                                                        (Number(c.area_cover) ||
                                                            0),
                                                    0,
                                                );
                                            const gradeTotalSekolah =
                                                gradeSegments.reduce(
                                                    (a, c) =>
                                                        a +
                                                        (Number(
                                                            c.total_sekolah,
                                                        ) ||
                                                            Number(
                                                                c.area_cover,
                                                            ) ||
                                                            0),
                                                    0,
                                                );
                                            const gradeRealTotal =
                                                gradeSegments.reduce(
                                                    (a, c) =>
                                                        a +
                                                        (Number(c.value) || 0),
                                                    0,
                                                );

                                            const trlg = kpiData.trlg;
                                            const trlgSegments = trlg
                                                ? [
                                                      {
                                                          label: "Tahan",
                                                          value:
                                                              trlg.tahan
                                                                  ?.count || 0,
                                                          pct:
                                                              trlg.tahan?.pct ||
                                                              0,
                                                          color: "#10b981",
                                                      },
                                                      {
                                                          label: "Rebut",
                                                          value:
                                                              trlg.rebut
                                                                  ?.count || 0,
                                                          pct:
                                                              trlg.rebut?.pct ||
                                                              0,
                                                          color: "#3b82f6",
                                                      },
                                                      {
                                                          label: "Belum Terealisasi",
                                                          value:
                                                              trlg.lepas
                                                                  ?.count || 0,
                                                          pct:
                                                              trlg.lepas?.pct ||
                                                              0,
                                                          color: "#94a3b8",
                                                      },
                                                  ]
                                                : [];
                                            const trlgTotal =
                                                trlg?.total ||
                                                trlgSegments.reduce(
                                                    (a, c) => a + c.value,
                                                    0,
                                                );

                                            return (
                                                <>
                                                    {/* Identifikasi Jenjang */}
                                                    <div style={cardShell}>
                                                        <div>
                                                            <div
                                                                style={
                                                                    titleStyle
                                                                }
                                                            >
                                                                Jenjang
                                                            </div>
                                                            <div
                                                                style={subStyle}
                                                            >
                                                                Area Cover &
                                                                realisasi
                                                                eksemplar ·
                                                                Total{" "}
                                                                {jenjangTotal.toLocaleString(
                                                                    "id-ID",
                                                                )}{" "}
                                                                AC
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 10,
                                                                alignItems:
                                                                    "center",
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 2,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <Donut
                                                                    segments={
                                                                        jenjangTotal >
                                                                        0
                                                                            ? jenjangSegments
                                                                            : [
                                                                                  {
                                                                                      label: "Belum Ada",
                                                                                      value: 1,
                                                                                      color: "#e2e8f0",
                                                                                  },
                                                                              ]
                                                                    }
                                                                    size={78}
                                                                    ring={12}
                                                                    label={
                                                                        jenjangTotal
                                                                    }
                                                                    sub="AC"
                                                                    onSegmentClick={
                                                                        handleJenjangClick
                                                                    }
                                                                />
                                                                <div
                                                                    style={{
                                                                        fontSize: 9,
                                                                        color: "#64748b",
                                                                    }}
                                                                >
                                                                    Realisasi{" "}
                                                                    <strong
                                                                        style={{
                                                                            color: "#0f172a",
                                                                        }}
                                                                    >
                                                                        {jenjangReal.toLocaleString(
                                                                            "id-ID",
                                                                        )}
                                                                    </strong>
                                                                </div>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                {jenjangTotal >
                                                                0 ? (
                                                                    <table
                                                                        style={{
                                                                            width: "100%",
                                                                            borderCollapse:
                                                                                "collapse",
                                                                        }}
                                                                    >
                                                                        <thead>
                                                                            <tr>
                                                                                <th
                                                                                    style={{
                                                                                        ...thStyle,
                                                                                        textAlign:
                                                                                            "left",
                                                                                    }}
                                                                                >
                                                                                    Jenjang
                                                                                </th>
                                                                                {metricHead(
                                                                                    `SP ${jenjangYear}`,
                                                                                    `Real ${jenjangYear}`,
                                                                                )}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {jenjangSegments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <tr
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleJenjangClick(
                                                                                                item,
                                                                                            )
                                                                                        }
                                                                                        title="Klik untuk lihat daftar sekolah"
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                        }}
                                                                                        onMouseEnter={(
                                                                                            e,
                                                                                        ) =>
                                                                                            (e.currentTarget.style.background =
                                                                                                "#f8fafc")
                                                                                        }
                                                                                        onMouseLeave={(
                                                                                            e,
                                                                                        ) =>
                                                                                            (e.currentTarget.style.background =
                                                                                                "transparent")
                                                                                        }
                                                                                    >
                                                                                        <td
                                                                                            style={{
                                                                                                ...tdStyle,
                                                                                                fontWeight: 700,
                                                                                                color: "#0f172a",
                                                                                            }}
                                                                                        >
                                                                                            <span
                                                                                                style={{
                                                                                                    display:
                                                                                                        "inline-flex",
                                                                                                    alignItems:
                                                                                                        "center",
                                                                                                    gap: 7,
                                                                                                }}
                                                                                            >
                                                                                                <span
                                                                                                    style={{
                                                                                                        width: 8,
                                                                                                        height: 8,
                                                                                                        borderRadius: 99,
                                                                                                        background:
                                                                                                            item.color,
                                                                                                    }}
                                                                                                />
                                                                                                {
                                                                                                    item.label
                                                                                                }
                                                                                            </span>
                                                                                        </td>
                                                                                        {metricCells(
                                                                                            item,
                                                                                            {
                                                                                                componentType:
                                                                                                    "jenjang",
                                                                                                componentLabelPrefix:
                                                                                                    "Jenjang",
                                                                                            },
                                                                                        )}
                                                                                    </tr>
                                                                                ),
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 11,
                                                                            color: "#94a3b8",
                                                                            fontStyle:
                                                                                "italic",
                                                                        }}
                                                                    >
                                                                        Belum
                                                                        ada data
                                                                        AC.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sumber Dana */}
                                                    <div style={cardShell}>
                                                        <div>
                                                            <div
                                                                style={
                                                                    titleStyle
                                                                }
                                                            >
                                                                Sumber Dana
                                                            </div>
                                                            <div
                                                                style={subStyle}
                                                            >
                                                                Area Cover &
                                                                realisasi
                                                                eksemplar ·
                                                                Total{" "}
                                                                {sumberTotal.toLocaleString(
                                                                    "id-ID",
                                                                )}{" "}
                                                                AC
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 10,
                                                                alignItems:
                                                                    "center",
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 2,
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <Donut
                                                                    segments={
                                                                        sumberTotal >
                                                                        0
                                                                            ? sumberSegments
                                                                            : [
                                                                                  {
                                                                                      label: "Belum Ada",
                                                                                      value: 1,
                                                                                      color: "#e2e8f0",
                                                                                  },
                                                                              ]
                                                                    }
                                                                    size={78}
                                                                    ring={12}
                                                                    label={
                                                                        sumberTotal
                                                                    }
                                                                    sub="AC"
                                                                    onSegmentClick={
                                                                        handleSumberDanaClick
                                                                    }
                                                                />
                                                                <div
                                                                    style={{
                                                                        fontSize: 9,
                                                                        color: "#64748b",
                                                                    }}
                                                                >
                                                                    Realisasi{" "}
                                                                    <strong
                                                                        style={{
                                                                            color: "#0f172a",
                                                                        }}
                                                                    >
                                                                        {sumberSegments
                                                                            .reduce(
                                                                                (
                                                                                    a,
                                                                                    c,
                                                                                ) =>
                                                                                    a +
                                                                                    (Number(
                                                                                        c.realisasi,
                                                                                    ) ||
                                                                                        0),
                                                                                0,
                                                                            )
                                                                            .toLocaleString(
                                                                                "id-ID",
                                                                            )}
                                                                    </strong>
                                                                </div>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                {sumberTotal >
                                                                0 ? (
                                                                    <table
                                                                        style={{
                                                                            width: "100%",
                                                                            borderCollapse:
                                                                                "collapse",
                                                                        }}
                                                                    >
                                                                        <thead>
                                                                            <tr>
                                                                                <th
                                                                                    style={{
                                                                                        ...thStyle,
                                                                                        textAlign:
                                                                                            "left",
                                                                                    }}
                                                                                >
                                                                                    Sumber
                                                                                    Dana
                                                                                </th>
                                                                                {metricHead(
                                                                                    `SP ${jenjangYear}`,
                                                                                    `Real ${jenjangYear}`,
                                                                                )}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {sumberSegments.map(
                                                                                (
                                                                                    item,
                                                                                    idx,
                                                                                ) => (
                                                                                    <tr
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleSumberDanaClick(
                                                                                                item,
                                                                                            )
                                                                                        }
                                                                                        title="Klik untuk lihat daftar sekolah"
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                        }}
                                                                                        onMouseEnter={(
                                                                                            e,
                                                                                        ) =>
                                                                                            (e.currentTarget.style.background =
                                                                                                "#f8fafc")
                                                                                        }
                                                                                        onMouseLeave={(
                                                                                            e,
                                                                                        ) =>
                                                                                            (e.currentTarget.style.background =
                                                                                                "transparent")
                                                                                        }
                                                                                    >
                                                                                        <td
                                                                                            style={{
                                                                                                ...tdStyle,
                                                                                                fontWeight: 700,
                                                                                                color: "#0f172a",
                                                                                            }}
                                                                                        >
                                                                                            <span
                                                                                                style={{
                                                                                                    display:
                                                                                                        "inline-flex",
                                                                                                    alignItems:
                                                                                                        "center",
                                                                                                    gap: 7,
                                                                                                }}
                                                                                            >
                                                                                                <span
                                                                                                    style={{
                                                                                                        width: 8,
                                                                                                        height: 8,
                                                                                                        borderRadius: 99,
                                                                                                        background:
                                                                                                            item.color,
                                                                                                    }}
                                                                                                />
                                                                                                {
                                                                                                    item.label
                                                                                                }
                                                                                            </span>
                                                                                        </td>
                                                                                        {metricCells(
                                                                                            item,
                                                                                            {
                                                                                                componentType:
                                                                                                    "sumber_dana",
                                                                                                componentLabelPrefix:
                                                                                                    "Sumber Dana",
                                                                                            },
                                                                                        )}
                                                                                    </tr>
                                                                                ),
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 11,
                                                                            color: "#94a3b8",
                                                                            fontStyle:
                                                                                "italic",
                                                                        }}
                                                                    >
                                                                        Belum
                                                                        ada data
                                                                        AC.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Realisasi per Grade — chart + detail */}
                                                    {!hideTrlGrade && (
                                                        <div style={cardShell}>
                                                            <div>
                                                                <div
                                                                    style={
                                                                        titleStyle
                                                                    }
                                                                >
                                                                    Realisasi
                                                                    per Grade
                                                                </div>
                                                                <div
                                                                    style={
                                                                        subStyle
                                                                    }
                                                                >
                                                                    2 bar:
                                                                    Real÷AC &
                                                                    Real÷Total ·{" "}
                                                                    {
                                                                        jenjangYear
                                                                    }{" "}
                                                                    · Real{" "}
                                                                    {gradeRealTotal.toLocaleString(
                                                                        "id-ID",
                                                                    )}{" "}
                                                                    / AC{" "}
                                                                    {gradeAcTotal.toLocaleString(
                                                                        "id-ID",
                                                                    )}{" "}
                                                                    / Total{" "}
                                                                    {gradeTotalSekolah.toLocaleString(
                                                                        "id-ID",
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: 12,
                                                                        marginTop: 6,
                                                                        flexWrap:
                                                                            "wrap",
                                                                    }}
                                                                >
                                                                    {[
                                                                        {
                                                                            color: "#10b981",
                                                                            label: "Real vs AC",
                                                                        },
                                                                        {
                                                                            color: "#ef4444",
                                                                            label: "Real vs Total Sekolah",
                                                                        },
                                                                    ].map(
                                                                        (l) => (
                                                                            <span
                                                                                key={
                                                                                    l.label
                                                                                }
                                                                                style={{
                                                                                    display:
                                                                                        "inline-flex",
                                                                                    alignItems:
                                                                                        "center",
                                                                                    gap: 5,
                                                                                    fontSize: 10,
                                                                                    fontWeight: 700,
                                                                                    color: "#64748b",
                                                                                }}
                                                                            >
                                                                                <span
                                                                                    style={{
                                                                                        width: 10,
                                                                                        height: 8,
                                                                                        borderRadius: 2,
                                                                                        background:
                                                                                            l.color,
                                                                                    }}
                                                                                />
                                                                                {
                                                                                    l.label
                                                                                }
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {gradeSegments.length >
                                                            0 ? (
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "grid",
                                                                        gridTemplateColumns:
                                                                            "minmax(0, 1fr) minmax(0, 1fr)",
                                                                        gap: 12,
                                                                        alignItems:
                                                                            "start",
                                                                        flex: 1,
                                                                        minWidth: 0,
                                                                    }}
                                                                >
                                                                    {/* Kiri: horizontal bar chart ala referensi */}
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 4,
                                                                            minWidth: 0,
                                                                        }}
                                                                    >
                                                                        {gradeSegments.map(
                                                                            (
                                                                                item,
                                                                            ) => (
                                                                                <GradeBarRow
                                                                                    key={
                                                                                        item.label
                                                                                    }
                                                                                    item={
                                                                                        item
                                                                                    }
                                                                                    onClick={
                                                                                        handleGradeRealisasiClick
                                                                                    }
                                                                                />
                                                                            ),
                                                                        )}
                                                                        {/* Sumbu X */}
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "grid",
                                                                                gridTemplateColumns:
                                                                                    "40px minmax(0, 1fr)",
                                                                                gap: 8,
                                                                                alignItems:
                                                                                    "start",
                                                                            }}
                                                                        >
                                                                            <div />
                                                                            <div
                                                                                style={{
                                                                                    position:
                                                                                        "relative",
                                                                                    height: 16,
                                                                                    marginTop: 2,
                                                                                    borderTop:
                                                                                        "1px solid #cbd5e1",
                                                                                }}
                                                                            >
                                                                                {[
                                                                                    0,
                                                                                    20,
                                                                                    40,
                                                                                    60,
                                                                                    80,
                                                                                    100,
                                                                                ].map(
                                                                                    (
                                                                                        t,
                                                                                    ) => (
                                                                                        <span
                                                                                            key={
                                                                                                t
                                                                                            }
                                                                                            style={{
                                                                                                position:
                                                                                                    "absolute",
                                                                                                left: `${t}%`,
                                                                                                top: 3,
                                                                                                transform:
                                                                                                    t ===
                                                                                                    0
                                                                                                        ? "none"
                                                                                                        : t ===
                                                                                                            100
                                                                                                          ? "translateX(-100%)"
                                                                                                          : "translateX(-50%)",
                                                                                                fontSize: 8,
                                                                                                fontWeight: 700,
                                                                                                color: "#94a3b8",
                                                                                                fontVariantNumeric:
                                                                                                    "tabular-nums",
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                t
                                                                                            }

                                                                                            %
                                                                                        </span>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Kanan: legenda rentang + detail angka */}
                                                                    <div
                                                                        style={{
                                                                            minWidth: 0,
                                                                            borderLeft:
                                                                                "1px solid #f1f5f9",
                                                                            paddingLeft: 10,
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 8,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                flexWrap:
                                                                                    "wrap",
                                                                                gap: 5,
                                                                            }}
                                                                        >
                                                                            {gradeSegments.map(
                                                                                (
                                                                                    item,
                                                                                ) => (
                                                                                    <span
                                                                                        key={`leg-${item.label}`}
                                                                                        title={gradeRangeDescription(
                                                                                            item,
                                                                                        )}
                                                                                        style={{
                                                                                            display:
                                                                                                "inline-flex",
                                                                                            alignItems:
                                                                                                "center",
                                                                                            gap: 4,
                                                                                            padding:
                                                                                                "2px 7px",
                                                                                            borderRadius: 99,
                                                                                            background:
                                                                                                "#f8fafc",
                                                                                            border: `1px solid ${T.border || "#e2e8f0"}`,
                                                                                            fontSize: 9.5,
                                                                                            color: "#475569",
                                                                                            whiteSpace:
                                                                                                "nowrap",
                                                                                        }}
                                                                                    >
                                                                                        <span
                                                                                            style={{
                                                                                                width: 6,
                                                                                                height: 6,
                                                                                                borderRadius:
                                                                                                    "50%",
                                                                                                background:
                                                                                                    item.color ||
                                                                                                    "#64748b",
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        <strong
                                                                                            style={{
                                                                                                color:
                                                                                                    item.color ||
                                                                                                    "#0f172a",
                                                                                                fontWeight: 800,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </strong>
                                                                                        <span
                                                                                            style={{
                                                                                                color: "#94a3b8",
                                                                                            }}
                                                                                        >
                                                                                            {item.range ||
                                                                                                "-"}{" "}
                                                                                            siswa
                                                                                        </span>
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                        <table
                                                                            style={{
                                                                                width: "100%",
                                                                                borderCollapse:
                                                                                    "collapse",
                                                                                tableLayout:
                                                                                    "fixed",
                                                                            }}
                                                                        >
                                                                            <thead>
                                                                                <tr>
                                                                                    <th
                                                                                        style={{
                                                                                            ...thStyle,
                                                                                            textAlign:
                                                                                                "left",
                                                                                        }}
                                                                                    >
                                                                                        Grade
                                                                                    </th>
                                                                                    {metricHead(
                                                                                        "SP",
                                                                                        "Real",
                                                                                    )}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {gradeSegments.map(
                                                                                    (
                                                                                        item,
                                                                                    ) => (
                                                                                        <tr
                                                                                            key={`d-${item.label}`}
                                                                                            onClick={() =>
                                                                                                handleGradeRealisasiClick(
                                                                                                    item,
                                                                                                )
                                                                                            }
                                                                                            title={gradeRangeDescription(
                                                                                                item,
                                                                                            )}
                                                                                            style={{
                                                                                                cursor: "pointer",
                                                                                            }}
                                                                                            onMouseEnter={(
                                                                                                e,
                                                                                            ) =>
                                                                                                (e.currentTarget.style.background =
                                                                                                    "#f8fafc")
                                                                                            }
                                                                                            onMouseLeave={(
                                                                                                e,
                                                                                            ) =>
                                                                                                (e.currentTarget.style.background =
                                                                                                    "transparent")
                                                                                            }
                                                                                        >
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    fontWeight: 800,
                                                                                                    color: "#0f172a",
                                                                                                }}
                                                                                            >
                                                                                                <span
                                                                                                    style={{
                                                                                                        display:
                                                                                                            "inline-flex",
                                                                                                        alignItems:
                                                                                                            "center",
                                                                                                        gap: 5,
                                                                                                    }}
                                                                                                >
                                                                                                    <span
                                                                                                        style={{
                                                                                                            width: 7,
                                                                                                            height: 7,
                                                                                                            borderRadius:
                                                                                                                "50%",
                                                                                                            background:
                                                                                                                item.color ||
                                                                                                                "#64748b",
                                                                                                            flexShrink: 0,
                                                                                                        }}
                                                                                                    />
                                                                                                    {
                                                                                                        item.label
                                                                                                    }
                                                                                                </span>
                                                                                            </td>
                                                                                            {metricCells(
                                                                                                item,
                                                                                                {
                                                                                                    acKey: "area_cover",
                                                                                                    terKey: "value",
                                                                                                    componentType:
                                                                                                        "grade",
                                                                                                    componentLabelPrefix:
                                                                                                        "Grade",
                                                                                                },
                                                                                            )}
                                                                                        </tr>
                                                                                    ),
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        fontSize: 11,
                                                                        color: "#94a3b8",
                                                                        fontStyle:
                                                                            "italic",
                                                                    }}
                                                                >
                                                                    Belum ada
                                                                    data Area
                                                                    Cover per
                                                                    grade.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Tahan – Rebut – Belum Terealisasi */}
                                                    {!hideTrlGrade && trlg && (
                                                        <div style={cardShell}>
                                                            <div>
                                                                <div
                                                                    style={
                                                                        titleStyle
                                                                    }
                                                                >
                                                                    Tahan –
                                                                    Rebut –
                                                                    Belum
                                                                    Terealisasi
                                                                </div>
                                                                <div
                                                                    style={
                                                                        subStyle
                                                                    }
                                                                >
                                                                    (
                                                                    {
                                                                        kpiData.salesName
                                                                    }
                                                                    ) · Total{" "}
                                                                    {trlgTotal}{" "}
                                                                    AC
                                                                </div>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    gridTemplateColumns:
                                                                        kpiData
                                                                            .trlgPerJenjang
                                                                            ?.length >
                                                                        0
                                                                            ? "minmax(180px, auto) minmax(0, 1fr)"
                                                                            : "1fr",
                                                                    gap: 10,
                                                                    alignItems:
                                                                        "center",
                                                                    flex: 1,
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        gap: 10,
                                                                        alignItems:
                                                                            "center",
                                                                        minWidth: 0,
                                                                    }}
                                                                >
                                                                    <Donut
                                                                        segments={
                                                                            trlgTotal >
                                                                            0
                                                                                ? trlgSegments
                                                                                : [
                                                                                      {
                                                                                          label: "Belum Ada",
                                                                                          value: 1,
                                                                                          color: "#e2e8f0",
                                                                                      },
                                                                                  ]
                                                                        }
                                                                        size={
                                                                            78
                                                                        }
                                                                        ring={
                                                                            12
                                                                        }
                                                                        label={
                                                                            trlgTotal
                                                                        }
                                                                        sub="AC"
                                                                        onSegmentClick={
                                                                            handleCustomerStatusClick
                                                                        }
                                                                    />
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 3,
                                                                            minWidth: 90,
                                                                        }}
                                                                    >
                                                                        {trlgSegments.map(
                                                                            (
                                                                                item,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        item.label
                                                                                    }
                                                                                    {...clickableLegendProps(
                                                                                        handleCustomerStatusClick,
                                                                                        item,
                                                                                    )}
                                                                                >
                                                                                    <span
                                                                                        style={{
                                                                                            width: 7,
                                                                                            height: 7,
                                                                                            borderRadius: 99,
                                                                                            background:
                                                                                                item.color,
                                                                                            flexShrink: 0,
                                                                                        }}
                                                                                    />
                                                                                    <div
                                                                                        style={{
                                                                                            flex: 1,
                                                                                        }}
                                                                                    >
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 9,
                                                                                                fontWeight: 700,
                                                                                                color: "#0f172a",
                                                                                                lineHeight: 1.15,
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                item.label
                                                                                            }
                                                                                        </div>
                                                                                        <div
                                                                                            style={{
                                                                                                fontSize: 8,
                                                                                                color: "#64748b",
                                                                                                lineHeight: 1.15,
                                                                                            }}
                                                                                        >
                                                                                            {Number(
                                                                                                item.pct,
                                                                                            )
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
                                                                                    <div
                                                                                        style={{
                                                                                            fontSize: 11,
                                                                                            fontWeight: 800,
                                                                                            color: item.color,
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            item.value
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {kpiData
                                                                    .trlgPerJenjang
                                                                    ?.length >
                                                                    0 && (
                                                                    <div
                                                                        style={{
                                                                            minWidth: 0,
                                                                            borderLeft:
                                                                                "1px solid #f1f5f9",
                                                                            paddingLeft: 10,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                ...titleStyle,
                                                                                marginBottom: 6,
                                                                                fontSize: 9,
                                                                            }}
                                                                        >
                                                                            Per
                                                                            Jenjang
                                                                        </div>
                                                                        <table
                                                                            style={{
                                                                                width: "100%",
                                                                                borderCollapse:
                                                                                    "collapse",
                                                                            }}
                                                                        >
                                                                            <thead>
                                                                                <tr>
                                                                                    <th
                                                                                        style={{
                                                                                            ...thStyle,
                                                                                            textAlign:
                                                                                                "left",
                                                                                        }}
                                                                                    >
                                                                                        Jenjang
                                                                                    </th>
                                                                                    <th
                                                                                        style={
                                                                                            thStyle
                                                                                        }
                                                                                    >
                                                                                        AC
                                                                                    </th>
                                                                                    <th
                                                                                        style={
                                                                                            thStyle
                                                                                        }
                                                                                    >
                                                                                        Sales
                                                                                    </th>
                                                                                    <th
                                                                                        style={
                                                                                            thStyle
                                                                                        }
                                                                                    >
                                                                                        Kec
                                                                                    </th>
                                                                                    <th
                                                                                        style={{
                                                                                            ...thStyle,
                                                                                            color: "#10b981",
                                                                                        }}
                                                                                    >
                                                                                        T
                                                                                    </th>
                                                                                    <th
                                                                                        style={{
                                                                                            ...thStyle,
                                                                                            color: "#3b82f6",
                                                                                        }}
                                                                                    >
                                                                                        R
                                                                                    </th>
                                                                                    <th
                                                                                        style={{
                                                                                            ...thStyle,
                                                                                            color: "#94a3b8",
                                                                                        }}
                                                                                    >
                                                                                        BT
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
                                                                                        >
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    fontWeight: 700,
                                                                                                    color: "#0f172a",
                                                                                                }}
                                                                                            >
                                                                                                {
                                                                                                    row.jenjang
                                                                                                }
                                                                                            </td>
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    textAlign:
                                                                                                        "right",
                                                                                                    fontWeight: 700,
                                                                                                    color: "#0f172a",
                                                                                                }}
                                                                                            >
                                                                                                {fmtN(
                                                                                                    row.ac,
                                                                                                )}
                                                                                            </td>
                                                                                            <td
                                                                                                onClick={(
                                                                                                    e,
                                                                                                ) => {
                                                                                                    e.stopPropagation();
                                                                                                    openSalesByComponent?.(
                                                                                                        {
                                                                                                            type: "jenjang",
                                                                                                            value: row.jenjang,
                                                                                                            label: `Jenjang: ${row.jenjang}`,
                                                                                                        },
                                                                                                    );
                                                                                                }}
                                                                                                title={`Lihat sales untuk Jenjang: ${row.jenjang}`}
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    textAlign:
                                                                                                        "right",
                                                                                                    fontWeight: 700,
                                                                                                    color: T.blue,
                                                                                                    cursor: "pointer",
                                                                                                    textDecoration:
                                                                                                        "underline",
                                                                                                    textUnderlineOffset: 2,
                                                                                                }}
                                                                                            >
                                                                                                {fmtN(
                                                                                                    row.sales_count,
                                                                                                )}
                                                                                            </td>
                                                                                            <td
                                                                                                onClick={(
                                                                                                    e,
                                                                                                ) => {
                                                                                                    e.stopPropagation();
                                                                                                    openKecamatanByComponent?.(
                                                                                                        {
                                                                                                            type: "jenjang",
                                                                                                            value: row.jenjang,
                                                                                                            label: `Jenjang: ${row.jenjang}`,
                                                                                                        },
                                                                                                    );
                                                                                                }}
                                                                                                title={`Lihat kecamatan untuk Jenjang: ${row.jenjang}`}
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    textAlign:
                                                                                                        "right",
                                                                                                    fontWeight: 700,
                                                                                                    color: T.blue,
                                                                                                    cursor: "pointer",
                                                                                                    textDecoration:
                                                                                                        "underline",
                                                                                                    textUnderlineOffset: 2,
                                                                                                }}
                                                                                            >
                                                                                                {fmtN(
                                                                                                    row.kecamatan_count,
                                                                                                )}
                                                                                            </td>
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    textAlign:
                                                                                                        "right",
                                                                                                    color: "#10b981",
                                                                                                    fontWeight: 600,
                                                                                                }}
                                                                                            >
                                                                                                {fmtN(
                                                                                                    row.tahan,
                                                                                                )}
                                                                                            </td>
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    textAlign:
                                                                                                        "right",
                                                                                                    color: "#3b82f6",
                                                                                                    fontWeight: 600,
                                                                                                }}
                                                                                            >
                                                                                                {fmtN(
                                                                                                    row.rebut,
                                                                                                )}
                                                                                            </td>
                                                                                            <td
                                                                                                style={{
                                                                                                    ...tdStyle,
                                                                                                    textAlign:
                                                                                                        "right",
                                                                                                    color: "#94a3b8",
                                                                                                    fontWeight: 600,
                                                                                                }}
                                                                                            >
                                                                                                {fmtN(
                                                                                                    row.lepas,
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ),
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Row 3: Priority School (kiri) + Map Area Cover (kanan) */}
                                    <div
                                        className={
                                            hideMap
                                                ? "grid grid-cols-1 gap-[10px]"
                                                : "grid grid-cols-1 xl:grid-cols-2 gap-[10px]"
                                        }
                                        style={{
                                            marginTop: 10,
                                            alignItems: "stretch",
                                        }}
                                    >
                                        <div
                                            style={{
                                                minWidth: 0,
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <PrioritySchoolsCard
                                                schools={
                                                    kpiData?.prioritySchools ||
                                                    []
                                                }
                                                mode={
                                                    kpiData?.priorityMode ||
                                                    "school"
                                                }
                                                year={
                                                    kpiData?.year ||
                                                    salesPerformanceFilters?.tahun ||
                                                    filters?.tahun ||
                                                    new Date().getFullYear()
                                                }
                                            />
                                        </div>

                                        {/* Map Area Cover */}
                                        {!hideMap && (
                                            <div
                                                style={{
                                                    minWidth: 0,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        ...S.card,
                                                        padding: 0,
                                                        overflow: "hidden",
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        boxShadow:
                                                            "0 1px 3px rgba(0,0,0,0.05)",
                                                        border: "1px solid #f1f5f9",
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
                                                                    "#eff6ff",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
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
                                                                Map Area Cover
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                    marginTop: 1,
                                                                }}
                                                            >
                                                                {cabangCode
                                                                    ? "Share area cover per kecamatan terhadap total AC cabang"
                                                                    : !(
                                                                            filters?.sales_id ||
                                                                            spFilterData?.sales_id
                                                                        ) &&
                                                                        provinceCode
                                                                      ? "Share area cover per kota/kab terhadap total AC"
                                                                      : "Share area cover per kecamatan terhadap total AC"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            flex: 1,
                                                            minHeight: 400,
                                                            height: 400,
                                                        }}
                                                    >
                                                        <CompetitorChoroplethMap
                                                            salesId={
                                                                filters?.sales_id ||
                                                                spFilterData?.sales_id
                                                            }
                                                            cabangId={
                                                                cabangCode
                                                            }
                                                            areaId={
                                                                !cabangCode
                                                                    ? provinceCode
                                                                    : undefined
                                                            }
                                                            level={
                                                                cabangCode ||
                                                                filters?.sales_id ||
                                                                spFilterData?.sales_id
                                                                    ? "kecamatan"
                                                                    : provinceCode
                                                                      ? "kota"
                                                                      : "kecamatan"
                                                            }
                                                            tahun={
                                                                filters?.tahun ||
                                                                insights?.targetYear
                                                            }
                                                            onOpenSekolahByKecamatan={(
                                                                kecamatan,
                                                            ) => {
                                                                const kec =
                                                                    String(
                                                                        kecamatan ||
                                                                            "",
                                                                    )
                                                                        .trim()
                                                                        .toUpperCase();
                                                                if (!kec)
                                                                    return;
                                                                if (
                                                                    typeof openSekolahFromKecamatanJenjang ===
                                                                    "function"
                                                                ) {
                                                                    openSekolahFromKecamatanJenjang(
                                                                        kec,
                                                                        "",
                                                                    );
                                                                    return;
                                                                }
                                                                openSekolahFromChart?.(
                                                                    {
                                                                        type: "kecamatan",
                                                                        value: kec,
                                                                        label: kec,
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })(showScoreInfo, setShowScoreInfo)}
                </>
            )}
        </>
    );
}
