import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    T, S, Card, Badge, Donut, StatCard, KecamatanChoroplethMap,
    CompetitorChoroplethMap, Bar, CompositionCard, FitBounds
} from "./SalesPerformanceShared";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";

export default function SekolahTab(props) {

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
        sekolahPerPage,
        sekolahSearch, setSekolahSearch,
        sekolahJenjang, setSekolahJenjang,
        sekolahStatus, setSekolahStatus,
        sekolahSort, setSekolahSort,
        filteredListSekolah
    } = props;

    const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(num || 0);

    return (
        <>
                {activeTab === "sekolah" && isSalesDetail && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title="Daftar Sekolah"
                            style={{ flex: 1, minWidth: 300 }}
                            noPad
                        >
                            {/* Filter Bar */}
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderBottom: `1px solid ${T.border}`,
                                    display: "flex",
                                    gap: 10,
                                    flexWrap: "wrap",
                                    backgroundColor: "#f8fafc",
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Cari nama sekolah / kecamatan..."
                                    value={sekolahSearch}
                                    onChange={(e) =>
                                        setSekolahSearch(e.target.value)
                                    }
                                    style={{
                                        flex: 1,
                                        minWidth: 200,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${T.border}`,
                                        outline: "none",
                                    }}
                                />
                                <select
                                    value={sekolahJenjang}
                                    onChange={(e) =>
                                        setSekolahJenjang(e.target.value)
                                    }
                                    style={{
                                        width: 120,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${T.border}`,
                                        outline: "none",
                                    }}
                                >
                                    <option value="">Semua Jenjang</option>
                                    <option value="SD">SD</option>
                                    <option value="SMP">SMP</option>
                                    <option value="SMA">SMA</option>
                                    <option value="SMK">SMK</option>
                                    <option value="DLL">DLL</option>
                                </select>
                                <select
                                    value={sekolahStatus}
                                    onChange={(e) =>
                                        setSekolahStatus(e.target.value)
                                    }
                                    style={{
                                        width: 120,
                                        padding: "6px 12px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: `1px solid ${T.border}`,
                                        outline: "none",
                                    }}
                                >
                                    <option value="">Semua Status</option>
                                    <option value="1">Area Cover</option>
                                    <option value="0">Non Area Cover</option>
                                </select>
                            </div>
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
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "name",
                                                        dir:
                                                            s.key === "name" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Nama Sekolah{" "}
                                                {sekolahSort.key === "name"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "kecamatan_name",
                                                        dir:
                                                            s.key ===
                                                                "kecamatan_name" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Kecamatan{" "}
                                                {sekolahSort.key ===
                                                "kecamatan_name"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "is_active",
                                                        dir:
                                                            s.key ===
                                                                "is_active" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Status{" "}
                                                {sekolahSort.key === "is_active"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "total_student",
                                                        dir:
                                                            s.key ===
                                                                "total_student" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Total Siswa{" "}
                                                {sekolahSort.key ===
                                                "total_student"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "penerbit",
                                                        dir:
                                                            s.key ===
                                                                "penerbit" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Penerbit{" "}
                                                {sekolahSort.key === "penerbit"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "sumber_dana",
                                                        dir:
                                                            s.key ===
                                                                "sumber_dana" &&
                                                            s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Sumber Dana{" "}
                                                {sekolahSort.key ===
                                                "sumber_dana"
                                                    ? sekolahSort.dir === "asc"
                                                        ? "↑"
                                                        : "↓"
                                                    : ""}
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "center",
                                                    width: 50,
                                                }}
                                            >
                                                2023
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "center",
                                                    width: 50,
                                                }}
                                            >
                                                2024
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "center",
                                                    width: 50,
                                                }}
                                            >
                                                2025
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            if (
                                                !filteredListSekolah ||
                                                filteredListSekolah.length === 0
                                            ) {
                                                return (
                                                    <tr>
                                                        <td
                                                            colSpan="10"
                                                            style={{
                                                                ...S.td,
                                                                textAlign:
                                                                    "center",
                                                                color: T.slate,
                                                                padding:
                                                                    "20px 0",
                                                            }}
                                                        >
                                                            Tidak ada data
                                                            sekolah
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            const pageItems =
                                                filteredListSekolah.slice(
                                                    (sekolahPage - 1) *
                                                        sekolahPerPage,
                                                    sekolahPage *
                                                        sekolahPerPage,
                                                );
                                            const groups = {};
                                            pageItems.forEach((s) => {
                                                const j =
                                                    s.jenjang || "Lainnya";
                                                if (!groups[j]) groups[j] = [];
                                                groups[j].push(s);
                                            });
                                            const jenjangOrder = {
                                                SD: 1,
                                                SMP: 2,
                                                SMA: 3,
                                                SMK: 4,
                                                Lainnya: 5,
                                            };
                                            const sortedGroups = Object.keys(
                                                groups,
                                            ).sort(
                                                (a, b) =>
                                                    (jenjangOrder[a] || 99) -
                                                    (jenjangOrder[b] || 99),
                                            );

                                            let globalIndex =
                                                (sekolahPage - 1) *
                                                sekolahPerPage;
                                            return sortedGroups.map(
                                                (jenjangKey) => (
                                                    <React.Fragment
                                                        key={jenjangKey}
                                                    >
                                                        <tr>
                                                            <td
                                                                colSpan="10"
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight:
                                                                        "bold",
                                                                    backgroundColor:
                                                                        "#f8fafc",
                                                                    color: T.slate,
                                                                    textAlign:
                                                                        "left",
                                                                }}
                                                            >
                                                                Jenjang:{" "}
                                                                <span
                                                                    style={{
                                                                        color: T.blue,
                                                                    }}
                                                                >
                                                                    {jenjangKey}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        {groups[jenjangKey].map(
                                                            (s, idx) => {
                                                                globalIndex++;
                                                                return (
                                                                    <tr
                                                                        key={`${jenjangKey}-${idx}`}
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
                                                                            {
                                                                                globalIndex
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                fontWeight: 700,
                                                                            }}
                                                                        >
                                                                            {
                                                                                s.name
                                                                            }
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                color: T.slate,
                                                                            }}
                                                                        >
                                                                            {s.kecamatan_name ||
                                                                                "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                textAlign:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            {s.is_active ? (
                                                                                <Badge
                                                                                    label="Area Cover"
                                                                                    bg={`${T.green}15`}
                                                                                    color={
                                                                                        T.green
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <Badge
                                                                                    label="Non Area Cover"
                                                                                    bg={`${T.red}15`}
                                                                                    color={
                                                                                        T.red
                                                                                    }
                                                                                />
                                                                            )}
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
                                                                                s.total_student,
                                                                            )}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                            }}
                                                                        >
                                                                            {s.penerbit ||
                                                                                "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                            }}
                                                                        >
                                                                            {s.sumber_dana ||
                                                                                "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                textAlign:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            {s.realisasi_2023 ? (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius:
                                                                                            "50%",
                                                                                        background:
                                                                                            "#f0fdf4",
                                                                                        color: T.green,
                                                                                        margin: "0 auto",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    ✓
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius:
                                                                                            "50%",
                                                                                        background:
                                                                                            "#fef2f2",
                                                                                        color: T.red,
                                                                                        margin: "0 auto",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    ✗
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                textAlign:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            {s.realisasi_2024 ? (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius:
                                                                                            "50%",
                                                                                        background:
                                                                                            "#f0fdf4",
                                                                                        color: T.green,
                                                                                        margin: "0 auto",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    ✓
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius:
                                                                                            "50%",
                                                                                        background:
                                                                                            "#fef2f2",
                                                                                        color: T.red,
                                                                                        margin: "0 auto",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    ✗
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                ...S.td,
                                                                                textAlign:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            {s.realisasi_2025 ? (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius:
                                                                                            "50%",
                                                                                        background:
                                                                                            "#f0fdf4",
                                                                                        color: T.green,
                                                                                        margin: "0 auto",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    ✓
                                                                                </div>
                                                                            ) : (
                                                                                <div
                                                                                    style={{
                                                                                        display:
                                                                                            "flex",
                                                                                        justifyContent:
                                                                                            "center",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        width: 24,
                                                                                        height: 24,
                                                                                        borderRadius:
                                                                                            "50%",
                                                                                        background:
                                                                                            "#fef2f2",
                                                                                        color: T.red,
                                                                                        margin: "0 auto",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    ✗
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </React.Fragment>
                                                ),
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {filteredListSekolah &&
                                filteredListSekolah.length > sekolahPerPage && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "12px 16px",
                                            borderTop: `1px solid ${T.border}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 12,
                                                color: T.slate,
                                            }}
                                        >
                                            Menampilkan{" "}
                                            {(sekolahPage - 1) *
                                                sekolahPerPage +
                                                1}{" "}
                                            -{" "}
                                            {Math.min(
                                                sekolahPage * sekolahPerPage,
                                                filteredListSekolah.length,
                                            )}{" "}
                                            dari {filteredListSekolah.length}
                                        </div>
                                        <div
                                            style={{ display: "flex", gap: 6 }}
                                        >
                                            <button
                                                onClick={() =>
                                                    setSekolahPage((p) =>
                                                        Math.max(1, p - 1),
                                                    )
                                                }
                                                disabled={sekolahPage === 1}
                                                style={{
                                                    padding: "4px 12px",
                                                    fontSize: 12,
                                                    borderRadius: 4,
                                                    border: `1px solid ${T.border}`,
                                                    backgroundColor:
                                                        sekolahPage === 1
                                                            ? "#f8fafc"
                                                            : "white",
                                                    color:
                                                        sekolahPage === 1
                                                            ? "#cbd5e1"
                                                            : T.text,
                                                    cursor:
                                                        sekolahPage === 1
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Sebelumnya
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setSekolahPage((p) =>
                                                        Math.min(
                                                            Math.ceil(
                                                                filteredListSekolah.length /
                                                                    sekolahPerPage,
                                                            ),
                                                            p + 1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    sekolahPage ===
                                                    Math.ceil(
                                                        filteredListSekolah.length /
                                                            sekolahPerPage,
                                                    )
                                                }
                                                style={{
                                                    padding: "4px 12px",
                                                    fontSize: 12,
                                                    borderRadius: 4,
                                                    border: `1px solid ${T.border}`,
                                                    backgroundColor:
                                                        sekolahPage ===
                                                        Math.ceil(
                                                            filteredListSekolah.length /
                                                                sekolahPerPage,
                                                        )
                                                            ? "#f8fafc"
                                                            : "white",
                                                    color:
                                                        sekolahPage ===
                                                        Math.ceil(
                                                            filteredListSekolah.length /
                                                                sekolahPerPage,
                                                        )
                                                            ? "#cbd5e1"
                                                            : T.text,
                                                    cursor:
                                                        sekolahPage ===
                                                        Math.ceil(
                                                            filteredListSekolah.length /
                                                                sekolahPerPage,
                                                        )
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                Selanjutnya
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </Card>
                    </div>
        )}
        </>
    );
}
