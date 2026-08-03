<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LogSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('logs')->insert([
            [
                'ip' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'url' => 'dashboard',
                'method' => 'GET',
                'created_at' => Carbon::parse('2026-04-21 20:38:24'),
            ],
            [
                'ip' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'url' => 'configuration',
                'method' => 'GET',
                'created_at' => Carbon::parse('2026-04-21 20:38:27'),
            ],
            [
                'ip' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'url' => 'users',
                'method' => 'GET',
                'created_at' => Carbon::parse('2026-04-21 20:38:42'),
            ],
            [
                'ip' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'url' => 'roles',
                'method' => 'GET',
                'created_at' => Carbon::parse('2026-04-21 20:38:44'),
            ],
        ]);
    }
}
