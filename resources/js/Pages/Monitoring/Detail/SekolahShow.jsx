import React from "react";
import MonitoringLayout from "../../../Layouts/MonitoringLayout";
import { Head, Link } from "@inertiajs/react";

/* ── DESIGN TOKENS ── */
const T = {
    blue: "#1d4ed8",
    blueSoft: "#3b82f6",
    green: "#10b981",
    orange: "#f59e0b",
    red: "#ef4444",
    purple: "#8b5cf6",
    slate: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
    card: "#ffffff",
};

export default function SekolahShow({ customer, activeNav, salesPlans }) {
    // Determine coverage badge
    const isCoverage = customer.is_active;
    
    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Detail Sekolah - ${customer.name}`} />
            <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", background: T.bg, minHeight: "100vh" }}>
                
                {/* Back Button */}
                <Link
                    href={route('monitoring.sekolah')}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: T.slate,
                        textDecoration: "none",
                        fontWeight: "600",
                        marginBottom: "20px",
                        fontSize: "14px",
                        transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => (e.target.style.color = T.blueSoft)}
                    onMouseLeave={(e) => (e.target.style.color = T.slate)}
                >
                    <i className="bi bi-arrow-left"></i> Kembali ke Daftar Sekolah
                </Link>

                {/* Header Section */}
                <div style={{
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(16px)",
                    borderRadius: "20px",
                    padding: "32px",
                    marginBottom: "24px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.04)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "20px"
                }}>
                    <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "18px",
                            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: T.blueSoft,
                            fontSize: "32px",
                            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.8)"
                        }}>
                            <i className="bi bi-building"></i>
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <h1 style={{ fontSize: "28px", fontWeight: "800", color: T.text, margin: 0, letterSpacing: "-0.5px" }}>
                                    {customer.name}
                                </h1>
                                {isCoverage ? (
                                    <span style={{ background: "#dcfce7", color: T.green, padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <i className="bi bi-check-circle-fill"></i> Coverage Area
                                    </span>
                                ) : (
                                    <span style={{ background: "#fee2e2", color: T.red, padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <i className="bi bi-x-circle-fill"></i> Belum Ter-cover
                                    </span>
                                )}
                            </div>
                            <p style={{ color: T.slate, margin: 0, fontSize: "15px", display: "flex", gap: "16px" }}>
                                <span><i className="bi bi-geo-alt-fill" style={{ color: T.blueSoft, marginRight: "4px" }}></i> {customer.kecamatan_name}, {customer.area?.name}</span>
                                <span><i className="bi bi-layers-fill" style={{ color: T.purple, marginRight: "4px" }}></i> Jenjang: {customer.jenjang || "N/A"}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", color: T.slate, fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total Siswa</div>
                        <div style={{ fontSize: "36px", fontWeight: "800", color: T.blue, lineHeight: "1" }}>
                            {customer.total_student ? customer.total_student.toLocaleString("id-ID") : "0"}
                        </div>
                    </div>
                </div>

                {/* Main Grid Content */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                    
                    {/* Informasi Utama */}
                    <div style={{
                        background: T.card,
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        border: `1px solid ${T.border}`
                    }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.text, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="bi bi-info-circle" style={{ color: T.blueSoft }}></i> Informasi Utama
                        </h2>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <InfoRow label="Nama Sekolah" value={customer.name} />
                            <InfoRow label="Cabang" value={customer.cabang?.nama_cabang || "-"} />
                            <InfoRow label="Kecamatan" value={customer.kecamatan_name || "-"} />
                            <InfoRow label="Provinsi (Area)" value={customer.area?.name || "-"} />
                            <InfoRow label="Jenjang" value={customer.jenjang || "-"} />
                            <InfoRow label="Nama Sales" value={customer.sales?.name || "-"} badge={true} />
                        </div>
                    </div>

                    {/* Potensi & Coverage */}
                    <div style={{
                        background: T.card,
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                        border: `1px solid ${T.border}`
                    }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", color: T.text, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <i className="bi bi-bar-chart-line" style={{ color: T.orange }}></i> Potensi & Coverage
                        </h2>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <InfoRow label="Potensi Sekolah (Eksemplar)" value={customer.potensi_sekolah ? customer.potensi_sekolah.toLocaleString('id-ID') : customer.total_student ? customer.total_student.toLocaleString('id-ID') : "0"} isHighlight={true} />
                            <InfoRow label="Sumber Dana" value={customer.sumber_dana || "-"} />
                            
                            <div style={{ marginTop: "12px", paddingTop: "16px", borderTop: `1px dashed ${T.border}` }}>
                                <label style={{ display: "block", fontSize: "13px", color: T.slate, fontWeight: "600", marginBottom: "8px" }}>Penerbit Saat Ini (Pemegang)</label>
                                {customer.penerbit ? (
                                    <div style={{ 
                                        display: "inline-block", 
                                        padding: "8px 16px", 
                                        background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", 
                                        border: `1px solid ${T.border}`,
                                        borderRadius: "12px",
                                        fontWeight: "700",
                                        color: T.purple,
                                        fontSize: "15px"
                                    }}>
                                        {customer.penerbit}
                                    </div>
                                ) : (
                                    <div style={{ color: T.slate, fontStyle: "italic", fontSize: "14px" }}>Belum ada data penerbit</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </MonitoringLayout>
    );
}

// Reusable component for rows
function InfoRow({ label, value, badge = false, isHighlight = false }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: `1px solid #f8fafc` }}>
            <span style={{ color: T.slate, fontSize: "14px", fontWeight: "500" }}>{label}</span>
            {badge ? (
                <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: T.text }}>
                    {value}
                </span>
            ) : (
                <span style={{ color: isHighlight ? T.blue : T.text, fontSize: "14px", fontWeight: isHighlight ? "700" : "600" }}>
                    {value}
                </span>
            )}
        </div>
    );
}
