import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_trend_analytics(user_id: int, from_date: str, to_date: str) -> dict:
    engine = get_engine()

    exp_query = text("""
        SELECT amount, expense_date
        FROM expenses
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND expense_date BETWEEN :from_date AND :to_date
    """)

    inc_query = text("""
        SELECT amount, income_date
        FROM income
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND income_date BETWEEN :from_date AND :to_date
    """)

    with engine.connect() as conn:
        df_expenses = pd.read_sql_query(exp_query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})
        df_income = pd.read_sql_query(inc_query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})

    # Convert date columns to datetime
    if not df_expenses.empty:
        df_expenses['expense_date'] = pd.to_datetime(df_expenses['expense_date'])
        df_expenses['month'] = df_expenses['expense_date'].dt.strftime('%Y-%m')
        exp_monthly = df_expenses.groupby('month')['amount'].sum().to_dict()
    else:
        exp_monthly = {}

    if not df_income.empty:
        df_income['income_date'] = pd.to_datetime(df_income['income_date'])
        df_income['month'] = df_income['income_date'].dt.strftime('%Y-%m')
        inc_monthly = df_income.groupby('month')['amount'].sum().to_dict()
    else:
        inc_monthly = {}

    # Build continuous list of months in requested range
    start_dt = datetime.strptime(from_date, "%Y-%m-%d")
    end_dt = datetime.strptime(to_date, "%Y-%m-%d")

    # Collect unique YYYY-MM keys
    months = []
    curr = start_dt.replace(day=1)
    while curr <= end_dt:
        months.append(curr.strftime('%Y-%m'))
        # advance month
        if curr.month == 12:
            curr = curr.replace(year=curr.year + 1, month=1)
        else:
            curr = curr.replace(month=curr.month + 1)

    trends = []
    for m in months:
        inc_val = clean_float(inc_monthly.get(m, 0.0))
        exp_val = clean_float(exp_monthly.get(m, 0.0))
        bal_val = clean_float(inc_val - exp_val)
        sav_val = bal_val

        dt_obj = datetime.strptime(m, "%Y-%m")
        month_label = dt_obj.strftime("%b %Y")

        trends.append({
            "month": m,
            "month_label": month_label,
            "income": inc_val,
            "expenses": exp_val,
            "balance": bal_val,
            "savings": sav_val
        })

    # Compute Period-over-Period Growth
    # Compare current range totals with preceding equivalent range totals
    start_date_obj = datetime.strptime(from_date, "%Y-%m-%d")
    end_date_obj = datetime.strptime(to_date, "%Y-%m-%d")
    num_days = (end_date_obj - start_date_obj).days + 1

    prev_end_date = start_date_obj - timedelta(days=1)
    prev_start_date = prev_end_date - timedelta(days=num_days - 1)

    prev_from_str = prev_start_date.strftime("%Y-%m-%d")
    prev_to_str = prev_end_date.strftime("%Y-%m-%d")

    with engine.connect() as conn:
        prev_exp_res = conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM expenses
            WHERE user_id = :user_id AND deleted_at IS NULL AND expense_date BETWEEN :from_date AND :to_date
        """), {"user_id": user_id, "from_date": prev_from_str, "to_date": prev_to_str}).scalar()

        prev_inc_res = conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM income
            WHERE user_id = :user_id AND deleted_at IS NULL AND income_date BETWEEN :from_date AND :to_date
        """), {"user_id": user_id, "from_date": prev_from_str, "to_date": prev_to_str}).scalar()

    curr_total_exp = clean_float(df_expenses['amount'].sum() if not df_expenses.empty else 0.0)
    curr_total_inc = clean_float(df_income['amount'].sum() if not df_income.empty else 0.0)
    prev_total_exp = clean_float(prev_exp_res)
    prev_total_inc = clean_float(prev_inc_res)

    exp_growth = clean_float(
        ((curr_total_exp - prev_total_exp) / prev_total_exp * 100.0) if prev_total_exp > 0
        else (100.0 if curr_total_exp > 0 else 0.0)
    )

    inc_growth = clean_float(
        ((curr_total_inc - prev_total_inc) / prev_total_inc * 100.0) if prev_total_inc > 0
        else (100.0 if curr_total_inc > 0 else 0.0)
    )

    return {
        "monthly_trends": trends,
        "growth": {
            "current_expenses": curr_total_exp,
            "previous_expenses": prev_total_exp,
            "expense_growth_percentage": exp_growth,
            "current_income": curr_total_inc,
            "previous_income": prev_total_inc,
            "income_growth_percentage": inc_growth
        }
    }
