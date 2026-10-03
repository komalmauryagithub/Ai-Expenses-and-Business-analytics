import pandas as pd
import numpy as np
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_anomaly_analytics(user_id: int, from_date: str, to_date: str) -> dict:
    engine = get_engine()

    query = text("""
        SELECT e.id, e.amount, e.expense_date, e.payment_method, e.description,
               COALESCE(c.name, 'Uncategorized') as category
        FROM expenses e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = :user_id
          AND e.deleted_at IS NULL
          AND e.expense_date BETWEEN :from_date AND :to_date
        ORDER BY e.amount DESC
    """)

    with engine.connect() as conn:
        df = pd.read_sql_query(query, conn, params={"user_id": user_id, "from_date": from_date, "to_date": to_date})

    # Rule: Small datasets (< 4 expenses) cannot support statistically sound IQR outlier detection
    if df.empty or len(df) < 4:
        return {
            "available": False,
            "reason": "Insufficient transaction volume for statistical outlier detection (minimum 4 expenses required in selected period).",
            "q1": 0.0,
            "q3": 0.0,
            "iqr": 0.0,
            "upper_threshold": 0.0,
            "anomalies": []
        }

    amounts = df['amount'].astype(float).values
    q1 = clean_float(np.percentile(amounts, 25))
    q3 = clean_float(np.percentile(amounts, 75))
    iqr = clean_float(q3 - q1)
    upper_threshold = clean_float(q3 + 1.5 * iqr)

    # Detect outliers above upper_threshold
    outlier_df = df[df['amount'] > upper_threshold]

    anomalies = []
    for _, row in outlier_df.iterrows():
        anomalies.append({
            "id": int(row['id']),
            "amount": clean_float(row['amount']),
            "date": str(row['expense_date']),
            "description": str(row['description']) if pd.notna(row['description']) else str(row['category']),
            "category": str(row['category']),
            "payment_method": str(row['payment_method']).replace('_', ' ').title() if pd.notna(row['payment_method']) else 'Cash',
            "threshold": upper_threshold,
            "detection_method": "IQR Statistical Outlier (1.5 x IQR above Q3)",
            "label": "potential_anomaly"
        })

    return {
        "available": True,
        "reason": None,
        "q1": q1,
        "q3": q3,
        "iqr": iqr,
        "upper_threshold": upper_threshold,
        "anomalies": anomalies
    }
