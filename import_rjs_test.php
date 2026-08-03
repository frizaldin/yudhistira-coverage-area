<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$filename = 'RJS - Bogor.xls';
$path = __DIR__ . '/database/data/' . $filename;

$batchId = DB::table('import_batches')->insertGetId([
    'type' => 'monthly',
    'year' => 2026,
    'month' => 7,
    'status' => 'success',
    'created_at' => now(),
    'updated_at' => now(),
]);

DB::table('import_files')->insert([
    'batch_id' => $batchId,
    'filename' => $filename,
    'file_type' => 'rjs',
    'created_at' => now(),
    'updated_at' => now(),
]);

$cabang = \App\Models\Cabang::where('nama_cabang', 'LIKE', '%Bogor%')->first();
$cabangId = $cabang ? $cabang->id : null;
$areaId = $cabang ? $cabang->area_id : null;

echo "Mulai import RJS untuk Cabang ID: $cabangId, Area ID: $areaId\n";

\Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RjsImport($batchId, $cabangId, $areaId), $path);

echo "Selesai import RJS.\n";

$salesId = 3;
$salesPlan = \App\Models\SalesPlan::where('sales_id', $salesId)->whereNull('jenjang')->get();
echo "Sales Plan TRLG setelah import:\n";
foreach($salesPlan as $sp) {
    echo "Year: {$sp->year}, Tahan: {$sp->tahan_customer}, Rebut: {$sp->rebut_customer}, Lepas: {$sp->lepas_customer}, Gagal: {$sp->gagal_customer}\n";
}
