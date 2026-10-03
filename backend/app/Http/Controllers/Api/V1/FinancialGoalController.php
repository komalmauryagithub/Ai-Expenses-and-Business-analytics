<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGoalRequest;
use App\Http\Requests\UpdateGoalRequest;
use App\Http\Resources\FinancialGoalResource;
use App\Models\FinancialGoal;
use App\Services\AuditLogService;
use App\Services\GoalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancialGoalController extends Controller
{
    protected GoalService $goalService;

    public function __construct(GoalService $goalService)
    {
        $this->goalService = $goalService;
    }

    /**
     * List user financial goals with pagination, search, and status filters.
     * GET /api/v1/goals
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $query = FinancialGoal::with('contributions')->where('user_id', $userId);

        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"]);
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $goals = $query->orderBy('target_date', 'asc')->paginate($perPage);

        // Filter items in memory by computed status if requested
        $items = collect($goals->items());
        if ($request->filled('status')) {
            $filterStatus = strtolower($request->input('status'));
            $items = $items->filter(function ($goal) use ($filterStatus) {
                $metrics = $this->goalService->calculateMetrics($goal);
                return $metrics['status'] === $filterStatus;
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Financial goals retrieved successfully',
            'data' => [
                'items' => FinancialGoalResource::collection($items->values()),
                'pagination' => [
                    'total' => $goals->total(),
                    'per_page' => $goals->perPage(),
                    'current_page' => $goals->currentPage(),
                    'last_page' => $goals->lastPage(),
                    'from' => $goals->firstItem(),
                    'to' => $goals->lastItem(),
                ],
            ],
        ], 200);
    }

    /**
     * Create a new financial goal.
     * POST /api/v1/goals
     */
    public function store(StoreGoalRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        $goal = FinancialGoal::create([
            'user_id' => $userId,
            'name' => $validated['name'],
            'target_amount' => $validated['target_amount'],
            'current_amount' => 0.00,
            'target_date' => $validated['target_date'],
            'description' => $validated['description'] ?? null,
        ]);

        AuditLogService::log('financial_goal.created', $userId, FinancialGoal::class, $goal->id, [
            'name' => $goal->name,
            'target_amount' => $goal->target_amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Financial goal created successfully',
            'data' => [
                'goal' => new FinancialGoalResource($goal),
            ],
        ], 201);
    }

    /**
     * Get details of a single financial goal with contribution history.
     * GET /api/v1/goals/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::with(['contributions' => function ($q) {
            $q->orderBy('contribution_date', 'desc');
        }])->where('user_id', $userId)->find($id);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $this->goalService->syncCurrentAmount($goal);

        return response()->json([
            'success' => true,
            'message' => 'Financial goal retrieved successfully',
            'data' => [
                'goal' => new FinancialGoalResource($goal),
            ],
        ], 200);
    }

    /**
     * Update a financial goal.
     * PATCH /api/v1/goals/{id}
     */
    public function update(int $id, UpdateGoalRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::where('user_id', $userId)->find($id);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $validated = $request->validated();
        $goal->update($validated);
        $this->goalService->syncCurrentAmount($goal);

        AuditLogService::log('financial_goal.updated', $userId, FinancialGoal::class, $goal->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Financial goal updated successfully',
            'data' => [
                'goal' => new FinancialGoalResource($goal),
            ],
        ], 200);
    }

    /**
     * Delete a financial goal and its contributions.
     * DELETE /api/v1/goals/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::where('user_id', $userId)->find($id);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        AuditLogService::log('financial_goal.deleted', $userId, FinancialGoal::class, $id, [
            'name' => $goal->name,
        ]);

        $goal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Financial goal deleted successfully',
            'data' => new \stdClass(),
        ], 200);
    }
}
