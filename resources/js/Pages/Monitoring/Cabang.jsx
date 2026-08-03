import React, { useEffect, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";
import SelectReact from "@/Components/Element/SelectReact";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    GeoJSON,
} from "react-leaflet";
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

const S = {
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
    },
    td: {
        fontSize: 11.5,
        color: T.text,
        padding: "7px 10px",
        borderBottom: `1px solid #f4f6f8`,
    },
};

/* ── DONUT CHART ── */
function Donut({ segments, size = 120, ring = 26, label, sub }) {
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
                    const len = (seg.value / tot) * circ;
                    const offset = circ / 4 - cum;
                    cum += len;
                    const percent =
                        tot > 0 ? ((seg.value / tot) * 100).toFixed(1) : 0;
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
                                cursor: seg.label ? "pointer" : "default",
                                transition: "stroke-width 0.2s ease",
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
                            fontSize: 10,
                            fontWeight: 700,
                            color: hoveredInfo.color,
                            marginBottom: 2,
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
                            fontSize: 14,
                            fontWeight: 800,
                            color: T.text,
                            lineHeight: 1,
                        }}
                    >
                        {hoveredInfo.percent}%
                    </div>
                    <div style={{ fontSize: 9, color: T.slate, marginTop: 2 }}>
                        {hoveredInfo.value.toLocaleString("id-ID")}
                    </div>
                </div>
            )}
        </div>
    );
}

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
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                opacity: 0.9;
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
                height: 285,
                width: "100%",
                borderRadius: 10,
                overflow: "hidden",
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
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

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
                            <div style={{ minWidth: "180px" }}>
                                <strong
                                    style={{
                                        fontSize: "14px",
                                        borderBottom: "1px solid #e2e8f0",
                                        display: "block",
                                        paddingBottom: "4px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    {r.label}
                                </strong>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "4px",
                                    }}
                                >
                                    <span style={{ color: "#64748b" }}>
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
                                        marginBottom: "4px",
                                    }}
                                >
                                    <span style={{ color: "#16a34a" }}>
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
                                        marginBottom: "4px",
                                    }}
                                >
                                    <span style={{ color: "#ef4444" }}>
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
                                        marginTop: "6px",
                                        paddingTop: "4px",
                                        borderTop: "1px dotted #e2e8f0",
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>
                                        Coverage (%)
                                    </span>
                                    <strong style={{ color: "#2563eb" }}>
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
                        style={{ fontSize: 18, color }}
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
    uncovered = [],
    uncoveredDana = [],
    hideFilters = false,
    backUrl = null,
    isSalesDetail = false,
    timSalesPerformance = [],
    timSalesPerformanceWorst = [],
    listKecamatan = [],
    listSekolah = [],
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
}) {
    const { configuration } = usePage().props;
    const prevYear = configuration?.prev_year || "2025";

    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterData, setFilterData] = useState({
        kecamatan: filters.kecamatan || "",
        tahun: filters.tahun || "",
    });

    const activeFiltersCount = Object.values(filters).filter(
        (v) => v !== null && v !== "",
    ).length;

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(route(route().current()), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
        setIsFilterOpen(false);
    };

    const resetFilter = () => {
        setFilterData({ kecamatan: "", tahun: "" });
        router.get(
            route(route().current()),
            {},
            { preserveState: true, preserveScroll: true },
        );
        setIsFilterOpen(false);
    };
    const targetYear = configuration?.target_year || "2026";

    const [showAllRanking, setShowAllRanking] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [kegiatanPage, setKegiatanPage] = useState(1);
    const kegiatanPerPage = 15;
    const [sekolahPage, setSekolahPage] = useState(1);
    const sekolahPerPage = 25;

    // Sekolah table controls
    const [sekolahSearch, setSekolahSearch] = useState("");
    const [sekolahJenjang, setSekolahJenjang] = useState("");
    const [sekolahStatus, setSekolahStatus] = useState("");
    const [sekolahSort, setSekolahSort] = useState({ key: "name", dir: "asc" });

    useEffect(() => {
        setSekolahPage(1);
    }, [sekolahSearch, sekolahJenjang, sekolahStatus, sekolahSort]);

    /* ── Format helpers ── */
    const formatNumber = (num) =>
        new Intl.NumberFormat("id-ID").format(num || 0);

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
            label: "Total Sekolah",
            value: formatNumber(ts),
            unit: "Sekolah",
            icon: "bi-buildings-fill",
            color: T.blue,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.sekolah", cabangCode)
                : null,
        },
        {
            label: "Customer Aktif",
            value: formatNumber(ca),
            unit: "Sekolah",
            icon: "bi-people-fill",
            color: T.green,
            sub: `${coveragePct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.customer-aktif", cabangCode)
                : null,
        },
        {
            label: "Coverage",
            value: coveragePct,
            unit: null,
            icon: "bi-check-circle-fill",
            color: T.blue,
            sub: `${coveragePct} dari Total Sekolah`,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.coverage", cabangCode)
                : null,
        },
        {
            label: "Opportunity",
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
        {
            label: "Total Target Eksemplar",
            value: formatNumber(realStats.target_eksemplar),
            unit: "Eks",
            icon: "bi-journal-text",
            color: T.purple,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.target-eksemplar", cabangCode)
                : null,
        },
        {
            label: "Total Siswa (Area)",
            value: formatNumber(realStats.total_siswa),
            unit: "Siswa",
            icon: "bi-person-lines-fill",
            color: T.blue,
            sub: null,
            trend: null,
            detailHref: cabangCode
                ? route("monitoring.cabang.siswa", cabangCode)
                : null,
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
    const TREND = trend.length > 0 ? trend : [];
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
    let filteredListSekolah = [...(listSekolah || [])];

    if (sekolahSearch) {
        const query = sekolahSearch.toLowerCase();
        filteredListSekolah = filteredListSekolah.filter(
            (s) =>
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.kecamatan_name &&
                    s.kecamatan_name.toLowerCase().includes(query)),
        );
    }

    if (sekolahJenjang) {
        filteredListSekolah = filteredListSekolah.filter(
            (s) => s.jenjang === sekolahJenjang,
        );
    }

    if (sekolahStatus !== "") {
        const isActive = sekolahStatus === "1";
        filteredListSekolah = filteredListSekolah.filter(
            (s) => !!s.is_active === isActive,
        );
    }

    filteredListSekolah.sort((a, b) => {
        let valA = a[sekolahSort.key];
        let valB = b[sekolahSort.key];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sekolahSort.dir === "asc" ? -1 : 1;
        if (valA > valB) return sekolahSort.dir === "asc" ? 1 : -1;
        return 0;
    });

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`${pageTitle} – ${cabangName}`} />

            {/* ━━━━━━━━━━━━━━━━━━
                HEADER
            ━━━━━━━━━━━━━━━━━━ */}
            <div
                style={{
                    background: "white",
                    padding: "14px 20px",
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
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
                        {pageTitle}
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: T.text,
                            letterSpacing: "-0.5px",
                            lineHeight: 1.15,
                        }}
                    >
                        {cabangName}
                    </div>
                    <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                        {description}
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
                            {/* Select Area */}
                            {areas && areas.length > 0 && (
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
                                                        "monitoring.area",
                                                        e.target.value,
                                                    ),
                                                );
                                            }}
                                        >
                                            {areas.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {a.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Select Cabang */}
                            {cabangs && cabangs.length > 0 && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                    }}
                                >
                                    <i
                                        className="bi bi-geo-alt-fill"
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
                                            value={selectedCabang || cabangCode || ""}
                                            onChange={(e) => {
                                                router.get(
                                                    route(
                                                        "monitoring.area",
                                                        provinceCode,
                                                    ),
                                                    { cabang: e.target.value },
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }}
                                        >
                                            <option value="">Pilih Cabang</option>
                                            {cabangs.map((c) => (
                                                <option key={c.id} value={c.id}>
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
                    : [
                          { id: "dashboard", label: "Dashboard Utama" },
                          {
                              id: "competitor",
                              label: "Kompetitor & Market Share",
                          },
                      ]
                ).map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "14px 0",
                            fontSize: 12,
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
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                {activeTab === "dashboard" && (
                    <>
                        {/* ── R0: EXECUTIVE INSIGHTS (Sales Detail Only) ── */}
                        {isSalesDetail && insights.length > 0 && (
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

                        {/* ── R2: RANKING KECAMATAN | PETA | TRL & SALES ── */}
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                            }}
                        >
                            {/* Left col: Ranking + Area Cover per Jenjang */}
                            <div
                                style={{
                                    flex: isSalesDetail ? 1 : 0.8,
                                    minWidth: 280,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                {!isSalesDetail && (
                                    <Card
                                        title={
                                            isFromSalesPerformance
                                                ? `Ranking Sekolah (Realisasi Tertinggi ${prevYear})`
                                                : "Ranking Kecamatan - Coverage (%)"
                                        }
                                        footer={
                                            isFromSalesPerformance
                                                ? "Lihat Semua Sekolah"
                                                : "Lihat Semua Kecamatan"
                                        }
                                        onFooterClick={() =>
                                            setShowAllRanking(true)
                                        }
                                    >
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "collapse",
                                            }}
                                        >
                                            <tbody>
                                                {(showAllRanking
                                                    ? isFromSalesPerformance
                                                        ? top10Schools
                                                        : rankingKecamatan
                                                    : (isFromSalesPerformance
                                                          ? top10Schools
                                                          : rankingKecamatan
                                                      ).slice(0, 10)
                                                ).map((r, i) => (
                                                    <tr key={i}>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                width: 24,
                                                                paddingLeft: 0,
                                                            }}
                                                        >
                                                            {i + 1}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {r.name}
                                                        </td>
                                                        <td
                                                            style={{
                                                                ...S.td,
                                                                minWidth: 100,
                                                                paddingRight: 0,
                                                            }}
                                                        >
                                                            {isFromSalesPerformance ? (
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            fontSize: 12,
                                                                            color: T.text,
                                                                        }}
                                                                    >
                                                                        {r.real_exemplar?.toLocaleString(
                                                                            "id-ID",
                                                                        )}{" "}
                                                                        eks
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            fontSize: 11,
                                                                            color: T.slate,
                                                                            marginLeft: 4,
                                                                        }}
                                                                    >
                                                                        (
                                                                        {
                                                                            r.persentase
                                                                        }
                                                                        %)
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <Bar
                                                                    value={
                                                                        r.pct
                                                                    }
                                                                />
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Card>
                                )}

                                {/* Area Cover per Jenjang */}
                                <Card
                                    title="Area Cover per Jenjang"
                                    sub={`AC ${prevYear} vs Target ${targetYear}`}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}
                                    >
                                        {JENJANG.filter(
                                            (j) =>
                                                (j.ac25 || 0) > 0 ||
                                                (j.target || 0) > 0 ||
                                                (j.qty || 0) > 0,
                                        ).map((j, i) => {
                                            const ac25 = j.ac25 || j.qty || 0;
                                            const tar = j.target || 0;
                                            const maxVal = Math.max(
                                                ac25,
                                                tar,
                                                1,
                                            );
                                            return (
                                                <div key={i}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            marginBottom: 3,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 5,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 9,
                                                                    height: 9,
                                                                    borderRadius: 2,
                                                                    background:
                                                                        j.color,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                {j.label}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 10,
                                                                color: T.slate,
                                                            }}
                                                        >
                                                            AC {prevYear}:{" "}
                                                            <strong
                                                                style={{
                                                                    color: j.color,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    ac25,
                                                                )}
                                                            </strong>
                                                            {tar > 0 && (
                                                                <>
                                                                    {" "}
                                                                    &nbsp;|&nbsp;
                                                                    Target:{" "}
                                                                    <strong
                                                                        style={{
                                                                            color: T.orange,
                                                                        }}
                                                                    >
                                                                        {formatNumber(
                                                                            tar,
                                                                        )}
                                                                    </strong>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginBottom: 2,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 9,
                                                                color: T.slate,
                                                                marginBottom: 1,
                                                            }}
                                                        >
                                                            AC {prevYear}
                                                        </div>
                                                        <div
                                                            style={{
                                                                height: 7,
                                                                background:
                                                                    "#e2e8f0",
                                                                borderRadius: 6,
                                                                overflow:
                                                                    "hidden",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${maxVal > 0 ? (ac25 / maxVal) * 100 : 0}%`,
                                                                    height: "100%",
                                                                    background:
                                                                        j.color,
                                                                    borderRadius: 6,
                                                                    transition:
                                                                        "width .4s",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    {tar > 0 && (
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9,
                                                                    color: T.slate,
                                                                    marginBottom: 1,
                                                                }}
                                                            >
                                                                Target{" "}
                                                                {targetYear}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    height: 7,
                                                                    background:
                                                                        "#e2e8f0",
                                                                    borderRadius: 6,
                                                                    overflow:
                                                                        "hidden",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: `${(tar / maxVal) * 100}%`,
                                                                        height: "100%",
                                                                        background:
                                                                            T.orange,
                                                                        borderRadius: 6,
                                                                        transition:
                                                                            "width .4s",
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {JENJANG.filter(
                                            (j) =>
                                                (j.ac25 || 0) > 0 ||
                                                (j.target || 0) > 0 ||
                                                (j.qty || 0) > 0,
                                        ).length === 0 && (
                                            <div
                                                style={{
                                                    textAlign: "center",
                                                    color: T.slate,
                                                    fontSize: 11,
                                                    padding: "16px 0",
                                                }}
                                            >
                                                Belum ada data
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {!isSalesDetail && !isFromSalesPerformance && (
                                    <Card
                                        title="Sales per Jenjang"
                                        sub="(Area Cover)"
                                        headerAction={
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Link
                                                    href={route(
                                                        "monitoring.cabang.sales-jenjang",
                                                        cabangCode,
                                                    )}
                                                    style={{
                                                        fontSize: 10,
                                                        color: T.blue,
                                                        textDecoration: "none",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Detail Sales{" "}
                                                    <i className="bi bi-chevron-right"></i>
                                                </Link>
                                                <span
                                                    style={{ color: T.border }}
                                                >
                                                    |
                                                </span>
                                                <Link
                                                    href={route(
                                                        "monitoring.cabang.sales-jenjang-kecamatan",
                                                        cabangCode,
                                                    )}
                                                    style={{
                                                        fontSize: 10,
                                                        color: T.blueSoft,
                                                        textDecoration: "none",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Detail Kecamatan{" "}
                                                    <i className="bi bi-chevron-right"></i>
                                                </Link>
                                            </div>
                                        }
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 16,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Donut
                                                segments={salesJenjangData.map(
                                                    (j) => ({
                                                        value: parseFloat(
                                                            j.pct.replace(
                                                                ",",
                                                                ".",
                                                            ),
                                                        ),
                                                        color: j.color,
                                                    }),
                                                )}
                                                size={100}
                                                ring={24}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <table
                                                    style={{
                                                        width: "100%",
                                                        borderCollapse:
                                                            "collapse",
                                                    }}
                                                >
                                                    <thead>
                                                        <tr>
                                                            {[
                                                                "Jenjang",
                                                                "Total",
                                                                "%",
                                                            ].map((h, i) => (
                                                                <th
                                                                    key={i}
                                                                    style={{
                                                                        ...S.th,
                                                                        textAlign:
                                                                            i ===
                                                                            0
                                                                                ? "left"
                                                                                : "right",
                                                                    }}
                                                                >
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {salesJenjangData.map(
                                                            (j, i) => (
                                                                <tr key={i}>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: 5,
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    width: 8,
                                                                                    height: 8,
                                                                                    borderRadius: 2,
                                                                                    background:
                                                                                        j.color,
                                                                                    flexShrink: 0,
                                                                                }}
                                                                            />
                                                                            <span
                                                                                style={{
                                                                                    fontWeight: 600,
                                                                                }}
                                                                            >
                                                                                {
                                                                                    j.label
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                        }}
                                                                    >
                                                                        {
                                                                            j.total
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                fontWeight: 700,
                                                                                color: j.color,
                                                                            }}
                                                                        >
                                                                            {
                                                                                j.pct
                                                                            }
                                                                            %
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                        <tr>
                                                            {[
                                                                "Total",
                                                                salesJenjangTotal,
                                                                "100%",
                                                            ].map((v, i) => (
                                                                <td
                                                                    key={i}
                                                                    style={{
                                                                        ...S.th,
                                                                        fontWeight: 700,
                                                                        textAlign:
                                                                            i ===
                                                                            0
                                                                                ? "left"
                                                                                : "right",
                                                                        borderTop: `2px solid ${T.border}`,
                                                                    }}
                                                                >
                                                                    {v}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </Card>
                                )}
                                {isSalesDetail && (
                                    <>
                                        {/* TRL */}
                                        <Card
                                            title="Tahan – Rebut – Lepas – Gagal"
                                            sub={`(${cabangName})`}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                }}
                                            >
                                                {TRL.map((t) => (
                                                    <div
                                                        key={t.key}
                                                        style={{
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            borderRadius: 8,
                                                            border: `1.5px solid ${t.color}28`,
                                                            background: `${t.color}06`,
                                                            padding: "8px 10px",
                                                        }}
                                                    >
                                                        <i
                                                            className={`bi ${t.icon}`}
                                                            style={{
                                                                fontSize: 18,
                                                                color: t.color,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: 9,
                                                                    fontWeight: 700,
                                                                    color: t.color,
                                                                    letterSpacing:
                                                                        "0.6px",
                                                                    textTransform:
                                                                        "uppercase",
                                                                }}
                                                            >
                                                                {t.label}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 18,
                                                                    fontWeight: 900,
                                                                    color: t.color,
                                                                    lineHeight: 1.1,
                                                                }}
                                                            >
                                                                {t.value}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    fontWeight: 600,
                                                                    color: t.color,
                                                                }}
                                                            >
                                                                {t.pct}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>

                                        {/* TRL per Jenjang */}
                                        <Card
                                            title={`Tahan - Rebut - Lepas - Gagal (Per Jenjang)`}
                                            style={{ flex: 1 }}
                                            noPad
                                        >
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
                                                                paddingLeft: 16,
                                                            }}
                                                        >
                                                            Jenjang
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Tahan
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Rebut
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Lepas
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                                paddingRight: 16,
                                                            }}
                                                        >
                                                            Gagal
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trlJenjang.map((j, i) => (
                                                        <tr key={i}>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    paddingLeft: 16,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {j.jenjang}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.green,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.tahan,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.blue,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.rebut,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.orange,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.lepas,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    paddingRight: 16,
                                                                    color: T.red,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.gagal,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Card>
                                    </>
                                )}
                            </div>

                            {/* Middle col: Peta + Sumber Dana */}
                            <div
                                style={{
                                    flex: 1.2,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                }}
                            >
                                <Card
                                    title={`Peta Coverage ${cabangName} (Kecamatan)`}
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

                                {/* Sumber Dana */}
                                <Card
                                    title="Sumber Dana"
                                    sub={`Rencana Jual ${targetYear}`}
                                    headerAction={
                                        <Link
                                            href={route(
                                                "monitoring.cabang.sumber-dana",
                                                cabangCode,
                                            )}
                                            style={{
                                                fontSize: 10,
                                                color: T.blue,
                                                fontWeight: 600,
                                                textDecoration: "none",
                                            }}
                                        >
                                            Detail
                                        </Link>
                                    }
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 20,
                                        }}
                                    >
                                        <Donut
                                            segments={DANA.filter(
                                                (d) => d.value > 0,
                                            )}
                                            size={110}
                                            ring={26}
                                            label={
                                                DANA.reduce(
                                                    (s, d) =>
                                                        s + (d.value || 0),
                                                    0,
                                                ) + "%"
                                            }
                                            sub="Total"
                                        />
                                        <div style={{ flex: 1 }}>
                                            {DANA.map((d, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: 3,
                                                                background:
                                                                    d.color,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                color: T.text,
                                                            }}
                                                        >
                                                            {d.label}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            textAlign: "right",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 17,
                                                                fontWeight: 800,
                                                                color: d.color,
                                                            }}
                                                        >
                                                            {d.value}%
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 9.5,
                                                                color: T.slate,
                                                            }}
                                                        >
                                                            {d.sekolah} Cust
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Opportunity Dana */}
                                {UNCOVERED_DANA.length > 0 && (
                                    <Card
                                        title="Analisa Opportunity"
                                        sub="(Belum Dicover)"
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 20,
                                            }}
                                        >
                                            <Donut
                                                segments={UNCOVERED_DANA.filter(
                                                    (d) => d.value > 0,
                                                )}
                                                size={110}
                                                ring={26}
                                                label={formatNumber(
                                                    UNCOVERED_DANA.reduce(
                                                        (sum, d) =>
                                                            sum +
                                                            parseInt(
                                                                (
                                                                    d.sekolah ||
                                                                    "0"
                                                                )
                                                                    .toString()
                                                                    .replace(
                                                                        /\./g,
                                                                        "",
                                                                    ),
                                                            ),
                                                        0,
                                                    ),
                                                )}
                                                sub="Sekolah"
                                            />
                                            <div style={{ flex: 1 }}>
                                                {UNCOVERED_DANA.map((d, i) => (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "space-between",
                                                            marginBottom: 10,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 6,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: 10,
                                                                    height: 10,
                                                                    borderRadius: 3,
                                                                    background:
                                                                        d.color,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                            <span
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                    color: T.text,
                                                                }}
                                                            >
                                                                {d.label}
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: 17,
                                                                    fontWeight: 800,
                                                                    color: d.color,
                                                                }}
                                                            >
                                                                {d.value}%
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    color: T.slate,
                                                                }}
                                                            >
                                                                {d.sekolah} Cust
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {!isSalesDetail && (
                                    <>
                                        {/* TRL */}
                                        <Card
                                            title="Tahan – Rebut – Lepas – Gagal"
                                            sub={`(${cabangName})`}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                }}
                                            >
                                                {TRL.map((t) => (
                                                    <div
                                                        key={t.key}
                                                        style={{
                                                            flex: 1,
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 8,
                                                            borderRadius: 8,
                                                            border: `1.5px solid ${t.color}28`,
                                                            background: `${t.color}06`,
                                                            padding: "8px 10px",
                                                        }}
                                                    >
                                                        <i
                                                            className={`bi ${t.icon}`}
                                                            style={{
                                                                fontSize: 18,
                                                                color: t.color,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize: 9,
                                                                    fontWeight: 700,
                                                                    color: t.color,
                                                                    letterSpacing:
                                                                        "0.6px",
                                                                    textTransform:
                                                                        "uppercase",
                                                                }}
                                                            >
                                                                {t.label}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 18,
                                                                    fontWeight: 900,
                                                                    color: t.color,
                                                                    lineHeight: 1.1,
                                                                }}
                                                            >
                                                                {t.value}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: 9.5,
                                                                    fontWeight: 600,
                                                                    color: t.color,
                                                                }}
                                                            >
                                                                {t.pct}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>

                                        {/* TRL per Jenjang */}
                                        <Card
                                            title={`Tahan - Rebut - Lepas - Gagal (Per Jenjang)`}
                                            style={{ flex: 1 }}
                                            noPad
                                        >
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
                                                                paddingLeft: 16,
                                                            }}
                                                        >
                                                            Jenjang
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Tahan
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Rebut
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            Lepas
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "right",
                                                                paddingRight: 16,
                                                            }}
                                                        >
                                                            Gagal
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trlJenjang.map((j, i) => (
                                                        <tr key={i}>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    paddingLeft: 16,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                {j.jenjang}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.green,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.tahan,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.blue,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.rebut,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    color: T.orange,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.lepas,
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "right",
                                                                    paddingRight: 16,
                                                                    color: T.red,
                                                                }}
                                                            >
                                                                {formatNumber(
                                                                    j.gagal,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Card>
                                    </>
                                )}
                            </div>

                            {/* Right col: TRL & Sales Performance */}
                            {!isSalesDetail && !isFromSalesPerformance && (
                                <div
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                        minWidth: 350,
                                    }}
                                >
                                    {/* Ranking Sales */}
                                    <Card
                                        title={`Ranking Sales - ${cabangName}`}
                                        sub="Berdasarkan Coverage Tertinggi"
                                        style={{ flex: 1 }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                overflowX: "auto",
                                            }}
                                        >
                                            <table
                                                style={{
                                                    width: "100%",
                                                    borderCollapse: "collapse",
                                                    textAlign: "left",
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
                                                            Sales
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Area Cover/Tot
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Coverage
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Tahan
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Rebut
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                                paddingRight: 16,
                                                            }}
                                                        >
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...timSalesPerformance]
                                                        .sort(
                                                            (a, b) =>
                                                                b.coverage -
                                                                a.coverage,
                                                        )
                                                        .map((sales, idx) => (
                                                            <tr
                                                                key={idx}
                                                                style={{
                                                                    borderTop: `1px solid ${T.slate}20`,
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        paddingLeft: 16,
                                                                        color: T.slate,
                                                                        width: 24,
                                                                    }}
                                                                >
                                                                    {idx + 1}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        fontWeight: 600,
                                                                        color: T.blue,
                                                                    }}
                                                                >
                                                                    {sales.name}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.slate,
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    <strong
                                                                        style={{
                                                                            color: T.green,
                                                                        }}
                                                                    >
                                                                        {formatNumber(
                                                                            sales.aktif,
                                                                        )}
                                                                    </strong>{" "}
                                                                    /{" "}
                                                                    {formatNumber(
                                                                        sales.total_sekolah,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <Badge
                                                                        label={`${sales.coverage}%`}
                                                                        bg={
                                                                            sales.coverage >=
                                                                            40
                                                                                ? "#f0fdf4"
                                                                                : "#fef2f2"
                                                                        }
                                                                        color={
                                                                            sales.coverage >=
                                                                            40
                                                                                ? T.green
                                                                                : T.red
                                                                        }
                                                                    />
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.green,
                                                                    }}
                                                                >
                                                                    {formatNumber(
                                                                        sales.tahan,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.blue,
                                                                    }}
                                                                >
                                                                    {formatNumber(
                                                                        sales.rebut,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        paddingRight: 16,
                                                                    }}
                                                                >
                                                                    <Badge
                                                                        label={
                                                                            sales.status
                                                                        }
                                                                        bg={
                                                                            sales.status ===
                                                                            "Sangat Baik"
                                                                                ? "#dcfce7"
                                                                                : sales.status ===
                                                                                    "Baik"
                                                                                  ? "#fef9c3"
                                                                                  : "#fee2e2"
                                                                        }
                                                                        color={
                                                                            sales.status ===
                                                                            "Sangat Baik"
                                                                                ? "#166534"
                                                                                : sales.status ===
                                                                                    "Baik"
                                                                                  ? "#854d0e"
                                                                                  : "#991b1b"
                                                                        }
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {(!timSalesPerformance ||
                                                        timSalesPerformance.length ===
                                                            0) && (
                                                        <tr>
                                                            <td
                                                                colSpan="7"
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "center",
                                                                    padding: 20,
                                                                }}
                                                            >
                                                                Belum ada data
                                                                sales
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>

                                    {/* Worst Ranking Sales */}
                                    <Card
                                        title={`Sales yang perlu ditinjau kembali - ${cabangName}`}
                                        sub="Berdasarkan Coverage Terendah"
                                        style={{ flex: 1 }}
                                    >
                                        <div
                                            style={{
                                                width: "100%",
                                                overflowX: "auto",
                                            }}
                                        >
                                            <table
                                                style={{
                                                    width: "100%",
                                                    borderCollapse: "collapse",
                                                    textAlign: "left",
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
                                                            Sales
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Area Cover/Tot
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Coverage
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Tahan
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            Rebut
                                                        </th>
                                                        <th
                                                            style={{
                                                                ...S.th,
                                                                textAlign:
                                                                    "center",
                                                                paddingRight: 16,
                                                            }}
                                                        >
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        ...timSalesPerformanceWorst,
                                                    ]
                                                        .sort(
                                                            (a, b) =>
                                                                a.coverage -
                                                                b.coverage,
                                                        )
                                                        .map((sales, idx) => (
                                                            <tr
                                                                key={idx}
                                                                style={{
                                                                    borderTop: `1px solid ${T.slate}20`,
                                                                }}
                                                            >
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        paddingLeft: 16,
                                                                        color: T.slate,
                                                                        width: 24,
                                                                    }}
                                                                >
                                                                    {idx + 1}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        fontWeight: 600,
                                                                        color: T.blue,
                                                                    }}
                                                                >
                                                                    {sales.name}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.slate,
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    <strong
                                                                        style={{
                                                                            color: T.green,
                                                                        }}
                                                                    >
                                                                        {formatNumber(
                                                                            sales.aktif,
                                                                        )}
                                                                    </strong>{" "}
                                                                    /{" "}
                                                                    {formatNumber(
                                                                        sales.total_sekolah,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <Badge
                                                                        label={`${sales.coverage}%`}
                                                                        bg={
                                                                            sales.coverage >=
                                                                            40
                                                                                ? "#f0fdf4"
                                                                                : "#fef2f2"
                                                                        }
                                                                        color={
                                                                            sales.coverage >=
                                                                            40
                                                                                ? T.green
                                                                                : T.red
                                                                        }
                                                                    />
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.green,
                                                                    }}
                                                                >
                                                                    {formatNumber(
                                                                        sales.tahan,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        color: T.blue,
                                                                    }}
                                                                >
                                                                    {formatNumber(
                                                                        sales.rebut,
                                                                    )}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        ...S.td,
                                                                        textAlign:
                                                                            "center",
                                                                        paddingRight: 16,
                                                                    }}
                                                                >
                                                                    <Badge
                                                                        label={
                                                                            sales.status
                                                                        }
                                                                        bg={
                                                                            sales.status ===
                                                                            "Sangat Baik"
                                                                                ? "#dcfce7"
                                                                                : sales.status ===
                                                                                    "Baik"
                                                                                  ? "#fef9c3"
                                                                                  : "#fee2e2"
                                                                        }
                                                                        color={
                                                                            sales.status ===
                                                                            "Sangat Baik"
                                                                                ? "#166534"
                                                                                : sales.status ===
                                                                                    "Baik"
                                                                                  ? "#854d0e"
                                                                                  : "#991b1b"
                                                                        }
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {(!timSalesPerformanceWorst ||
                                                        timSalesPerformanceWorst.length ===
                                                            0) && (
                                                        <tr>
                                                            <td
                                                                colSpan="7"
                                                                style={{
                                                                    ...S.td,
                                                                    textAlign:
                                                                        "center",
                                                                    padding: 20,
                                                                }}
                                                            >
                                                                Belum ada data
                                                                sales
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </div>

                        {/* ── R3: OPP KECAMATAN | STRATEGIC | PRA AREA & TREND ── */}
                        <div style={{ display: "flex", gap: 10 }}>
                            {/* Opportunity Kecamatan (Belum Tercover) */}
                            {!isSalesDetail && (
                                <Card
                                    title="Kecamatan Belum Tercover (Top 10)"
                                    footer="Lihat Semua Kecamatan"
                                    style={{ flex: 1 }}
                                    noPad
                                >
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
                                                        paddingLeft: 16,
                                                    }}
                                                >
                                                    No
                                                </th>
                                                <th style={{ ...S.th }}>
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
                                                    Sekolah Tercover
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
                                            {OPP.slice(0, 5).map((r) => (
                                                <tr key={r.no}>
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
                                </Card>
                            )}

                            {/* Strategic School */}
                            <Card
                                title="Strategic School"
                                sub="Top 5 Berdasarkan Total Siswa"
                                footer="Lihat Semua Strategic School"
                                style={{ flex: 1.2 }}
                                noPad
                            >
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
                                                    paddingLeft: 16,
                                                }}
                                            >
                                                No
                                            </th>
                                            <th style={{ ...S.th }}>Sekolah</th>
                                            <th style={{ ...S.th }}>Jenjang</th>
                                            <th style={{ ...S.th }}>
                                                Kecamatan
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                }}
                                            >
                                                Siswa
                                            </th>
                                            <th
                                                style={{
                                                    ...S.th,
                                                    textAlign: "right",
                                                    paddingRight: 16,
                                                }}
                                            >
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SCHOOLS.map((r) => (
                                            <tr key={r.no}>
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
                                                    {r.name}
                                                </td>
                                                <td style={{ ...S.td }}>
                                                    <Badge
                                                        label={r.grade}
                                                        bg="#eff6ff"
                                                        color={T.blue}
                                                    />
                                                </td>
                                                <td style={{ ...S.td }}>
                                                    {r.branch}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {r.siswa}
                                                </td>
                                                <td
                                                    style={{
                                                        ...S.td,
                                                        textAlign: "right",
                                                        paddingRight: 16,
                                                    }}
                                                >
                                                    <Badge
                                                        label={r.status}
                                                        bg={
                                                            r.status ===
                                                            "Customer"
                                                                ? "#f0fdf4"
                                                                : "#fee2e2"
                                                        }
                                                        color={
                                                            r.status ===
                                                            "Customer"
                                                                ? T.green
                                                                : T.red
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Card>

                            {/* Pra Area & Trend */}
                            <div
                                style={{
                                    flex: 0.8,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                    minWidth: 280,
                                }}
                            >
                                <Card title="Pra Area Cover (2027)">
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 14,
                                        }}
                                    >
                                        <Donut
                                            segments={[
                                                { value: 405, color: T.blue },
                                            ]}
                                            size={80}
                                            ring={12}
                                            label="405"
                                            sub="Sekolah"
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 2,
                                                        background: T.blue,
                                                    }}
                                                />
                                                <span
                                                    style={{ fontSize: 10.5 }}
                                                >
                                                    Tetap di Sales yang sama
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: T.slate,
                                                    marginLeft: 13,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                182 (44.94%)
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 5,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 2,
                                                        background: T.orange,
                                                    }}
                                                />
                                                <span
                                                    style={{ fontSize: 10.5 }}
                                                >
                                                    Akan Diberikan ke Sales lain
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: T.slate,
                                                    marginLeft: 13,
                                                }}
                                            >
                                                156 (38.52%)
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    title={`Trend Coverage ${cabangName}`}
                                    sub="3 Tahun Terakhir"
                                    style={{ flex: 1 }}
                                >
                                    <LineChart data={TREND} />
                                </Card>

                                <Card
                                    title="Rencana vs Realisasi Jual Cust"
                                    sub="Berdasarkan Tahun"
                                    style={{ flex: 1 }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            marginBottom: 12,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    background: T.teal,
                                                    borderRadius: 2,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: T.slate,
                                                }}
                                            >
                                                Target
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    background: T.green,
                                                    borderRadius: 2,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: T.slate,
                                                }}
                                            >
                                                Realisasi
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    background: T.red,
                                                    borderRadius: 2,
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    color: T.slate,
                                                }}
                                            >
                                                Tidak Tercover
                                            </span>
                                        </div>
                                    </div>
                                    <MultiBarChart data={TREND} />
                                </Card>
                            </div>
                        </div>

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

                {activeTab === "competitor" && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title="Kompetitor & Market Share"
                            footer="Lihat Detail"
                            onFooterClick={() =>
                                router.visit(
                                    route(
                                        "monitoring.cabang.kompetitor",
                                        cabangCode,
                                    ),
                                )
                            }
                            style={{ flex: 1, minWidth: 300 }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                }}
                            >
                                {competitors.map((c, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
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
                                            {formatNumber(c.value)} sekolah
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
                    </div>
                )}

                {activeTab === "kecamatan" && isSalesDetail && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Card
                            title="Daftar Kecamatan"
                            style={{ flex: 1, minWidth: 300 }}
                            noPad
                        >
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
                                                            colSpan="7"
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
                                                                colSpan="7"
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
                                        segments={activityBreakdown}
                                        label={activityBreakdown.reduce(
                                            (a, c) => a + c.value,
                                            0,
                                        )}
                                        sub="Total Aktv"
                                    />
                                    <div style={{ flex: 1 }}>
                                        {activityBreakdown.map((s, i) => (
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
                                            {kegiatanSales &&
                                            kegiatanSales.length > 0 ? (
                                                kegiatanSales
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
                                {kegiatanSales &&
                                    kegiatanSales.length > kegiatanPerPage && (
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
                                                    kegiatanSales.length,
                                                )}{" "}
                                                dari {kegiatanSales.length}
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
                                                                    kegiatanSales.length /
                                                                        kegiatanPerPage,
                                                                ),
                                                                p + 1,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        kegiatanPage ===
                                                        Math.ceil(
                                                            kegiatanSales.length /
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
                                                                kegiatanSales.length /
                                                                    kegiatanPerPage,
                                                            )
                                                                ? "#f8fafc"
                                                                : "white",
                                                        color:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                kegiatanSales.length /
                                                                    kegiatanPerPage,
                                                            )
                                                                ? "#cbd5e1"
                                                                : T.text,
                                                        cursor:
                                                            kegiatanPage ===
                                                            Math.ceil(
                                                                kegiatanSales.length /
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
