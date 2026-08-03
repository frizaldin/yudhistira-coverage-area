import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Head, router, Link, usePage } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import SelectReact from "@/Components/Element/SelectReact";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds
} from "./Tabs/SalesPerformanceShared";
import DashboardTab from "./Tabs/DashboardTab";
import CompetitorTab from "./Tabs/CompetitorTab";
import KecamatanTab from "./Tabs/KecamatanTab";
import SekolahTab from "./Tabs/SekolahTab";
import KegiatanTab from "./Tabs/KegiatanTab";
import AnalisisTab from "./Tabs/AnalisisTab";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function SalesPerformanceDetail({
    activeNav = "cabang",
    pageTitle = "Dashboard Cabang",
    cabangName = "CABANG",
    areaName = "AREA",
    description = "",
    areas = [],
    cabangs = [],
    selectedCabang = "",
    provinceCode = null,
    cabangCode = null,
    // Data Props
    realStats = {},
    trl = [],
    trlJenjang = [],
    salesPerformance = [],
    rankingKecamatan = [],
    top10Schools = [],
    mapMarkers = [],
    schools = [],
    dana = [],
    jenjang = [],
    trend = [],
    areaCovers = [],
    competitors = [],
    leaderboard = [],
    salesJenjangData = [],
    salesJenjangTotal = "0",
    uncovered = [],
    uncoveredDana = [],
    hideFilters = false,
    backUrl = null,
    isSalesDetail = false,
    timSalesPerformance = [],
    timSalesPerformanceWorst = [],
    listKecamatan = [],
    listSekolah = [],
    kegiatanSales = [],
    visitCoverage = [],
    rencanaJualCoverage = [],
    jenjangBreakdown = [],
    sumberDanaBreakdown = [],
    segmenBreakdown = [],
    siswaBreakdown = [],
    activityBreakdown = [],
    resultBreakdown = [],
    insights = [],
    filterOptions = {},
    filters = {},
    isFromSalesPerformance = false,
    salesPerformanceFilterOptions = {},
    salesPerformanceFilters = {},
    nonCoverSchools = [],
    kpiData = {},
    salesProfile = null,
}) {
    const isCabangScope = activeNav === "cabang";
    const { configuration } = usePage().props;
    const prevYear = configuration?.prev_year || "2025";
    // Filter State
    const [spFilterData, setSpFilterData] = useState({
        area_id: salesPerformanceFilters?.area_id || "",
        cabang_id: salesPerformanceFilters?.cabang_id || "",
        sales_id: salesPerformanceFilters?.sales_id || "",
    });
    const spAvailableCabangs = spFilterData.area_id
        ? (salesPerformanceFilterOptions?.cabangs || []).filter(
              (c) => c.area_id == spFilterData.area_id,
          )
        : salesPerformanceFilterOptions?.cabangs || [];
    const spAvailableSales = spFilterData.cabang_id
        ? (salesPerformanceFilterOptions?.sales || []).filter(
              (s) => s.cabang_id == spFilterData.cabang_id,
          )
        : salesPerformanceFilterOptions?.sales || [];
    const handleSpAreaChange = (val) =>
        setSpFilterData({
            ...spFilterData,
            area_id: val,
            cabang_id: "",
            sales_id: "",
        });
    const handleSpCabangChange = (val) =>
        setSpFilterData({ ...spFilterData, cabang_id: val, sales_id: "" });
    const handleSpSalesChange = (val) =>
        setSpFilterData({ ...spFilterData, sales_id: val });
    const applySpFilter = (e) => {
        if (e) e.preventDefault();
        router.get(
            route("monitoring.sales-performance"),
            {
                ...spFilterData,
                kecamatan: filters?.kecamatan || "",
                tahun: filters?.tahun || "",
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [showScoreInfo, setShowScoreInfo] = useState(false);
    const [filterData, setFilterData] = useState({
        kecamatan: filters.kecamatan || "",
        tahun: filters.tahun || "",
    });
    const activeFiltersCount = Object.values(filters).filter(
        (v) => v !== null && v !== "",
    ).length;
    const applyFilter = (e) => {
        e.preventDefault();
        router.get(route(route().current()), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
        setIsFilterOpen(false);
    };
    const resetFilter = () => {
        setFilterData({ kecamatan: "", tahun: "" });
        router.get(
            route(route().current()),
            {},
            { preserveState: true, preserveScroll: true },
        );
        setIsFilterOpen(false);
    };
    const targetYear = configuration?.target_year || "2026";
    const predictionYear = parseInt(targetYear) + 1;
    const [showAllRanking, setShowAllRanking] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [kegiatanPage, setKegiatanPage] = useState(1);
    const kegiatanPerPage = 15;
    const [sekolahPage, setSekolahPage] = useState(1);
    const sekolahPerPage = 25;
    const [realisasiSekolahPage, setRealisasiSekolahPage] = useState(1);
    const realisasiSekolahPerPage = 25;
    // Sekolah table controls
    const [sekolahSearch, setSekolahSearch] = useState("");
    const [sekolahJenjang, setSekolahJenjang] = useState("");
    const [sekolahStatus, setSekolahStatus] = useState("");
    const [sekolahChartFilter, setSekolahChartFilter] = useState(null);
    const [sekolahSort, setSekolahSort] = useState({ key: "name", dir: "asc" });
    const [kegiatanAktivitasFilter, setKegiatanAktivitasFilter] = useState("");
    const [rekomendasiSort, setRekomendasiSort] = useState({
        key: "total_student",
        dir: "desc",
    });
    useEffect(() => {
        setSekolahPage(1);
    }, [sekolahSearch, sekolahJenjang, sekolahStatus, sekolahSort, sekolahChartFilter]);

    const openSekolahFromChart = (filter) => {
        setSekolahSearch("");
        setSekolahJenjang("");
        setSekolahStatus("1");
        setSekolahChartFilter(filter || null);
        setSekolahPage(1);
        setActiveTab("sekolah");
    };

    const openKegiatanFromChart = (aktivitas) => {
        setKegiatanAktivitasFilter(aktivitas || "");
        setKegiatanPage(1);
        setActiveTab("kegiatan");
    };

    const clearSekolahChartFilter = () => {
        setSekolahChartFilter(null);
    };
    /* ——— Format helpers ——— */
    const formatNumber = (num) =>
        new Intl.NumberFormat("id-ID").format(num || 0);
    const ts = realStats.total_sekolah || 0;
    const ca = realStats.customer_aktif || 0;

    const totalDapodik = realStats.total_dapodik_cabang || 0;
    const totalCustomerCabang = realStats.total_customer_cabang || 0;
    const effTotalCabang = Math.max(totalDapodik, totalCustomerCabang, ts);
    const nonAreaCover = Math.max(0, effTotalCabang - ts);

    const coveragePct = ts > 0 ? ((ca / ts) * 100).toFixed(2) + "%" : "0%";
    const opportunity = ts - ca;
    const oppPct = ts > 0 ? ((opportunity / ts) * 100).toFixed(2) + "%" : "0%";
    const trj = realStats.total_rencana_jual || 0;
    const rj = realStats.realisasi_jual || 0;
    const uncov = Math.max(0, trj - rj);
    const STATS = [
        {
            label: "Total Sekolah",
            value: formatNumber(ts),
            unit: "Sekolah",
            icon: "bi-buildings-fill",
            color: T.blue,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.sekolah", cabangCode)
                : null,
        },
        {
            label: "Customer Aktif",
            value: formatNumber(ca),
            unit: "Sekolah",
            icon: "bi-people-fill",
            color: T.green,
            sub: `${coveragePct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.customer-aktif", cabangCode)
                : null,
        },
        {
            label: "Coverage",
            value: coveragePct,
            unit: null,
            icon: "bi-check-circle-fill",
            color: T.blue,
            sub: `${coveragePct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.coverage", cabangCode)
                : null,
        },
        {
            label: "Opportunity",
            value: formatNumber(opportunity),
            unit: "Sekolah",
            icon: "bi-bullseye",
            color: T.orange,
            sub: `${oppPct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.opportunity", cabangCode)
                : null,
        },
        {
            label: "Total Target Eksemplar",
            value: formatNumber(realStats.target_eksemplar),
            unit: "Eks",
            icon: "bi-journal-text",
            color: T.purple,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.target-eksemplar", cabangCode)
                : null,
        },
        {
            label: "Total Siswa (Area)",
            value: formatNumber(realStats.total_siswa),
            unit: "Siswa",
            icon: "bi-person-lines-fill",
            color: T.blue,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.siswa", cabangCode)
                : null,
        },
    ];
    const salesStats = [
        {
            label: "Total Sekolah Keseluruhan",
            value: formatNumber(effTotalCabang),
            unit: "Sekolah",
            icon: "bi-building",
            color: T.blue,
            sub: "Total Semua Sekolah (Dapodik)",
            trend: null,
            detailHref: null,
        },
        {
            label: "Total Sekolah Area Cover",
            value: formatNumber(ts),
            unit: "Sekolah",
            icon: "bi-check-circle-fill",
            color: T.green,
            sub: "Sekolah dipegang oleh Sales",
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.sekolah", cabangCode)
                : null,
        },
        {
            label: "Total Sekolah Area Non Cover",
            value: formatNumber(nonAreaCover),
            unit: "Sekolah",
            icon: "bi-x-circle-fill",
            color: T.red,
            sub: "Belum masuk area cover",
            trend: null,
            detailHref: null,
        },
        {
            label: "Customer Aktif",
            value: formatNumber(ca),
            unit: "Sekolah",
            icon: "bi-people-fill",
            color: T.green,
            sub: `${coveragePct} dari Area Cover`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.customer-aktif", cabangCode)
                : null,
        },
        {
            label: "Coverage Area",
            value: coveragePct,
            unit: null,
            icon: "bi-globe-asia-australia",
            color: T.blue,
            sub: `${formatNumber(ca)} dari ${formatNumber(ts)} Area Cover`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.coverage", cabangCode)
                : null,
        },
        {
            label: "Pencapaian Eksemplar",
            value: formatNumber(realStats.real_eksemplar),
            unit: "Eks",
            icon: "bi-journal-check",
            color: T.green,
            sub:
                realStats.target_eksemplar > 0
                    ? `${((realStats.real_eksemplar / realStats.target_eksemplar) * 100).toFixed(1)}% dari Target`
                    : "Belum Ada Target",
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.target-eksemplar", cabangCode)
                : null,
        },
        {
            label: "Total Siswa (Potensi)",
            value: formatNumber(realStats.total_siswa),
            unit: "Siswa",
            icon: "bi-person-lines-fill",
            color: T.purple,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.siswa", cabangCode)
                : null,
        },
        {
            label: "Opportunity (Sekolah)",
            value: formatNumber(opportunity),
            unit: "Sekolah",
            icon: "bi-bullseye",
            color: T.orange,
            sub: `${oppPct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.opportunity", cabangCode)
                : null,
        },
    ];
    const displayStats = isSalesDetail ? salesStats : STATS;
    const DANA = dana.length > 0 ? dana : [];
    const UNCOVERED_DANA = uncoveredDana.length > 0 ? uncoveredDana : [];
    const JENJANG = jenjang;
    const SCHOOLS = schools;
    const TRL = trl;
    const TREND = trend.length > 0 ? trend : [];
    const AREA_COVERS =
        areaCovers.length > 0
            ? areaCovers
            : jenjang.map((j) => ({
                  label: j.label,
                  color: j.color,
                  ac25: j.ac25 || 0,
                  ac26: j.ac26 || 0,
                  target: j.target || 0,
              }));
    const OPP = [...rankingKecamatan]
        .map((r) => ({
            no: 0, // will set below
            kec: r.name,
            total: new Intl.NumberFormat("id-ID").format(r.total),
            cust: new Intl.NumberFormat("id-ID").format(r.cust),
            opp: new Intl.NumberFormat("id-ID").format(
                Math.max(0, r.total - r.cust),
            ),
            pct: r.pct + "%",
            _opp_val: Math.max(0, r.total - r.cust),
        }))
        .sort((a, b) => b._opp_val - a._opp_val)
        .map((r, i) => {
            r.no = i + 1;
            return r;
        })
        .slice(0, 10);
    // GOV computed from area coverage (placeholder — no conflict data yet)
    const GOV = [];
    const INSIGHTS = [];
    const MAP_LEGEND = [
        { label: "Covered ≥ 70%", color: "#34d399" },
        { label: "Low Coverage 30–70%", color: "#60a5fa" },
        { label: "Opportunity 10–30%", color: "#fbbf24" },
        { label: "High Opportunity < 10%", color: "#fb923c" },
        { label: "No Data", color: "#94a3b8" },
    ];
    /* SELECT STYLE */
    const sel = {
        fontSize: 11,
        padding: "5px 24px 5px 9px",
        border: `1px solid ${T.border}`,
        borderRadius: 7,
        background: "white",
        color: T.text,
        cursor: "pointer",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 7px center",
        appearance: "none",
        outline: "none",
    };
    /* NO (rank badge) */
    const RankNo = ({ n }) => (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                fontSize: 10,
                fontWeight: 700,
                background: n <= 3 ? T.blue : "#e2e8f0",
                color: n <= 3 ? "white" : T.slate,
            }}
        >
            {n}
        </span>
    );
    // Filter & Sort Daftar Sekolah
    let filteredListSekolah = [...(listSekolah || [])];
    if (sekolahSearch) {
        const query = sekolahSearch.toLowerCase();
        filteredListSekolah = filteredListSekolah.filter(
            (s) =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.kecamatan_name &&
                    s.kecamatan_name.toLowerCase().includes(query)),
        );
    }
    if (sekolahJenjang) {
        filteredListSekolah = filteredListSekolah.filter(
            (s) => s.jenjang === sekolahJenjang,
        );
    }
    if (sekolahStatus !== "") {
        const isActive = sekolahStatus === "1";
        filteredListSekolah = filteredListSekolah.filter(
            (s) => !!s.is_active === isActive,
        );
    }
    if (sekolahChartFilter) {
        const { type, value } = sekolahChartFilter;
        if (type === "segmen") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const sd = String(s.sumber_dana || "")
                    .toUpperCase()
                    .trim();
                if (value === "negeri") return sd === "BOS";
                if (value === "swasta") return sd.startsWith("SWA");
                return true;
            });
        } else if (type === "sumber_dana") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const sd = String(s.sumber_dana || "")
                    .toUpperCase()
                    .trim();
                const key = sd || "LAINNYA/KOSONG";
                return key === String(value).toUpperCase().trim();
            });
        } else if (type === "potensi_siswa") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const n = Number(s.total_student) || 0;
                if (value === "< 100") return n < 100;
                if (value === "100-300") return n >= 100 && n <= 300;
                if (value === "301-500") return n > 300 && n <= 500;
                if (value === "> 500") return n > 500;
                return true;
            });
        } else if (type === "penerbit") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const p = String(s.penerbit || "").trim();
                const key = p || "Tidak Diketahui";
                return (
                    key.toLowerCase() ===
                    String(value || "")
                        .trim()
                        .toLowerCase()
                );
            });
        } else if (type === "jenjang") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const j = String(s.jenjang || "").trim() || "Lainnya";
                return (
                    j.toLowerCase() ===
                    String(value || "")
                        .trim()
                        .toLowerCase()
                );
            });
        } else if (type === "customer_status") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const prevReal = !!s.prev_realisasi;
                const currReal = (Number(s.real_exemplar_current) || 0) > 0;
                if (value === "baru") return !prevReal && currReal;
                if (value === "retain") return prevReal && currReal;
                if (value === "loss") return !currReal;
                return true;
            });
        }
    }
    filteredListSekolah.sort((a, b) => {
        let valA = a[sekolahSort.key];
        let valB = b[sekolahSort.key];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return sekolahSort.dir === "asc" ? -1 : 1;
        if (valA > valB) return sekolahSort.dir === "asc" ? 1 : -1;
        return 0;
    });
    
        const propsToPass = {
        activityBreakdown, resultBreakdown, insights, filterOptions, filters, isFromSalesPerformance, salesPerformanceFilterOptions, salesPerformanceFilters, nonCoverSchools,
        activeNav, pageTitle, cabangName, areaName, description, areas, cabangs, selectedCabang, provinceCode, cabangCode,
        realStats, trl, trlJenjang, salesPerformance, rankingKecamatan, top10Schools, mapMarkers, schools, dana, jenjang, trend, areaCovers, competitors, leaderboard, salesJenjangData, salesJenjangTotal, uncovered, uncoveredDana, hideFilters, backUrl, isSalesDetail, timSalesPerformance, timSalesPerformanceWorst, listKecamatan, listSekolah, kegiatanSales, visitCoverage, rencanaJualCoverage, jenjangBreakdown, sumberDanaBreakdown, segmenBreakdown, siswaBreakdown,
        activeTab, setActiveTab,
        spFilterData, setSpFilterData,
        isFilterOpen, setIsFilterOpen,
        kpiData,
        salesProfile,
        showScoreInfo, setShowScoreInfo,
        sekolahPage, setSekolahPage,
        kegiatanPage, setKegiatanPage,
        handleSpAreaChange, applySpFilter,
        sekolahPerPage,
        sekolahSearch, setSekolahSearch,
        sekolahJenjang, setSekolahJenjang,
        sekolahStatus, setSekolahStatus,
        sekolahSort, setSekolahSort,
        sekolahChartFilter, setSekolahChartFilter,
        clearSekolahChartFilter,
        openSekolahFromChart,
        openKegiatanFromChart,
        kegiatanAktivitasFilter, setKegiatanAktivitasFilter,
        filteredListSekolah
    };

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`${pageTitle} – ${cabangName}`} />
            {/* ══════════════════ 
                HEADER
            ══════════════════  */}
            <div
                style={{
                    background: "white",
                    padding: "14px 20px",
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.slate,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        {pageTitle}
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: T.text,
                            letterSpacing: "-0.5px",
                            lineHeight: 1.15,
                        }}
                    >
                        {cabangName}
                    </div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                        {description}
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    {backUrl && (
                        <Link
                            href={backUrl}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#64748b",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "600",
                                transition: "color 0.2s",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#3b82f6";
                                e.currentTarget.style.borderColor = "#bfdbfe";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#64748b";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                        >
                            <i className="bi bi-arrow-left"></i> Kembali
                        </Link>
                    )}
                    {!hideFilters && (
                        <>
                            {/* Select Area */}
                            {areas && areas.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                    }}
                                >
                                    <i
                                        className="bi bi-geo-alt"
                                        style={{ color: T.blue, fontSize: 14 }}
                                    />
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 9,
                                                color: T.slate,
                                                marginBottom: 2,
                                            }}
                                        >
                                            Area
                                        </div>
                                        <select
                                            style={sel}
                                            value={provinceCode || ""}
                                            onChange={(e) => {
                                                router.get(
                                                    route(
                                                        "monitoring.area",
                                                        e.target.value,
                                                    ),
                                                );
                                            }}
                                        >
                                            {areas.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            {/* Select Cabang */}
                            {cabangs && cabangs.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                    }}
                                >
                                    <i
                                        className="bi bi-geo-alt-fill"
                                        style={{ color: T.blue, fontSize: 14 }}
                                    />
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 9,
                                                color: T.slate,
                                                marginBottom: 2,
                                            }}
                                        >
                                            Cabang
                                        </div>
                                        <select
                                            style={sel}
                                            value={selectedCabang || ""}
                                            onChange={(e) => {
                                                router.get(
                                                    route(
                                                        "monitoring.area",
                                                        provinceCode,
                                                    ),
                                                    { cabang: e.target.value },
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }}
                                        >
                                            {cabangs.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nama_cabang}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {/* Logout Button */}
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "#fee2e2",
                            borderRadius: 9,
                            padding: "7px 12px",
                            border: `1px solid #fca5a5`,
                            color: "#ef4444",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        <i
                            className="bi bi-box-arrow-right"
                            style={{ fontSize: 14 }}
                        />
                        LOGOUT
                    </Link>
                </div>
            </div>
            {/* ══════════════════ 
                TABS & FILTERS NAVIGATION
            ══════════════════  */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 20px",
                    background: "white",
                    borderBottom: `1px solid ${T.border}`,
                    gap: "16px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 24,
                        overflowX: "auto",
                        flex: "1 1 auto",
                    }}
                >
                    {(isSalesDetail
                        ? [
                              { id: "dashboard", label: "Dashboard Utama" },
                              { id: "kecamatan", label: "Kecamatan" },
                              { id: "sekolah", label: "Sekolah" },
                              { id: "kegiatan", label: "Kegiatan Sales" },
                              { id: "analisis", label: `Rekomendasi ${predictionYear}` },
                          ]
                        : [
                              { id: "dashboard", label: "Dashboard Utama" },
                              {
                                  id: "competitor",
                                  label: "Kompetitor & Market Share",
                              },
                          ]
                    ).map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "14px 0",
                                fontSize: 12,
                                fontWeight: 700,
                                color: activeTab === tab.id ? T.blue : T.slate,
                                borderBottom: `2px solid ${activeTab === tab.id ? T.blue : "transparent"}`,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.2s",
                            }}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>

                {/* INJECTED FILTER FORM FOR SALES PERFORMANCE */}
                {isFromSalesPerformance && (
                    <form
                        onSubmit={applySpFilter}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            alignItems: "center",
                            padding: "8px 0",
                        }}
                    >
                        <div style={{ width: 160 }}>
                            <SelectReact
                                collection={
                                    salesPerformanceFilterOptions?.areas || []
                                }
                                value={spFilterData.area_id}
                                onChange={handleSpAreaChange}
                                placeholder="Pilih Area"
                            />
                        </div>
                        <div style={{ width: 160 }}>
                            <SelectReact
                                collection={spAvailableCabangs.map((c) => ({
                                    id: c.id,
                                    name: c.nama_cabang,
                                }))}
                                value={spFilterData.cabang_id}
                                onChange={handleSpCabangChange}
                                placeholder="Pilih Cabang"
                            />
                        </div>
                        <div style={{ width: 160 }}>
                            <SelectReact
                                collection={spAvailableSales}
                                value={spFilterData.sales_id}
                                onChange={handleSpSalesChange}
                                placeholder="Pilih Sales"
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                height: "38px",
                                padding: "0 16px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "700",
                                color: "white",
                                background: "#4f46e5",
                                border: "none",
                                cursor: "pointer",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#4338ca")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#4f46e5")
                            }
                        >
                            Terapkan
                        </button>
                    </form>
                )}
            </div>
            {/* ══════════════════ 
                CONTENT
            ══════════════════  */}
            <div
                style={{
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                {activeTab === "dashboard" && <DashboardTab {...propsToPass} />}
                {activeTab === "competitor" && <CompetitorTab {...propsToPass} />}
                {activeTab === "kecamatan" && isSalesDetail && <KecamatanTab {...propsToPass} />}
                {activeTab === "sekolah" && isSalesDetail && <SekolahTab {...propsToPass} />}
                {activeTab === "kegiatan" && isSalesDetail && <KegiatanTab {...propsToPass} />}
                {activeTab === "analisis" && <AnalisisTab {...propsToPass} />}
                {/* NOTE */}
                <div
                    style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontStyle: "italic",
                        paddingTop: 6,
                        borderTop: `1px solid ${T.border}`,
                    }}
                >
                    <i
                        className="bi bi-info-circle"
                        style={{ marginRight: 5 }}
                    />
                    Catatan: Semua data bersumber dari Data Master (Dapodik),
                    Customer Yudhistira, dan input aktivitas Sales.
                </div>
            </div>
            {/* Filter Modal / Slideover */}
            {isFilterOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "flex-end",
                        justifyContent: "flex-end",
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            width: "100%",
                            maxWidth: "384px",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            animation: "fadeInUp 0.3s ease-out",
                        }}
                    >
                        <div
                            style={{
                                padding: "16px 24px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: "#f8fafc",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 600,
                                    color: "#1e293b",
                                    margin: 0,
                                }}
                            >
                                Filter Data
                            </h3>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "6px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#475569";
                                    e.currentTarget.style.backgroundColor =
                                        "#e2e8f0";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#94a3b8";
                                    e.currentTarget.style.backgroundColor =
                                        "transparent";
                                }}
                            >
                                <svg
                                    style={{ width: "20px", height: "20px" }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                        <div
                            style={{
                                padding: "24px",
                                flex: 1,
                                overflowY: "auto",
                            }}
                        >
                            <form
                                id="filterForm"
                                onSubmit={applyFilter}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                }}
                            >
                                {/* Kecamatan Filter */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            color: "#334155",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Kecamatan
                                    </label>
                                    <SelectReact
                                        collection={
                                            filterOptions.kecamatans || []
                                        }
                                        value={filterData.kecamatan}
                                        onChange={(val) =>
                                            setFilterData({
                                                ...filterData,
                                                kecamatan: val,
                                            })
                                        }
                                        placeholder="Semua Kecamatan"
                                    />
                                </div>
                                {/* Tahun Filter */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            color: "#334155",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Tahun Aktif (Realisasi)
                                    </label>
                                    <SelectReact
                                        collection={filterOptions.years || []}
                                        value={filterData.tahun}
                                        onChange={(val) =>
                                            setFilterData({
                                                ...filterData,
                                                tahun: val,
                                            })
                                        }
                                        placeholder="Semua Tahun"
                                    />
                                </div>
                            </form>
                        </div>
                        <div
                            style={{
                                padding: "16px 24px",
                                backgroundColor: "#f8fafc",
                                borderTop: "1px solid #f1f5f9",
                                display: "flex",
                                gap: "12px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={resetFilter}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    backgroundColor: "white",
                                    border: "1px solid #cbd5e1",
                                    color: "#334155",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                form="filterForm"
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    backgroundColor: "#4f46e5",
                                    border: "1px solid transparent",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                }}
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Floating Action Button */}
            {isSalesDetail && (
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="group fixed bottom-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 z-40 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    style={{
                        backgroundColor: "#4f46e5",
                        color: "white",
                        border: "2px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                        e.currentTarget.style.color = "#4f46e5";
                        e.currentTarget.style.borderColor = "#4f46e5";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#4f46e5";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.borderColor = "transparent";
                    }}
                    title="Filter Data"
                >
                    <svg
                        className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        ></path>
                    </svg>
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm z-50">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            )}
        </MonitoringLayout>
    );
}
