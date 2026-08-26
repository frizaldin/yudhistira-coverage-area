<?php
$path = __DIR__ . '/../app/Http/Controllers/MonitoringController.php';
$src = file_get_contents($path);

$start = strpos($src, "        \$kecLookup = [];\n        foreach (\$kecamatanData as \$key => \$info) {\n            \$base = \$info->base_name;");
if ($start === false) {
    fwrite(STDERR, "start not found\n");
    exit(1);
}

$end = strpos($src, "        foreach (\$kecamatanData as \$kecKey => \$coverageInfo) {\n            if (in_array(\$kecKey, \$processedKec, true)) {\n                continue;\n            }\n\n            \$originalName = \$coverageInfo->kecamatan_name;");
if ($end === false) {
    fwrite(STDERR, "end not found\n");
    exit(1);
}

$new = <<<'PHP'
        $cityNameByCode = [];
        foreach ($cities as $city) {
            $cityNameByCode[(int) $city->city_code] = $city->city_name;
        }

        $osm = new \App\Services\OsmBoundaryService();
        $mergedFeatures = [];
        $processedKec = [];
        $osmMatched = 0;

        // 1) Prefer OSM Nominatim polygons (selaras garis batas basemap Leaflet/Carto)
        foreach ($kecamatanData as $kecKey => $coverageInfo) {
            $parts = array_map('trim', explode(',', (string) $coverageInfo->kecamatan_name));
            $kabLabel = $parts[1] ?? '';
            if ($kabLabel === '' && !empty($coverageInfo->city_code)) {
                $kabLabel = $cityNameByCode[(int) $coverageInfo->city_code] ?? '';
            }

            $geom = $osm->getPolygon($coverageInfo->base_name ?? ($parts[0] ?? ''), $kabLabel);
            if (!$geom || empty($geom['coordinates'])) {
                continue;
            }

            $pt = $geom['coordinates'][0][0][0] ?? null;
            $lng = is_array($pt) ? (float) $pt[0] : null;
            if (
                $coverageInfo->city_code
                && in_array((int) $coverageInfo->city_code, [3201, 3271], true)
                && $lng !== null
                && $lng > 107.45
            ) {
                continue;
            }

            $totalSekolah = $coverageInfo->total_sekolah ?? 0;
            $sekolahAktif = $coverageInfo->sekolah_aktif ?? 0;
            $belumTercover = max(0, $totalSekolah - $sekolahAktif);
            $potensiSiswa = $coverageInfo->potensi_siswa ?? 0;
            $coveragePct = $totalSekolah > 0 ? round(($sekolahAktif / $totalSekolah) * 100) : 0;

            $processedKec[] = $kecKey;
            $osmMatched++;
            $mergedFeatures[] = [
                'type' => 'Feature',
                'geometry' => $geom,
                'properties' => [
                    'kecamatan_name' => $coverageInfo->kecamatan_name,
                    'kabupaten' => $kabLabel,
                    'provinsi' => 'Jawa Barat',
                    'city_code' => $coverageInfo->city_code,
                    'boundary_source' => 'osm',
                    'total_sekolah' => $totalSekolah,
                    'sekolah_aktif' => $sekolahAktif,
                    'belum_tercover' => $belumTercover,
                    'potensi_siswa' => $potensiSiswa,
                    'coverage_pct' => $coveragePct,
                    'dominant_competitor' => $coverageInfo->dominant_competitor ?? 'Tidak Diketahui',
                    'competitors' => $coverageInfo->competitors ?? [],
                    'is_sales_coverage' => true,
                ],
            ];
        }

        // 2) Fallback file lokal untuk yang belum ketemu di OSM
        $kecLookup = [];
        foreach ($kecamatanData as $key => $info) {
            if (in_array($key, $processedKec, true)) {
                continue;
            }
            $base = $info->base_name;
            $compact = str_replace(' ', '', $base);
            if ($info->city_code) {
                $kecLookup[$base . '|' . $info->city_code] = $key;
                $kecLookup[$compact . '|' . $info->city_code] = $key;
            }
        }

        $geoDir = base_path('public/geojson');
        $kecFiles = array_values(array_filter(
            glob($geoDir . '/indonesia-kecamatan*.json') ?: [],
            fn ($f) => !str_contains(basename($f), '-osm-')
        ));
        $legacy = $geoDir . '/indonesia-districts.json';
        if (empty($kecFiles) && file_exists($legacy)) {
            $kecFiles = [$legacy];
        }

        $features = [];
        foreach ($kecFiles as $file) {
            $geojson = json_decode(file_get_contents($file), true);
            if (!$geojson) {
                continue;
            }
            $fileFeatures = $geojson['features'] ?? (isset($geojson[0]['type']) ? $geojson : []);
            foreach ($fileFeatures as $feature) {
                if (!isset($feature['geometry'])) {
                    continue;
                }
                $props = $feature['properties'] ?? [];
                $rawName = $props['WADMKC'] ?? $props['nama'] ?? $props['NAMOBJ'] ?? $props['name'] ?? '';
                $wadmkc = $normalizeKec($rawName);
                if ($wadmkc === '') {
                    continue;
                }

                $geoCity = !empty($props['kode']) ? $kodeToCityCode($props['kode']) : null;
                if (!$geoCity) {
                    continue;
                }

                $canonical = $kecLookup[$wadmkc . '|' . $geoCity]
                    ?? $kecLookup[str_replace(' ', '', $wadmkc) . '|' . $geoCity]
                    ?? null;
                if (!$canonical) {
                    continue;
                }

                $features[] = [$canonical, $feature, $props];
            }
        }

        $kecamatanFeatures = [];
        foreach ($features as [$kecKey, $feature, $props]) {
            $coverageInfo = $kecamatanData->get($kecKey);
            $expectedCity = $coverageInfo->city_code ?? null;
            $geoCity = !empty($props['kode']) ? $kodeToCityCode($props['kode']) : null;
            if ($expectedCity && $geoCity && (int) $expectedCity !== (int) $geoCity) {
                continue;
            }

            if (!isset($kecamatanFeatures[$kecKey])) {
                $kecamatanFeatures[$kecKey] = [
                    'coordinates' => [],
                    'properties' => $props,
                ];
            }

            $geom = $feature['geometry'];
            $appendPolys = [];
            if (($geom['type'] ?? '') === 'Polygon') {
                $appendPolys[] = $geom['coordinates'];
            } elseif (($geom['type'] ?? '') === 'MultiPolygon') {
                foreach ($geom['coordinates'] as $poly) {
                    $appendPolys[] = $poly;
                }
            }

            foreach ($appendPolys as $poly) {
                $pt = $poly[0][0] ?? null;
                $lng = is_array($pt) ? (float) $pt[0] : null;
                if ($expectedCity && in_array((int) $expectedCity, [3201, 3271], true) && $lng !== null && $lng > 107.45) {
                    continue;
                }
                $kecamatanFeatures[$kecKey]['coordinates'][] = $poly;
            }
        }

        foreach ($kecamatanFeatures as $kecKey => $kecData) {
            if (empty($kecData['coordinates']) || in_array($kecKey, $processedKec, true)) {
                continue;
            }
            $processedKec[] = $kecKey;
            $coverageInfo = $kecamatanData->get($kecKey);
            $totalSekolah = $coverageInfo->total_sekolah ?? 0;
            $sekolahAktif = $coverageInfo->sekolah_aktif ?? 0;
            $belumTercover = max(0, $totalSekolah - $sekolahAktif);
            $potensiSiswa = $coverageInfo->potensi_siswa ?? 0;
            $coveragePct = $totalSekolah > 0 ? round(($sekolahAktif / $totalSekolah) * 100) : 0;

            $mergedFeatures[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'MultiPolygon',
                    'coordinates' => $kecData['coordinates'],
                ],
                'properties' => [
                    'kecamatan_name' => $coverageInfo->kecamatan_name ?? ucwords($kecKey),
                    'kabupaten' => $kecData['properties']['WADMKK'] ?? '',
                    'provinsi' => $kecData['properties']['WADMPR'] ?? '',
                    'city_code' => $coverageInfo->city_code ?? null,
                    'kode' => $kecData['properties']['kode'] ?? null,
                    'boundary_source' => 'local',
                    'total_sekolah' => $totalSekolah,
                    'sekolah_aktif' => $sekolahAktif,
                    'belum_tercover' => $belumTercover,
                    'potensi_siswa' => $potensiSiswa,
                    'coverage_pct' => $coveragePct,
                    'dominant_competitor' => $coverageInfo->dominant_competitor ?? 'Tidak Diketahui',
                    'competitors' => $coverageInfo->competitors ?? [],
                    'is_sales_coverage' => true,
                ],
            ];
        }

PHP;

$out = substr($src, 0, $start) . $new . substr($src, $end);
file_put_contents($path, $out);
echo "patched ok\n";

// also bump meta version / include osm_matched
$src2 = file_get_contents($path);
$src2 = str_replace(
    "'version' => 3,",
    "'version' => 4,\n                'osm_matched' => \$osmMatched,",
    $src2
);
file_put_contents($path, $src2);
echo "meta bumped\n";
