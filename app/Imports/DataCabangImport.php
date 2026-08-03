<?php

namespace App\Imports;

use App\Models\Area;
use App\Models\Cabang;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DataCabangImport implements ToCollection, WithHeadingRow
{
    private $batchId;

    public function __construct($batchId)
    {
        $this->batchId = $batchId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $kodeCabang = isset($row['kode_cabang']) ? trim((string)$row['kode_cabang']) : null;
            $namaCabang = isset($row['nama_cabang']) ? trim((string)$row['nama_cabang']) : null;
            $namaArea   = isset($row['nama_area']) ? trim((string)$row['nama_area']) : null;

            if (empty($kodeCabang) || empty($namaArea)) {
                continue;
            }

            $area = Area::firstOrCreate([
                'name' => $namaArea
            ]);

            Cabang::updateOrCreate(
                ['kode_cabang' => $kodeCabang],
                [
                    'area_id' => $area->id,
                    'nama_cabang' => $namaCabang
                ]
            );
        }
    }
}
