<?php
/**
 * Convert cahyadsn wilayah_boundaries SQL (path as [lat,lng] rings)
 * into GeoJSON FeatureCollection for Leaflet.
 */
$sqlPath = __DIR__ . '/../public/geojson/wilayah_boundaries_kec_32.sql';
$outPath = __DIR__ . '/../public/geojson/indonesia-kecamatan-32.json';

$sql = file_get_contents($sqlPath);
if ($sql === false) {
    fwrite(STDERR, "SQL not found\n");
    exit(1);
}

if (!preg_match_all(
    "/\('([^']+)','((?:\\\\'|[^'])*)',(-?[0-9.]+),(-?[0-9.]+),'(\[\[.+?\])'\)/s",
    $sql,
    $matches,
    PREG_SET_ORDER
)) {
    // Fallback: looser parse
    if (!preg_match_all(
        "/\('([0-9.]+)','([^']*)',(-?[0-9.]+),(-?[0-9.]+),'(\[\[.*?\]\])'\)/s",
        $sql,
        $matches,
        PREG_SET_ORDER
    )) {
        fwrite(STDERR, "No rows matched\n");
        exit(1);
    }
}

$features = [];
foreach ($matches as $m) {
    $kode = $m[1];
    $nama = $m[2];
    $lat = (float) $m[3];
    $lng = (float) $m[4];
    $pathJson = $m[5];
    $path = json_decode($pathJson, true);
    if (!is_array($path) || empty($path)) {
        continue;
    }

    // path is [[[lat,lng],...], ...] OR [[[[lat,lng],...]]]
    // Normalize to GeoJSON MultiPolygon coordinates: [ polygon[ ring[ [lng,lat] ] ] ]
    $multi = [];
    $first = $path[0] ?? null;
    if (!is_array($first)) {
        continue;
    }

    // Detect depth: if first point is numeric pair -> single ring polygon
    if (isset($first[0]) && is_numeric($first[0])) {
        // [[lat,lng], ...]
        $ring = array_map(fn ($pt) => [(float) $pt[1], (float) $pt[0]], $path);
        $multi[] = [$ring];
    } elseif (isset($first[0][0]) && is_numeric($first[0][0])) {
        // [[[lat,lng],...], ...]  => one polygon, multiple rings OR multiple polygons of one ring
        // Treat each item as a ring of one polygon if 2nd level is points
        $rings = [];
        foreach ($path as $ringPts) {
            if (!is_array($ringPts) || empty($ringPts)) continue;
            if (isset($ringPts[0]) && is_numeric($ringPts[0])) {
                $rings[] = [[(float) $ringPts[1], (float) $ringPts[0]]];
                continue;
            }
            $rings[] = array_map(fn ($pt) => [(float) $pt[1], (float) $pt[0]], $ringPts);
        }
        if ($rings) {
            $multi[] = $rings;
        }
    } else {
        // [[[[lat,lng],...]]] multipolygon
        foreach ($path as $poly) {
            if (!is_array($poly)) continue;
            $rings = [];
            foreach ($poly as $ringPts) {
                if (!is_array($ringPts) || empty($ringPts)) continue;
                if (isset($ringPts[0]) && is_numeric($ringPts[0])) {
                    $rings[] = [[(float) $ringPts[1], (float) $ringPts[0]]];
                    continue;
                }
                $rings[] = array_map(fn ($pt) => [(float) $pt[1], (float) $pt[0]], $ringPts);
            }
            if ($rings) {
                $multi[] = $rings;
            }
        }
    }

    if (empty($multi)) {
        continue;
    }

    $features[] = [
        'type' => 'Feature',
        'geometry' => [
            'type' => 'MultiPolygon',
            'coordinates' => $multi,
        ],
        'properties' => [
            'kode' => $kode,
            'nama' => $nama,
            'WADMKC' => $nama,
            'lat' => $lat,
            'lng' => $lng,
        ],
    ];
}

$geo = ['type' => 'FeatureCollection', 'features' => $features];
file_put_contents($outPath, json_encode($geo));
echo 'features: ' . count($features) . PHP_EOL;
echo 'out: ' . $outPath . ' size=' . filesize($outPath) . PHP_EOL;

// sanity: find Cibinong / Babakan Madang
foreach ($features as $f) {
    $n = strtolower($f['properties']['nama']);
    if (str_contains($n, 'cibinong') || str_contains($n, 'babakan')) {
        echo $f['properties']['kode'] . ' ' . $f['properties']['nama'] . PHP_EOL;
    }
}
