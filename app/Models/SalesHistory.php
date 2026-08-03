<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesHistory extends Model
{
    protected $fillable = [
        'sales_id',
        'year',
        'target_customer',
        'real_customer',
        'target_exemplar',
        'real_exemplar',
    ];
}
