import React, { useState } from "react";
import { T, Card } from "./SalesPerformanceShared";

export default function AnalisisTab(props) {
    const {
        activeTab,
        isSalesDetail,
        listSekolah,
        configuration,
        kegiatanSales
    } = props;

    if (activeTab !== "analisis" || !isSalesDetail) return null;

    const targetYear = configuration?.target_year || "2026";
    const predictionYear = parseInt(targetYear) + 1;

    // Filter listSekolah based on is_active
    const areaCoverSchools = (listSekolah || []).filter(s => s.is_active == 1);
    const nonAreaCoverSchools = (listSekolah || []).filter(s => s.is_active != 1);

    const year1 = parseInt(targetYear) - 2;
    const year2 = parseInt(targetYear) - 1;
    const recommendationData = (listSekolah || []).filter(s => {
        const hasY1 = s[`realisasi_${year1}`];
        const hasY2 = s[`realisasi_${year2}`];
        return hasY1 || hasY2;
    }).map(s => {
        const hasY1 = s[`realisasi_${year1}`];
        const hasY2 = s[`realisasi_${year2}`];
        let status = "";
        let color = "";
        if (hasY1 && hasY2) {
            status = "Direkomendasikan";
            color = T.green;
        } else if (hasY1 && !hasY2) {
            status = "Dapat Dipertimbangkan";
            color = T.orange || "#f59e0b";
        } else if (!hasY1 && hasY2) {
            status = "Direkomendasikan";
            color = T.green;
        }
        return { ...s, recStatus: status, recColor: color };
    });

    // Helper component for table
    const SchoolTable = ({ title, data, color }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 10;
        const totalPages = Math.ceil(data.length / itemsPerPage);
        
        const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        
        return (
            <Card title={title} style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column" }} noPad>
                <div style={{ overflowX: "auto", flex: 1 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${T.border}` }}>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, width: 40 }}>No</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700 }}>Nama Sekolah</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "right" }}>Target {targetYear}</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "right" }}>Realisasi {targetYear}</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "right" }}>Total Siswa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length > 0 ? (
                                currentData.map((s, idx) => {
                                    return (
                                        <tr key={s.id || idx} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                                            <td style={{ padding: "12px 16px", color: T.slate }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                            <td style={{ padding: "12px 16px", fontWeight: 600, color: T.text }}>{s.name}</td>
                                            <td style={{ padding: "12px 16px", color: T.slate, textAlign: "right" }}>
                                                {new Intl.NumberFormat("id-ID").format(s.target_exemplar_current || 0)}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: color, fontWeight: 700, textAlign: "right" }}>
                                                {new Intl.NumberFormat("id-ID").format(s.real_exemplar_current || 0)}
                                            </td>
                                            <td style={{ padding: "12px 16px", color: T.slate, textAlign: "right", fontWeight: 600 }}>
                                                {new Intl.NumberFormat("id-ID").format(s.total_student || 0)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: T.slate }}>
                                        Tidak ada data
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                        <div style={{ fontSize: 11, color: T.slate }}>
                            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, data.length)} dari {data.length}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: "4px 12px",
                                    fontSize: 11,
                                    borderRadius: 6,
                                    border: `1px solid ${T.border}`,
                                    background: currentPage === 1 ? "#f1f5f9" : "white",
                                    color: currentPage === 1 ? T.slate : T.text,
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                }}
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: "4px 12px",
                                    fontSize: 11,
                                    borderRadius: 6,
                                    border: `1px solid ${T.border}`,
                                    background: currentPage === totalPages ? "#f1f5f9" : "white",
                                    color: currentPage === totalPages ? T.slate : T.text,
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        );
    };

    const RecommendationTable = ({ title, data }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 10;
        const totalPages = Math.ceil(data.length / itemsPerPage);
        const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        
        const renderCheck = (hasRealisasi) => {
            if (hasRealisasi) return <i className="bi bi-check-circle-fill" style={{ color: T.green, fontSize: 14 }}></i>;
            return <i className="bi bi-x-circle-fill" style={{ color: "#cbd5e1", fontSize: 14 }}></i>;
        };

        return (
            <Card title={title} style={{ width: "100%", display: "flex", flexDirection: "column", marginTop: 16 }} noPad>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${T.border}` }}>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, width: 40 }}>No</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700 }}>Nama Sekolah</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700 }}>Area / Cabang</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "center" }}>2023</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "center" }}>2024</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "center" }}>2025</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700, textAlign: "center" }}>2026</th>
                                <th style={{ padding: "12px 16px", color: T.slate, fontWeight: 700 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.length > 0 ? (
                                currentData.map((s, idx) => (
                                    <tr key={s.id || idx} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"} onMouseLeave={(e) => e.currentTarget.style.background = "white"}>
                                        <td style={{ padding: "12px 16px", color: T.slate }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                        <td style={{ padding: "12px 16px", fontWeight: 600, color: T.text }}>{s.name}</td>
                                        <td style={{ padding: "12px 16px", color: T.slate }}>{s.kecamatan_name || s.cabang_name || "-"}</td>
                                        <td style={{ padding: "12px 16px", textAlign: "center" }}>{renderCheck(s.realisasi_2023)}</td>
                                        <td style={{ padding: "12px 16px", textAlign: "center" }}>{renderCheck(s.realisasi_2024)}</td>
                                        <td style={{ padding: "12px 16px", textAlign: "center" }}>{renderCheck(s.realisasi_2025)}</td>
                                        <td style={{ padding: "12px 16px", textAlign: "center" }}>{renderCheck(s.realisasi_2026)}</td>
                                        <td style={{ padding: "12px 16px", fontWeight: 700, color: s.recColor }}>
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: `${s.recColor}15`, fontSize: 11 }}>
                                                {s.recStatus}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ padding: "24px", textAlign: "center", color: T.slate }}>
                                        Tidak ada data rekomendasi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                        <div style={{ fontSize: 11, color: T.slate }}>
                            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, data.length)} dari {data.length}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: "4px 12px",
                                    fontSize: 11,
                                    borderRadius: 6,
                                    border: `1px solid ${T.border}`,
                                    background: currentPage === 1 ? "#f1f5f9" : "white",
                                    color: currentPage === 1 ? T.slate : T.text,
                                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                }}
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: "4px 12px",
                                    fontSize: 11,
                                    borderRadius: 6,
                                    border: `1px solid ${T.border}`,
                                    background: currentPage === totalPages ? "#f1f5f9" : "white",
                                    color: currentPage === totalPages ? T.slate : T.text,
                                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Title Section */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 4, height: 24, background: T.blue, borderRadius: 4 }} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>
                    Rekapan Area Cover {targetYear}
                </h2>
            </div>
            
            {/* Tables Section (2 columns) */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
                <SchoolTable title="Area Cover" data={areaCoverSchools} color={T.green} />
                <SchoolTable title="Non Area Cover" data={nonAreaCoverSchools} color={T.red} />
            </div>

            {/* Recommendation Table */}
            <RecommendationTable title={`Rekomendasi Area Cover Tahun Ini (${targetYear})`} data={recommendationData} />
        </div>
    );
}
