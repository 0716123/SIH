<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue API token
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return $this->sendError(__('messages.auth_failed') ?: 'Validation Error.', $validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->sendError(__('messages.invalid_credentials') ?: 'Invalid email or password.', [], 401);
        }

        if (!$user->is_active) {
            return $this->sendError(__('messages.account_inactive') ?: 'Your account is deactivated. Please contact administrator.', [], 403);
        }

        // Revoke prior tokens if desired or issue new token
        $token = $user->createToken('sip-auth-token', [$user->role])->plainTextToken;

        return $this->sendResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'specialization' => $user->specialization,
                'license_number' => $user->license_number,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], __('messages.login_success') ?: 'User logged in successfully.');
    }

    /**
     * Register a new user (Doctor, Staff, or Admin)
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'           => 'required|string|max:255',
            'email'          => 'required|string|email|max:255|unique:users',
            'password'       => 'required|string|min:8|confirmed',
            'role'           => 'required|string|in:admin,doctor,staff',
            'phone'          => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:150',
            'license_number' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'role'           => $request->role,
            'phone'          => $request->phone,
            'specialization' => $request->specialization,
            'license_number' => $request->license_number,
            'is_active'      => true,
        ]);

        $token = $user->createToken('sip-auth-token', [$user->role])->plainTextToken;

        return $this->sendResponse([
            'user'  => $user,
            'token' => $token,
        ], 'User registered successfully.', 201);
    }

    /**
     * Get the authenticated User's profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isDoctor()) {
            $user->loadCount(['cases', 'appointments', 'treatments']);
        }

        return $this->sendResponse($user, 'User profile retrieved successfully.');
    }

    /**
     * Update current user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'           => 'sometimes|required|string|max:255',
            'phone'          => 'nullable|string|max:20',
            'specialization' => 'nullable|string|max:150',
            'current_password' => 'required_with:password|string',
            'password'       => 'nullable|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return $this->sendError('Current password does not match.', [], 400);
            }
            $user->password = Hash::make($request->password);
        }

        $user->fill($request->only(['name', 'phone', 'specialization']));
        $user->save();

        return $this->sendResponse($user, 'Profile updated successfully.');
    }

    /**
     * Revoke current user's token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->sendResponse(null, __('messages.logout_success') ?: 'Successfully logged out.');
    }

    /**
     * Forgot password endpoint
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        // Generates secure temporary reset token
        $resetToken = Str::random(60);

        return $this->sendResponse([
            'email' => $request->email,
            'reset_token' => $resetToken,
        ], 'Password reset token generated. Check registered email for instructions.');
    }
}
