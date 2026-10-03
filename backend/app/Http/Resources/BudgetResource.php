<?php

namespace App\Http\Resources;

use App\Services\BudgetService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $budgetService = app(BudgetService::class);
        $metrics = $budgetService->calculateMetrics($this->resource);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'alert_threshold' => (float) $this->alert_threshold,
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'category_id' => $this->category_id,
            'category' => $this->whenLoaded('category', function () {
                return new CategoryResource($this->category);
            }),
            'spent' => $metrics['spent'],
            'remaining' => $metrics['remaining'],
            'usage_percentage' => $metrics['usage_percentage'],
            'threshold_reached' => $metrics['threshold_reached'],
            'status' => $metrics['status'],
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
