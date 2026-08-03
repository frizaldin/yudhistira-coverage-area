<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Blog;
use App\Models\Category;
use Carbon\Carbon;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::all();

        foreach ($categories as $category) {
            for ($i = 1; $i <= 2; $i++) {

                $title = $category->name . " Article " . $i;

                Blog::updateOrCreate(
                    [
                        'slug' => Str::slug($title),
                    ],
                    [
                        'category_id' => $category->id,
                        'title' => $title,
                        'excerpt' => "This is a short excerpt for {$title}.",
                        'content' => $this->generateContent($title),
                        'image' => 'https://picsum.photos/800/600?random=' . rand(1, 1000),
                        'status' => collect(['draft', 'published'])->random(),
                        'published_at' => Carbon::now()->subDays(rand(0, 30)),
                    ]
                );
            }
        }
    }

    private function generateContent($title)
    {
        return "
            <h2>{$title}</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.</p>

            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur.</p>
        ";
    }
}
