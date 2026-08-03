import React, { useState, useEffect, useCallback } from "react";
import MonitoringLayout from "../../Layouts/MonitoringLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";

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

export default function RekapSalesDetail({ sales, salesPlan, salesHistories, customers, filters }) {
    const { configuration } = usePage().props;
    const prevYear = configuration?.prev_year || '2025';
    const targetYear = configuration?.target_year || '2026';

    const [search, setSearch] = useState(filters?.search || "");

    const chartDataCustomer = [];
    const chartDataExemplar = [];

    // Jika belum ada riwayat, tambahkan data mock tahun sebelumnya agar format 3 tahun tetap terlihat
    let pastHistories = salesHistories ? salesHistories.filter(h => h.year < parseInt(targetYear)) : [];
    if (pastHistories.length === 0) {
        pastHistories = [
            { year: parseInt(prevYear) - 1, real_customer: 0, target_customer: 0, real_exemplar: 0, target_exemplar: 0 },
            { year: parseInt(prevYear), real_customer: salesPlan ? (salesPlan.ac_customer || salesPlan.real_customer || 0) : 0, target_customer: 0, real_exemplar: salesPlan ? (salesPlan.real_exemplar || 0) : 0, target_exemplar: 0 }
        ];
    } else {
        // Ambil maksimal 2 tahun sebelumnya
        pastHistories = pastHistories.slice(-2);
        // Pastikan kita juga menampilkan prevYear dari import terbaru jika tidak ada di history
        if (!pastHistories.find(h => h.year == parseInt(prevYear))) {
             pastHistories.push({ year: parseInt(prevYear), real_customer: salesPlan ? (salesPlan.ac_customer || salesPlan.real_customer || 0) : 0, target_customer: 0, real_exemplar: salesPlan ? (salesPlan.real_exemplar || 0) : 0, target_exemplar: 0 });
        }
    }

    pastHistories.forEach(h => {
        chartDataCustomer.push({
            name: h.year.toString(),
            Realisasi: h.real_customer,
            Target: h.target_customer,
        });
        chartDataExemplar.push({
            name: h.year.toString(),
            Realisasi: h.real_exemplar,
            Target: h.target_exemplar,
        });
    });

    // Tambahkan target tahun saat ini
    chartDataCustomer.push({
        name: targetYear,
        Realisasi: 0,
        Target: salesPlan ? (salesPlan.target_customer || 0) : 0,
    });
    chartDataExemplar.push({
        name: targetYear,
        Realisasi: 0,
        Target: salesPlan ? (salesPlan.target_exemplar || 0) : 0,
    });

    
    // Auto-update filter
    const applyFilters = useCallback(
        debounce((newSearch) => {
            const query = {};
            if (newSearch) query.search = newSearch;
            
            router.get(route('monitoring.rekap-sales.detail', sales.id), query, {
                preserveState: true,
                replace: true,
            });
        }, 500),
        [sales.id]
    );

    useEffect(() => {
        applyFilters(search);
    }, [search, applyFilters]);

    return (
        <MonitoringLayout activeNav="rekap-sales">
            <Head title={`Detail Sales - ${sales.name}`} />
            <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
                
                {/* Header Section */}
                <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <Link href={route('monitoring.rekap-sales')} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: "600", marginBottom: "12px", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#3b82f6"} onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}>
                            <i className="bi bi-arrow-left"></i> Kembali ke Rekap Sales
                        </Link>
                        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", letterSpacing: "-0.5px" }}>
                            {sales.name}
                        </h1>
                        <p style={{ color: "#64748b", marginTop: "4px" }}>
                            Cabang: <span style={{ fontWeight: "600", color: "#334155" }}>{sales.cabang_name}</span>
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                    {/* Customer Summary */}
                    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                                <i className="bi bi-buildings-fill"></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Rencana Jual {targetYear} (Sekolah)</h3>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", lineHeight: "1.2" }}>
                                    {salesPlan ? (salesPlan.target_customer || 0) : 0}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: "20px" }}>
                            {/* Pure CSS Bar Chart */}
                            <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "10px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                                {(() => {
                                    const maxVal = Math.max(...chartDataCustomer.map(d => Math.max(d.Realisasi, d.Target, 1)));
                                    return chartDataCustomer.map((d, i) => (
                                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", width: "100%", justifyContent: "center", height: "100%" }}>
                                                {/* Bar Realisasi */}
                                                <div style={{ width: "30%", height: `${(d.Realisasi / maxVal) * 100}%`, background: "#10b981", borderRadius: "4px 4px 0 0", position: "relative", minHeight: "2px" }} title={`Realisasi ${d.name}: ${d.Realisasi}`}></div>
                                                {/* Bar Target */}
                                                <div style={{ width: "30%", height: `${(d.Target / maxVal) * 100}%`, background: "#3b82f6", borderRadius: "4px 4px 0 0", position: "relative", minHeight: "2px" }} title={`Target ${d.name}: ${d.Target}`}></div>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", fontWeight: "600" }}>{d.name}</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", fontSize: "12px", color: "#64748b" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "50%" }}></div> Realisasi
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "50%" }}></div> Rencana Jual
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exemplar Summary */}
                    <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #fce7f3, #fbcfe8)", color: "#db2777", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                                <i className="bi bi-book-fill"></i>
                            </div>
                            <div>
                                <h3 style={{ fontSize: "14px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Rencana Jual {targetYear} (Eksemplar)</h3>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", lineHeight: "1.2" }}>
                                    {(salesPlan ? (salesPlan.target_exemplar || 0) : 0).toLocaleString("id-ID")}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: "20px" }}>
                            {/* Pure CSS Bar Chart */}
                            <div style={{ display: "flex", alignItems: "flex-end", height: "200px", gap: "10px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0", position: "relative" }}>
                                {(() => {
                                    const maxVal = Math.max(...chartDataExemplar.map(d => Math.max(d.Realisasi, d.Target, 1)));
                                    return chartDataExemplar.map((d, i) => (
                                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                                            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", width: "100%", justifyContent: "center", height: "100%" }}>
                                                {/* Bar Realisasi */}
                                                <div style={{ width: "30%", height: `${(d.Realisasi / maxVal) * 100}%`, background: "#10b981", borderRadius: "4px 4px 0 0", position: "relative", minHeight: "2px" }} title={`Realisasi ${d.name}: ${d.Realisasi.toLocaleString('id-ID')}`}></div>
                                                {/* Bar Target */}
                                                <div style={{ width: "30%", height: `${(d.Target / maxVal) * 100}%`, background: "#db2777", borderRadius: "4px 4px 0 0", position: "relative", minHeight: "2px" }} title={`Target ${d.name}: ${d.Target.toLocaleString('id-ID')}`}></div>
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", fontWeight: "600" }}>{d.name}</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px", fontSize: "12px", color: "#64748b" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "50%" }}></div> Realisasi
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "12px", height: "12px", background: "#db2777", borderRadius: "50%" }}></div> Rencana Jual
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section (Premium UI) */}
                <div style={{ 
                    background: "#fff", 
                    borderRadius: "16px", 
                    padding: "24px", 
                    marginBottom: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                    border: "1px solid #f1f5f9",
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    alignItems: "center"
                }}>
                    <div style={{ flex: "1 1 250px" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pencarian Sekolah</label>
                        <div style={{ position: "relative" }}>
                            <i className="bi bi-search" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                            <input
                                type="text"
                                placeholder="Ketik nama sekolah atau NPSN..."
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
                                    transition: "all 0.2s ease"
                                }}
                                onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)"; e.target.style.background = "#fff"; }}
                                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; e.target.style.background = "#f8fafc"; }}
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ background: "linear-gradient(to right, #f8fafc, #f1f5f9)", borderBottom: "2px solid #e2e8f0" }}>
                                    <th style={{ padding: "18px 24px", color: "#334155", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Nama Sekolah</th>
                                    <th style={{ padding: "18px 24px", color: "#334155", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>NPSN</th>
                                    <th style={{ padding: "18px 24px", color: "#334155", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px" }}>Jenjang</th>
                                    <th style={{ padding: "18px 24px", color: "#334155", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px", textAlign: "center" }}>Status</th>
                                    <th style={{ padding: "18px 24px", color: "#334155", fontWeight: "700", textTransform: "uppercase", fontSize: "12px", letterSpacing: "1px", textAlign: "center" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.map((customer, index) => (
                                    <tr 
                                        key={index} 
                                        style={{ 
                                            borderBottom: "1px solid #f1f5f9", 
                                            transition: "background-color 0.2s ease" 
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                    >
                                        <td style={{ padding: "18px 24px", color: "#0f172a", fontWeight: "600", display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #eff6ff, #dbeafe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", fontSize: "16px" }}>
                                                <i className="bi bi-building"></i>
                                            </div>
                                            {customer.name}
                                        </td>
                                        <td style={{ padding: "18px 24px", color: "#475569" }}>
                                            {customer.npsn || "-"}
                                        </td>
                                        <td style={{ padding: "18px 24px", color: "#475569" }}>
                                            {customer.jenjang || "-"}
                                        </td>
                                        <td style={{ padding: "18px 24px", textAlign: "center" }}>
                                            {customer.is_active ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#dcfce7", color: "#166534", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                                                    <i className="bi bi-check-circle-fill"></i> Terealisasi
                                                </span>
                                            ) : (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                                                    <i className="bi bi-dash-circle-fill"></i> Gap
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: "18px 24px", textAlign: "center" }}>
                                            <Link
                                                href={route('monitoring.sekolah.show', customer.id)}
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
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.color = "#fff"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#3b82f6"; }}
                                            >
                                                Lihat Detail <i className="bi bi-arrow-right" style={{ marginLeft: "4px" }}></i>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {customers.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: "60px 30px", textAlign: "center", color: "#64748b" }}>
                                            <div style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "16px" }}>
                                                <i className="bi bi-inbox"></i>
                                            </div>
                                            <h3 style={{ fontSize: "18px", color: "#1e293b", fontWeight: "600", marginBottom: "8px" }}>Tidak Ada Data</h3>
                                            <p>Data sekolah tidak ditemukan berdasarkan filter yang dipilih.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination - Redesigned */}
                    {customers.links && customers.links.length > 3 && (
                        <div style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                                Menampilkan <span style={{ fontWeight: "700", color: "#1e293b" }}>{customers.from || 0}</span> - <span style={{ fontWeight: "700", color: "#1e293b" }}>{customers.to || 0}</span> dari <span style={{ fontWeight: "700", color: "#1e293b" }}>{customers.total}</span> data
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                                {customers.links.map((link, i) => {
                                    const isPrevOrNext = link.label.includes('Previous') || link.label.includes('Next');
                                    let label = link.label;
                                    if (label.includes('Previous')) label = '<i class="bi bi-chevron-left"></i>';
                                    if (label.includes('Next')) label = '<i class="bi bi-chevron-right"></i>';

                                    return (
                                        <Link
                                            key={i}
                                            href={link.url || "#"}
                                            style={{
                                                padding: isPrevOrNext ? "8px 12px" : "8px 14px",
                                                borderRadius: "8px",
                                                background: link.active ? "#3b82f6" : link.url ? "#fff" : "transparent",
                                                color: link.active ? "#fff" : link.url ? "#475569" : "#cbd5e1",
                                                border: link.active ? "1px solid #3b82f6" : link.url ? "1px solid #e2e8f0" : "1px solid transparent",
                                                textDecoration: "none",
                                                pointerEvents: link.url ? "auto" : "none",
                                                fontSize: "14px",
                                                fontWeight: link.active ? "600" : "500",
                                                boxShadow: link.active ? "0 4px 6px -1px rgba(59, 130, 246, 0.3)" : link.url ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                                transition: "all 0.2s ease",
                                            }}
                                            dangerouslySetInnerHTML={{ __html: label }}
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
