<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Expense;
use App\Models\Income;
use App\Models\Budget;
use App\Models\FinancialGoal;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Services\AuditLogService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AdminController extends Controller
{
    /**
     * Admin Authorization Verification Test Endpoint
     * GET /api/v1/admin/test
     */
    public function test(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Admin access verified',
            'data' => [
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                ],
            ],
        ], 200);
    }

    /**
     * System Overview & Statistics Dashboard for Admins.
     * GET /api/v1/admin/dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $inactiveUsers = User::where('status', 'inactive')->count();
        $adminUsers = User::where('role', 'admin')->count();

        $totalExpenses = Expense::count();
        $totalIncome = Income::count();
        $totalBudgets = Budget::count();
        $totalGoals = FinancialGoal::count();

        // Recent System Activity from Audit Logs
        $recentActivity = AuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->take(8)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Admin dashboard metrics retrieved successfully',
            'data' => [
                'users' => [
                    'total' => $totalUsers,
                    'active' => $activeUsers,
                    'inactive' => $inactiveUsers,
                    'admins' => $adminUsers,
                ],
                'activity' => [
                    'total_expenses_count' => $totalExpenses,
                    'total_income_count' => $totalIncome,
                    'total_budgets_count' => $totalBudgets,
                    'total_goals_count' => $totalGoals,
                ],
                'recent_audit_logs' => $recentActivity,
            ],
        ], 200);
    }

    /**
     * User Management List with Search, Filter & Pagination.
     * GET /api/v1/admin/users
     */
    public function indexUsers(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $allowedSorts = ['id', 'name', 'email', 'role', 'status', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSorts) ? $request->input('sort_by') : 'created_at';
        $sortOrder = strtolower($request->input('sort_order')) === 'asc' ? 'asc' : 'desc';

        $users = $query->orderBy($sortBy, $sortOrder)->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'User management list retrieved successfully',
            'data' => $users,
        ], 200);
    }

    /**
     * Safe User Details & Account Usage Metrics.
     * GET /api/v1/admin/users/{id}
     */
    public function showUser(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User account not found.'], 404);
        }

        $expenseCount = Expense::where('user_id', $id)->count();
        $incomeCount = Income::where('user_id', $id)->count();
        $budgetCount = Budget::where('user_id', $id)->count();
        $goalCount = FinancialGoal::where('user_id', $id)->count();
        $unreadNotifs = Notification::where('user_id', $id)->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'message' => 'User details retrieved successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
                'stats' => [
                    'expense_count' => $expenseCount,
                    'income_count' => $incomeCount,
                    'budget_count' => $budgetCount,
                    'goal_count' => $goalCount,
                    'unread_notifications' => $unreadNotifs,
                ],
            ],
        ], 200);
    }

    /**
     * Change User Role (User <-> Admin) with Last-Admin Safety Check.
     * PATCH /api/v1/admin/users/{id}/role
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => ['required', 'string', 'in:user,admin'],
        ]);

        $targetUser = User::find($id);
        if (!$targetUser) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        $newRole = $request->input('role');
        $oldRole = $targetUser->role;

        // Last-Admin Safety Check: Prevent downgrading the last active admin account
        if ($oldRole === 'admin' && $newRole !== 'admin') {
            $activeAdminCount = User::where('role', 'admin')->where('status', 'active')->count();
            if ($activeAdminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot downgrade the last active administrator account.',
                    'errors' => ['role' => ['At least one active admin account must remain in the system.']],
                ], 422);
            }
        }

        $targetUser->update(['role' => $newRole]);

        AuditLogService::log('ADMIN_ROLE_CHANGED', $request->user()->id, 'User', $targetUser->id, [
            'target_user' => $targetUser->email,
            'old_role' => $oldRole,
            'new_role' => $newRole,
        ]);

        NotificationService::notifySecurityEvent(
            $targetUser->id,
            'Account Role Updated',
            "Your account role has been updated to {$newRole} by an administrator."
        );

        return response()->json([
            'success' => true,
            'message' => "User role successfully changed from {$oldRole} to {$newRole}",
            'data' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role' => $targetUser->role,
                'status' => $targetUser->status,
            ],
        ], 200);
    }

    /**
     * Activate or Deactivate User Account with Last-Admin Safety Check.
     * PATCH /api/v1/admin/users/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:active,inactive'],
        ]);

        $targetUser = User::find($id);
        if (!$targetUser) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        $newStatus = $request->input('status');
        $oldStatus = $targetUser->status;

        // Last-Admin Safety Check: Prevent deactivating the last active admin account
        if ($targetUser->role === 'admin' && $newStatus === 'inactive') {
            $activeAdminCount = User::where('role', 'admin')->where('status', 'active')->count();
            if ($activeAdminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot deactivate the last active administrator account.',
                    'errors' => ['status' => ['At least one active admin account must remain in the system.']],
                ], 422);
            }
        }

        $targetUser->update(['status' => $newStatus]);

        $action = $newStatus === 'active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
        AuditLogService::log($action, $request->user()->id, 'User', $targetUser->id, [
            'target_user' => $targetUser->email,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);

        return response()->json([
            'success' => true,
            'message' => "User account status updated to {$newStatus}",
            'data' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role' => $targetUser->role,
                'status' => $targetUser->status,
            ],
        ], 200);
    }

    /**
     * Audit Log Monitoring Page for Admins.
     * GET /api/v1/admin/audit-logs
     */
    public function indexAuditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('user:id,name,email');

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'ilike', "%{$search}%")
                  ->orWhere('entity_type', 'ilike', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Audit logs retrieved successfully',
            'data' => $logs,
        ], 200);
    }

    /**
     * System Notification Monitoring for Admins.
     * GET /api/v1/admin/notifications
     */
    public function indexAdminNotifications(Request $request): JsonResponse
    {
        $totalNotifs = Notification::count();
        $unreadNotifs = Notification::where('is_read', false)->count();

        $typeDistribution = Notification::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->orderBy('total', 'desc')
            ->get();

        $recentNotifications = Notification::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Admin notification monitoring retrieved successfully',
            'data' => [
                'total_count' => $totalNotifs,
                'unread_count' => $unreadNotifs,
                'type_distribution' => $typeDistribution,
                'recent_activity' => $recentNotifications,
            ],
        ], 200);
    }

    /**
     * System Health Operational Monitoring.
     * GET /api/v1/admin/system-health
     */
    public function systemHealth(Request $request): JsonResponse
    {
        // 1. Laravel API status
        $laravelStatus = 'healthy';

        // 2. PostgreSQL DB Connection status
        try {
            DB::connection()->getPdo();
            $dbStatus = 'healthy';
        } catch (\Throwable $e) {
            $dbStatus = 'unavailable';
        }

        // 3. FastAPI Analytics Service status
        $fastApiUrl = config('services.analytics.url', 'http://127.0.0.1:8001') . '/health';
        $fastApiStatus = 'unavailable';
        $responseTimeMs = null;

        try {
            $startTime = microtime(true);
            $response = Http::timeout(3)->get($fastApiUrl);
            $responseTimeMs = round((microtime(true) - $startTime) * 1000, 2);

            if ($response->successful() && ($response->json()['status'] ?? null) === 'ok') {
                $fastApiStatus = 'healthy';
            } else {
                $fastApiStatus = 'degraded';
            }
        } catch (\Throwable $e) {
            $fastApiStatus = 'unavailable';
        }

        return response()->json([
            'success' => true,
            'message' => 'System health operational status retrieved successfully',
            'data' => [
                'services' => [
                    [
                        'name' => 'Laravel REST API Engine',
                        'status' => $laravelStatus,
                        'port' => 8000,
                        'environment' => app()->environment(),
                    ],
                    [
                        'name' => 'PostgreSQL 16 Database Server',
                        'status' => $dbStatus,
                        'port' => 5432,
                        'database' => config('database.connections.pgsql.database'),
                    ],
                    [
                        'name' => 'Python FastAPI Analytics Service',
                        'status' => $fastApiStatus,
                        'port' => 8001,
                        'response_time_ms' => $responseTimeMs,
                        'health_url' => $fastApiUrl,
                    ],
                ],
                'checked_at' => Carbon::now()->toIso8601String(),
            ],
        ], 200);
    }
}
