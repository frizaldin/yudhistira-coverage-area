<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$cabangs = DB::table('cabangs')->get();
$mappedCount = 0;
foreach ($cabangs as $cabang) {
    $searchName = trim(preg_replace('/ [A-Z]$/', '', $cabang->nama_cabang));
    
    $cities = DB::table('cities')->where('city_name', 'LIKE', '%' . $searchName . '%')->get();
    foreach ($cities as $city) {
        $affected = DB::table('kecamatans')->where('city_code', $city->city_code)->update(['cabang_id' => $cabang->id]);
        $mappedCount += $affected;
    }
}
echo "Mapped " . $mappedCount . " kecamatans to cabangs.\n";
