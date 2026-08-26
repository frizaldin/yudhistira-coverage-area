import React, { useMemo, useState } from "react";
import { T, S, ConcentricActivityDonut, Donut } from "./SalesPerformanceShared";

/** Warna + urutan tetap — sama di Grafik Kunjungan, Distribusi, Hasil Kunjungan */
const ACTIVITY_ORDER = [
    "Pendekatan",
    "Promosi",
    "SP",
    "Faktur",
    "Penagihan",
    "Gagal",
];
const ACTIVITY_COLORS = {
    Pendekatan: "#64748b",
    Promosi: "#0d9488",
    SP: "#1d4ed8",
    Faktur: "#16a34a",
    Penagihan: "#f59e0b",
    Gagal: "#dc2626",
};

function normalizeActivityLabel(label) {
    const raw = String(label || "").trim();
    if (!raw) return "";
    const hit = ACTIVITY_ORDER.find(
        (k) => k.toLowerCase() === raw.toLowerCase(),
    );
    return hit || raw;
}

export default function VisitActivityCharts({
    kpiData,
    insights,
    openKegiatanFromChart,
    resultBreakdown = [],
    listSekolah = [],
    kegiatanSales = [],
    activeAktivitasFilter = "",
}) {
    const [visitHover, setVisitHover] = useState(null);

    const monthlyActivities = kpiData?.monthlyActivities || [];

    const activitySeries = useMemo(() => {
        return ACTIVITY_ORDER.map((label) => ({
            label,
            color: ACTIVITY_COLORS[label],
            values: monthlyActivities.map((m) => {
                const hit = (m.breakdown || []).find(
                    (x) =>
                        normalizeActivityLabel(x.label) === label,
                );
                return Number(hit?.value) || 0;
            }),
        }));
    }, [monthlyActivities]);

    const maxActivity = Math.max(
        1,
        ...activitySeries.flatMap((s) => s.values),
        ...monthlyActivities.map((m) => m.count || 0),
    );

    const handleAktivitasClick = (item) => {
        const label =
            typeof item === "string"
                ? item
                : String(item?.label || "").trim();
        if (!label || label === "Belum Ada") return;
        openKegiatanFromChart?.(label);
        // Scroll ke tabel sekolah setelah filter diterapkan
        requestAnimationFrame(() => {
            document
                .getElementById("sekolah-aktivitas-table")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const totalVisits = monthlyActivities.reduce(
        (a, m) => a + (m.count || 0),
        0,
    );

    const areaCover = Number(
        kpiData?.areaCover ?? insights?.totalAreaCover ?? 0,
    );

    const activities = useMemo(() => {
        // Samakan dengan tabel Sekolah & Aktivitas:
        // distinct sekolah Area Cover per jenis aktivitas (customer_id atau nama)
        const acSchools = (listSekolah || []).filter((s) => !!s.is_active);
        if (acSchools.length > 0 && (kegiatanSales || []).length > 0) {
            const normalizeSchoolName = (name) =>
                String(name || "")
                    .toUpperCase()
                    .replace(/\s+/g, " ")
                    .trim();
            const rowsById = {};
            const nameToId = {};
            acSchools.forEach((s) => {
                rowsById[s.id] = {};
                const n = normalizeSchoolName(s.name);
                if (n && nameToId[n] == null) nameToId[n] = s.id;
            });

            (kegiatanSales || []).forEach((k) => {
                let schoolId = null;
                const cid = k.customer_id;
                if (cid && rowsById[cid]) {
                    schoolId = cid;
                } else {
                    const n = normalizeSchoolName(k.customer_name);
                    if (n && nameToId[n] != null) schoolId = nameToId[n];
                }
                if (!schoolId) return;
                const akt = normalizeActivityLabel(k.aktivitas);
                if (!akt || !ACTIVITY_ORDER.includes(akt)) return;
                rowsById[schoolId][akt] = true;
            });

            return ACTIVITY_ORDER.map((label) => ({
                label,
                value: Object.values(rowsById).filter((m) => !!m[label])
                    .length,
                color: ACTIVITY_COLORS[label],
            }));
        }

        const raw = kpiData?.activityDistribution || [];
        return ACTIVITY_ORDER.map((label) => {
            const hit = raw.find(
                (a) => normalizeActivityLabel(a.label) === label,
            );
            return {
                label,
                value: Number(hit?.value) || 0,
                color: ACTIVITY_COLORS[label],
            };
        });
    }, [kpiData?.activityDistribution, listSekolah, kegiatanSales]);

    const hasilBreakdown = useMemo(() => {
        const raw = resultBreakdown || [];
        return ACTIVITY_ORDER.map((label) => {
            const hit = raw.find(
                (a) => normalizeActivityLabel(a.label) === label,
            );
            return {
                label,
                value: Number(hit?.value) || 0,
                color: ACTIVITY_COLORS[label],
            };
        });
    }, [resultBreakdown]);

    const totalAkt = activities.reduce(
        (a, c) => a + (Number(c.value) || 0),
        0,
    );
    const hasActivityData = activities.length > 0;

    // SVG chart geometry
    const chartW = 320;
    const chartH = 88;
    const padL = 4;
    const padR = 4;
    const padT = 10;
    const padB = 4;
    const plotW = chartW - padL - padR;
    const plotH = chartH - padT - padB;
    const n = monthlyActivities.length;
    const xAt = (i) =>
        n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW;
    const yAt = (v) => padT + plotH - (v / maxActivity) * plotH;

    /** Line chart tegak lurus (polyline), tanpa kurva */
    const buildPath = (values) => {
        if (!values.length) return "";
        const pts = values.map((v, i) => ({
            x: xAt(i),
            y: yAt(v),
        }));
        return pts
            .map((p, i) =>
                `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
            )
            .join(" ");
    };

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
                                        className="bi bi-graph-up"
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
                                        Tren per aktivitas sales bulanan di
                                        tahun{" "}
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
                                padding: "10px 12px 6px",
                                position: "relative",
                                overflow: "visible",
                            }}
                        >
                            {activitySeries.length > 0 ? (
                                <>
                                    <div
                                        style={{
                                            position: "relative",
                                            width: "100%",
                                        }}
                                    >
                                        <svg
                                            viewBox={`0 0 ${chartW} ${chartH}`}
                                            width="100%"
                                            height={88}
                                            style={{ display: "block", overflow: "visible" }}
                                        >
                                            {/* grid lines */}
                                            {[0, 0.5, 1].map((t) => {
                                                const y = yAt(maxActivity * t);
                                                return (
                                                    <line
                                                        key={t}
                                                        x1={padL}
                                                        x2={chartW - padR}
                                                        y1={y}
                                                        y2={y}
                                                        stroke="#e2e8f0"
                                                        strokeWidth={1}
                                                    />
                                                );
                                            })}
                                            {activitySeries.map((series) => (
                                                <path
                                                    key={series.label}
                                                    d={buildPath(series.values)}
                                                    fill="none"
                                                    stroke={series.color}
                                                    strokeWidth={2}
                                                    strokeLinejoin="round"
                                                    strokeLinecap="round"
                                                />
                                            ))}
                                            {activitySeries.map((series) =>
                                                series.values.map((v, i) => (
                                                    <circle
                                                        key={`${series.label}-${i}`}
                                                        cx={xAt(i)}
                                                        cy={yAt(v)}
                                                        r={
                                                            visitHover?.index === i
                                                                ? 3.5
                                                                : 2.2
                                                        }
                                                        fill={series.color}
                                                        stroke="#fff"
                                                        strokeWidth={1}
                                                    />
                                                )),
                                            )}
                                        </svg>

                                        {/* hover hit areas per month */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                            }}
                                        >
                                            {monthlyActivities.map((m, i) => {
                                                const isHovered =
                                                    visitHover?.index === i;
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            flex: 1,
                                                            position: "relative",
                                                            cursor: "pointer",
                                                        }}
                                                        onMouseEnter={() =>
                                                            setVisitHover({
                                                                index: i,
                                                                month: m.month,
                                                                year: m.year,
                                                                count: m.count,
                                                                breakdown:
                                                                    m.breakdown ||
                                                                    [],
                                                            })
                                                        }
                                                        onMouseLeave={() =>
                                                            setVisitHover(null)
                                                        }
                                                    >
                                                        {isHovered && (
                                                            <div
                                                                style={{
                                                                    position:
                                                                        "absolute",
                                                                    bottom:
                                                                        "100%",
                                                                    left: "50%",
                                                                    transform:
                                                                        "translateX(-50%)",
                                                                    marginBottom: 4,
                                                                    zIndex: 40,
                                                                    minWidth: 140,
                                                                    background:
                                                                        "#0f172a",
                                                                    color: "#fff",
                                                                    borderRadius: 8,
                                                                    padding:
                                                                        "8px 10px",
                                                                    boxShadow:
                                                                        "0 10px 25px rgba(15,23,42,0.25)",
                                                                    pointerEvents:
                                                                        "none",
                                                                    whiteSpace:
                                                                        "nowrap",
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
                                                                    · Total{" "}
                                                                    {m.count}
                                                                </div>
                                                                {(m.breakdown ||
                                                                    [])
                                                                    .length >
                                                                0 ? (
                                                                    (
                                                                        m.breakdown ||
                                                                        []
                                                                    ).map(
                                                                        (
                                                                            b,
                                                                            bi,
                                                                        ) => {
                                                                            const seriesColor =
                                                                                activitySeries.find(
                                                                                    (s) =>
                                                                                        s.label ===
                                                                                        b.label,
                                                                                )
                                                                                    ?.color ||
                                                                                "#94a3b8";
                                                                            return (
                                                                                <div
                                                                                    key={
                                                                                        bi
                                                                                    }
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
                                                                                                    seriesColor,
                                                                                                flexShrink: 0,
                                                                                            }}
                                                                                        />
                                                                                        {
                                                                                            b.label
                                                                                        }
                                                                                    </span>
                                                                                    <strong>
                                                                                        {
                                                                                            b.value
                                                                                        }
                                                                                    </strong>
                                                                                </div>
                                                                            );
                                                                        },
                                                                    )
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            fontSize: 10,
                                                                            color: "#94a3b8",
                                                                        }}
                                                                    >
                                                                        Tidak
                                                                        ada
                                                                        aktivitas
                                                                    </div>
                                                                )}
                                                                <div
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        left: "50%",
                                                                        bottom: -5,
                                                                        transform:
                                                                            "translateX(-50%) rotate(45deg)",
                                                                        width: 10,
                                                                        height: 10,
                                                                        background:
                                                                            "#0f172a",
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* month labels */}
                                    <div
                                        style={{
                                            display: "flex",
                                            marginTop: 2,
                                        }}
                                    >
                                        {monthlyActivities.map((m, i) => {
                                            const isCurrentMonth =
                                                i === new Date().getMonth();
                                            const isHovered =
                                                visitHover?.index === i;
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        flex: 1,
                                                        textAlign: "center",
                                                        fontSize: 9,
                                                        color:
                                                            isCurrentMonth ||
                                                            isHovered
                                                                ? "#4f46e5"
                                                                : T.slate,
                                                        fontWeight:
                                                            isCurrentMonth ||
                                                            isHovered
                                                                ? 700
                                                                : 500,
                                                        borderTop: isCurrentMonth
                                                            ? "2px solid #4f46e5"
                                                            : "2px solid transparent",
                                                        paddingTop: 2,
                                                    }}
                                                >
                                                    {m.month}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* legend */}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "6px 10px",
                                            marginTop: 8,
                                            paddingTop: 6,
                                            borderTop: `1px solid ${T.border}`,
                                        }}
                                    >
                                        {activitySeries.map((s) => (
                                            <div
                                                key={s.label}
                                                onClick={() =>
                                                    handleAktivitasClick(s)
                                                }
                                                title={`Filter sekolah: ${s.label}`}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    fontSize: 9.5,
                                                    color: T.text,
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    borderRadius: 4,
                                                    padding: "1px 3px",
                                                    opacity: s.values.some(
                                                        (v) => v > 0,
                                                    )
                                                        ? 1
                                                        : 0.5,
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
                                                <span
                                                    style={{
                                                        width: 14,
                                                        height: 2.5,
                                                        borderRadius: 2,
                                                        background: s.color,
                                                    }}
                                                />
                                                {s.label}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div
                                    style={{
                                        padding: "24px 8px",
                                        textAlign: "center",
                                        fontSize: 11,
                                        color: T.slate,
                                    }}
                                >
                                    Belum ada breakdown aktivitas
                                </div>
                            )}
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
                                    Tiap ring = sekolah unik Area Cover vs total AC
                                    (aktivitas berulang di sekolah yang sama = 1)
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
                                maxRings={6}
                                label={areaCover}
                                sub="Area Cover"
                                onRingClick={handleAktivitasClick}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    maxHeight: 140,
                                    overflowY: "auto",
                                    paddingRight: 4,
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                {hasActivityData ? (
                                    activities.map((item, idx) => {
                                        const pct =
                                            areaCover > 0
                                                ? (
                                                      (item.value / areaCover) *
                                                      100
                                                  ).toFixed(0)
                                                : 0;
                                        return (
                                            <div
                                                key={item.label || idx}
                                                onClick={() =>
                                                    handleAktivitasClick(item)
                                                }
                                                title={
                                                    Number(item.value) > 0
                                                        ? `Filter sekolah: ${item.label}`
                                                        : item.label
                                                }
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    cursor: "pointer",
                                                    borderRadius: 4,
                                                    padding: "1px 2px",
                                                    background:
                                                        String(
                                                            activeAktivitasFilter ||
                                                                "",
                                                        ).toLowerCase() ===
                                                        String(
                                                            item.label || "",
                                                        ).toLowerCase()
                                                            ? "#dbeafe"
                                                            : "transparent",
                                                    opacity:
                                                        Number(item.value) > 0
                                                            ? 1
                                                            : 0.55,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background =
                                                        "#f1f5f9";
                                                }}
                                                onMouseLeave={(e) => {
                                                    const active =
                                                        String(
                                                            activeAktivitasFilter ||
                                                                "",
                                                        ).toLowerCase() ===
                                                        String(
                                                            item.label || "",
                                                        ).toLowerCase();
                                                    e.currentTarget.style.background =
                                                        active
                                                            ? "#dbeafe"
                                                            : "transparent";
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
                            segments={hasilBreakdown}
                            size={70}
                            ring={12}
                            label={hasilBreakdown.reduce(
                                (a, c) => a + (c.value || 0),
                                0,
                            )}
                            sub="Aktivitas"
                            onSegmentClick={handleAktivitasClick}
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
                            {hasilBreakdown.length > 0 ? (
                                hasilBreakdown.map((s, i) => (
                                    <div
                                        key={s.label || i}
                                        onClick={() =>
                                            handleAktivitasClick(s)
                                        }
                                        title={`Filter sekolah: ${s.label}`}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: 6,
                                            fontSize: 11,
                                            gap: 8,
                                            cursor: "pointer",
                                            borderRadius: 4,
                                            padding: "1px 2px",
                                            opacity:
                                                Number(s.value) > 0 ? 1 : 0.55,
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
