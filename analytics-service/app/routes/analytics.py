from fastapi import APIRouter, Depends
from app.security import verify_internal_token
from app.schemas.analytics import (
    AnalyticsRequest, SummaryResponse, ExpenseAnalyticsResponse,
    IncomeAnalyticsResponse, AnalyticsFullResponse, ComparisonResponse,
    PatternResponse, AnomalyResponse, BudgetPerformanceResponse,
    GoalPerformanceResponse, AdvancedAnalyticsFullResponse
)
from app.services.summary_analysis import compute_summary_analytics
from app.services.expense_analysis import compute_expense_analytics
from app.services.income_analysis import compute_income_analytics
from app.services.trend_analysis import compute_trend_analytics
from app.services.comparison_analysis import compute_comparison_analytics
from app.services.pattern_analysis import compute_pattern_analytics
from app.services.anomaly_analysis import compute_anomaly_analytics
from app.services.budget_analysis import compute_budget_analytics
from app.services.goal_analysis import compute_goal_analytics

router = APIRouter(prefix="/internal/analytics", dependencies=[Depends(verify_internal_token)])

@router.post("/summary", response_model=SummaryResponse)
def get_summary_analytics(req: AnalyticsRequest):
    return compute_summary_analytics(req.user_id, req.from_date, req.to_date, req.period or "current_month")

@router.post("/expenses", response_model=ExpenseAnalyticsResponse)
def get_expense_analytics(req: AnalyticsRequest):
    return compute_expense_analytics(req.user_id, req.from_date, req.to_date, req.limit or 5)

@router.post("/income", response_model=IncomeAnalyticsResponse)
def get_income_analytics(req: AnalyticsRequest):
    return compute_income_analytics(req.user_id, req.from_date, req.to_date)

@router.post("/trends")
def get_trend_analytics(req: AnalyticsRequest):
    return compute_trend_analytics(req.user_id, req.from_date, req.to_date)

@router.post("/comparison", response_model=ComparisonResponse)
def get_comparison_analytics(req: AnalyticsRequest):
    return compute_comparison_analytics(req.user_id, req.from_date, req.to_date)

@router.post("/patterns", response_model=PatternResponse)
def get_pattern_analytics(req: AnalyticsRequest):
    return compute_pattern_analytics(req.user_id, req.from_date, req.to_date)

@router.post("/anomalies", response_model=AnomalyResponse)
def get_anomaly_analytics(req: AnalyticsRequest):
    return compute_anomaly_analytics(req.user_id, req.from_date, req.to_date)

@router.post("/budget-performance", response_model=BudgetPerformanceResponse)
def get_budget_performance(req: AnalyticsRequest):
    return compute_budget_analytics(req.user_id)

@router.post("/goal-performance", response_model=GoalPerformanceResponse)
def get_goal_performance(req: AnalyticsRequest):
    return compute_goal_analytics(req.user_id)

@router.post("/advanced-full", response_model=AdvancedAnalyticsFullResponse)
def get_advanced_full_analytics(req: AnalyticsRequest):
    summary = compute_summary_analytics(req.user_id, req.from_date, req.to_date, req.period or "current_month")
    comparison = compute_comparison_analytics(req.user_id, req.from_date, req.to_date)
    expenses = compute_expense_analytics(req.user_id, req.from_date, req.to_date, req.limit or 5)
    income = compute_income_analytics(req.user_id, req.from_date, req.to_date)
    trend_data = compute_trend_analytics(req.user_id, req.from_date, req.to_date)
    patterns = compute_pattern_analytics(req.user_id, req.from_date, req.to_date)
    anomalies = compute_anomaly_analytics(req.user_id, req.from_date, req.to_date)
    budgets = compute_budget_analytics(req.user_id)
    goals = compute_goal_analytics(req.user_id)

    return {
        "summary": summary,
        "comparison": comparison,
        "expense_analytics": expenses,
        "income_analytics": income,
        "monthly_trends": trend_data["monthly_trends"],
        "patterns": patterns,
        "anomalies": anomalies,
        "budget_performance": budgets,
        "goal_performance": goals
    }
