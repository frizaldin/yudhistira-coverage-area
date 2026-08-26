<?php
$path = __DIR__ . '/../app/Http/Controllers/MonitoringController.php';
$src = file_get_contents($path);

$startMarker = "    /**\n     * API endpoint: Return filtered GeoJSON for kecamatan choropleth map";
$endMarker = "    /**\n     * Report: daftar sales beserta KPI score";

$start = strpos($src, $startMarker);
$end = strpos($src, $endMarker);
if ($start === false || $end === false || $end <= $start) {
    fwrite(STDERR, "markers not found start=$start end=$end\n");
    exit(1);
}

$newMethod = <<<'PHP'
    /**
     * API endpoint: Return filtered GeoJSON for kecamatan choropleth map
     * Uses kecamatan-level boundaries (indonesia-kecamatan-*.json) when available.
     * Matching by nama + kabupaten/city_code (hindari bentrok nama sama beda kab, mis. Ciawi).
     */
    public function salesPerformanceGeoJson(\Illuminate\Http\Request $request)
    {
        $salesId = $request->input('sales_id');
        $cabangId = $request->input('cabang_id');

        if (!$salesId) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $sales = \App\Models\Sales::with('cabang')->find($salesId);
        if (!$sales) {
            return response()->json(['type' => 'FeatureCollection', 'features' => []]);
        }

        $activeCabangId = $cabangId ?: $sales->cabang_id;

        $normalizeKec = function ($name) {
            $n = mb_strtolower(trim((string) $name));
            if ($n === '') {
                return '';
            }
            $parts = array_map('trim', explode(',', $n));
            $base = $parts[0] ?? $n;
            $base = preg_replace('/^(kec\.?\s*|kecamatan\s+)/u', '', $base);
            $base = preg_replace('/\s+/u', ' ', $base);
            return trim($base);
        };

        $normalizeKab = function ($kabRaw) {
            $k = mb_strtolower(trim((string) $kabRaw));
            $k = preg_replace('/\s+/u', ' ', $k);
            return trim($k);
        };

        $cities = \DB::table('cities')->get(['city_code', 'city_name']);
        $cityByName = [];
        foreach ($cities as $city) {
            $cityByName[$normalizeKab($city->city_name)] = (int) $city->city_code;
        }

        $kodeToCityCode = function ($kode) {
            // "32.01.24" → 3201 ; "32.71.03" → 3271
            $parts = explode('.', (string) $kode);
            if (count($parts) < 2) {
                return null;
            }
            return (int) ($parts[0] . str_pad($parts[1], 2, '0', STR_PAD_LEFT));
        };

        $resolveCityCode = function ($kecamatanName) use ($normalizeKec, $normalizeKab, $cityByName, $activeCabangId) {
            $full = trim((string) $kecamatanName);
            $parts = array_map('trim', explode(',', $full));
            $base = $normalizeKec($parts[0] ?? $full);
            $kabPart = $normalizeKab($parts[1] ?? '');

            if ($kabPart !== '' && isset($cityByName[$kabPart])) {
                return [$base, $cityByName[$kabPart]];
            }

            if ($base !== '') {
                $kecRow = \DB::table('kecamatans')
                    ->whereRaw('LOWER(camat_name) = ?', [$base])
                    ->when($activeCabangId, function ($q) use ($activeCabangId) {
                        $q->where('cabang_id', $activeCabangId);
                    })
                    ->first();
                if ($kecRow && $kecRow->city_code) {
                    return [$base, (int) $kecRow->city_code];
                }

                $candidates = \DB::table('kecamatans')
                    ->whereRaw('LOWER(camat_name) = ?', [$base])
                    ->pluck('city_code')
                    ->unique()
                    ->values();
                if ($candidates->count() === 1) {
                    return [$base, (int) $candidates->first()];
                }
            }

            return [$base, null];
        };

        $kecamatanData = \App\Models\Customer::where('sales_id', $salesId)
            ->where('cabang_id', $activeCabangId)
            ->whereNotNull('kecamatan_name')
            ->get(['id', 'kecamatan_name', 'is_active', 'total_student', 'penerbit'])
            ->groupBy(function ($c) use ($resolveCityCode) {
                [$base, $cityCode] = $resolveCityCode($c->kecamatan_name);
                if ($base === '') {
                    return '';
                }
                return $base . '|' . ($cityCode ?: 'x');
            })
            ->filter(function ($_, $key) {
                return $key !== '';
            })
            ->map(function ($group) use ($resolveCityCode) {
                $compCounts = [];
                foreach ($group as $c) {
                    $p = $c->penerbit ?: 'Tidak Diketahui';
                    $compCounts[$p] = ($compCounts[$p] ?? 0) + 1;
                }
                arsort($compCounts);
                $dominantComp = array_key_first($compCounts);
                [$base, $cityCode] = $resolveCityCode($group->first()->kecamatan_name);

                return (object) [
                    'kecamatan_name' => $group->first()->kecamatan_name,
                    'base_name' => $base,
                    'city_code' => $cityCode,
                    'total_sekolah' => $group->count(),
                    'sekolah_aktif' => $group->where('is_active', 1)->count(),
                    'potensi_siswa' => $group->sum('total_student'),
                    'dominant_competitor' => $dominantComp,
                    'competitors' => $compCounts,
                ];
            });

        if ($kecamatanData->isEmpty()) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
                'meta' => ['kecamatan_count' => 0, 'matched' => 0],
            ]);
        }

        $kecLookup = [];
        foreach ($kecamatanData as $key => $info) {
            $base = $info->base_name;
            $compact = str_replace(' ', '', $base);
            if ($info->city_code) {
                $kecLookup[$base . '|' . $info->city_code] = $key;
                $kecLookup[$compact . '|' . $info->city_code] = $key;
            }
        }

        $geoDir = base_path('public/geojson');
        $kecFiles = glob($geoDir . '/indonesia-kecamatan*.json') ?: [];
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
            if (!isset($kecamatanFeatures[$kecKey])) {
                $kecamatanFeatures[$kecKey] = [
                    'coordinates' => [],
                    'properties' => $props,
                ];
            }

            $geom = $feature['geometry'];
            if (($geom['type'] ?? '') === 'Polygon') {
                $kecamatanFeatures[$kecKey]['coordinates'][] = $geom['coordinates'];
            } elseif (($geom['type'] ?? '') === 'MultiPolygon') {
                foreach ($geom['coordinates'] as $poly) {
                    $kecamatanFeatures[$kecKey]['coordinates'][] = $poly;
                }
            }
        }

        $mergedFeatures = [];
        $processedKec = [];
        foreach ($kecamatanFeatures as $kecKey => $kecData) {
            if (empty($kecData['coordinates'])) {
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

        foreach ($kecamatanData as $kecKey => $coverageInfo) {
            if (in_array($kecKey, $processedKec, true)) {
                continue;
            }

            $originalName = $coverageInfo->kecamatan_name;
            $parts = explode(',', $originalName);
            $kecOnly = trim($parts[0]);

            $kecDbQuery = \DB::table('kecamatans')->whereRaw('LOWER(camat_name) = ?', [mb_strtolower($kecOnly)]);
            if ($coverageInfo->city_code) {
                $kecDbQuery->where('city_code', $coverageInfo->city_code);
            }
            $kecDb = $kecDbQuery->first();
            if ($kecDb && $kecDb->geomap) {
                $geomap = json_decode($kecDb->geomap, true);
                if ($geomap && isset($geomap['lat'], $geomap['lng'])) {
                    $totalSekolah = $coverageInfo->total_sekolah ?? 0;
                    $sekolahAktif = $coverageInfo->sekolah_aktif ?? 0;
                    $belumTercover = max(0, $totalSekolah - $sekolahAktif);
                    $potensiSiswa = $coverageInfo->potensi_siswa ?? 0;
                    $coveragePct = $totalSekolah > 0 ? round(($sekolahAktif / $totalSekolah) * 100) : 0;

                    $mergedFeatures[] = [
                        'type' => 'Feature',
                        'geometry' => [
                            'type' => 'Point',
                            'coordinates' => [$geomap['lng'], $geomap['lat']],
                        ],
                        'properties' => [
                            'kecamatan_name' => $originalName,
                            'kabupaten' => '',
                            'provinsi' => '',
                            'city_code' => $coverageInfo->city_code,
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
            }
        }

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $mergedFeatures,
            'meta' => [
                'kecamatan_count' => $kecamatanData->count(),
                'matched' => count($processedKec),
            ],
        ]);
    }

PHP;

$out = substr($src, 0, $start) . $newMethod . substr($src, $end);
file_put_contents($path, $out);
echo "replaced ok, bytes=" . strlen($out) . "\n";
