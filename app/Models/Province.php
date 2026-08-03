<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Province extends Model
{
    protected $primaryKey = 'province_code';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'province_code',
        'province_name',
    ];

    public function cities()
    {
        return $this->hasMany(City::class, 'province_code', 'province_code');
    }
}
