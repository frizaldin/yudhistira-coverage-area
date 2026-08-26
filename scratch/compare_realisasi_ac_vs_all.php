<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cabangId = 52;
$year = 2026;

$customers = App\Models\Customer::where('cabang_id', $cabangId)
    ->with(['customerPlans' => fn ($q) => $q->select('customer_id', 'year', 'sumber_dana', 'real_exemplar', 'is_ac')])
    ->get(['id', 'jenjang']);

$allRealSchools = 0;
$allRealEks = 0;
$acRealSchools = 0;
$acRealEks = 0;
$acCount = 0;
$nonAcRealSchools = 0;
$nonAcRealEks = 0;
$byJenjangAc = [];
$byJenjangAll = [];

foreach ($customers as $c) {
    $plans = $c->customerPlans->groupBy('year')->map(fn ($g) => (object) [
        'real' => $g->sum('real_exemplar'),
        'is_ac' => $g->max('is_ac'),
    ]);
    $real = (float) ($plans[$year]->real ?? 0);
    $isAc = isset($plans[$year]) && (int) ($plans[$year]->is_ac ?? 0) === 1;
    $j = strtoupper(trim($c->jenjang ?: 'Lainnya'));

    if ($real > 0) {
        $allRealSchools++;
        $allRealEks += $real;
    }
    if ($isAc) {
        $acCount++;
        if ($real > 0) {
            $acRealSchools++;
            $acRealEks += $real;
        }
        if (!isset($byJenjangAc[$j])) {
            $byJenjangAc[$j] = ['ac' => 0, 'real_s' => 0, 'real_e' => 0];
        }
        $byJenjangAc[$j]['ac']++;
        if ($real > 0) {
            $byJenjangAc[$j]['real_s']++;
            $byJenjangAc[$j]['real_e'] += $real;
        }
    } elseif ($real > 0) {
        $nonAcRealSchools++;
        $nonAcRealEks += $real;
    }
    if (!isset($byJenjangAll[$j])) {
        $byJenjangAll[$j] = ['real_s' => 0, 'real_e' => 0];
    }
    if ($real > 0) {
        $byJenjangAll[$j]['real_s']++;
        $byJenjangAll[$j]['real_e'] += $real;
    }
}

echo "ALL realisasi sekolah: $allRealSchools\n";
echo 'ALL realisasi eks: ' . round($allRealEks) . "\n";
echo "AC count: $acCount\n";
echo "AC realisasi sekolah: $acRealSchools\n";
echo 'AC realisasi eks: ' . round($acRealEks) . "\n";
echo "NON-AC realisasi sekolah: $nonAcRealSchools\n";
echo 'NON-AC realisasi eks: ' . round($nonAcRealEks) . "\n";
echo "\nJenjang (AC only):\n";
foreach ($byJenjangAc as $j => $r) {
    echo "  $j AC={$r['ac']} terealisasi={$r['real_s']} eks=" . round($r['real_e']) . "\n";
}
echo "\nJenjang (ALL with real):\n";
foreach ($byJenjangAll as $j => $r) {
    echo "  $j terealisasi={$r['real_s']} eks=" . round($r['real_e']) . "\n";
}
