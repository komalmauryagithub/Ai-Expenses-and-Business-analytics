<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContributionRequest;
use App\Http\Requests\UpdateContributionRequest;
use App\Http\Resources\ContributionResource;
use App\Http\Resources\FinancialGoalResource;
use App\Models\FinancialGoal;
use App\Models\GoalContribution;
use App\Services\AuditLogService;
use App\Services\GoalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalContributionController extends Controller
{
    protected GoalService $goalService;

    public function __construct(GoalService $goalService)
    {
        $this->goalService = $goalService;
    }

    /**
     * List all contributions for a specific financial goal.
     * GET /api/v1/goals/{goalId}/contributions
     */
    public function index(int $goalId, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::where('user_id', $userId)->find($goalId);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $contributions = $goal->contributions()->orderBy('contribution_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Contributions retrieved successfully',
            'data' => [
                'contributions' => ContributionResource::collection($contributions),
            ],
        ], 200);
    }

    /**
     * Add a new contribution to a financial goal.
     * POST /api/v1/goals/{goalId}/contributions
     */
    public function store(int $goalId, StoreContributionRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::where('user_id', $userId)->find($goalId);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $validated = $request->validated();

        $contribution = $goal->contributions()->create([
            'amount' => $validated['amount'],
            'contribution_date' => $validated['contribution_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $this->goalService->syncCurrentAmount($goal);
        $goal->refresh();

        AuditLogService::log('goal_contribution.created', $userId, GoalContribution::class, $contribution->id, [
            'financial_goal_id' => $goal->id,
            'amount' => $contribution->amount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contribution added successfully',
            'data' => [
                'contribution' => new ContributionResource($contribution),
                'goal' => new FinancialGoalResource($goal),
            ],
        ], 201);
    }

    /**
     * Update a contribution.
     * PATCH /api/v1/goals/{goalId}/contributions/{contributionId}
     */
    public function update(int $goalId, int $contributionId, UpdateContributionRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::where('user_id', $userId)->find($goalId);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $contribution = $goal->contributions()->find($contributionId);

        if (!$contribution) {
            return response()->json([
                'success' => false,
                'message' => 'Goal contribution not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $validated = $request->validated();
        $contribution->update($validated);

        $this->goalService->syncCurrentAmount($goal);
        $goal->refresh();

        AuditLogService::log('goal_contribution.updated', $userId, GoalContribution::class, $contribution->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Contribution updated successfully',
            'data' => [
                'contribution' => new ContributionResource($contribution),
                'goal' => new FinancialGoalResource($goal),
            ],
        ], 200);
    }

    /**
     * Delete a contribution.
     * DELETE /api/v1/goals/{goalId}/contributions/{contributionId}
     */
    public function destroy(int $goalId, int $contributionId, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $goal = FinancialGoal::where('user_id', $userId)->find($goalId);

        if (!$goal) {
            return response()->json([
                'success' => false,
                'message' => 'Financial goal not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        $contribution = $goal->contributions()->find($contributionId);

        if (!$contribution) {
            return response()->json([
                'success' => false,
                'message' => 'Goal contribution not found or inaccessible.',
                'errors' => new \stdClass(),
            ], 404);
        }

        AuditLogService::log('goal_contribution.deleted', $userId, GoalContribution::class, $contributionId, [
            'amount' => $contribution->amount,
        ]);

        $contribution->delete();

        $this->goalService->syncCurrentAmount($goal);
        $goal->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Contribution deleted successfully',
            'data' => [
                'goal' => new FinancialGoalResource($goal),
            ],
        ], 200);
    }
}
