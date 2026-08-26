<?php
$geo = json_decode(file_get_contents(__DIR__ . '/../public/geojson/indonesia-kecamatan-osm-32.json'), true);
echo 'features=' . count($geo['features']) . PHP_EOL;
$need = ['Ciawi', 'Cibinong', 'Babakan Madang', 'Sukaraja', 'Citeureup', 'Bojonggede', 'Bojong Gede'];
foreach ($need as $n) {
    foreach ($geo['features'] as $f) {
        if (strcasecmp($f['properties']['nama'] ?? '', $n) === 0 || stripos($f['properties']['nama'] ?? '', $n) !== false) {
            $g = $f['geometry'];
            $pt = $g['type'] === 'Polygon'
                ? ($g['coordinates'][0][0] ?? null)
                : ($g['coordinates'][0][0][0] ?? null);
            echo "{$f['properties']['nama']} | is_in={$f['properties']['is_in']} | pt=" . json_encode($pt) . "\n";
        }
    }
}
echo "\nUnique names with Ciawi/Sukaraja:\n";
foreach ($geo['features'] as $f) {
    $nama = $f['properties']['nama'] ?? '';
    if (preg_match('/ciawi|sukaraja|cibinong|babakan/i', $nama)) {
        echo $nama . ' | ' . ($f['properties']['is_in'] ?? '') . "\n";
    }
}
