<?php

namespace App\Imports;

use App\Models\Sales;
use App\Models\Customer;
use App\Models\CustomerPlan;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

class Rjs2Import implements ToCollection
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
        $year = 2026;
        $salesRealizations = [];

        foreach ($rows as $index => $row) {
            // Data starts when index 1 is numeric (NO column)
            if (isset($row[1]) && is_numeric(trim((string)$row[1])) && !empty($row[4]) && !empty($row[5])) {
                $npsnCode = trim((string)$row[4]);
                $customerName = trim((string)$row[5]);
                
                // Get Sales from KODE SALES or SALES name
                $salesCode = trim((string)$row[2]);
                $salesName = trim((string)$row[3]);
                
                if (empty($salesName)) continue;

                $currentSales = Sales::firstOrCreate(['name' => $salesName]);
                if ($salesCode) {
                    $currentSales->update(['code' => $salesCode]);
                }

                $jenjangRaw = trim((string)($row[28] ?? ''));
                $currentJenjang = null;
                if (preg_match('/^[0-9]\.\s*([a-zA-Z]+)/', $jenjangRaw, $m)) {
                    $currentJenjang = trim($m[1]);
                } elseif (!empty($jenjangRaw)) {
                    $currentJenjang = strtoupper(trim($jenjangRaw));
                }

                $areaId = $this->areaId;
                $cabangId = $this->cabangId;
                if (!$areaId || !$cabangId) {
                    continue;
                }

                $parseExemplar = fn($val) => (int)str_replace(',', '', (string)($val ?? 0));
                
                $getDana = function($val) {
                    $dana = trim((string)$val);
                    if (str_contains($dana, 'SWA-BOS')) return 'SWA';
                    return empty($dana) ? 'SWA' : $dana;
                };

                $dana2024 = $getDana($row[8] ?? '');
                $dana2025 = $getDana($row[9] ?? '');
                $dana2026 = $getDana($row[10] ?? '');

                $kota = trim((string) ($row[6] ?? ''));
                $kecamatan = trim((string) ($row[7] ?? ''));
                if ($kecamatan !== '' && $kota !== '') {
                    $kecamatanName = $kecamatan . ', ' . $kota;
                } elseif ($kecamatan !== '') {
                    $kecamatanName = $kecamatan;
                } elseif ($kota !== '') {
                    $kecamatanName = $kota;
                } else {
                    $kecamatanName = null;
                }

                // Match Customer
                $matchData = [
                    'name' => $customerName,
                    'jenjang' => $currentJenjang,
                    'area_id' => $areaId,
                    'cabang_id' => $cabangId,
                    'sales_id' => $currentSales->id
                ];

                $updateData = [
                    'kecamatan_name' => $kecamatanName,
                    'total_student' => $parseExemplar($row[11]),
                    'sumber_dana' => $dana2026,
                    'penerbit' => trim((string)$row[22]) // PESAING 1
                ];
                
                if ($npsnCode) {
                    $updateData['npsn'] = $npsnCode;
                }

                $customer = Customer::updateOrCreate($matchData, $updateData);

                // Past years realisasi
                $cp23 = CustomerPlan::firstOrCreate(['customer_id' => $customer->id, 'year' => 2023, 'sumber_dana' => $dana2024], ['real_exemplar' => 0, 'potential_exemplar' => 0, 'target_exemplar' => 0]);
                $cp23->update(['real_exemplar' => $parseExemplar($row[12] ?? 0)]);

                $cp24 = CustomerPlan::firstOrCreate(['customer_id' => $customer->id, 'year' => 2024, 'sumber_dana' => $dana2024], ['real_exemplar' => 0, 'potential_exemplar' => 0, 'target_exemplar' => 0]);
                $cp24->update(['real_exemplar' => $parseExemplar($row[13] ?? 0)]);

                $cp25 = CustomerPlan::firstOrCreate(['customer_id' => $customer->id, 'year' => 2025, 'sumber_dana' => $dana2025], ['real_exemplar' => 0, 'potential_exemplar' => 0, 'target_exemplar' => 0]);
                $cp25->update(['real_exemplar' => $parseExemplar($row[14] ?? 0)]);

                // 2026 Data
                $potensiSwa = $parseExemplar($row[15] ?? 0);
                $potensiBos = $parseExemplar($row[16] ?? 0);
                $rencanaSwa = $parseExemplar($row[17] ?? 0);
                $rencanaBos = $parseExemplar($row[18] ?? 0);
                $spSwa = $parseExemplar($row[19] ?? 0);
                $spBos = $parseExemplar($row[20] ?? 0);
                $swaFaktur = $parseExemplar($row[26] ?? 0);
                $bosFaktur = $parseExemplar($row[27] ?? 0);
                
                $potensi = $potensiSwa + $potensiBos;
                $rencana = $rencanaSwa + $rencanaBos;
                $totalSp = $spSwa + $spBos;
                $totalRealExemplar = $swaFaktur + $bosFaktur;

                // Update data for 2026 (Split SWA & BOS)
                CustomerPlan::updateOrCreate(
                    ['customer_id' => $customer->id, 'year' => $year, 'sumber_dana' => 'SWA'],
                    [
                        'real_exemplar' => $swaFaktur,
                        'potential_exemplar' => $potensiSwa,
                        'target_exemplar' => $rencanaSwa,
                        'sp_exemplar' => $spSwa,
                    ]
                );

                CustomerPlan::updateOrCreate(
                    ['customer_id' => $customer->id, 'year' => $year, 'sumber_dana' => 'BOS'],
                    [
                        'real_exemplar' => $bosFaktur,
                        'potential_exemplar' => $potensiBos,
                        'target_exemplar' => $rencanaBos,
                        'sp_exemplar' => $spBos,
                    ]
                );

                // Collect realization for SalesPlan aggregation
                $sId = $currentSales->id;
                if (!isset($salesRealizations[$sId])) {
                    $salesRealizations[$sId] = ['TOTAL' => ['real' => 0, 'potensi' => 0, 'rencana' => 0, 'sp' => 0]];
                }
                if (!isset($salesRealizations[$sId][$currentJenjang])) {
                    $salesRealizations[$sId][$currentJenjang] = ['real' => 0, 'potensi' => 0, 'rencana' => 0, 'sp' => 0];
                }
                $salesRealizations[$sId]['TOTAL']['real'] += $totalRealExemplar;
                $salesRealizations[$sId]['TOTAL']['potensi'] += $potensi;
                $salesRealizations[$sId]['TOTAL']['rencana'] += $rencana;
                $salesRealizations[$sId]['TOTAL']['sp'] += $totalSp;
                
                if ($currentJenjang) {
                    $salesRealizations[$sId][$currentJenjang]['real'] += $totalRealExemplar;
                    $salesRealizations[$sId][$currentJenjang]['potensi'] += $potensi;
                    $salesRealizations[$sId][$currentJenjang]['rencana'] += $rencana;
                    $salesRealizations[$sId][$currentJenjang]['sp'] += $totalSp;
                }
            }
        }

        // Simpan hasil akumulasi ke SalesPlan
        foreach ($salesRealizations as $sId => $jenjangs) {
            foreach ($jenjangs as $j => $data) {
                $dbJenjang = $j === 'TOTAL' ? null : $j;
                
                $salesPlan = \App\Models\SalesPlan::firstOrCreate(
                    ['sales_id' => $sId, 'year' => $year, 'jenjang' => $dbJenjang],
                    [
                        'tahan_customer' => 0, 'rebut_customer' => 0, 'lepas_customer' => 0, 'gagal_customer' => 0,
                        'real_customer' => 0, 'real_exemplar' => 0, 'sp_exemplar' => 0, 'ac_customer' => 0, 'potential_exemplar' => 0,
                        'target_customer' => 0, 'target_exemplar' => 0,
                    ]
                );
                
                $salesPlan->update([
                    'real_exemplar' => $data['real'],
                    'potential_exemplar' => $data['potensi'],
                    'target_exemplar' => $data['rencana'],
                    'sp_exemplar' => $data['sp'] ?? 0,
                ]);
            }
        }
    }
}
