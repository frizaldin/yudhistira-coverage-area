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
            'realisasi_yoy' => 20,
            'sp_vs_ac' => 20,
            'achievement' => 20,
            'tahan_vs_ac' => 20,
            'rebut_vs_ac' => 20,
            'lepas_vs_ac' => 15, // eksternal, di luar 100%
        ];
    }

    public static function salesScoreWeightLabels(): array
    {
        return [
            'realisasi_yoy' => 'Realisasi YoY',
            'sp_vs_ac' => 'Customer Realisasi vs Area Cover',
            'achievement' => 'Achievement Target',
            'tahan_vs_ac' => 'Tahan vs Area Cover',
            'rebut_vs_ac' => 'Rebut vs Area Cover',
            'lepas_vs_ac' => 'Lepas vs Area Cover (pengurang)',
        ];
    }

    /** Keys that reduce the final score instead of adding to it. */
    public static function salesScorePenaltyKeys(): array
    {
        return ['lepas_vs_ac'];
    }

    /** Positive indicator keys that must sum to 100%. */
    public static function salesScorePositiveKeys(): array
    {
        return array_values(array_diff(
            array_keys(self::defaultSalesScoreWeights()),
            self::salesScorePenaltyKeys()
        ));
    }

    public function resolvedSalesScoreWeights(): array
    {
        $defaults = self::defaultSalesScoreWeights();
        $stored = is_array($this->sales_score_weights) ? $this->sales_score_weights : [];
        $weights = [];
        foreach ($defaults as $key => $default) {
            $weights[$key] = max(0, isset($stored[$key]) ? (float) $stored[$key] : (float) $default);
        }

        $positiveKeys = self::salesScorePositiveKeys();
        $sumPositive = 0.0;
        foreach ($positiveKeys as $key) {
            $sumPositive += $weights[$key] ?? 0;
        }

        // 5 indikator positif harus ~100%; Lepas eksternal di luar itu
        if ($sumPositive <= 0 || abs($sumPositive - 100) > 5) {
            return $defaults;
        }

        return $weights;
    }

    /**
     * Weighted total from component scores.
     * Positive indicators (sum bobot 100%): weighted average (0–100).
     * Lepas: pengurang eksternal — potong hingga sebesar bobot lepas (di luar 100%).
     */
    public static function computeWeightedSalesScore(array $scores, ?array $weights = null): float
    {
        $weights = $weights ?: self::defaultSalesScoreWeights();
        $penalties = self::salesScorePenaltyKeys();

        $posSum = 0.0;
        $posW = 0.0;
        $penaltyPts = 0.0;

        foreach ($weights as $key => $w) {
            $w = (float) $w;
            if ($w <= 0) {
                continue;
            }
            $score = (float) ($scores[$key] ?? 0);
            if (in_array($key, $penalties, true)) {
                // Lepas 100% vs AC dengan bobot eksternal 15 → potong 15 poin
                $penaltyPts += ($score / 100) * $w;
            } else {
                $posSum += $score * $w;
                $posW += $w;
            }
        }

        $positiveAvg = $posW > 0 ? ($posSum / $posW) : 0.0;

        return round(max(0, min(100, $positiveAvg - $penaltyPts)), 1);
    }

    /**
     * Label grade Sales Score (AI):
     * Sangat Baik (≥80), Baik (≥60), Cukup (≥40), Kurang (≥20), Buruk (<20)
     */
    public static function salesScoreGrade(float $score): string
    {
        if ($score >= 80) {
            return 'Sangat Baik';
        }
        if ($score >= 60) {
            return 'Baik';
        }
        if ($score >= 40) {
            return 'Cukup';
        }
        if ($score >= 20) {
            return 'Kurang';
        }

        return 'Buruk';
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
