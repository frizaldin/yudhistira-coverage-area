import React, { useState, useEffect, useCallback } from "react";
import MonitoringLayout from "../../Layouts/MonitoringLayout";
import { Head, Link, router } from "@inertiajs/react";

// Use simple debounce function instead of lodash
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default function UncoveredCustomers({
    customers,
    areas,
    cabangs,
    sales,
    filters,
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const [areaId, setAreaId] = useState(filters?.area_id || "");
    const [cabangId, setCabangId] = useState(filters?.cabang_id || "");
    const [salesId, setSalesId] = useState(filters?.sales_id || "");

    // Auto-update filter
    const applyFilters = useCallback(
        debounce((newSearch, newArea, newCabang, newSales) => {
            const query = {};
            if (newSearch) query.search = newSearch;
            if (newArea) query.area_id = newArea;
            if (newCabang) query.cabang_id = newCabang;
            if (newSales) query.sales_id = newSales;

            router.get(route("monitoring.uncovered-customers"), query, {
                preserveState: true,
                replace: true,
            });
        }, 500),
        [],
    );

    useEffect(() => {
        applyFilters(search, areaId, cabangId, salesId);
    }, [search, areaId, cabangId, salesId, applyFilters]);

    return (
        <MonitoringLayout activeNav="uncovered-customers">
            <Head title="Data Customer Tidak Terpegang" />
            <div
                style={{
                    padding: "30px",
                    maxWidth: "1200px",
                    margin: "0 auto",
                }}
            >
                {/* Header Section */}
                <div style={{ marginBottom: "24px" }}>
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: "800",
                            color: "#1e293b",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Customer Tidak Terpegang (Gap)
                    </h1>
                    <p style={{ color: "#64748b", marginTop: "4px" }}>
                        Daftar customer yang tidak terpegang/realisasi Sales.
                    </p>
                </div>

                {/* Filter Section (Premium UI) */}
                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(12px)",
                        borderRadius: "16px",
                        padding: "24px",
                        marginBottom: "24px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        display: "flex",
                        gap: "16px",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <div style={{ flex: "1 1 250px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#475569",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Pencarian Sekolah
                        </label>
                        <div style={{ position: "relative" }}>
                            <i
                                className="bi bi-search"
                                style={{
                                    position: "absolute",
                                    left: "14px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                }}
                            ></i>
                            <input
                                type="text"
                                placeholder="Ketik nama sekolah..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px 12px 40px",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    color: "#1e293b",
                                    fontSize: "14px",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                    e.target.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e2e8f0";
                                    e.target.style.boxShadow = "none";
                                    e.target.style.background = "#f8fafc";
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: "1 1 200px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#475569",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Area
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={areaId}
                                onChange={(e) => setAreaId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    color: "#1e293b",
                                    fontSize: "14px",
                                    outline: "none",
                                    appearance: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                    e.target.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e2e8f0";
                                    e.target.style.boxShadow = "none";
                                    e.target.style.background = "#f8fafc";
                                }}
                            >
                                <option value="">Semua Area</option>
                                {areas &&
                                    areas.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                            </select>
                            <i
                                className="bi bi-chevron-down"
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                    pointerEvents: "none",
                                }}
                            ></i>
                        </div>
                    </div>

                    <div style={{ flex: "1 1 200px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#475569",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Cabang
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={cabangId}
                                onChange={(e) => setCabangId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    color: "#1e293b",
                                    fontSize: "14px",
                                    outline: "none",
                                    appearance: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                    e.target.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e2e8f0";
                                    e.target.style.boxShadow = "none";
                                    e.target.style.background = "#f8fafc";
                                }}
                            >
                                <option value="">Semua Cabang</option>
                                {cabangs &&
                                    cabangs.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nama_cabang}
                                        </option>
                                    ))}
                            </select>
                            <i
                                className="bi bi-chevron-down"
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                    pointerEvents: "none",
                                }}
                            ></i>
                        </div>
                    </div>

                    <div style={{ flex: "1 1 200px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#475569",
                                marginBottom: "8px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Sales
                        </label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={salesId}
                                onChange={(e) => setSalesId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    color: "#1e293b",
                                    fontSize: "14px",
                                    outline: "none",
                                    appearance: "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#3b82f6";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(59, 130, 246, 0.1)";
                                    e.target.style.background = "#fff";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e2e8f0";
                                    e.target.style.boxShadow = "none";
                                    e.target.style.background = "#f8fafc";
                                }}
                            >
                                <option value="">Semua Sales</option>
                                {sales &&
                                    sales.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                            </select>
                            <i
                                className="bi bi-chevron-down"
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                    pointerEvents: "none",
                                }}
                            ></i>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "16px",
                        boxShadow:
                            "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
                        overflow: "hidden",
                        border: "1px solid #f1f5f9",
                    }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                                fontSize: "14px",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            "linear-gradient(to right, #f8fafc, #f1f5f9)",
                                        borderBottom: "2px solid #e2e8f0",
                                    }}
                                >
                                    <th
                                        style={{
                                            padding: "18px 24px",
                                            color: "#334155",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            fontSize: "12px",
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        Nama Sekolah
                                    </th>
                                    <th
                                        style={{
                                            padding: "18px 24px",
                                            color: "#334155",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            fontSize: "12px",
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        Area
                                    </th>
                                    <th
                                        style={{
                                            padding: "18px 24px",
                                            color: "#334155",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            fontSize: "12px",
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        Cabang
                                    </th>
                                    <th
                                        style={{
                                            padding: "18px 24px",
                                            color: "#334155",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            fontSize: "12px",
                                            letterSpacing: "1px",
                                        }}
                                    >
                                        Sales
                                    </th>
                                    <th
                                        style={{
                                            padding: "18px 24px",
                                            color: "#334155",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            fontSize: "12px",
                                            letterSpacing: "1px",
                                            textAlign: "right",
                                        }}
                                    >
                                        Total Siswa
                                    </th>
                                    <th
                                        style={{
                                            padding: "18px 24px",
                                            color: "#334155",
                                            fontWeight: "700",
                                            textTransform: "uppercase",
                                            fontSize: "12px",
                                            letterSpacing: "1px",
                                            textAlign: "center",
                                        }}
                                    >
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.map((customer, index) => (
                                    <tr
                                        key={index}
                                        style={{
                                            borderBottom: "1px solid #f1f5f9",
                                            transition:
                                                "background-color 0.2s ease",
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                "#f8fafc")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                "transparent")
                                        }
                                    >
                                        <td
                                            style={{
                                                padding: "18px 24px",
                                                color: "#0f172a",
                                                fontWeight: "600",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "10px",
                                                    background:
                                                        "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "#2563eb",
                                                    fontSize: "16px",
                                                }}
                                            >
                                                <i className="bi bi-building"></i>
                                            </div>
                                            {customer.name}
                                        </td>
                                        <td
                                            style={{
                                                padding: "18px 24px",
                                                color: "#475569",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "4px 10px",
                                                    background: "#f1f5f9",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                {customer.area?.name || "-"}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "18px 24px",
                                                color: "#475569",
                                            }}
                                        >
                                            {customer.cabang?.nama_cabang ||
                                                "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "18px 24px",
                                                color: "#475569",
                                            }}
                                        >
                                            {customer.sales?.name ? (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "24px",
                                                            height: "24px",
                                                            borderRadius: "50%",
                                                            background:
                                                                "#e2e8f0",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontSize: "10px",
                                                            color: "#64748b",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {customer.sales.name.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <span>
                                                        {customer.sales.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: "18px 24px",
                                                color: "#0f172a",
                                                textAlign: "right",
                                                fontWeight: "700",
                                                fontSize: "15px",
                                            }}
                                        >
                                            {customer.total_student
                                                ? customer.total_student.toLocaleString(
                                                      "id-ID",
                                                  )
                                                : "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "18px 24px",
                                                textAlign: "center",
                                            }}
                                        >
                                            <Link
                                                href={route(
                                                    "monitoring.sekolah.show",
                                                    customer.id,
                                                )}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: "6px 12px",
                                                    background: "#eff6ff",
                                                    color: "#3b82f6",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    textDecoration: "none",
                                                    transition: "all 0.2s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background =
                                                        "#3b82f6";
                                                    e.currentTarget.style.color =
                                                        "#fff";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background =
                                                        "#eff6ff";
                                                    e.currentTarget.style.color =
                                                        "#3b82f6";
                                                }}
                                            >
                                                Lihat Detail{" "}
                                                <i
                                                    className="bi bi-arrow-right"
                                                    style={{
                                                        marginLeft: "4px",
                                                    }}
                                                ></i>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {customers.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            style={{
                                                padding: "60px 30px",
                                                textAlign: "center",
                                                color: "#64748b",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "40px",
                                                    color: "#cbd5e1",
                                                    marginBottom: "16px",
                                                }}
                                            >
                                                <i className="bi bi-inbox"></i>
                                            </div>
                                            <h3
                                                style={{
                                                    fontSize: "18px",
                                                    color: "#1e293b",
                                                    fontWeight: "600",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                Tidak Ada Data
                                            </h3>
                                            <p>
                                                Data sekolah tidak ditemukan
                                                berdasarkan filter yang dipilih.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Redesigned */}
                    {customers.links && customers.links.length > 3 && (
                        <div
                            style={{
                                padding: "20px 24px",
                                borderTop: "1px solid #f1f5f9",
                                background: "#f8fafc",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#64748b",
                                    fontWeight: "500",
                                }}
                            >
                                Menampilkan{" "}
                                <span
                                    style={{
                                        fontWeight: "700",
                                        color: "#1e293b",
                                    }}
                                >
                                    {customers.from || 0}
                                </span>{" "}
                                -{" "}
                                <span
                                    style={{
                                        fontWeight: "700",
                                        color: "#1e293b",
                                    }}
                                >
                                    {customers.to || 0}
                                </span>{" "}
                                dari{" "}
                                <span
                                    style={{
                                        fontWeight: "700",
                                        color: "#1e293b",
                                    }}
                                >
                                    {customers.total}
                                </span>{" "}
                                data
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {customers.links.map((link, i) => {
                                    const isPrevOrNext =
                                        link.label.includes("Previous") ||
                                        link.label.includes("Next");
                                    let label = link.label;
                                    if (label.includes("Previous"))
                                        label =
                                            '<i class="bi bi-chevron-left"></i>';
                                    if (label.includes("Next"))
                                        label =
                                            '<i class="bi bi-chevron-right"></i>';

                                    return (
                                        <Link
                                            key={i}
                                            href={link.url || "#"}
                                            style={{
                                                padding: isPrevOrNext
                                                    ? "8px 12px"
                                                    : "8px 14px",
                                                borderRadius: "8px",
                                                background: link.active
                                                    ? "#3b82f6"
                                                    : link.url
                                                      ? "#fff"
                                                      : "transparent",
                                                color: link.active
                                                    ? "#fff"
                                                    : link.url
                                                      ? "#475569"
                                                      : "#cbd5e1",
                                                border: link.active
                                                    ? "1px solid #3b82f6"
                                                    : link.url
                                                      ? "1px solid #e2e8f0"
                                                      : "1px solid transparent",
                                                textDecoration: "none",
                                                pointerEvents: link.url
                                                    ? "auto"
                                                    : "none",
                                                fontSize: "14px",
                                                fontWeight: link.active
                                                    ? "600"
                                                    : "500",
                                                boxShadow: link.active
                                                    ? "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
                                                    : link.url
                                                      ? "0 1px 2px rgba(0,0,0,0.05)"
                                                      : "none",
                                                transition: "all 0.2s ease",
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MonitoringLayout>
    );
}
