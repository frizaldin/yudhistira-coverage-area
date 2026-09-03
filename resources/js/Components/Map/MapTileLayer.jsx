import { TileLayer } from "react-leaflet";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function resolveTileConfig() {
    const apiKey = String(import.meta.env.VITE_CARTO_API_KEY || "").trim();
    if (apiKey) {
        return {
            // Carto Basemaps: parameter wajib ?key= (bukan api_key)
            url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(apiKey)}`,
            attribution: '&copy; <a href="https://carto.com/">Carto</a>',
        };
    }

    return {
        url: OSM_URL,
        attribution: OSM_ATTRIBUTION,
    };
}

/**
 * Basemap Leaflet tanpa watermark API key.
 * Default: OpenStreetMap. Opsional Carto Voyager jika VITE_CARTO_API_KEY diisi.
 */
export default function MapTileLayer(props) {
    const { url, attribution } = resolveTileConfig();

    return <TileLayer url={url} attribution={attribution} {...props} />;
}
