<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\Role;
use App\Services\RoleServices;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function __construct(
        private RoleServices $services
    ) { }

    static function setPassing()
    {
        return [
            'title' => request()->segment(2) == 'accounts-roles' ? 'Access' : 'Roles',
            'subtitle' => request()->segment(2) == 'accounts-roles' ? 'Acces' : 'Role',
            'code' => request()->segment(2),
            'type' => request()->segment(2) == 'accounts-roles' ? 'front' : 'office'
        ];
    }

    /**
     * PAGES
     */
    public function index()
    {
        $var = $this->setPassing();

        return Inertia::render('Role/Index', array_merge(
            $var, [
                'roles' => Role::withCount('users')
                    ->where('type', $var['type'])
                    ->with('permissions')
                    ->get(),
            ]
        ));
    }

    public function create()
    {
        $var = $this->setPassing();

        return Inertia::render('Role/Form', array_merge(
            $var, [
                'role' => null,
                'menus' => Menu::setForm($var['type']),
            ]
        ));
    }

    public function edit(Role $item)
    {
        $item->load('permissions');
        $var = $this->setPassing();

        return Inertia::render('Role/Form', array_merge(
            $var, [
                'role' => $item,
                'menus' => Menu::setForm($var['type']),
            ]
        ));
    }

    /**
     * ACTIONS
     */
    public function store(Request $request)
    {
        return $this->services->store($request, params: $this->setPassing());
    }

    public function update(Request $request)
    {
        return $this->services->update($request, params: $this->setPassing());
    }

    public function destroy(Role $item)
    {
        return $this->services->destroy($item, params: $this->setPassing());
    }

    public function bulkDelete(Request $request)
    {
        return $this->services->bulkDelete($request, params: $this->setPassing());
    }
}
