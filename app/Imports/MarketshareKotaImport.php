<?php

namespace App\Imports;

use App\Models\Area;
use App\Models\MarketShare;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;

class MarketshareKotaImport implements ToCollection
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
        $currentCityCode = null;

        foreach ($rows as $index => $row) {
            // Row 9: |  | KAB. TANGERANG |  | 2,086 | 611,015 | ...
            // City Row: column 1 has text, column 2 is empty, column 3 is numeric or empty
            if (!empty($row[1]) && empty($row[2]) && !str_contains(strtoupper((string)$row[1]), 'JENJANG') && !str_contains(strtoupper((string)$row[1]), 'KOTA/KAB') && !str_contains(strtoupper((string)$row[1]), 'PERIODE')) {
                // This is a City name (e.g. KAB. TANGERANG)
                $cityName = trim((string)$row[1]);
                
                // Cari city_code dari tabel cities
                $city = \App\Models\City::where('city_name', 'LIKE', '%' . $cityName . '%')->first();
                $currentCityCode = $city ? $city->city_code : null;

                continue;
            }

            // Sub levels inside the City (Jenjang Row)
            // column 1 is empty, column 2 has jenjang (e.g. "1. SD / MI")
            if (empty($row[1]) && !empty($row[2]) && preg_match('/^[0-9]\./', trim((string)$row[2]))) {
                $jenjangName = trim((string)$row[2]);
                
                $dapodikCust = (int)str_replace(',', '', $row[3] ?? 0);
                $dapodikSiswa = (int)str_replace(',', '', $row[4] ?? 0);
                $acCust = (int)str_replace(',', '', $row[9] ?? 0);
                $realCust2026 = (int)str_replace(',', '', $row[11] ?? 0);
                $realEx2026 = (int)str_replace(',', '', $row[13] ?? 0);

                $areaId = $this->areaId;
                $cabangId = $this->cabangId;

                MarketShare::updateOrCreate([
                    'area_id' => $areaId,
                    'cabang_id' => $cabangId,
                    'jenjang' => $jenjangName,
                    'city_code' => $currentCityCode
                ], [
                    'dapodik_customer' => $dapodikCust,
                    'dapodik_student' => $dapodikSiswa,
                    'ac_customer' => $acCust,
                    'real_customer' => $realCust2026,
                    'real_exemplar' => $realEx2026,
                ]);
            }
        }
    }
}
