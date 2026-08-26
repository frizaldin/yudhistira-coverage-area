<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cabangs = DB::table('cabangs')->orderBy('id')->get(['id', 'nama_cabang', 'kode_cabang']);

echo str_pad('ID', 4)
    . str_pad('CABANG', 22)
    . str_pad('KEC', 6)
    . str_pad('DAPODIK(kec)', 14)
    . str_pad('CUST_ALL', 10)
    . str_pad('CUST_AC', 9)
    . str_pad('CUST_NON', 10)
    . str_pad('DELTA(d-c)', 12)
    . PHP_EOL;
echo str_repeat('-', 87) . PHP_EOL;

$sumD = 0;
$sumC = 0;
$sumA = 0;
$sumN = 0;
$sumK = 0;

foreach ($cabangs as $c) {
    $dap = (int) DB::table('kecamatans')->where('cabang_id', $c->id)->sum('dapodik_customer');
    $kec = (int) DB::table('kecamatans')->where('cabang_id', $c->id)->count();
    $all = (int) DB::table('customers')->where('cabang_id', $c->id)->count();
    $ac = (int) DB::table('customers')->where('cabang_id', $c->id)->where('is_active', 1)->count();
    $non = $all - $ac;
    $delta = $dap - $all;

    $sumD += $dap;
    $sumC += $all;
    $sumA += $ac;
    $sumN += $non;
    $sumK += $kec;

    echo str_pad((string) $c->id, 4)
        . str_pad(mb_substr((string) $c->nama_cabang, 0, 20), 22)
        . str_pad(number_format($kec, 0, ',', '.'), 6)
        . str_pad(number_format($dap, 0, ',', '.'), 14)
        . str_pad(number_format($all, 0, ',', '.'), 10)
        . str_pad(number_format($ac, 0, ',', '.'), 9)
        . str_pad(number_format($non, 0, ',', '.'), 10)
        . str_pad(number_format($delta, 0, ',', '.'), 12)
        . PHP_EOL;
}

echo str_repeat('-', 87) . PHP_EOL;
echo str_pad('TOTAL', 26)
    . str_pad(number_format($sumK, 0, ',', '.'), 6)
    . str_pad(number_format($sumD, 0, ',', '.'), 14)
    . str_pad(number_format($sumC, 0, ',', '.'), 10)
    . str_pad(number_format($sumA, 0, ',', '.'), 9)
    . str_pad(number_format($sumN, 0, ',', '.'), 10)
    . str_pad(number_format($sumD - $sumC, 0, ',', '.'), 12)
    . PHP_EOL;

echo PHP_EOL . '=== CABANG BOGOR (id=52) ===' . PHP_EOL;
$id = 52;
$dap = (int) DB::table('kecamatans')->where('cabang_id', $id)->sum('dapodik_customer');
$kecN = (int) DB::table('kecamatans')->where('cabang_id', $id)->count();
$all = (int) DB::table('customers')->where('cabang_id', $id)->count();
$ac = (int) DB::table('customers')->where('cabang_id', $id)->where('is_active', 1)->count();
$custNoCab = (int) DB::table('customers')->whereNull('cabang_id')->count();
$custAll = (int) DB::table('customers')->count();

echo "kecamatans rows        : {$kecN}" . PHP_EOL;
echo "SUM dapodik_customer   : {$dap}" . PHP_EOL;
echo "customers cabang_id=52 : {$all}" . PHP_EOL;
echo "  - is_active=1 (AC)   : {$ac}" . PHP_EOL;
echo "  - is_active=0        : " . ($all - $ac) . PHP_EOL;
echo "customers cabang NULL  : {$custNoCab}" . PHP_EOL;
echo "customers ALL DB       : {$custAll}" . PHP_EOL;
echo "DELTA dapodik - cust52 : " . ($dap - $all) . PHP_EOL;
