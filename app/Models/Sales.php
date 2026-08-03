<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sales extends Model
{
    protected $guarded = [];

    public function cabang()
    {
        return $this->hasOneThrough(\App\Models\Cabang::class, \App\Models\Customer::class, 'sales_id', 'id', 'id', 'cabang_id');
    }

    public function customerPlans()
    {
        return $this->hasManyThrough(CustomerPlan::class, Customer::class, 'sales_id', 'customer_id', 'id', 'id');
    }

    public function cityPlans()
    {
        return $this->hasMany(SalesCityPlan::class, 'sales_id', 'id');
    }

    public function getCabangIdAttribute()
    {
        return $this->cabang ? $this->cabang->id : null;
    }

    protected static function booted()
    {
        static::created(function ($sales) {
            $role = \App\Models\Role::where('type', 'office')->orderBy('id', 'desc')->first();
            $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $sales->name)) . '@sales.com';
            
            \App\Models\User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => 'User Sales ' . $sales->name,
                    'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                    'role_id' => $role->id ?? 1,
                    'level' => 'sales',
                    'sales_id' => $sales->id,
                ]
            );
        });
    }
}
