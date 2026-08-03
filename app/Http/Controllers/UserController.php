<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        private UserServices $services
    ) { }

    static function setPassing()
    {
        return [
            'title' => 'Users',
            'subtitle' => 'User',
            'code' => 'users',
        ];
    }

    /**
     * PAGES
     */
    public function index(Request $request)
    {
        if(!can($request)) {
            return abort(403);
        }

        $query = User::with('role')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('role', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->whereKeyNot(auth()->id());

        if ($request->has('status') && $request->input('status') === 'trash') {
            $query->onlyTrashed();
        }

        return Inertia::render('User/Index', array_merge(
            $this->setPassing(),
            [
                'users' => $query->get(),
                'status' => $request->input('status'),
                'filters' => $request->only(['search', 'status']),
            ]
        ));
    }

    public function create()
    {
        return Inertia::render('User/Form', array_merge(
            $this->setPassing(),
            [
                'user' => null,
                'roles' => Role::where('type', 'office')->get(),
                'areas' => \App\Models\Area::orderBy('name')->get(),
                'cabangs' => \App\Models\Cabang::orderBy('nama_cabang')->get()->map(fn($c) => ['id' => $c->id, 'name' => 'Cabang ' . $c->nama_cabang]),
                'kecamatans' => \App\Models\Kecamatan::orderBy('camat_name')->get()->map(fn($k) => ['id' => $k->camat_code, 'name' => $k->camat_name]),
            ]
        ));
    }

    public function edit(User $item)
    {
        $item->load('role');

        return Inertia::render('User/Form', array_merge(
            $this->setPassing(),
            [
                'user' => $item,
                'roles' => Role::where('type', 'office')->get(),
                'areas' => \App\Models\Area::orderBy('name')->get(),
                'cabangs' => \App\Models\Cabang::orderBy('nama_cabang')->get()->map(fn($c) => ['id' => $c->id, 'name' => 'Cabang ' . $c->nama_cabang]),
                'kecamatans' => \App\Models\Kecamatan::orderBy('camat_name')->get()->map(fn($k) => ['id' => $k->camat_code, 'name' => $k->camat_name]),
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

    public function destroy(Request $request, User $item)
    {
        return $this->services->destroy($request, $item, params: $this->setPassing());
    }

    public function restore(int $id)
    {
        return $this->services->restore($id, params: $this->setPassing());
    }

    public function bulkDelete(Request $request)
    {
        return $this->services->bulkDelete($request, params: $this->setPassing());
    }

    public function bulkRestore(Request $request)
    {
        return $this->services->bulkRestore($request, params: $this->setPassing());
    }
}
