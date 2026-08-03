<?php

namespace App\Imports;

use App\Models\Sales;
use App\Models\Area;
use App\Models\Customer;
use App\Models\CustomerPlan;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;

class RjsImport implements ToCollection
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
        $currentJenjang = null;
        $year = 2026;
        $salesPlans = [];
        $trendData = [];

        foreach ($rows as $index => $row) {
            // Check if this row is a Sales row: "Achmad Fauzi (909)"
            if (isset($row[1]) && preg_match('/^(.*?)\((\d+)\)$/', trim((string)$row[1]), $matches)) {
                $name = trim($matches[1]);
                $code = trim($matches[2]);
                
                $currentSales = Sales::firstOrCreate(['name' => $name]);
                if ($code) {
                    $currentSales->update(['code' => $code]);
                }
                continue;
            }

            // Check if this row is a Jenjang row: "1. SD"
            if (empty($row[1]) && !empty($row[2]) && preg_match('/^[0-9]\.\s*([a-zA-Z]+)/', trim((string)$row[2]), $m)) {
                $currentJenjang = trim($m[1]); // e.g. "SD"
                continue;
            }

            // Customer rows start with a number in column 1 (index 1) and string in column 2
            if (isset($row[1]) && is_numeric(trim((string)$row[1])) && !empty($row[2])) {
                if (!$currentSales) {
                    continue; // Skip if no sales context
                }

                $customerRaw = trim((string)$row[2]);
                $areaRaw = trim((string)$row[3]);
                
                // Parse Customer: "SD DAAN MOGOT, 36.71.09.14.003"
                $customerParts = explode(',', $customerRaw);
                $customerName = trim($customerParts[0]);
                $npsnCode = isset($customerParts[1]) ? trim($customerParts[1]) : null;

                $areaId = $this->areaId;
                $cabangId = $this->cabangId;

                // Stop creating geographic Area from here. If not injected, skip Customer creation.
                if (!$areaId || !$cabangId) {
                    continue;
                }

                $parseExemplar = fn($val) => (int)str_replace(',', '', (string)($val ?? 0));
                
                $updateData = [
                    'kecamatan_name' => $areaRaw,
                    'total_student' => (int)($row[4] ?? 0),
                    'is_active' => (int)($row[15] ?? 0) === 1,
                    'penerbit' => !empty(trim((string)($row[14] ?? ''))) ? trim((string)$row[14]) : null,
                    'sumber_dana' => !empty(trim((string)($row[16] ?? ''))) ? trim((string)$row[16]) : null,
                    'potensi_sekolah' => $parseExemplar($row[17]) + $parseExemplar($row[18])
                ];

                $matchData = [
                    'name' => $customerName,
                    'jenjang' => $currentJenjang,
                    'area_id' => $areaId,
                    'cabang_id' => $cabangId,
                    'sales_id' => $currentSales->id,
                ];

                if ($npsnCode) {
                    $updateData['npsn'] = $npsnCode;
                }

                $customer = Customer::updateOrCreate($matchData, $updateData);

                // 2023
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => 2023, 'sumber_dana' => 'SWA'],
                    ['real_exemplar' => $parseExemplar($row[7]), 'potential_exemplar' => 0, 'target_exemplar' => 0, 'is_ac' => 0]);
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => 2023, 'sumber_dana' => 'BOS'],
                    ['real_exemplar' => $parseExemplar($row[8]), 'potential_exemplar' => 0, 'target_exemplar' => 0, 'is_ac' => 0]);

                // 2024
                $ac2024 = 0;
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => 2024, 'sumber_dana' => 'SWA'],
                    ['real_exemplar' => $parseExemplar($row[9]), 'potential_exemplar' => 0, 'target_exemplar' => 0, 'is_ac' => $ac2024]);
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => 2024, 'sumber_dana' => 'BOS'],
                    ['real_exemplar' => $parseExemplar($row[10]), 'potential_exemplar' => 0, 'target_exemplar' => 0, 'is_ac' => $ac2024]);

                // 2025
                $ac2025 = (int)($row[11] ?? 0) === 1 ? 1 : 0;
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => 2025, 'sumber_dana' => 'SWA'],
                    ['real_exemplar' => $parseExemplar($row[12]), 'potential_exemplar' => 0, 'target_exemplar' => 0, 'is_ac' => $ac2025]);
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => 2025, 'sumber_dana' => 'BOS'],
                    ['real_exemplar' => $parseExemplar($row[13]), 'potential_exemplar' => 0, 'target_exemplar' => 0, 'is_ac' => $ac2025]);

                // 2026 (Potensi & Ren Jual)
                $ac2026 = (int)($row[15] ?? 0) === 1 ? 1 : 0;
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => $year, 'sumber_dana' => 'SWA'],
                    ['real_exemplar' => 0, 'potential_exemplar' => $parseExemplar($row[17]), 'target_exemplar' => $parseExemplar($row[19]), 'is_ac' => $ac2026]);
                CustomerPlan::updateOrCreate(['customer_id' => $customer->id, 'year' => $year, 'sumber_dana' => 'BOS'],
                    ['real_exemplar' => 0, 'potential_exemplar' => $parseExemplar($row[18]), 'target_exemplar' => $parseExemplar($row[20]), 'is_ac' => $ac2026]);

                // Kalkulasi Tahan, Rebut, Lepas, Gagal
                $r24 = $parseExemplar($row[9] ?? 0) + $parseExemplar($row[10] ?? 0);
                $r25 = $parseExemplar($row[12] ?? 0) + $parseExemplar($row[13] ?? 0);
                
                $status = null;
                if ($r24 > 0 && $r25 > 0) $status = 'tahan_customer';
                elseif ($r24 == 0 && $r25 > 0) $status = 'rebut_customer';
                elseif ($r24 > 0 && $r25 == 0) $status = 'lepas_customer';
                elseif ($r24 == 0 && $r25 == 0) $status = 'gagal_customer';

                if ($status) {
                    $sId = $currentSales->id;
                    if (!isset($salesPlans[$sId])) {
                        $salesPlans[$sId] = ['TOTAL' => ['tahan_customer' => 0, 'rebut_customer' => 0, 'lepas_customer' => 0, 'gagal_customer' => 0]];
                    }
                    if (!isset($salesPlans[$sId][$currentJenjang])) {
                        $salesPlans[$sId][$currentJenjang] = ['tahan_customer' => 0, 'rebut_customer' => 0, 'lepas_customer' => 0, 'gagal_customer' => 0];
                    }

                    $salesPlans[$sId]['TOTAL'][$status]++;
                    $salesPlans[$sId][$currentJenjang][$status]++;
                }

                // Kalkulasi Trend Coverage (real_customer & target_customer) per tahun
                $sId = $currentSales->id;
                foreach ([2023, 2024, 2025, 2026] as $y) {
                    if (!isset($trendData[$sId][$y])) {
                        $trendData[$sId][$y] = ['real_customer' => 0, 'target_customer' => 0];
                    }
                    $trendData[$sId][$y]['target_customer']++;
                }
                
                $r23 = $parseExemplar($row[7] ?? 0) + $parseExemplar($row[8] ?? 0);
                if ($r23 > 0) $trendData[$sId][2023]['real_customer']++;
                if ($r24 > 0) $trendData[$sId][2024]['real_customer']++;
                if ($r25 > 0) $trendData[$sId][2025]['real_customer']++;
            }
        }

        // Simpan hasil kalkulasi Trend ke SalesPlan (untuk level TOTAL/jenjang=null)
        foreach ($trendData as $sId => $yearsData) {
            foreach ($yearsData as $y => $counts) {
                $salesPlan = \App\Models\SalesPlan::firstOrCreate(
                    ['sales_id' => $sId, 'year' => $y, 'jenjang' => null],
                    [
                        'tahan_customer' => 0, 'rebut_customer' => 0, 'lepas_customer' => 0, 'gagal_customer' => 0,
                        'real_customer' => 0, 'real_exemplar' => 0, 'ac_customer' => 0, 'potential_exemplar' => 0,
                        'target_customer' => 0, 'target_exemplar' => 0,
                    ]
                );
                $salesPlan->update([
                    'real_customer' => $counts['real_customer'],
                    'target_customer' => $counts['target_customer'],
                ]);
            }
        }

        // Simpan hasil kalkulasi TRLG ke SalesPlan
        foreach ($salesPlans as $sId => $jenjangs) {
            foreach ($jenjangs as $j => $counts) {
                $dbJenjang = $j === 'TOTAL' ? null : $j;
                
                // Kita gunakan updateOrCreate, tetapi karena mungkin data TAR sudah masuk dan kita tidak ingin mereset metric lain (seperti target_customer dsb),
                // lebih baik kita update field TRLG saja jika sudah ada, atau create baru dengan nilai default.
                $salesPlan = \App\Models\SalesPlan::firstOrCreate(
                    ['sales_id' => $sId, 'year' => $year, 'jenjang' => $dbJenjang],
                    [
                        'real_customer' => 0,
                        'real_exemplar' => 0,
                        'ac_customer' => 0,
                        'potential_exemplar' => 0,
                        'target_customer' => 0,
                        'target_exemplar' => 0,
                    ]
                );
                
                $salesPlan->update([
                    'tahan_customer' => $counts['tahan_customer'],
                    'rebut_customer' => $counts['rebut_customer'],
                    'lepas_customer' => $counts['lepas_customer'],
                    'gagal_customer' => $counts['gagal_customer'],
                ]);
            }
        }
    }
}
