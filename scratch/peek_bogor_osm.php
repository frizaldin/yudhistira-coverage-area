<?php
$raw = json_decode(file_get_contents(__DIR__ . '/overpass_jabar_kec_raw.json'), true);
$rels = array_values(array_filter($raw['elements'] ?? [], fn ($e) => ($e['type'] ?? '') === 'relation'));
$bog = [];
foreach ($rels as $r) {
    $t = $r['tags'] ?? [];
    $blob = strtolower(($t['is_in'] ?? '') . ' ' . ($t['name'] ?? '') . ' ' . json_encode($t));
    if (str_contains($blob, 'bogor') || preg_match('/ciawi|cibinong|dramaga|gunung putri/i', $t['name'] ?? '')) {
        $bog[] = [
            'id' => $r['id'],
            'name' => $t['name'] ?? '?',
            'is_in' => $t['is_in'] ?? '',
            'admin_level' => $t['admin_level'] ?? '',
            'boundary' => $t['boundary'] ?? '',
            'keys' => array_keys($t),
        ];
    }
}
echo 'count=' . count($bog) . PHP_EOL;
foreach ($bog as $b) {
    echo json_encode($b, JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
