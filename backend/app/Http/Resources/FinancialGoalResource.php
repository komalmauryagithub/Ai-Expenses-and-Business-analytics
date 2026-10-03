<?php

namespace App\Http\Resources;

use App\Services\GoalService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinancialGoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $goalService = app(GoalService::class);
        $metrics = $goalService->calculateMetrics($this->resource);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'target_amount' => $metrics['target_amount'],
            'current_amount' => $metrics['current_amount'],
            'remaining_amount' => $metrics['remaining_amount'],
            'completion_percentage' => $metrics['completion_percentage'],
            'target_date' => $this->target_date->toDateString(),
            'days_remaining' => $metrics['days_remaining'],
            'status' => $metrics['status'],
            'description' => $this->description,
            'contributions_count' => $this->whenCounted('contributions', $this->contributions_count, function () {
                return $this->contributions()->count();
            }),
            'contributions' => ContributionResource::collection($this->whenLoaded('contributions')),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
