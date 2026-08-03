<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DivisionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $divisions = [

            /**
             * Ketua
             */
            'Human Resources (HR)',
            'Advokat (Litigasi)',
            'Paralegal (Non-Litigasi)',
            'Luar Negeri, Imigrasi dan Ketenagakerjaan',
            'Pendidikan, Pelatihan, dan ESDM',
            'Perlindungan Perempuan dan Anak',
            'UMKM, Bisnis dan Investasi',
            'Seni, Budaya dan Olahraga',
            'Informasi, Teknologi dan Media (ITM)',
            'Teritorial Zona dan Wilayah',
            'KeAgamaan',

            /**
             * Sekretaris
             */
            'Kesekretariatan',
            'Asset Management',
            'Hubungan Masyarakat dan Lembaga (Humasla)',
            'Administrasi Ketatanegaraan',
            'Administrasi Kepidanaan',
            'Administrasi Keperdataan',

            /**
             * Struktur wilayah
             */
            'Kecamatan',
            'Kelurahan / Desa',
            'Mitra RW',
            'Mitra RT',

            /**
             * Dewan
             */
            'Dewan Pembina',
            'Dewan Penasihat',
            'Dewan Pakar',
        ];

        foreach ($divisions as $division) {

            DB::table('divisions')->insert([
                'name' => $division,

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
