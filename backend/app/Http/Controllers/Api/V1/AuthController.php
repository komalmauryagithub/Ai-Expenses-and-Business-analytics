<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * User Registration
     * POST /api/v1/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => Str::lower($validated['email']),
            'password' => Hash::make($validated['password']),
            'role' => 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLogService::log('user_registered', $user->id, User::class, $user->id, [
            'email' => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * User Login
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = Str::lower($validated['email']);

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            AuditLogService::log('login_failed', null, null, null, [
                'email' => $email,
                'reason' => 'Invalid credentials',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
                'errors' => [
                    'email' => ['The provided credentials do not match our records.'],
                ],
            ], 401);
        }

        if ($user->status === 'inactive') {
            AuditLogService::log('login_failed', $user->id, User::class, $user->id, [
                'email' => $email,
                'reason' => 'Account deactivated',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact an administrator.',
                'errors' => [
                    'email' => ['Your account is inactive.'],
                ],
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLogService::log('user_logged_in', $user->id, User::class, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Logged in successfully',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 200);
    }

    /**
     * User Logout
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        AuditLogService::log('user_logged_out', $user?->id);

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
            'data' => new \stdClass(),
        ], 200);
    }

    /**
     * Current Authenticated User
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Authenticated user retrieved',
            'data' => [
                'user' => new UserResource($request->user()),
            ],
        ], 200);
    }

    /**
     * Password Reset Request
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        AuditLogService::log('password_reset_requested', null, null, null, [
            'email' => $request->email,
            'status' => $status,
        ]);

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email address.',
                'data' => new \stdClass(),
            ], 200);
        }

        // Return controlled generic success message to prevent user enumeration
        return response()->json([
            'success' => true,
            'message' => 'If an account exists with that email address, a password reset link has been dispatched.',
            'data' => new \stdClass(),
        ], 200);
    }

    /**
     * Complete Password Reset
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke existing tokens for security
                $user->tokens()->delete();

                AuditLogService::log('password_reset_completed', $user->id);
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password has been reset successfully. Please login with your new password.',
                'data' => new \stdClass(),
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unable to reset password',
            'errors' => [
                'email' => [__($status)],
            ],
        ], 400);
    }
}
