<?php
/**
 * Smoke: compare cabang dashboard metrics vs sales detail style for cabang 52.
 */
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cabangId = 52;
$year = (int) (optional(\App\Models\Configuration::first())->target_year ?? date('Y'));
$prev = $year - 1;

$customers = \App\Models\Customer::where('cabang_id', $cabangId)
    ->with(['customerPlans' => function ($q) {
        $q->select('customer_id', 'year', 'sumber_dana', 'real_exemplar', 'target_exemplar', 'sp_exemplar', 'potential_exemplar', 'is_ac');
    }])
    ->get();

$ac = 0;
$realCust = 0;
$realEks = 0;
$sp = 0;
$potensi = 0;
$target = 0;
foreach ($customers as $s) {
    $plans = $s->customerPlans->groupBy('year')->map(function ($g) {
        return (object) [
            'real' => $g->sum('real_exemplar'),
            'target' => $g->sum('target_exemplar'),
            'sp' => $g->sum('sp_exemplar'),
            'pot' => $g->sum('potential_exemplar'),
            'is_ac' => $g->max('is_ac'),
        ];
    });
    $curr = $plans[$year] ?? null;
    if ($curr && (int) $curr->is_ac === 1) {
        $ac++;
        $realEks += (int) $curr->real;
        $sp += (int) $curr->sp;
        $potensi += (int) round($curr->pot);
        $target += (int) $curr->target;
        if ((int) $curr->real > 0) $realCust++;
    }
}

echo "cabang=$cabangId year=$year\n";
echo "AC=$ac realCust=$realCust realEks=$realEks sp=$sp potensi=$potensi target=$target\n";
echo "sales3 customers AC:\n";
$s3 = \App\Models\Customer::where('sales_id', 3)->where('cabang_id', 52)->count();
echo "sales3 total cust=$s3\n";
