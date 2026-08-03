<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    protected $guarded = ['id'];

    public function cabangs()
    {
        return $this->hasMany(Cabang::class);
    }

    protected static function booted()
    {
        static::created(function ($area) {
            $role = \App\Models\Role::where('type', 'office')->orderBy('id', 'desc')->first();
            $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $area->name)) . '@admin.com';
            
            \App\Models\User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'User Area ' . $area->name,
                    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                    'role_id' => $role->id ?? 1,
                    'level' => 'area',
                    'area_id' => $area->id,
                ]
            );
        });
    }
}


