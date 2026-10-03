import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

def compute_pattern_analytics(user_id: int, from_date: str, to_date: str) -> dict:
    engine = get_engine()

    query = text("""
        SELECT id, amount, expense_date, payment_method, category_id
        FROM expenses
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND expense_date BETWEEN :from_date AND :to_date
    """)

    with engine.connect() as conn:
        df = pd.read_sql_query(query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})

    if df.empty:
        return {
            "day_of_week": [{"day": day, "amount": 0.0, "count": 0, "average": 0.0, "percentage": 0.0} for day in DAYS_ORDER],
            "highest_spending_day": None,
            "lowest_spending_day": None,
            "active_days_count": 0,
            "avg_transactions_per_active_day": 0.0,
            "avg_expense_value": 0.0,
            "median_expense_value": 0.0
        }

    df['expense_date'] = pd.to_datetime(df['expense_date'])
    df['day_name'] = df['expense_date'].dt.day_name()

    total_exp = clean_float(df['amount'].sum())
    active_days_count = int(df['expense_date'].nunique())
    total_tx_count = len(df)
    avg_tx_per_active_day = clean_float(total_tx_count / active_days_count) if active_days_count > 0 else 0.0

    avg_exp_val = clean_float(df['amount'].mean())
    med_exp_val = clean_float(df['amount'].median())

    # Day of Week Grouping via Pandas
    day_grouped = df.groupby('day_name').agg(
        amount=('amount', 'sum'),
        count=('id', 'count')
    ).to_dict('index')

    day_of_week_list = []
    max_amt = -1.0
    min_amt = float('inf')
    highest_day = None
    lowest_day = None

    for day in DAYS_ORDER:
        info = day_grouped.get(day, {'amount': 0.0, 'count': 0})
        amt = clean_float(info['amount'])
        cnt = int(info['count'])
        avg = clean_float(amt / cnt) if cnt > 0 else 0.0
        pct = clean_float((amt / total_exp * 100.0) if total_exp > 0 else 0.0)

        day_of_week_list.append({
            "day": day,
            "amount": amt,
            "count": cnt,
            "average": avg,
            "percentage": pct
        })

        if amt > max_amt and amt > 0:
            max_amt = amt
            highest_day = day
        if amt < min_amt and amt > 0:
            min_amt = amt
            lowest_day = day

    return {
        "day_of_week": day_of_week_list,
        "highest_spending_day": highest_day,
        "lowest_spending_day": lowest_day,
        "active_days_count": active_days_count,
        "avg_transactions_per_active_day": avg_tx_per_active_day,
        "avg_expense_value": avg_exp_val,
        "median_expense_value": med_exp_val
    }
