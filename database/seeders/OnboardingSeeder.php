<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Onboarding;

class OnboardingSeeder extends Seeder
{
    public function run(): void
    {
        $description = 'Lorem Ipsum is a standard placeholder text used in printing, typesetting, and digital design, originating from classical Latin literature.';
        foreach ([
            ['title' => 'Problem', 'description' => $description, 'image' => 'storage_seeder/onboardings/1777516196_69f2bea4ecdb1.webp'],
            ['title' => 'Solution', 'description' => $description, 'image' => 'storage_seeder/onboardings/1777516211_69f2beb35d96f.webp'],
            ['title' => 'Certified', 'description' => $description, 'image' => 'storage_seeder/onboardings/1777516233_69f2bec97ac26.webp'],
        ] as $key => $item) {
            Onboarding::updateOrCreate(
                [
                    'title' => $item['title'],
                ],
                [
                    'description' => $item['description'],
                    'image' => $item['image'],
                    'sort_order' => $key + 1,
                ]
            );
        }
    }
}
