<?php

namespace App\Services;

use App\Models\Configuration;
use Illuminate\Http\Request;

class ConfigurationServices
{
    function update(Request $request, array $params)
    {
        try {
            $request->validate([
                'title' => 'required',
                'logo' => 'nullable|image',
                'favicon' => 'nullable|image',
                'og_image' => 'nullable|image',
            ], [
                'title.required' => 'Title is required.',
                'logo.image' => 'Logo must be an image.',
                'favicon.image' => 'Favicon must be an image.',
                'og_image.image' => 'OG Image must be an image.',
            ]);

            $find = Configuration::orderBy('id', 'desc')->first();

            if ($request->file('logo') && !$find?->logo ?? false) {
                $request->validate([
                    'logo' => 'required',
                ], [
                    'logo.required' => 'Logo is required.',
                ]);
            }

            if ($request->file('favicon') && !$find?->favicon ?? false) {
                $request->validate([
                    'favicon' => 'required',
                ], [
                    'favicon.required' => 'Favicon is required.',
                ]);
            }

            if ($request->file('og_image') && !$find?->og_image ?? false) {
                $request->validate([
                    'og_image' => 'required',
                ], [
                    'og_image.required' => 'OG Image is required.',
                ]);
            }

            $post = [
                'title' => $request->title,

                'site_name' => $request->site_name,
                'site_tagline' => $request->site_tagline,
                'site_url' => $request->site_url,

                'address' => $request->address,
                'phone' => $request->phone,
                'whatsapp' => $request->whatsapp,
                'email' => $request->email,

                'instagram' => $request->instagram,
                'facebook' => $request->facebook,
                'youtube' => $request->youtube,

                'about_us' => $request->about_us,

                'footer_description' => $request->footer_description,
                'footer_copyright' => $request->footer_copyright,
                'copyright' => $request->copyright,

                'maintenance_mode' => $request->boolean('maintenance_mode'),

                'google_maps_embed' => $request->google_maps_embed,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,

                'meta_title' => $request->meta_title,
                'meta_description' => $request->meta_description,
                'meta_keywords' => $request->meta_keywords,

                'logo' => $request->file('logo')
                    ? uploadFile(
                        $request->file('logo'),
                        'storage/' . $params['code']
                    )
                    : ($find?->logo ?? null),

                'favicon' => $request->file('favicon')
                    ? uploadFile(
                        $request->file('favicon'),
                        'storage/' . $params['code']
                    )
                    : ($find?->favicon ?? null),

                'og_image' => $request->file('og_image')
                    ? uploadFile(
                        $request->file('og_image'),
                        'storage/' . $params['code']
                    )
                    : ($find?->og_image ?? null),
            ];

            if ($find) {
                $old_file = [
                    'logo' => $find->logo,
                    'favicon' => $find->favicon,
                    'og_image' => $find->og_image,
                ];

                $find->update($post);

                if ($request->file('logo')) {
                    removeFile($old_file['logo']);
                }

                if ($request->file('favicon')) {
                    removeFile($old_file['favicon']);
                }

                if ($request->file('og_image')) {
                    removeFile($old_file['og_image']);
                }
            } else {
                $create = Configuration::create($post);
            }

            return redirect()
                ->route($params['code'].'.index')
                ->with('success', $params['title'].' has been updated successfully.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => $th->getMessage()
            ]);
        }
    }

    function terms_conditions(Request $request, array $params)
    {
        try {
            $find = Configuration::orderBy('id', 'desc')->first();

            $post = [
                'terms_conditions' => $request->terms_conditions,
            ];

            $find->update($post);

            return redirect()
                ->route($params['code'].'.index')
                ->with('success', $params['title'].' has been updated successfully.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => $th->getMessage()
            ]);
        }
    }

    function privacy_policy(Request $request, array $params)
    {
        try {
            $find = Configuration::orderBy('id', 'desc')->first();

            $post = [
                'privacy_policy' => $request->privacy_policy,
            ];

            $find->update($post);

            return redirect()
                ->route($params['code'].'.index')
                ->with('success', $params['title'].' has been updated successfully.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => $th->getMessage()
            ]);
        }
    }
}
