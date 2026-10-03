$loginBody = @{ email = "user@example.com"; password = "UserPassword123!" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.data.token
$headers = @{ "Authorization" = "Bearer $token"; "Accept" = "application/json"; "Content-Type" = "application/json" }

try {
    $res = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/ai/chat" -Method Post -Headers $headers -Body '{"message":"Summarize my finances"}'
    Write-Host "Success:" ($res | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Exception Message:" $_.Exception.Message
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $respBody = $reader.ReadToEnd()
    Write-Host "Response Body:" $respBody
}
