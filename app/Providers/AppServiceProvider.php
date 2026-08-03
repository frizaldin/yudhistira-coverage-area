<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use App\Models\Configuration;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('production')) {
            $this->app->usePublicPath(base_path('../'));
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        View::composer('mail::*', function ($view) {

            $config = cache()->remember('cache_config', now()->addMinutes(3), function () {
                return Configuration::first()?->toArray();
            });

            $view->with('config', $config);
        });
    }
}
