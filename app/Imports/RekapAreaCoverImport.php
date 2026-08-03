<?php

namespace App\Imports;

use App\Models\Sales;
use App\Models\SalesAreaCover;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

class RekapAreaCoverImport implements ToCollection
{
    private $batchId;

    // Kolom per jenjang (index 0-based)
    // SD:    1-6  (ac25_c, real25_c, real25_ex, ac26_c, tar_c, tar_ex)
    // SMP:   7-12
    // SMA:   13-18
    // SMK:   19-24
    // DLL:   25-30
    // TOTAL: 31-36
    private $jenjangMap = [
        'SD'    => 1,
        'SMP'   => 7,
        'SMA'   => 13,
        'SMK'   => 19,
        'DLL'   => 25,
        'TOTAL' => 31,
    ];

    public function __construct($batchId)
    {
        $this->batchId = $batchId;
    }

    private function int($val): int
    {
        return (int) str_replace(',', '', (string) ($val ?? 0));
    }

    public function collection(Collection $rows)
    {
        // Skip header rows: anything before row 8 (index 8 = GRAND TOTAL)
        $dataStarted = false;

        foreach ($rows as $row) {
            $col0 = trim((string)($row[0] ?? ''));

            if (empty($col0)) continue;

            // Try to extract years from header rows before data starts
            if (!$dataStarted) {
                foreach ($row as $cell) {
                    $cellStr = (string)$cell;
                    if (preg_match('/REAL\s+(\d{4})/i', $cellStr, $matches)) {
                        $prevYear = $matches[1];
                        if ($config = \App\Models\Configuration::orderBy('id', 'desc')->first()) {
                            $config->update(['prev_year' => $prevYear]);
                        }
                    }
                    if (preg_match('/(?:REN\s*JUAL|TARGET)\s+(\d{4})/i', $cellStr, $matches)) {
                        $targetYear = $matches[1];
                        if ($config = \App\Models\Configuration::orderBy('id', 'desc')->first()) {
                            $config->update(['target_year' => $targetYear]);
                        }
                    }
                }
            }

            // Skip header/title rows
            if (
                stripos($col0, 'REKAP') !== false ||
                stripos($col0, 'CABANG') !== false ||
                stripos($col0, 'SUMBER DANA') !== false ||
                $col0 === 'SALES' ||
                $col0 === 'GRAND TOTAL'
            ) {
                continue;
            }

            $dataStarted = true;

            // col0 is Sales name
            $salesName = $col0;
            // Skip rows that are sub-totals or numeric-only (GRAND TOTAL row has numeric col0)
            if (is_numeric($salesName)) continue;

            // Find or create the Sales
            $sales = Sales::updateOrCreate(
                ['name' => $salesName],
                []
            );

            // Loop through each jenjang and save
            foreach ($this->jenjangMap as $jenjang => $startIdx) {
                $ac_prev   = $this->int($row[$startIdx]     ?? 0);
                $real_c    = $this->int($row[$startIdx + 1] ?? 0);
                $real_ex   = $this->int($row[$startIdx + 2] ?? 0);
                $ac_curr   = $this->int($row[$startIdx + 3] ?? 0);
                $tar_c     = $this->int($row[$startIdx + 4] ?? 0);
                $tar_ex    = $this->int($row[$startIdx + 5] ?? 0);

                SalesAreaCover::updateOrCreate(
                    [
                        'sales_id' => $sales->id,
                        'jenjang'  => $jenjang,
                    ],
                    [
                        'ac_customer_prev'   => $ac_prev,
                        'real_customer_prev' => $real_c,
                        'real_exemplar_prev' => $real_ex,
                        'ac_customer_curr'   => $ac_curr,
                        'target_customer'    => $tar_c,
                        'target_exemplar'    => $tar_ex,
                    ]
                );
            }
        }
    }
}
