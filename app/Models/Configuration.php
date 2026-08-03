<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuration extends Model
{
    protected $table = 'configuration';

    protected $fillable = [
        'title',
        'logo',
        'favicon',
        'address',
        'phone',
        'whatsapp',
        'email',
        'instagram',
        'facebook',
        'youtube',
        'about_us',
        'footer_description',
        'footer_copyright',
        'maintenance_mode',
        'google_maps_embed',
        'latitude',
        'longitude',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
        'site_name',
        'site_tagline',
        'site_url',
        'copyright',
        'terms_conditions',
        'privacy_policy',
        'prev_year',
        'target_year'
    ];

    protected $appends = [
        'url_logo',
        'url_favicon',
        'url_og_image',
    ];

    function getUrlLogoAttribute()
    {
        if (!$this->logo) {
            return false;
        }
        return env('VITE_FILE_URL').$this->logo;
    }

    function getUrlFaviconAttribute()
    {
        if (!$this->favicon) {
            return false;
        }
        return env('VITE_FILE_URL').$this->favicon;
    }

    function getUrlOgImageAttribute()
    {
        if (!$this->og_image) {
            return false;
        }
        return env('VITE_FILE_URL').$this->og_image;
    }
}
