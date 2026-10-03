<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIncomeRequest;
use App\Http\Requests\UpdateIncomeRequest;
use App\Http\Resources\IncomeResource;
use App\Models\Income;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    /**
     * List Income Records with Pagination, Search, Filters, and Safe Sorting
     * GET /api/v1/income
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Income::with('category')->where('user_id', $userId);

        // Filter: Income Type
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter: Category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Filter: Date Range
        if ($request->filled('from_date')) {
            $query->whereDate('income_date', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('income_date', '<=', $request->input('to_date'));
        }

        // Filter: Amount Range
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', $request->input('min_amount'));
        }
        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', $request->input('max_amount'));
        }

        // Search (Source & Description)
        if ($request->filled('search')) {
            $search = strtolower(trim($request->input('search')));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(source) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%{$search}%"]);
            });
        }

        // Safe Sorting Allowlist
        $allowedSortFields = ['income_date', 'amount', 'created_at'];
        $sortBy = in_array($request->input('sort_by'), $allowedSortFields) ? $request->input('sort_by') : 'income_date';
        $sortOrder = strtolower($request->input('sort_order')) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        // Summary calculations on filtered subset before pagination
        $totalSum = (float) (clone $query)->sum('amount');
        $totalCount = (clone $query)->count();

        // Pagination
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $incomeRecords = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Income records retrieved successfully',
            'data' => [
                'items' => IncomeResource::collection($incomeRecords->items()),
                'pagination' => [
                    'total' => $incomeRecords->total(),
                    'per_page' => $incomeRecords->perPage(),
                    'current_page' => $incomeRecords->currentPage(),
                    'last_page' => $incomeRecords->lastPage(),
                    'from' => $incomeRecords->firstItem(),
                    'to' => $incomeRecords->lastItem(),
                ],
                'summary' => [
                    'total_amount' => number_format($totalSum, 2, '.', ''),
                    'count' => $totalCount,
                ],
            ],
        ], 200);
    }

    /**
     * Create New Income Record
     * POST /api/v1/income
     */
    public function store(StoreIncomeRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        $income = Income::create([
            'user_id' => $userId,
            'amount' => $validated['amount'],
            'source' => $validated['source'],
            'income_date' => $validated['income_date'],
            'type' => $validated['type'],
            'category_id' => $validated['category_id'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        $income->load('category');

        AuditLogService::log('income.created', $userId, Income::class, $income->id, [
            'amount' => $income->amount,
            'source' => $income->source,
            'type' => $income->type,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Income record created successfully',
            'data' => [
                'income' => new IncomeResource($income),
            ],
        ], 201);
    }

    /**
     * Get Income Details
     * GET /api/v1/income/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $income = Income::with('category')->where('user_id', $userId)->find($id);

        if (!$income) {
            return response()->json([
                'success' => false,
                'message' => 'Income record not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Income record retrieved successfully',
            'data' => [
                'income' => new IncomeResource($income),
            ],
        ], 200);
    }

    /**
     * Update Income Record
     * PATCH /api/v1/income/{id}
     */
    public function update(int $id, UpdateIncomeRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $income = Income::where('user_id', $userId)->find($id);

        if (!$income) {
            return response()->json([
                'success' => false,
                'message' => 'Income record not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $validated = $request->validated();
        $income->update($validated);
        $income->load('category');

        AuditLogService::log('income.updated', $userId, Income::class, $income->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Income record updated successfully',
            'data' => [
                'income' => new IncomeResource($income),
            ],
        ], 200);
    }

    /**
     * Soft Delete Income Record
     * DELETE /api/v1/income/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $income = Income::where('user_id', $userId)->find($id);

        if (!$income) {
            return response()->json([
                'success' => false,
                'message' => 'Income record not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        AuditLogService::log('income.deleted', $userId, Income::class, $id, [
            'amount' => $income->amount,
            'source' => $income->source,
        ]);

        $income->delete();

        return response()->json([
            'success' => true,
            'message' => 'Income record deleted successfully',
            'data' => new \stdClass(),
        ], 200);
    }
}
