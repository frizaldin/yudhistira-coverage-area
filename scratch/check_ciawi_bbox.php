<?php
$geo = json_decode(file_get_contents(__DIR__ . '/../public/geojson/indonesia-kecamatan-32.json'), true);
foreach ($geo['features'] as $f) {
    if (($f['properties']['kode'] ?? '') !== '32.01.24') continue;
    $minLng = 999; $maxLng = -999; $minLat = 999; $maxLat = -999; $n = 0;
    $walk = function ($node) use (&$walk, &$minLng, &$maxLng, &$minLat, &$maxLat, &$n) {
        if (!is_array($node)) return;
        if (isset($node[0], $node[1]) && is_numeric($node[0]) && is_numeric($node[1]) && count($node) === 2) {
            $minLng = min($minLng, $node[0]);
            $maxLng = max($maxLng, $node[0]);
            $minLat = min($minLat, $node[1]);
            $maxLat = max($maxLat, $node[1]);
            $n++;
            return;
        }
        foreach ($node as $child) $walk($child);
    };
    $walk($f['geometry']['coordinates']);
    echo "32.01.24 Ciawi Bogor bbox: lng[$minLng,$maxLng] lat[$minLat,$maxLat] points=$n\n";
}

foreach ($geo['features'] as $f) {
    if (($f['properties']['kode'] ?? '') !== '32.06.36') continue;
    $minLng = 999; $maxLng = -999; $minLat = 999; $maxLat = -999; $n = 0;
    $walk = function ($node) use (&$walk, &$minLng, &$maxLng, &$minLat, &$maxLat, &$n) {
        if (!is_array($node)) return;
        if (isset($node[0], $node[1]) && is_numeric($node[0]) && is_numeric($node[1]) && count($node) === 2) {
            $minLng = min($minLng, $node[0]);
            $maxLng = max($maxLng, $node[0]);
            $minLat = min($minLat, $node[1]);
            $maxLat = max($maxLat, $node[1]);
            $n++;
            return;
        }
        foreach ($node as $child) $walk($child);
    };
    $walk($f['geometry']['coordinates']);
    echo "32.06.36 Ciawi Tasik bbox: lng[$minLng,$maxLng] lat[$minLat,$maxLat] points=$n\n";
}

// Any feature whose name isn't Ciawi but bbox near Tasik AND appears for bogor sales?
echo "\nFeatures with lng center near Tasik (>107.8):\n";
foreach ($geo['features'] as $f) {
    $pt = $f['geometry']['coordinates'][0][0][0] ?? null;
    if (!$pt || $pt[0] < 107.8) continue;
    // only print if nama might confuse
    $nama = $f['properties']['nama'] ?? '';
    $kode = $f['properties']['kode'] ?? '';
    if (preg_match('/ciawi|sukaraja|megamendung|cibinong|bogor/i', $nama)) {
        echo "$kode $nama lng={$pt[0]}\n";
    }
}
