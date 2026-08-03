<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, $menu, $action = 'read')
    {
        $user = $request->user();

        if (!$user || !$user->role) {
            abort(403, 'Unauthorized');
        }

        $permissions = $user->role->permissions;

        $hasPermission = $permissions->contains(function ($perm) use ($menu, $action) {
            if ($action == 'read') {
                return $perm->menu->key === $menu
                    && $perm->action;
            }

            return $perm->menu->key === $menu
                && str_contains($perm->action, $action);
        });

        if (!$hasPermission) {
            abort(403, 'Forbidden');
        }

        return $next($request);
    }
}
