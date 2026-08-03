<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = ['name', 'key'];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    /**
     * COLLECTION
     */
    static function setForm(string $type)
    {
        return Menu::orderBy('name', 'asc')->whereNotIn('key', [
                'dashboard'
            ])
            ->where('type', $type)
            ->get();
    }
}
