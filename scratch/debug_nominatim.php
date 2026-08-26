<?php
$url = 'https://nominatim.openstreetmap.org/search?' . http_build_query([
    'q' => 'Kecamatan Ciawi, Kabupaten Bogor, Jawa Barat, Indonesia',
    'format' => 'json',
    'limit' => 3,
    'polygon_geojson' => 1,
    'addressdetails' => 1,
    'countrycodes' => 'id',
]);
echo $url . PHP_EOL;
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'User-Agent: coverage-area-monitoring/1.0 (sales coverage map)',
        'Accept-Language: id',
    ],
]);
$raw = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
echo "HTTP=$code err=$err bytes=" . strlen((string)$raw) . PHP_EOL;
echo substr((string)$raw, 0, 800) . PHP_EOL;

$rows = json_decode($raw, true);
if (is_array($rows)) {
    foreach ($rows as $i => $r) {
        echo "\n#$i type={$r['type']} class={$r['class']} name={$r['display_name']}\n";
        echo "geojson type=" . ($r['geojson']['type'] ?? 'none') . "\n";
        echo "address=" . json_encode($r['address'] ?? []) . "\n";
    }
}
