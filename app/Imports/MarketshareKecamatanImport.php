<?php

namespace App\Imports;

use App\Models\Area;
use App\Models\MarketShare;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;

class MarketshareKecamatanImport implements ToCollection
{
    private $batchId;
    private $cabangId;
    private $areaId;
    private $currentDistrictCode;

    public function __construct($batchId, $cabangId = null, $areaId = null)
    {
        $this->batchId = $batchId;
        $this->cabangId = $cabangId;
        $this->areaId = $areaId;
        $this->currentDistrictCode = null;
    }

    public function collection(Collection $rows)
    {
        $currentCity = null;

        foreach ($rows as $index => $row) {
            // Row 9: |  | KAB. TANGERANG |  |  | 2,086 | ...
            if (!empty($row[1]) && empty($row[2]) && empty($row[3]) && !str_contains(strtoupper((string)$row[1]), 'JENJANG') && !str_contains(strtoupper((string)$row[1]), 'KOTA/KAB') && !str_contains(strtoupper((string)$row[1]), 'PERIODE')) {
                $cityName = trim((string)$row[1]);
                $currentCity = $cityName;
                // It might have data, but we already parsed city totals from KotaImport.
                continue;
            }

            // Row 15: |  |  | BALARAJA |  | 75 | ...
            if (empty($row[1]) && !empty($row[2]) && empty($row[3]) && !preg_match('/^[0-9]\./', trim((string)$row[2])) && !str_contains(strtoupper((string)$row[2]), 'DLL')) {
                $districtName = trim((string)$row[2]);
                
                if ($this->cabangId) {
                    $currentDistrict = \App\Models\Kecamatan::where('camat_name', $districtName)->first();
                    
                    if ($currentDistrict) {
                        $this->currentDistrictCode = $currentDistrict->camat_code;
                        
                        // Total for District
                        $dapodikCust = (int)str_replace(',', '', $row[4] ?? 0);
                        $dapodikSiswa = (int)str_replace(',', '', $row[5] ?? 0);
                        $acCust = (int)str_replace(',', '', $row[10] ?? 0);
                        $realCust2026 = (int)str_replace(',', '', $row[12] ?? 0);

                        $currentDistrict->update([
                            'cabang_id' => $this->cabangId,
                            'dapodik_customer' => $dapodikCust,
                            'dapodik_student' => $dapodikSiswa,
                            'ac_customer' => $acCust,
                            'real_customer' => $realCust2026,
                        ]);
                    } else {
                        $this->currentDistrictCode = null;
                    }
                }
                continue;
            }

            // Jenjang Row under Kecamatan (or City)
            // |  |  |  | 1. SD / MI | 44 | ...
            if (empty($row[1]) && empty($row[2]) && !empty($row[3]) && preg_match('/^[0-9]\./', trim((string)$row[3]))) {
                $jenjangName = trim((string)$row[3]);
                
                // Only insert if it belongs to a District, because City jenjangs are handled by MarketshareKotaImport
                if ($this->currentDistrictCode && $this->areaId && $this->cabangId) {
                    $dapodikCust = (int)str_replace(',', '', $row[4] ?? 0);
                    $dapodikSiswa = (int)str_replace(',', '', $row[5] ?? 0);
                    $acCust = (int)str_replace(',', '', $row[10] ?? 0);
                    $realCust2026 = (int)str_replace(',', '', $row[12] ?? 0);
                    $realEx2026 = (int)str_replace(',', '', $row[14] ?? 0);

                    \App\Models\MarketShare::updateOrCreate([
                        'area_id' => $this->areaId,
                        'cabang_id' => $this->cabangId,
                        'kecamatan_code' => $this->currentDistrictCode,
                        'jenjang' => $jenjangName
                    ], [
                        'dapodik_customer' => $dapodikCust,
                        'dapodik_student' => $dapodikSiswa,
                        'ac_customer' => $acCust,
                        'real_customer' => $realCust2026,
                        'real_exemplar' => $realEx2026,
                    ]);
                }
                continue;
            }
        }
    }
}
