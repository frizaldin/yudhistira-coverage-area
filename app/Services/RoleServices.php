<?php

namespace App\Services;

use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class RoleServices
{
    private array $role_name;

    public function __construct()
    {
        $this->role_name = [
            'Admin',
        ];
    }

    public function store(Request $request, array $params)
    {
        try {
            $request->validate($this->validateRule($request, 'store'), $this->validateMessage());

            $role = Role::create([
                'name' => $request->name,
                'type' => $params['type']
            ]);

            if ($params['type'] == 'office') {
                RolePermission::create([
                    'role_id' => $role->id,
                    'menu_id' => '3',
                    'action' => 'show',
                ]);
            }

            foreach ($request->permissions ?? [] as $menuId => $perm) {
                $action = [];
                 if (!empty($perm['create'])) {
                    $action[] = 'create';
                }
                if (!empty($perm['update'])) {
                    $action[] = 'update';
                }
                if (!empty($perm['delete'])) {
                    $action[] = 'delete';
                }
                if (!empty($perm['show'])) {
                    $action[] = 'show';
                }

                if (count($action) > 0) {
                    RolePermission::create([
                        'role_id' => $role->id,
                        'menu_id' => $menuId,
                        'action' => implode(',', $action),
                    ]);
                }
            }

            return redirect()
                ->route($params['code'].'.index')
                ->with('success', $params['subtitle'].' has been created successfully.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => $th->getMessage()
            ]);
        }
    }

    public function update(Request $request, array $params)
    {
        try {
            $request->validate($this->validateRule($request, 'update'), $this->validateMessage());

            $role = Role::where('id', $request->id)->first();

            if (
                in_array(strtolower($role->name), $this->role_name) &&
                strtolower($role->name) != strtolower($request->name)
            ) {
                throw new InvalidArgumentException(
                    "Role name `{$role->name}` can't be updated!",
                    500
                );
            }

            $role->update([
                'name' => $request->name,
            ]);

            RolePermission::where('role_id', $role->id)->delete();

            if ($params['type'] == 'office') {
                RolePermission::create([
                    'role_id' => $role->id,
                    'menu_id' => '3',
                    'action' => 'show',
                ]);
            }

            foreach ($request->permissions as $menuId => $perm) {
                $action = [];
                if (!empty($perm['create'])) {
                    $action[] = 'create';
                }
                if (!empty($perm['update'])) {
                    $action[] = 'update';
                }
                if (!empty($perm['delete'])) {
                    $action[] = 'delete';
                }
                if (!empty($perm['show'])) {
                    $action[] = 'show';
                }

                if (count($action) > 0) {
                    RolePermission::create([
                        'role_id' => $role->id,
                        'menu_id' => $menuId,
                        'action' => implode(',', $action),
                    ]);
                }
            }

            return redirect()
                ->route($params['code'].'.index')
                ->with('success', $params['subtitle'].' has been updated successfully.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => $th->getMessage()
            ]);
        }
    }

    public function destroy(Role $role, array $params)
    {
        if (strtolower($role->name) === 'admin') {
            return redirect()
                ->route($params['code'].'.index')
                ->with('error', 'Admin role cannot be deleted.');
        }

        if (in_array(strtolower($role->name), $this->role_name) === true) {
            return redirect()
                ->route($params['code'].'.index')
                ->with('error', "Role name `{$role->name}` can't be deleted!");
        }

        RolePermission::where('role_id', $role->id)->delete();

        $role->delete();

        return redirect()
            ->route($params['code'].'.index')
            ->with('success', $params['subtitle'].' has been deleted successfully.');
    }

    public function bulkDelete(Request $request, array $params)
    {
        $roles = Role::whereIn('id', $request->ids)->get();

        $protectedRoles = $roles->filter(function ($role) {
            return strtolower($role->name) === 'admin'
                || in_array(strtolower($role->name), $this->role_name) === true;
        });

        if ($protectedRoles->count() > 0) {
            return redirect()
                ->route($params['code'].'.index')
                ->with(
                    'error',
                    'Some protected roles cannot be deleted: ' .$roles->count().
                    $protectedRoles->pluck('name')->implode(', ')
                );
        }

        RolePermission::whereIn('role_id', $request->ids)->delete();

        Role::whereIn('id', $request->ids)->delete();

        return redirect()
            ->route($params['code'].'.index')
            ->with('success', $params['subtitle'].' has been deleted successfully.');
    }

    /**
     * UTILS
     */
    static function validateRule(Request $request, string $page)
    {
        if ($page == 'store') {
            return [
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('roles')
                ],
            ];
        } elseif ($page == 'update') {
            return [
                'name' => [
                    'required',
                    'string',
                    'max:255',
                    Rule::unique('roles')->ignore($request->id)
                ],
            ];
        }
    }

    static function validateMessage()
    {
        return [
            'name.required' => 'Role name is required.',
            'name.string' => 'Role name must be a string.',
            'name.max' => 'Role name must not exceed 255 characters.',
            'name.unique' => 'Role name already exists.',
        ];
    }
}
