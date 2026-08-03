<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $guarded = [];

    public function cabang()
    {
        return $this->belongsTo(Cabang::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function sales()
    {
        return $this->belongsTo(Sales::class);
    }

    public function customerPlans()
    {
        return $this->hasMany(CustomerPlan::class);
    }
}


