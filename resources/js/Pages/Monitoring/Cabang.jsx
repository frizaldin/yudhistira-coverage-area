import React, { useEffect, useMemo, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import SelectReact from "@/Components/Element/SelectReact";
import JenjangFocusTab from "./Tabs/JenjangFocusTab";
import MarketShareTab from "./Tabs/MarketShareTab";
import DashboardTabArea from "./Tabs/DashboardTabArea";
import KecamatanAreaTab from "./Tabs/KecamatanAreaTab";
import SekolahTabArea from "./Tabs/SekolahTabArea";
import SekolahTabCabang from "./Tabs/SekolahTabCabang";
import NonAreaCoverTab from "./Tabs/NonAreaCoverTab";
import ListCabangAreaTab from "./Tabs/ListCabangAreaTab";
import Swal from "sweetalert2";
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

function FitBounds({ markers }) {
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

/* ── DESIGN TOKENS ── */
const T = {
    blue: "#2563eb",
    blueSoft: "#60a5fa",
    green: "#10b981",
    orange: "#f59e0b",
    red: "#ef4444",
    teal: "#14b8a6",
    purple: "#8b5cf6",
    slate: "#475569",
    slateLight: "#94a3b8",
    text: "#0f172a",
    border: "#e2e8f0",
    bg: "#f8fafc",
    card: "#ffffff",
};

const S = {
    card: {
        background: T.card,
        borderRadius: 10,
        boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
        border: `1px solid ${T.border}`,
    },
    th: {
        fontSize: 8.5,
        fontWeight: 700,
        color: T.slate,
        padding: "3px 6px",
        background: "#f8fafc",
        borderBottom: `1px solid ${T.border}`,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        position: "sticky",
        top: 0,
        zIndex: 5,
    },
    td: {
        fontSize: 10.5,
        color: T.text,
        padding: "3px 6px",
        borderBottom: `1px solid #f4f6f8`,
    },
};

/* ── DONUT CHART ── */
function Donut({ segments, size = 120, ring = 26, label, sub, onSegmentClick }) {
    const [hoveredInfo, setHoveredInfo] = useState(null);
    const r = (size - ring) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    const tot = segments.reduce((a, s) => a + s.value, 0);
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
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={ring}
                />
                {segments.map((seg, i) => {
                    const len = tot > 0 ? (seg.value / tot) * circ : 0;
                    const offset = circ / 4 - cum;
                    cum += len;
                    const percent =
                        tot > 0 ? ((seg.value / tot) * 100).toFixed(1) : 0;
                    const clickable =
                        !!onSegmentClick &&
                        seg.label &&
                        seg.label !== "Belum Ada";
                    return (
                        <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={ring}
                            strokeDasharray={`${len} ${circ}`}
                            strokeDashoffset={offset}
                            style={{
                                cursor: clickable ? "pointer" : seg.label ? "pointer" : "default",
                                transition: "stroke-width 0.2s ease",
                            }}
                            onClick={() => {
                                if (clickable) onSegmentClick(seg);
                            }}
                            onMouseEnter={() => {
                                if (seg.label) {
                                    setHoveredInfo({
                                        label: seg.label,
                                        value: seg.value,
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
                            fontSize: 11,
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
                                marginTop: 1,
                            }}
                        >
                            {sub}
                        </div>
                    )}
                </div>
            )}

            {/* Hover Tooltip (Center) */}
            {hoveredInfo && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        padding: "0 10px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: hoveredInfo.color,
                            marginBottom: 4,
                            lineHeight: 1.1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {hoveredInfo.label}
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: T.text,
                            lineHeight: 1,
                        }}
                    >
                        {hoveredInfo.percent}%
                    </div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 4 }}>
                        {hoveredInfo.value.toLocaleString("id-ID")}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── LINE CHART (nilai absolut, auto-scale) ── */
function LineChart({ data }) {
    if (!data || data.length === 0) return null;
    const W = 440,
        H = 120;
    const p = { t: 28, r: 16, b: 28, l: 48 };
    const cW = W - p.l - p.r,
        cH = H - p.t - p.b;
    const values = data.map((d) => Number(d.v) || 0);
    const maxVal = Math.max(...values, 10);
    const steps = 4;
    let stepSize = Math.ceil(maxVal / steps) || 1;
    const order = Math.pow(10, Math.floor(Math.log10(stepSize)));
    stepSize = Math.ceil(stepSize / order) * order;
    const mx = stepSize * steps;
    const fmt = (v) =>
        v >= 1000
            ? (v / 1000).toFixed(1).replace(/\.0$/, "") + "k"
            : String(v);
    const sx = (i) =>
        data.length === 1 ? p.l + cW / 2 : p.l + (i / (data.length - 1)) * cW;
    const sy = (v) => p.t + cH - (Math.max(0, v) / mx) * cH;
    const path = data
        .map((d, i) => `${i ? "L" : "M"}${sx(i)},${sy(Number(d.v) || 0)}`)
        .join("");
    const area = `${path}L${sx(data.length - 1)},${p.t + cH}L${sx(0)},${p.t + cH}Z`;
    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: "auto" }}
        >
            <defs>
                <linearGradient id="lg-realisasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.blue} stopOpacity=".15" />
                    <stop offset="100%" stopColor={T.blue} stopOpacity=".01" />
                </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((s) => {
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
                            fontSize={9}
                            fill="#94a3b8"
                        >
                            {fmt(v)}
                        </text>
                    </g>
                );
            })}
            <path d={area} fill="url(#lg-realisasi)" />
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
                        cy={sy(Number(d.v) || 0)}
                        r={4}
                        fill={T.blue}
                        stroke="white"
                        strokeWidth={2}
                    />
                    <text
                        x={sx(i)}
                        y={sy(Number(d.v) || 0) - 10}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={700}
                        fill={T.blue}
                    >
                        {fmt(Number(d.v) || 0)}
                    </text>
                    <text
                        x={sx(i)}
                        y={p.t + cH + 16}
                        textAnchor="middle"
                        fontSize={10}
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
        H = 120;
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
                            rx={4}
                        />
                        <text
                            x={cx - barW - gap}
                            y={sy(d.target) - 5}
                            textAnchor="middle"
                            fontSize={10}
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
                            rx={4}
                        />
                        <text
                            x={cx}
                            y={sy(d.real) - 5}
                            textAnchor="middle"
                            fontSize={10}
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
                            rx={4}
                        />
                        <text
                            x={cx + barW + gap}
                            y={sy(d.uncov) - 5}
                            textAnchor="middle"
                            fontSize={10}
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

/* ── MAP LEAFLET ── */
function LeafletMap({ markers = [] }) {
    const getColor = (pct) => {
        if (pct >= 70) return "#16a34a"; // Hijau
        if (pct >= 30) return "#3b82f6"; // Biru
        if (pct >= 10) return "#eab308"; // Kuning
        if (pct >= 0) return "#f97316"; // Jingga
        return "#94a3b8"; // Abu
    };

    const createCustomIcon = (pct) => {
        const color = getColor(pct);
        const html = `
            <div style="
                background-color: ${color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
                opacity: 0.95;
            "></div>
        `;
        return L.divIcon({
            html: html,
            className: "custom-circle-marker",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
        });
    };

    // Coordinate center (Jabodetabek center default, or use first marker)
    const center =
        markers.length > 0 ? [markers[0].lat, markers[0].lng] : [-2.5, 118.0];
    const zoom = markers.length > 1 ? 5 : 8;

    return (
        <div
            style={{
                height: 170,
                width: "100%",
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${T.border}`,
                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)",
            }}
        >
            <MapContainer
                center={center}
                zoom={zoom}
                minZoom={4}
                maxBounds={[
                    [-11.0, 94.0], // South-West (Samudra Hindia)
                    [6.0, 141.0], // North-East (Papua)
                ]}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
                <MapTileLayer />

                <FitBounds markers={markers} />

                {markers.map((r, i) => (
                    <Marker
                        key={i}
                        position={[r.lat, r.lng]}
                        icon={createCustomIcon(
                            r.pct !== undefined ? r.pct : -1,
                        )}
                    >
                        <Popup>
                            <div style={{ minWidth: "200px" }}>
                                <strong
                                    style={{
                                        fontSize: "14px",
                                        borderBottom: `1px solid ${T.border}`,
                                        display: "block",
                                        paddingBottom: "8px",
                                        marginBottom: "10px",
                                        color: T.text,
                                    }}
                                >
                                    {r.label}
                                </strong>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "6px",
                                        fontSize: "12px",
                                    }}
                                >
                                    <span style={{ color: T.slate }}>
                                        Total Sekolah (Potensi)
                                    </span>
                                    <strong>
                                        {r.total !== undefined ? r.total : "-"}
                                    </strong>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "6px",
                                        fontSize: "12px",
                                    }}
                                >
                                    <span style={{ color: T.green }}>
                                        Telah Tercover (Area Cover)
                                    </span>
                                    <strong>
                                        {r.aktif !== undefined ? r.aktif : "-"}
                                    </strong>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "6px",
                                        fontSize: "12px",
                                    }}
                                >
                                    <span style={{ color: T.red }}>
                                        Belum Tercover
                                    </span>
                                    <strong>
                                        {r.belum !== undefined ? r.belum : "-"}
                                    </strong>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginTop: "10px",
                                        paddingTop: "8px",
                                        borderTop: `1px dashed ${T.border}`,
                                        fontSize: "12.5px",
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: T.text }}>
                                        Coverage (%)
                                    </span>
                                    <strong style={{ color: T.blue }}>
                                        {r.pct !== undefined
                                            ? `${r.pct}%`
                                            : "-"}
                                    </strong>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}

/* ── STAT CARD ── */
function StatCard({ label, value, unit, icon, color, sub, trend, detailHref }) {
    return (
        <div
            style={{
                ...S.card,
                padding: "10px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: T.slate,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: 6,
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
function Card({
    title,
    sub,
    footer,
    onFooterClick,
    style = {},
    children,
    noPad = false,
    headerAction,
    onClick,
}) {
    return (
        <div
            onClick={onClick}
            style={{
                ...S.card,
                ...style,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                cursor: onClick ? "pointer" : style.cursor || "default",
                transition: "box-shadow 0.15s ease, transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
                if (!onClick) return;
                e.currentTarget.style.boxShadow =
                    "0 4px 14px rgba(15,23,42,0.10)";
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
                if (!onClick) return;
                e.currentTarget.style.boxShadow = S.card.boxShadow;
                e.currentTarget.style.transform = "none";
            }}
        >
            {(title || sub || headerAction) && (
                <div
                    style={{
                        padding: "5px 10px",
                        borderBottom: `1px solid ${T.border}`,
                        flexShrink: 0,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        background: "#f8fafc",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: T.text,
                                letterSpacing: "0.01em",
                            }}
                        >
                            {title}
                        </div>
                        {sub && (
                            <div
                                style={{
                                    fontSize: 8.5,
                                    color: T.slate,
                                    marginTop: 0,
                                }}
                            >
                                {sub}
                            </div>
                        )}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div
                style={{
                    padding: noPad ? 0 : "8px 10px",
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {children}
            </div>
            {footer && (
                <div
                    style={{
                        padding: "4px 10px",
                        borderTop: `1px solid ${T.border}`,
                        textAlign: "center",
                        background: "#f8fafc",
                        flexShrink: 0,
                    }}
                >
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onFooterClick) onFooterClick();
                        }}
                        style={{
                            fontSize: 10.5,
                            color: T.blue,
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

/** KPI card — full color seperti Sales Performance */
function KpiCard({
    title,
    gradient,
    solid,
    onClick,
    children,
    action,
    hoverShadow,
}) {
    const bg = gradient || solid || "#0f172a";
    return (
        <div
            onClick={onClick}
            title={onClick ? "Klik untuk lihat detail" : undefined}
            style={{
                background: bg,
                borderRadius: 8,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                minHeight: 72,
                color: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                border: "1px solid transparent",
                cursor: onClick ? "pointer" : "default",
                transition: "box-shadow 0.15s ease, transform 0.15s ease",
                position: "relative",
                overflow: "hidden",
            }}
            onMouseEnter={(e) => {
                if (!onClick) return;
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                    hoverShadow || "0 4px 12px rgba(15,23,42,0.25)";
            }}
            onMouseLeave={(e) => {
                if (!onClick) return;
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.05)";
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                }}
            >
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.85)",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                    }}
                >
                    {title}
                </div>
                {action}
                {onClick && !action && (
                    <i
                        className="bi bi-box-arrow-up-right"
                        style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.7)",
                        }}
                    />
                )}
            </div>
            <div>{children}</div>
        </div>
    );
}

const clickableRowStyle = {
    cursor: "pointer",
    transition: "background 0.12s ease",
};

/* ── COVERAGE BAR ── */
function Bar({ value, max = 32 }) {
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

/* ── BADGE ── */
function Badge({ label, bg, color }) {
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

/* ════════════════════════════
   MAIN PAGE
   ════════════════════════════ */
export default function Cabang({
    activeNav = "cabang",
    pageTitle = "Dashboard Cabang",
    cabangName = "CABANG",
    areaName = "AREA",
    description = "",
    areas = [],
    cabangs = [],
    selectedCabang = "",
    provinceCode = null,
    cabangCode = null,

    // Data Props
    realStats = {},
    trl = [],
    trlJenjang = [],
    salesPerformance = [],
    rankingKecamatan = [],
    rankingPeraihanPotensi = [],
    top10Schools = [],
    mapMarkers = [],
    schools = [],
    dana = [],
    jenjang = [],
    trend = [],
    areaCovers = [],
    competitors = [],
    leaderboard = [],
    salesJenjangData = [],
    salesJenjangTotal = "0",
    salesJenjangTotalRealisasi = "0",
    potensiKecamatan = [],
    jenjangFocus = {},
    uncovered = [],
    uncoveredDana = [],
    hideFilters = false,
    backUrl = null,
    isSalesDetail = false,
    timSalesPerformance = [],
    timSalesPerformanceWorst = [],
    listKecamatan = [],
    marketShareKecamatan = [],
    listSekolah = [],
    listNonAreaCover = [],
    kegiatanSales = [],
    visitCoverage = [],
    activityBreakdown = [],
    resultBreakdown = [],
    insights = [],
    filterOptions = {},
    filters = {},
    isFromSalesPerformance = false,
    salesPerformanceFilterOptions = {},
    salesPerformanceFilters = {},
    cabangInsights = null,
    rankingKecamatanRealisasi = [],
    isAreaDashboard = false,
    rankingCabangRealisasi = [],
    ranking = [],
    listSalesCabang = [],
    kpiData = {},
    useSalesStyleDashboard = false,
    salesProfile = null,
    jenjangBreakdown = [],
    sumberDanaBreakdown = [],
    gradeRealisasiBreakdown = [],
    listCabangArea = [],
    dashboardDataPending = false,
}) {
    const { configuration } = usePage().props;
    const prevYear = configuration?.prev_year || "2025";

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterData, setFilterData] = useState({
        kecamatan: filters.kecamatan || "",
        tahun: filters.tahun || "",
        sumber_dana: filters.sumber_dana || "",
    });

    const [dashLoading, setDashLoading] = useState(
        !!(useSalesStyleDashboard && dashboardDataPending),
    );
    const [asyncDash, setAsyncDash] = useState(null);

    const activeFiltersCount = Object.values(filters).filter(
        (v) => v !== null && v !== "",
    ).length;

    const applyFilter = (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        Object.entries(filterData).forEach(([key, value]) => {
            if (value) urlParams.set(key, value);
            else urlParams.delete(key);
        });
        
        router.get(window.location.pathname, Object.fromEntries(urlParams.entries()), {
            preserveState: true,
            preserveScroll: true,
        });
        setIsFilterOpen(false);
    };

    const resetFilter = () => {
        setFilterData({ kecamatan: "", tahun: "", sumber_dana: "" });
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("kecamatan");
        urlParams.delete("tahun");
        urlParams.delete("sumber_dana");
        
        router.get(
            window.location.pathname,
            Object.fromEntries(urlParams.entries()),
            { preserveState: true, preserveScroll: true },
        );
        setIsFilterOpen(false);
    };
    const targetYear = configuration?.target_year || "2026";
    const yearLabel = filters?.tahun || targetYear;
    const prevYearLabel = prevYear;

    const openSalesDetail = (salesId) => {
        if (!salesId) return;
        router.get(
            route("monitoring.sales-performance"),
            {
                area_id: provinceCode || undefined,
                cabang_id: cabangCode || undefined,
                sales_id: salesId,
                tahun: filters?.tahun || yearLabel || undefined,
            },
            { preserveScroll: false },
        );
    };

    const goDetail = (routeName, query = {}) => {
        if (isAreaDashboard) {
            if (!provinceCode) return;
            router.get(route(`monitoring.area.${routeName}`, provinceCode), query, {
                preserveScroll: false,
            });
            return;
        }
        if (!cabangCode) return;
        router.get(route(`monitoring.cabang.${routeName}`, cabangCode), query, {
            preserveScroll: false,
        });
    };

    // Href builder for plain <a>/<Link> anchors (StatCard detailHref, etc.)
    const buildDetailHref = (routeName) => {
        if (isAreaDashboard) {
            return provinceCode ? route(`monitoring.area.${routeName}`, provinceCode) : null;
        }
        return cabangCode ? route(`monitoring.cabang.${routeName}`, cabangCode) : null;
    };

    // Navigate to a specific cabang's dashboard from within the area dashboard
    const goToCabang = (cabangId) => {
        if (!cabangId || !provinceCode) return;
        router.get(
            route("monitoring.area", provinceCode),
            { cabang: cabangId },
            { preserveScroll: false },
        );
    };

    const rowHoverHandlers = {
        onMouseEnter: (e) => {
            e.currentTarget.style.background = "#f1f5f9";
        },
        onMouseLeave: (e) => {
            e.currentTarget.style.background = "transparent";
        },
    };

    const showCabangScoreDetail = () => {
        const comps = resolvedCabangInsights?.components || [];
        if (!comps.length) return;

        const renderItem = (c) => {
            const isPenalty = !!c.is_penalty;
            const scoreLabel = isPenalty ? `−${c.score}` : `${c.score}`;
            const badge = isPenalty
                ? `<span style="margin-left:6px;font-size:9px;font-weight:700;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:1px 5px;">PENGURANG</span>`
                : "";
            return `
                <div style="padding: 10px 12px; background: ${isPenalty ? "#fef2f2" : "#f8fafc"}; border: 1px solid ${isPenalty ? "#fecaca" : "#e2e8f0"}; border-radius: 10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">
                        <div style="font-weight: 700; color: #334155; font-size: 12px;">${c.label} <span style="color:#64748b; font-weight:600; font-size:11px;">(${Number(c.weight ?? 0).toFixed(2)}%)</span>${badge}</div>
                        <div style="font-weight: 800; color: ${c.color || "#334155"}; font-size: 15px;">${scoreLabel}</div>
                    </div>
                    <div style="height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-bottom: 6px;">
                        <div style="height: 100%; width: ${Math.min(100, Math.max(0, Number(c.score) || 0))}%; background: ${c.color || "#3b82f6"}; border-radius: 99px;"></div>
                    </div>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.35;">${c.detail || ""}</div>
                </div>
            `;
        };

        const main = comps.map(renderItem).join("");
        const weightSum = comps
            .filter((c) => !c.is_penalty)
            .reduce((a, c) => a + (Number(c.weight) || 0), 0);
        const lepasWeight = comps
            .filter((c) => !!c.is_penalty)
            .reduce((a, c) => a + (Number(c.weight) || 0), 0);

        Swal.fire({
            title: isAreaDashboard ? "Area Score (AI)" : "Cabang Score (AI)",
            width: 720,
            html: `
                <div style="text-align: left;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom: 8px;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;">Indikator Penilaian ${isAreaDashboard ? "Area" : "Cabang"}</div>
                        <div style="font-size: 10px; color: #64748b; text-align:right;">5 positif: ${weightSum.toFixed(2)}%<br/><span style="color:#b91c1c;">Lepas eksternal: ${lepasWeight.toFixed(2)}%</span></div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px;">
                        ${main}
                    </div>
                    <div style="padding: 10px 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; font-size: 12px; color: #1e3a8a;">
                        <strong>Total Score:</strong> ${resolvedCabangInsights?.totalScore ?? 0} / 100 · <strong>${resolvedCabangInsights?.grade ?? "-"}</strong>
                        <span style="display:block; margin-top: 4px; color:#334155; font-size: 11.5px;">
                            Rumus sama dengan Sales Score: rata-rata berbobot 5 indikator, dikurangi Lepas eksternal.
                        </span>
                    </div>
                </div>
            `,
            confirmButtonText: "Tutup",
            confirmButtonColor: "#2563eb",
        });
    };

    const [activeTab, setActiveTab] = useState("dashboard");
    const [showScoreInfo, setShowScoreInfo] = useState(false);
    const [salesSort, setSalesSort] = useState({
        key: "realisasi",
        dir: "desc",
    });
    const [kegiatanPage, setKegiatanPage] = useState(1);
    const kegiatanPerPage = 15;
    const [sekolahPage, setSekolahPage] = useState(1);
    const sekolahPerPage = 25;

    // Sekolah table controls
    const [sekolahSearch, setSekolahSearch] = useState("");
    const [sekolahJenjang, setSekolahJenjang] = useState("");
    const [sekolahStatus, setSekolahStatus] = useState("");
    const [sekolahGrade, setSekolahGrade] = useState("");
    const [sekolahSort, setSekolahSort] = useState({ key: "name", dir: "asc" });
    const [sekolahChartFilter, setSekolahChartFilter] = useState(null);

    // Non Area Cover table controls
    const [nonAcPage, setNonAcPage] = useState(1);
    const [nonAcSearch, setNonAcSearch] = useState("");
    const [nonAcJenjang, setNonAcJenjang] = useState("");
    const [nonAcGrade, setNonAcGrade] = useState("");
    const [nonAcSort, setNonAcSort] = useState({ key: "name", dir: "asc" });
    const [jenjangFocusFilter, setJenjangFocusFilter] = useState(null);
    // Filter navigasi dari kartu dashboard: { type, value, label, target: 'sales'|'kecamatan' }
    const [componentNavFilter, setComponentNavFilter] = useState(null);
    const [salesJenjangOpenId, setSalesJenjangOpenId] = useState(null);

    useEffect(() => {
        setSekolahPage(1);
    }, [
        sekolahSearch,
        sekolahJenjang,
        sekolahStatus,
        sekolahGrade,
        sekolahSort,
        sekolahChartFilter,
    ]);

    useEffect(() => {
        setNonAcPage(1);
    }, [nonAcSearch, nonAcJenjang, nonAcGrade, nonAcSort]);

    useEffect(() => {
        if (!useSalesStyleDashboard || !dashboardDataPending || !provinceCode) {
            setDashLoading(false);
            return;
        }
        let cancelled = false;
        setDashLoading(true);
        setAsyncDash(null);

        const buildUrl = (section) => {
            const params = new URLSearchParams({
                area_id: String(provinceCode),
                section,
            });
            if (cabangCode) params.set("cabang_id", String(cabangCode));
            if (filters?.tahun) params.set("tahun", String(filters.tahun));

            try {
                return route(
                    "monitoring.dashboard-data",
                    Object.fromEntries(params),
                );
            } catch (e) {
                return `/system/monitoring/dashboard-data?${params.toString()}`;
            }
        };

        const fetchJson = (section) =>
            fetch(buildUrl(section), {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            }).then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            });

        // 1) Kartu dashboard dulu (lite / Area Cover saja)
        fetchJson("dashboard")
            .then((data) => {
                if (cancelled) return null;
                setAsyncDash(data);
                setDashLoading(false);
                return true;
            })
            .catch((err) => {
                console.error("dashboard-data", err);
                if (!cancelled) {
                    setAsyncDash({ _error: err.message });
                    setDashLoading(false);
                }
                return false;
            })
            .then((ok) => {
                if (!ok || cancelled) return;
                // 2) List sekolah / non-AC / kegiatan di background
                // Gagal lists tidak boleh menghapus dashboard yang sudah tampil
                return fetchJson("lists")
                    .then((lists) => {
                        if (cancelled) return;
                        setAsyncDash((prev) => ({
                            ...(prev || {}),
                            ...lists,
                            listsReady: true,
                        }));
                    })
                    .catch((err) => {
                        console.error("dashboard-data lists", err);
                        if (!cancelled) {
                            setAsyncDash((prev) => ({
                                ...(prev || {}),
                                listsReady: false,
                                listsError: err.message,
                            }));
                        }
                    });
            });

        return () => {
            cancelled = true;
        };
    }, [
        useSalesStyleDashboard,
        dashboardDataPending,
        provinceCode,
        cabangCode,
        filters?.tahun,
    ]);

    const resolvedKpiData = asyncDash?.kpiData ?? kpiData;
    const resolvedInsights = asyncDash?.insights ?? insights;
    const resolvedJenjangBreakdown =
        asyncDash?.jenjangBreakdown ?? jenjangBreakdown;
    const resolvedSumberDanaBreakdown =
        asyncDash?.sumberDanaBreakdown ?? sumberDanaBreakdown;
    const resolvedGradeRealisasi =
        asyncDash?.gradeRealisasiBreakdown ?? gradeRealisasiBreakdown;
    const resolvedActivityBreakdown =
        asyncDash?.activityBreakdown ?? activityBreakdown;
    const resolvedResultBreakdown =
        asyncDash?.resultBreakdown ?? resultBreakdown;
    const resolvedCabangInsights =
        asyncDash?.cabangInsights ?? cabangInsights;
    const resolvedListSalesCabang =
        asyncDash?.listSalesCabang ?? listSalesCabang;
    const resolvedListSekolah = asyncDash?.listSekolah ?? listSekolah;
    const resolvedListNonAreaCover =
        asyncDash?.listNonAreaCover ?? listNonAreaCover;
    const resolvedKegiatanSales =
        asyncDash?.kegiatanSales ?? kegiatanSales;
    const resolvedListCabangArea =
        asyncDash?.listCabangArea ?? listCabangArea;
    const resolvedSalesProfile = asyncDash?.salesProfile ?? salesProfile;
    const dashBusy = dashLoading || (dashboardDataPending && !asyncDash);
    const listsLoading =
        !!(
            useSalesStyleDashboard &&
            dashboardDataPending &&
            asyncDash &&
            !asyncDash._error &&
            !asyncDash.listsReady &&
            !asyncDash.listsError
        );
    const liveYearLabel =
        resolvedCabangInsights?.targetYear || yearLabel;
    const livePrevYearLabel =
        resolvedCabangInsights?.prevYear || prevYearLabel;

    const schoolMatchesComponent = (s, filter) => {
        if (!filter?.type || !s) return false;
        if (!s.is_active) return false; // base Area Cover
        const type = filter.type;
        const value = String(filter.value || "")
            .trim()
            .toUpperCase();
        if (type === "jenjang" || type === "trlg_jenjang") {
            const j =
                String(s.jenjang || "Lainnya").toUpperCase().trim() ||
                "Lainnya";
            return j === value;
        }
        if (type === "sumber_dana") {
            const sd =
                String(s.sumber_dana || "")
                    .toUpperCase()
                    .trim() || "LAINNYA/KOSONG";
            return sd === value;
        }
        if (type === "grade") {
            return (
                String(s.school_grade || "")
                    .trim()
                    .toUpperCase() === value
            );
        }
        return false;
    };

    const openSalesByComponent = (filter) => {
        if (!filter?.type || !filter?.value) return;
        setComponentNavFilter({
            type: filter.type,
            value: filter.value,
            label: filter.label || String(filter.value),
            target: "sales",
        });
        setActiveTab("sales");
    };

    const openKecamatanByComponent = (filter) => {
        if (!filter?.type || !filter?.value) return;
        setComponentNavFilter({
            type: filter.type,
            value: filter.value,
            label: filter.label || String(filter.value),
            target: "kecamatan",
        });
        setActiveTab("kecamatan");
    };

    const clearComponentNavFilter = () => setComponentNavFilter(null);

    const componentMatchedSchools = useMemo(() => {
        if (!componentNavFilter) return null;
        return (resolvedListSekolah || []).filter((s) =>
            schoolMatchesComponent(s, componentNavFilter),
        );
    }, [resolvedListSekolah, componentNavFilter]);

    const componentMatchedSalesIds = useMemo(() => {
        if (
            !componentNavFilter ||
            componentNavFilter.target !== "sales" ||
            !componentMatchedSchools
        ) {
            return null;
        }
        return new Set(
            componentMatchedSchools
                .map((s) => s.sales_id)
                .filter((id) => id !== null && id !== "" && Number(id) > 0)
                .map((id) => Number(id)),
        );
    }, [componentNavFilter, componentMatchedSchools]);

    const componentMatchedKecKeys = useMemo(() => {
        if (
            !componentNavFilter ||
            componentNavFilter.target !== "kecamatan" ||
            !componentMatchedSchools
        ) {
            return null;
        }
        const keys = new Set();
        componentMatchedSchools.forEach((s) => {
            const raw = String(s.kecamatan_name || "").trim();
            if (!raw) return;
            const base = raw.split(",")[0].trim().toUpperCase();
            if (base) keys.add(base);
        });
        return keys;
    }, [componentNavFilter, componentMatchedSchools]);

    const openSekolahFromKecamatanJenjang = (kecamatan, jenjang) => {
        const kec = String(kecamatan || "").trim();
        const j = String(jenjang || "").trim().toUpperCase();
        setSekolahSearch("");
        setSekolahJenjang(j);
        setSekolahStatus("");
        setSekolahGrade("");
        setSekolahChartFilter({
            type: "kecamatan",
            value: kec,
            label: `${kec}${j ? ` · ${j}` : ""}`,
        });
        setSekolahPage(1);
        setActiveTab("sekolah");
    };

    const clearSekolahChartFilter = () => {
        setSekolahChartFilter(null);
    };

    const openSekolahFromChart = (filter) => {
        if (!filter?.type) return;
        setSekolahSearch("");
        setSekolahStatus("");
        if (filter.type === "sales_jenjang") {
            setSekolahJenjang(
                String(filter.value?.jenjang || filter.jenjang || "")
                    .trim()
                    .toUpperCase(),
            );
            setSekolahGrade("");
        } else if (
            filter.type === "school_grade" ||
            filter.type === "grade_realisasi"
        ) {
            setSekolahJenjang("");
            setSekolahGrade(String(filter.value || "").trim());
        } else if (filter.type === "jenjang") {
            setSekolahJenjang(String(filter.value || "").trim().toUpperCase());
            setSekolahGrade("");
        } else {
            setSekolahJenjang("");
            setSekolahGrade("");
        }
        setSekolahChartFilter(filter);
        setSekolahPage(1);
        setActiveTab("sekolah");
    };

    const openJenjangFromMarketShareKota = (row) => {
        const kotaKab = String(row?.kecamatan || "")
            .trim()
            .toUpperCase();
        const cabang = String(row?.cabang_name || row?.kota_kab || "").trim();
        if (!kotaKab) return;
        setJenjangFocusFilter({
            kotaKab,
            cabang,
            ts: Date.now(),
        });
        setActiveTab("jenjang");
    };

    /* ── Format helpers ── */
    const formatNumber = (num) =>
        new Intl.NumberFormat("id-ID").format(num || 0);

    const toggleSalesSort = (key) => {
        setSalesSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: key === "name" ? "asc" : "desc" },
        );
    };

    const salesSortMark = (key) => {
        if (salesSort.key !== key) return "";
        return salesSort.dir === "asc" ? " ↑" : " ↓";
    };

    const sortedSalesCabang = useMemo(() => {
        const dir = salesSort.dir === "asc" ? 1 : -1;
        const key = salesSort.key;
        let rows = [...(resolvedListSalesCabang || [])];
        if (componentMatchedSalesIds) {
            rows = rows.filter((r) =>
                componentMatchedSalesIds.has(Number(r.id)),
            );
        }
        return rows.sort((a, b) => {
            if (key === "name") {
                return (
                    String(a.name || "").localeCompare(String(b.name || ""), "id", {
                        sensitivity: "base",
                    }) * dir
                );
            }
            const av = Number(a[key]) || 0;
            const bv = Number(b[key]) || 0;
            if (av === bv) {
                return String(a.name || "").localeCompare(String(b.name || ""), "id", {
                    sensitivity: "base",
                });
            }
            return (av - bv) * dir;
        });
    }, [resolvedListSalesCabang, salesSort, componentMatchedSalesIds]);

    const jenjangBySalesId = useMemo(() => {
        const order = { SD: 1, SMP: 2, SMA: 3, SMK: 4, DLL: 5 };
        const map = {};
        (resolvedListSekolah || []).forEach((s) => {
            if (!s?.is_active) return;
            const sid = Number(s.sales_id);
            if (!sid) return;
            let j =
                String(s.jenjang || "")
                    .trim()
                    .toUpperCase() || "LAINNYA";
            if (j === "LAINNYA") j = "DLL";
            if (!map[sid]) map[sid] = {};
            if (!map[sid][j]) {
                map[sid][j] = {
                    jenjang: j,
                    area_cover: 0,
                    customer_realisasi: 0,
                    sp: 0,
                    realisasi: 0,
                    target: 0,
                };
            }
            const bucket = map[sid][j];
            bucket.area_cover += 1;
            const real = Number(s.real_exemplar_current) || 0;
            if (real > 0) bucket.customer_realisasi += 1;
            bucket.sp += Number(s.sp_exemplar_current) || 0;
            bucket.realisasi += real;
            bucket.target += Number(s.target_exemplar_current) || 0;
        });
        const out = {};
        Object.entries(map).forEach(([sid, byJenjang]) => {
            out[Number(sid)] = Object.values(byJenjang)
                .map((r) => ({
                    ...r,
                    sp: Math.round(r.sp),
                    realisasi: Math.round(r.realisasi),
                    target: Math.round(r.target),
                    achievement_pct:
                        r.target > 0
                            ? Math.round((r.realisasi / r.target) * 1000) / 10
                            : r.realisasi > 0
                              ? 100
                              : 0,
                }))
                .sort(
                    (a, b) =>
                        (order[a.jenjang] || 99) - (order[b.jenjang] || 99) ||
                        a.jenjang.localeCompare(b.jenjang, "id"),
                );
        });
        return out;
    }, [resolvedListSekolah]);

    const salesCabangSubtotal = useMemo(() => {
        const rows = sortedSalesCabang || [];
        const sum = (key) =>
            rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
        const areaCover = sum("area_cover");
        const customerRealisasi = sum("customer_realisasi");
        const sp = sum("sp");
        const realisasi = sum("realisasi");
        const target = sum("target");
        const totalSekolah = sum("total_sekolah");
        const achievementPct =
            target > 0 ? Math.round((realisasi / target) * 1000) / 10 : 0;
        const coverPct =
            totalSekolah > 0
                ? Math.round((areaCover / totalSekolah) * 1000) / 10
                : 0;
        const produktivitas =
            rows.length > 0 ? Math.ceil(realisasi / rows.length) : 0;
        return {
            count: rows.length,
            area_cover: areaCover,
            customer_realisasi: customerRealisasi,
            sp,
            realisasi,
            target,
            total_sekolah: totalSekolah,
            achievement_pct: achievementPct,
            cover_pct: coverPct,
            produktivitas,
        };
    }, [sortedSalesCabang]);

    const ts = realStats.total_sekolah || 0;
    const ca = realStats.customer_aktif || 0;
    const coveragePct = ts > 0 ? ((ca / ts) * 100).toFixed(2) + "%" : "0%";
    const opportunity = ts - ca;
    const oppPct = ts > 0 ? ((opportunity / ts) * 100).toFixed(2) + "%" : "0%";

    const trj = realStats.total_rencana_jual || 0;
    const rj = realStats.realisasi_jual || 0;
    const uncov = Math.max(0, trj - rj);

    const STATS = [
        {
            label: "Coverage Area",
            value: formatNumber(ca),
            unit: "Sekolah",
            icon: "bi-people-fill",
            color: T.green,
            sub: `${coveragePct} dari Total Sekolah`,
            trend: null,
            detailHref: buildDetailHref("customer-aktif"),
        },
        {
            label: "Total Siswa (Area)",
            value: formatNumber(realStats.total_siswa),
            unit: "Siswa",
            icon: "bi-person-lines-fill",
            color: T.blue,
            sub: null,
            trend: null,
            detailHref: buildDetailHref("siswa"),
        },
        {
            label: "Potensi Eksemplar",
            value: formatNumber(realStats.potensi_eksemplar),
            unit: "Eks",
            icon: "bi-lightning-charge-fill",
            color: "#7c3aed",
            sub:
                String(filters?.sumber_dana || "").toUpperCase() === "BOS"
                    ? "BOS: siswa × 1,5"
                    : "Agregasi potensi sekolah",
            trend: null,
            detailHref: null,
        },
        {
            label: "Realisasi Eksemplar",
            value: formatNumber(realStats.real_eksemplar),
            unit: "Eks",
            icon: "bi-journal-check",
            color: T.blue,
            sub:
                (realStats.potensi_eksemplar || 0) > 0
                    ? `${(((realStats.real_eksemplar || 0) / realStats.potensi_eksemplar) * 100).toFixed(1)}% dari Potensi · ${filters?.tahun || targetYear}`
                    : `Tahun ${filters?.tahun || targetYear}`,
            trend: null,
            detailHref: buildDetailHref("target-eksemplar"),
        },
    ];

    const salesStats = [
        {
            label: "Coverage Area",
            value: coveragePct,
            unit: null,
            icon: "bi-globe-asia-australia",
            color: T.blue,
            sub: `${formatNumber(ca)} dari ${formatNumber(ts)} Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.coverage", cabangCode)
                : null,
        },
        {
            label: "Pencapaian Eksemplar",
            value: formatNumber(realStats.real_eksemplar),
            unit: "Eks",
            icon: "bi-journal-check",
            color: T.green,
            sub:
                realStats.target_eksemplar > 0
                    ? `${((realStats.real_eksemplar / realStats.target_eksemplar) * 100).toFixed(1)}% dari Target`
                    : "Belum Ada Target",
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.target-eksemplar", cabangCode)
                : null,
        },
        {
            label: "Total Siswa (Potensi)",
            value: formatNumber(realStats.total_siswa),
            unit: "Siswa",
            icon: "bi-person-lines-fill",
            color: T.purple,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.siswa", cabangCode)
                : null,
        },
        {
            label: "Opportunity (Sekolah)",
            value: formatNumber(opportunity),
            unit: "Sekolah",
            icon: "bi-bullseye",
            color: T.orange,
            sub: `${oppPct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.opportunity", cabangCode)
                : null,
        },
    ];

    const displayStats = isSalesDetail ? salesStats : STATS;

    const DANA = dana.length > 0 ? dana : [];
    const UNCOVERED_DANA = uncoveredDana.length > 0 ? uncoveredDana : [];
    const JENJANG = jenjang;
    const SCHOOLS = schools;
    const TRL = trl;
    const parseIdNum = (v) => {
        if (typeof v === "number") return v;
        return (
            parseInt(String(v ?? "0").replace(/\./g, "").replace(/,/g, ""), 10) ||
            0
        );
    };
    // Gabungkan Gagal ke Lepas (tampilkan Tahan–Rebut–Lepas saja)
    const trlSegments = (() => {
        const raw = (TRL || []).map((t) => ({
            key: String(t.key || "").toLowerCase(),
            label: t.label,
            value: parseIdNum(t.value),
            color: t.color,
            icon: t.icon,
        }));
        const byKey = Object.fromEntries(raw.map((t) => [t.key, t]));
        const tahan = byKey.tahan || {
            key: "tahan",
            label: "TAHAN",
            value: 0,
            color: "#10b981",
        };
        const rebut = byKey.rebut || {
            key: "rebut",
            label: "REBUT",
            value: 0,
            color: "#60a5fa",
        };
        const lepasVal =
            (byKey.lepas?.value || 0) + (byKey.gagal?.value || 0);
        const merged = [
            { ...tahan, key: "tahan", label: "TAHAN" },
            { ...rebut, key: "rebut", label: "REBUT" },
            {
                key: "lepas",
                label: "LEPAS",
                value: lepasVal,
                color: byKey.lepas?.color || "#f59e0b",
                icon: byKey.lepas?.icon || "bi-box-arrow-right",
            },
        ];
        const total = merged.reduce((a, s) => a + s.value, 0) || 1;
        return merged.map((s) => ({
            ...s,
            pct:
                ((s.value / total) * 100).toFixed(2).replace(".", ",") + "%",
        }));
    })();
    const trlTotal = trlSegments.reduce((a, s) => a + s.value, 0);
    const trlJenjangDisplay = (trlJenjang || []).map((j) => ({
        ...j,
        lepas: (Number(j.lepas) || 0) + (Number(j.gagal) || 0),
    }));
    const TREND = trend.length > 0 ? trend : [];
    const realisasiTrendData = (() => {
        const fromTrend = TREND.map((d) => {
            const swaBos =
                (Number(d.swa_real) || 0) + (Number(d.bos_real) || 0);
            return {
                label: String(d.label),
                v: swaBos > 0 ? swaBos : Number(d.real) || 0,
            };
        }).filter((d) => d.label);
        if (fromTrend.length > 0) return fromTrend;
        const curr = Number(resolvedCabangInsights?.totalRealisasiTargetYear) || 0;
        const prev = Number(resolvedCabangInsights?.totalRealisasiLaluTargetYear) || 0;
        if (!curr && !prev) return [];
        return [
            { label: String(prevYearLabel), v: prev },
            { label: String(yearLabel), v: curr },
        ];
    })();
    const realisasiYoy = (() => {
        const byYear = Object.fromEntries(
            TREND.map((d) => {
                const swaBos =
                    (Number(d.swa_real) || 0) + (Number(d.bos_real) || 0);
                return [
                    String(d.label),
                    swaBos > 0 ? swaBos : Number(d.real) || 0,
                ];
            }),
        );
        const prev =
            Number(resolvedCabangInsights?.totalRealisasiLaluTargetYear) ||
            byYear[String(prevYearLabel)] ||
            0;
        const curr =
            Number(resolvedCabangInsights?.totalRealisasiTargetYear) ||
            byYear[String(yearLabel)] ||
            0;
        const yoyPct =
            resolvedCabangInsights?.yoyPct != null
                ? Number(resolvedCabangInsights.yoyPct)
                : prev > 0
                  ? Math.round(((curr - prev) / prev) * 1000) / 10
                  : curr > 0
                    ? 100
                    : 0;
        const maxVal = Math.max(prev, curr, 1);
        return { prev, curr, yoyPct, maxVal };
    })();
    const AREA_COVERS =
        areaCovers.length > 0
            ? areaCovers
            : jenjang.map((j) => ({
                label: j.label,
                color: j.color,
                ac25: j.ac25 || 0,
                ac26: j.ac26 || 0,
                target: j.target || 0,
            }));

    const OPP = [...rankingKecamatan]
        .map((r) => ({
            no: 0, // will set below
            kec: r.name,
            total: new Intl.NumberFormat("id-ID").format(r.total),
            cust: new Intl.NumberFormat("id-ID").format(r.cust),
            opp: new Intl.NumberFormat("id-ID").format(
                Math.max(0, r.total - r.cust),
            ),
            pct: r.pct + "%",
            _opp_val: Math.max(0, r.total - r.cust),
        }))
        .sort((a, b) => b._opp_val - a._opp_val)
        .map((r, i) => {
            r.no = i + 1;
            return r;
        })
        .slice(0, 10);

    // Cabang Opportunity (Top 10) — used on the Area dashboard instead of OPP (kecamatan)
    const OPP_CABANG = [...ranking]
        .map((r) => ({
            no: 0,
            id: r.id,
            name: r.name,
            kec: r.name, // alias so it can share the OPP table markup below
            total: new Intl.NumberFormat("id-ID").format(r.total),
            cust: new Intl.NumberFormat("id-ID").format(r.cust),
            opp: new Intl.NumberFormat("id-ID").format(
                Math.max(0, r.total - r.cust),
            ),
            pct: r.pct + "%",
            _opp_val: Math.max(0, r.total - r.cust),
        }))
        .sort((a, b) => b._opp_val - a._opp_val)
        .map((r, i) => {
            r.no = i + 1;
            return r;
        })
        .slice(0, 10);

    const oppRows = isAreaDashboard ? OPP_CABANG : OPP;

    // Ranking · Realisasi card: by Cabang on the Area dashboard, by Kecamatan otherwise
    const rankingRealisasiRows = isAreaDashboard
        ? rankingCabangRealisasi || []
        : rankingKecamatanRealisasi || [];
    const rankingRealisasiLabel = isAreaDashboard ? "Cabang" : "Kecamatan";

    // GOV computed from area coverage (placeholder — no conflict data yet)
    const GOV = [];

    const INSIGHTS = [];

    const MAP_LEGEND = [
        { label: "Covered ≥ 70%", color: "#34d399" },
        { label: "Low Coverage 30–70%", color: "#60a5fa" },
        { label: "Opportunity 10–30%", color: "#fbbf24" },
        { label: "High Opportunity < 10%", color: "#fb923c" },
        { label: "No Data", color: "#94a3b8" },
    ];

    /* SELECT STYLE */
    const sel = {
        fontSize: 11,
        padding: "5px 24px 5px 9px",
        border: `1px solid ${T.border}`,
        borderRadius: 7,
        background: "white",
        color: T.text,
        cursor: "pointer",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 7px center",
        appearance: "none",
        outline: "none",
    };

    /* NO (rank badge) */
    const RankNo = ({ n }) => (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                fontSize: 10,
                fontWeight: 700,
                background: n <= 3 ? T.blue : "#e2e8f0",
                color: n <= 3 ? "white" : T.slate,
            }}
        >
            {n}
        </span>
    );

    // Filter & Sort Daftar Sekolah
    let filteredListSekolah = [...(resolvedListSekolah || [])];

    if (sekolahSearch) {
        const query = sekolahSearch.toLowerCase();
        filteredListSekolah = filteredListSekolah.filter(
            (s) =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.kecamatan_name &&
                    s.kecamatan_name.toLowerCase().includes(query)) ||
                (s.sales_name &&
                    String(s.sales_name).toLowerCase().includes(query)),
        );
    }

    if (sekolahJenjang) {
        const targetJ = String(sekolahJenjang).toUpperCase().trim();
        filteredListSekolah = filteredListSekolah.filter(
            (s) =>
                String(s.jenjang || "")
                    .toUpperCase()
                    .trim() === targetJ,
        );
    }
    if (sekolahGrade) {
        const targetG = String(sekolahGrade).trim().toUpperCase();
        filteredListSekolah = filteredListSekolah.filter(
            (s) =>
                String(s.school_grade || "")
                    .trim()
                    .toUpperCase() === targetG,
        );
    }

    if (sekolahStatus !== "") {
        const wantAc = sekolahStatus === "1";
        filteredListSekolah = filteredListSekolah.filter((s) => {
            const v = s?.is_active;
            const isAc = v === true || v === 1 || v === "1";
            return isAc === wantAc;
        });
    }

    if (sekolahChartFilter) {
        const { type, value } = sekolahChartFilter;
        if (type === "kecamatan") {
            const target = String(value || "")
                .toUpperCase()
                .trim();
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const raw = String(s.kecamatan_name || "")
                    .toUpperCase()
                    .trim();
                const base = raw.split(",")[0].trim();
                return base === target || raw.includes(target);
            });
        } else if (type === "jenjang") {
            filteredListSekolah = filteredListSekolah.filter((s) => {
                const j = String(s.jenjang || "").trim() || "Lainnya";
                return (
                    j.toUpperCase() ===
                    String(value || "")
                        .trim()
                        .toUpperCase()
                );
            });
        } else if (type === "area_cover") {
            filteredListSekolah = filteredListSekolah.filter(
                (s) => !!s.is_active,
            );
        } else if (type === "realisasi") {
            filteredListSekolah = filteredListSekolah.filter(
                (s) =>
                    !!s.is_active &&
                    (Number(s.real_exemplar_current) || 0) > 0,
            );
        } else if (type === "school_grade" || type === "grade_realisasi") {
            const targetG = String(value || "")
                .trim()
                .toUpperCase();
            filteredListSekolah = filteredListSekolah.filter(
                (s) =>
                    String(s.school_grade || "")
                        .trim()
                        .toUpperCase() === targetG,
            );
            if (type === "grade_realisasi") {
                filteredListSekolah = filteredListSekolah.filter(
                    (s) =>
                        !!s.is_active &&
                        Number(s.real_exemplar_current || 0) > 0,
                );
            }
        } else if (type === "sales" || type === "sales_jenjang") {
            const sid = Number(
                type === "sales_jenjang"
                    ? value?.sales_id ?? sekolahChartFilter.sales_id
                    : value,
            );
            filteredListSekolah = filteredListSekolah.filter(
                (s) => !!s.is_active && Number(s.sales_id) === sid,
            );
            if (type === "sales_jenjang") {
                const targetJ = String(
                    value?.jenjang || sekolahChartFilter.jenjang || "",
                )
                    .trim()
                    .toUpperCase();
                filteredListSekolah = filteredListSekolah.filter((s) => {
                    let j =
                        String(s.jenjang || "")
                            .trim()
                            .toUpperCase() || "LAINNYA";
                    if (j === "LAINNYA") j = "DLL";
                    return j === targetJ;
                });
            }
        }
    }

    const parseLokasiSekolah = (s) => {
        const raw = String(s?.kecamatan_name || "").trim() || "Tanpa Kecamatan";
        const parts = raw
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        const kec = (parts[0] || raw).toUpperCase();
        const kota =
            parts.length > 1
                ? parts.slice(1).join(", ").toUpperCase()
                : "TANPA KOTA/KAB";
        return { kota, kec };
    };
    const jenjangOrderSort = {
        SD: 1,
        SMP: 2,
        SMA: 3,
        SMK: 4,
        DLL: 5,
        Lainnya: 6,
    };

    filteredListSekolah.sort((a, b) => {
        if (!isAreaDashboard) {
            const la = parseLokasiSekolah(a);
            const lb = parseLokasiSekolah(b);
            if (la.kota !== lb.kota) {
                return la.kota.localeCompare(lb.kota, "id");
            }
            if (la.kec !== lb.kec) {
                return la.kec.localeCompare(lb.kec, "id");
            }
            const ja = jenjangOrderSort[a.jenjang] || 99;
            const jb = jenjangOrderSort[b.jenjang] || 99;
            if (ja !== jb) return ja - jb;
        }

        let valA = a[sekolahSort.key];
        let valB = b[sekolahSort.key];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sekolahSort.dir === "asc" ? -1 : 1;
        if (valA > valB) return sekolahSort.dir === "asc" ? 1 : -1;
        return 0;
    });

    // Non Area Cover: dari backend (customer_plans is_ac distinct → customers not in set)
    let filteredListNonAreaCover = [...(resolvedListNonAreaCover || [])];
    if (nonAcSearch) {
        const query = nonAcSearch.toLowerCase();
        filteredListNonAreaCover = filteredListNonAreaCover.filter(
            (s) =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.kecamatan_name &&
                    s.kecamatan_name.toLowerCase().includes(query)) ||
                (s.sales_name &&
                    String(s.sales_name).toLowerCase().includes(query)),
        );
    }
    if (nonAcJenjang) {
        const targetJ = String(nonAcJenjang).toUpperCase().trim();
        filteredListNonAreaCover = filteredListNonAreaCover.filter(
            (s) =>
                String(s.jenjang || "")
                    .toUpperCase()
                    .trim() === targetJ,
        );
    }
    if (nonAcGrade) {
        const targetG = String(nonAcGrade).trim().toUpperCase();
        filteredListNonAreaCover = filteredListNonAreaCover.filter(
            (s) =>
                String(s.school_grade || "")
                    .trim()
                    .toUpperCase() === targetG,
        );
    }
    filteredListNonAreaCover.sort((a, b) => {
        if (!isAreaDashboard) {
            const la = parseLokasiSekolah(a);
            const lb = parseLokasiSekolah(b);
            if (la.kota !== lb.kota) {
                return la.kota.localeCompare(lb.kota, "id");
            }
            if (la.kec !== lb.kec) {
                return la.kec.localeCompare(lb.kec, "id");
            }
            const ja = jenjangOrderSort[a.jenjang] || 99;
            const jb = jenjangOrderSort[b.jenjang] || 99;
            if (ja !== jb) return ja - jb;
        }

        let valA = a[nonAcSort.key];
        let valB = b[nonAcSort.key];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return nonAcSort.dir === "asc" ? -1 : 1;
        if (valA > valB) return nonAcSort.dir === "asc" ? 1 : -1;
        return 0;
    });

    const coverageMapCard = (
        <Card
            title="Map Area Cover"
            sub={cabangName}
            headerAction={
                cabangCode || (isAreaDashboard && provinceCode) ? (
                    <button
                        type="button"
                        onClick={() =>
                            goDetail("coverage")
                        }
                        style={{
                            fontSize: 10,
                            color: T.blue,
                            fontWeight: 600,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            padding: 0,
                        }}
                    >
                        Detail{" "}
                        <i
                            className="bi bi-arrow-right"
                            style={{ fontSize: 10 }}
                        />
                    </button>
                ) : null
            }
        >
            <LeafletMap
                markers={mapMarkers}
                geojsonUrl="/geojson/indonesia-districts.json"
                coverageData={rankingKecamatan}
            />
            <div
                style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px 14px",
                }}
            >
                {MAP_LEGEND.map((l, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        <div
                            style={{
                                width: 11,
                                height: 11,
                                borderRadius: 3,
                                background: l.color,
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                fontSize: 9.5,
                                color: T.slate,
                            }}
                        >
                            {l.label}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`${pageTitle} – ${cabangName}`} />

            {/* ━━━━━━━━━━━━━━━━━━
                HEADER
            ━━━━━━━━━━━━━━━━━━ */}
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
                            fontSize: 14,
                            fontWeight: 800,
                            color: T.text,
                            letterSpacing: "0.2px",
                            textTransform: "uppercase",
                        }}
                    >
                        {pageTitle}
                    </div>
                    {description ? (
                        <div
                            style={{
                                fontSize: 11,
                                color: T.slate,
                                marginTop: 2,
                            }}
                        >
                            {description}
                        </div>
                    ) : null}
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    {backUrl && (
                        <Link
                            href={backUrl}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#64748b",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: "600",
                                transition: "color 0.2s",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#3b82f6";
                                e.currentTarget.style.borderColor = "#bfdbfe";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = "#64748b";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                        >
                            <i className="bi bi-arrow-left"></i> Kembali
                        </Link>
                    )}
                    {!hideFilters && (
                        <>
                            {/* Select Area — Dashboard Area */}
                            {isAreaDashboard && areas && areas.length > 0 && (
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
                                            value={provinceCode || ""}
                                            onChange={(e) => {
                                                const urlParams =
                                                    new URLSearchParams(
                                                        window.location.search,
                                                    );
                                                urlParams.delete("cabang");
                                                router.get(
                                                    route(
                                                        "monitoring.area",
                                                        e.target.value,
                                                    ),
                                                    Object.fromEntries(
                                                        urlParams.entries(),
                                                    ),
                                                );
                                            }}
                                        >
                                            {areas.map((a) => (
                                                <option
                                                    key={a.id}
                                                    value={a.id}
                                                >
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Select Area + Cabang — Dashboard Cabang */}
                            {!isAreaDashboard && areas && areas.length > 0 && (
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
                                            value={provinceCode || ""}
                                            onChange={(e) => {
                                                router.get(
                                                    route(
                                                        "monitoring.cabang.select",
                                                    ),
                                                    {
                                                        area_id: e.target.value,
                                                    },
                                                );
                                            }}
                                        >
                                            {areas.map((a) => (
                                                <option
                                                    key={a.id}
                                                    value={a.id}
                                                >
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {!isAreaDashboard &&
                                cabangs &&
                                cabangs.length > 0 && (
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
                                            value={
                                                selectedCabang ||
                                                cabangCode ||
                                                ""
                                            }
                                            onChange={(e) => {
                                                if (!e.target.value) {
                                                    router.get(
                                                        route(
                                                            "monitoring.cabang.select",
                                                        ),
                                                        provinceCode
                                                            ? {
                                                                  area_id:
                                                                      provinceCode,
                                                              }
                                                            : {},
                                                    );
                                                    return;
                                                }
                                                const urlParams =
                                                    new URLSearchParams(
                                                        window.location.search,
                                                    );
                                                urlParams.set(
                                                    "cabang",
                                                    e.target.value,
                                                );
                                                router.get(
                                                    route(
                                                        "monitoring.area",
                                                        provinceCode,
                                                    ),
                                                    Object.fromEntries(
                                                        urlParams.entries(),
                                                    ),
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }}
                                        >
                                            <option value="">
                                                Pilih Cabang
                                            </option>
                                            {cabangs.map((c) => (
                                                <option
                                                    key={c.id}
                                                    value={c.id}
                                                >
                                                    {c.nama_cabang}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Logout Button */}
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "#fee2e2",
                            borderRadius: 9,
                            padding: "7px 12px",
                            border: `1px solid #fca5a5`,
                            color: "#ef4444",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                    >
                        <i
                            className="bi bi-box-arrow-right"
                            style={{ fontSize: 14 }}
                        />
                        LOGOUT
                    </Link>
                </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━
                TABS NAVIGATION
            ━━━━━━━━━━━━━━━━━━ */}
            <div
                style={{
                    display: "flex",
                    gap: 24,
                    padding: "0 20px",
                    background: "white",
                    borderBottom: `1px solid ${T.border}`,
                    overflowX: "auto",
                }}
            >
                {(isSalesDetail
                    ? [
                        { id: "dashboard", label: "Dashboard Utama" },
                        { id: "kecamatan", label: "Kecamatan" },
                        { id: "sekolah", label: "Sekolah" },
                        { id: "kegiatan", label: "Kegiatan Sales" },
                    ]
                      : isAreaDashboard
                      ? [
                            { id: "dashboard", label: "Dashboard Utama" },
                            { id: "cabang", label: "Cabang" },
                            { id: "jenjang", label: "Jenjang" },
                            { id: "sekolah", label: "Sekolah" },
                            { id: "non-area-cover", label: "Non Area Cover" },
                            { id: "competitor", label: "Marketshare" },
                        ]
                      : [
                            { id: "dashboard", label: "Dashboard Utama" },
                            { id: "sales", label: "Sales" },
                            { id: "jenjang", label: "Jenjang" },
                            { id: "kecamatan", label: "Kecamatan" },
                            { id: "sekolah", label: "Sekolah" },
                            { id: "non-area-cover", label: "Non Area Cover" },
                            { id: "competitor", label: "Marketshare" },
                        ]
                ).map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "6px 0",
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: activeTab === tab.id ? T.blue : T.slate,
                            borderBottom: `2px solid ${activeTab === tab.id ? T.blue : "transparent"}`,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s",
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* ━━━━━━━━━━━━━━━━━━
                CONTENT
            ━━━━━━━━━━━━━━━━━━ */}
            <div
                style={{
                    padding: "8px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >
                {activeTab === "dashboard" && useSalesStyleDashboard && (
                    dashBusy ? (
                        <div
                            style={{
                                background: "white",
                                border: `1px solid ${T.border}`,
                                borderRadius: 12,
                                padding: "48px 24px",
                                textAlign: "center",
                                color: T.slate,
                            }}
                        >
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    border: "3px solid #e2e8f0",
                                    borderTopColor: T.blue,
                                    borderRadius: "50%",
                                    margin: "0 auto 14px",
                                    animation: "spin 0.8s linear infinite",
                                }}
                            />
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: T.text,
                                    marginBottom: 4,
                                }}
                            >
                                Sedang Memuat Data
                            </div>
                            <div style={{ fontSize: 12 }}>
                                Menyiapkan kartu dashboard{" "}
                                {isAreaDashboard ? "area" : "cabang"}…
                            </div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : asyncDash?._error ? (
                        <div
                            style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: 12,
                                padding: "20px",
                                color: "#991b1b",
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            Gagal memuat data dashboard: {asyncDash._error}
                        </div>
                    ) : (
                    <DashboardTabArea
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isSalesDetail={true}
                        kpiData={resolvedKpiData || {}}
                        insights={resolvedInsights || {}}
                        salesProfile={resolvedSalesProfile}
                        listSekolah={resolvedListSekolah}
                        jenjangBreakdown={resolvedJenjangBreakdown}
                        sumberDanaBreakdown={resolvedSumberDanaBreakdown}
                        gradeRealisasiBreakdown={
                            resolvedGradeRealisasi?.length
                                ? resolvedGradeRealisasi
                                : resolvedKpiData?.gradeRealisasi || []
                        }
                        activityBreakdown={resolvedActivityBreakdown}
                        resultBreakdown={resolvedResultBreakdown}
                        kegiatanSales={resolvedKegiatanSales}
                        cabangCode={cabangCode}
                        provinceCode={provinceCode}
                        filters={{
                            ...filters,
                            tahun: filters?.tahun || yearLabel,
                            cabang_id: cabangCode,
                        }}
                        showScoreInfo={showScoreInfo}
                        setShowScoreInfo={setShowScoreInfo}
                        sekolahPage={sekolahPage}
                        setSekolahPage={setSekolahPage}
                        sekolahPerPage={sekolahPerPage}
                        openSekolahFromChart={openSekolahFromChart}
                        openSekolahFromKecamatanJenjang={
                            openSekolahFromKecamatanJenjang
                        }
                        openSalesByComponent={openSalesByComponent}
                        openKecamatanByComponent={openKecamatanByComponent}
                        mapMarkers={mapMarkers}
                        rankingKecamatan={rankingKecamatan}
                        top10Schools={top10Schools}
                        competitors={competitors}
                        cabangName={cabangName}
                        areaName={areaName}
                        pageTitle={pageTitle}
                    />
                    )
                )}

                {activeTab === "dashboard" && !useSalesStyleDashboard && (
                    <>
                        {/* ── R0: EXECUTIVE INSIGHTS (Sales Detail Only) ── */}
                        {isSalesDetail &&
                            Array.isArray(insights) &&
                            insights.length > 0 && (
                            <div
                                style={{
                                    background: "#fefce8",
                                    border: "1px solid #fef08a",
                                    borderRadius: 12,
                                    padding: "16px",
                                    display: "flex",
                                    gap: "16px",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div
                                    style={{
                                        background: "#fef08a",
                                        color: "#a16207",
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <i
                                        className="bi bi-lightbulb-fill"
                                        style={{ fontSize: 20 }}
                                    ></i>
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 800,
                                            color: "#854d0e",
                                            margin: "0 0 8px 0",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        Executive Insights
                                    </h3>
                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft: 16,
                                            color: "#713f12",
                                            fontSize: 12,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {insights.map((ins, idx) => (
                                            <li
                                                key={idx}
                                                dangerouslySetInnerHTML={{
                                                    __html: ins.replace(
                                                        /\*(.*?)\*/g,
                                                        "<strong>$1</strong>",
                                                    ),
                                                }}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* ── R1: STATS ── */}
                        {!isSalesDetail && resolvedCabangInsights ? (
                            <div
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-[6px]"
                                style={{ alignItems: "stretch" }}
                            >
                                <KpiCard
                                    title={`${isAreaDashboard ? "Area" : "Cabang"} Score (AI) · ${yearLabel}`}
                                    solid="#1e293b"
                                    onClick={showCabangScoreDetail}
                                    hoverShadow="0 4px 12px rgba(15,23,42,0.35)"
                                    action={
                                        <i
                                            className="bi bi-info-circle-fill"
                                            style={{
                                                cursor: "pointer",
                                                color: "#94a3b8",
                                                fontSize: 12,
                                            }}
                                            title="Lihat detail skor"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                showCabangScoreDetail();
                                            }}
                                        />
                                    }
                                >
                                    {(() => {
                                        const score = Number(
                                            resolvedCabangInsights.totalScore ?? 0,
                                        );
                                        const starValue = Math.min(
                                            5,
                                            Math.max(0, score / 20),
                                        );
                                        const gradeColor =
                                            score >= 80
                                                ? "#86efac"
                                                : score >= 60
                                                  ? "#93c5fd"
                                                  : score >= 40
                                                    ? "#fcd34d"
                                                    : "#fca5a5";
                                        return (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 26,
                                                        fontWeight: 800,
                                                        lineHeight: 1,
                                                        color: "#fff",
                                                    }}
                                                >
                                                    {resolvedCabangInsights.totalScore ??
                                                        0}
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 3,
                                                        alignItems: "center",
                                                        fontSize: 13,
                                                        lineHeight: 1,
                                                    }}
                                                    title={`${starValue.toFixed(1)} / 5 bintang`}
                                                >
                                                    {[0, 1, 2, 3, 4].map((i) => {
                                                        const filled =
                                                            starValue >= i + 1;
                                                        const half =
                                                            !filled &&
                                                            starValue >=
                                                                i + 0.5;
                                                        return (
                                                            <i
                                                                key={i}
                                                                className={`bi ${
                                                                    filled
                                                                        ? "bi-star-fill"
                                                                        : half
                                                                          ? "bi-star-half"
                                                                          : "bi-star"
                                                                }`}
                                                                style={{
                                                                    color:
                                                                        filled ||
                                                                        half
                                                                            ? "#fbbf24"
                                                                            : "rgba(148,163,184,0.45)",
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: gradeColor,
                                                    }}
                                                >
                                                    {resolvedCabangInsights.grade ||
                                                        "-"}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </KpiCard>

                                <KpiCard
                                    title={`Area Cover & Potensi · ${yearLabel}`}
                                    gradient="linear-gradient(135deg, #7c3aed 0%, #8b5cf6 55%, #f59e0b 160%)"
                                    onClick={() =>
                                        goDetail("customer-aktif")
                                    }
                                    hoverShadow="0 4px 12px rgba(124,58,237,0.35)"
                                >
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 6,
                                            alignItems: "end",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {formatNumber(
                                                    resolvedCabangInsights.totalAreaCover,
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.85)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Customer (AC)
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                borderLeft:
                                                    "1px solid rgba(255,255,255,0.25)",
                                                paddingLeft: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {formatNumber(
                                                    resolvedCabangInsights.totalRencanaJualTargetYear,
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.85)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Potensi Eksemplar
                                            </div>
                                        </div>
                                    </div>
                                </KpiCard>

                                <KpiCard
                                    title={`Realisasi · ${yearLabel}`}
                                    gradient="linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #3b82f6 160%)"
                                    onClick={() =>
                                        goDetail("target-eksemplar")
                                    }
                                    hoverShadow="0 4px 12px rgba(14,165,233,0.35)"
                                >
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 6,
                                            alignItems: "end",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {formatNumber(
                                                    resolvedCabangInsights.customerWithRealisasi,
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.85)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Sekolah
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                borderLeft:
                                                    "1px solid rgba(255,255,255,0.25)",
                                                paddingLeft: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {formatNumber(
                                                    resolvedCabangInsights.totalRealisasiTargetYear,
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.85)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Eksemplar
                                            </div>
                                        </div>
                                    </div>
                                </KpiCard>

                                <KpiCard
                                    title={`Achievement Target · ${yearLabel}`}
                                    gradient="linear-gradient(135deg, #059669 0%, #10b981 55%, #34d399 160%)"
                                    onClick={() =>
                                        goDetail("target-eksemplar")
                                    }
                                    hoverShadow="0 4px 12px rgba(16,185,129,0.35)"
                                >
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 6,
                                            alignItems: "end",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {resolvedCabangInsights.achievementEksPct}%
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.85)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Eksemplar
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                borderLeft:
                                                    "1px solid rgba(255,255,255,0.25)",
                                                paddingLeft: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {resolvedCabangInsights.achievementAcPct}%
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "rgba(255,255,255,0.85)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Area Cover
                                            </div>
                                        </div>
                                    </div>
                                </KpiCard>

                                <KpiCard
                                    title={`Kesehatan Tim Sales · ${yearLabel}`}
                                    gradient="linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 160%)"
                                    onClick={() =>
                                        goDetail("sales-jenjang")
                                    }
                                    hoverShadow="0 4px 12px rgba(15,23,42,0.35)"
                                >
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "1fr 1fr",
                                            gap: 6,
                                            alignItems: "end",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                    color:
                                                        (resolvedCabangInsights.salesNeedReview ||
                                                            0) > 0
                                                            ? "#fca5a5"
                                                            : "#86efac",
                                                }}
                                            >
                                                {resolvedCabangInsights.salesNeedReview}
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: "#94a3b8",
                                                        marginLeft: 4,
                                                    }}
                                                >
                                                    / {resolvedCabangInsights.salesCount}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    marginTop: 2,
                                                }}
                                            >
                                                Perlu ditinjau
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                borderLeft:
                                                    "1px solid rgba(148,163,184,0.35)",
                                                paddingLeft: 8,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 17,
                                                    fontWeight: 800,
                                                    lineHeight: 1.1,
                                                    color:
                                                        (resolvedCabangInsights.yoyPct ||
                                                            0) >= 0
                                                            ? "#86efac"
                                                            : "#fca5a5",
                                                }}
                                            >
                                                {(resolvedCabangInsights.yoyPct || 0) >=
                                                0
                                                    ? "+"
                                                    : ""}
                                                {resolvedCabangInsights.yoyPct}%
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: "#94a3b8",
                                                    marginTop: 2,
                                                }}
                                            >
                                                YoY vs {prevYearLabel}
                                            </div>
                                        </div>
                                    </div>
                                </KpiCard>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 10,
                                }}
                            >
                                {displayStats.map((s, i) => (
                                    <StatCard key={i} {...s} />
                                ))}
                            </div>
                        )}

                        {/* ── R2: Sales = TRL + Map; Cabang = TRL + Ranking + Belum Tercover ── */}
                        {isSalesDetail ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1.4fr",
                                    gap: 6,
                                    alignItems: "start",
                                }}
                            >
                                <div
                                    style={{
                                        minWidth: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    <Card
                                        title="Tahan – Rebut – Lepas"
                                        sub={`(${cabangName}) · Total ${formatNumber(trlTotal)}`}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Donut
                                                segments={
                                                    trlTotal > 0
                                                        ? trlSegments
                                                        : [
                                                              {
                                                                  label: "Belum Ada",
                                                                  value: 1,
                                                                  color: "#e2e8f0",
                                                              },
                                                          ]
                                                }
                                                size={72}
                                                ring={12}
                                                label={trlTotal}
                                                sub="Total"
                                                onSegmentClick={(seg) => {
                                                    const key = String(
                                                        seg.key ||
                                                            seg.label ||
                                                            "",
                                                    )
                                                        .toLowerCase()
                                                        .replace(/\s+/g, "");
                                                    if (
                                                        !key ||
                                                        key.includes("belum")
                                                    )
                                                        return;
                                                    goDetail(
                                                        "trl-detail",
                                                        {
                                                            trl_status:
                                                                key.includes(
                                                                    "tahan",
                                                                )
                                                                    ? "tahan"
                                                                    : key.includes(
                                                                            "rebut",
                                                                        )
                                                                      ? "rebut"
                                                                      : key.includes(
                                                                              "lepas",
                                                                          )
                                                                        ? "lepas"
                                                                        : key.includes(
                                                                                "gagal",
                                                                            )
                                                                          ? "gagal"
                                                                          : undefined,
                                                        },
                                                    );
                                                }}
                                            />
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 4,
                                                    minWidth: 110,
                                                }}
                                            >
                                                {trlSegments.map((item) => (
                                                    <div
                                                        key={item.key || item.label}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            ...clickableRowStyle,
                                                            borderRadius: 4,
                                                            padding: "1px 2px",
                                                        }}
                                                        title={`Detail ${item.label}`}
                                                        onClick={() =>
                                                            goDetail(
                                                                "trl-detail",
                                                                {
                                                                    trl_status:
                                                                        String(
                                                                            item.key ||
                                                                                item.label ||
                                                                                "",
                                                                        )
                                                                            .toLowerCase()
                                                                            .replace(
                                                                                /\s+/g,
                                                                                "",
                                                                            ),
                                                                },
                                                            )
                                                        }
                                                        {...rowHoverHandlers}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: 99,
                                                                background: item.color,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                {item.label}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9,
                                                                    color: T.slate,
                                                                }}
                                                            >
                                                                {item.pct}
                                                            </div>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight: 800,
                                                                color: item.color,
                                                            }}
                                                        >
                                                            {formatNumber(item.value)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {trlJenjangDisplay?.length > 0 && (
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 180,
                                                        borderLeft: `1px solid ${T.border}`,
                                                        paddingLeft: 14,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 9,
                                                            fontWeight: 700,
                                                            color: T.slate,
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.04em",
                                                            marginBottom: 6,
                                                        }}
                                                    >
                                                        Per Jenjang
                                                    </div>
                                                    <table
                                                        style={{
                                                            width: "100%",
                                                            borderCollapse: "collapse",
                                                            tableLayout: "fixed",
                                                        }}
                                                    >
                                                        <colgroup>
                                                            <col style={{ width: "34%" }} />
                                                            <col style={{ width: "22%" }} />
                                                            <col style={{ width: "22%" }} />
                                                            <col style={{ width: "22%" }} />
                                                        </colgroup>
                                                        <thead>
                                                            <tr>
                                                                <th
                                                                    style={{
                                                                        ...S.th,
                                                                        textAlign: "left",
                                                                        padding: "4px 4px",
                                                                        fontSize: 9,
                                                                    }}
                                                                >
                                                                    Jenjang
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        ...S.th,
                                                                        color: "#10b981",
                                                                        textAlign: "center",
                                                                        padding: "4px 2px",
                                                                        fontSize: 9,
                                                                    }}
                                                                >
                                                                    T
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        ...S.th,
                                                                        color: "#3b82f6",
                                                                        textAlign: "center",
                                                                        padding: "4px 2px",
                                                                        fontSize: 9,
                                                                    }}
                                                                >
                                                                    R
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        ...S.th,
                                                                        color: "#f59e0b",
                                                                        textAlign: "center",
                                                                        padding: "4px 2px",
                                                                        fontSize: 9,
                                                                    }}
                                                                >
                                                                    L
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {trlJenjangDisplay.map((j, i) => (
                                                                <tr
                                                                    key={i}
                                                                    style={
                                                                        clickableRowStyle
                                                                    }
                                                                    title={`Detail TRL jenjang ${j.jenjang}`}
                                                                    onClick={() =>
                                                                        goDetail(
                                                                            "trl-detail",
                                                                            {
                                                                                jenjang:
                                                                                    j.jenjang,
                                                                            },
                                                                        )
                                                                    }
                                                                    {...rowHoverHandlers}
                                                                >
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            fontWeight: 700,
                                                                            padding: "5px 4px",
                                                                            textAlign: "left",
                                                                        }}
                                                                    >
                                                                        {j.jenjang}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign: "center",
                                                                            color: "#10b981",
                                                                            fontWeight: 600,
                                                                            padding: "5px 2px",
                                                                        }}
                                                                    >
                                                                        {formatNumber(j.tahan)}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign: "center",
                                                                            color: "#3b82f6",
                                                                            fontWeight: 600,
                                                                            padding: "5px 2px",
                                                                        }}
                                                                    >
                                                                        {formatNumber(j.rebut)}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign: "center",
                                                                            color: "#f59e0b",
                                                                            fontWeight: 600,
                                                                            padding: "5px 2px",
                                                                        }}
                                                                    >
                                                                        {formatNumber(j.lepas)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                                <div style={{ minWidth: 0 }}>{coverageMapCard}</div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "minmax(0, 1.05fr) minmax(0, 1fr) minmax(0, 1fr)",
                                    gap: 6,
                                    alignItems: "stretch",
                                }}
                            >
                                <Card
                                    title="Tahan – Rebut – Lepas"
                                    sub={`(${cabangName}) · Total ${formatNumber(trlTotal)}`}
                                    style={{ height: "100%", minHeight: 0 }}
                                    headerAction={
                                        buildDetailHref("trl-detail") ? (
                                            <Link
                                                href={buildDetailHref("trl-detail")}
                                                style={{
                                                    fontSize: 10,
                                                    color: T.blue,
                                                    fontWeight: 600,
                                                    textDecoration: "none",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 3,
                                                }}
                                            >
                                                Detail <i className="bi bi-arrow-right" style={{ fontSize: 10 }} />
                                            </Link>
                                        ) : null
                                    }
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Donut
                                            segments={
                                                trlTotal > 0
                                                    ? trlSegments
                                                    : [
                                                          {
                                                              label: "Belum Ada",
                                                              value: 1,
                                                              color: "#e2e8f0",
                                                          },
                                                      ]
                                            }
                                            size={64}
                                            ring={11}
                                            label={trlTotal}
                                            sub="Total"
                                            onSegmentClick={(seg) => {
                                                const key = String(
                                                    seg.key ||
                                                        seg.label ||
                                                        "",
                                                )
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "");
                                                if (
                                                    !key ||
                                                    key.includes("belum")
                                                )
                                                    return;
                                                goDetail(
                                                    "trl-detail",
                                                    {
                                                        trl_status:
                                                            key.includes(
                                                                "tahan",
                                                            )
                                                                ? "tahan"
                                                                : key.includes(
                                                                        "rebut",
                                                                    )
                                                                  ? "rebut"
                                                                  : key.includes(
                                                                          "lepas",
                                                                      )
                                                                    ? "lepas"
                                                                    : key.includes(
                                                                            "gagal",
                                                                        )
                                                                      ? "gagal"
                                                                      : undefined,
                                                    },
                                                );
                                            }}
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 4,
                                                minWidth: 110,
                                            }}
                                        >
                                            {trlSegments.map((item) => (
                                                <div
                                                    key={item.key || item.label}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        ...clickableRowStyle,
                                                        borderRadius: 4,
                                                        padding: "1px 2px",
                                                    }}
                                                    title={`Detail ${item.label}`}
                                                    onClick={() =>
                                                        goDetail(
                                                            "trl-detail",
                                                            {
                                                                trl_status:
                                                                    String(
                                                                        item.key ||
                                                                            item.label ||
                                                                            "",
                                                                    )
                                                                        .toLowerCase()
                                                                        .replace(
                                                                            /\s+/g,
                                                                            "",
                                                                        ),
                                                            },
                                                        )
                                                    }
                                                    {...rowHoverHandlers}
                                                >
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 99,
                                                            background: item.color,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div
                                                            style={{
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                                color: T.text,
                                                            }}
                                                        >
                                                            {item.label}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 9,
                                                                color: T.slate,
                                                            }}
                                                        >
                                                            {item.pct}
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 800,
                                                            color: item.color,
                                                        }}
                                                    >
                                                        {formatNumber(item.value)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {trlJenjangDisplay?.length > 0 && (
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 140,
                                                    borderLeft: `1px solid ${T.border}`,
                                                    paddingLeft: 14,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: T.slate,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.04em",
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    Per Jenjang
                                                </div>
                                                <table
                                                    style={{
                                                        width: "100%",
                                                        borderCollapse: "collapse",
                                                        tableLayout: "fixed",
                                                    }}
                                                >
                                                    <colgroup>
                                                        <col style={{ width: "34%" }} />
                                                        <col style={{ width: "22%" }} />
                                                        <col style={{ width: "22%" }} />
                                                        <col style={{ width: "22%" }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr>
                                                            <th
                                                                style={{
                                                                    ...S.th,
                                                                    textAlign: "left",
                                                                    padding: "4px 4px",
                                                                    fontSize: 9,
                                                                }}
                                                            >
                                                                Jenjang
                                                            </th>
                                                            <th
                                                                style={{
                                                                    ...S.th,
                                                                    color: "#10b981",
                                                                    textAlign: "center",
                                                                    padding: "4px 2px",
                                                                    fontSize: 9,
                                                                }}
                                                            >
                                                                T
                                                            </th>
                                                            <th
                                                                style={{
                                                                    ...S.th,
                                                                    color: "#3b82f6",
                                                                    textAlign: "center",
                                                                    padding: "4px 2px",
                                                                    fontSize: 9,
                                                                }}
                                                            >
                                                                R
                                                            </th>
                                                            <th
                                                                style={{
                                                                    ...S.th,
                                                                    color: "#f59e0b",
                                                                    textAlign: "center",
                                                                    padding: "4px 2px",
                                                                    fontSize: 9,
                                                                }}
                                                            >
                                                                L
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {trlJenjangDisplay.map((j, i) => (
                                                            <tr
                                                                key={i}
                                                                style={
                                                                    clickableRowStyle
                                                                }
                                                                title={`Detail TRL jenjang ${j.jenjang}`}
                                                                onClick={() =>
                                                                    goDetail(
                                                                        "trl-detail",
                                                                        {
                                                                            jenjang:
                                                                                j.jenjang,
                                                                        },
                                                                    )
                                                                }
                                                                {...rowHoverHandlers}
                                                            >
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        fontWeight: 700,
                                                                        padding: "5px 4px",
                                                                        textAlign: "left",
                                                                    }}
                                                                >
                                                                    {j.jenjang}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign: "center",
                                                                        color: "#10b981",
                                                                        fontWeight: 600,
                                                                        padding: "5px 2px",
                                                                    }}
                                                                >
                                                                    {formatNumber(j.tahan)}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign: "center",
                                                                        color: "#3b82f6",
                                                                        fontWeight: 600,
                                                                        padding: "5px 2px",
                                                                    }}
                                                                >
                                                                    {formatNumber(j.rebut)}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign: "center",
                                                                        color: "#f59e0b",
                                                                        fontWeight: 600,
                                                                        padding: "5px 2px",
                                                                    }}
                                                                >
                                                                    {formatNumber(j.lepas)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                                <Card
                                    title={`Ranking ${rankingRealisasiLabel} · Realisasi ${yearLabel}`}
                                    sub={
                                        isAreaDashboard
                                            ? "Top 10 · klik baris untuk buka dashboard cabang"
                                            : "Top 10 · klik baris untuk detail opportunity"
                                    }
                                    style={{ height: "100%", minHeight: 0 }}
                                    headerAction={
                                        cabangCode || (isAreaDashboard && provinceCode) ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    goDetail(
                                                        "opportunity",
                                                    )
                                                }
                                                style={{
                                                    fontSize: 10,
                                                    color: T.blue,
                                                    fontWeight: 600,
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                }}
                                            >
                                                Detail →
                                            </button>
                                        ) : null
                                    }
                                    noPad
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            minHeight: 0,
                                            overflow: "auto",
                                        }}
                                    >
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "separate",
                                                borderSpacing: 0,
                                            }}
                                        >
                                            <thead>
                                                <tr>
                                                    <th
                                                        style={{
                                                            ...S.th,
                                                            paddingLeft: 16,
                                                            width: 36,
                                                        }}
                                                    >
                                                        No
                                                    </th>
                                                    <th style={{ ...S.th }}>
                                                        {rankingRealisasiLabel}
                                                    </th>
                                                    <th
                                                        style={{
                                                            ...S.th,
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        Sekolah
                                                    </th>
                                                    <th
                                                        style={{
                                                            ...S.th,
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        Terealisasi
                                                    </th>
                                                    <th
                                                        style={{
                                                            ...S.th,
                                                            textAlign: "right",
                                                            paddingRight: 16,
                                                        }}
                                                    >
                                                        Realisasi
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rankingRealisasiRows
                                                    .slice(0, 10)
                                                    .map((r) => (
                                                        <tr
                                                            key={r.no || r.id || r.name}
                                                            className="table-row-hover"
                                                            style={clickableRowStyle}
                                                            title={
                                                                isAreaDashboard
                                                                    ? `Buka dashboard cabang ${r.name}`
                                                                    : `Detail kecamatan ${r.name}`
                                                            }
                                                            onClick={() =>
                                                                isAreaDashboard
                                                                    ? goToCabang(r.id)
                                                                    : goDetail(
                                                                          "opportunity",
                                                                          {
                                                                              kecamatan:
                                                                                  r.name,
                                                                          },
                                                                      )
                                                            }
                                                            {...rowHoverHandlers}
                                                        >
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    paddingLeft: 16,
                                                                    color: T.slate,
                                                                }}
                                                            >
                                                                {r.no}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {r.name}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign: "right",
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    r.total_sekolah,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign: "right",
                                                                    fontWeight: 600,
                                                                    color: T.blue,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    r.sekolah_realisasi,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign: "right",
                                                                    paddingRight: 16,
                                                                    fontWeight: 800,
                                                                    color: "#059669",
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    r.realisasi,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {rankingRealisasiRows.length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan="5"
                                                            style={{
                                                                ...S.td,
                                                                textAlign: "center",
                                                                color: T.slate,
                                                                padding: 20,
                                                            }}
                                                        >
                                                            Belum ada data
                                                            realisasi{" "}
                                                            {rankingRealisasiLabel.toLowerCase()}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                                <Card
                                    title={
                                        isAreaDashboard
                                            ? "Cabang Opportunity (Top 10)"
                                            : "Kecamatan Belum Tercover (Top 10)"
                                    }
                                    footer={
                                        isAreaDashboard
                                            ? "Lihat Semua Cabang"
                                            : "Lihat Semua Kecamatan"
                                    }
                                    onFooterClick={() =>
                                        goDetail("opportunity")
                                    }
                                    style={{ height: "100%", minHeight: 0 }}
                                    noPad
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            minHeight: 0,
                                            overflow: "auto",
                                        }}
                                    >
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "separate",
                                            borderSpacing: 0,
                                        }}
                                    >
                                        <thead>
                                            <tr>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        paddingLeft: 16,
                                                    }}
                                                >
                                                    No
                                                </th>
                                                <th style={{ ...S.th }}>
                                                    {isAreaDashboard
                                                        ? "Cabang"
                                                        : "Kecamatan"}
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Total Sekolah
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    {isAreaDashboard ? "AC" : "Sekolah Tercover"}
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Opportunity
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                        paddingRight: 16,
                                                    }}
                                                >
                                                    Coverage
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {oppRows.slice(0, 10).map((r) => (
                                                <tr
                                                    key={r.no}
                                                    style={clickableRowStyle}
                                                    title={
                                                        isAreaDashboard
                                                            ? `Buka dashboard cabang ${r.kec}`
                                                            : `Detail opportunity ${r.kec}`
                                                    }
                                                    onClick={() =>
                                                        isAreaDashboard
                                                            ? goToCabang(r.id)
                                                            : goDetail(
                                                                  "opportunity",
                                                                  {
                                                                      kecamatan:
                                                                          r.kec,
                                                                  },
                                                              )
                                                    }
                                                    {...rowHoverHandlers}
                                                >
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            paddingLeft: 16,
                                                            color: T.slate,
                                                            width: 24,
                                                        }}
                                                    >
                                                        {r.no}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {r.kec}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        {r.total}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        {r.cust}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "right",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {r.opp}
                                                    </td>
                                                    <td
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "right",
                                                            paddingRight: 16,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                color: T.green,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {r.pct}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* ── R3: GRAFIK ── */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            {/* Grafik */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap: 6,
                                    alignItems: "stretch",
                                }}
                            >
                                <Card
                                    title={`Tren Realisasi · ${cabangName}`}
                                    sub="Realisasi eksemplar per tahun · klik untuk detail"
                                    onClick={() =>
                                        goDetail("target-eksemplar")
                                    }
                                >
                                    {realisasiTrendData.length > 0 ? (
                                        <LineChart data={realisasiTrendData} />
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: T.slate,
                                                textAlign: "center",
                                                padding: 16,
                                            }}
                                        >
                                            Belum ada data tren realisasi
                                        </div>
                                    )}
                                </Card>

                                <Card
                                    title="Realisasi Tahun Lalu vs Tahun Ini"
                                    sub={`${prevYearLabel} vs ${yearLabel} · klik untuk detail`}
                                    onClick={() =>
                                        goDetail("target-eksemplar")
                                    }
                                    style={{ height: "100%" }}
                                >
                                    {(() => {
                                        const up = realisasiYoy.yoyPct >= 0;
                                        const delta =
                                            realisasiYoy.curr - realisasiYoy.prev;
                                        const accent = up ? "#059669" : "#dc2626";
                                        const accentSoft = up
                                            ? "#ecfdf5"
                                            : "#fef2f2";
                                        const accentMid = up
                                            ? "#10b981"
                                            : "#ef4444";
                                        return (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 10,
                                                    height: "100%",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "1fr auto 1fr",
                                                        gap: 8,
                                                        alignItems: "stretch",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            background:
                                                                "linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%)",
                                                            border: `1px solid ${T.border}`,
                                                            borderRadius: 10,
                                                            padding: "10px 12px",
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                gap: 6,
                                                                marginBottom: 6,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    color: T.slate,
                                                                    textTransform:
                                                                        "uppercase",
                                                                    letterSpacing:
                                                                        "0.04em",
                                                                }}
                                                            >
                                                                Tahun Lalu
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    color: "#64748b",
                                                                    background:
                                                                        "#e2e8f0",
                                                                    borderRadius: 4,
                                                                    padding:
                                                                        "1px 6px",
                                                                }}
                                                            >
                                                                {prevYearLabel}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 22,
                                                                fontWeight: 800,
                                                                color: T.text,
                                                                lineHeight: 1.05,
                                                                letterSpacing:
                                                                    "-0.03em",
                                                            }}
                                                        >
                                                            {formatNumber(
                                                                realisasiYoy.prev,
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 9.5,
                                                                color: T.slateLight,
                                                                marginTop: 3,
                                                            }}
                                                        >
                                                            eksemplar
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            alignItems: "center",
                                                            justifyContent:
                                                                "center",
                                                            gap: 4,
                                                            minWidth: 72,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: "50%",
                                                                background:
                                                                    accentSoft,
                                                                border: `1px solid ${up ? "#a7f3d0" : "#fecaca"}`,
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                color: accent,
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            <i
                                                                className={`bi ${up ? "bi-arrow-up-right" : "bi-arrow-down-right"}`}
                                                            />
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 14,
                                                                fontWeight: 800,
                                                                color: accent,
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            {up ? "+" : ""}
                                                            {realisasiYoy.yoyPct}%
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 8.5,
                                                                fontWeight: 700,
                                                                color: T.slateLight,
                                                                textTransform:
                                                                    "uppercase",
                                                                letterSpacing:
                                                                    "0.04em",
                                                            }}
                                                        >
                                                            YoY
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background: up
                                                                ? "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)"
                                                                : "linear-gradient(160deg, #fef2f2 0%, #fee2e2 100%)",
                                                            border: `1px solid ${up ? "#a7f3d0" : "#fecaca"}`,
                                                            borderRadius: 10,
                                                            padding: "10px 12px",
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                gap: 6,
                                                                marginBottom: 6,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    color: accent,
                                                                    textTransform:
                                                                        "uppercase",
                                                                    letterSpacing:
                                                                        "0.04em",
                                                                }}
                                                            >
                                                                Tahun Ini
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 700,
                                                                    color: "#fff",
                                                                    background:
                                                                        accentMid,
                                                                    borderRadius: 4,
                                                                    padding:
                                                                        "1px 6px",
                                                                }}
                                                            >
                                                                {yearLabel}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 22,
                                                                fontWeight: 800,
                                                                color: accent,
                                                                lineHeight: 1.05,
                                                                letterSpacing:
                                                                    "-0.03em",
                                                            }}
                                                        >
                                                            {formatNumber(
                                                                realisasiYoy.curr,
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 9.5,
                                                                color: up
                                                                    ? "#047857"
                                                                    : "#b91c1c",
                                                                marginTop: 3,
                                                                opacity: 0.75,
                                                            }}
                                                        >
                                                            eksemplar
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 5,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 36,
                                                                fontSize: 9,
                                                                fontWeight: 700,
                                                                color: T.slate,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {prevYearLabel}
                                                        </span>
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                height: 8,
                                                                background:
                                                                    "#e2e8f0",
                                                                borderRadius: 99,
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(realisasiYoy.prev / realisasiYoy.maxVal) * 100}%`,
                                                                    height: "100%",
                                                                    background:
                                                                        "#64748b",
                                                                    borderRadius: 99,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 36,
                                                                fontSize: 9,
                                                                fontWeight: 700,
                                                                color: accent,
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {yearLabel}
                                                        </span>
                                                        <div
                                                            style={{
                                                                flex: 1,
                                                                height: 8,
                                                                background:
                                                                    "#e2e8f0",
                                                                borderRadius: 99,
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${(realisasiYoy.curr / realisasiYoy.maxVal) * 100}%`,
                                                                    height: "100%",
                                                                    background:
                                                                        accentMid,
                                                                    borderRadius: 99,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        gap: 8,
                                                        background: accentSoft,
                                                        borderRadius: 8,
                                                        padding: "7px 10px",
                                                        border: `1px solid ${up ? "#a7f3d0" : "#fecaca"}`,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            color: T.slate,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Selisih eksemplar
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: 800,
                                                            color: accent,
                                                            letterSpacing:
                                                                "-0.02em",
                                                        }}
                                                    >
                                                        {delta >= 0 ? "+" : ""}
                                                        {formatNumber(delta)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </Card>
                            </div>
                        </div>

                        {!isSalesDetail && (
                            <div style={{ minWidth: 0 }}>{coverageMapCard}</div>
                        )}

                        {isSalesDetail && (
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 300,
                                    display: "flex",
                                    gap: 16,
                                }}
                            >
                                <Card
                                    title="Top 5 Kompetitor di Area Sales"
                                    style={{ flex: 1 }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 14,
                                        }}
                                    >
                                        {competitors.slice(0, 5).map((c, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
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
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 2,
                                                            background: c.color,
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            color: T.text,
                                                        }}
                                                    >
                                                        {c.label}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    {formatNumber(c.value)}{" "}
                                                    sekolah
                                                </div>
                                            </div>
                                        ))}
                                        {competitors.length === 0 && (
                                            <div
                                                style={{
                                                    fontSize: 11,
                                                    color: T.slate,
                                                    textAlign: "center",
                                                    padding: "20px 0",
                                                }}
                                            >
                                                Tidak ada data kompetitor
                                            </div>
                                        )}
                                    </div>
                                </Card>
                                <Card
                                    title="Proporsi Kompetitor"
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    {competitors.length > 0 ? (
                                        <div
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                justifyContent: "center",
                                                padding: "10px 0",
                                            }}
                                        >
                                            <Donut
                                                size={160}
                                                ring={35}
                                                segments={competitors
                                                    .slice(0, 5)
                                                    .map((c) => ({
                                                        label: c.label,
                                                        value: c.value,
                                                        color: c.color,
                                                    }))}
                                                label="Kompetitor"
                                                sub="Top 5"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: T.slate,
                                                textAlign: "center",
                                                padding: "20px 0",
                                            }}
                                        >
                                            Tidak ada data
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "cabang" && isAreaDashboard && (
                    listsLoading ? (
                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: "40px 20px",
                                textAlign: "center",
                                color: T.slate,
                            }}
                        >
                            Sedang Memuat Data
                        </div>
                    ) : (
                    <ListCabangAreaTab
                        listCabangArea={resolvedListCabangArea}
                        areaId={provinceCode}
                        tahun={filters?.tahun || yearLabel}
                    />
                    )
                )}

                {activeTab === "jenjang" && (
                    listsLoading ? (
                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: "40px 20px",
                                textAlign: "center",
                                color: T.slate,
                            }}
                        >
                            Sedang Memuat Data
                        </div>
                    ) : (
                    <JenjangFocusTab
                        listSekolah={resolvedListSekolah}
                        insights={resolvedInsights || {}}
                        configuration={configuration}
                        filters={{
                            ...filters,
                            tahun: filters?.tahun || yearLabel,
                        }}
                        groupByCabang={isAreaDashboard}
                        focusFilter={jenjangFocusFilter}
                    />
                    )
                )}

                {activeTab === "sales" && !isSalesDetail && (
                    <div
                        style={{
                            ...S.card,
                            padding: 0,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "12px 14px",
                                borderBottom: `1px solid ${T.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: T.text,
                                    }}
                                >
                                    Daftar Sales Cabang
                                </div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: T.slate,
                                        marginTop: 2,
                                    }}
                                >
                                    Seluruh sales · klik nama untuk buka
                                    breakdown jenjang · klik header untuk sortir
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                <div
                                    style={{
                                        display: "inline-flex",
                                        flexDirection: "column",
                                        gap: 1,
                                        background: "#ecfdf5",
                                        border: "1px solid #a7f3d0",
                                        borderRadius: 8,
                                        padding: "6px 12px",
                                        minWidth: 140,
                                    }}
                                    title="Produktivitas Sales = Total Realisasi ÷ Total Sales"
                                >
                                    <div
                                        style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            color: "#047857",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.3px",
                                        }}
                                    >
                                        Produktivitas Sales
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 800,
                                            color: "#065f46",
                                            lineHeight: 1.1,
                                        }}
                                    >
                                        {formatNumber(
                                            salesCabangSubtotal.produktivitas,
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 9,
                                            color: "#059669",
                                        }}
                                    >
                                        Realisasi ÷ {salesCabangSubtotal.count}{" "}
                                        sales
                                    </div>
                                </div>
                                {componentNavFilter?.target === "sales" && (
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: T.blue,
                                            background: "#eff6ff",
                                            border: `1px solid #bfdbfe`,
                                            borderRadius: 6,
                                            padding: "4px 8px",
                                        }}
                                    >
                                        Filter: {componentNavFilter.label}
                                        <button
                                            type="button"
                                            onClick={clearComponentNavFilter}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: T.blue,
                                                cursor: "pointer",
                                                fontWeight: 800,
                                                padding: 0,
                                                fontSize: 11,
                                            }}
                                            title="Hapus filter"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: T.slate,
                                        background: "#f8fafc",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 6,
                                        padding: "4px 10px",
                                    }}
                                >
                                    {sortedSalesCabang.length} sales
                                </div>
                            </div>
                        </div>

                        {sortedSalesCabang.length === 0 ? (
                            <div
                                style={{
                                    padding: 32,
                                    textAlign: "center",
                                    color: T.slateLight,
                                    fontSize: 12,
                                }}
                            >
                                Belum ada data sales di cabang ini.
                            </div>
                        ) : (
                            <div
                                style={{
                                    overflow: "auto",
                                    maxHeight: "calc(100vh - 210px)",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "separate",
                                        borderSpacing: 0,
                                        fontSize: 11,
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background: "#f8fafc",
                                                borderBottom: `2px solid ${T.border}`,
                                            }}
                                        >
                                            {[
                                                {
                                                    label: "NO",
                                                    align: "center",
                                                    w: 44,
                                                    key: null,
                                                },
                                                {
                                                    label: "NAMA SALES",
                                                    align: "left",
                                                    key: "name",
                                                },
                                                {
                                                    label: "AREA COVER",
                                                    align: "right",
                                                    key: "area_cover",
                                                },
                                                {
                                                    label: "RENCANA JUAL",
                                                    align: "right",
                                                    key: "target",
                                                },
                                                {
                                                    label: "CUST. REAL",
                                                    align: "right",
                                                    key: "customer_realisasi",
                                                },
                                                {
                                                    label: "SP",
                                                    align: "right",
                                                    key: "sp",
                                                },
                                                {
                                                    label: `REALISASI ${yearLabel}`,
                                                    align: "right",
                                                    key: "realisasi",
                                                },
                                                {
                                                    label: "ACHIEVEMENT",
                                                    align: "right",
                                                    key: "achievement_pct",
                                                },
                                            ].map((h) => (
                                                <th
                                                    key={h.label}
                                                    onClick={
                                                        h.key
                                                            ? () =>
                                                                  toggleSalesSort(
                                                                      h.key,
                                                                  )
                                                            : undefined
                                                    }
                                                    title={
                                                        h.key
                                                            ? "Klik untuk sortir"
                                                            : undefined
                                                    }
                                                    style={{
                                                        ...S.th,
                                                        textAlign: h.align,
                                                        width: h.w,
                                                        padding: "8px 10px",
                                                        fontSize: 9.5,
                                                        cursor: h.key
                                                            ? "pointer"
                                                            : "default",
                                                        userSelect: "none",
                                                        color:
                                                            h.key &&
                                                            salesSort.key ===
                                                                h.key
                                                                ? T.blue
                                                                : T.slate,
                                                    }}
                                                >
                                                    {h.label}
                                                    {h.key
                                                        ? salesSortMark(h.key)
                                                        : ""}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedSalesCabang.map((row, idx) => {
                                            const isOpen =
                                                salesJenjangOpenId === row.id;
                                            const jenjangRows =
                                                jenjangBySalesId[row.id] || [];
                                            const achColor = (pct) =>
                                                pct >= 80
                                                    ? T.green
                                                    : pct >= 50
                                                      ? T.orange
                                                      : T.red;
                                            const metricTds = (
                                                data,
                                                opts = {},
                                            ) => {
                                                const {
                                                    weight = 700,
                                                    bg,
                                                } = opts;
                                                const cell = (
                                                    value,
                                                    color = T.text,
                                                    w = weight,
                                                ) => (
                                                    <td
                                                        style={{
                                                            padding: "7px 10px",
                                                            textAlign: "right",
                                                            fontWeight: w,
                                                            color,
                                                            background: bg,
                                                        }}
                                                    >
                                                        {formatNumber(value)}
                                                    </td>
                                                );
                                                return (
                                                    <>
                                                        {cell(data.area_cover)}
                                                        {cell(
                                                            data.target,
                                                            T.slate,
                                                            600,
                                                        )}
                                                        {cell(
                                                            data.customer_realisasi,
                                                        )}
                                                        {cell(
                                                            data.sp,
                                                            "#d97706",
                                                        )}
                                                        {cell(
                                                            data.realisasi,
                                                            T.blue,
                                                            800,
                                                        )}
                                                        <td
                                                            style={{
                                                                padding:
                                                                    "7px 10px",
                                                                textAlign:
                                                                    "right",
                                                                background: bg,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontWeight: 800,
                                                                    color: achColor(
                                                                        data.achievement_pct,
                                                                    ),
                                                                }}
                                                            >
                                                                {
                                                                    data.achievement_pct
                                                                }
                                                                %
                                                            </span>
                                                        </td>
                                                    </>
                                                );
                                            };
                                            return (
                                                <React.Fragment key={row.id}>
                                                    <tr
                                                        style={{
                                                            borderBottom: `1px solid ${T.border}`,
                                                            background: isOpen
                                                                ? "#eff6ff"
                                                                : "transparent",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isOpen)
                                                                e.currentTarget.style.background =
                                                                    "#f8fafc";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background =
                                                                isOpen
                                                                    ? "#eff6ff"
                                                                    : "transparent";
                                                        }}
                                                    >
                                                        <td
                                                            style={{
                                                                padding:
                                                                    "8px 10px",
                                                                textAlign:
                                                                    "center",
                                                                color: T.slateLight,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {idx + 1}
                                                        </td>
                                                        <td
                                                            style={{
                                                                padding:
                                                                    "8px 10px",
                                                            }}
                                                        >
                                                            <div
                                                                onClick={() => {
                                                                    setSalesJenjangOpenId(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev ===
                                                                            row.id
                                                                                ? null
                                                                                : row.id,
                                                                    );
                                                                }}
                                                                title="Klik untuk buka/tutup breakdown jenjang"
                                                                style={{
                                                                    fontWeight: 700,
                                                                    color: T.blue,
                                                                    cursor: "pointer",
                                                                    display:
                                                                        "inline-flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 5,
                                                                    userSelect:
                                                                        "none",
                                                                }}
                                                            >
                                                                <i
                                                                    className={`bi bi-chevron-${isOpen ? "down" : "right"}`}
                                                                    style={{
                                                                        fontSize: 10,
                                                                        color: T.slateLight,
                                                                    }}
                                                                />
                                                                {row.name}
                                                            </div>
                                                        </td>
                                                        {metricTds(row, {
                                                            weight: 700,
                                                        })}
                                                    </tr>

                                                    {isOpen && (
                                                        <>
                                                            <tr
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openSekolahFromChart(
                                                                        {
                                                                            type: "sales",
                                                                            value: row.id,
                                                                            label: `Sales: ${row.name}`,
                                                                        },
                                                                    );
                                                                }}
                                                                title={`Buka tab Sekolah: filter sales ${row.name}`}
                                                                style={{
                                                                    background:
                                                                        "#dbeafe",
                                                                    boxShadow:
                                                                        "inset 3px 0 0 #1d4ed8",
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "7px 10px",
                                                                        textAlign:
                                                                            "center",
                                                                        color: "#1d4ed8",
                                                                        fontSize: 10,
                                                                        fontWeight: 700,
                                                                        background:
                                                                            "#dbeafe",
                                                                    }}
                                                                >
                                                                    Σ
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        padding:
                                                                            "7px 10px 7px 28px",
                                                                        fontWeight: 800,
                                                                        color: "#1e3a8a",
                                                                        textDecoration:
                                                                            "underline",
                                                                        textUnderlineOffset: 2,
                                                                        background:
                                                                            "#dbeafe",
                                                                    }}
                                                                >
                                                                    Subtotal
                                                                    <span
                                                                        style={{
                                                                            marginLeft: 6,
                                                                            fontWeight: 600,
                                                                            color: T.slate,
                                                                            textDecoration:
                                                                                "none",
                                                                            fontSize: 10,
                                                                        }}
                                                                    >
                                                                        (klik →
                                                                        tab
                                                                        Sekolah)
                                                                    </span>
                                                                </td>
                                                                {metricTds(
                                                                    row,
                                                                    {
                                                                        weight: 800,
                                                                        bg: "#dbeafe",
                                                                    },
                                                                )}
                                                            </tr>
                                                            {jenjangRows.length >
                                                            0 ? (
                                                                jenjangRows.map(
                                                                    (j) => (
                                                                        <tr
                                                                            key={`${row.id}-${j.jenjang}`}
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                openSekolahFromChart(
                                                                                    {
                                                                                        type: "sales_jenjang",
                                                                                        value: {
                                                                                            sales_id:
                                                                                                row.id,
                                                                                            jenjang:
                                                                                                j.jenjang,
                                                                                        },
                                                                                        label: `${row.name} · ${j.jenjang}`,
                                                                                    },
                                                                                );
                                                                            }}
                                                                            title={`Buka tab Sekolah: ${j.jenjang} — ${row.name}`}
                                                                            style={{
                                                                                background:
                                                                                    "#f8fafc",
                                                                                boxShadow:
                                                                                    "inset 3px 0 0 #93c5fd",
                                                                                cursor: "pointer",
                                                                                borderBottom: `1px solid ${T.border}`,
                                                                            }}
                                                                        >
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "6px 10px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    color: T.slateLight,
                                                                                    fontSize: 11,
                                                                                    background:
                                                                                        "#f8fafc",
                                                                                }}
                                                                            >
                                                                                ›
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    padding:
                                                                                        "6px 10px 6px 36px",
                                                                                    fontWeight: 700,
                                                                                    color: T.blue,
                                                                                    textDecoration:
                                                                                        "underline",
                                                                                    textUnderlineOffset: 2,
                                                                                    background:
                                                                                        "#f8fafc",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    j.jenjang
                                                                                }{" "}
                                                                                <span
                                                                                    style={{
                                                                                        color: T.slate,
                                                                                        fontWeight: 600,
                                                                                    }}
                                                                                >
                                                                                    (
                                                                                    {formatNumber(
                                                                                        j.area_cover,
                                                                                    )}{" "}
                                                                                    AC)
                                                                                </span>
                                                                            </td>
                                                                            {metricTds(
                                                                                j,
                                                                                {
                                                                                    weight: 700,
                                                                                    bg: "#f8fafc",
                                                                                },
                                                                            )}
                                                                        </tr>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <tr>
                                                                    <td
                                                                        colSpan={
                                                                            8
                                                                        }
                                                                        style={{
                                                                            padding:
                                                                                "10px 16px 10px 36px",
                                                                            fontSize: 10,
                                                                            color: T.slateLight,
                                                                            fontStyle:
                                                                                "italic",
                                                                            background:
                                                                                "#f8fafc",
                                                                        }}
                                                                    >
                                                                        Belum
                                                                        ada Area
                                                                        Cover
                                                                        untuk
                                                                        sales
                                                                        ini.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                        <tr
                                            style={{
                                                background: "#eff6ff",
                                                borderTop: `2px solid ${T.border}`,
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "9px 10px",
                                                    textAlign: "center",
                                                    fontWeight: 800,
                                                    color: T.blue,
                                                    position: "sticky",
                                                    bottom: 0,
                                                    background: "#eff6ff",
                                                    zIndex: 2,
                                                }}
                                            >
                                                —
                                            </td>
                                            <td
                                                style={{
                                                    padding: "9px 10px",
                                                    position: "sticky",
                                                    bottom: 0,
                                                    background: "#eff6ff",
                                                    zIndex: 2,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 800,
                                                        color: T.blue,
                                                    }}
                                                >
                                                    Subtotal
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 10,
                                                        color: T.slate,
                                                        marginTop: 1,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatNumber(
                                                        salesCabangSubtotal.total_sekolah,
                                                    )}{" "}
                                                    sekolah · cover{" "}
                                                    {salesCabangSubtotal.cover_pct}
                                                    % ·{" "}
                                                    {salesCabangSubtotal.count}{" "}
                                                    sales
                                                </div>
                                            </td>
                                            {[
                                                {
                                                    key: "area_cover",
                                                    color: T.text,
                                                },
                                                {
                                                    key: "target",
                                                    color: T.slate,
                                                    weight: 700,
                                                },
                                                {
                                                    key: "customer_realisasi",
                                                    color: T.text,
                                                },
                                                {
                                                    key: "sp",
                                                    color: "#d97706",
                                                },
                                                {
                                                    key: "realisasi",
                                                    color: T.blue,
                                                    weight: 800,
                                                },
                                            ].map((c) => (
                                                <td
                                                    key={c.key}
                                                    style={{
                                                        padding: "9px 10px",
                                                        textAlign: "right",
                                                        fontWeight:
                                                            c.weight || 800,
                                                        color: c.color,
                                                        position: "sticky",
                                                        bottom: 0,
                                                        background: "#eff6ff",
                                                        zIndex: 2,
                                                    }}
                                                >
                                                    {formatNumber(
                                                        salesCabangSubtotal[c.key],
                                                    )}
                                                </td>
                                            ))}
                                            <td
                                                style={{
                                                    padding: "9px 10px",
                                                    textAlign: "right",
                                                    position: "sticky",
                                                    bottom: 0,
                                                    background: "#eff6ff",
                                                    zIndex: 2,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontWeight: 800,
                                                        color:
                                                            salesCabangSubtotal.achievement_pct >=
                                                            80
                                                                ? T.green
                                                                : salesCabangSubtotal.achievement_pct >=
                                                                    50
                                                                  ? T.orange
                                                                  : T.red,
                                                    }}
                                                >
                                                    {
                                                        salesCabangSubtotal.achievement_pct
                                                    }
                                                    %
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "kecamatan" && !isSalesDetail && (
                    <KecamatanAreaTab
                        activeTab="kecamatan"
                        isSalesDetail={true}
                        listKecamatan={listKecamatan}
                        listSekolah={
                            componentNavFilter?.target === "kecamatan" &&
                            componentMatchedSchools
                                ? componentMatchedSchools
                                : resolvedListSekolah
                        }
                        insights={resolvedInsights || {}}
                        filters={{
                            ...filters,
                            tahun: filters?.tahun || yearLabel,
                        }}
                        openSekolahFromKecamatanJenjang={
                            openSekolahFromKecamatanJenjang
                        }
                        componentFilter={
                            componentNavFilter?.target === "kecamatan"
                                ? componentNavFilter
                                : null
                        }
                        allowedKecamatanKeys={componentMatchedKecKeys}
                        onClearComponentFilter={clearComponentNavFilter}
                    />
                )}

                {activeTab === "sekolah" && !isSalesDetail && (
                    listsLoading ? (
                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: "40px 20px",
                                textAlign: "center",
                                color: T.slate,
                            }}
                        >
                            Sedang Memuat Data
                        </div>
                    ) : isAreaDashboard ? (
                    <SekolahTabArea
                        activeTab="sekolah"
                        isSalesDetail={true}
                        listSekolah={resolvedListSekolah}
                        filteredListSekolah={filteredListSekolah}
                        insights={resolvedInsights || {}}
                        filters={filters}
                        sekolahPage={sekolahPage}
                        setSekolahPage={setSekolahPage}
                        sekolahPerPage={sekolahPerPage}
                        sekolahSearch={sekolahSearch}
                        setSekolahSearch={setSekolahSearch}
                        sekolahJenjang={sekolahJenjang}
                        setSekolahJenjang={setSekolahJenjang}
                        sekolahStatus={sekolahStatus}
                        setSekolahStatus={setSekolahStatus}
                        sekolahGrade={sekolahGrade}
                        setSekolahGrade={setSekolahGrade}
                        sekolahSort={sekolahSort}
                        setSekolahSort={setSekolahSort}
                        sekolahChartFilter={sekolahChartFilter}
                        clearSekolahChartFilter={clearSekolahChartFilter}
                        showSalesColumn={true}
                    />
                    ) : (
                    <SekolahTabCabang
                        activeTab="sekolah"
                        isSalesDetail={true}
                        listSekolah={resolvedListSekolah}
                        filteredListSekolah={filteredListSekolah}
                        insights={resolvedInsights || {}}
                        filters={filters}
                        sekolahPage={sekolahPage}
                        setSekolahPage={setSekolahPage}
                        sekolahPerPage={sekolahPerPage}
                        sekolahSearch={sekolahSearch}
                        setSekolahSearch={setSekolahSearch}
                        sekolahJenjang={sekolahJenjang}
                        setSekolahJenjang={setSekolahJenjang}
                        sekolahStatus={sekolahStatus}
                        setSekolahStatus={setSekolahStatus}
                        sekolahGrade={sekolahGrade}
                        setSekolahGrade={setSekolahGrade}
                        sekolahSort={sekolahSort}
                        setSekolahSort={setSekolahSort}
                        sekolahChartFilter={sekolahChartFilter}
                        clearSekolahChartFilter={clearSekolahChartFilter}
                        showSalesColumn={true}
                    />
                    )
                )}

                {activeTab === "non-area-cover" && !isSalesDetail && (
                    listsLoading ? (
                        <div
                            style={{
                                background: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: "40px 20px",
                                textAlign: "center",
                                color: T.slate,
                            }}
                        >
                            Sedang Memuat Data
                        </div>
                    ) : (
                    <NonAreaCoverTab
                        activeTab="sekolah"
                        isSalesDetail={true}
                        sekolahTitle={`Non Area Cover (${filteredListNonAreaCover.length.toLocaleString("id-ID")})`}
                        listSekolah={resolvedListNonAreaCover}
                        filteredListSekolah={filteredListNonAreaCover}
                        insights={resolvedInsights || {}}
                        filters={filters}
                        sekolahPage={nonAcPage}
                        setSekolahPage={setNonAcPage}
                        sekolahPerPage={sekolahPerPage}
                        sekolahSearch={nonAcSearch}
                        setSekolahSearch={setNonAcSearch}
                        sekolahJenjang={nonAcJenjang}
                        setSekolahJenjang={setNonAcJenjang}
                        sekolahStatus=""
                        setSekolahStatus={() => {}}
                        sekolahGrade={nonAcGrade}
                        setSekolahGrade={setNonAcGrade}
                        sekolahSort={nonAcSort}
                        setSekolahSort={setNonAcSort}
                        sekolahChartFilter={null}
                        clearSekolahChartFilter={() => {}}
                    />
                    )
                )}

                {activeTab === "competitor" && (
                    <MarketShareTab
                        marketShareKecamatan={marketShareKecamatan}
                        tahun={filters?.tahun || yearLabel}
                        groupLabel={isAreaDashboard ? "Cabang" : "Kota/Kab"}
                        rowLabel={isAreaDashboard ? "Kota/Kab" : "Kecamatan"}
                        titlePrefix={
                            isAreaDashboard
                                ? "Market Share Kota/Kab"
                                : "Market Share Kecamatan"
                        }
                        onRowClick={
                            isAreaDashboard
                                ? openJenjangFromMarketShareKota
                                : undefined
                        }
                    />
                )}

                {activeTab === "kecamatan" && isSalesDetail && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title="Daftar Kecamatan"
                            style={{ flex: 1, minWidth: 300 }}
                            noPad
                        >
                            <div
                                style={{
                                    overflow: "auto",
                                    maxHeight: "calc(100vh - 210px)",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "separate",
                                        borderSpacing: 0,
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
                                                }}
                                            >
                                                Kecamatan
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Total Sekolah
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Area Cover
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Potensi Siswa
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listKecamatan.length > 0 ? (
                                            Object.entries(
                                                listKecamatan.reduce(
                                                    (acc, curr) => {
                                                        const kecName =
                                                            curr.kecamatan_name ||
                                                            curr.kecamatan ||
                                                            "";
                                                        const parts =
                                                            kecName.split(",");
                                                        const kotaKab =
                                                            parts.length > 1
                                                                ? parts[1].trim()
                                                                : "Tanpa Kota/Kab";
                                                        if (!acc[kotaKab])
                                                            acc[kotaKab] = [];
                                                        acc[kotaKab].push(curr);
                                                        return acc;
                                                    },
                                                    {},
                                                ),
                                            ).map(([kotaKabName, items]) => (
                                                <React.Fragment
                                                    key={kotaKabName}
                                                >
                                                    <tr
                                                        style={{
                                                            backgroundColor: `${T.blueSoft}10`,
                                                        }}
                                                    >
                                                        <td
                                                            colSpan="5"
                                                            style={{
                                                                ...S.td,
                                                                fontWeight: 700,
                                                                color: T.blue,
                                                                paddingLeft: 16,
                                                            }}
                                                        >
                                                            {kotaKabName}
                                                        </td>
                                                    </tr>
                                                    {items.map((k, i) => (
                                                        <tr
                                                            key={i}
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
                                                                {i + 1}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {k.kecamatan_name ||
                                                                    "- (Tidak Ada Data Kecamatan)"}
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
                                                                    k.total_sekolah,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.green,
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    k.sekolah_aktif,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    fontWeight: 800,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    k.potensi_siswa,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "center",
                                                        color: T.slate,
                                                        padding: "20px 0",
                                                    }}
                                                >
                                                    Tidak ada data kecamatan
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

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
                                <select
                                    value={sekolahGrade}
                                    onChange={(e) =>
                                        setSekolahGrade(e.target.value)
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
                                    <option value="">Semua Grade</option>
                                    <option value="A+">A+</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                                {sekolahChartFilter && (
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "5px 10px",
                                            borderRadius: 99,
                                            background: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#1d4ed8",
                                        }}
                                    >
                                        <i
                                            className="bi bi-funnel-fill"
                                            style={{ fontSize: 10 }}
                                        />
                                        {sekolahChartFilter.label ||
                                            "Filter chart"}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                clearSekolahChartFilter()
                                            }
                                            title="Hapus filter"
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: "#1d4ed8",
                                                cursor: "pointer",
                                                padding: 0,
                                                lineHeight: 1,
                                                fontSize: 14,
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                style={{
                                    overflow: "auto",
                                    maxHeight: "calc(100vh - 210px)",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "separate",
                                        borderSpacing: 0,
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
                                                    textAlign: "center",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() =>
                                                    setSekolahSort((s) => ({
                                                        key: "school_grade",
                                                        dir:
                                                            s.key ===
                                                                "school_grade" &&
                                                                s.dir === "asc"
                                                                ? "desc"
                                                                : "asc",
                                                    }))
                                                }
                                            >
                                                Grade{" "}
                                                {sekolahSort.key ===
                                                    "school_grade"
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
                                                            colSpan="8"
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
                                                                colSpan="8"
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
                                                                                textAlign:
                                                                                    "center",
                                                                            }}
                                                                        >
                                                                            {(() => {
                                                                                const g =
                                                                                    String(
                                                                                        s.school_grade ||
                                                                                            "-",
                                                                                    ).trim();
                                                                                const colors =
                                                                                    {
                                                                                        "A+": "#7c3aed",
                                                                                        A: "#059669",
                                                                                        B: "#2563eb",
                                                                                        C: "#d97706",
                                                                                        D: "#e11d48",
                                                                                    };
                                                                                const color =
                                                                                    colors[
                                                                                        g
                                                                                    ] ||
                                                                                    "#64748b";
                                                                                return (
                                                                                    <span
                                                                                        style={{
                                                                                            display:
                                                                                                "inline-block",
                                                                                            minWidth: 28,
                                                                                            padding:
                                                                                                "2px 8px",
                                                                                            borderRadius: 6,
                                                                                            fontSize: 11,
                                                                                            fontWeight: 800,
                                                                                            color,
                                                                                            background: `${color}18`,
                                                                                            border: `1px solid ${color}44`,
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            g
                                                                                        }
                                                                                    </span>
                                                                                );
                                                                            })()}
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

                {activeTab === "kegiatan" && isSalesDetail && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            {/* Coverage Kunjungan */}
                            <Card
                                title="Coverage Kunjungan Sekolah"
                                style={{ flex: 1, minWidth: 280 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                    }}
                                >
                                    <Donut
                                        segments={visitCoverage}
                                        label={`${visitCoverage.reduce((a, c) => a + c.value, 0) > 0 ? Math.round(((visitCoverage.find((s) => s.label === "Dikunjungi")?.value || 0) / visitCoverage.reduce((a, c) => a + c.value, 0)) * 100) : 0}%`}
                                        sub="Terkunjungi"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {visitCoverage.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: T.text,
                                                    }}
                                                >
                                                    {s.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Distribusi Aktivitas */}
                            <Card
                                title="Distribusi Aktivitas"
                                style={{ flex: 1, minWidth: 280 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                    }}
                                >
                                    <Donut
                                        segments={resolvedActivityBreakdown}
                                        label={resolvedActivityBreakdown.reduce(
                                            (a, c) => a + c.value,
                                            0,
                                        )}
                                        sub="Total Aktv"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {resolvedActivityBreakdown.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: T.text,
                                                    }}
                                                >
                                                    {s.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Hasil Kunjungan */}
                            <Card
                                title="Hasil Kunjungan"
                                style={{ flex: 1, minWidth: 280 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20,
                                    }}
                                >
                                    <Donut
                                        segments={resultBreakdown}
                                        label={resultBreakdown.reduce(
                                            (a, c) => a + c.value,
                                            0,
                                        )}
                                        sub="Aktivitas"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {resultBreakdown.map((s, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: 8,
                                                    fontSize: 12,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        color: T.slate,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                s.color,
                                                        }}
                                                    />
                                                    {s.label}
                                                </div>
                                                <div
                                                    style={{
                                                        fontWeight: 700,
                                                        color: T.text,
                                                    }}
                                                >
                                                    {s.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            <Card
                                title="Riwayat Kegiatan Sales"
                                style={{ flex: 1, minWidth: 300 }}
                                noPad
                            >
                                <div
                                    style={{
                                        overflow: "auto",
                                        maxHeight: "calc(100vh - 210px)",
                                    }}
                                >
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "separate",
                                            borderSpacing: 0,
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
                                                    }}
                                                >
                                                    Tanggal
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Customer
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Aktivitas
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Hasil
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Real. Lalu
                                                </th>
                                                <th
                                                    style={{
                                                        ...S.th,
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    Renc. Jual
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resolvedKegiatanSales &&
                                                resolvedKegiatanSales.length > 0 ? (
                                                resolvedKegiatanSales
                                                    .slice(
                                                        (kegiatanPage - 1) *
                                                        kegiatanPerPage,
                                                        kegiatanPage *
                                                        kegiatanPerPage,
                                                    )
                                                    .map((k, i) => (
                                                        <tr
                                                            key={i}
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
                                                                {(kegiatanPage -
                                                                    1) *
                                                                    kegiatanPerPage +
                                                                    i +
                                                                    1}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {k.tanggal ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {k.customer_name ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                }}
                                                            >
                                                                {k.aktivitas ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    color: T.blue,
                                                                }}
                                                            >
                                                                {k.hasil || "-"}
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
                                                                    k.real_lalu ||
                                                                    0,
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
                                                                    k.rencana_jual ||
                                                                    0,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="7"
                                                        style={{
                                                            ...S.td,
                                                            textAlign: "center",
                                                            color: T.slate,
                                                            padding: "20px 0",
                                                        }}
                                                    >
                                                        Tidak ada data kegiatan
                                                        sales
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {resolvedKegiatanSales &&
                                    resolvedKegiatanSales.length > kegiatanPerPage && (
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
                                                {(kegiatanPage - 1) *
                                                    kegiatanPerPage +
                                                    1}{" "}
                                                -{" "}
                                                {Math.min(
                                                    kegiatanPage *
                                                    kegiatanPerPage,
                                                    resolvedKegiatanSales.length,
                                                )}{" "}
                                                dari {resolvedKegiatanSales.length}
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                }}
                                            >
                                                <button
                                                    onClick={() =>
                                                        setKegiatanPage((p) =>
                                                            Math.max(1, p - 1),
                                                        )
                                                    }
                                                    disabled={
                                                        kegiatanPage === 1
                                                    }
                                                    style={{
                                                        padding: "4px 12px",
                                                        fontSize: 12,
                                                        borderRadius: 4,
                                                        border: `1px solid ${T.border}`,
                                                        backgroundColor:
                                                            kegiatanPage === 1
                                                                ? "#f8fafc"
                                                                : "white",
                                                        color:
                                                            kegiatanPage === 1
                                                                ? "#cbd5e1"
                                                                : T.text,
                                                        cursor:
                                                            kegiatanPage === 1
                                                                ? "not-allowed"
                                                                : "pointer",
                                                    }}
                                                >
                                                    Sebelumnya
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setKegiatanPage((p) =>
                                                            Math.min(
                                                                Math.ceil(
                                                                    resolvedKegiatanSales.length /
                                                                    kegiatanPerPage,
                                                                ),
                                                                p + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        kegiatanPage ===
                                                        Math.ceil(
                                                            resolvedKegiatanSales.length /
                                                            kegiatanPerPage,
                                                        )
                                                    }
                                                    style={{
                                                        padding: "4px 12px",
                                                        fontSize: 12,
                                                        borderRadius: 4,
                                                        border: `1px solid ${T.border}`,
                                                        backgroundColor:
                                                            kegiatanPage ===
                                                                Math.ceil(
                                                                    resolvedKegiatanSales.length /
                                                                    kegiatanPerPage,
                                                                )
                                                                ? "#f8fafc"
                                                                : "white",
                                                        color:
                                                            kegiatanPage ===
                                                                Math.ceil(
                                                                    resolvedKegiatanSales.length /
                                                                    kegiatanPerPage,
                                                                )
                                                                ? "#cbd5e1"
                                                                : T.text,
                                                        cursor:
                                                            kegiatanPage ===
                                                                Math.ceil(
                                                                    resolvedKegiatanSales.length /
                                                                    kegiatanPerPage,
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
                    </div>
                )}

                {/* NOTE */}
                <div
                    style={{
                        fontSize: 10,
                        color: "#94a3b8",
                        fontStyle: "italic",
                        paddingTop: 6,
                        borderTop: `1px solid ${T.border}`,
                    }}
                >
                    <i
                        className="bi bi-info-circle"
                        style={{ marginRight: 5 }}
                    />
                    Catatan: Semua data bersumber dari Data Master (Dapodik),
                    Customer Yudhistira, dan input aktivitas Sales.
                </div>
            </div>

            {/* Filter Modal / Slideover */}
            {isFilterOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyItems: "flex-end",
                        justifyContent: "flex-end",
                        backgroundColor: "rgba(15, 23, 42, 0.4)",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            width: "100%",
                            maxWidth: "384px",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            animation: "fadeInUp 0.3s ease-out",
                        }}
                    >
                        <div
                            style={{
                                padding: "16px 24px",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: "#f8fafc",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 600,
                                    color: "#1e293b",
                                    margin: 0,
                                }}
                            >
                                Filter Data
                            </h3>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "6px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#475569";
                                    e.currentTarget.style.backgroundColor =
                                        "#e2e8f0";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#94a3b8";
                                    e.currentTarget.style.backgroundColor =
                                        "transparent";
                                }}
                            >
                                <svg
                                    style={{ width: "20px", height: "20px" }}
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

                        <div
                            style={{
                                padding: "24px",
                                flex: 1,
                                overflowY: "auto",
                            }}
                        >
                            <form
                                id="filterForm"
                                onSubmit={applyFilter}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                }}
                            >
                                {/* Kecamatan Filter */}
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            color: "#334155",
                                            marginBottom: "4px",
                                        }}
                                    >
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
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                            color: "#334155",
                                            marginBottom: "4px",
                                        }}
                                    >
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

                        <div
                            style={{
                                padding: "16px 24px",
                                backgroundColor: "#f8fafc",
                                borderTop: "1px solid #f1f5f9",
                                display: "flex",
                                gap: "12px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={resetFilter}
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    backgroundColor: "white",
                                    border: "1px solid #cbd5e1",
                                    color: "#334155",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                form="filterForm"
                                style={{
                                    flex: 1,
                                    padding: "8px",
                                    backgroundColor: "#4f46e5",
                                    border: "1px solid transparent",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                }}
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Floating Action Button */}
            {isSalesDetail && (
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
            )}
        </MonitoringLayout>
    );
}
