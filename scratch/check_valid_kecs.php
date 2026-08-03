<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = \App\Models\Kecamatan::where('dapodik_customer', '>', 0)->count();
echo "Kecamatan with dapodik_customer > 0: $count\n";

$kecs = \App\Models\Kecamatan::where('dapodik_customer', '>', 0)->get();
foreach ($kecs as $kec) {
    echo $kec->camat_name . " -> Dapodik: " . $kec->dapodik_customer . ", AC: " . $kec->ac_customer . "\n";
}
