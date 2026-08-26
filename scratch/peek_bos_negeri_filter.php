<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

function applyNegeriName($q) {
    return $q->where(function ($w) {
        $w->where('name', 'like', '%NEGERI%')
            ->orWhere('name', 'like', 'SDN %')
            ->orWhere('name', 'like', 'SDN.%')
            ->orWhere('name', 'like', 'SMPN %')
            ->orWhere('name', 'like', 'SMPN.%')
            ->orWhere('name', 'like', 'SMAN %')
            ->orWhere('name', 'like', 'SMAN.%')
            ->orWhere('name', 'like', 'SMKN %')
            ->orWhere('name', 'like', 'SMKN.%')
            ->orWhere('name', 'like', 'MIN %')
            ->orWhere('name', 'like', 'MIN.%')
            ->orWhere('name', 'like', 'MTsN %')
            ->orWhere('name', 'like', 'MTSN %')
            ->orWhere('name', 'like', 'MAN %')
            ->orWhere('name', 'like', 'SD N %')
            ->orWhere('name', 'like', 'SMP N %')
            ->orWhere('name', 'like', 'SMA N %')
            ->orWhere('name', 'like', 'SMK N %');
    });
}

function applySwastaExclude($q) {
    // Exclude common private markers even if somehow matched
    return $q->where('name', 'not like', '%SWASTA%')
        ->where('name', 'not like', 'SDS %')
        ->where('name', 'not like', 'SMPS %')
        ->where('name', 'not like', 'SMAS %')
        ->where('name', 'not like', 'SMKS %')
        ->where('name', 'not like', 'SDIT %')
        ->where('name', 'not like', 'SMPIT %')
        ->where('name', 'not like', 'SMAIT %');
}

$base = DB::table('customers')->where('sumber_dana', 'like', '%BOS%');
$total = (clone $base)->count();
$negeri = applyNegeriName(clone $base)->count();
$negeriClean = applySwastaExclude(applyNegeriName(clone $base))->count();

echo "BOS total: {$total}\n";
echo "BOS + negeri name: {$negeri}\n";
echo "BOS + negeri name cleaned: {$negeriClean}\n";
echo "Excluded: " . ($total - $negeriClean) . "\n\n";

echo "Sample excluded (BOS non-negeri):\n";
$excluded = (clone $base)
    ->where(function ($w) {
        $w->where('name', 'not like', '%NEGERI%')
            ->where('name', 'not like', 'SDN %')
            ->where('name', 'not like', 'SDN.%')
            ->where('name', 'not like', 'SMPN %')
            ->where('name', 'not like', 'SMPN.%')
            ->where('name', 'not like', 'SMAN %')
            ->where('name', 'not like', 'SMAN.%')
            ->where('name', 'not like', 'SMKN %')
            ->where('name', 'not like', 'SMKN.%')
            ->where('name', 'not like', 'MIN %')
            ->where('name', 'not like', 'MIN.%')
            ->where('name', 'not like', 'MTsN %')
            ->where('name', 'not like', 'MTSN %')
            ->where('name', 'not like', 'MAN %')
            ->where('name', 'not like', 'SD N %')
            ->where('name', 'not like', 'SMP N %')
            ->where('name', 'not like', 'SMA N %')
            ->where('name', 'not like', 'SMK N %');
    })
    ->limit(30)
    ->get(['name', 'jenjang', 'sumber_dana']);
foreach ($excluded as $r) {
    echo "{$r->jenjang} | {$r->name}\n";
}

echo "\nSample included:\n";
foreach (applyNegeriName(clone $base)->limit(20)->get(['name', 'jenjang']) as $r) {
    echo "{$r->jenjang} | {$r->name}\n";
}
