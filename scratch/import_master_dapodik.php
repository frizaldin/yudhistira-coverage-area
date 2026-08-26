<?php

use App\Imports\MasterDapodikImport;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$path = database_path('data/m_dapodik.xlsx');
if (! is_file($path)) {
    fwrite(STDERR, "File not found: {$path}\n");
    exit(1);
}

$before = Customer::count();
$beforeActive = Customer::where('is_active', 1)->count();
echo "Before: total={$before} active={$beforeActive}\n";
echo "Importing {$path} ...\n";

$started = microtime(true);

$batch = DB::table('import_batches')->insertGetId([
    'type' => 'yearly',
    'year' => (int) date('Y'),
    'month' => null,
    'status' => 'success',
    'created_at' => now(),
    'updated_at' => now(),
]);

DB::table('import_files')->insert([
    'batch_id' => $batch,
    'filename' => 'm_dapodik.xlsx',
    'file_type' => 'master_dapodik',
    'created_at' => now(),
    'updated_at' => now(),
]);

Excel::import(new MasterDapodikImport($batch), $path);

$elapsed = round(microtime(true) - $started, 1);
$after = Customer::count();
$afterActive = Customer::where('is_active', 1)->count();
$inactive = Customer::where('is_active', 0)->count();

echo "Done in {$elapsed}s\n";
echo "After: total={$after} active={$afterActive} inactive={$inactive}\n";
echo "Delta total: " . ($after - $before) . "\n";
echo "Sample: ";
$sample = Customer::where('npsn', '69976198')->first(['id', 'name', 'npsn', 'jenjang', 'kecamatan_name', 'total_student', 'is_active', 'cabang_id', 'penerbit']);
echo json_encode($sample, JSON_UNESCAPED_UNICODE) . PHP_EOL;
