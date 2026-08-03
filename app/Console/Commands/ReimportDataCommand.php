<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\File;
use App\Models\Cabang;

class ReimportDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:reimport';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Wipe all imported data and reimport them from database/data folder using filename to detect Cabang';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Wiping out old imported data...');
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\Customer::truncate();
        \App\Models\SalesPlan::truncate();
        \App\Models\SalesCityPlan::truncate();
        \App\Models\SalesHistory::truncate();
        \App\Models\Sales::truncate();
        \App\Models\MarketShare::truncate();
        \App\Models\Area::where('id', '>', 57)->delete();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info('Data wiped. Starting reimport...');

        $files = File::files(database_path('data'));

        foreach ($files as $file) {
            $filename = $file->getFilename();
            $path = $file->getPathname();

            // Extract Cabang from filename e.g. "RJS - Tangerang.xls" -> "Tangerang"
            if (!str_contains($filename, ' - ')) {
                continue;
            }

            $parts = explode(' - ', $filename);
            $type = trim($parts[0]);
            $cabangName = str_replace(['.xls', '.xlsx'], '', trim($parts[1]));

            $cabang = Cabang::whereRaw('LOWER(nama_cabang) = ?', [strtolower($cabangName)])->first();
            
            if (!$cabang) {
                // Fallback to LIKE if exact match fails, picking the shortest match to avoid over-matching (e.g. UMK TANGERANG over TANGERANG)
                $cabang = Cabang::where('nama_cabang', 'LIKE', '%' . $cabangName . '%')
                    ->orderByRaw('LENGTH(nama_cabang) ASC')
                    ->first();
            }
            
            $cabangId = $cabang ? $cabang->id : null;
            $areaId = $cabang ? $cabang->area_id : null;

            if (!$cabangId) {
                $this->warn("Cabang not found for {$cabangName} in file {$filename}. Proceeding without explicit mapping.");
            } else {
                $this->info("Importing {$filename} mapped to Cabang: {$cabang->nama_cabang} (ID: {$cabangId})");
            }

            $batchId = uniqid();

            if (str_contains($type, 'RJS 2')) {
                Excel::import(new \App\Imports\Rjs2Import($batchId, $cabangId, $areaId), $path);
            } elseif (str_contains($type, 'RJS')) {
                Excel::import(new \App\Imports\RjsImport($batchId, $cabangId, $areaId), $path);
            } elseif (str_contains($type, 'TAR')) {
                // TAR doesn't need area/cabang injection because it only creates sales plans linked to sales
                Excel::import(new \App\Imports\TarImport($batchId), $path);
            } elseif (str_contains($type, 'Rekap Kota')) {
                Excel::import(new \App\Imports\RekapKotaKabImport($batchId), $path);
            } elseif (str_contains($type, 'Marketshare Kota')) {
                Excel::import(new \App\Imports\MarketshareKotaImport($batchId, $cabangId, $areaId), $path);
            } elseif (str_contains($type, 'Marketshare Kecamatan')) {
                Excel::import(new \App\Imports\MarketshareKecamatanImport($batchId, $cabangId, $areaId), $path);
            } elseif (str_contains($type, 'Aktivitas Sales')) {
                Excel::import(new \App\Imports\AktivitasSalesPerCustomerImport(), $path);
            } elseif (str_contains($type, 'Rekap Area Cover')) {
                // Actually Rekap Area Cover might just be RJS without some columns or maybe it uses RjsImport too?
                // There is no RekapAreaCoverImport class yet! We will skip it for now.
            }
        }

        $this->info('Populating sales_histories for current year...');
        $config = \App\Models\Configuration::first();
        $targetYear = $config ? $config->target_year : '2026';
        
        $salesPlans = \App\Models\SalesCityPlan::where('sumber_dana', 'TOTAL')
            ->selectRaw('
                sales_id, 
                SUM(target_customer) as target_customer,
                SUM(target_exemplar) as target_exemplar,
                SUM(real_customer) as real_customer,
                SUM(real_exemplar) as real_exemplar,
                SUM(ac_customer) as ac_customer
            ')
            ->groupBy('sales_id')
            ->get();
            
        foreach ($salesPlans as $plan) {
            \App\Models\SalesHistory::updateOrCreate(
                ['sales_id' => $plan->sales_id, 'year' => $targetYear],
                [
                    'target_customer' => $plan->target_customer,
                    'real_customer' => $plan->real_customer > 0 ? $plan->real_customer : $plan->ac_customer,
                    'target_exemplar' => $plan->target_exemplar,
                    'real_exemplar' => $plan->real_exemplar,
                ]
            );
        }

        $this->info('Reimport complete!');
    }
}
