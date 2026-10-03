$loginBody = @{ email = "user@example.com"; password = "UserPassword123!" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.data.token
$headers = @{ "Authorization" = "Bearer $token"; "Accept" = "application/json"; "Content-Type" = "application/json" }

Write-Host "1. Testing CSV export to file..."
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/reports/export/csv" -Method Post -Headers $headers -Body '{"report_type":"expense","period":"current_month"}' -OutFile "scratch/test.csv"
$csvText = Get-Content "scratch/test.csv" -Raw
Write-Host "CSV File Content Sample:"
Write-Host $csvText.Substring(0, [Math]::Min(200, $csvText.Length))

Write-Host "`n2. Testing PDF export to file..."
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/reports/export/pdf" -Method Post -Headers $headers -Body '{"report_type":"summary","period":"current_month"}' -OutFile "scratch/test.pdf"
$pdfBytes = Get-Content "scratch/test.pdf" -Encoding Byte -Raw
$pdfSig = [System.Text.Encoding]::ASCII.GetString($pdfBytes[0..7])
Write-Host "PDF File Signature:" $pdfSig "File Size:" (Get-Item "scratch/test.pdf").Length "bytes"
