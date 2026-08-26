<?php

namespace App\Imports;

use App\Models\Cabang;
use App\Models\Customer;
use App\Models\Kecamatan;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MasterDapodikImport implements ToCollection, WithHeadingRow, WithChunkReading
{
    private $batchId;

    /** @var array<string, object|null> */
    private array $kecamatanCache = [];

    /** @var array<int, int|null> */
    private array $cabangAreaCache = [];

    public function __construct($batchId = null)
    {
        $this->batchId = $batchId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $custName = $this->str($row['cust_name'] ?? null);
            $npsn = $this->str($row['npsn'] ?? null);

            if ($custName === '' && $npsn === '') {
                continue;
            }

            $jenjangRaw = $this->str($row['tingkat'] ?? null) ?: $this->str($row['jenjang'] ?? null);
            $jenjang = $this->normalizeJenjang($jenjangRaw);

            $kecamatan = $this->str($row['kecamatan'] ?? null);
            $kota = $this->str($row['kota'] ?? null);
            $kecamatanName = $this->buildKecamatanName($kecamatan, $kota);

            $camatCode = $this->str($row['camat_code'] ?? null);
            $cabangId = null;
            $areaId = null;
            if ($camatCode !== '') {
                $kec = $this->resolveKecamatan($camatCode);
                if ($kec && $kec->cabang_id) {
                    $cabangId = (int) $kec->cabang_id;
                    $areaId = $this->resolveAreaId($cabangId);
                }
            }

            $siswa = isset($row['siswa']) && is_numeric($row['siswa'])
                ? (int) $row['siswa']
                : null;
            $segmen = $this->str($row['segmen'] ?? null);

            $query = Customer::query();
            if ($npsn !== '') {
                $query->where('npsn', $npsn);
            } else {
                $query->where('name', $custName);
                if ($cabangId) {
                    $query->where('cabang_id', $cabangId);
                }
            }

            $customer = $query->first() ?: new Customer();
            $isNew = ! $customer->exists;

            if ($custName !== '') {
                $customer->name = $custName;
            }
            if ($npsn !== '') {
                $customer->npsn = $npsn;
            }
            if ($jenjang !== '') {
                $customer->jenjang = $jenjang;
            }
            if ($kecamatanName !== '') {
                $customer->kecamatan_name = $kecamatanName;
            }
            if ($siswa !== null) {
                $customer->total_student = $siswa;
            }
            if ($segmen !== '') {
                $customer->penerbit = $segmen;
            }

            // Isi cabang/area hanya jika belum terisi (jangan timpa data customer cabang)
            if (! $customer->cabang_id && $cabangId) {
                $customer->cabang_id = $cabangId;
            }
            if (! $customer->area_id && $areaId) {
                $customer->area_id = $areaId;
            }

            // Master dapodik: sekolah baru = belum area cover
            if ($isNew) {
                $customer->is_active = 0;
            }

            $customer->save();
        }
    }

    public function chunkSize(): int
    {
        return 500;
    }

    private function str($value): string
    {
        if ($value === null) {
            return '';
        }
        return trim((string) $value);
    }

    private function normalizeJenjang(string $raw): string
    {
        if ($raw === '') {
            return '';
        }
        // "1. SD" / "5. MI" → "SD" / "MI"
        if (preg_match('/^\d+\.\s*(.+)$/u', $raw, $m)) {
            $raw = trim($m[1]);
        }
        return mb_strtoupper($raw);
    }

    private function buildKecamatanName(string $kecamatan, string $kota): string
    {
        $kec = mb_strtoupper($kecamatan);
        $kot = mb_strtoupper($kota);
        if ($kec !== '' && $kot !== '') {
            return $kec . ', ' . $kot;
        }
        return $kec !== '' ? $kec : $kot;
    }

    private function resolveKecamatan(string $camatCode): ?object
    {
        if (! array_key_exists($camatCode, $this->kecamatanCache)) {
            $this->kecamatanCache[$camatCode] = Kecamatan::query()
                ->where('camat_code', $camatCode)
                ->first(['camat_code', 'cabang_id']);
        }
        return $this->kecamatanCache[$camatCode];
    }

    private function resolveAreaId(int $cabangId): ?int
    {
        if (! array_key_exists($cabangId, $this->cabangAreaCache)) {
            $this->cabangAreaCache[$cabangId] = Cabang::query()
                ->where('id', $cabangId)
                ->value('area_id');
        }
        $areaId = $this->cabangAreaCache[$cabangId];
        return $areaId !== null ? (int) $areaId : null;
    }
}
