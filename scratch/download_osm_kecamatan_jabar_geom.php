<?php
/**
 * Download Jawa Barat kecamatan (admin_level=6) via Overpass `out geom`
 * so rings come from OSM ways directly (aligns with Carto/OSM basemap).
 */
$query = <<<'QL'
[out:json][timeout:300];
area["ISO3166-2"="ID-JB"]->.prov;
relation["boundary"="administrative"]["admin_level"="6"](area.prov);
out geom;
QL;

function postOverpass(string $url, string $query): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query(['data' => $query]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 320,
        CURLOPT_HTTPHEADER => [
            'User-Agent: coverage-area-monitoring/1.0 (boundary sync)',
            'Accept: application/json',
        ],
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return [$raw, $code, $err];
}

echo "Requesting Overpass out geom...\n";
[$raw, $code, $err] = postOverpass('https://overpass-api.de/api/interpreter', $query);
if ($raw === false || $code !== 200) {
    echo "Primary failed HTTP=$code $err — trying mirror\n";
    [$raw, $code, $err] = postOverpass('https://overpass.kumi.systems/api/interpreter', $query);
}
if ($raw === false || $code !== 200) {
    fwrite(STDERR, "Failed HTTP=$code $err\n");
    exit(1);
}

file_put_contents(__DIR__ . '/overpass_jabar_kec_geom.json', $raw);
echo "raw bytes=" . strlen($raw) . "\n";
$data = json_decode($raw, true);
if (!$data || empty($data['elements'])) {
    fwrite(STDERR, "No elements: " . substr((string) $raw, 0, 300) . "\n");
    exit(1);
}

$relations = array_values(array_filter($data['elements'], fn ($e) => ($e['type'] ?? '') === 'relation'));
echo "relations=" . count($relations) . "\n";

function ringFromGeom(array $geometry): ?array
{
    if (count($geometry) < 3) {
        return null;
    }
    $ring = [];
    foreach ($geometry as $p) {
        // Overpass geom uses lat/lon fields
        if (!isset($p['lat'], $p['lon'])) {
            return null;
        }
        $ring[] = [(float) $p['lon'], (float) $p['lat']];
    }
    if ($ring[0] !== end($ring)) {
        $ring[] = $ring[0];
    }
    return count($ring) >= 4 ? $ring : null;
}

/**
 * Merge consecutive outer way rings into closed rings (OSM multipolygon assembly lite).
 */
function assembleRings(array $wayRings): array
{
    // Each way ring may be an open segment; stitch by endpoints.
    $segments = $wayRings;
    $closed = [];
    while (!empty($segments)) {
        $path = array_shift($segments);
        $guard = 0;
        $changed = true;
        while ($changed && $guard++ < 500) {
            $changed = false;
            $start = $path[0];
            $end = $path[count($path) - 1];
            if ($start === $end && count($path) >= 4) {
                $closed[] = $path;
                break;
            }
            foreach ($segments as $i => $seg) {
                $s0 = $seg[0];
                $s1 = $seg[count($seg) - 1];
                if ($end === $s0) {
                    $path = array_merge($path, array_slice($seg, 1));
                    unset($segments[$i]);
                    $segments = array_values($segments);
                    $changed = true;
                    break;
                }
                if ($end === $s1) {
                    $rev = array_reverse($seg);
                    $path = array_merge($path, array_slice($rev, 1));
                    unset($segments[$i]);
                    $segments = array_values($segments);
                    $changed = true;
                    break;
                }
                if ($start === $s1) {
                    $path = array_merge($seg, array_slice($path, 1));
                    unset($segments[$i]);
                    $segments = array_values($segments);
                    $changed = true;
                    break;
                }
                if ($start === $s0) {
                    $rev = array_reverse($seg);
                    $path = array_merge($rev, array_slice($path, 1));
                    unset($segments[$i]);
                    $segments = array_values($segments);
                    $changed = true;
                    break;
                }
            }
        }
        if ($path[0] !== end($path) && count($path) >= 4) {
            // force close if nearly closed
            $path[] = $path[0];
        }
        if ($path[0] === end($path) && count($path) >= 4) {
            // avoid duplicates if already pushed
            if (empty($closed) || $closed[count($closed) - 1] !== $path) {
                // only add if not added in loop
                $already = false;
                foreach ($closed as $c) {
                    if ($c === $path) {
                        $already = true;
                        break;
                    }
                }
                if (!$already) {
                    $closed[] = $path;
                }
            }
        }
    }
    return $closed;
}

$features = [];
foreach ($relations as $rel) {
    $tags = $rel['tags'] ?? [];
    $name = $tags['name'] ?? ($tags['name:id'] ?? null);
    if (!$name) {
        continue;
    }

    $outerWays = [];
    $innerWays = [];
    foreach ($rel['members'] ?? [] as $m) {
        if (($m['type'] ?? '') !== 'way' || empty($m['geometry'])) {
            continue;
        }
        $ring = ringFromGeom($m['geometry']);
        if (!$ring) {
            continue;
        }
        // keep as open segment for stitching (drop forced close)
        if (count($ring) >= 2 && $ring[0] === end($ring)) {
            array_pop($ring);
        }
        if (($m['role'] ?? 'outer') === 'inner') {
            $innerWays[] = $ring;
        } else {
            $outerWays[] = $ring;
        }
    }

    $outers = assembleRings($outerWays);
    $inners = assembleRings($innerWays);
    if (empty($outers)) {
        continue;
    }

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
    $kab = $tags['is_in:county'] ?? ($tags['is_in:city'] ?? '');
    if ($kab === '' && $isIn !== '') {
        foreach (array_map('trim', explode(',', $isIn)) as $p) {
            if (preg_match('/^(kabupaten|kota|kab\.?)\b/i', $p)) {
                $kab = $p;
                break;
            }
        }
    }

    $features[] = [
        'type' => 'Feature',
        'geometry' => [
            'type' => 'MultiPolygon',
            'coordinates' => $coordinates,
        ],
        'properties' => [
            'osm_id' => $rel['id'],
            'nama' => $name,
            'WADMKC' => $name,
            'WADMKK' => $kab,
            'is_in' => $isIn,
            'source' => 'osm',
        ],
    ];
}

$outPath = __DIR__ . '/../public/geojson/indonesia-kecamatan-osm-32.json';
file_put_contents($outPath, json_encode([
    'type' => 'FeatureCollection',
    'features' => $features,
    'meta' => [
        'source' => 'OpenStreetMap Overpass out geom',
        'area' => 'ID-JB',
        'admin_level' => 6,
        'generated_at' => date('c'),
    ],
], JSON_UNESCAPED_UNICODE));

echo "features=" . count($features) . " size=" . filesize($outPath) . "\n";

foreach (['Ciawi', 'Cibinong', 'Babakan Madang', 'Sukaraja', 'Bojong Gede'] as $n) {
    foreach ($features as $f) {
        if (strcasecmp($f['properties']['nama'], $n) !== 0) {
            continue;
        }
        $pt = $f['geometry']['coordinates'][0][0][0] ?? null;
        $pts = count($f['geometry']['coordinates'][0][0] ?? []);
        echo "$n kab={$f['properties']['WADMKK']} pts=$pts pt=" . json_encode($pt) . "\n";
    }
}
