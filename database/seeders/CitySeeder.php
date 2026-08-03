<?php

namespace Database\Seeders;

use App\Models\City;
use Illuminate\Database\Seeder;

class CitySeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/Export_m_city.csv');

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
                'city_code'     => (int) $row[0],
                'city_name'     => trim($row[1]),
                'province_code' => (int) $row[2],
                'region'        => isset($row[3]) && $row[3] !== '' ? (int) $row[3] : null,
                'region_b'      => isset($row[4]) && $row[4] !== '' ? (int) $row[4] : null,
                'region_c'      => isset($row[5]) && $row[5] !== '' ? (int) $row[5] : null,
                'region_s'      => isset($row[6]) && $row[6] !== '' ? (int) $row[6] : null,
                'created_at'    => now(),
                'updated_at'    => now(),
            ];

            if (count($batch) === 500) {
                City::upsert($batch, ['city_code'], ['city_name', 'province_code', 'region', 'region_b', 'region_c', 'region_s']);
                $batch = [];
            }
        }

        if (!empty($batch)) {
            City::upsert($batch, ['city_code'], ['city_name', 'province_code', 'region', 'region_b', 'region_c', 'region_s']);
        }

        fclose($handle);

        $this->command->info('City seeded: ' . City::count() . ' records.');
    }
}
