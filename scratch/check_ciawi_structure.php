<?php
$geo = json_decode(file_get_contents(__DIR__ . '/../public/geojson/indonesia-kecamatan-32.json'), true);
foreach ($geo['features'] as $f) {
    if (($f['properties']['kode'] ?? '') !== '32.01.24') continue;
    $c = $f['geometry']['coordinates'];
    echo "type=" . $f['geometry']['type'] . "\n";
    echo "polys=" . count($c) . "\n";
    echo "rings in poly0=" . count($c[0]) . "\n";
    echo "points in ring0=" . count($c[0][0]) . "\n";
    echo "sample points:\n";
    foreach ($c[0][0] as $i => $pt) {
        echo "  $i: " . json_encode($pt) . "\n";
    }
}

// Check raw SQL path structure for 32.01.24
$sql = file_get_contents(__DIR__ . '/../public/geojson/wilayah_boundaries_kec_32.sql');
if (preg_match("/\('32\.01\.24','Ciawi',[^,]+,[^,]+,'(\[\[.+?\])'\)/s", $sql, $m)) {
    $path = json_decode($m[1], true);
    echo "\nSQL path depth analysis:\n";
    echo "level1=" . count($path) . "\n";
    echo "level2=" . (is_array($path[0]) ? count($path[0]) : 'scalar') . "\n";
    echo "level3 first=" . json_encode($path[0][0] ?? null) . "\n";
    echo "is_numeric path[0][0]=" . (isset($path[0][0]) && is_numeric($path[0][0]) ? 'yes' : 'no') . "\n";
}
