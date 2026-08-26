<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$areaId = 8;
$y = (int) (\App\Models\Configuration::query()->value('target_year') ?: date('Y'));
$q = \App\Models\Customer::where('area_id', $areaId);
$total = (clone $q)->count();
$acIds = \App\Models\CustomerPlan::where('year', $y)->where('is_ac', 1)->distinct()->pluck('customer_id');
$ac = $acIds->isEmpty() ? 0 : (int) (clone $q)->whereIn('id', $acIds)->count();
$kec = (int) (clone $q)->whereNotNull('kecamatan_name')->where('kecamatan_name', '!=', '')
    ->selectRaw('COUNT(DISTINCT kecamatan_name) as cnt')->value('cnt');
echo "area={$areaId} year={$y}\n";
echo "total_sekolah={$total}\n";
echo "area_cover={$ac}\n";
echo "kecamatan_distinct={$kec}\n";
