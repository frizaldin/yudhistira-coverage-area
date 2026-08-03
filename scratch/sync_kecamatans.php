<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$marketShares = \App\Models\MarketShare::selectRaw('kecamatan_code, cabang_id, SUM(dapodik_customer) as dCust, SUM(dapodik_student) as dStud, SUM(ac_customer) as aCust, SUM(real_customer) as rCust')
    ->groupBy('kecamatan_code', 'cabang_id')
    ->get();

$updated = 0;
foreach ($marketShares as $ms) {
    if ($ms->kecamatan_code) {
        $kec = \App\Models\Kecamatan::where('camat_code', $ms->kecamatan_code)->first();
        if ($kec) {
            $kec->update([
                'cabang_id' => $ms->cabang_id,
                'dapodik_customer' => $ms->dCust,
                'dapodik_student' => $ms->dStud,
                'ac_customer' => $ms->aCust,
                'real_customer' => $ms->rCust,
            ]);
            $updated++;
        }
    }
}
echo "Updated $updated kecamatans.\n";
