import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ai_expense_db")
    ANALYTICS_SERVICE_TOKEN: str = os.getenv("ANALYTICS_SERVICE_TOKEN", "secret-analytics-internal-token-2026")
    APP_ENV: str = os.getenv("APP_ENV", "development")

settings = Settings()
