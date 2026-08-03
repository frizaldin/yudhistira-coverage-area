<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cabang extends Model
{
    protected $guarded = ['id'];

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    protected static function booted()
    {
        static::created(function ($cabang) {
            $role = \App\Models\Role::where('type', 'office')->orderBy('id', 'desc')->first();
            $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $cabang->nama_cabang)) . '@admin.com';
            
            \App\Models\User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'User Cabang ' . $cabang->nama_cabang,
                    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                    'role_id' => $role->id ?? 1,
                    'level' => 'cabang',
                    'cabang_id' => $cabang->id,
                ]
            );
        });
    }
}
