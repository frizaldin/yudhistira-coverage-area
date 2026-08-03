<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$kecs = \App\Models\Kecamatan::where('dapodik_customer', '>', 0)->get();
$govCounts = ['covered' => 0, 'low' => 0, 'opp' => 0, 'high_opp' => 0];

foreach ($kecs as $kec) {
    $dCust = $kec->dapodik_customer;
    $aCust = $kec->ac_customer;
    $p = $dCust > 0 ? ($aCust / $dCust) * 100 : 0;
    if ($p >= 70) $govCounts['covered']++;
    elseif ($p >= 30) $govCounts['low']++;
    elseif ($p >= 10) $govCounts['opp']++;
    else $govCounts['high_opp']++;
}
print_r($govCounts);
