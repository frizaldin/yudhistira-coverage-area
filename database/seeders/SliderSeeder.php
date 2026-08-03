<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Slider;

class SliderSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['title' => 'MENU LEBARAN',  'image' => 'storage_seeder/sliders/1777516302_69f2bf0ed4a48.webp'],
        ] as $key => $item) {
            Slider::updateOrCreate(
                [
                    'title' => $item['title'],
                ],
                [
                    'image' => $item['image'],
                    'sort_order' => $key + 1,
                ]
            );
        }
    }
}
