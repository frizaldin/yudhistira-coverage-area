<?php

namespace App\Imports;

use App\Models\Customer;
use App\Models\Cabang;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class DataCustomerCabangImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    private $batchId;
    private $cabangId;
    private $areaId;

    public function __construct($batchId = null, $cabangId = null, $areaId = null)
    {
        $this->batchId = $batchId;
        $this->cabangId = $cabangId;
        $this->areaId = $areaId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $custName = isset($row['cust_name']) ? trim((string)$row['cust_name']) : null;
            $npsn = isset($row['npsn']) ? trim((string)$row['npsn']) : null;
            
            if (empty($custName)) {
                continue;
            }
            
            $branchCode = isset($row['branch_code']) ? trim((string)$row['branch_code']) : null;
            $cabangId = $this->cabangId;
            $areaId = $this->areaId;
            
            if ($branchCode && !$cabangId) {
                $cabang = Cabang::where('kode_cabang', $branchCode)->first();
                if ($cabang) {
                    $cabangId = $cabang->id;
                    $areaId = $cabang->area_id;
                }
            }

            $attributes = [];
            if (!empty($npsn)) {
                $attributes['npsn'] = $npsn;
            } else {
                $attributes['name'] = $custName;
                if ($cabangId) {
                    $attributes['cabang_id'] = $cabangId;
                }
            }

            Customer::updateOrCreate(
                $attributes,
                [
                    'name' => $custName,
                    'npsn' => $npsn,
                    'cabang_id' => $cabangId,
                    'area_id' => $areaId,
                    'jenjang' => isset($row['jenjang']) ? trim((string)$row['jenjang']) : null,
                    'kecamatan_name' => isset($row['camat_kode']) ? trim((string)$row['camat_kode']) : null,
                    'is_active' => isset($row['active']) ? (int)$row['active'] : 1,
                    'penerbit' => isset($row['segmen']) ? trim((string)$row['segmen']) : null,
                ]
            );
        }
    }

    public function chunkSize(): int
    {
        return 500;
    }
}
