<?php

namespace App\Http\Middleware;

use App\Models\Configuration;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $configuration = Configuration::orderBy('id', 'desc')
            ->first();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => function () use ($request) {
                    if (Auth::guard('front_user')->check()) {
                        return $request->user();
                    }

                    if ($request->user()) {
                        return $request->user()->load('role.permissions.menu');
                    }

                    return null;
                },
            ],

            'menuIcons' => config('menu-icons'),

            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'configuration' => [
                'title' => $configuration->title,
                'logo' => $configuration->url_logo,
                'favicon' => $configuration->url_favicon,
                'og_image' => $configuration->url_og_image,
                'address' => $configuration->address,
                'phone' => $configuration->phone,
                'whatsapp' => $configuration->whatsapp,
                'email' => $configuration->email,
                'instagram' => $configuration->instagram,
                'facebook' => $configuration->facebook,
                'youtube' => $configuration->youtube,
                'about_us' => $configuration->about_us,
                'footer_description' => $configuration->footer_description,
                'footer_copyright' => $configuration->footer_copyright,
                'maintenance_mode' => $configuration->maintenance_mode,
                'google_maps_embed' => $configuration->google_maps_embed,
                'latitude' => $configuration->latitude,
                'longitude' => $configuration->longitude,
                'meta_title' => $configuration->meta_title,
                'meta_description' => $configuration->meta_description,
                'meta_keywords' => $configuration->meta_keywords,
                'site_name' => $configuration->site_name,
                'site_tagline' => $configuration->site_tagline,
                'site_url' => $configuration->site_url,
                'copyright' => $configuration->copyright,
                'terms_conditions' => $configuration->terms_conditions,
                'privacy_policy' => $configuration->privacy_policy,
                'prev_year' => $configuration->prev_year ?? '2025',
                'target_year' => $configuration->target_year ?? '2026',
                'updated_at' => $configuration->updated_at,
            ]
        ];
    }
}
