<?php

namespace App\Services;

/**
 * Resolve kecamatan polygons from OpenStreetMap Nominatim
 * so overlays align with Leaflet Carto/OSM basemap administrative lines.
 */
class OsmBoundaryService
{
    private string $cacheDir;

    public function __construct(?string $cacheDir = null)
    {
        $this->cacheDir = $cacheDir ?: storage_path('app/osm-boundaries');
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0775, true);
        }
    }

    /**
     * @return array{type:string,coordinates:array}|null GeoJSON geometry
     */
    public function getPolygon(string $kecamatanName, ?string $kabupatenName = null): ?array
    {
        $kec = $this->normalizeKec($kecamatanName);
        $kab = $this->normalizeKab($kabupatenName);
        if ($kec === '') {
            return null;
        }

        $cacheKey = md5($kec . '|' . $kab);
        $cacheFile = $this->cacheDir . DIRECTORY_SEPARATOR . $cacheKey . '.json';

        if (is_file($cacheFile)) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if (!empty($cached['geometry'])) {
                return $cached['geometry'];
            }
            // cached miss
            if (isset($cached['miss']) && $cached['miss'] === true) {
                return null;
            }
        }

        $geometry = $this->fetchFromNominatim($kec, $kab);
        if ($geometry) {
            file_put_contents($cacheFile, json_encode([
                'kecamatan' => $kec,
                'kabupaten' => $kab,
                'geometry' => $geometry,
                'fetched_at' => date('c'),
                'source' => 'nominatim',
            ], JSON_UNESCAPED_UNICODE));
            // Nominatim usage policy: max 1 req/sec
            usleep(1100000);
            return $geometry;
        }

        file_put_contents($cacheFile, json_encode([
            'kecamatan' => $kec,
            'kabupaten' => $kab,
            'miss' => true,
            'fetched_at' => date('c'),
        ]));
        usleep(1100000);
        return null;
    }

    private function fetchFromNominatim(string $kec, string $kab): ?array
    {
        $queries = [];
        if ($kab !== '') {
            $queries[] = "Kecamatan {$kec}, {$kab}, Jawa Barat, Indonesia";
            $queries[] = "{$kec}, {$kab}, Jawa Barat, Indonesia";
        }
        $queries[] = "Kecamatan {$kec}, Jawa Barat, Indonesia";

        foreach ($queries as $q) {
            $url = 'https://nominatim.openstreetmap.org/search?' . http_build_query([
                'q' => $q,
                'format' => 'json',
                'limit' => 3,
                'polygon_geojson' => 1,
                'addressdetails' => 1,
                'countrycodes' => 'id',
            ]);

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 25,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: coverage-area-monitoring/1.0 (sales coverage map)',
                    'Accept: application/json',
                ],
            ]);
            $raw = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            // Jangan cache miss untuk error/rate-limit
            if (!$raw || $code !== 200) {
                return null;
            }

            $rows = json_decode($raw, true);
            if (!is_array($rows)) {
                continue;
            }

            foreach ($rows as $row) {
                $geom = $row['geojson'] ?? null;
                if (!$geom || empty($geom['type']) || empty($geom['coordinates'])) {
                    continue;
                }
                $type = $geom['type'];
                if (!in_array($type, ['Polygon', 'MultiPolygon'], true)) {
                    continue;
                }

                $display = mb_strtolower($row['display_name'] ?? '');
                $addr = $row['address'] ?? [];
                $addrBlob = mb_strtolower(implode(' ', array_filter([
                    $addr['county'] ?? '',
                    $addr['city'] ?? '',
                    $addr['municipality'] ?? '',
                    $addr['state_district'] ?? '',
                    $addr['suburb'] ?? '',
                    $display,
                ])));

                $kecOk = str_contains($display, mb_strtolower($kec))
                    || str_contains(mb_strtolower($addr['suburb'] ?? ''), mb_strtolower($kec))
                    || str_contains(mb_strtolower($addr['city_district'] ?? ''), mb_strtolower($kec));
                if (!$kecOk) {
                    continue;
                }

                if ($kab !== '') {
                    $kabCore = mb_strtolower(preg_replace('/^(kabupaten|kota|kab\.?|regency)\s+/u', '', $kab));
                    $kabCore = trim($kabCore);
                    if ($kabCore !== '' && !str_contains($addrBlob, $kabCore)) {
                        continue;
                    }
                    if (str_contains($kabCore, 'bogor') && str_contains($addrBlob, 'tasik')) {
                        continue;
                    }
                }

                if ($type === 'Polygon') {
                    return [
                        'type' => 'MultiPolygon',
                        'coordinates' => [$geom['coordinates']],
                    ];
                }
                return $geom;
            }

            // jika 200 tapi kosong, baru anggap miss untuk query ini — coba query berikutnya
            usleep(1100000);
        }

        return null;
    }

    private function normalizeKec(?string $name): string
    {
        $n = mb_strtolower(trim((string) $name));
        $n = explode(',', $n)[0] ?? $n;
        $n = preg_replace('/^(kec\.?\s*|kecamatan\s+)/u', '', $n);
        $n = preg_replace('/\s+/u', ' ', $n);
        return trim($n);
    }

    private function normalizeKab(?string $name): string
    {
        $n = trim((string) $name);
        if ($n === '') {
            return '';
        }
        $n = preg_replace('/\s+/u', ' ', $n);
        // KAB. BOGOR → Kabupaten Bogor
        if (preg_match('/^kab\.?\s*(.+)$/iu', $n, $m)) {
            return 'Kabupaten ' . trim($m[1]);
        }
        if (preg_match('/^kota\s+(.+)$/iu', $n, $m)) {
            return 'Kota ' . trim($m[1]);
        }
        return $n;
    }
}
