<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesActivity extends Model
{
    protected $fillable = [
        'sales_id',
        'sales_name',
        'customer_id',
        'customer_name',
        'real_lalu',
        'rencana_jual',
        'tanggal',
        'aktivitas',
        'hasil',
        'keterangan',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
