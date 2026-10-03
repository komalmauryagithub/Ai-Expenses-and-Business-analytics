from fastapi import Header, HTTPException, status
from app.config import settings

def verify_internal_token(x_analytics_token: str = Header(..., alias="X-Analytics-Token")):
    if x_analytics_token != settings.ANALYTICS_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal analytics service authentication token."
        )
    return True
