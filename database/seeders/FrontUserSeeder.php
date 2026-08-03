<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Faker\Factory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FrontUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Factory::create('id_ID');

        /**
         * ============================================
         * CREATE USERS
         * ============================================
         */
        for ($i=0; $i < 15; $i++) {
            $gender = $faker->randomElement(['M', 'F']);

            $name = $gender == 'M'
                ? $faker->firstNameMale() . ' ' . $faker->lastName()
                : $faker->firstNameFemale() . ' ' . $faker->lastName();

            $userId = DB::table('front_users')->insertGetId([
                'name' => $name,

                'email' => Str::slug($name, '.') . '@gmail.com',

                'phone_number' => '08' . rand(1111111111, 9999999999),

                'active' => '1',

                'email_verified_at' => now(),

                'password' => Hash::make('password'),

                'avatar' => 'https://randomuser.me/api/portraits/' .
                    ($gender == 'M' ? 'men/' : 'women/') .
                    rand(1, 99) . '.jpg',

                'gender' => $gender,

                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
