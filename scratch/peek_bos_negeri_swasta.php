<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== sumber_dana distribution ===\n";
foreach (DB::table('customers')->select('sumber_dana', DB::raw('count(*) as c'))->groupBy('sumber_dana')->orderByDesc('c')->get() as $r) {
    echo ($r->sumber_dana ?? 'NULL') . ' = ' . $r->c . "\n";
}

$bos = DB::table('customers')->where('sumber_dana', 'like', '%BOS%');
echo "\nBOS like total: " . (clone $bos)->count() . "\n";
echo "BOS exact: " . DB::table('customers')->where('sumber_dana', 'BOS')->count() . "\n";

$swastaName = (clone $bos)->where(function ($q) {
    $q->where('name', 'like', '%SWASTA%')
        ->orWhere('name', 'like', '% Swasta%')
        ->orWhere('name', 'like', 'SDS %')
        ->orWhere('name', 'like', 'SMPS %')
        ->orWhere('name', 'like', 'SMAS %');
})->count();
echo "BOS + nama swasta-ish: {$swastaName}\n";

$negeriName = DB::table('customers')->where('sumber_dana', 'like', '%BOS%')->where(function ($q) {
    $q->where('name', 'like', '%NEGERI%')
        ->orWhere('name', 'like', 'SDN %')
        ->orWhere('name', 'like', 'SMPN %')
        ->orWhere('name', 'like', 'SMAN %')
        ->orWhere('name', 'like', 'SMKN %')
        ->orWhere('name', 'like', 'MIN %')
        ->orWhere('name', 'like', 'MTsN %')
        ->orWhere('name', 'like', 'MTSN %')
        ->orWhere('name', 'like', 'MAN %');
})->count();
echo "BOS + nama negeri-ish: {$negeriName}\n";

echo "\nSample BOS dengan nama SWASTA:\n";
foreach (DB::table('customers')
    ->where('sumber_dana', 'like', '%BOS%')
    ->where('name', 'like', '%SWASTA%')
    ->limit(15)
    ->get(['id', 'name', 'sumber_dana', 'jenjang']) as $r) {
    echo "{$r->id} | {$r->sumber_dana} | {$r->jenjang} | {$r->name}\n";
}

echo "\nSample BOS tanpa NEGERI di nama:\n";
foreach (DB::table('customers')
    ->where('sumber_dana', 'like', '%BOS%')
    ->where('name', 'not like', '%NEGERI%')
    ->where('name', 'not like', 'SDN %')
    ->where('name', 'not like', 'SMPN %')
    ->where('name', 'not like', 'SMAN %')
    ->where('name', 'not like', 'SMKN %')
    ->limit(20)
    ->get(['id', 'name', 'sumber_dana', 'jenjang']) as $r) {
    echo "{$r->id} | {$r->sumber_dana} | {$r->jenjang} | {$r->name}\n";
}
