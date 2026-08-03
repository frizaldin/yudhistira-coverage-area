import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
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
    },
    td: {
        fontSize: 11.5,
        color: T.text,
        padding: "7px 10px",
        borderBottom: `1px solid #f4f6f8`,
    },
};

export function Donut({ segments, size = 120, ring = 26, label, sub }) {
    const [hoveredInfo, setHoveredInfo] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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
function FitGeoJsonBounds({ geojsonData }) {
    const map = useMap();
    useEffect(() => {
        if (
            geojsonData &&
            geojsonData.features &&
            geojsonData.features.length > 0
        ) {
            try {
                const geoLayer = L.geoJSON(geojsonData);
                const bounds = geoLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
                }
            } catch (e) {
                console.error("Error fitting GeoJSON bounds", e);
            }
        }
    }, [geojsonData, map]);
    return null;
}

export function KecamatanChoroplethMap({ salesId, cabangId, listKecamatan = [] }) {
    const [geojsonData, setGeojsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedKec, setSelectedKec] = useState(null);
    const [geoKey, setGeoKey] = useState(0);

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
        if (!salesId) return;
        setLoading(true);
        const params = new URLSearchParams({ sales_id: salesId });
        if (cabangId) params.append("cabang_id", cabangId);

        let fetchUrl = `/system/monitoring/sales-performance/geojson?${params.toString()}`;
        try {
            fetchUrl = route(
                "monitoring.sales-performance.geojson",
                Object.fromEntries(params),
            );
        } catch (e) {
            // fallback if route helper fails
        }

        fetch(fetchUrl)
            .then((res) => res.json())
            .then((data) => {
                setGeojsonData(data);
                setGeoKey((k) => k + 1);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching GeoJSON:", err);
                setLoading(false);
            });
    }, [salesId, cabangId]);

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
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
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
export function CompetitorChoroplethMap({ salesId, cabangId }) {
    const [geojsonData, setGeojsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [geoKey, setGeoKey] = useState(0);

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
        if (!salesId) return;
        setLoading(true);
        const params = new URLSearchParams({ sales_id: salesId });
        if (cabangId) params.append("cabang_id", cabangId);

        let fetchUrl = `/system/monitoring/sales-performance/geojson?${params.toString()}`;
        try {
            fetchUrl = route(
                "monitoring.sales-performance.geojson",
                Object.fromEntries(params),
            );
        } catch (e) {}

        fetch(fetchUrl)
            .then((res) => res.json())
            .then((data) => {
                // Ensure colors are mapped consistently based on most common dominant competitors first
                if (data && data.features) {
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
                setGeoKey((k) => k + 1);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [salesId, cabangId]);

    const onEachFeature = (feature, layer) => {
        const props = feature.properties;
        const domComp = props.dominant_competitor || "Tidak Diketahui";
        const color = getColorForCompetitor(domComp);

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
        });

        const compListHtml =
            props.competitors && Object.keys(props.competitors).length > 0
                ? Object.entries(props.competitors)
                      .map(
                          ([name, count]) => `
                <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;border-bottom:1px solid #e2e8f0;padding-bottom:2px;">
                    <span>${name}</span>
                    <span style="font-weight:bold;">${count}</span>
                </div>
            `,
                      )
                      .join("")
                : '<div style="font-size:10px;color:#64748b;">Tidak ada data kompetitor</div>';

        const popupHtml = `
            <div style="min-width:220px;font-family:'Inter','Segoe UI',sans-serif;">
                <div style="background:${color};padding:12px 14px;border-radius:10px 10px 0 0;margin:-8px -20px 0;">
                    <div style="color:white;font-weight:700;font-size:14px;">${props.kecamatan_name}</div>
                    <div style="color:rgba(255,255,255,0.9);font-size:10px;">${props.kabupaten || ""}</div>
                </div>
                <div style="padding:12px 0 4px;">
                    <div style="font-size:11px;font-weight:600;margin-bottom:6px;color:#334155;">Dominan: ${domComp}</div>
                    <div style="background:#f8fafc;border-radius:6px;padding:8px;max-height:100px;overflow-y:auto;">
                        ${compListHtml}
                    </div>
                </div>
            </div>
        `;

        layer.bindPopup(popupHtml, {
            maxWidth: 300,
            className: "kecamatan-popup",
        });
    };

    const geoStyle = (feature) => ({
        fillColor: getColorForCompetitor(
            feature.properties.dominant_competitor,
        ),
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.6,
    });

    const pointToLayer = (feature, latlng) => {
        const color = getColorForCompetitor(
            feature.properties.dominant_competitor,
        );
        return L.marker(latlng, {
            icon: L.divIcon({
                html: `<div style="background-color:${color};width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);opacity:0.9;"></div>`,
                className: "custom-circle-marker",
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            }),
        });
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
                                borderTopColor: "#ef4444",
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
                            Memuat peta kompetitor...
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .kecamatan-popup .leaflet-popup-content-wrapper { border-radius:12px!important; box-shadow:0 10px 40px rgba(0,0,0,0.15)!important; padding:0!important; overflow:hidden; }
                .kecamatan-popup .leaflet-popup-content { margin:8px 20px 12px!important; font-family:'Inter','Segoe UI',sans-serif!important; }
                .kecamatan-popup .leaflet-popup-close-button { color:white!important; top:6px!important; right:8px!important; z-index:10; }
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
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
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