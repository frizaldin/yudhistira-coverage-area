import React, { useState } from "react";
import { T, S, ConcentricActivityDonut, Donut } from "./SalesPerformanceShared";

export default function VisitActivityCharts({
    kpiData,
    insights,
    openKegiatanFromChart,
    resultBreakdown = [],
}) {
    const [visitHover, setVisitHover] = useState(null);

    const activityColorMap = {
        Pendekatan: "#1d4ed8",
        SP: "#0d9488",
        Faktur: "#f59e0b",
        Gagal: "#dc2626",
        Promosi: "#8b5cf6",
        Penagihan: "#06b6d4",
        "Tidak Diketahui": "#94a3b8",
    };

    const monthlyActivities = kpiData?.monthlyActivities || [];
    const maxActivity = Math.max(
        ...monthlyActivities.map((m) => m.count || 0),
        1,
    );

    const handleAktivitasClick = (item) => {
        if (!item?.label || item.label === "Belum Ada") return;
        openKegiatanFromChart?.(item.label);
    };

    const totalVisits = monthlyActivities.reduce(
        (a, m) => a + (m.count || 0),
        0,
    );

    const areaCover = Number(
        kpiData?.areaCover ?? insights?.totalAreaCover ?? 0,
    );
    const activities = kpiData?.activityDistribution || [];
    const totalAkt = activities.reduce(
        (a, c) => a + (Number(c.value) || 0),
        0,
    );
    const hasActivityData = activities.length > 0;

    return (
        <div
            className="grid grid-cols-1 md:grid-cols-3 gap-[10px]"
            style={{ alignItems: "stretch" }}
        >
            {/* Grafik Kunjungan */}
            <div style={{ display: "flex", flexDirection: "column" }}>
                {monthlyActivities.length > 0 && (
                    <div
                        style={{
                            ...S.card,
                            padding: 0,
                            overflow: "visible",
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                        }}
                    >
                        <div
                            style={{
                                padding: "10px 14px",
                                borderBottom: `1px solid ${T.border}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "#f8fafc",
                            }}
                        >
                            <div
                                style={{
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
                                        background: "#e0e7ff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
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
                                        Grafik Kunjungan
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 9.5,
                                            color: T.slate,
                                            marginTop: 1,
                                        }}
                                    >
                                        Tren kunjungan (aktivitas sales)
                                        bulanan di tahun{" "}
                                        {kpiData?.year ||
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
                                Total: {totalVisits}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "14px 16px 10px",
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 6,
                                position: "relative",
                                overflow: "visible",
                            }}
                        >
                            {monthlyActivities.map((m, i) => {
                                const barH =
                                    maxActivity > 0
                                        ? Math.max(
                                              (m.count / maxActivity) * 60,
                                              m.count > 0 ? 6 : 2,
                                          )
                                        : 2;
                                const isCurrentMonth =
                                    i === new Date().getMonth();
                                const isHovered = visitHover?.index === i;

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 4,
                                            position: "relative",
                                            cursor: "pointer",
                                        }}
                                        onMouseEnter={() =>
                                            setVisitHover({
                                                index: i,
                                                month: m.month,
                                                year: m.year,
                                                count: m.count,
                                                breakdown: m.breakdown || [],
                                            })
                                        }
                                        onMouseLeave={() => setVisitHover(null)}
                                    >
                                        {isHovered && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    bottom: "100%",
                                                    left: "50%",
                                                    transform:
                                                        "translateX(-50%)",
                                                    marginBottom: 8,
                                                    zIndex: 40,
                                                    minWidth: 140,
                                                    background: "#0f172a",
                                                    color: "#fff",
                                                    borderRadius: 8,
                                                    padding: "8px 10px",
                                                    boxShadow:
                                                        "0 10px 25px rgba(15,23,42,0.25)",
                                                    pointerEvents: "none",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        marginBottom: 6,
                                                        color: "#e2e8f0",
                                                    }}
                                                >
                                                    {m.month}
                                                    {m.year
                                                        ? ` ${m.year}`
                                                        : ""}{" "}
                                                    · Total {m.count}
                                                </div>
                                                {(m.breakdown || []).length >
                                                0 ? (
                                                    (m.breakdown || []).map(
                                                        (b, bi) => (
                                                            <div
                                                                key={bi}
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    gap: 12,
                                                                    fontSize: 10,
                                                                    marginBottom: 3,
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        display:
                                                                            "inline-flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 6,
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            width: 7,
                                                                            height: 7,
                                                                            borderRadius: 2,
                                                                            background:
                                                                                activityColorMap[
                                                                                    b
                                                                                        .label
                                                                                ] ||
                                                                                "#94a3b8",
                                                                            flexShrink: 0,
                                                                        }}
                                                                    />
                                                                    {b.label}
                                                                </span>
                                                                <strong>
                                                                    {b.value}
                                                                </strong>
                                                            </div>
                                                        ),
                                                    )
                                                ) : (
                                                    <div
                                                        style={{
                                                            fontSize: 10,
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        Tidak ada aktivitas
                                                    </div>
                                                )}
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        left: "50%",
                                                        bottom: -5,
                                                        transform:
                                                            "translateX(-50%) rotate(45deg)",
                                                        width: 10,
                                                        height: 10,
                                                        background: "#0f172a",
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <span
                                            style={{
                                                fontSize: 9.5,
                                                fontWeight: 800,
                                                color:
                                                    m.count > 0
                                                        ? isCurrentMonth ||
                                                          isHovered
                                                            ? "#4f46e5"
                                                            : T.text
                                                        : T.slate,
                                            }}
                                        >
                                            {m.count > 0 ? m.count : ""}
                                        </span>
                                        <div
                                            style={{
                                                width: "100%",
                                                maxWidth: 28,
                                                height: barH,
                                                borderRadius: "4px 4px 0 0",
                                                background:
                                                    isCurrentMonth || isHovered
                                                        ? "linear-gradient(180deg, #4f46e5, #818cf8)"
                                                        : m.count > 0
                                                          ? "linear-gradient(180deg, #3b82f6, #93c5fd)"
                                                          : "#f1f5f9",
                                                transition:
                                                    "height 0.6s ease, filter 0.2s",
                                                filter: isHovered
                                                    ? "brightness(1.12)"
                                                    : "none",
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color:
                                                    isCurrentMonth || isHovered
                                                        ? "#4f46e5"
                                                        : T.slate,
                                                fontWeight:
                                                    isCurrentMonth || isHovered
                                                        ? 700
                                                        : 500,
                                                paddingTop: 2,
                                                borderTop: isCurrentMonth
                                                    ? "2px solid #4f46e5"
                                                    : "2px solid transparent",
                                            }}
                                        >
                                            {m.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Distribusi Aktivitas */}
            <div style={{ display: "flex", flexDirection: "column" }}>
                {kpiData?.activityDistribution !== undefined && (
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
                                padding: "10px 14px",
                                borderBottom: `1px solid ${T.border}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: "#f8fafc",
                            }}
                        >
                            <div
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 6,
                                    background: "#ecfdf5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
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
                                    Distribusi Aktivitas
                                </div>
                                <div
                                    style={{
                                        fontSize: 9.5,
                                        color: T.slate,
                                        marginTop: 1,
                                    }}
                                >
                                    Tiap ring = aktivitas vs Area Cover
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 12,
                            }}
                        >
                            <ConcentricActivityDonut
                                activities={activities}
                                areaCover={areaCover}
                                size={110}
                                ringWidth={11}
                                gap={3}
                                maxRings={5}
                                label={areaCover}
                                sub="Area Cover"
                                onRingClick={handleAktivitasClick}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    maxHeight: 110,
                                    overflowY: "auto",
                                    paddingRight: 4,
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                {hasActivityData ? (
                                    activities.slice(0, 5).map((item, idx) => {
                                        const pct =
                                            areaCover > 0
                                                ? (
                                                      (item.value / areaCover) *
                                                      100
                                                  ).toFixed(0)
                                                : 0;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() =>
                                                    handleAktivitasClick(item)
                                                }
                                                title="Klik untuk lihat detail kegiatan"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    cursor: "pointer",
                                                    borderRadius: 4,
                                                    padding: "1px 2px",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background =
                                                        "#f1f5f9";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background =
                                                        "transparent";
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 2,
                                                        background: item.color,
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        fontSize: 9.5,
                                                        color: T.text,
                                                        fontWeight: 500,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {item.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 9.5,
                                                        color: T.slate,
                                                        marginLeft: "auto",
                                                        fontWeight: 700,
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {item.value}
                                                    <span
                                                        style={{
                                                            fontWeight: 500,
                                                            color: "#94a3b8",
                                                            marginLeft: 3,
                                                        }}
                                                    >
                                                        ({pct}%)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: T.slate,
                                            fontStyle: "italic",
                                        }}
                                    >
                                        Belum ada data aktivitas.
                                    </div>
                                )}
                                {hasActivityData && areaCover > 0 && (
                                    <div
                                        style={{
                                            fontSize: 8.5,
                                            color: "#94a3b8",
                                            marginTop: 2,
                                            borderTop: `1px solid ${T.border}`,
                                            paddingTop: 4,
                                        }}
                                    >
                                        Total akt. {totalAkt} · AC {areaCover}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hasil Kunjungan */}
            <div style={{ display: "flex", flexDirection: "column" }}>
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
                            padding: "10px 14px",
                            borderBottom: `1px solid ${T.border}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "#f8fafc",
                        }}
                    >
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                background: "#fef3c7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <i
                                className="bi bi-clipboard-check"
                                style={{ fontSize: 12, color: "#d97706" }}
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
                                Hasil Kunjungan
                            </div>
                            <div
                                style={{
                                    fontSize: 9.5,
                                    color: T.slate,
                                    marginTop: 1,
                                }}
                            >
                                Ringkasan hasil aktivitas
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            padding: 10,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flex: 1,
                        }}
                    >
                        <Donut
                            segments={resultBreakdown}
                            size={70}
                            ring={12}
                            label={resultBreakdown.reduce(
                                (a, c) => a + (c.value || 0),
                                0,
                            )}
                            sub="Aktivitas"
                        />
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                maxHeight: 120,
                                overflowY: "auto",
                                paddingRight: 4,
                            }}
                        >
                            {(resultBreakdown || []).length > 0 ? (
                                resultBreakdown.map((s, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: 6,
                                            fontSize: 11,
                                            gap: 8,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                color: T.slate,
                                                minWidth: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    backgroundColor: s.color,
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                color: T.text,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {s.value}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: T.slate,
                                        fontStyle: "italic",
                                    }}
                                >
                                    Belum ada data hasil kunjungan.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
