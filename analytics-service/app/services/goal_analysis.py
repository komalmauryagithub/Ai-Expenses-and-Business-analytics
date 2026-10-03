import pandas as pd
import numpy as np
from datetime import datetime
from sqlalchemy import text
from app.database import get_engine
from app.services.summary_analysis import clean_float

def compute_goal_analytics(user_id: int) -> dict:
    engine = get_engine()

    query = text("""
        SELECT id, name, target_amount, current_amount, target_date, description
        FROM financial_goals
        WHERE user_id = :user_id
        ORDER BY target_date ASC
    """)

    with engine.connect() as conn:
        df_goals = pd.read_sql_query(query, conn, params={"user_id": user_id})

    if df_goals.empty:
        return {
            "total_target_amount": 0.0,
            "total_contributed": 0.0,
            "total_remaining": 0.0,
            "average_completion_percentage": 0.0,
            "goals_count": 0,
            "active_count": 0,
            "completed_count": 0,
            "overdue_count": 0,
            "goals": []
        }

    total_target = clean_float(df_goals['target_amount'].sum())
    total_contributed = 0.0
    active_cnt = 0
    completed_cnt = 0
    overdue_cnt = 0
    goal_items = []
    completion_rates = []
    today = datetime.now().date()

    with engine.connect() as conn:
        for _, g in df_goals.iterrows():
            g_id = int(g['id'])
            target = clean_float(g['target_amount'])
            t_date = datetime.strptime(str(g['target_date']), "%Y-%m-%d").date()
            days_rem = (t_date - today).days

            # Calculate actual contributions for this goal
            contrib_res = conn.execute(text("""
                SELECT COALESCE(SUM(amount), 0) FROM goal_contributions
                WHERE financial_goal_id = :g_id
            """), {"g_id": g_id}).scalar()

            current = clean_float(contrib_res)
            total_contributed += current
            remaining = clean_float(max(0.0, target - current))
            pct = clean_float(min(100.0, (current / target * 100.0)) if target > 0 else 0.0)
            completion_rates.append(pct)

            if current >= target:
                status = 'completed'
                completed_cnt += 1
            elif today > t_date and current < target:
                status = 'overdue'
                overdue_cnt += 1
            else:
                status = 'active'
                active_cnt += 1

            goal_items.append({
                "id": g_id,
                "name": str(g['name']),
                "target_amount": target,
                "current_amount": current,
                "remaining_amount": remaining,
                "completion_percentage": pct,
                "target_date": str(g['target_date']),
                "days_remaining": days_rem,
                "status": status
            })

    total_contributed = clean_float(total_contributed)
    total_remaining = clean_float(max(0.0, total_target - total_contributed))
    avg_completion = clean_float(np.mean(completion_rates)) if completion_rates else 0.0

    return {
        "total_target_amount": total_target,
        "total_contributed": total_contributed,
        "total_remaining": total_remaining,
        "average_completion_percentage": avg_completion,
        "goals_count": len(df_goals),
        "active_count": active_cnt,
        "completed_count": completed_cnt,
        "overdue_count": overdue_cnt,
        "goals": goal_items
    }
