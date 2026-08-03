<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Daging Sapi',
                'image' => 'storage_seeder/product-categories/1777515960_69f2bdb824111.webp',
            ],
            [
                'name' => 'Daging Ayam',
                'image' => 'storage_seeder/product-categories/1777515973_69f2bdc56c026.webp',
            ],
            [
                'name' => 'Daging Ikan',
                'image' => 'storage_seeder/product-categories/1777515989_69f2bdd58bdfb.webp',
            ],
            [
                'name' => 'Bumbu Dapur',
                'image' => 'storage_seeder/product-categories/1777516004_69f2bde46682c.webp',
            ],
            [
                'name' => 'Sayur Sayuran',
                'image' => 'storage_seeder/product-categories/1777516022_69f2bdf6b74bd.webp',
            ],
            [
                'name' => 'Buah Buahan',
                'image' => 'storage_seeder/product-categories/1777516037_69f2be05d71e3.webp',
            ],
            [
                'name' => 'Frozen Food',
                'image' => 'storage_seeder/product-categories/1777516054_69f2be167ab22.webp',
            ],
            [
                'name' => 'Sembako',
                'image' => 'storage_seeder/product-categories/1777516068_69f2be2414425.webp',
            ],
        ];

        foreach ($categories as $category) {
            DB::table('product_categories')->updateOrInsert(
                ['slug' => Str::slug($category['name'])],
                [
                    'name' => $category['name'],
                    'image' => $category['image'],
                    'created_at' => now(),
                    'updated_at' => now(),
                    'deleted_at' => null,
                ]
            );
        }
    }
}
