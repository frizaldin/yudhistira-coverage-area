<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$id = 52;
$y = (int) (\App\Models\Configuration::query()->value('target_year') ?: date('Y'));
$ids = \App\Models\Customer::where('cabang_id', $id)->pluck('id');
$total = $ids->count();
$kec = (int) \App\Models\Customer::where('cabang_id', $id)
    ->whereNotNull('kecamatan_name')
    ->where('kecamatan_name', '!=', '')
    ->selectRaw('COUNT(DISTINCT kecamatan_name) as cnt')
    ->value('cnt');
$ac = $ids->isEmpty()
    ? 0
    : (int) \App\Models\CustomerPlan::whereIn('customer_id', $ids)
        ->where('year', $y)
        ->where('is_ac', 1)
        ->distinct()
        ->count('customer_id');

echo "year={$y}\n";
echo "total_sekolah (customers cabang)={$total}\n";
echo "kecamatan distinct={$kec}\n";
echo "area_cover (plans is_ac=1)={$ac}\n";
