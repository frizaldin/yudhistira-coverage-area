<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Role;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private string $title;
    private string $code;

    public function __construct()
    {
        $this->title = 'Dashboard';
        $this->code = 'dashboard';
    }

    function index(Request $req)
    {
        $logs = Log::latest()
            ->paginate(12)->onEachSide(1)
            ->withQueryString();

        $user = request()->user();
        $user->load('role.permissions.menu');

        $permissions = collect($user->role->permissions)->filter(function($item) {
            return array_search($item->menu->key, ['dashboard', 'configuration', 'terms-conditions', 'privacy-policy']) === false;
        })->values();

        $widget = [];

        foreach ($permissions as $key => $permission) {
            $code = $permission->menu->key;

            $count = $this->getCount($code);

            $icon_code = str_replace('-', '_', $code);

            $widget[] = [
                'name' => $permission->menu->name,
                'code' => $code,
                'icon' => config("menu-icons.$icon_code"),
                'count' => $count,
            ];
        }

        return Inertia::render('Dashboard', [
            'logs' => $logs,
            'title' => $this->title,
            'code' => $this->code,
            'widgets' => $widget
        ]);
    }

    private function getCount(string $code)
    {
        return match ($code) {

            'users' => User::count(),
            'roles' => Role::count(),
            default => 0
        };
    }
}
