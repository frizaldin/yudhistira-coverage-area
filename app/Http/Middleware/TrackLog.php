<?php

namespace App\Http\Middleware;

use App\Models\Log;
use Closure;
use Illuminate\Support\Facades\Cache;

class TrackLog
{
    public function handle($request, Closure $next)
    {
        $ip = $request->ip();
        $url = $request->path();
        $agent = $request->userAgent();
        $method = $request->method();
        $query = $request->query();

        $hash = md5($ip . '|' . $url . '|' . $agent . '|' . $method);

        $cacheKey = "access_log:" . $hash;

        if (
            (count($query) === 1 && isset($query['page']))
        ) {
            return $next($request);
        }

        if (!cache()->has($cacheKey)) {

            Log::create([
                'ip' => $ip,
                'user_agent' => $agent,
                'url' => $url,
                'method' => $method,
            ]);

            cache()->put($cacheKey, true, now()->addSeconds(60));
        }

        $this->cleanupWeekly();

        return $next($request);
    }

    private function cleanupWeekly()
    {
        if (!Cache::has('log_cleanup_lock')) {

            Cache::put('log_cleanup_lock', true, now()->addWeek());

            Log::where('created_at', '<', now()->subWeek())->delete();
        }
    }
}
