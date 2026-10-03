import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_budget_analytics(user_id: int) -> dict:
    engine = get_engine()

    query = text("""
        SELECT b.id, b.name, b.amount, b.start_date, b.end_date, b.alert_threshold, b.category_id,
               COALESCE(c.name, 'Overall Budget') as category_name
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = :user_id
        ORDER BY b.start_date DESC
    """)

    with engine.connect() as conn:
        df_budgets = pd.read_sql_query(query, conn, params={"user_id": user_id})

    if df_budgets.empty:
        return {
            "total_budgeted": 0.0,
            "total_spent": 0.0,
            "variance": 0.0,
            "utilization_rate": 0.0,
            "budgets_count": 0,
            "under_budget_count": 0,
            "near_limit_count": 0,
            "over_budget_count": 0,
            "budgets": []
        }

    total_budgeted = clean_float(df_budgets['amount'].sum())
    total_spent = 0.0
    under_cnt = 0
    near_cnt = 0
    over_cnt = 0
    budget_items = []

    with engine.connect() as conn:
        for _, b in df_budgets.iterrows():
            b_id = int(b['id'])
            b_amt = clean_float(b['amount'])
            b_start = str(b['start_date'])
            b_end = str(b['end_date'])
            b_thresh = clean_float(b['alert_threshold'])
            b_cat_id = b['category_id']

            # Calculate spent for this budget period
            if pd.notna(b_cat_id):
                exp_res = conn.execute(text("""
                    SELECT COALESCE(SUM(amount), 0) FROM expenses
                    WHERE user_id = :user_id AND deleted_at IS NULL AND category_id = :cat_id
                      AND expense_date BETWEEN :start AND :end
                """), {"user_id": user_id, "cat_id": int(b_cat_id), "start": b_start, "end": b_end}).scalar()
            else:
                exp_res = conn.execute(text("""
                    SELECT COALESCE(SUM(amount), 0) FROM expenses
                    WHERE user_id = :user_id AND deleted_at IS NULL
                      AND expense_date BETWEEN :start AND :end
                """), {"user_id": user_id, "start": b_start, "end": b_end}).scalar()

            spent = clean_float(exp_res)
            total_spent += spent
            remaining = clean_float(b_amt - spent)
            usage_pct = clean_float((spent / b_amt * 100.0) if b_amt > 0 else 0.0)

            if spent > b_amt:
                status = 'over_budget'
                over_cnt += 1
            elif usage_pct >= b_thresh:
                status = 'near_limit'
                near_cnt += 1
            else:
                status = 'under_budget'
                under_cnt += 1

            budget_items.append({
                "id": b_id,
                "name": str(b['name']),
                "category": str(b['category_name']),
                "amount": b_amt,
                "spent": spent,
                "remaining": remaining,
                "usage_percentage": usage_pct,
                "status": status
            })

    total_spent = clean_float(total_spent)
    variance = clean_float(total_budgeted - total_spent)
    utilization_rate = clean_float((total_spent / total_budgeted * 100.0) if total_budgeted > 0 else 0.0)

    return {
        "total_budgeted": total_budgeted,
        "total_spent": total_spent,
        "variance": variance,
        "utilization_rate": utilization_rate,
        "budgets_count": len(df_budgets),
        "under_budget_count": under_cnt,
        "near_limit_count": near_cnt,
        "over_budget_count": over_cnt,
        "budgets": budget_items
    }
