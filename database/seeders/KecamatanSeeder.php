<?php

namespace Database\Seeders;

use App\Models\Kecamatan;
use Illuminate\Database\Seeder;

class KecamatanSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/Export_m_kecamatan.csv');

        if (!file_exists($path)) {
            $this->command->error("File not found: $path");
            return;
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle); // skip header row

        $batch = [];

        while (($row = fgetcsv($handle)) !== false) {
            if (empty($row[0])) continue;

            $batch[] = [
                'camat_code' => (int) $row[0],
                'city_code'  => (int) $row[1],
                'camat_name' => trim($row[2]),
                'geomap'     => isset($row[3]) && $row[3] !== '' ? trim($row[3]) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) === 500) {
                Kecamatan::upsert($batch, ['camat_code'], ['city_code', 'camat_name', 'geomap']);
                $batch = [];
            }
        }

        if (!empty($batch)) {
            Kecamatan::upsert($batch, ['camat_code'], ['city_code', 'camat_name', 'geomap']);
        }

        fclose($handle);

        $this->command->info('Kecamatan seeded: ' . Kecamatan::count() . ' records.');
    }
}
