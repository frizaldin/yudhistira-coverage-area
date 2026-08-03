<?php

namespace Database\Seeders;

use App\Models\Province;
use Illuminate\Database\Seeder;

class ProvinceSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/Export_m_province.csv');

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
                'province_code' => (int) $row[0],
                'province_name' => trim($row[1]),
                'created_at'    => now(),
                'updated_at'    => now(),
            ];

            // Insert per 500 rows untuk performa
            if (count($batch) === 500) {
                Province::upsert($batch, ['province_code'], ['province_name']);
                $batch = [];
            }
        }

        if (!empty($batch)) {
            Province::upsert($batch, ['province_code'], ['province_name']);
        }

        fclose($handle);

        $this->command->info('Province seeded: ' . Province::count() . ' records.');
    }
}
