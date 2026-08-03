<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesAreaCover extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function sales()
    {
        return $this->belongsTo(Sales::class, 'sales_id');
    }
}
