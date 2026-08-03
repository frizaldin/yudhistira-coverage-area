<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            'Pcs',
            'Kg',
            'Gram',
            'Liter',
            'Ml',
            'Meter',
            'Cm',
            'Mm',
            'Box',
            'Pack',
            'Dus',
            'Lusin',
            'Kodi',
            'Ton',
            'Unit',
            'Set',
        ];

        foreach ($units as $unit) {
            DB::table('units')->insert([
                'name' => $unit,
                'slug' => Str::slug($unit),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
