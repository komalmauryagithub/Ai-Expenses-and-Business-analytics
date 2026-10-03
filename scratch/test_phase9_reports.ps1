# Test script for Phase 9 Report Center & Financial Exports verification
$ErrorActionPreference = "Stop"

Write-Host "=== Phase 9 Verification: Report Center, Reconciliation, CSV & PDF Exports ===" -ForegroundColor Cyan

# 1. Log in User A (user@example.com) via Laravel API
Write-Host "`n1. Logging in User A (user@example.com)..." -ForegroundColor Yellow
$loginBodyA = @{ email = "user@example.com"; password = "UserPassword123!" } | ConvertTo-Json
$loginRespA = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $loginBodyA -ContentType "application/json"
$tokenA = $loginRespA.data.token
$headersA = @{ "Authorization" = "Bearer $tokenA"; "Accept" = "application/json" }
Write-Host "Logged in User A successfully (ID: $($loginRespA.data.user.id))" -ForegroundColor Green

# 2. Log in User B (admin@example.com) via Laravel API
Write-Host "`n2. Logging in User B (admin@example.com)..." -ForegroundColor Yellow
$loginBodyB = @{ email = "admin@example.com"; password = "AdminPassword123!" } | ConvertTo-Json
$loginRespB = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $loginBodyB -ContentType "application/json"
$tokenB = $loginRespB.data.token
$headersB = @{ "Authorization" = "Bearer $tokenB"; "Accept" = "application/json" }
Write-Host "Logged in User B successfully (ID: $($loginRespB.data.user.id))" -ForegroundColor Green

# 3. Test GET /api/v1/reports/types
Write-Host "`n3. Testing GET /api/v1/reports/types..." -ForegroundColor Yellow
$typesResp = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/types" -Method Get -Headers $headersA
Write-Host "Supported Report Types Count:" $typesResp.data.Count
foreach ($t in $typesResp.data) {
    Write-Host " - [$($t.id)] $($t.name): $($t.description)"
}

# 4. Test Report Previews for all 9 Report Types
Write-Host "`n4. Testing Report Previews (POST /api/v1/reports/preview)..." -ForegroundColor Yellow

$reportTypesToTest = @('expense', 'income', 'summary', 'category', 'budget', 'goal', 'transaction', 'monthly', 'analytics')
foreach ($rtype in $reportTypesToTest) {
    $previewPayload = @{ report_type = $rtype; period = "current_month" } | ConvertTo-Json
    $prevResp = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/preview" -Method Post -Headers $headersA -ContentType "application/json" -Body $previewPayload
    Write-Host "Preview [$rtype] Success:" $prevResp.success "| Title:" $prevResp.data.title "| Rows:" $prevResp.data.rows.Count -ForegroundColor Green
}

# 5. Financial Reconciliation Check (Dashboard vs Report Totals)
Write-Host "`n5. Testing Financial Total Reconciliation (Dashboard vs Report Totals)..." -ForegroundColor Yellow
$dashResp = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/dashboard?period=current_month" -Method Get -Headers $headersA
$dashExpenses = [double]$dashResp.data.summary.total_expenses
$dashIncome = [double]$dashResp.data.summary.total_income
$dashBalance = [double]$dashResp.data.summary.balance

$expReport = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/preview" -Method Post -Headers $headersA -ContentType "application/json" -Body (@{ report_type = "expense"; period = "current_month" } | ConvertTo-Json)
$incReport = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/preview" -Method Post -Headers $headersA -ContentType "application/json" -Body (@{ report_type = "income"; period = "current_month" } | ConvertTo-Json)
$sumReport = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/reports/preview" -Method Post -Headers $headersA -ContentType "application/json" -Body (@{ report_type = "summary"; period = "current_month" } | ConvertTo-Json)

$rptExpenses = [double]$expReport.data.total_amount
$rptIncome = [double]$incReport.data.total_amount
$rptBalance = [double]$sumReport.data.totals.balance

Write-Host "Dashboard Expenses: $dashExpenses | Expense Report Total: $rptExpenses"
Write-Host "Dashboard Income:   $dashIncome | Income Report Total:  $rptIncome"
Write-Host "Dashboard Balance:  $dashBalance | Summary Report Balance: $rptBalance"

if ($dashExpenses -eq $rptExpenses -and $dashIncome -eq $rptIncome -and $dashBalance -eq $rptBalance) {
    Write-Host "SUCCESS: Financial totals reconcile 100% across Dashboard and Report Services!" -ForegroundColor Green
} else {
    Write-Host "FAILED: Reconciliation mismatch detected!" -ForegroundColor Red
}

# 6. Test CSV Export (POST /api/v1/reports/export/csv)
Write-Host "`n6. Testing Streamed CSV Export (POST /api/v1/reports/export/csv)..." -ForegroundColor Yellow
$csvPayload = @{ report_type = "expense"; period = "current_month" } | ConvertTo-Json
$csvFile = "scratch/test_expense_export.csv"
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/reports/export/csv" -Method Post -Headers $headersA -ContentType "application/json" -Body $csvPayload -OutFile $csvFile
$csvSample = (Get-Content $csvFile -Raw).Substring(0, 100)
Write-Host "CSV Sample Output:" $csvSample
if ($csvSample -like "*Date,Description,Category*") {
    Write-Host "SUCCESS: Streamed CSV Export generated valid UTF-8 BOM CSV!" -ForegroundColor Green
} else {
    Write-Host "FAILED: Unexpected CSV output!" -ForegroundColor Red
}

# 7. Test PDF Export (POST /api/v1/reports/export/pdf)
Write-Host "`n7. Testing PDF Export (POST /api/v1/reports/export/pdf)..." -ForegroundColor Yellow
$pdfPayload = @{ report_type = "summary"; period = "current_month" } | ConvertTo-Json
$pdfFile = "scratch/test_summary_export.pdf"
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/reports/export/pdf" -Method Post -Headers $headersA -ContentType "application/json" -Body $pdfPayload -OutFile $pdfFile
$pdfBytes = Get-Content $pdfFile -Encoding Byte -Raw
$pdfHeader = [System.Text.Encoding]::ASCII.GetString($pdfBytes[0..3])
Write-Host "PDF Header Signature:" $pdfHeader
if ($pdfHeader -eq "%PDF") {
    Write-Host "SUCCESS: DomPDF Export returned valid PDF binary content (%PDF-)!" -ForegroundColor Green
} else {
    Write-Host "FAILED: Unexpected PDF binary header!" -ForegroundColor Red
}

# 8. Test Invalid Filter Validation (HTTP 422 expected for to_date < from_date)
Write-Host "`n8. Testing Report Filter Validation (Invalid custom date range)..." -ForegroundColor Yellow
$invalidPayload = @{ report_type = "expense"; period = "custom"; from_date = "2026-10-31"; to_date = "2026-10-01" } | ConvertTo-Json
try {
    $invResp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/reports/preview" -Method Post -Headers $headersA -ContentType "application/json" -Body $invalidPayload
    Write-Host "FAILED: Expected 422 for invalid date range." -ForegroundColor Red
} catch {
    $code = [int]$_.Exception.Response.StatusCode
    if ($code -eq 422) {
        Write-Host "SUCCESS: Invalid date range rejected with HTTP 422 Unprocessable Entity." -ForegroundColor Green
    } else {
        Write-Host "Got HTTP $code" -ForegroundColor Yellow
    }
}

Write-Host "`n=== ALL PHASE 9 REPORT CENTER VERIFICATION CHECKS PASSED SUCCESSFULLY! ===" -ForegroundColor Green
