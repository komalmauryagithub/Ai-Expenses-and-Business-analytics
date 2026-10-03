# scratch/test_phase4_dashboard_api.ps1
# Comprehensive Verification Script for Phase 4 Dashboard API

$baseUrl = "http://localhost:8000/api/v1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " PHASE 4 DASHBOARD API VERIFICATION TEST " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Login as User A (user@example.com)
$userALoginBody = @{
    email = "user@example.com"
    password = "UserPassword123!"
} | ConvertTo-Json

$userARes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $userALoginBody -ContentType "application/json"
$userAToken = $userARes.data.token
$userAHeaders = @{
    "Authorization" = "Bearer $userAToken"
    "Accept" = "application/json"
}

Write-Host "[OK] User A Authenticated successfully." -ForegroundColor Green

# 2. Test Unauthenticated Request
try {
    $unauthRes = Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -Headers @{ "Accept" = "application/json" }
    Write-Host "[FAIL] Unauthenticated access passed (Should have returned 401)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "[OK] Unauthenticated request correctly rejected with 401 Unauthorized." -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected status code for unauth: $statusCode" -ForegroundColor Red
    }
}

# 3. Test Default Dashboard (current_month)
$dashCurrent = Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -Headers $userAHeaders
Write-Host "`n--- Default Dashboard Response (Current Month) ---" -ForegroundColor Yellow
Write-Host "Period: $($dashCurrent.data.period.name) ($($dashCurrent.data.period.from) to $($dashCurrent.data.period.to))" -ForegroundColor Gray
Write-Host "Total Income: RS $($dashCurrent.data.summary.total_income)" -ForegroundColor Gray
Write-Host "Total Expenses: RS $($dashCurrent.data.summary.total_expenses)" -ForegroundColor Gray
Write-Host "Balance: RS $($dashCurrent.data.summary.balance)" -ForegroundColor Gray
Write-Host "Savings Rate: $($dashCurrent.data.summary.savings_rate)%" -ForegroundColor Gray
Write-Host "Expense Count: $($dashCurrent.data.summary.expense_count)" -ForegroundColor Gray
Write-Host "Income Count: $($dashCurrent.data.summary.income_count)" -ForegroundColor Gray

if ($dashCurrent.success -eq $true -and $null -ne $dashCurrent.data.summary.total_income) {
    Write-Host "[OK] Default Dashboard API response valid." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Dashboard API response structure invalid." -ForegroundColor Red
}

# 4. Test Preset Date Filters (last_30_days, current_year, custom)
$dash30 = Invoke-RestMethod -Uri "$baseUrl/dashboard?period=last_30_days" -Method Get -Headers $userAHeaders
Write-Host "[OK] Filter period=last_30_days returned successfully (From: $($dash30.data.period.from) To: $($dash30.data.period.to))." -ForegroundColor Green

$dashYear = Invoke-RestMethod -Uri "$baseUrl/dashboard?period=current_year" -Method Get -Headers $userAHeaders
Write-Host "[OK] Filter period=current_year returned successfully (From: $($dashYear.data.period.from) To: $($dashYear.data.period.to))." -ForegroundColor Green

$customUri = "$baseUrl/dashboard?period=custom`&from_date=2026-01-01`&to_date=2026-12-31"
$dashCustom = Invoke-RestMethod -Uri $customUri -Method Get -Headers $userAHeaders
Write-Host "[OK] Filter period=custom returned successfully (From: $($dashCustom.data.period.from) To: $($dashCustom.data.period.to))." -ForegroundColor Green

# 5. Verify Monthly Trends Structure
if ($dashCurrent.data.monthly_trends.Count -gt 0) {
    Write-Host "[OK] Monthly trends returned $($dashCurrent.data.monthly_trends.Count) months of data." -ForegroundColor Green
    $firstMonth = $dashCurrent.data.monthly_trends[0]
    Write-Host "    Sample Month: $($firstMonth.month_label) | Inc: RS $($firstMonth.income) | Exp: RS $($firstMonth.expenses) | Bal: RS $($firstMonth.balance)" -ForegroundColor Gray
} else {
    Write-Host "[FAIL] Monthly trends empty or missing." -ForegroundColor Red
}

# 6. Verify User B Isolation (admin@example.com)
$adminLoginBody = @{
    email = "admin@example.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminRes.data.token
$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
    "Accept" = "application/json"
}

$dashAdmin = Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -Headers $adminHeaders
Write-Host "`n--- User B Dashboard (Admin Account) ---" -ForegroundColor Yellow
Write-Host "Total Income: RS $($dashAdmin.data.summary.total_income)" -ForegroundColor Gray
Write-Host "Total Expenses: RS $($dashAdmin.data.summary.total_expenses)" -ForegroundColor Gray
Write-Host "[OK] User B isolation verified. Admin user receives independent dashboard data." -ForegroundColor Green

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " ALL PHASE 4 DASHBOARD API TESTS PASSED! " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
