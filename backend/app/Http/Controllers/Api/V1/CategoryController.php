<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * List Accessible Categories (System + Authenticated User's Custom Categories)
     * GET /api/v1/categories
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $query = Category::forUser($userId);

        if ($request->has('type') && in_array($request->type, ['expense', 'income'])) {
            $query->where('type', $request->type);
        }

        $categories = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully',
            'data' => [
                'categories' => CategoryResource::collection($categories),
            ],
        ], 200);
    }

    /**
     * Create Custom Category for Authenticated User
     * POST /api/v1/categories
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $validated = $request->validated();

        // Check for duplicate category name for this user or system
        $existing = Category::forUser($userId)
            ->where('type', $validated['type'])
            ->whereRaw('LOWER(name) = ?', [strtolower($validated['name'])])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A category with this name already exists for ' . $validated['type'] . 's.',
                'errors' => [
                    'name' => ['A category with this name already exists.'],
                ],
            ], 422);
        }

        $category = Category::create([
            'user_id' => $userId,
            'name' => $validated['name'],
            'type' => $validated['type'],
        ]);

        AuditLogService::log('category.created', $userId, Category::class, $category->id, [
            'name' => $category->name,
            'type' => $category->type,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => [
                'category' => new CategoryResource($category),
            ],
        ], 201);
    }

    /**
     * Get Category Details
     * GET /api/v1/categories/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $category = Category::forUser($userId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Category retrieved successfully',
            'data' => [
                'category' => new CategoryResource($category),
            ],
        ], 200);
    }

    /**
     * Update Custom Category
     * PATCH /api/v1/categories/{id}
     */
    public function update(int $id, UpdateCategoryRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.',
                'errors' => new \stdClass(),
            ], 404);
        }

        // Protect system categories and other users' categories
        if (is_null($category->user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. System categories cannot be modified.',
                'errors' => new \stdClass(),
            ], 403);
        }

        if ($category->user_id !== $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not own this category.',
                'errors' => new \stdClass(),
            ], 403);
        }

        $validated = $request->validated();
        $category->update($validated);

        AuditLogService::log('category.updated', $userId, Category::class, $category->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => [
                'category' => new CategoryResource($category),
            ],
        ], 200);
    }

    /**
     * Delete Custom Category (With Integrity Checks)
     * DELETE /api/v1/categories/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.',
                'errors' => new \stdClass(),
            ], 404);
        }

        if (is_null($category->user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. System categories cannot be deleted.',
                'errors' => new \stdClass(),
            ], 403);
        }

        if ($category->user_id !== $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not own this category.',
                'errors' => new \stdClass(),
            ], 403);
        }

        // Integrity Check: Prevent deletion if expenses or income are attached
        $linkedExpenses = $category->expenses()->count();
        $linkedIncome = $category->income()->count();

        if ($linkedExpenses > 0 || $linkedIncome > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category because it is currently linked to existing financial records.',
                'errors' => [
                    'category' => ['Category has active linked records (' . ($linkedExpenses + $linkedIncome) . ' records).'],
                ],
            ], 422);
        }

        AuditLogService::log('category.deleted', $userId, Category::class, $id, [
            'name' => $category->name,
            'type' => $category->type,
        ]);

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
            'data' => new \stdClass(),
        ], 200);
    }
}
