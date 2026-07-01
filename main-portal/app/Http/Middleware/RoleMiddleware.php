<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string|null  ...$roles
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login')->with('error', 'Please login to continue.');
        }

        // Get current user role
        $userRole = Auth::user()->role ?? 'user';

        // If no specific roles required, proceed
        if (empty($roles)) {
            return $next($request);
        }

        // Check if user has any of the required roles
        if (!in_array($userRole, $roles) && !in_array('admin', $roles)) {
            return redirect()->route('dashboard')
                ->with('error', 'You do not have permission to access this page.');
        }

        // Super admin (if exists) can access everything
        if ($userRole === 'super_admin') {
            return $next($request);
        }

        return $next($request);
    }
}