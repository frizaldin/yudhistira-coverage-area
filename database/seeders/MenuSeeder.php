<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('menus')->insert([
            ['id' => 1, 'name' => 'Roles', 'key' => 'roles', 'action' => 'crud'],
            ['id' => 2, 'name' => 'Users', 'key' => 'users', 'action' => 'crud'],
            ['id' => 3, 'name' => 'Dashboard', 'key' => 'dashboard', 'action' => 'show'],
            ['id' => 4, 'name' => 'Configuration', 'key' => 'configuration', 'action' => 'update'],
            ['id' => 5, 'name' => 'Product Categories', 'key' => 'product-categories', 'action' => 'crud'],
            ['id' => 6, 'name' => 'Units', 'key' => 'units', 'action' => 'crud'],
            ['id' => 7, 'name' => 'Categories', 'key' => 'categories', 'action' => 'crud'],
            ['id' => 8, 'name' => 'Blogs', 'key' => 'blogs', 'action' => 'crud'],
            ['id' => 9, 'name' => 'Onboardings', 'key' => 'onboardings', 'action' => 'crud'],
            ['id' => 10, 'name' => 'Sliders', 'key' => 'sliders', 'action' => 'crud'],
            ['id' => 11, 'name' => 'Accounts', 'key' => 'accounts', 'action' => 'crud'],
            ['id' => 12, 'name' => 'Divisions', 'key' => 'divisions', 'action' => 'crud'],
            ['id' => 13, 'name' => 'Terms & Conditions', 'key' => 'terms-conditions', 'action' => 'update'],
            ['id' => 14, 'name' => 'Privacy Policy', 'key' => 'privacy-policy', 'action' => 'update'],
        ]);
    }
}
