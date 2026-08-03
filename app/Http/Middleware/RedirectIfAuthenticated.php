<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class RedirectIfAuthenticated
{

    public function handle(Request $request, Closure $next, ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {

            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();
                if ($user && $user->level === 'nasional') {
                    return redirect()->route('monitoring.sales-performance');
                }
                return redirect()->route('monitoring.area.select');
            }
        }

        return $next($request);
    }
}
