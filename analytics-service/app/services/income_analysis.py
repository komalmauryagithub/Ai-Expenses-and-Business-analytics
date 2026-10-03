import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_income_analytics(user_id: int, from_date: str, to_date: str) -> dict:
    engine = get_engine()

    query = text("""
        SELECT id, amount, income_date, type, source, description
        FROM income
        WHERE user_id = :user_id
          AND deleted_at IS NULL
          AND income_date BETWEEN :from_date AND :to_date
        ORDER BY income_date DESC
    """)

    with engine.connect() as conn:
        df = pd.read_sql_query(query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})

    if df.empty:
        return {
            "total_income": 0.0,
            "income_count": 0,
            "average_income": 0.0,
            "largest_income": 0.0,
            "smallest_income": 0.0,
            "types": []
        }

    total_income = clean_float(df['amount'].sum())
    income_count = len(df)
    avg_income = clean_float(df['amount'].mean())
    max_income = clean_float(df['amount'].max())
    min_income = clean_float(df['amount'].min())

    # Income Grouping by Type via Pandas
    grouped = df.groupby('type').agg(
        amount=('amount', 'sum'),
        count=('id', 'count'),
        average=('amount', 'mean'),
        largest=('amount', 'max')
    ).reset_index().sort_values(by='amount', ascending=False)

    types = []
    for _, row in grouped.iterrows():
        t_amount = clean_float(row['amount'])
        pct = clean_float((t_amount / total_income * 100.0) if total_income > 0 else 0.0)
        types.append({
            "type": str(row['type']).capitalize(),
            "amount": t_amount,
            "count": int(row['count']),
            "percentage": pct,
            "average_income": clean_float(row['average']),
            "largest_income": clean_float(row['largest'])
        })

    return {
        "total_income": total_income,
        "income_count": income_count,
        "average_income": avg_income,
        "largest_income": max_income,
        "smallest_income": min_income,
        "types": types
    }
