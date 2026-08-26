<?php
$geo = json_decode(file_get_contents(__DIR__ . '/../public/geojson/indonesia-kecamatan-32.json'), true);
foreach ($geo['features'] as $f) {
    $n = $f['properties']['nama'] ?? '';
    if (stripos($n, 'ciawi') === false) continue;
    $kode = $f['properties']['kode'] ?? '';
    $lat = $f['properties']['lat'] ?? null;
    $lng = $f['properties']['lng'] ?? null;
    $coords = $f['geometry']['coordinates'] ?? [];
    // sample first point
    $p = $coords[0][0][0] ?? null;
    echo "kode=$kode nama=$n props_lat=$lat props_lng=$lng first_pt=" . json_encode($p) . "\n";
}

echo "\n--- SQL path for Ciawi ---\n";
$sql = file_get_contents(__DIR__ . '/../public/geojson/wilayah_boundaries_kec_32.sql');
if (preg_match_all("/\('(32\.[0-9.]+)','Ciawi',(-?[0-9.]+),(-?[0-9.]+),'(\[\[)/", $sql, $m, PREG_SET_ORDER)) {
    foreach ($m as $row) {
        echo "kode={$row[1]} lat={$row[2]} lng={$row[3]}\n";
    }
}
