<?php

namespace App\Imports;

use App\Models\Customer;
use App\Models\SalesActivity;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class AktivitasSalesPerCustomerImport implements ToCollection, WithChunkReading
{
    private static $truncated = false;
    private static $currentSales = null;
    private static $currentCustomer = null;
    private static $currentCustomerName = null;
    private static $currentRealLalu = 0;
    private static $currentRencanaJual = 0;
    private static $lastActivity = null;

    public function collection(Collection $rows)
    {
        if (!self::$truncated) {
            SalesActivity::query()->delete();
            self::$truncated = true;
            // Also reset state in case it's a new file import
            self::$currentSales = null;
            self::$currentCustomer = null;
            self::$currentCustomerName = null;
            self::$currentRealLalu = 0;
            self::$currentRencanaJual = 0;
            self::$lastActivity = null;
        }

        foreach ($rows as $index => $row) {
            // Mapping based on JSON structure
            $colSales = trim((string)($row[1] ?? '')); // Sales name is at index 1
            $colCustomer = trim((string)($row[2] ?? '')); // Customer name is at index 2
            
            $colRealLalu = trim((string)($row[4] ?? ''));
            $colRencanaJual = trim((string)($row[5] ?? ''));
            
            $colTanggal = trim((string)($row[6] ?? ''));
            $colAktivitas = trim((string)($row[7] ?? ''));
            $colHasil = trim((string)($row[8] ?? ''));

            // The keterangan could be in col1 or col2 if it's a subrow
            $colKeterangan = trim($colSales . ' ' . $colCustomer);

            // Parse Date
            $tanggal = $colTanggal;
            if (is_numeric($tanggal)) {
                try {
                    $tanggal = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($tanggal)->format('m/d/Y');
                } catch (\Exception $e) {
                    // ignore
                }
            }
            
            // Check if this row is a Sales row
            if (!empty($colSales) && preg_match('/^(.*?)\s*\(([a-zA-Z0-9_-]+)\)$/', $colSales, $matches)) {
                $name = trim($matches[1]);
                $code = trim($matches[2]);
                
                $isSales = preg_match('/[a-zA-Z]/', $code);
                
                if ($isSales) {
                    self::$currentSales = \App\Models\Sales::updateOrCreate(
                        ['code' => $code],
                        ['name' => $name]
                    );
                    
                    self::$currentCustomer = null;
                    self::$currentCustomerName = null;
                    self::$currentRealLalu = 0;
                    self::$currentRencanaJual = 0;
                    self::$lastActivity = null;
                    continue;
                }
            }

            // Check if this is a Customer row
            if (self::$currentSales && !empty($colCustomer) && preg_match('/^(.*?)\s*\(([a-zA-Z0-9_-]+)\)$/', $colCustomer, $matches)) {
                $isSales = preg_match('/[a-zA-Z]/', $matches[2]);
                if (!$isSales) {
                    $customerName = trim($matches[1]);
                    $customerNpsn = trim($matches[2]);

                    self::$currentCustomer = Customer::where('name', 'like', '%' . $customerName . '%')
                        ->first();
                        
                    self::$currentCustomerName = $customerName;

                    // Extract Real Lalu & Rencana Jual
                    self::$currentRealLalu = (int) str_replace(',', '', $colRealLalu);
                    self::$currentRencanaJual = (int) str_replace(',', '', $colRencanaJual);

                    if (!empty($tanggal) && !empty($colAktivitas)) {
                        self::$lastActivity = SalesActivity::create([
                            'sales_id'      => self::$currentSales->id,
                            'sales_name'    => self::$currentSales->name,
                            'customer_id'   => self::$currentCustomer ? self::$currentCustomer->id : null,
                            'customer_name' => self::$currentCustomerName,
                            'real_lalu'     => self::$currentRealLalu,
                            'rencana_jual'  => self::$currentRencanaJual,
                            'tanggal'       => $tanggal,
                            'aktivitas'     => $colAktivitas,
                            'hasil'         => $colHasil ?: null,
                            'keterangan'    => null,
                        ]);
                    }
                    continue;
                }
            }

            // If it's a Sub-row (Activity / Keterangan)
            if (self::$currentSales && self::$currentCustomerName && (!empty($colKeterangan) || !empty($tanggal) || !empty($colAktivitas))) {
                // If it's just a header row like "SALES" or "REAL LALU", skip it
                if ($colKeterangan === 'SALES' || str_contains($colSales, 'AKTIVITAS SALES PER CUSTOMER') || str_contains($colSales, 'PERIODE JUAL')) {
                    continue;
                }

                // Check if this row is a duplicate of the last activity (same date, aktivitas, hasil)
                if (self::$lastActivity && self::$lastActivity->tanggal == $tanggal && self::$lastActivity->aktivitas == $colAktivitas && self::$lastActivity->hasil == $colHasil) {
                    // It's a duplicate, just update the keterangan
                    if (!empty($colKeterangan)) {
                        self::$lastActivity->update(['keterangan' => $colKeterangan]);
                    }
                } else if (!empty($tanggal) && !empty($colAktivitas)) {
                    // It's a new activity for the same customer
                    self::$lastActivity = SalesActivity::create([
                        'sales_id'      => self::$currentSales->id,
                        'sales_name'    => self::$currentSales->name,
                        'customer_id'   => self::$currentCustomer ? self::$currentCustomer->id : null,
                        'customer_name' => self::$currentCustomerName,
                        'real_lalu'     => self::$currentRealLalu,
                        'rencana_jual'  => self::$currentRencanaJual,
                        'tanggal'       => $tanggal,
                        'aktivitas'     => $colAktivitas,
                        'hasil'         => $colHasil ?: null,
                        'keterangan'    => $colKeterangan ?: null,
                    ]);
                } else if (self::$lastActivity && empty($tanggal) && empty($colAktivitas) && !empty($colKeterangan)) {
                    // If date and activity are empty but there's a keterangan, append it to the last activity
                    $newKeterangan = self::$lastActivity->keterangan ? self::$lastActivity->keterangan . "\n" . $colKeterangan : $colKeterangan;
                    self::$lastActivity->update(['keterangan' => $newKeterangan]);
                }
            }
        }
    }

    public function chunkSize(): int
    {
        return 1000;
    }
}
