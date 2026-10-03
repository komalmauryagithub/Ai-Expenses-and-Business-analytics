from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AnalyticsRequest(BaseModel):
    user_id: int = Field(..., description="Authenticated User ID")
    from_date: str = Field(..., description="Start Date (YYYY-MM-DD)")
    to_date: str = Field(..., description="End Date (YYYY-MM-DD)")
    period: Optional[str] = Field("current_month", description="Period Preset Name")
    limit: Optional[int] = Field(10, description="Top N limit")

class SummaryResponse(BaseModel):
    user_id: int
    period: str
    from_date: str
    to_date: str
    total_income: float
    total_expenses: float
    balance: float
    savings: float
    savings_rate: float
    average_expense: float
    median_expense: float
    largest_expense: float
    smallest_expense: float
    expense_count: int
    income_count: int
    descriptive_stats: Dict[str, float]

class CategoryItem(BaseModel):
    category: str
    amount: float
    count: int
    percentage: float

class PaymentMethodItem(BaseModel):
    payment_method: str
    amount: float
    count: int
    percentage: float

class TopExpenseItem(BaseModel):
    id: int
    amount: float
    description: Optional[str] = None
    category: str
    date: str
    payment_method: str

class ExpenseAnalyticsResponse(BaseModel):
    total_expenses: float
    expense_count: int
    average_expense: float
    median_expense: float
    categories: List[CategoryItem]
    payment_methods: List[PaymentMethodItem]
    top_expenses: List[TopExpenseItem]

class IncomeTypeItem(BaseModel):
    type: str
    amount: float
    count: int
    percentage: float
    average_income: float
    largest_income: float

class IncomeAnalyticsResponse(BaseModel):
    total_income: float
    income_count: int
    average_income: float
    largest_income: float
    smallest_income: float
    types: List[IncomeTypeItem]

class MonthlyTrendItem(BaseModel):
    month: str
    month_label: str
    income: float
    expenses: float
    balance: float
    savings: float

class GrowthResponse(BaseModel):
    current_expenses: float
    previous_expenses: float
    expense_growth_percentage: float
    current_income: float
    previous_income: float
    income_growth_percentage: float

class AnalyticsFullResponse(BaseModel):
    summary: SummaryResponse
    expense_analytics: ExpenseAnalyticsResponse
    income_analytics: IncomeAnalyticsResponse
    monthly_trends: List[MonthlyTrendItem]
    growth: GrowthResponse

# --- Phase 7 Advanced Analytics Schemas ---

class PeriodComparisonMetric(BaseModel):
    current: float
    previous: float
    change: float
    percentage_change: float

class ComparisonResponse(BaseModel):
    current_period: Dict[str, str]
    previous_period: Dict[str, str]
    income: PeriodComparisonMetric
    expenses: PeriodComparisonMetric
    balance: PeriodComparisonMetric
    savings_rate: PeriodComparisonMetric

class DayOfWeekItem(BaseModel):
    day: str
    amount: float
    count: int
    average: float
    percentage: float

class PatternResponse(BaseModel):
    day_of_week: List[DayOfWeekItem]
    highest_spending_day: Optional[str] = None
    lowest_spending_day: Optional[str] = None
    active_days_count: int
    avg_transactions_per_active_day: float
    avg_expense_value: float
    median_expense_value: float

class AnomalyItem(BaseModel):
    id: int
    amount: float
    date: str
    description: str
    category: str
    payment_method: str
    threshold: float
    detection_method: str
    label: str = "potential_anomaly"

class AnomalyResponse(BaseModel):
    available: bool
    reason: Optional[str] = None
    q1: Optional[float] = 0.0
    q3: Optional[float] = 0.0
    iqr: Optional[float] = 0.0
    upper_threshold: Optional[float] = 0.0
    anomalies: List[AnomalyItem] = []

class BudgetItemAnalysis(BaseModel):
    id: int
    name: str
    category: str
    amount: float
    spent: float
    remaining: float
    usage_percentage: float
    status: str

class BudgetPerformanceResponse(BaseModel):
    total_budgeted: float
    total_spent: float
    variance: float
    utilization_rate: float
    budgets_count: int
    under_budget_count: int
    near_limit_count: int
    over_budget_count: int
    budgets: List[BudgetItemAnalysis]

class GoalItemAnalysis(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    remaining_amount: float
    completion_percentage: float
    target_date: str
    days_remaining: int
    status: str

class GoalPerformanceResponse(BaseModel):
    total_target_amount: float
    total_contributed: float
    total_remaining: float
    average_completion_percentage: float
    goals_count: int
    active_count: int
    completed_count: int
    overdue_count: int
    goals: List[GoalItemAnalysis]

class AdvancedAnalyticsFullResponse(BaseModel):
    summary: SummaryResponse
    comparison: ComparisonResponse
    expense_analytics: ExpenseAnalyticsResponse
    income_analytics: IncomeAnalyticsResponse
    monthly_trends: List[MonthlyTrendItem]
    patterns: PatternResponse
    anomalies: AnomalyResponse
    budget_performance: BudgetPerformanceResponse
    goal_performance: GoalPerformanceResponse
