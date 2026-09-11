<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PresenceController extends Controller
{
    /**
     * Handle client heartbeat to record active presence across devices
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $user = $request->user();
        $clientId = $request->input('client_id', (string) ($user?->id ?? $request->ip()));
        $device = $request->input('device', 'Web Client');
        $now = now()->timestamp;

        $presences = Cache::get('sip_active_presences', []);

        // Prune stale presences older than 45 seconds
        $activePresences = [];
        if (is_array($presences)) {
            foreach ($presences as $id => $item) {
                if (is_array($item) && ($now - ($item['last_seen'] ?? 0)) < 45) {
                    $activePresences[$id] = $item;
                }
            }
        }

        // Record current device session
        $activePresences[$clientId] = [
            'client_id' => $clientId,
            'user_id' => $user?->id ?? 0,
            'name' => $user?->name ?? 'Clinical User',
            'role' => $user?->role ?? 'staff',
            'device' => $device,
            'ip' => $request->ip(),
            'last_seen' => $now,
            'active_since' => $activePresences[$clientId]['active_since'] ?? $now,
        ];

        Cache::put('sip_active_presences', $activePresences, 300);

        return $this->sendResponse(array_values($activePresences), 'Presence heartbeat acknowledged.');
    }

    /**
     * Get list of currently active users across devices
     */
    public function activeUsers(): JsonResponse
    {
        $presences = Cache::get('sip_active_presences', []);
        $now = now()->timestamp;
        $active = [];

        if (is_array($presences)) {
            foreach ($presences as $id => $item) {
                if (is_array($item) && ($now - ($item['last_seen'] ?? 0)) < 45) {
                    $active[] = $item;
                }
            }
        }

        return $this->sendResponse($active, 'Active users retrieved successfully.');
    }
}

