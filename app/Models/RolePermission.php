<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $fillable = [
        'role_id',
        'menu_id',
        'action',
    ];

    protected $appends = [
        // 'navigation'
    ];

    function getNavigationAttribute()
    {
        // return cache()->remember('menu_' . $this->menu_id, now()->addDay(), function () {
            return Menu::find($this->menu_id);
        // });
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menu_id', 'id');
    }
}
