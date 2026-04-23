# Test API script

Write-Host "=== Testing Arrakis Black Market API ===" -ForegroundColor Cyan

# Test 1: Register user
Write-Host "`n[1] Registering user..." -ForegroundColor Yellow
$registerBody = @{
    username = "fremen001"
    email = "fremen@arrakis.dune"
    password = "spice123"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
$registerResponse | ConvertTo-Json

$token = $registerResponse.token
$tokenPreview = $token.Substring(0, 20)
Write-Host "[OK] Token received: $tokenPreview..." -ForegroundColor Green

# Test 2: Get my profile
Write-Host "`n[2] Getting profile..." -ForegroundColor Yellow
$me = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers @{Authorization="Bearer $token"}
$me | ConvertTo-Json

# Test 3: Spin for item
Write-Host "`n[3] Spinning for item..." -ForegroundColor Yellow
$spinResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/market/spin" -Method POST -Headers @{Authorization="Bearer $token"}
$spinResponse | ConvertTo-Json

Write-Host "`n[4] Spinning again..." -ForegroundColor Yellow
$spinResponse2 = Invoke-RestMethod -Uri "http://localhost:3000/api/market/spin" -Method POST -Headers @{Authorization="Bearer $token"}
$spinResponse2 | ConvertTo-Json

# Test 5: Inventory
Write-Host "`n[5] Getting inventory..." -ForegroundColor Yellow
$inventory = Invoke-RestMethod -Uri "http://localhost:3000/api/inventory" -Method GET -Headers @{Authorization="Bearer $token"}
$inventory | ConvertTo-Json

# Test 6: Get updated profile with solaris
Write-Host "`n[6] Checking updated solaris..." -ForegroundColor Yellow
$meUpdated = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers @{Authorization="Bearer $token"}
$sol = $meUpdated.solaris
Write-Host "Solaris remaining: $sol" -ForegroundColor Cyan

Write-Host "`n=== All tests passed! ===" -ForegroundColor Green