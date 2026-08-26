<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$svc = new \App\Services\OsmBoundaryService();
$tests = [
    ['Ciawi', 'KAB. BOGOR'],
    ['Cibinong', 'KAB. BOGOR'],
    ['Babakan Madang', 'KAB. BOGOR'],
];
foreach ($tests as [$kec, $kab]) {
    echo "Fetching $kec, $kab ... ";
    $g = $svc->getPolygon($kec, $kab);
    if (!$g) {
        echo "MISS\n";
        continue;
    }
    $pt = $g['coordinates'][0][0][0] ?? null;
    $pts = count($g['coordinates'][0][0] ?? []);
    echo "OK pts=$pts pt=" . json_encode($pt) . "\n";
}
