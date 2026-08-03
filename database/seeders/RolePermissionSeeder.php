<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('role_permissions')->insert([
            [
                'id' => 1,
                'role_id' => 11,
                'menu_id' => 3,
                'action' => 'show',
                'created_at' => Carbon::parse('2026-04-20 14:35:30'),
                'updated_at' => null,
            ],
            [
                'id' => 2,
                'role_id' => 11,
                'menu_id' => 4,
                'action' => 'show,update',
                'created_at' => Carbon::parse('2026-04-20 14:35:30'),
                'updated_at' => null,
            ],
            [
                'id' => 8,
                'role_id' => 7,
                'menu_id' => 1,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 9,
                'role_id' => 7,
                'menu_id' => 2,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 10,
                'role_id' => 7,
                'menu_id' => 3,
                'action' => 'show',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 11,
                'role_id' => 7,
                'menu_id' => 4,
                'action' => 'show,update',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 12,
                'role_id' => 7,
                'menu_id' => 5,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 13,
                'role_id' => 7,
                'menu_id' => 6,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 14,
                'role_id' => 7,
                'menu_id' => 7,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 15,
                'role_id' => 7,
                'menu_id' => 8,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 16,
                'role_id' => 7,
                'menu_id' => 9,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 17,
                'role_id' => 7,
                'menu_id' => 10,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 18,
                'role_id' => 7,
                'menu_id' => 11,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 19,
                'role_id' => 7,
                'menu_id' => 12,
                'action' => 'show,create,update,delete',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 20,
                'role_id' => 7,
                'menu_id' => 13,
                'action' => 'show,update',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
            [
                'id' => 21,
                'role_id' => 7,
                'menu_id' => 14,
                'action' => 'show,update',
                'created_at' => Carbon::parse('2026-04-29 18:26:35'),
                'updated_at' => Carbon::parse('2026-04-29 18:26:35'),
            ],
        ]);
    }
}
