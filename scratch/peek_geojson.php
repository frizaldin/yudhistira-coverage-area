<?php
$path = __DIR__ . '/../public/geojson/indonesia-districts.json';
$data = json_decode(file_get_contents($path), true);
$features = $data['features'] ?? $data;
$kk = [];
$kcSample = [];
foreach ($features as $f) {
    $p = $f['properties'] ?? [];
    $kab = $p['WADMKK'] ?? '';
    $kec = $p['WADMKC'] ?? '';
    $kk[$kab] = ($kk[$kab] ?? 0) + 1;
    if (stripos($kab, 'ogor') !== false || stripos($kec, 'ibinong') !== false || stripos($kec, 'abakan') !== false) {
        $kcSample[] = ($p['WADMKC'] ?? '') . ' | ' . ($p['WADMKK'] ?? '') . ' | ' . ($p['WADMPR'] ?? '');
    }
}
arsort($kk);
echo "top kab:\n";
$i = 0;
foreach ($kk as $k => $c) {
    echo "$k => $c\n";
    if (++$i >= 20) break;
}
echo "\nmatches:\n" . implode("\n", array_slice($kcSample, 0, 30)) . "\n";
echo "total kab: " . count($kk) . "\n";
