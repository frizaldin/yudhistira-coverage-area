<?php
$geo = json_decode(file_get_contents(__DIR__ . '/../public/geojson/indonesia-kecamatan-32.json'), true);
foreach ($geo['features'] as $f) {
    $n = $f['properties']['nama'] ?? '';
    if (stripos($n, 'bojong') !== false || stripos($n, 'gede') !== false) {
        echo $f['properties']['kode'] . ' | ' . $n . PHP_EOL;
    }
}
