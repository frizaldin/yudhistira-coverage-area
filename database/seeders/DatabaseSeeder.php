<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ConfigurationSeeder::class,
            OnboardingSeeder::class,
            SliderSeeder::class,
            ProductCategorySeeder::class,
            MenuSeeder::class,
            RoleSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            LogSeeder::class,
            UnitSeeder::class,
            CategorySeeder::class,
            BlogSeeder::class,
            DivisionSeeder::class,
            FrontUserSeeder::class,
            // Geographic master data (urutan penting: Province → City → Kecamatan)
            ProvinceSeeder::class,
            CitySeeder::class,
            KecamatanSeeder::class,
        ]);
    }
}
