<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserServices
{
    public function store(Request $request, array $params)
    {
        try {
            $request->validate($this->validateRule($request, 'store'), $this->validateMessage());

            $level = $request->level ?? 'nasional';
            $role = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'role_id' => $request->role_id,
                'password' => Hash::make($request->password),
                'level' => $level,
                'area_id' => $level === 'area' ? $request->area_id : null,
                'cabang_id' => $level === 'cabang' ? $request->cabang_id : null,
                'kecamatan_id' => $level === 'kecamatan' ? $request->kecamatan_id : null,
            ]);

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

            $find = User::find($request->id);

            $level = $request->level ?? 'nasional';
            $update = $find->update([
                'name' => $request->name,
                'email' => $request->email,
                'role_id' => $request->role_id,
                'password' => $request->password ? Hash::make($request->password) : $find->password,
                'level' => $level,
                'area_id' => $level === 'area' ? $request->area_id : null,
                'cabang_id' => $level === 'cabang' ? $request->cabang_id : null,
                'kecamatan_id' => $level === 'kecamatan' ? $request->kecamatan_id : null,
            ]);

            return redirect()
                ->route($params['code'].'.index')
                ->with('success', $params['subtitle'].' has been updated successfully.');
        } catch (\Throwable $th) {
            return back()->withErrors([
                'error' => $th->getMessage()
            ]);
        }
    }

    public function destroy(Request $request, User $item, array $params)
    {
        if ($request->input('status') == 'permanent') {
            $message = $params['subtitle'].' has been deleted permanently.';
            $item->forceDelete();
        } else {
            $message = $params['subtitle'].' has been moved to trash successfully.';
            $item->delete();
        }

        return redirect()
            ->route($params['code'].'.index')
            ->with('success', $message);
    }

    public function restore(int $id, array $params)
    {
        $user = User::onlyTrashed()->find($id);
        $user->restore();

        return redirect()
            ->route($params['code'].'.index')
            ->with('success', $params['subtitle'].' has been restored successfully.');
    }

    public function bulkDelete(Request $request, array $params)
    {
        if ($request->input('status') === 'permanent') {
            $message = $params['subtitle'].' has been deleted permanently.';
            User::whereIn('id', $request->ids)->forceDelete();
        } else {
            $message = $params['subtitle'].' has been moved to trash successfully.';
            User::whereIn('id', $request->ids)->delete();
        }

        return redirect()
            ->route($params['code'].'.index')
            ->with('success', $message);
    }

    public function bulkRestore(Request $request, array $params)
    {
        User::onlyTrashed()->whereIn('id', $request->ids)->restore();

        return redirect()
            ->route($params['code'].'.index')
            ->with('success', $params['subtitle'].' has been restored successfully.');
    }

    /**
     * UTILS
     */
    static function validateMessage()
    {
        return [
            'email.string' => 'Email must be a string.',
            'email.max' => 'Email must not exceed 255 characters.',
            'email.unique' => 'Email already exists.',
            'name.string' => 'Name must be a string.',
            'name.max' => 'Name must not exceed 255 characters.',
            'name.unique' => 'Name already exists.',
            'password.required' => 'Password is required.',
            'password.string' => 'Password must be a string.',
            'password.min' => 'Password must be at least 8 characters.',
            'role_id.required' => 'Role is required.',
            'role_id.exists' => 'Selected role does not exist.',
        ];
    }

    static function validateRule(Request $request, string $page)
    {
        if ($page == 'store') {
            return [
                'email' => [
                    'string',
                    'max:255',
                    Rule::unique('users')
                ],
                'name' => [
                    'string',
                    'max:255',
                    Rule::unique('users')
                ],
                'password' => 'required|string|min:8',
                'role_id' => 'required|exists:roles,id',
                'level' => 'required|string|in:nasional,area,cabang,kecamatan',
                'area_id' => 'nullable|required_if:level,area|exists:areas,id',
                'cabang_id' => 'nullable|required_if:level,cabang|exists:cabangs,id',
                'kecamatan_id' => 'nullable|required_if:level,kecamatan|exists:kecamatans,camat_code',
            ];
        } else if ($page == 'update') {
            return [
                'email' => [
                    'string',
                    'max:255',
                    Rule::unique('users')->ignore($request->id)
                ],
                'name' => [
                    'string',
                    'max:255',
                    Rule::unique('users')->ignore($request->id)
                ],
                'password' => 'nullable|min:8',
                'role_id' => 'required|exists:roles,id',
                'level' => 'required|string|in:nasional,area,cabang,kecamatan',
                'area_id' => 'nullable|required_if:level,area|exists:areas,id',
                'cabang_id' => 'nullable|required_if:level,cabang|exists:cabangs,id',
                'kecamatan_id' => 'nullable|required_if:level,kecamatan|exists:kecamatans,camat_code',
            ];
        }
    }
}
