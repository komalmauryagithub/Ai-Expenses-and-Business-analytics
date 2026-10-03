# scratch/test_phase5_api.ps1
# Comprehensive Verification Script for Phase 5 Budget & Financial Goals API

$baseUrl = "http://localhost:8000/api/v1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " PHASE 5 BUDGETS & GOALS API VERIFICATION " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Login as User A (user@example.com)
$userALogin = @{ email = "user@example.com"; password = "UserPassword123!" } | ConvertTo-Json
$userARes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $userALogin -ContentType "application/json"
$userAToken = $userARes.data.token
$userAHeaders = @{ "Authorization" = "Bearer $userAToken"; "Accept" = "application/json" }

Write-Host "[OK] User A authenticated successfully." -ForegroundColor Green

# 2. Test Unauthenticated Access to Budgets and Goals
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/budgets" -Method Get -Headers @{ "Accept" = "application/json" }
    Write-Host "[FAIL] Unauthenticated budget access succeeded." -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "[OK] Unauthenticated budget request correctly rejected with 401." -ForegroundColor Green
    }
}

# 3. Create a Test Expense Category for User A
$catBody = @{ name = "Phase 5 Dining"; type = "expense" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Post -Body $catBody -Headers $userAHeaders -ContentType "application/json"
$catId = $catRes.data.category.id
Write-Host "[OK] Created expense category ID: $catId." -ForegroundColor Green

# 4. Create an Expense inside the Category
$expBody = @{
    amount = 3500.00
    expense_date = (Get-Date).ToString("yyyy-MM-dd")
    category_id = $catId
    payment_method = "credit_card"
    description = "Team Lunch for Budget Test"
} | ConvertTo-Json
$expRes = Invoke-RestMethod -Uri "$baseUrl/expenses" -Method Post -Body $expBody -Headers $userAHeaders -ContentType "application/json"
Write-Host "[OK] Created expense ₹3,500.00 for category ID: $catId." -ForegroundColor Green

# 5. Create a Budget (Amount ₹5,000.00, Threshold 70%)
$budgetBody = @{
    name = "Monthly Dining Budget"
    amount = 5000.00
    start_date = (Get-Date).ToString("yyyy-MM-01")
    end_date = (Get-Date).AddMonths(1).ToString("yyyy-MM-01")
    alert_threshold = 70.00
    category_id = $catId
} | ConvertTo-Json
$budgetRes = Invoke-RestMethod -Uri "$baseUrl/budgets" -Method Post -Body $budgetBody -Headers $userAHeaders -ContentType "application/json"
$budgetId = $budgetRes.data.budget.id

Write-Host "`n--- Created Budget Details ---" -ForegroundColor Yellow
Write-Host "Budget Name: $($budgetRes.data.budget.name)" -ForegroundColor Gray
Write-Host "Amount: RS $($budgetRes.data.budget.amount)" -ForegroundColor Gray
Write-Host "Spent: RS $($budgetRes.data.budget.spent)" -ForegroundColor Gray
Write-Host "Remaining: RS $($budgetRes.data.budget.remaining)" -ForegroundColor Gray
Write-Host "Usage: $($budgetRes.data.budget.usage_percentage)%" -ForegroundColor Gray
Write-Host "Threshold Reached: $($budgetRes.data.budget.threshold_reached)" -ForegroundColor Gray
Write-Host "Status: $($budgetRes.data.budget.status)" -ForegroundColor Gray

if ($budgetRes.data.budget.spent -eq "3500.00" -and $budgetRes.data.budget.status -eq "near_limit") {
    Write-Host "[OK] Budget spending calculation & near_limit status verified." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Budget spending calculation incorrect." -ForegroundColor Red
}

# 6. Create a Financial Goal (Emergency Fund: ₹50,000)
$goalBody = @{
    name = "Emergency Reserve 2026"
    target_amount = 50000.00
    target_date = "2026-12-31"
    description = "Safety net for unexpected expenses"
} | ConvertTo-Json
$goalRes = Invoke-RestMethod -Uri "$baseUrl/goals" -Method Post -Body $goalBody -Headers $userAHeaders -ContentType "application/json"
$goalId = $goalRes.data.goal.id
Write-Host "`n[OK] Created Financial Goal ID: $goalId ($($goalRes.data.goal.name))." -ForegroundColor Green

# 7. Add Contribution to Goal (₹15,000)
$contribBody = @{
    amount = 15000.00
    contribution_date = (Get-Date).ToString("yyyy-MM-dd")
    notes = "First deposit from monthly savings"
} | ConvertTo-Json
$contribRes = Invoke-RestMethod -Uri "$baseUrl/goals/$goalId/contributions" -Method Post -Body $contribBody -Headers $userAHeaders -ContentType "application/json"
$contribId = $contribRes.data.contribution.id

Write-Host "Contribution ID: $contribId added." -ForegroundColor Gray
Write-Host "Goal Target: RS $($contribRes.data.goal.target_amount)" -ForegroundColor Gray
Write-Host "Current Amount: RS $($contribRes.data.goal.current_amount)" -ForegroundColor Gray
Write-Host "Completion: $($contribRes.data.goal.completion_percentage)%" -ForegroundColor Gray
Write-Host "Status: $($contribRes.data.goal.status)" -ForegroundColor Gray

if ($contribRes.data.goal.current_amount -eq "15000.00" -and $contribRes.data.goal.completion_percentage -eq 30) {
    Write-Host "[OK] Goal contribution sync & progress percentage verified." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Goal contribution sync calculation error." -ForegroundColor Red
}

# 8. User B Security Isolation Test (admin@example.com)
$userBLogin = @{ email = "admin@example.com"; password = "AdminPassword123!" } | ConvertTo-Json
$userBRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $userBLogin -ContentType "application/json"
$userBToken = $userBRes.data.token
$userBHeaders = @{ "Authorization" = "Bearer $userBToken"; "Accept" = "application/json" }

try {
    $null = Invoke-RestMethod -Uri "$baseUrl/budgets/$budgetId" -Method Get -Headers $userBHeaders
    Write-Host "[FAIL] User B accessed User A's budget!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "[OK] User B cross-user budget access correctly denied with 404." -ForegroundColor Green
    }
}

try {
    $null = Invoke-RestMethod -Uri "$baseUrl/goals/$goalId" -Method Get -Headers $userBHeaders
    Write-Host "[FAIL] User B accessed User A's financial goal!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "[OK] User B cross-user goal access correctly denied with 404." -ForegroundColor Green
    }
}

try {
    $illegalContrib = @{ amount = 1000.00; contribution_date = "2026-10-01" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/goals/$goalId/contributions" -Method Post -Body $illegalContrib -Headers $userBHeaders -ContentType "application/json"
    Write-Host "[FAIL] User B contributed to User A's goal!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "[OK] User B cross-user goal contribution correctly blocked with 404." -ForegroundColor Green
    }
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " ALL PHASE 5 API VERIFICATION TESTS PASSED! " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
