<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

$files = File::files(base_path('database/data'));

$batch = DB::table('import_batches')->insertGetId([
    'type' => 'bulk',
    'year' => date('Y'),
    'month' => date('n'),
    'status' => 'success',
    'created_at' => now(),
    'updated_at' => now(),
]);

foreach ($files as $file) {
    if ($file->getExtension() !== 'xls' && $file->getExtension() !== 'xlsx') {
        continue;
    }

    $filename = $file->getFilename();
    $lowerName = strtolower($filename);
    
    $type = null;
    if (str_contains($lowerName, 'marketshare kecamatan')) {
        $type = 'marketshare_kec';
    } elseif (str_contains($lowerName, 'marketshare kota')) {
        $type = 'marketshare_kota';
    } elseif (str_contains($lowerName, 'rekap kota')) {
        $type = 'rekap_kota';
    } elseif (str_contains($lowerName, 'rekap area cover')) {
        $type = 'rekap_ac';
    } elseif (str_starts_with($lowerName, 'rjs -')) {
        $type = 'rjs';
    } elseif (str_starts_with($lowerName, 'tar -')) {
        $type = 'tar';
    } elseif (str_contains($lowerName, 'data cabang')) {
        $type = 'data_cabang';
    } elseif (str_contains($lowerName, 'aktivitas sales')) {
        $type = 'aktivitas_sales';
    }

    if (!$type) {
        continue;
    }

    $cabangId = null;
    $areaId = null;

    if (str_contains($filename, ' - ')) {
        $parts = explode(' - ', $filename);
        if (isset($parts[1])) {
            $cabangName = str_replace(['.xls', '.xlsx'], '', trim($parts[1]));
            $cabang = \App\Models\Cabang::whereRaw('LOWER(nama_cabang) = ?', [strtolower($cabangName)])->first();
            
            if (!$cabang) {
                $cabang = \App\Models\Cabang::where('nama_cabang', 'LIKE', '%' . $cabangName . '%')
                    ->orderByRaw('LENGTH(nama_cabang) ASC')
                    ->first();
            }

            if ($cabang) {
                $cabangId = $cabang->id;
                $areaId = $cabang->area_id;
            }
        }
    }

    echo "Importing $filename as $type\n";
    $filePath = $file->getPathname();

    try {
        if ($type === 'rekap_kota') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RekapKotaKabImport($batch), $filePath);
        } elseif ($type === 'rekap_ac') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RekapAreaCoverImport($batch), $filePath);
        } elseif ($type === 'rjs') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RjsImport($batch, $cabangId, $areaId), $filePath);
        } elseif ($type === 'tar') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\TarImport($batch), $filePath);
        } elseif ($type === 'marketshare_kota') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MarketshareKotaImport($batch, $cabangId, $areaId), $filePath);
        } elseif ($type === 'marketshare_kec') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MarketshareKecamatanImport($batch, $cabangId, $areaId), $filePath);
        } elseif ($type === 'data_cabang') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\DataCabangImport($batch), $filePath);
        } elseif ($type === 'aktivitas_sales') {
            \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\AktivitasSalesPerCustomerImport(), $filePath);
        }
        echo "Finished $filename\n";
    } catch (\Exception $e) {
        echo "Error importing $filename: " . $e->getMessage() . "\n";
    }
}
echo "All imports done.\n";
