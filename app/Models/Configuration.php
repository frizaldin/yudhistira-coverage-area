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
        'target_year',
        'sales_score_weights',
    ];

    protected $casts = [
        'sales_score_weights' => 'array',
        'maintenance_mode' => 'boolean',
    ];

    public static function defaultSalesScoreWeights(): array
    {
        return [
            'realisasi_yoy' => 16.67,
            'sp_vs_ac' => 16.67,
            'achievement' => 16.66,
            'ac_growth' => 16.67,
            'activity' => 16.67,
            'realisasi_sekolah' => 16.66,
        ];
    }

    public static function salesScoreWeightLabels(): array
    {
        return [
            'realisasi_yoy' => 'Realisasi YoY',
            'sp_vs_ac' => 'SP vs Area Cover',
            'achievement' => 'Achievement Target',
            'ac_growth' => 'Area Cover Growth',
            'activity' => 'Intensitas Aktivitas',
            'realisasi_sekolah' => 'Realisasi Sekolah',
        ];
    }

    public function resolvedSalesScoreWeights(): array
    {
        $defaults = self::defaultSalesScoreWeights();
        $stored = is_array($this->sales_score_weights) ? $this->sales_score_weights : [];
        $weights = [];
        foreach ($defaults as $key => $default) {
            $val = isset($stored[$key]) ? (float) $stored[$key] : (float) $default;
            $weights[$key] = max(0, $val);
        }
        return $weights;
    }

    /**
     * Weighted total from component scores keyed like defaultSalesScoreWeights.
     */
    public static function computeWeightedSalesScore(array $scores, ?array $weights = null): float
    {
        $weights = $weights ?: self::defaultSalesScoreWeights();
        $sumW = 0.0;
        $sum = 0.0;
        foreach ($weights as $key => $w) {
            $w = (float) $w;
            if ($w <= 0) {
                continue;
            }
            $sumW += $w;
            $sum += ((float) ($scores[$key] ?? 0)) * $w;
        }
        if ($sumW <= 0) {
            return 0.0;
        }
        return round($sum / $sumW, 1);
    }

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
