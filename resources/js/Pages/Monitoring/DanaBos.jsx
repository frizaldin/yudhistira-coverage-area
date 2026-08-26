import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import DanaBosSegmenTab from "@/Pages/Monitoring/Tabs/DanaBosSegmenTab";
import DashboardTabArea from "@/Pages/Monitoring/Tabs/DashboardTabArea";

/* ── DESIGN TOKENS ── */
const T = {
    blue: "#2563eb",
    slate: "#475569",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
};

const sel = {
    fontSize: 11,
    padding: "5px 24px 5px 9px",
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    background: "white",
    color: T.text,
    cursor: "pointer",
    backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 7px center",
    appearance: "none",
    outline: "none",
};

export default function DanaBos({
    tahun,
    prevYear,
    filters = {},
    filterOptions = { areas: [], cabangs: [] },
    configuration,
    kpiData = {},
    insights = {},
    listSekolah = [],
    listKecamatanSegmen = [],
    listSegmenArea = [],
    jenjangBreakdown = [],
    sumberDanaBreakdown = [],
    kegiatanSales = [],
    activityBreakdown = [],
    resultBreakdown = [],
    salesProfile = null,
}) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showScoreInfo, setShowScoreInfo] = useState(false);
    const [sekolahPage, setSekolahPage] = useState(1);
    const sekolahPerPage = 10;

    const yearOptions = [];
    for (let y = tahun + 1; y >= tahun - 3; y--) yearOptions.push(y);

    const updateFilter = (key, value) => {
        const params = new URLSearchParams(window.location.search);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        if (key === "area_id") params.delete("cabang_id");
        router.get(
            window.location.pathname,
            Object.fromEntries(params.entries()),
            { preserveState: true, preserveScroll: true },
        );
    };

    const showAreaFilter = filterOptions.areas && filterOptions.areas.length > 0;
    const showCabangFilter =
        filterOptions.cabangs && filterOptions.cabangs.length > 0;

    const cabangsForArea = showCabangFilter
        ? filterOptions.cabangs.filter(
              (c) =>
                  !filters.area_id ||
                  String(c.area_id) === String(filters.area_id),
          )
        : [];

    const cfg = configuration || {
        target_year: tahun,
        prev_year: prevYear,
    };

    return (
        <MonitoringLayout activeNav="dana-bos">
            <Head title="Dana BOS" />

            <div style={{ minHeight: "100vh", background: T.bg }}>
                {/* HEADER */}
                <div
                    style={{
                        background: "white",
                        padding: "8px 14px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        position: "sticky",
                        top: 0,
                        zIndex: 40,
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
                            Monitoring
                        </div>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: T.text,
                                letterSpacing: "-0.5px",
                                lineHeight: 1.15,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <i
                                className="bi bi-cash-coin"
                                style={{ color: T.blue, fontSize: 16 }}
                            />
                            Dana BOS
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: T.slate,
                                    letterSpacing: 0,
                                }}
                            >
                                · {tahun}
                            </span>
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
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                            }}
                        >
                            <i
                                className="bi bi-calendar3"
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
                                    Tahun
                                </div>
                                <select
                                    style={sel}
                                    value={tahun}
                                    onChange={(e) =>
                                        updateFilter("tahun", e.target.value)
                                    }
                                >
                                    {yearOptions.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {showAreaFilter && (
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
                                        value={filters.area_id || ""}
                                        onChange={(e) =>
                                            updateFilter(
                                                "area_id",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Semua Area</option>
                                        {filterOptions.areas.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {showCabangFilter && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                }}
                            >
                                <i
                                    className="bi bi-building"
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
                                        value={filters.cabang_id || ""}
                                        onChange={(e) =>
                                            updateFilter(
                                                "cabang_id",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">Semua Cabang</option>
                                        {cabangsForArea.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.nama_cabang}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABS */}
                    <div
                        style={{
                        background: "white",
                                    borderBottom: `1px solid ${T.border}`,
                        padding: "0 14px",
                                    display: "flex",
                        gap: 18,
                    }}
                >
                    {[
                        {
                            id: "overview",
                            label: "Overview",
                            icon: "bi-grid-1x2",
                        },
                        {
                            id: "segmen",
                            label: "Tabel Segmen",
                            icon: "bi-table",
                        },
                    ].map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "8px 0",
                                fontSize: 10.5,
                                fontWeight: 700,
                                color:
                                    activeTab === tab.id ? T.blue : T.slate,
                                borderBottom: `2px solid ${
                                    activeTab === tab.id
                                        ? T.blue
                                        : "transparent"
                                }`,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            <i
                                className={`bi ${tab.icon}`}
                                style={{ fontSize: 11 }}
                            />
                            {tab.label}
                        </div>
                    ))}
                </div>

                                                    <div
                                                        style={{
                        padding: "8px 12px",
                                                            display: "flex",
                        flexDirection: "column",
                                                            gap: 8,
                                                        }}
                                                    >
                    {activeTab === "overview" && (
                        <DashboardTabArea
                            activeTab="dashboard"
                            setActiveTab={setActiveTab}
                            isSalesDetail={true}
                            hideMap={true}
                            hideScore={true}
                            hideTrlGrade={true}
                            kpiData={kpiData}
                            insights={insights}
                            salesProfile={salesProfile}
                            listSekolah={listSekolah}
                            jenjangBreakdown={jenjangBreakdown}
                            sumberDanaBreakdown={sumberDanaBreakdown}
                            activityBreakdown={activityBreakdown}
                            resultBreakdown={resultBreakdown}
                            kegiatanSales={kegiatanSales}
                            cabangCode={filters.cabang_id || null}
                            provinceCode={filters.area_id || null}
                            filters={{
                                ...filters,
                                tahun: filters?.tahun || tahun,
                            }}
                            showScoreInfo={showScoreInfo}
                            setShowScoreInfo={setShowScoreInfo}
                            sekolahPage={sekolahPage}
                            setSekolahPage={setSekolahPage}
                            sekolahPerPage={sekolahPerPage}
                            openSekolahFromChart={undefined}
                            cabangName="Dana BOS"
                            areaName="Dana BOS"
                            pageTitle="Dana BOS"
                        />
                    )}

                    {activeTab === "segmen" && (
                        <DanaBosSegmenTab
                            listSegmenArea={listSegmenArea}
                            listKecamatanSegmen={listKecamatanSegmen}
                            configuration={cfg}
                            insights={insights}
                            filters={{
                                ...filters,
                                tahun: filters?.tahun || tahun,
                            }}
                        />
                    )}
                </div>
            </div>
        </MonitoringLayout>
    );
}
