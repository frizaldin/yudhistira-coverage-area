<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->updateOrInsert(
            ['id' => 7],
            [
                'id' => 7,
                'name' => 'Admin',
                'type' => 'office',
                'created_at' => Carbon::parse('2026-04-13 23:14:41'),
                'updated_at' => Carbon::parse('2026-04-13 23:14:41'),
            ]
        );
        DB::table('roles')->updateOrInsert(
            ['id' => 11],
            [
                'id' => 11,
                'type' => 'office',
                'name' => 'Sub Admin',
                'created_at' => Carbon::parse('2026-04-14 01:55:23'),
                'updated_at' => Carbon::parse('2026-04-14 01:55:23'),
            ]
        );
    }
}
