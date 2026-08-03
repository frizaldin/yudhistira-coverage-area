<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kecamatan extends Model
{
    protected $primaryKey = 'camat_code';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $fillable = [
        'camat_code',
        'city_code',
        'camat_name',
        'geomap',
        'dapodik_customer',
        'dapodik_student',
        'ac_customer',
        'real_customer',
        'cabang_id',
    ];

    public function cabang()
    {
        return $this->belongsTo(Cabang::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_code', 'city_code');
    }

    protected static function booted()
    {
        static::created(function ($kecamatan) {
            $role = \App\Models\Role::where('type', 'office')->orderBy('id', 'desc')->first();
            $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $kecamatan->camat_name)) . '@admin.com';
            
            \App\Models\User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'User Kecamatan ' . $kecamatan->camat_name,
                    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                    'role_id' => $role->id ?? 1,
                    'level' => 'kecamatan',
                    'kecamatan_id' => $kecamatan->camat_code,
                ]
            );
        });
    }
}
