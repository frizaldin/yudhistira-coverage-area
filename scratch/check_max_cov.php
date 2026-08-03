<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$kecs = \App\Models\Kecamatan::where('dapodik_customer', '>', 0)->get();

foreach ($kecs as $kec) {
    $dCust = $kec->dapodik_customer;
    $aCust = $kec->ac_customer;
    $p = $dCust > 0 ? ($aCust / $dCust) * 100 : 0;
    if ($p > 0) {
        echo $kec->camat_name . " -> Dapodik: $dCust, AC: $aCust, Coverage: " . round($p, 2) . "%\n";
    }
}
