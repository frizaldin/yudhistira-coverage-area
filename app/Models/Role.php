<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'type'];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function permissions()
    {
        return $this->hasMany(RolePermission::class, 'role_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
