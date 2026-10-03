import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_engine

def clean_float(val) -> float:
    if val is None:
        return 0.0
    try:
        f_val = float(val)
        if np.isnan(f_val) or np.isinf(f_val):
            return 0.0
        return round(f_val, 2)
    except (ValueError, TypeError):
        return 0.0

def compute_summary_analytics(user_id: int, from_date: str, to_date: str, period: str = "current_month") -> dict:
    engine = get_engine()

    # Query user expenses with SQLAlchemy parameter binding
    exp_query = text("""
        SELECT e.id, e.amount, e.expense_date, COALESCE(c.name, 'Uncategorized') as category
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = :user_id
          AND e.deleted_at IS NULL
          AND e.expense_date BETWEEN :from_date AND :to_date
    """)

    # Query user income with SQLAlchemy parameter binding
    inc_query = text("""
        SELECT id, amount, income_date, type, source
        FROM income
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND income_date BETWEEN :from_date AND :to_date
    """)

    with engine.connect() as conn:
        df_expenses = pd.read_sql_query(exp_query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})
        df_income = pd.read_sql_query(inc_query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})

    # Calculations using Pandas & NumPy
    total_income = clean_float(df_income['amount'].sum() if not df_income.empty else 0.0)
    total_expenses = clean_float(df_expenses['amount'].sum() if not df_expenses.empty else 0.0)
    balance = clean_float(total_income - total_expenses)
    savings = balance
    savings_rate = clean_float((savings / total_income * 100.0) if total_income > 0 else 0.0)

    expense_amounts = df_expenses['amount'].astype(float).values if not df_expenses.empty else np.array([])
    income_amounts = df_income['amount'].astype(float).values if not df_income.empty else np.array([])

    if len(expense_amounts) > 0:
        avg_expense = clean_float(np.mean(expense_amounts))
        med_expense = clean_float(np.median(expense_amounts))
        max_expense = clean_float(np.max(expense_amounts))
        min_expense = clean_float(np.min(expense_amounts))
        std_expense = clean_float(np.std(expense_amounts))
        p25_expense = clean_float(np.percentile(expense_amounts, 25))
        p50_expense = clean_float(np.percentile(expense_amounts, 50))
        p75_expense = clean_float(np.percentile(expense_amounts, 75))
    else:
        avg_expense = med_expense = max_expense = min_expense = 0.0
        std_expense = p25_expense = p50_expense = p75_expense = 0.0

    return {
        "user_id": user_id,
        "period": period,
        "from_date": from_date,
        "to_date": to_date,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "savings": savings,
        "savings_rate": savings_rate,
        "average_expense": avg_expense,
        "median_expense": med_expense,
        "largest_expense": max_expense,
        "smallest_expense": min_expense,
        "expense_count": len(expense_amounts),
        "income_count": len(income_amounts),
        "descriptive_stats": {
            "mean": avg_expense,
            "median": med_expense,
            "std_dev": std_expense,
            "p25": p25_expense,
            "p50": p50_expense,
            "p75": p75_expense,
            "max": max_expense,
            "min": min_expense,
        }
    }
