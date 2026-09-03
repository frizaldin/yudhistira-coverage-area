import React, { useEffect } from "react";
import MonitoringLayout from "../../Layouts/MonitoringLayout";
import { Head } from "@inertiajs/react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import MapTileLayer from "@/Components/Map/MapTileLayer";
import "leaflet/dist/leaflet.css";

// Fix leaflet marker icon issues in React
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, map]);
    return null;
}

export default function Peta({ mapMarkers }) {
    return (
        <MonitoringLayout activeNav="peta">
            <Head title="Peta Coverage" />
            <div style={{ padding: "30px", height: "100%", display: "flex", flexDirection: "column" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Peta Coverage</h1>
                <div style={{ flex: 1, minHeight: "600px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
                    <MapContainer
                        center={[-2.5, 118.0]}
                        zoom={5}
                        style={{ height: "100%", width: "100%", zIndex: 1 }}
                    >
                        <MapTileLayer />
                        {mapMarkers &&
                            mapMarkers.map((marker, index) => (
                                <Marker
                                    key={index}
                                    position={[marker.lat, marker.lng]}
                                >
                                    <Popup>
                                        <div style={{ minWidth: "200px" }}>
                                            <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "10px", fontSize: "14px", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>
                                                {marker.label}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ color: "#666" }}>Total Sekolah:</span>
                                                <span style={{ fontWeight: "600" }}>{marker.total?.toLocaleString('id-ID') || 0}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ color: "#666" }}>Customer Aktif:</span>
                                                <span style={{ fontWeight: "600", color: "#10b981" }}>{marker.aktif?.toLocaleString('id-ID') || 0}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ color: "#666" }}>Potensi (Belum Aktif):</span>
                                                <span style={{ fontWeight: "600", color: "#f59e0b" }}>{marker.belum?.toLocaleString('id-ID') || 0}</span>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #eee" }}>
                                                <span style={{ fontWeight: "bold" }}>Area Coverage:</span>
                                                <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{marker.pct || 0}%</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        <FitBounds markers={mapMarkers} />
                    </MapContainer>
                </div>
            </div>
        </MonitoringLayout>
    );
}
