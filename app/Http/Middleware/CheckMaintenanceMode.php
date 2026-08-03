<?php

namespace App\Http\Middleware;

use App\Models\Configuration;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Inertia\Response as InertiaResponse;

class CheckMaintenanceMode
{
    public function handle(
        Request $request,
        Closure $next
    ): SymfonyResponse|InertiaResponse {

        $configuration = Configuration::latest()->first();

        if ($configuration?->maintenance_mode) {
            return Inertia::render('Maintenance/Index')->rootView('fe');
        }

        return $next($request);

    }
}
