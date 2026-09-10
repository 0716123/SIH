<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated access.',
            ], 401);
        }

        if (empty($roles)) {
            return $next($request);
        }

        // Support both comma-delimited strings and multiple arguments
        $allowedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $trimmed = trim($r);
                if (!empty($trimmed)) {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        if (!in_array($user->role, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have permission to perform this action.',
                'required_roles' => $allowedRoles,
                'current_role' => $user->role,
            ], 403);
        }

        return $next($request);
    }
}
