<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureUserHasRole
{
    /**
     * Ensure the authenticated user has one of the allowed roles.
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (! $user || empty($roles)) {
            abort(403, 'You are not authorized to perform this action.');
        }

        if (! in_array($user->role, $roles, true)) {
            abort(403, 'You are not authorized to perform this action.');
        }

        return $next($request);
    }
}
