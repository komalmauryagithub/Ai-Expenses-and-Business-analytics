import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_comparison_analytics(user_id: int, from_date: str, to_date: str) -> dict:
    engine = get_engine()

    curr_start = datetime.strptime(from_date, "%Y-%m-%d")
    curr_end = datetime.strptime(to_date, "%Y-%m-%d")
    days_diff = (curr_end - curr_start).days + 1

    prev_end = curr_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days_diff - 1)

    prev_from_str = prev_start.strftime("%Y-%m-%d")
    prev_to_str = prev_end.strftime("%Y-%m-%d")

    # Current Period Totals
    with engine.connect() as conn:
        curr_inc = clean_float(conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM income
            WHERE user_id = :user_id AND deleted_at IS NULL AND income_date BETWEEN :f AND :t
        """), {"user_id": user_id, "f": from_date, "t": to_date}).scalar())

        curr_exp = clean_float(conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM expenses
            WHERE user_id = :user_id AND deleted_at IS NULL AND expense_date BETWEEN :f AND :t
        """), {"user_id": user_id, "f": from_date, "t": to_date}).scalar())

        # Previous Period Totals
        prev_inc = clean_float(conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM income
            WHERE user_id = :user_id AND deleted_at IS NULL AND income_date BETWEEN :f AND :t
        """), {"user_id": user_id, "f": prev_from_str, "t": prev_to_str}).scalar())

        prev_exp = clean_float(conn.execute(text("""
            SELECT COALESCE(SUM(amount), 0) FROM expenses
            WHERE user_id = :user_id AND deleted_at IS NULL AND expense_date BETWEEN :f AND :t
        """), {"user_id": user_id, "f": prev_from_str, "t": prev_to_str}).scalar())

    curr_bal = clean_float(curr_inc - curr_exp)
    prev_bal = clean_float(prev_inc - prev_exp)

    curr_sav_rate = clean_float((curr_bal / curr_inc * 100.0) if curr_inc > 0 else 0.0)
    prev_sav_rate = clean_float((prev_bal / prev_inc * 100.0) if prev_inc > 0 else 0.0)

    # Safe Percentage Change Helper
    def calc_metric(curr_val: float, prev_val: float) -> dict:
        chg = clean_float(curr_val - prev_val)
        if prev_val > 0:
            pct_chg = clean_float((chg / prev_val) * 100.0)
        elif curr_val > 0:
            pct_chg = 100.0
        else:
            pct_chg = 0.0
        return {
            "current": curr_val,
            "previous": prev_val,
            "change": chg,
            "percentage_change": pct_chg
        }

    return {
        "current_period": {"from": from_date, "to": to_date},
        "previous_period": {"from": prev_from_str, "to": prev_to_str},
        "income": calc_metric(curr_inc, prev_inc),
        "expenses": calc_metric(curr_exp, prev_exp),
        "balance": calc_metric(curr_bal, prev_bal),
        "savings_rate": calc_metric(curr_sav_rate, prev_sav_rate),
    }
