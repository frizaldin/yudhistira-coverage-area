import React, { useState } from "react";
import MonitoringLayout from "../../Layouts/MonitoringLayout";
import { Head, Link, router } from "@inertiajs/react";
import SelectReact from "../../Components/Element/SelectReact";

export default function SalesPerformance({
    isInitialLoad = false,
    salesData,
    coveredAreas,
    uncoveredAreas,
    customerPerformance,
    insights,
    filterOptions = {
        areas: [],
        cabangs: [],
        sales: [],
        kecamatans: [],
        years: [],
    },
    filters = {},
}) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterData, setFilterData] = useState({
        area_id: filters.area_id || "",
        cabang_id: filters.cabang_id || "",
        sales_id: filters.sales_id || "",
        kecamatan: filters.kecamatan || "",
        tahun: filters.tahun || "",
    });

    const [searchCustomer, setSearchCustomer] = useState(
        filters.search_customer || "",
    );

    const handleSearchCustomer = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            router.get(
                route(route().current()),
                { ...filters, search_customer: searchCustomer },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        }
    };

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(route(route().current()), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
        setIsFilterOpen(false);
    };

    const resetFilter = () => {
        setFilterData({
            area_id: "",
            cabang_id: "",
            sales_id: "",
            kecamatan: "",
            tahun: "",
        });
        router.get(
            route(route().current()),
            {},
            { preserveState: true, preserveScroll: true },
        );
        setIsFilterOpen(false);
    };

    const availableCabangs = filterData.area_id
        ? (filterOptions.cabangs || []).filter(
              (c) => c.area_id == filterData.area_id,
          )
        : [];

    const availableSales = filterData.cabang_id
        ? (filterOptions.sales || []).filter(
              (s) => s.cabang_id == filterData.cabang_id,
          )
        : [];

    const handleAreaChange = (val) => {
        setFilterData({ ...filterData, area_id: val, cabang_id: "", sales_id: "" });
    };

    const handleCabangChange = (val) => {
        setFilterData({ ...filterData, cabang_id: val, sales_id: "" });
    };

    const handleSalesChange = (val) => {
        setFilterData({ ...filterData, sales_id: val });
    };

    const activeFiltersCount = [
        "area_id",
        "cabang_id",
        "sales_id",
        "kecamatan",
        "tahun",
    ].filter((key) => filters?.[key]).length;

    const handleSort = (tablePrefix, column) => {
        const currentSort = filters[`${tablePrefix}_sort`];
        const currentDir = filters[`${tablePrefix}_dir`];
        let newDir = "asc";

        if (currentSort === column) {
            newDir = currentDir === "asc" ? "desc" : "asc";
        }

        router.get(
            route(route().current()),
            {
                ...filters,
                [`${tablePrefix}_sort`]: column,
                [`${tablePrefix}_dir`]: newDir,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const SortableHeader = ({
        tablePrefix,
        column,
        label,
        className = "py-3 px-6",
    }) => {
        const isSorted = filters[`${tablePrefix}_sort`] === column;
        const sortDir = filters[`${tablePrefix}_dir`];

        return (
            <th
                className={`${className} cursor-pointer hover:bg-slate-100 transition-colors select-none`}
                onClick={() => handleSort(tablePrefix, column)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs">{label}</span>
                    <span
                        className={`flex flex-col ${isSorted ? "opacity-100" : "opacity-50"}`}
                    >
                        {(!isSorted || sortDir === "asc") && (
                            <svg
                                className={`w-3 h-3 ${!isSorted ? "-mb-1" : ""} ${isSorted ? "text-indigo-600" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M5 15l7-7 7 7"
                                ></path>
                            </svg>
                        )}
                        {(!isSorted || sortDir === "desc") && (
                            <svg
                                className={`w-3 h-3 ${isSorted ? "text-indigo-600" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M19 9l-7 7-7-7"
                                ></path>
                            </svg>
                        )}
                    </span>
                </div>
            </th>
        );
    };

    // Pagination helpers for Tables
    const renderPagination = (links, onlyKeys) => {
        if (!links || links.length === 0) return null;

        const numericLinks = links.filter((l) => !isNaN(Number(l.label)));
        if (numericLinks.length === 0) return null;

        const activePage = Number(
            numericLinks.find((l) => l.active)?.label || 1,
        );
        const lastPage = Number(numericLinks[numericLinks.length - 1].label);

        const visiblePages = new Set([
            1,
            2,
            lastPage - 1,
            lastPage,
            activePage - 1,
            activePage,
            activePage + 1,
        ]);
        if (activePage <= 3) visiblePages.add(3);
        if (activePage >= lastPage - 2) visiblePages.add(lastPage - 2);

        const filteredLinks = [];
        let prevNum = 0;

        links.forEach((link) => {
            const isPrevNext =
                link.label.includes("Previous") || link.label.includes("Next");
            const num = Number(link.label);

            if (isPrevNext) {
                filteredLinks.push(link);
            } else if (!isNaN(num)) {
                if (visiblePages.has(num)) {
                    if (prevNum > 0 && num - prevNum > 1) {
                        filteredLinks.push({
                            label: "...",
                            url: null,
                            active: false,
                        });
                    }
                    filteredLinks.push(link);
                    prevNum = num;
                }
            }
        });

        return (
            <div className="mt-1 flex flex-wrap gap-2 justify-end">
                {filteredLinks.map((link, index) => {
                    const isActive = link.active;
                    const isPrevious = link.label.includes("Previous");
                    const isNext = link.label.includes("Next");
                    let label = link.label;
                    if (isPrevious)
                        label = (
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 19l-7-7 7-7"
                                ></path>
                            </svg>
                        );
                    if (isNext)
                        label = (
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 5l7 7-7 7"
                                ></path>
                            </svg>
                        );

                    if (link.url === null) {
                        return (
                            <div
                                key={index}
                                className="px-3 py-2 text-slate-400 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center"
                            >
                                {label}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={link.url}
                            preserveState
                            preserveScroll
                            only={onlyKeys}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center justify-center transition-all duration-200 ${
                                isActive
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md hover:bg-indigo-700 hover:shadow-lg transform -translate-y-0.5"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>
        );
    };

    if (isInitialLoad) {
        const T = {
            blue: "#1d4ed8",
            blueSoft: "#3b82f6",
            slate: "#64748b",
            text: "#0f172a",
            border: "#e2e8f0",
            card: "#ffffff",
        };

        return (
            <MonitoringLayout activeNav="sales-performance">
                <Head title="Pilih Parameter - Sales Performance" />
                <div
                    style={{
                        background: "white",
                        padding: "14px 20px",
                        borderBottom: `1px solid ${T.border}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.slate,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        Dashboard Sales Performance
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
                        PILIH PARAMETER
                    </div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                        Silakan pilih Area, Cabang, atau Sales untuk melihat
                        data performa.
                    </div>
                </div>

                <div
                    style={{
                        padding: "14px 14px",
                        maxWidth: "100%",
                        margin: "0 auto",
                    }}
                >
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <form
                            onSubmit={applyFilter}
                            className="flex flex-col md:flex-row items-end gap-4"
                        >
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Area
                                </label>
                                <SelectReact
                                    collection={filterOptions.areas || []}
                                    value={filterData.area_id}
                                    onChange={handleAreaChange}
                                    placeholder="Pilih Area"
                                />
                            </div>

                            <div className="flex-1 w-full">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cabang
                                </label>
                                <SelectReact
                                    collection={availableCabangs.map((c) => ({
                                        id: c.id,
                                        name: c.nama_cabang,
                                    }))}
                                    value={filterData.cabang_id}
                                    onChange={handleCabangChange}
                                    placeholder="Pilih Cabang"
                                />
                            </div>

                            <div className="flex-1 w-full">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Sales
                                </label>
                                <SelectReact
                                    collection={availableSales}
                                    value={filterData.sales_id}
                                    onChange={handleSalesChange}
                                    placeholder="Pilih Sales"
                                />
                            </div>

                            <div className="w-full md:w-auto">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center h-[40px] px-6 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    Tampilkan Dashboard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </MonitoringLayout>
        );
    }

    return (
        <MonitoringLayout activeNav="sales-performance">
            <Head title="Sales Performance" />

            {/* Custom Styles for Animations */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(15px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                }
                .table-row-hover:hover td {
                    background-color: #f8fafc;
                }
            `,
                }}
            />

            {/* HEADER ROW matching Area.jsx */}
            <div
                style={{
                    background: "white",
                    padding: "14px 20px",
                    borderBottom: "1px solid #e2e8f0",
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
                            color: "#64748b",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        Dashboard
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: "#0f172a",
                            letterSpacing: "-0.5px",
                            lineHeight: 1.15,
                        }}
                    >
                        Sales Performance
                    </div>
                    <div
                        style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}
                    >
                        Pantau performa perwakilan penjualan, cakupan area, dan
                        riwayat realisasi pelanggan dalam satu tampilan
                        komprehensif.
                    </div>
                </div>
            </div>

            <div className="min-h-screen bg-slate-50 py-4 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="max-w-7xl mx-auto space-y-4">
                    {/* INSIGHT CARDS */}
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in-up"
                        style={{ animationDelay: "0.15s" }}
                    >
                        {/* Top Sales */}
                        <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg
                                    className="w-12 h-12 text-emerald-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                        ></path>
                                    </svg>
                                </div>
                                <div className="z-10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Top Sales (Apresiasi)
                                    </p>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        {insights?.topSales?.name ||
                                            "Belum Ada"}
                                    </h3>
                                    <p className="text-xs text-emerald-600 font-medium">
                                        Coverage{" "}
                                        {insights?.topSales?.coverage || 0}% (
                                        {insights?.topSales?.aktif || 0} Area Cover)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Sales */}
                        <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg
                                    className="w-12 h-12 text-rose-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        ></path>
                                    </svg>
                                </div>
                                <div className="z-10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Perlu Evaluasi (Sales)
                                    </p>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        {insights?.bottomSales?.name ||
                                            "Belum Ada"}
                                    </h3>
                                    <p className="text-xs text-rose-600 font-medium">
                                        Coverage{" "}
                                        {insights?.bottomSales?.coverage || 0}%
                                        ({insights?.bottomSales?.aktif || 0}{" "}
                                        Area Cover)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Cabang */}
                        <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg
                                    className="w-12 h-12 text-indigo-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        ></path>
                                    </svg>
                                </div>
                                <div className="z-10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Wilayah Bintang
                                    </p>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        {insights?.topCabang?.name ||
                                            "Belum Ada"}
                                    </h3>
                                    <p className="text-xs text-indigo-600 font-medium">
                                        Coverage{" "}
                                        {insights?.topCabang?.persentase || 0}%
                                        ({insights?.topCabang?.tercover || 0}{" "}
                                        Area Cover)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Opportunity Cabang */}
                        <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg
                                    className="w-12 h-12 text-blue-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.686 1.55H5a1 1 0 100 2h.853c-.036.326-.053.66-.053 1s.017.674.053 1H5a1 1 0 100 2h1.314c.18.55.401 1.075.686 1.55.7 1.166 1.747 1.95 2.979 1.95s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96 .979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.564-1.2h2.528a1 1 0 100-2H7.04A7.98 7.98 0 017 10c0-.342.028-.679.08-1h2.456a1 1 0 100-2H7.61c.213-.601.5-1.162.842-1.671L8.736 6.98z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                        ></path>
                                    </svg>
                                </div>
                                <div className="z-10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Fokus Ekspansi (Cabang)
                                    </p>
                                    <h3 className="text-sm font-extrabold text-slate-800">
                                        {insights?.oppCabang?.name ||
                                            "Belum Ada"}
                                    </h3>
                                    <p className="text-xs text-blue-600 font-medium">
                                        Potensi{" "}
                                        {insights?.oppCabang?.belum_tercover ||
                                            0}{" "}
                                        Sekolah Baru
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Total Area Cover */}
                        <div className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg
                                    className="w-12 h-12 text-violet-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 flex-shrink-0">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        ></path>
                                    </svg>
                                </div>
                                <div className="z-10">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Total Area Cover
                                    </p>
                                    <h3 className="text-2xl font-extrabold text-slate-800">
                                        {insights?.totalAreaCover ?? 0}
                                    </h3>
                                    <p className="text-xs text-violet-600 font-medium">
                                        Sekolah ter-cover sales
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table 1: Sales Data */}
                    <div
                        className="glass-card rounded-2xl overflow-hidden animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        ></path>
                                    </svg>
                                </span>
                                Ringkasan Performa Sales
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                        <SortableHeader
                                            tablePrefix="t1"
                                            column="name"
                                            label="Nama Sales"
                                            className="py-2 px-6"
                                        />
                                        <SortableHeader
                                            tablePrefix="t1"
                                            column="total_cabang"
                                            label="Total Cabang Dipegang"
                                            className="py-2 px-6 text-center"
                                        />
                                        <SortableHeader
                                            tablePrefix="t1"
                                            column="total_kecamatan"
                                            label="Total Kecamatan Dipegang"
                                            className="py-2 px-6 text-center"
                                        />
                                        <SortableHeader
                                            tablePrefix="t1"
                                            column="total_sekolah"
                                            label="Total Sekolah"
                                            className="py-2 px-6 text-center"
                                        />
                                        <SortableHeader
                                            tablePrefix="t1"
                                            column="aktif"
                                            label="Area Cover"
                                            className="py-2 px-6 text-center"
                                        />
                                        <th className="py-2 px-6 text-center text-xs uppercase tracking-wider font-semibold text-slate-500 whitespace-nowrap">
                                            Tahan / Rebut
                                        </th>
                                        <SortableHeader
                                            tablePrefix="t1"
                                            column="coverage"
                                            label="Coverage"
                                            className="py-2 px-6 text-center w-1/6"
                                        />
                                        <th className="py-2 px-6 text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {salesData.data.map((sales, i) => (
                                        <tr
                                            key={i}
                                            className="table-row-hover transition-colors duration-200 bg-white"
                                        >
                                            <td className="py-1 px-6 text-xs text-slate-900">
                                                {sales.name}
                                            </td>
                                            <td className="py-1 px-6 text-center">
                                                <span className="inline-flex text-xs items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    {sales.total_cabang}
                                                </span>
                                            </td>
                                            <td className="py-1 px-6 text-center">
                                                <span className="inline-flex text-xs items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    {sales.total_kecamatan}
                                                </span>
                                            </td>
                                            <td className="py-1 px-6 text-center">
                                                <span className="inline-flex text-xs items-center justify-center px-3 py-1 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200">
                                                    {sales.total_sekolah}
                                                </span>
                                            </td>
                                            <td className="py-1 px-6 text-center">
                                                <span className="inline-flex text-xs items-center justify-center px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    {sales.aktif || 0}
                                                </span>
                                            </td>
                                            <td className="py-1 px-6 text-center whitespace-nowrap">
                                                <span
                                                    className="text-xs font-bold text-emerald-600 mr-2"
                                                    title="Tahan (Retensi)"
                                                >
                                                    T: {sales.tahan || 0}
                                                </span>
                                                <span
                                                    className="text-xs font-bold text-blue-600"
                                                    title="Rebut (Akuisisi Baru)"
                                                >
                                                    R: {sales.rebut || 0}
                                                </span>
                                            </td>
                                            <td className="py-1 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${(sales.coverage || 0) >= 70 ? "bg-emerald-500" : (sales.coverage || 0) >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                                                            style={{
                                                                width: `${sales.coverage || 0}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 min-w-[4ch]">
                                                        {sales.coverage || 0}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-1 px-6 text-center">
                                                <div className="relative inline-flex flex-col items-center group">
                                                    <Link
                                                        href={route(
                                                            "monitoring.rekap-sales.detail",
                                                            sales.id,
                                                        )}
                                                        className="inline-flex text-xs items-center justify-center p-1.5 font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className="w-4 h-4"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                        </svg>
                                                    </Link>
                                                    <div className="absolute bottom-full mb-2 hidden flex-col items-center group-hover:flex z-20 w-max">
                                                        <span className="relative z-10 px-3 py-1.5 text-xs text-slate-800 bg-slate-200 rounded shadow-sm">
                                                            Lihat Detail
                                                        </span>
                                                        <div className="w-3 h-3 -mt-1.5 rotate-45 bg-slate-200"></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {salesData.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="8"
                                                className="py-10 text-center text-slate-400 font-medium"
                                            >
                                                Data sales belum tersedia.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {salesData.links && salesData.links.length > 3 && (
                            <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-sm text-slate-500">
                                    Menampilkan{" "}
                                    <span className="font-medium text-slate-900">
                                        {salesData.from || 0}
                                    </span>{" "}
                                    -{" "}
                                    <span className="font-medium text-slate-900">
                                        {salesData.to || 0}
                                    </span>{" "}
                                    dari{" "}
                                    <span className="font-medium text-slate-900">
                                        {salesData.total}
                                    </span>{" "}
                                    data
                                </div>
                                {renderPagination(salesData.links, [
                                    "salesData",
                                ])}
                            </div>
                        )}
                    </div>

                    {/* Two Column Layout for Cabang */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Table 2: Covered Area */}
                        <div
                            className="glass-card rounded-2xl overflow-hidden animate-fade-in-up"
                            style={{ animationDelay: "0.3s" }}
                        >
                            <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
                                <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            ></path>
                                        </svg>
                                    </span>
                                    Area Tercover
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                            <SortableHeader
                                                tablePrefix="t2"
                                                column="name"
                                                label="Nama Cabang"
                                            />
                                            <SortableHeader
                                                tablePrefix="t2"
                                                column="total_sekolah"
                                                label="Total Sekolah"
                                                className="py-3 px-4 text-center"
                                            />
                                            <SortableHeader
                                                tablePrefix="t2"
                                                column="tercover"
                                                label="Tercover"
                                                className="py-3 px-4 text-center"
                                            />
                                            <SortableHeader
                                                tablePrefix="t2"
                                                column="persentase"
                                                label="Coverage"
                                                className="py-3 px-6 w-1/3"
                                            />
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100">
                                        {coveredAreas.data.map((area, i) => (
                                            <tr
                                                key={i}
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            "monitoring.area",
                                                            {
                                                                id: area.area_id,
                                                                cabang: area.id,
                                                            },
                                                        ),
                                                    )
                                                }
                                                className="table-row-hover transition-colors duration-200 bg-white cursor-pointer"
                                            >
                                                <td className="py-1 px-6 text-xs text-slate-900">
                                                    {area.name}
                                                </td>
                                                <td className="py-1 px-4 text-xs text-center text-slate-600">
                                                    {area.total_sekolah}
                                                </td>
                                                <td className="py-1 px-4 text-xs text-center font-bold text-emerald-600">
                                                    {area.tercover}
                                                </td>
                                                <td className="py-1 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                                                style={{
                                                                    width: `${area.persentase}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 w-9 text-right">
                                                            {area.persentase}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {coveredAreas.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="py-10 text-center text-slate-400 font-medium"
                                                >
                                                    Belum ada cabang yang
                                                    tercover.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {coveredAreas.links &&
                                coveredAreas.links.length > 3 && (
                                    <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-sm text-slate-500">
                                            Menampilkan{" "}
                                            <span className="font-medium text-slate-900">
                                                {coveredAreas.from || 0}
                                            </span>{" "}
                                            -{" "}
                                            <span className="font-medium text-slate-900">
                                                {coveredAreas.to || 0}
                                            </span>{" "}
                                            dari{" "}
                                            <span className="font-medium text-slate-900">
                                                {coveredAreas.total}
                                            </span>{" "}
                                            data
                                        </div>
                                        {renderPagination(coveredAreas.links, [
                                            "coveredAreas",
                                        ])}
                                    </div>
                                )}
                        </div>

                        {/* Table 3: No Covered Area */}
                        <div
                            className="glass-card rounded-2xl overflow-hidden animate-fade-in-up"
                            style={{ animationDelay: "0.4s" }}
                        >
                            <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
                                <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-600">
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            ></path>
                                        </svg>
                                    </span>
                                    Area Belum Tercover
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                            <SortableHeader
                                                tablePrefix="t3"
                                                column="name"
                                                label="Nama Cabang"
                                            />
                                            <SortableHeader
                                                tablePrefix="t3"
                                                column="belum_tercover"
                                                label="Total Sekolah (Potensi)"
                                                className="py-3 px-6 text-center"
                                            />
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100">
                                        {uncoveredAreas.data.map((area, i) => (
                                            <tr
                                                key={i}
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            "monitoring.area",
                                                            {
                                                                id: area.area_id,
                                                                cabang: area.id,
                                                            },
                                                        ),
                                                    )
                                                }
                                                className="table-row-hover transition-colors duration-200 bg-white cursor-pointer"
                                            >
                                                <td className="py-1 px-6 text-xs text-slate-900">
                                                    {area.name}
                                                </td>
                                                <td className="py-1 px-6 text-xs text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                                        {area.belum_tercover}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {uncoveredAreas.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="2"
                                                    className="py-10 text-center text-slate-400 font-medium"
                                                >
                                                    Semua cabang sudah tercover!
                                                    🎉
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {uncoveredAreas.links &&
                                uncoveredAreas.links.length > 3 && (
                                    <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-sm text-slate-500">
                                            Menampilkan{" "}
                                            <span className="font-medium text-slate-900">
                                                {uncoveredAreas.from || 0}
                                            </span>{" "}
                                            -{" "}
                                            <span className="font-medium text-slate-900">
                                                {uncoveredAreas.to || 0}
                                            </span>{" "}
                                            dari{" "}
                                            <span className="font-medium text-slate-900">
                                                {uncoveredAreas.total}
                                            </span>{" "}
                                            data
                                        </div>
                                        {renderPagination(
                                            uncoveredAreas.links,
                                            ["uncoveredAreas"],
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Table 4: Sales Performance Detail */}
                    <div
                        className="glass-card rounded-2xl overflow-hidden animate-fade-in-up"
                        style={{ animationDelay: "0.5s" }}
                    >
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-3">
                            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600">
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        ></path>
                                    </svg>
                                </span>
                                Riwayat Realisasi Penjualan per Customer
                            </h3>

                            <div className="flex items-center">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <svg
                                            className="w-4 h-4 text-slate-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            ></path>
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={searchCustomer}
                                        onChange={(e) =>
                                            setSearchCustomer(e.target.value)
                                        }
                                        onKeyDown={handleSearchCustomer}
                                        placeholder="Cari customer... (Enter)"
                                        className="pl-10 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                        <SortableHeader
                                            tablePrefix="t4"
                                            column="name"
                                            label="Nama Customer / Sekolah"
                                            className="py-2 text-md px-6"
                                        />
                                        <SortableHeader
                                            tablePrefix="t4"
                                            column="sales_name"
                                            label="Nama Sales"
                                            className="py-2 text-md px-6"
                                        />
                                        <SortableHeader
                                            tablePrefix="t4"
                                            column="area_name"
                                            label="Area"
                                            className="py-2 text-md px-6"
                                        />
                                        <SortableHeader
                                            tablePrefix="t4"
                                            column="cabang_name"
                                            label="Cabang"
                                            className="py-2 text-md px-6"
                                        />
                                        <SortableHeader
                                            tablePrefix="t4"
                                            column="kecamatan_name"
                                            label="Kecamatan"
                                            className="py-2 text-md px-6"
                                        />
                                        <th className="py-2 text-md px-4 text-center">
                                            2023
                                        </th>
                                        <th className="py-2 text-md px-4 text-center">
                                            2024
                                        </th>
                                        <th className="py-2 text-md px-4 text-center">
                                            2025
                                        </th>
                                        <th className="py-2 text-md px-4 text-center">
                                            2026
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-100">
                                    {customerPerformance.data.map((cust) => (
                                        <tr
                                            key={cust.id}
                                            onClick={() =>
                                                cust.sales_id
                                                    ? router.get(
                                                          route(
                                                              "monitoring.rekap-sales.detail",
                                                              cust.sales_id,
                                                          ),
                                                      )
                                                    : null
                                            }
                                            className={`table-row-hover transition-colors duration-200 bg-white group ${cust.sales_id ? "cursor-pointer" : ""}`}
                                        >
                                            <td className="py-1 text-xs px-6 font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {cust.customer_name}
                                            </td>
                                            <td className="py-1 text-xs px-6 text-slate-600">
                                                {cust.sales_name}
                                            </td>
                                            <td className="py-1 text-xs px-6 text-slate-600">
                                                {cust.area_name || "-"}
                                            </td>
                                            <td className="py-1 text-xs px-6 text-slate-600">
                                                {cust.cabang_name || "-"}
                                            </td>
                                            <td className="py-1 text-xs px-6 text-slate-600">
                                                {cust.kecamatan_name || "-"}
                                            </td>

                                            {[2023, 2024, 2025, 2026].map(
                                                (year) => (
                                                    <td
                                                        key={year}
                                                        className="py-1 text-xs px-4 text-center"
                                                    >
                                                        {cust.years[year] ? (
                                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-200 ring-inset shadow-sm">
                                                                <svg
                                                                    className="w-5 h-5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2.5"
                                                                        d="M5 13l4 4L19 7"
                                                                    ></path>
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 ring-1 ring-slate-200 ring-inset">
                                                                <svg
                                                                    className="w-4 h-4"
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
                                                            </div>
                                                        )}
                                                    </td>
                                                ),
                                            )}
                                        </tr>
                                    ))}
                                    {customerPerformance.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="9"
                                                className="py-12 text-center text-slate-400 font-medium"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg
                                                        className="w-12 h-12 mb-3 text-slate-300"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="1.5"
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        ></path>
                                                    </svg>
                                                    Tidak ada data customer yang
                                                    ditemukan.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {customerPerformance.links &&
                                customerPerformance.links.length > 3 && (
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-sm text-slate-500">
                                            Menampilkan{" "}
                                            <span className="font-medium text-slate-900">
                                                {customerPerformance.from || 0}
                                            </span>{" "}
                                            -{" "}
                                            <span className="font-medium text-slate-900">
                                                {customerPerformance.to || 0}
                                            </span>{" "}
                                            dari{" "}
                                            <span className="font-medium text-slate-900">
                                                {customerPerformance.total}
                                            </span>{" "}
                                            data
                                        </div>
                                        {renderPagination(
                                            customerPerformance.links,
                                            ["customerPerformance"],
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
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

            {/* Filter Modal / Slideover */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800">
                                Filter Data
                            </h3>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 rounded-md hover:bg-slate-200"
                            >
                                <svg
                                    className="w-5 h-5"
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

                        <div className="p-6 flex-1 overflow-y-auto">
                            <form
                                id="filterForm"
                                onSubmit={applyFilter}
                                className="space-y-5"
                            >
                                {/* Area Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Area
                                    </label>
                                    <SelectReact
                                        collection={filterOptions.areas || []}
                                        value={filterData.area_id}
                                        onChange={handleAreaChange}
                                        placeholder="Semua Area"
                                    />
                                </div>

                                {/* Cabang Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Cabang
                                    </label>
                                    <SelectReact
                                        collection={availableCabangs.map((c) => ({
                                            id: c.id,
                                            name: c.nama_cabang,
                                        }))}
                                        value={filterData.cabang_id}
                                        onChange={handleCabangChange}
                                        placeholder="Semua Cabang"
                                    />
                                </div>

                                {/* Sales Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Sales
                                    </label>
                                    <SelectReact
                                        collection={availableSales}
                                        value={filterData.sales_id}
                                        onChange={handleSalesChange}
                                        placeholder="Semua Sales"
                                    />
                                </div>

                                {/* Kecamatan Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
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

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="flex-1 px-2 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium shadow-sm"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                form="filterForm"
                                className="flex-1 px-2 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium shadow-md flex items-center justify-center gap-2"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                    ></path>
                                </svg>
                                <span className="whitespace-nowrap">
                                    Terapkan
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MonitoringLayout>
    );
}
