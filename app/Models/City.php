<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    protected $primaryKey = 'city_code';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'city_code',
        'city_name',
        'province_code',
        'region',
        'region_b',
        'region_c',
        'region_s',
    ];

    protected function casts(): array
    {
        return [
            'region'   => 'integer',
            'region_b' => 'integer',
            'region_c' => 'integer',
            'region_s' => 'integer',
        ];
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_code', 'province_code');
    }

    public function kecamatans()
    {
        return $this->hasMany(Kecamatan::class, 'city_code', 'city_code');
    }
}
