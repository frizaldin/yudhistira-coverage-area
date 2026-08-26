<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = DB::table('customers')->where('cabang_id', 52)->whereNotNull('kecamatan_name')->select('kecamatan_name')->get();
$kab = [];
foreach ($rows as $r) {
    $parts = array_map('trim', explode(',', (string) $r->kecamatan_name));
    $k = strtoupper($parts[1] ?? '');
    if ($k !== '') {
        $kab[$k] = ($kab[$k] ?? 0) + 1;
    }
}
arsort($kab);
foreach (array_slice($kab, 0, 12, true) as $k => $c) {
    echo "$k = $c\n";
}

$codes = DB::table('kecamatans')->where('cabang_id', 52)
    ->whereIn('city_code', [3201, 3271, 3202, 3272, 3203])
    ->selectRaw('city_code, count(*) as c')
    ->groupBy('city_code')
    ->get();
echo "\nmaster kecamatan by city:\n";
foreach ($codes as $r) {
    $n = DB::table('cities')->where('city_code', $r->city_code)->value('city_name');
    echo "{$r->city_code} {$n} = {$r->c}\n";
}

// Peek OSM feature props for city match
$path = public_path('geojson/indonesia-kecamatan-osm-32.json');
$data = json_decode(file_get_contents($path), true);
$sample = $data['features'][0]['properties'] ?? [];
echo "\nOSM props keys: " . implode(', ', array_keys($sample)) . "\n";
echo json_encode($sample, JSON_UNESCAPED_UNICODE) . "\n";
