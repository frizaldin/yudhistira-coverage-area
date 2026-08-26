<?php
/**
 * Rebuild OSM kecamatan geojson from cached Overpass raw using
 * polygons.openstreetmap.fr (returns clean multipolygon for relation id).
 */
$raw = json_decode(file_get_contents(__DIR__ . '/overpass_jabar_kec_raw.json'), true);
$relations = array_values(array_filter($raw['elements'] ?? [], fn ($e) => ($e['type'] ?? '') === 'relation'));
echo "relations=" . count($relations) . "\n";

$features = [];
$i = 0;
foreach ($relations as $rel) {
    $i++;
    $id = $rel['id'];
    $tags = $rel['tags'] ?? [];
    $name = $tags['name'] ?? ($tags['name:id'] ?? null);
    if (!$name) continue;

    $url = "https://polygons.openstreetmap.fr/get_geojson.py?id={$id}&params=0";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 40,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTPHEADER => ['User-Agent: coverage-area-monitoring/1.0'],
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$body || $code !== 200) {
        echo "[$i] FAIL $id $name HTTP=$code\n";
        usleep(300000);
        continue;
    }

    $geom = json_decode($body, true);
    // API sometimes returns Feature or bare geometry or FeatureCollection
    if (isset($geom['type']) && $geom['type'] === 'Feature') {
        $geom = $geom['geometry'] ?? null;
    } elseif (isset($geom['type']) && $geom['type'] === 'FeatureCollection') {
        $geom = $geom['features'][0]['geometry'] ?? null;
    }

    if (!$geom || empty($geom['coordinates'])) {
        echo "[$i] NOGEOM $id $name\n";
        usleep(300000);
        continue;
    }

    if (($geom['type'] ?? '') === 'Polygon') {
        $geom = ['type' => 'MultiPolygon', 'coordinates' => [$geom['coordinates']]];
    }

    $isIn = $tags['is_in'] ?? '';
    $kab = '';
    foreach (array_map('trim', explode(',', $isIn)) as $p) {
        if (preg_match('/^(kabupaten|kota|kab\.?)\b/i', $p)) {
            $kab = $p;
            break;
        }
    }

    $pt = $geom['coordinates'][0][0][0] ?? null;
    echo "[$i] OK $id $name pt=" . json_encode($pt) . "\n";

    $features[] = [
        'type' => 'Feature',
        'geometry' => $geom,
        'properties' => [
            'osm_id' => $id,
            'nama' => $name,
            'WADMKC' => $name,
            'WADMKK' => $kab,
            'is_in' => $isIn,
            'source' => 'osm-polygons',
            // fake kode-like city hint via lng later; matching uses nama+kab
        ],
    ];

    usleep(350000);
}

$out = __DIR__ . '/../public/geojson/indonesia-kecamatan-osm-32.json';
file_put_contents($out, json_encode([
    'type' => 'FeatureCollection',
    'features' => $features,
    'meta' => [
        'source' => 'polygons.openstreetmap.fr + Overpass relation ids',
        'generated_at' => date('c'),
        'count' => count($features),
    ],
], JSON_UNESCAPED_UNICODE));
echo "TOTAL=" . count($features) . " size=" . filesize($out) . "\n";
