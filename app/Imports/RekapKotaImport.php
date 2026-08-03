<?php

namespace App\Imports;

use App\Models\Sales;
use App\Models\Area;
use App\Models\SalesPlan;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;

class RekapKotaImport implements ToCollection
{
    private $batchId;
    private $cabangId;
    private $areaId;

    public function __construct($batchId, $cabangId = null, $areaId = null)
    {
        $this->batchId = $batchId;
        $this->cabangId = $cabangId;
        $this->areaId = $areaId;
    }

    public function collection(Collection $rows)
    {
        $currentSales = null;

        foreach ($rows as $index => $row) {
            if ($index < 5) continue; 

            if (!empty($row[1]) && empty($row[2]) && preg_match('/^[A-Za-z\s]+/', (string)$row[1])) {
                $salesNameRaw = trim((string)$row[1]);
                $name = $salesNameRaw;
                $code = null;
                if (preg_match('/(.*)\((.*)\)/', $salesNameRaw, $matches)) {
                    $name = trim($matches[1]);
                    $code = trim($matches[2]);
                }
                
                $currentSales = Sales::firstOrCreate(['name' => $name]);
                if ($code) {
                    $currentSales->update(['code' => $code]);
                }

                continue;
            }

            if (empty($row[1]) && !empty($row[2]) && $currentSales) {
                $areaName = trim((string)$row[2]);

                $areaId = $this->areaId;
                $cabangId = $this->cabangId;

                if (!$areaId || !$cabangId) {
                    continue; // Skip if no cabang injected
                }

                // Row data structure based on the script output:
                // D: CUST SWADANA (3), E: EX SWADANA (4) - this is for REAL 2025? The array index is zero-based
                // Let's look at the mapping carefully:
                // The output of analyze_excel.php for Rekap Kota:
                // Row 11: | | KOTA TANGERANG SELATAN | | | | 58 | 77258 | 58 | 7400
                // Array index:
                // 0: empty
                // 1: empty
                // 2: KOTA TANGERANG SELATAN (Area)
                // 3: empty
                // 4: empty
                // 5: 58 (CUST AC 2026 SWADANA)
                // 6: 77258 (POTENSI AC 2026 SWADANA)
                // 7: 58 (CUST REN JUAL 2026 SWADANA)
                // 8: 7400 (EX REN JUAL 2026 SWADANA)
                
                $year = 2026; // hardcoded or extracted from header

                $targetCustomer = (int)($row[7] ?? 0);
                $targetExemplar = (int)($row[8] ?? 0);
                $acCustomer = (int)($row[5] ?? 0);
                $potentialExemplar = (int)($row[6] ?? 0);
                
                // We add these to the SalesPlan.
                // Since SalesPlan is per year and per sales, we aggregate it or store it.
                // Wait, the table structure is sales_id, year. We can just add to it.
                $plan = SalesPlan::firstOrCreate([
                    'sales_id' => $currentSales->id,
                    'year' => $year,
                ], [
                    'real_customer' => 0,
                    'real_exemplar' => 0,
                    'ac_customer' => 0,
                    'potential_exemplar' => 0,
                    'target_customer' => 0,
                    'target_exemplar' => 0,
                ]);

                // Increment the plan
                $plan->target_customer += $targetCustomer;
                $plan->target_exemplar += $targetExemplar;
                $plan->ac_customer += $acCustomer;
                $plan->potential_exemplar += $potentialExemplar;
                $plan->save();
            }
        }
    }
}
