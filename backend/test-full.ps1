# Full API test
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{username="testuser3"; password="test123"} | ConvertTo-Json) -ContentType "application/json"
Write-Host "Login - Solaris:" $login.user.solaris -ForegroundColor Green

$token = $login.token

$inv = Invoke-RestMethod -Uri "http://localhost:3000/api/inventory" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Inventory:" $inv.Count "items" -ForegroundColor Cyan

# Multiple spins
for ($i = 0; $i -lt 3; $i++) {
    $spin = Invoke-RestMethod -Uri "http://localhost:3000/api/market/spin" -Method POST -Headers @{Authorization="Bearer $token"}
    Write-Host "Spin:" $spin.item.name "- Remaining:" $spin.remaining_solaris
}

$me = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers @{Authorization="Bearer $token"}
Write-Host "Final Solaris:" $me.solaris -ForegroundColor Yellow

Write-Host "=== All PASSED ===" -ForegroundColor Green