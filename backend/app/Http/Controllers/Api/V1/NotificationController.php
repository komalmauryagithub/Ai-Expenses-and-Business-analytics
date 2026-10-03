<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get paginated notifications for authenticated user.
     * GET /api/v1/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Auto-evaluate budget and goal alerts on load
        NotificationService::checkBudgetNotifications($userId);
        NotificationService::checkGoalNotifications($userId);

        $unreadOnly = $request->boolean('unread_only', false);

        $query = Notification::where('user_id', $userId);
        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        $notifications = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
        ], 200);
    }

    /**
     * Get unread notification count.
     * GET /api/v1/notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        NotificationService::checkBudgetNotifications($userId);
        NotificationService::checkGoalNotifications($userId);

        $count = Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'Unread count retrieved successfully',
            'data' => [
                'unread_count' => $count,
            ],
        ], 200);
    }

    /**
     * Mark single notification as read.
     * PATCH /api/v1/notifications/{id}/read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found or access unauthorized.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification,
        ], 200);
    }

    /**
     * Mark all user notifications as read.
     * PATCH /api/v1/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
            'data' => null,
        ], 200);
    }

    /**
     * Delete notification.
     * DELETE /api/v1/notifications/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found or access unauthorized.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully',
            'data' => null,
        ], 200);
    }
}
