<?php

namespace App\Imports;

use App\Models\Sales;
use App\Models\Customer;
use App\Models\SalesProgress;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;

class TarImport implements ToCollection
{
    private $batchId;

    public function __construct($batchId)
    {
        $this->batchId = $batchId;
    }

    public function collection(Collection $rows)
    {
        $currentSales = null;
        $year = 2026;

        foreach ($rows as $index => $row) {
            $val = trim((string)($row[1] ?? ''));
            if (empty($val)) {
                continue;
            }

            // Skip header rows
            $headersToSkip = ['CABANG', 'PER TGL', 'SALES', 'JENJANG', 'REKAP AC SALES', 'PER SALES JENJANG'];
            $isHeader = false;
            foreach ($headersToSkip as $header) {
                if (stripos($val, $header) !== false) {
                    $isHeader = true;
                    break;
                }
            }
            if ($isHeader) {
                continue;
            }

            // Parse values
            $tahan_sp = (int)str_replace(',', '', (string)($row[6] ?? 0));
            $tahan_lepas = (int)str_replace(',', '', (string)($row[8] ?? 0));
            $rebut_sp = (int)str_replace(',', '', (string)($row[15] ?? 0));
            $rebut_gagal = (int)str_replace(',', '', (string)($row[17] ?? 0));

            // Check if Jenjang row: e.g. "1. SD / MI"
            if (preg_match('/^[0-9]\.\s*([a-zA-Z]+)/', $val, $m)) {
                if (!$currentSales) continue;
                
                $jenjang = trim($m[1]); // e.g., "SD"

                \App\Models\SalesPlan::updateOrCreate(
                    ['sales_id' => $currentSales->id, 'year' => $year, 'jenjang' => $jenjang],
                    [
                        'tahan_customer' => $tahan_sp,
                        'lepas_customer' => $tahan_lepas,
                        'rebut_customer' => $rebut_sp,
                        'gagal_customer' => $rebut_gagal,
                        // Add default 0 to prevent "Field doesn't have a default value" error
                        'real_customer' => 0,
                        'real_exemplar' => 0,
                        'ac_customer' => 0,
                        'potential_exemplar' => 0,
                        'target_customer' => 0,
                        'target_exemplar' => 0,
                    ]
                );
            } else {
                // If it's not empty, not a header, and not Jenjang, it must be Sales Name
                $name = $val;
                $code = null;
                if (preg_match('/^(.*?)\((\d+)\)$/', $val, $matches)) {
                    $name = trim($matches[1]);
                    $code = trim($matches[2]);
                }
                
                $currentSales = Sales::firstOrCreate(
                    ['name' => $name]
                );
                
                if ($code) {
                    $currentSales->update(['code' => $code]);
                }

                // Save the Total for this Sales
                \App\Models\SalesPlan::updateOrCreate(
                    ['sales_id' => $currentSales->id, 'year' => $year, 'jenjang' => null],
                    [
                        'tahan_customer' => $tahan_sp,
                        'lepas_customer' => $tahan_lepas,
                        'rebut_customer' => $rebut_sp,
                        'gagal_customer' => $rebut_gagal,
                        // Defaults
                        'real_customer' => 0,
                        'real_exemplar' => 0,
                        'ac_customer' => 0,
                        'potential_exemplar' => 0,
                        'target_customer' => 0,
                        'target_exemplar' => 0,
                    ]
                );
            }
        }
    }
}
