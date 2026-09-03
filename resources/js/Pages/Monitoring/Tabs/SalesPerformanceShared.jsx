import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Head, router, Link, usePage } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import SelectReact from "@/Components/Element/SelectReact";
import {
    MapContainer,
    Marker,
    Popup,
    useMap,
    GeoJSON,
} from "react-leaflet";
import MapTileLayer from "@/Components/Map/MapTileLayer";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet icon paths
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers && markers.length > 0) {
            try {
                const group = new L.featureGroup(
                    markers.map((m) => L.marker([m.lat, m.lng])),
                );
                map.fitBounds(group.getBounds(), {
                    padding: [20, 20],
                    maxZoom: 12,
                });
            } catch (e) {
                console.error("Error fitting bounds", e);
            }
        }
    }, [markers, map]);
    return null;
}

export const T = {
    blue: "#1d4ed8",
    blueSoft: "#3b82f6",
    green: "#16a34a",
    orange: "#d97706",
    red: "#dc2626",
    teal: "#0d9488",
    purple: "#7c3aed",
    slate: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f1f5f9",
    card: "#ffffff",
};

export const S = {
    card: {
        background: T.card,
        borderRadius: 12,
        boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
        border: `1px solid ${T.border}`,
    },
    th: {
        fontSize: 10,
        fontWeight: 700,
        color: T.slate,
        padding: "8px 10px",
        background: "#f8fafc",
        borderBottom: `1px solid ${T.border}`,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        position: "sticky",
        top: 0,
        zIndex: 5,
    },
    td: {
        fontSize: 11.5,
        color: T.text,
        padding: "7px 10px",
        borderBottom: `1px solid #f4f6f8`,
    },
};

/** Wrapper scroll + sticky thead untuk tabel panjang di dashboard */
export const stickyTableWrapStyle = {
    overflow: "auto",
    maxHeight: "calc(100vh - 210px)",
};

export const stickyTableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
};

export function Donut({ segments, size = 120, ring = 26, label, sub, onSegmentClick }) {
    const [hoveredInfo, setHoveredInfo] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const r = (size - ring) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    const tot = segments.reduce((a, s) => a + (Number(s.value) || 0), 0);
    let cum = 0;
    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                flexShrink: 0,
            }}
            onMouseLeave={() => setHoveredInfo(null)}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ overflow: "visible" }}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            >
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={ring}
                />
                {/* rotate -90 supaya mulai dari atas (12 jam) dan mengisi full 360° */}
                <g transform={`rotate(-90 ${cx} ${cy})`}>
                {segments.map((seg, i) => {
                        const value = Number(seg.value) || 0;
                        const len = tot > 0 ? (value / tot) * circ : 0;
                        const offset = -cum;
                    cum += len;
                    const percent =
                            tot > 0 ? ((value / tot) * 100).toFixed(1) : 0;
                        const clickable = typeof onSegmentClick === "function" && seg.label;
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={ring}
                                strokeDasharray={`${len} ${Math.max(circ - len, 0)}`}
                            strokeDashoffset={offset}
                            style={{
                                    cursor: clickable || seg.label ? "pointer" : "default",
                                transition: "stroke-width 0.2s ease",
                            }}
                                onClick={() => {
                                    if (clickable) onSegmentClick(seg, i);
                                }}
                            onMouseEnter={() => {
                                if (seg.label) {
                                    setHoveredInfo({
                                        label: seg.label,
                                            value,
                                        percent,
                                        color: seg.color,
                                    });
                                }
                            }}
                            onMouseOver={(e) => {
                                if (seg.label)
                                    e.target.setAttribute(
                                        "stroke-width",
                                        ring + 6,
                                    );
                            }}
                            onMouseOut={(e) => {
                                e.target.setAttribute("stroke-width", ring);
                            }}
                        />
                    );
                })}
                </g>
            </svg>

            {/* Default Label */}
            {label && !hoveredInfo && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: T.text,
                            lineHeight: 1,
                        }}
                    >
                        {label}
                    </div>
                    {sub && (
                        <div
                            style={{
                                fontSize: 9,
                                color: T.slate,
                                marginTop: 2,
                            }}
                        >
                            {sub}
                        </div>
                    )}
                </div>
            )}

            {/* Hover Tooltip (Floating) */}
            {hoveredInfo &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            left: mousePos.x + 15,
                            top: mousePos.y + 15,
                            zIndex: 999999,
                            background: "#ffffff",
                            padding: "4px 6px",
                            borderRadius: "8px",
                            boxShadow:
                                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            border: `1px solid ${T.border}`,
                            pointerEvents: "none",
                            minWidth: 120,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: hoveredInfo.color,
                                marginBottom: 4,
                            }}
                        >
                            {hoveredInfo.label}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: T.text,
                                    lineHeight: 1,
                                }}
                            >
                                {hoveredInfo.percent}%
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: T.slate,
                                }}
                            >
                                ({hoveredInfo.value.toLocaleString("id-ID")})
                            </span>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

/**
 * Concentric rings: tiap ring = 1 jenis aktivitas vs total Area Cover.
 * Outer ring = aktivitas pertama, makin dalam makin ke aktivitas berikutnya.
 */
export function ConcentricActivityDonut({
    activities = [],
    areaCover = 0,
    size = 120,
    ringWidth = 12,
    gap = 3,
    maxRings = 5,
    label,
    sub,
    onRingClick,
}) {
    const [hoveredInfo, setHoveredInfo] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const rings = (activities || [])
        .filter((a) => (Number(a.value) || 0) > 0)
        .slice(0, maxRings);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size / 2 - 2;

    const centerHole =
        maxRadius - rings.length * ringWidth - Math.max(0, rings.length - 1) * gap;

    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                flexShrink: 0,
            }}
            onMouseLeave={() => setHoveredInfo(null)}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ overflow: "visible" }}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            >
                {rings.map((ring, i) => {
                    const value = Number(ring.value) || 0;
                    const radius =
                        maxRadius - ringWidth / 2 - i * (ringWidth + gap);
                    const circ = 2 * Math.PI * radius;
                    const base = areaCover > 0 ? areaCover : Math.max(value, 1);
                    const ratio = Math.min(value / base, 1);
                    const fillLen = ratio * circ;
                    const restLen = Math.max(circ - fillLen, 0);
                    const pct = areaCover > 0
                        ? ((value / areaCover) * 100).toFixed(1)
                        : "0.0";

                    // Midpoint of filled arc (start at top = -π/2)
                    const midAngle = -Math.PI / 2 + ratio * Math.PI;
                    const labelR = radius;
                    const lx = cx + labelR * Math.cos(midAngle);
                    const ly = cy + labelR * Math.sin(midAngle);
                    const showBadge = fillLen > 8;

                    return (
                        <g key={`${ring.label}-${i}`}>
                            <g transform={`rotate(-90 ${cx} ${cy})`}>
                                {/* Track = sisa area cover */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={radius}
                                    fill="none"
                                    stroke="#e2e8f0"
                                    strokeWidth={ringWidth}
                                />
                                {/* Filled = jumlah aktivitas */}
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={radius}
                                    fill="none"
                                    stroke={ring.color || "#3b82f6"}
                                    strokeWidth={ringWidth}
                                    strokeDasharray={`${fillLen} ${restLen}`}
                                    strokeDashoffset={0}
                                    strokeLinecap="butt"
                                    style={{
                                        cursor: typeof onRingClick === "function" ? "pointer" : "pointer",
                                    }}
                                    onClick={() => {
                                        if (typeof onRingClick === "function") {
                                            onRingClick(ring, i);
                                        }
                                    }}
                                    onMouseEnter={() =>
                                        setHoveredInfo({
                                            label: ring.label,
                                            value,
                                            areaCover,
                                            percent: pct,
                                            color: ring.color || "#3b82f6",
                                        })
                                    }
                                />
                            </g>
                            {showBadge && (
                                <g
                                    style={{ pointerEvents: "none" }}
                                    onMouseEnter={() =>
                                        setHoveredInfo({
                                            label: ring.label,
                                            value,
                                            areaCover,
                                            percent: pct,
                                            color: ring.color || "#3b82f6",
                                        })
                                    }
                                >
                                    <circle
                                        cx={lx}
                                        cy={ly}
                                        r={8}
                                        fill="#fff"
                                        stroke={ring.color || "#3b82f6"}
                                        strokeWidth={1.5}
                                    />
                                    <text
                                        x={lx}
                                        y={ly}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        style={{
                                            fontSize: value >= 100 ? 7 : 8,
                                            fontWeight: 800,
                                            fill: "#0f172a",
                                        }}
                                    >
                                        {value}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Inner hole guide */}
                {rings.length > 0 && centerHole > 8 && (
                    <circle
                        cx={cx}
                        cy={cy}
                        r={Math.max(centerHole - 1, 0)}
                        fill="#fff"
                    />
                )}
            </svg>

            {(label !== undefined && label !== null) && !hoveredInfo && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: T.text,
                            lineHeight: 1,
                        }}
                    >
                        {label}
                    </div>
                    {sub && (
                        <div
                            style={{
                                fontSize: 8,
                                color: T.slate,
                                marginTop: 2,
                                textAlign: "center",
                                maxWidth: 56,
                                lineHeight: 1.2,
                            }}
                        >
                            {sub}
                        </div>
                    )}
                </div>
            )}

            {hoveredInfo &&
                typeof window !== "undefined" &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            left: mousePos.x + 15,
                            top: mousePos.y + 15,
                            zIndex: 999999,
                            background: "#ffffff",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            boxShadow:
                                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            border: `1px solid ${T.border}`,
                            pointerEvents: "none",
                            minWidth: 140,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: hoveredInfo.color,
                                marginBottom: 4,
                            }}
                        >
                            {hoveredInfo.label}
                        </div>
                        <div style={{ fontSize: 11, color: T.text }}>
                            <strong>{hoveredInfo.value}</strong>
                            {" vs AC "}
                            <strong>{hoveredInfo.areaCover}</strong>
                        </div>
                        <div
                            style={{
                                fontSize: 10,
                                color: T.slate,
                                marginTop: 2,
                            }}
                        >
                            {hoveredInfo.percent}% dari Area Cover
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

/* ── LINE CHART ── */
/* ── LINE CHART ── */
/* ── LINE CHART ── */
function LineChart({ data }) {
    if (!data || data.length === 0) return null;
    const W = 440,
        H = 160;
    const p = { t: 32, r: 20, b: 36, l: 42 };
    const cW = W - p.l - p.r,
        cH = H - p.t - p.b;
    const mn = 14,
        mx = 26;
    const sx = (i) =>
        data.length === 1 ? p.l + cW / 2 : p.l + (i / (data.length - 1)) * cW;
    const sy = (v) => p.t + cH - ((v - mn) / (mx - mn)) * cH;
    const path = data
        .map((d, i) => `${i ? "L" : "M"}${sx(i)},${sy(d.v)}`)
        .join("");
    const area = `${path}L${sx(data.length - 1)},${p.t + cH}L${sx(0)},${p.t + cH}Z`;
    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto" }}
        >
            <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.blue} stopOpacity=".15" />
                    <stop offset="100%" stopColor={T.blue} stopOpacity=".01" />
                </linearGradient>
            </defs>
            {[15, 20, 25].map((v) => (
                <g key={v}>
                    <line
                        x1={p.l}
                        y1={sy(v)}
                        x2={p.l + cW}
                        y2={sy(v)}
                        stroke="#e8edf4"
                        strokeWidth={1}
                    />
                    <text
                        x={p.l - 5}
                        y={sy(v) + 4}
                        textAnchor="end"
                        fontSize={10}
                        fill="#94a3b8"
                    >
                        {v}%
                    </text>
                </g>
            ))}
            <path d={area} fill="url(#lg)" />
            <path
                d={path}
                fill="none"
                stroke={T.blue}
                strokeWidth={2.5}
                strokeLinejoin="round"
            />
            {data.map((d, i) => (
                <g key={i}>
                    <circle
                        cx={sx(i)}
                        cy={sy(d.v)}
                        r={5}
                        fill={T.blue}
                        stroke="white"
                        strokeWidth={2.5}
                    />
                    <text
                        x={sx(i)}
                        y={sy(d.v) - 12}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill={T.blue}
                    >
                        {d.v}%
                    </text>
                    <text
                        x={sx(i)}
                        y={p.t + cH + 20}
                        textAnchor="middle"
                        fontSize={11}
                        fill={T.slate}
                    >
                        {d.label}
                    </text>
                </g>
            ))}
        </svg>
    );
}
/* ── MULTI BAR CHART ── */
function MultiBarChart({ data }) {
    if (!data || data.length === 0) return null;
    const W = 440,
        H = 160;
    const p = { t: 32, r: 20, b: 36, l: 42 };
    const cW = W - p.l - p.r,
        cH = H - p.t - p.b;
    const maxVal = Math.max(
        ...data.map((d) => Math.max(d.target || 0, d.real || 0, d.uncov || 0)),
        10,
    );
    const steps = 4;
    // Auto-scale
    let stepSize = Math.ceil(maxVal / steps);
    const order = Math.pow(10, Math.floor(Math.log10(stepSize)));
    stepSize = Math.ceil(stepSize / order) * order;
    const mx = stepSize * steps;
    const sx = (i) => p.l + (i + 0.5) * (cW / data.length);
    const sy = (v) => p.t + cH - (v / mx) * cH;
    const barW = Math.min(24, cW / data.length / 4);
    const gap = 4;
    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto" }}
        >
            {[1, 2, 3, 4].map((s) => {
                const v = s * stepSize;
                return (
                    <g key={s}>
                        <line
                            x1={p.l}
                            y1={sy(v)}
                            x2={p.l + cW}
                            y2={sy(v)}
                            stroke="#e8edf4"
                            strokeWidth={1}
                        />
                        <text
                            x={p.l - 5}
                            y={sy(v) + 4}
                            textAnchor="end"
                            fontSize={10}
                            fill="#94a3b8"
                        >
                            {v >= 1000
                                ? (v / 1000).toFixed(1).replace(".0", "") + "k"
                                : v}
                        </text>
                    </g>
                );
            })}
            <line
                x1={p.l}
                y1={sy(0)}
                x2={p.l + cW}
                y2={sy(0)}
                stroke="#e8edf4"
                strokeWidth={1}
            />
            <text
                x={p.l - 5}
                y={sy(0) + 4}
                textAnchor="end"
                fontSize={10}
                fill="#94a3b8"
            >
                0
            </text>
            {data.map((d, i) => {
                const cx = sx(i);
                return (
                    <g key={i}>
                        {/* Target (Teal) */}
                        <rect
                            x={cx - barW - barW / 2 - gap}
                            y={sy(d.target)}
                            width={barW}
                            height={sy(0) - sy(d.target)}
                            fill={T.teal}
                            rx={2}
                        />
                        <text
                            x={cx - barW - gap}
                            y={sy(d.target) - 5}
                            textAnchor="middle"
                            fontSize={9}
                            fill={T.teal}
                            fontWeight="bold"
                        >
                            {d.target}
                        </text>
                        {/* Real (Green) */}
                        <rect
                            x={cx - barW / 2}
                            y={sy(d.real)}
                            width={barW}
                            height={sy(0) - sy(d.real)}
                            fill={T.green}
                            rx={2}
                        />
                        <text
                            x={cx}
                            y={sy(d.real) - 5}
                            textAnchor="middle"
                            fontSize={9}
                            fill={T.green}
                            fontWeight="bold"
                        >
                            {d.real}
                        </text>
                        {/* Uncov (Red) */}
                        <rect
                            x={cx + barW / 2 + gap}
                            y={sy(d.uncov)}
                            width={barW}
                            height={sy(0) - sy(d.uncov)}
                            fill={T.red}
                            rx={2}
                        />
                        <text
                            x={cx + barW + gap}
                            y={sy(d.uncov) - 5}
                            textAnchor="middle"
                            fontSize={9}
                            fill={T.red}
                            fontWeight="bold"
                        >
                            {d.uncov}
                        </text>
                        {/* Label X */}
                        <text
                            x={cx}
                            y={p.t + cH + 20}
                            textAnchor="middle"
                            fontSize={11}
                            fill={T.slate}
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
/* ── MAP LEAFLET (CHOROPLETH KECAMATAN) ── */
function InvalidateMapSize({ deps = [] }) {
    const map = useMap();
    useEffect(() => {
        if (!map) return undefined;

        const run = () => {
            try {
                map.invalidateSize({ pan: false });
            } catch (e) {
                /* ignore */
            }
        };

        run();
        const t1 = window.setTimeout(run, 50);
        const t2 = window.setTimeout(run, 250);
        const t3 = window.setTimeout(run, 600);
        const raf = window.requestAnimationFrame(run);

        const container = map.getContainer?.();
        let ro;
        if (container && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => run());
            ro.observe(container);
            if (container.parentElement) ro.observe(container.parentElement);
        }

        window.addEventListener("resize", run);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
            window.cancelAnimationFrame(raf);
            window.removeEventListener("resize", run);
            if (ro) ro.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, ...deps]);

    return null;
}

function FitGeoJsonBounds({ geojsonData }) {
    const map = useMap();
    useEffect(() => {
        if (
            geojsonData &&
            geojsonData.features &&
            geojsonData.features.length > 0
        ) {
            try {
                map.invalidateSize({ pan: false });
                const geoLayer = L.geoJSON(geojsonData);
                const bounds = geoLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
                }
                window.setTimeout(() => {
                    try {
                        map.invalidateSize({ pan: false });
                    } catch (e) {
                        /* ignore */
                    }
                }, 150);
            } catch (e) {
                console.error("Error fitting GeoJSON bounds", e);
            }
        }
    }, [geojsonData, map]);
    return null;
}

// Ziggy dipakai lebih dulu; fallback memakai APP_URL supaya tetap benar saat
// aplikasi dideploy di subdirektori (mis. /coverage-area).
function geoJsonEndpoint(params) {
    let url = "";
    try {
        if (typeof route === "function") {
            url = route(
                "monitoring.sales-performance.geojson",
                Object.fromEntries(params),
            );
        }
    } catch (e) {
        // abaikan, pakai fallback di bawah
    }
    if (!url) {
        const base = String(
            (typeof window !== "undefined" && window.APP_URL) || "",
        ).replace(/\/+$/, "");
        url = `${base}/system/monitoring/sales-performance/geojson?${params.toString()}`;
    }

    // APP_URL yang masih http:// (mis. di belakang proxy) bikin request diblokir
    // sebagai mixed content saat halaman diakses via https.
    try {
        const parsed = new URL(url, window.location.origin);
        parsed.protocol = window.location.protocol;
        parsed.host = window.location.host;

        return parsed.toString();
    } catch (e) {
        return url;
    }
}

/** Tunda fetch berat (GeoJSON) sampai UI dashboard selesai first paint. */
function useDeferredMapLoad(delayMs = 350) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const activate = () => {
            if (!cancelled) setReady(true);
        };

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            const id = window.requestIdleCallback(activate, { timeout: delayMs });
            return () => {
                cancelled = true;
                window.cancelIdleCallback(id);
            };
        }

        const timer = window.setTimeout(activate, delayMs);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [delayMs]);

    return ready;
}

async function fetchGeoJson(url) {
    const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
    });
    const body = await res.text();
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText || ""}`.trim());
    }
    try {
        return JSON.parse(body);
    } catch (e) {
        throw new Error("Respons bukan JSON (error server / redirect login)");
    }
}

export function KecamatanChoroplethMap({ salesId, cabangId, listKecamatan = [] }) {
    const [geojsonData, setGeojsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedKec, setSelectedKec] = useState(null);
    const [geoKey, setGeoKey] = useState(0);
    const mapLoadReady = useDeferredMapLoad(350);

    const getColor = (pct) => {
        if (pct >= 70) return "#10b981";
        if (pct >= 30) return "#3b82f6";
        if (pct >= 10) return "#f59e0b";
        if (pct > 0) return "#f97316";
        return "#94a3b8";
    };

    const getColorDark = (pct) => {
        if (pct >= 70) return "#059669";
        if (pct >= 30) return "#2563eb";
        if (pct >= 10) return "#d97706";
        if (pct > 0) return "#ea580c";
        return "#64748b";
    };

    const getBadge = (pct) => {
        if (pct >= 70)
            return { text: "Tinggi", bg: "#d1fae5", color: "#065f46" };
        if (pct >= 30)
            return { text: "Sedang", bg: "#dbeafe", color: "#1e40af" };
        if (pct >= 10)
            return { text: "Rendah", bg: "#fef3c7", color: "#92400e" };
        if (pct > 0)
            return { text: "Sangat Rendah", bg: "#ffedd5", color: "#9a3412" };
        return { text: "No Data", bg: "#f1f5f9", color: "#475569" };
    };

    useEffect(() => {
        if (!salesId || !mapLoadReady) return;
        setLoading(true);
        const params = new URLSearchParams({
            sales_id: salesId,
            _v: "3",
        });
        if (cabangId) params.append("cabang_id", cabangId);

        const fetchUrl = geoJsonEndpoint(params);

        fetchGeoJson(fetchUrl)
            .then((data) => {
                setGeojsonData(data);
                setGeoKey((k) => k + 1);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching GeoJSON:", fetchUrl, err);
                setLoading(false);
            });
    }, [salesId, cabangId, mapLoadReady]);

    const onEachFeature = (feature, layer) => {
        const props = feature.properties;
        const pct = props.coverage_pct ?? 0;
        const badge = getBadge(pct);

        layer.on({
            mouseover: (e) => {
                if (e.target.setStyle) {
                    e.target.setStyle({
                        weight: 3,
                        fillOpacity: 0.85,
                        dashArray: "",
                    });
                    e.target.bringToFront();
                }
            },
            mouseout: (e) => {
                if (e.target.setStyle) {
                    e.target.setStyle({
                        weight: 2,
                        fillOpacity: 0.6,
                        dashArray: "3",
                    });
                }
            },
            click: (e) => {
                setSelectedKec(props);
            },
        });

        // Build popup content
        const popupHtml = `
            <div style="min-width:240px;font-family:'Inter','Segoe UI',sans-serif;">
                <div style="background:linear-gradient(135deg,${getColor(pct)},${getColorDark(pct)});
                    padding:12px 14px;border-radius:10px 10px 0 0;margin:-8px -20px 0;
                    display:flex;align-items:center;justify-content:space-between;">
                    <div>
                        <div style="color:white;font-weight:700;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,0.15);">
                            ${props.kecamatan_name}
                        </div>
                        <div style="color:rgba(255,255,255,0.85);font-size:10px;margin-top:2px;">
                            ${props.kabupaten || ""}${props.provinsi ? ", " + props.provinsi : ""}
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.25);border-radius:6px;padding:3px 8px;">
                        <span style="color:white;font-size:18px;font-weight:800;">${pct}%</span>
                    </div>
                </div>
                <div style="padding:12px 0 4px;">
                    <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;margin-bottom:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <span style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Coverage</span>
                            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;
                                background:${badge.bg};color:${badge.color};">${badge.text}</span>
                        </div>
                        <div style="background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden;">
                            <div style="background:${getColor(pct)};height:100%;width:${pct}%;border-radius:4px;
                                transition:width 0.3s ease;"></div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <div style="background:#f0fdf4;border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:18px;font-weight:700;color:#16a34a;">${(props.sekolah_aktif || 0).toLocaleString("id-ID")}</div>
                            <div style="font-size:9px;color:#16a34a;font-weight:600;margin-top:2px;">SEKOLAH AKTIF</div>
                        </div>
                        <div style="background:#fef2f2;border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:18px;font-weight:700;color:#dc2626;">${(props.belum_tercover || 0).toLocaleString("id-ID")}</div>
                            <div style="font-size:9px;color:#dc2626;font-weight:600;margin-top:2px;">BELUM COVER</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;">
                        <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:16px;font-weight:700;color:#0f172a;">${(props.total_sekolah || 0).toLocaleString("id-ID")}</div>
                            <div style="font-size:9px;color:#64748b;font-weight:600;margin-top:2px;">TOTAL SEKOLAH</div>
                        </div>
                        <div style="background:#eff6ff;border-radius:8px;padding:8px 10px;text-align:center;">
                            <div style="font-size:16px;font-weight:700;color:#1d4ed8;">${(props.potensi_siswa || 0).toLocaleString("id-ID")}</div>
                            <div style="font-size:9px;color:#1d4ed8;font-weight:600;margin-top:2px;">POTENSI SISWA</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        layer.bindPopup(popupHtml, {
            maxWidth: 320,
            className: "kecamatan-popup",
        });
    };

    const geoStyle = (feature) => {
        const pct = feature.properties.coverage_pct ?? 0;
        return {
            fillColor: getColor(pct),
            weight: 2,
            opacity: 1,
            color: "white",
            dashArray: "3",
            fillOpacity: 0.6,
        };
    };

    const pointToLayer = (feature, latlng) => {
        const pct = feature.properties.coverage_pct ?? 0;
        const color = getColor(pct);
        const html = `
            <div style="
                background-color: ${color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                opacity: 0.9;
            "></div>
        `;
        return L.marker(latlng, {
            icon: L.divIcon({
                html: html,
                className: "custom-circle-marker",
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            }),
        });
    };

    const center = [-2.5, 118.0];
    const zoom = 5;

    return (
        <div
            style={{
                height: 380,
                width: "100%",
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(255,255,255,0.85)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        borderRadius: 10,
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                border: "3px solid #e2e8f0",
                                borderTopColor: "#3b82f6",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                                margin: "0 auto 10px",
                            }}
                        />
                        <div
                            style={{
                                fontSize: 12,
                                color: "#64748b",
                                fontWeight: 500,
                            }}
                        >
                            Memuat peta kecamatan...
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .leaflet-container {
                    width: 100% !important;
                    height: 100% !important;
                    background: #f1f5f9;
                }
                .leaflet-pane,
                .leaflet-tile,
                .leaflet-marker-icon,
                .leaflet-marker-shadow,
                .leaflet-tile-container,
                .leaflet-pane > svg,
                .leaflet-pane > canvas,
                .leaflet-zoom-box,
                .leaflet-image-layer,
                .leaflet-layer {
                    position: absolute !important;
                    left: 0;
                    top: 0;
                }
                .leaflet-tile {
                    filter: inherit;
                    visibility: inherit;
                }
                .kecamatan-popup .leaflet-popup-content-wrapper {
                    border-radius: 12px !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
                    padding: 0 !important;
                    overflow: hidden;
                }
                .kecamatan-popup .leaflet-popup-content {
                    margin: 8px 20px 12px !important;
                    font-family: 'Inter', 'Segoe UI', sans-serif !important;
                }
                .kecamatan-popup .leaflet-popup-tip {
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
                }
                .kecamatan-popup .leaflet-popup-close-button {
                    color: white !important;
                    font-size: 18px !important;
                    top: 6px !important;
                    right: 8px !important;
                    z-index: 10;
                }
            `}</style>
            <MapContainer
                center={center}
                zoom={zoom}
                minZoom={4}
                maxBounds={[
                    [-11.0, 94.0],
                    [6.0, 141.0],
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
                <InvalidateMapSize deps={[geoKey, loading]} />
                <MapTileLayer />
                {geojsonData &&
                    geojsonData.features &&
                    geojsonData.features.length > 0 && (
                        <>
                            <GeoJSON
                                key={geoKey}
                                data={geojsonData}
                                style={geoStyle}
                                pointToLayer={pointToLayer}
                                onEachFeature={onEachFeature}
                            />
                            <FitGeoJsonBounds geojsonData={geojsonData} />
                        </>
                    )}
            </MapContainer>
        </div>
    );
}

/* ── MAP LEAFLET (CHOROPLETH COMPETITOR) ── */
export function CompetitorChoroplethMap({
    salesId,
    cabangId,
    areaId,
    tahun,
    level,
    onOpenSekolahByKecamatan,
}) {
    const [geojsonData, setGeojsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [geoKey, setGeoKey] = useState(0);
    const [loadError, setLoadError] = useState(null);
    const [meta, setMeta] = useState({ kecamatan_count: 0, matched: 0, level: "kecamatan" });
    const mapLoadReady = useDeferredMapLoad(350);

    const resolvedLevel =
        level ||
        (salesId
            ? "kecamatan"
            : cabangId
              ? "kecamatan"
              : areaId
                ? "kota"
                : "kecamatan");
    const unitLabel = resolvedLevel === "kota" ? "kota/kab" : "kecamatan";

    const compColors = {
        "Tidak Diketahui": "#94a3b8",
    };
    const defaultColors = [
        "#f59e0b",
        "#3b82f6",
        "#10b981",
        "#ef4444",
        "#8b5cf6",
        "#ec4899",
        "#06b6d4",
    ];
    let colorIndex = 0;

    const getColorForCompetitor = (comp) => {
        if (!comp) return "#94a3b8";
        if (compColors[comp]) return compColors[comp];
        compColors[comp] = defaultColors[colorIndex % defaultColors.length];
        colorIndex++;
        return compColors[comp];
    };

    useEffect(() => {
        if (!mapLoadReady) return;
        const canLoadKota =
            resolvedLevel === "kota" && (cabangId || areaId) && !salesId;
        const canLoadCabangKecamatan =
            resolvedLevel === "kecamatan" && !!cabangId && !salesId;
        if (!salesId && !canLoadKota && !canLoadCabangKecamatan) return;
        setLoading(true);
        setLoadError(null);
        const params = new URLSearchParams({
            _v: resolvedLevel === "kota" ? "9" : "8",
        });
        if (salesId) params.append("sales_id", String(salesId));
        if (cabangId) params.append("cabang_id", String(cabangId));
        if (areaId && !cabangId) params.append("area_id", String(areaId));
        if (tahun) params.append("tahun", String(tahun));
        if (resolvedLevel === "kota") params.append("level", "kota");
        else params.append("level", "kecamatan");

        const fetchUrl = geoJsonEndpoint(params);

        fetchGeoJson(fetchUrl)
            .then((data) => {
                // Safety: buang ring/feature yang loncat jauh (mis. Ciawi Bogor ke Tasik)
                if (data?.features?.length) {
                    data.features = data.features
                        .map((f) => {
                            if (f.geometry?.type === "MultiPolygon" && Array.isArray(f.geometry.coordinates)) {
                                const city = Number(f.properties?.city_code) || 0;
                                // Kab/Kota Bogor ≈ 106.2–107.2; tolak ring ke timur (Tasik dll)
                                if (city === 3201 || city === 3271) {
                                    f.geometry.coordinates = f.geometry.coordinates.filter((poly) => {
                                        const pt = poly?.[0]?.[0];
                                        const lng = Array.isArray(pt) ? Number(pt[0]) : null;
                                        return lng == null || lng < 107.45;
                                    });
                                }
                            }
                            return f;
                        })
                        .filter((f) => {
                            if (f.geometry?.type === "MultiPolygon") {
                                return (f.geometry.coordinates || []).length > 0;
                            }
                            return true;
                        });
                }
                if (data && data.features) {
                    // Jangan tampilkan fallback Point (buletan) — hanya polygon
                    data.features = data.features.filter(
                        (f) => f?.geometry?.type && f.geometry.type !== "Point",
                    );
                    const compSet = new Set();
                    data.features.forEach((f) => {
                        if (
                            f.properties.dominant_competitor &&
                            f.properties.dominant_competitor !==
                                "Tidak Diketahui"
                        ) {
                            compSet.add(f.properties.dominant_competitor);
                        }
                    });
                    Array.from(compSet).forEach((c) => {
                        compColors[c] =
                            defaultColors[colorIndex % defaultColors.length];
                        colorIndex++;
                    });
                }
                setGeojsonData(data);
                setMeta({
                    kecamatan_count: data?.meta?.kota_count || data?.meta?.kecamatan_count || data?.features?.length || 0,
                    matched: data?.meta?.matched || (data?.features || []).filter(
                        (f) => f.geometry?.type !== "Point",
                    ).length,
                    level: data?.meta?.level || resolvedLevel,
                    boundary_files: data?.meta?.boundary_files,
                });
                setGeoKey((k) => k + 1);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching GeoJSON:", fetchUrl, err);
                setLoadError(err?.message || "Gagal memuat peta");
                setLoading(false);
            });
    }, [mapLoadReady, salesId, cabangId, areaId, tahun, resolvedLevel]);

    // Share AC per wilayah vs total AC scope:
    // <25% merah · <50% jingga · <75% kuning · ≤100% hijau
    const getCoverageFill = (pct) => {
        const n = Number(pct) || 0;
        if (n < 25) return { fill: "#dc2626", border: "#7f1d1d", label: "Rendah (<25%)" };
        if (n < 50) return { fill: "#ea580c", border: "#9a3412", label: "Cukup (<50%)" };
        if (n < 75) return { fill: "#eab308", border: "#854d0e", label: "Sedang (<75%)" };
        return { fill: "#16a34a", border: "#14532d", label: "Tinggi (≤100%)" };
    };

    const styleForFeature = (feature) => {
        if (feature?.geometry?.type === "Point") return {};
        const pct = feature?.properties?.coverage_pct ?? 0;
        const c = getCoverageFill(pct);
        return {
            fillColor: c.fill,
            fillOpacity: 0.45,
            weight: 2.5,
            opacity: 1,
            color: c.border,
            dashArray: null,
            className: "sales-kec-polygon",
            lineJoin: "round",
            lineCap: "round",
        };
    };

    const onEachFeature = (feature, layer) => {
        const props = feature.properties;
        const pct = props.coverage_pct ?? 0;
        const band = getCoverageFill(pct);
        const baseStyle = styleForFeature(feature);
        const areaCover = Number(props.area_cover ?? 0);
        const totalAreaCover = Number(props.total_area_cover ?? 0);
        const totalSekolah = Number(props.total_sekolah ?? 0);
        const sekolahRealisasi = Number(props.sekolah_realisasi ?? 0);
        const realExemplar = Number(props.real_exemplar ?? 0);
        const spExemplar = Number(props.sp_exemplar ?? 0);
        const yearLabel = props.tahun || tahun || "";
        const titleName = props.kota_name || props.kecamatan_name || "";
        const kecFilterValue = String(titleName || "")
            .split(",")[0]
            .trim()
            .toUpperCase();

        layer.on({
            mouseover: (e) => {
                if (e.target.setStyle) {
                    e.target.setStyle({
                        weight: 3.5,
                        color: "#000000",
                        fillOpacity: 0.65,
                    });
                    e.target.bringToFront();
                }
            },
            mouseout: (e) => {
                if (e.target.setStyle) {
                    e.target.setStyle(baseStyle);
                }
            },
        });

        const fmt = (n) => Number(n || 0).toLocaleString("id-ID");
        const sekolahBos = Number(props.sekolah_bos ?? 0);
        const sekolahSwadana = Number(props.sekolah_swadana ?? 0);
        const jenjangRaw = props.jenjang_breakdown || {};
        const jenjangOrder = ["SD", "SMP", "SMA", "SMK", "DLL"];
        const jenjangColors = {
            SD: "#1d4ed8",
            SMP: "#7c3aed",
            SMA: "#ca8a04",
            SMK: "#ea580c",
            DLL: "#059669",
        };
        const jenjangKeys = [
            ...jenjangOrder.filter((j) => Number(jenjangRaw[j] || 0) > 0),
            ...Object.keys(jenjangRaw).filter(
                (j) =>
                    !jenjangOrder.includes(j) && Number(jenjangRaw[j] || 0) > 0,
            ),
        ];
        const jenjangRows =
            jenjangKeys.length > 0
                ? jenjangKeys
                      .map((j) => {
                          const v = Number(jenjangRaw[j] || 0);
                          const c = jenjangColors[j] || "#475569";
                          return `<tr>
                                <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#334155;">
                                    <span style="display:inline-flex;align-items:center;gap:6px;">
                                        <span style="width:7px;height:7px;border-radius:50%;background:${c};display:inline-block;"></span>
                                        ${j}
                                    </span>
                                </td>
                                <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">
                                    <span style="display:inline-block;min-width:28px;padding:2px 8px;border-radius:999px;background:${c}14;color:${c};font-size:12px;font-weight:800;">${fmt(v)}</span>
                                </td>
                            </tr>`;
                      })
                      .join("")
                : `<tr><td colspan="2" style="padding:10px 8px;font-size:11px;color:#94a3b8;text-align:center;">Belum ada data</td></tr>`;

        const miniTable = (title, headLeft, headRight, body, accent) => `
            <div style="min-width:0;background:#fff;border:1px solid #e8eef5;border-radius:10px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,0.04);">
                <div style="padding:8px 10px 6px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:6px;">
                    <span style="width:3px;height:12px;border-radius:2px;background:${accent};display:inline-block;"></span>
                    <span style="font-size:10px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.45px;">${title}</span>
                </div>
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:5px 8px;font-size:10px;font-weight:600;color:#94a3b8;text-align:left;">${headLeft}</th>
                            <th style="padding:5px 8px;font-size:10px;font-weight:600;color:#94a3b8;text-align:right;">${headRight}</th>
                        </tr>
                    </thead>
                    <tbody>${body}</tbody>
                </table>
            </div>`;

        const metricCell = (label, value, color, bg, border) => `
            <td style="padding:10px 8px;text-align:center;background:${bg};border-right:1px solid ${border};">
                <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">${label}</div>
                <div style="font-size:18px;font-weight:800;color:${color};line-height:1;font-variant-numeric:tabular-nums;">${fmt(value)}</div>
            </td>`;

        const popupHtml = `
            <div style="min-width:330px;max-width:370px;font-family:'Segoe UI',system-ui,sans-serif;color:#0f172a;">
                <div style="background:linear-gradient(145deg,${band.fill} 0%,${band.border || band.fill} 100%);padding:14px 14px 12px;border-radius:12px 12px 0 0;margin:-8px -20px 0;position:relative;">
                    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.12),rgba(0,0,0,0.08));pointer-events:none;border-radius:12px 12px 0 0;"></div>
                    <div style="position:relative;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                            <div style="min-width:0;">
                                <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.22);border-radius:999px;padding:2px 8px;margin-bottom:7px;">
                                    <span style="font-size:10px;font-weight:700;color:#fff;letter-spacing:0.2px;">${band.label}${yearLabel ? ` · ${yearLabel}` : ""}</span>
                </div>
                                <div
                                    class="map-popup-kec-link"
                                    data-kecamatan="${kecFilterValue.replace(/"/g, "&quot;")}"
                                    title="Buka tab Sekolah: ${titleName.replace(/"/g, "&quot;")}"
                                    style="color:white;font-weight:800;font-size:15px;line-height:1.25;text-shadow:0 1px 2px rgba(0,0,0,0.18);cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1.5px;"
                                >${titleName}</div>
                                <div style="color:rgba(255,255,255,0.85);font-size:10px;margin-top:3px;font-weight:600;">
                                    Klik nama → tab Sekolah
                                </div>
                                <div style="color:rgba(255,255,255,0.9);font-size:11px;margin-top:5px;font-weight:600;">
                                    Total Sekolah <strong style="color:#fff;">${fmt(totalSekolah)}</strong>
                                    · Area Cover <strong style="color:#fff;">${fmt(areaCover)}</strong> / ${fmt(totalAreaCover)}
                                </div>
                            </div>
                            <div style="flex-shrink:0;background:rgba(0,0,0,0.22);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:8px 10px;text-align:center;min-width:52px;">
                                <div style="color:white;font-weight:900;font-size:18px;line-height:1;">${pct}%</div>
                                <div style="color:rgba(255,255,255,0.8);font-size:9px;font-weight:700;margin-top:2px;">SHARE</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="padding:12px 2px 6px;background:linear-gradient(180deg,#f8fafc 0%,#ffffff 40%);">
                    <!-- Row 1: Total Sekolah | SP | Terealisasi | Real Eks -->
                    <table style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:10px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.05);">
                        <tbody>
                            <tr>
                                ${metricCell("Total Sekolah", totalSekolah, "#0f172a", "#f8fafc", "#e2e8f0")}
                                ${metricCell("SP", spExemplar, "#a16207", "#fffbeb", "#fef3c7")}
                                ${metricCell("Terealisasi", sekolahRealisasi, "#0f172a", "#f8fafc", "#e2e8f0")}
                                <td style="padding:10px 8px;text-align:center;background:#eff6ff;">
                                    <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">Real Eks</div>
                                    <div style="font-size:18px;font-weight:800;color:#1d4ed8;line-height:1;font-variant-numeric:tabular-nums;">${fmt(realExemplar)}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Row 2: Sumber Dana | Jenjang -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        ${miniTable(
                            "Sumber Dana",
                            "Jenis",
                            "Sekolah",
                            `
                                <tr>
                                    <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#334155;">
                                        <span style="display:inline-flex;align-items:center;gap:6px;">
                                            <span style="width:7px;height:7px;border-radius:50%;background:#059669;display:inline-block;"></span>
                                            BOS
                                        </span>
                                    </td>
                                    <td style="padding:7px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">
                                        <span style="display:inline-block;min-width:28px;padding:2px 8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:800;">${fmt(sekolahBos)}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:7px 8px;font-size:12px;font-weight:600;color:#334155;">
                                        <span style="display:inline-flex;align-items:center;gap:6px;">
                                            <span style="width:7px;height:7px;border-radius:50%;background:#2563eb;display:inline-block;"></span>
                                            Swadana
                                        </span>
                                    </td>
                                    <td style="padding:7px 8px;text-align:right;">
                                        <span style="display:inline-block;min-width:28px;padding:2px 8px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800;">${fmt(sekolahSwadana)}</span>
                                    </td>
                                </tr>
                            `,
                            "#059669",
                        )}
                        ${miniTable("Jenjang", "Jenjang", "Sekolah", jenjangRows, "#1d4ed8")}
                    </div>
                </div>
            </div>
        `;

        layer.bindPopup(popupHtml, {
            maxWidth: 390,
            className: "kecamatan-popup",
        });

        layer.on("popupopen", () => {
            const link = document.querySelector(
                ".kecamatan-popup .map-popup-kec-link",
            );
            if (!link || typeof onOpenSekolahByKecamatan !== "function") return;
            link.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const kec =
                    link.getAttribute("data-kecamatan") ||
                    kecFilterValue ||
                    "";
                if (!kec) return;
                onOpenSekolahByKecamatan(kec);
            };
        });
    };

    const geoStyle = (feature) => styleForFeature(feature);

    const pointToLayer = (feature, latlng) => {
        // Fallback Point tidak ditampilkan di Map Area Cover
        return null;
    };

    return (
        <div
            style={{
                height: 400,
                width: "100%",
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255,255,255,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                border: "3px solid #e2e8f0",
                                borderTopColor: "#64748b",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                                margin: "0 auto 10px",
                            }}
                        />
                        <div
                            style={{
                                fontSize: 12,
                                color: "#64748b",
                                fontWeight: 500,
                            }}
                        >
                            Memuat peta {unitLabel}...
                        </div>
                    </div>
                </div>
            )}
            {!loading && meta.kecamatan_count > 0 && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 10,
                        left: 10,
                        zIndex: 500,
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        padding: "5px 8px",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#334155",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        whiteSpace: "nowrap",
                    }}
                >
                    <span>
                        <span style={{ color: "#64748b" }}>Share AC:</span>{" "}
                        {meta.matched}/{meta.kecamatan_count}
                    </span>
                    {Number(meta.matched || 0) > 0 &&
                        Number(meta.matched || 0) <
                            Number(meta.kecamatan_count || 0) && (
                            <span
                                title={`${Number(meta.kecamatan_count) - Number(meta.matched)} ${unitLabel} belum punya data boundary sehingga tidak tergambar di peta`}
                                style={{
                                    color: "#b45309",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                }}
                            >
                                <i
                                    className="bi bi-exclamation-triangle-fill"
                                    style={{ fontSize: 9 }}
                                />
                                {Number(meta.kecamatan_count) -
                                    Number(meta.matched)}{" "}
                                tanpa boundary
                            </span>
                        )}
                    <span style={{ width: 1, height: 12, background: "#e2e8f0" }} />
                    {[
                        { c: "#dc2626", t: "<25%" },
                        { c: "#ea580c", t: "<50%" },
                        { c: "#eab308", t: "<75%" },
                        { c: "#16a34a", t: "≤100%" },
                    ].map((item) => (
                        <span
                            key={item.t}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontWeight: 500,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    background: item.c,
                                    display: "inline-block",
                                }}
                            />
                            {item.t}
                        </span>
                    ))}
                </div>
            )}
            {!loading && loadError && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            background: "rgba(254,242,242,0.96)",
                            border: "1px solid #fecaca",
                            borderRadius: 8,
                            padding: "10px 14px",
                            maxWidth: 360,
                            fontSize: 11,
                            lineHeight: 1.45,
                            color: "#991b1b",
                            fontWeight: 600,
                            boxShadow: "0 4px 14px rgba(127,29,29,0.12)",
                        }}
                    >
                        Gagal memuat data peta: {loadError}. Cek tab Network /
                        <code style={{ fontSize: 10 }}> storage/logs</code> untuk
                        detailnya.
                    </div>
                </div>
            )}
            {!loading &&
                !loadError &&
                meta.kecamatan_count > 0 &&
                Number(meta.matched || 0) === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                            padding: 16,
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(254,242,242,0.96)",
                                border: "1px solid #fecaca",
                                borderRadius: 8,
                                padding: "10px 14px",
                                maxWidth: 340,
                                fontSize: 11,
                                lineHeight: 1.45,
                                color: "#991b1b",
                                fontWeight: 600,
                                boxShadow: "0 4px 14px rgba(127,29,29,0.12)",
                            }}
                        >
                            {Number(meta.boundary_files || 0) === 0 ? (
                                <>
                                    File boundary tidak ada di server. Pastikan
                                    folder ini ikut ter-deploy:{" "}
                                    <code style={{ fontSize: 10 }}>
                                        public/geojson/
                                    </code>
                                </>
                            ) : (
                                <>
                                    Data boundary {unitLabel} untuk wilayah ini
                                    belum tersedia (0/{meta.kecamatan_count}),
                                    jadi peta belum bisa digambar.
                                    {meta.level !== "kota" && (
                                        <>
                                            {" "}
                                            Saat ini boundary kecamatan baru
                                            mencakup Jawa Barat.
                                        </>
                                    )}
                                </>
                            )}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .leaflet-container {
                    width: 100% !important;
                    height: 100% !important;
                    background: #f1f5f9;
                }
                .leaflet-pane,
                .leaflet-tile,
                .leaflet-marker-icon,
                .leaflet-marker-shadow,
                .leaflet-tile-container,
                .leaflet-pane > svg,
                .leaflet-pane > canvas,
                .leaflet-zoom-box,
                .leaflet-image-layer,
                .leaflet-layer {
                    position: absolute !important;
                    left: 0;
                    top: 0;
                }
                .leaflet-tile {
                    filter: inherit;
                    visibility: inherit;
                }
                .kecamatan-popup .leaflet-popup-content-wrapper {
                    border-radius: 14px !important;
                    box-shadow: 0 16px 40px rgba(15,23,42,0.18) !important;
                    padding: 0 !important;
                    overflow: hidden;
                    border: 1px solid rgba(148,163,184,0.25);
                }
                .kecamatan-popup .leaflet-popup-content {
                    margin: 8px 20px 12px !important;
                    font-family: 'Segoe UI', system-ui, sans-serif !important;
                }
                .kecamatan-popup .leaflet-popup-tip {
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
                }
                .kecamatan-popup .leaflet-popup-close-button {
                    color: white !important;
                    font-size: 18px !important;
                    font-weight: 700 !important;
                    top: 8px !important;
                    right: 10px !important;
                    z-index: 10;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.25);
                }
            `}</style>
            <MapContainer
                center={[-2.5, 118.0]}
                zoom={5}
                minZoom={4}
                maxBounds={[
                    [-11.0, 94.0],
                    [6.0, 141.0],
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
                <InvalidateMapSize deps={[geoKey, loading, meta.matched]} />
                <MapTileLayer />
                {geojsonData &&
                    geojsonData.features &&
                    geojsonData.features.length > 0 && (
                        <>
                            <GeoJSON
                                key={geoKey}
                                data={geojsonData}
                                style={geoStyle}
                                pointToLayer={pointToLayer}
                                onEachFeature={onEachFeature}
                            />
                            <FitGeoJsonBounds geojsonData={geojsonData} />
                        </>
                    )}
            </MapContainer>
        </div>
    );
}

/* ── STAT CARD ── */
export function StatCard({ label, value, unit, icon, color, sub, trend, detailHref }) {
    return (
        <div
            style={{
                ...S.card,
                padding: "16px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: T.slate,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: 12,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: `${color}18`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <i
                        className={`bi ${icon}`}
                        style={{ fontSize: 14, color }}
                    />
                </div>
                <div>
                    <div
                        style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: T.text,
                            letterSpacing: "-0.5px",
                            lineHeight: 1.1,
                        }}
                    >
                        {value}
                    </div>
                    {unit && (
                        <div
                            style={{
                                fontSize: 10.5,
                                color: T.slate,
                                marginTop: 1,
                            }}
                        >
                            {unit}
                        </div>
                    )}
                </div>
            </div>
            <div style={{ marginTop: 10 }}>
                {sub && (
                    <div style={{ fontSize: 10.5, color: T.slate }}>{sub}</div>
                )}
                {trend && (
                    <div
                        style={{
                            fontSize: 10.5,
                            color: T.green,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            marginTop: 2,
                        }}
                    >
                        <i
                            className="bi bi-arrow-up-short"
                            style={{ fontSize: 13 }}
                        />
                        {trend}
                    </div>
                )}
            </div>
            <div
                style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${T.border}`,
                }}
            >
                {detailHref ? (
                    <a
                        href={detailHref}
                        style={{
                            fontSize: 10.5,
                            color: T.blueSoft,
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        Detail{" "}
                        <i
                            className="bi bi-chevron-right"
                            style={{ fontSize: 9 }}
                        />
                    </a>
                ) : (
                    <a
                        href="#"
                        style={{
                            fontSize: 10.5,
                            color: T.slate,
                            textDecoration: "none",
                            fontWeight: 600,
                            opacity: 0.5,
                        }}
                    >
                        Detail{" "}
                        <i
                            className="bi bi-chevron-right"
                            style={{ fontSize: 9 }}
                        />
                    </a>
                )}
            </div>
        </div>
    );
}
/* ── CARD WRAPPER ── */
export function Card({
    title,
    sub,
    footer,
    onFooterClick,
    style = {},
    children,
    noPad = false,
    headerAction,
}) {
    return (
        <div
            style={{
                ...S.card,
                ...style,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {(title || sub || headerAction) && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderBottom: `1px solid ${T.border}`,
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: T.text,
                            }}
                        >
                            {title}
                        </div>
                        {sub && (
                            <div
                                style={{
                                    fontSize: 10,
                                    color: T.slate,
                                    marginTop: 2,
                                }}
                            >
                                {sub}
                            </div>
                        )}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div style={{ padding: noPad ? 0 : "14px 16px", flex: 1 }}>
                {children}
            </div>
            {footer && (
                <div
                    style={{
                        padding: "9px 16px",
                        borderTop: `1px solid ${T.border}`,
                        textAlign: "center",
                    }}
                >
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (onFooterClick) onFooterClick();
                        }}
                        style={{
                            fontSize: 10.5,
                            color: T.blueSoft,
                            textDecoration: "none",
                            fontWeight: 600,
                        }}
                    >
                        {footer}{" "}
                        <i
                            className="bi bi-chevron-right"
                            style={{ fontSize: 9 }}
                        />
                    </a>
                </div>
            )}
        </div>
    );
}
/* ── COVERAGE BAR ── */
export function Bar({ value, max = 32 }) {
    const pct = Math.min((value / max) * 100, 100);
    const color = pct >= 80 ? "#1d4ed8" : pct >= 60 ? "#3b82f6" : "#93c5fd";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
                style={{
                    flex: 1,
                    height: 6,
                    background: "#e2e8f0",
                    borderRadius: 6,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 6,
                        transition: "width 0.4s",
                    }}
                />
            </div>
            <span
                style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: T.text,
                    minWidth: 40,
                    textAlign: "right",
                }}
            >
                {value}%
            </span>
        </div>
    );
}
/* ── COMPOSITION CARD ── */
export function CompositionCard({ title, data }) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    return (
        <Card title={title} style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Donut
                    segments={data}
                    size={80}
                    ring={12}
                    label={total}
                    sub="Sekolah"
                />
                <div
                    style={{
                        flex: 1,
                        maxHeight: 120,
                        overflowY: "auto",
                        paddingRight: 5,
                    }}
                >
                    {data.map((item, idx) => (
                        <div
                            key={idx}
                            style={{ marginBottom: idx === 0 ? 8 : 4 }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    marginBottom: 2,
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
                                <span
                                    style={{ fontSize: 10.5, lineHeight: 1.1 }}
                                >
                                    {item.label}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color: T.slate,
                                    marginLeft: 13,
                                }}
                            >
                                {item.value} sekolah (
                                {total > 0
                                    ? ((item.value / total) * 100).toFixed(1)
                                    : 0}
                                %)
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

/* ── TOP 10 PRIORITY SCHOOL / KECAMATAN ── */
export function PrioritySchoolsCard({
    schools = [],
    year,
    mode = "school",
    showAktivitas = false,
    kegiatanSales = [],
}) {
    const priorityYear = year || new Date().getFullYear();
    const isKecamatan = mode === "kecamatan";
    const isCabang = mode === "cabang";
    const isAggMode = isKecamatan || isCabang;
    const [rankBy, setRankBy] = useState("siswa");
    const statusStyle = (status) => {
        if (status === "Tahan") return { bg: "#dcfce7", fg: "#16a34a" };
        if (status === "Rebut") return { bg: "#dbeafe", fg: "#2563eb" };
        return { bg: "#f1f5f9", fg: "#64748b" };
    };
    const activityColor = (label) => {
        const map = {
            Pendekatan: "#64748b",
            Promosi: "#0d9488",
            SP: "#1d4ed8",
            Faktur: "#16a34a",
            Penagihan: "#f59e0b",
            Gagal: "#dc2626",
        };
        return map[label] || "#64748b";
    };
    const th = {
        padding: "4px 6px",
        color: T.slate,
        fontWeight: 700,
        whiteSpace: "nowrap",
    };
    const tdNum = (color) => ({
        padding: "4px 6px",
        textAlign: "right",
        fontWeight: 700,
        color: color || T.text,
        whiteSpace: "nowrap",
    });

    const normalizeSchoolName = (name) =>
        String(name || "")
            .toUpperCase()
            .replace(/\s+/g, " ")
            .trim();

    const rankOptions = [
        { key: "siswa", label: "Siswa Area Cover" },
        { key: "total_siswa", label: "Total Siswa" },
        { key: "total_sekolah", label: "Total Sekolah" },
        { key: "area_cover", label: "Sekolah Area Cover" },
        { key: "potensi", label: "Potensi" },
        { key: "kegiatan_count", label: "Jumlah Kegiatan" },
        { key: "sp", label: `SP ${priorityYear}` },
        { key: "realisasi", label: `Real ${priorityYear}` },
    ];

    const enrichedSchools = useMemo(() => {
        if (!showAktivitas || isAggMode) return schools || [];
        const nameToActs = {};
        const idToActs = {};

        (kegiatanSales || []).forEach((k) => {
            const akt = String(k.aktivitas || "").trim();
            if (!akt) return;
            const cid = k.customer_id;
            if (cid) {
                if (!idToActs[cid]) idToActs[cid] = {};
                idToActs[cid][akt] = (idToActs[cid][akt] || 0) + 1;
            }
            const n = normalizeSchoolName(k.customer_name);
            if (n) {
                if (!nameToActs[n]) nameToActs[n] = {};
                nameToActs[n][akt] = (nameToActs[n][akt] || 0) + 1;
            }
        });

        return (schools || []).map((row) => {
            if (row.activityList) return row;
            const byId = row.id ? idToActs[row.id] : null;
            const byName = nameToActs[normalizeSchoolName(row.name)];
            const acts = byId || byName || {};
            const activityList = Object.entries(acts)
                .sort((a, b) => b[1] - a[1])
                .map(([label, count]) => ({ label, count }));
            return { ...row, activityList };
        });
    }, [schools, kegiatanSales, showAktivitas, isAggMode]);

    const displaySchools = useMemo(() => {
        if (!isKecamatan) return enrichedSchools;
        const key = rankBy;
        return [...enrichedSchools]
            .sort(
                (a, b) =>
                    (Number(b?.[key]) || 0) - (Number(a?.[key]) || 0) ||
                    String(a?.name || "").localeCompare(String(b?.name || ""), "id"),
            )
            .slice(0, 10);
    }, [enrichedSchools, isKecamatan, rankBy]);

    const rankLabel =
        rankOptions.find((o) => o.key === rankBy)?.label || "Siswa Area Cover";

    const title = isCabang
        ? "Top 10 Cabang"
        : isKecamatan
          ? "Top 10 Kecamatan"
          : "Top 10 Priority School";
    const subtitle = isCabang
        ? "Prioritas per cabang (Area Cover BOS)"
        : isKecamatan
          ? `Urut: ${rankLabel} terbanyak`
          : showAktivitas
            ? "Sekolah Prioritas · dengan ringkasan aktivitas"
            : "Sekolah Prioritas";
    const nameHeader = isCabang
        ? "NAMA CABANG"
        : isKecamatan
          ? "NAMA KECAMATAN"
          : "NAMA SEKOLAH";
    const emptyLabel = isCabang
        ? "Belum ada data cabang"
        : isKecamatan
          ? "Belum ada data kecamatan"
          : "Belum ada data priority school";
    const headerIcon = isCabang
        ? "bi bi-building"
        : isKecamatan
          ? "bi bi-geo-alt-fill"
          : "bi bi-star-fill";

    return (
        <div
            style={{
                ...S.card,
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid #f1f5f9",
            }}
        >
            <div
                style={{
                    padding: "12px 14px",
                    borderBottom: `1px solid ${T.border}`,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
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
                            flexShrink: 0,
                        }}
                    >
                        <i
                            className={headerIcon}
                            style={{ fontSize: 12, color: "#f59e0b" }}
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
                            {title}
                        </div>
                        <div
                            style={{
                                fontSize: 9.5,
                                color: T.slate,
                                marginTop: 1,
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>
                </div>
                {isKecamatan && (
                    <label
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 10,
                            color: T.slate,
                            fontWeight: 600,
                        }}
                    >
                        Ranking by
                        <select
                            value={rankBy}
                            onChange={(e) => setRankBy(e.target.value)}
                            style={{
                                fontSize: 11,
                                padding: "5px 28px 5px 8px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                background: "#f8fafc",
                                color: T.text,
                                fontWeight: 700,
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            {rankOptions.map((o) => (
                                <option key={o.key} value={o.key}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {displaySchools.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                            fontSize: 10,
                        }}
                    >
                        <thead>
                            {isKecamatan ? (
                                <>
                                    <tr
                                        style={{
                                            background: "#f8fafc",
                                            borderBottom: `1px solid ${T.border}`,
                                        }}
                                    >
                                        <th
                                            rowSpan={2}
                                            style={{
                                                ...th,
                                                width: 36,
                                                textAlign: "center",
                                                verticalAlign: "middle",
                                            }}
                                        >
                                            NO
                                        </th>
                                        <th
                                            rowSpan={2}
                                            style={{
                                                ...th,
                                                verticalAlign: "middle",
                                            }}
                                        >
                                            {nameHeader}
                                        </th>
                                        <th
                                            colSpan={2}
                                            style={{
                                                ...th,
                                                textAlign: "center",
                                                background: "#f1f5f9",
                                            }}
                                        >
                                            SEKOLAH
                                        </th>
                                        <th
                                            colSpan={3}
                                            style={{
                                                ...th,
                                                textAlign: "center",
                                                background: "#eff6ff",
                                                color: T.blue,
                                            }}
                                        >
                                            AREA COVER
                                        </th>
                                        <th
                                            rowSpan={2}
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                verticalAlign: "middle",
                                            }}
                                        >
                                            JUMLAH
                                            <br />
                                            KEGIATAN
                                        </th>
                                        <th
                                            rowSpan={2}
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                verticalAlign: "middle",
                                            }}
                                        >
                                            SP {priorityYear}
                                        </th>
                                        <th
                                            rowSpan={2}
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                verticalAlign: "middle",
                                            }}
                                        >
                                            REAL {priorityYear}
                                        </th>
                                    </tr>
                                    <tr
                                        style={{
                                            background: "#f8fafc",
                                            borderBottom: `2px solid ${T.border}`,
                                        }}
                                    >
                                        <th
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                background: "#f1f5f9",
                                            }}
                                        >
                                            Sekolah
                                        </th>
                                        <th
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                background: "#f1f5f9",
                                            }}
                                        >
                                            Siswa
                                        </th>
                                        <th
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                background: "#eff6ff",
                                            }}
                                        >
                                            Sekolah
                                        </th>
                                        <th
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                background: "#eff6ff",
                                            }}
                                        >
                                            Siswa
                                        </th>
                                        <th
                                            style={{
                                                ...th,
                                                textAlign: "right",
                                                background: "#eff6ff",
                                            }}
                                        >
                                            Potensi
                                        </th>
                                    </tr>
                                </>
                            ) : (
                                <tr
                                    style={{
                                        background: "#f8fafc",
                                        borderBottom: `2px solid ${T.border}`,
                                    }}
                                >
                                    <th
                                        style={{
                                            ...th,
                                            width: 40,
                                            textAlign: "center",
                                        }}
                                    >
                                        NO
                                    </th>
                                    <th style={th}>{nameHeader}</th>
                                    {!isAggMode && <th style={th}>JENJANG</th>}
                                    <th style={{ ...th, textAlign: "right" }}>
                                        JUMLAH SISWA
                                    </th>
                                    <th style={{ ...th, textAlign: "right" }}>
                                        {isAggMode ? "POTENSI" : "POTENSI EKS"}
                                    </th>
                                    {!isAggMode && <th style={th}>STATUS</th>}
                                    {showAktivitas && !isAggMode && (
                                        <th style={th}>AKTIVITAS</th>
                                    )}
                                    <th style={{ ...th, textAlign: "right" }}>
                                        SP {priorityYear}
                                    </th>
                                    <th style={{ ...th, textAlign: "right" }}>
                                        REAL {priorityYear}
                                    </th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {displaySchools.map((row, idx) => {
                                const st = statusStyle(row.status);
                                const potensi = isAggMode
                                    ? Number(row.potensi || 0)
                                    : Number(row.potensi_swa || 0) +
                                      Number(row.potensi_bos || 0);
                                const activityList = row.activityList || [];
                                if (isKecamatan) {
                                    return (
                                        <tr
                                            key={row.id || row.name || idx}
                                            style={{
                                                borderBottom: `1px solid ${T.border}`,
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "4px 6px",
                                                    textAlign: "center",
                                                    color: T.slate,
                                                }}
                                            >
                                                {idx + 1}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "4px 6px",
                                                    fontWeight: 700,
                                                    color: T.text,
                                                }}
                                            >
                                                {row.name}
                                            </td>
                                            <td style={tdNum()}>
                                                {Number(
                                                    row.total_sekolah || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum()}>
                                                {Number(
                                                    row.total_siswa || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum(T.blue)}>
                                                {Number(
                                                    row.area_cover || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum(T.blue)}>
                                                {Number(
                                                    row.siswa || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum("#059669")}>
                                                {potensi.toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum("#7c3aed")}>
                                                {Number(
                                                    row.kegiatan_count || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum("#d97706")}>
                                                {Number(
                                                    row.sp || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                            <td style={tdNum("#2563eb")}>
                                                {Number(
                                                    row.realisasi || 0,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr
                                        key={row.id || idx}
                                        style={{
                                            borderBottom: `1px solid ${T.border}`,
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "4px 6px",
                                                textAlign: "center",
                                                color: T.slate,
                                            }}
                                        >
                                            {idx + 1}
                                        </td>
                                        <td
                                            style={{
                                                padding: "4px 6px",
                                                fontWeight: 700,
                                                color: T.text,
                                            }}
                                        >
                                            {row.name}
                                        </td>
                                        {!isAggMode && (
                                            <td
                                                style={{
                                                    padding: "4px 6px",
                                                    color: T.slate,
                                                }}
                                            >
                                                {row.jenjang}
                                            </td>
                                        )}
                                        <td style={tdNum()}>
                                            {Number(
                                                row.siswa || 0,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                        <td style={tdNum("#059669")}>
                                            {potensi.toLocaleString("id-ID")}
                                        </td>
                                        {!isAggMode && (
                                            <td style={{ padding: "4px 6px" }}>
                                                <span
                                                    style={{
                                                        padding: "2px 6px",
                                                        borderRadius: 4,
                                                        fontSize: 9,
                                                        fontWeight: 600,
                                                        background: st.bg,
                                                        color: st.fg,
                                                    }}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                        )}
                                        {showAktivitas && !isAggMode && (
                                            <td
                                                style={{
                                                    padding: "4px 6px",
                                                    maxWidth: 220,
                                                }}
                                            >
                                                {activityList.length > 0 ? (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        {activityList.map(
                                                            (a) => (
                                                                <span
                                                                    key={
                                                                        a.label
                                                                    }
                                                                    style={{
                                                                        display:
                                                                            "inline-flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 3,
                                                                        padding:
                                                                            "1px 6px",
                                                                        borderRadius: 4,
                                                                        fontSize: 9,
                                                                        fontWeight: 700,
                                                                        background: `${activityColor(a.label)}18`,
                                                                        color: activityColor(
                                                                            a.label,
                                                                        ),
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                    }}
                                                                >
                                                                    {a.label}{" "}
                                                                    {a.count}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td style={tdNum("#d97706")}>
                                            {Number(row.sp || 0).toLocaleString(
                                                "id-ID",
                                            )}
                                        </td>
                                        <td style={tdNum("#2563eb")}>
                                            {Number(
                                                row.realisasi || 0,
                                            ).toLocaleString("id-ID")}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div
                    style={{
                        flex: 1,
                        padding: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
                        fontSize: 12,
                        minHeight: 120,
                    }}
                >
                    {emptyLabel}
                </div>
            )}
        </div>
    );
}

/* ── BADGE ── */
export function Badge({ label, bg, color }) {
    return (
        <span
            style={{
                background: bg,
                color,
                borderRadius: 5,
                padding: "2px 7px",
                fontSize: 10,
                fontWeight: 700,
            }}
        >
            {label}
        </span>
    );
}
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
