<?php
/**
 * Enrich indonesia-kecamatan-osm-32.json with ref:kemendagri + kabupaten hint from Overpass cache.
 */
$raw = json_decode(file_get_contents(__DIR__ . '/overpass_jabar_kec_raw.json'), true);
$byId = [];
foreach ($raw['elements'] ?? [] as $e) {
    if (($e['type'] ?? '') !== 'relation') {
        continue;
    }
    $byId[$e['id']] = $e['tags'] ?? [];
}

$path = __DIR__ . '/../public/geojson/indonesia-kecamatan-osm-32.json';
$fc = json_decode(file_get_contents($path), true);
$cityName = [
    '01' => 'Kabupaten Bogor',
    '02' => 'Kabupaten Sukabumi',
    '03' => 'Kabupaten Cianjur',
    '04' => 'Kabupaten Bandung',
    '05' => 'Kabupaten Garut',
    '06' => 'Kabupaten Tasikmalaya',
    '07' => 'Kabupaten Ciamis',
    '08' => 'Kabupaten Kuningan',
    '09' => 'Kabupaten Cirebon',
    '10' => 'Kabupaten Majalengka',
    '11' => 'Kabupaten Sumedang',
    '12' => 'Kabupaten Indramayu',
    '13' => 'Kabupaten Subang',
    '14' => 'Kabupaten Purwakarta',
    '15' => 'Kabupaten Karawang',
    '16' => 'Kabupaten Bekasi',
    '17' => 'Kabupaten Bandung Barat',
    '18' => 'Kabupaten Pangandaran',
    '71' => 'Kota Bogor',
    '72' => 'Kota Sukabumi',
    '73' => 'Kota Bandung',
    '74' => 'Kota Cirebon',
    '75' => 'Kota Bekasi',
    '76' => 'Kota Depok',
    '77' => 'Kota Cimahi',
    '78' => 'Kota Tasikmalaya',
    '79' => 'Kota Banjar',
];

$n = 0;
foreach ($fc['features'] as &$f) {
    $id = $f['properties']['osm_id'] ?? null;
    $tags = $byId[$id] ?? [];
    $kode = $tags['ref:kemendagri'] ?? null;
    if ($kode) {
        $f['properties']['kode'] = $kode;
        $parts = explode('.', $kode);
        $kabCode = $parts[1] ?? null;
        if ($kabCode && isset($cityName[$kabCode])) {
            $f['properties']['WADMKK'] = $cityName[$kabCode];
            $f['properties']['kabupaten'] = $cityName[$kabCode];
        }
        $n++;
    }
    // strip "Kecamatan " prefix for matching
    $nama = $f['properties']['nama'] ?? $f['properties']['WADMKC'] ?? '';
    $nama = preg_replace('/^(kec\.?\s*|kecamatan\s+)/iu', '', $nama);
    $f['properties']['nama'] = trim($nama);
    $f['properties']['WADMKC'] = trim($nama);
}
unset($f);

$fc['meta']['enriched_kode'] = $n;
$fc['meta']['enriched_at'] = date('c');
file_put_contents($path, json_encode($fc, JSON_UNESCAPED_UNICODE));
echo "enriched=$n total=" . count($fc['features']) . " size=" . filesize($path) . PHP_EOL;

// sample Ciawi
foreach ($fc['features'] as $f) {
    if (strcasecmp($f['properties']['WADMKC'] ?? '', 'Ciawi') === 0) {
        echo 'Ciawi: ' . json_encode($f['properties'], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    }
}
