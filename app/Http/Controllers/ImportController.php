<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportController extends Controller
{
    public function index()
    {
        return Inertia::render('Monitoring/Import', [
            'activeNav' => 'import'
        ]);
    }

    public function history()
    {
        return Inertia::render('Monitoring/RiwayatData', [
            'activeNav' => 'riwayat-data',
            'imports' => \App\Services\ImportHistoryService::paginate(40),
            'lastImport' => \App\Services\ImportHistoryService::latest(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:province,city,kecamatan',
            'file' => 'required|file|mimes:csv,txt|max:10240' // 10MB max
        ]);

        $type = $request->input('type');
        $file = $request->file('file');
        
        $path = $file->getRealPath();
        $data = array_map('str_getcsv', file($path));
        
        if (count($data) < 2) {
            return back()->with('error', 'File CSV kosong atau tidak memiliki data.');
        }

        $header = array_shift($data);
        // Trim bom or weird characters from headers
        $header = array_map('trim', $header);
        // Fix for first column BOM if exists
        $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);

        $insertedCount = 0;

        DB::beginTransaction();
        try {
            if ($type === 'province') {
                // Expected header: province_code, province_name
                foreach ($data as $row) {
                    if (count($row) >= 2 && !empty(trim($row[0]))) {
                        DB::table('provinces')->updateOrInsert(
                            ['province_code' => trim($row[0])],
                            ['province_name' => trim($row[1])]
                        );
                        $insertedCount++;
                    }
                }
            } elseif ($type === 'city') {
                // Expected header: city_code, city_name, province_code, ...
                foreach ($data as $row) {
                    if (count($row) >= 3 && !empty(trim($row[0]))) {
                        DB::table('cities')->updateOrInsert(
                            ['city_code' => trim($row[0])],
                            [
                                'city_name' => trim($row[1]),
                                'province_code' => trim($row[2])
                            ]
                        );
                        $insertedCount++;
                    }
                }
            } elseif ($type === 'kecamatan') {
                // Expected header: camat_code, city_code, camat_name, geomap
                foreach ($data as $row) {
                    if (count($row) >= 3 && !empty(trim($row[0]))) {
                        DB::table('kecamatans')->updateOrInsert(
                            ['camat_code' => trim($row[0])],
                            [
                                'city_code' => trim($row[1]),
                                'camat_name' => trim($row[2])
                            ]
                        );
                        $insertedCount++;
                    }
                }
            }
            DB::commit();
            try {
                \App\Services\ImportHistoryService::record(
                    $file->getClientOriginalName(),
                    $type,
                    'yearly',
                    'success'
                );
            } catch (\Throwable $logEx) {
                Log::warning('Gagal mencatat riwayat import CSV: ' . $logEx->getMessage());
            }
            return back()->with('success', "Berhasil memproses $insertedCount baris data $type.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import CSV failed: ' . $e->getMessage());
            return back()->with('error', 'Gagal memproses file. Pastikan format kolom sesuai. Pesan: ' . $e->getMessage());
        }
    }

    public function storeReport(Request $request)
    {
        $request->validate([
            'type' => 'required|in:rekap_kota,rekap_ac,rjs,rjs2,tar,marketshare_kota,marketshare_kec,data_cabang,data_customer_cabang,aktivitas_sales,master_dapodik',
            'file' => 'required|file|mimes:xls,xlsx|max:20480' // 20MB max
        ]);

        $type = $request->input('type');
        $file = $request->file('file');

        try {
            DB::beginTransaction();

            // Create batch record
            $batch = DB::table('import_batches')->insertGetId([
                'type' => in_array($type, ['rjs', 'rjs2', 'tar']) ? 'monthly' : 'yearly',
                'year' => date('Y'),
                'month' => in_array($type, ['rjs', 'rjs2', 'tar']) ? date('n') : null,
                'status' => 'success',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $filename = $file->getClientOriginalName();
            DB::table('import_files')->insert([
                'batch_id' => $batch,
                'filename' => $filename,
                'file_type' => $type,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $cabangId = null;
            $areaId = null;

            if (str_contains($filename, ' - ')) {
                $parts = explode(' - ', $filename);
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

            if ($type === 'rekap_kota') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RekapKotaKabImport($batch), $file);
            } elseif ($type === 'rekap_ac') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RekapAreaCoverImport($batch), $file);
            } elseif ($type === 'rjs') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RjsImport($batch, $cabangId, $areaId), $file);
            } elseif ($type === 'rjs2') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\Rjs2Import($batch, $cabangId, $areaId), $file);
            } elseif ($type === 'tar') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\TarImport($batch), $file);
            } elseif ($type === 'marketshare_kota') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MarketshareKotaImport($batch, $cabangId, $areaId), $file);
            } elseif ($type === 'marketshare_kec') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MarketshareKecamatanImport($batch, $cabangId, $areaId), $file);
            } elseif ($type === 'data_cabang') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\DataCabangImport($batch), $file);
            } elseif ($type === 'data_customer_cabang') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\DataCustomerCabangImport($batch, $cabangId, $areaId), $file);
            } elseif ($type === 'master_dapodik') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MasterDapodikImport($batch), $file);
            } elseif ($type === 'aktivitas_sales') {
                \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\AktivitasSalesPerCustomerImport(), $file);
            }

            DB::commit();
            return back()->with('success', "Berhasil mengimport data laporan $type.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Excel failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return back()->with('error', 'Gagal memproses file Excel. ' . $e->getMessage());
        }
    }

    public function storeBulkReport(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'required|file|mimes:xls,xlsx|max:20480' // 20MB max per file
        ]);

        $files = $request->file('files');
        $savedFiles = [];
        $batchId = uniqid('bulk_'); // a unique folder name for this batch

        try {
            foreach ($files as $file) {
                $filename = $file->getClientOriginalName();
                // Save the file to local storage (storage/app/imports/{batchId}/filename)
                $path = $file->storeAs("imports/{$batchId}", $filename, 'local');
                if ($path) {
                    $savedFiles[] = storage_path("app/{$path}");
                }
            }

            // Dispatch the job with the array of full file paths
            \App\Jobs\ProcessBulkImportFolder::dispatch($savedFiles, $batchId);

            return back()->with('success', "Proses import sedang berjalan di latar belakang (Background Process). Silakan cek halaman dashboard atau notifikasi nanti setelah selesai.");
            
        } catch (\Exception $e) {
            Log::error('Bulk Import Queue failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return back()->with('error', 'Gagal mengantrekan file untuk diproses. ' . $e->getMessage());
        }
    }

    public function resetData(Request $request)
    {
        try {
            // Disable foreign key checks to allow truncation
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Truncate all report/Excel-related tables
            // CSV tables (provinces, cities, kecamatans) are NOT truncated.
            DB::table('import_files')->truncate();
            DB::table('import_batches')->truncate();
            DB::table('sales_progress')->truncate();
            DB::table('customer_plans')->truncate();
            DB::table('sales_plans')->truncate();
            DB::table('sales_city_plans')->truncate();
            DB::table('sales_area_covers')->truncate();
            DB::table('market_shares')->truncate();
            
            // Also truncate master data populated by Excel if we want a complete clean slate
            DB::table('customers')->truncate();
            DB::table('sales')->truncate();
            DB::table('areas')->truncate();
            DB::table('cabangs')->truncate();

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return back()->with('success', 'Berhasil melakukan reset data laporan. Sistem siap menerima import baru tanpa duplikasi.');
        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            Log::error('Reset Data failed: ' . $e->getMessage());
            return back()->with('error', 'Gagal melakukan reset data. ' . $e->getMessage());
        }
    }
}
