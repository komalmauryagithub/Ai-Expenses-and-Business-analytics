<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProfileController extends Controller
{
    /**
     * Get Current Profile
     * GET /api/v1/profile
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully',
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ], 200);
    }

    /**
     * Update Current Profile
     * PUT/PATCH /api/v1/profile
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $changes = [];
        if ($user->name !== $validated['name']) {
            $changes['name'] = ['from' => $user->name, 'to' => $validated['name']];
            $user->name = $validated['name'];
        }

        if ($user->email !== Str::lower($validated['email'])) {
            $changes['email'] = ['from' => $user->email, 'to' => Str::lower($validated['email'])];
            $user->email = Str::lower($validated['email']);
        }

        if (!empty($changes)) {
            $user->save();
            AuditLogService::log('profile_updated', $user->id, null, null, $changes);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => new UserResource($user),
            ],
        ], 200);
    }

    /**
     * Change Password
     * POST /api/v1/profile/change-password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (!Hash::check($validated['current_password'], $user->password)) {
            AuditLogService::log('password_change_failed', $user->id, null, null, [
                'reason' => 'Invalid current password',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The provided current password is incorrect.',
                'errors' => [
                    'current_password' => ['The provided current password is incorrect.'],
                ],
            ], 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        // Revoke all tokens for user except current token (or all tokens to force re-login)
        $user->tokens()->delete();

        // Generate a new token for the user so they can continue seamlessly or re-authenticate
        $newToken = $user->createToken('auth_token')->plainTextToken;

        AuditLogService::log('password_changed', $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully. All previous sessions have been invalidated.',
            'data' => [
                'token' => $newToken,
                'token_type' => 'Bearer',
            ],
        ], 200);
    }
}
