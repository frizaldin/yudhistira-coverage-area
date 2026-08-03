<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('configuration')->insert([
            [
                'id' => 1,

                'title' => 'LARAVEL + INERTIA (REACT)',
                'site_name' => 'LARAVEL + INERTIA (REACT)',
                'site_tagline' => 'Website Laravel Inertia React',
                'site_url' => 'http://localhost:8000',

                'logo' => 'storage_seeder/configuration/logo.png',
                'favicon' => 'storage_seeder/configuration/favicon.png',

                'address' => 'Bogor',
                'phone' => '0896823731',
                'whatsapp' => '62896823731',
                'email' => 'muhamadaderohayat122@gmail.com',

                'instagram' => 'https://instagram.com/example',
                'facebook' => 'https://facebook.com/example',
                'youtube' => 'https://youtube.com/example',

                'about_us' => 'Inertia.js dolor sit amet',

                'footer_description' => 'Website Laravel Inertia React',
                'footer_copyright' => '© 2026 Laravel Inertia React. All rights reserved.',
                'copyright' => '© 2026 Laravel Inertia React',

                'maintenance_mode' => false,

                'google_maps_embed' => null,
                'latitude' => -6.5971470,
                'longitude' => 106.8060390,

                'meta_title' => 'Laravel Inertia React',
                'meta_description' => 'Website Laravel Inertia React dengan backend Laravel 12 dan frontend React.',
                'meta_keywords' => 'laravel, inertia, react, website',
                'og_image' => 'storage_seeder/configuration/logo.png',

                'terms_conditions' => '
                    <h2>Terms & Conditions</h2>

                    <p>Selamat datang di website kami. Dengan mengakses dan menggunakan website ini, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.</p>

                    <h3>Penggunaan Website</h3>

                    <ul>
                        <li>Pengguna wajib menggunakan website secara sah dan bertanggung jawab.</li>
                        <li>Dilarang menggunakan website untuk aktivitas yang melanggar hukum.</li>
                        <li>Dilarang mengganggu keamanan, stabilitas, atau kinerja website.</li>
                    </ul>

                    <h3>Hak Kekayaan Intelektual</h3>

                    <p>Seluruh konten yang tersedia pada website ini merupakan milik pengelola website dan dilindungi oleh peraturan perundang-undangan yang berlaku.</p>

                    <h3>Batasan Tanggung Jawab</h3>

                    <p>Kami tidak bertanggung jawab atas kerugian yang timbul akibat penggunaan informasi yang tersedia pada website ini.</p>

                    <h3>Perubahan Ketentuan</h3>

                    <p>Kami berhak mengubah syarat dan ketentuan sewaktu-waktu tanpa pemberitahuan sebelumnya.</p>
                ',

                'privacy_policy' => '
                    <h2>Privacy Policy</h2>

                    <p>Kami menghargai dan melindungi privasi setiap pengguna website.</p>

                    <h3>Informasi yang Dikumpulkan</h3>

                    <ul>
                        <li>Nama lengkap</li>
                        <li>Alamat email</li>
                        <li>Nomor telepon</li>
                        <li>Informasi lain yang diberikan melalui formulir website</li>
                    </ul>

                    <h3>Penggunaan Informasi</h3>

                    <p>Informasi yang dikumpulkan digunakan untuk:</p>

                    <ul>
                        <li>Memberikan layanan kepada pengguna.</li>
                        <li>Menanggapi pertanyaan atau pengaduan.</li>
                        <li>Meningkatkan kualitas layanan website.</li>
                    </ul>

                    <h3>Perlindungan Data</h3>

                    <p>Kami berupaya menjaga keamanan data pengguna dengan menerapkan langkah-langkah teknis dan administratif yang wajar.</p>

                    <h3>Cookie</h3>

                    <p>Website ini dapat menggunakan cookie untuk meningkatkan pengalaman pengguna.</p>

                    <h3>Perubahan Kebijakan Privasi</h3>

                    <p>Kebijakan privasi ini dapat diperbarui sewaktu-waktu sesuai kebutuhan dan perkembangan layanan.</p>
                ',

                'created_at' => Carbon::parse('2026-04-21 00:08:14'),
                'updated_at' => Carbon::parse('2026-04-21 20:17:03'),
            ],
        ]);
    }
}
