<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Services\AuditLogService;
use App\Services\BudgetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    protected BudgetService $budgetService;

    public function __construct(BudgetService $budgetService)
    {
        $this->budgetService = $budgetService;
    }

    /**
     * List user budgets with pagination and filtering.
     * GET /api/v1/budgets
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $filters = $request->only(['period', 'category_id', 'search', 'sort_by', 'sort_order']);
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        $budgets = $this->budgetService->getBudgets($userId, $filters, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Budgets retrieved successfully',
            'data' => [
                'items' => BudgetResource::collection($budgets->items()),
                'pagination' => [
                    'total' => $budgets->total(),
                    'per_page' => $budgets->perPage(),
                    'current_page' => $budgets->currentPage(),
                    'last_page' => $budgets->lastPage(),
                    'from' => $budgets->firstItem(),
                    'to' => $budgets->lastItem(),
                ],
            ],
        ], 200);
    }

    /**
     * Create a new budget.
     * POST /api/v1/budgets
     */
    public function store(StoreBudgetRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        $budget = Budget::create([
            'user_id' => $userId,
            'name' => $validated['name'],
            'amount' => $validated['amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'alert_threshold' => $validated['alert_threshold'] ?? 80.00,
            'category_id' => $validated['category_id'] ?? null,
        ]);

        $budget->load('category');

        AuditLogService::log('budget.created', $userId, Budget::class, $budget->id, [
            'name' => $budget->name,
            'amount' => $budget->amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Budget created successfully',
            'data' => [
                'budget' => new BudgetResource($budget),
            ],
        ], 201);
    }

    /**
     * Show single budget details.
     * GET /api/v1/budgets/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $budget = Budget::with('category')->where('user_id', $userId)->find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Budget retrieved successfully',
            'data' => [
                'budget' => new BudgetResource($budget),
            ],
        ], 200);
    }

    /**
     * Update an existing budget.
     * PATCH /api/v1/budgets/{id}
     */
    public function update(int $id, UpdateBudgetRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $budget = Budget::where('user_id', $userId)->find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $validated = $request->validated();
        $budget->update($validated);
        $budget->load('category');

        AuditLogService::log('budget.updated', $userId, Budget::class, $budget->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Budget updated successfully',
            'data' => [
                'budget' => new BudgetResource($budget),
            ],
        ], 200);
    }

    /**
     * Delete a budget.
     * DELETE /api/v1/budgets/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $budget = Budget::where('user_id', $userId)->find($id);

        if (!$budget) {
            return response()->json([
                'success' => false,
                'message' => 'Budget not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        AuditLogService::log('budget.deleted', $userId, Budget::class, $id, [
            'name' => $budget->name,
        ]);

        $budget->delete();

        return response()->json([
            'success' => true,
            'message' => 'Budget deleted successfully',
            'data' => new \stdClass(),
        ], 200);
    }
}
