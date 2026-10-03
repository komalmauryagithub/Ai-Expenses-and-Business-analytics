import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_expense_analytics(user_id: int, from_date: str, to_date: str, limit: int = 5) -> dict:
    engine = get_engine()

    query = text("""
        SELECT e.id, e.amount, e.expense_date, e.payment_method, e.description,
               COALESCE(c.name, 'Uncategorized') as category
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = :user_id
          AND e.deleted_at IS NULL
          AND e.expense_date BETWEEN :from_date AND :to_date
        ORDER BY e.expense_date DESC
    """)

    with engine.connect() as conn:
        df = pd.read_sql_query(query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})

    if df.empty:
        return {
            "total_expenses": 0.0,
            "expense_count": 0,
            "average_expense": 0.0,
            "median_expense": 0.0,
            "categories": [],
            "payment_methods": [],
            "top_expenses": []
        }

    total_expenses = clean_float(df['amount'].sum())
    expense_count = len(df)
    avg_expense = clean_float(df['amount'].mean())
    med_expense = clean_float(df['amount'].median())

    # Category Grouping via Pandas
    cat_grouped = df.groupby('category').agg(
        amount=('amount', 'sum'),
        count=('id', 'count')
    ).reset_index().sort_values(by='amount', ascending=False)

    categories = []
    for _, row in cat_grouped.iterrows():
        cat_amount = clean_float(row['amount'])
        pct = clean_float((cat_amount / total_expenses * 100.0) if total_expenses > 0 else 0.0)
        categories.append({
            "category": str(row['category']),
            "amount": cat_amount,
            "count": int(row['count']),
            "percentage": pct
        })

    # Payment Method Grouping via Pandas
    pm_grouped = df.groupby('payment_method').agg(
        amount=('amount', 'sum'),
        count=('id', 'count')
    ).reset_index().sort_values(by='amount', ascending=False)

    payment_methods = []
    for _, row in pm_grouped.iterrows():
        pm_amount = clean_float(row['amount'])
        pct = clean_float((pm_amount / total_expenses * 100.0) if total_expenses > 0 else 0.0)
        pm_name = str(row['payment_method']).replace('_', ' ').title() if pd.notna(row['payment_method']) else 'Cash'
        payment_methods.append({
            "payment_method": pm_name,
            "amount": pm_amount,
            "count": int(row['count']),
            "percentage": pct
        })

    # Top Expenses via Pandas
    top_df = df.sort_values(by='amount', ascending=False).head(limit)
    top_expenses = []
    for _, row in top_df.iterrows():
        top_expenses.append({
            "id": int(row['id']),
            "amount": clean_float(row['amount']),
            "description": str(row['description']) if pd.notna(row['description']) else str(row['category']),
            "category": str(row['category']),
            "date": str(row['expense_date']),
            "payment_method": str(row['payment_method']).replace('_', ' ').title() if pd.notna(row['payment_method']) else 'Cash'
        })

    return {
        "total_expenses": total_expenses,
        "expense_count": expense_count,
        "average_expense": avg_expense,
        "median_expense": med_expense,
        "categories": categories,
        "payment_methods": payment_methods,
        "top_expenses": top_expenses
    }
