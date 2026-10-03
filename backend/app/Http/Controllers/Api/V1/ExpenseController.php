<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * List Expenses with Pagination, Search, Filters, and Safe Sorting
     * GET /api/v1/expenses
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Expense::with('category')->where('user_id', $userId);

        // Filter: Category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Filter: Payment Method
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        // Filter: Date Range
        if ($request->filled('from_date')) {
            $query->whereDate('expense_date', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('expense_date', '<=', $request->input('to_date'));
        }

        // Filter: Amount Range
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', $request->input('min_amount'));
        }
        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', $request->input('max_amount'));
        }

        // Search (Description & Notes)
        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(description) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(notes) LIKE ?', ["%{$search}%"]);
            });
        }

        // Safe Sorting Allowlist
        $allowedSortFields = ['expense_date', 'amount', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSortFields) ? $request->input('sort_by') : 'expense_date';
        $sortOrder = strtolower($request->input('sort_order')) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        // Summary calculations on filtered subset before pagination
        $totalSum = (float) (clone $query)->sum('amount');
        $totalCount = (clone $query)->count();

        // Pagination
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $expenses = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Expenses retrieved successfully',
            'data' => [
                'items' => ExpenseResource::collection($expenses->items()),
                'pagination' => [
                    'total' => $expenses->total(),
                    'per_page' => $expenses->perPage(),
                    'current_page' => $expenses->currentPage(),
                    'last_page' => $expenses->lastPage(),
                    'from' => $expenses->firstItem(),
                    'to' => $expenses->lastItem(),
                ],
                'summary' => [
                    'total_amount' => number_format($totalSum, 2, '.', ''),
                    'count' => $totalCount,
                ],
            ],
        ], 200);
    }

    /**
     * Create New Expense
     * POST /api/v1/expenses
     */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        $expense = Expense::create([
            'user_id' => $userId,
            'category_id' => $validated['category_id'],
            'amount' => $validated['amount'],
            'description' => $validated['description'],
            'expense_date' => $validated['expense_date'],
            'payment_method' => $validated['payment_method'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $expense->load('category');

        AuditLogService::log('expense.created', $userId, Expense::class, $expense->id, [
            'amount' => $expense->amount,
            'category_id' => $expense->category_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Expense created successfully',
            'data' => [
                'expense' => new ExpenseResource($expense),
            ],
        ], 201);
    }

    /**
     * Get Expense Details
     * GET /api/v1/expenses/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $expense = Expense::with('category')->where('user_id', $userId)->find($id);

        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Expense record not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Expense retrieved successfully',
            'data' => [
                'expense' => new ExpenseResource($expense),
            ],
        ], 200);
    }

    /**
     * Update Expense Record
     * PATCH /api/v1/expenses/{id}
     */
    public function update(int $id, UpdateExpenseRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $expense = Expense::where('user_id', $userId)->find($id);

        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Expense record not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $validated = $request->validated();
        $expense->update($validated);
        $expense->load('category');

        AuditLogService::log('expense.updated', $userId, Expense::class, $expense->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'data' => [
                'expense' => new ExpenseResource($expense),
            ],
        ], 200);
    }

    /**
     * Soft Delete Expense Record
     * DELETE /api/v1/expenses/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $expense = Expense::where('user_id', $userId)->find($id);

        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Expense record not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        AuditLogService::log('expense.deleted', $userId, Expense::class, $id, [
            'amount' => $expense->amount,
            'description' => $expense->description,
        ]);

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully',
            'data' => new \stdClass(),
        ], 200);
    }
}
