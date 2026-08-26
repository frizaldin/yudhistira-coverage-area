<?php
/**
 * Download Jawa Barat kecamatan boundaries from OSM Overpass (admin_level=6)
 * so polygons align with Leaflet OSM/Carto basemap lines.
 */
$query = <<<'QL'
[out:json][timeout:300];
area["ISO3166-2"="ID-JB"]->.prov;
(
  relation["boundary"="administrative"]["admin_level"="6"](area.prov);
);
out body;
>;
out skel qt;
QL;

echo "Requesting Overpass...\n";
$ch = curl_init('https://overpass-api.de/api/interpreter');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query(['data' => $query]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 320,
    CURLOPT_HTTPHEADER => [
        'User-Agent: coverage-area-monitoring/1.0 (local dev boundary sync)',
        'Accept: application/json',
    ],
]);
$raw = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($raw === false || $code !== 200) {
    fwrite(STDERR, "Overpass failed HTTP=$code err=$err\n");
    // try mirror
    echo "Trying mirror kumi...\n";
    $ch = curl_init('https://overpass.kumi.systems/api/interpreter');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(['data' => $query]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 320,
        CURLOPT_HTTPHEADER => [
            'User-Agent: coverage-area-monitoring/1.0 (local dev boundary sync)',
        ],
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false || $code !== 200) {
        fwrite(STDERR, "Mirror failed HTTP=$code err=$err\n");
        exit(1);
    }
}

$tmp = __DIR__ . '/overpass_jabar_kec_raw.json';
file_put_contents($tmp, $raw);
echo "saved raw bytes=" . strlen($raw) . "\n";

$data = json_decode($raw, true);
if (!$data || empty($data['elements'])) {
    fwrite(STDERR, "No elements. Head: " . substr($raw, 0, 400) . "\n");
    exit(1);
}
echo "elements=" . count($data['elements']) . "\n";

// Index nodes and ways
$nodes = [];
$ways = [];
$relations = [];
foreach ($data['elements'] as $el) {
    if ($el['type'] === 'node') {
        $nodes[$el['id']] = [$el['lon'], $el['lat']];
    } elseif ($el['type'] === 'way') {
        $ways[$el['id']] = $el['nodes'] ?? [];
    } elseif ($el['type'] === 'relation') {
        $relations[] = $el;
    }
}
echo "nodes=" . count($nodes) . " ways=" . count($ways) . " relations=" . count($relations) . "\n";

function wayToRing(array $nodeIds, array $nodes): ?array
{
    $ring = [];
    foreach ($nodeIds as $nid) {
        if (!isset($nodes[$nid])) {
            return null;
        }
        $ring[] = $nodes[$nid];
    }
    if (count($ring) < 4) {
        return null;
    }
    // close ring
    if ($ring[0] !== end($ring)) {
        $ring[] = $ring[0];
    }
    return $ring;
}

$features = [];
foreach ($relations as $rel) {
    $tags = $rel['tags'] ?? [];
    $name = $tags['name'] ?? ($tags['name:id'] ?? null);
    if (!$name) {
        continue;
    }

    $outers = [];
    $inners = [];
    foreach ($rel['members'] ?? [] as $m) {
        if (($m['type'] ?? '') !== 'way') {
            continue;
        }
        $wid = $m['ref'] ?? null;
        if (!$wid || !isset($ways[$wid])) {
            continue;
        }
        $ring = wayToRing($ways[$wid], $nodes);
        if (!$ring) {
            continue;
        }
        $role = $m['role'] ?? 'outer';
        if ($role === 'inner') {
            $inners[] = $ring;
        } else {
            $outers[] = $ring;
        }
    }

    if (empty($outers)) {
        continue;
    }

    // Simple: one polygon per outer, attach inners to first (good enough for most kecamatan)
    $coordinates = [];
    foreach ($outers as $i => $outer) {
        $poly = [$outer];
        if ($i === 0) {
            foreach ($inners as $inner) {
                $poly[] = $inner;
            }
        }
        $coordinates[] = $poly;
    }

    $isIn = $tags['is_in'] ?? '';
    $kab = $tags['is_in:city'] ?? ($tags['is_in:county'] ?? '');
    // Often: "Kabupaten Bogor" etc. in addr or name of parent - use is_in
    if ($kab === '' && $isIn !== '') {
        // e.g. "Cibinong, Kabupaten Bogor, Jawa Barat, Indonesia"
        $parts = array_map('trim', explode(',', $isIn));
        foreach ($parts as $p) {
            if (preg_match('/^(kabupaten|kota)\b/i', $p)) {
                $kab = $p;
                break;
            }
        }
    }

    $features[] = [
        'type' => 'Feature',
        'geometry' => [
            'type' => count($coordinates) > 1 ? 'MultiPolygon' : 'Polygon',
            'coordinates' => count($coordinates) > 1 ? $coordinates : $coordinates[0],
        ],
        'properties' => [
            'osm_id' => $rel['id'],
            'nama' => $name,
            'WADMKC' => $name,
            'WADMKK' => $kab,
            'admin_level' => $tags['admin_level'] ?? '6',
            'is_in' => $isIn,
        ],
    ];
}

$out = [
    'type' => 'FeatureCollection',
    'features' => $features,
    'meta' => [
        'source' => 'OpenStreetMap Overpass',
        'area' => 'ID-JB',
        'admin_level' => 6,
        'generated_at' => date('c'),
        'note' => 'Aligned with OSM/Carto basemap administrative lines',
    ],
];

$outPath = __DIR__ . '/../public/geojson/indonesia-kecamatan-osm-32.json';
file_put_contents($outPath, json_encode($out));
echo "features=" . count($features) . "\n";
echo "out=$outPath size=" . filesize($outPath) . "\n";

// sample Ciawi
foreach ($features as $f) {
    if (stripos($f['properties']['nama'], 'Ciawi') !== false) {
        $g = $f['geometry'];
        $pt = $g['type'] === 'Polygon' ? ($g['coordinates'][0][0] ?? null) : ($g['coordinates'][0][0][0] ?? null);
        echo "Ciawi: {$f['properties']['nama']} | kab={$f['properties']['WADMKK']} | pt=" . json_encode($pt) . "\n";
    }
}
