<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class ProcessBulkImportFolder implements ShouldQueue
{
    use Queueable;

    protected $filePaths;
    protected $batchId;

    /**
     * Create a new job instance.
     */
    public function __construct(array $filePaths, string $batchId)
    {
        $this->filePaths = $filePaths;
        $this->batchId = $batchId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $processedCount = 0;
        $skippedCount = 0;

        try {
            DB::beginTransaction();

            // Create one bulk batch record
            $batch = DB::table('import_batches')->insertGetId([
                'type' => 'bulk',
                'year' => date('Y'),
                'month' => date('n'),
                'status' => 'success',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($this->filePaths as $filePath) {
                if (!File::exists($filePath)) {
                    continue; // Skip if file is missing somehow
                }

                $filename = basename($filePath);
                $lowerName = strtolower($filename);
                
                // Determine type based on filename
                $type = null;
                if (str_contains($lowerName, 'marketshare kecamatan')) {
                    $type = 'marketshare_kec';
                } elseif (str_contains($lowerName, 'marketshare kota')) {
                    $type = 'marketshare_kota';
                } elseif (str_contains($lowerName, 'rekap kota')) {
                    $type = 'rekap_kota';
                } elseif (str_contains($lowerName, 'rekap area cover')) {
                    $type = 'rekap_ac';
                } elseif (str_starts_with($lowerName, 'rjs 2 -')) {
                    $type = 'rjs2';
                } elseif (str_starts_with($lowerName, 'rjs -')) {
                    $type = 'rjs';
                } elseif (str_starts_with($lowerName, 'tar -')) {
                    $type = 'tar';
                } elseif (str_contains($lowerName, 'data cabang')) {
                    $type = 'data_cabang';
                }

                if (!$type) {
                    $skippedCount++;
                    continue; // Skip unrecognized files
                }

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

                if ($type === 'rekap_kota') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RekapKotaKabImport($batch), $filePath);
                } elseif ($type === 'rekap_ac') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RekapAreaCoverImport($batch), $filePath);
                } elseif ($type === 'rjs') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\RjsImport($batch, $cabangId, $areaId), $filePath);
                } elseif ($type === 'rjs2') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\Rjs2Import($batch, $cabangId, $areaId), $filePath);
                } elseif ($type === 'tar') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\TarImport($batch), $filePath);
                } elseif ($type === 'marketshare_kota') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MarketshareKotaImport($batch, $cabangId, $areaId), $filePath);
                } elseif ($type === 'marketshare_kec') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\MarketshareKecamatanImport($batch, $cabangId, $areaId), $filePath);
                } elseif ($type === 'data_cabang') {
                    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\DataCabangImport($batch), $filePath);
                }
                
                $processedCount++;
            }

            DB::commit();
            Log::info("Bulk import completed for batch {$this->batchId}: {$processedCount} processed, {$skippedCount} skipped.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Bulk Import Queue failed for batch {$this->batchId}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            // Optionally, update batch status to failed
            if (isset($batch)) {
                DB::table('import_batches')->where('id', $batch)->update(['status' => 'failed']);
            }
        } finally {
            // Delete the temporary directory to save space
            $directory = storage_path("app/imports/{$this->batchId}");
            if (File::exists($directory)) {
                File::deleteDirectory($directory);
            }
        }
    }
}
