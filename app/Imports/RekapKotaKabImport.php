<?php

namespace App\Imports;

use App\Models\Sales;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;
use App\Models\SalesCityPlan;

class RekapKotaKabImport implements ToCollection
{
    private $batchId;

    public function __construct($batchId)
    {
        $this->batchId = $batchId;
    }

    public function collection(Collection $rows)
    {
        $currentSales = null;
        
        foreach ($rows as $index => $row) {
            // Kolom B bisa berupa 'TOTAL :', 'Nama Sales', atau null
            $colB = trim((string)($row[1] ?? ''));
            // Kolom C bisa berupa 'KOTA TANGERANG', 'KAB. TANGERANG'
            $colC = trim((string)($row[2] ?? ''));

            if (empty($colB) && empty($colC)) {
                continue;
            }

            // Try to extract years from headers
            foreach ($row as $cell) {
                $cellStr = (string)$cell;
                if (preg_match('/REAL\s+(\d{4})/i', $cellStr, $matches)) {
                    if ($config = \App\Models\Configuration::orderBy('id', 'desc')->first()) {
                        $config->update(['prev_year' => $matches[1]]);
                    }
                }
                if (preg_match('/(?:REN\s*JUAL|TARGET)\s+(\d{4})/i', $cellStr, $matches)) {
                    if ($config = \App\Models\Configuration::orderBy('id', 'desc')->first()) {
                        $config->update(['target_year' => $matches[1]]);
                    }
                }
            }

            // Skip headers
            if (stripos($colB, 'SALES') !== false || stripos($colC, 'KAB / KOTA') !== false || stripos($colB, 'TOTAL :') !== false) {
                continue;
            }

            // Jika colB ada isinya dan bukan 'TOTAL :', maka itu adalah nama Sales
            if (!empty($colB)) {
                $name = $colB;
                $code = null;
                // Parse "Achmad Fauzi (123)"
                if (preg_match('/^(.*?)\((\d+)\)$/', $colB, $matches)) {
                    $name = trim($matches[1]);
                    $code = trim($matches[2]);
                }
                
                $currentSales = Sales::firstOrCreate(['name' => $name]);
                if ($code) {
                    $currentSales->update(['code' => $code]);
                }
                continue; // Lanjut ke baris kota/kab
            }

            // Jika colC ada isinya, berarti ini adalah baris KOTA / KAB
            if (!empty($colC) && $currentSales) {
                $cityName = $colC;

                // --- Parsing SWADANA ---
                $sw_real_cust = (int)str_replace(',', '', (string)($row[4] ?? 0));
                $sw_real_ex   = (int)str_replace(',', '', (string)($row[5] ?? 0));
                $sw_ac_cust   = (int)str_replace(',', '', (string)($row[6] ?? 0));
                $sw_potensi   = (int)str_replace(',', '', (string)($row[7] ?? 0));
                $sw_tar_cust  = (int)str_replace(',', '', (string)($row[8] ?? 0));
                $sw_tar_ex    = (int)str_replace(',', '', (string)($row[9] ?? 0));

                SalesCityPlan::updateOrCreate(
                    [
                        'sales_id' => $currentSales->id,
                        'city_name' => $cityName,
                        'sumber_dana' => 'SWADANA'
                    ],
                    [
                        'real_customer' => $sw_real_cust,
                        'real_exemplar' => $sw_real_ex,
                        'ac_customer'   => $sw_ac_cust,
                        'potensi'       => $sw_potensi,
                        'target_customer' => $sw_tar_cust,
                        'target_exemplar' => $sw_tar_ex,
                    ]
                );

                // --- Parsing BOS ---
                $bos_real_cust = (int)str_replace(',', '', (string)($row[10] ?? 0));
                $bos_real_ex   = (int)str_replace(',', '', (string)($row[11] ?? 0));
                $bos_ac_cust   = (int)str_replace(',', '', (string)($row[12] ?? 0));
                $bos_potensi   = (int)str_replace(',', '', (string)($row[13] ?? 0));
                $bos_tar_cust  = (int)str_replace(',', '', (string)($row[14] ?? 0));
                $bos_tar_ex    = (int)str_replace(',', '', (string)($row[15] ?? 0));

                SalesCityPlan::updateOrCreate(
                    [
                        'sales_id' => $currentSales->id,
                        'city_name' => $cityName,
                        'sumber_dana' => 'BOS'
                    ],
                    [
                        'real_customer' => $bos_real_cust,
                        'real_exemplar' => $bos_real_ex,
                        'ac_customer'   => $bos_ac_cust,
                        'potensi'       => $bos_potensi,
                        'target_customer' => $bos_tar_cust,
                        'target_exemplar' => $bos_tar_ex,
                    ]
                );

                // --- Parsing TOTAL ---
                $tot_real_cust = (int)str_replace(',', '', (string)($row[16] ?? 0)); 
                $tot_real_ex   = (int)str_replace(',', '', (string)($row[17] ?? 0));
                $tot_ac_cust   = (int)str_replace(',', '', (string)($row[18] ?? 0));
                $tot_potensi   = (int)str_replace(',', '', (string)($row[19] ?? 0));
                $tot_tar_cust  = (int)str_replace(',', '', (string)($row[20] ?? 0));
                $tot_tar_ex    = (int)str_replace(',', '', (string)($row[21] ?? 0));

                SalesCityPlan::updateOrCreate(
                    [
                        'sales_id' => $currentSales->id,
                        'city_name' => $cityName,
                        'sumber_dana' => 'TOTAL'
                    ],
                    [
                        'real_customer' => $tot_real_cust,
                        'real_exemplar' => $tot_real_ex,
                        'ac_customer'   => $tot_ac_cust,
                        'potensi'       => $tot_potensi,
                        'target_customer' => $tot_tar_cust,
                        'target_exemplar' => $tot_tar_ex,
                    ]
                );
            }
        }
    }
}
