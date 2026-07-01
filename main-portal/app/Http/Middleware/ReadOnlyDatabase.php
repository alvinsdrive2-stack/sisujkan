<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReadOnlyDatabase
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Get read-only connections
        $readOnlyConnections = ['mysql_balai', 'mysql_reguler', 'mysql_fg', 'mysql_tuk'];

        // Disable writes for these connections
        foreach ($readOnlyConnections as $connection) {
            DB::connection($connection)->statement("SET SESSION TRANSACTION READ ONLY");
        }

        return $next($request);
    }
}