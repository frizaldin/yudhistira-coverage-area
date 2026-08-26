<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Configuration;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

$year = 2026;
$thresholds = Configuration::query()->first()?->resolvedSchoolGradeThresholds()
    ?? Configuration::defaultSchoolGradeThresholds();

$schools = Customer::query()
    ->where('customers.cabang_id', 52)
    ->join('customer_plans', function ($join) use ($year) {
        $join->on('customer_plans.customer_id', '=', 'customers.id')
            ->where('customer_plans.year', '=', $year)
            ->where('customer_plans.real_exemplar', '>', 0);
    })
    ->where(function ($q) {
        $q->where('customers.kecamatan_name', 'like', 'CARINGIN, KAB. BOGOR%')
            ->orWhere('customers.kecamatan_name', 'like', 'CARIU, KAB. BOGOR%');
    })
    ->select('customers.id', 'customers.kecamatan_name', 'customers.total_student')
    ->distinct()
    ->get();

$map = [];
foreach ($schools as $s) {
    $g = Configuration::schoolGradeFromSiswa((int) $s->total_student, $thresholds);
    $k = $s->kecamatan_name;
    $map[$k][$g] = ($map[$k][$g] ?? 0) + 1;
}
echo "schools with realisasi: " . $schools->count() . "\n";
foreach ($map as $kec => $grades) {
    echo $kec . " => " . json_encode($grades) . "\n";
}
