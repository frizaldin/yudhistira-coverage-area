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
        'school_grade_thresholds',
    ];

    protected $casts = [
        'sales_score_weights' => 'array',
        'school_grade_thresholds' => 'array',
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

    /**
     * Rentang siswa per grade sekolah (inklusif min–max, tanpa overlap).
     * Grade A+ = total siswa > max grade A (otomatis, tidak disimpan).
     */
    public static function defaultSchoolGradeThresholds(): array
    {
        return [
            'D' => ['min' => 0, 'max' => 100],
            'C' => ['min' => 101, 'max' => 300],
            'B' => ['min' => 301, 'max' => 500],
            'A' => ['min' => 501, 'max' => 1000],
        ];
    }

    /** Urutan tampilan grade (tinggi → rendah). */
    public static function schoolGradeOrder(): array
    {
        return ['A+', 'A', 'B', 'C', 'D'];
    }

    public static function schoolGradeColors(): array
    {
        return [
            'A+' => '#7c3aed',
            'A' => '#059669',
            'B' => '#2563eb',
            'C' => '#d97706',
            'D' => '#e11d48',
        ];
    }

    public function resolvedSchoolGradeThresholds(): array
    {
        $defaults = self::defaultSchoolGradeThresholds();
        $stored = is_array($this->school_grade_thresholds) ? $this->school_grade_thresholds : [];
        $resolved = [];

        foreach ($defaults as $grade => $default) {
            $row = is_array($stored[$grade] ?? null) ? $stored[$grade] : [];
            $min = isset($row['min']) ? (int) $row['min'] : (int) $default['min'];
            $max = isset($row['max']) ? (int) $row['max'] : (int) $default['max'];
            $resolved[$grade] = [
                'min' => max(0, $min),
                'max' => max(0, $max),
            ];
        }

        if (self::validateSchoolGradeThresholds($resolved) !== null) {
            return $defaults;
        }

        return $resolved;
    }

    /**
     * Validasi rentang: min ≤ max, berurutan D→C→B→A tanpa overlap/gap.
     * @return string|null pesan error, atau null jika valid
     */
    public static function validateSchoolGradeThresholds(array $thresholds): ?string
    {
        $order = ['D', 'C', 'B', 'A'];
        $prevMax = null;

        foreach ($order as $grade) {
            if (!isset($thresholds[$grade]['min'], $thresholds[$grade]['max'])) {
                return "Grade {$grade} wajib memiliki min dan max.";
            }
            $min = (int) $thresholds[$grade]['min'];
            $max = (int) $thresholds[$grade]['max'];
            if ($min < 0 || $max < 0) {
                return "Nilai grade {$grade} tidak boleh negatif.";
            }
            if ($min > $max) {
                return "Grade {$grade}: min tidak boleh lebih besar dari max.";
            }
            if ($prevMax !== null && $min !== $prevMax + 1) {
                return "Grade {$grade} harus mulai dari " . ($prevMax + 1) . " (setelah max grade sebelumnya), tanpa overlap atau gap.";
            }
            $prevMax = $max;
        }

        return null;
    }

    public static function schoolGradeFromSiswa(int $siswa, ?array $thresholds = null): string
    {
        $thresholds = $thresholds ?: self::defaultSchoolGradeThresholds();
        $siswa = max(0, $siswa);
        $aMax = (int) ($thresholds['A']['max'] ?? 1000);

        if ($siswa > $aMax) {
            return 'A+';
        }

        foreach (['A', 'B', 'C', 'D'] as $grade) {
            $min = (int) ($thresholds[$grade]['min'] ?? 0);
            $max = (int) ($thresholds[$grade]['max'] ?? 0);
            if ($siswa >= $min && $siswa <= $max) {
                return $grade;
            }
        }

        return 'D';
    }

    public static function schoolGradeRangeLabel(string $grade, ?array $thresholds = null): string
    {
        $thresholds = $thresholds ?: self::defaultSchoolGradeThresholds();
        if ($grade === 'A+') {
            $aMax = (int) ($thresholds['A']['max'] ?? 1000);

            return '>' . number_format($aMax, 0, ',', '.');
        }
        if (!isset($thresholds[$grade])) {
            return '-';
        }
        $min = (int) $thresholds[$grade]['min'];
        $max = (int) $thresholds[$grade]['max'];

        return number_format($min, 0, ',', '.') . ' – ' . number_format($max, 0, ',', '.');
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
