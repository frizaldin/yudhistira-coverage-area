<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->updateOrInsert(
            ['id' => 1],
            [
                'id' => 1,
                'name' => 'Applicator',
                'email' => 'applicator@gmail.com',
                'password' => bcrypt('password'),
                'role_id' => 7,
                'created_at' => Carbon::parse('2026-04-09 21:28:02'),
                'updated_at' => Carbon::parse('2026-04-21 01:59:52'),
            ]
        );
    }
}
