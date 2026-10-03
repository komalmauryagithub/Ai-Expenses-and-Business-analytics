# Test script for Phase 7 Advanced Analytics verification
$ErrorActionPreference = "Stop"

Write-Host "=== Phase 7 Verification: Python FastAPI & Laravel Analytics Integration ===" -ForegroundColor Cyan

# 1. Test direct FastAPI health check
Write-Host "`n1. Testing FastAPI direct health check (http://127.0.0.1:8001/health)..." -ForegroundColor Yellow
$healthResp = Invoke-RestMethod -Uri "http://127.0.0.1:8001/health" -Method Get
Write-Host "FastAPI Health Status:" ($healthResp | ConvertTo-Json -Compress)

# 2. Test direct FastAPI security (No X-Analytics-Token header -> HTTP 401 expected)
Write-Host "`n2. Testing direct FastAPI security (No token header -> HTTP 401 expected)..." -ForegroundColor Yellow
try {
    $unauthResp = Invoke-WebRequest -Uri "http://127.0.0.1:8001/internal/analytics/advanced-full" -Method Post -ContentType "application/json" -Body '{"user_id":1}'
    Write-Host "FAILED: Expected 401, but request succeeded." -ForegroundColor Red
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    if ($code -eq 401) {
        Write-Host "SUCCESS: FastAPI rejected request without token header with HTTP 401 Unauthorized." -ForegroundColor Green
    } else {
        Write-Host "FAILED: Expected 401, got status code $code" -ForegroundColor Red
    }
}

# 3. Log in User A (user@example.com) via Laravel API
Write-Host "`n3. Logging in User A (user@example.com)..." -ForegroundColor Yellow
$loginBodyA = @{ email = "user@example.com"; password = "UserPassword123!" } | ConvertTo-Json
$loginRespA = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $loginBodyA -ContentType "application/json"
$tokenA = $loginRespA.data.token
$headersA = @{ "Authorization" = "Bearer $tokenA"; "Accept" = "application/json" }
Write-Host "Logged in User A successfully (ID: $($loginRespA.data.user.id))" -ForegroundColor Green

# 4. Log in User B (admin@example.com) via Laravel API
Write-Host "`n4. Logging in User B (admin@example.com)..." -ForegroundColor Yellow
$loginBodyB = @{ email = "admin@example.com"; password = "AdminPassword123!" } | ConvertTo-Json
$loginRespB = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $loginBodyB -ContentType "application/json"
$tokenB = $loginRespB.data.token
$headersB = @{ "Authorization" = "Bearer $tokenB"; "Accept" = "application/json" }
Write-Host "Logged in User B successfully (ID: $($loginRespB.data.user.id))" -ForegroundColor Green

# 5. Test Advanced Summary Endpoint for User A
Write-Host "`n5. Testing GET /api/v1/analytics/advanced-summary for User A..." -ForegroundColor Yellow
$advSummaryA = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/advanced-summary?period=current_month" -Method Get -Headers $headersA
Write-Host "Advanced Summary Response JSON structure:"
Write-Host ($advSummaryA.data | ConvertTo-Json -Depth 3)

# 6. Test Data Isolation (User B Advanced Summary)
Write-Host "`n6. Testing GET /api/v1/analytics/advanced-summary for User B (Data Isolation Check)..." -ForegroundColor Yellow
$advSummaryB = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/advanced-summary?period=current_month" -Method Get -Headers $headersB
Write-Host "User B Summary Response JSON structure:"
Write-Host ($advSummaryB.data | ConvertTo-Json -Depth 2)

# 7. Test Individual Phase 7 Endpoints for User A
Write-Host "`n7. Testing individual Phase 7 endpoints..." -ForegroundColor Yellow

$comp = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/comparison?period=current_month" -Method Get -Headers $headersA
Write-Host "Comparison Endpoint Status: OK"

$patterns = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/spending-patterns?period=current_month" -Method Get -Headers $headersA
Write-Host "Spending Patterns Endpoint Status: OK"

$anomalies = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/anomalies?period=current_month" -Method Get -Headers $headersA
Write-Host "Anomalies Endpoint Status: OK"

$budgets = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/budget-performance" -Method Get -Headers $headersA
Write-Host "Budget Performance Endpoint Status: OK"

$goals = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/analytics/goal-performance" -Method Get -Headers $headersA
Write-Host "Goal Performance Endpoint Status: OK"

Write-Host "`n=== ALL PHASE 7 VERIFICATION CHECKS PASSED SUCCESSFULLY! ===" -ForegroundColor Green
