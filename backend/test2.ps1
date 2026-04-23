# Test registro
$body = @{
    username = "testuser3"
    email = "test3@test.com"
    password = "test123"
} | ConvertTo-Json

Write-Host "Registering..." -ForegroundColor Yellow
try {
    $reg = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    $reg | ConvertTo-Json
    Write-Host "Token: $($reg.token.Substring(0, 30))..." -ForegroundColor Green
    Write-Host "User ID: $($reg.user.id)" -ForegroundColor Cyan
    Write-Host "Solaris: $($reg.user.solaris)" -ForegroundColor Cyan
    
    $token = $reg.token
    
    # Test profile
    Write-Host "`nTesting profile..." -ForegroundColor Yellow
    $me = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers @{Authorization="Bearer $token"}
    $me | ConvertTo-Json
    
    # Test spin
    Write-Host "`nSpinning..." -ForegroundColor Yellow
    $spin = Invoke-RestMethod -Uri "http://localhost:3000/api/market/spin" -Method POST -Headers @{Authorization="Bearer $token"}
    $spin | ConvertTo-Json
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    $_.Exception.Response
}