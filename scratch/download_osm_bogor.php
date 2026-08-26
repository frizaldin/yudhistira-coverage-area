<?php
/**
 * Download OSM kecamatan for Kab/Kota Bogor only (smaller Overpass queries).
 */
function postOverpass(string $query): ?array
{
    foreach (['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'] as $url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query(['data' => $query]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 180,
            CURLOPT_HTTPHEADER => ['User-Agent: coverage-area-monitoring/1.0'],
        ]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($raw && $code === 200) {
            $j = json_decode($raw, true);
            if (!empty($j['elements'])) {
                return $j;
            }
        }
        echo "fail $url HTTP=$code\n";
        sleep(2);
    }
    return null;
}

function ringFromGeom(array $geometry): ?array
{
    if (count($geometry) < 3) return null;
    $ring = [];
    foreach ($geometry as $p) {
        if (!isset($p['lat'], $p['lon'])) return null;
        $ring[] = [(float)$p['lon'], (float)$p['lat']];
    }
    if ($ring[0] === end($ring)) array_pop($ring);
    return count($ring) >= 3 ? $ring : null;
}

function assembleRings(array $wayRings): array
{
    $segments = $wayRings;
    $closed = [];
    while (!empty($segments)) {
        $path = array_shift($segments);
        $guard = 0;
        $changed = true;
        while ($changed && $guard++ < 800) {
            $changed = false;
            $start = $path[0];
            $end = $path[count($path) - 1];
            if ($start === $end && count($path) >= 4) {
                $closed[] = $path;
                break 2;
            }
            foreach ($segments as $i => $seg) {
                $s0 = $seg[0];
                $s1 = $seg[count($seg) - 1];
                if ($end === $s0) {
                    $path = array_merge($path, array_slice($seg, 1));
                    unset($segments[$i]); $segments = array_values($segments); $changed = true; break;
                }
                if ($end === $s1) {
                    $path = array_merge($path, array_slice(array_reverse($seg), 1));
                    unset($segments[$i]); $segments = array_values($segments); $changed = true; break;
                }
                if ($start === $s1) {
                    $path = array_merge($seg, array_slice($path, 1));
                    unset($segments[$i]); $segments = array_values($segments); $changed = true; break;
                }
                if ($start === $s0) {
                    $path = array_merge(array_reverse($seg), array_slice($path, 1));
                    unset($segments[$i]); $segments = array_values($segments); $changed = true; break;
                }
            }
        }
        if ($path[0] !== end($path)) $path[] = $path[0];
        if ($path[0] === end($path) && count($path) >= 4) $closed[] = $path;
    }
    return $closed;
}

function relationsToFeatures(array $data, string $defaultKab): array
{
    $features = [];
    foreach ($data['elements'] as $rel) {
        if (($rel['type'] ?? '') !== 'relation') continue;
        $tags = $rel['tags'] ?? [];
        $name = $tags['name'] ?? ($tags['name:id'] ?? null);
        if (!$name) continue;

        $outerWays = [];
        $innerWays = [];
        foreach ($rel['members'] ?? [] as $m) {
            if (($m['type'] ?? '') !== 'way' || empty($m['geometry'])) continue;
            $ring = ringFromGeom($m['geometry']);
            if (!$ring) continue;
            if (($m['role'] ?? 'outer') === 'inner') $innerWays[] = $ring;
            else $outerWays[] = $ring;
        }
        $outers = assembleRings($outerWays);
        $inners = assembleRings($innerWays);
        if (!$outers) continue;

        $coordinates = [];
        foreach ($outers as $i => $outer) {
            $poly = [$outer];
            if ($i === 0) foreach ($inners as $inner) $poly[] = $inner;
            $coordinates[] = $poly;
        }

        $features[] = [
            'type' => 'Feature',
            'geometry' => ['type' => 'MultiPolygon', 'coordinates' => $coordinates],
            'properties' => [
                'osm_id' => $rel['id'],
                'nama' => $name,
                'WADMKC' => $name,
                'WADMKK' => $defaultKab,
                'source' => 'osm',
            ],
        ];
    }
    return $features;
}

$areas = [
    ['Kabupaten Bogor', 'KAB. BOGOR'],
    ['Kota Bogor', 'KOTA BOGOR'],
    ['Kabupaten Sukabumi', 'KAB. SUKABUMI'],
];

$all = [];
foreach ($areas as [$areaName, $kabLabel]) {
    echo "Fetching $areaName...\n";
    $q = <<<QL
[out:json][timeout:120];
area["name"="{$areaName}"]["boundary"="administrative"]->.a;
relation["boundary"="administrative"]["admin_level"="6"](area.a);
out geom;
QL;
    $data = postOverpass($q);
    if (!$data) {
        echo "SKIP $areaName\n";
        continue;
    }
    $feats = relationsToFeatures($data, $kabLabel);
    echo "  got " . count($feats) . "\n";
    $all = array_merge($all, $feats);
    sleep(2);
}

$outPath = __DIR__ . '/../public/geojson/indonesia-kecamatan-osm-32.json';
file_put_contents($outPath, json_encode([
    'type' => 'FeatureCollection',
    'features' => $all,
    'meta' => [
        'source' => 'OpenStreetMap Overpass',
        'areas' => array_column($areas, 0),
        'generated_at' => date('c'),
        'note' => 'OSM admin boundaries — aligns with Leaflet Carto/OSM basemap',
    ],
], JSON_UNESCAPED_UNICODE));

echo "TOTAL features=" . count($all) . " size=" . filesize($outPath) . "\n";
foreach (['Ciawi', 'Cibinong', 'Babakan Madang', 'Sukaraja', 'Bojong Gede'] as $n) {
    foreach ($all as $f) {
        if (strcasecmp($f['properties']['nama'], $n) !== 0) continue;
        $pt = $f['geometry']['coordinates'][0][0][0] ?? null;
        $pts = count($f['geometry']['coordinates'][0][0] ?? []);
        echo "$n | {$f['properties']['WADMKK']} | pts=$pts | " . json_encode($pt) . "\n";
    }
}
